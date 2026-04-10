# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: c9b64e50
- git_origin_main: c9b64e50
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- readiness_verdict: PARTIAL_READY
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1775786281476
- base_url: http://localhost:5050
- prompts: 92
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 276
- total_runs: 276
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 6709862
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1775786281476

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 18.9% | 78.9% | 82.2% | 0.0% | 15019 | 17356 |
| repo_technical | 96 | 38.5% | 61.5% | 84.4% | 0.0% | 15019 | 17180 |
| ambiguous_general | 90 | 13.3% | 90.0% | 100.0% | 0.0% | 10523 | 15671 |

## Core Metrics
- intent_id_correct_rate: 76.45%
- report_mode_correct_rate: 88.77%
- relation_packet_built_rate: 71.11%
- relation_dual_domain_ok_rate: 82.22%
- avg_attempts_per_run: 1.39
- p95_attempts_per_run: 4
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 40.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 88.77%
- min_text_length_pass_rate: 41.30%
- debug_scaffold_leak_rate: 0.00%
- code_fragment_spill_rate: 0.00%
- latency_total_p50_ms: 15010
- latency_total_p95_ms: 17120
- latency_retrieval_p50_ms: 1808 (samples=235)
- latency_retrieval_p95_ms: 14314 (samples=235)
- latency_synthesis_p50_ms: 3 (samples=237)
- latency_synthesis_p95_ms: 3293 (samples=237)

## Probability Scorecard (Wilson 95%)
- route_correct|relation: p=0.789 ci95=[0.694, 0.860] n=90
- route_correct|repo_technical: p=0.615 ci95=[0.515, 0.706] n=96
- route_correct|ambiguous_general: p=0.900 ci95=[0.821, 0.946] n=90
- frontier_scaffold_complete: p=0.377 ci95=[0.322, 0.435] n=276
- no_debug_leak: p=1.000 ci95=[0.986, 1.000] n=276
- no_runtime_fallback: p=0.982 ci95=[0.958, 0.992] n=276
- objective_complete_before_finalize: p=0.641 ci95=[0.551, 0.722] n=117
- objective_scoped_retrieval_success: p=1.000 ci95=[0.968, 1.000] n=117
- objective_assembly_success: p=1.000 ci95=[0.968, 1.000] n=117

## Representative Evidence Packs
- pass: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1775786281476\raw\versatility-1775786281476-relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos-s7-t0p2.json (relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos)
- fail: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1775786281476\raw\versatility-1775786281476-relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th-s7-t0p2.json (relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th)

## Top Failure Signatures
- text_too_short: 162
- intent_domain_mismatch: 65
- objective_finalize_gate: 42
- request_failed: 31
- report_mode_mismatch: 31
- citation_missing: 31
- relation_packet_built: 26
- intent_mismatch: 19
- relation_dual_domain: 16
- bridge_count_low: 16
- evidence_count_low: 16
- runtime_fallback_answer: 5

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_30_if-warp-bubble-is-capability-how-does-ethos-govern-its-use
- family: relation
- question: If warp bubble is capability, how does ethos govern its use?
- failures: request_failed:network, intent_mismatch:missing, intent_domain_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:10, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
terminated
```

### Worst #2: relation_23_compare-and-connect-warp-bubble-viability-gates-with-mission-ethos-gates
- family: relation
- question: Compare and connect warp bubble viability gates with mission ethos gates.
- failures: request_failed:503, intent_mismatch:missing, intent_domain_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #3: relation_20_how-does-casimir-verification-connect-to-ideology-accountability-in-warp
- family: relation
- question: How does Casimir verification connect to ideology accountability in warp work?
- failures: request_failed:503, intent_mismatch:missing, intent_domain_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #4: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: request_failed:network, intent_mismatch:missing, intent_domain_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:12, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
fetch failed
```

### Worst #5: relation_16_how-is-the-warp-bubble-a-technical-layer-while-mission-ethos-is-policy-l
- family: relation
- question: How is the warp bubble a technical layer while mission ethos is policy layer?
- failures: request_failed:network, intent_mismatch:missing, intent_domain_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:12, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
fetch failed
```

### Worst #6: relation_17_relation-of-warp-bubble-and-mission-ethos-now
- family: relation
- question: relation of warp bubble and mission ethos now
- failures: request_failed:network, intent_mismatch:missing, intent_domain_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:12, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
fetch failed
```

### Worst #7: relation_18_warp-ethos-relation-prompt-test-explain-links-and-guardrails
- family: relation
- question: warp/ethos relation prompt test: explain links and guardrails
- failures: request_failed:network, intent_mismatch:missing, intent_domain_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:12, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
fetch failed
```

### Worst #8: repo_tech_15_how-does-the-system-prevent-report-scaffold-responses-for-relation-promp
- family: repo_technical
- question: How does the system prevent report-scaffold responses for relation prompts?
- failures: request_failed:503, intent_domain_mismatch:missing, report_mode_mismatch:undefined, text_too_short:0, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #9: repo_tech_05_how-does-deterministic-fallback-guard-relation-mode-contract-parse-failu
- family: repo_technical
- question: How does deterministic fallback guard relation-mode contract parse failures?
- failures: request_failed:503, intent_domain_mismatch:missing, report_mode_mismatch:undefined, text_too_short:0, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #10: repo_tech_03_where-are-relation-packet-fields-built-and-surfaced-in-debug-payload
- family: repo_technical
- question: Where are relation packet fields built and surfaced in debug payload?
- failures: request_failed:503, intent_domain_mismatch:missing, report_mode_mismatch:undefined, text_too_short:0, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #11: repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c
- family: repo_technical
- question: Walk through /api/agi/ask routing from intent detection to final answer cleanup.
- failures: request_failed:503, intent_domain_mismatch:missing, report_mode_mismatch:undefined, text_too_short:0, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #12: repo_tech_07_how-are-ambiguity-gates-triggered-and-what-clarify-output-is-produced
- family: repo_technical
- question: How are ambiguity gates triggered and what clarify output is produced?
- failures: request_failed:503, intent_domain_mismatch:missing, report_mode_mismatch:undefined, text_too_short:0, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #13: repo_tech_04_explain-evidence-gate-flow-and-where-citation-repair-is-applied
- family: repo_technical
- question: Explain evidence gate flow and where citation repair is applied.
- failures: request_failed:network, intent_domain_mismatch:missing, report_mode_mismatch:undefined, text_too_short:12, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
fetch failed
```

### Worst #14: repo_tech_13_how-does-goal-zone-harness-evaluate-pass-fail-across-seeds
- family: repo_technical
- question: How does goal-zone harness evaluate pass/fail across seeds?
- failures: request_failed:network, intent_domain_mismatch:missing, report_mode_mismatch:undefined, text_too_short:12, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
fetch failed
```

### Worst #15: repo_tech_14_what-determines-relation-packet-bridge-count-and-evidence-count
- family: repo_technical
- question: What determines relation_packet_bridge_count and evidence_count?
- failures: request_failed:network, intent_domain_mismatch:missing, report_mode_mismatch:undefined, text_too_short:12, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=undefined intent_domain=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
fetch failed
```

## Recommendation
- readiness_verdict: PARTIAL_READY
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
- [4] Leakage and code-spill hardening: Prevent debug/scaffold markers and accidental code fragments from surviving final answer cleanup.
