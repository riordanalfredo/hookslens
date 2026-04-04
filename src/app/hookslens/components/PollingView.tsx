import type { HookEntry } from "../../../utils/store";

interface PollingViewProps {
  hooks: HookEntry[];
}

export function PollingView({ hooks }: PollingViewProps) {
  const pollingHooks = hooks.filter((hook) => hook.refreshInterval != null);

  if (pollingHooks.length === 0) {
    return <div className="empty-panel">No polling hooks found</div>;
  }

  return (
    <div className="table-wrap">
      <table className="wrap-table">
        <thead>
          <tr>
            <th>Hook Name</th>
            <th>Fetch Key</th>
            <th>Interval</th>
            <th>Slow ×</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pollingHooks.map((hook) => (
            <tr key={hook.key} className="trow">
              <td>
                <span className="mono hook-name-wrap">{hook.key}</span>
              </td>
              <td>
                <span className="hook-key-wrap">
                  {hook.lastUrl ?? hook.key}
                </span>
              </td>
              <td>
                <span className="badge badge-polling">
                  ⟳ every {hook.refreshInterval! / 1000}s
                </span>
              </td>
              <td>
                {hook.slowCount > 0 ? (
                  <span className="badge badge-stale">
                    ⚡ ×{hook.slowCount}
                  </span>
                ) : (
                  <span className="muted">✓ none</span>
                )}
              </td>
              <td>
                <span
                  className={`badge ${hook.status === "stalled" ? "badge-http-bad" : hook.status === "fresh" ? "badge-http-ok" : "badge-muted"}`}
                >
                  {hook.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
