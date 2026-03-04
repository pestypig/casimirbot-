# Helix Ask Keyless Chain Go/No-Go (2026-03-03)

- Execution mode: `DEV_KEYLESS`
- Decision scope: diagnostic (not promotion)
- Final decision: `KEYLESS_NEEDS_PATCH`

## Keyless gate thresholds (Prompt 3 strictness)

1. `intent_id_correct_rate >= 0.90` by family target.
2. `relation pass_rate > 0`.
3. `gold_file_recall_at_10 >= 0.10` and `consequential_file_retention_rate >= 0.10`.
4. `rerank_mrr10 >= 0.05`.
5. Regression harness must pass required snippets for open-world uncertainty and frontier 7-section scaffold.

## Current validation evidence (run-20260304T0028Z)

- `npx vitest run tests/helix-ask-routing.spec.ts tests/helix-ask-repo-search.spec.ts tests/helix-ask-runtime-errors.spec.ts tests/helix-ask-evidence-gate.spec.ts`: PASS.
- `HELIX_ASK_REGRESSION_DRY_RUN=1 HELIX_ASK_BASE_URL=http://localhost:5050 npx tsx scripts/helix-ask-regression.ts`: WARN/FAIL due intermittent `503 api_bootstrapping` responses in localhost run.
- `HELIX_ASK_MATH_ROUTER_DRY_RUN=1 HELIX_ASK_BASE_URL=http://localhost:5050 npx tsx scripts/helix-ask-math-router-evidence.ts`: PASS.

## Blocker closure status (targeted in this patch)

1. Open-world uncertainty deterministic wording: **CLOSED** (required snippets now emitted in dry-run path).
2. Frontier continuity 7-label scaffold: **CLOSED** (required labels now emitted in dry-run path).

## Remaining no-go reasons

- Upstream readiness gates (intent/relation/retrieval thresholds) remain below strict promotion targets.
- Local regression harness run intermittently receives `503 api_bootstrapping`, preventing a clean all-green command execution despite snippet closure.
