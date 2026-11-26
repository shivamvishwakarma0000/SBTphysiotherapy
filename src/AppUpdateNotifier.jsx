import React, { useEffect, useState, useRef } from "react";

// Injected at build time by Vite from vite.config.js
// If running in unbuilt dev mode, fallback to current time
const CLIENT_BUILD_TIME = typeof __APP_BUILD_TIME__ !== "undefined" ? Number(__APP_BUILD_TIME__) : 0;

export default function AppUpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("app_update_dismissed_session") === "true";
    } catch (e) {
      return false;
    }
  });

  const swRegistrationRef = useRef(null);

  // Check for updates via /version.json
  const checkForVersionUpdate = async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.buildTime) {
        const remoteBuildTime = Number(data.buildTime);
        // If server build time is newer than this client's build time
        if (CLIENT_BUILD_TIME > 0 && remoteBuildTime > CLIENT_BUILD_TIME) {
          setUpdateAvailable(true);
        }
      }
    } catch (e) {
      // Offline or network error; silent fail
    }
  };

  useEffect(() => {
    // 1. Initial version check
    checkForVersionUpdate();

    // 2. Periodic poll every 45 seconds for background commit/deploy detection
    const interval = setInterval(checkForVersionUpdate, 45000);

    // 3. Check when user returns to tab / brings PWA from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForVersionUpdate();
        if (swRegistrationRef.current) {
          swRegistrationRef.current.update().catch(() => {});
        }
      }
    };

    const handleFocus = () => {
      checkForVersionUpdate();
      if (swRegistrationRef.current) {
        swRegistrationRef.current.update().catch(() => {});
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 4. Service Worker lifecycle detection
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        swRegistrationRef.current = reg;

        // Check if there's already a worker waiting to activate
        if (reg.waiting) {
          setUpdateAvailable(true);
        }

        // Listen for new worker installing
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });

        // Trigger SW update check
        reg.update().catch(() => {});
      }).catch(() => {});

      // If controller changes, another tab might have triggered skipWaiting
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setUpdateAvailable(true);
      });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      // 1. Tell all waiting service workers to skip waiting and activate
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          await reg.update().catch(() => {});
        }
      }

      // 2. Purge caches to pull fresh JS/CSS/assets
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // 3. Clear session dismiss flag
      try {
        sessionStorage.removeItem("app_update_dismissed_session");
      } catch (e) {}
    } catch (e) {
      console.warn("Update cache clear notice:", e);
    }

    // 4. Immediate fresh reload preserving current view/hash
    setTimeout(() => {
      window.location.reload(true);
    }, 300);
  };

  const handleLater = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("app_update_dismissed_session", "true");
    } catch (e) {}
  };

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <aside
      className="app-update-top-banner"
      aria-live="polite"
      role="region"
      aria-label="App update available"
      style={{
        position: "fixed",
        top: "14px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        maxWidth: "480px",
        zIndex: 99999999,
        background: "linear-gradient(135deg, #091e3a 0%, #0d2e59 100%)",
        color: "#ffffff",
        borderRadius: "14px",
        border: "1.5px solid #38bdf8",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45), 0 0 16px rgba(56, 189, 248, 0.35)",
        padding: "12px 14px",
        boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        animation: "slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        {/* Pulsing Flash Icon */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "rgba(56, 189, 248, 0.15)",
            border: "1.5px solid #38bdf8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0
          }}
        >
          ⚡
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
            <strong style={{ fontSize: "14px", color: "#ffffff", fontWeight: "800", letterSpacing: "0.2px" }}>
              New App Update Available!
            </strong>
            <span
              style={{
                background: "#10b981",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: "800",
                padding: "1px 6px",
                borderRadius: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              New
            </span>
          </div>
          <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4 }}>
            A new version with latest clinic updates &amp; record features is ready to install.
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleUpdateNow}
              disabled={isUpdating}
              style={{
                flex: 1,
                minHeight: "36px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: "800",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.35)",
                padding: "6px 12px"
              }}
            >
              {isUpdating ? "🔄 Updating..." : "🔄 Update Now"}
            </button>

            <button
              type="button"
              onClick={handleLater}
              style={{
                minHeight: "36px",
                background: "rgba(255, 255, 255, 0.12)",
                color: "#e2e8f0",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                padding: "6px 12px"
              }}
              title="Postpone update for this session"
            >
              Later ✕
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
