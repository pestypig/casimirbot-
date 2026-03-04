# Helix Ask Retrieval Attribution Go/No-Go (2026-03-03)

Run: retrieval-ablation-1772604677480

retrieval_lift_proven=no
dominant_channel=atlas
fault_owner=retrieval

Strict retrieval-lift claim gate:
- positive lane-ablation delta: true
- bounded confidence: true
- stage-fault owner points to retrieval: true
- absolute quality floor passed: false
- eval fidelity passed: false

Absolute quality floor:
- unmatched_expected_file_rate <= 0.6
- gold_file_recall_at_10 >= 0.1
- consequential_file_retention_rate >= 0.2

Observed baseline quality:
- unmatched_expected_file_rate = 0.975000
- gold_file_recall_at_10 = 0.025000
- consequential_file_retention_rate = 0.025000

Corpus fidelity gate:
- prompt_template_collision_rate <= 0.6
- expected_token_hit_rate >= 0.15

Observed corpus fidelity:
- prompt_template_collision_rate = 0.900000
- expected_token_hit_rate = 0.000000

Decision: NO-GO for retrieval-lift claim (strict gate not satisfied).
