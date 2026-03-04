# Helix Ask Retrieval Attribution Go/No-Go (2026-03-03)

Run: retrieval-ablation-1772610363576

retrieval_lift_proven=yes
dominant_channel=atlas
fault_owner=retrieval

Strict retrieval-lift claim gate:
- positive lane-ablation delta: true
- bounded confidence: true
- stage-fault owner points to retrieval: true
- absolute quality floor passed: true
- eval fidelity passed: true

Absolute quality floor:
- unmatched_expected_file_rate <= 0.6
- gold_file_recall_at_10 >= 0.1
- consequential_file_retention_rate >= 0.2

Observed baseline quality:
- unmatched_expected_file_rate = 0.225000
- gold_file_recall_at_10 = 0.775000
- consequential_file_retention_rate = 0.775000

Corpus fidelity gate:
- prompt_template_collision_rate <= 0.6
- expected_token_hit_rate >= 0.15

Observed corpus fidelity:
- prompt_template_collision_rate = 0.025000
- expected_token_hit_rate = 1.000000

Decision: GO for retrieval-lift claim (strict gate passed).
