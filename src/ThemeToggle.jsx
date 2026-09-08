import React from "react";

function SunIcon() {
  return (
    <svg
      className="theme-icon sun-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="theme-icon moon-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export default function ThemeToggle({ themePreference, setTheme, compact = false }) {
  const isLight = themePreference === "light";
  const toggleTheme = () => setTheme(isLight ? "dark" : "light");

  return (
    <div className={`theme-toggle-container ${compact ? "compact" : ""}`}>
      {/* 1-click single icon toggle for mobile */}
      <button
        type="button"
        className="single-theme-icon-btn"
        onClick={toggleTheme}
        title={isLight ? "Switch to Dark Mode (🌙)" : "Switch to Light Mode (☀️)"}
        aria-label="Toggle display theme"
      >
        {isLight ? <MoonIcon /> : <SunIcon />}
      </button>

      {/* 2-button group for laptop / desktop */}
      <div
        className={`theme-toggle-group ${compact ? "compact" : ""}`}
        role="radiogroup"
        aria-label="Display theme selection"
      >
        <button
          type="button"
          role="radio"
          aria-checked={isLight}
          className={`theme-btn ${isLight ? "active" : ""}`}
          onClick={() => setTheme("light")}
          title="Light Mode"
          aria-label="Light mode"
        >
          <SunIcon />
          <span className="theme-btn-text">Light</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={!isLight}
          className={`theme-btn ${!isLight ? "active" : ""}`}
          onClick={() => setTheme("dark")}
          title="Dark Mode"
          aria-label="Dark mode"
        >
          <MoonIcon />
          <span className="theme-btn-text">Dark</span>
        </button>
      </div>
    </div>
  );
}
