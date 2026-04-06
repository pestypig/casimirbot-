# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 53fb0a49
- git_origin_main: 53fb0a49
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- readiness_verdict: PARTIAL_READY
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1775205653215
- base_url: http://localhost:5050
- prompts: 3
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 9
- total_runs: 9
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 283971
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1775205653215

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 3 | 100.0% | 100.0% | 100.0% | 0.0% | 16125 | 16272 |
| repo_technical | 3 | 0.0% | 100.0% | 100.0% | 0.0% | 17485 | 17632 |
| ambiguous_general | 3 | 0.0% | 0.0% | 100.0% | 0.0% | 16491 | 16529 |

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
- min_text_length_pass_rate: 100.00%
- debug_scaffold_leak_rate: 0.00%
- code_fragment_spill_rate: 0.00%
- latency_total_p50_ms: 16272
- latency_total_p95_ms: 17632
- latency_retrieval_p50_ms: 2144 (samples=9)
- latency_retrieval_p95_ms: 4568 (samples=9)
- latency_synthesis_p50_ms: 15 (samples=9)
- latency_synthesis_p95_ms: 4335 (samples=9)

## Probability Scorecard (Wilson 95%)
- route_correct|relation: p=1.000 ci95=[0.439, 1.000] n=3
- route_correct|repo_technical: p=1.000 ci95=[0.439, 1.000] n=3
- route_correct|ambiguous_general: p=0.000 ci95=[0.000, 0.561] n=3
- frontier_scaffold_complete: p=1.000 ci95=[0.701, 1.000] n=9
- no_debug_leak: p=1.000 ci95=[0.701, 1.000] n=9
- no_runtime_fallback: p=1.000 ci95=[0.701, 1.000] n=9
- objective_complete_before_finalize: p=0.333 ci95=[0.121, 0.646] n=9
- objective_scoped_retrieval_success: p=1.000 ci95=[0.701, 1.000] n=9
- objective_assembly_success: p=1.000 ci95=[0.701, 1.000] n=9

## Representative Evidence Packs
- pass: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1775205653215\raw\versatility-1775205653215-relation_16_how-is-the-warp-bubble-a-technical-layer-while-mission-ethos-is-policy-l-s7-t0p2.json (relation_16_how-is-the-warp-bubble-a-technical-layer-while-mission-ethos-is-policy-l)
- fail: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1775205653215\raw\versatility-1775205653215-repo_tech_18_how-does-fast-quality-mode-alter-answer-generation-deadlines-s7-t0p2.json (repo_tech_18_how-does-fast-quality-mode-alter-answer-generation-deadlines)

## Top Failure Signatures
- objective_finalize_gate: 6
- intent_domain_mismatch: 3

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: ambiguous_06_help-me-compare-precision-and-recall-quickly
- family: ambiguous_general
- question: Help me compare precision and recall quickly.
- failures: intent_domain_mismatch:hybrid, objective_finalize_gate:false
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
A (Help): stronger invariants and tighter correctness posture.
B (Precision): higher continuity/latency tolerance with looser immediate guarantees.
Option A emphasizes stronger correctness guarantees.
Option B emphasizes service continuity and responsiveness.
Choose A when invariant safety dominates.
Choose B when uptime/latency dominates and bounded eventual convergence is acceptable.
A can reduce availability under fault conditions.
B can increase reconciliation and drift risk.
```

### Worst #2: repo_tech_18_how-does-fast-quality-mode-alter-answer-generation-deadlines
- family: repo_technical
- question: How does fast quality mode alter answer generation deadlines?
- failures: objective_finalize_gate:false
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=repo.repo_api_lookup intent_domain=repo intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
How does fast quality mode alter answer generation deadlines is grounded in modules/warp/natario-warp.ts, client/src/lib/hud-adapter.ts, server/services/helix-ask/runtime-errors.ts.
Primary implementation anchors for How does fast quality mode alter answer generation deadlines are modules/warp/natario-warp.ts and client/src/lib/hud-adapter.ts. modules/warp/natario-warp.ts: computes Natario warp-bubble fields and congruence diagnostics. client/src/lib/hud-adapter.ts: contains implementation logic relevant to this answer. server/services/helix-ask/runtime-errors.ts: implements server-side computation for this capability.
. Repository runtime path runs through modules/warp/natario-warp.ts and client/src/lib/hud-adapter.ts.
In practical terms, primary implementation symbols should be inspected in modules/warp/natario-warp.ts. Key structs/types: Start with the primary implementation anchor modules/warp/natario-warp.ts before changing downstream formatting or diagnostics. For line-level edits, narrow the next pass with explicit symbol or file:line anchors. What to change safely: How does fast quality mode alter answer generation deadlines is anchored in modules/warp/natario-warp.ts, client/src/lib/hud-adapter.ts, server/services/helix-ask/runtime-errors.ts.
In practical terms, current evidence is incomplete for this turn; missing slots: mechanism, code-path, definition. Open Gaps:
```

### Worst #3: relation_16_how-is-the-warp-bubble-a-technical-layer-while-mission-ethos-is-policy-l
- family: relation
- question: How is the warp bubble a technical layer while mission ethos is policy layer?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Assembly blocked: required objective gate failed-closed.
How is the warp bubble a technical layer while mission ethos is policy layer is grounded in modules/warp/warp-module.ts, modules/warp/natario-warp.ts, modules/warp/warp-metric-adapter.ts.
How is the warp bubble a technical layer while mission ethos is policy layer is anchored in modules/warp/warp-module.ts, modules/warp/natario-warp.ts, modules/warp/warp-metric-adapter.ts.
Primary implementation anchors for How is the warp bubble a technical layer while mission ethos is policy layer are modules/warp/warp-module.ts and modules/warp/natario-warp.ts.
Current evidence is incomplete for How is the warp bubble a technical layer while mission ethos is policy layer; missing slots: mechanism, code-path, definition.
```

## Recommendation
- readiness_verdict: PARTIAL_READY
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
- [4] Leakage and code-spill hardening: Prevent debug/scaffold markers and accidental code fragments from surviving final answer cleanup.
