import type { DiagnosticSnapshot } from "../types";

interface ParamInspectorViewProps {
  diagnostics: DiagnosticSnapshot;
}

export function ParamInspectorView({ diagnostics }: ParamInspectorViewProps) {
  if (diagnostics.paramMismatches.length === 0) {
    return <div className="empty-panel">No param mismatches found</div>;
  }

  return (
    <div className="feature-stack">
      <p className="feature-copy">
        Endpoints called with inconsistent param key names. This catches silent
        400s when the API expects one shape and receives another.
      </p>

      {diagnostics.paramMismatches.map((mismatch) => (
        <section key={mismatch.id} className="pi-card">
          <div className="pi-header">
            <span className="mono pi-endpoint">{mismatch.endpoint}</span>
            <span className="badge badge-mismatch">
              ⊛ {mismatch.occurrences} mismatched calls
            </span>
          </div>
          <div className="pi-body">
            <div className="pi-shapes">
              {mismatch.seenParamSets.map((set, index) => (
                <div
                  key={`${mismatch.id}-${index}`}
                  className={`pi-shape shape-${index % 2 === 0 ? "a" : "b"}`}
                >
                  <div className="pi-shape-label">Shape {index + 1}</div>
                  <div className="pi-shape-keys">
                    {set.map((key) => (
                      <span key={key} className="pi-key">
                        {key}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pi-examples-label">Example URLs</div>
            {mismatch.exampleUrls.map((url) => (
              <div key={url} className="pi-example">
                {url}
              </div>
            ))}

            <div className="pi-fix">
              Standardise the param shape to whichever the API route handler
              expects, then update all call sites to match.
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
