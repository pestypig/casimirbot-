# Helix Ask Retrieval Attribution - Codex Cloud Autorun Batch Prompt Pack (2026-03-03)

## Objective

Run a fast cloud execution batch that operationalizes:

- `docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md`

and produces deterministic retrieval-only attribution evidence that separates:

1. retrieval/routing lift
2. post-retrieval grounding/contract lift

This pack is designed for Codex Cloud runtime (faster compute) and assumes repo
write access.

## Primary source of truth

Read these before running Prompt 0:

- `AGENTS.md`
- `WARP_AGENTS.md`
- `AGENT_PLAYBOOK.md`
- `docs/helix-ask-readiness-debug-loop.md`
- `docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md`
- `docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md`

## Runtime assumptions

Use/confirm these env assumptions in cloud runtime:

- `PORT=5050`
- `ENABLE_AGI=1`
- `NODE_ENV=development`
- `LLM_RUNTIME=http`
- `LLM_POLICY=http`
- `HULL_MODE=1`
- `HULL_ALLOW_HOSTS=api.openai.com`
- `LLM_HTTP_BASE=https://api.openai.com`
- secret `OPENAI_API_KEY` (or equivalent HTTP key path)

## Required deliverables

- `reports/helix-ask-retrieval-attribution-baseline-2026-03-03.md`
- `reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.json`
- `reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.md`
- `reports/helix-ask-retrieval-attribution-go-no-go-2026-03-03.md`
- `artifacts/experiments/helix-ask-retrieval-ablation/<run-id>/...`

If code is changed in any prompt scope, also provide:

- Casimir verify summary fields (`verdict`, `firstFail`, `certificateHash`,
  `integrityOk`, `traceId`, `runId`)

## Prompt 0 - Intake and baseline lock (no patching)

```text
Execution mode:
AUTORUN for this prompt scope. Do not patch code in Prompt 0.

Read and follow:
- AGENTS.md
- WARP_AGENTS.md
- AGENT_PLAYBOOK.md
- docs/helix-ask-readiness-debug-loop.md
- docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md
- docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md

Task:
1) Confirm baseline retrieval attribution context from the runbook:
   - metrics definitions
   - variant matrix
   - interpretation rules
2) Verify endpoint readiness on :5050 for dry-run ask probes.
3) Produce a baseline memo with:
   - current known scorecard values
   - unresolved attribution risks
   - exact execution plan for Prompt 1..4

Required output:
- reports/helix-ask-retrieval-attribution-baseline-2026-03-03.md
```

## Prompt 1 - Build deterministic ablation runner

```text
Execution mode:
AUTORUN. One prompt scope per commit.

Objective:
Create an automated retrieval-only ablation runner so the four-lane toggle
matrix is no longer manual.

Implement:
1) Add script:
   - scripts/helix-ask-retrieval-ablation.ts
2) Script behavior:
   - uses corpus configs/repo-atlas-bench-corpus.v1.json
   - runs dry-run ask requests only
   - executes 4 variants:
     a) baseline_atlas_git_on
     b) atlas_off_git_on
     c) atlas_on_git_off
     d) atlas_off_git_off
   - computes metrics from runbook:
     - gold_file_recall_at_5
     - gold_file_recall_at_10
     - consequential_file_retention_rate
     - rerank_mrr10
     - graph_edge_hit_rate
     - retrieval_confidence_mean
     - retrieval_doc_share_mean
   - writes per-variant JSON + summary JSON/MD under:
     artifacts/experiments/helix-ask-retrieval-ablation/<run-id>/
3) Add npm script entry:
   - helix:ask:retrieval:ablation
4) Keep implementation deterministic:
   - fixed seed/temp defaults
   - stable sort/aggregation

Validation:
- run the new script once and confirm artifacts are generated.

Required output:
- updated code + artifacts for one run
- concise execution summary in commit message body
```

## Prompt 2 - Retrieval metric fidelity hardening

```text
Execution mode:
AUTORUN. One prompt scope per commit.

Objective:
Improve retrieval attribution trustworthiness (avoid false-zero due to path
mismatch).

Implement:
1) Expected file canonicalization in the ablation runner:
   - normalize slash direction
   - case-insensitive compare where appropriate
   - map known alias patterns
2) Add quality diagnostics fields:
   - unmatched_expected_file_rate
   - expected_file_match_mode (exact|normalized|alias)
   - per-task mismatch reasons
3) Ensure scorecard shows both:
   - raw metrics
   - canonicalized metrics
4) Update docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md
   with the new fidelity rules.

Validation:
- rerun ablation and include before/after fidelity deltas.

Required output:
- updated script + runbook + fresh artifacts
```

## Prompt 3 - Multi-seed cloud sweep and confidence intervals

```text
Execution mode:
AUTORUN. One prompt scope per commit.

Objective:
Use cloud runtime to run larger retrieval-only sweeps quickly and produce
confidence-bounded attribution.

Implement:
1) Extend runner support for:
   - multiple seeds (default: 7,11,13)
   - optional temperatures list
2) Aggregate variant metrics across seeds with:
   - point estimate
   - 95% interval (bootstrap or Wilson where applicable)
3) Produce scorecards:
   - reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.json
   - reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.md
4) Add "driver verdict" section:
   - retrieval_lift_proven (yes/no)
   - dominant_channel (atlas/git/other/none)
   - confidence_statement

Validation:
- run full multi-seed sweep end-to-end.
```

## Prompt 4 - Go/No-Go decision and next patch queue

```text
Execution mode:
AUTORUN. One prompt scope per commit.

Objective:
Convert the scorecard into a strict implementation decision queue.

Task:
1) Produce final decision memo:
   - reports/helix-ask-retrieval-attribution-go-no-go-2026-03-03.md
2) Include:
   - retrieval vs post-retrieval contribution split
   - top 3 bottlenecks by measured impact
   - prioritized patch queue with acceptance metrics
3) If retrieval_lift_proven is false or weak:
   - prioritize eval-fidelity + adaptive retrieval + rerank upgrades
4) If code changed in this prompt:
   - run required Casimir verify command and record full summary block:
     npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export

Final output format:
1) Prompt-by-prompt status table with commit SHAs
2) Artifact paths
3) Retrieval attribution verdict
4) Casimir summary block (for any prompt with patches)
5) Blockers and exact next action list
```

## Acceptance criteria

1. The runbook path is used as the explicit execution anchor in all prompts.
2. Four retrieval-lane variants are run under deterministic dry-run settings.
3. Scorecards include retrieval-only metrics and confidence intervals.
4. Attribution verdict is explicit: retrieval-driven vs post-retrieval-driven.
5. Any prompt that patches code includes Casimir verification PASS evidence.

## Notes

- Keep this batch scoped to retrieval attribution and measurement hardening.
- Avoid mixing large synthesis/contract rewrites in the same cloud batch.
- Preserve deterministic debug evidence for replay and operator trust.
