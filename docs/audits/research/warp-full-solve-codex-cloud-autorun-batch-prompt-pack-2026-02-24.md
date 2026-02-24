# Warp Full-Solve Campaign Build - Codex Cloud Autorun Batch Prompt Pack (2026-02-24)

As-of date: February 24, 2026 (America/New_York)
Campaign source: `docs/audits/research/warp-full-solve-campaign-2026-02-24.md`
Current state source: `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`

## Mission

Implement the missing build path so the full-solve campaign can execute as a reproducible artifact pipeline (Wave A-D), with machine-readable gate evidence for G0..G8.

Do not claim physical feasibility or propulsion readiness. Keep conclusions at diagnostic/reduced-order unless gates support promotion.

## Hard boundaries

- No FTL or propulsion claims.
- Fail-close on missing hard evidence.
- Keep gate language aligned to `WARP_AGENTS.md`.
- Keep all outputs reproducible, deterministic where applicable, and explicitly provenance-tagged.

## Required files to read first

- `AGENTS.md`
- `WARP_AGENTS.md`
- `docs/audits/research/warp-full-solve-campaign-2026-02-24.md`
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `docs/warp-ultimate-stakeholder-readiness.md`

## Batch A - Runner Orchestration (unblock G1)

Goal:
- Add one canonical runner command that executes Wave A/B/C/D and emits required artifact contract paths.

Required implementation:
1. Add campaign runner script (TypeScript) under `scripts/`:
   - Example name: `scripts/warp-full-solve-campaign.ts`
2. Add package command:
   - Example: `"warp:full-solve:campaign": "tsx scripts/warp-full-solve-campaign.ts"`
3. Support CLI flags:
   - `--wave A|B|C|D|all`
   - `--out artifacts/research/full-solve`
   - `--seed <number>`
   - `--ci`

Required artifacts per wave:
- `artifacts/research/full-solve/<wave>/evidence-pack.json`
- `artifacts/research/full-solve/<wave>/first-fail-map.json`
- `artifacts/research/full-solve/<wave>/convergence-summary.md`
- `artifacts/research/full-solve/<wave>/replication-delta.json` (Wave D required; placeholder with `NOT_READY` allowed for other waves)

Acceptance:
- `npm run warp:full-solve:campaign -- --wave A --ci` completes and emits all Wave A files.

## Batch B - Gate Exporters (unblock G2/G3/G4/G5/G6)

Goal:
- Export machine-readable evidence for campaign gates G2-G6.

Required fields in `evidence-pack.json`:
- `commitSha`
- `runTimestamp`
- `wave`
- `gateStatus` object keyed by `G0..G8`
- `admResiduals`:
  - `H_rms`, `M_rms`, `H_maxAbs`, `M_maxAbs`, thresholds, and pass/fail
- `strictContractCompleteness`:
  - chart, chartContractStatus, observer, normalization, unitSystem completeness summary
- `guardrails`:
  - hard and soft constraint statuses + firstFail
- `qiApplicability`:
  - status (`PASS|NOT_APPLICABLE|UNKNOWN`) + basis text
- `tsSemanticsParity`:
  - canonical gate minimum + regime labels + parity pass/fail

Acceptance:
- Wave A evidence pack can independently drive a gate scoreboard without manual interpretation.

## Batch C - Perturbation and Robustness (unblock G7)

Goal:
- Add perturbation matrix execution and ordering-stability checks.

Required:
- Seed/duty/jitter perturbation runs for at least 5 scenarios.
- Export:
  - `artifacts/research/full-solve/C/first-fail-ordering-stability.json`
- Update `first-fail-map.json` with:
  - global first fail
  - per-perturbation first fail
  - stability result (`stable|unstable`)

Acceptance:
- Campaign runner with Wave C emits stability result and cites scenario deltas.

## Batch D - Replication Delta (unblock G8)

Goal:
- Add independent replay/replication comparison output contract.

Required:
- Export `artifacts/research/full-solve/D/replication-delta.json` with:
  - baseline run refs
  - replica run refs
  - per-gate parity
  - numeric drift summary
  - verdict (`PASS|FAIL|NOT_READY`)

Acceptance:
- Wave D output exists and is consumed in campaign report.

## Batch E - Report Generator Regeneration

Goal:
- Regenerate campaign execution report and machine-readable summaries from artifacts only.

Required outputs:
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json`
- `artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json`
- `artifacts/research/full-solve/campaign-action-plan-30-60-90-2026-02-24.json`

Acceptance:
- Report no longer flags "missing runner path" if batches A-D pass.

## Batch F - Tests, Verify, and Git

Minimum checks:
- `npm run warp:ultimate:check`
- `npm run warp:evidence:pack`
- Required `WARP_AGENTS.md` test suite
- `npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`

Final git requirements:
- Commit message:
  - `Build full-solve campaign runner and gate artifact pipeline (2026-02-24)`
- Push to:
  - `origin/main`

## Final response contract (must include)

1. Files changed/created.
2. Gate verdict counts (PASS/FAIL/UNKNOWN/NOT_READY).
3. Final decision label (`INADMISSIBLE` or better if justified).
4. Casimir verify fields:
   - `verdict`
   - `firstFail`
   - `certificateHash`
   - `integrityOk`
   - `traceId`
   - `runId`
5. Explicit boundary line:
   - "This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

