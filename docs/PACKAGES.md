# Packages

Publishable packages so teams can integrate without cloning the repo.

SDK (Node 18+)
```
npm install shadow-of-intent-sdk
```

CLI (Node 18+)
```
npm install -g shadow-of-intent
shadow-of-intent verify --json adapter-request.json
```
One-step CI (auto telemetry)
```
shadow-of-intent verify --ci --trace-out artifacts/training-trace.jsonl
```
Ensure `reports/` contains CI telemetry (run `npm run reports:ci`) or set
`CASIMIR_*` telemetry envs for repo-convergence.

Hello verifier example
```
cd examples/hello-verifier
npm install
npm run verify
```

Scaffolder (Node 18+)
```
npx create-casimir-verifier --dest ./hello-verifier
```

Notes
- The CLI wraps `POST /api/agi/adapter/run` and `GET /api/agi/training-trace/export`.
- Runs locally by default; use `--url` or `CASIMIR_PUBLIC_BASE_URL` / `SHADOW_OF_INTENT_BASE_URL` to call a remote adapter.
- Provide `--token` and `--tenant` when AGI auth/tenancy is enabled.
