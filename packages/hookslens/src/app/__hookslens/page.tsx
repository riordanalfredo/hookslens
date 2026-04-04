"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { HooksTable } from "./components/HooksTable";
import { Sidebar } from "./components/Sidebar";
import { TimelinePanel } from "./components/TimelinePanel";
import { Topbar } from "./components/Topbar";
import { formatTime, getPanelStats } from "./lib/format";
import { useInsightSnapshot, useThemeMode } from "./hooks/useInsightSnapshot";
import type { StoreSnapshot } from "./types";
import "./panel.css";

export default function HooksLensPane() {
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "query" | "mutation">(
    "all",
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { snapshot, connected, setSnapshot } = useInsightSnapshot(paused);
  const { theme, toggleTheme } = useThemeMode();

  const clearTimeline = () => {
    setSnapshot((prev: StoreSnapshot | null) =>
      prev ? { ...prev, timeline: [] } : prev,
    );
  };

  if (!snapshot) {
    return (
      <div
        className={`hookslens-root ${theme === "dark" ? "theme-dark" : "theme-light"}`}
      >
        <div className="connecting">
          <div className="dot pulse" style={{ background: "var(--text3)" }} />
          Connecting to app...
        </div>
      </div>
    );
  }

  const { hooks, timeline, routes } = snapshot;

  const stats = useMemo(
    () => getPanelStats(hooks, timeline),
    [hooks, timeline],
  );

  const filteredHooks = useMemo(
    () =>
      hooks.filter((h: (typeof hooks)[number]) => {
        const matchesSearch = h.key
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesRoute =
          routeFilter === "all" || h.routes.includes(routeFilter);
        const matchesType = typeFilter === "all" || h.type === typeFilter;
        return matchesSearch && matchesRoute && matchesType;
      }),
    [hooks, search, routeFilter, typeFilter],
  );

  const filteredTimeline = useMemo(
    () =>
      routeFilter === "all"
        ? timeline
        : timeline.filter(
            (e: (typeof timeline)[number]) => e.route === routeFilter,
          ),
    [timeline, routeFilter],
  );

  return (
    <div
      className={`hookslens-root ${theme === "dark" ? "theme-dark" : "theme-light"}`}
    >
      <div className="app">
        <Topbar
          connected={connected}
          theme={theme}
          onToggleTheme={toggleTheme}
          stats={stats}
        />

        <Sidebar
          hooks={hooks}
          routes={routes}
          routeFilter={routeFilter}
          onSelectRoute={setRouteFilter}
          stats={stats}
          eventCount={timeline.length}
          lastUpdate={formatTime(snapshot.meta.timestamp)}
        />

        <div className="main">
          <div className="main-header">
            <div>
              <div className="main-title">
                {routeFilter === "all"
                  ? "Hook Registry"
                  : `Hook Registry · ${routeFilter}`}
              </div>
              <div className="main-subtitle">
                {filteredHooks.length} keys | {stats.totalInstances} instances
                {stats.fetchingCount > 0 && (
                  <span style={{ color: "var(--accent)", marginLeft: 8 }}>
                    | {stats.fetchingCount} in flight
                  </span>
                )}
              </div>
            </div>

            <div className="toolbar">
              <div className="toolbar-row">
                <input
                  className="search-input"
                  placeholder="filter by key..."
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                />

                <button className="btn" onClick={() => setTypeFilter("all")}>
                  all
                </button>
                <button className="btn" onClick={() => setTypeFilter("query")}>
                  query
                </button>
                <button
                  className="btn"
                  onClick={() => setTypeFilter("mutation")}
                >
                  mutation
                </button>

                <button
                  className="btn"
                  onClick={() => setPaused((p: boolean) => !p)}
                >
                  {paused ? "resume" : "pause"}
                </button>
                <button className="btn" onClick={clearTimeline}>
                  clear log
                </button>
              </div>

              {routes.length > 0 && (
                <div className="route-filter">
                  <span className="muted">route:</span>
                  <span
                    className={`route-chip ${
                      routeFilter === "all" ? "active" : ""
                    }`}
                    onClick={() => setRouteFilter("all")}
                  >
                    all
                  </span>
                  {routes.map((r: string) => (
                    <span
                      key={r}
                      className={`route-chip ${routeFilter === r ? "active" : ""}`}
                      onClick={() => setRouteFilter(r)}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="content">
            <HooksTable
              hooks={filteredHooks}
              selectedKey={selectedKey}
              routeFilter={routeFilter}
              onSelectRoute={setRouteFilter}
              onSelectKey={(key) =>
                setSelectedKey((current: string | null) =>
                  current === key ? null : key,
                )
              }
            />
          </div>

          <TimelinePanel
            entries={filteredTimeline}
            routeFilter={routeFilter}
            fetchingCount={stats.fetchingCount}
          />
        </div>
      </div>
    </div>
  );
}
