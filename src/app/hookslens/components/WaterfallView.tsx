import type { WaterfallEntry } from "../../../utils/store";

interface WaterfallViewProps {
  entries: WaterfallEntry[];
}

function originLabel(origin: WaterfallEntry["origin"]) {
  if (origin === "effect") return "effect";
  if (origin === "swr") return "swr";
  return "unknown";
}

function statusClass(status: WaterfallEntry["status"]) {
  if (status === "success") return "wf-success";
  if (status === "error") return "wf-error";
  if (status === "slow") return "wf-slow";
  return "wf-pending";
}

export function WaterfallView({ entries }: WaterfallViewProps) {
  const minStart = entries.length
    ? Math.min(...entries.map((entry) => entry.startedAt))
    : 0;
  const maxDuration = Math.max(
    ...entries.map((entry) => entry.startedAt + (entry.duration ?? 1200)),
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

      <div className="waterfall-scroll">
        {entries.map((entry) => {
          const left = ((entry.startedAt - minStart) / totalSpan) * 100;
          const width = entry.duration
            ? Math.max((entry.duration / totalSpan) * 100, 2)
            : 8;

          return (
            <div key={entry.id} className="wf-row">
              <div className="wf-key-wrap">{entry.key}</div>
              <div className="wf-origin">
                <span
                  className={`badge ${entry.origin === "effect" ? "badge-effect" : "badge-swr"}`}
                >
                  {originLabel(entry.origin)}
                </span>
              </div>
              <div className="wf-route-wrap">{entry.route}</div>
              <div className="wf-track">
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
                  >
                    {entry.httpStatus}
                  </span>
                ) : (
                  <span className="muted">—</span>
                )}
              </div>
              <div className="wf-conc">
                {entry.concurrent.length > 0 && (
                  <span className="conc-badge">+{entry.concurrent.length}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
