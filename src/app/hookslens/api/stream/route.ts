import { hooksLensStore } from "@/lib/hookslens/store";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function snapshot() {
        return JSON.stringify({
          hooks: hooksLensStore.getHooks(),
          timeline: hooksLensStore.getTimeline(),
          waterfall: hooksLensStore.getWaterfall(),
          routeCoverage: hooksLensStore.getRouteCoverage(),
          diagnostics: hooksLensStore.getDiagnostics(),
          routes: hooksLensStore.getRoutes(),
          meta: { timestamp: Date.now() },
        });
      }

      function push(eventName: string) {
        controller.enqueue(
          encoder.encode(`event: ${eventName}\ndata: ${snapshot()}\n\n`),
        );
      }

      push("snapshot");

      function onHooksUpdated() {
        push("hooks:updated");
      }
      function onTimelineUpdated() {
        push("timeline:updated");
      }

      hooksLensStore.addEventListener("hooks:updated", onHooksUpdated);
      hooksLensStore.addEventListener("timeline:updated", onTimelineUpdated);

      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15_000);

      return () => {
        clearInterval(pingInterval);
        hooksLensStore.removeEventListener("hooks:updated", onHooksUpdated);
        hooksLensStore.removeEventListener(
          "timeline:updated",
          onTimelineUpdated,
        );
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
