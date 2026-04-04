# hookslens — Integration Guide

Everything you need to add or change to wire hookslens into your existing
Next.js App Router project. Zero changes to your business logic required.

---

## Repo structure (complete)

```
hookslens/
├── package.json
└── src/
    ├── index.ts                      ← public exports
    ├── hooks/
    │   └── useHooksLens.ts           ← register custom hooks (optional per hook)
    ├── utils/
    │   ├── store.ts                  ← central event store
    │   ├── middleware.ts             ← SWR middleware (intercepts all useSWR)
    │   └── fetchObserver.ts          ← wraps window.fetch (catches useEffect fetches)
    └── app/
        └── hookslens/
            ├── page.tsx              ← the panel UI (served at /hookslens)
            └── api/
                ├── hooks/route.ts    ← JSON snapshot endpoint
                └── stream/route.ts   ← SSE live-push endpoint
```

---

## Option A — Install from npm (recommended)

Install in your app:

```bash
npm i hookslens swr
```

Wire runtime instrumentation:

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

Add the panel route by copying template files shipped in the package:

```bash
cp -R node_modules/hookslens/dist/local-lib/src/* ./src/
```

That creates/updates `src/app/hookslens/*` and `src/lib/hookslens/*` in your app.

---

## Option B — Local repository copy template

Recommended (copy-ready bundle):

```bash
cd .
npm run build:local-lib
```

This generates:

```
dist/local-lib/
└── src/
  ├── lib/hookslens/
  │   ├── store.ts
  │   ├── middleware.ts
  │   ├── fetchObserver.ts
  │   └── useHooksLens.ts
  └── app/hookslens/
    ├── page.tsx
    ├── panel.css
    ├── types.ts
    ├── components/*
    ├── hooks/*
    ├── lib/*
    └── api/
      ├── hooks/route.ts
      └── stream/route.ts
```

Copy the generated `src/` into your app `src/` (merge folders).

---

## Changes to your existing files

### 1. `src/app/providers.tsx` (or wherever your SWRConfig lives)

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
import { useEffect } from "react";
import { SWRConfig } from "swr";
import { hooksLensMiddleware, installFetchObserver } from "hookslens";

// Zero cost in production — both are no-ops when NODE_ENV !== 'development'
const swrUse =
  process.env.NODE_ENV === "development" ? [hooksLensMiddleware] : [];

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Wraps window.fetch to catch useEffect fetches and legacy SSR patterns
    installFetchObserver();
  }, []);

  return (
    <SWRConfig value={{ use: swrUse /* your existing config */ }}>
      {children}
    </SWRConfig>
  );
}
```

That's it. Navigate to `http://localhost:3000/hookslens` and you'll see all
your SWR hooks and useEffect fetches immediately.

---

### 2. Your custom hooks (optional but recommended)

For any custom hook you want named in the panel, add one `useHooksLens` call.
Without it, the hook still appears via its SWR key — you just lose the human name.

**Before:**

```ts
// src/hooks/usePartnerFeedback.ts
export function usePartnerFeedback(assessmentId: string, questionId: string) {
  return useSWR(["/api/feedback", { assessmentId, questionId }], fetcher);
}
```

**After:**

```ts
// src/hooks/usePartnerFeedback.ts
import { useHooksLens } from "hookslens";

export function usePartnerFeedback(assessmentId: string, questionId: string) {
  // dev-only, no-op in production
  useHooksLens({
    name: "usePartnerFeedback",
    description:
      "Fetches partner feedback. Expects assessmentId and questionId params.",
    fetchKey: `/api/feedback?assessmentId=${assessmentId}&questionId=${questionId}`,
  });

  return useSWR(["/api/feedback", { assessmentId, questionId }], fetcher);
}
```

**For legacy useEffect hooks** (migration candidates):

```ts
// src/hooks/useLoadCompleteSubmission.ts
import { useHooksLens } from "hookslens";

export function useLoadCompleteSubmission(submissionId: string) {
  useHooksLens({
    name: "useLoadCompleteSubmission",
    description: "Legacy useEffect fetch — pending SWR migration.",
    fetchKey: `/api/submissions/${submissionId}`,
    custom: true,
  });

  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`/api/submissions/${submissionId}`)
      .then((r) => r.json())
      .then(setData);
  }, [submissionId]);

  return data;
}
```

---

### 3. Theme preference (panel-side only)

The theme toggle is built into the panel UI. Users click "🌙 Dark mode" / "☀️ Light
mode" in the top-right corner. No code change needed in your app.

If you want to persist the preference across panel sessions, add to `page.tsx`:

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

## What hookslens catches automatically (no extra code)

| Scenario                                        | How detected                                       |
| ----------------------------------------------- | -------------------------------------------------- |
| `useSWR` hook registered on a page              | `hooksLensMiddleware` via `SWRConfig.use`          |
| `useSWRMutation` triggered                      | Same middleware, `isMutation` flag                 |
| `useEffect + fetch` call                        | `installFetchObserver` wraps `window.fetch`        |
| Slow fetch (>1000ms)                            | Duration tracked in `recordFetchSuccess`           |
| Stalled hook (>5s in-flight)                    | `setTimeout` in `recordFetchStart`                 |
| 4xx response                                    | HTTP status extracted from error shape             |
| Duplicate fetch (SWR + useEffect, same URL)     | `checkDuplicateFetch` cross-references URL maps    |
| Param mismatch (`assessmentId` vs `assessment`) | `detectParamMismatch` compares query key sets      |
| Per-page hook scoping                           | `usePathname()` captured at middleware render time |

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
- [ ] `/hookslens` API routes return 404 in production
- [ ] `useHooksLens()` returns early when `NODE_ENV !== 'development'`
- [ ] Panel page (`/hookslens/page.tsx`) should be excluded from production bundle

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
