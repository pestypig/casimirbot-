# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 6450f41e
- git_origin_main: 6450f41e
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1773051925960
- base_url: http://localhost:5050
- prompts: 3
- seeds: 7
- temperatures: 0.2
- expected_runs: 3
- total_runs: 3
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 56798
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1773051925960

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 11077 | 11077 |
| repo_technical | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 15004 | 15004 |
| ambiguous_general | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 14174 | 14174 |

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
- latency_total_p50_ms: 14174
- latency_total_p95_ms: 15004
- latency_retrieval_p50_ms: 1049 (samples=3)
- latency_retrieval_p95_ms: 3621 (samples=3)
- latency_synthesis_p50_ms: 6576 (samples=3)
- latency_synthesis_p95_ms: 11672 (samples=3)

## Top Failure Signatures

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: repo_tech_23_how-does-arbiter-mode-get-selected-for-repo-vs-hybrid-asks
- family: repo_technical
- question: How does arbiter_mode get selected for repo vs hybrid asks?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:

- The selection of arbiter_mode for repo versus hybrid asks is influenced by the specific requirements outlined in the Helix Ask Mission Overwatch documentation. [client/src/lib/gl/capabilities.ts] - According to the document titled "helix ask mission overwatch v1 wave3a codex cloud autorun batch prompt pack 2026 02 23," there are baseline locks and shared guardrails that apply to every prompt. [client/src/lib/gl/capabilities.ts] Reasoned connections (bounded):
- (see client/src/lib/gl/capabilities.tsThe selection of arbiter_mode for repo versus hybrid asks is influenced by the specific requirements outlined in the Helix Ask Mission Overwatch documentation. (see client/src/lib/gl/capabilities.tsBounded linkage supported by cited evidence.)

Next evidence:
- Searched terms: How does arbiter_mode get selected for repo vs hybrid asks?, mission overwatch intent context, Repo Forest Coverage Audit - 2026-02-18, repo forest coverage audit 2026 02 18
- Checked files:, docs/runbooks/mission-overwatch-slo-2026-02-23.md,, modules/dynamic/dynamic-casimir.ts
- Check files under client or server. - Search docs headings for "arbiter_mode". [client/src/lib/gl/capabilities.ts] - Search docs headings for "hybrid". [client/src/lib/gl/capabilities.ts] - Search docs headings for "Repo Forest Coverage Audit - 2026-02-18". [client/src/lib/gl/capabilities.ts] 1. I don't see repo evidence for arbiter_mode, get, hybrid. [client/src/lib/gl/capabilities.ts] Do you mean a repo-specific module/file, or the general concept? [client/src/lib/gl/capabilities.ts] Point me to the file path or clarify the sense. [client/src/lib/gl/capabilities.ts] Sources: client/src/lib/gl/capabilities.ts, server/services/essence/environment.ts, modules/dynamic/dynamic-casimir.ts, docs/business_model.md, shar
```

### Worst #2: ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer
- family: ambiguous_general
- question: What's a clean way to structure a short answer?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
A clean structure for a short answer begins with a direct response that addresses the question head-on. This ensures that the reader immediately grasps the main point. Following the initial statement, provide a brief explanation or rationale that supports your answer, adding clarity without overwhelming the reader with excessive information.

Next, consider using bullet points or numbered lists if you need to present multiple pieces of information or examples. This format enhances readability and allows the reader to quickly scan for key details. Each point should be concise and relevant, reinforcing the main idea without diverging into tangential topics.

Additionally, it's beneficial to conclude with a summary statement that reiterates the main point or offers a final thought. This helps to solidify the information in the reader's mind and provides a sense of closure. Keeping the overall tone straightforward and focused will contribute to the clarity of your response.

Lastly, remember to maintain a logical flow throughout your answer. Each sentence should connect smoothly to the next, guiding the reader through your thought process. By adhering to these principles, you can create a short answer that is both informative and easy to understand.

Sources: open-world best-effort (no repo citations required).
```

### Worst #3: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
"ideology" Sources: docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/ethos/mission-ethos.md, docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/alcubierre-metric.md, docs/knowledge/ethos/stew... "ideology" Sources: docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/ethos/mission-ethos.md, docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/alcubierre-metric.md, docs/knowledge/ethos/stew... The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] Mechanism: "ideology" Sources: docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/ethos/mission-ethos.md, docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/alcubierre-metric.md, docs/knowledge/ethos/stew... -> coupled constraints and feedback operators -> observable outcomes tied to docs/ethos/ideology.json, be. Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached. [docs/knowledge/ethos/mission-ethos.md] Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity. [docs/knowledge/ethos/mission-ethos.md] Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md, docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/alcubierre-metric.md, docs/knowledge/ethos/stewardship-ledger.md, docs/warp-console-architecture.md
```

## Recommendation
- decision: ship
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
