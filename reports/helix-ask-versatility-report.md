# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 3dc0f2a3
- git_origin_main: 3dc0f2a3
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- readiness_verdict: PARTIAL_READY
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1774641309756
- base_url: http://localhost:5050
- prompts: 3
- seeds: 7
- temperatures: 0.2
- expected_runs: 3
- total_runs: 3
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 66056
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1774641309756

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 1 | 0.0% | 100.0% | 100.0% | 0.0% | 15755 | 15755 |
| repo_technical | 1 | 0.0% | 100.0% | 100.0% | 0.0% | 15004 | 15004 |
| ambiguous_general | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 8275 | 8275 |

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
- debug_scaffold_leak_rate: 0.00%
- code_fragment_spill_rate: 0.00%
- latency_total_p50_ms: 15004
- latency_total_p95_ms: 15755
- latency_retrieval_p50_ms: 1595 (samples=3)
- latency_retrieval_p95_ms: 1600 (samples=3)
- latency_synthesis_p50_ms: 9 (samples=2)
- latency_synthesis_p95_ms: 4375 (samples=2)

## Probability Scorecard (Wilson 95%)
- route_correct|relation: p=1.000 ci95=[0.207, 1.000] n=1
- route_correct|repo_technical: p=1.000 ci95=[0.207, 1.000] n=1
- route_correct|ambiguous_general: p=1.000 ci95=[0.207, 1.000] n=1
- frontier_scaffold_complete: p=1.000 ci95=[0.439, 1.000] n=3
- no_debug_leak: p=1.000 ci95=[0.439, 1.000] n=3
- no_runtime_fallback: p=1.000 ci95=[0.439, 1.000] n=3
- objective_complete_before_finalize: p=0.000 ci95=[0.000, 0.658] n=2
- objective_scoped_retrieval_success: p=1.000 ci95=[0.342, 1.000] n=2
- objective_assembly_success: p=1.000 ci95=[0.342, 1.000] n=2

## Representative Evidence Packs
- pass: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1774641309756\raw\versatility-1774641309756-ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer-s7-t0p2.json (ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer)
- fail: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1774641309756\raw\versatility-1774641309756-relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th-s7-t0p2.json (relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th)

## Top Failure Signatures
- objective_finalize_gate: 2

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: objective_finalize_gate:false
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_domain=hybrid intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=true contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Summary:
- Direct Answer: - docs/ethos/ideology.json ..
- Explain the relation between warp bubble physics and mission ethos in this repo is grounded in modules/warp/warp-module.ts, modules/warp/natario-warp.ts, modules/warp/warp-metric-adapter.ts.

Evidence:
- Direct Answer: - docs/ethos/ideology.json ..
- Explain the relation between warp bubble physics and mission ethos in this repo is anchored in modules/warp/warp-module.ts, modules/warp/natario-warp.ts, modules/warp/warp-metric-adapter.ts.

Implementation In Repo:
- Primary implementation anchors for Explain the relation between warp bubble physics and mission ethos in this repo are modules/warp/warp-module.ts and modules/warp/natario-warp.ts.
- modules/warp/warp-module.ts: orchestrates warp module flow and runtime solve wiring.
- modules/warp/natario-warp.ts: computes Natario warp-bubble fields and congruence diagnostics.
- modules/warp/warp-metric-adapter.ts: contains core module logic used by this solve path.

mission ethos in this repo:
- Primary implementation anchors for mission ethos in this repo are modules/warp/warp-module.ts and modules/warp/natario-warp.ts.
- Direct Answer: - docs/ethos/ideology.json ..

Open Gaps:
- Current evidence is incomplete for State what remains uncertain or under-evidenced in this turn.; missing slots: definition, mechanism, code-path, relation, failure-path.

Sources: modules/warp/warp-module.ts, modules/warp/natario-warp.ts, modules/warp/warp-metric-adapter.ts, client/public/warp-engine-outline.js, modules/physics/warpagents.ts, server/specialists/solvers/repo.ideation.ts, modules/analysis/constraint-loop.ts, server/db/migrations/migration.ts
```

### Worst #2: repo_tech_26_explain-how-answer-path-is-populated-and-useful-for-diagnostics
- family: repo_technical
- question: Explain how answer_path is populated and useful for diagnostics.
- failures: objective_finalize_gate:false
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=repo.repo_api_lookup intent_domain=repo intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Direct Answer:
- Assembly blocked: required objective gate failed-closed.
- Explain how answer_path is populated and useful for diagnostics is grounded in server/skills/vision.http.ts, shared/collapse-benchmark.ts, modules/dynamic/dynamic-casimir.ts.

Where in repo:
- answer_path is anchored in server/skills/vision.http.ts with supporting flow in shared/collapse-benchmark.ts.
- server/skills/vision.http.ts: contains implementation logic relevant to this answer.
- shared/collapse-benchmark.ts: defines shared types/constants consumed across the pipeline.
- modules/dynamic/dynamic-casimir.ts: contains core module logic used by this solve path.

Call chain:
- Assembly blocked: required objective gate failed-closed. [server/skills/vision.http.ts]
- answer_path is traced through server/skills/vision.http.ts and shared/collapse-benchmark.ts in this turn.

Key structs/types:
- Prompt-explicit symbols in this turn include answer_path.

What to change safely:
- Start with writes to answer_path in server/skills/vision.http.ts before changing downstream formatting or diagnostics.
- For line-level edits, narrow the next pass with explicit symbol or file:line anchors.

Explain how answer_path is populated and useful for diagnostics:
- Assembly blocked: required objective gate failed-closed.
- Explain how answer_path is populated and useful for diagnostics is grounded in server/skills/vision.http.ts, shared/collapse-benchmark.ts, modules/dynamic/dynamic-casimir.ts.

Open Gaps:
- Current evidence is incomplete for State what remains uncertain or under-evidenced in this turn.; missing slots: mechanism, answer-path, populated, code-path.

Sources: server/skills/vision.http.ts, shared/collapse-benchmark.ts, modules/dynamic/dynamic-casimir.ts, server/specialists/solvers/code.isbalanced.ts,
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
