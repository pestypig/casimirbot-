# Paper Draft A (Defensible Now, Commit-Pinned)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Evidence Scope
- Commit pin: `83ad2276e89f6766b863d0b10ab7a09d569585da`
- Primary evidence summary: `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- Snapshot companion: `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`
- Claim-governance contract: `docs/audits/research/warp-paper-authoring-contract-2026-03-02.md`

## Default Integrity Parity Anchor
- Machine-readable anchor: `artifacts/research/full-solve/integrity-parity-suite-latest.json`
- Human-readable anchor: `docs/audits/research/warp-integrity-parity-suite-latest.md`
- Regeneration command: `npm run warp:integrity:check`

Derived capsule anchors (for deep drill-down):
- `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- `docs/audits/research/warp-full-solve-reference-capsule-latest.md`
- Validation command: `npm run warp:full-solve:reference:validate -- --capsule artifacts/research/full-solve/full-solve-reference-capsule-latest.json`

Policy note:
- Capsule artifacts are reporting/traceability only.
- Canonical decision authority remains: canonical report -> decision ledger -> governance matrix -> summaries -> exploratory overlays.

## Default External-Work Comparison Anchor
- Master matrix (machine-readable): `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`
- Master matrix (human-readable): `docs/audits/research/warp-external-work-comparison-matrix-latest.md`
- Per-work run artifacts: `artifacts/research/full-solve/external-work/external-work-run-<work_id>-latest.json`
- Per-work compare artifacts: `artifacts/research/full-solve/external-work/external-work-compare-<work_id>-latest.json`
- Refresh command: `npm run warp:external:refresh`
- Manuscript-stable blocker buckets: `reduced_reason_counts` in `external-work-comparison-matrix-latest.json` and capsule `external_work_comparison.reduced_reason_counts`

Interpretation rule:
- External-work comparison artifacts are non-blocking overlays and do not override canonical full-solve decisions.

## Default Promotion-Readiness Bridge Anchor
- Machine-readable anchor: `artifacts/research/full-solve/promotion-readiness-suite-latest.json`
- Human-readable anchor: `docs/audits/research/warp-promotion-readiness-suite-latest.md`
- Regeneration command: `npm run warp:promotion:readiness:check`

State-of-record rule:
- “Reportable vs exploratory” manuscript language must be sourced from `integrity-parity-suite-latest` + `external-work-comparison-matrix-latest` + `promotion-readiness-suite-latest` only.

## Reportable vs Exploratory (Latest Anchors)

| lane | reportable status source | expected status interpretation |
|---|---|---|
| `q_spoiling` | `promotion-readiness-suite-latest.json` -> `lane_reportable_coverage.lanes[q_spoiling]` | reportable when `reportableReady=true` and `blockedReasons=[]` |
| `timing` | `promotion-readiness-suite-latest.json` -> `lane_reportable_coverage.lanes[timing]` | reportable when strict uncertainty/topology gates stay closed and `reportableReady=true` |
| `sem_ellipsometry` | `promotion-readiness-suite-latest.json` -> `lane_reportable_coverage.lanes[sem_ellipsometry]` | exploratory/blocked until paired-run + covariance blocked reasons are cleared |
| external GR/warp overlays | `external-work-comparison-matrix-latest.json` | reference-only overlay; never canonical override |

## Abstract
This draft reports the current reduced-order campaign state using commit-tracked repository evidence at one pin. Canonical adjudication is `REDUCED_ORDER_ADMISSIBLE` with gate counts `PASS=8`, `FAIL=0`, `UNKNOWN=0`, `NOT_READY=0`, `NOT_APPLICABLE=1`. The work is scientifically useful as a reproducible reduced-order closure with explicit falsifiers and a standards-aligned upgrade path; it is not, by itself, a full-system physical feasibility claim.

## Methods
1. Parse the commit-pinned evidence snapshot and required sub-artifacts.
2. Enforce tier separation from the authoring contract:
   - `canonical-authoritative`: decision labels, scoreboard, policy status.
   - `promoted-candidate`: candidate metrics and promotion readiness.
   - `exploratory`: parity overlays and interpretation hypotheses.
3. Reject any claim that requires missing numeric evidence; mark such rows `UNKNOWN`.
4. Use deterministic artifact fields only (no narrative substitution).
5. Resolve contradictions by canonical precedence:
   - canonical campaign execution report
   - decision ledger
   - governance matrix
   - then summary packs.

## Results

## Canonical-authoritative
- Decision: `REDUCED_ORDER_ADMISSIBLE`
- Counts: `PASS=8`, `FAIL=0`, `UNKNOWN=0`, `NOT_READY=0`, `NOT_APPLICABLE=1`
- First fail: `none`
- Reproducibility by wave: `A=PASS`, `B=PASS`, `C=PASS`, `D=PASS`
- Snapshot blocked state: `blocked=false`

Source:
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`

## Promoted-candidate
- Calculator: `decisionClass=candidate_pass_found`, `congruentSolvePass=true`, `applicabilityStatus=PASS`, `marginRatioRawComputed=0.3235753006526127`
- Promotion check: `aggregateDecision=REDUCED_ORDER_ADMISSIBLE`, `candidatePromotionReady=true`, `candidatePromotionStable=true`
- Promotion bundle: `blockedReason=null`, `promotionLaneExecuted=true`, `promotionLaneG4ComparablePassAllWaves=true`
- Promotion lane wave metrics (A-D):
  - `lhs_Jm3=-3.093763128722717`
  - `boundUsed_Jm3=-24.00000000002375`
  - `marginRatioRawComputed=0.12890679702998564`
  - `applicabilityStatus=PASS`

Source:
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`

## Exploratory
- Literature parity replay artifact exists and currently reports pass (`blockedReason=null`).
- Scan classification still records a canonical/scan mismatch structure in ledger (`classificationMismatch=true`), with canonical class retained as authoritative by policy.

Source:
- `docs/audits/research/warp-g4-literature-parity-replay-2026-03-02.md`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`

## Certification
- Latest trace fields in snapshot:
  - `pass=true`
  - `firstFail=null`
  - `certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
  - `integrityOk=true`
  - `status=GREEN`

Source:
- `docs/audits/research/warp-evidence-pack-2026-03-02.json`
- `docs/audits/research/warp-evidence-snapshot-2026-03-02.md`

## Materials-Bounds Constraints Table

| Subsystem | Constraint | Value | Measured/Derived | Margin | Evidence Path | Status |
|---|---|---:|---:|---:|---|---|
| Casimir gap control | `gap_nm` | 8 | Derived (candidate params) | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| QI sampling | `tau_s_ms`, kernel normalization | `0.02`, `unit_integral` | Derived (guard diagnostics) | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| QI bound constant | `K` | `3.8e-30` | Derived (guard diagnostics) | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| RF/Q cavity | `qCavity` | 100000 | Derived (candidate params) | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| Control timing | `TS_ratio` / timing signals | available in diagnostics | Derived | UNKNOWN | `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json` | PASS (value present) |
| Thermal envelope | max dissipation/cooling | UNKNOWN | UNKNOWN | UNKNOWN | no dedicated artifact in required set | UNKNOWN |
| Structural envelope | hoop/strain/stress limits | UNKNOWN | UNKNOWN | UNKNOWN | no dedicated artifact in required set | UNKNOWN |

UNKNOWN handling rule:
- Unknown values remain `UNKNOWN` unless a commit-tracked numeric artifact exists.
- Unresolved RSET semantics and stress-tensor fluctuation thresholds are not collapsed into PASS claims.

## Falsifier Matrix

| Falsifier | Deterministic trigger | Invalidates |
|---|---|---|
| Operator mapping falsifier | operator mapping audit missing or blocked | Any claim of operator-level QEI parity |
| Sampling/K falsifier | kernel provenance audit missing/mismatch | Any claim that K/tau provenance is closed |
| Applicability falsifier | curvature applicability audit blocked/not-pass | Any claim that applicability domain is satisfied |
| Uncertainty falsifier | uncertainty audit blocked or decision band unresolved | Any robust-pass claim |
| Reproducibility falsifier | snapshot blocked, provenance mismatch, or trace integrity failure | Any reproducibility claim |

## Casimir Sign-Control Compatibility Envelope (Non-Blocking)
This lane is explicitly `reference_only` and does not alter canonical campaign decisions.

Primary/standard pass-1 (`configs/warp-shadow-injection-scenarios.cs-primary-recovery.v1.json`) and pass-2 typed (`configs/warp-shadow-injection-scenarios.cs-primary-typed.v1.json`) sweeps were executed with deterministic replay:
- pass-1 run summary: `scenarioCount=18`, `compatible=18`, `partial=0`, `incompatible=0`, `error=0`
- pass-2 run summary: `scenarioCount=18`, `compatible=18`, `partial=0`, `incompatible=0`, `error=0`
- frozen reportable prereg profile (`configs/warp-shadow-injection-scenarios.cs-primary-reportable.v1.json`) replays with identical summary and locked refs/grid assumptions.
- `success_bar=map_only` contract is satisfied with `winnerScenarioId=null` and explicit failure-envelope payloads.

Lane-specific evidence congruence check (`artifacts/research/full-solve/cs-compat-check-2026-03-05.json`) reports:
- `congruent=6`
- `incongruent=9`
- `unknown=3`
- dominant reasons: `gap_outside_primary_window=5`, `gap_outside_transition_band=4`, `edge_uncertainty_overlap=3`

Interpretation rule:
- compatibility to the existing full-solve lane and evidence congruence are tracked separately;
- no promotion/canonical override is implied by this envelope mapping alone.

## Q-Spoiling Compatibility Envelope (Non-Blocking)
This lane is explicitly `reference_only` and does not alter canonical campaign decisions.

Mechanism-split pass-1 (`configs/warp-shadow-injection-scenarios.qs-primary-recovery.v1.json`), pass-2 typed (`configs/warp-shadow-injection-scenarios.qs-primary-typed.v1.json`), frozen reportable (`configs/warp-shadow-injection-scenarios.qs-primary-reportable.v1.json`), and fixed reportable-reference (`configs/warp-shadow-injection-scenarios.qs-primary-reportable-reference.v1.json`) sweeps are executed with deterministic replay:
- scenario grid is now `mechanism_lane x Q0 x F_Q_spoil` (`hydride_q_disease`, `trapped_flux`, `tls_oxide`)
- reportable-reference profile locks a single stable scenario-id set for manuscript citations across reruns
- `success_bar=map_only` is satisfied with `winnerScenarioId=null` and explicit empty failure-envelope payloads.

Lane-specific evidence congruence checks now emit mechanism-qualified reason codes (for example `q0_spoiled_above_ceiling:hydride_q_disease`) and per-mechanism summary counts.

Frozen reportable profile status is explicitly recorded per mechanism uncertainty anchor set (`EXP-Q-020..EXP-Q-022`) with `reportableReady=true` and `blockedReasons=[]` in the prereg profile.

Repeat-run determinism (`artifacts/research/full-solve/qs-repeat-determinism-2026-03-06.json`) covers pass-1, pass-2, reportable, reportable-reference, and congruence-check summaries.

## Nanogap Compatibility Envelope (Non-Blocking)
This lane is explicitly `reference_only` and does not alter canonical campaign decisions.

Strict primary/standard pass-1 (`configs/warp-shadow-injection-scenarios.ng-primary-recovery.v1.json`), pass-2 typed (`configs/warp-shadow-injection-scenarios.ng-primary-typed.v1.json`), frozen reportable (`configs/warp-shadow-injection-scenarios.ng-primary-reportable.v1.json`), and fixed reportable-reference (`configs/warp-shadow-injection-scenarios.ng-primary-reportable-reference.v1.json`) sweeps were executed with deterministic replay:
- pass-1 run summary: `scenarioCount=10`, `compatible=10`, `partial=0`, `incompatible=0`, `error=0`
- pass-2 run summary: `scenarioCount=10`, `compatible=10`, `partial=0`, `incompatible=0`, `error=0`
- reportable run summary: `scenarioCount=10`, `compatible=10`, `partial=0`, `incompatible=0`, `error=0`
- reportable-reference run summary: `scenarioCount=4`, `compatible=4`, `partial=0`, `incompatible=0`, `error=0`
- frozen reportable prereg profile currently records `reportableReady=true`, `blockedReasons=[]`, and stable citation target scenario IDs.

Lane-specific evidence congruence checks:
- typed check (`artifacts/research/full-solve/ng-compat-check-2026-03-06.json`): `congruent=5`, `incongruent=5`, `unknown=0`
- reportable check (`artifacts/research/full-solve/ng-compat-check-reportable-2026-03-06.json`): `congruent=5`, `incongruent=5`, `unknown=0`
- dominant deterministic reason code: `u_g_sigma_exceeds_profile:NG-ADV-5`

Repeat-run determinism (`artifacts/research/full-solve/ng-repeat-determinism-2026-03-06.json`) reports `status=PASS` across pass-1/pass-2/reportable/reportable-reference runs and checker summaries.

Interpretation rule:
- compatibility to the existing full-solve lane and evidence congruence are tracked separately;
- no promotion/canonical override is implied by this envelope mapping alone.

## Timing Compatibility Envelope (Non-Blocking)
This lane is explicitly `reference_only` and does not alter canonical campaign decisions.

Strict primary/standard pass-1 (`configs/warp-shadow-injection-scenarios.ti-primary-recovery.v1.json`), pass-2 typed (`configs/warp-shadow-injection-scenarios.ti-primary-typed.v1.json`), frozen reportable (`configs/warp-shadow-injection-scenarios.ti-primary-reportable.v1.json`), and fixed reportable-reference (`configs/warp-shadow-injection-scenarios.ti-primary-reportable-reference.v1.json`) sweeps were executed with deterministic replay:
- pass-1 run summary: `scenarioCount=12`, `compatible=12`, `partial=0`, `incompatible=0`, `error=0`
- pass-2 run summary: `scenarioCount=12`, `compatible=12`, `partial=0`, `incompatible=0`, `error=0`
- reportable run summary: `scenarioCount=12`, `compatible=12`, `partial=0`, `incompatible=0`, `error=0`
- reportable-reference run summary: `scenarioCount=2`, `compatible=2`, `partial=0`, `incompatible=0`, `error=0`
- frozen reportable prereg profile records `reportableReady=true`, `blockedReasons=[]`, and stable citation target scenario IDs.

Lane-specific evidence congruence checks:
- typed check (`artifacts/research/full-solve/ti-compat-check-2026-03-06.json`): `congruent=9`, `incongruent=2`, `unknown=1`
- reportable check (`artifacts/research/full-solve/ti-compat-check-reportable-2026-03-06.json`): `congruent=9`, `incongruent=2`, `unknown=1`
- profile detail: `WR-LONGHAUL-EXP` now evaluates `congruent=6`, `incongruent=0`, `unknown=0` under strict long-haul anchor gating (`EXP-T-029`).
- dominant deterministic reason codes are now bounded to WR-SHORT edge/threshold behavior: `edge_uncertainty_overlap`, `sigma_exceeds_profile:WR-SHORT-PS`.

Repeat-run determinism (`artifacts/research/full-solve/ti-repeat-determinism-2026-03-06.json`) reports `status=PASS` across pass-1/pass-2/reportable/reportable-reference runs and typed/reportable checker summaries.

Interpretation rule:
- compatibility to the existing full-solve lane and evidence congruence are tracked separately;
- strict timing scope remains `reference_only` and non-promotable by policy even though strict-scope long-haul admissibility and numeric uncertainty anchoring are now present.
- no promotion/canonical override is implied by this envelope mapping alone.

## SEM+Ellipsometry Compatibility Envelope (Non-Blocking)
This lane is explicitly `reference_only` and does not alter canonical campaign decisions.

Strict primary/standard pass-1 (`configs/warp-shadow-injection-scenarios.se-primary-recovery.v1.json`), pass-2 typed (`configs/warp-shadow-injection-scenarios.se-primary-typed.v1.json`), frozen reportable (`configs/warp-shadow-injection-scenarios.se-primary-reportable.v1.json`), and fixed reportable-reference (`configs/warp-shadow-injection-scenarios.se-primary-reportable-reference.v1.json`) sweeps were executed with deterministic replay:
- pass-1 run summary: `scenarioCount=18`, `compatible=18`, `partial=0`, `incompatible=0`, `error=0`
- pass-2 run summary: `scenarioCount=18`, `compatible=18`, `partial=0`, `incompatible=0`, `error=0`
- reportable run summary: `scenarioCount=18`, `compatible=18`, `partial=0`, `incompatible=0`, `error=0`
- reportable-reference run summary: `scenarioCount=2`, `compatible=2`, `partial=0`, `incompatible=0`, `error=0`
- frozen reportable prereg profile records `reportableReady=false` with blocked reasons `missing_paired_dual_instrument_run` and `missing_covariance_uncertainty_anchor`.
- when paired-evidence payloads are provided, reportable unlock additionally requires measurement provenance anchors (`data_origin=instrument_export`, non-empty instrument run IDs, and non-empty raw artifact refs); placeholder/template bundles remain fail-closed.

Lane-specific evidence congruence checks:
- typed check (`artifacts/research/full-solve/se-compat-check-2026-03-06.json`): `congruent=8`, `incongruent=0`, `unknown=10`
- reportable check (`artifacts/research/full-solve/se-compat-check-reportable-2026-03-06.json`): `congruent=0`, `incongruent=0`, `unknown=18`
- reportable-reference check (`artifacts/research/full-solve/se-compat-check-reportable-reference-2026-03-06.json`): `congruent=0`, `incongruent=0`, `unknown=2`
- dominant deterministic reason code on typed envelope: `edge_uncertainty_overlap`.
- strict-source extraction was refreshed with numeric anchors from full text (`EXP-SE-016..EXP-SE-020` from `SRC-041`; updated `EXP-SE-012/013` from `SRC-050`), improving `u_sem_nm`/`u_ellip_nm` bookkeeping while keeping reportable fail-closed.

Repeat-run determinism (`artifacts/research/full-solve/se-repeat-determinism-2026-03-06.json`) reports `status=PASS` across pass-1/pass-2/reportable/reportable-reference runs and typed/reportable/reportable-reference checker summaries.

Interpretation rule:
- compatibility to the existing full-solve lane and evidence congruence are tracked separately;
- reportable outputs remain fail-closed by design until paired dual-instrument covariance-aware uncertainty anchors are present;
- paired-run closure path is now commit-tracked via `docs/specs/casimir-tile-sem-ellipsometry-paired-run-artifact-set-v1.md` and `docs/specs/templates/casimir-tile-sem-ellipsometry-paired-run-evidence-template.v1.json`;
- no promotion/canonical override is implied by this envelope mapping alone.

## Exploratory QCD Analog Citation Block (Non-Blocking)
This lane is explicitly `reference_only` and does not alter canonical campaign decisions.

Manuscript-stable citation targets for QCD analog bookkeeping:
- primary publication anchor: `SRC-069` (`10.1038/s41586-025-09920-0`)
- primary dataset anchor: `SRC-070` (`10.17182/hepdata.159491`)
- deterministic replay artifacts:
  - `artifacts/research/full-solve/qcd-analog-replay-2026-03-07.json`
  - `docs/audits/research/warp-qcd-analog-replay-2026-03-07.md`

Replay scope and result (table-level only):
- HEPData `t3` short-range replay: `z=4.37832`, parity to published `4.4 sigma` within tolerance (`|Delta z|=0.02168`)
- HEPData `t4` long-range replay: `z=0.62838` (consistent with near-zero long-range correlation)
- HEPData `t5` separation replay: near/far mean-absolute polarization ratio `31.22222`

Interpretation rule:
- this is an exploratory analog lane for evidence organization and method traceability;
- full event-level QCD reconstruction is not complete in this wave;
- no promotion/canonical override is implied by this citation block.

## GR Observable Parity Anchors (Mercury + Lensing + Frame Dragging + Shapiro, Non-Blocking)
This comparison block is explicitly `reference_only` and does not alter canonical campaign decisions.

Method-track profiles:
- `EXT-GR-MERC-001` (Mercury perihelion)
- `EXT-GR-LENS-001` (lensing deflection, historical + modern)
- `EXT-GR-FD-001` (frame dragging: GP-B + LAGEOS with LARES context)
- `EXT-GR-SHAP-001` (Shapiro delay: proposal + Cassini precision)

Source/snapshot anchors:
- sources: `SRC-075..SRC-084` (primary-only set for this wave)
- snapshots:
  - `docs/specs/data/gr-mercury-perihelion-einstein-1915.v1.json`
  - `docs/specs/data/gr-lensing-deflection-observable.v1.json`
  - `docs/specs/data/gr-frame-dragging-observable.v1.json`
  - `docs/specs/data/gr-shapiro-delay-observable.v1.json`
- replay scripts:
  - `scripts/warp-shadow-gr-mercury-precession-replay.ts`
  - `scripts/warp-shadow-gr-lensing-deflection-replay.ts`
  - `scripts/warp-shadow-gr-frame-dragging-replay.ts`
  - `scripts/warp-shadow-gr-shapiro-delay-replay.ts`

Observable mapping chains:
- `CH-GR-001`: Mercury perihelion (`gr_observables.mercury_perihelion.*`)
- `CH-GR-002`: Lensing deflection (`gr_observables.lensing_deflection.*`)
- `CH-GR-003`: Frame dragging (`gr_observables.frame_dragging.*`)
- `CH-GR-004`: Shapiro delay (`gr_observables.shapiro_delay.*`)

Interpretation rule:
- these lanes are observational parity anchors for framework integrity and replay determinism;
- they do not serve as canonical warp-lane promotion inputs in this wave;
- unresolved strict-source covariance details remain explicit and are not collapsed into PASS semantics.

## Core-4 Geometry Comparison Envelope (Non-Blocking)
This comparison block is explicitly `reference_only` and does not alter canonical campaign decisions.

Core-4 cohort profiles are method-track and snapshot-first:
- `EXT-WARP-ALC-001` (Alcubierre 1994)
- `EXT-WARP-NAT-001` (Natario 2002)
- `EXT-WARP-VDB-001` (Van den Broeck 1999)
- `EXT-WARP-LEN-001` (Lentz 2021)

Current comparison outputs against local geometry-conformance baseline keys
(`metric_form_alignment`, `shift_mapping`, `york_time_sign_parity`,
`natario_control_behavior`, `metric_derived_t00_path`) are:
- Natario: `compatible` (`5/5` key parity)
- Alcubierre: `partial` (`4 pass`, `1 inconclusive` due Natario-specific control key non-comparability)
- Van den Broeck: `inconclusive` (conditional geometry domain blockers)
- Lentz: `inconclusive` (non-comparable assumption domain blockers)

Artifact anchors:
- per-work run: `artifacts/research/full-solve/external-work/external-work-run-ext-warp-*-latest.json`
- per-work compare: `artifacts/research/full-solve/external-work/external-work-compare-ext-warp-*-latest.json`
- matrix: `artifacts/research/full-solve/external-work/external-work-comparison-matrix-latest.json`

Interpretation rule:
- this wave is geometry-first only and does not claim energetic/QEI equivalence;
- unresolved comparability is preserved as explicit blocker reason codes, not coerced to pass/fail;
- reduced blocker taxonomy currently collapses these unresolved comparability reasons under `non_comparable_or_unknown` for stable manuscript tables;
- no promotion/canonical override is implied by these external comparisons.

## Core-4 Energetics/QEI Comparison Envelope (Non-Blocking)
This comparison block is explicitly `reference_only` and does not alter canonical campaign decisions.

Core-4 energetics/QEI cohort profiles are method-track and snapshot-first:
- `EXT-WARP-ALC-E001` (Alcubierre 1994 energetics)
- `EXT-WARP-NAT-E001` (Natario 2002 energetics)
- `EXT-WARP-VDB-E001` (Van den Broeck 1999 energetics)
- `EXT-WARP-LEN-E001` (Lentz 2021 energetics)

Comparison baseline keys are local policy/conformance signatures in the reference capsule:
- `negative_energy_branch_policy`
- `qei_worldline_requirement`
- `stress_source_contract`
- `assumption_domain_disclosure`
- `physical_feasibility_boundary`

Current comparison outputs are:
- `EXT-WARP-ALC-E001`: `partial` (`3 pass`, `0 fail`, `2 inconclusive`)
- `EXT-WARP-NAT-E001`: `partial` (`2 pass`, `0 fail`, `3 inconclusive`)
- `EXT-WARP-VDB-E001`: `partial` (`1 pass`, `0 fail`, `4 inconclusive`)
- `EXT-WARP-LEN-E001`: `partial` (`1 pass`, `0 fail`, `4 inconclusive`)

Interpretation rule:
- this wave tests energetic/QEI comparability semantics only; it is not a viability or promotion lane;
- missing in-paper worldline-QEI derivations and non-comparable assumption domains remain explicit blockers;
- reduced blocker taxonomy currently collapses dominant blockers under `non_comparable_or_unknown` for stable manuscript tables;
- inconclusive outputs are retained as blockers, not converted into pass/fail claims.

## What This Research Improves Now
1. Adds standards-oriented governance language without changing reduced-order gate semantics.
2. Provides explicit source-quality hierarchy (primary/standard first) for manuscript claims.
3. Improves reproducibility framing by adding deterministic staleness/conflict reporting expectations.
4. Adds per-lane envelope mapping for `casimir_sign_control`, `q_spoiling`, `nanogap`, `timing`, and `sem_ellipsometry` with deterministic two-pass sweep artifacts and congruence reason codes.
5. Strengthens closure planning by mapping unresolved items to falsifier-driven upgrade steps.
6. Adds a manufacturing-spec package (`docs/specs/*`) that converts tile novelty claims into measurable requirements, acceptance gates, and falsifiers.

## What Remains Unresolved
Semantic blockers:
1. Cross-disciplinary consensus for renormalized stress-energy semantics in this reduced-order context.
2. Standardized stress-tensor fluctuation thresholds suitable for campaign-level hard gating.

Methodological blockers:
1. External adjudication package for operator mapping, kernel provenance, and applicability parity is not yet independently reproduced.
2. Materials-bounds closure still contains `UNKNOWN` rows for thermal/structural limits in commit-tracked evidence.

Reproducibility blockers:
1. Fully commit-tracked trace payloads can still be absent when runtime artifacts are ignored by git.
2. Independent external replication package for strong-claim scientific escalation is not yet complete.

## Non-Goals
- No full-system physical-feasibility claim from this campaign alone.
- No canonical override from promoted-candidate or exploratory lanes.
- No threshold or policy weakening.

## Conclusion
At this commit pin, the repository supports a defensible reduced-order evidence claim set with canonical admissibility, promotion readiness/stability true, strong-claim closure specs A-G passing in the snapshot, and PASS certification traces with integrity OK. This is scientifically valuable because it narrows viable parameter space under deterministic gates and provides a reproducible path for stronger external closure; it does not, by itself, authorize a full-system physical feasibility claim.
