import type { TimelineEvent } from "@/lib/hookslens/store";

import { formatTime } from "../lib/format";

interface TimelinePanelProps {
  entries: TimelineEvent[];
  routeFilter: string;
  fetchingCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export const TimelinePanel = ({
  entries,
  routeFilter,
  fetchingCount,
  expanded,
  onToggleExpanded,
}: TimelinePanelProps) => {
  return (
    <div className={`timeline-panel ${expanded ? "expanded" : ""}`}>
      <div className="panel-header">
        <div className="panel-title">
          Fetch Timeline
          {fetchingCount > 0 && (
            <span style={{ marginLeft: 8, color: "var(--accent)" }}>
              {fetchingCount} in flight
            </span>
          )}
        </div>

        <div style={{ fontSize: 12, color: "var(--text3)" }}>
          {entries.length} events
          {routeFilter !== "all" ? ` | ${routeFilter}` : ""}
        </div>

        <button className="btn" onClick={onToggleExpanded}>
          {expanded ? "shrink" : "expand events"}
        </button>
      </div>

      <div className="timeline-scroll">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`timeline-entry ${entry.flagged ? "flagged" : ""}`}
          >
            <span className="te-time">{formatTime(entry.timestamp)}</span>
            <span className={`te-type ${entry.type}`}>{entry.type}</span>
            <span className="te-route">{entry.route}</span>
            <span className="te-key">{entry.key}</span>
            <span className="te-dur">
              {entry.duration != null ? `${entry.duration}ms` : "-"}
            </span>
          </div>
        ))}

        {entries.length === 0 && <div className="empty">No events yet</div>}
      </div>
    </div>
  );
};
