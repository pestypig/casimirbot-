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

---

## Post-Closure Remaining Build Prompts (Pre-New-Research)

Use this section now that `TOE-CGA-001..008` rails/contracts are landed.  
The remaining gap from the last research audit is **P2 implementation**:

- actual `atomic -> stress-energy proxy` computation
- explicit units/uncertainty/citation payloads for Helix paths
- deterministic non-certifying semantics preserved

### Prompt 8: P2 Coordinator (run once)

```text
Current repo status:
- TOE-CGA-001..008 rails are already implemented and tested.
- Remaining obligation is P2: implement actual atomic->stress-energy proxy computation and wire outputs into Helix viewer launch surfaces.

Execution order (one commit per prompt):
Prompt 9 -> Prompt 10 -> Prompt 11 -> Prompt 12

Rules:
1) Keep maturity ceiling diagnostic/reduced-order unless explicit certified evidence exists.
2) Preserve strict-fail rails already landed (do not weaken placeholder fail paths).
3) Additive changes only; no destructive rewrites.
4) After each prompt run tests + Casimir verify.

Required verify command after each prompt:
npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Report after each prompt:
- files changed
- behavior delta
- tests run + result
- casimir verify summary: verdict, firstFail, certificateHash, integrityOk, traceId, runId
```

### Prompt 9: P2-A Atomic Stress-Energy Proxy Compute Kernel

```text
Ticket: P2-A atomic stress-energy proxy compute
Objective: Add deterministic computation that maps atomic orbital state parameters to a diagnostic stress-energy-relevant proxy payload with explicit units/uncertainty/citations.

Allowed paths:
- client/src/lib/atomic-orbitals.ts
- shared/curvature-proxy.ts (read-only usage preferred; only patch if needed)
- tests/atomic-orbital-claim-tier.spec.ts
- add new test file under tests/, e.g. tests/atomic-stress-energy-proxy.spec.ts

Implementation requirements:
1) Add a typed output structure for atomic proxy mapping from orbital parameters:
   - energy_scalar_eV
   - energy_scalar_J
   - effective_volume_m3
   - energy_density_J_m3 (proxy, not <T_mu_nu>)
   - kappa_proxy_m2 (via shared curvature helper if available)
2) Attach explicit governance metadata to this proxy object:
   - equation_ref: "atomic_energy_to_energy_density_proxy"
   - uncertainty_model_id: non-empty deterministic id
   - citation_claim_ids includes "atomic_energy_to_energy_density_proxy.v1"
   - claim_tier: "diagnostic"
   - provenance_class: "proxy"
   - certifying: false
3) Add a conservative uncertainty payload:
   - relative_1sigma and absolute_1sigma_J_m3
   - uncertainty assumptions text/labels for volume-scale ambiguity
4) Keep semantics explicit: this is a diagnostic proxy, not stress-energy tensor inference.

Required tests/commands:
- npm run test -- tests/atomic-orbital-claim-tier.spec.ts tests/atomic-stress-energy-proxy.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- Deterministic atomic proxy compute exists and is test-covered.
- Output includes units, uncertainty, equation ref, and citation claim ids.
- Non-certifying proxy semantics enforced.
```

### Prompt 10: P2-B Wire Proxy into Atomic Runtime + Viewer Launch Contract

```text
Ticket: P2-B proxy wiring
Objective: Surface computed atomic stress-energy proxy metadata through atomic runtime state and Helix viewer launch payloads.

Allowed paths:
- client/src/hooks/useElectronOrbitSim.ts
- server/routes/agi.plan.ts
- client/src/lib/agi/api.ts
- client/src/components/ElectronOrbitalPanel.tsx
- tests/helix-ask-modes.spec.ts
- tests/atomic-orbital-claim-tier.spec.ts (if contract assertions belong here)

Implementation requirements:
1) Integrate proxy compute into atomic runtime hook output.
2) Extend Helix atomic viewer launch type/contracts to include proxy payload block:
   - stress_energy_proxy (or equivalent deterministic field name)
   - include units + uncertainty + citation/equation metadata from Prompt 9
3) Keep existing launch params backward-compatible.
4) Ensure UI can read/use payload without breaking existing behavior.
5) Do not emit certified wording or certifying=true for this lane.

Required tests/commands:
- npm run test -- tests/helix-ask-modes.spec.ts tests/atomic-orbital-claim-tier.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- Helix viewer launch includes deterministic proxy payload with governance metadata.
- Existing atomic launch behavior remains compatible.
- Tests and Casimir verify PASS.
```

### Prompt 11: P2-C Canonical Equation + Congruence Binding for Atomic Proxy

```text
Ticket: P2-C equation/cross-lane binding
Objective: Canonically register the atomic energy-density proxy equation and bind it into matrix/rails without over-promoting maturity.

Allowed paths:
- configs/physics-equation-backbone.v1.json
- configs/math-congruence-matrix.v1.json
- docs/knowledge/physics/atomic-systems-tree.json
- tests/physics-equation-backbone.spec.ts
- tests/math-congruence-matrix.spec.ts
- tests/helix-ask-graph-resolver.spec.ts

Implementation requirements:
1) Add equation id `atomic_energy_to_energy_density_proxy` to backbone with SI symbols and diagnostic claim tier.
2) Add congruence matrix row for this equation with residual + falsifier metadata and explicit uncertainty model id.
3) In atomic tree, add/upgrade node metadata for the proxy-compute path:
   - validity.equation_ref bound to new canonical id
   - claim_ids include atomic proxy claim id
   - keep placeholder hard-fail node for unresolved atomic-><T_mu_nu> mapping
4) Ensure graph resolver rails treat the new proxy node as equation-bound and claim-linked while preserving strict fail for actual tensor lift when missing.

Required tests/commands:
- npm run test -- tests/physics-equation-backbone.spec.ts tests/math-congruence-matrix.spec.ts tests/helix-ask-graph-resolver.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- Atomic proxy equation is canonical and matrix-bound.
- Atomic tree expresses proxy path and preserves unresolved tensor-lift strict fail path.
```

### Prompt 12: P2-D Citation/Contract/Strict-rail Closure

```text
Ticket: P2-D contract closure
Objective: Ensure citation checker and relation assembly rails recognize and enforce new atomic proxy outputs end-to-end.

Allowed paths:
- docs/knowledge/math-claims/atomic-system.math-claims.json
- scripts/math-congruence-citation-check.ts
- docs/math-citation-contract.md
- server/services/helix-ask/relation-assembly.ts
- tests/helix-ask-relation-assembly.spec.ts
- tests/helix-ask-math.spec.ts

Implementation requirements:
1) Confirm atomic proxy claim entry includes required citations/validity-domain metadata for emitted payload.
2) Extend checker coverage to fail when proxy-emitting nodes omit required claim ids/equation linkage metadata.
3) Ensure relation assembly emits deterministic fail reason when proxy payload is missing uncertainty/citation metadata on cross-lane usage.
4) Keep maturity ceiling propagation intact (diagnostic upstream cannot silently promote to certified outputs).

Required tests/commands:
- npm run math:congruence:check:strict
- npm run test -- tests/helix-ask-relation-assembly.spec.ts tests/helix-ask-math.spec.ts
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- Citation and rail enforcement includes the new atomic proxy path.
- Deterministic fail semantics remain explicit and tested.
```

### Prompt 13: Strict-Ready Release Gate Cleanup (Recommended)

```text
Ticket: P2-E strict-ready release cleanup
Objective: Clear strict-ready release block in progress snapshot:
- strict_ready_release_gate.status = blocked
- blocked_reasons includes missing_verified_pass and missing_math_congruence

Allowed paths:
- configs/math-congruence-matrix.v1.json
- docs/audits/toe-progress-snapshot.json
- docs/audits/ticket-results/*.json (only if needed to fix stale/non-pass verification metadata)
- docs/audits/research/* (only for run report artifacts)

Implementation requirements:
1) Resolve `missing_math_congruence` first:
   - rebuild deterministic matrix:
     tsx scripts/build-math-congruence-matrix.ts
   - validate matrix:
     tsx scripts/validate-math-congruence-matrix.ts
2) Recompute strict-ready snapshot:
   - tsx scripts/compute-toe-progress.ts
3) Run preflight with strict gate enforcement and capture blockers:
   - set TOE_STRICT_READY_RELEASE_GATE_ENFORCE=1
   - npm run audit:toe:preflight
4) If `missing_verified_pass` remains:
   - identify exact delta target tickets from `strict_ready_delta_targets`
   - patch only the minimal eligible ticket-result artifacts needed to convert blocked targets to verified-pass + maturity-eligible tiers
   - rerun steps 1-3 after each additive subset
5) Keep all changes replay-safe and deterministic; do not weaken release gates.

Required tests/commands:
- tsx scripts/build-math-congruence-matrix.ts
- tsx scripts/validate-math-congruence-matrix.ts
- tsx scripts/compute-toe-progress.ts
- cross-env TOE_STRICT_READY_RELEASE_GATE_ENFORCE=1 npm run audit:toe:preflight
- npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

Done criteria:
- `totals.math_congruence_gate.status` is `pass`.
- `totals.strict_ready_release_gate.status` is `ready` OR remaining blockers are reduced and explicitly enumerated with deterministic next-ticket list.
- Casimir verification PASS with certificate integrity OK.
```

### Suggested Run Order (Post-Closure)

1. `Prompt 8` once.
2. `Prompt 9` through `Prompt 12` sequentially.
3. `Prompt 13` for strict-ready release cleanup.
4. After each prompt, keep one commit and include Casimir verification summary fields in commit notes or ticket logs.
