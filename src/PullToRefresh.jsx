import React, { useState, useEffect, useRef } from "react";

/**
 * Universal Native-Style Pull-To-Refresh (No Text Messages, Clean Circular Spinner)
 * Provides standard mobile swipe-down refresh without interfering with normal scrolling.
 */
export default function PullToRefresh({ onRefresh, children, className = "", disabled = false }) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef(null);

  const THRESHOLD = 55;
  const MAX_PULL = 85;

  useEffect(() => {
    if (disabled) return;

    const getScrollTop = () => {
      if (containerRef.current) {
        if (containerRef.current.scrollTop > 0) return containerRef.current.scrollTop;
        let parent = containerRef.current.parentElement;
        while (parent && parent !== document.body && parent !== document.documentElement) {
          if (parent.scrollTop > 0) return parent.scrollTop;
          parent = parent.parentElement;
        }
      }
      return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    };

    const handleTouchStart = (e) => {
      if (isRefreshing || disabled) return;

      const target = e.target;
      if (target && target.tagName && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        isPullingRef.current = false;
        return;
      }

      const scrollTop = getScrollTop();
      if (scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || isRefreshing || disabled) return;
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startYRef.current;
      const diffX = currentX - startXRef.current;

      // If user is swiping horizontally or not moving vertically downward
      if (Math.abs(diffX) > Math.abs(diffY) || diffY <= 0) {
        setPullY(0);
        isPullingRef.current = false;
        return;
      }

      const scrollTop = getScrollTop();
      if (scrollTop <= 0 && diffY > 0) {
        const dampened = Math.min(MAX_PULL, Math.pow(diffY, 0.82) * 1.3);
        setPullY(dampened);
      } else {
        setPullY(0);
        isPullingRef.current = false;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || isRefreshing || disabled) return;
      isPullingRef.current = false;

      if (pullY >= THRESHOLD) {
        setIsRefreshing(true);
        setPullY(45);
        try {
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        } catch (e) {}

        try {
          if (typeof onRefresh === "function") {
            await onRefresh();
          }
        } catch (err) {
          console.warn("Pull-to-refresh execution:", err);
        } finally {
          setRefreshDone(true);
          setTimeout(() => {
            setIsRefreshing(false);
            setRefreshDone(false);
            setPullY(0);
          }, 400);
        }
      } else {
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
  }, [isRefreshing, pullY, onRefresh, disabled]);

  const progress = Math.min(1, pullY / THRESHOLD);

  return (
    <div ref={containerRef} className={`pull-to-refresh-wrapper ${className}`} style={{ position: "relative", width: "100%" }}>
      {/* Native-Style Minimal Circular Spinner Indicator (Zero Text Messages) */}
      {(pullY > 0 || isRefreshing) && (
        <div
          style={{
            position: "fixed",
            top: `${Math.max(14, Math.min(pullY - 10, 52))}px`,
            left: "50%",
            transform: `translateX(-50%) scale(${Math.min(1, 0.5 + progress * 0.5)})`,
            zIndex: 999999,
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2), 0 1px 4px rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            transition: isPullingRef.current ? "none" : "top 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.22s ease, opacity 0.2s ease",
            opacity: Math.max(0.4, progress)
          }}
        >
          {isRefreshing ? (
            refreshDone ? (
              <span style={{ color: "#10b981", fontSize: "17px", fontWeight: "bold" }}>✓</span>
            ) : (
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  border: "2.5px solid #e2e8f0",
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
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: `rotate(${progress * 270}deg)`,
                transition: "transform 0.1s ease"
              }}
            >
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          )}
        </div>
      )}

      <style>{`
        @keyframes ptr-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {children}
    </div>
  );
}
