import React, { useState, useEffect, useRef } from "react";

/**
 * Universal Native-Style Pull-To-Refresh
 * Designed to prevent accidental triggers during regular page scrolling.
 * Only triggers when the user is strictly at the top of the page and performs
 * an intentional, deliberate long downward pull (matching native mobile apps).
 */
export default function PullToRefresh({ onRefresh, children, className = "", disabled = false }) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef(null);

  // Require an intentional long downward pull before activating or triggering refresh
  const DEADZONE = 40; // Initial 40px of downward swipe is ignored (prevents small scroll triggers)
  const THRESHOLD = 65; // Visual threshold to trigger the refresh action
  const MAX_PULL = 85;  // Maximum visual travel for the indicator

  useEffect(() => {
    if (disabled) return;

    // Helper to check if page/container is strictly at top (scrollTop <= 1)
    const getScrollTop = () => {
      const winScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (winScroll > 1) return winScroll;

      if (containerRef.current) {
        if (containerRef.current.scrollTop > 1) return containerRef.current.scrollTop;
        let parent = containerRef.current.parentElement;
        while (parent && parent !== document.body && parent !== document.documentElement) {
          if (parent.scrollTop > 1) return parent.scrollTop;
          parent = parent.parentElement;
        }
      }
      return winScroll;
    };

    const handleTouchStart = (e) => {
      if (isRefreshing || disabled) return;
      if (!e.touches || e.touches.length !== 1) return; // Single-touch only

      const target = e.target;
      if (target && target.tagName && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        isPullingRef.current = false;
        return;
      }

      const scrollTop = getScrollTop();
      // Only initiate pull tracking if page is strictly at the top
      if (scrollTop <= 1) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isPullingRef.current = true;
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

      // If user is swiping horizontally or scrolling upwards, cancel pull
      if (Math.abs(diffX) * 1.2 > diffY || diffY <= 0) {
        setPullY(0);
        return;
      }

      // If page is no longer at top, immediately cancel pull
      const scrollTop = getScrollTop();
      if (scrollTop > 1) {
        setPullY(0);
        isPullingRef.current = false;
        return;
      }

      // Small down scrolls within the deadzone do NOT trigger or show spinner
      if (diffY <= DEADZONE) {
        setPullY(0);
        return;
      }

      // Calculate damped resistance for deliberate long pull
      const activeDistance = diffY - DEADZONE;
      const dampened = Math.min(MAX_PULL, Math.pow(activeDistance, 0.78) * 1.35);
      setPullY(dampened);
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || isRefreshing || disabled) return;
      isPullingRef.current = false;

      // Only refresh if user pulled all the way past the deliberate long-pull threshold
      if (pullY >= THRESHOLD) {
        setIsRefreshing(true);
        setPullY(48);
        try {
          if (navigator.vibrate) {
            navigator.vibrate(12);
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
          }, 450);
        }
      } else {
        // Small or incomplete pull: cleanly snap back to 0 without refreshing
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
      {/* Native-Style Minimal Circular Spinner Indicator */}
      {(pullY > 0 || isRefreshing) && (
        <div
          style={{
            position: "fixed",
            top: `${Math.max(12, Math.min(pullY - 8, 50))}px`,
            left: "50%",
            transform: `translateX(-50%) scale(${Math.min(1, 0.6 + progress * 0.4)})`,
            zIndex: 999999,
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.22), 0 1px 4px rgba(0, 0, 0, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            transition: isPullingRef.current ? "none" : "top 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.22s ease, opacity 0.2s ease",
            opacity: Math.max(0.35, progress)
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
                transition: "transform 0.08s ease"
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
