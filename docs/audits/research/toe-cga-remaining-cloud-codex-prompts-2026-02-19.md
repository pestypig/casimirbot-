# Curvature-Atomic Congruence Remaining Cloud Codex Prompt Pack (2026-02-19)

## Scope

This prompt pack covers the remaining obligations from:

- `docs/audits/research/curvature-atomic-congruence-gap-audit-2026-02-19.md`

Baseline already completed:

- `TOE-CGA-001` landed in commit `90ff7207` (atomic pipeline drift labeled as display proxy).

Remaining tickets in this pack:

- `TOE-CGA-002`
- `TOE-CGA-003`
- `TOE-CGA-004`
- `TOE-CGA-005`
- `TOE-CGA-006`
- `TOE-CGA-007`
- `TOE-CGA-008`

## Shared Guardrails (include in every Cloud Codex run)

```text
Hard constraints:
1) Keep claims maturity-safe: do not promote atomic/bridge outputs above diagnostic unless evidence contracts and rails exist.
2) Keep changes additive and replay-safe; no destructive edits.
3) Any missing contract must fail deterministically (named fail code, no silent fallback).
4) Keep ticket scope tight to allowed paths.

Verification gate (required for every patch):
npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verdict is FAIL:
- fix the first failing HARD constraint
- rerun until verdict is PASS

In final report, always include:
- verdict
- firstFail
- certificateHash
- integrityOk
- traceId
- runId
- exact tests/commands run
```

## Prompt 0: Coordinator (run once)

```text
Use `docs/audits/research/curvature-atomic-congruence-gap-audit-2026-02-19.md` as source of truth.

Execute remaining tickets sequentially in this exact order:
TOE-CGA-002 -> TOE-CGA-003 -> TOE-CGA-004 -> TOE-CGA-005 -> TOE-CGA-006 -> TOE-CGA-007 -> TOE-CGA-008.

Rules:
- One ticket per commit.
- Run ticket-specific tests plus Casimir verification after each ticket.
- If a ticket cannot fully close because of a dependency, implement the maximum additive subset and leave a deterministic TODO with fail code coverage.
- Do not skip verification reporting fields.

Output format after each ticket:
1) files changed
2) behavioral delta
3) tests run + result
4) casimir verify summary (verdict/firstFail/certificateHash/integrityOk/traceId/runId)
```

## Prompt 1: TOE-CGA-002 (curvature equation contract)

```text
Ticket: TOE-CGA-002
Objective: Add a canonical equation ref for curvature-unit proxy contracts and wire it into congruence-matrix coverage.

Allowed paths:
- configs/physics-equation-backbone.v1.json
- configs/math-congruence-matrix.v1.json
- scripts/validate-physics-equation-backbone.ts
- tests/physics-equation-backbone.spec.ts
- tests/math-congruence-matrix.spec.ts

Implementation requirements:
1) Add equation id `curvature_unit_proxy_contract` to the equation backbone with:
   - category suitable for curvature diagnostics
   - explicit symbols + SI units
   - claim_tier <= diagnostic
   - root lane linkage
2) Add at least one congruence matrix row binding this equation id with:
   - residual metric
   - threshold
   - falsifier evidence hook
3) Ensure validator/tests treat this as deterministic and non-breaking for existing required equation coverage.

Required tests/commands:
- npm run test -- tests/physics-equation-backbone.spec.ts tests/math-congruence-matrix.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- New canonical equation ref exists.
- Congruence matrix includes residual skeleton for curvature-unit proxy lane.
- Tests and Casimir verification PASS.
```

## Prompt 2: TOE-CGA-003 (atomic->stress-energy bridge placeholder)

```text
Ticket: TOE-CGA-003
Objective: Add an explicit bridge placeholder node in the atomic tree that hard-fails unless a declared stress-energy mapping exists.

Allowed paths:
- docs/knowledge/physics/atomic-systems-tree.json
- tests/helix-ask-bridge.spec.ts
- tests/fixtures/graph-congruence-conditions-tree.json

Implementation requirements:
1) Add an atomic bridge placeholder node for atomic -> stress-energy lifting.
2) The node must carry deterministic strict-fail metadata:
   - fail code: FAIL_NO_ATOMIC_TO_TMU_NU_MAPPING
   - maturity ceiling: diagnostic
   - explicit proxy/display semantics until equation binding exists
3) Add test coverage proving the placeholder is present and produces deterministic fail metadata for bridge attempts.

Required tests/commands:
- npm run test -- tests/helix-ask-bridge.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- Atomic tree cannot imply a successful atomic->stress-energy bridge without explicit mapping metadata.
- Deterministic fail reason is represented and tested.
```

## Prompt 3: TOE-CGA-004 (equation-binding rail in graph resolver)

```text
Ticket: TOE-CGA-004
Objective: Enforce equation-binding rail for physics assertion/proxy bridge nodes in Helix Ask graph resolver.

Allowed paths:
- server/services/helix-ask/graph-resolver.ts
- configs/graph-resolvers.json
- tests/helix-ask-graph-resolver.spec.ts
- tests/fixtures/graph-congruence-conditions-tree.json

Implementation requirements:
1) Add resolver rail: if a traversed node/edge is physics assertion or cross-lane proxy, require known `equation_ref`.
2) Missing/unknown equation_ref must return deterministic fail reason:
   - FAIL_NODE_MISSING_EQUATION_REF
3) Keep existing congruence-walk behavior intact for non-physics conceptual nodes.
4) Add tests proving route construction is blocked when equation_ref is absent on guarded paths.

Required tests/commands:
- npm run test -- tests/helix-ask-graph-resolver.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- Missing equation refs on guarded paths are deterministic hard-fail.
- Existing resolver tests remain green.
```

## Prompt 4: TOE-CGA-005 (uncertainty rail in relation assembly)

```text
Ticket: TOE-CGA-005
Objective: Enforce uncertainty-model rail for cross-lane bridge inputs that feed runtime safety assembly.

Allowed paths:
- server/services/helix-ask/relation-assembly.ts
- configs/math-congruence-matrix.v1.json
- tests/helix-ask-relation-assembly.spec.ts
- tests/helix-ask-graph-resolver.spec.ts

Implementation requirements:
1) Require uncertainty metadata for cross-lane/proxy bridge evidence used in runtime safety assembly.
2) If uncertainty metadata is missing, emit deterministic fail reason (do not silently downgrade):
   - FAIL_MISSING_UNCERTAINTY_MODEL
   - or existing runtime gate missing-data fail code if your implementation maps to that contract.
3) Keep fail semantics replay-safe and explicit in output packet.
4) Add tests that verify missing uncertainty blocks gate assembly.

Required tests/commands:
- npm run test -- tests/helix-ask-relation-assembly.spec.ts tests/helix-ask-graph-resolver.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- Runtime safety assembly refuses cross-lane inputs without uncertainty metadata.
- Deterministic fail reason is covered by tests.
```

## Prompt 5: TOE-CGA-006 (citation integrity expansion)

```text
Ticket: TOE-CGA-006
Objective: Expand citation-integrity tooling to cover atomic<->curvature bridge claims.

Allowed paths:
- docs/knowledge/math-claims/atomic-system.math-claims.json
- scripts/math-congruence-citation-check.ts
- docs/math-citation-contract.md
- tests/helix-ask-math.spec.ts

Implementation requirements:
1) Add bridge claim ids with validity domains and maturity labels:
   - atomic_energy_to_energy_density_proxy.v1
   - telemetry_drift_injection_for_atomic_instrumentation.v1 (if missing or incomplete)
   - curvature_unit_proxy_contract.v1
2) Extend checker so bridge claims are validated for:
   - citation presence
   - validityDomain presence
   - non-placeholder maturity-safe metadata
3) Ensure strict mode fails when bridge claim citation/domain metadata is missing.
4) Update docs contract only as needed to reflect new enforced checks.

Required tests/commands:
- npm run math:congruence:check:strict
- npm run test -- tests/helix-ask-math.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- Bridge claims are registry-backed and checker-enforced.
- Strict checker and tests pass.
```

## Prompt 6: TOE-CGA-007 (canonical equation refs in lane trees)

```text
Ticket: TOE-CGA-007
Objective: Align derived residual equation_ref fields in physics trees with canonical equation backbone ids.

Allowed paths:
- docs/knowledge/physics/physics-spacetime-gr-tree.json
- docs/knowledge/physics/physics-quantum-semiclassical-tree.json
- tests/physics-root-lane-tree-parity.spec.ts
- tests/physics-equation-backbone.spec.ts

Implementation requirements:
1) Replace tree-local derived_residual equation refs with canonical ids:
   - GR lane -> `efe_baseline`
   - semiclassical lane -> `semiclassical_coupling`
2) Keep residual schema/tolerance/uncertainty metadata intact.
3) Add/adjust tests to guarantee derived residual refs map to known backbone ids.

Required tests/commands:
- npm run test -- tests/physics-root-lane-tree-parity.spec.ts tests/physics-equation-backbone.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- No tree-local residual equation ids remain for these lanes.
- Canonical ref validation is test-covered.
```

## Prompt 7: TOE-CGA-008 (maturity ceiling propagation rail)

```text
Ticket: TOE-CGA-008
Objective: Enforce maturity-ceiling propagation so diagnostic upstream evidence cannot imply certified downstream outputs.

Allowed paths:
- server/services/helix-ask/relation-assembly.ts
- configs/physics-root-leaf-manifest.v1.json
- tests/helix-ask-relation-assembly.spec.ts
- tests/physics-root-leaf-manifest.spec.ts

Implementation requirements:
1) Add/extend maturity propagation checks in relation assembly:
   - upstream diagnostic/proxy evidence must not produce certified claim surfaces.
2) Use deterministic fail reason for over-promotion attempts:
   - FAIL_MATURITY_CEILING_VIOLATION
   - or existing contradictory-contract code if mapped consistently and explicitly.
3) Ensure root-leaf manifest metadata supports this enforcement unambiguously.
4) Add tests that simulate diagnostic upstream -> certified downstream attempt and assert deterministic block.

Required tests/commands:
- npm run test -- tests/helix-ask-relation-assembly.spec.ts tests/physics-root-leaf-manifest.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- Maturity ceiling enforcement is end-to-end and test-covered.
- No over-promotion path can silently pass.
```

## Suggested Run Order

1. `Prompt 0` once.
2. `Prompt 1` through `Prompt 7` sequentially.
3. After each prompt, checkpoint commit and preserve verifier metadata in the commit note or ticket log.
