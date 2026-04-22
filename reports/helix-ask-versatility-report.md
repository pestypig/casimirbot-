# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 92294660
- git_origin_main: ff877cf8
- git_ahead_behind: 0	1
- provenance_gate_pass: true
- provenance_warnings: none
- readiness_verdict: PARTIAL_READY
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1776805896032
- base_url: http://localhost:5050
- prompts: 3
- seeds: 7
- temperatures: 0.2
- expected_runs: 3
- total_runs: 3
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 189059
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1776805896032

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 1 | 0.0% | 100.0% | 100.0% | 0.0% | 15313 | 15313 |
| repo_technical | 1 | 0.0% | 100.0% | 100.0% | 0.0% | 15298 | 15298 |
| ambiguous_general | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 14530 | 14530 |

## Core Metrics
- intent_id_correct_rate: 100.00%
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
- reasoning_debug_complete_rate: 100.00%
- final_answer_contract_pass_rate: 100.00%
- uncertainty_research_contract_pass_rate: 100.00%
- semantic_repo_tech_contract_pass_rate: 100.00%
- claim_evidence_binding_pass_rate: 0.00%
- research_tier_coverage_pass_rate: 100.00%
- uncertainty_estimator_present_rate: 0.00%
- experimental_math_guard_pass_rate: 100.00%
- tool_use_budget_pack_pass_rate: 100.00%
- debug_scaffold_leak_rate: 0.00%
- code_fragment_spill_rate: 0.00%
- latency_total_p50_ms: 15298
- latency_total_p95_ms: 15313
- latency_retrieval_p50_ms: 4380 (samples=3)
- latency_retrieval_p95_ms: 22371 (samples=3)
- latency_synthesis_p50_ms: 10 (samples=3)
- latency_synthesis_p95_ms: 9479 (samples=3)

## Probability Scorecard (Wilson 95%)
- route_correct|relation: p=1.000 ci95=[0.207, 1.000] n=1
- route_correct|repo_technical: p=1.000 ci95=[0.207, 1.000] n=1
- route_correct|ambiguous_general: p=1.000 ci95=[0.207, 1.000] n=1
- frontier_scaffold_complete: p=1.000 ci95=[0.439, 1.000] n=3
- no_debug_leak: p=1.000 ci95=[0.439, 1.000] n=3
- no_runtime_fallback: p=1.000 ci95=[0.439, 1.000] n=3
- reasoning_debug_complete: p=1.000 ci95=[0.439, 1.000] n=3
- final_answer_contract_pass: p=1.000 ci95=[0.342, 1.000] n=2
- uncertainty_research_contract_pass: p=1.000 ci95=[0.342, 1.000] n=2
- semantic_repo_tech_contract_pass: p=1.000 ci95=[0.342, 1.000] n=2
- claim_evidence_binding_pass: p=0.000 ci95=[0.000, 0.658] n=2
- research_tier_coverage_pass: p=1.000 ci95=[0.342, 1.000] n=2
- uncertainty_estimator_present: p=0.000 ci95=[0.000, 0.000] n=0
- experimental_math_guard_pass: p=1.000 ci95=[0.342, 1.000] n=2
- tool_use_budget_pack_pass: p=1.000 ci95=[0.439, 1.000] n=3
- objective_complete_before_finalize: p=0.500 ci95=[0.095, 0.905] n=2
- objective_scoped_retrieval_success: p=1.000 ci95=[0.342, 1.000] n=2
- objective_assembly_success: p=1.000 ci95=[0.342, 1.000] n=2

## Representative Evidence Packs
- pass: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1776805896032\raw\versatility-1776805896032-ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer-s7-t0p2.json (ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer)
- fail: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1776805896032\raw\versatility-1776805896032-relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th-s7-t0p2.json (relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th)

## Top Failure Signatures
- claim_evidence_binding_missing: 2
- objective_finalize_gate: 1

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: claim_evidence_binding_missing:claim_evidence_binding_missing:strategy_claim_1, objective_finalize_gate:false
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Direct Answer:
- The relation between warp bubble physics and mission ethos in this repository is defined by a commitment to verified, non-harmful operations. The mission ethos constrains warp development to measurable and auditable chec.
Where in repo:
- docs/ethos/ideology.json
- docs/ethos/why.md
- modules/warp/warp-module.ts
- modules/warp/natario-warp.ts
Confidence/Uncertainty:
- Bounded to retrieved evidence; uncertainty remains until cited anchors are expanded for this exact behavior.
Next Step:
- Run a repo-scoped retrieval on the cited paths and compare against codex-clone and peer-reviewed references before promoting claim tier.
Sources: docs/ethos/ideology.json, docs/ethos/why.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs, external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs, https://arxiv.org/abs/gr-qc/0009013, https://arxiv.org/abs/gr-qc/9702026, gr-qc/0009013, gr-qc/9702026
```

### Worst #2: repo_tech_26_explain-how-answer-path-is-populated-and-useful-for-diagnostics
- family: repo_technical
- question: Explain how answer_path is populated and useful for diagnostics.
- failures: claim_evidence_binding_missing:claim_evidence_binding_missing:strategy_claim_2
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=repo.repo_api_lookup intent_domain=repo intent_strategy=repo_rag report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Direct Answer:
- I need one concrete anchor to answer reliably. Do you want a codebase-grounded answer, or a general explanation?
Where in repo:
- server/skills/vision.http.ts
- shared/collapse-benchmark.ts
- modules/dynamic/dynamic-casimir.ts
- server/specialists/solvers/code.isbalanced.ts
Confidence/Uncertainty:
- Bounded to retrieved evidence; uncertainty remains until cited anchors are expanded for this exact behavior.
Next Step:
- Run a repo-scoped retrieval on the cited paths and compare against codex-clone and peer-reviewed references before promoting claim tier.
Sources: server/skills/vision.http.ts, shared/collapse-benchmark.ts, modules/dynamic/dynamic-casimir.ts, server/specialists/solvers/code.isbalanced.ts, external/openai-codex/codex-rs/app-server-protocol/src/protocol/v2.rs, external/openai-codex/codex-rs/app-server/src/bespoke_event_handling.rs, https://arxiv.org/abs/gr-qc/0009013, https://arxiv.org/abs/gr-qc/9702026, gr-qc/0009013, gr-qc/9702026
```

### Worst #3: ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer
- family: ambiguous_general
- question: What's a clean way to structure a short answer?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_domain=general intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Lead with the direct answer, follow with one sentence that gives the key reason or evidence, and end with a caveat or next step only if it changes the outcome. That keeps the response short, readable, and easy to expand when the reader needs more context. Sources: docs/helix-ask-flow.md, docs/helix-ask-agent-policy.md
```

## Recommendation
- readiness_verdict: PARTIAL_READY
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
- [4] Leakage and code-spill hardening: Prevent debug/scaffold markers and accidental code fragments from surviving final answer cleanup.
