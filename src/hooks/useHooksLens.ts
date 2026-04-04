import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { hooksLensStore } from "../utils/store";

export interface HooksLensOptions {
  /** The display name shown in the hookslens panel e.g. 'useComplianceFindings' */
  name: string;
  /**
   * Optional description shown in the panel — good place to note
   * what data this hook fetches and what params it expects.
   * e.g. 'Fetches compliance findings for an audit. Requires auditId and controlId.'
   */
  description?: string;
  /**
   * The underlying fetch URL or SWR key this hook uses.
   * Connects the custom hook name to the fetch event in the timeline.
   * e.g. '/api/compliance/findings' or '/api/compliance/evidence?auditId=...'
   */
  fetchKey?: string;
  /**
   * Mark this as a custom hook (not a direct SWR hook).
   * Custom hooks are shown in a separate section in the panel.
   * Default: true
   */
  custom?: boolean;
}

/**
 * useHooksLens — register a custom hook with the hookslens panel.
 *
 * Drop this into the body of any custom hook you want visible in the panel.
 * It is a no-op in production (NODE_ENV check) so there is zero runtime cost.
 *
 * @example
 * // hooks/useComplianceFindings.ts
 * export function useComplianceFindings(auditId: string, controlId: string) {
 *   useHooksLens({
 *     name: 'useComplianceFindings',
 *     description: 'Fetches findings for the active audit and control.',
 *     fetchKey: `/api/compliance/findings?auditId=${auditId}&controlId=${controlId}`,
 *   });
 *
 *   return useSWR(
 *     `/api/compliance/findings?auditId=${auditId}&controlId=${controlId}`,
 *     fetcher,
 *   );
 * }
 *
 * @example
 * // hooks/useAuditEvidence.ts — a useEffect-based hook (not SWR)
 * export function useAuditEvidence(evidencePackId: string) {
 *   useHooksLens({
 *     name: 'useAuditEvidence',
 *     description: 'Legacy useEffect fetch — pending SWR migration.',
 *     fetchKey: `/api/compliance/evidence/${evidencePackId}`,
 *     custom: true,
 *   });
 *
 *   const [data, setData] = useState(null);
 *   useEffect(() => {
 *     fetch(`/api/compliance/evidence/${evidencePackId}`).then(r => r.json()).then(setData);
 *   }, [evidencePackId]);
 *
 *   return data;
 * }
 */
export function useHooksLens(options: HooksLensOptions) {
  const pathname = usePathname() ?? "/";
  const registeredRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (registeredRef.current) return;

    registeredRef.current = true;
    hooksLensStore.registerCustomHook({
      name: options.name,
      description: options.description ?? null,
      fetchKey: options.fetchKey ?? null,
      custom: options.custom ?? true,
      route: pathname,
      registeredAt: Date.now(),
    });

    return () => {
      hooksLensStore.unregisterCustomHook(options.name, pathname);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
