import type { HookEntry } from "../../../utils/store";
import { durationClass, formatRelative } from "../lib/format";

interface AllHooksViewProps {
  hooks: HookEntry[];
  selectedKey: string | null;
  routeFilter: string;
  onSelectKey: (key: string) => void;
  onSelectRoute: (route: string) => void;
}

export function AllHooksView({
  hooks,
  selectedKey,
  routeFilter,
  onSelectKey,
  onSelectRoute,
}: AllHooksViewProps) {
  return (
    <div className="table-wrap">
      <table className="wrap-table">
        <thead>
          <tr>
            <th style={{ width: "18%" }}>Hook Name</th>
            <th style={{ width: "28%" }}>Fetch Key</th>
            <th style={{ width: "8%" }}>Type</th>
            <th style={{ width: "8%" }}>Status</th>
            <th style={{ width: "8%" }}>HTTP</th>
            <th style={{ width: "8%" }}>4xx</th>
            <th style={{ width: "8%" }}>⊛</th>
            <th style={{ width: "8%" }}>⧉</th>
            <th style={{ width: "14%" }}>Dur</th>
          </tr>
        </thead>
        <tbody>
          {hooks.length === 0 && (
            <tr>
              <td colSpan={9}>
                <div className="empty-panel">No hooks match this filter</div>
              </td>
            </tr>
          )}

          {hooks.map((hook) => (
            <tr
              key={hook.key}
              className={`trow ${selectedKey === hook.key ? "selected" : ""}`}
              onClick={() => onSelectKey(hook.key)}
            >
              <td>
                <div className="wrap-cell wrap-cell-name">
                  <span className="mono hook-name-wrap">{hook.key}</span>
                </div>
              </td>
              <td>
                <div className="wrap-cell">
                  <span className="hook-key-wrap">
                    {hook.lastUrl ?? hook.key}
                  </span>
                </div>
              </td>
              <td>
                <span
                  className={`badge ${hook.type === "mutation" ? "badge-mutation" : "badge-swr"}`}
                >
                  {hook.type}
                </span>
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
                              : hook.status === "stalled"
                                ? "var(--orange)"
                                : "var(--red)",
                    }}
                  />
                  {hook.status}
                </span>
              </td>
              <td>
                <span className="badge badge-muted">
                  {hook.lastHttpStatus ?? "—"}
                </span>
              </td>
              <td>
                {hook.badRequestCount > 0 ? (
                  <span className="badge badge-error">
                    ×{hook.badRequestCount}
                  </span>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>
                <span
                  className={`badge ${hook.badRequestCount > 0 ? "badge-mismatch" : "badge-muted"}`}
                >
                  {hook.recentParams.length > 1 ? "⊛" : "—"}
                </span>
              </td>
              <td>
                <span
                  className={`badge ${hook.routes.length > 1 ? "badge-dup" : "badge-muted"}`}
                >
                  {hook.routes.length > 1 ? "⧉" : "—"}
                </span>
              </td>
              <td>
                {hook.lastDuration != null ? (
                  <span
                    className={`duration ${durationClass(hook.lastDuration)}`}
                  >
                    {hook.lastDuration}ms
                  </span>
                ) : (
                  <span className="muted">—</span>
                )}
                <div className="mini-route-list">
                  {hook.routes.map((route) => (
                    <button
                      key={`${hook.key}-${route}`}
                      className={`route-chip inline ${routeFilter === route ? "active" : ""}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectRoute(route);
                      }}
                    >
                      {route}
                    </button>
                  ))}
                </div>
                <div className="muted tiny">
                  {formatRelative(hook.lastFetchedAt)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
