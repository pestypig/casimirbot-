# Warp Tree/DAG Congruence Task Plan

Status: draft  
Owner: dan  
Scope: Knowledge trees and DAG relations driven by the three congruence documents

## Purpose
Define a deterministic, math-allowed relation policy for the repo's knowledge trees and DAGs using the congruence findings. The goal is to keep conceptually similar nodes from being linked unless they are mathematically congruent under the Congruence Ladder (CL0-CL4), and to support deterministic tree walks that respect those constraints.

- Methods bundle index: `docs/warp-geometry-methods-bundle.md`
- `docs/warp-geometry-comparison.md`
- `docs/warp-geometry-congruence-report.md`
- `docs/warp-geometry-congruence-state-of-the-art.md`

## Non-goals
- No changes to GR/warp solver code in this phase.
- No claims of physical feasibility.

## Phase Status
- Phase 0: complete (see `docs/warp-tree-dag-inventory.md`).
- Phase 1: complete (see `docs/warp-tree-dag-congruence-policy.md`).
- Phase 2: complete (see `docs/warp-tree-dag-schema.md`).
- Phase 3: complete (inline metadata in tree JSON; see `docs/warp-tree-dag-schema.md`).
- Phase 4: complete (see `docs/warp-tree-dag-walk-rules.md`).
- Phase 5: complete (see `docs/warp-tree-dag-audit.md`).
- Phase M0: complete (see `docs/warp-geometry-cl0-methods.md`).
- Phase M1: complete (see `docs/warp-geometry-cl1-cl2-chart-contract.md`).
- Phase M2: complete (see `docs/warp-geometry-cl3-constraint-first-path.md`).
- Phase M3: complete (see `docs/warp-geometry-cl4-guardrail-map.md`).
- Phase M4: complete (see `docs/warp-geometry-vdb-region-ii-method.md`).
- Phase M5: complete (see `docs/warp-geometry-sigma-delta-policy.md`).

## Definitions
Congruence Ladder (CL0-CL4):
- CL0: 4-metric equivalence
- CL1: ADM field equivalence in fixed slicing
- CL2: Derived geometry equivalence (theta_beta, K_ij, invariants)
- CL3: Stress-energy equivalence (Eulerian rho_E or T_mu_nu)
- CL4: Guardrail congruence (repo constraints judge geometry-derived quantities)

Node classes (initial):
- metric_family
- adm_fields
- derived_geometry
- stress_energy
- guardrail_proxy
- guardrail_geometry
- pipeline_trace
- coordinate_chart

Edge types (initial):
- equivalent_metric (requires CL0)
- equivalent_adm (requires CL1)
- equivalent_geometry (requires CL2)
- equivalent_stress_energy (requires CL3)
- guardrail_congruent (requires CL4)
- conditional_region (requires region note)
- chart_dependent (requires chart note)
- proxy_only (explicitly not CL-aligned)

## Phase Plan

### Phase 0: Inventory and scope
Deliverables:
- Index of tree/DAG artifacts to update.
- Node-class inventory for existing warp/GR tree nodes.
- Edge inventory for existing cross-links.

Candidate files to scan:
- `docs/knowledge/warp/warp-mechanics-tree.json`
- `docs/knowledge/physics/physics-foundations-tree.json`
- `docs/knowledge/resonance-tree.json`
- `docs/knowledge/trees/gr-solver-tree.md`
- `docs/knowledge/trees/math-maturity-tree.md`

Exit criteria:
- A single table listing each node, its class, and its current edges.

### Phase 1: Congruence policy spec (rules)
Deliverables:
- A policy sheet mapping CL levels to allowed edge types.
- A rule for region-conditional congruence (B(r)=1 for VdB).
- A rule for chart-dependent congruence (explicitly tracked chart in node/edge metadata).

Example policy table:
```
Edge type              Requires     Notes
equivalent_metric      CL0          4-metric equivalence only
equivalent_adm         CL1          same slicing
equivalent_geometry    CL2          same theta_beta, K_ij
equivalent_stress_energy CL3        same rho_E or T_mu_nu
guardrail_congruent    CL4          uses geometry-derived inputs
proxy_only             none         explicitly non-congruent
```

Exit criteria:
- Policy reviewed and accepted by maintainers.

### Phase 2: Schema extension for nodes/edges
Deliverables:
- Node metadata fields for class, chart, and congruence level.
- Edge metadata fields for required CL level, region condition, and chart dependency.

Proposed metadata fields:
- node.class: string
- node.chart: string (optional)
- node.congruenceLevel: CL0..CL4 (optional)
- edge.requiresCL: CL0..CL4
- edge.condition: string (optional)
- edge.chartDependency: string (optional)
- edge.proxy: boolean

Exit criteria:
- Schema draft and migration plan for existing tree JSON/MD.

### Phase 3: Tree/DAG updates
Deliverables:
- Updated warp/GR tree nodes with congruence metadata.
- Edge pruning where relations are conceptually similar but not CL-allowed.
- New edges added where congruence is supported.
 - Inline metadata applied in tree JSON (see `docs/warp-tree-dag-schema.md`).

Exit criteria:
- No edge violates the policy table.
- Each edge is annotated with CL requirement and any region/chart constraints.

### Phase 4: Deterministic walk rules
Deliverables:
- Deterministic traversal rules that filter edges by required CL and chart.
- A reference walk config with fixed seed ordering.

Rules (draft):
- Walk only edges with requiresCL <= allowedCL.
- Drop proxy_only edges unless explicitly requested.
- If chartDependency is set, only traverse when active chart matches.
- For conditional_region, require the region predicate to be supplied by the walk.

Exit criteria:
- Deterministic walk produces identical outputs for fixed inputs.

### Phase 5: Validation and reports
Deliverables:
- Validation checklist showing which edges are allowed by which CL level.
- A summary report of "harmonized" subsystems vs "proxy-only" subsystems.

Exit criteria:
- Report includes a CL0-CL4 coverage table for each major subsystem.

## Methods Layer Progress Log
Record outcomes for each M-phase as work is executed.

| Phase | Status | Date | Owner | Notes |
| --- | --- | --- | --- | --- |
| M0 | complete | 2026-02-09 | dan | CL0 methods and falsifier checklist documented. |
| M1 | complete | 2026-02-09 | dan | Chart contract and CL1/CL2 checklist documented. |
| M2 | complete | 2026-02-09 | dan | Constraint-first CL3 path documented. |
| M3 | complete | 2026-02-09 | dan | Guardrail map and CL4 status drafted. |
| M4 | complete | 2026-02-09 | dan | VdB region II method and two-wall derivative check documented. |
| M5 | complete | 2026-02-09 | dan | Sigma-to-Delta policy documented with canonical vs operational mappings. |

## Methods Layer Phases (CL0-CL4 closure)
These phases translate the methods layer into concrete build steps with explicit CL targets.

### Phase M0: CL0 equivalence methods
CL target: CL0

Deliverables:
- A documented CL0 method choice per metric pair: author-stated diffeo when available, otherwise a declared invariant or Cartan-style procedure.
- A CL0 falsifier checklist (invariants or explicit diffeo mismatch).
- A policy note that CL0 is never judged by theta, K_ij, or other slicing-dependent quantities.
- M0 artifact: `docs/warp-geometry-cl0-methods.md`.

Acceptance criteria:
- Each metric pair has a CL0 method declared and logged.
- CL0 checks are documented as coordinate-invariant or author-stated.

Kickoff checklist:
- List all metric pairs that currently appear in the congruence tables.
- Record which pairs have explicit author-stated substitutions or diffeomorphisms.
- For the remaining pairs, declare the invariant method to use and log the chosen invariants.
- Capture a short CL0 falsifier list for each pair.

### Phase M1: Chart contract for CL1-CL2
CL targets: CL1, CL2

Deliverables:
- A chart contract per metric adapter specifying whether d_t gamma_ij is computed or asserted zero.
- A chart label vocabulary (lab, comoving, spherical) tied to each adapter.
- A rule that the stationary-slice reduction (C3) is only used when the chart contract justifies it.
- M1 artifact: `docs/warp-geometry-cl1-cl2-chart-contract.md`.

Acceptance criteria:
- Every adapter declares its chart and d_t gamma_ij handling.
- Any CL1 or CL2 comparison cites the chart contract.

Kickoff checklist:
- Enumerate all adapters and current chart assumptions in the repo.
- Mark which adapters currently assume d_t gamma_ij = 0 without justification.
- Draft the chart labels and add them to adapter metadata.
- Record which CL1 or CL2 comparisons must change once charts are explicit.

### Phase M2: Constraint-first stress-energy path
CL target: CL3

Deliverables:
- A constraint-first computation path: compute K_ij from ADM fields, then compute rho_E from the Hamiltonian constraint.
- A residual threshold policy for Hamiltonian and momentum constraints.
- A comparison rule that pipeline T00 is CL3-valid only when it matches constraint-derived rho_E.
- M2 artifact: `docs/warp-geometry-cl3-constraint-first-path.md`.

Acceptance criteria:
- A documented CL3 gate that compares constraint-derived rho_E to any pipeline stress-energy value.
- Residual thresholds are defined and tracked.

Kickoff checklist:
- Identify where ADM fields are sourced for the GR constraint gate today.
- Enumerate which paths currently map pipeline energy to curvature proxies.
- Define an initial residual threshold target (even if conservative).
- Add a minimal comparison report that prints constraint-derived rho_E vs pipeline T00.

### Phase M3: Guardrail congruence upgrade
CL target: CL4

Deliverables:
- A guardrail map that labels each constraint input as geometry-derived or proxy-only.
- A rename or replacement plan for proxy-only quantities that are labeled as geometry (for example, thetaProxy/thetaCal fallback).
- A CL4 source -> guardrail trace map with equation chains back to (alpha, beta, gamma_ij) and primary-source citations.
- A machine-readable JSON mirror of the guardrail trace map (`docs/warp-geometry-cl4-guardrail-map.json`).
- A CL4 audit table that reports which guardrails are geometry-congruent.
- M3 artifact: `docs/warp-geometry-cl4-guardrail-map.md`.

Acceptance criteria:
- Guardrail inputs are explicitly labeled geometry-derived or proxy-only.
- Trace map includes an equation chain to (alpha, beta, gamma_ij) for every guardrail input.
- CL4 audit reports pass/fail per guardrail.
- JSON mirror exists and matches the trace map table.

Kickoff checklist:
- Enumerate all guardrails in `WARP_AGENTS.md` and their current inputs.
- Label each guardrail input as geometry-derived or proxy-only.
- Identify which guardrail names require clarification or renaming.
- Draft the CL4 audit table format and fields.

### Phase M4: Van Den Broeck region II implementation method
CL targets: CL2, CL3

Deliverables:
- A function-valued B(r) definition (piecewise + smoothing) with explicit derivatives.
- A two-wall derivative signature check: nontrivial contributions in both B-transition and f-transition regions.
- A CL2/CL3 check that region II stress-energy depends on B' and B''.
- M4 artifact: `docs/warp-geometry-vdb-region-ii-method.md`.

Acceptance criteria:
- Region II calculations explicitly use B' and B''.
- Two-wall signature is observed or falsified with a documented outcome.

Kickoff checklist:
- Identify the current gammaVdB usage points and the implied B(r) assumptions.
- Select or define a candidate B(r) profile and smoothing scheme.
- Add a small diagnostic that computes B', B'' and logs region II support.
- Define the two-wall derivative signature check inputs and expected ranges.

### Phase M5: Sigma-to-wall thickness mapping method
CL target: CL2

Deliverables:
- A cited sigma-to-Delta mapping (Pfenning-Ford) for a canonical default.
- An explicit label for any alternative operational thickness definitions.
- M5 artifact: `docs/warp-geometry-sigma-delta-policy.md`.

Acceptance criteria:
- The canonical sigma-to-Delta mapping is documented with a citation.
- Any operational mapping is labeled as such and not conflated with paper defaults.

Kickoff checklist:
- Locate the sigma-to-Delta mapping reference and record the equation number.
- Decide which mapping is canonical for code defaults.
- Mark any operational mappings as implementation-defined.

## Methods Layer Cross-Reference (Synthesis IDs)
Map each methods phase to the assumption (A*) and open-question (Q*) IDs from `docs/warp-geometry-congruence-synthesis.md`.

| Phase | Synthesis Assumptions | Synthesis Open Questions | Notes |
| --- | --- | --- | --- |
| M0 | A1, A10 | Q2 | CL0 method selection and invariant falsifiers. |
| M1 | A5, A10 | Q3 | Chart contract and d_t gamma_ij handling. |
| M2 | A1, A4, A8 | Q4 | Constraint-first rho_E path and residual checks. |
| M3 | A9 | Q1 | Guardrail labeling and CL4 audit. |
| M4 | A4, A7 | Q5 | B(r) derivative modeling and two-wall derivative signature. |
| M5 | A6 | Q2 | Sigma-to-Delta mapping policy. |

## Build Plan (task-level)
1. Inventory nodes and edges in the warp/physics/resonance trees.
2. Classify nodes using the CL0-CL4 ladder and node classes.
3. Write the congruence policy sheet and get sign-off.
4. Extend node/edge metadata schema to carry CL requirements.
5. Update trees and DAGs to enforce policy.
6. Define deterministic tree-walk rules and config.
7. Validate with a policy audit report.
8. Execute methods-layer phases M0-M5 with CL0-CL4 targets.

## Long-term Plan (CL4-First)
1. Ship metric adapters that emit (alpha, beta, gamma_ij) plus chart contracts (CL0-CL2).
2. Compute K_ij, theta_beta, and rho_E from constraints (CL3).
3. Convert guardrails to geometry-derived inputs or label as proxy-only (CL4).
4. Wire CL4 edges into the trees so strict walks are non-trivial without loosening CL.
5. Maintain strict/default vs conceptual/overlay walk configs with clear labeling.
6. Keep verification gates green (math report/validate, GR constraints, Casimir verify).

## Acceptance Criteria
- Every edge has an explicit CL requirement.
- Proxy-only relations are labeled and not traversed by default.
- Deterministic walks are stable for fixed inputs.
- A policy audit can list all edges that are CL0-CL4 congruent.
- Each methods-layer phase has a recorded CL target and acceptance outcome.

## Next Action (Suggested Order)
1. Run Phase M0 to lock CL0 method selection and invariant falsifiers.
2. Run Phase M1 to finalize chart contracts for CL1-CL2 checks.
3. Run Phase M2 to implement constraint-first rho_E comparisons.
4. Run Phase M4 to implement VdB region II derivatives and two-wall derivative signature.
5. Run Phase M3 to update guardrail congruence labels and CL4 audit.
6. Run Phase M5 to lock the sigma-to-Delta mapping policy.

## Open Questions
- Which chart is canonical for each metric in the repo (lab vs comoving)?
- Should CL1 or CL2 be the default requirement for "related systems" edges? **Resolved: default is now CL4 (strict).**
- How should region-conditional congruence be represented in tree metadata?

## Future Congruence Research (Physics DAGs)
These are research items to schedule after the current task. Each item should be mapped to CL0-CL4 and then encoded as allowable or blocked edges.

1. Constraint-gate congruence:
   - Validate that GR constraint gate inputs are computed from geometry-derived quantities, not proxies.
   - Cross-map `server/gr/constraint-evaluator.ts` and `server/gr/gr-constraint-policy.ts` to tree nodes.
2. Stress-energy congruence:
   - Determine which stress-energy mappings are forward (metric -> rho_E) vs inverse (rho_E -> proxy curvature).
   - Add edges only for forward-congruent mappings (CL3).
3. Ford-Roman/QI congruence:
   - Establish whether the repo QI monitor corresponds to a specific sampling kernel in the papers.
   - Mark any guardrail as `proxy_only` if sampling windows or kernels differ.
4. VdB region-II congruence:
   - Implement and verify B(r) derivative dependence; add edges only after validation.
5. York-time / BSSN constraint congruence:
   - Identify which solver outputs correspond to paper-level invariants.
   - Only add CL2/CL3 edges if invariants match.
6. Coordinate-chart congruence:
   - Catalog which nodes require lab vs comoving charts.
   - Encode chart-dependent edges in the trees.
7. Sampling/time-bounds congruence:
   - Ensure time-window definitions (tauLC, burst, duty) align with any referenced literature.
   - Annotate edges with `condition` if sampling assumptions are required.

## Next TODO: Extend Congruence to Remaining Physics Trees
Status: in progress (2026-02-09) - added dual-path QI links (`guardrail_congruent` + `proxy_only`) in simulation systems, uncertainty mechanics, and physics foundations.
Objective: apply the same CL0-CL4 reasoning and edge policy to *all* physics trees beyond the warp-mechanics set.

Target trees:
1. `docs/knowledge/physics/physics-foundations-tree.json`
2. `docs/knowledge/physics/math-tree.json`
3. `docs/knowledge/physics/gr-solver-tree.json`
4. `docs/knowledge/physics/simulation-systems-tree.json`
5. `docs/knowledge/physics/uncertainty-mechanics-tree.json`
6. `docs/knowledge/physics/energy-conditions.md` and related tree nodes
7. `docs/knowledge/physics/ford-roman-quantum-inequality.md` and related nodes

Work steps:
1. Inventory and classify nodes with congruence classes (metric_family, adm_fields, derived_geometry, stress_energy, guardrail_proxy, guardrail_geometry, pipeline_trace, coordinate_chart).
2. Identify candidate edges that *look* similar but are not congruent; mark them `proxy_only` or add `blockedLinks`.
3. Add CL0–CL4 congruence edges where the math is proven by the papers and/or code.
4. Add chart and region conditions where slicing or region constraints are required.
5. Update deterministic walk config if a physics tree requires a different default chart or allowedCL.

Exit criteria:
- Every physics tree node has congruence metadata inline.
- Every edge in those trees has an explicit CL requirement or is marked conceptual.
- A CL0–CL4 audit table exists for each physics tree.

