import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { hooksLensStore } from "../utils/store";

export interface HooksLensOptions {
  /** The display name shown in the hookslens panel e.g. 'useAssessments' */
  name: string;
  /**
   * Optional description shown in the panel — good place to note
   * what data this hook fetches and what params it expects.
   * e.g. 'Fetches assessment list for the current teacher. Requires assessmentId param.'
   */
  description?: string;
  /**
   * The underlying fetch URL or SWR key this hook uses.
   * Connects the custom hook name to the fetch event in the timeline.
   * e.g. '/api/assessments' or '/api/feedback?assessmentId=...'
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
 * // hooks/useAssessments.ts
 * export function useAssessments(assessmentId: string) {
 *   useHooksLens({
 *     name: 'useAssessments',
 *     description: 'Fetches assessment list. Expects assessmentId (not assessment).',
 *     fetchKey: `/api/assessments?assessmentId=${assessmentId}`,
 *   });
 *
 *   return useSWR(`/api/assessments?assessmentId=${assessmentId}`, fetcher);
 * }
 *
 * @example
 * // hooks/useSubmissions.ts — a useEffect-based hook (not SWR)
 * export function useSubmissions(submissionId: string) {
 *   useHooksLens({
 *     name: 'useSubmissions',
 *     description: 'Legacy useEffect fetch — pending SWR migration.',
 *     fetchKey: `/api/submissions/${submissionId}`,
 *     custom: true,
 *   });
 *
 *   const [data, setData] = useState(null);
 *   useEffect(() => {
 *     fetch(`/api/submissions/${submissionId}`).then(r => r.json()).then(setData);
 *   }, [submissionId]);
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
