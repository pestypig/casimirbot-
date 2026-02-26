# CasimirBot main adjudication on the G4 QI blocker

## Executive verdict

The observed G4 blocker is **both** a hard QI margin failure at current parameters **and** a fail-closed applicability-policy failure (curvature applicability is UNKNOWN) in the campaign artifact for 2026-02-24.  
The campaign record shows **`marginRatioRaw ~= 1.7868e16`** with **`lhs_Jm3 = -3.216233598405812e17`** and **`bound_Jm3 = -18`**, yielding a massive exceedance; **`marginRatio` is clamped to 1** and triggers `G4_QI_MARGIN_EXCEEDED`.  
In the same record, **`applicabilityStatus=UNKNOWN`** with **`curvatureOk=unknown`** / **`curvatureRatio=n/a`** under **`curvatureEnforced=true`**, triggering `G4_QI_APPLICABILITY_NOT_PASS`.  
`ThetaAudit=pass` is consistent with the record: metric-derived theta is present (`thetaMax~=61.34`, strict mode true, chart contract ok).  
Local API endpoints at `http://127.0.0.1:5050` were **not reachable from this adjudication environment**, so the "live JSON pull" requirement could not be satisfied here; conclusions rely on the main-branch campaign execution report plus code-path tracing.  
"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."  
Blocker classification (totals = 100): **physics-limited 60%**, **policy/applicability-limited 25%**, **semantic mismatch 10%**, **wiring defect 5%**.

## Value-parity table

| Guard panel field (UI) | Proof panel field (UI) | Endpoint field (server JSON) | Upstream producer function (code path) | Same semantic value? |
|---|---|---|---|---|
| FordRomanQI status badge (`pass/fail/unknown`) | `ford_roman_ok` (boolean-ish) | `pipeline.fordRomanCompliance` (boolean) and/or contract `guardrails.fordRoman.status` | `server/energy-pipeline.ts: deriveQiStatus()` -> `fordRomanCompliance`; `server/helix-core.ts: getGrConstraintContract()` maps to contract; `server/helix-proof-pack.ts: buildProofPack()` emits `ford_roman_ok` | **partial**: contract status supports `unknown/missing`, pipeline is boolean; UI badge may collapse nuance |
| QI margin ("zeta" / margin ratio) display (guard panel often shows zeta and/or zetaRaw) | `zeta` and `sector_control_qi_margin_ratio` | `pipeline.zeta`, `pipeline.zetaRaw`, `pipeline.qiGuardrail.{marginRatio,marginRatioRaw}` | `server/energy-pipeline.ts: evaluateQiGuardrail()` computes `{marginRatio, marginRatioRaw}` then `state.zeta = qiGuard.marginRatio`; `server/helix-proof-pack.ts: buildProofPack()` emits `zeta` and `sector_control_qi_margin_ratio` (from `qiGuardrail.marginRatio`) | **yes**, but note two "zeta"s exist: **raw** vs **policy-clamped** |
| QI strict-mode indicator ("strict congruence on/off") | `qi_strict_mode` | environment-derived (not always present in pipeline JSON); indirectly affects contract + proofs | `server/helix-proof-pack.ts: strictCongruenceEnabled()` (env `WARP_STRICT_CONGRUENCE`) sets `qi_strict_mode`; `server/helix-core.ts: probeStrictCongruenceEnabled()` also gates contract behavior | **yes** (same policy switch), but sourced from env and may not appear as a single canonical endpoint field |
| QI strict OK/reason ("metric-derived QI required when strict") | `qi_strict_ok`, `qi_strict_reason` | `pipeline.qiGuardrail.metricDerived` plus rho-source provenance | `server/helix-proof-pack.ts: buildProofPack()` derives `qi_strict_ok/reason` from `state.qiGuardrail.rhoSource` and `metricDerived`; strict requires `metricDerived` | **partial**: proof pack encodes strictness as "metricDerived"; the gate failure in the campaign can be **applicability** even when strict OK |
| QI rho source shown in UI ("warp.metric...", "metric-missing", etc.) | `qi_rho_source`, `qi_metric_source`, `qi_metric_reason` | `pipeline.qiGuardrail.rhoSource` and `pipeline.qiGuardrail.metricDerived{Source,Reason}` | `server/energy-pipeline.ts: estimateEffectiveRhoFromState()` + `resolveMetricRhoFromState()` choose source; `evaluateQiGuardrail()` sets `rhoSource` + metric-derived fields; `server/helix-proof-pack.ts: buildProofPack()` formats into proof values | **yes** (same underlying provenance), assuming UI prefers the same precedence |
| QI applicability status (PASS/FAIL/NOT_APPLICABLE/UNKNOWN) | (typically **not surfaced** directly; may only appear as "reason codes") | `pipeline.qiGuardrail.applicabilityStatus` | `server/energy-pipeline.ts: evaluateQiGuardrail()` computes `applicabilityStatus` from curvature scalar availability and tau/R rule; `tools/warpViability.ts` converts non-PASS into `G4_QI_APPLICABILITY_NOT_PASS` | **no** (semantic visibility mismatch): endpoint has an explicit state; UI panels may not display it as a first-class badge |
| ThetaAudit badge (guard panel) | `theta_strict_ok`, `theta_strict_reason`, plus `theta_metric_*` | pipeline-side theta metric provenance fields (e.g., `theta_metric_derived`, `theta_geom`) and/or contract `guardrails.thetaAudit` | `server/energy-pipeline.ts: refreshThetaAuditFromMetricAdapter()` sets theta-geom availability; `server/helix-core.ts: getGrConstraintContract()` defines the contract-side "theta audit" guardrail; `server/helix-proof-pack.ts: buildProofPack()` emits strict OK/reason | **partial**: contract badge is an opinionated guardrail; proofs expose the underlying measurements + reasons |
| TS ratio badge (guard panel) | `ts_ratio`, `ts_metric_derived`, `ts_metric_reason` | `pipeline.TS_ratio` and `pipeline.tsMetricDerived*` | `server/energy-pipeline.ts: resolveTsMetricDerivedStatus()` + clocking updates set metric-derived status; `server/helix-core.ts` maps to contract `guardrails.tsRatio` | **yes** (same physical quantity), with extra provenance fields in proofs |
| VdB admissibility / band (guard panel) | `vdb_admissible`, `vdb_reason` | `pipeline.gammaVanDenBroeckGuard.{admissible,limit,reason}` | `server/energy-pipeline.ts: guardGammaVdB()` and subsequent state assignment; `server/helix-proof-pack.ts: buildProofPack()` emits proof values; contract mapping in `server/helix-core.ts` | **yes** (same admissibility decision), unless UI uses a different band ("requested vs applied") presentation |

## G4 root-cause table

The table below is for the **current campaign run snapshot recorded in** `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md` (waves A–D show identical G4 diagnostics).

| Field | Observed value | What it means for the gate |
|---|---:|---|
| `lhs_Jm3` | `-321623359840581200` | Sampled (windowed) negative-energy integral (LHS) is extremely large in magnitude |
| `bound_Jm3` | `-18` | Bound magnitude is tiny relative to LHS, making exceedance unavoidable unless units/policy are changed |
| `marginRatioRaw` | `17867964435587844` | Raw ratio `|lhs|/|bound|` >> 1 -> hard exceedance |
| `marginRatio` | `1` | Policy-clamped ratio (max zeta) at the limit -> still counts as failure when `>= 1` |
| `applicabilityStatus` | `UNKNOWN` | Curvature applicability could not be established (missing/unknown curvature scalar) |
| `rhoSource` | `warp.metric.T00.natario.shift` | QI LHS used a metric-derived T00 source (not a proxy duty fallback) |
| `metricContractOk` | implied **true** (record shows `metricContractStatus=ok`, `chartContract=ok`) | Metric provenance contract satisfied (so this is *not* a "metric contract not ok" failure) |
| `curvatureEnforced` | `true` | Applicability gate is enforced (fail-closed when curvature data unknown) |
| `curvatureOk` | `unknown` | Curvature acceptance could not be evaluated (not enough invariants) |
| `curvatureRatio` | `n/a` | No ratio computed, consistent with missing curvature invariants |
| `tau_s` | `0.005` | Sampling time used for the bound (5 ms) |
| Final `FordRomanQI` status | `fail` | G4 fails overall |
| Final G4 reason codes | `G4_QI_APPLICABILITY_NOT_PASS`, `G4_QI_MARGIN_EXCEEDED` | Two independent failure reasons: policy applicability (UNKNOWN) and raw margin exceedance |

## Material-coupling findings

The codebase separates (a) **Casimir energy/material modeling** and (b) **QI gate evaluation**, but they are not completely independent.

Material knobs that primarily affect Casimir energy (and downstream mass/power), but do **not** directly set the QI bound policy inputs:

- **Casimir/material inputs**: `casimirModel`, `materialProps`, `gap_nm`, `temperature_K`, coupling parameters, and (in measured mode) experimental force-driven scale factors. These feed the static Casimir energy calculation and any derived energy-density fields used for mass/power budgeting and mechanical feasibility.  
- These knobs mainly propagate through the pipeline's energy-density and mass bookkeeping (e.g., `U_static`, `rho_avg`) rather than through QI policy constants.

Inputs that affect the QI **LHS/bound/applicability** path directly (independent of material model choice):

- **Bound policy**: tau and kernel/field selection (`QI_TAU_MS`, sampler kind, `QI_FIELD_TYPE`), plus the configured constants (`K`-like coefficients and safety margin via config), and the enforcement clamps (`QI_POLICY_ENFORCE`, `QI_POLICY_MAX_ZETA`).  
- **LHS effective density selection (rho/T00 provenance)**: strict congruence (`WARP_STRICT_CONGRUENCE`) and whether metric-derived `T00` exists and passes contract checks. In strict mode, missing metric `T00` disables proxy fallbacks, which can convert "missing" into a hard failure by producing `NaN/Infinity` margins.  
- **Applicability**: curvature-enforcement (`QI_CURVATURE_ENFORCE`) and the availability of curvature invariants to compute a curvature scale. When invariants are missing, applicability becomes `UNKNOWN` and (when enforced) triggers `G4_QI_APPLICABILITY_NOT_PASS`.

Would the current fail persist across material model changes **without changing QI policy inputs**?

- The campaign snapshot's `rhoSource=warp.metric.T00.natario.shift` indicates the QI LHS is driven by a **metric-derived** stress-energy source, not a Casimir-material proxy. That strongly suggests **material-model tweaks alone are unlikely to remove the failure**, because the reported failure is dominated by (1) the enormous raw margin exceedance and (2) missing/unknown curvature applicability signals.  
- Even if material changes shift some pipeline energy values, the recorded failure magnitude (`marginRatioRaw ~= 1.8e16`) is so large that only a **radical** change in either (a) the effective-rho scale used in the QI LHS, (b) the bound normalization/units, or (c) the enforced policy clamps would change the outcome.

Are the QI guardrails literature-backed vs material-model heuristics?

- The *existence* of QI-style bounds and the general tau-scaling concept are literature-rooted, but in this implementation the operational guardrails include several **engineering/policy layers**: a configurable bound constant table and explicit **safety subtraction**, plus an explicit **policy clamp** (`QI_POLICY_MAX_ZETA`) and a curvature "applicability" rule that fails closed when curvature data are missing. Those layers are best characterized as **policy + model heuristics around a literature-motivated core**, not a direct one-to-one encoding of a single published theorem.

## Is this solvable by code fixes alone?

**Partial.**

- **Not code-only (dominant):** The recorded `marginRatioRaw ~= 1.8e16` with `lhs_Jm3` vastly exceeding `bound_Jm3` indicates a **hard margin exceedance under current policy inputs**. If those values are correct and in consistent units, eliminating the failure requires changing the **inputs/policy regime** (effective rho scale, tau choice, bound coefficients/safety margin, or clamp semantics), not just wiring/UI fixes.  
- **Potentially code-solvable (secondary):** `applicabilityStatus=UNKNOWN` with `curvatureRatio=n/a` suggests required curvature invariants are not available at evaluation time. Enabling/plumbing curvature invariants into the pipeline snapshot (or into the evaluator constraints) is plausibly a **code/integration** fix.  
- **Potentially code-solvable (small chance):** The extreme disparity between `lhs_Jm3` and `bound_Jm3` could be amplified by a **unit mismatch or scaling bug** (e.g., SI vs geometric-unit mixing). If confirmed, that would be a code fix-but it is a hypothesis that requires falsification with reproducible intermediate values.

## Ranked next actions

1. **research** - **Impact:** very high (restores required evidence chain). **Action:** From the actual run environment, capture and archive the full live JSON for `/api/helix/gr-constraint-contract`, `/api/helix/pipeline/proofs`, and `/api/helix/pipeline` at the same timestamp/seq as the failed gate evaluation, and diff them against the campaign artifact's G4 diagnostics. **Falsifier:** Live endpoint data show materially different `qiGuardrail` (`lhs_Jm3`, `bound_Jm3`, `marginRatioRaw`, `applicabilityStatus`, `rhoSource`) than the campaign report for the same run.

2. **code** - **Impact:** high (may remove `G4_QI_APPLICABILITY_NOT_PASS` if missing curvature data is the only blocker on applicability). **Action:** Ensure curvature invariants needed by `evaluateQiGuardrail()` are consistently produced and present during readiness-lane evaluation (and that evaluator constraints ingest the same fields), so `curvatureRatio` and `curvatureOk` are never `unknown` when `curvatureEnforced=true`. **Falsifier:** After invariants are present, `applicabilityStatus` still remains `UNKNOWN` due to logic unrelated to missing invariants (e.g., field mapping mismatch).

3. **research** - **Impact:** high (determines whether this is a real physics-limited fail vs a scaling defect). **Action:** Produce a unit-audit worksheet for the QI computation path that logs intermediate quantities in consistent units: `effectiveRho` (SI J/m3), `rhoOn`, window normalization (`sumWindowDt`), `lhs_Jm3`, `K` and `safetySigma_Jm3`, and the final `bound_Jm3`. **Falsifier:** Intermediate values confirm that `lhs_Jm3` and `bound_Jm3` are already in consistent units and the ratio still matches `~1.8e16` without any suspicious conversions.

4. **policy** - **Impact:** medium (can change "fail-closed on UNKNOWN" behavior, but must be explicit). **Action:** Decide and document whether `applicabilityStatus=UNKNOWN` should (a) hard-fail G4 (current), (b) route to NOT_APPLICABLE, or (c) route to NOT_READY with a missing-signal class. Align this with the campaign's evidentiary posture and with UI messaging. **Falsifier:** Even after policy change, campaigns still show `G4_QI_MARGIN_EXCEEDED` as a blocker (i.e., applicability policy was not materially affecting admissibility).

5. **code** - **Impact:** medium (reduces semantic mismatch and adjudication ambiguity). **Action:** Make `applicabilityStatus`, `curvatureRatio`, `curvatureOk`, and both `marginRatioRaw` and policy-clamped `marginRatio` first-class, consistently labeled fields in both the Guards panel and Proof panel (and ensure they are sourced from the same snapshot/seq). **Falsifier:** UI parity work shows the same values already exist and match; confusion persists because the underlying gate semantics (policy clamp + fail thresholds) remain the real source of disagreement.
