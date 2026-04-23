# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: d502debf
- git_origin_main: d502debf
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- readiness_verdict: NOT_READY
- decision_grade_ready: false
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1776886555020
- base_url: http://localhost:5050
- prompts: 92
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 276
- total_runs: 4
- run_complete: false
- completion_rate: 1.45%
- run_duration_ms: 129992
- terminated_early_reason: max_run_ms_exceeded:120000
- global_cooldown_applied_ms: 0
- resumed_from_latest: true
- resumed_runs: 2
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1776886555020

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 4 | 0.0% | 100.0% | 100.0% | 0.0% | 15024 | 15642 |
| repo_technical | 0 | 0.0% | n/a | n/a | 0.0% | 0 | 0 |
| ambiguous_general | 0 | 0.0% | n/a | n/a | 0.0% | 0 | 0 |

## Core Metrics
- intent_id_correct_rate: 100.00%
- report_mode_correct_rate: 100.00%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.25
- p95_attempts_per_run: 2
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 100.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 100.00%
- min_text_length_pass_rate: 0.00%
- reasoning_debug_complete_rate: 100.00%
- final_answer_contract_pass_rate: 0.00%
- uncertainty_research_contract_pass_rate: 100.00%
- semantic_repo_tech_contract_pass_rate: 0.00%
- claim_evidence_binding_pass_rate: 100.00%
- research_tier_coverage_pass_rate: 100.00%
- uncertainty_estimator_present_rate: 0.00%
- experimental_math_guard_pass_rate: 100.00%
- tool_use_budget_pack_pass_rate: 100.00%
- debug_scaffold_leak_rate: 0.00%
- code_fragment_spill_rate: 0.00%
- latency_total_p50_ms: 15024
- latency_total_p95_ms: 15642
- latency_retrieval_p50_ms: 7726 (samples=4)
- latency_retrieval_p95_ms: 37268 (samples=4)
- latency_synthesis_p50_ms: 19 (samples=4)
- latency_synthesis_p95_ms: 30 (samples=4)

## Probability Scorecard (Wilson 95%)
- route_correct|relation: p=1.000 ci95=[0.510, 1.000] n=4
- route_correct|repo_technical: p=0.000 ci95=[0.000, 0.000] n=0
- route_correct|ambiguous_general: p=0.000 ci95=[0.000, 0.000] n=0
- frontier_scaffold_complete: p=0.000 ci95=[0.000, 0.490] n=4
- no_debug_leak: p=1.000 ci95=[0.510, 1.000] n=4
- no_runtime_fallback: p=1.000 ci95=[0.510, 1.000] n=4
- reasoning_debug_complete: p=1.000 ci95=[0.510, 1.000] n=4
- final_answer_contract_pass: p=0.000 ci95=[0.000, 0.490] n=4
- uncertainty_research_contract_pass: p=1.000 ci95=[0.510, 1.000] n=4
- semantic_repo_tech_contract_pass: p=0.000 ci95=[0.000, 0.000] n=0
- claim_evidence_binding_pass: p=1.000 ci95=[0.510, 1.000] n=4
- research_tier_coverage_pass: p=1.000 ci95=[0.510, 1.000] n=4
- uncertainty_estimator_present: p=0.000 ci95=[0.000, 0.000] n=0
- experimental_math_guard_pass: p=1.000 ci95=[0.510, 1.000] n=4
- tool_use_budget_pack_pass: p=1.000 ci95=[0.510, 1.000] n=4
- objective_complete_before_finalize: p=0.750 ci95=[0.301, 0.954] n=4
- objective_scoped_retrieval_success: p=1.000 ci95=[0.510, 1.000] n=4
- objective_assembly_success: p=1.000 ci95=[0.510, 1.000] n=4

## Representative Evidence Packs
- pass: none (n/a)
- fail: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1776886555020\raw\versatility-1776886555020-relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos-s11-t0p2.json (relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos)

## Top Failure Signatures
- final_answer_contract_incomplete: 4
- text_too_short: 4
- objective_finalize_gate: 1

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: final_answer_contract_incomplete:direct_answer,where_in_repo,confidence_uncertainty,sources, text_too_short:174, objective_finalize_gate:false
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
I do not have enough verifiable evidence to answer safely in this turn. I need repo-grounded support with codex-clone baseline citations.

Claim basis: inferred-from-sources.
```

### Worst #2: relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos
- family: relation
- question: How does a warp bubble fit in with the mission ethos?
- failures: final_answer_contract_incomplete:direct_answer,where_in_repo,confidence_uncertainty,sources, text_too_short:174
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
I do not have enough verifiable evidence to answer safely in this turn. I need repo-grounded support with codex-clone baseline citations.

Claim basis: inferred-from-sources.
```

## Recommendation
- readiness_verdict: NOT_READY
- decision: insufficient_run_quality
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
- [4] Leakage and code-spill hardening: Prevent debug/scaffold markers and accidental code fragments from surviving final answer cleanup.
