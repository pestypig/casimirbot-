# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 315b1498
- git_origin_main: 315b1498
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- readiness_verdict: PARTIAL_READY
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1775712237122
- base_url: http://localhost:5050
- prompts: 3
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 9
- total_runs: 9
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 452998
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1775712237122

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 3 | 0.0% | 100.0% | 100.0% | 0.0% | 15513 | 15805 |
| repo_technical | 3 | 0.0% | 100.0% | 100.0% | 0.0% | 16896 | 17032 |
| ambiguous_general | 3 | 0.0% | 0.0% | 100.0% | 0.0% | 16303 | 16985 |

## Core Metrics
- intent_id_correct_rate: 66.67%
- report_mode_correct_rate: 100.00%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 100.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 100.00%
- min_text_length_pass_rate: 0.00%
- debug_scaffold_leak_rate: 0.00%
- code_fragment_spill_rate: 0.00%
- latency_total_p50_ms: 16303
- latency_total_p95_ms: 17032
- latency_retrieval_p50_ms: 1955 (samples=9)
- latency_retrieval_p95_ms: 5124 (samples=9)
- latency_synthesis_p50_ms: 17 (samples=9)
- latency_synthesis_p95_ms: 4375 (samples=9)

## Probability Scorecard (Wilson 95%)
- route_correct|relation: p=1.000 ci95=[0.439, 1.000] n=3
- route_correct|repo_technical: p=1.000 ci95=[0.439, 1.000] n=3
- route_correct|ambiguous_general: p=0.000 ci95=[0.000, 0.561] n=3
- frontier_scaffold_complete: p=0.000 ci95=[0.000, 0.299] n=9
- no_debug_leak: p=1.000 ci95=[0.701, 1.000] n=9
- no_runtime_fallback: p=1.000 ci95=[0.701, 1.000] n=9
- objective_complete_before_finalize: p=0.667 ci95=[0.354, 0.879] n=9
- objective_scoped_retrieval_success: p=1.000 ci95=[0.701, 1.000] n=9
- objective_assembly_success: p=1.000 ci95=[0.701, 1.000] n=9

## Representative Evidence Packs
- pass: none (n/a)
- fail: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1775712237122\raw\versatility-1775712237122-relation_16_how-is-the-warp-bubble-a-technical-layer-while-mission-ethos-is-policy-l-s7-t0p2.json (relation_16_how-is-the-warp-bubble-a-technical-layer-while-mission-ethos-is-policy-l)

## Top Failure Signatures
- text_too_short: 9
- objective_finalize_gate: 3
- intent_domain_mismatch: 3

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: repo_tech_18_how-does-fast-quality-mode-alter-answer-generation-deadlines
- family: repo_technical
- question: How does fast quality mode alter answer generation deadlines?
- failures: text_too_short:0, objective_finalize_gate:false
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=repo.repo_api_lookup intent_domain=repo intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #2: ambiguous_06_help-me-compare-precision-and-recall-quickly
- family: ambiguous_general
- question: Help me compare precision and recall quickly.
- failures: intent_domain_mismatch:hybrid, text_too_short:0
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #3: relation_16_how-is-the-warp-bubble-a-technical-layer-while-mission-ethos-is-policy-l
- family: relation
- question: How is the warp bubble a technical layer while mission ethos is policy layer?
- failures: text_too_short:0
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

## Recommendation
- readiness_verdict: PARTIAL_READY
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
- [4] Leakage and code-spill hardening: Prevent debug/scaffold markers and accidental code fragments from surviving final answer cleanup.
