# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 6c488d49
- git_origin_main: 6c488d49
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- readiness_verdict: READY
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1776723408668
- base_url: http://127.0.0.1:5050
- prompts: 3
- seeds: 7,11
- temperatures: 0.2
- expected_runs: 6
- total_runs: 6
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 266902
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1776723408668

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 2 | 100.0% | 100.0% | 100.0% | 0.0% | 8752 | 15171 |
| repo_technical | 2 | 100.0% | 100.0% | 100.0% | 0.0% | 15033 | 15045 |
| ambiguous_general | 2 | 100.0% | 100.0% | 100.0% | 0.0% | 15032 | 15033 |

## Core Metrics
- intent_id_correct_rate: 100.00%
- report_mode_correct_rate: 100.00%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 0.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 100.00%
- min_text_length_pass_rate: 100.00%
- reasoning_debug_complete_rate: 100.00%
- final_answer_contract_pass_rate: 100.00%
- uncertainty_research_contract_pass_rate: 100.00%
- research_tier_coverage_pass_rate: 100.00%
- uncertainty_estimator_present_rate: 0.00%
- experimental_math_guard_pass_rate: 100.00%
- tool_use_budget_pack_pass_rate: 100.00%
- debug_scaffold_leak_rate: 0.00%
- code_fragment_spill_rate: 0.00%
- latency_total_p50_ms: 15033
- latency_total_p95_ms: 15171
- latency_retrieval_p50_ms: 2264 (samples=6)
- latency_retrieval_p95_ms: 31190 (samples=6)
- latency_synthesis_p50_ms: 4 (samples=6)
- latency_synthesis_p95_ms: 7541 (samples=6)

## Probability Scorecard (Wilson 95%)
- route_correct|relation: p=1.000 ci95=[0.342, 1.000] n=2
- route_correct|repo_technical: p=1.000 ci95=[0.342, 1.000] n=2
- route_correct|ambiguous_general: p=1.000 ci95=[0.342, 1.000] n=2
- frontier_scaffold_complete: p=1.000 ci95=[0.610, 1.000] n=6
- no_debug_leak: p=1.000 ci95=[0.610, 1.000] n=6
- no_runtime_fallback: p=1.000 ci95=[0.610, 1.000] n=6
- reasoning_debug_complete: p=1.000 ci95=[0.610, 1.000] n=6
- final_answer_contract_pass: p=1.000 ci95=[0.510, 1.000] n=4
- uncertainty_research_contract_pass: p=1.000 ci95=[0.510, 1.000] n=4
- research_tier_coverage_pass: p=1.000 ci95=[0.510, 1.000] n=4
- uncertainty_estimator_present: p=0.000 ci95=[0.000, 0.000] n=0
- experimental_math_guard_pass: p=1.000 ci95=[0.510, 1.000] n=4
- tool_use_budget_pack_pass: p=1.000 ci95=[0.610, 1.000] n=6
- objective_complete_before_finalize: p=1.000 ci95=[0.342, 1.000] n=2
- objective_scoped_retrieval_success: p=1.000 ci95=[0.342, 1.000] n=2
- objective_assembly_success: p=1.000 ci95=[0.342, 1.000] n=2

## Representative Evidence Packs
- pass: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1776723408668\raw\versatility-1776723408668-relation_27_how-does-relation-mode-answer-tie-warp-bubble-to-ideology-without-report-s7-t0p2.json (relation_27_how-does-relation-mode-answer-tie-warp-bubble-to-ideology-without-report)
- fail: none (n/a)

## Top Failure Signatures

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_27_how-does-relation-mode-answer-tie-warp-bubble-to-ideology-without-report
- family: relation
- question: How does relation-mode answer tie warp bubble to ideology without report scaffolding?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Direct Answer:
- Current answer for "How does relation-mode answer tie warp bubble to ideology without report scaffolding?" remains bounded to retrieved anchors in this turn.
Where in repo:
- external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs
- external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs
Confidence/Uncertainty: bounded to currently retrieved evidence; unresolved gaps remain until narrower file-level anchors are provided.
Sources: external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs, external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs, https://arxiv.org/abs/gr-qc/0009013, https://arxiv.org/abs/gr-qc/9702026
```

### Worst #2: repo_tech_26_explain-how-answer-path-is-populated-and-useful-for-diagnostics
- family: repo_technical
- question: Explain how answer_path is populated and useful for diagnostics.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=repo.repo_api_lookup intent_domain=repo intent_strategy=repo_rag report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Direct Answer:
- Current answer for "Explain how answer_path is populated and useful for diagnostics" remains bounded to retrieved anchors in this turn.
Where in repo:
- server/skills/vision.http.ts
- shared/collapse-benchmark.ts
- modules/dynamic/dynamic-casimir.ts
- server/specialists/solvers/code.isbalanced.ts
Confidence/Uncertainty: bounded to currently retrieved evidence; unresolved gaps remain until narrower file-level anchors are provided.
Sources: server/skills/vision.http.ts, shared/collapse-benchmark.ts, modules/dynamic/dynamic-casimir.ts, server/specialists/solvers/code.isbalanced.ts, https://arxiv.org/abs/gr-qc/0009013, https://arxiv.org/abs/gr-qc/9702026, external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs, external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs
```

### Worst #3: ambiguous_22_how-can-teams-avoid-report-mode-spam-in-assistants
- family: ambiguous_general
- question: How can teams avoid report-mode spam in assistants?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.fallback intent_domain=general intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
I do not have enough grounded context in this turn to answer reliably without introducing guesswork. To move forward, provide one concrete anchor such as a file path, module name, API route, or the specific behavior you want fixed. With that anchor, I can return a direct non-report answer with explicit uncertainty and next steps.
```

## Recommendation
- readiness_verdict: READY
- decision: ship
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
- [4] Leakage and code-spill hardening: Prevent debug/scaffold markers and accidental code fragments from surviving final answer cleanup.
