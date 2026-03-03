# Helix Ask Keyless Chain Go/No-Go (2026-03-03)

- Execution mode: `DEV_KEYLESS`
- Decision scope: diagnostic (not promotion)
- Final decision: `KEYLESS_NEEDS_PATCH`

## Keyless gate thresholds (Prompt 3 strictness)

1. `intent_id_correct_rate >= 0.90` by family target.
2. `relation pass_rate > 0` (hard anti-false-green guard from current baseline of `0`).
3. `gold_file_recall_at_10 >= 0.10` and `consequential_file_retention_rate >= 0.10`.
4. `rerank_mrr10 >= 0.05`.
5. Regression harness must pass required snippets for:
   - open-world uncertainty contract
   - frontier 7-section scaffold contract.

## Prompt 3 validation evidence

- `npx vitest run tests/helix-ask-evidence-gate.spec.ts tests/helix-ask-runtime-errors.spec.ts`: PASS.
- `HELIX_ASK_REGRESSION_DRY_RUN=1 npx tsx scripts/helix-ask-regression.ts`: FAIL (missing open-world and frontier required snippets).
- `HELIX_ASK_MATH_ROUTER_DRY_RUN=1 npx tsx scripts/helix-ask-math-router-evidence.ts`: PASS.

## Blocking failures

1. Open-world bypass output does not include deterministic uncertainty wording (`open-world best-effort`, `explicit uncertainty`).
2. Frontier continuity followup output misses required section labels (`Definitions`, `Baseline`, `Hypothesis`, `Anti-hypothesis`, `Falsifiers`, `Uncertainty band`, `Claim tier`).

## Next actions

1. Patch deterministic fallback scaffolder so open-world uncertainty snippets are emitted in dry-run.
2. Enforce frontier section rendering in dry-run synthesis path before any quality scoring.
3. Re-run Prompt 3 validation battery and then rerun Casimir for the patch scope.
