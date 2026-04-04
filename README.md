# hookslens

[![GitHub Repo](https://img.shields.io/badge/repo-riordanalfredo%2Fhookslens-181717?logo=github)](https://github.com/riordanalfredo/hookslens)
[![License](https://img.shields.io/github/license/riordanalfredo/hookslens)](./LICENSE)

Developer panel for SWR and fetch behaviour in Next.js apps.

Open `/__hookslens` in development to inspect:

- active hook keys and instance counts
- route-level filtering
- polling hooks
- in-flight hooks
- timeline events (including flagged duplicates/mismatches)
- connection status and diagnostics badges

## What You Actually Get Today

The current panel UI:

- Topbar with theme toggle, live connection state, and diagnostic pills
- Sidebar with stats grid and route navigation
- Registry table for hook status, instances, polling interval, and last fetch timing
- Timeline panel with flagged events and route filtering

Theme mode is persisted in `localStorage`.

## Current Architecture

```text
packages/hookslens/src/
  app/__hookslens/
    page.tsx
    panel.css
    components/
      Topbar.tsx
      Sidebar.tsx
      HooksTable.tsx
      TimelinePanel.tsx
    hooks/
      useInsightSnapshot.ts
    lib/
      format.ts
    api/
      hooks/route.ts
      stream/route.ts
  utils/
    store.ts
    middleware.ts
    fetchObserver.ts
  hooks/
    useHooksLens.ts
```

## Fastest Integration (Copy Template)

Generate a copy-ready template from this repo:

```bash
cd packages/hookslens/src
npm install
npm run build:copy-template
```

This produces:

```text
packages/hookslens/src/dist/local-copy-template/
  src/
    lib/hookslens/
    app/__hookslens/
```

Then copy the generated `src/` subtree into your target Next.js app `src/`.

## Required App Wiring

In your app SWR provider, add middleware and fetch observer in development:

```tsx
"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";
import { hooksLensMiddleware } from "@/lib/hookslens/middleware";
import { installFetchObserver } from "@/lib/hookslens/fetchObserver";

const swrUse =
  process.env.NODE_ENV === "development" ? [hooksLensMiddleware] : [];

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    installFetchObserver();
  }, []);

  return <SWRConfig value={{ use: swrUse }}>{children}</SWRConfig>;
}
```

Then open:

```text
http://localhost:3000/__hookslens
```

## Optional: Register Named Custom Hooks

```ts
import { useHooksLens } from "@/lib/hookslens/useHooksLens";

useHooksLens({
  name: "usePartnerFeedback",
  description: "Fetches partner feedback",
  fetchKey: `/api/feedback?assessmentId=${assessmentId}`,
});
```

## Dev-Only Safety

The panel and instrumentation are intended for development usage:

- conditionally enable middleware only in development
- only install fetch observer in development
- keep `__hookslens` routes available in development environments

## Scripts

From repo root:

```bash
npm install
npm run dev
npm run build
```

From `packages/hookslens/src`:

```bash
npm run dev
npm run build
npm run build:copy-template
```

## Contributing

Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)

## License

License text: [LICENSE](LICENSE)
