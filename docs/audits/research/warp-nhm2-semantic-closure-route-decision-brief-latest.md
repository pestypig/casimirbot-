# NHM2 Semantic-Closure Route Decision Brief - 2026-04-20

## Patch Class
Einstein semantic-closure route-scoping patch (support-field blocker clearance on selected Einstein path).

## Scope
This brief records the machine-readable decision policy for the NHM2 model-term
semantic-closure path and the current route decision between:
- `adm_complete`
- `full_einstein_tensor`

It does not widen claim tier, observer admission, or certificate policy surfaces.

## Current Evidence Snapshot
From `artifacts/research/full-solve/nhm2-observer-audit-latest.json`:
- `modelTermSemanticAdmissionEvidence.routeId = einstein_tensor_geometry_fd4_v1`
- `routeAdmissionRaw = experimental_not_admitted`
- `routeAdmissionEffective = admitted`
- `routeAdmissionPromotionBasis = evidence_gate_promoted_full_einstein`
- `routeAdmission = admitted`
- `decision = admit`
- `checks.supportFieldRouteAdmission = fail`
- `checks.fullEinsteinTensorRouteAdmission = pass`
- `checks.independentCrossCheck = pass`
- `checks.finiteDifferenceConvergence = pass`
- `closurePathDecision.selectedPath = full_einstein_tensor`
- `closurePathDecision.nextPatchClass = einstein_semantic_closure_patch`
- `closurePathDecision.blockerCodes = none`
- `closurePathDecision.nonBlockingCodes = none`

This means the producer declaration remains experimental, but semantic admission
is promoted by evidence gates for the Einstein closure path without widening
claim tier, and the remaining ADM support-field gap is now treated as an
out-of-path diagnostic instead of a selected-path semantic blocker.

## Route-Selection Policy (Implemented)
Use deterministic selection order:
1. If ADM path admitted and Einstein path not admitted -> select `adm_complete`.
2. If Einstein path admitted and ADM path not admitted -> select `full_einstein_tensor`.
3. If both admitted -> follow route metadata hint (default Einstein-first unless
   metadata explicitly points to ADM).
4. If neither admitted -> use route metadata + independent cross-check evidence:
   - Einstein metadata/cross-check -> `full_einstein_tensor`
   - ADM metadata without stronger Einstein signal -> `adm_complete`
   - Otherwise -> `undecided`

## Current Decision
- `selectedPath = full_einstein_tensor`
- `nextPatchClass = einstein_semantic_closure_patch`
- `routeHint = einstein_route_metadata`
- `selectedPath.blockerCodes = none`
- `selectedPath.nonBlockingCodes = none`

## Route-Scoped Semantic Rule (Implemented)
When selected path is `full_einstein_tensor` and
`checks.fullEinsteinTensorRouteAdmission = pass`, suppress
`support_field_route_not_admitted` from selected-path blocker/non-blocker code
surfaces. Keep `checks.supportFieldRouteAdmission = fail` visible as diagnostic
evidence for the non-selected ADM path.

## Follow-Up Patch Instructions (Post-Latch)
1. Keep chart semantics fixed at `comoving_cartesian` and preserve existing
   `T00 -> E`, `T0i -> J_i`, `Tij -> S_ij` projection grammar.
2. Keep producer-owned emission route `einstein_tensor_geometry_fd4_v1` as the
   authoritative closure target; retain ADM as fallback only.
3. Keep finite-difference convergence and independent cross-check evidence in
   explicit pass/fail status with commensurate Einstein-family comparators
   (FD4 emitted route + independent FD2 reference route).
4. Keep evidence and policy gates explicit in the artifact:
   - `routeAdmissionRaw` tracks producer declaration;
   - `routeAdmissionEffective` tracks evidence-backed effective admission;
   - `routeAdmissionPromotionBasis` records why effective admission changed.
5. Do not retune physics, widen tolerances, reopen tile work, or widen claim tier.

## Validation Commands
- `npm run warp:full-solve:nhm2-shift-lapse:publish-observer-audit`
- `npm run warp:full-solve:nhm2-shift-lapse:publish-full-loop-audit`
- `npx vitest run tests/nhm2-observer-audit.spec.ts tests/warp-york-control-family-proof-pack.spec.ts --testTimeout=30000`
- `npm run -s math:report`
- `npm run -s math:validate`
- `npm run -s warp:rodc:claims:validate`
- `npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`

## Research Basis
- Gourgoulhon 3+1 formalism: https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf
- Natario zero-expansion warp context: https://arxiv.org/abs/gr-qc/0110086
- Einstein Toolkit TmunuBase producer contract: https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html
- Warp Factory (geometry-first stress-energy): https://arxiv.org/abs/2404.03095
- Warp Factory follow-on: https://arxiv.org/abs/2404.10855
- Observer-robust ADM/AD analysis: https://arxiv.org/abs/2602.18023
