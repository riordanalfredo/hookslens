import type { TimelineEvent } from "@/lib/hookslens/store";

import { formatTime } from "../lib/format";

interface TimelinePanelProps {
  entries: TimelineEvent[];
  routeFilter: string;
  fetchingCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  paused?: boolean;
  onTogglePause?: () => void;
  onClearLog?: () => void;
}

export const TimelinePanel = ({
  entries,
  routeFilter,
  fetchingCount,
  expanded,
  onToggleExpanded,
  searchTerm = "",
  onSearchChange,
  paused = false,
  onTogglePause,
  onClearLog,
}: TimelinePanelProps) => {
  // Filter entries by search term
  const filteredEntries = entries.filter((entry) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      entry.key.toLowerCase().includes(search) ||
      entry.route.toLowerCase().includes(search) ||
      entry.type.toLowerCase().includes(search)
    );
  });
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
          {filteredEntries.length} events
          {routeFilter !== "all" ? ` | ${routeFilter}` : ""}
          {searchTerm ? ` | filtered` : ""}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {onSearchChange && (
            <input
              className="search-input"
              placeholder="filter events…"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ width: 180 }}
            />
          )}
          {onTogglePause && (
            <button className="btn" onClick={onTogglePause}>
              {paused ? "▶ resume" : "⏸ pause"}
            </button>
          )}
          {onClearLog && (
            <button className="btn" onClick={onClearLog}>
              clear
            </button>
          )}
          <button className="btn" onClick={onToggleExpanded}>
            {expanded ? "⬇ shrink" : "⬆ expand"}
          </button>
        </div>
      </div>

      <div className="timeline-scroll">
        {filteredEntries.map((entry) => (
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

        {filteredEntries.length === 0 && (
          <div className="empty">
            {searchTerm ? "No matching events" : "No events yet"}
          </div>
        )}
      </div>
    </div>
  );
};
