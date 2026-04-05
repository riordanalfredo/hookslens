import type { PanelStats } from "../types";

interface AggregatedAlertsStripsProps {
  stats: PanelStats;
  onDismiss: (kind: "param" | "duplicate" | "stalled" | "badRequest") => void;
  hidden: Record<"param" | "duplicate" | "stalled" | "badRequest", boolean>;
}

export const AggregatedAlertsStrips = ({
  stats,
  onDismiss,
  hidden,
}: AggregatedAlertsStripsProps) => {
  return (
    <div className="alert-stack">
      {stats.mismatchCount > 0 && !hidden.param && (
        <div className="alert-strip purple">
          <strong>⊛ Param mismatch</strong>
          <span>
            {stats.mismatchCount} mismatched call
            {stats.mismatchCount === 1 ? "" : "s"} detected.
          </span>
          <button className="alert-dismiss" onClick={() => onDismiss("param")}>
            ×
          </button>
        </div>
      )}

      {stats.duplicateCount > 0 && !hidden.duplicate && (
        <div className="alert-strip orange">
          <strong>⧉ Duplicate</strong>
          <span>
            {stats.duplicateCount} duplicate fetch event
            {stats.duplicateCount === 1 ? "" : "s"} detected.
          </span>
          <button
            className="alert-dismiss"
            onClick={() => onDismiss("duplicate")}
          >
            ×
          </button>
        </div>
      )}

      {stats.stalledCount > 0 && !hidden.stalled && (
        <div className="alert-strip red">
          <strong>⚠ Stalled</strong>
          <span>
            {stats.stalledCount} stalled hook
            {stats.stalledCount === 1 ? "" : "s"} found.
          </span>
          <button
            className="alert-dismiss"
            onClick={() => onDismiss("stalled")}
          >
            ×
          </button>
        </div>
      )}

      {stats.badRequestCount > 0 && !hidden.badRequest && (
        <div className="alert-strip red">
          <strong>4xx</strong>
          <span>
            {stats.badRequestCount} hook
            {stats.badRequestCount === 1 ? "" : "s"} with bad request responses.
          </span>
          <button
            className="alert-dismiss"
            onClick={() => onDismiss("badRequest")}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
