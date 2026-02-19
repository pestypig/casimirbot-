# ToE Follow-On: Owner Parity + Stabilization Pass (2026-02-19)

## Purpose
Close the remaining stabilization gap after `TOE-082..TOE-089` lane implementation:
- resolver owner manifest parity for newly added lane IDs,
- deterministic stabilization verification pass with fresh receipts.

## Current blocker snapshot
Latest preflight failure (`validate-resolver-owner-coverage`) indicates missing
owner entries for:
- `physics_quantum_semiclassical`
- `physics_spacetime_gr`
- `physics_thermodynamics_entropy`
- `physics_information_dynamics`
- `physics_prebiotic_chemistry`
- `physics_biology_life`
- `physics_runtime_safety_control`
- `tool-plan-contracts`
- `orbital-ephemeris-provenance`

## Execution order
1. `TOE-090-resolver-owner-manifest-parity-for-082-089`
2. `TOE-091-forest-lane-stabilization-pass-pack`

Run each in an isolated Codex Cloud chat/branch and merge before the next.

## Prompt: TOE-090
```text
Read and apply docs/audits/research/toe-research-context-pack-2026-02-18.md first.

Task:
Implement resolver owner manifest parity for the lane IDs introduced by TOE-082..TOE-089.

Required lane IDs:
- physics_quantum_semiclassical
- physics_spacetime_gr
- physics_thermodynamics_entropy
- physics_information_dynamics
- physics_prebiotic_chemistry
- physics_biology_life
- physics_runtime_safety_control
- tool-plan-contracts
- orbital-ephemeris-provenance

Allowed paths:
- configs/resolver-owner-coverage-manifest.v1.json
- configs/graph-resolvers.json
- docs/audits/toe-coverage-extension-backlog-2026-02-18.json
- docs/audits/ticket-results/
- docs/audits/toe-progress-snapshot.json

Required tests:
- npx tsx scripts/validate-resolver-owner-coverage.ts
- npm run audit:toe:preflight

Mandatory Casimir gate:
- npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace-toe-090-owner-parity.jsonl --trace-limit 200 --ci

Done criteria:
1) No missing resolver owners for the required lane IDs.
2) validate-resolver-owner-coverage passes.
3) preflight no longer fails on resolver owner coverage stage.

Deliver:
1. Executive summary
2. Files changed
3. Exact commands run
4. ✅/⚠️/❌ tests
5. Casimir block (verdict, traceId, runId, certificateHash, integrityOk)
6. Commit hash + PR URL
7. Ticket receipt JSON path
```

## Prompt: TOE-091
```text
Read and apply docs/audits/research/toe-research-context-pack-2026-02-18.md first.

Task:
Run stabilization verification pass after owner parity closure and emit a deterministic pass-pack receipt.

Allowed paths:
- docs/audits/ticket-results/
- docs/audits/toe-progress-snapshot.json
- docs/audits/helix-results/
- reports/
- docs/audits/toe-coverage-extension-backlog-2026-02-18.json

Required tests/validators:
- npm run audit:toe:preflight
- npx tsx scripts/validate-toe-ticket-backlog.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run validate:toe:research-gates
- npx tsx scripts/compute-toe-progress.ts

Mandatory Casimir gate:
- npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace-toe-091-stabilization.jsonl --trace-limit 200 --ci

Done criteria:
1) Preflight stage list is green for all required validators.
2) Updated progress snapshot and receipt capture current strict-ready counters.
3) Casimir PASS with integrity OK is recorded in stabilization receipt.

Deliver:
1. Executive summary
2. Files changed
3. Exact commands run
4. ✅/⚠️/❌ tests/validators
5. Casimir block (verdict, traceId, runId, certificateHash, integrityOk)
6. Commit hash + PR URL
7. Ticket receipt JSON path
```
