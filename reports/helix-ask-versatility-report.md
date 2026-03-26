# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: b22da0bf
- git_origin_main: b22da0bf
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- readiness_verdict: PARTIAL_READY
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1774457478766
- base_url: http://127.0.0.1:5050
- prompts: 3
- seeds: 2
- temperatures: 0.2
- expected_runs: 3
- total_runs: 3
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 100635
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1774457478766

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 1 | 0.0% | 100.0% | 100.0% | 0.0% | 15425 | 15425 |
| repo_technical | 1 | 0.0% | 0.0% | 100.0% | 0.0% | 15006 | 15006 |
| ambiguous_general | 1 | 0.0% | 100.0% | 100.0% | 0.0% | 15015 | 15015 |

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
- citation_presence_rate: 0.00%
- min_text_length_pass_rate: 100.00%
- debug_scaffold_leak_rate: 0.00%
- code_fragment_spill_rate: 0.00%
- latency_total_p50_ms: 15015
- latency_total_p95_ms: 15425
- latency_retrieval_p50_ms: 1288 (samples=3)
- latency_retrieval_p95_ms: 1816 (samples=3)
- latency_synthesis_p50_ms: 17 (samples=3)
- latency_synthesis_p95_ms: 1288 (samples=3)

## Probability Scorecard (Wilson 95%)
- route_correct|relation: p=1.000 ci95=[0.207, 1.000] n=1
- route_correct|repo_technical: p=0.000 ci95=[0.000, 0.793] n=1
- route_correct|ambiguous_general: p=1.000 ci95=[0.207, 1.000] n=1
- frontier_scaffold_complete: p=1.000 ci95=[0.439, 1.000] n=3
- no_debug_leak: p=1.000 ci95=[0.439, 1.000] n=3
- no_runtime_fallback: p=1.000 ci95=[0.439, 1.000] n=3
- objective_complete_before_finalize: p=1.000 ci95=[0.439, 1.000] n=3
- objective_scoped_retrieval_success: p=1.000 ci95=[0.439, 1.000] n=3
- objective_assembly_success: p=1.000 ci95=[0.439, 1.000] n=3

## Representative Evidence Packs
- pass: none (n/a)
- fail: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1774457478766\raw\versatility-1774457478766-relation_27_how-does-relation-mode-answer-tie-warp-bubble-to-ideology-without-report-s2-t0p2.json (relation_27_how-does-relation-mode-answer-tie-warp-bubble-to-ideology-without-report)

## Top Failure Signatures
- citation_missing: 3
- intent_domain_mismatch: 1

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: repo_tech_07_how-are-ambiguity-gates-triggered-and-what-clarify-output-is-produced
- family: repo_technical
- question: How are ambiguity gates triggered and what clarify output is produced?
- failures: intent_domain_mismatch:hybrid, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Ambiguity gates are triggered through specific conditions outlined in the system's operational modules, particularly in the context of voice evaluation and dynamic gate management. The clarify output produced when these gates are activated includes refined responses that aim to resolve ambiguities and enhance user interaction, as detailed in the relevant documentation and code modules.
```

### Worst #2: relation_27_how-does-relation-mode-answer-tie-warp-bubble-to-ideology-without-report
- family: relation
- question: How does relation-mode answer tie warp bubble to ideology without report scaffolding?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The relation-mode answer connects the warp bubble to ideology through the Ideology Physics Bridge, which ensures that mission ethos constrains capability claims to verified and non-harmful operations. This mechanism involves binding claims to reproducible evidence via warp viability certificates, which translate design ambitions into falsifiable tests across both physics and policy layers. The constraints include physics bounds, such as Ford-Roman QI and GR constraint gates, and policy bounds that mandate stewardship and traceable evidence for operational decisions. However, the specific details of relation-mode remain partially addressed, indicating a need for further exploration of this concept.
```

### Worst #3: ambiguous_08_what-s-a-good-way-to-summarize-evidence
- family: ambiguous_general
- question: What's a good way to summarize evidence?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_domain=general intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
I couldn't confirm this against repo-grounded evidence, so this is an open-world best-effort answer with explicit uncertainty. Best-effort definition: "a good way to summarize evidence" names a concept in its domain; define its governing idea, then test it with one concrete example before treating it as settled.
```

## Recommendation
- readiness_verdict: PARTIAL_READY
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
- [4] Leakage and code-spill hardening: Prevent debug/scaffold markers and accidental code fragments from surviving final answer cleanup.
