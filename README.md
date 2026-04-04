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
src/
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

## Demo

A standalone mock demo is included in [hookslens-demo.jsx](./demo/hookslens-demo.jsx).

Use it when you want to preview the panel UX quickly without wiring SWR middleware or Next.js routes yet.

Notes:

- It is static/mock data for UI exploration, not connected to your runtime fetch/store.
- Current sample scenarios are healthcare compliance focused (mismatch, duplicate fetch, stalled polling).
- You can open it in any React sandbox or local React app page/component to preview interactions.

Run it locally from this repo:

```bash
npm install
npm run demo
```

Then open the printed local URL (default: `http://127.0.0.1:5173/`).

## Install From npm (Recommended)

Install in your Next.js app:

```bash
npm i hookslens swr
```

You get two integration layers:

- `hookslens` runtime hooks/instrumentation (import directly from package)
- `/__hookslens` panel files (copy template from package into your app)

## 1) Use The Hook Utilities

In your SWR provider, wire middleware + fetch observer:

```tsx
"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";
import { hooksLensMiddleware, installFetchObserver } from "hookslens";

const swrUse =
  process.env.NODE_ENV === "development" ? [hooksLensMiddleware] : [];

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    installFetchObserver();
  }, []);

  return <SWRConfig value={{ use: swrUse }}>{children}</SWRConfig>;
}
```

Optional custom hook registration:

```ts
import { useHooksLens } from "hookslens";

useHooksLens({
  name: "useComplianceFindings",
  description: "Fetches compliance findings by auditId",
  fetchKey: `/api/compliance/findings?auditId=${auditId}`,
});
```

## 2) Add The /\_\_hookslens Page

The npm package ships a copy template under `dist/local-lib`.

Copy it into your app's `src/`:

```bash
cp -R node_modules/hookslens/dist/local-lib/src/* ./src/
```

That adds:

- `src/app/__hookslens/page.tsx`
- `src/app/__hookslens/api/hooks/route.ts`
- `src/app/__hookslens/api/stream/route.ts`
- supporting panel UI files

Then open:

```text
http://localhost:3000/__hookslens
```

## Fastest Integration (Local Repo)

Generate a copy-ready template from this repo:

```bash
cd .
npm install
npm run build:copy-template
```

This produces:

```text
dist/local-lib/
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
import { hooksLensMiddleware, installFetchObserver } from "hookslens";

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
import { useHooksLens } from "hookslens";

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
npm run build:copy-template
npm test
npm run test:watch
npm run pack:check
```

## Testing

Test files live under `src/__tests__/` in this repo:

- `src/__tests__/useHooksLens.test.ts`
- `src/__tests__/fetchObserver.test.ts`
- `src/__tests__/store.test.ts`

Supported patterns in `package.json`:

- `src/**/__tests__/**/*.{test,spec}.{ts,tsx}`
- `src/**/*.{test,spec}.{ts,tsx}`

Use these commands:

```bash
npm test         # run once (CI/publish-safe)
npm run test:watch
npm run test:ui
```

## Contributing

Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)

## License

License text: [LICENSE](LICENSE)
