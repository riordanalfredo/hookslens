import type { PanelStats, ThemeMode } from "../types";

interface TopbarProps {
  connected: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
  stats: PanelStats;
}

export function Topbar({
  connected,
  theme,
  onToggleTheme,
  stats,
}: TopbarProps) {
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="logo">
          <div className="logo-icon">H</div>
          hookslens
        </div>
        <span className="logo-path">/__hookslens</span>
      </div>

      <div className="topbar-right">
        <button className="theme-btn" onClick={onToggleTheme}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <span className={`pill ${connected ? "green" : ""}`}>
          <span
            className={`dot ${connected ? "pulse" : ""}`}
            style={{ background: connected ? "var(--green)" : "var(--text3)" }}
          />
          {connected ? "connected" : "reconnecting"}
        </span>

        {stats.mismatchCount > 0 && (
          <span className="pill orange">mismatch {stats.mismatchCount}</span>
        )}
        {stats.duplicateCount > 0 && (
          <span className="pill orange">duplicate {stats.duplicateCount}</span>
        )}
        {stats.stalledCount > 0 && (
          <span className="pill red">stalled {stats.stalledCount}</span>
        )}
        {stats.badRequestCount > 0 && (
          <span className="pill red">4xx hooks {stats.badRequestCount}</span>
        )}
      </div>
    </div>
  );
}
