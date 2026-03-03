# Helix Ask Keyless Chain - Codex Cloud Autorun Batch Prompt Pack (2026-03-03)

## Objective

Run a keyless-first build batch that improves the primary bottleneck chain in order:

1. routing / intent correctness
2. retrieval effectiveness
3. grounding stability (without depending on live-key quality verdicts)

This pack is designed for Codex Cloud runtime with no LLM generation key required.

## Primary source of truth

Read these before Prompt 0:

- `AGENTS.md`
- `WARP_AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `docs/helix-ask-readiness-debug-loop.md`
- `docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md`
- `docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md`
- `docs/runbooks/helix-ask-keyless-first-development-policy-2026-03-03.md`

## Runtime assumptions (keyless)

Use/confirm these env assumptions:

- `PORT=5050`
- `ENABLE_AGI=1`
- `NODE_ENV=development`
- `LLM_RUNTIME=http`
- `LLM_POLICY=http`
- `OPENAI_API_KEY` unset
- `LLM_HTTP_API_KEY` unset
- `HELIX_ASK_REGRESSION_DRY_RUN=1`
- `HELIX_ASK_MATH_ROUTER_DRY_RUN=1`
- `HELIX_ASK_BASE_URL=http://localhost:5050`

## Required deliverables

- `reports/helix-ask-keyless-chain-baseline-2026-03-03.md`
- `reports/helix-ask-keyless-routing-retrieval-scorecard-2026-03-03.json`
- `reports/helix-ask-keyless-routing-retrieval-scorecard-2026-03-03.md`
- `reports/helix-ask-keyless-chain-go-no-go-2026-03-03.md`
- `artifacts/experiments/helix-ask-keyless-chain/<run-id>/...`

If code changes in any scope, include Casimir verify summary fields:

- `verdict`, `firstFail`, `runId`, `traceId`, `certificateHash`, `integrityOk`

## Prompt 0 - Intake and baseline lock (no patching)

```text
Execution mode:
AUTORUN for this scope. Do not patch code.

Task:
1) Confirm current bottleneck-chain status from latest artifacts.
2) Lock baseline metrics for:
   - intent_id_correct_rate
   - intent_mismatch count
   - relation pass_rate
   - retrieval recall@10 / retention / MRR@10 from latest ablation
3) List exact files/symbols likely responsible for relation-family routing misses.

Required output:
- reports/helix-ask-keyless-chain-baseline-2026-03-03.md
```

## Prompt 1 - Routing correctness hardening (minimal patch)

```text
Execution mode:
AUTORUN. One prompt scope per commit.

Objective:
Improve routing/intent selection for relation and repo-technical prompts without adding live-key dependencies.

Constraints:
- Minimal deterministic patch only.
- No product-scope expansion.
- Preserve existing contract/debug payload shape unless necessary.

Likely targets:
- server/services/helix-ask/intent-directory.ts
- server/services/helix-ask/arbiter.ts
- server/services/helix-ask/topic.ts

Required validations:
- npx vitest run tests/helix-ask-routing.spec.ts tests/helix-ask-arbiter.spec.ts tests/helix-ask-topic.spec.ts
- HELIX_ASK_REGRESSION_DRY_RUN=1 npx tsx scripts/helix-ask-regression.ts

Required artifacts:
- updated tests
- reports/helix-ask-keyless-routing-retrieval-scorecard-2026-03-03.json (partial update allowed)
```

## Prompt 2 - Retrieval scoring / retention hardening (minimal patch)

```text
Execution mode:
AUTORUN. One prompt scope per commit.

Objective:
Improve retrieval quality signals in keyless mode by strengthening deterministic selection/rerank signals and retention diagnostics.

Constraints:
- Keep atlas/git lane toggles explicit.
- Do not require live generation key.

Likely targets:
- server/services/helix-ask/repo-search.ts
- server/services/repo/repoGraph.ts
- server/services/search/repo-index.ts

Required validations:
- npx vitest run tests/helix-ask-repo-search.spec.ts tests/helix-ask-graph-resolver.spec.ts
- Run retrieval ablation matrix from runbook and regenerate comparison artifacts.

Required artifacts:
- artifacts/experiments/helix-ask-keyless-chain/<run-id>/retrieval-ablation/*.json
- scorecard delta section in reports/helix-ask-keyless-routing-retrieval-scorecard-2026-03-03.md
```

## Prompt 3 - Evaluation strictness and false-green prevention

```text
Execution mode:
AUTORUN. One prompt scope per commit.

Objective:
Tighten keyless evaluation so routing/retrieval misses cannot pass as quality wins.

Constraints:
- Keep this scope focused on harness/gate logic.

Likely targets:
- scripts/helix-ask-regression.ts
- scripts/helix-ask-patch-probe.ts
- scripts/helix-ask-versatility-record.ts
- docs/helix-ask-readiness-debug-loop.md

Required validations:
- npx vitest run tests/helix-ask-evidence-gate.spec.ts tests/helix-ask-runtime-errors.spec.ts
- HELIX_ASK_REGRESSION_DRY_RUN=1 npx tsx scripts/helix-ask-regression.ts
- HELIX_ASK_MATH_ROUTER_DRY_RUN=1 npx tsx scripts/helix-ask-math-router-evidence.ts

Required output:
- Explicit keyless gate thresholds documented in reports/helix-ask-keyless-chain-go-no-go-2026-03-03.md
```

## Prompt 4 - Synthesis, go/no-go, and handoff

```text
Execution mode:
AUTORUN. Final synthesis scope.

Task:
1) Merge results from Prompt 0..3.
2) Decide `KEYLESS_READY` vs `KEYLESS_NEEDS_PATCH`.
3) Produce keyed-checkpoint entry criteria for next stage.

Required outputs:
- reports/helix-ask-keyless-routing-retrieval-scorecard-2026-03-03.md
- reports/helix-ask-keyless-chain-go-no-go-2026-03-03.md

Final response must include:
- Prompt-by-prompt status with commit SHAs
- Artifact/report paths
- Attribution verdict: routing-driven vs retrieval-driven vs post-retrieval-driven
- Casimir summary per patch scope (if code changed)
- Remaining blockers and next actions
```
