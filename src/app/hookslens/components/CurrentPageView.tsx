import type { HookEntry } from "@/lib/hookslens/store";

interface CurrentPageViewProps {
  hooks: HookEntry[];
  routeFilter: string;
}

const statusDotColor = (status: HookEntry["status"]) => {
  if (status === "fresh") return "var(--green)";
  if (status === "fetching") return "var(--accent)";
  if (status === "stalled") return "var(--orange)";
  if (status === "stale") return "var(--yellow)";
  return "var(--red)";
};

const typeLabel = (type: HookEntry["type"]) => {
  return type === "mutation" ? "mutation" : "query";
};

const formatDuration = (duration: number | null) => {
  if (duration == null) return "-";
  return `${duration}ms`;
};

export const CurrentPageView = ({
  hooks,
  routeFilter,
}: CurrentPageViewProps) => {
  const swrHooks = hooks.filter((hook) => hook.type === "query");
  const mutationHooks = hooks.filter((hook) => hook.type === "mutation");
  const slowHooks = hooks.filter((hook) => hook.slowCount > 0);

  return (
    <div className="feature-stack">
      {swrHooks.length > 0 && (
        <section className="hooks-section">
          <div className="hooks-section-title">
            <span className="badge badge-swr">SWR</span>
            SWR Hooks · {swrHooks.length}
          </div>
          {swrHooks.map((hook) => (
            <article
              key={hook.key}
              className={`hook-card ${hook.status === "stalled" || hook.status === "error" ? "flag-error" : hook.badRequestCount > 0 || hook.slowCount > 0 ? "flag-mismatch" : "ok"}`}
            >
              <div className="hook-card-head">
                <div className="hook-card-title-wrap">
                  <div className="hook-card-title">{hook.key}</div>
                  <div className="hook-card-meta">
                    <span className="badge badge-swr">
                      {typeLabel(hook.type)}
                    </span>
                    <span
                      className="badge badge-fresh"
                      style={{
                        background: "var(--green-bg)",
                        color: "var(--green)",
                      }}
                    >
                      <span
                        className="dot"
                        style={{ background: statusDotColor(hook.status) }}
                      />
                      {hook.status}
                    </span>
                    {hook.lastHttpStatus != null && (
                      <span
                        className={`badge ${hook.lastHttpStatus < 300 ? "badge-http-ok" : hook.lastHttpStatus < 400 ? "badge-http-warn" : "badge-http-bad"}`}
                      >
                        {hook.lastHttpStatus}
                      </span>
                    )}
                    {hook.badRequestCount > 0 && (
                      <span className="badge badge-error">
                        4xx ×{hook.badRequestCount}
                      </span>
                    )}
                    {hook.refreshInterval != null && (
                      <span className="badge badge-polling">
                        ⟳ {hook.refreshInterval / 1000}s poll
                      </span>
                    )}
                  </div>
                </div>
                {hook.lastDuration != null && (
                  <div
                    className={`duration ${hook.lastDuration < 150 ? "fast" : hook.lastDuration < 500 ? "med" : "slow"}`}
                  >
                    {formatDuration(hook.lastDuration)}
                  </div>
                )}
              </div>
              <div className="hook-card-body">
                <div className="hook-desc">
                  {hook.instances} instance{hook.instances === 1 ? "" : "s"} ·
                  last fetch{" "}
                  {hook.lastFetchedAt
                    ? new Date(hook.lastFetchedAt).toLocaleTimeString()
                    : "-"}
                </div>
                {hook.lastUrl && (
                  <div className="hook-key-wrap">{hook.lastUrl}</div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {mutationHooks.length > 0 && (
        <section className="hooks-section">
          <div className="hooks-section-title">
            <span className="badge badge-mutation">mutation</span>
            Mutations · {mutationHooks.length}
          </div>
          {mutationHooks.map((hook) => (
            <article key={hook.key} className="hook-card ok">
              <div className="hook-card-head">
                <div className="hook-card-title-wrap">
                  <div className="hook-card-title">{hook.key}</div>
                  <div className="hook-card-meta">
                    <span className="badge badge-mutation">mutation</span>
                    <span
                      className="badge badge-fresh"
                      style={{
                        background: "var(--green-bg)",
                        color: "var(--green)",
                      }}
                    >
                      <span
                        className="dot"
                        style={{ background: statusDotColor(hook.status) }}
                      />
                      {hook.status}
                    </span>
                  </div>
                </div>
                {hook.lastDuration != null && (
                  <div
                    className={`duration ${hook.lastDuration < 150 ? "fast" : hook.lastDuration < 500 ? "med" : "slow"}`}
                  >
                    {formatDuration(hook.lastDuration)}
                  </div>
                )}
              </div>
              <div className="hook-card-body">
                <div className="hook-desc">
                  {hook.instances} instance{hook.instances === 1 ? "" : "s"}
                </div>
                {hook.lastUrl && (
                  <div className="hook-key-wrap">{hook.lastUrl}</div>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {hooks.length === 0 && (
        <div className="empty-panel">No hooks on this page</div>
      )}
    </div>
  );
};
