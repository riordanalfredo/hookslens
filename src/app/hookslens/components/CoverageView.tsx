import type { RouteCoverage } from "@/lib/hookslens/store";

import type { DiagnosticSnapshot } from "../types";

interface CoverageViewProps {
  routeCoverage: RouteCoverage[];
  diagnostics: DiagnosticSnapshot;
}

export function CoverageView({
  routeCoverage,
  diagnostics,
}: CoverageViewProps) {
  return (
    <div className="cov-grid">
      <section className="cov-card">
        <div className="cov-card-header">
          <div className="cov-card-title">SWR Coverage by Page</div>
          <span className="muted tiny">% via SWR</span>
        </div>
        {routeCoverage.length === 0 ? (
          <div className="cov-empty">No coverage data yet</div>
        ) : (
          routeCoverage.map((coverage) => (
            <div key={coverage.route} className="cov-row">
              <div className="cov-key">{coverage.route}</div>
              <div className="cov-bar-track">
                <div
                  className="cov-bar"
                  style={{
                    width: `${coverage.coveragePct}%`,
                    background:
                      coverage.coveragePct >= 75
                        ? "var(--green)"
                        : coverage.coveragePct >= 50
                          ? "var(--yellow)"
                          : "var(--red)",
                  }}
                />
              </div>
              <span className="cov-pct">{coverage.coveragePct}%</span>
            </div>
          ))
        )}
      </section>

      <section className="cov-card">
        <div className="cov-card-header">
          <div className="cov-card-title">⧉ Duplicate Fetches</div>
          <span className="muted tiny">same URL — SWR + useEffect</span>
        </div>
        {diagnostics.duplicateFetchRoutes.length === 0 ? (
          <div className="cov-empty">None found</div>
        ) : (
          diagnostics.duplicateFetchRoutes.map((route) => (
            <div key={route.route} className="cov-block">
              <div className="cov-block-title">{route.route}</div>
              {route.duplicateUrls.map((url) => (
                <div key={url} className="cov-row cov-row-list">
                  <span className="badge badge-dup">⧉</span>
                  <span className="cov-key cov-key-wrap">{url}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </section>

      <section className="cov-card">
        <div className="cov-card-header">
          <div className="cov-card-title">⊛ Inconsistent Params</div>
          <span className="muted tiny">same endpoint, diff keys</span>
        </div>
        {diagnostics.paramMismatches.length === 0 ? (
          <div className="cov-empty">None found</div>
        ) : (
          diagnostics.paramMismatches.map((mismatch) => (
            <div key={mismatch.id} className="cov-row cov-row-list">
              <div className="cov-key">{mismatch.endpoint}</div>
              <span className="badge badge-mismatch">
                ⊛ {mismatch.occurrences}
              </span>
            </div>
          ))
        )}
      </section>

      <section className="cov-card">
        <div className="cov-card-header">
          <div className="cov-card-title">Unmigrated Pages</div>
          <span className="muted tiny">0% SWR, all useEffect</span>
        </div>
        {diagnostics.effectOnlyRoutes.length === 0 ? (
          <div className="cov-empty">All pages use SWR</div>
        ) : (
          diagnostics.effectOnlyRoutes.map((route) => (
            <div key={route.route} className="cov-row cov-row-list">
              <div className="cov-key">{route.route}</div>
              <span className="badge badge-effect">
                {route.effectFetches} raw fetches
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
