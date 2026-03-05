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
- QEI operating envelope (input): `configs/warp-shadow-qei-operating-envelope.v1.json`
- Runner (execution): `scripts/warp-shadow-injection-runner.ts`
- Recovery checker (execution): `scripts/warp-shadow-qei-recovery-check.ts`
- Casimir sign checker (execution): `scripts/warp-shadow-casimir-sign-compat-check.ts`
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
