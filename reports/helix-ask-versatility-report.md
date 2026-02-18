# Helix Ask Versatility Evaluation Report

- run_id: versatility-1771374521487
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 162867
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1771374521487

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 90.0% | 93.3% | 100.0% | 0.0% | 505 | 653 |
| repo_technical | 90 | 73.3% | 0.0% | 83.3% | 0.0% | 527 | 1453 |
| ambiguous_general | 90 | 66.7% | 0.0% | 93.3% | 0.0% | 578 | 1003 |

## Core Metrics
- intent_id_correct_rate: 93.33%
- report_mode_correct_rate: 92.22%
- relation_packet_built_rate: 90.00%
- relation_dual_domain_ok_rate: 90.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 90.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 86.67%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 528
- latency_total_p95_ms: 1275
- latency_retrieval_p50_ms: 119 (samples=261)
- latency_retrieval_p95_ms: 239 (samples=261)
- latency_synthesis_p50_ms: 1 (samples=270)
- latency_synthesis_p95_ms: 18 (samples=270)

## Top Failure Signatures
- citation_missing: 36
- report_mode_mismatch: 21
- relation_packet_built: 9
- relation_dual_domain: 9
- bridge_count_low: 9
- evidence_count_low: 9
- intent_mismatch: 6

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
- family: relation
- question: Explain warp bubble + mission ethos for a skeptical engineer.
- failures: intent_mismatch:hybrid.concept_plus_system_mapping, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Unverified:
- No repo-evidenced claims were confirmed yet.

Reasoned connections (bounded):
- Need at least two grounded points before drawing a connection.

Next evidence:
- Searched terms: warp bubble, calculateNatarioWarpBubble, warp pipeline
- Checked files: docs/ethos/ideology.json, docs/ethos/why.md, client/src/pages/why.tsx, modules/warp/warp-module.ts
- Check files under docs or modules.
- Search docs headings for "Mission Ethos".
- Search docs headings for "Mission Ethos Seeds".
- Search docs headings for "Mission Ethos Tree".
```

### Worst #2: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: relation_packet_built:false, relation_dual_domain:false, bridge_count_low:0, evidence_count_low:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. Key questions include: Which bubble model is used and where are its constraints checked? See modules/warp/warp-module.ts and modules/warp/natario-warp.ts for the implementation.

In practice, those standards guide how evidence and justification are weighed in specific contexts.
```

### Worst #3: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: relation_packet_built:false, relation_dual_domain:false, bridge_count_low:0, evidence_count_low:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. Key questions include: Which bubble model is used and where are its constraints checked? See modules/warp/warp-module.ts and modules/warp/natario-warp.ts for the implementation.

In practice, those standards guide how evidence and justification are weighed in specific contexts.
```

### Worst #4: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: relation_packet_built:false, relation_dual_domain:false, bridge_count_low:0, evidence_count_low:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. Key questions include: Which bubble model is used and where are its constraints checked? See modules/warp/warp-module.ts and modules/warp/natario-warp.ts for the implementation.

In practice, those standards guide how evidence and justification are weighed in specific contexts.
```

### Worst #5: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
- family: relation
- question: Could warp bubble progress violate mission ethos? How is that prevented?
- failures: intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=repo.ideology_reference intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

This is in the ideology scope.

Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md
```

### Worst #6: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
- family: relation
- question: Explain warp bubble + mission ethos for a skeptical engineer.
- failures: intent_mismatch:hybrid.concept_plus_system_mapping, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Unverified:
- No repo-evidenced claims were confirmed yet.

Reasoned connections (bounded):
- Need at least two grounded points before drawing a connection.

Next evidence:
- Searched terms: warp bubble, calculateNatarioWarpBubble, warp pipeline
- Checked files: docs/ethos/ideology.json, docs/ethos/why.md, client/src/pages/why.tsx, modules/warp/warp-module.ts
- Check files under docs or modules.
- Search docs headings for "Mission Ethos".
- Search docs headings for "Mission Ethos Seeds".
- Search docs headings for "Mission Ethos Tree".
```

### Worst #7: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
- family: relation
- question: Explain warp bubble + mission ethos for a skeptical engineer.
- failures: intent_mismatch:hybrid.concept_plus_system_mapping, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Unverified:
- No repo-evidenced claims were confirmed yet.

Reasoned connections (bounded):
- Need at least two grounded points before drawing a connection.

Next evidence:
- Searched terms: warp bubble, calculateNatarioWarpBubble, warp pipeline
- Checked files: docs/ethos/ideology.json, docs/ethos/why.md, client/src/pages/why.tsx, modules/warp/warp-module.ts
- Check files under docs or modules.
- Search docs headings for "Mission Ethos".
- Search docs headings for "Mission Ethos Seeds".
- Search docs headings for "Mission Ethos Tree".
```

### Worst #8: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
- family: relation
- question: Could warp bubble progress violate mission ethos? How is that prevented?
- failures: intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=repo.ideology_reference intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

This is in the ideology scope.

Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md
```

### Worst #9: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
- family: relation
- question: Could warp bubble progress violate mission ethos? How is that prevented?
- failures: intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=repo.ideology_reference intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

This is in the ideology scope.

Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md
```

### Worst #10: ambiguous_20_how-do-i-triage-failures-quickly
- family: ambiguous_general
- question: How do I triage failures quickly?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Answer grounded in retrieved evidence.

1. Answer grounded in retrieved evidence.

In practice, Evidence is limited; add the relevant repo file paths for stronger grounding.

Answer grounded in retrieved evidence and constrained by repo signals.
```

### Worst #11: ambiguous_20_how-do-i-triage-failures-quickly
- family: ambiguous_general
- question: How do I triage failures quickly?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Answer grounded in retrieved evidence.

1. Answer grounded in retrieved evidence.

In practice, Evidence is limited; add the relevant repo file paths for stronger grounding.

Answer grounded in retrieved evidence and constrained by repo signals.
```

### Worst #12: ambiguous_20_how-do-i-triage-failures-quickly
- family: ambiguous_general
- question: How do I triage failures quickly?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Answer grounded in retrieved evidence.

1. Answer grounded in retrieved evidence.

In practice, Evidence is limited; add the relevant repo file paths for stronger grounding.

Answer grounded in retrieved evidence and constrained by repo signals.
```

### Worst #13: repo_tech_12_where-is-relation-topology-dual-domain-detection-implemented
- family: repo_technical
- question: Where is relation topology dual-domain detection implemented?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Answer grounded in retrieved evidence.

1. Answer grounded in retrieved evidence.

In practice, Evidence is limited; add the relevant repo file paths for stronger grounding.

Answer grounded in retrieved evidence and constrained by repo signals.

Answer grounded in retrieved evidence and constrained by repo signals.
```

### Worst #14: repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c
- family: repo_technical
- question: Walk through /api/agi/ask routing from intent detection to final answer cleanup.
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Repo evidence did not include the endpoint path requested. Please point to the relevant files or paste the route snippet.

Sources: docs/knowledge/helix-ask-reasoning.md, docs/helix-ask-flow.md, docs/helix-ask-ladder.md, server/routes/agi.plan.ts, docs/helix-ask-scientific-method-gap.md, docs/knowledge/ui-backend-binding-tree.json
```

### Worst #15: repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c
- family: repo_technical
- question: Walk through /api/agi/ask routing from intent detection to final answer cleanup.
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Repo evidence did not include the endpoint path requested. Please point to the relevant files or paste the route snippet.

Sources: docs/knowledge/helix-ask-reasoning.md, docs/helix-ask-flow.md, docs/helix-ask-ladder.md, server/routes/agi.plan.ts, docs/helix-ask-scientific-method-gap.md, docs/knowledge/ui-backend-binding-tree.json
```

## Recommendation
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
