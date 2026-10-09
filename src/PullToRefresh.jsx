import React, { useState, useEffect, useRef } from "react";

/**
 * Universal Long-Pull-To-Refresh Component
 * Designed specifically to prevent accidental triggers during normal scrolling.
 * Requires an intentional, deliberate LONG downward drag (160px+ finger travel)
 * when strictly at the very top of the page before activating refresh.
 */
export default function PullToRefresh({ onRefresh, children, className = "", disabled = false }) {
  const [pullY, setPullY] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const isReadyRef = useRef(false);
  const hasVibratedRef = useRef(false);
  const containerRef = useRef(null);

  // Intentional Long-Pull Constants (prevents small scroll triggers)
  const DEADZONE = 55;            // Initial 55px of drag is completely ignored
  const MIN_PULL_DISTANCE = 160;  // Must pull finger down at least 160px physically
  const MAX_VISUAL_PULL = 82;     // Maximum visual travel for the indicator
  const READY_THRESHOLD = 64;     // Visual threshold where "Release to refresh" activates

  useEffect(() => {
    if (disabled) return;

    // Helper to verify if the page and all touch parent containers are strictly at top (scrollTop <= 1)
    const isStrictlyAtTop = (target) => {
      const winScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (winScroll > 1) return false;

      let el = target;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.scrollTop > 1) return false;
        el = el.parentElement;
      }
      return true;
    };

    const handleTouchStart = (e) => {
      if (isRefreshing || disabled) return;
      if (!e.touches || e.touches.length !== 1) return; // Single-touch only

      const target = e.target;
      if (
        target &&
        target.tagName &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        isPullingRef.current = false;
        return;
      }

      if (isStrictlyAtTop(target)) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isPullingRef.current = true;
        isReadyRef.current = false;
        hasVibratedRef.current = false;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || isRefreshing || disabled) return;
      if (!e.touches || e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startYRef.current;
      const diffX = currentX - startXRef.current;

      // Cancel pull if swiping horizontally or scrolling up
      if (Math.abs(diffX) * 1.15 > diffY || diffY <= 0) {
        setPullY(0);
        setIsReady(false);
        isReadyRef.current = false;
        return;
      }

      // If page or container is no longer at the top, immediately cancel
      if (!isStrictlyAtTop(e.target)) {
        setPullY(0);
        setIsReady(false);
        isReadyRef.current = false;
        isPullingRef.current = false;
        return;
      }

      // Small down scrolls within the deadzone do NOT trigger or move indicator
      if (diffY <= DEADZONE) {
        setPullY(0);
        setIsReady(false);
        isReadyRef.current = false;
        return;
      }

      // Calculate damped resistance for deliberate long downward pull
      const activeDistance = diffY - DEADZONE;
      const dampened = Math.min(MAX_VISUAL_PULL, Math.pow(activeDistance, 0.72) * 1.5);
      setPullY(dampened);

      // Ready requires both visual threshold AND physical long drag distance (160px+)
      const ready = diffY >= MIN_PULL_DISTANCE && dampened >= READY_THRESHOLD;
      setIsReady(ready);
      isReadyRef.current = ready;

      if (ready && !hasVibratedRef.current) {
        hasVibratedRef.current = true;
        try {
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        } catch (_) {}
      } else if (!ready) {
        hasVibratedRef.current = false;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || isRefreshing || disabled) return;
      isPullingRef.current = false;

      const shouldRefresh = isReadyRef.current;
      setIsReady(false);
      isReadyRef.current = false;

      if (shouldRefresh) {
        setIsRefreshing(true);
        setPullY(50);

        try {
          if (navigator.vibrate) {
            navigator.vibrate(14);
          }
        } catch (_) {}

        try {
          if (typeof onRefresh === "function") {
            await onRefresh();
          }
        } catch (err) {
          console.warn("Pull-to-refresh execution error:", err);
        } finally {
          setRefreshDone(true);
          setTimeout(() => {
            setIsRefreshing(false);
            setRefreshDone(false);
            setPullY(0);
          }, 450);
        }
      } else {
        // Did not pull far enough: smoothly snap back without refreshing
        setPullY(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isRefreshing, onRefresh, disabled]);

  const progress = Math.min(1, Math.max(0, pullY / READY_THRESHOLD));

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh-wrapper ${className}`}
      style={{ position: "relative", width: "100%" }}
    >
      {/* Intentional Long-Pull Circular Floating Spinner */}
      {(pullY > 0 || isRefreshing) && (
        <div
          className="ptr-indicator-pill"
          style={{
            position: "fixed",
            top: `${Math.max(12, Math.min(pullY - 10, 52))}px`,
            left: "50%",
            transform: `translateX(-50%) scale(${Math.min(1.05, 0.7 + progress * 0.35)})`,
            zIndex: 999999,
            width: isReady ? "44px" : "40px",
            height: isReady ? "44px" : "40px",
            borderRadius: "50%",
            background: "var(--ptr-bg, #ffffff)",
            border: isReady ? "2px solid #10b981" : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: isReady
              ? "0 8px 24px rgba(16, 185, 129, 0.35), 0 2px 8px rgba(0, 0, 0, 0.12)"
              : "0 6px 20px rgba(0, 0, 0, 0.16), 0 1px 4px rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            transition: isPullingRef.current
              ? "width 0.15s ease, height 0.15s ease, border 0.15s ease"
              : "top 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.25s ease, opacity 0.2s ease, width 0.2s ease, height 0.2s ease",
            opacity: Math.max(0.4, progress)
          }}
        >
          {isRefreshing ? (
            refreshDone ? (
              <span style={{ color: "#10b981", fontSize: "19px", fontWeight: "bold" }}>✓</span>
            ) : (
              <div
                className="ptr-spinner-ring"
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2.5px solid rgba(2, 132, 199, 0.2)",
                  borderTopColor: "#0284c7",
                  borderRadius: "50%",
                  animation: "ptr-spin 0.65s linear infinite"
                }}
              />
            )
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isReady ? "#10b981" : "#0284c7"}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isReady ? "rotate(180deg)" : `rotate(${progress * 220}deg)`,
                transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.15s ease"
              }}
            >
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          )}
        </div>
      )}

      <style>{`
        :root {
          --ptr-bg: #ffffff;
        }
        [data-theme="dark"] .ptr-indicator-pill,
        .dark .ptr-indicator-pill {
          --ptr-bg: #1e293b !important;
          border-color: rgba(255, 255, 255, 0.14) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
        }
        @keyframes ptr-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {children}
    </div>
  );
}
