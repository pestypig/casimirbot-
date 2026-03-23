# OptiX + CUDA Render Service Rollout Plan

Date: 2026-03-23
Owner: Warp render lane (Alcubierre Viewer / NHM2 solve lens)

## Objective

Replace Unity-dependent scientific rendering with a native OptiX + CUDA service while preserving the current UI and keeping `render-vs-metric` falsifiability at least as strong as current strict lanes.

## Hard Requirements

- Keep browser contract unchanged: UI still posts to `/api/helix/hull-render/frame`.
- Keep strict scientific fail-closed behavior in server proxy.
- Keep benchmark integrity: `render_vs_metric_displacement` events must remain benchmark-compatible.
- Keep mandatory scientific attachments:
- `depth-linear-m-f32le`
- `shell-mask-u8`
- Preserve deterministic provenance and backend labeling for audits.

## Current Baseline

- Frontend already uses contract endpoint via `requestHullMisFrame(...)`.
- Server route proxies remote renderer and enforces strict lane policy.
- Command capture exists:
- `npm run warp:render:capture`
- Benchmark exists:
- `npm run warp:render:congruence:check`
- Known blocker for Unity lane: Unity editor/runtime not installed on this machine.

## Target Architecture

1. Browser UI
- Calls `/api/helix/hull-render/frame` (same-origin app backend).

2. App backend proxy (`server/routes/hull-render.ts`)
- Forwards to external renderer service URL.
- Enforces strict scientific requirements.

3. External renderer service (new OptiX service)
- Native CUDA/OptiX frame generation.
- Returns image + scientific attachments + provenance metadata.

4. Benchmark and audit lane
- Consumes JSONL displacement events.
- Produces dated + latest benchmark artifacts.

## Phased Execution Plan

### Phase 0 - Freeze Contract and Gates

Tasks:
- Pin render response contract fields that are mandatory in strict lane.
- Add/confirm tests that strict proxy rejects missing attachments.
- Add/confirm tests for backend provenance semantics.

Exit criteria:
- Contract tests pass.
- Strict lane rejects non-scientific/synthetic responses.

### Phase 1 - Machine Readiness (OptiX lane)

Tasks:
- Confirm NVIDIA driver version supports selected OptiX SDK.
- Install OptiX SDK and verify headers/libs available to build system.
- Confirm CUDA toolkit + compiler toolchain works end-to-end.

Exit criteria:
- Local compileable hello-path for OptiX service.
- Service can answer `/status`.

### Phase 2 - Service Scaffold (`optix-service`)

Tasks:
- Implement a standalone HTTP service with:
- `GET /api/helix/hull-render/status`
- `POST /api/helix/hull-render/frame`
- Implement deterministic request hashing / seed behavior.
- Return contract-compatible JSON payload.

Exit criteria:
- App proxy can target service without UI changes.
- Health/status reports ready-for-scientific-lane fields.

### Phase 3 - Scientific Attachment Parity

Tasks:
- Produce `depth-linear-m-f32le` attachment from OptiX output buffers.
- Produce `shell-mask-u8` attachment from shell extraction pass.
- Add attachment shape/size consistency checks in service and proxy.

Exit criteria:
- Command capture reports non-unknown integral statuses on representative runs.
- Strict mode passes with `--require-proxy`.

### Phase 4 - Benchmark Integrity Lock

Tasks:
- Run command capture for NHM2 and Mercury teaching lane scenarios.
- Run congruence benchmark on generated latest JSONL.
- Store artifacts in `artifacts/research/full-solve`.

Exit criteria:
- No benchmark parser mismatches.
- Render lane verdict at least `PARTIAL`; target `PASS` for strict proxy mode.
- Observable parity anchors remain `PASS`.

### Phase 5 - Deployment Path

Tasks:
- Deploy OptiX service in infra reachable by app backend.
- Set production env:
- `MIS_RENDER_SERVICE_URL`
- `MIS_RENDER_PROXY_STRICT=1`
- `MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL=1`
- Keep synthetic fallback disabled in scientific environment.

Exit criteria:
- Production UI renders via proxy backend.
- If service fails, route fails closed (`502`) with explicit diagnostics.

### Phase 6 - Operational Safeguards

Tasks:
- Add runbook for restart, health checks, and known error signatures.
- Add periodic command-capture cron/CI smoke run.
- Add alerting thresholds for proxy fail rate and missing attachments.

Exit criteria:
- Ops can diagnose and recover without disabling strict mode.

## Agent Execution Checklist

- Do not change UI route contract.
- Prefer backend service replacement over panel logic changes.
- Keep `render_vs_metric_displacement` category and measurement keys stable.
- For each patch cycle:
- run relevant tests
- run `npm run math:report`
- run `npm run math:validate`
- run Casimir verify gate and report certificate integrity

## Commands (Working Set)

Baseline capture:

```bash
npm run warp:render:capture -- --base-url http://127.0.0.1:5050 --scenario all --frames 12
npm run warp:render:congruence:check -- --debug-log artifacts/research/full-solve/alcubierre-debug-log-latest.jsonl
```

Strict proxy capture (after OptiX service is live):

```bash
npm run warp:render:capture -- --base-url http://127.0.0.1:5050 --scenario all --frames 12 --require-proxy --strict
```

Route tests:

```bash
npx vitest run server/__tests__/hull-render.routes.spec.ts
```

## Risks and Mitigations

Risk: OptiX service returns image-only frames.
- Mitigation: enforce attachment requirement in strict proxy and tests.

Risk: Benchmark drift from field name changes.
- Mitigation: treat benchmark field schema as frozen contract; test on every patch.

Risk: Service latency spikes under load.
- Mitigation: bounded timeout, explicit 502 fail-closed, capture/retry workflow.

Risk: Mixing teaching and scientific lanes.
- Mitigation: explicit labeling in notes/provenance and strict env isolation.

## Definition of Done (Migration)

- App backend uses OptiX service as remote scientific renderer.
- UI unchanged and stable.
- Strict lane active with fail-closed behavior.
- Command capture + benchmark run in one command sequence and produce reproducible artifacts.
- Casimir verification gate PASS with certificate integrity OK after final integration patch.
