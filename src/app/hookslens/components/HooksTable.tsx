import type { HookEntry } from "@/lib/hookslens/store";

import { durationClass, formatRelative } from "../lib/format";

interface HooksTableProps {
  hooks: HookEntry[];
  selectedKey: string | null;
  routeFilter: string;
  onSelectKey: (key: string) => void;
  onSelectRoute: (route: string) => void;
}

export const HooksTable = ({
  hooks,
  selectedKey,
  routeFilter,
  onSelectKey,
  onSelectRoute,
}: HooksTableProps) => {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: "30%" }}>SWR Key</th>
            <th>Status</th>
            <th>Instances</th>
            <th>Route(s)</th>
            <th>Polling</th>
            <th>Last Duration</th>
            <th>Last Fetch</th>
          </tr>
        </thead>
        <tbody>
          {hooks.length === 0 && (
            <tr>
              <td colSpan={7}>
                <div className="empty">No hooks match this filter</div>
              </td>
            </tr>
          )}

          {hooks.map((hook) => (
            <tr
              key={hook.key}
              className={`row ${selectedKey === hook.key ? "selected" : ""}`}
              onClick={() => onSelectKey(hook.key)}
            >
              <td>
                <div className="key-cell">
                  <span className="key-text">{hook.key}</span>
                  <span
                    className={`key-tag ${hook.type === "mutation" ? "mutation" : ""}`}
                  >
                    {hook.type}
                  </span>
                </div>
              </td>

              <td>
                <span className={`status-badge ${hook.status}`}>
                  <span
                    className={`dot ${hook.status === "fetching" ? "pulse" : ""}`}
                    style={{
                      background:
                        hook.status === "fresh"
                          ? "var(--green)"
                          : hook.status === "fetching"
                            ? "var(--accent)"
                            : hook.status === "stale"
                              ? "var(--yellow)"
                              : "var(--red)",
                    }}
                  />
                  {hook.status}
                </span>
              </td>

              <td>
                <div className="instances">
                  {Array.from({ length: Math.min(hook.instances, 5) }).map(
                    (_, i) => (
                      <div key={`${hook.key}-${i}`} className="inst-dot" />
                    ),
                  )}
                  {hook.instances > 5 && (
                    <span className="muted">+{hook.instances - 5}</span>
                  )}
                  <span style={{ marginLeft: 4 }}>{hook.instances}</span>
                </div>
              </td>

              <td>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {hook.routes.map((route) => (
                    <span
                      key={`${hook.key}-${route}`}
                      className={`route-tag ${routeFilter === route ? "active" : ""}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectRoute(route);
                      }}
                    >
                      {route}
                    </span>
                  ))}
                </div>
              </td>

              <td>
                {hook.refreshInterval ? (
                  <span className="interval-badge">
                    every {Math.floor(hook.refreshInterval / 1000)}s
                  </span>
                ) : (
                  <span className="muted">-</span>
                )}
              </td>

              <td>
                {hook.lastDuration != null ? (
                  <span
                    className={`duration ${durationClass(hook.lastDuration)}`}
                  >
                    {hook.lastDuration}ms
                  </span>
                ) : (
                  <span className="muted">...</span>
                )}
              </td>

              <td className="muted">{formatRelative(hook.lastFetchedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
