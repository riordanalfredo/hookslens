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

## GenAI Disclosure

Parts of this project were developed with assistance from generative AI tools, including Claude.

## License

License text: [LICENSE](LICENSE)
