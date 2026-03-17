# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 3989a56f
- git_origin_main: 3989a56f
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1773776978943
- base_url: http://localhost:5050
- prompts: 3
- seeds: 7
- temperatures: 0.2
- expected_runs: 3
- total_runs: 3
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 182779
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1773776978943

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 15011 | 15011 |
| repo_technical | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 15016 | 15016 |
| ambiguous_general | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 15012 | 15012 |

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
- latency_total_p50_ms: 15012
- latency_total_p95_ms: 15016
- latency_retrieval_p50_ms: 815 (samples=3)
- latency_retrieval_p95_ms: 30640 (samples=3)
- latency_synthesis_p50_ms: 6394 (samples=3)
- latency_synthesis_p95_ms: 9608 (samples=3)

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

- The arbiter_mode selection process for repo versus hybrid asks is influenced by the coverage audit findings. [server/specialists/solvers/repo.answer.review.ts] - According to the "Repo Forest Coverage Audit - 2026-02-18," the objective was to evaluate the effectiveness of different modes in various scenarios. [server/specialists/solvers/repo.answer.review.ts] Reasoned connections (bounded):
- (see server/specialists/solvers/repo.answer.review.tsThe arbiter_mode selection process for repo versus hybrid asks is influenced by the coverage audit findings. (see server/specialists/solvers/repo.answer.review.tsBounded linkage supported by cited evidence.)

Next evidence:
- Searched terms: How does arbiter_mode get selected for repo vs hybrid asks?, AGENT_PLAYBOOK.md, tmp-warp-ask.json, Repo Forest Coverage Audit - 2026-02-18
- Checked files: docs/helix-ask-dottie-grounding-deep-research-2026-03-03.md, scripts/helix-ask-versatility-record.ts,,
- Check files under server or scripts. - Search docs headings for "arbiter_mode". [server/specialists/solvers/repo.answer.review.ts] - Search docs headings for "get". [server/specialists/solvers/repo.answer.review.ts] - Search docs headings for "Repo Forest Coverage Audit - 2026-02-18". [server/specialists/solvers/repo.answer.review.ts] 1. I don't see repo evidence for arbiter_mode, get, hybrid. [server/specialists/solvers/repo.answer.review.ts] Do you mean a repo-specific module/file, or the general concept? [server/specialists/solvers/repo.answer.review.ts] Point me to the file path or clarify the sense. [server/specialists/solvers/repo.answer.review.ts] Sources: server/specialists/solvers/repo.answer.review.ts, scripts/repo-atlas-build.ts, client/src/lib/audience-mode.ts, reports/repo-telemetry.json, external/sunpy/exampl
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
To structure a short answer effectively, begin with a direct response that addresses the question head-on. This initial statement should encapsulate the main idea, allowing the reader to grasp the core message quickly. Following this, provide a brief explanation or rationale that supports your answer, adding context without overwhelming the reader with excessive detail.

Next, consider including one or two relevant examples or points that reinforce your answer. These examples should be succinct and directly related to the main point, illustrating your response in a practical way. This not only enhances understanding but also adds credibility to your answer.

Finally, conclude with a summary statement that reiterates the main point or offers a final thought. This wrap-up helps to solidify the information in the reader's mind and ensures that the answer feels complete. Keeping the structure clear and focused will make your short answer both effective and easy to digest.

In summary, a clean structure for a short answer includes:

- A direct response to the question.

- A brief explanation or rationale.

- Relevant examples or supporting points.

- A concluding statement that reinforces the main idea.

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
