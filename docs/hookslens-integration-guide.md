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

## Option A — Install from npm (recommended)

Install in your app:

```bash
npm i hookslens swr
```

Wire runtime instrumentation:

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

Then navigate to `http://localhost:3000/hookslens`.

---

## Option B — Local repository copy template (fallback)

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

That's it. Navigate to `http://localhost:3000/hookslens` and you'll see all
your SWR hooks and useEffect fetches immediately.

---

### 2. Your custom hooks (optional but recommended)

For any custom hook you want named in the panel, add one `useHooksLens` call.
Without it, the hook still appears via its SWR key — you just lose the human name.

**Before:**

```ts
// src/hooks/useComplianceFindings.ts
export function useComplianceFindings(auditId: string, controlId: string) {
  return useSWR(["/api/compliance/findings", { auditId, controlId }], fetcher);
}
```

**After:**

```ts
// src/hooks/useComplianceFindings.ts
import { useHooksLens } from "hookslens";

export function useComplianceFindings(auditId: string, controlId: string) {
  // dev-only, no-op in production
  useHooksLens({
    name: "useComplianceFindings",
    description:
      "Fetches compliance findings. Expects auditId and controlId params.",
    fetchKey: `/api/compliance/findings?auditId=${auditId}&controlId=${controlId}`,
  });

  return useSWR(["/api/compliance/findings", { auditId, controlId }], fetcher);
}
```

**For legacy useEffect hooks** (migration candidates):

```ts
// src/hooks/useLoadRemediationPlan.ts
import { useHooksLens } from "hookslens";

export function useLoadRemediationPlan(planId: string) {
  useHooksLens({
    name: "useLoadRemediationPlan",
    description: "Legacy useEffect fetch — pending SWR migration.",
    fetchKey: `/api/compliance/remediation-plans/${planId}`,
    custom: true,
  });

  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`/api/compliance/remediation-plans/${planId}`)
      .then((r) => r.json())
      .then(setData);
  }, [planId]);

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

## What hookslens catches automatically (no extra code)

| Scenario                                    | How detected                                       |
| ------------------------------------------- | -------------------------------------------------- |
| `useSWR` hook registered on a page          | `hooksLensMiddleware` via `SWRConfig.use`          |
| `useSWRMutation` triggered                  | Same middleware, `isMutation` flag                 |
| `useEffect + fetch` call                    | `installFetchObserver` wraps `window.fetch`        |
| Slow fetch (>1000ms)                        | Duration tracked in `recordFetchSuccess`           |
| Stalled hook (>5s in-flight)                | `setTimeout` in `recordFetchStart`                 |
| 4xx response                                | HTTP status extracted from error shape             |
| Duplicate fetch (SWR + useEffect, same URL) | `checkDuplicateFetch` cross-references URL maps    |
| Param mismatch (`auditId` vs `audit`)       | `detectParamMismatch` compares query key sets      |
| Per-page hook scoping                       | `usePathname()` captured at middleware render time |
| Multi-tab panel updates                     | `BroadcastChannel` + shared `hooksLensStore`       |

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
