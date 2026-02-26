# CasimirBot main deep research on why G4 fails now and where change surfaces exist

“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”

## Baseline evidence snapshot and contradictions

The current reduced-order campaign artifacts record a single hard failure with a globally consistent first-fail: **G4**. The cross-wave gate scoreboard reports **PASS=7, FAIL=1, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1**, with overall campaign decision **INADMISSIBLE** and the only failing gate **G4** (all waves A–D fail G4). This is explicitly labeled as the **readiness** lane, not the budget-stress lane (so the run is “evaluable,” not timing-limited). citeturn2search1

Within the same canonical run family, the executed report for 2026‑02‑24 records **identical G4 diagnostics across waves A/B/C/D**: `lhs_Jm3=-321623359840581200`, `bound_Jm3=-18`, `marginRatioRaw=17867964435587844`, `marginRatio=1` (policy-clamped), `rhoSource=warp.metric.T00.natario.shift`, and `metricContractStatus=ok`. It also records `FordRomanQI=fail` and `ThetaAudit=pass` everywhere, with applicability reported as `UNKNOWN` and `applicabilityReasonCode=G4_QI_SIGNAL_MISSING` (i.e., “curvature signal missing”) under `curvatureEnforced=true`. citeturn2search0

The 2026‑02‑26 baseline memo (R08) repeats the headline campaign status and the same `lhs/bound/marginRatioRaw` values per wave, but **drops `G4_QI_SIGNAL_MISSING` from the displayed reasonCode[] table** and reports only `[G4_QI_APPLICABILITY_NOT_PASS, G4_QI_MARGIN_EXCEEDED]` despite listing `applicabilityStatus=UNKNOWN`. It also references attached artifacts (wave-level `qi-forensics.json` files and a `g4-sensitivity-2026-02-26.json`) that are **not present** in the current repository path set provided for analysis. citeturn2search2

Separately, an older “readiness adjudication ledger” (R05, dated 2026‑02‑24) conflicts with the now-canonical readiness lane artifacts: it describes a **NOT_READY** outcome dominated by missing signals and timeouts, and lists different counts and a different global first-fail. This appears to correspond to an earlier **budget-stress**/incomplete run and is not consistent with the readiness-lane scoreboard and execution report now committed for the same date stamp. This is an important provenance contradiction: **the repository contains multiple incompatible “as-of 2026‑02‑24” narratives**, and the readiness-lane scoreboard/execution report should be treated as the operative baseline for G4 analysis unless provenance is re-stamped. citeturn3search0

Finally, the user-provided “strongest baseline facts” state `applicabilityStatus=NOT_APPLICABLE` and include `G4_QI_CURVATURE_WINDOW_FAIL` in the reason codes. That is **not what the committed readiness-lane execution report shows** (it shows `UNKNOWN` + signal missing). Reconciling these requires either (a) a later, not-in-repo readiness artifact set (e.g., the missing “decision readiness R10” file) that reclassifies `UNKNOWN` into `NOT_APPLICABLE`, or (b) a run where curvature invariants were present and failed the curvature-window rule (see applicability section below). citeturn2search4

## Executive verdict and blame split

**Executive verdict (most likely failing and why; 5 bullets max)**

- **G4 fails primarily because the QI margin is catastrophically exceeded**: the recorded `marginRatioRaw≈1.7868×10^16` arises from `|lhs_Jm3|≈3.216×10^17` versus `|bound_Jm3|=18`, which is a many-orders-of-magnitude violation that is robust to ordinary numerical uncertainty. citeturn2search0  
- **A second, independent failure channel exists in the same baseline run**: QI **applicability** is not established (`applicabilityStatus=UNKNOWN` under enforced curvature applicability), which fail-closes the applicability predicate and adds `G4_QI_APPLICABILITY_NOT_PASS` (and, in the execution report, `G4_QI_SIGNAL_MISSING`). citeturn2search0turn2search4  
- **Per-wave A/B/C/D G4 values are identical**, despite wave profile differences elsewhere, indicating that the current wave parameter envelope (as configured for the campaign) is **not actually moving the QI numerator source** (metric-derived `T00`) in the readiness artifacts. That makes “parameter-only” remediation unlikely unless the levers are changed to ones that actually couple into the metric `T00` path. citeturn2search0  
- **The bound value (`-18 J/m^3`) behaves like an enforced floor**, which is consistent with engineering/policy layers around a QI-motivated core rather than a direct one-paper theorem encoding; this does not “cause” the fail, but it amplifies how far the numerator must move to regain compliance. citeturn2search1turn2search2  
- **The biggest actionable uncertainty is not the inequality math, but the evidence chain**: missing curvature invariants (or missing curvature-to-applicability fields) prevent a definitive applicability adjudication, and referenced wave-level forensics/sensitivity artifacts are missing from the analyzed file set, limiting how precisely “units/scaling defect” can be ruled out without additional evidence. citeturn2search2turn3search0  

**Blame split (must sum to 100%)**

| Category | Share | Basis for allocation |
|---|---:|---|
| applicability_limited | 20% | Enforced curvature applicability is not satisfied in the committed readiness execution report (`UNKNOWN` / missing curvature scalar), and the user baseline indicates a possible `NOT_APPLICABLE` curvature-window fail variant. citeturn2search0turn2search4 |
| margin_limited | 65% | `marginRatioRaw≈1.7868×10^16` is an overwhelming violation; even large numerical error would not change pass/fail at threshold ζ=1. citeturn2search0 |
| scaling_or_units_risk | 10% | The magnitude mismatch is so large that a unit bug is a plausible hypothesis worth falsifying, but the geometric-to-SI stress conversion regime used in QI literature and typical GR practice is well-defined (see below), and the repository’s metric/GR unit machinery is coherent in concept. citeturn2search1turn2search0 |
| semantic/reporting mismatch | 5% | Reason-code presentation differs (e.g., `SIGNAL_MISSING` present in execution report but absent from the R08 table’s reasonCode list), and multiple same-date ledgers contradict each other, risking mis-triage. citeturn2search0turn2search2turn3search0 |

## QI value generation chain with unit and uncertainty annotations

The chain below is written to map **source fields → `lhs_Jm3` → `bound_Jm3` → `marginRatioRaw` → `marginRatio`**, with explicit producer/consumer anchors and where uncertainty can enter. “Confidence” grades are about *semantic correctness + unit integrity* at that stage, not about whether physics is “real.”

| Stage | Producer anchor (file::function) | Consumer anchor (file::function) | Expected units | Observed units in artifacts | Accuracy / uncertainty bound | Confidence |
|---|---|---|---|---|---|---|
| Metric stress-energy source selection (`rhoSource`) | `server/energy-pipeline.ts::estimateEffectiveRhoFromState()` and metric path resolver (`resolveMetricRhoFromState()` as referenced by internal parity docs) | `server/energy-pipeline.ts::evaluateQiGuardrail()` and `tools/warpViability.ts` FordRomanQI builder | Energy density (J/m³) for SI-normalized metric source | `rhoSource=warp.metric.T00.natario.shift` in readiness-lane wave A–D | Uncertainty dominated by how `T00` is sampled/averaged (spatial sampling, discretization). Even ±10^3 multiplicative error would not change FAIL when ζ_raw≈10^16. | B |
| Effective rho materialization (`effectiveRho`) | `server/energy-pipeline.ts::evaluateQiGuardrail()` (calls the effective-rho selector) | `server/energy-pipeline.ts::evaluateQiGuardrail()` integration loop | J/m³ | Implied by `lhs_Jm3` equality behavior and recorded `rhoSource` | For constant/stationary sources, windowed average equals effective rho to near floating precision if window normalization is correct; tests in repo explicitly assert this invariance. citeturn2search4 | A- |
| Phase schedule / sampling pattern | `server/energy/phase-scheduler.ts` (schedule) and `server/energy-pipeline.ts` pattern assembly | `server/energy-pipeline.ts::evaluateQiGuardrail()` integration | Mask is unitless; window weights are 1/s after normalization | Execution report references `tau_s=0.005`, sampler, sector schedule; but per-wave values identical | If schedule differs across waves but QI outputs do not, either schedule is constant, or schedule differences do not couple into metric-derived `T00` evaluation (a semantic/parameter-coupling issue, not numerical). | C |
| Window normalization (`sumWindowDt`) | `server/energy-pipeline.ts` window builder (normalizes so ∑g·dt=1) | `server/energy-pipeline.ts::evaluateQiGuardrail()` | ∑g·dt is unitless and should be 1 within tolerance | Not recorded in wave diagnostics; implied normalized | If window is normalized, LHS should track constant effective rho with relative error <1e-12 (double precision) when the mask is fully on; unit tests encode this expectation. citeturn2search4 | A |
| LHS integration (`lhs_Jm3`) | `server/energy-pipeline.ts::evaluateQiGuardrail()` | `tools/warpViability.ts` FordRomanQI; campaign scripts parse `lhs_Jm3` into evidence packs | J/m³ | `lhs_Jm3=-3.216233598405812e17` | Numerical integration error negligible compared with magnitude (window-averaged algebra). Dominant uncertainty is upstream effective rho correctness. | A- |
| QI bound computation core (`-K/τ^4`) | `server/qi/qi-bounds.ts::qiBound_Jm3()` | `server/qi/qi-bounds.ts::fordRomanBound()` and `server/energy-pipeline.ts` bound selection | J/m³ | In artifacts, `K=n/a`, `safetySigma_Jm3=n/a`, `bound_Jm3=-18` | If `bound_Jm3` is governed by a floor (policy/fallback magnitude), then K/τ^4 may be computed but dominated/clamped. This is a modeling/policy choice; numerical uncertainty is negligible once a floor is applied. | B- |
| Bound finalization/flooring (`bound_Jm3`) | `server/energy-pipeline.ts::evaluateQiGuardrail()` (applies configured floor and safety policy; clamps negativity) | Margin ratio computations + downstream gating | J/m³ (negative) | `bound_Jm3=-18` constant across waves | Error is essentially 0 if floor is deterministic. The open question is not numerical but semantic: whether `-18` is intended as a hard minimum bound magnitude (reduced-order guardrail) irrespective of τ. | B |
| Raw margin ratio (`marginRatioRaw`) | `server/energy-pipeline.ts::evaluateQiGuardrail()` (`|lhs|/|bound|`) | `tools/warpViability.ts` reason codes; UI/badge and campaign evidence | Unitless | `1.7867964435587844e16` | Relative error limited by float operations: <~1e-12 relative; dominated by upstream semantics. | A |
| Policy clamp (`marginRatio`) | `server/energy-pipeline.ts::evaluateQiGuardrail()` (`marginRatio = min(raw, maxZeta)` when policy clamp enabled) | Campaign reports and “zeta” fields; enforcement uses raw-first logic in multiple places | Unitless | `marginRatio=1` (clamped) | Clamp is deterministic; it should not change FAIL status when the FAIL condition uses `raw>=1` or uses `clamped==max` as a failure sentinel. The repo tests explicitly treat raw-first status as authoritative. citeturn2search4 | A- |
| Applicability computation (curvature window) | `server/energy-pipeline.ts::resolveQiCurvature()` (curvature invariants → curvature radius → ratio) | `server/energy-pipeline.ts::evaluateQiGuardrail()` sets `applicabilityStatus` / reason codes | Curvature scalar ~ 1/m⁴ (e.g., Kretschmann), derived radius in m, ratio unitless | Execution report: `applicabilityStatus=UNKNOWN`, `curvatureOk=unknown`, `curvatureRatio=n/a` | If invariants are missing, status is UNKNOWN (signal missing). If present and ratio exceeds threshold, status becomes NOT_APPLICABLE (curvature window fail). Unit tests explicitly encode these outcomes. citeturn2search4 | B |
| G4 gate materialization (FordRomanQI + reason codes) | `tools/warpViability.ts` constructs constraint + reason codes | `scripts/warp-full-solve-campaign.ts` consumes constraints to mark gate status FAIL | Qualitative gate status; reason codes | `FordRomanQI=fail`, `ThetaAudit=pass`, reason codes include margin exceeded + applicability not pass | Reason-code completeness is vulnerable to reporting/parsing conventions (e.g., whether `SIGNAL_MISSING` is preserved as a code or collapsed into applicability-not-pass). | B- |

## Applicability adjudication and curvature-window status

### Why NOT_APPLICABLE would be produced now

Quantum inequality / quantum energy inequality results in curved spacetime are known to depend on **sampling time compared to the characteristic geometric (curvature) scale**: flat-spacetime-style bounds can approximate curved-spacetime results when the sampling time is short compared with the relevant curvature scale, while curvature corrections become important otherwise. This “short sampling-time vs curvature scale” theme is explicit in curved-spacetime QEI work (e.g., static spacetimes, asymptotic regimes) and is directly relevant to any engineering rule that enforces a curvature-window condition. citeturn2search0turn2search4turn2search2

Within the repo’s own semantics, the curvature-window rule is implemented as an **applicability** classifier, not as part of the numeric inequality itself: when curvature invariants are available and large enough that the sampling time is not “short” compared with the derived curvature radius, applicability can become **NOT_APPLICABLE** with reason code `G4_QI_CURVATURE_WINDOW_FAIL`. When invariants are absent, applicability becomes **UNKNOWN** with reason code `G4_QI_SIGNAL_MISSING`. The unit tests encode all three: PASS applicability (small invariants), NOT_APPLICABLE (large invariants), and UNKNOWN (invariants unavailable). citeturn2search4

Therefore, the user baseline claim (`applicabilityStatus=NOT_APPLICABLE` and `G4_QI_CURVATURE_WINDOW_FAIL`) is consistent with a run where curvature invariants were present and violated the curvature-window criterion, while the committed 2026‑02‑24 readiness execution report (`UNKNOWN` + signal missing) is consistent with a run where curvature invariants were **not available at evaluation time**. citeturn2search0turn2search4

### Is the curvature signal unavailable, zero-valued, or numerically invalid

From the readiness execution report, the curvature fields are explicitly “unknown”/“n/a,” and the reason code includes `G4_QI_SIGNAL_MISSING`. That is strongest evidence of **signal unavailability** (missing invariants), not of a numeric zero or a non-finite/invalid value. citeturn2search0

The GR brick builder has an explicit control surface that can explain this: curvature-invariant summaries (e.g., Kretschmann and Ricci4 stats) are only produced when “extra” channels/invariants are included in the GR evolve brick; otherwise the diagnostics omit the invariants block. If the readiness lane did not request or plumb those “extra” outputs into the pipeline snapshot used by `evaluateQiGuardrail`, the curvature scalar needed for applicability cannot be computed, yielding UNKNOWN. citeturn2search3

### What evidence would move applicability to PASS or FAIL

To force a **definitive** applicability adjudication (not UNKNOWN/NOT_APPLICABLE-by-missing-signal), the following evidence is required:

- A recorded curvature invariant statistic (e.g., a percentile of Kretschmann scalar) and the derived curvature radius and ratio that the code uses to compare against the policy threshold (so that curvatureOk is explicitly true/false rather than “unknown”). This is the minimal evidence chain for the curvature-window rule. citeturn2search4turn2search0
- A numerical uncertainty statement for that invariant and derived ratio under mesh refinement (or another verification approach), because curvature scalars can be highly sensitive to discretization and differ by orders of magnitude near sharp features; standard solution verification methods (grid refinement, Richardson extrapolation, Grid Convergence Index) are widely used to bound discretization uncertainty for such derived quantities. citeturn4search0turn3search0

Under the repo’s current semantics, “FAIL” is expressed either as `NOT_APPLICABLE` (curvatureOk=false) or as “applicability not pass” reason coding when enforced; producing an explicit PASS/FAIL label for applicability (instead of PASS/UNKNOWN/NOT_APPLICABLE) would be a **semantic/reporting** change surface rather than a physics change.

## Margin adjudication and units/scaling risk

### Interpreting `marginRatioRaw ≈ 1.7868×10^16`

Because `marginRatioRaw = |lhs_Jm3| / |bound_Jm3|`, the recorded numbers imply:

- `|lhs_Jm3| ≈ 3.216×10^17 J/m^3`
- `|bound_Jm3| = 18 J/m^3`
- so `marginRatioRaw ≈ 1.7868×10^16`

This is not a near-threshold edge case; it is a **16‑order‑of‑magnitude** separation between numerator and bound. citeturn2search0turn2search2

A crucial robustness observation follows: even if **every plausible “normal” numerical uncertainty** (integration error, floating rounding, modest sampling bias) were treated adversarially, it would not move ζ from 10^16 down below 1. This makes the FAIL classification **numerically stable** in the mathematical sense, under the recorded model. citeturn4search0

### Clamp effects (`marginRatio=1` vs raw decision logic)

In the readiness artifacts, `marginRatio` is clamped to 1 while `marginRatioRaw` is retained. Clamping can serve UI stability or policy saturation, but it does **not** rescue correctness because the enforcement and reporting logic in this repository (as evidenced by tests and the execution report) retains raw-first semantics: FAIL is triggered because raw ζ is ≥ 1 and/or because clamped ζ has hit the maximum. citeturn2search4turn2search0

Practically: clamping **compresses severity** but does not (and should not) turn FAIL into PASS; the run remains INADMISSIBLE. citeturn2search0

### Could this be a units/scaling defect vs a true envelope failure

A units/scaling defect is plausible any time a GR/geometric-unit quantity is mapped into SI energy density, because geometric-to-SI stress conversions involve very large constants. Curved-spacetime QEI results and GR stress-energy formulations are usually consistent about dimensionality, but engineering pipelines can still misconstrue whether a field is already in SI or still in geometric units. citeturn2search0turn2search2

However, within the reduced-order gate context, the stronger inference from the readiness artifacts is:

- The numerator (`lhs_Jm3`) is sourced from a **metric-derived T00 path** with contract status ok (`metricContractStatus=ok`), and the negative energy density is enormous. This pattern is consistent across all waves. citeturn2search0
- The bound (`-18`) is tiny by comparison and looks like a deterministic floor, suggesting the guardrail is intentionally strict in J/m³ terms. Whether this bound is “physically canonical” is outside scope; within this campaign it is the declared guardrail. citeturn2search2turn2search1

Given those facts, a “true envelope” interpretation is: **under the present metric-derived energy-density normalization and the current bound floor, the system is deep into violation**, and the remediation must act on the numerator (reduce effective negative energy density) or on applicability admissibility evidence—not on loosening thresholds. That conclusion is compatible with the general QI literature point that negative energy is constrained in magnitude-duration tradeoffs, even though the campaign’s constants/guards are not claimed to be a direct feasibility theorem. citeturn2search1turn2search6turn2search8

The correct way to separate “units bug” from “envelope fail” here is **falsification via intermediate fields**: show, for the same snapshot, the chain `T00_geom → T00_SI → effectiveRho → lhs_Jm3`, and independently show how `bound_Jm3` is computed (including any floors). Without the missing per-wave `qi-forensics.json` artifacts, this remains partially evidence-limited. citeturn2search2turn4search0

## Change-surface matrix and minimal experiments

### Change-surface matrix

No direct code diffs are proposed below. Each lever is framed as a **surface** where change is possible without weakening guardrails or reinterpreting FAIL as PASS.

| Lever | file::function anchor | Expected directional effect | Risk | Falsifier | Confidence |
|---|---|---|---|---|---|
| Ensure curvature invariants are produced and present at QI evaluation time | `server/gr-evolve-brick.ts::buildGrEvolveBrick` (invariants gated on `includeExtra`); `server/energy-pipeline.ts::evaluateQiGuardrail` (applicability uses invariants) | Moves applicability from UNKNOWN to PASS/NOT_APPLICABLE with explicit `curvatureRatio` and `curvatureOk` | Runtime/memory increase; potential solver instability if extra channels stress budgets | After enabling invariants, `applicabilityStatus` still UNKNOWN (indicates wiring mismatch rather than missing compute) | Medium |
| Make wave profiles actually influence the metric T00 numerator | `scripts/warp-full-solve-campaign.ts::WAVE_PROFILES` → isolated runner → `server/gr/gr-agent-loop.ts::runGrAgentLoop` → metric adapter/stress source path | If successful, per-wave `lhs_Jm3` should change (and potentially reduce) when parameter levers change | High: unknown coupling (gamma/duty may not affect Natário metric T00 path at all) | `lhs_Jm3` remains invariant across waves even under extreme parameter changes → lever is not on the path | Medium-low |
| Expand QI “forensics” evidence output to include K and safetySigma (remove `n/a`) | `scripts/warp-full-solve-campaign.ts::deriveG4Diagnostics` and snapshot field mapping | Eliminates ambiguity about whether the bound is floor-dominated and whether K/σ are being computed but hidden | Low (instrumentation/reporting) | Even with fields present, bound remains exactly -18 and K/σ are absent → indicates upstream compute not executed | Medium |
| Align reasonCode reporting so signal-missing is not silently collapsed | Campaign report generator and reason-code ordering/parsing in campaign scripts (`deriveG4Diagnostics`) | Reduces semantic/reporting mismatch during triage; improves adjudication confidence | Low | Users still see conflicting reason codes for identical snapshots | High |
| Add explicit unit/provenance annotation at each QI intermediate (geom vs SI) | Energy pipeline QI audit log emitter (no threshold change) | Falsifies or confirms units/scaling bug hypotheses quickly | Low–medium | Intermediate chain shows consistent units end-to-end and ratio still ≈1.8e16 → not a units bug | Medium |
| Parameter-envelope lever: change the metric-contract inputs that plausibly bind Natário T00 | Warp config inputs used by metric adapter / Natário metric module (bubble radius, wall thickness, chart/observer) | May reduce `T00` magnitude; may shift theta/TS metrics too | Very high: may break other gates or exit the intended regime | `T00` magnitude does not change materially under large envelope sweeps | Low |

### Minimal experiment plan ranked by expected information gain

The goal is to **falsify** the leading hypotheses while keeping all guardrails and thresholds intact.

#### Curvature invariants availability hypothesis

**Hypothesis**: Applicability is UNKNOWN because curvature invariants are not produced/plumbed, not because they were computed and failed.

**Run (single-runner with explicit GR “extra” outputs)**  
Create an input JSON for the isolated runner that requests `includeExtra=true` (and optionally `includeMatter/includeKij`) in the GR options, then run the single runner.

```bash
cat > /tmp/fs-runner-input.json <<'JSON'
{
  "wave": "X",
  "runIndex": 1,
  "ciFastPath": false,
  "options": {
    "maxIterations": 1,
    "useLiveSnapshot": false,
    "commitAccepted": false,
    "gr": {
      "includeExtra": true,
      "includeMatter": true,
      "includeKij": true
    }
  }
}
JSON

npx tsx scripts/warp-full-solve-single-runner.ts --input /tmp/fs-runner-input.json --output /tmp/fs-runner-output.json
```

**Fields to compare (same run output JSON)**  
- `result.attempts[-1].evaluation.constraints` entries for `FordRomanQI` note fields: look for `curvatureOk`, `curvatureRatio`, `applicabilityStatus`, and any curvature-scalar fields if present.  
- Any `diagnostics.invariants` blocks in the GR diagnostics snapshot.  

**Pass/fail criteria**  
- **PASS for hypothesis falsification** (i.e., hypothesis was correct): `applicabilityStatus` changes from UNKNOWN to PASS or NOT_APPLICABLE; `curvatureRatio` is finite; invariants present.  
- **FAIL**: invariants are present but `applicabilityStatus` remains UNKNOWN → wiring/field-mapping defect; or invariants absent even with includeExtra → producer defect.

This experiment is justified by the curved-spacetime QEI literature’s dependence on curvature scale and by standard V&V practice: you need the curvature scalar and a discretization uncertainty bound before you can credibly enforce or waive the curvature-window approximation. citeturn2search2turn4search0turn3search0

#### Units/scaling defect hypothesis

**Hypothesis**: The 10^16 violation is (partly) due to a unit mismatch in mapping metric-derived quantities into SI energy density used by the QI guard.

**Run (canonical snapshot generation + ratio check)**  
Use the project’s canonical runtime snapshot tooling (as referenced in repo docs) to generate a fresh metric/guard snapshot from a running server, then verify that the geometric-to-SI conversion used for stress is consistent. (Exact command names vary by local setup; the baseline memo indicates `npm run warp:full-solve:canonical` is intended.) citeturn2search2

**Fields to compare**  
- Metric stress diagnostics: `rhoGeomMean` and `rhoSiMean` (or equivalent).  
- Verify that `rhoSiMean * (G/C^4)` matches `rhoGeomMean` within a tight floating tolerance (unit-integrity check).

**Pass/fail criteria**  
- **PASS (rules out unit mismatch at this conversion step)**: relative difference < 1e-9.  
- **FAIL**: mismatch indicates an SI/geom conversion defect or double-application omission.

This experiment is directly motivated by the fact that GR stress-energy dimensional conversions are large and must be auditable when used in inequality enforcement; however, it must not be used to relax guardrails—only to ensure the numerator and bound are expressed in consistent units. citeturn2search0turn2search1

#### Parameter-envelope coupling hypothesis

**Hypothesis**: Campaign wave parameter changes are not affecting the QI numerator, which is why A–D produce identical `lhs_Jm3`.

**Run (campaign in readiness lane, then compare per-wave intermediate fields)**  
```bash
npm run warp:full-solve:campaign -- --wave all --ci --ci-fast-path --wave-timeout-ms 120000 --campaign-timeout-ms 600000
```

**Fields to compare (per-wave artifacts)**  
- `A/qi-forensics.json` … `D/qi-forensics.json`: `effectiveRho`, `lhs_Jm3`, `rhoSource`, and any metric stress diagnostics.  
- Confirm whether any of these differ across waves.

**Pass/fail criteria**  
- **PASS (lever works)**: at least one of `effectiveRho` or `lhs_Jm3` changes materially across waves in the expected direction.  
- **FAIL (lever ineffective)**: all waves remain identical → parameter surface chosen for waves is not on the numerator path.

This experiment is critical because if the current wave profiles do not couple into `warp.metric.T00.natario.shift`, parameter-envelope-based remediation cannot succeed without choosing different levers. citeturn2search0turn2search2

## Defensible now and not defensible

| Claim | Defensible now | Basis | What is missing if not defensible |
|---|---|---|---|
| “Campaign decision is INADMISSIBLE because G4 is the first fail across all waves A–D in readiness lane.” | Yes | Consistent across the readiness scoreboard and first-fail map; execution report states global first fail G4 and decision INADMISSIBLE. citeturn2search0 | — |
| “G4 fails by enormous margin (ζ_raw ≈ 1.7868e16).” | Yes | Recorded explicitly in the readiness execution report and baseline memo. citeturn2search0turn2search2 | — |
| “ThetaAudit passes and is metric-derived in this run family.” | Yes | Execution report shows `ThetaAudit=pass` and provides metric-derived theta provenance in the same G4 block. citeturn2search0 | — |
| “Applicability is definitively NOT_APPLICABLE due to curvature window violation.” | Not yet (for the committed readiness run) | Committed readiness execution report shows `UNKNOWN` with `G4_QI_SIGNAL_MISSING`, not a computed curvature-window fail. citeturn2search0turn2search4 | Curvature invariant stats + derived curvature ratio for the same readiness snapshot (or the missing decision-readiness R10 artifact set) |
| “Wave profiles meaningfully explore the parameter envelope relevant to metric-derived QI numerator.” | Not defensible | A–D show identical `lhs/bound/ζ_raw`, implying no effective exploration of the numerator path in current readiness artifacts. citeturn2search0 | Per-wave intermediate forensics showing which parameters actually changed the metric T00 path |
| “g4-sensitivity-2026-02-26.json and per-wave qi-forensics.json exist and support conclusions.” | Not defensible from current repo file set | They are referenced as attached context in the baseline memo but are absent from the analyzed paths, preventing independent verification of intermediate values. citeturn2search2 | Those exact artifacts (or regenerated equivalents) committed with provenance and hashes |
| “This is a physical warp feasibility result.” | Not defensible (and out of scope) | The campaign explicitly disclaims physical feasibility claims. citeturn2search2 | — |

## Final recommendation

**Research-first** is the correct next step, because the dominant margin failure is already unambiguous at the reduced-order level, while the applicability determination and the units/scaling falsification require missing intermediate evidence. The minimal additional evidence can likely be produced using existing runners/scripts without weakening any guardrail.

If research-first, the top two missing evidence items are:

1. **Wave-level QI forensics artifacts (A–D) and the dated sensitivity artifact** referenced by the 2026‑02‑26 baseline memo (e.g., `A/qi-forensics.json` … `D/qi-forensics.json`, `g4-sensitivity-2026-02-26.json`) so that intermediate fields (`effectiveRho`, `rhoOn`, window normalization, curvature scalar/radius/ratio, K, safetySigma) can be audited and used to falsify units/scaling hypotheses. citeturn2search2  
2. **A curvature invariant + uncertainty statement** sufficient to adjudicate applicability under `curvatureEnforced=true`: record the invariant (e.g., Kretschmann percentile), the derived curvature radius and ratio, and provide a discretization uncertainty estimate (e.g., via grid refinement/GCI). This is required to credibly apply “flat-space approximation at short sampling times” logic that appears throughout curved-spacetime QEI work. citeturn2search2turn4search0turn2search4
