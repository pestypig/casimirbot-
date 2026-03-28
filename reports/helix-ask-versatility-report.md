# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 6f7f3fa7
- git_origin_main: 6f7f3fa7
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- readiness_verdict: PARTIAL_READY
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1774642966656
- base_url: http://localhost:5050
- prompts: 6
- seeds: 12
- temperatures: 0.2
- expected_runs: 6
- total_runs: 6
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 118988
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1774642966656

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 2 | 50.0% | 100.0% | 100.0% | 0.0% | 15123 | 15629 |
| repo_technical | 2 | 0.0% | 0.0% | 100.0% | 0.0% | 8516 | 19195 |
| ambiguous_general | 2 | 0.0% | 50.0% | 100.0% | 0.0% | 7630 | 15357 |

## Core Metrics
- intent_id_correct_rate: 50.00%
- report_mode_correct_rate: 100.00%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 100.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 50.00%
- min_text_length_pass_rate: 50.00%
- debug_scaffold_leak_rate: 0.00%
- code_fragment_spill_rate: 0.00%
- latency_total_p50_ms: 15123
- latency_total_p95_ms: 19195
- latency_retrieval_p50_ms: 2281 (samples=5)
- latency_retrieval_p95_ms: 5574 (samples=5)
- latency_synthesis_p50_ms: 3 (samples=6)
- latency_synthesis_p95_ms: 16 (samples=6)

## Probability Scorecard (Wilson 95%)
- route_correct|relation: p=1.000 ci95=[0.342, 1.000] n=2
- route_correct|repo_technical: p=0.000 ci95=[0.000, 0.658] n=2
- route_correct|ambiguous_general: p=0.500 ci95=[0.095, 0.905] n=2
- frontier_scaffold_complete: p=0.500 ci95=[0.188, 0.812] n=6
- no_debug_leak: p=1.000 ci95=[0.610, 1.000] n=6
- no_runtime_fallback: p=1.000 ci95=[0.610, 1.000] n=6
- objective_complete_before_finalize: p=0.500 ci95=[0.150, 0.850] n=4
- objective_scoped_retrieval_success: p=1.000 ci95=[0.510, 1.000] n=4
- objective_assembly_success: p=1.000 ci95=[0.510, 1.000] n=4

## Representative Evidence Packs
- pass: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1774642966656\raw\versatility-1774642966656-relation_07_how-warp-bubble-connected-to-mission-ethos-s12-t0p2.json (relation_07_how-warp-bubble-connected-to-mission-ethos)
- fail: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1774642966656\raw\versatility-1774642966656-relation_05_what-s-the-relationship-between-warp-bubble-viability-and-ideology-tree--s12-t0p2.json (relation_05_what-s-the-relationship-between-warp-bubble-viability-and-ideology-tree-)

## Top Failure Signatures
- intent_domain_mismatch: 3
- text_too_short: 3
- citation_missing: 3
- objective_finalize_gate: 2

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: repo_tech_05_how-does-deterministic-fallback-guard-relation-mode-contract-parse-failu
- family: repo_technical
- question: How does deterministic fallback guard relation-mode contract parse failures?
- failures: intent_domain_mismatch:general, text_too_short:126, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_domain=general intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
I couldn't confirm this against repo-grounded evidence, so this is an open-world best-effort answer with explicit uncertainty.
```

### Worst #2: repo_tech_13_how-does-goal-zone-harness-evaluate-pass-fail-across-seeds
- family: repo_technical
- question: How does goal-zone harness evaluate pass/fail across seeds?
- failures: intent_domain_mismatch:general, text_too_short:126, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_domain=general intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
I couldn't confirm this against repo-grounded evidence, so this is an open-world best-effort answer with explicit uncertainty.
```

### Worst #3: ambiguous_06_help-me-compare-precision-and-recall-quickly
- family: ambiguous_general
- question: Help me compare precision and recall quickly.
- failures: intent_domain_mismatch:hybrid, objective_finalize_gate:false
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Option A/B:
- A (Help): stronger invariants and tighter correctness posture.
- B (Precision): higher continuity/latency tolerance with looser immediate guarantees.

Key differences:
- Option A emphasizes stronger correctness guarantees.
- Option B emphasizes service continuity and responsiveness.

When to choose:
- Choose A when invariant safety dominates.
- Choose B when uptime/latency dominates and bounded eventual convergence is acceptable.

Risks:
- A can reduce availability under fault conditions.
- B can increase reconciliation and drift risk.

Sources: server/gr/gr-evaluation.ts, server/skills/docs.readme.ts, modules/dynamic/dynamic-casimir.ts, server/modules/halobank-solar/types.ts, server/metrics/index.ts, server/gr/gr-agent-loop.ts, docs/alcubierre-alignment.md, docs/stellar-consciousness-ii.md
```

### Worst #4: ambiguous_16_how-can-ambiguity-be-reduced-in-prompts
- family: ambiguous_general
- question: How can ambiguity be reduced in prompts?
- failures: text_too_short:126, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_domain=general intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
I couldn't confirm this against repo-grounded evidence, so this is an open-world best-effort answer with explicit uncertainty.
```

### Worst #5: relation_05_what-s-the-relationship-between-warp-bubble-viability-and-ideology-tree-
- family: relation
- question: What's the relationship between warp bubble viability and ideology tree commitments?
- failures: objective_finalize_gate:false
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Direct Answer:
- A warp bubble is a bounded spacetime configuration under this repository's warp model.
- What's the relationship between warp bubble viability and ideology tree commitments is grounded in modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/warp-console-architecture.md.

Mechanism Explanation:
- A warp bubble is a bounded spacetime configuration under this repository's warp model.
- What's the relationship between warp bubble viability and ideology tree commitments is anchored in docs/warp-console-architecture.md, docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/warp-mechanics-tree.json.

Inputs/Outputs:
- A warp bubble is a bounded spacetime configuration under this repository's warp model.
- What's the relationship between warp bubble viability and ideology tree commitments is anchored in docs/warp-console-architecture.md, docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/warp-mechanics-tree.json.

Constraints:
- Primary implementation anchors for What's the relationship between warp bubble viability and ideology tree commitments are modules/warp/warp-module.ts and modules/warp/natario-warp.ts.
- A warp bubble is a bounded spacetime configuration under this repository's warp model.

Definition:
- In this codebase, relationship warp bubble is grounded in docs/knowledge/warp/warp-bubble.md, with primary implementation surfaces in modules/warp/warp-module.ts and modules/warp/natario-warp.ts.

Common failure modes:
- Current evidence is incomplete for What's the relationship between warp bubble viability and ideology tree commitments; missing slots: code-path, failure-path.

Sources: modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/warp-console-architecture.md, docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/
```

### Worst #6: relation_07_how-warp-bubble-connected-to-mission-ethos
- family: relation
- question: how warp bubble connected to mission ethos?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Direct Answer:
- Assembly blocked: required objective gate failed-closed.
- how warp bubble connected to mission ethos is grounded in modules/warp/warp-module.ts, modules/warp/natario-warp.ts, modules/warp/warp-metric-adapter.ts.

Mechanism Explanation:
- Assembly blocked: required objective gate failed-closed.
- how warp bubble connected to mission ethos is anchored in modules/warp/warp-module.ts, modules/warp/natario-warp.ts, modules/warp/warp-metric-adapter.ts.

Inputs/Outputs:
- Assembly blocked: required objective gate failed-closed.
- how warp bubble connected to mission ethos is anchored in modules/warp/warp-module.ts, modules/warp/natario-warp.ts, modules/warp/warp-metric-adapter.ts.

Constraints:
- Primary implementation anchors for how warp bubble connected to mission ethos are modules/warp/warp-module.ts and modules/warp/natario-warp.ts.
- Assembly blocked: required objective gate failed-closed.

Common failure modes:
- Current evidence is incomplete for how warp bubble connected to mission ethos; missing slots: mechanism, code-path, definition.

Sources: modules/warp/warp-module.ts, modules/warp/natario-warp.ts, modules/warp/warp-metric-adapter.ts, client/public/warp-engine-outline.js, server/replit_integrations/object_storage/routes.ts, modules/physics/warpagents.ts, modules/analysis/constraint-loop.ts, server/db/migrations/migration.ts
```

## Recommendation
- readiness_verdict: PARTIAL_READY
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
- [4] Leakage and code-spill hardening: Prevent debug/scaffold markers and accidental code fragments from surviving final answer cleanup.
