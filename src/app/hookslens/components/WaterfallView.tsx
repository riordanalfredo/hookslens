import type { WaterfallEntry } from "@/lib/hookslens/store";

interface WaterfallViewProps {
  entries: WaterfallEntry[];
}

const originLabel = (origin: WaterfallEntry["origin"]) => {
  if (origin === "effect") return "effect";
  if (origin === "swr") return "swr";
  return "unknown";
};

const statusClass = (status: WaterfallEntry["status"]) => {
  if (status === "success") return "wf-success";
  if (status === "error") return "wf-error";
  if (status === "slow") return "wf-slow";
  return "wf-pending";
};

export const WaterfallView = ({ entries }: WaterfallViewProps) => {
  if (entries.length === 0) {
    return <div className="empty-panel">No waterfall entries yet</div>;
  }

  // Sort entries by startedAt (oldest first, latest at bottom)
  const sortedEntries = [...entries].sort(
    (a, b) => a.startedAt - b.startedAt,
  );

  const minStart = Math.min(...sortedEntries.map((entry) => entry.startedAt));
  const maxDuration = Math.max(
    ...sortedEntries.map((entry) => entry.startedAt + (entry.duration ?? 1200)),
    minStart + 1500,
  );
  const totalSpan = Math.max(maxDuration - minStart, 1500);

  return (
    <div className="waterfall-panel">
      <div className="wf-header">
        <span>Fetch timeline — SWR and useEffect overlaid</span>
        <div className="wf-legend">
          <span className="wf-legend-item">
            <span className="wf-legend-swatch swatch-swr" />
            swr
          </span>
          <span className="wf-legend-item">
            <span className="wf-legend-swatch swatch-effect" />
            effect
          </span>
        </div>
      </div>

      <div className="wf-column-headers">
        <div className="wf-col-key">Hook Key</div>
        <div className="wf-col-origin">Origin</div>
        <div className="wf-col-route">Route</div>
        <div className="wf-col-timeline">Timeline</div>
        <div className="wf-col-http">HTTP</div>
        <div className="wf-col-conc">Conc</div>
      </div>

      <div className="waterfall-scroll">
        {sortedEntries.map((entry) => {
          const left = ((entry.startedAt - minStart) / totalSpan) * 100;
          const width = entry.duration
            ? Math.max((entry.duration / totalSpan) * 100, 2)
            : 8;

          const tooltipText = entry.duration
            ? `${entry.key}\nDuration: ${entry.duration}ms\nStatus: ${entry.status}\nHTTP: ${entry.httpStatus ?? "—"}`
            : `${entry.key}\nStatus: ${entry.status} (in progress)`;

          return (
            <div key={entry.id} className="wf-row" title={tooltipText}>
              <div className="wf-key-wrap" title={entry.key}>
                {entry.key}
              </div>
              <div className="wf-origin">
                <span
                  className={`badge ${entry.origin === "effect" ? "badge-effect" : "badge-swr"}`}
                >
                  {originLabel(entry.origin)}
                </span>
              </div>
              <div className="wf-route-wrap" title={entry.route}>
                {entry.route}
              </div>
              <div
                className="wf-track"
                title={
                  entry.duration
                    ? `${entry.duration}ms (${entry.status})`
                    : "In progress"
                }
              >
                <div
                  className={`wf-bar ${statusClass(entry.status)}`}
                  style={{ left: `${Math.max(left, 0)}%`, width: `${width}%` }}
                >
                  {entry.duration != null ? `${entry.duration}ms` : "…"}
                </div>
              </div>
              <div className="wf-dur">
                {entry.httpStatus != null ? (
                  <span
                    className={`badge ${entry.httpStatus < 300 ? "badge-http-ok" : entry.httpStatus < 400 ? "badge-http-warn" : "badge-http-bad"}`}
                    title={`HTTP ${entry.httpStatus}`}
                  >
                    {entry.httpStatus}
                  </span>
                ) : (
                  <span className="muted">—</span>
                )}
              </div>
              <div className="wf-conc">
                {entry.concurrent.length > 0 && (
                  <span
                    className="conc-badge"
                    title={`Concurrent with: ${entry.concurrent.join(", ")}`}
                  >
                    +{entry.concurrent.length}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
