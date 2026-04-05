import type { PanelStats, ThemeMode } from "../types";

interface TopbarProps {
  connected: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
  stats: PanelStats;
  showDiagnostics?: boolean;
}

export const Topbar = ({
  connected,
  theme,
  onToggleTheme,
  stats,
  showDiagnostics = true,
}: TopbarProps) => {
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="logo">
          <div className="logo-icon">🔍</div>
          hookslens
          <span className="logo-ver">v0.3</span>
        </div>

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
      </div>

      <div className="topbar-right">
        {showDiagnostics && stats.mismatchCount > 0 && (
          <span className="pill orange">⊛ {stats.mismatchCount} mismatch</span>
        )}
        {showDiagnostics && stats.duplicateCount > 0 && (
          <span className="pill orange">
            ⧉ {stats.duplicateCount} duplicate
          </span>
        )}
        {showDiagnostics && stats.stalledCount > 0 && (
          <span className="pill red">{stats.stalledCount} stalled</span>
        )}
        {showDiagnostics && stats.badRequestCount > 0 && (
          <span className="pill red">4xx hooks {stats.badRequestCount}</span>
        )}
      </div>
    </div>
  );
};
