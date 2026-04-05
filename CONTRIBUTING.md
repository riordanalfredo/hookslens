# Contributing to HooksLens

Thanks for your interest in contributing. This is a small, focused tool — contributions that improve reliability, extend coverage to more SWR APIs, or improve the panel UX are especially welcome.

## Getting started

```bash
git clone https://github.com/riordanalfredo/hookslens
cd hookslens
npm install
npm run dev        # watches and builds the library
npm run demo       # run the standalone demo
```

## Repository Structure

```
src/
  lib/hookslens/
    store/              — State management and tracking
      trackers/         — Diagnostic trackers (mismatch, waterfall, coverage)
    middleware.ts       — SWR middleware
    fetchObserver.ts    — Fetch interception
    useHooksLens.ts     — Hook registration API
  app/hookslens/
    components/         — Panel UI components
    hooks/              — Panel-specific hooks
    page.tsx            — Main panel component
    panel.css           — Panel styles
  __tests__/            — Test files
  index.ts              — Public API exports

scripts/                — Build scripts (e.g., build-local-lib.mjs)
demo/                   — Standalone demo application
dist/                   — Built artifacts (not in git)
```

## Development workflow

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes with tests where applicable
3. Run `npm run build` to confirm no TypeScript errors
4. Open a PR with a clear description of the problem you're solving

## Code style

- TypeScript strict mode
- No default exports from utility files
- Keep the middleware zero-dependency relative to the host app

## Licence

By contributing you agree your work will be licenced under MIT.
