import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "vindhya_physio_theme";

export function useTheme() {
  const [themePreference, setThemePreferenceState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
      return "light"; // Clean medical white + blue + green clinic aesthetic by default
    } catch {
      return "light";
    }
  });

  const resolvedTheme = themePreference === "dark" ? "dark" : "light";

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", resolvedTheme === "dark" ? "#0B1F2A" : "#0878C9");
    }

    try {
      localStorage.setItem(STORAGE_KEY, resolvedTheme);
    } catch (e) {
      console.warn("Unable to save theme to localStorage", e);
    }
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme) => {
    const safeTheme = newTheme === "light" ? "light" : "dark";
    setThemePreferenceState(safeTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreferenceState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return {
    themePreference: resolvedTheme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === "dark"
  };
}
