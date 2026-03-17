# Casimir Tile Shadow Injection Runner v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Provide a non-blocking runner that injects research-derived scenario values into the existing full-solve calculator lane for congruence exploration.

This runner is for:
- sensitivity exploration,
- rapid cross-team experimentation,
- bookkeeping and comparison against the promoted baseline.

This runner is not for:
- canonical gate overrides,
- promotion without preregistration,
- physical-feasibility claims.

## Artifacts
- Scenario pack (input): `configs/warp-shadow-injection-scenarios.v1.json`
- QEI recovery pack (input): `configs/warp-shadow-injection-scenarios.qei-recovery.v1.json`
- QEI boundary pack (input): `configs/warp-shadow-injection-scenarios.qei-boundary.v1.json`
- QEI lorentzian forensic pack (input): `configs/warp-shadow-injection-scenarios.qei-lorentzian-forensic.v1.json`
- Casimir sign recovery pack (input): `configs/warp-shadow-injection-scenarios.cs-primary-recovery.v1.json`
- Casimir sign typed pack (input): `configs/warp-shadow-injection-scenarios.cs-primary-typed.v1.json`
- Casimir sign reportable prereg pack (input): `configs/warp-shadow-injection-scenarios.cs-primary-reportable.v1.json`
- Q-spoiling recovery pack (input): `configs/warp-shadow-injection-scenarios.qs-primary-recovery.v1.json`
- Q-spoiling typed pack (input): `configs/warp-shadow-injection-scenarios.qs-primary-typed.v1.json`
- Q-spoiling reportable prereg pack (input): `configs/warp-shadow-injection-scenarios.qs-primary-reportable.v1.json`
- Q-spoiling reportable reference profile pack (input): `configs/warp-shadow-injection-scenarios.qs-primary-reportable-reference.v1.json`
- Nanogap recovery pack (input): `configs/warp-shadow-injection-scenarios.ng-primary-recovery.v1.json`
- Nanogap typed pack (input): `configs/warp-shadow-injection-scenarios.ng-primary-typed.v1.json`
- Nanogap reportable prereg pack (input): `configs/warp-shadow-injection-scenarios.ng-primary-reportable.v1.json`
- Nanogap reportable reference profile pack (input): `configs/warp-shadow-injection-scenarios.ng-primary-reportable-reference.v1.json`
- Timing recovery pack (input): `configs/warp-shadow-injection-scenarios.ti-primary-recovery.v1.json`
- Timing typed pack (input): `configs/warp-shadow-injection-scenarios.ti-primary-typed.v1.json`
- Timing reportable prereg pack (input): `configs/warp-shadow-injection-scenarios.ti-primary-reportable.v1.json`
- Timing reportable reference profile pack (input): `configs/warp-shadow-injection-scenarios.ti-primary-reportable-reference.v1.json`
- SEM+ellipsometry recovery pack (input): `configs/warp-shadow-injection-scenarios.se-primary-recovery.v1.json`
- SEM+ellipsometry typed pack (input): `configs/warp-shadow-injection-scenarios.se-primary-typed.v1.json`
- SEM+ellipsometry reportable prereg pack (input): `configs/warp-shadow-injection-scenarios.se-primary-reportable.v1.json`
- SEM+ellipsometry reportable reference profile pack (input): `configs/warp-shadow-injection-scenarios.se-primary-reportable-reference.v1.json`
- SEM+ellipsometry publication-overlay typed pack (input): `configs/warp-shadow-injection-scenarios.se-publication-typed.v1.json`
- QEI operating envelope (input): `configs/warp-shadow-qei-operating-envelope.v1.json`
- Runner (execution): `scripts/warp-shadow-injection-runner.ts`
- Recovery checker (execution): `scripts/warp-shadow-qei-recovery-check.ts`
- Casimir sign checker (execution): `scripts/warp-shadow-casimir-sign-compat-check.ts`
- Q-spoiling checker (execution): `scripts/warp-shadow-q-spoiling-compat-check.ts`
- Nanogap checker (execution): `scripts/warp-shadow-nanogap-compat-check.ts`
- Timing checker (execution): `scripts/warp-shadow-timing-compat-check.ts`
- SEM+ellipsometry checker (execution): `scripts/warp-shadow-sem-ellips-compat-check.ts`
- SEM+ellipsometry paired evidence ingest (execution): `scripts/warp-shadow-sem-ellips-paired-run-ingest.ts`
- SEM+ellipsometry paired evidence validator (execution): `scripts/warp-shadow-sem-ellips-paired-evidence-validate.ts`
- JSON output (default): `artifacts/research/full-solve/shadow-injection-run-YYYY-MM-DD.json`
- Markdown output (default): `docs/audits/research/warp-shadow-injection-run-YYYY-MM-DD.md`

## Command
```bash
npm run warp:shadow:inject
```

Optional:
```bash
npm run warp:shadow:inject -- --scenarios configs/warp-shadow-injection-scenarios.v1.json --out artifacts/research/full-solve/shadow-injection-run-custom.json --out-md docs/audits/research/warp-shadow-injection-run-custom.md
```

QEI recovery sweep:
```bash
npm run warp:shadow:inject -- --scenarios configs/warp-shadow-injection-scenarios.qei-recovery.v1.json --out artifacts/research/full-solve/shadow-injection-run-qei-recovery-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-qei-recovery-YYYY-MM-DD.md
```

QEI recovery contract check:
```bash
npm run warp:shadow:qei-recovery:check
```

Casimir sign compatibility pass-1:
```bash
npm run warp:shadow:inject:cs-primary-recovery -- --out artifacts/research/full-solve/shadow-injection-run-cs-primary-recovery-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-cs-primary-recovery-YYYY-MM-DD.md
```

Casimir sign compatibility pass-2 (typed context):
```bash
npm run warp:shadow:inject:cs-primary-typed -- --out artifacts/research/full-solve/shadow-injection-run-cs-primary-typed-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-cs-primary-typed-YYYY-MM-DD.md
```

Casimir sign reportable prereg run:
```bash
npm run warp:shadow:inject:cs-primary-reportable -- --out artifacts/research/full-solve/shadow-injection-run-cs-primary-reportable-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-cs-primary-reportable-YYYY-MM-DD.md
```

Q-spoiling compatibility pass-1:
```bash
npm run warp:shadow:inject:qs-primary-recovery -- --out artifacts/research/full-solve/shadow-injection-run-qs-primary-recovery-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-qs-primary-recovery-YYYY-MM-DD.md
```

Q-spoiling compatibility pass-2 (typed context):
```bash
npm run warp:shadow:inject:qs-primary-typed -- --out artifacts/research/full-solve/shadow-injection-run-qs-primary-typed-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-qs-primary-typed-YYYY-MM-DD.md
```

Q-spoiling reportable prereg run:
```bash
npm run warp:shadow:inject:qs-primary-reportable -- --out artifacts/research/full-solve/shadow-injection-run-qs-primary-reportable-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-qs-primary-reportable-YYYY-MM-DD.md
```

Q-spoiling reportable reference profile run:
```bash
npm run warp:shadow:inject:qs-primary-reportable-reference -- --out artifacts/research/full-solve/shadow-injection-run-qs-primary-reportable-reference-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-qs-primary-reportable-reference-YYYY-MM-DD.md
```

Nanogap compatibility pass-1:
```bash
npm run warp:shadow:inject:ng-primary-recovery -- --out artifacts/research/full-solve/shadow-injection-run-ng-primary-recovery-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-ng-primary-recovery-YYYY-MM-DD.md
```

Nanogap compatibility pass-2 (typed context):
```bash
npm run warp:shadow:inject:ng-primary-typed -- --out artifacts/research/full-solve/shadow-injection-run-ng-primary-typed-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-ng-primary-typed-YYYY-MM-DD.md
```

Nanogap reportable prereg run:
```bash
npm run warp:shadow:inject:ng-primary-reportable -- --out artifacts/research/full-solve/shadow-injection-run-ng-primary-reportable-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-ng-primary-reportable-YYYY-MM-DD.md
```

Nanogap reportable reference profile run:
```bash
npm run warp:shadow:inject:ng-primary-reportable-reference -- --out artifacts/research/full-solve/shadow-injection-run-ng-primary-reportable-reference-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-ng-primary-reportable-reference-YYYY-MM-DD.md
```

Timing compatibility pass-1:
```bash
npm run warp:shadow:inject:ti-primary-recovery -- --out artifacts/research/full-solve/shadow-injection-run-ti-primary-recovery-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-ti-primary-recovery-YYYY-MM-DD.md
```

Timing compatibility pass-2 (typed context):
```bash
npm run warp:shadow:inject:ti-primary-typed -- --out artifacts/research/full-solve/shadow-injection-run-ti-primary-typed-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-ti-primary-typed-YYYY-MM-DD.md
```

Timing reportable prereg run:
```bash
npm run warp:shadow:inject:ti-primary-reportable -- --out artifacts/research/full-solve/shadow-injection-run-ti-primary-reportable-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-ti-primary-reportable-YYYY-MM-DD.md
```

Timing reportable reference profile run:
```bash
npm run warp:shadow:inject:ti-primary-reportable-reference -- --out artifacts/research/full-solve/shadow-injection-run-ti-primary-reportable-reference-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-ti-primary-reportable-reference-YYYY-MM-DD.md
```

SEM+ellipsometry compatibility pass-1:
```bash
npm run warp:shadow:inject:se-primary-recovery -- --out artifacts/research/full-solve/shadow-injection-run-se-primary-recovery-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-se-primary-recovery-YYYY-MM-DD.md
```

SEM+ellipsometry compatibility pass-2 (typed context):
```bash
npm run warp:shadow:inject:se-primary-typed -- --out artifacts/research/full-solve/shadow-injection-run-se-primary-typed-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-se-primary-typed-YYYY-MM-DD.md
```

SEM+ellipsometry reportable prereg run:
```bash
npm run warp:shadow:inject:se-primary-reportable -- --out artifacts/research/full-solve/shadow-injection-run-se-primary-reportable-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-se-primary-reportable-YYYY-MM-DD.md
```

SEM+ellipsometry reportable reference profile run:
```bash
npm run warp:shadow:inject:se-primary-reportable-reference -- --out artifacts/research/full-solve/shadow-injection-run-se-primary-reportable-reference-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-se-primary-reportable-reference-YYYY-MM-DD.md
```

SEM+ellipsometry publication-overlay run (cross-study synthesis; reference-only):
```bash
npm run warp:shadow:inject:se-publication-overlay -- --out artifacts/research/full-solve/shadow-injection-run-se-publication-typed-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-se-publication-typed-YYYY-MM-DD.md
```

SEM+ellipsometry publication-overlay full chain (build + inject + compat + summary):
```bash
npm run warp:shadow:se-publication-overlay
```

Q-spoiling evidence congruence check:
```bash
npm run warp:shadow:qs-compat-check -- --scenarios configs/warp-shadow-injection-scenarios.qs-primary-typed.v1.json --run artifacts/research/full-solve/shadow-injection-run-qs-primary-typed-YYYY-MM-DD.json --out artifacts/research/full-solve/qs-compat-check-YYYY-MM-DD.json --out-md docs/audits/research/warp-qs-compat-check-YYYY-MM-DD.md
```

Nanogap evidence congruence check:
```bash
npm run warp:shadow:ng-compat-check -- --scenarios configs/warp-shadow-injection-scenarios.ng-primary-typed.v1.json --run artifacts/research/full-solve/shadow-injection-run-ng-primary-typed-YYYY-MM-DD.json --out artifacts/research/full-solve/ng-compat-check-YYYY-MM-DD.json --out-md docs/audits/research/warp-ng-compat-check-YYYY-MM-DD.md
```

Timing evidence congruence check:
```bash
npm run warp:shadow:ti-compat-check -- --scenarios configs/warp-shadow-injection-scenarios.ti-primary-typed.v1.json --run artifacts/research/full-solve/shadow-injection-run-ti-primary-typed-YYYY-MM-DD.json --out artifacts/research/full-solve/ti-compat-check-YYYY-MM-DD.json --out-md docs/audits/research/warp-ti-compat-check-YYYY-MM-DD.md
```

SEM+ellipsometry evidence congruence check:
```bash
npm run warp:shadow:se-compat-check -- --scenarios configs/warp-shadow-injection-scenarios.se-primary-typed.v1.json --run artifacts/research/full-solve/shadow-injection-run-se-primary-typed-YYYY-MM-DD.json --out artifacts/research/full-solve/se-compat-check-YYYY-MM-DD.json --out-md docs/audits/research/warp-se-compat-check-YYYY-MM-DD.md
```

SEM+ellipsometry paired evidence ingest:
```bash
npm run warp:shadow:se-paired-evidence:ingest -- --sem artifacts/research/full-solve/se-paired-runs/<date>/sem-measurements.csv --ellips artifacts/research/full-solve/se-paired-runs/<date>/ellips-measurements.csv --manifest artifacts/research/full-solve/se-paired-runs/<date>/pairing-manifest.json --covariance artifacts/research/full-solve/se-paired-runs/<date>/covariance-budget.json
```

SEM+ellipsometry paired evidence validate:
```bash
npm run warp:shadow:se-paired-evidence:validate -- --evidence artifacts/research/full-solve/se-paired-runs/<date>/se-paired-run-evidence.v1.json
```

Casimir sign evidence congruence check:
```bash
npm run warp:shadow:cs-compat-check -- --scenarios configs/warp-shadow-injection-scenarios.cs-primary-typed.v1.json --run artifacts/research/full-solve/shadow-injection-run-cs-primary-typed-YYYY-MM-DD.json --out artifacts/research/full-solve/cs-compat-check-YYYY-MM-DD.json --out-md docs/audits/research/warp-cs-compat-check-YYYY-MM-DD.md
```

Boundary refinement sweep:
```bash
npm run warp:shadow:inject:qei-boundary -- --out artifacts/research/full-solve/shadow-injection-run-qei-boundary-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-qei-boundary-YYYY-MM-DD.md
```

Lorentzian forensic sweep:
```bash
npm run warp:shadow:inject:qei-lorentzian-forensic -- --out artifacts/research/full-solve/shadow-injection-run-qei-lorentzian-forensic-YYYY-MM-DD.json --out-md docs/audits/research/warp-shadow-injection-run-qei-lorentzian-forensic-YYYY-MM-DD.md
```

## Scenario Schema
Each scenario uses:
- `id`
- `lane`
- `description`
- `registryRefs[]`
- `overrides.params` (pipeline/state overrides)
- `overrides.qi` (`sampler`, `fieldType`, `tau_s_ms`)
- optional `experimentalContext.casimirSign`:
  - `branchHypothesis`
  - `materialPair`
  - `interveningMedium`
  - `sourceRefs[]`
  - `uncertainty.u_gap_nm`
  - `uncertainty.u_window_nm`
  - `uncertainty.method`
- optional `experimentalContext.qSpoiling`:
  - `mechanismLane`
  - `q0Baseline`
  - `f_q_spoil`
  - `q0Spoiled`
  - `q_spoil_ratio`
  - `q_spoil_ratio_anchor`
  - `sourceRefs[]`
  - `uncertainty.u_q0_rel`
  - `uncertainty.u_f_rel`
  - `uncertainty.method`
  - `uncertainty.reportableReady`
  - `uncertainty.blockedReasons[]`
  - optional `thresholds.q0_clean_floor`
  - optional `thresholds.q0_spoiled_ceiling`
  - optional `thresholds.f_q_spoil_floor`
- optional `experimentalContext.nanogap`:
  - `profileId`
  - `u_g_mean_nm`
  - `u_g_sigma_nm`
  - `tip_method`
  - `fiducial_present`
  - `sourceRefs[]`
  - `uncertainty.method`
  - `uncertainty.reportableReady`
  - `uncertainty.blockedReasons[]`
- optional `experimentalContext.timing`:
  - `profileId`
  - `sigma_t_ps`
  - `tie_pp_ps` (nullable)
  - `pdv_pp_ps` (nullable)
  - `timestamping_mode`
  - `synce_enabled`
  - `clock_mode`
  - `topology_class`
  - `sourceRefs[]`
  - `uncertainty.u_sigma_t_ps`
  - `uncertainty.u_tie_pp_ps`
  - `uncertainty.u_pdv_pp_ps`
  - `uncertainty.method`
  - `uncertainty.reportableReady`
  - `uncertainty.blockedReasons[]`
- optional `experimentalContext.semEllips`:
  - `profileId`
  - `d_sem_corr_nm`
  - `u_sem_nm`
  - `d_ellip_nm`
  - `u_ellip_nm`
  - `delta_se_nm`
  - `d_fused_nm`
  - `u_fused_nm`
  - `U_fused_nm`
  - `paired_run_id` (nullable)
  - `rho_sem_ellip` (nullable)
  - `covariance_sem_ellip_nm2` (nullable)
  - `sourceRefs[]`
  - `uncertainty.method`
  - `uncertainty.reportableReady`
  - `uncertainty.blockedReasons[]`
- optional pack-level `profileThresholds` for profile-aware nanogap congruence checks.
- optional pack-level `profileThresholds.semEllips` for profile-aware SEM+ellipsometry congruence checks.

Optional pack-level fields:
- `recovery_goal`
- `success_bar`
- `baseline_reference.path`
- `baseline_reference.keys[]`

Supported `success_bar` policies:
- `at_least_one_compatible` (winner required)
- `map_only` (no runner errors required; winner optional)

Allowed samplers in this runner:
- `gaussian`
- `lorentzian`
- `compact`

If an unsupported sampler is provided, it is fail-safe coerced to `lorentzian`.

## Classification Output
Per scenario classification:
- `compatible`: `congruentSolvePass=true`
- `partial`: both margins and applicability pass, but congruent solve still fails on semantic/contract lane
- `incompatible`: margin/applicability lane fails
- `error`: scenario failed to evaluate

Recovery output contract (JSON + Markdown):
- `recovery_goal` (nullable)
- `success_bar` (nullable)
- `winnerScenarioId` (nullable)
- `successAchieved` (boolean)
- `failureEnvelope` (nullable when winner exists)
- scenario table includes `experimental_context` pass-through when provided in scenario pack.

`success_bar=map_only` policy:
- `winnerScenarioId=null` by contract
- `failureEnvelope` is always emitted
- success requires `error=0` across all scenarios.

## Non-Blocking Policy
1. Shadow runs are `reference_only`.
2. Shadow outputs do not alter canonical scoreboard/decision.
3. Promotion requires preregistration + replay artifacts per:
   - `docs/specs/casimir-tile-promotion-preregistration-v1.md`
   - `docs/specs/casimir-tile-experimental-data-staging-ledger-v1.md`

## Traceability
- owner: `research-governance`
- status: `draft_v1`
- dependency_mode: `reference_only`
