# hookslens — Integration Guide

Monitor all HTTP requests in your Next.js app with real-time visibility into fetch calls, performance, and duplicate requests.

**Core Features:**

- **Fetch Monitoring**: Track all `fetch()` calls, `useEffect` fetches, and API requests
- **Performance Tracking**: Detect slow requests, stalled fetches, and HTTP errors
- **Duplicate Detection**: Find redundant API calls across your app
- **Timeline View**: Visualize request waterfalls and concurrency
- **SWR Enhancement** (optional): Additional insights for SWR hooks (polling, deduplication, cache status)

Zero changes to your business logic required. Development-only tool.

---

## Repo structure (complete)

```
hookslens/
├── package.json
└── src/
    ├── index.ts                      ← public exports
    ├── lib/
    │   └── hookslens/
    │       ├── store.ts              ← central event store + BroadcastChannel sync
    │       ├── middleware.ts         ← SWR middleware (intercepts all useSWR)
    │       ├── fetchObserver.ts      ← wraps window.fetch (catches useEffect fetches)
    │       └── useHooksLens.ts       ← register custom hooks (optional per hook)
    └── app/
        └── hookslens/
            ├── page.tsx              ← source panel UI in this repo
            ├── hooks/useInsightSnapshot.ts  ← reads local store snapshots
            └── lib/format.ts
```

---

## Quick Start Options

### Option A: Fetch Monitoring Only (No SWR Required)

Install and track all fetch calls in your Next.js app:

```bash
npm i hookslens
```

Wire the fetch observer:

```tsx
"use client";
import { useEffect, ReactNode } from "react";
import { installFetchObserver } from "hookslens";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      installFetchObserver();
    }
  }, []);

  return <>{children}</>;
};
```

This gives you:

- All `fetch()` calls tracked in the timeline
- Performance metrics (slow requests, errors)
- Duplicate fetch detection
- Waterfall visualization
- HTTP status monitoring

### Option B: Full SWR Integration (Recommended for SWR users)

Install with SWR for enhanced hook tracking:

```bash
npm i hookslens swr
```

Wire both fetch observer and SWR middleware:

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

Add the panel route with a tiny wrapper page:

```tsx
// src/app/hookslens/page.tsx
"use client";

import HooksLensPanel from "hookslens/panel";

export default function Page() {
  return <HooksLensPanel />;
}
```

This adds SWR-specific features:

- Everything from Option A, plus:
- Hook names and descriptions
- Cache status (fresh/stale/error)
- Polling interval detection
- SWR deduplication tracking
- Mutation monitoring

Then navigate to `http://localhost:3000/hookslens` in your browser.

---

## Option C — Local repository copy (alternative)

Recommended (copy-ready bundle):

```bash
cd .
npm run build:local-lib
```

This generates:

```
dist/local-lib/
└── src/
  └── app/hookslens/
    ├── page.jsx
    ├── panel.css
```

Use this fallback only if you prefer copying files over importing
`hookslens/panel`.

---

## What You Get With and Without SWR

| Feature                    | Without SWR    | With SWR     |
| -------------------------- | -------------- | ------------ |
| Track all `fetch()` calls  | ✅             | ✅           |
| Timeline view              | ✅             | ✅           |
| Slow request detection     | ✅             | ✅           |
| HTTP error tracking        | ✅             | ✅           |
| Duplicate fetch detection  | ✅             | ✅           |
| Waterfall visualization    | ✅             | ✅           |
| Per-route filtering        | ✅             | ✅           |
| Hook names                 | ⚠️ Manual only | ✅ Automatic |
| Cache status (fresh/stale) | ❌             | ✅           |
| Polling detection          | ❌             | ✅           |
| SWR deduplication tracking | ❌             | ✅           |
| Mutation monitoring        | ❌             | ✅           |

**Bottom line:** HooksLens works great for general fetch monitoring without SWR. Adding SWR gives you deeper hook-level insights.

---

## Changes to your existing files

### 1. Add the Fetch Observer

**For non-SWR apps** (or any Next.js app with `fetch` calls):

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

**For SWR apps**:

This is the **only required change** to your business code.

**Before:**

```tsx
"use client";
import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={
        {
          /* your existing config */
        }
      }
    >
      {children}
    </SWRConfig>
  );
}
```

**After:**

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

That's it. Navigate to `http://localhost:3000/hookslens` and you'll see all
your SWR hooks and useEffect fetches immediately.

---

### 2. Your custom hooks (optional but recommended)

For any custom hook you want named in the panel, add one `useHooksLens` call.
Without it, the hook still appears via its SWR key — you just lose the human name.

**Before:**

```ts
// src/hooks/useProductReviews.ts
export function useProductReviews(productId: string, page: number) {
  return useSWR(["/api/reviews", { productId, page }], fetcher);
}
```

**After:**

```ts
// src/hooks/useProductReviews.ts
import { useHooksLens } from "hookslens";

export function useProductReviews(productId: string, page: number) {
  // dev-only, no-op in production
  useHooksLens({
    name: "useProductReviews",
    description:
      "Fetches paginated product reviews. Expects productId and page params.",
    fetchKey: `/api/reviews?productId=${productId}&page=${page}`,
  });

  return useSWR(["/api/reviews", { productId, page }], fetcher);
}
```

**For legacy useEffect hooks** (migration candidates):

```ts
// src/hooks/useCart.ts
import { useHooksLens } from "hookslens";

export function useCart(userId: string) {
  useHooksLens({
    name: "useCart",
    description: "Legacy useEffect fetch — pending SWR migration.",
    fetchKey: `/api/cart/${userId}`,
    custom: true,
  });

  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`/api/cart/${userId}`)
      .then((r) => r.json())
      .then(setData);
  }, [userId]);

  return data;
}
```

---

### 3. Theme preference (panel-side only)

The theme toggle is built into the panel UI. Users click "🌙 Dark mode" / "☀️ Light
mode" in the top-right corner. No code change needed in your app.

If you want to persist the preference across panel sessions, add to `page.jsx`:

```tsx
// In the panel page component — replace useState(false) with:
const [dark, setDark] = useState(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("hookslens-theme") === "dark";
});

// And in the toggle handler:
const toggleTheme = () => {
  setDark((d) => {
    const next = !d;
    localStorage.setItem("hookslens-theme", next ? "dark" : "light");
    return next;
  });
};
```

---

## What hookslens catches automatically

### Core Fetch Monitoring (Works without SWR)

| Scenario                     | How detected                                | Requires SWR? |
| ---------------------------- | ------------------------------------------- | ------------- |
| Any `fetch()` call           | `installFetchObserver` wraps `window.fetch` | ❌ No         |
| Slow fetch (>1000ms)         | Duration tracked on every request           | ❌ No         |
| Stalled request (>5s)        | Timeout detection on in-flight requests     | ❌ No         |
| HTTP errors (4xx, 5xx)       | Status code extracted from response         | ❌ No         |
| Duplicate fetches (same URL) | Cross-reference URL tracking                | ❌ No         |
| Network failures             | Catch block on fetch wrapper                | ❌ No         |
| Request waterfall            | Timestamp tracking for all fetches          | ❌ No         |
| Multi-tab panel sync         | `BroadcastChannel` for cross-tab updates    | ❌ No         |

### SWR-Enhanced Features (Requires SWR)

| Scenario                                  | How detected                                       | Requires SWR? |
| ----------------------------------------- | -------------------------------------------------- | ------------- |
| `useSWR` hook registered                  | `hooksLensMiddleware` via `SWRConfig.use`          | ✅ Yes        |
| `useSWRMutation` triggered                | Same middleware, `isMutation` flag                 | ✅ Yes        |
| Cache status (fresh/stale/error)          | SWR middleware state                               | ✅ Yes        |
| Polling intervals                         | SWR config `refreshInterval` tracking              | ✅ Yes        |
| Param mismatch (`productId` vs `product`) | Compare query keys across SWR and raw fetch        | ✅ Yes        |
| Per-page hook scoping                     | `usePathname()` captured at middleware render time | ✅ Yes        |
| SWR deduplication                         | Middleware intercepts duplicate SWR calls          | ✅ Yes        |

---

## What hookslens does NOT catch

| Scenario                                 | Reason                                | Workaround                                                 |
| ---------------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Server component `fetch()` calls         | Runs server-side only, no client hook | None — use Next.js server logs                             |
| `getServerSideProps` / `getStaticProps`  | Pages Router, server-side             | None                                                       |
| `axios` without fetch polyfill           | Some versions bypass `window.fetch`   | Use `axios` v1+ which uses fetch, or add axios interceptor |
| Custom hook names without `useHooksLens` | No way to infer from SWR key alone    | Add `useHooksLens()` to each custom hook                   |
| Hooks using React Query / TanStack       | Different library                     | Not in scope                                               |

---

## Production safety checklist

- [ ] `hooksLensMiddleware` only added when `NODE_ENV === 'development'`
- [ ] `installFetchObserver()` returns early when `NODE_ENV !== 'development'`
- [ ] `useHooksLens()` returns early when `NODE_ENV !== 'development'`
- [ ] Panel page (`/hookslens/page.jsx`) should be excluded from production bundle

To exclude the panel from production builds, add to `next.config.ts`:

```ts
const nextConfig = {
  // ...
  experimental: {
    // Exclude hookslens panel from production
    outputFileTracingExcludes: {
      "/hookslens": ["./src/app/hookslens/**"],
    },
  },
};
```

Or wrap the route in a middleware redirect:

```ts
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/hookslens") &&
    process.env.NODE_ENV !== "development"
  ) {
    return NextResponse.notFound();
  }
}
```
