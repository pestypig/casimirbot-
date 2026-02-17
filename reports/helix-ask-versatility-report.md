# Helix Ask Versatility Evaluation Report

- run_id: versatility-1771359744696
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 493436
- terminated_early_reason: none
- global_cooldown_applied_ms: 119003
- output_run_dir: /workspace/casimirbot-/artifacts/experiments/helix-ask-versatility/versatility-1771359744696

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 82.2% | 85.6% | 95.6% | 0.0% | 329 | 514 |
| repo_technical | 90 | 50.0% | 0.0% | 83.3% | 23.3% | 582 | 1569 |
| ambiguous_general | 90 | 40.0% | 0.0% | 93.3% | 20.0% | 633 | 1229 |

## Core Metrics
- intent_id_correct_rate: 85.56%
- report_mode_correct_rate: 90.74%
- relation_packet_built_rate: 82.22%
- relation_dual_domain_ok_rate: 82.22%
- avg_attempts_per_run: 1.24
- p95_attempts_per_run: 4
- stub_text_detected_rate: 14.44%
- deterministic_fallback_relation_rate: 82.22%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 68.52%
- min_text_length_pass_rate: 68.52%
- latency_total_p50_ms: 487
- latency_total_p95_ms: 1380
- latency_retrieval_p50_ms: 173 (samples=250)
- latency_retrieval_p95_ms: 307 (samples=250)
- latency_synthesis_p50_ms: 1 (samples=266)
- latency_synthesis_p95_ms: 6 (samples=266)

## Top Failure Signatures
- citation_missing: 85
- text_too_short: 85
- stub_text_detected: 39
- report_mode_mismatch: 25
- relation_packet_built: 16
- relation_dual_domain: 16
- bridge_count_low: 16
- evidence_count_low: 16
- intent_mismatch: 13
- request_failed: 4

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #2: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #3: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #4: relation_20_how-does-casimir-verification-connect-to-ideology-accountability-in-warp
- family: relation
- question: How does Casimir verification connect to ideology accountability in warp work?
- failures: request_failed:503, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #5: relation_12_how-does-the-ideology-tree-constrain-warp-bubble-deployment-decisions
- family: relation
- question: How does the ideology tree constrain warp-bubble deployment decisions?
- failures: intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:158
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=repo.ideology_reference intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In plain language, Mission Ethos Tree means # Mission Ethos Tree.

Sources: docs/knowledge/trees/mission-ethos-tree.md, docs/knowledge/mission-ethos-tree.json
```

### Worst #6: relation_12_how-does-the-ideology-tree-constrain-warp-bubble-deployment-decisions
- family: relation
- question: How does the ideology tree constrain warp-bubble deployment decisions?
- failures: intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:158
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=repo.ideology_reference intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In plain language, Mission Ethos Tree means # Mission Ethos Tree.

Sources: docs/knowledge/trees/mission-ethos-tree.md, docs/knowledge/mission-ethos-tree.json
```

### Worst #7: relation_12_how-does-the-ideology-tree-constrain-warp-bubble-deployment-decisions
- family: relation
- question: How does the ideology tree constrain warp-bubble deployment decisions?
- failures: intent_mismatch:repo.ideology_reference, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:158
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=repo.ideology_reference intent_strategy=repo_rag report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In plain language, Mission Ethos Tree means # Mission Ethos Tree.

Sources: docs/knowledge/trees/mission-ethos-tree.md, docs/knowledge/mission-ethos-tree.json
```

### Worst #8: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
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

### Worst #9: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
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

### Worst #10: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
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

### Worst #11: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
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

### Worst #12: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
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

### Worst #13: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
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

### Worst #14: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
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

### Worst #15: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
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

## Recommendation
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
