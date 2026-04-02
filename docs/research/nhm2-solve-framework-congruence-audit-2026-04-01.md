# NHM2 Solve Framework Congruence Audit for `pestypig/casimirbot-`

## Executive Verdict

**overallCongruenceStatus:** **partially_congruent_at_diagnostic_tier_with_major_reproducibility_and_modeling_gaps**  
The repo contains a coherent *diagnostics-first* structure (Lane A York surface; secondary ADM gravity lane; explicit provenance/precision policy). However, multiple core “full-solve artifact” JSONs referenced by docs/tests are not present in the repository, the Source→York bridge is explicitly incomplete, and at least one concrete numeric implementation bug (trilinear interpolation) can materially change derived “metric” quantities.  

**canonicalNHM2Status:** **implemented_as_natario_sdf_low-expansion_classification_is_audit-backed_but_magnitude_is_near-zero_and_bridge_unclosed**  
Canonical profile is **`natario_sdf`** (NHM2) with duty/sector/Q parameters fixed in `shared/warp-promoted-profile.ts`.   
York control-family audit classifies NHM2 as **Natário-like low expansion** robustly under its contract, but absolute θ magnitudes are ~1e‑32 to 1e‑33 (near-flat), making “Natário-like” potentially *trivially true* for this specific parameter regime.  

**casimirMechanismStatus:** **proxy_modeled_not_first-principles_and_internally_flagged_as_formula_mismatch**  
Casimir modeling is implemented as a reduced-order chain: parallel-plate Casimir density plus amplification factors and duty reduction, feeding a perfect-fluid proxy stress-energy and a heuristic Natário shift amplitude.   
The repo’s own proof-pack flags **`formulaEquivalent: false`** in the “Source-Formula Audit” (direct vs reconstructed mismatch), which is a direct internal inconsistency indicator, not just “missing future work.” 

**sectorStrobingStatus:** **implemented_as_timing/duty_proxies_with_admitted_timing-authority_caveats**  
Duty effective is computed via heuristic rules (e.g., `d_eff = dutyCycle/sectorStrobing` unless overridden).   
Timing authority is marked “closed” but with advisory findings: **`timing_ts_ratio_policy_split`**, **`timing_simulated_profile_active`**, **`timing_autoscale_source_active`**. This is a concrete “not fully authoritative” tag for timing/TS semantics. 

**shiftGeometryStatus:** **audit-described_but_units/policy_deferred_and_backing_artifacts_not_present**  
Shift geometry is reported “available,” but itself marked with **`constraintContextStatus: deferred_units_and_policy_unresolved`**.   
Because the referenced JSON artifact paths are not present in-repo (see noted missing artifacts throughout the audit), this is best treated as **audit-text-backed**, not artifact-backed.

**shiftPlusLapseStatus:** **separate_branch_exists_reference-only_mild_gravity_is_real_in_lapse_but_GR_state_is_minkowski_plus_uniform_shift**  
There is a distinct `nhm2_shift_lapse` diagnostic branch with a mild linear-gradient lapse profile; it is explicitly “diagnostic tier only” and “reference-only.”    
The GR evolve path for shift-plus-lapse **creates a Minkowski initial state** and stamps in α(x) plus a **spatially constant shift vector**, so it does **not** currently represent the full NHM2 spatial shift geometry under a nontrivial lapse (it’s a companion diagnostic for lapse gradients + simple β/α safety, not a full generalized solve). 

**precisionProvenanceStatus:** **explicit_underflow_handling_exists_but_some_field-name_mismatches_can_break_congruence_checks**  
The shift-plus-lapse path explicitly detects float32 under-resolution and prefers analytic companion lapse summaries, and the comparison audit records provenance warnings for cross-case mixed sources.    
However, `shared/time-dilation-diagnostics.ts` reads `betaDiagnostics.divBetaRms/divBetaMaxAbs`, while the metric-adapter exposes `thetaRms/thetaMax`. This mismatch can silently degrade “Natário canonical” checks and should be treated as an unresolved correctness risk until reconciled.  

**renderPresentationStatus:** **documented_and_audit-reported_but_enforcement_path_is_unclear_in_current_repo_state**  
Rendering taxonomy and proof/presentation separation are explicitly specified in the proof-pack audit (categories: diagnostic_lane_a vs scientific_3p1_field vs comparison_panel).   
But the central script file listed as core (`scripts/warp-york-control-family-proof-pack.ts`) is empty in the repository, creating a reproducibility gap for the nominal “authoritative proof surface” packaging. 

**mostImportantFalsifier:**  
Fix the **trilinear interpolation bug** used by the Hodge-projected shift evaluator (uses `tz` where `ty` is expected) and re-run the full York and stress-energy derivations; if θ morphology, T00_metric samples, or control-family classification changes materially, the current interpretation of “NHM2 is Natário-like under the implemented map” is falsified at the code level. 

**recommendedNextAction:**  
Make the solve auditable end-to-end: (a) fix trilinear interpolation; (b) reconcile `divBeta*` vs `theta*` naming; (c) commit or regenerate the missing “latest” JSON artifacts in CI; (d) close Source→York mapping (parameter mappings + timing authority source). 

## Claim Ledger

| claim | repoStatus | evidenceTier | implementedWhere | artifactEvidence | tests | falsifier | notes |
|---|---|---|---|---|---|---|---|
| Lane A is authoritative proof surface; Eulerian/comoving; θ = −trK | implemented_and_audit_backed | authoritative + implemented | `configs/york-diagnostic-contract.v1.json` sets baseline lane + θ definition ; `server/gr/evolution/brick.ts` exports `theta` derived from `K_trace`  | Proof-pack audit confirms lane A parity closed  | (tests exist but repo-level reproducibility unclear) | θ channel not equal to −K_trace in brick; contract mismatched to implementation | Lane B exists but is explicitly proxy/reference-only and cannot promote claims  |
| Canonical NHM2 baseline is Natário-like / low expansion (not Alcubierre-like) | partially_supported | implemented + audit-backed (text) | Classification contract defines natario_control vs alcubierre_control and weighted distance policy  | Proof-pack: NHM2 distances favor natario_control with robustness sweep stable  | Proof-pack suite implies execution, but key “latest.json” artifacts referenced are not committed | Re-run after fixing interpolation / restoring missing artifacts yields alcubierre_control as winner or insufficient margin | Caution: absolute θ values are tiny for all cases; “Natário-like” may be a near-flat regime artifact  |
| Canonical promoted profile uses `natario_sdf` family and defines duty/sector/Q parameters | implemented | authoritative (repo baseline) | `shared/warp-promoted-profile.ts`  | n/a | n/a | Profile used nowhere / overridden in pipeline | This is “what the repo says is canonical”; does not prove physical interpretation correctness |
| Natário-like low expansion enforced via Helmholtz–Hodge projection in `natario_sdf` | implemented_but_risk_of_numeric_bug | implemented + local diagnostics | `modules/warp/natario-warp.ts` sets `isZeroExpansion` based on Hodge `maxDiv` for `natario_sdf`/`nhm2_shift_lapse`  | n/a | n/a | Divergence not actually reduced (maxDiv large) or evaluator incorrect | The evaluator used for sampling has a trilinear interpolation defect (see separate claim)  |
| Casimir “mechanism” exists in code as Casimir plate density + amplification chain + duty reduction | proxy_modeled | implemented | `casimirEnergyDensity`, `amplificationFromPipeline`, `resolveDutyEff`, `stressEnergyFromDensity`, `natarioShiftFromDensity` in `modules/dynamic/stress-energy-equations.ts`  | n/a | n/a | Energy pipeline does not use these functions; or outputs contradict internal audits | This is not a first-principles QFT solution; it is explicitly a proxy chain with “pipeline” semantics |
| Sector strobing represented via `sectorStrobing` and duty-effective rules | proxy_modeled | implemented | `resolveDutyEff` divides duty by sectorStrobing unless overridden  | n/a | n/a | TS/sector timing not coupled to any metric-derived light crossing; contradictions in timing audit | Timing authority audit flags simulated profile + autoscale active  |
| TS ratio / timing logic is “authoritative enough” | partially_supported | implemented + audit caveats | `tools/warpViability.ts` requires `tsMetricDerived` in strict mode; otherwise TS constraint becomes proxy and fails strict provenance  | Proof-pack timing audit: advisory findings show policy split + simulated profile + autoscale  | n/a | tsMetricDerived never true; timing derived from simulated profile | Internally treated as “closed but advisory”; not a clean metric-derived quantity yet |
| Shift-plus-lapse branch exists as `warp.metric.T00.nhm2.shift_lapse` | implemented_and_audit_backed | implemented + audit-backed | Shift-plus-lapse diagnostic audit declares family source id and warpFieldType `nhm2_shift_lapse`  | Underlying JSON artifact missing in repo; audit text exists | tests reference missing artifacts paths (see below) | Branch does not produce nontrivial lapse; no α gradient in outputs | Branch is explicitly “reference-only…mild local cabin gravity only”  |
| Local cabin gravity is represented as lapse-gradient effect | implemented_but_reference_only | implemented + secondary-contract | ADM gravity contract defines `eulerian_accel_geom_i = ∂i α / α` ; brick computes `alpha_grad_*` and `eulerian_accel_geom_*`  | Shift-plus-lapse audit reports calibrated gravity via analytic companion  | n/a | Brick acceleration not consistent with lapse gradient; or sign conventions inverted | The implementation is diagnostic-tier; not promoted to Lane A or readiness  |
| Tiny clock-gradient diagnostics exist and are provenance-aware | implemented_and_audit_backed | implemented + audit-backed | Shift-plus-lapse audit reports cabin clock split fraction/day/year and sources ; comparison audit records provenance mismatch warnings  | Audit text exists; JSON “latest” missing | n/a | Under-resolution logic not triggered; analytic vs brick values diverge beyond tolerance | Under-resolution is expected at float32 for ~1e‑16 α deltas  |
| Wall-normal β_outward/α safety diagnostics exist and are stable | implemented | implemented | `computeWallShiftLapseSafety` samples hull normals and computes `(β·n)/α`  | Shift-plus-lapse audit reports β_outward/α and margin  | n/a | β_outward/α not computed; margin not near (1 - max) | Current values are ~1e‑17 (trivially safe given β≈0)  |
| Precision/provenance handling for mild lapse under-resolve in float32 bricks is explicit | implemented_and_audit_backed | implemented + audit-backed | Under-resolution flagged in shift-plus-lapse audit (deltaAlpha raw 0 vs expected 1.1e‑16)  | Comparison audit documents mixed-source policy and warning count  | tests exist but rely on missing artifact JSON | Treating analytic companion as raw brick without labeling | Repo explicitly labels the comparison as mixing sources and warns against treating pipelines as identical  |
| “Full-solve latest” artifacts exist and tests exercise them | unsupported_in_repo_state | missing | Paths referenced in proof-pack inputs and tests exist as strings but JSON artifacts not committed (observed via missing fetches; tests hardcode expected paths) | Proof-pack references `artifacts/research/full-solve/*.json` ; tests read `artifacts/research/full-solve/nhm2-shift-plus-lapse-diagnostics-latest.json`  | tests likely fail on clean checkout if artifacts absent | Clean clone + test run fails to find “latest.json” | This is a reproducibility break: audit text exists, but primary artifacts are missing from repo |
| Render taxonomy exists and categories are defined | partially_supported | documented + audit-backed | Proof-pack audit lists render taxonomy categories and links to standard doc  | `render-taxonomy-latest.json` referenced but not committed | unclear | Taxonomy differs from actual renderer outputs; category bleed | “Presentation layer” is reported “flat” and has warnings even when backed by authoritative metric  |

## Congruence Matrix

| intended governing statement | code path actually used | emitted diagnostic / audit output | maturity | known caveats / unresolved |
|---|---|---|---|---|
| York proof surface: θ defined as −trK on Eulerian normal observer for readiness classification | Contract defines θ=−trK and Lane A as authoritative ; brick derives θ from K_trace  | Proof-pack lane parity closes θ vs −K_trace parity  | authoritative + implemented | The actual physical meaning (expansion of a congruence) depends on 3+1 semantics; internally consistent, but not a physical feasibility proof  |
| Natário-like “zero expansion” corresponds to divergence-free shift field (θ≈0) | `natario_sdf` uses Hodge projection and sets `isZeroExpansion` via `maxDiv` threshold  | Contract-based family classification vs natario_control  | implemented (diagnostic) | Absolute θ is extremely small across controls and NHM2 in audit (~1e‑33), weakening interpretive significance  |
| Casimir baseline: ρ₀(a) = −π² ħc / (720 a⁴) | `casimirEnergyDensity(a_m)`  | Used by `enhancedAvgEnergyDensity` feeding stress-energy proxy  | implemented | This treats ideal parallel plates; does not model NHM2 geometry, boundary conditions, renormalization scheme, or dynamic mode structure |
| Dynamic Casimir “pump” and “sector strobing” captured via amplification × duty | `amplificationFromPipeline` and `resolveDutyEff`  | Timing authority audit flags simulated profile & autoscale active  | proxy_modeled | No first-principles field solution, no explicit dynamic Casimir PDE/QFT; timing semantics carry explicit audit caveats |
| “Metric T00” and QI checks are metric-derived in strict mode | `warpViability.ts`: QI gate requires metric source + contract + PASS applicability in strict mode  | Proof-pack: source-formula mismatch class direct_vs_reconstructed  | implemented but fragile | Internal “formulaEquivalent=false” is an explicit congruence failure signal; strict mode promotion should not be treated as achieved until resolved |
| Shift-plus-lapse generalization: α(x) nontrivial, with cabin gravity and clock gradients | α(x) evaluated by `evaluateWarpMetricLapseField` and applied over grid ; ADM contract defines accel formula  | Shift-plus-lapse diagnostics audit: calibrated g≈4.9 m/s² and tiny clock split fraction  | implemented but reference-only | GR initial state is Minkowski + uniform β; not the full NHM2 spatial β(x) under lapse; this is diagnostic-tier, not a generalized solve  |
| Wall/horizon safety: require β_outward/α < 1 in hull wall | `computeWallShiftLapseSafety` samples and computes max/p98 and margin  | Shift-plus-lapse audit reports values and `wallHorizonMargin=1`  | implemented | Current β values are ~1e‑17, not near the regime where the diagnostic is stress-tested; safety result is trivially “pass” for this scenario |
| Precision/provenance: do not treat analytic companion as identical to raw brick | Under-resolution declared; analytic companion preferred for underflow  | Comparison explicitly lists 5 provenance warnings for mixed sources  | implemented (policy) | Some internal naming mismatches (divBeta vs theta) can silently break “canonical Natário” checks  |
| Shift field sampling / interpolation is correct | Hodge shift evaluator uses a trilinear interpolation routine | n/a directly | **not reliable** | The interpolation uses `tz` where `ty` is required, weakening any sample-based derivatives or comparisons using that evaluator  |

## Falsification Paths

### Warp profile structure
A falsifier inside this repo is not “Nature says warp drives don’t work,” but a concrete mismatch between (a) the canonical profile parameters and (b) what pipeline/solves actually use.

If `shared/warp-promoted-profile.ts` is treated as canonical but pipeline outputs (York evidence, metricT00Ref, TS, duty effective) consistently reflect a different warpFieldType or parameter set, then “canonical baseline” claims are falsified at the repo-congruence level. The proof-pack already implies multiple override layers (e.g., audit harness override active; payload/request mismatch) which is a direct threat to profile authority. 

### Natário-like low-expansion behavior
The repo’s internal classifier treats “Natário-like” as “low expansion under θ morphology features,” not as a formal identity claim. 

Concrete falsifiers:
- If Lane A parity stops closing (θ vs −K_trace mismatch), the York-family proof surface is broken.   
- If NHM2’s distance to alcubierre_control becomes comparable to or lower than its distance to natario_control under the contract’s robustness sweep, the “Natário-like” classification claim is falsified *within the repo’s own decision policy*.   
- If after fixing the shift evaluator interpolation bug, the Hodge-projected derived quantities (or any sample-based metric T00 calculations) shift enough to change the York morphology features materially, the current interpretation is falsified due to an implementation error. 

### Casimir mechanism modeling
The repo does implement a Casimir *proxy* model (parallel-plate density + amplification + duty). 

Concrete falsifiers of “Casimir mechanism is represented congruently enough” *at current repo-claim level*:
- The proof-pack’s own Source-Formula Audit reports `formulaEquivalent=false`. Until that flips to true (or the mismatch is explained as “expected”), any strong congruence claim is falsified internally.   
- If energy pipeline results used for proof-pack cannot be regenerated from committed code + committed artifacts (currently “latest.json” artifacts are absent), the mechanism lacks falsifiable artifact grounding in the repo.    
- If strict mode QI gating requires a metric-derived `rhoSource` and contract metadata but those never appear from the pipeline (i.e., strict gating cannot pass), then “QI-consistent Casimir mechanism” is not realized in current code. 

### Sector strobing / duty-cycle / timing logic
The repo models duty effective by policy (divide by sector count unless overridden) and then uses TS as a gate with strict-mode provenance requirements.  

Concrete falsifiers:
- If timing authority continues to flag “simulated profile active” and “autoscale active,” then timing logic is not fully a derived physical diagnostic; it remains proxy-tier.   
- If TS is derived from multiple fallback hierarchies (ratio vs times vs applied burst) without stable provenance, then strict-mode TS claims are fragile. The code explicitly gates on `tsMetricDerived` in strict mode, so failure to produce it falsifies readiness-tier TS claims. 

### Shift geometry
Concrete falsifiers:
- If “shift geometry visualization” cannot be regenerated because its referenced JSON artifact is missing and the producing script path is nonfunctional or absent (units/policy deferred; artifacts missing), then shift-geometry is not artifact-backed in repo.   
- If residual maps depend on the flawed shift evaluator interpolation, they might be numerically incorrect and thus falsify any interpretive conclusions drawn from them. 

### Shift-plus-lapse branch
Concrete falsifiers:
- If α(x) is not actually spatially varying on the evolved grid (e.g., `evaluateWarpMetricLapseField` not applied or lapse summary not resolved), then “local cabin gravity via lapse gradients” is falsified.   
- If the analytic companion predicts Δα≈1e‑16 but brick deltas are nonzero and inconsistent (or vice versa) without provenance handling, then the precision policy is broken.   
- If someone interprets the current shift-plus-lapse GR run as a *full generalized NHM2 solve*, that interpretation is falsified by code: initial state is Minkowski and β is constant across space. 

## Precision / Provenance Audit

### Where raw brick values are used
The GR evolve stack constructs a brick with float32 channels such as `alpha`, `beta_x/y/z`, `K_trace`, constraints, plus derived “extra” fields including `alpha_grad_*`, `eulerian_accel_geom_*`, and `beta_over_alpha_mag` (when present).    
The derived fields are computed in the evolution brick builder; e.g., `eulerian_accel_geom_i = (∂i α)/α` and `beta_over_alpha_mag = |β|/α`. 

Wall safety metrics are computed **from these brick channels** by sampling inside the hull wall and evaluating `(β·n)/α`. 

### Where analytic companion values are used
In the mild shift-plus-lapse reference scenario, the calibrated lapse gradient is at the ~1e‑17 1/m scale, producing Δα across the cabin height of ~1e‑16. The audit explicitly documents that float32 under-resolves this, so it uses the analytic lapse summary companion for top/bottom α and gravity gradient.  

This is concretely **not** “brick solved α gradients”; it’s “brick α is essentially 1 everywhere in float32, so use analytic reference gradient.” The audit calls this out explicitly, including the “preferredCompanionSource.” 

### Where mixed-source policy is used
The comparison audit explicitly encodes cross-case mismatch warnings (baseline brick vs generalized analytic companion) and states that conceptual alignment does not imply identical numeric pipelines. 

This is the correct scientific posture for comparing a resolved brick field to an analytic calibration, but it also means: current “comparison artifacts” (as described in audit text) do **not** establish equivalence of pipelines.

### Where values remain unresolved / fragile
Two concrete fragilities remain:

- **Naming mismatch risk:** `shared/time-dilation-diagnostics.ts` expects `betaDiagnostics.divBetaRms/divBetaMaxAbs`, but the warp metric adapter exposes `thetaRms/thetaMax`. Until reconciled, any “Natário canonical” checks depending on `divBeta*` are not trustworthy.    
- **Evaluator correctness risk:** the Hodge-projected shift evaluator uses a trilinear interpolation routine with a parameter error (`tz` used where `ty` should be). Any derived sample-based quantities using this evaluator are suspect until fixed and regression-tested. 

## Missing Pieces

The highest-impact missing or unresolved elements (from a falsifiable “code-and-evidence congruence” perspective) are:

The repository does not contain multiple referenced “latest” JSON artifacts under `artifacts/research/full-solve/…`, while both audits and tests reference them. Proof-pack inputs explicitly reference `artifacts/research/full-solve/nhm2-snapshot-congruence-evidence-latest.json`, and tests read `…/nhm2-shift-plus-lapse-diagnostics-latest.json`.    
This prevents a clean “checkout → run tests → reproduce evidence pack” loop.

The Source→York bridge is explicitly incomplete (`timingAuthorityPresent=false`, `parameterMappingsComplete=false`, `bridgeReady=false`). The repo claims it is “advisory-only,” but this is still an unresolved congruence gap for any interpretation that relies on controls mapping to York morphology via a specified physical mechanism. 

The shift-plus-lapse “generalization” is not yet a full generalized NHM2 solve: GR initialization is Minkowski + α(x) + spatially constant β. That is compatible with “lapse diagnostics + β/α safety probe,” not with “generalized shift-plus-lapse warp solution.” 

The Casimir mechanism is proxy-modeled. This can be acceptable at a diagnostics tier, but the repo’s own Source-Formula Audit flags direct versus reconstructed mismatches. That is not a missing feature; it is an explicit internal contradiction marker. 

A concrete numeric bug exists in shift field evaluation (trilinear interpolation), which can perturb any sampling-based “metric stress energy from shift derivatives” computations and any visualization derived from sampled fields. 

## Recommended Next Research Sequence

1. **Make evidence reproducible in-repo.** Either commit the referenced `artifacts/research/full-solve/*-latest.json` outputs or redesign tests/scripts to generate them deterministically during CI/test runs. Right now, proofs reference artifact paths that don’t exist in a clean repo state.  

2. **Fix the Hodge evaluator trilinear interpolation bug and add regression tests.** Specifically correct `y1 = lerp(x01, x11, ty)` (not `tz`). Then re-run York classification, shift geometry residuals, and any sample-based metric stress-energy computations to see what changes. 

3. **Reconcile `divBeta*` vs `theta*` naming across metric adapter and time-dilation diagnostics.** Decide a single canonical schema (e.g., always `thetaMax/thetaRms`), and ensure “Natário canonical” checks use the same name. This is a silent correctness hazard.  

4. **Close the Source→York bridge or downgrade dependent claims.** The proof-pack explicitly says parameter mappings and timing authority are missing/policy-split. Treat these as blocking for anything beyond “diagnostic family classification,” and collect the missing mapping artifacts needed to turn `bridgeReady` true.  

5. **If shift-plus-lapse is intended to be more than a cabin-lapse diagnostic, incorporate spatial β(x) into the GR initial state.** Right now the branch applies α(x) but stamps a single constant β vector across the volume. Either formalize this as “uniform-shift companion diagnostic” or implement the actual β(x) field in the brick initialization. 

6. **Resolve the Source-Formula mismatch.** The audit states `formulaEquivalent=false` for direct vs reconstructed. Make this falsifiable: log the exact formula forms (symbolically or numerically) and show a toleranced equivalence in a dedicated test. Until resolved, “Casimir mechanism congruence” remains weak. 

7. **Stress-test wall/horizon safety in nontrivial regimes.** Current β/α is ~1e‑17 in the mild scenario (trivial pass). Add at least one test scenario where β/α approaches 1 near the wall and verify stability and sampling robustness of `(β·n)/α` computation. 

8. **Enforce render taxonomy/separation in code, not just in audit prose.** The proof pack reports taxonomy categories, but the path that generates/manifests them is not clearly reproducible given missing artifacts and an empty core script file. Make taxonomy a schema-validated artifact produced in CI. 
