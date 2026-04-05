import type { HookEntry, RouteCoverage } from "@/lib/hookslens/store";

import type { PanelStats, ViewMode } from "../types";

interface SidebarProps {
  hooks: HookEntry[];
  routes: string[];
  routeCoverage: RouteCoverage[];
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  routeFilter: string;
  onSelectRoute: (route: string) => void;
  stats: PanelStats;
  eventCount: number;
  lastUpdate: string;
}

const VIEW_ITEMS: Array<{ id: ViewMode; icon: string; label: string }> = [
  { id: "current", icon: "⊡", label: "Current Page" },
  { id: "all-hooks", icon: "◈", label: "All Hooks" },
  { id: "params", icon: "⊛", label: "Param Inspector" },
  { id: "coverage", icon: "◉", label: "Fetch Coverage" },
  { id: "waterfall", icon: "≋", label: "Waterfall" },
  { id: "polling", icon: "⟳", label: "Polling" },
];

const CURRENT_PAGE_VIEW = VIEW_ITEMS.find((item) => item.id === "current");
const TRACKER_VIEWS = VIEW_ITEMS.filter((item) => item.id !== "current");

export const Sidebar = ({
  hooks,
  routes,
  routeCoverage,
  activeView,
  onSelectView,
  routeFilter,
  onSelectRoute,
  stats,
  eventCount,
  lastUpdate,
}: SidebarProps) => {
  const currentRouteCoverage = routeCoverage.find(
    (item) => item.route === routeFilter,
  );

  return (
    <aside className="sidebar">
      <section className="sidebar-section">
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-val blue">{hooks.length}</div>
            <div className="stat-key">hooks</div>
          </div>
          <div className="stat-box">
            <div className="stat-val purple">{stats.mismatchCount}</div>
            <div className="stat-key">mismatches</div>
          </div>
          <div className="stat-box">
            <div className="stat-val orange">{stats.duplicateCount}</div>
            <div className="stat-key">duplicates</div>
          </div>
          <div className="stat-box">
            <div className="stat-val red">{stats.badRequestCount}</div>
            <div className="stat-key">4xx hooks</div>
          </div>
          <div className="stat-box">
            <div className="stat-val orange">{stats.stalledCount}</div>
            <div className="stat-key">stalled</div>
          </div>
          <div className="stat-box">
            <div className="stat-val yellow">{stats.pollingCount}</div>
            <div className="stat-key">polling</div>
          </div>
        </div>
      </section>

      <section className="sidebar-section sidebar-scroll">
        <div className="sidebar-label">Views</div>
        <div>
          {TRACKER_VIEWS.map((item) => (
            <div
              key={item.id}
              className={`view-item ${activeView === item.id ? "active" : ""}`}
              onClick={() => onSelectView(item.id)}
            >
              <span className="view-icon">{item.icon}</span>
              <span className="view-label">{item.label}</span>
              {item.id === "params" && stats.mismatchCount > 0 && (
                <span className="nav-badge purple">{stats.mismatchCount}</span>
              )}
              {item.id === "coverage" && stats.duplicateCount > 0 && (
                <span className="nav-badge orange">{stats.duplicateCount}</span>
              )}
              {item.id === "polling" && stats.pollingCount > 0 && (
                <span className="nav-badge yellow">{stats.pollingCount}</span>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-label" style={{ marginTop: 12 }}>
          Current Page
        </div>
        <div>
          {CURRENT_PAGE_VIEW && (
            <div
              className={`view-item ${activeView === CURRENT_PAGE_VIEW.id ? "active" : ""}`}
              onClick={() => onSelectView(CURRENT_PAGE_VIEW.id)}
            >
              <span className="view-icon">{CURRENT_PAGE_VIEW.icon}</span>
              <span className="view-label">{CURRENT_PAGE_VIEW.label}</span>
            </div>
          )}
        </div>

        <div className="sidebar-label" style={{ marginTop: 12 }}>
          Detected Pages
        </div>
        <div>
          <div
            className={`route-item ${activeView === "current" && routeFilter === "all" ? "active" : ""}`}
            onClick={() => onSelectRoute("all")}
          >
            <span>all routes</span>
            <span className="route-count">{hooks.length}</span>
          </div>
          {routes.map((route) => {
            const coverage = routeCoverage.find((item) => item.route === route);
            const routeHooks = hooks.filter((hook) =>
              hook.routes.includes(route),
            );
            const isActive = activeView === "current" && routeFilter === route;
            const mismatchCount = coverage?.inconsistentUrls.length ?? 0;
            const duplicateCount = coverage?.duplicateUrls.length ?? 0;
            const stalledCount = routeHooks.filter(
              (hook) => hook.status === "stalled",
            ).length;
            const badRequestCount = routeHooks.reduce(
              (sum, hook) => sum + hook.badRequestCount,
              0,
            );

            return (
              <div
                key={route}
                className={`route-item ${isActive ? "active" : ""}`}
                onClick={() => onSelectRoute(route)}
              >
                <span className="route-main">
                  <span className="route-text">{route}</span>
                  <span className="route-issues">
                    {mismatchCount > 0 && (
                      <span className="nav-badge purple">⊛{mismatchCount}</span>
                    )}
                    {duplicateCount > 0 && (
                      <span className="nav-badge orange">
                        ⧉{duplicateCount}
                      </span>
                    )}
                    {stalledCount > 0 && (
                      <span className="nav-badge orange">⚠{stalledCount}</span>
                    )}
                    {badRequestCount > 0 && (
                      <span className="nav-badge red">
                        4xx{badRequestCount}
                      </span>
                    )}
                  </span>
                </span>
                <span className="route-count">{routeHooks.length}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="sidebar-label">Info</div>
        <div className="sidebar-info">
          <div>{eventCount} events logged</div>
          <div>Last update: {lastUpdate}</div>
          {currentRouteCoverage && (
            <div>Route coverage: {currentRouteCoverage.coveragePct}%</div>
          )}
        </div>
      </section>
    </aside>
  );
};
