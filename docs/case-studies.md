# HooksLens Case Studies

Real-world scenarios where HooksLens catches bugs other tools miss.

---

## 🎯 Value Proposition

**HooksLens provides three layers of debugging power:**

### 1. Core Fetch Monitoring (Works Standalone)
Track **all** `fetch()` calls with timeline visualization, duplicate detection, and performance insights — no dependencies required.

### 2. Manual Hook Intent Tracking (Optional, Works Without SWR)
Use `useHooksLens()` to register **any custom hook** (SWR or `useEffect + fetch`) with expected parameters. HooksLens correlates your intent with actual fetch calls to catch mismatches.

```ts
// Works with ANY hook, not just SWR
export function useCart(userId: string) {
  useHooksLens({
    name: "useCart",
    description: "Legacy useEffect fetch",
    fetchKey: `/api/cart/${userId}`,
    custom: true
  });

  // Your existing fetch code (useEffect, axios, fetch, etc.)
  useEffect(() => {
    fetch(`/api/cart/${userId}`).then(r => r.json()).then(setData);
  }, [userId]);
}
```

### 3. Automatic SWR Hook Tracking (Requires SWR)
**Zero-config hook monitoring** — automatically captures all `useSWR` hooks via middleware, plus cache status, polling config, and deduplication insights.

### Tool Comparison

**Chrome DevTools** → Shows network requests only
**React DevTools** → Shows hook values at render time
**SWR DevTools** → Shows SWR cache state only
**NextInspect** → Shows network waterfall

**HooksLens** → Shows **fetch timeline + performance** (standalone), PLUS **which SWR hooks registered**, **what they expected**, **what actually fetched**, and **correlates all three** to catch mismatches (with SWR).

| What Other Tools Show | What HooksLens Shows (Core) | What HooksLens Adds (With SWR) |
|----------------------|---------------------------|-------------------------------|
| Network request failed | Timeline position + route context | **Which SWR hook** triggered it + expected vs actual parameters |
| Multiple identical requests | Duplicate count + URLs | **Which hooks/routes** caused duplicates + SWR dedup status |
| Slow request (2.3s) | Duration + performance flag | **Which hook** is polling + `refreshInterval` config |
| API returned 400 error | HTTP status + error flag | `useProductReviews` expected `productId`, fetch sent `product` (mismatch!) |

---

## Case Study 1: Parameter Mismatch After Refactor

### The Bug

Your team refactored the product API to use `productId` instead of `product`. You updated the hook registration but forgot to update the fetch call.

### What Chrome DevTools Shows

```
POST /api/reviews
Status: 400 Bad Request
Response: { "error": "Missing required parameter: productId" }
```

You see the error, but not *why* it's sending the wrong parameter.

### What HooksLens Shows

```
❌ MISMATCH DETECTED

Hook: useProductReviews
Expected: /api/reviews?productId=P-301&page=1
Actually sent: /api/reviews?product=P-301&page=1

Parameter mismatch: productId vs product
```

**Time to fix:** 30 seconds instead of 30 minutes of debugging.

### The Code

**Hook registration (correct):**
```ts
useHooksLens({
  name: "useProductReviews",
  fetchKey: `/api/reviews?productId=${productId}&page=${page}`
});
```

**Actual fetch (outdated):**
```ts
fetch(`/api/reviews?product=${product}&page=${page}`) // ❌ Still using old param
```

### Why HooksLens Caught It

HooksLens **correlates hook intent with actual fetch calls**. When the registered `fetchKey` doesn't match the actual URL, it flags a mismatch immediately.

---

## Case Study 2: Duplicate Fetches Across Components

### The Bug

Three different components on the same page each fetch user data independently. You're hitting the API 3x for the same data.

### What Chrome DevTools Shows

```
GET /api/user/123 — 89ms
GET /api/user/123 — 102ms
GET /api/user/123 — 95ms
```

You see duplicates in the Network tab, but have to manually trace which components caused them.

### What HooksLens Shows

```
🔁 DUPLICATE DETECTED: 3 instances

Route: /dashboard
URL: /api/user/123

Triggered by:
  1. UserProfile component (useUser hook)
  2. UserSettings component (useUser hook)
  3. NotificationBell component (raw fetch in useEffect)

Recommendation: Migrate to SWR for automatic deduplication
```

**Time saved:** Immediately see which components to refactor.

### The Fix

Migrate all three to use a shared SWR hook:

```ts
// src/hooks/useUser.ts
export function useUser(userId: string) {
  useHooksLens({
    name: "useUser",
    description: "Fetches current user data",
    fetchKey: `/api/user/${userId}`
  });

  return useSWR(`/api/user/${userId}`, fetcher);
}
```

Now SWR deduplicates automatically — 3 requests become 1.

### Why HooksLens Caught It

HooksLens tracks **all fetch calls** (SWR + non-SWR) and correlates them by URL and route. The timeline view shows exactly when duplicates fire and which hooks/components caused them.

---

## Case Study 3: Stalled Polling Hook

### The Bug

Your `useOrderStatus` hook polls every 2 seconds, but the API sometimes takes 6+ seconds to respond. Requests pile up, causing browser slowdown.

### What Chrome DevTools Shows

```
GET /api/orders/ORD-456 — pending...
GET /api/orders/ORD-456 — pending...
GET /api/orders/ORD-456 — pending...
GET /api/orders/ORD-456 — pending...
```

You see slow requests, but not which hook is causing the polling behavior.

### What HooksLens Shows

```
⚠️ STALLED POLLING DETECTED

Hook: useOrderStatus
Refresh interval: 2000ms
In-flight requests: 4 concurrent
Avg response time: 6200ms

Problem: Polling faster than API responds
Recommendation: Increase refreshInterval to 10000ms
```

**Impact:** Instantly identify the culprit hook and the recommended fix.

### The Code

**Before (problematic):**
```ts
export function useOrderStatus(orderId: string) {
  return useSWR(`/api/orders/${orderId}`, fetcher, {
    refreshInterval: 2000 // ❌ Polling every 2s, but API takes 6s
  });
}
```

**After (fixed):**
```ts
export function useOrderStatus(orderId: string) {
  useHooksLens({
    name: "useOrderStatus",
    description: "Polls order status for real-time updates",
    fetchKey: `/api/orders/${orderId}`
  });

  return useSWR(`/api/orders/${orderId}`, fetcher, {
    refreshInterval: 10000 // ✅ Poll every 10s
  });
}
```

### Why HooksLens Caught It

HooksLens **tracks polling intervals** from SWR config and **correlates them with request duration**. When polling frequency exceeds response time, it flags a stalled pattern.

---

## Case Study 4: Missing Hook After Refactor

### The Bug

You refactored `/products/[productId]` to remove the `useInventory` hook. The inventory section still renders (using stale cache), but no new data loads.

### What Chrome DevTools Shows

```
(No network activity for /api/inventory)
```

Silence. You don't know *why* inventory isn't loading.

### What HooksLens Shows

```
⚠️ MISSING HOOK DETECTED

Route: /products/[productId]
Expected hooks: useProduct, useReviews, useInventory
Currently registered: useProduct, useReviews

Missing: useInventory (last seen 2 hours ago)
```

**Impact:** Immediately see which hook disappeared after your refactor.

### Why HooksLens Caught It

HooksLens maintains a **hook coverage tracker** per route. When a previously-registered hook stops appearing, it flags potential regression.

---

## Case Study 5: Legacy useEffect Migration

### The Bug

Your app has 15 custom hooks, some using SWR and some using `useEffect + fetch`. You want to migrate the legacy ones to SWR for better caching.

### What Chrome DevTools Shows

```
(Just shows all fetch requests mixed together)
```

No way to distinguish SWR-based fetches from legacy `useEffect` fetches.

### What HooksLens Shows

```
📊 HOOK REGISTRY

SWR Hooks (8):
  ✅ useProduct
  ✅ useReviews
  ✅ useCart
  ✅ useUser
  ...

Legacy useEffect Hooks (7):
  ⚠️ useInventory (custom: true)
  ⚠️ useOrderHistory (custom: true)
  ⚠️ useNotifications (custom: true)
  ...

Migration candidates: 7 hooks
```

**Impact:** Clear migration roadmap showing exactly which hooks need updating.

### The Code

**Legacy hook (before):**
```ts
export function useInventory(productId: string) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/inventory/${productId}`)
      .then(r => r.json())
      .then(setData);
  }, [productId]);

  return data;
}
```

**SWR-migrated (after):**
```ts
export function useInventory(productId: string) {
  useHooksLens({
    name: "useInventory",
    description: "Fetches product inventory levels",
    fetchKey: `/api/inventory/${productId}`
  });

  return useSWR(`/api/inventory/${productId}`, fetcher);
}
```

### Why HooksLens Caught It

HooksLens distinguishes between:
- **SWR hooks** (via `hooksLensMiddleware`)
- **Legacy hooks** (via `useHooksLens` with `custom: true`)
- **Unlabeled fetches** (raw fetch calls with no hook registration)

This gives you a clear inventory of what needs migration.

---

## Case Study 6: Tracking Non-SWR Hooks (Without SWR Dependency)

### The Scenario

Your app doesn't use SWR. You have custom hooks using `useEffect + fetch`, Axios, or React Query. You want to track which hooks are firing and catch parameter mismatches.

### What Chrome DevTools Shows

```
GET /api/notifications?userId=123 — 150ms
GET /api/cart?user=123 — 200ms  (⚠️ Different param name!)
```

You see two requests with different parameter conventions (`userId` vs `user`), but don't know which hooks/components triggered them.

### What HooksLens Shows (Without SWR)

```
🎯 HOOK REGISTRY (Manual Registration)

Hooks on /dashboard:
  1. useNotifications
     Expected: /api/notifications?userId=123
     Actually sent: /api/notifications?userId=123 ✅

  2. useCart
     Expected: /api/cart?userId=123
     Actually sent: /api/cart?user=123 ❌ MISMATCH

Parameter inconsistency detected: userId vs user
```

**Impact:** Catch parameter naming inconsistencies even without SWR.

### The Code

**Register ANY custom hook:**
```ts
// Works with useEffect + fetch
export function useNotifications(userId: string) {
  useHooksLens({
    name: "useNotifications",
    description: "Polls for new notifications",
    fetchKey: `/api/notifications?userId=${userId}`,
    custom: true  // Indicates non-SWR hook
  });

  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`/api/notifications?userId=${userId}`)
      .then(r => r.json())
      .then(setData);
  }, [userId]);

  return data;
}

// Works with Axios
export function useOrders(userId: string) {
  useHooksLens({
    name: "useOrders",
    fetchKey: `/api/orders?userId=${userId}`,
    custom: true
  });

  return useQuery(['orders', userId], () =>
    axios.get(`/api/orders?userId=${userId}`)
  );
}
```

### Why This Matters

**Hook intent tracking works WITHOUT SWR!** Just add `useHooksLens()` to any custom hook to:
- See which hooks registered on each route
- Compare expected parameters vs actual fetch calls
- Catch parameter mismatches and naming inconsistencies
- Track hook coverage across your app

The only difference:
- **Without SWR:** Manual registration with `useHooksLens()`
- **With SWR:** Automatic registration via middleware (zero config)

---

## When to Use HooksLens

### ✅ Use HooksLens When:

1. **Debugging SWR hooks** — See which hooks registered, their config, and what they actually fetched
2. **Parameter mismatches** — Hook registration shows `productId`, but fetch sends `product`
3. **Finding duplicate requests** — See which SWR hooks + raw fetches are duplicating
4. **Identifying slow/stalled hooks** — See polling intervals (`refreshInterval`) + actual response times
5. **Tracking down missing fetches** — Hook disappeared after refactor, no fetch fires
6. **Migrating to SWR** — Identify legacy `useEffect + fetch` patterns vs SWR hooks
7. **SWR cache debugging** — See which hook instances are mounted + their cache states
8. **Onboarding new developers** — Visualize the app's SWR hook architecture
9. **Correlation debugging** — Need to see hook registration + fetch activity + timeline in one view

### ❌ Don't Use HooksLens When:

1. **Production monitoring** — It's development-only, use APM tools instead
2. **Server-side debugging** — Only tracks client-side fetches
3. **Non-Next.js apps** — Designed specifically for Next.js App Router
4. **Pure network debugging** — If you only need request/response, use Chrome DevTools

---

## The HooksLens Advantage

| Debugging Task | Without HooksLens | With HooksLens |
|----------------|-------------------|----------------|
| Find which hook caused a 400 error | Check network tab, search codebase, add console.logs | See hook name + mismatch flag instantly |
| Identify duplicate fetches | Manually count in network tab, grep codebase | Auto-flagged with component/hook source |
| Debug slow requests | Check network timing, no context | See which hook is polling, recommended fix |
| Track down missing fetch | Add breakpoints, trace component tree | See "missing hook" warning for route |
| Migrate to SWR | Manually audit codebase for fetch calls | See complete legacy hook inventory |

---

## Getting Started

**Install:**
```bash
npm i hookslens --save-dev
```

**Wire up (2 files):**

1. Add fetch observer:
```tsx
// src/app/providers.tsx
import { installFetchObserver } from "hookslens";

useEffect(() => {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    installFetchObserver();
  }
}, []);
```

2. Add dashboard route:
```tsx
// src/app/hookslens/page.tsx
import HooksLensPanel from "hookslens/panel";

export default function Page() {
  if (process.env.NODE_ENV !== "development") return null;
  return <HooksLensPanel />;
}
```

**Open:** `http://localhost:3000/hookslens`

---

## Learn More

- [Integration Guide](./hookslens-integration-guide.md) — Full setup instructions
- [README](../README.md) — Feature overview
- [Demo](https://riordanalfredo.github.io/hookslens/) — Interactive preview
