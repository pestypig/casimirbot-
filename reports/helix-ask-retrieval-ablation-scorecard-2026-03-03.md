# Helix Ask Retrieval Ablation Scorecard (2026-03-03)

Run: retrieval-ablation-1773217849613
run_complete=true

| Variant | recall@10 point | ci95 low | ci95 high | unmatched_expected_file_rate |
| --- | ---: | ---: | ---: | ---: |
| baseline_atlas_git_on | 0.975000 | 0.975000 | 0.975000 | 0.025000 |
| atlas_off_git_on | 1.000000 | 1.000000 | 1.000000 | 0.000000 |
| atlas_on_git_off | 0.991667 | 0.975000 | 1.000000 | 0.008333 |
| atlas_off_git_off | 1.000000 | 1.000000 | 1.000000 | 0.000000 |

Driver verdict: retrieval_lift_proven=no, dominant_channel=none.
Contributions: atlas=-0.025000, git_tracked=-0.016667.
Strict gate: positive_lane_ablation_delta=false, bounded_confidence=false, fault_owner_points_to_retrieval=true, quality_floor_passed=true.
Quality floor thresholds: unmatched<=0.600000, recall@10>=0.100000, retention>=0.200000.
Quality floor observed: unmatched=0.025000, recall@10=0.975000, retention=0.975000.
Corpus fidelity: pass=true, template_collision=0.025000, expected_token_hit=1.000000.
Top10 collapse (baseline): dominant_share=0.050000, unique_rate=0.325000, collapse_flag=false.
Context source counts (baseline): retrieval_context_files=117, context_files=0, none=3.
Graph expansion contribution (baseline): selected_rate=0.200000, runtime_link_rate=0.125000, selected_tasks=24.
Graph expansion attribution (baseline): query_overlap_rate=0.200000, corpus_member_rate=0.025000, script_doc_boost_rate=0.125000.
Miss buckets (baseline): scripts=0, docs=0, server=3, client=0, other=0.

