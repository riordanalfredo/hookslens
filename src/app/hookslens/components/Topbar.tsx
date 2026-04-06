import type { ThemeMode } from "../types";

interface TopbarProps {
  connected: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Topbar = ({ connected, theme, onToggleTheme }: TopbarProps) => {
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="logo">
          <div className="logo-icon">🔍</div>
          hookslens
          <span className="logo-ver">v0.3</span>
        </div>

        <span className={`pill ${connected ? "green" : ""}`}>
          <span
            className={`dot ${connected ? "pulse" : ""}`}
            style={{ background: connected ? "var(--green)" : "var(--text3)" }}
          />
          {connected ? "connected" : "reconnecting"}
        </span>
      </div>

      <div className="topbar-right">
        <button className="theme-btn" onClick={onToggleTheme}>
          {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>

        <a
          href="https://github.com/riordanalfredo/hookslens"
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ textDecoration: "none" }}
        >
          ⭐ GitHub
        </a>
      </div>
    </div>
  );
};
