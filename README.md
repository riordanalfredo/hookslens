<div align="center">

# 🔍 HooksLens

**Monitor fetch requests AND hook intent in Next.js apps — catch mismatches other tools miss**

[![GitHub Repo](https://img.shields.io/badge/repo-riordanalfredo%2Fhookslens-181717?logo=github)](https://github.com/riordanalfredo/hookslens)
[![NPM Version](https://img.shields.io/npm/v/hookslens?logo=npm)](https://www.npmjs.com/package/hookslens)
[![License](https://img.shields.io/github/license/riordanalfredo/hookslens)](./LICENSE)
[![Demo](https://img.shields.io/badge/demo-live-success?logo=vercel)](https://riordanalfredo.github.io/hookslens/)

[Demo](https://riordanalfredo.github.io/hookslens/) • [Installation](#installation) • [Documentation](#quick-start) • [Case Studies](docs/case-studies.md) • [Contributing](CONTRIBUTING.md)

</div>

---

<div align="center">

![HooksLens Dashboard Demo](./hookslens-demo.gif)

_Track what hooks you registered AND what fetches actually fired — see the full picture_

</div>

## 💡 Why HooksLens?

**Other tools show you network requests. HooksLens shows you the story behind them.**

Chrome DevTools shows _what_ fetched. HooksLens shows _what hook registered_, _what it expected_, and _what actually happened_ — then flags the mismatches.

### The Problem HooksLens Solves

You refactor a hook to use `productId` instead of `product`. Your API returns 400. Chrome DevTools shows the failed request. **HooksLens shows you registered `useProduct` expecting `productId`, but the fetch sent `product`** — instant root cause.

Open `/hookslens` in development to access:

### Core Monitoring (Works Standalone)

- **Fetch Tracking** – Monitor all HTTP requests, `useEffect` fetches, and API calls
- **Performance Detection** – Automatically flag slow (>1s) and stalled (>5s) requests
- **Duplicate Detection** – Find redundant API calls across your app
- **Error Monitoring** – Track 4xx/5xx responses and network failures
- **Timeline View** – Visualize request waterfalls and concurrency
- **Route Filtering** – Focus on specific Next.js routes

### Hook Intent Tracking (With SWR)

- **Hook Registry** – See which hooks registered (names, descriptions, expected parameters)
- **Intent vs Reality** – Compare what hooks expected vs what actually fetched
- **Mismatch Detection** – Auto-flag parameter mismatches (`productId` vs `product`)
- **Polling Detection** – Identify hooks with `refreshInterval` configured
- **Cache Status** – Monitor fresh/stale/error states per hook
- **Mutation Tracking** – Monitor `useSWRMutation` calls

---

## 🎨 What's Inside

The HooksLens dashboard/panel includes:

| Component          | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| **Topbar**         | Theme toggle, live connection state, diagnostic indicators    |
| **Sidebar**        | Statistics grid and route navigation                          |
| **Registry Table** | Hook status, instance counts, polling intervals, fetch timing |
| **Timeline Panel** | Event visualization with filtering and flagged patterns       |

> **Note:** Theme preferences are automatically persisted in `localStorage`.

---

## 🏗️ Architecture

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

### Runtime Flow

```mermaid
flowchart LR
  A[Next.js app route] --> B[SWR hooks]
  A --> C[useEffect or raw fetch]
  B --> D[hooksLensMiddleware]
  C --> E[installFetchObserver wrapper]
  D --> F[hooksLensStore]
  E --> F
  F --> G[Snapshot hook useInsightSnapshot]
  G --> H[hookslens panel views]
  F <--> I[BroadcastChannel sync]
```

---

## 🚀 Demo

<div align="center">

### **[View Live Demo →](https://riordanalfredo.github.io/hookslens/)**

</div>

A standalone mock demo is included in [hookslens-demo.jsx](./demo/hookslens-demo.jsx) for quick UI exploration.

**Demo Features:**

- Static mock data for UI preview (not connected to runtime)
- Common SWR debugging scenarios: parameter mismatches, duplicate fetches, stalled polling, concurrent requests
- Works in any React sandbox or local React app

> **Note:** The demo currently includes placeholder data. The patterns shown (duplicates, mismatches, stalling) apply to any Next.js + SWR application.

**Run locally:**

```bash
npm install
npm run demo
```

Then open the printed local URL (default: `http://127.0.0.1:5173/` or `http://localhost:5173/`).

---

## 📦 Installation

```bash
npm i hookslens --save-dev
```

**What's included:**

- `installFetchObserver()` – Tracks all `fetch()` calls (works standalone)
- `hooksLensMiddleware` – SWR middleware (optional, for SWR users)
- `hookslens/panel` – Dashboard component for Next.js App Router

---

## 🔧 Quick Start

Choose the setup that matches your stack:

### Option A: Fetch Monitoring Only (No SWR)

Perfect for Next.js apps using `fetch`, `useEffect`, or any HTTP library.

**Step 1:** Install the fetch observer

```tsx
// src/app/providers.tsx
"use client";

import { useEffect } from "react";
import { installFetchObserver } from "hookslens";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      installFetchObserver();
    }
  }, []);

  return <>{children}</>;
}
```

**Step 2:** Add the dashboard route

```tsx
// src/app/hookslens/page.tsx
"use client";

import HooksLensPanel from "hookslens/panel";

export default function Page() {
  if (process.env.NODE_ENV !== "development") return null;
  return <HooksLensPanel />;
}
```

Done! Navigate to `/hookslens` to see all your fetch calls.

---

### Option B: Full SWR Integration

Includes everything from Option A plus SWR-specific features.

**Step 1:** Wire both fetch observer and SWR middleware

```tsx
// src/app/providers.tsx
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

**Optional:** Label custom hooks for better tracking:

```ts
import { useHooksLens } from "hookslens";

export function useProductReviews(productId: string) {
  useHooksLens({
    name: "useProductReviews",
    description: "Fetches paginated product reviews",
    fetchKey: `/api/reviews?productId=${productId}`,
  });

  return useSWR(["/api/reviews", { productId }], fetcher);
}
```

**Step 2:** Add the dashboard route

```tsx
// src/app/hookslens/page.tsx
"use client";

import HooksLensPanel from "hookslens/panel";

export default function Page() {
  if (process.env.NODE_ENV !== "development") return null;
  return <HooksLensPanel />;
}
```

Done! Navigate to `/hookslens` to see all your fetch calls.

---

### Option B: Full SWR Integration

Includes everything from Option A plus SWR-specific features.

**Step 1:** Wire both fetch observer and SWR middleware

```tsx
// src/app/providers.tsx
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

**Optional:** Label custom hooks for better tracking:

```ts
import { useHooksLens } from "hookslens";

export function useProductReviews(productId: string) {
  useHooksLens({
    name: "useProductReviews",
    description: "Fetches paginated product reviews",
    fetchKey: `/api/reviews?productId=${productId}`,
  });

  return useSWR(["/api/reviews", { productId }], fetcher);
}
```

### Step 2: Add Dashboard Route

Create the HooksLens panel route in your app:

```tsx
// src/app/hookslens/page.tsx

import HooksLensPanel from "hookslens/panel";
// OR do this: import HooksLensPanel from "dist/local-lib/src/app/hookslens/page"

export default function Page() {
  return <HooksLensPanel />;
}
```

Then open:

```text
http://localhost:3000/hookslens
```

> **💡 Best Practice:** HooksLens is designed for development use only:
>
> - Enable middleware conditionally in development
> - Install fetch observer only in development
> - Keep `/hookslens` routes restricted to development environments

---

## 🛠️ Development Scripts

**Available commands:**

```bash
npm install
npm run dev
npm run build
npm run build:local-lib
npm test
npm run test:watch
npm run pack:check
```

> **Note:** The local-lib panel page is auto-generated from source files via `scripts/build-local-lib.mjs`.

---

## 🧪 Testing

**Test coverage includes:**

- `useHooksLens.test.ts` – Hook registration and lifecycle
- `fetchObserver.test.ts` – Fetch interception logic
- `store.test.ts` – State management
- `middleware.test.ts` – SWR middleware integration

**Supported patterns:**

```
src/**/__tests__/**/*.{test,spec}.{ts,tsx}
src/**/*.{test,spec}.{ts,tsx}
```

**Commands:**

```bash
npm test              # Run once (CI/publish-safe)
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
```

---

## 🔗 Related Tools & Research

HooksLens builds upon the React and network debugging ecosystem with real-time fetch monitoring for Next.js apps.

**Complementary tools:**
| Tool | Focus | Link |
|------|-------|------|
| **React DevTools** | Component & hooks inspection | [docs](https://react.dev/learn/react-developer-tools) |
| **Chrome DevTools** | Network request debugging | [docs](https://developer.chrome.com/docs/devtools/network) |
| **SWR** | Cache & revalidation | [docs](https://swr.vercel.app/docs/getting-started) |
| **SWR Middleware** | Extension point (used by HooksLens) | [docs](https://swr.vercel.app/docs/middleware) |
| **OpenTelemetry JS** | Observability patterns | [docs](https://opentelemetry.io/docs/languages/js/) |

**What makes HooksLens unique:**

- 🔍 Monitors **all** fetch calls, not just network panel snapshots
- 🎯 Shows hook registration **intent** alongside request outcomes (with SWR)
- 🛣️ Route-level debugging context for Next.js apps
- ⏱️ Timeline visualization with duplicate/mismatch detection

---

## ⚠️ Known Limitations

| Limitation                 | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Development-only**       | Designed for local/staging diagnostics, not production telemetry             |
| **Causality depth**        | Shows sequence and overlap, not full dependency-cause graphs                 |
| **Browser API dependency** | Cross-tab sync uses BroadcastChannel (graceful degradation when unavailable) |
| **Client-side focus**      | Tracks browser fetch calls; server-side patterns not fully represented       |
| **Manual baseline**        | Missing hook detection is visual/observational without custom assertions     |

### When NOT to Use HooksLens

HooksLens may not be the right tool if you need:

- ❌ Production-grade distributed tracing across backend services
- ❌ Support for non-Next.js frameworks (designed for Next.js App Router)
- ❌ Rendering performance profiling (use React Profiler instead)
- ❌ Zero runtime instrumentation in development
- ❌ Debugging server actions, server components, or non-fetch transports (e.g., GraphQL over custom clients)

---

## 🗺️ Roadmap

Our focus is on closing critical debugging gaps:

- [ ] **Revalidation Cause Tracing**
      Annotate events with trigger sources (focus, reconnect, interval, mutate, mount, key change)

- [ ] **Effect Trigger Context**
      Capture lightweight cause hints for external fetches (route transitions, visibility changes, user actions)

- [ ] **Expected Hook Baseline Checks**
      Define expected hook presence per route and flag missing hooks after refactors

- [ ] **CI-Safe Regression Summary**
      Export diagnostics snapshots for PR checks to catch unexpected hook disappearance and duplicate patterns

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

---

## 🤖 GenAI Disclosure

Parts of this project were developed with assistance from generative AI tools, including Claude.

---

<div align="center">

**[⬆ Back to Top](#-hookslens)**

</div>
