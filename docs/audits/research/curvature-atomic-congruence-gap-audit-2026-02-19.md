# Curvature-Atomic Congruence Gap Audit for Helix Ask TOE Governance

## Executive summary

This audit evaluated whether the current repo supports a mathematically congruent and governance-safe chain from atomic-state parameters -> stress/energy proxies -> semiclassical/GR equation refs -> curvature-unit diagnostics -> runtime safety gates, with strict fail semantics in the Helix Ask tree/DAG resolver.

The key conclusion is that the repo implements comparatively strong intra-lane congruence framing for several physics lanes (via a canonical equation backbone and congruence matrix concepts), but the atomic lane remains materially disconnected from stress-energy and curvature diagnostic contracts. It therefore cannot be treated as congruent to TOE curvature lanes without additional rails and explicit proxy-only bridges.

The highest-risk gap is that the Electron Orbital Simulator UI describes itself as stitched to the live energy pipeline for instrumenting charge, spin, and Coulomb constants while the implementation introduces a pipeline-derived drift factor into Coulomb-force calculations. This cross-domain coupling is not bound to an equation object, has no declared uncertainty model for the coupling, and risks appearing physically deep while remaining unfalsifiable as a physics claim.

Repo governance tools already exist for math-claim citation integrity (citation contract and checker script), but they currently cover internal atomic-lane claims more directly than the atomic-to-curvature bridge surfaces needed for this chain.

Recommended direction:

- Treat the atomic simulator as a display/sandbox lane unless or until it can produce explicit stress-energy-relevant proxies with unit contracts, uncertainty models, and deterministic validators.
- Add Helix Ask rails so that any cross-lane bridge (atomic -> semiclassical/GR -> curvature-unit -> runtime gate) fails deterministically unless equation-bound and citation-valid under configured maturity ceilings.

## Congruence matrix

Legend:

- `coverage_status`: `covered` = explicit equation-binding + residual + uncertainty + citation contract in repo; `partial` = some contracts exist but one or more required components missing; `missing` = no defensible congruence bridge.
- `maturity_ceiling`: strictest ceiling implied by source lane and governance scope.
- `confidence_0_to_1`: confidence that classification matches repo reality.

| segment_id | source_tree_or_module | output_symbol_or_proxy | target_equation_ref | transform_or_mapping | units_contract | residual_contract_present | uncertainty_model_present | citation_contract_present | maturity_ceiling | coverage_status | strict_fail_reason_if_missing | confidence_0_to_1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| atomic-params-to-orbital-cloud | `client/src/lib/atomic-orbitals.ts` | `(x,y,z,weight,phase)` orbital cloud; `extent`, `referenceRadius` | *(none)* | Hydrogenic-like sample generation; diagnostic output | Coordinates in meters (Bohr-scaled), weights dimensionless | no | no | partial | diagnostic | partial | `FAIL_NO_EQUATION_BINDING_ATOMIC_OUTPUT` | 0.85 |
| orbital-cloud-to-stress-energy-proxy | `client/src/lib/atomic-orbitals.ts` -> intended bridge | inferred energy density from orbital density | `semiclassical_coupling` | No repo mapping shown from orbital density/weights to `<T_mu_nu>` | missing | no | no | no | diagnostic | missing | `FAIL_NO_ATOMIC_TO_TMU_NU_MAPPING` | 0.90 |
| electron-state-to-energy-scalar | `client/src/hooks/useElectronOrbitSim.ts` | `energyEV` per electron/state | `semiclassical_coupling` (candidate only) | Hydrogenic-style energy scalar only, no tensor mapping | eV | no | no | partial | diagnostic | partial | `FAIL_NO_STRESS_ENERGY_LIFT_FOR_ENERGY_SCALAR` | 0.80 |
| coulomb-experiment-to-k-derived | `client/src/hooks/useElectronOrbitSim.ts` | `forceMeasured`, `kDerived`, `relativeError` | *(none)* | Uses effective permittivity and pipeline drift | `N`, `N*m^2/C^2`, `m`, `F/m` | no | no | no | diagnostic | partial | `FAIL_ATOMIC_INSTRUMENTATION_NOT_EQUATION_BOUND` | 0.85 |
| pipeline-telemetry-to-atomic-drift-factor | `useEnergyPipeline()` -> `useElectronOrbitSim.ts` | `pipelineDuty`, `TS_ratio` -> `pipelineDrift` | `runtime_safety_gate` (candidate only) | Drift factor from stability ratio and duty; applied to Coulomb force | dimensionless | no | no | no | diagnostic | missing | `FAIL_CROSS_DOMAIN_COUPLING_NO_CONTRACT` | 0.95 |
| atomic-ui-claims-to-governance-labels | `client/src/components/ElectronOrbitalPanel.tsx` | UI narrative linking atomic + pipeline instrumentation | citation/maturity governance | No explicit rail ensuring UI text cannot read as certified physics | n/a | no | no | no | diagnostic | partial | `FAIL_UI_TEXT_EXCEEDS_MATURITY_CEILING` | 0.75 |
| atomic-tree-routing | `docs/knowledge/physics/atomic-systems-tree.json` | atomic system node set | Helix Ask routing rails | Atomic tree exists but no explicit equation-binding rail for cross-lane congruence | n/a | no | no | partial | diagnostic | partial | `FAIL_ATOMIC_TREE_MISSING_EQUATION_BINDING_RAIL` | 0.80 |
| atomic-tree-to-quantum-semiclassical-tree | atomic tree -> quantum-semiclassical tree | bridge edge(s) | `semiclassical_coupling` | No explicit bridge contract found in required surfaces | n/a | partial | partial | partial | experimental | missing | `FAIL_NO_TREE_BRIDGE_ATOMIC_TO_QUANTUM_SEMI` | 0.85 |
| semiclassical-to-gr-equation-ref | `configs/physics-equation-backbone.v1.json` | canonical refs (`semiclassical_coupling`, `efe_baseline`) | `efe_baseline` | Equation refs exist; usage-site binding not uniformly demonstrated | n/a | partial | partial | partial | experimental->certified | partial | `FAIL_EQUATION_REF_NOT_BOUND_IN_TREE_NODE` | 0.70 |
| gr-lane-to-curvature-lane | `docs/knowledge/physics/connection-curvature.md` + curvature notes | curvature connection narrative | `efe_baseline` / curvature diagnostics | Curvature surfaces documented; explicit equation-binding for curvature-unit not demonstrated | mixed | partial | partial | partial | experimental | partial | `FAIL_CURVATURE_UNIT_NOT_EQUATION_REGISTERED` | 0.75 |
| curvature-unit-diagnostics | `docs/curvature-unit-solar-notes.md` | curvature diagnostics | `runtime_safety_gate` (candidate) | Diagnostics documented; no first-class curvature-unit equation ref shown in backbone | mixed | partial | partial | partial | experimental | partial | `FAIL_CURVATURE_DIAGNOSTIC_NO_CANONICAL_EQUATION_REF` | 0.70 |
| curvature-to-runtime-safety-gate | root-leaf manifest + runtime assembly | `runtime_safety_gate` thresholds | `runtime_safety_gate` | Gate exists as equation ref; input-chain traceability remains partial | n/a | partial | partial | partial | gate-level certified, inputs diagnostic | partial | `FAIL_GATE_INPUTS_NOT_TRACEABLE_TO_EQUATION_CHAIN` | 0.80 |
| helix-ask-routing-strict-fail | `graph-resolver.ts` + `relation-assembly.ts` | fail semantics + evidence assembly | runtime governance | Resolver/assembly exist; atomic-path rail enforcement appears incomplete | n/a | partial | partial | partial | n/a | partial | `FAIL_RAIL_NOT_ENFORCED_FOR_ATOMIC_PATHS` | 0.75 |
| citation-integrity-for-math-claims | citation contract + checker script | claim citations + validity domains | governance contract | Citation tooling exists; bridge-claim coverage still partial | n/a | n/a | n/a | yes (covered claims) | n/a | partial | `FAIL_MATH_CLAIM_MISSING_CITATION_DOMAIN` | 0.85 |

## P0/P1/P2 gap ledger

### P0 gaps

#### P0-1: Cross-domain coupling without contract (atomic instrumentation <-> energy pipeline telemetry)

Why risk:

- Atomic simulator injects a pipeline-derived drift factor into Coulomb calculations.
- UI framing can be interpreted as physical calibration rather than display proxy.
- No equation object, uncertainty model, or deterministic fail labeling for this coupling.

Files to patch:

- `client/src/hooks/useElectronOrbitSim.ts`
- `client/src/components/ElectronOrbitalPanel.tsx`
- `server/services/helix-ask/graph-resolver.ts`
- `server/services/helix-ask/relation-assembly.ts`

Minimal additive patch:

- Add explicit `coupling_mode: "display_proxy"` metadata and UI badge.
- Require `equation_ref`, `uncertainty_model_id`, and `citation_claim_ids` for any cross-domain coupling to be treated as physics assertion.
- Otherwise hard-fail with deterministic reason.

Deterministic hook:

- Extend atomic claim-tier tests to assert drift path cannot serialize as certified physics.

#### P0-2: No atomic -> stress-energy (`<T_mu_nu>`) mapping

Why risk:

- Atomic outputs are visual clouds + scalar energies, not tensor-valued stress-energy quantities.
- Any implicit lift to stress-energy without contract is pseudo-rigor.

Files to patch:

- `docs/knowledge/physics/atomic-systems-tree.json`
- `configs/physics-equation-backbone.v1.json`
- `docs/knowledge/math-claims/atomic-system.math-claims.json`

Minimal additive patch:

- Add bridge-placeholder node in atomic tree that fails unless explicit stress-energy mapping is declared.
- Add narrow proxy equation ref for atomic-energy-to-density mapping with strict validity domain and uncertainty assumptions.

Deterministic hook:

- Helix Ask bridge test requiring `equation_ref + uncertainty_model_id`, otherwise `FAIL_NO_ATOMIC_TO_TMU_NU_MAPPING`.

#### P0-3: Atomic lane not uniformly governed by residual/uncertainty rails

Why risk:

- Equation backbone + citation tools exist, but atomic lane semantics are UI-simulator oriented.
- DAG stitching may over-connect atomic outputs to curvature diagnostics without meeting congruence definition.

Files to patch:

- `server/services/helix-ask/graph-resolver.ts`
- `server/services/helix-ask/relation-assembly.ts`
- `configs/graph-resolvers.json`

Minimal additive patch:

- Add explicit rail evaluators:
  - equation-binding rail
  - uncertainty-model rail
  - citation-integrity rail
- Enforce at edge-walk for cross-lane links.

Deterministic hook:

- Test that atomic->curvature routing fails deterministically when rail requirements are missing.

### P1 gaps

#### P1-1: Curvature-unit diagnostics not clearly registered as canonical equation objects

Why risk:

- Curvature-unit notes exist, but first-class canonical equation object binding appears incomplete.

Files to patch:

- `configs/physics-equation-backbone.v1.json`
- `configs/math-congruence-matrix.v1.json`

Minimal additive patch:

- Add `curvature_unit_proxy_contract` equation ref with:
  - input symbols
  - units contract
  - residual definition
  - uncertainty assumptions

Deterministic hook:

- Extend matrix validators: every curvature diagnostic claim path must bind to backbone equation ref.

#### P1-2: Derived residual refs in tree nodes may not be canonicalized against backbone IDs

Why risk:

- Tree-local identifiers may diverge from canonical equation backbone refs.

Files to patch:

- `docs/knowledge/physics/physics-spacetime-gr-tree.json`
- `docs/knowledge/physics/physics-quantum-semiclassical-tree.json`

Minimal additive patch:

- Require canonical refs such as `efe_baseline` and `semiclassical_coupling`.

Deterministic hook:

- Schema/validator check that every `derived_residual.equation_ref` exists in `physics-equation-backbone.v1.json`.

### P2 gaps

#### P2-1: No rigorous atomic quantum-statistics outputs suitable for stress-energy inference

Why risk:

- Current atomic simulator does not compute tensor-valued stress-energy outputs or metric-coupled field quantities.
- This is not a quick patch and should remain research-lane scoped.

Minimal additive patch:

- Keep as future research lane.
- Add strict gating to prevent false completion/certification semantics.

Deterministic hook:

- Fail any path attempting to label atomic->GR bridges as `certified`.

## Tree + DAG rail proposal

### Equation-binding rail

Intent:

- Any node/edge claiming physics mapping must bind to explicit equation object in `configs/physics-equation-backbone.v1.json`.

Concrete changes:

- In `docs/knowledge/physics/atomic-systems-tree.json`:
  - `equation_ref: null` for display-only nodes
  - `equation_ref: "atomic_energy_to_energy_density_proxy"` for proxy nodes
  - `equation_ref: "semiclassical_coupling"` only when explicit mapping exists
- In GR/semiclassical trees, ensure derived residual nodes use backbone refs.

Routing enforcement:

- In `server/services/helix-ask/graph-resolver.ts`:
  - if node is physics assertion/proxy and `equation_ref` missing or unknown -> `FAIL_NODE_MISSING_EQUATION_REF`.

### Parameter-consistency rail

Intent:

- Any transform declares symbol map + unit contract.

Concrete changes:

- Add node fields:
  - `symbol_map`
  - `units_contract`
- For pipeline drift coupling, label explicitly as display proxy unless contract complete.

### Uncertainty-model rail

Intent:

- Congruent paths require declared uncertainty assumptions.

Concrete changes:

- Require `uncertainty_model_id` for equation-bound or cross-domain nodes.
- In `relation-assembly.ts`, runtime gate rejects upstream results missing uncertainty metadata.

### Citation-integrity rail

Intent:

- Every math claim must map to citation + validity-domain metadata.

Concrete changes:

- Extend claim registry with bridge claims only after equation-binding and uncertainty rails are added.
- Extend `scripts/math-congruence-citation-check.ts` to verify tree-node claim refs resolve to registry entries with domains and citations.

### Fail-reason determinism rail

Intent:

- Missing congruence conditions must produce deterministic fail reasons.

Concrete changes:

- Standardize fail codes for:
  - missing equation binding
  - missing uncertainty model
  - missing citation claim IDs
  - maturity ceiling violation
  - unit/symbol mismatch
- Add tree-level routing policy fields in `configs/graph-resolvers.json`:
  - `display_only`
  - `proxy`
  - `physics_assertion`

## Citation upgrade plan

### Proposed new claim IDs

#### `atomic_energy_to_energy_density_proxy.v1`

- Validity domain: diagnostic proxy only, requires declared volume scale.
- Maturity: `diagnostic`
- Requires uncertainty declaration including volume ambiguity.

#### `telemetry_drift_injection_for_atomic_instrumentation.v1`

- Validity domain: telemetry-driven visualization drift, not physics coupling.
- Maturity: `diagnostic`
- Must cite code path and UI disclaimer surfaces.

#### `curvature_unit_proxy_contract.v1`

- Validity domain: experimental/diagnostic curvature proxy lane.
- Maturity: `experimental`
- Requires explicit mapping assumptions and uncertainty notes.

### Required registry/script edits

- Add bridge claim IDs to:
  - `docs/knowledge/math-claims/atomic-system.math-claims.json`
  - or separate `atomic-curvature-bridge.math-claims.json`
- Update `scripts/math-congruence-citation-check.ts`:
  - verify `equation_ref` nodes also declare `claim_ids`
  - fail when bridge claim citation/domain fields are missing
- Keep compliance with `docs/math-citation-contract.md`.

## TOE ticket batch

### TOE-CGA-001

- Objective: Label and gate atomic<->pipeline drift coupling as display proxy.
- Allowed paths:
  - `client/src/hooks/useElectronOrbitSim.ts`
  - `client/src/components/ElectronOrbitalPanel.tsx`
- Required tests:
  - extend atomic claim-tier test coverage for proxy-only serialization
- Done criteria:
  - explicit proxy label in UI and emitted metadata
- Research gate:
  - `maturity_ceiling=diagnostic`
  - `certifying=false`

### TOE-CGA-002

- Objective: Add canonical equation ref for curvature-unit proxy contract.
- Allowed paths:
  - `configs/physics-equation-backbone.v1.json`
  - `configs/math-congruence-matrix.v1.json`
- Required tests:
  - validator requiring curvature diagnostic bindings
- Done criteria:
  - equation ref + residual skeleton present
- Research gate:
  - `maturity_label=experimental`
  - `claim_tier=diagnostic`

### TOE-CGA-003

- Objective: Add atomic-tree bridge-placeholder node that hard-fails without explicit stress-energy mapping.
- Allowed paths:
  - `docs/knowledge/physics/atomic-systems-tree.json`
- Required tests:
  - routing test expecting `FAIL_NO_ATOMIC_TO_TMU_NU_MAPPING`
- Done criteria:
  - no silent atomic->stress-energy success path
- Research gate:
  - `maturity_ceiling=diagnostic`

### TOE-CGA-004

- Objective: Enforce equation-binding rail in graph resolver for physics assertion nodes.
- Allowed paths:
  - `server/services/helix-ask/graph-resolver.ts`
  - `configs/graph-resolvers.json`
- Required tests:
  - routing fail test for missing equation refs
- Done criteria:
  - deterministic fail reason + blocked path construction
- Research gate:
  - `no_certified_claims=true`

### TOE-CGA-005

- Objective: Enforce uncertainty-model rail for cross-lane bridges used in runtime safety assembly.
- Allowed paths:
  - `server/services/helix-ask/relation-assembly.ts`
  - `configs/math-congruence-matrix.v1.json`
- Required tests:
  - missing uncertainty model triggers deterministic failure
- Done criteria:
  - runtime gate refuses unqualified inputs
- Research gate:
  - maturity propagation required

### TOE-CGA-006

- Objective: Expand citation checker for atomic<->curvature bridge claims.
- Allowed paths:
  - `docs/knowledge/math-claims/atomic-system.math-claims.json`
  - `scripts/math-congruence-citation-check.ts`
  - `docs/math-citation-contract.md`
- Required tests:
  - checker fails on missing bridge citations/domains
- Done criteria:
  - bridge claims enforceable in CI
- Research gate:
  - `citation_integrity_required=true`

### TOE-CGA-007

- Objective: Align physics-tree derived residual refs to canonical backbone refs.
- Allowed paths:
  - `docs/knowledge/physics/physics-spacetime-gr-tree.json`
  - `docs/knowledge/physics/physics-quantum-semiclassical-tree.json`
  - `configs/physics-equation-backbone.v1.json`
- Required tests:
  - validator for `derived_residual.equation_ref` membership
- Done criteria:
  - no non-backbone residual refs
- Research gate:
  - respect certified-ref constraints

### TOE-CGA-008

- Objective: Add maturity-ceiling propagation rail so diagnostic upstream cannot imply certified downstream outputs.
- Allowed paths:
  - `server/services/helix-ask/relation-assembly.ts`
  - `configs/physics-root-leaf-manifest.v1.json`
- Required tests:
  - blocked assembly when upstream maturity too low
- Done criteria:
  - end-to-end maturity ceiling enforcement
- Research gate:
  - `no_over_promotion=true`

## Risk + deterministic mitigation

### Risk 1: Telemetry drift appears as real physics coupling

Mitigation:

- Require proxy-only mode unless equation + uncertainty + citations present.

### Risk 2: Orbital clouds interpreted as stress-energy outputs

Mitigation:

- Forbid stress-energy proxy emission without explicit equation-bound mapping and uncertainty contract.

### Risk 3: Curvature proxies interpreted as certified GR invariants

Mitigation:

- Force maturity label <= experimental for proxy paths and block certified phrasing without residual evidence.

### Risk 4: Silent fallback routing hides missing contracts

Mitigation:

- Deterministic hard-fail reasons in resolver/assembly for every rail miss.

### Risk 5: Citation drift on new bridge claims

Mitigation:

- Extend citation checker to include bridge claim IDs and fail CI on missing domains/citations.

## Disconfirmation criteria for major conclusions

### Conclusion: Atomic outputs are not currently stress-energy congruent

Disconfirm if:

- Repo gains explicit equation-bound mapping from atomic outputs to stress-energy proxies with residual checks, uncertainty metadata, and deterministic validators.

### Conclusion: Atomic <-> pipeline coupling is pseudo-rigor prone

Disconfirm if:

- Coupling is explicitly proxy-labeled in code/UI and prevented by rails from physics-assertion escalation above diagnostic tier.

### Conclusion: Curvature-unit diagnostics lack canonical equation registration

Disconfirm if:

- Backbone includes curvature-unit equation contracts and congruence matrix + tree nodes bind to those refs with residual and uncertainty fields.

### Conclusion: Helix Ask needs additional rails for safe cross-lane stitching

Disconfirm if:

- Resolver + relation assembly already enforce equation-binding, uncertainty, citation integrity, and maturity propagation for atomic paths with deterministic fail semantics and tests.

