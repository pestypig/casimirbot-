# Casimir Tile Experimental Data Staging Ledger v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Organize paper-derived and protocol-derived measurements as reference-grade experimental data for analysis and bookkeeping, without making them blocking dependencies for canonical warp solve decisions.

## Policy
1. All rows in this ledger are `reference_only` until explicitly promoted.
2. No row in this ledger can block or override canonical warp campaign outcomes.
3. Promotion from `reference_only` to `gate_eligible` requires replayable artifacts, closure of listed falsifiers, and a preregistration record.

## Fields
- `dataset_id`
- `lane`
- `artifact_path`
- `dependency_mode`
- `canonical_blocking`
- `promotion_gate`
- `prereg_artifact`
- `status`
- `owner`
- `commit_pin`

## Staging Table

| dataset_id | lane | artifact_path | dependency_mode | canonical_blocking | promotion_gate | prereg_artifact | status | owner | commit_pin |
|---|---|---|---|---|---|---|---|---|---|
| EXP-STAGE-001 | qei_worldline | `docs/audits/research/warp-qei-worldline-primer-2026-03-04.md` | reference_only | false | sampler checks (`normalize_ok`,`smoothness_ok`,`scaling_ok`) wired and replayed | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-002 | citation_pack | `docs/audits/research/warp-primary-standards-citation-pack-2026-03-04.md` | reference_only | false | source-to-claim links replayed and conflict audit clean | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-003 | source_visit | `docs/audits/research/warp-citation-visit-audit-2026-03-04.md` | reference_only | false | full source revisit with stable resolvable IDs | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-004 | parameter_registry | `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md` | reference_only | false | lane-level recompute status upgraded from partial to pass | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-005 | equation_trace | `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md` | reference_only | false | per-source equation-to-variable replay evidence committed | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-006 | q_spoiling | `docs/specs/casimir-tile-q-spoiling-test-protocol-v1.md` | reference_only | false | controlled measurements produce coupling-corrected `Q0` and `F_Q_spoil` lanes | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | RF-and-surface-physics | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-007 | timing_precision | `docs/specs/casimir-tile-timing-precision-test-protocol-v1.md` | reference_only | false | profile-qualified runs with hardware timestamping and uncertainty records | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | timing-and-controls | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-008 | nanogap_uq | `docs/specs/casimir-tile-nanogap-uncertainty-test-protocol-v1.md` | reference_only | false | bounded `u_g_mean_nm` and `u_g_sigma_nm` under selected profile | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | nanometrology-and-calibration | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-009 | sem_ellipsometry | `docs/specs/casimir-tile-sem-ellipsometry-cross-validation-protocol-v1.md` | reference_only | false | cross-instrument residual and expanded uncertainty pass profile | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | nanometrology-and-calibration | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-010 | provenance_attestation | `docs/specs/casimir-tile-equation-provenance-contract-v1.md` | reference_only | false | in-toto layout/link and statement schema checks replay clean (`CH-PROV-001`) | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-011 | shadow_injection | `configs/warp-shadow-injection-scenarios.v1.json` | reference_only | false | scenario run replay generated and reviewed (`compatible/partial/incompatible/error` classification + baseline deltas) | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-012 | shadow_scenario_builder | `configs/warp-shadow-scenario-builder-rulebook.v1.json` | reference_only | false | generated scenario pack reproducibly built from filtered `EXP-*` rows and consumed by shadow runner | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-013 | qei_recovery_shadow_injection | `configs/warp-shadow-injection-scenarios.qei-recovery.v1.json` | reference_only | false | 2D (`tau`,`sampler`) qei-worldline recovery sweep replayed with winner/failure-envelope contract (`recovery_goal`,`success_bar`,`winnerScenarioId`,`failureEnvelope`) | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-014 | qei_recovery_shadow_results | `artifacts/research/full-solve/shadow-injection-run-qei-recovery-2026-03-05.json` | reference_only | false | executed recovery run records deterministic winner selection, baseline deltas, and non-blocking outcome summary | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-015 | qei_operating_envelope | `configs/warp-shadow-qei-operating-envelope.v1.json` | reference_only | false | envelope policy captures source allowlist, strict anchors, execution domain, and provisional operating bands from observed compatibility | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-016 | qei_recovery_contract_check | `artifacts/research/full-solve/qei-recovery-check-2026-03-05.json` | reference_only | false | checker passes lane/domain/source/anchor constraints with zero issues for selected recovery pack | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-017 | qei_boundary_shadow_injection | `configs/warp-shadow-injection-scenarios.qei-boundary.v1.json` | reference_only | false | boundary refinement sweep replayed and recorded as non-blocking comparability evidence | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-018 | qei_lorentzian_forensic_shadow_injection | `configs/warp-shadow-injection-scenarios.qei-lorentzian-forensic.v1.json` | reference_only | false | lorentzian-only forensic sweep replayed to isolate recurrent incompatibility reasons and tau regions | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-019 | qei_boundary_shadow_results | `artifacts/research/full-solve/shadow-injection-run-qei-boundary-2026-03-05.json` | reference_only | false | boundary sweep captures compatibility cutoff around gaussian/compact transition with deterministic winner selection | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-020 | qei_lorentzian_forensic_shadow_results | `artifacts/research/full-solve/shadow-injection-run-qei-lorentzian-forensic-2026-03-05.json` | reference_only | false | lorentzian-only forensic sweep maps persistent fail reasons (`policy_margin_not_strict_lt_1`,`computed_margin_not_strict_lt_1`) across tau span | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-021 | casimir_sign_contract | `docs/specs/casimir-tile-casimir-sign-compatibility-contract-v1.md` | reference_only | false | strict sign/material/gap anchors and primary/standard source policy are declared and replay-safe | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-022 | casimir_sign_primary_pack_pass1 | `configs/warp-shadow-injection-scenarios.cs-primary-recovery.v1.json` | reference_only | false | pass-1 deterministic sweep (`gap_nm x branch_tag`, field fixed) generated from strict lane anchors | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-023 | casimir_sign_primary_pack_pass2_typed | `configs/warp-shadow-injection-scenarios.cs-primary-typed.v1.json` | reference_only | false | pass-2 deterministic typed sweep includes `experimentalContext.casimirSign` passthrough per scenario | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-024 | casimir_sign_pass1_shadow_results | `artifacts/research/full-solve/shadow-injection-run-cs-primary-recovery-2026-03-05.json` | reference_only | false | pass-1 run replayed with `scenarioCount=18`, `error=0`, map-only non-blocking contract | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-025 | casimir_sign_pass2_shadow_results | `artifacts/research/full-solve/shadow-injection-run-cs-primary-typed-2026-03-05.json` | reference_only | false | pass-2 typed run replayed with `scenarioCount=18`, `error=0`, typed context preserved in output artifacts | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-026 | casimir_sign_congruence_check | `artifacts/research/full-solve/cs-compat-check-2026-03-05.json` | reference_only | false | checker emits deterministic `congruent|incongruent|unknown` and reason-code counts (`gap_outside_primary_window`,`gap_outside_transition_band`) | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-027 | casimir_sign_repeat_determinism | `artifacts/research/full-solve/cs-repeat-determinism-2026-03-05.json` | reference_only | false | repeat-run stability confirms summary/classification/reason-count parity across pass-1 and pass-2 runs | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |
| EXP-STAGE-028 | casimir_sign_reportable_prereg_profile | `configs/warp-shadow-injection-scenarios.cs-primary-reportable.v1.json` | reference_only | false | frozen prereg profile locks refs/gap-grid/branches/field-type and uncertainty assumptions for reportable replay | `docs/specs/casimir-tile-promotion-preregistration-v1.md` | staged | research-governance | e240431948598a964a9042ed929a076f609b90d6 |

## Traceability
- owner: `research-governance`
- status: `draft_v1`
- commit_pin: `e240431948598a964a9042ed929a076f609b90d6`
