# Strict-ready and tree/DAG prompt pack (2026-02-20)

Derived from:
- `docs/audits/research/strict-ready-and-tree-dag-scientific-versatility-plan-2026-02-20.md`

Current baseline to use in all runs:
- `strict_ready_release_gate.status = blocked`
- `blocked_ticket_count = 66`
- `ready_ticket_count = 34`
- `missing_verified_pass = 66` (current computed bucket)
- true not-verified tickets = 9 (`TOE-080`, `TOE-082..TOE-089`)
- `math_congruence_gate.status = pass`

Shared verify gate (required after each patch):

```text
npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
```

Report after each run:
- files changed
- behavior delta
- tests/commands run
- Casimir fields: `verdict`, `firstFail`, `certificateHash`, `integrityOk`, `traceId`, `runId`

## Prompt A1: Fix release-gate semantics

```text
Objective:
Make strict-ready release blocker `missing_verified_pass` reflect actual verification gaps, not strict-ready tier delta.

Files:
- scripts/compute-toe-progress.ts
- scripts/toe-agent-preflight.ts

Requirements:
1) Separate metrics:
   - verified-pass coverage (verification_ok=true)
   - strict-ready tier coverage (verified + reduced-order/certified + math congruence pass)
2) Release gate blocker `missing_verified_pass` must count only verification gaps.
3) Preserve strict-ready tier metrics and maturity semantics.
4) Regenerate toe snapshot using repo script; do not manual edit generated values.

Run:
- tsx scripts/compute-toe-progress.ts
- cross-env TOE_STRICT_READY_RELEASE_GATE_ENFORCE=1 npm run audit:toe:preflight
- npm run check

Done criteria:
- `missing_verified_pass` aligns with true unverified ticket count.
- preflight reflects updated semantics deterministically.
```

## Prompt A2: Close 9 true unverified tickets

```text
Objective:
Produce missing ticket results with valid PASS artifacts for the nine truly unverified tickets.

Ticket IDs:
- TOE-080
- TOE-082
- TOE-083
- TOE-084
- TOE-085
- TOE-086
- TOE-087
- TOE-088
- TOE-089

Files:
- docs/audits/ticket-results/*.json (new files for missing tickets)
- scripts/validate-toe-ticket-results.ts (only if schema updates are required)

Requirements:
1) Add one valid result artifact per missing ticket.
2) Ensure each artifact includes expected schema fields and PASS/integrity metadata accepted by existing validators.
3) Keep claim tiers honest (diagnostic unless evidence supports more).

Run:
- tsx scripts/validate-toe-ticket-results.ts
- tsx scripts/compute-toe-progress.ts
- cross-env TOE_STRICT_READY_RELEASE_GATE_ENFORCE=1 npm run audit:toe:preflight

Done criteria:
- no ticket remains without result artifact.
- release-gate missing-verified-pass bucket reaches zero (or residual list explicitly reported).
```

## Prompt B1: Align equation-binding enforcement to policy

```text
Objective:
Resolve policy/runtime mismatch for equation-binding guards while preserving deterministic safety rails.

Files:
- server/services/helix-ask/graph-resolver.ts
- configs/graph-resolvers.json
- tests/helix-ask-graph-resolver.spec.ts

Requirements:
1) Enforce equation-binding guarded node types from config policy deterministically.
2) Keep proxy/evidence strictness intact.
3) Ensure fail reasons for missing equation refs and missing claim IDs are deterministic and wired.

Run:
- npm run check
- npm run test -- tests/helix-ask-graph-resolver.spec.ts
- npm run helix:ask:regression:light

Done criteria:
- resolver behavior matches config policy.
- tests validate deterministic fail behavior.
```

## Prompt B2: High-leverage bridge metadata uplift

```text
Objective:
Upgrade selected physics bridge nodes to be equation/citation/validity complete where required by strict rails.

Files:
- docs/knowledge/physics/math-tree.json
- docs/knowledge/physics/*.json (only targeted bridge nodes)
- tests/helix-ask-bridge.spec.ts

Requirements:
1) Add missing equation/citation linkage metadata only to bridge nodes that are expected to participate in strict guarded routing.
2) Do not mass-edit all nodes.
3) Preserve maturity ceilings and non-certifying semantics where applicable.

Run:
- npm run test -- tests/helix-ask-bridge.spec.ts tests/helix-ask-graph-resolver.spec.ts

Done criteria:
- targeted bridges route or fail deterministically with explicit reasons.
```

## Prompt C1: Activate uncertainty enforcement path

```text
Objective:
Ensure cross-lane uncertainty checks in relation assembly are triggered by congruence matrix metadata on eligible rows.

Files:
- configs/math-congruence-matrix.v1.json
- server/services/helix-ask/relation-assembly.ts
- tests/helix-ask-relation-assembly.spec.ts

Requirements:
1) Align matrix row fields with relation-assembly uncertainty checks for runtime-safety-eligible cross-lane rows.
2) Preserve deterministic fail reasons (`FAIL_MISSING_UNCERTAINTY_MODEL`, etc.).
3) Avoid weakening existing strict rails.

Run:
- npm run test -- tests/helix-ask-relation-assembly.spec.ts
- npm run math:congruence:check:strict

Done criteria:
- uncertainty checks are active for intended cross-lane rows.
- missing metadata fails deterministically in tests.
```

## Prompt C2: Broad scientific family anti-pseudo-rigor regression pack

```text
Objective:
Add regression coverage for broad scientific prompts (life/cosmology/consciousness/open-world) to verify either valid contracted routing or deterministic fail.

Files:
- tests/helix-ask-graph-resolver.spec.ts
- tests/helix-ask-relation-assembly.spec.ts
- scripts/helix-ask-regression.ts (if pack updates are needed)

Requirements:
1) Add tests for broad query families asserting deterministic fail when equation/uncertainty/citation metadata is insufficient.
2) Add positive-path tests where metadata is sufficient.
3) Keep no silent fallback behavior.

Run:
- npm run test:repo
- npm run helix:ask:regression

Done criteria:
- broad-family pseudo-rigor patterns are blocked deterministically.
- contracted positive routes remain intact.
```

## Execution order

1. `Prompt A1`
2. `Prompt A2`
3. `Prompt B1`
4. `Prompt B2`
5. `Prompt C1`
6. `Prompt C2`

After each step, rerun Casimir verify and include certificate metadata in the report.