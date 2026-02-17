# Helix Ask Next Build Decision (Decision-Grade Pass)

Date: 2026-02-17

## Scope
Determine whether to keep deterministic default, tighten adaptive thresholds, or enable adaptive evidence-cards behavior; and prioritize reliability vs answer quality.

## 1) Setup + Script Sanity
- `git pull origin main` failed because `origin` remote is not configured in this environment.
- `npm ci` succeeded.
- Script bundle sanity checks all succeeded:
  - `scripts/helix-ask-evidence-cards-analyze.ts`
  - `scripts/helix-ask-evidence-cards-run-variant.ts`
  - `scripts/helix-ask-evidence-cards-ab.ts`

## 2) Regression Tests
- PASS: `npx vitest run server/__tests__/agi.adapter.test.ts`
- FAIL: `npx vitest run tests/helix-ask-live-events.spec.ts`
- FAIL: `npx vitest run tests/helix-ask-modes.spec.ts`

Common failure root cause:
- Transform error in `server/routes/agi.plan.ts`:
  - duplicate declaration of `repoScaffoldForPrompt` (`let` and `var`) around line 19302.

## 3) AB Harness with Strict Run-Quality Gates
Command executed twice (as required on first failure):

`HELIX_ASK_AB_FAIL_ON_QUALITY=1 HELIX_ASK_AB_RUN_ANALYZE=1 HELIX_ASK_AB_MIN_VALID=200 HELIX_ASK_AB_MAX_INVALID_RATE=0.10 HELIX_ASK_AB_MIN_COMPLETION_RATE=1 HELIX_ASK_AB_MIN_VALID_PER_VARIANT=200 HELIX_ASK_AB_MIN_PAIR_COUNT=180 npx tsx scripts/helix-ask-evidence-cards-ab.ts`

Result (both runs): FAIL quality gates.

### Variant run-quality stats
| Variant | n_total | n_valid | n_invalid | invalid_rate | status_counts |
|---|---:|---:|---:|---:|---|
| A | 360 | 0 | 360 | 1.000 | {"404":360} |
| B | 360 | 0 | 360 | 1.000 | {"404":360} |
| C | 360 | 0 | 360 | 1.000 | {"404":360} |

Decision gates from summary:
- min_valid_per_variant: 200
- max_invalid_rate: 0.10
- min_pair_count: 180
- pass: false

Recommendation artifact:
- `artifacts/evidence-cards-ab/recommendation.json`: `insufficient_run_quality`

Trustworthiness:
- Recommendation is **not decision-trustworthy** for adaptive-policy choice (A/B/C) because all variants are completely invalid and pair counts are 0.

## 4) Targeted Answer-Quality Smoke Checks (deterministic mode)
Server launch command:
- `HELIX_ASK_EVIDENCE_CARDS_LLM=0 HELIX_ASK_SINGLE_LLM=0 npm run dev:agi:5173`

Prompts executed with `debug=true`; raw outputs saved under:
- `artifacts/evidence-cards-ab/smoke/`

Observed behavior for all 4 prompts:
- HTTP status: 404 `Cannot POST /api/agi/ask`
- Raw JSON contract leak: not observable (no JSON answer returned)
- Blank citation `(see )`: not observable
- Direct relation warp bubble ↔ mission ethos: not observable
- At least 2 repo source paths in response: not observable
- Execution-log durations (`LLM evidence cards`, `LLM answer contract primary`, `LLM answer`, drift/citation repair): unavailable because endpoint never reached.

## 5) Decision
### Primary decision
- **Decision:** `insufficient_run_quality`

### Policy recommendation under current evidence
- Keep deterministic default (`disable_by_default`) until reliability is restored.
- Do **not** tighten adaptive thresholds yet (no valid run signal).
- Do **not** enable adaptive evidence-cards behavior yet (no valid run signal).

### Priority
- **Reliability-first**. Current blocker is endpoint/service reliability (404 invalid responses and startup transform error), which prevents any answer-quality evaluation.

## 6) Next Patch Candidates (ordered by impact)
1. **Fix startup transform blocker in `server/routes/agi.plan.ts`**
   - remove duplicate `repoScaffoldForPrompt` declaration and add guard test for duplicate symbol regressions.
2. **Harden Helix Ask route boot/registration fail-safe**
   - if AGI route wiring fails, return structured 503 with typed failure reason (not 404), preserving diagnostics.
3. **Re-run AB harness + smoke suite post-fix and only then evaluate adaptive policy**
   - require gates pass (`min_valid_per_variant`, `max_invalid_rate`, `min_pair_count`) before deciding adaptive enable/tighten.

## 7) Patch/Verification status
- Patch in this task: report updates only (`reports/helix-ask-next-build-decision.md`, regenerated `reports/helix-ask-evidence-cards-ab.md`).
- Casimir verification (run after patch):
  - verdict: `PASS`
  - certificateHash: `199cc38d772b45d8213fc6e5f020872589c37b2c5749b7bf286b671a1de4acec`
  - integrityOk: `true`
