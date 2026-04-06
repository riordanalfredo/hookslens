# HooksLens Panel Development

This directory contains development tools for working on the HooksLens panel UI with simulated data.

## Quick Start

```bash
# From the project root
npm run dev:panel
# or
cd src/panel-dev && vite
```

The dev server will start at `http://localhost:5173` with event simulation automatically enabled.

## Event Simulation

The `simulate-events.ts` script automatically generates realistic hook events to help you develop and debug the HooksLens panel without needing a real application.

### Features

- **Automatic event generation**: Simulates fetch success/error events at realistic intervals
- **Polling simulation**: Hooks with `refreshInterval` will auto-generate periodic events
- **Multiple routes**: Simulates events across different pages (products, catalog, orders, cart, dashboard)
- **Realistic timing**: Adds variance to response times for more realistic behavior
- **Error simulation**: Includes failed requests, 4xx/5xx responses, and stalled hooks

### Controlling the Simulator

The simulator is available globally in the browser console:

```javascript
// Stop event generation
eventSimulator.stop();

// Restart event generation
eventSimulator.start();

// Switch active route (events will be generated for this route)
eventSimulator.setRoute("/products/[productId]");
eventSimulator.setRoute("/catalog");
eventSimulator.setRoute("/orders");
eventSimulator.setRoute("/cart");
eventSimulator.setRoute("/dashboard");

// Clear timeline
eventSimulator.clearTimeline();
```

### Customizing Mock Data

Edit the `MOCK_HOOKS` array in `simulate-events.ts` to add, remove, or modify simulated hooks:

```typescript
const MOCK_HOOKS: MockHookConfig[] = [
  {
    hookName: "useProduct",
    key: "/api/products/[productId]",
    type: "query",
    routes: ["/products/[productId]"],
    status: "fresh",
    httpStatus: 200,
    avgDuration: 89,
    interval: 5000, // Optional: add polling
    hasError: false, // Set to true to simulate errors
  },
  // ... add more hooks
];
```

## Development Workflow

1. **Start the dev server** - Events will start generating automatically
2. **Open browser console** - Use `eventSimulator` to control simulation
3. **Test different views** - Navigate between "Current Page", "All Hooks", "Waterfall", etc.
4. **Test different routes** - Use `eventSimulator.setRoute()` to switch between pages
5. **Test edge cases** - Modify `MOCK_HOOKS` to simulate errors, slow requests, or edge cases

## Files

- `main.tsx` - Entry point that renders the HooksLens panel
- `simulate-events.ts` - Event simulation engine
- `vite.config.mjs` - Vite configuration with path aliases
- `index.html` - HTML template

## Comparison with Demo

The `demo/` folder contains a self-contained demo with all UI and mock data in a single file, suitable for showcasing the tool.

The `src/panel-dev/` folder uses the actual HooksLens components from `src/app/hookslens/` and simulates events through the real store, making it ideal for:

- Developing new features
- Testing edge cases
- Debugging issues
- Iterating on UI/UX improvements

# Quick Start Guide

## Running the Panel with Simulated Events

```bash
npm run dev:panel
```

This will start the development server at http://localhost:5173 with automatic event simulation.

## What You'll See

When you open the browser, you'll see:

1. **9 simulated hooks** across 5 different routes
2. **Live event generation** - new fetch events appearing every 2-5 seconds
3. **Polling hooks** - useInventory (10s), useCart (3s), useRecentActivity (5s)
4. **Error scenarios** - useReviews with 400 errors, useOrders with 500 errors
5. **Different views** - Switch between Current Page, All Hooks, Waterfall, etc.

## Console Controls

Open your browser console to control the simulator:

```javascript
// Check if simulator is running
eventSimulator;

// Stop generating events
eventSimulator.stop();

// Resume generating events
eventSimulator.start();

// Switch to a different route (affects which events are generated)
eventSimulator.setRoute("/products/[productId]");
eventSimulator.setRoute("/catalog");
eventSimulator.setRoute("/orders");
eventSimulator.setRoute("/cart");
eventSimulator.setRoute("/dashboard");
```

## Simulated Routes

- **`/products/[productId]`** - 4 hooks (useProduct, useReviews, useInventory, addToCart)
- **`/catalog`** - 1 hook (useProductList)
- **`/orders`** - 1 hook (useOrders) with slow/error responses
- **`/cart`** - 1 hook (useCart) with stalling behavior
- **`/dashboard`** - 2 hooks (useAnalytics, useRecentActivity)

## Customizing Mock Data

Edit [simulate-events.ts](./simulate-events.ts) to add or modify hooks:

```typescript
const MOCK_HOOKS: MockHookConfig[] = [
  {
    hookName: "useMyHook", // Display name
    key: "/api/my-endpoint", // SWR key
    type: "query", // "query" or "mutation"
    routes: ["/my-page"], // Which routes this hook appears on
    status: "fresh", // Initial status
    httpStatus: 200, // HTTP status code
    avgDuration: 120, // Average response time in ms
    interval: 5000, // Optional: polling interval
    hasError: false, // Whether to simulate errors
  },
  // ... add more hooks
];
```

## Tips

- **Testing different scenarios**: Modify `MOCK_HOOKS` to test edge cases
- **Performance testing**: Increase polling frequency or number of hooks
- **UI development**: Use `eventSimulator.stop()` to freeze state while working on UI
- **Route-specific testing**: Use `setRoute()` to focus on specific pages

## Comparison with Demo

| Feature          | `demo/`                | `src/panel-dev/`                |
| ---------------- | ---------------------- | ------------------------------- |
| Purpose          | Showcase/marketing     | Development                     |
| Data             | Hardcoded in component | Simulated via store             |
| Components       | Self-contained demo    | Real HooksLens components       |
| Event generation | Inline simulation      | Separate simulator script       |
| Best for         | Sharing/presentations  | Feature development & debugging |
