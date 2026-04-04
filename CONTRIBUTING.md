# Contributing to HooksLens

Thanks for your interest in contributing. This is a small, focused tool — contributions that improve reliability, extend coverage to more SWR APIs, or improve the panel UX are especially welcome.

## Getting started

```bash
git clone https://github.com/riordanalfredo/hookslens
cd hookslens
npm install        # installs workspaces
npm run dev        # watches all packages
```

The repo uses a simple npm workspaces monorepo (no Turborepo required to get started).

## Structure

```
packages/hookslens/
  src/
    hooks/         — React hooks (useHooksLens)
    utils/         — store, middleware, Next.js plugin
    app/    — panel UI components
    scripts/    — simple JS scripts, e.g., to generate local lib
```

## Development workflow

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes with tests where applicable
3. Run `npm run build` to confirm no TypeScript errors
4. Open a PR with a clear description of the problem you're solving

## Priorities for v0.2

- `useHooksLens` tracking in the middleware
- Slow fetch detection via `onLoadingSlow` config
- Key search and filter in the panel
- SSE endpoint for live push updates to the panel (replacing polling)

## Code style

- TypeScript strict mode
- No default exports from utility files
- Keep the middleware zero-dependency relative to the host app

## Licence

By contributing you agree your work will be licenced under MIT.
