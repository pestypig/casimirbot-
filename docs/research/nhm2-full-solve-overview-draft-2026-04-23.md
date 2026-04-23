# NHM2 Full Solve Overview (Draft, 2026-04-23)

## 1) Abstract

This draft summarizes the current NHM2 full-solve state as published in repo artifacts on April 22-23, 2026. The system is now on a same-chart full-tensor observer lane with an admitted Einstein-path closure route and a bounded transport stack that reports a non-zero proper-vs-coordinate timing differential under the current selected profile. At the same time, claim tier remains constrained (`diagnostic` current, `reduced-order` maximum), source-closure remains under `review`, and regional direct-T00 comparisons remain diagnostic-only by policy. This is progress in closure quality and bounded transport evidence, not a promotion to broad viability or speed claims.

## 2) Scope And Non-Claims

This document is a scientific-status overview, not a feasibility proof.

In scope:
- Published NHM2 full-loop and observer/source/certificate artifacts.
- Current route decision (ADM support-field route vs full Einstein-tensor route).
- Evidence quality, reproducibility, and integrity status.
- Next patch strategy for pass-grade progression.

Out of scope:
- Any max-speed certification.
- Any unrestricted route ETA certification.
- Any claim-tier widening beyond current contract outputs.
- Any theorem-level no-horizon or no-blueshift proof.

## 3) Snapshot (As Published)

### 3.1 Full-loop state

Source: `artifacts/research/full-solve/nhm2-full-loop-audit-latest.json`

- `generatedAt`: `2026-04-23T03:45:47.383Z`
- `overallState`: `pass`
- `currentClaimTier`: `diagnostic`
- `highestPassingClaimTier`: `reduced-order`
- `maximumClaimTier`: `reduced-order`
- `selectedProfileId`: `stage1_centerline_alpha_0p995_v1`
- `blockingReasons`: none

Interpretation: full-loop section gates pass, but policy still prevents claim-tier promotion beyond reduced-order.

### 3.2 Observer lane state

Source: `artifacts/research/full-solve/nhm2-observer-audit-latest.json`

- `status`: `pass`
- `completeness`: `complete`
- `observerMetricEmissionAdmissionStatus`: `admitted`
- `observerMetricT0iAdmissionStatus`: `derivable_same_chart_from_existing_state`
- `observerMetricOffDiagonalTijAdmissionStatus`: `derivable_same_chart_from_existing_state`
- `observerTileAuthorityStatus`: `full_tensor_authority`
- `observerNextTechnicalAction`: `targeted_dec_physics_remediation`

Einstein-route semantic closure evidence in same artifact:
- `routeId`: `einstein_tensor_geometry_fd4_v1`
- `routeAdmissionRaw`: `experimental_not_admitted`
- `routeAdmissionEffective`: `admitted`
- `selectedPath`: `full_einstein_tensor`
- `admPathStatus`: `fail`
- `fullEinsteinPathStatus`: `pass`
- checks: `fullEinsteinTensorRouteAdmission=pass`, `finiteDifferenceConvergence=pass`, `independentCrossCheck=pass`, `einsteinT00Comparability=pass`, `citationCoverage=pass`

### 3.3 Source-closure state

Source: `artifacts/research/full-solve/nhm2-source-closure-latest.json`

- `status`: `review`
- `completeness`: `complete`
- `reasonCodes`: `region_basis_diagnostic_only`, `assumption_drift`
- global residuals: `relLInf=4.6143808140791624e-10` (`pass=true` against tolerance)
- `assumptionsDrifted`: `true`
- regional direct-T00 comparison basis remains diagnostic-only with counterpart missing (`hull`, `wall`, `exterior_shell`)

Interpretation: global diagonal residuals are numerically tight, but semantic/policy closure is still open on regional counterpart authority.

### 3.4 Strict readiness and certificate status

Strict readiness source: `artifacts/research/full-solve/nhm2-strict-signal-readiness-latest.json`

- `status`: `pass`
- `strictModeEnabled`: `true`
- `thetaMetricDerived`: `true`
- `tsMetricDerived`: `true`
- `qiMetricDerived`: `true`
- `qiApplicabilityStatus`: `PASS`

Certificate policy source: `artifacts/research/full-solve/nhm2-certificate-policy-latest.json`

- `state`: `pass`
- `verdict`: `PASS`
- `viabilityStatus`: `ADMISSIBLE`
- `hardConstraintPass`: `true`
- `certificateStatus`: `GREEN`
- `certificateHash`: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- `certificateIntegrity`: `ok`

## 4) Current Physics/Transport Outputs

### 4.1 Selected profile transport

Source: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json`

- profile: `stage1_centerline_alpha_0p995_v1`
- `centerlineAlpha=0.995`, `centerlineDtauDt=0.995`
- promotion gate: `pass`
- low expansion source/status: `gr_evolve_brick` / `pass`
- wall safety status: `pass`
- `missionTimeInterpretationStatus`: `bounded_relativistic_differential_detected`
- `properMinusCoordinate_seconds`: `-688779.8295859098`

### 4.2 Worldline contract

Source: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json`

- `dtau_dt` is flat at `0.995` over shell-cross samples
- effective transport descriptor norm varies over samples
- `transportVariationStatus`: `descriptor_varied_dtau_flat`
- interpretation is explicitly bounded local descriptor semantics, not speed semantics

### 4.3 Shift-vs-lapse decomposition

Source: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-vs-lapse-decomposition-latest.json`

- model: `fixed_shift_transport_plus_centerline_lapse_projection`
- `approximationStatus`: `approximate`
- shift contribution: `137755965.9171795 s`
- lapse contribution: `-688779.8295858981 s`
- residual: `0 s`
- tracked fraction: `0.9999999999999829`

### 4.4 In-hull proper acceleration

Source: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-in-hull-proper-acceleration-latest.json`

- status: `bounded_in_hull_profile_certified`
- observer family: Eulerian comoving cabin
- all sampled proper-acceleration magnitudes are `0 m/s^2`
- no fallback path used in certified mode

## 5) Uncertainty And Reproducibility Evidence

### 5.1 Envelope perturbation suite

Source: `artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json`

- `status`: `pass`
- includes resolution, boundary-condition, and lapse-profile perturbation suites
- mission-time interpretation remains `bounded_relativistic_differential_detected` across reported passing cases

### 5.2 Stronger-side boundary sweep

Source: `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/nhm2-shift-lapse-boundary-sweep-latest.json`

- tested bracket extends from `alpha=0.9875` down to `alpha=0.7300` over 104 profiles
- strongest tested passing profile: `stage1_centerline_alpha_0p7300_v1`
- `failureBoundaryStatus`: `no_failure_reached_within_tested_stronger_bracket`
- timing differential trend: monotonic growth in magnitude within tested bracket
- low-expansion and wall-safety usage trends: flat within tested bracket

Interpretation: within the tested bracket, bounded differential scales while the monitored guardrails remain admitted. This is still bounded-contract evidence only.

## 6) Mathematical Basis And Research Alignment

### 6.1 3+1 tensor semantics and admission logic

The current repo semantics are aligned with standard 3+1 projections:
- `T00 -> E`
- `T0i -> J_i` (momentum-density projection)
- `Tij -> S_ij` (spatial stress projection)

This is consistent with the 3+1 decomposition formalism used in numerical relativity references and with the practical separation between scalar/vector/tensor stress-energy families in production NR interfaces.

### 6.2 Einstein-route strategy

The closure path selected in runtime evidence is `full_einstein_tensor`, not ADM support-field-only closure. That decision is consistent with:
- admitted same-chart Einstein-route evidence in observer audit artifacts,
- successful independent cross-check and finite-difference convergence gates,
- external tooling trends that compute stress-energy from geometry and then run observer-condition analysis.

## 7) Scientific Interpretation

What this indicates toward the NHM2 pass goal:
- Strong progress in semantic closure and observer-route legitimacy.
- Strong progress in bounded transport differential evidence under selected profile(s).
- Strong progress in reproducibility and integrity packaging.

What still blocks higher-confidence scientific claims:
- Claim tier remains constrained (`diagnostic` current).
- Source-closure remains under `review` with `assumption_drift`.
- Regional direct-T00 same-basis authority remains intentionally diagnostic-only (counterpart missing).

So the program is in a better-evidenced state, but not yet in a broad promotion state.

## 8) Recommended Next Patch Sequence

1. Source-closure semantic cleanup patch
- Goal: reduce `assumption_drift` and close regional counterpart ambiguity without widening claim tier.
- Constraint: keep regional comparison policy conservative unless true counterpart surfaces are admitted.

2. Targeted DEC remediation patch (observer next action)
- Goal: improve DEC margins on admitted same-chart route evidence.
- Constraint: no serializer theater, no claim-tier widening, no non-physical retuning.

3. Boundary extension patch (if still no first failure)
- Goal: continue controlled stronger-side bracket search to identify first gate failure.
- Constraint: preserve fail-closed policy and full artifact publication for each tested profile.

4. Claim-tier review patch (only after 1-3 and policy evidence)
- Goal: reassess `currentClaimTier` from evidence, not from narrative.
- Constraint: if any upstream gate remains review/ambiguous, hold tier.

## 9) Reproduction Commands (Current Workflow)

Use the same publish/validate path already in repo scripts:

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

## 10) References

### 10.1 External (research and primary interfaces)

1. Alcubierre, M. "The warp drive: hyper-fast travel within general relativity." arXiv:gr-qc/0009013.  
   https://arxiv.org/abs/gr-qc/0009013

2. Natario, J. "Warp Drive With Zero Expansion." arXiv:gr-qc/0110086.  
   https://arxiv.org/abs/gr-qc/0110086

3. Gourgoulhon, E. "3+1 formalism and bases of numerical relativity."  
   https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf

4. Einstein Toolkit, `TmunuBase` thorn documentation (stress-energy interface families).  
   https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html

5. Le, A. T. "Observer-robust energy condition verification for warp drive spacetimes." arXiv:2602.18023.  
   https://arxiv.org/abs/2602.18023

### 10.2 Internal (artifact and contract evidence)

- `artifacts/research/full-solve/nhm2-full-loop-audit-latest.json`
- `artifacts/research/full-solve/nhm2-observer-audit-latest.json`
- `artifacts/research/full-solve/nhm2-source-closure-latest.json`
- `artifacts/research/full-solve/nhm2-strict-signal-readiness-latest.json`
- `artifacts/research/full-solve/nhm2-certificate-policy-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-lapse-transport-result-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-warp-worldline-proof-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-mission-time-comparison-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-shift-vs-lapse-decomposition-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/nhm2-in-hull-proper-acceleration-latest.json`
- `artifacts/research/full-solve/nhm2-envelope-perturbation-suite-latest.json`
- `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/boundary-sweep/nhm2-shift-lapse-boundary-sweep-latest.json`
