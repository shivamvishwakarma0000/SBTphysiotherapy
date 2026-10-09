import React, { useState, useEffect, useRef } from "react";

/**
 * Ultra-Safe Native-Style Long-Pull-To-Refresh
 * - Completely prevents accidental triggers during regular page reading / scrolling.
 * - Requires a VERY LONG, intentional downward drag (180px+ finger travel).
 * - Ignores initial 60px swipe (deadzone).
 * - Only initiates if strictly at the very top (scrollY === 0).
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
  const containerRef = useRef(null);

  // Intentional Very-Long-Pull Constants (Prevents all accidental triggers)
  const DEADZONE = 60;        // Initial 60px downward movement is completely ignored
  const PULL_THRESHOLD = 180; // Must pull down at least 180px physically to activate refresh
  const MAX_VISUAL_PULL = 72; // Maximum visual travel for the floating spinner

  useEffect(() => {
    if (disabled) return;

    const isAtTop = () => {
      const winScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      return winScroll <= 1;
    };

    const handleTouchStart = (e) => {
      if (isRefreshing || disabled) return;
      if (!e.touches || e.touches.length !== 1) return;

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

      if (isAtTop()) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isPullingRef.current = true;
        isReadyRef.current = false;
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

      // Cancel if horizontal swipe or scrolling upwards
      if (Math.abs(diffX) * 1.15 > diffY || diffY <= 0) {
        setPullY(0);
        setIsReady(false);
        isReadyRef.current = false;
        return;
      }

      if (!isAtTop()) {
        setPullY(0);
        setIsReady(false);
        isReadyRef.current = false;
        isPullingRef.current = false;
        return;
      }

      // Small down scrolls within the 60px deadzone do NOT trigger or show spinner
      if (diffY <= DEADZONE) {
        setPullY(0);
        setIsReady(false);
        isReadyRef.current = false;
        return;
      }

      // Calculate smooth spring-dampened resistance for deliberate long pull
      const activeDistance = diffY - DEADZONE;
      const dampened = Math.min(MAX_VISUAL_PULL, Math.pow(activeDistance, 0.7) * 1.35);
      setPullY(dampened);

      // Only mark ready when physical drag is >= 180px
      const ready = diffY >= PULL_THRESHOLD;
      setIsReady(ready);
      isReadyRef.current = ready;
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || isRefreshing || disabled) return;
      isPullingRef.current = false;

      const shouldRefresh = isReadyRef.current;
      setIsReady(false);
      isReadyRef.current = false;

      if (shouldRefresh) {
        setIsRefreshing(true);
        setPullY(46);

        try {
          if (navigator.vibrate) {
            navigator.vibrate(12);
          }
        } catch (_) {}

        try {
          if (typeof onRefresh === "function") {
            await onRefresh();
          }
        } catch (err) {
          console.warn("Pull refresh:", err);
        } finally {
          setRefreshDone(true);
          setTimeout(() => {
            setIsRefreshing(false);
            setRefreshDone(false);
            setPullY(0);
          }, 450);
        }
      } else {
        // Did not pull far enough: snap back cleanly without refreshing
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

  const progress = Math.min(1, Math.max(0, pullY / 46));

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh-wrapper ${className}`}
      style={{ position: "relative", width: "100%" }}
    >
      {/* Floating Refresh Indicator Pill */}
      {(pullY > 0 || isRefreshing) && (
        <div
          className="ptr-indicator-pill"
          style={{
            position: "fixed",
            top: `${Math.max(12, Math.min(pullY - 6, 52))}px`,
            left: "50%",
            transform: `translateX(-50%) scale(${Math.min(1.05, 0.75 + progress * 0.3)})`,
            zIndex: 999999,
            width: isReady ? "42px" : "38px",
            height: isReady ? "42px" : "38px",
            borderRadius: "50%",
            background: "var(--ptr-bg, #ffffff)",
            border: isReady ? "2px solid #10b981" : "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: isReady
              ? "0 8px 24px rgba(16, 185, 129, 0.35), 0 2px 8px rgba(0, 0, 0, 0.12)"
              : "0 6px 20px rgba(0, 0, 0, 0.16), 0 1px 4px rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            transition: isPullingRef.current
              ? "width 0.15s ease, height 0.15s ease, border 0.15s ease"
              : "top 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.22s ease, opacity 0.2s ease",
            opacity: Math.max(0.45, progress)
          }}
        >
          {isRefreshing ? (
            refreshDone ? (
              <span style={{ color: "#10b981", fontSize: "18px", fontWeight: "bold" }}>✓</span>
            ) : (
              <div
                className="ptr-spinner-ring"
                style={{
                  width: "18px",
                  height: "18px",
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
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isReady ? "rotate(180deg)" : `rotate(${progress * 220}deg)`,
                transition: "transform 0.15s ease, stroke 0.15s ease"
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
