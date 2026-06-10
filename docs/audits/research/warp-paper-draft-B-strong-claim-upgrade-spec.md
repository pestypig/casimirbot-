# Paper Draft B (Strong-Claim Upgrade Spec)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Scope
This document defines what must be added beyond current reduced-order closure to support stronger scientific claim quality. It uses current repo status as baseline and then defines external-closure requirements.

## Baseline at Commit Pin
- Commit pin: `83ad2276e89f6766b863d0b10ab7a09d569585da`
- Current snapshot: `blocked=false`, `strongClaimClosure.passAll=true`
- Closure specs status:
  - A operator mapping: pass
  - B sampling/kernel provenance: pass
  - C curvature applicability: pass
  - D uncertainty decision band: pass
  - E literature parity replay: pass
  - F reproducibility agreement: pass
  - G promotion readiness/stability: pass

Source:
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`

## Default Integrity Parity Anchor
- Machine-readable anchor: `artifacts/research/full-solve/integrity-parity-suite-latest.json`
- Human-readable anchor: `docs/audits/research/warp-integrity-parity-suite-latest.md`
- Regeneration command: `npm run warp:integrity:check`

Derived capsule anchors (for deep drill-down):
- `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- `docs/audits/research/warp-full-solve-reference-capsule-latest.md`
- Validation command: `npm run warp:full-solve:reference:validate -- --capsule artifacts/research/full-solve/full-solve-reference-capsule-latest.json`

Policy note:
- Capsule artifacts do not override canonical gates.
- They package canonical + lane + geometry + certification state into a deterministic commit-pinned citation bundle.

## Default External-Comparison Anchor
- Master matrix (machine-readable): `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`
- Master matrix (human-readable): `docs/audits/research/warp-external-work-comparison-matrix-latest.md`
- Full refresh command: `npm run warp:external:refresh`

## Default Promotion-Readiness Anchor
- Machine-readable anchor: `artifacts/research/full-solve/promotion-readiness-suite-latest.json`
- Human-readable anchor: `docs/audits/research/warp-promotion-readiness-suite-latest.md`
- Full refresh command: `npm run warp:promotion:readiness:check`

## Default Needle Hull Mark 2 Proof Index Anchor
- End-to-end proof index (machine-readable): `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.json`
- End-to-end proof index (human-readable): `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
- Purpose: single source of truth for artifact paths used to substantiate generated-paper claims across canonical, parity, external-work, and evidence-lane scopes.
- Usage: paper-generation outputs should cite this index first (JSON or MD), then cite claim-specific artifact paths from the index.

Policy note:
- External-work comparisons remain `reference_only` overlays until separately promoted by canonical governance policy.
- Promotion-readiness artifacts are reporting overlays and do not override canonical gates.

## Strong-Claim Upgrade Objective
Move from internal reduced-order closure to externally defensible scientific-claim strength via independent reproducibility, explicit operator semantics closure against literature, and externally benchmarked uncertainty and validity domains.

Post-pin NHM2 closure-stack objective: stronger claim language must also clear the diagnostic ledger introduced after the commit-pinned March evidence set. The ledger covers same-chart tensor completeness, wall-region source closure, observer-family energy-condition scope, QEI worldline dossiers, Casimir material receipts, and Natario invariant/stability diagnostics. Missing or proxy ledger rows keep the paper in reduced-order diagnostic language even when older aggregate gates pass.

## Upgrade Specs (External Closure)

## Spec H: Independent Reproduction
Requirement:
- Reproduce key artifacts and decisions on at least one independent environment using only pinned commit + documented commands.

Acceptance:
1. Regenerated values match within deterministic tolerances:
   - canonical decision/counts
   - G4 wave rows
   - promotion bundle summary
2. Certificate hash/integrity remain valid in independent run.
3. Independent run report committed as an audit artifact.

Fail condition:
- Any decision-count mismatch or non-reproducible artifact schema.

## Spec I: External Operator-Semantics Adjudication
Requirement:
- Independent technical adjudication of the operator mapping assumptions used by the pipeline (including renormalization/state semantics) against primary QI/QEI literature.

Acceptance:
1. Publish a machine-readable adjudication artifact with:
   - accepted assumptions
   - rejected assumptions
   - unresolved assumptions
2. Explicitly tie each assumption to literature references.
3. Map unresolved assumptions to deterministic guardrail outcomes.

Fail condition:
- Missing explicit assumption-to-evidence mapping.

## Spec J: Kernel/K Cross-Validation
Requirement:
- Cross-validate kernel normalization and K derivation using independent derivation/reference implementation.

Acceptance:
1. Replay K derivation independently for selected kernel(s) used in campaign.
2. Show tolerance-bound agreement with repo artifact values.
3. Publish mismatch analysis if any drift occurs.

Fail condition:
- Inability to reproduce K provenance chain for campaign kernel settings.

## Spec K: External Applicability-Domain Validation
Requirement:
- Validate that applicability criteria (curvature/timing domain assumptions) are robust to independent interpretation and not artifact-local conventions.

Acceptance:
1. Independent calculation reproduces applicability pass/fail outcomes per wave.
2. Boundary conditions and domain assumptions are explicitly stated.
3. Any ambiguity is converted to deterministic fail-closed conditions.

Fail condition:
- Applicability results sensitive to undocumented conventions.

## Spec L: Uncertainty Program Upgrade
Requirement:
- Expand uncertainty treatment from internal pass artifact to publication-grade uncertainty accounting and stress testing.

Acceptance:
1. Provide uncertainty budget with component-level decomposition.
2. Run perturbation/sensitivity bands over key variables.
3. Demonstrate decision robustness boundaries for reported pass regimes.

Fail condition:
- Pass status changes under plausible uncertainty perturbations without explicit policy coverage.

## Spec M: Materials/Device Constraint Closure
Requirement:
- Replace UNKNOWN rows in materials-bounds table with numeric constraints or explicit blocked evidence pathways.
- Replace idealized Casimir scalar source claims with material-receipted source evidence before using tile rows as material support for wall closure.

Target rows to close:
1. Thermal envelope (dissipation/cooling limits)
2. Structural envelope (stress/strain limits)
3. Control jitter bounds and hardware timing limits
4. Casimir material receipt status, including geometry metrology, dielectric/material model, finite-conductivity/temperature/roughness corrections, environment evidence, and beyond-PFA validity.

Acceptance:
1. Each row has numeric value, margin, and evidence path at commit pin.
2. Missing values are explicitly marked blocked with a closure plan.
3. `casimir_material_receipt/v1` is present and `status=material_receipted` before tile-effective wall source evidence is described as material-receipted.

Fail condition:
- Narrative-only statements without numeric constraints.
- Perfect-conductor or parallel-plate scalar formulas are used as material source evidence without a receipt artifact.

## Spec N: Claim-Governance Publication Gate
Requirement:
- Enforce publication-time policy checks that reject claim-tier violations automatically.
- Reject publication language that treats diagnostic closure-stack artifacts as physical viability, propulsion, safety, or certified transport evidence.

Acceptance:
1. CI/publication bundle fails on tier-collapsing language.
2. Boundary statement is validated verbatim.
3. Paper outputs include falsifier matrix and non-goals sections.
4. Paper outputs avoid unqualified phrases such as `NHM2 proves viability`, `energy conditions pass`, `Casimir tiles provide the required source`, and `zero expansion solves safety`.

Fail condition:
- Ability to publish stronger claim language without evidence-tier support.

## Spec O: NHM2 Closure-Stack Completion

Requirement:
- Complete the NHM2 diagnostic closure stack before using full-solve, observer-robust, QEI-closed, material-source, or Natario-safe wording.

Required artifact rows:
1. `nhm2_same_chart_full_tensor/v1`
2. `nhm2_wall_source_closure/v1`
3. `nhm2_observer_robust_energy_conditions/v1`
4. `nhm2_qei_worldline_dossier/v1`
5. `casimir_material_receipt/v1`
6. `nhm2_natario_invariant_audit/v1`

Acceptance:
1. Same-chart tensor artifact records all `T00`, `T0i`, diagonal `Tij`, and off-diagonal `Tij` components as computed, derived same chart, or explicitly missing/blocked.
2. Wall `T00` residual passes before global source residuals are used as context.
3. Energy-condition results name observer families and distinguish Eulerian-only checks from robust observer-family completion.
4. QEI dossier includes a wall worldline, sampling function, sampled density, bound provenance, margin, and tau consistency.
5. Casimir tile rows used as source evidence are material-receipted, not merely `ideal_scalar_only`.
6. Natario audit records invariant and stability diagnostics separately from theta flatness.

Fail condition:
- Missing `T0i` or off-diagonal `Tij` is treated as zero.
- Global source residuals are allowed to mask a wall-region failure.
- Eulerian-only energy-condition evidence is described as observer-robust.
- Scalar `qei_margin` substitutes for a worldline dossier.
- Ideal Casimir scalar math is used as material evidence.
- `thetaFlatnessStatus: pass` is treated as invariant, stability, or safety closure.

## VVUQ/Standards Alignment Matrix (H-O)

| Alignment item | Closure spec mapping | Acceptance criterion | Deterministic falsifier | Evidence artifact path | Confidence tier |
|---|---|---|---|---|---|
| Risk-based credibility mapping (ASME V&V 40 style) | H, N | claim tiers map to explicit credibility levels and required evidence depth | any tier lacks declared credibility requirement | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | high |
| VVUQ terminology normalization | H, I | manuscript terms mapped to canonical VVUQ vocabulary in appendix | undefined or conflicting term usage in methods/results | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | high |
| Multivariate validation metric adoption (VVUQ 20.1 style) | I, J | validation metric suite declared with threshold and acceptance rule | no thresholded validation metric for model-reference comparison | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | medium |
| Reduced-order to full-solve transition gate | K | deterministic transition rule for error, convergence, and uncertainty stability | transition executed without satisfying all criteria | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | high |
| Explicit RSET semantic declaration | L | renormalization scheme, state assumptions, and regularization declared | missing semantic declaration for stress-energy source | `docs/audits/research/warp-g4-operator-mapping-audit-2026-03-02.md` | medium |
| Hadamard point-splitting equation-level closure (Decanini-Folacci lane) | L, N | operator-mapping evidence includes point-split limit and renormalized conservation/anomaly equations tied to implementation semantics | operator mapping remains metadata-only without equation-level provenance | `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`, `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md` | high |
| Worldline QEI sampler admissibility checks (FE lane) | L, N | each run includes `normalize_ok`, `smoothness_ok`, and `scaling_ok` with declared kernel identity/normalization | FE-style pass claim without required sampler checks or failed sampler checks | `docs/audits/research/warp-qei-worldline-primer-2026-03-04.md`, `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | high |
| Timelike/null applicability separation for QI constants | L, N | timelike formulas applied only to timelike worldline lanes unless separate bound is configured | null/spatial lane uses timelike FordRomanQI constants without dedicated equivalence proof | `docs/audits/research/warp-qei-worldline-primer-2026-03-04.md` | high |
| Stress-tensor fluctuation consistency criterion (exploratory) | L, M | exploratory threshold and reporting path defined; not a hard gate | treated as hard pass criterion before validation | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | low |
| Casimir tile manufacturing delta closure | M | each requirement has target, validation test, acceptance criterion, and falsifier | requirement row lacks measurable acceptance criterion | `docs/specs/casimir-tile-manufacturing-delta-v1.md` | high |
| External evidence compatibility envelopes (lane-wise) | M, N | each experimental lane publishes deterministic pass-1/pass-2 compatibility + congruence artifacts with repeat-run stability evidence | lane lacks replayable pack/run/checker artifacts or repeat-run summaries diverge | `docs/specs/casimir-tile-casimir-sign-compatibility-contract-v1.md`, `artifacts/research/full-solve/cs-repeat-determinism-2026-03-05.json` | high |
| Q-spoiling compatibility envelope + frozen reportable profile | M, N | q-spoiling lane publishes strict contract, mechanism-split thresholds (`hydride_q_disease`/`trapped_flux`/`tls_oxide`), pass-1/pass-2/reportable/reportable-reference packs, congruence checks, repeat-run stability, and explicit reportable readiness state | mechanism thresholds are mixed/global, reportable profile lacks fixed citation scenario IDs, or run/check summaries diverge across repeats | `docs/specs/casimir-tile-q-spoiling-compatibility-contract-v1.md`, `artifacts/research/full-solve/qs-repeat-determinism-2026-03-06.json` | high |
| Nanogap compatibility envelope + frozen reportable profile | M, N | nanogap lane publishes strict contract, profile thresholds (`NG-STD-10`/`NG-ADV-5`), pass-1/pass-2/reportable/reportable-reference packs, profile-aware congruence checks, repeat-run stability, and explicit reportable readiness state | strict anchors are missing (`calibration`,`tip_state`,`fiducial`,`uncertainty`), reportable profile lacks fixed citation scenario IDs, or run/check summaries diverge across repeats | `docs/specs/casimir-tile-nanogap-compatibility-contract-v1.md`, `artifacts/research/full-solve/ng-repeat-determinism-2026-03-06.json` | high |
| Timing compatibility envelope + frozen reportable profile | M, N | timing lane publishes strict contract, profile split (`WR-SHORT-PS`/`WR-LONGHAUL-EXP`), pass-1/pass-2/reportable/reportable-reference packs, profile-aware congruence checks, repeat-run stability, and explicit reportable readiness state | strict anchors are missing (`timing_topology`,`timing_precision`,`timing_accuracy`,`timing_longhaul`), reportable profile lacks fixed citation scenario IDs, or run/check summaries diverge across repeats | `docs/specs/casimir-tile-timing-compatibility-contract-v1.md`, `artifacts/research/full-solve/ti-repeat-determinism-2026-03-06.json` | high |
| SEM+ellipsometry compatibility envelope + frozen reportable profile | M, N | SEM+ellipsometry lane publishes strict contract, profile thresholds (`SE-STD-2`/`SE-ADV-1`), pass-1/pass-2/reportable/reportable-reference packs, uncertainty-aware congruence checks, repeat-run stability, explicit fail-closed reportable readiness state, and paired-run artifact-set unlock path | strict anchors are missing (`sem_calibration`,`ellipsometry`,`uncertainty_reporting`,`traceability`), reportable profile is not fail-closed on missing paired-run/covariance evidence, paired-run artifact contract is absent, or run/check summaries diverge across repeats | `docs/specs/casimir-tile-sem-ellipsometry-compatibility-contract-v1.md`, `docs/specs/casimir-tile-sem-ellipsometry-paired-run-artifact-set-v1.md`, `artifacts/research/full-solve/se-repeat-determinism-2026-03-06.json` | high |
| SEM+ellipsometry publication overlay envelope (cross-study synthesis) | M, N | publication-overlay pack publishes deterministic cross-study mapping artifacts (`typed/run/check/summary`) with explicit non-promotional policy lock (`reportableUnlock=false`) and stable latest aliases | overlay lane used to claim reportable readiness, or publication overlay summary omits blocked reasons / checksum / deterministic reason counts | `configs/warp-shadow-injection-scenarios.se-publication-typed.v1.json`, `artifacts/research/full-solve/se-publication-overlay-latest.json`, `docs/audits/research/warp-se-publication-overlay-latest.md` | medium |
| Promotion-readiness bridge suite | H, M, N | `promotion_readiness_suite/v1` artifact exists and includes canonical/geometry/GR parity status + lane reportable coverage + blocker taxonomy + deterministic checksum | missing required readiness fields, missing lane reportable coverage, or checksum repeatability mismatch at same commit | `docs/specs/warp-promotion-readiness-suite-contract-v1.md`, `artifacts/research/full-solve/promotion-readiness-suite-latest.json` | high |
| Measured uncertainty gate (q_spoiling) | M, N | reportable decisions are driven by mechanism-specific measured uncertainty anchors (`EXP-Q-020..022`) and not policy-only placeholder rows | q-spoiling reportable status resolves true while measured mechanism uncertainty anchors are absent or blocked | `docs/specs/casimir-tile-q-spoiling-compatibility-contract-v1.md`, `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md` | high |
| Measured uncertainty gate (timing) | M, N | reportable decisions require strict-scope numeric uncertainty anchors (`EXP-T-030`,`EXP-T-031`) plus admissible topology/timestamping preconditions | timing reportable status resolves true without numeric uncertainty anchors or with failed timestamping/SyncE admissibility | `docs/specs/casimir-tile-timing-compatibility-contract-v1.md`, `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md` | high |
| Measured covariance gate (SEM+ellipsometry) | M, N | reportable status remains fail-closed until paired dual-instrument run + covariance uncertainty anchors are present and admissible; when paired-evidence is supplied it must also carry measurement provenance (`data_origin=instrument_export`, run IDs, raw artifact refs + SHA-256) and must not use template-placeholder inputs | SEM+ellipsometry reportable status resolves true while blocked reasons include missing paired-run/covariance anchors, measurement-provenance blockers, or `template_placeholder_input` | `docs/specs/casimir-tile-sem-ellipsometry-compatibility-contract-v1.md`, `docs/specs/casimir-tile-sem-ellipsometry-paired-run-artifact-set-v1.md` | high |
| Sign-control congruence fail-safe | M, N | sign-transition evidence and cross-source congruence score satisfy thresholds with uncertainty margin | missing evidence lane or `C_congruence` below threshold | `docs/specs/casimir-tile-spec-v1.md`, `docs/specs/casimir-tile-test-vehicle-plan-v1.md` | medium |
| External warp-family geometry congruence (Core-4) | H, K, N | Core-4 method-track snapshots replay deterministically and compare against local geometry baseline keys with explicit comparability classes and blocker codes | missing equation anchor, missing snapshot signature key, or non-comparable assumption domain not explicitly flagged (`non_comparable_assumption_domain` / `conditional_b_equals_1_only` / `requires_region_ii_derivative_closure`) | `configs/warp-external-work-profiles.v1.json`, `scripts/warp-shadow-warp-geometry-replay.ts`, `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json` | high |
| External warp-family energetics/QEI congruence (Core-4) | H, L, N | Core-4 method-track energetics snapshots replay deterministically and compare against local capsule energetics/QEI baseline keys with explicit assumption-domain blocker semantics | missing equation anchor, missing snapshot energetics key, missing local capsule energetics baseline key, or non-comparable assumption domain without explicit blocker code (`non_comparable_assumption_domain`, `requires_region_ii_derivative_closure`, `worldline_qei_not_explicit_in_source`) | `configs/warp-external-work-profiles.v1.json`, `scripts/warp-shadow-warp-energetics-replay.ts`, `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json` | high |
| External observable GR parity anchor set (Mercury + Lensing + Frame Dragging + Shapiro) | H, K, N | method-track replays (`EXT-GR-MERC-001`,`EXT-GR-LENS-001`,`EXT-GR-FD-001`,`EXT-GR-SHAP-001`) reproduce capsule-aligned observable keys with deterministic tolerances and explicit reason codes | missing equation anchor/constants/observed benchmark, replay status not deterministic, or any observable residual exceeds replay tolerance without blocker classification | `configs/warp-external-work-profiles.v1.json`, `scripts/warp-shadow-gr-mercury-precession-replay.ts`, `scripts/warp-shadow-gr-lensing-deflection-replay.ts`, `scripts/warp-shadow-gr-frame-dragging-replay.ts`, `scripts/warp-shadow-gr-shapiro-delay-replay.ts`, `artifacts/research/full-solve/integrity-parity-suite-latest.json` | high |
| External comparison blocker reduction stability | N | external-work compare + matrix artifacts preserve raw reason codes and deterministic reduced blocker categories for manuscript-stable reporting | missing `reduced_reason_counts` in compare/matrix/capsule payloads or reducer outputs diverge for identical inputs | `scripts/warp-external-work-reason-reducer.ts`, `scripts/warp-external-work-compare.ts`, `scripts/warp-external-work-matrix.ts`, `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json` | high |
| Q-factor baseline and spoil closure | M, N | copper baseline-Q lane and cryogenic niobium Q0 lane are measured; mechanism-specific spoil bounds hold | Q assumptions used without measured baseline or spoil mode exceeds bound | `docs/specs/casimir-tile-spec-v1.md`, `docs/specs/casimir-tile-manufacturing-delta-v1.md`, `docs/specs/casimir-tile-test-vehicle-plan-v1.md` | medium |
| Q extraction protocol determinism | M, N | protocolized `Q_L`,`Q_0`,`beta`,`F_Q_spoil` extraction with uncertainty is used across lanes | coupling correction or uncertainty propagation missing | `docs/specs/casimir-tile-q-spoiling-test-protocol-v1.md` | high |
| Timing precision profile closure | M, N | timing profile uses hardware timestamping preconditions with bounded `sigma_t_ps`,`TIE_pp_ps`,`PDV_pp_ps` and uncertainty | timing claim lacks preconditions or bound-compliant uncertainty | `docs/specs/casimir-tile-timing-precision-test-protocol-v1.md` | high |
| Long-haul timing claim governance | H, N | long-haul timing evidence remains exploratory unless topology-matched replication is present | long-haul specialized result promoted as generic bound | `docs/specs/casimir-tile-timing-precision-test-protocol-v1.md`, `docs/specs/casimir-tile-spec-bookkeeping-v1.md` | medium |
| Nanogap uncertainty profile closure | M, N | AFM nanogap uncertainty protocol enforces traceability, tip control, and profile-bounded `u_g_mean_nm`/`u_g_sigma_nm` | nanogap claims without traceability or bounded uncertainty profile | `docs/specs/casimir-tile-nanogap-uncertainty-test-protocol-v1.md` | high |
| SEM+ellipsometry cross-validation closure | M, N | cross-instrument residual `delta_se_nm` and expanded uncertainty `U_fused_nm` satisfy selected profile with traceable SEM calibration and ellipsometry fit evidence | missing calibration/model evidence or residual/uncertainty profile bound breach | `docs/specs/casimir-tile-sem-ellipsometry-cross-validation-protocol-v1.md` | high |
| BTR/fiducial stability governance | M | BTR/fiducial correction lanes include stability/noise sensitivity checks and bounded uncertainty terms | tip-deconvolution correction unbounded or unstable | `docs/specs/casimir-tile-nanogap-uncertainty-test-protocol-v1.md` | medium |
| Spec bookkeeping completeness | H, N | every active spec used in manuscript has ledger registration and verify linkage | manuscript references unbooked or stale spec | `docs/specs/casimir-tile-spec-bookkeeping-v1.md` | high |
| Foundry RFQ governance lock | N | process substitutions and change-control policy are explicit and enforceable | silent process drift accepted without requalification | `docs/specs/casimir-tile-rfq-pack-v1.md` | high |
| Provenance attestation schema closure (in-toto lane) | N | promotion artifacts include verifiable in-toto layout/link continuity and statement schema checks (`_type`,`subject`,`predicateType`) | promotion accepted without verifiable attestation chain or required statement fields | `docs/specs/casimir-tile-equation-provenance-contract-v1.md`, `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md` | high |
| Evidence-governance ledger enforcement | N | every promotion/claim delta has artifact, owner, status, and commit pin | claim promoted without ledger-backed artifact path | `docs/audits/research/warp-standards-alignment-ledger-2026-03-04.md` | high |
| NHM2 same-chart tensor completion | O | full tensor artifact records `T00`, `T0i`, diagonal `Tij`, and off-diagonal `Tij` with computed/derived/missing/blocked status | missing components omitted or treated as zero | `shared/contracts/nhm2-same-chart-full-tensor.v1.ts`, `docs/nhm2-closed-loop.md` | high |
| NHM2 wall-first source closure | O | wall `T00` required-vs-available residual is present and controls readiness before global residual context | wall closure missing/failing while global source residual is used to pass | `shared/contracts/nhm2-wall-source-closure.v1.ts`, `docs/nhm2-audit-checklist.md` | high |
| NHM2 observer-family energy-condition scope | O, N | WEC/NEC/DEC/SEC language names observer family and does not label Eulerian-only evidence robust | unqualified `energy conditions pass` claim or Eulerian-only robust claim | `shared/contracts/nhm2-observer-robust-energy-conditions.v1.ts` | high |
| NHM2 QEI worldline dossier gate | O | wall worldline, sampling, sampled density, bound provenance, margin, and tau consistency are present | scalar `qei_margin` used as final QEI proof | `shared/contracts/nhm2-qei-worldline-dossier.v1.ts` | high |
| NHM2 Natario invariant boundary | O, N | zero-expansion status is separate from invariant, momentum-density, tidal, blueshift, and convergence diagnostics | theta flatness treated as safety or invariant closure | `shared/contracts/nhm2-natario-invariant-audit.v1.ts` | high |

PCS/QMU policy in this phase:
- Included as exploratory robustness overlays.
- Not mandatory hard-pass criteria until domain validation artifacts are available.

## Phase Plan

1. Phase 1: Independent reproduction pack (H)
2. Phase 2: External theory adjudication (I, J, K)
3. Phase 3: Uncertainty and materials closure (L, M)
4. Phase 4: NHM2 closure-stack completion (O)
5. Phase 5: Publication policy hard gate (N)

## Deliverables
- `docs/audits/research/warp-external-reproduction-audit-<date>.md`
- `docs/audits/research/warp-operator-semantics-external-adjudication-<date>.md`
- `docs/audits/research/warp-kernel-k-cross-validation-<date>.md`
- `docs/audits/research/warp-applicability-domain-validation-<date>.md`
- `docs/audits/research/warp-uncertainty-program-upgrade-<date>.md`
- `docs/audits/research/warp-materials-bounds-closure-<date>.md`
- `docs/audits/research/warp-nhm2-closure-stack-completion-<date>.md`
- `docs/audits/research/warp-publication-claim-governance-gate-<date>.md`

## Deterministic Falsifiers

| Falsifier | Trigger | Consequence |
|---|---|---|
| External reproduction mismatch | independent rerun diverges on decision/counts | block strong-claim upgrade |
| Semantics unresolved | operator assumptions not adjudicated | keep at reduced-order claim level |
| Kernel drift | independent K derivation mismatch | block kernel-closure claim |
| Applicability drift | independent domain classification differs | fail closed on applicability |
| Uncertainty instability | pass/fail flips under modeled uncertainty | block robust-pass claim |
| Materials unknowns | critical constraint rows remain UNKNOWN | block external-feasibility framing |
| Same-chart tensor incomplete | missing `T0i` or off-diagonal `Tij` is absent, blocked, or treated as zero | block full-tensor and source-closed framing |
| Wall source closure missing/failing | wall `T00` required-vs-available residual missing or above tolerance | block local source-closure framing |
| Observer-family scope incomplete | Eulerian-only artifact is used as robust observer result | block observer-robust framing |
| QEI dossier incomplete | scalar margin exists without complete worldline dossier and wall coverage | block QEI-closed framing |
| Casimir material receipt missing | tile source row remains ideal scalar only | block material-source framing |
| Natario invariant audit incomplete | theta flatness exists without invariant/stability diagnostics | block invariant, stability, and safety framing |
| Tier-credibility mismatch | claim tier published without mapped credibility requirement | block standards-aligned governance claim |
| Citation admissibility failure | normative claim lacks at least one primary/standard source | mark recommendation non-compliant |

## Non-Goals
- No full-system physical-feasibility claim from this campaign lane alone.
- No canonical override from exploratory outputs.
- No threshold weakening or pass relabeling.
- No replacement of missing tensor components with zero.
- No global residual override of wall-region source failure.
- No Eulerian-only, scalar-QEI, ideal-Casimir, or zero-expansion shortcut to strong NHM2 claims.

## Exit Criteria for This Upgrade Spec
All specs H-O are satisfied with commit-pinned artifacts, and publication outputs pass policy checks without tier violations.
