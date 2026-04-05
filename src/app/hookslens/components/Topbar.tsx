import type { PanelStats, ThemeMode } from "../types";
import type { ChangeEvent } from "react";

interface TopbarProps {
  connected: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  paused: boolean;
  onTogglePause: () => void;
  onClearLog: () => void;
  routeFilter: string;
  onRouteFilterChange: (route: string) => void;
}

export const Topbar = ({
  connected,
  theme,
  onToggleTheme,
  search,
  onSearchChange,
  paused,
  onTogglePause,
  onClearLog,
  routeFilter,
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
        <div className="toolbar">
          <div className="toolbar-row">
            {routeFilter !== "current" && (
              <input
                className="search-input"
                placeholder="filter by hook or key…"
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onSearchChange(e.target.value)
                }
              />
            )}
            <button className="btn" onClick={onTogglePause}>
              {paused ? "resume" : "pause"}
            </button>
            <button className="btn" onClick={onClearLog}>
              clear log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
