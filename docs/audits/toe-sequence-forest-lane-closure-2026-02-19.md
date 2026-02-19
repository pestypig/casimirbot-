# ToE Sequence: Forest-Wide Lane Closure (2026-02-19)

## Purpose
Capture the broad-census research result as an executable ticket sequence so
future agents can close lane gaps in a deterministic order.

This sequence is additive and replay-safe by default:
- prefer locked-only tree additions first,
- preserve existing pack routing unless explicitly expanded,
- enforce deterministic fail reasons and falsifier contracts.

## Source of Truth
- `docs/audits/forest-wide-first-class-lane-audit-2026-02-19.md`
- `docs/audits/first-class-root-lane-gap-research-brief.md`
- `docs/audits/toe-lane-orchestration-2026-02-18.md`

## Ticket Sequence (`TOE-082..TOE-089`)

### TOE-082-evidence-falsifier-ledger-lane
- objective:
  - Add `evidence-falsifier-ledger` as a first-class lane for evidence schema,
    provenance/claim-tier consistency, and deterministic contradiction/missing
    failures.
- allowed_paths:
  - `configs/graph-resolvers.json`
  - `configs/resolver-owner-coverage-manifest.v1.json`
  - `server/services/helix-ask/graph-resolver.ts`
  - `server/services/helix-ask/relation-assembly.ts`
  - `scripts/toe-agent-preflight.ts`
  - `tests/helix-ask-bridge.spec.ts`
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `docs/knowledge/evidence-falsifier-ledger-tree.json`
- required_tests:
  - `npx vitest run tests/helix-ask-bridge.spec.ts tests/helix-ask-graph-resolver.spec.ts`
  - `npm run audit:toe:preflight`
- done_criteria:
  - lane exists and is owner-covered,
  - deterministic fail taxonomy for evidence contract issues is test-pinned,
  - preflight includes ledger validation stage or equivalent gate.
- research_gate:
  - `risk_class=contract_only`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-083-tool-plan-tool-execution-contracts-lane
- objective:
  - Add `tool-plan-contracts` lane and normalize deterministic tool plan +
    execution receipt contracts.
- allowed_paths:
  - `configs/graph-resolvers.json`
  - `server/routes/agi.plan.ts`
  - `server/services/helix-ask/graph-resolver.ts`
  - `scripts/toe-agent-preflight.ts`
  - `tests/helix-ask-modes.spec.ts`
  - `tests/tool-contracts-replay.spec.ts`
  - `docs/knowledge/tool-plan-contracts-tree.json`
- required_tests:
  - `npx vitest run tests/tool-contracts-replay.spec.ts`
  - `npx vitest run tests/helix-ask-modes.spec.ts`
- done_criteria:
  - deterministic tool receipt shape is emitted for at least one tool path,
  - replaying identical plan input yields stable deterministic outputs,
  - missing/invalid receipts map to deterministic fail reasons.
- research_gate:
  - `risk_class=runtime_contract`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-084-orbital-ephemeris-provenance-lane
- objective:
  - Add `orbital-ephemeris-provenance` lane to close determinism/provenance
    gaps for orbital/time tool outputs.
- allowed_paths:
  - `configs/graph-resolvers.json`
  - `server/routes/agi.plan.ts`
  - `server/routes.ts`
  - `server/services/halobank/time-model.ts`
  - `tests/halobank-time-model.spec.ts`
  - `tests/horizons-proxy.spec.ts`
  - `docs/knowledge/orbital-ephemeris-provenance-tree.json`
- required_tests:
  - `npx vitest run tests/halobank-time-model.spec.ts tests/horizons-proxy.spec.ts`
- done_criteria:
  - lane exists with explicit provenance/falsifier nodes,
  - deterministic fail reasons for drift/nondeterminism are test-covered,
  - outputs are compatible with tool contract receipts from TOE-083.
- research_gate:
  - `risk_class=contract_only`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-085-physics-root-lanes-spacetime-semiclassical
- objective:
  - Add dedicated tree lanes:
    - `physics_spacetime_gr`
    - `physics_quantum_semiclassical`
- allowed_paths:
  - `configs/graph-resolvers.json`
  - `configs/physics-root-leaf-manifest.v1.json`
  - `configs/physics-equation-backbone.v1.json`
  - `scripts/validate-physics-root-leaf-manifest.ts`
  - `tests/physics-root-leaf-manifest.spec.ts`
  - `tests/physics-root-leaf-first-class-coverage.spec.ts`
  - `tests/physics-root-lane-tree-parity.spec.ts`
  - `docs/knowledge/physics/physics-spacetime-gr-tree.json`
  - `docs/knowledge/physics/physics-quantum-semiclassical-tree.json`
- required_tests:
  - `npx tsx scripts/validate-physics-root-leaf-manifest.ts`
  - `npx tsx scripts/validate-physics-equation-backbone.ts`
  - `npx vitest run tests/physics-root-leaf-first-class-coverage.spec.ts tests/physics-root-lane-tree-parity.spec.ts`
- done_criteria:
  - both root lanes are tree-addressable,
  - parity tests prove manifest roots map to tree lanes deterministically.
- research_gate:
  - `risk_class=physics_unknown`
  - `requires_audit=true`
  - `requires_research=true`
  - `required_artifacts=[physics-research-brief,falsifier-matrix]`

### TOE-086-physics-root-lanes-entropy-information
- objective:
  - Add dedicated tree lanes:
    - `physics_thermodynamics_entropy`
    - `physics_information_dynamics`
- allowed_paths:
  - `configs/graph-resolvers.json`
  - `configs/physics-root-leaf-manifest.v1.json`
  - `scripts/validate-physics-root-leaf-manifest.ts`
  - `tests/physics-root-leaf-manifest.spec.ts`
  - `tests/physics-root-lane-tree-parity.spec.ts`
  - `docs/knowledge/physics/physics-thermodynamics-entropy-tree.json`
  - `docs/knowledge/physics/physics-information-dynamics-tree.json`
- required_tests:
  - `npx tsx scripts/validate-physics-root-leaf-manifest.ts`
  - `npx vitest run tests/physics-root-leaf-manifest.spec.ts tests/physics-root-lane-tree-parity.spec.ts`
- done_criteria:
  - entropy-first root behavior remains deterministic and validator-compliant,
  - information lane has explicit falsifier linkage in parity tests.
- research_gate:
  - `risk_class=physics_unknown`
  - `requires_audit=true`
  - `requires_research=true`
  - `required_artifacts=[physics-research-brief,falsifier-matrix]`

### TOE-087-physics-root-lanes-prebiotic-biology-runtime-safety
- objective:
  - Add dedicated tree lanes:
    - `physics_prebiotic_chemistry`
    - `physics_biology_life`
    - `physics_runtime_safety_control`
- allowed_paths:
  - `configs/graph-resolvers.json`
  - `configs/physics-root-leaf-manifest.v1.json`
  - `scripts/validate-physics-root-leaf-manifest.ts`
  - `tests/physics-root-leaf-first-class-coverage.spec.ts`
  - `tests/physics-root-lane-tree-parity.spec.ts`
  - `docs/knowledge/physics/physics-prebiotic-chemistry-tree.json`
  - `docs/knowledge/physics/physics-biology-life-tree.json`
  - `docs/knowledge/physics/physics-runtime-safety-control-tree.json`
- required_tests:
  - `npx tsx scripts/validate-physics-root-leaf-manifest.ts`
  - `npx vitest run tests/physics-root-leaf-first-class-coverage.spec.ts tests/physics-root-lane-tree-parity.spec.ts`
- done_criteria:
  - all 7 physics roots are represented as tree lanes,
  - strict fail reasons for runtime safety paths remain deterministic.
- research_gate:
  - `risk_class=contract_only`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-088-robotics-recollection-lane-promotion
- objective:
  - Promote existing `robotics-recollection` lane to first-class via explicit
    falsifier templates and deterministic replay/veto contracts.
- allowed_paths:
  - `docs/knowledge/robotics-recollection-tree.json`
  - `server/routes/agi.adapter.ts`
  - `server/__tests__/agi.adapter.test.ts`
  - `tests/robotics-recollection.spec.ts`
- required_tests:
  - `npx vitest run tests/robotics-recollection.spec.ts server/__tests__/agi.adapter.test.ts`
- done_criteria:
  - robotics lane includes explicit falsifier nodes/reject rules,
  - replay/veto behavior emits deterministic fail reasons.
- research_gate:
  - `risk_class=runtime_contract`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-089-external-integrations-lane-promotion
- objective:
  - Promote existing `external-integrations` lane to first-class by enforcing
    provenance and deterministic integration drift contracts.
- allowed_paths:
  - `docs/knowledge/external-integrations-tree.json`
  - `configs/warp-primitive-manifest.v1.json`
  - `server/services/helix-ask/graph-resolver.ts`
  - `tests/startup-config.spec.ts`
  - `tests/external-integrations-contract.spec.ts`
- required_tests:
  - `npx vitest run tests/startup-config.spec.ts tests/external-integrations-contract.spec.ts`
  - `npx tsx scripts/validate-resolver-owner-coverage.ts`
- done_criteria:
  - provenance/claim-tier contract exists for integration entries,
  - deterministic fail taxonomy is tested for missing/contradictory provenance.
- research_gate:
  - `risk_class=contract_only`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

## Global Execution Rules
- Run each ticket in an isolated branch/chat.
- Keep changes additive where possible.
- For every patch:
  - run ticket required tests,
  - run `npm run audit:toe:preflight`,
  - run mandatory Casimir gate:
    - `npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`
- Write receipt:
  - `docs/audits/ticket-results/<ticket-id>.<UTCSTAMP>.json`
