# R09 G4 QI Root-Cause Adjudication

## Executive verdict and blame split

**1. Executive verdict (3–6 bullets)**

- The current G4 blocker is *simultaneously* emitting an applicability-path failure (`G4_QI_APPLICABILITY_NOT_PASS` with `applicabilityStatus=UNKNOWN`) and a margin failure (`G4_QI_MARGIN_EXCEEDED` with `marginRatioRaw≈1.7868e16`, `marginRatio=1`). The repo’s own R08 baseline shows this is universal across waves A–D and across the 8-case sensitivity sweep.  
- On “canonical” repo adjudication rules, the **applicability-path failure is decisive**: `applicabilityStatus=UNKNOWN` is fail-closed and prevents treating the margin computation as a fully adjudicated “true QI fail,” because the curved-spacetime validity domain is unresolved (i.e., evidence path is blocked by applicability unknown).  
- Independently, the **margin exceedance signal is enormous** (`|lhs_Jm3| / |bound_Jm3| ≈ 1.7868×10^16`), so even if applicability were later closed to PASS, the current evidence suggests the run would still be margin-limited **unless** there is a major scaling/units defect in either `lhs_Jm3`, `bound_Jm3`, or the conversion/link between “metric-derived T00” and the QI-bound domain.  
- The applicability logic itself (requiring “local flatness” / small sampling time compared to curvature scales) is strongly literature-aligned: the Ford–Roman style use in curved spacetime is argued to hold only on scales small compared to the minimum local curvature radius (and away from boundaries). citeturn6search1turn6search2  
- Therefore, R09 posture: **evidence-path-blocked + likely margin-limited**, with a nontrivial **units/scaling risk** that must be falsified before declaring a “true margin failure” at the current envelope.

**2. Blame split table (percent + repo refs + literature refs)**  
*(Must sum to 100%; “repo refs” use the canonical report + R08 baseline; “literature refs” are targeted primary/peer-reviewed sources.)*

| Bucket | Percent | Rationale grounded in repo evidence | Repo refs (canonical) | Literature refs (targeted) |
|---|---:|---|---|---|
| applicability_limited | 55% | All baseline waves A–D show `applicabilityStatus=UNKNOWN` and include `G4_QI_APPLICABILITY_NOT_PASS`. Sensitivity sweep: 8/8 cases have `G4_QI_APPLICABILITY_NOT_PASS` and **none** reach `applicabilityStatus=PASS`. This blocks adjudicating whether flat-space QI is being applied inside its curved-spacetime validity domain. | `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md` (per-wave `applicabilityStatus=UNKNOWN`) and `docs/audits/research/warp-g4-qi-baseline-R08-2026-02-26.md` (baseline + sweep summary) | entity["people","Larry H. Ford","physicist"] / entity["people","Thomas A. Roman","physicist"] argue flat-space QI use in curved/bounded settings only in regions small vs curvature radius/boundary distance. citeturn6search1turn6search2 Curved-spacetime QI corrections are controlled by small curvature expansions. citeturn20search1 |
| margin_limited | 30% | Even with applicability unknown, the repo reports `lhs_Jm3=-3.216233598405812e17`, `bound_Jm3=-18`, giving `marginRatioRaw=1.7867964435587844e16` and `G4_QI_MARGIN_EXCEEDED` across A–D and across all 8 sensitivity cases (none has `marginRatioRaw < 1`). This is a very strong “would-fail-if-applicable” margin indicator. | `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md` (A–D identical margin diagnostics) and `docs/audits/research/warp-g4-qi-baseline-R08-2026-02-26.md` (baseline + sweep summary) | Worldline QIs constrain magnitude/duration of negative energy via sampling-function averages; constants depend on sampling choice. citeturn4search1turn21search6 Spatially averaged QIs in 4D do not exist, reinforcing the need for the repo’s time-windowed form. citeturn4search2 |
| scaling_or_units_risk | 15% | The pipeline labels are SI (`*_Jm3`, `tau_s`), but the canonical 2026-02-24 report shows `K=n/a` and `safetySigma_Jm3=n/a` while still reporting `bound_Jm3=-18`, suggesting either a fallback/clamp path, or an incomplete export of bound parameters—both are consistent with a units/scaling ambiguity risk. This must be falsified because a conversion defect could dominate raw margin. | `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md` (K, safetySigma are `n/a`) + `docs/audits/research/warp-g4-qi-baseline-R08-2026-02-26.md` (policy forbids using display-only fields) | QI results are derived in QFT settings with renormalized stress-energy smearings; mapping to “metric-derived effective T00” can introduce major model-form and scale ambiguities. citeturn26search1turn20search1 Numerical V&V frameworks emphasize explicit unit/uncertainty accounting to avoid such scaling defects. citeturn4search7turn7search1 |

## Mechanism plausibility and uncertainty bands

**3. Mechanism plausibility table with uncertainty bands**  
*(Mechanisms = the specific moving parts that produce G4’s applicability + margin decisions. Each row includes: governing equation family, validity domain/assumptions, uncertainty sources, quantitative plausibility bounds, mapping to current G4 logic, and classification.)*

| Mechanism used in G4 path | Governing equation family | Validity domain and assumptions (literature) | Uncertainty sources (bands definition) | Quantitative plausibility bounds (with sources + confidence) | Mapping to current G4 logic | Classification |
|---|---|---|---|---|---|---|
| Worldline QI bound (Ford–Roman style) | “Smeared/worldline-averaged” lower bounds on renormalized energy density along timelike curves with a sampling function (QEI/QI family). | Typically proven for **free** QFTs (e.g., scalar) in flat spacetime; generalizations exist to static/curved settings (often as difference-QEIs or with curvature-controlled corrections). citeturn4search1turn20search1 | **Measurement/estimation**: error in time-smearing integral of the computed energy density (depends on sampling discretization). **Model-form**: whether “effective T00 from a metric ansatz” is a valid stand-in for a renormalized QFT ⟨T00⟩. **Numerical/discretization**: grid/step sensitivity in curvature/derivative estimates feeding T00. **Policy clamp**: bound floors and ratio clamps. (Bands must be *computed* in-pipeline; see unit-audit + closure plan.) | QI bounds are intended to constrain negative energy averaged over time windows; constants depend on sampling function; general theory is well established. High confidence in the *existence* of QI/QEI families. citeturn4search1turn21search6 However, “how large are curvature corrections” is case-dependent and must be checked against validity criteria. citeturn20search1 | Produces `bound_Jm3`, `K`, and optionally `safetySigma_Jm3`; feeds `marginRatioRaw = |lhs|/|bound|`. In the canonical report, `K` and `safetySigma_Jm3` are missing (`n/a`), suggesting an incomplete evidence chain. | **inconclusive** (the theory family is literature-backed, but repo implementation/units/export must be audited before treating margin as fully adjudicated under the intended theory regime) |
| Curvature-scale applicability gating | Local-flatness / short-sampling-time logic: apply flat-space-like QI only when sampling scale is small compared with curvature/boundary scales. | Ford–Roman style application to curved/bounded spacetimes is argued to hold in regions small vs minimum curvature radius or distance to boundaries (approx. Minkowski). citeturn6search1turn6search2 Curved-spacetime QI corrections have controlled expansions in small curvature. citeturn20search1turn6search5 | **Measurement/estimation**: extracting a curvature scale from numerical curvature invariants (sensitive to derivative noise). **Numerical/discretization**: grid refinement changes invariants. **Policy clamp**: fail-closed on missing indicators. | “Short sampling time vs curvature scale” is the canonical quantitative condition. Kontou–Olum derive first-order curvature corrections (Ricci + derivatives), implying corrections are small when curvature is small in the sampling region; in Ricci-flat regions, no first-order corrections. Medium–high confidence for the scaling form; exact numeric thresholds remain policy choices. citeturn20search1 | Drives `applicabilityStatus` (PASS/FAIL/UNKNOWN) and `curvatureOk/curvatureRatio`. Current repo evidence: `applicabilityStatus=UNKNOWN`, `curvatureOk=unknown`, `curvatureRatio=n/a` across all waves. | **plausible_within_bounds** (the logic is literature-aligned; failure is in signal availability/closure, not in the concept) |
| Metric-derived effective stress-energy used as QI LHS | Structural relation between geometry and stress-energy (Einstein-equation family) used to infer an “effective” ρ or T00 from the metric. | As a GR identity, one can compute curvature tensors from a metric. But interpreting that as a physically realized QFT expectation ⟨Tμν⟩ requires semiclassical assumptions and appropriate renormalization/state choices; energy-condition/QI applicability depends on equations of motion and QFT-in-curved-space conditions. citeturn26search1turn26search8 | **Model-form**: dominant—metric ansatz → inferred T00 is not automatically a realizable QFT state’s renormalized energy density. **Numerical/discretization**: derivative noise. **Units/scaling**: conversion constants (c, G, ħ) and coordinate scaling. | Review-level consensus: energy conditions/QEIs are highly sensitive to the theory/field content and assumptions about state/renormalization; “compute from metric alone” is not equivalent to a controlled QFT calculation. High confidence this is a major uncertainty source. citeturn26search1 | Repo uses `rhoSource=warp.metric.T00.natario.shift` and reports `lhs_Jm3` at that source. This is the sole LHS feeding margin. | **inconclusive** (usable as a conservative engineering gate input, but not a sharply bounded “physical QI LHS” without additional evidence) |
| Numerical uncertainty quantification for discretized pipeline | Verification/validation error estimation (grid convergence, discretization error) applied to computed fields. | Established computational science practice: estimate discretization error via Richardson extrapolation and GCI-style reporting. citeturn7search1turn4search7 | **Numerical/discretization** band should be computed via ≥3-resolution study when possible; **policy clamp** noted separately. | Roache’s GCI method is explicitly framed as an objective uncertainty estimator for grid refinement, recommending a safety-factor approach (e.g., Fs≈1.25 in common reporting guidance). Medium confidence for its applicability as a numerical error estimator to curvature/T00 pipelines. citeturn7search1turn4search7 | Should be used to attach error bars to `lhs_Jm3`, curvature invariants, and thus `marginRatioRaw` and applicability ratios—currently not present in canonical artifacts. | **plausible_within_bounds** (standard method; currently missing as evidence) |
| Policy clamp/floor effects (engineering guardrails) | Non-physical clamps (e.g., ratio capping, failing closed on missing signals) to make gates robust. | Not a physics theorem; engineering decision. Must be treated as policy, not as literature-backed. | **Policy clamp** band: introduced deterministically by clamp/floor; can saturate outputs and hide raw magnitudes unless raw is preserved. | Quantitative: clamps can force `marginRatio` to saturate (e.g., to 1), and missing-signal defaults can force FAIL/UNKNOWN. High confidence because it is deterministic code behavior (not a model). | Canonical repo explicitly warns not to use display-only fields; but canonical outputs still expose both `marginRatioRaw` and clamped `marginRatio`. | **plausible_within_bounds** (as policy), but **not** literature-derived |

## Unit audit worksheet

**4. Unit-audit worksheet (mandatory)**  
*(Checked fields + conversion points + clamp/floor transformations. Ambiguities are framed as falsifiable hypotheses.)*

| Quantity (repo label) | Expected physical dimension | Observed in canonical artifacts | Conversion points to audit (where units can change) | Clamp/floor/policy transformations | Ambiguity / falsifiable hypothesis |
|---|---|---|---|---|---|
| `tau_s` | seconds (s) | `tau_s=0.005` in canonical 2026-02-24 report; R08 manifest runs do not show overrides. | Source likely an environment/config value stored as ms then converted to s (`tau_s_ms/1000`). Confirm: **(1)** default tau in config, **(2)** any CLI overrides in scripts. | None expected; but policy may reject too-large τ vs curvature window. | **H_tau_units**: τ may be stored in ms internally and converted incorrectly (e.g., treated as seconds twice). **Falsifier**: print both τ_ms and τ_s in qi-forensics and confirm τ_s=τ_ms/1000 exactly. |
| `lhs_Jm3` | energy density (J/m³) | `lhs_Jm3=-321623359840581200` consistently across A–D. | Conversion chain likely: metric derivatives → curvature tensors → “effective T00/ρ” → SI scaling factors. Audit: **(1)** coordinate length/time unit normalization, **(2)** constants used (c, G), **(3)** whether the reported value is already SI or in “naturalized” units mislabeled as SI. | None directly, but could be clamped elsewhere if NaN/Inf. | **H_lhs_scaling**: `lhs_Jm3` may actually be in geometric/natural units but labeled J/m³. **Falsifier**: run a dimension-consistency check by recomputing T00 in a known analytic limit (flat → 0) and ensure SI magnitude matches expectation. |
| `effectiveRho` / `rhoSource` | energy density (J/m³) | `rhoSource=warp.metric.T00.natario.shift` (all waves). | Audit: **(1)** how “Natario shift” contributes to T00 computation downstream, **(2)** whether this is a direct matter-model output vs geometry-derived effective source. | Policy may require “metric_source=true” or certain rhoSource allowlist; mismatch causes reason codes. | **H_rho_semantics**: this value is an “effective stress-energy required by the metric,” not a QFT ⟨T00⟩. **Falsifier**: generate an alternate rhoSource from a known material model path (if available) and compare both magnitude and units; if both labeled J/m³ but differ by constant factors, labeling is suspect. |
| `bound_Jm3` | energy density (J/m³) | `bound_Jm3=-18` (all waves; baseline R08). Canonical 2026-02-24 report also shows `K=n/a`, `safetySigma_Jm3=n/a`. | Theoretical conversion chain should reflect the underlying QI/QEI formula and constants. Audit: **(1)** whether ħ and c factors are applied for SI conversion, **(2)** whether τ is interpreted as time or length (cτ), **(3)** sampling-function constant selection (depends on kernel choice; Fewster–Eveson emphasize sampling dependence). citeturn4search1turn21search6 | Potential policy floors (e.g., minimum |bound|), “fail closed” bound substitutions if applicability not pass, and sigma safety inflation. | **H_bound_fallback**: `bound_Jm3=-18` may be a policy fallback (used when applicability UNKNOWN or K missing), not the computed QI bound. **Falsifier**: require qi-forensics to include a `boundComputed_Jm3` vs `boundPolicy_Jm3` split; if computed differs from -18, current decisions are mixing computed-vs-policy. |
| `marginRatioRaw` | dimensionless | `1.7867964435587844e16` (all waves). | Should be `|lhs_Jm3|/|bound_Jm3|` using **raw**, not display fields. Confirm exact formula and sign handling. | None; it is raw. | **H_ratio_formula**: ratio may be using a clamped/floored bound or absolute value incorrectly. **Falsifier**: recompute in post-processing directly from qi-forensics `lhs_Jm3` and `bound_Jm3` and compare bitwise. |
| `marginRatio` | dimensionless | `1` (clamped) | Must be derived from `marginRatioRaw` by a clamp. | Likely `marginRatio = min(marginRatioRaw, 1)` (or equivalent saturating). This can hide magnitude unless `marginRatioRaw` is preserved (it is preserved in canonical docs). | **H_ratio_clamp_influence**: clamping affects “how bad” the fail looks but not the pass/fail boundary. **Falsifier**: verify that gate decisions compare against the raw value or compare against clamped but only in a monotone way. |
| Applicability transforms (`applicabilityStatus`, `curvatureOk`, `curvatureRatio`) | categorical + dimensionless ratio | `applicabilityStatus=UNKNOWN`, `curvatureOk=unknown`, `curvatureRatio=n/a` | Audit: **(1)** how curvature scale indicator is computed, **(2)** how sampling scale is compared, **(3)** export/wiring into proof pack and campaign report. Literature supports “short sampling time vs curvature” logic. citeturn6search1turn20search1 | Fail-closed on missing/zero curvature indicators; emits `G4_QI_APPLICABILITY_NOT_PASS`. | **H_curvature_signal_missing**: curvature indicator exists but is not being propagated into the constraint note/forensics JSON. **Falsifier**: after wiring, see `curvatureRatio` become numeric and `curvatureOk` become boolean rather than `unknown`. |

## Closure logic and verification plans

**5. Causal decision tree (explicit branch criteria)**

- **Start: Observe canonical G4 outputs** (A–D):  
  `applicabilityStatus=UNKNOWN`, `reasonCode includes G4_QI_APPLICABILITY_NOT_PASS`, and `marginRatioRaw≈1.7868e16` with `G4_QI_MARGIN_EXCEEDED`.

- **Branch A: Applicability closure**  
  - If, after wiring/closure steps, **`applicabilityStatus` remains `UNKNOWN`** (or toggles between UNKNOWN across waves) → **`evidence_path_blocked`**.  
    - Required observation: canonical artifacts still show `curvatureOk=unknown` and/or `curvatureRatio=n/a`, and the reason codes continue to include `G4_QI_APPLICABILITY_NOT_PASS`.  
  - Else if **`applicabilityStatus=PASS`** (and curvature window gives a determinate `curvatureOk=true/false`) → go to Branch B.

- **Branch B: Margin adjudication in a defensible regime**  
  - If **`applicabilityStatus=PASS` and `marginRatioRaw >= 1`** → **`physics_limited_at_current_envelope`** (as *defined by the pipeline’s current QI equation family + its SI conversion*).  
  - If **`applicabilityStatus=PASS` and `marginRatioRaw < 1`** (with unit-audit and numerical uncertainty bands showing the inequality is stable under error bars) → **`potential_reduced_order_admissibility_path`**.

- **Branch C: Units/scaling falsification overlay** (applies alongside A/B)  
  - If unit-audit finds inconsistent conversions (e.g., `bound_Jm3` is a fallback masquerading as computed, or τ units are doubled) → classification shifts toward **`scaling_or_units_risk`** as the dominant explanation for margin.

**6. Minimal closure plan — top 3 patch candidates (no policy weakening)**  
*(Each includes: exact file/function anchors, expected gate impact, falsifier, overclaim risk, and first verification command set.)*

1) **Patch candidate: determinize applicability by exporting curvature indicators into the G4 note and qi-forensics** *(code)*  
   - **Anchor(s):**  
     - `server/energy-pipeline.ts` — the QI guardrail construction that currently yields `applicabilityStatus=UNKNOWN` and `curvatureRatio=n/a` must receive and export a numeric curvature indicator (exact function name depends on file contents, but it is the component populating `constraints.FordRomanQI.note`).  
     - `server/gr/gr-evaluation.ts::extractG4ConstraintDiagnostics()` — already parses `reasonCode=...` from constraint notes, so once the upstream note contains determinate curvature fields, the downstream reporting will reflect them (no logic change here needed; this is validation of the evidence path).  
   - **Expected gate impact:** convert `applicabilityStatus` from UNKNOWN → PASS/FAIL (deterministic), potentially removing `G4_QI_APPLICABILITY_NOT_PASS` when appropriate; does **not** change thresholds.  
   - **Falsifier:** After patch, canonical report still shows `curvatureOk=unknown` and `curvatureRatio=n/a` for A–D.  
   - **Overclaim risk:** low (instrumentation/wiring only; does not relax thresholds).  
   - **First verification command set:**  
     ```bash
     npm run warp:full-solve:readiness
     npm run warp:full-solve:canonical
     # Verify that per-wave g4Reasons now include numeric curvatureRatio and boolean curvatureOk,
     # and that applicabilityStatus is no longer UNKNOWN (unless curvature truly cannot be computed).
     ```

2) **Patch candidate: split `bound_Jm3` into computed-vs-policy components and surface K/σ in all canonical artifacts** *(code)*  
   - **Anchor(s):**  
     - `server/qi/qi-bounds.ts` — function(s) responsible for the “computed” QI bound in SI units (e.g., `qiBound_Jm3` / scalar bound helpers).  
     - `server/energy-pipeline.ts` — where the guardrail serializes `K`, `safetySigma_Jm3`, and the final `bound_Jm3` into the constraint note / diagnostics object.  
   - **Expected gate impact:** none on pass/fail **unless** current decisions are silently using a fallback bound. Primary impact is adjudication quality: it makes “true margin failure” separable from “fallback margin failure.”  
   - **Falsifier:** `K` and `safetySigma_Jm3` remain `n/a` in the canonical report even when bound is present; or computed bound equals the policy fallback exactly in all cases.  
   - **Overclaim risk:** low–medium (still instrumentation, but may reveal that prior interpretation was based on a fallback path).  
   - **First verification command set:**  
     ```bash
     npm run warp:full-solve:canonical
     # Verify in the generated campaign report and any qi-forensics that:
     # - boundComputed_Jm3, boundPolicy_Jm3, and boundUsed_Jm3 are all present
     # - K and safetySigma_Jm3 are populated (or explicitly marked "not computed because ...")
     ```

3) **Patch candidate: make repo adjudication artifacts actually present under the documented canonical paths** *(code)*  
   - **Anchor(s):**  
     - `scripts/warp-full-solve-campaign.ts` (or the script invoked by `npm run warp:full-solve:canonical` and `npm run warp:full-solve:g4-sensitivity`) — ensure it writes:  
       - `artifacts/research/full-solve/A/qi-forensics.json` … `D/qi-forensics.json`  
       - `artifacts/research/full-solve/g4-sensitivity-YYYY-MM-DD.json`  
     - (If CI artifacts are being stored elsewhere) the publishing step that attaches them to the repo/CI output channel.  
   - **Expected gate impact:** none directly; increases evidence completeness so R09 can be adjudicated on canonical artifacts (per precedence rule).  
   - **Falsifier:** after running the standard commands, the files still do not exist at the documented paths.  
   - **Overclaim risk:** low (pure evidence delivery).  
   - **First verification command set:**  
     ```bash
     npm run warp:full-solve:g4-sensitivity
     ls -la artifacts/research/full-solve/A/qi-forensics.json
     ls -la artifacts/research/full-solve/g4-sensitivity-2026-02-26.json
     ```

**7. Falsifier matrix**  
*(Hypotheses: applicability_path, margin_physics, units_scaling. Each row: falsifier condition, observable symptom, decisive re-test command.)*

| Hypothesis | Falsifier condition | Observable artifact symptom | Decisive re-test command |
|---|---|---|---|
| applicability_path (UNKNOWN/missing curvature indicator) | If after Patch #1, `applicabilityStatus` is still `UNKNOWN` **and** `curvatureRatio` remains `n/a` across A–D, then the “missing curvature signal” hypothesis is wrong (it becomes a deeper computation absence). | Canonical report still shows `curvatureOk=unknown; curvatureRatio=n/a; applicabilityStatus=UNKNOWN` and includes `G4_QI_APPLICABILITY_NOT_PASS`. | `npm run warp:full-solve:canonical` and inspect the generated G4 diagnostics section. |
| margin_physics (true inequality margin exceedance) | If after applicability PASS is achieved (and bound components are computed, not fallback), `marginRatioRaw < 1` in a stable regime (uncertainty bands do not cross 1), then “true margin fail” is wrong. | `applicabilityStatus=PASS` and computed `marginRatioRaw < 1` appears in per-wave qi-forensics and campaign report. | `npm run warp:full-solve:g4-sensitivity` (expect at least one case with PASS applicability + `marginRatioRaw < 1` if hypothesis is wrong). |
| units_scaling (conversion defect dominates ratio) | If bound is demonstrably computed with correct units (ħ/c factors as required by the implemented convention) and `boundComputed_Jm3` matches independent recomputation from logged intermediates, then “units defect” is wrong (margin is “real” under the implemented unit system). | A qi-forensics file includes all intermediates (tau, kernel constant, conversion constants) enabling an independent recompute that matches exactly. | `npm run warp:full-solve:canonical` plus a post-check: `node tools/warpViability.ts --verify-qibound artifacts/research/full-solve/A/qi-forensics.json` (or equivalent existing validation command if present). |

**8. Defensible/not-defensible table**  
*(Stakeholder framing: what can be asserted now vs what is not defensible vs what evidence upgrades are required.)*

| Category | Statement scope | Status now | Evidence required to upgrade |
|---|---|---|---|
| Defensible now | “G4 fails in the readiness/canonical campaign output because both applicability is not pass (UNKNOWN) and the reported margin ratio exceeds threshold (raw ratio ~1.7868e16).” | Defensible (directly reported by canonical campaign report + R08 baseline). | None; already in canonical repo artifacts. |
| Defensible now | “The applicability gating concept (short sampling vs curvature scale) is literature-aligned and is an appropriate fail-closed guardrail when curvature indicators are missing.” | Defensible (as a methodological claim; not a feasibility statement). | None, but to adjudicate *this case*, curvature indicators must be surfaced. citeturn6search1turn20search1 |
| Not defensible | “This is a true Ford–Roman/QI margin failure at the current envelope.” | **Not defensible yet** because `applicabilityStatus=UNKNOWN` blocks claim of being inside validity domain, and canonical artifacts show missing bound parameters (`K`, `safetySigma_Jm3`). | Applicability closure to PASS + bound computed-vs-policy split + unit-audit pass + uncertainty bands. |
| Not defensible | “The computed metric-derived `lhs_Jm3` is a realizable QFT ⟨T00⟩ used by the QI theorem.” | Not defensible without a state/renormalization mapping and semiclassical/QFT justification. | Evidence of state choice, renormalization scheme, and validity assumptions aligned with QEI/QI requirements. citeturn26search1turn20search1 |
| Evidence required to upgrade | “After closure, G4 failure is margin-dominated (physics-limited under current reduced-order gate definitions).” | Pending. | Show `applicabilityStatus=PASS` and computed `marginRatioRaw ≥ 1` remains under conservative uncertainty bounds; document units and conversions. citeturn7search1turn4search7 |

**9. Immediate next-run command set**  
*(Runnable now; designed to reproduce the canonical evidence and immediately test for artifact presence.)*

```bash
# Reproduce the canonical readiness artifacts and G4 summary
npm run warp:full-solve:readiness
npm run warp:full-solve:canonical

# Attempt to produce the documented sensitivity sweep artifact
npm run warp:full-solve:g4-sensitivity

# If the repo is running the local API, also capture the training trace artifacts (as done in R08 manifest)
npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl
curl -fsS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl

# Quick check: are the adjudication-canonical qi-forensics artifacts present at the documented paths?
ls -la artifacts/research/full-solve/A/qi-forensics.json \
       artifacts/research/full-solve/B/qi-forensics.json \
       artifacts/research/full-solve/C/qi-forensics.json \
       artifacts/research/full-solve/D/qi-forensics.json \
       artifacts/research/full-solve/g4-sensitivity-2026-02-26.json
```

The “immediate” evidence expectation (per precedence rule) is that the campaign report plus per-wave qi-forensics exist and can be used for decisions; if the `ls` check fails, Patch candidate #3 becomes the first closure step.

## Boundary statement

**10. Boundary statement (verbatim)**

“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”
