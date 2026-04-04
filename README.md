# hookslens

[![GitHub Repo](https://img.shields.io/badge/repo-riordanalfredo%2Fhookslens-181717?logo=github)](https://github.com/riordanalfredo/hookslens)
[![License](https://img.shields.io/github/license/riordanalfredo/hookslens)](./LICENSE)

Developer panel for SWR and fetch behaviour in Next.js apps.

Open `/hookslens` in development to inspect:

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
  app/hookslens/
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
  lib/
    hookslens/
      store.ts
      middleware.ts
      fetchObserver.ts
      useHooksLens.ts
```

Short runtime architecture:

```mermaid
flowchart LR
  A[Next.js app route] --> B[SWR hooks]
  A --> C[useEffect or raw fetch]
  B --> D[hooksLensMiddleware]
  C --> E[installFetchObserver wrapper]
  D --> F[hooksLensStore]
  E --> F
  F --> G[Snapshot hook useInsightSnapshot]
  G --> H[/hookslens panel views]
  F <--> I[BroadcastChannel sync]
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

Then open the printed local URL (default: `http://127.0.0.1:5173/` or `http://localhost:5173/`).

## Install From npm (Recommended)

Install in your Next.js app:

```bash
npm i hookslens swr --save-dev
```

You get:

- `hookslens` runtime hooks/instrumentation
- `hookslens/panel` dashboard component for a tiny App Router wrapper page

## 1) Use The Hook Utilities

In your SWR provider, wire middleware + fetch observer:

```tsx
"use client";

import { useEffect, ReactNode } from "react";
import { SWRConfig } from "swr";
import { installFetchObserver, hooksLensMiddleware } from "hookslens";

interface SWRProviderProps {
  children: ReactNode;
}

export const SWRProvider = ({ children }: SWRProviderProps) => {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      installFetchObserver();
    }
  }, []);

  const swrUse =
    process.env.NODE_ENV === "development" ? [hooksLensMiddleware] : [];

  return <SWRConfig value={{ use: swrUse }}>{children}</SWRConfig>;
};
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

## 2) Add the /hookslens Dashboard Route Wrapper

Create a tiny route page in your app:

```tsx
// src/app/hookslens/page.tsx
import HooksLensPanel from "hookslens/panel"; // or import HooksLensPane from "dist/local-lib/src/app/hookslens/page"

export default function Page() {
  return <HooksLensPanel />;
}
```

Then open:

```text
http://localhost:3000/hookslens
```

## Optional: Local Copy Template

Generate a copy-ready template from this repo:

```bash
cd .
npm install
npm run build:local-lib
```

This produces the copy template here:

```text
dist/local-lib/
  src/
    app/hookslens/
      page.jsx
      panel.css
```

Use this only if you prefer copied files instead of the `hookslens/panel` wrapper approach.

## Required App Wiring

In your app SWR provider, add middleware and fetch observer in development:

```tsx
"use client";

import { useEffect, ReactNode } from "react";
import { SWRConfig } from "swr";
import { installFetchObserver, hooksLensMiddleware } from "hookslens";

interface SWRProviderProps {
  children: ReactNode;
}

export const SWRProvider = ({ children }: SWRProviderProps) => {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      installFetchObserver();
    }
  }, []);

  const swrUse =
    process.env.NODE_ENV === "development" ? [hooksLensMiddleware] : [];

  return (
    <SWRConfig
      value={{
        dedupingInterval: 2000,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        keepPreviousData: true,
        use: swrUse,
      }}
    >
      {children}
    </SWRConfig>
  );
};
```

Then open:

```text
http://localhost:3000/hookslens
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
- keep `hookslens` routes available in development environments

## Scripts

From repo root:

```bash
npm install
npm run dev
npm run build
npm run build:local-lib
npm test
npm run test:watch
npm run pack:check
```

The local-lib panel page (`src/app/hookslens/page.jsx`) is auto-generated from
the source panel (`src/app/hookslens/page.tsx`) directly inside
`scripts/build-local-lib.mjs`, so there is no separate UI template file to maintain.

## Testing

Test files live under `src/__tests__/` in this repo:

- `src/__tests__/useHooksLens.test.ts`
- `src/__tests__/fetchObserver.test.ts`
- `src/__tests__/store.test.ts`
- `src/__tests__/middleware.test.ts`

Supported patterns in `package.json`:

- `src/**/__tests__/**/*.{test,spec}.{ts,tsx}`
- `src/**/*.{test,spec}.{ts,tsx}`

Use these commands:

```bash
npm test         # run once (CI/publish-safe)
npm run test:watch
npm run test:ui
```

## Related Tools and Research

This project is inspired by existing React and network debugging ecosystems, while focusing specifically on SWR plus hook-flow visibility in Next.js apps.

Adjacent references:

- React DevTools (components and hooks inspection): https://react.dev/learn/react-developer-tools
- SWR official docs (cache, revalidation, middleware model): https://swr.vercel.app/docs/getting-started
- SWR middleware docs (extension point used by Hookslens): https://swr.vercel.app/docs/middleware
- React `useEffect` reference and troubleshooting notes: https://react.dev/reference/react/useEffect
- Chrome DevTools Network panel (request-level debugging): https://developer.chrome.com/docs/devtools/network
- OpenTelemetry JS (observability patterns for instrumentation): https://opentelemetry.io/docs/languages/js/

What differs in Hookslens:

- Browser/network tools show request outcomes, but not hook registration intent.
- React DevTools shows component and hook snapshots, but not SWR-centric cross-hook fetch flow as a dedicated panel.
- Hookslens is purpose-built for development diagnostics in Next.js + SWR projects, including hook key activity, timeline flags, and route-level debugging context.

## What's Next

The current roadmap is focused on closing the most important debugging gaps:

- Revalidation cause tracing: annotate events with trigger sources (focus, reconnect, interval, mutate, mount, key change) so revalidation no longer looks random.
- Effect trigger context: capture lightweight cause hints for external fetches (for example, route transition, visibility change, user action tags) to better explain useEffect chains.
- Expected hook baseline checks: allow teams to define expected hook presence per route and flag missing hooks after refactors.
- CI-safe regression summary: export diagnostics snapshots for PR checks so unexpected hook disappearance and duplicate patterns can be reviewed before merge.

## Known Limitations

- Development-only design: instrumentation is intended for local/staging diagnostics, not production telemetry.
- Causality depth: current timeline shows sequence and overlap, but not full dependency-cause graphs for every effect.
- Browser API dependency: cross-tab sync relies on BroadcastChannel and gracefully degrades when unavailable.
- Client fetch focus: observer tracks browser fetch calls; server-side data access patterns are not fully represented in the panel.
- Manual baseline today: missing hook detection is currently visual/observational unless you add project-specific assertions.

## When Not to Use Hookslens

- You need production-grade distributed tracing across backend services.
- Your app is not Next.js and does not use SWR-driven client data flows.
- You are profiling rendering performance only (React Profiler is a better first tool).
- You need zero runtime instrumentation even in development environments.
- Your debugging target is server actions, server components, or non-fetch transports only (for example GraphQL over custom clients without fetch).

## Contributing

Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)

## GenAI Disclosure

Parts of this project were developed with assistance from generative AI tools, including Claude.

## License

License text: [LICENSE](LICENSE)
