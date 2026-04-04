import type { DiagnosticSnapshot } from "../types";

interface AlertStripsProps {
  diagnostics: DiagnosticSnapshot;
  onDismiss: (kind: "param" | "duplicate" | "stalled") => void;
  hidden: Record<"param" | "duplicate" | "stalled", boolean>;
}

export function AlertStrips({
  diagnostics,
  onDismiss,
  hidden,
}: AlertStripsProps) {
  return (
    <div className="alert-stack">
      {diagnostics.paramMismatches.length > 0 && !hidden.param && (
        <div className="alert-strip purple">
          <strong>⊛ Param mismatch</strong>
          <span>
            /api/compliance/findings uses auditId in SWR but audit in useEffect.
            API returns 400 on the SWR call.
          </span>
          <button className="alert-dismiss" onClick={() => onDismiss("param")}>
            ×
          </button>
        </div>
      )}

      {diagnostics.duplicateFetchRoutes.length > 0 && !hidden.duplicate && (
        <div className="alert-strip orange">
          <strong>⧉ Duplicate</strong>
          <span>
            /api/compliance/findings is fired by both SWR and useEffect on the
            selected page. Remove one.
          </span>
          <button
            className="alert-dismiss"
            onClick={() => onDismiss("duplicate")}
          >
            ×
          </button>
        </div>
      )}

      {diagnostics.stalledKeys.length > 0 && !hidden.stalled && (
        <div className="alert-strip red">
          <strong>⚠ Stalled</strong>
          <span>
            A hook has been in-flight for more than 5s. Check for heavy renders
            or blocked upstream work.
          </span>
          <button
            className="alert-dismiss"
            onClick={() => onDismiss("stalled")}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
