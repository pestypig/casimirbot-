# Helix Ask Retrieval Attribution Baseline Memo (2026-03-03)

## Scope Anchor
Execution anchor: `docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md`.

## Baseline Context Confirmed

### Metrics definitions (retrieval-only)
1. `gold_file_recall_at_5`
2. `gold_file_recall_at_10`
3. `consequential_file_retention_rate`
4. `rerank_mrr10`
5. `graph_edge_hit_rate`
6. `retrieval_confidence_mean`
7. `retrieval_doc_share_mean`

### Variant matrix (fixed 4-lane toggle matrix)
- `baseline_atlas_git_on` (`HELIX_ASK_ATLAS_LANE=1`, `HELIX_ASK_GIT_TRACKED_LANE=1`)
- `atlas_off_git_on` (`HELIX_ASK_ATLAS_LANE=0`, `HELIX_ASK_GIT_TRACKED_LANE=1`)
- `atlas_on_git_off` (`HELIX_ASK_ATLAS_LANE=1`, `HELIX_ASK_GIT_TRACKED_LANE=0`)
- `atlas_off_git_off` (`HELIX_ASK_ATLAS_LANE=0`, `HELIX_ASK_GIT_TRACKED_LANE=0`)

### Interpretation rules
- Treat retrieval lift as *unproven* if retrieval metrics do not move while citation/answer behavior improves.
- Dominant retrieval channel is the lane whose disablement causes the largest retrieval-metric drop.
- Keep `graph_edge_hit_rate` as provisional proxy only (currently non-discriminative in known baseline).

## Endpoint Readiness Check (:5050)
- Server booted in deterministic local static mode.
- Probe endpoint check: `GET /api/ready`.
- Result: `200` with `ready=true`, `appReady=true`, `healthReady=true`.

## Current Known Scorecard Values
Source runbook run id: `retrieval-ablation-1772577942359` (88-task corpus).

| Variant | recall@10 | retention | MRR10 | graph-edge-hit |
| --- | ---: | ---: | ---: | ---: |
| baseline_atlas_git_on | 0.011364 | 0.011364 | 0.001894 | 0.5 |
| atlas_off_git_on | 0 | 0 | 0 | 0.5 |
| atlas_on_git_off | 0.011364 | 0.011364 | 0.002273 | 0.5 |
| atlas_off_git_off | 0 | 0 | 0 | 0.5 |

Channel-hit means/task:
- baseline: atlas=2.125, git_tracked=1.000
- atlas_off_git_on: atlas=0, git_tracked=0.932
- atlas_on_git_off: atlas=2.125, git_tracked=0
- atlas_off_git_off: atlas=0, git_tracked=0

## Unresolved Attribution Risks
1. **Path mismatch false-zero risk**: expected file path forms likely undercounting recall.
2. **Metric proxy ambiguity**: `graph_edge_hit_rate` currently flat; may not indicate retrieval quality changes.
3. **Single-seed fragility**: current verdict sensitivity to one seed/temperature setting.
4. **No confidence bounds**: no interval estimates yet for go/no-go confidence.

## Prompt 1..4 Execution Plan
1. **Prompt 1**: implement deterministic `scripts/helix-ask-retrieval-ablation.ts`, run 4 variants, write per-variant + summary artifacts, add npm script.
2. **Prompt 2**: add expected-file canonicalization + alias matching diagnostics; emit raw + canonicalized scorecard sections; rerun and capture fidelity deltas.
3. **Prompt 3**: extend runner to multi-seed (7/11/13) + optional temperatures; compute point estimates + 95% intervals; publish JSON+MD scorecards and driver verdict.
4. **Prompt 4**: write go/no-go memo with retrieval vs post-retrieval split, top bottlenecks, prioritized patch queue with acceptance metrics.

## Gate Reminder
Any prompt scope that patches code/config will run Casimir verification and require PASS with certificate hash and integrity status recorded.
