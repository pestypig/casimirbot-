# 10-Minute Quickstart

Goal: run a PASS verification on a fresh machine and know where the trace lives.

Prereqs
- Node 18+ (Node 20 recommended)
- npm

1) Install the CLI
```bash
npm install -g shadow-of-intent
```

2) Scaffold a hello verifier
```bash
npx create-casimir-verifier --dest ./hello-verifier
cd hello-verifier
npm install
```

3) Initialize audit artifacts (CasimirBot repo root)
```bash
# From the CasimirBot repo root
npm run audit:init
```
Notes:
- The scaffolded hello-verifier does not include `audit:init`; skip this step
  there and use `npm run verify` instead.
- `audit:init` runs `reports:ci` and, when CI + adapter envs are set, runs the
  verification gate automatically.

4) Run verification
```bash
shadow-of-intent verify --ci --auto-telemetry
```
Notes:
- The CLI runs locally by default for constraint-pack runs (no server needed).
- Use `--url` or set `CASIMIR_PUBLIC_BASE_URL` / `SHADOW_OF_INTENT_BASE_URL` to
  call a hosted adapter.

5) Inspect the training trace
- Default output file: `training-trace.jsonl` (set `--trace-out` to override).
- PASS means all constraints in the selected pack were satisfied.
- FAIL includes `firstFail` (the first failing HARD constraint) and a non-green
  certificate status.
- See `docs/TRAINING-TRACE-API.md` for trace schema and export routes.

6) Optional: run the server + open Helix
```bash
npm run dev:agi:5173
```
Open `http://localhost:5173/desktop` to access Helix panels.
