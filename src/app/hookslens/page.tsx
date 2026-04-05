"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AggregatedAlertsStrips } from "./components/AggregatedAlertsStrips";
import { AlertStrips } from "./components/AlertStrips";
import { AllHooksView } from "./components/AllHooksView";
import { CoverageView } from "./components/CoverageView";
import { CurrentPageView } from "./components/CurrentPageView";
import { ParamInspectorView } from "./components/ParamInspectorView";
import { PollingView } from "./components/PollingView";
import { Sidebar } from "./components/Sidebar";
import { TimelinePanel } from "./components/TimelinePanel";
import { Topbar } from "./components/Topbar";
import { WaterfallView } from "./components/WaterfallView";
import { useInsightSnapshot, useThemeMode } from "./hooks/useInsightSnapshot";
import { formatTime, getPanelStats } from "./lib/format";
import type { StoreSnapshot, ViewMode } from "./types";
import "@/app/hookslens/panel.css";

const HooksLensPane = () => {
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [activeView, setActiveView] = useState<ViewMode>("waterfall");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [hiddenAlerts, setHiddenAlerts] = useState({
    param: false,
    duplicate: false,
    stalled: false,
  });
  const [hiddenAllHooksAlerts, setHiddenAllHooksAlerts] = useState({
    param: false,
    duplicate: false,
    stalled: false,
    badRequest: false,
  });
  const didInitRouteRef = useRef(false);
  const { snapshot, connected, setSnapshot } = useInsightSnapshot(paused);
  const { theme, toggleTheme } = useThemeMode();

  const clearTimeline = () => {
    setSnapshot((prev: StoreSnapshot | null) =>
      prev ? { ...prev, timeline: [] } : prev,
    );
  };

  // Provide defaults when snapshot is null to keep hooks stable
  const hooks = snapshot?.hooks ?? [];
  const timeline = snapshot?.timeline ?? [];
  const routes = snapshot?.routes ?? [];
  const currentRoute = routeFilter;
  const searchTerm = search.toLowerCase();

  // All hooks (useMemo, useEffect) must be called before any conditional returns
  const currentRouteHooks = useMemo(
    () =>
      currentRoute === "all"
        ? hooks
        : hooks.filter((hook) => hook.routes.includes(currentRoute)),
    [hooks, currentRoute],
  );

  const filteredCurrentRouteHooks = useMemo(
    () =>
      currentRouteHooks.filter(
        (hook) =>
          hook.key.toLowerCase().includes(searchTerm) ||
          (hook.lastUrl ?? hook.key).toLowerCase().includes(searchTerm),
      ),
    [currentRouteHooks, searchTerm],
  );

  const stats = useMemo(
    () => getPanelStats(hooks, timeline),
    [hooks, timeline],
  );

  const filteredHooks = useMemo(
    () =>
      hooks.filter((hook) => {
        const matchesRoute =
          routeFilter === "all" || hook.routes.includes(routeFilter);
        const matchesSearch =
          hook.key.toLowerCase().includes(searchTerm) ||
          (hook.lastUrl ?? hook.key).toLowerCase().includes(searchTerm);
        return matchesRoute && matchesSearch;
      }),
    [hooks, routeFilter, searchTerm],
  );

  const activeRouteTimeline = useMemo(
    () =>
      routeFilter === "all"
        ? timeline
        : timeline.filter((event) => event.route === routeFilter),
    [timeline, routeFilter],
  );

  useEffect(() => {
    if (!snapshot?.routes.length) return;

    if (!didInitRouteRef.current && routeFilter === "all") {
      setRouteFilter(snapshot.routes[0]);
      didInitRouteRef.current = true;
    }

    if (!snapshot.routes.includes(routeFilter) && routeFilter !== "all") {
      setRouteFilter(snapshot.routes[0]);
      didInitRouteRef.current = true;
    }
  }, [snapshot?.routes, routeFilter]);

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

  const viewTitle: Record<ViewMode, string> = {
    current: currentRoute === "all" ? "Current Page" : currentRoute,
    "all-hooks": "All Hooks Registry",
    params: "Param Inspector",
    coverage: "Fetch Coverage Audit",
    waterfall: "Concurrency Waterfall",
    polling: "Polling Monitor",
  };

  const viewSubtitle: Record<ViewMode, string> = {
    current:
      currentRoute === "all"
        ? `${currentRouteHooks.length} hooks`
        : `${currentRouteHooks.length} hooks · ${currentRouteHooks.filter((hook) => hook.type === "query").length} SWR · ${currentRouteHooks.filter((hook) => hook.type === "mutation").length} mutation`,
    "all-hooks": `${hooks.length} hooks across ${routes.length} pages`,
    params: `${snapshot.diagnostics.paramMismatches.length} endpoint${snapshot.diagnostics.paramMismatches.length === 1 ? "" : "s"} with inconsistent param key shapes`,
    coverage: "SWR adoption rate per page",
    waterfall: "SWR and useEffect fetch cycles overlaid",
    polling: `${stats.pollingCount} hooks with refreshInterval`,
  };

  return (
    <div
      className={`hookslens-root ${theme === "dark" ? "theme-dark" : "theme-light"}`}
    >
      <div className="app">
        <Topbar
          connected={connected}
          theme={theme}
          onToggleTheme={toggleTheme}
          search={search}
          onSearchChange={setSearch}
          paused={paused}
          onTogglePause={() => setPaused((p) => !p)}
          onClearLog={clearTimeline}
          routeFilter={routeFilter}
          onRouteFilterChange={setRouteFilter}
        />

        <Sidebar
          hooks={hooks}
          routes={routes}
          routeCoverage={snapshot.routeCoverage}
          activeView={activeView}
          onSelectView={setActiveView}
          routeFilter={routeFilter}
          onSelectRoute={setRouteFilter}
          stats={stats}
          eventCount={timeline.length}
          lastUpdate={formatTime(snapshot.meta.timestamp)}
        />

        <div className="main">
          {activeView === "current" && (
            <AlertStrips
              diagnostics={snapshot.diagnostics}
              hidden={hiddenAlerts}
              onDismiss={(kind) =>
                setHiddenAlerts((current) => ({ ...current, [kind]: true }))
              }
            />
          )}

          {activeView === "all-hooks" && (
            <AggregatedAlertsStrips
              stats={stats}
              hidden={hiddenAllHooksAlerts}
              onDismiss={(kind) =>
                setHiddenAllHooksAlerts((current) => ({
                  ...current,
                  [kind]: true,
                }))
              }
            />
          )}

          <div className="main-header">
            <div>
              <div className="main-title">{viewTitle[activeView]}</div>
              <div className="main-subtitle">
                {viewSubtitle[activeView]}
                {activeView === "all-hooks" && stats.fetchingCount > 0 && (
                  <span className="subtitle-accent">
                    {stats.fetchingCount} in flight
                  </span>
                )}
              </div>
            </div>

            <div className="toolbar">
              {activeView !== "current" && routes.length > 0 && (
                <div className="route-filter">
                  <span className="route-filter-label">page:</span>
                  <button
                    className={`route-chip ${routeFilter === "all" ? "active" : ""}`}
                    onClick={() => setRouteFilter("all")}
                  >
                    all
                  </button>
                  {routes.map((route) => (
                    <button
                      key={route}
                      className={`route-chip ${routeFilter === route ? "active" : ""}`}
                      onClick={() => setRouteFilter(route)}
                    >
                      {route}
                    </button>
                  ))}
                </div>
              )}
              {activeView === "current" && (
                <div className="toolbar-row">
                  {stats.mismatchCount > 0 && (
                    <span className="pill orange">
                      ⊛ {stats.mismatchCount} mismatch
                    </span>
                  )}
                  {stats.duplicateCount > 0 && (
                    <span className="pill orange">
                      ⧉ {stats.duplicateCount} duplicate
                    </span>
                  )}
                  {stats.stalledCount > 0 && (
                    <span className="pill red">
                      {stats.stalledCount} stalled
                    </span>
                  )}
                  {stats.badRequestCount > 0 && (
                    <span className="pill red">
                      4xx hooks {stats.badRequestCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="content">
            {activeView === "current" && (
              <CurrentPageView
                hooks={filteredCurrentRouteHooks}
                routeFilter={currentRoute}
              />
            )}

            {activeView === "all-hooks" && (
              <AllHooksView
                hooks={filteredHooks}
                selectedKey={selectedKey}
                routeFilter={routeFilter}
                onSelectKey={(key) =>
                  setSelectedKey((current) => (current === key ? null : key))
                }
                onSelectRoute={setRouteFilter}
              />
            )}

            {activeView === "params" && (
              <ParamInspectorView diagnostics={snapshot.diagnostics} />
            )}

            {activeView === "coverage" && (
              <CoverageView
                routeCoverage={snapshot.routeCoverage}
                diagnostics={snapshot.diagnostics}
              />
            )}

            {activeView === "waterfall" && (
              <WaterfallView entries={snapshot.waterfall} />
            )}

            {activeView === "polling" && <PollingView hooks={hooks} />}
          </div>

          <TimelinePanel
            entries={activeRouteTimeline}
            routeFilter={routeFilter}
            fetchingCount={stats.fetchingCount}
            expanded={eventsExpanded}
            onToggleExpanded={() => setEventsExpanded((current) => !current)}
          />
        </div>
      </div>
    </div>
  );
};

export default HooksLensPane;
