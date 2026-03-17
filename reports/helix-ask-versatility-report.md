# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 52635287
- git_origin_main: 52635287
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1773721007324
- base_url: http://localhost:5050
- prompts: 3
- seeds: 7
- temperatures: 0.2
- expected_runs: 3
- total_runs: 3
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 242965
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1773721007324

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 15007 | 15007 |
| repo_technical | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 15007 | 15007 |
| ambiguous_general | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 15014 | 15014 |

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
- latency_total_p50_ms: 15007
- latency_total_p95_ms: 15014
- latency_retrieval_p50_ms: 847 (samples=3)
- latency_retrieval_p95_ms: 57071 (samples=3)
- latency_synthesis_p50_ms: 10145 (samples=3)
- latency_synthesis_p95_ms: 30292 (samples=3)

## Top Failure Signatures

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: ambiguous_12_what-s-a-clean-way-to-structure-a-short-answer
- family: ambiguous_general
- question: What's a clean way to structure a short answer?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
To structure a clean short answer, begin with a direct response that addresses the question head-on. This initial statement should encapsulate the main idea or conclusion, allowing the reader to grasp the essence of your answer quickly. For example, if asked about the benefits of exercise, you might start with, "Regular exercise improves physical health and mental well-being."

Following the initial response, provide a brief explanation or supporting detail that reinforces your main point. This could include a statistic, a fact, or a succinct rationale that adds depth without overwhelming the reader. For instance, you could add, "Studies show that individuals who engage in physical activity experience lower rates of anxiety and depression."

Next, consider including a specific example or application that illustrates your point. This helps to contextualize your answer and makes it more relatable. For example, you might say, "For instance, a daily 30-minute walk can significantly enhance mood and energy levels."

Finally, conclude with a summary statement that reiterates the main idea or suggests a broader implication. This wraps up your answer neatly and reinforces the key takeaway. An example could be, "Incorporating regular exercise into your routine is essential for maintaining both physical and mental health."

By following this structure—direct response, supporting detail, example, and conclusion—you can create a clear and effective short answer that communicates your message efficiently.

Sources: open-world best-effort (no repo citations required).
```

### Worst #2: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
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

### Worst #3: repo_tech_23_how-does-arbiter-mode-get-selected-for-repo-vs-hybrid-asks
- family: repo_technical
- question: How does arbiter_mode get selected for repo vs hybrid asks?
- failures: none
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [server/specialists/solvers/repo.answer.review.ts] - In practice, coupled constraints and feedback loops determine how outcomes evolve over time. [server/specialists/solvers/repo.answer.review.ts] Reasoned connections (bounded):
- Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. [server/specialists/solvers/repo.answer.review.ts] (see server/specialists/solvers/repo.answer.review.ts1. (see server/specialists/solvers/repo.answer.review.tsBounded linkage supported by cited evidence.)

Next evidence:
- Searched terms: How does arbiter_mode get selected for repo vs hybrid asks?, AGENT_PLAYBOOK.md, Repo Forest Coverage Audit - 2026-02-18, repo forest coverage audit 2026 02 18
- Checked files: docs/helix-ask-dottie-grounding-deep-research-2026-03-03.md, scripts/helix-ask-versatility-record.ts,, server/services/repo/repoGraph.ts
- Check files under server or scripts. - Search docs headings for "arbiter_mode". [server/specialists/solvers/repo.answer.review.ts] - Search docs headings for "get". [server/specialists/solvers/repo.answer.review.ts] - Search docs headings for "Repo Forest Coverage Audit - 2026-02-18". [server/specialists/solvers/repo.answer.review.ts] 1. I don't see repo evidence for arbiter_mode, get, hybrid. [server/specialists/solvers/repo.answer.review.ts] Do you mean a repo-specific module/file, or the general concept? [server/specialists/solvers/repo.answer.review.ts] Point me to the file path or clarify the sense. [server/specialists/solvers/repo.answer.review.ts] Missing evidence: add directly relevant repo paths or artifact refs to raise confidence. [server/specialists/solvers/repo.an
```

## Recommendation
- decision: ship
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
