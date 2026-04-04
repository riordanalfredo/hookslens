import { insightStore } from "../../../../utils/store";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(
    {
      hooks: insightStore.getHooks(),
      timeline: insightStore.getTimeline(),
      waterfall: insightStore.getWaterfall(),
      routeCoverage: insightStore.getRouteCoverage(),
      diagnostics: insightStore.getDiagnostics(),
      routes: insightStore.getRoutes(),
      meta: { timestamp: Date.now() },
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
