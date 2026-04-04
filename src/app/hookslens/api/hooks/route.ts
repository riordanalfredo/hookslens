import { hooksLensStore } from "@/lib/hookslens/store";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(
    {
      hooks: hooksLensStore.getHooks(),
      timeline: hooksLensStore.getTimeline(),
      waterfall: hooksLensStore.getWaterfall(),
      routeCoverage: hooksLensStore.getRouteCoverage(),
      diagnostics: hooksLensStore.getDiagnostics(),
      routes: hooksLensStore.getRoutes(),
      meta: { timestamp: Date.now() },
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
