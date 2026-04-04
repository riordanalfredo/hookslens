import type { HookEntry } from "../../../utils/store";
import type { PanelStats } from "../types";

interface SidebarProps {
  hooks: HookEntry[];
  routes: string[];
  routeFilter: string;
  onSelectRoute: (route: string) => void;
  stats: PanelStats;
  eventCount: number;
  lastUpdate: string;
}

export function Sidebar({
  hooks,
  routes,
  routeFilter,
  onSelectRoute,
  stats,
  eventCount,
  lastUpdate,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-val blue">{hooks.length}</div>
            <div className="stat-key">active keys</div>
          </div>
          <div className="stat-box">
            <div className="stat-val green">{stats.totalInstances}</div>
            <div className="stat-key">instances</div>
          </div>
          <div className="stat-box">
            <div className="stat-val yellow">{stats.pollingCount}</div>
            <div className="stat-key">polling</div>
          </div>
          <div className="stat-box">
            <div className="stat-val red">{stats.errorCount}</div>
            <div className="stat-key">errors</div>
          </div>
          <div className="stat-box">
            <div className="stat-val orange">{stats.stalledCount}</div>
            <div className="stat-key">stalled</div>
          </div>
          <div className="stat-box">
            <div className="stat-val orange">{stats.duplicateCount}</div>
            <div className="stat-key">duplicate</div>
          </div>
        </div>
      </div>

      <div className="sidebar-section" style={{ flex: 1, overflowY: "auto" }}>
        <div className="sidebar-label">Routes</div>
        <div>
          <div
            className={`route-item ${routeFilter === "all" ? "active" : ""}`}
            onClick={() => onSelectRoute("all")}
          >
            <span>all routes</span>
          </div>
          {routes.map((route) => {
            const routeHooks = hooks.filter((h) => h.routes.includes(route));
            return (
              <div
                key={route}
                className={`route-item ${routeFilter === route ? "active" : ""}`}
                onClick={() => onSelectRoute(route)}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {route}
                </span>
                <span className="route-count">{routeHooks.length}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Info</div>
        <div
          style={{
            padding: "0 14px",
            fontSize: 13,
            color: "var(--text3)",
            lineHeight: 1.7,
          }}
        >
          <div>{eventCount} events logged</div>
          <div style={{ fontSize: 12 }}>Last update: {lastUpdate}</div>
        </div>
      </div>
    </div>
  );
}
