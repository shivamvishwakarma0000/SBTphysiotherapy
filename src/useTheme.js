import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "vindhya_physio_theme";

export function useTheme() {
  const [themePreference, setThemePreferenceState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "system";
    } catch {
      return "system";
    }
  });

  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "dark";
    } catch {
      return "dark";
    }
  });

  // Synchronize DOM and localStorage when preference or system changes
  useEffect(() => {
    const isSystem = themePreference === "system";
    const active = isSystem ? getSystemTheme() : themePreference;
    setResolvedTheme(active);

    const root = document.documentElement;
    root.setAttribute("data-theme", active);
    root.classList.remove("light", "dark");
    root.classList.add(active);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", active === "dark" ? "#04101a" : "#f8fafc");
    }

    try {
      if (themePreference === "system") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, themePreference);
      }
    } catch (e) {
      console.warn("Unable to save theme to localStorage", e);
    }
  }, [themePreference, getSystemTheme]);

  // Listen to system preference changes when in "system" mode
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      if (themePreference === "system") {
        const nextTheme = e.matches ? "dark" : "light";
        setResolvedTheme(nextTheme);
        document.documentElement.setAttribute("data-theme", nextTheme);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(nextTheme);

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute("content", nextTheme === "dark" ? "#04101a" : "#f8fafc");
        }
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [themePreference]);

  const setTheme = useCallback((newTheme) => {
    setThemePreferenceState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreferenceState((prev) => {
      if (prev === "system") {
        // If system, toggle away from current resolved
        return resolvedTheme === "dark" ? "light" : "dark";
      }
      return prev === "dark" ? "light" : "dark";
    });
  }, [resolvedTheme]);

  return {
    themePreference,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === "dark"
  };
}
