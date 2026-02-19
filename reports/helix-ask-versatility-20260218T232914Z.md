# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: c48dc994
- git_origin_main: c48dc994
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- run_id: versatility-1771457356197
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 982
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\20260218T232914Z\versatility-1771457356197

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 0.0% | 0.0% | 0.0% | 0.0% | 1 | 3 |
| repo_technical | 90 | 0.0% | 0.0% | 0.0% | 0.0% | 1 | 3 |
| ambiguous_general | 90 | 0.0% | 0.0% | 0.0% | 0.0% | 2 | 3 |

## Core Metrics
- intent_id_correct_rate: 0.00%
- report_mode_correct_rate: 0.00%
- relation_packet_built_rate: 0.00%
- relation_dual_domain_ok_rate: 0.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 0.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 0.00%
- min_text_length_pass_rate: 0.00%
- latency_total_p50_ms: 2
- latency_total_p95_ms: 3
- latency_retrieval_p50_ms: 0 (samples=0)
- latency_retrieval_p95_ms: 0 (samples=0)
- latency_synthesis_p50_ms: 0 (samples=0)
- latency_synthesis_p95_ms: 0 (samples=0)

## Top Failure Signatures
- request_failed: 270
- report_mode_mismatch: 270
- text_too_short: 270
- citation_missing: 270
- intent_mismatch: 90
- relation_packet_built: 90
- relation_dual_domain: 90
- bridge_count_low: 90
- evidence_count_low: 90

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos
- family: relation
- question: How does a warp bubble fit in with the mission ethos?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #2: relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos
- family: relation
- question: How does a warp bubble fit in with the mission ethos?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #3: relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos
- family: relation
- question: How does a warp bubble fit in with the mission ethos?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #4: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #5: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #6: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #7: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #8: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #9: relation_03_warp-bubble-ideology-relation-what-is-the-bridge
- family: relation
- question: Warp bubble ↔ ideology relation: what is the bridge?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #10: relation_03_warp-bubble-ideology-relation-what-is-the-bridge
- family: relation
- question: Warp bubble ↔ ideology relation: what is the bridge?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #11: relation_03_warp-bubble-ideology-relation-what-is-the-bridge
- family: relation
- question: Warp bubble ↔ ideology relation: what is the bridge?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #12: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #13: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #14: relation_05_what-s-the-relationship-between-warp-bubble-viability-and-ideology-tree-
- family: relation
- question: What's the relationship between warp bubble viability and ideology tree commitments?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #15: relation_05_what-s-the-relationship-between-warp-bubble-viability-and-ideology-tree-
- family: relation
- question: What's the relationship between warp bubble viability and ideology tree commitments?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

## Recommendation
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
