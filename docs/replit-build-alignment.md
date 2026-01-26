# Replit Build Alignment

This doc captures the Replit build/run expectations and the fixes that keep
deployments stable when dev dependencies are pruned.

## Current Build Command

```bash
bash -lc "npm run build && node scripts/deploy-clean.cjs && npm prune --omit=dev"
```

The prune step removes devDependencies, so anything needed at runtime must be a
production dependency or fully bundled.

## Runtime Environment

Set these in the `.replit` `[env]` section (not inline in a chained command) so
they apply to the runtime process:

- `NODE_ENV=production`
- `SKIP_VITE_MIDDLEWARE=1`
- `DISABLE_VITE_HMR=1` (optional, for safety)

Inline `env FOO=bar cmd1 && cmd2` only applies to `cmd1`.

## Build Tooling Dependencies

If the build runs with production-only installs or after prune, keep these in
`dependencies`:

- `vite`
- `@vitejs/plugin-react`
- `vite-plugin-static-copy`
- `@replit/vite-plugin-runtime-error-modal`
- `esbuild`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `@tailwindcss/typography`

## Build Script Notes

Use local binaries without `cross-env`:

```bash
node --max-old-space-size=6144 ./node_modules/vite/bin/vite.js build \
  && npx --no-install esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

Avoid `node ./node_modules/esbuild/bin/esbuild` (it is a native binary and will
throw an `ELF` parse error when run with `node`).

## Runtime Separation

Keep Vite imports dev-only:

- `server/vite.ts` should `import("vite")` and `import("../vite.config")` inside
  `setupVite`, not at module top-level.
- Production paths should not execute Vite middleware.

## Common Failure Modes and Fixes

- `EJSONPARSE` in `package.json`: merge conflict markers left behind. Fix by
  removing `<<<<<<<`, `=======`, `>>>>>>>` and re-validating JSON.
  - Check with `rg -n "<<<<<<<|=======|>>>>>>>" package.json package-lock.json`
- `Cannot find package 'vite'` after prune: runtime import or missing deps.
  - Ensure Vite imports are dynamic and keep Vite in `dependencies` if needed.
- `cross-env: Permission denied`: avoid `cross-env` in Replit build scripts.
- `SyntaxError: ELF` from esbuild: use `npx --no-install esbuild` instead of
  running the binary with `node`.

## Quick Verification Checklist

```bash
npm run build
npm prune --omit=dev
node dist/index.js
curl -sS "http://127.0.0.1:${PORT:-5000}/desktop" | head -40
```

Expected: HTML references hashed assets (e.g. `/assets/index-*.js`) and no
`/@vite/client` entries.
