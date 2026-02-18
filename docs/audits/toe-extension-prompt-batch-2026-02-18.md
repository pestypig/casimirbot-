# ToE Extension Prompt Batch (2026-02-18)

This file provides copy/paste prompts for `TOE-013` to `TOE-016` and enforces a persistent context loop so future agents keep long-horizon continuity.

Next batch (`TOE-047..051`) is documented at:

- `docs/audits/toe-next-prompt-batch-2026-02-18.md`

## Shared Context Loop

Read before each ticket:

- `docs/experiments/helix-ask-goal-zone.md`
- `docs/audits/repo-forest-coverage-audit-2026-02-18.md`
- `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`
- `docs/audits/toe-coverage-extension-backlog-2026-02-18.json`
- `docs/audits/ticket-results/README.md`
- `WARP_AGENTS.md`

After each successful ticket:

1. Write ticket artifact:
   - `docs/audits/ticket-results/<ticket-id>.<UTCSTAMP>.json`
2. Refresh progress snapshot:
   - `npx tsx scripts/compute-toe-progress.ts`
3. Keep strict return JSON with Casimir evidence.

Required gate for every ticket:

- `npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`

## Prompt: TOE-013

```md
You are Codex Cloud working in CasimirBot.

Implement exactly ticket:
TOE-013-atomic-systems-claim-tier-contract

Authoritative ticket source:
- docs/audits/toe-coverage-extension-backlog-2026-02-18.json

Read first:
- docs/experiments/helix-ask-goal-zone.md
- docs/audits/repo-forest-coverage-audit-2026-02-18.md
- docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md
- docs/audits/helix-agent-context-checklist-2026-02-17.json
- docs/audits/ticket-results/README.md
- WARP_AGENTS.md

Allowed paths only:
- server/routes/agi.plan.ts
- server/services/helix-ask/topic.ts
- client/src/lib/atomic-orbitals.ts
- shared/schema.ts
- tests/atomic-orbital-claim-tier.spec.ts
- tests/helix-ask-modes.spec.ts

Required outcomes:
1) Atomic/orbital outputs include claim_tier and provenance class fields.
2) Proxy/sim-only atomic outputs cannot be narrated as certified in ask-time responses.
3) Tests cover classical and quantum branches with non-overclaim policy assertions.

Rules:
1) Modify only allowed_paths.
2) Keep maturity claims bounded to diagnostic/reduced-order/certified.
3) Preserve tree/DAG defaults: allowedCL=CL4, allowConceptual=false, allowProxies=false, chart=comoving_cartesian.
4) Run required tests and include exact test paths in artifact.
5) Run Casimir verify command (required).
6) If FAIL, fix first HARD fail and rerun until PASS.

Run:
- npx vitest run tests/atomic-orbital-claim-tier.spec.ts tests/helix-ask-modes.spec.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
- npx tsx scripts/compute-toe-progress.ts

Write ticket artifact:
- docs/audits/ticket-results/TOE-013-atomic-systems-claim-tier-contract.<UTCSTAMP>.json

Return strict JSON only:
{
  "ticket_id": "TOE-013-atomic-systems-claim-tier-contract",
  "files_changed": [],
  "tests_run": [],
  "claim_tier": "diagnostic|reduced-order|certified",
  "casimir": {
    "verdict": "PASS|FAIL",
    "trace_id": "",
    "run_id": "",
    "certificate_hash": "",
    "integrity_ok": false
  },
  "remaining_gaps": []
}
```

## Prompt: TOE-014

```md
You are Codex Cloud working in CasimirBot.

Implement exactly ticket:
TOE-014-robotics-recollection-provenance-contract

Authoritative ticket source:
- docs/audits/toe-coverage-extension-backlog-2026-02-18.json

Read first:
- docs/experiments/helix-ask-goal-zone.md
- docs/audits/repo-forest-coverage-audit-2026-02-18.md
- docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md
- docs/audits/helix-agent-context-checklist-2026-02-17.json
- docs/audits/ticket-results/README.md
- WARP_AGENTS.md

Allowed paths only:
- shared/schema.ts
- server/routes/agi.adapter.ts
- server/services/observability/training-trace-store.ts
- server/services/robotics-handback.ts
- server/__tests__/training-trace.test.ts
- server/__tests__/agi.adapter.test.ts
- server/__tests__/robotics-handback.test.ts

Required outcomes:
1) Movement/replay trace records carry provenance class, sensor-channel coverage, and certificate refs.
2) Robotics FAIL paths emit deterministic firstFail ids under canonical taxonomy.
3) Tests prove deterministic linkage action -> gate -> certificate -> replay summary.

Rules:
1) Modify only allowed_paths.
2) Keep maturity claims bounded to diagnostic/reduced-order/certified.
3) Preserve existing adapter and firstFail contracts unless ticket requires extension.
4) Run required tests and include exact test paths in artifact.
5) Run Casimir verify command (required).
6) If FAIL, fix first HARD fail and rerun until PASS.

Run:
- npx vitest run server/__tests__/training-trace.test.ts server/__tests__/agi.adapter.test.ts server/__tests__/robotics-handback.test.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
- npx tsx scripts/compute-toe-progress.ts

Write ticket artifact:
- docs/audits/ticket-results/TOE-014-robotics-recollection-provenance-contract.<UTCSTAMP>.json

Return strict JSON only:
{
  "ticket_id": "TOE-014-robotics-recollection-provenance-contract",
  "files_changed": [],
  "tests_run": [],
  "claim_tier": "diagnostic|reduced-order|certified",
  "casimir": {
    "verdict": "PASS|FAIL",
    "trace_id": "",
    "run_id": "",
    "certificate_hash": "",
    "integrity_ok": false
  },
  "remaining_gaps": []
}
```

## Prompt: TOE-015

```md
You are Codex Cloud working in CasimirBot.

Implement exactly ticket:
TOE-015-external-integration-evidence-manifest

Authoritative ticket source:
- docs/audits/toe-coverage-extension-backlog-2026-02-18.json

Read first:
- docs/experiments/helix-ask-goal-zone.md
- docs/audits/repo-forest-coverage-audit-2026-02-18.md
- docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md
- docs/audits/helix-agent-context-checklist-2026-02-17.json
- docs/audits/ticket-results/README.md
- WARP_AGENTS.md

Allowed paths only:
- configs/external-integration-evidence-manifest.v1.json
- docs/knowledge/external-integrations-tree.json
- scripts/validate-external-integration-manifest.ts
- tests/external-integration-manifest.spec.ts
- docs/audits/README.md

Required outcomes:
1) Manifest maps external integration node -> in-repo usage surface -> provenance/maturity class.
2) Validator fails on missing/dangling node references and missing evidence fields.
3) Test fixtures include pass and fail cases for manifest policy.

Rules:
1) Modify only allowed_paths.
2) Keep maturity claims bounded to diagnostic/reduced-order/certified.
3) Prefer deterministic validation failures with actionable error messages.
4) Run required tests and include exact test paths in artifact.
5) Run Casimir verify command (required).
6) If FAIL, fix first HARD fail and rerun until PASS.

Run:
- npx vitest run tests/external-integration-manifest.spec.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
- npx tsx scripts/compute-toe-progress.ts

Write ticket artifact:
- docs/audits/ticket-results/TOE-015-external-integration-evidence-manifest.<UTCSTAMP>.json

Return strict JSON only:
{
  "ticket_id": "TOE-015-external-integration-evidence-manifest",
  "files_changed": [],
  "tests_run": [],
  "claim_tier": "diagnostic|reduced-order|certified",
  "casimir": {
    "verdict": "PASS|FAIL",
    "trace_id": "",
    "run_id": "",
    "certificate_hash": "",
    "integrity_ok": false
  },
  "remaining_gaps": []
}
```

## Prompt: TOE-016

```md
You are Codex Cloud working in CasimirBot.

Implement exactly ticket:
TOE-016-resolver-forest-owner-coverage-manifest

Authoritative ticket source:
- docs/audits/toe-coverage-extension-backlog-2026-02-18.json

Read first:
- docs/experiments/helix-ask-goal-zone.md
- docs/audits/repo-forest-coverage-audit-2026-02-18.md
- docs/audits/ideology-physics-claim-gap-audit-2026-02-17.md
- docs/audits/helix-agent-context-checklist-2026-02-17.json
- docs/audits/ticket-results/README.md
- WARP_AGENTS.md

Allowed paths only:
- configs/resolver-owner-coverage-manifest.v1.json
- configs/graph-resolvers.json
- docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json
- docs/audits/toe-coverage-extension-backlog-2026-02-18.json
- scripts/compute-toe-progress.ts
- scripts/validate-resolver-owner-coverage.ts
- tests/toe-progress.spec.ts

Required outcomes:
1) Manifest maps resolver tree owner -> ticket coverage status in {covered_core,covered_extension,unmapped}.
2) Progress tooling reports forest_owner_coverage_pct separately from toe_progress_pct.
3) Validation fails when high-priority owners remain unmapped.

Rules:
1) Modify only allowed_paths.
2) Keep maturity claims bounded to diagnostic/reduced-order/certified.
3) Do not remove existing toe_progress_pct; add coverage metrics alongside it.
4) Run required tests and include exact test paths in artifact.
5) Run Casimir verify command (required).
6) If FAIL, fix first HARD fail and rerun until PASS.

Run:
- npx vitest run tests/toe-progress.spec.ts
- npx tsx scripts/validate-toe-ticket-results.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
- npx tsx scripts/compute-toe-progress.ts

Write ticket artifact:
- docs/audits/ticket-results/TOE-016-resolver-forest-owner-coverage-manifest.<UTCSTAMP>.json

Return strict JSON only:
{
  "ticket_id": "TOE-016-resolver-forest-owner-coverage-manifest",
  "files_changed": [],
  "tests_run": [],
  "claim_tier": "diagnostic|reduced-order|certified",
  "casimir": {
    "verdict": "PASS|FAIL",
    "trace_id": "",
    "run_id": "",
    "certificate_hash": "",
    "integrity_ok": false
  },
  "remaining_gaps": []
}
```
