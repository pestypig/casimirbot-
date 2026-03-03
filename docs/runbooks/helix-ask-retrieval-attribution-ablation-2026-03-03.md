# Helix Ask Retrieval Attribution Ablation (2026-03-03)

## Purpose
This runbook defines the retrieval-only ablation process used to determine
whether quality improvements are caused by retrieval/routing changes or by
post-retrieval grounding and answer-contract behavior.

Use this before claiming "retrieval congruence improved."

## Why This Exists
Two consecutive versatility runs showed better citation outcomes, but key
retrieval/routing indicators did not move.

Observed deltas:

- `citation_presence_rate`: `0.5667 -> 0.6222` (improved)
- `citation_missing`: `117 -> 102` (improved)
- `relation_packet_built_rate`: `0.9333 -> 0.9333` (unchanged)
- `intent_id_correct_rate`: `0 -> 0` (unchanged)
- `intent_mismatch`: `90 -> 90` (unchanged)
- `relation pass_rate`: `0 -> 0` (unchanged)

Interpretation:
- The measured lift was mostly post-retrieval grounding/contract repair.
- Retrieval itself was not yet proven as the primary driver.

## Ablation Design
Hold generation behavior constant and isolate retrieval channel contribution.

Constant settings:

- dry run only (`dryRun=true`) via `/api/agi/ask`
- no answer generation scoring in this pass
- same corpus for all variants: `configs/repo-atlas-bench-corpus.v1.json`
- same seed/temperature and request shape
- same `topK` (`18`)

Variants:

1. `baseline_atlas_git_on`
- `HELIX_ASK_ATLAS_LANE=1`
- `HELIX_ASK_GIT_TRACKED_LANE=1`

2. `atlas_off_git_on`
- `HELIX_ASK_ATLAS_LANE=0`
- `HELIX_ASK_GIT_TRACKED_LANE=1`

3. `atlas_on_git_off`
- `HELIX_ASK_ATLAS_LANE=1`
- `HELIX_ASK_GIT_TRACKED_LANE=0`

4. `atlas_off_git_off`
- `HELIX_ASK_ATLAS_LANE=0`
- `HELIX_ASK_GIT_TRACKED_LANE=0`

## Retrieval-Only Metrics
Track these for each variant:

1. `gold_file_recall_at_5`
2. `gold_file_recall_at_10`
3. `consequential_file_retention_rate` (task has any expected file retained)
4. `rerank_mrr10`
5. `graph_edge_hit_rate` (current proxy)
6. `retrieval_confidence_mean`
7. `retrieval_doc_share_mean`

## Current Results (Run: `retrieval-ablation-1772577942359`)
Corpus size: `88` tasks

| Variant | recall@10 | retention | MRR10 | graph-edge-hit |
| --- | ---: | ---: | ---: | ---: |
| baseline_atlas_git_on | 0.011364 | 0.011364 | 0.001894 | 0.5 |
| atlas_off_git_on | 0 | 0 | 0 | 0.5 |
| atlas_on_git_off | 0.011364 | 0.011364 | 0.002273 | 0.5 |
| atlas_off_git_off | 0 | 0 | 0 | 0.5 |

Channel-hit sanity check (mean hits/task):

- baseline: `atlas=2.125`, `git_tracked=1.000`
- atlas off/git on: `atlas=0`, `git_tracked=0.932`
- atlas on/git off: `atlas=2.125`, `git_tracked=0`
- both off: `atlas=0`, `git_tracked=0`

## What This Implies
1. Retrieval remains the bottleneck in absolute terms.
- best `recall@10` is still `0.011364`

2. Atlas currently provides the measurable retrieval lift on this corpus slice.
- disabling Atlas drops retrieval quality metrics to zero

3. Git-tracked lane currently does not improve recall in this slice.
- it may still help in other corpora or edge prompt classes

4. Current `graph_edge_hit_rate` proxy is not discriminative.
- it stayed at `0.5` for all variants

## Improvement Priority (From This Evidence)
1. Improve retrieval eval fidelity first.
- normalize `expected_files` aliases and path canonicalization so recall is
  trustworthy

2. Implement coverage-adaptive retrieval loop.
- continue retrieval while slot/evidence gain is positive; stop on stall

3. Improve rerank objective.
- weight Atlas-edge proximity, symbol overlap, and slot-coverage gain
- dedupe by evidence value, not file order

4. Keep Git-tracked as additive fallback until it shows positive ablation delta.

5. Run intent-routing track separately.
- `intent_id_correct_rate` stayed `0`, so routing still blocks retrieval quality

## Repeatable Execution Steps
1. Start server on `:5050` with test key lane.
2. Run dry-run corpus sweep for all four toggle variants.
3. Write per-variant JSON and consolidated summary.
4. Compare `delta_recall10`, `delta_retention`, `delta_mrr10` vs baseline.
5. Publish a short verdict block:
- retrieval lift proven or not proven
- dominant lane by metric delta
- next patch target

## Evidence Artifacts
Current run artifact directory:

- `artifacts/experiments/helix-ask-retrieval-ablation/retrieval-ablation-1772577942359`

Primary files:

- `summary.comparison.json`
- `summary.comparison.md`
- `baseline_atlas_git_on.json`
- `atlas_off_git_on.json`
- `atlas_on_git_off.json`
- `atlas_off_git_off.json`

## Integration With Readiness Loop
Use this ablation between:

1. variety battery result review
2. next retrieval/routing patch selection

It is complementary to:

- `docs/helix-ask-readiness-debug-loop.md`
- `docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md`

## Completion Gate Reminder
Per repository policy, every patch still requires Casimir verification PASS with
certificate hash and `integrityOk=true` before completion is claimed.

## Fidelity Hardening Rules (Prompt 2 update)
To avoid false-zero retrieval attribution from path-shape drift, compute two views:

1. **Raw metrics** (exact file path match only)
2. **Canonicalized metrics** (exact OR normalized OR alias)

Canonicalization policy:
- normalize slash direction (`\\` -> `/`)
- trim leading `./`
- compare case-insensitively on normalized form
- apply known alias family mapping where relevant (current rule set includes
  `server/` <-> `server/utils/` projection)

Required diagnostics per variant:
- `unmatched_expected_file_rate`
- `expected_file_match_mode` distribution (`exact|normalized|alias|none`)
- per-task mismatch reasons when no match is found

Interpretation update:
- Use canonicalized metrics for attribution verdicts.
- Use raw-vs-canonicalized deltas as fidelity health signals; large gaps indicate
  eval-shape mismatch rather than true retrieval failure.
