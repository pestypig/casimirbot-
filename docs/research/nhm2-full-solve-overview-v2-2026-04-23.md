# NHM2 Full Solve Overview v2 (Journal-Style Draft, 2026-04-23)

## Abstract

This v2 draft presents the current Needle Hull Mark 2 (NHM2) full-solve status as evidenced by published repository artifacts (April 22-23, 2026). The pipeline currently reports a passing full-loop state with admitted same-chart observer tensor coverage on an Einstein-path closure route, while maintaining conservative claim-tier limits (`currentClaimTier=diagnostic`, `maximumClaimTier=reduced-order`). In the active selected profile (`stage1_centerline_alpha_0p995_v1`), bounded mission-time comparison reports a nonzero proper-minus-coordinate differential (`-688779.8295859098 s`) under explicit bounded-contract semantics. Concurrently, source-closure remains in `review` due to regional counterpart-policy limits (`region_basis_diagnostic_only`) and `assumption_drift`, despite very small global diagonal residuals (`relLInf=4.6143808140791624e-10`). The result is a stronger evidence and governance position, but not a broad scientific promotion state.

## Keywords

NHM2, warp metric diagnostics, 3+1 decomposition, Einstein-tensor route, observer admission, source closure, bounded transport contracts, reproducibility

## 1. Introduction

This document is a scientific-status report for the live NHM2 full-solve program state, not a feasibility manifesto. It is written to:
- summarize what the artifacts currently support,
- separate admitted evidence from non-claims,
- identify blockers between current status and higher-confidence pass goals.

The reporting principle is strict: claims are bounded by contract artifacts and policy gates, not by narrative extrapolation.

## 2. Methods And Evidence Model

### 2.1 Artifact-first evidence model

Primary evidence surfaces:
- `artifacts/research/full-solve/nhm2-full-loop-audit-latest.json`
- `artifacts/research/full-solve/nhm2-observer-audit-latest.json`
- `artifacts/research/full-solve/nhm2-source-closure-latest.json`
- `artifacts/research/full-solve/nhm2-strict-signal-readiness-latest.json`
- `artifacts/research/full-solve/nhm2-certificate-policy-latest.json`
- selected-family transport and decomposition artifacts in `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/`

### 2.2 Maturity and claim-tier model

The full-loop can pass section gates while claim tier remains conservative. Current simultaneous facts:
- full-loop `overallState=pass`,
- `currentClaimTier=diagnostic`,
- `highestPassingClaimTier=reduced-order`,
- `maximumClaimTier=reduced-order`.

Interpretation: operational closure improved, but policy does not authorize broader promotion.

### 2.3 3+1 same-chart semantics basis

The active semantics are the standard same-chart projection grammar:
- `T00 -> E`
- `T0i -> J_i`
- `Tij -> S_ij`

This aligns with established 3+1 formalism and numerical-relativity interface practice for scalar/vector/tensor stress-energy families.

### 2.4 Route-admission decision model

Observer semantic closure now records route-level evidence checks (metadata, comparability, finite-difference behavior, independent cross-check, citation coverage), then resolves route admission status and selected closure path.

Current decision:
- selected path: `full_einstein_tensor`
- ADM support-field path: not admitted
- Einstein path: admitted (effective route admission)

## 3. Results

### 3.1 Full-loop status

From `nhm2-full-loop-audit-latest.json` (`generatedAt=2026-04-23T03:45:47.383Z`):
- `overallState=pass`
- `currentClaimTier=diagnostic`
- `highestPassingClaimTier=reduced-order`
- `maximumClaimTier=reduced-order`
- selected profile: `stage1_centerline_alpha_0p995_v1`
- blocking reasons: none

### 3.2 Observer and semantic closure status

From `nhm2-observer-audit-latest.json`:
- `status=pass`, `completeness=complete`
- `observerMetricEmissionAdmissionStatus=admitted`
- `observerMetricT0iAdmissionStatus=derivable_same_chart_from_existing_state`
- `observerMetricOffDiagonalTijAdmissionStatus=derivable_same_chart_from_existing_state`
- `observerTileAuthorityStatus=full_tensor_authority`
- next action: `targeted_dec_physics_remediation`

Model-term evidence block:
- `routeId=einstein_tensor_geometry_fd4_v1`
- `routeAdmissionRaw=experimental_not_admitted`
- `routeAdmissionEffective=admitted`
- decision: `admit`
- check statuses include:
  - `fullEinsteinTensorRouteAdmission=pass`
  - `finiteDifferenceConvergence=pass`
  - `independentCrossCheck=pass`
  - `einsteinT00Comparability=pass`
  - `citationCoverage=pass`

### 3.3 Source-closure status

From `nhm2-source-closure-latest.json`:
- `status=review`
- reasons: `region_basis_diagnostic_only`, `assumption_drift`
- global diagonal residual norm remains small:
  - `relLInf=4.6143808140791624e-10` (`pass=true` vs configured tolerance)
- `assumptionsDrifted=true`

Regional direct-T00 basis remains diagnostic-only:
- hull/wall/exterior_shell each report missing counterpart authority for same-basis regional promotion.

### 3.4 Mission-time and decomposition outputs (selected profile)

From selected transport/mission artifacts:
- profile: `stage1_centerline_alpha_0p995_v1`
- `centerlineAlpha=0.995`, `centerlineDtauDt=0.995`
- mission-time interpretation: `bounded_relativistic_differential_detected`
- `properMinusCoordinate_seconds=-688779.8295859098` (about `-0.0218261157244502 yr`)

Shift-vs-lapse decomposition:
- model: `fixed_shift_transport_plus_centerline_lapse_projection`
- shift contribution: `137755965.9171795 s`
- lapse contribution: `-688779.8295858981 s`
- residual: `0 s`
- tracked fraction: `0.9999999999999829`

Worldline and in-hull observer results:
- shell-cross `dtau/dt` remains flat at `0.995`,
- shift-descriptor spread remains non-flat (`descriptor_varied_dtau_flat`),
- in-hull Eulerian proper acceleration profile is identically `0 m/s^2` for sampled cabin points.

### 3.5 Perturbation and boundary-sweep evidence

Envelope suite:
- `nhm2-envelope-perturbation-suite-latest.json` reports `status=pass`.

Boundary sweep:
- `nhm2-shift-lapse-boundary-sweep-latest.json` tests 104 stronger-side profiles down to `alpha=0.7300`.
- no first failure reached within tested bracket.
- strongest tested passing profile: `stage1_centerline_alpha_0p7300_v1`.
- timing differential magnitude grows monotonically across tested bracket.
- low-expansion and wall-safety usage trends remain flat in tested bracket.
- at tested boundary profile, `properMinusCoordinate_seconds=-37194110.79763849` (about `-1.17861024912029 yr`).

## 4. Discussion

### 4.1 What this indicates toward program goals

Positive indicators:
- observer semantic closure is materially stronger and route-explicit,
- same-chart full-tensor admission is now evidenced on the selected Einstein path,
- bounded differential behavior is stable across perturbation and stronger-side sweeps,
- certificate gate is currently green with integrity reported.

### 4.2 What it does not indicate

Not indicated by current evidence:
- claim-tier promotion above reduced-order,
- unrestricted ETA or speed certification,
- theorem-level global horizon/blueshift closure,
- source-closure completion at regional same-basis authority level.

### 4.3 Strategic implication

The strategy remains correctness-first:
- preserve conservative claim policy,
- close remaining source-contract semantics,
- run targeted DEC remediation on admitted route,
- only then reassess tier movement.

## 5. Limitations

- Source closure remains in `review` with explicit assumption drift.
- Regional direct-T00 counterpart authority is intentionally unresolved for promotion.
- Decomposition remains labeled `approximate` by its own contract.
- Current conclusions are profile- and contract-bounded, not universal across all warp families.

## 6. Next Patch Program (Recommended)

1. Source-closure semantic-contract cleanup  
Goal: reduce `assumption_drift` and clarify counterpart authority semantics without widening claim tier.

2. Targeted DEC remediation on admitted Einstein path  
Goal: improve DEC margins while preserving same-chart semantics and admission integrity.

3. Controlled stronger-side boundary continuation (if policy allows)  
Goal: identify first actual failure boundary, not just lower-bound passing bracket.

4. Claim-tier reassessment gate  
Goal: reassess `currentClaimTier` only if upstream source/observer/certificate surfaces remain aligned and unresolved blockers are closed.

## 7. Reproducibility And Integrity Checklist

Core publish and validation flow:

```bash
npm run warp:full-solve:nhm2-shift-lapse:publish-selected-transport
npm run warp:full-solve:nhm2-shift-lapse:publish-observer-audit
npm run warp:full-solve:nhm2-shift-lapse:publish-full-loop-audit
npm run warp:full-solve:nhm2-shift-lapse:publish-envelope-suite
npm run warp:full-solve:nhm2-shift-lapse:publish-boundary-sweep
npm run -s math:report
npm run -s math:validate
npm run -s warp:rodc:claims:validate
npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl
```

Current certificate snapshot (from latest policy artifact):
- verdict: `PASS`
- status: `GREEN`
- integrity: `ok`
- hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`

## 8. Conclusion

NHM2 now has materially improved semantic closure and bounded runtime evidence quality, especially on same-chart observer admission through an Einstein-route decision framework. This is substantial progression toward a scientifically defensible pass path. However, the program is not yet in a broad promotion state: claim tier remains constrained, and source-closure semantics retain explicit review-level residual governance issues. The near-term path to a stronger pass is therefore not narrative expansion; it is finishing contract-level closure and targeted physics remediation under current conservative policy.

## References

### External literature and interfaces

1. Alcubierre, M. "The warp drive: hyper-fast travel within general relativity." arXiv:gr-qc/0009013.  
   https://arxiv.org/abs/gr-qc/0009013

2. Natario, J. "Warp Drive With Zero Expansion." arXiv:gr-qc/0110086.  
   https://arxiv.org/abs/gr-qc/0110086

3. Gourgoulhon, E. "3+1 formalism and bases of numerical relativity."  
   https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf

4. Einstein Toolkit, `TmunuBase` documentation.  
   https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html

5. Le, A. T. "Observer-robust energy condition verification for warp drive spacetimes." arXiv:2602.18023.  
   https://arxiv.org/abs/2602.18023

### Internal artifact sources

- `artifacts/research/full-solve/nhm2-full-loop-audit-latest.json`
- `artifacts/research/full-solve/nhm2-observer-audit-latest.json`
- `artifacts/research/full-solve/nhm2-source-closure-latest.json`
- `artifacts/research/full-solve/nhm2-strict-signal-readiness-latest.json`
- `artifacts/research/full-solve/nhm2-certificate-policy-latest.json`
- `artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-vs-lapse-decomposition-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-in-hull-proper-acceleration-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/nhm2-shift-lapse-boundary-sweep-latest.json`
