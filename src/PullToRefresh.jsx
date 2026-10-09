import React, { useState, useEffect, useRef } from "react";

/**
 * Universal Pull-To-Refresh Component for Android App & Web
 * Allows mobile touch swipe-down from top to instantly pull fresh live data from Google Sheets.
 */
export default function PullToRefresh({ onRefresh, children, className = "" }) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef(null);

  const THRESHOLD = 65;
  const MAX_PULL = 110;

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (isRefreshing) return;
      // Only start pull if scrolled at the very top of page or container
      const scrollTop = window.scrollY || document.documentElement.scrollTop || (containerRef.current ? containerRef.current.scrollTop : 0);
      if (scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || (containerRef.current ? containerRef.current.scrollTop : 0);

      if (scrollTop <= 0 && diff > 0) {
        // Apply natural resistance curve
        const dampened = Math.min(MAX_PULL, Math.pow(diff, 0.85) * 1.5);
        setPullY(dampened);
        if (dampened > 10 && e.cancelable) {
          // prevent native overscroll bounce interference
          // e.preventDefault();
        }
      } else {
        setPullY(0);
        isPullingRef.current = false;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || isRefreshing) return;
      isPullingRef.current = false;

      if (pullY >= THRESHOLD) {
        setIsRefreshing(true);
        setPullY(55);
        try {
          if (navigator.vibrate) {
            navigator.vibrate(15);
          }
        } catch (e) {}

        try {
          if (typeof onRefresh === "function") {
            await onRefresh();
          }
        } catch (err) {
          console.warn("Pull-to-refresh execution notice:", err);
        } finally {
          setRefreshDone(true);
          setTimeout(() => {
            setIsRefreshing(false);
            setRefreshDone(false);
            setPullY(0);
          }, 600);
        }
      } else {
        setPullY(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isRefreshing, pullY, onRefresh]);

  const progress = Math.min(1, pullY / THRESHOLD);

  return (
    <div ref={containerRef} className={`pull-to-refresh-wrapper ${className}`} style={{ position: "relative" }}>
      {/* Visual Pull Indicator Banner */}
      {(pullY > 0 || isRefreshing) && (
        <div
          style={{
            position: "fixed",
            top: `${Math.max(12, Math.min(pullY - 15, 65))}px`,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "rgba(15, 23, 42, 0.94)",
            color: "#fff",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.3)",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: "600",
            pointerEvents: "none",
            transition: isPullingRef.current ? "none" : "top 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease",
            opacity: Math.max(0.7, progress)
          }}
        >
          {isRefreshing ? (
            refreshDone ? (
              <>
                <span style={{ color: "#10b981", fontSize: "15px" }}>✓</span>
                <span style={{ color: "#e2e8f0" }}>Updated just now</span>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTopColor: "#10b981",
                    borderRadius: "50%",
                    animation: "ptr-spin 0.7s linear infinite"
                  }}
                />
                <span style={{ color: "#e2e8f0" }}>Syncing live database...</span>
              </>
            )
          ) : (
            <>
              <span
                style={{
                  display: "inline-block",
                  transform: `rotate(${progress >= 1 ? 180 : progress * 180}deg)`,
                  transition: "transform 0.15s ease",
                  color: progress >= 1 ? "#10b981" : "#94a3b8",
                  fontSize: "14px"
                }}
              >
                ↓
              </span>
              <span style={{ color: progress >= 1 ? "#10b981" : "#cbd5e1" }}>
                {progress >= 1 ? "Release to sync live data" : "Pull down to refresh"}
              </span>
            </>
          )}
        </div>
      )}

      {/* Embedded Animation Keyframe */}
      <style>{`
        @keyframes ptr-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {children}
    </div>
  );
}
