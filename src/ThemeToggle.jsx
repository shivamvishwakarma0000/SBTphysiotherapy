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

function SystemIcon() {
  return (
    <svg
      className="theme-icon system-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

export default function ThemeToggle({ themePreference, setTheme, compact = false }) {
  return (
    <div
      className={`theme-toggle-group ${compact ? "compact" : ""}`}
      role="radiogroup"
      aria-label="Display theme selection"
    >
      <button
        type="button"
        role="radio"
        aria-checked={themePreference === "light"}
        className={`theme-btn ${themePreference === "light" ? "active" : ""}`}
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
        aria-checked={themePreference === "dark"}
        className={`theme-btn ${themePreference === "dark" ? "active" : ""}`}
        onClick={() => setTheme("dark")}
        title="Dark Mode"
        aria-label="Dark mode"
      >
        <MoonIcon />
        <span className="theme-btn-text">Dark</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={themePreference === "system"}
        className={`theme-btn ${themePreference === "system" ? "active" : ""}`}
        onClick={() => setTheme("system")}
        title="Follow System OS Preference"
        aria-label="System mode"
      >
        <SystemIcon />
        <span className="theme-btn-text">Auto</span>
      </button>
    </div>
  );
}
