# Helix Ask Retrieval Ablation Scorecard (2026-03-03)

Run: retrieval-ablation-1772730019929
run_complete=true

| Variant | recall@10 point | ci95 low | ci95 high | unmatched_expected_file_rate |
| --- | ---: | ---: | ---: | ---: |
| baseline_atlas_git_on | 0.983333 | 0.975000 | 1.000000 | 0.016667 |
| atlas_off_git_on | 0.950000 | 0.950000 | 0.950000 | 0.050000 |
| atlas_on_git_off | 1.000000 | 1.000000 | 1.000000 | 0.000000 |
| atlas_off_git_off | 0.950000 | 0.950000 | 0.950000 | 0.050000 |

Driver verdict: retrieval_lift_proven=yes, dominant_channel=atlas.
Contributions: atlas=0.033333, git_tracked=-0.016667.
Strict gate: positive_lane_ablation_delta=true, bounded_confidence=true, fault_owner_points_to_retrieval=true, quality_floor_passed=true.
Quality floor thresholds: unmatched<=0.600000, recall@10>=0.100000, retention>=0.200000.
Quality floor observed: unmatched=0.016667, recall@10=0.983333, retention=0.983333.
Corpus fidelity: pass=true, template_collision=0.025000, expected_token_hit=1.000000.
Top10 collapse (baseline): dominant_share=0.050000, unique_rate=0.333333, collapse_flag=false.
Context source counts (baseline): retrieval_context_files=118, context_files=0, none=2.
Graph expansion contribution (baseline): selected_rate=0.191667, runtime_link_rate=0.100000, selected_tasks=23.
Miss buckets (baseline): scripts=1, docs=0, server=1, client=0, other=0.

