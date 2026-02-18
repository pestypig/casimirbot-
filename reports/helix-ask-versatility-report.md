# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: work
- git_head: 01214d9
- git_origin_main: missing
- git_ahead_behind: missing
- provenance_gate_pass: false
- provenance_warnings: git_origin_remote_missing, git_origin_main_ref_missing
- decision_grade_ready: false
- provenance_blocked: true
- run_id: versatility-1771443635627
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 218350
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: /workspace/casimirbot-/artifacts/experiments/helix-ask-versatility/versatility-1771443635627

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 90.0% | 93.3% | 100.0% | 0.0% | 460 | 640 |
| repo_technical | 90 | 83.3% | 0.0% | 83.3% | 0.0% | 870 | 2131 |
| ambiguous_general | 90 | 90.0% | 0.0% | 93.3% | 0.0% | 854 | 1648 |

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
- citation_presence_rate: 97.78%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 663
- latency_total_p95_ms: 1953
- latency_retrieval_p50_ms: 234 (samples=258)
- latency_retrieval_p95_ms: 409 (samples=258)
- latency_synthesis_p50_ms: 1 (samples=270)
- latency_synthesis_p95_ms: 1 (samples=270)

## Top Failure Signatures
- report_mode_mismatch: 21
- relation_packet_built: 9
- relation_dual_domain: 9
- bridge_count_low: 9
- evidence_count_low: 9
- citation_missing: 6
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
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

Notes: Tags: stewardship, compassion; , beginners-mind, struggle-testament, devotion-course, worldview-integrity (+28 more).

Mechanism: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/warp-console-architecture.md, server/routes/ethos.ts, docs/knowledge/ethos/ethos-knowledge-tree.json
```

### Worst #2: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
- family: relation
- question: Explain warp bubble + mission ethos for a skeptical engineer.
- failures: intent_mismatch:hybrid.concept_plus_system_mapping, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

Notes: Tags: stewardship, compassion; , beginners-mind, struggle-testament, devotion-course, worldview-integrity (+28 more).

Mechanism: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/warp-console-architecture.md, server/routes/ethos.ts, docs/knowledge/ethos/ethos-knowledge-tree.json
```

### Worst #3: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
- family: relation
- question: Explain warp bubble + mission ethos for a skeptical engineer.
- failures: intent_mismatch:hybrid.concept_plus_system_mapping, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

Notes: Tags: stewardship, compassion; , beginners-mind, struggle-testament, devotion-course, worldview-integrity (+28 more).

Mechanism: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/warp-console-architecture.md, server/routes/ethos.ts, docs/knowledge/ethos/ethos-knowledge-tree.json
```

### Worst #4: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
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

### Worst #6: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
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

### Worst #7: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
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

### Worst #8: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
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

### Worst #10: repo_tech_11_show-pipeline-stages-captured-in-debug-live-events-for-helix-ask
- family: repo_technical
- question: Show pipeline stages captured in debug live events for Helix Ask.
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Unverified:
- No repo-evidenced claims were confirmed yet.

Reasoned connections (bounded):
- Need at least two grounded points before drawing a connection.

Next evidence:
- Searched terms: helix ask, helix ask flow, helix ask pipeline, buildGroundedAskPrompt
- Checked files: client/src/pages/desktop.tsx, client/src/lib/agi/api.ts, docs/helix-ask-flow.md, docs/knowledge/helix-ask-tree.json
- Check files under client or docs.
- Check docs/knowledge/trees/helix-ask-tree.md for "helix_ask_tree".
- Check docs/knowledge/physics/math-maturity-stages.md for "math_maturity_stages".
- Search docs headings for "Helix Ask Reasoning Pipeline".
```

### Worst #11: repo_tech_15_how-does-the-system-prevent-report-scaffold-responses-for-relation-promp
- family: repo_technical
- question: How does the system prevent report-scaffold responses for relation prompts?
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
# Trace and Essence System Tree.

# Trace and Essence System Tree.

A second grounded claim from docs/knowledge/trace-system-tree.json narrows uncertainty and prevents generic fallback text.

Mechanism: # Trace and Essence System Tree. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Sources: docs/knowledge/trees/trace-system-tree.md, docs/knowledge/trace-system-tree.json, client/src/lib/agi/api.ts, client/src/components/agi/essence.tsx, client/src/components/agi/JobsBudgetModal.tsx, server/db/agi.ts, client/src/components/agi/DebateView.tsx, server/services/essence/solar-surface-coherence.ts
```

### Worst #12: repo_tech_15_how-does-the-system-prevent-report-scaffold-responses-for-relation-promp
- family: repo_technical
- question: How does the system prevent report-scaffold responses for relation prompts?
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
# Trace and Essence System Tree.

# Trace and Essence System Tree.

A second grounded claim from docs/knowledge/trace-system-tree.json narrows uncertainty and prevents generic fallback text.

Mechanism: # Trace and Essence System Tree. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Sources: docs/knowledge/trees/trace-system-tree.md, docs/knowledge/trace-system-tree.json, client/src/lib/agi/api.ts, client/src/components/agi/essence.tsx, client/src/components/agi/JobsBudgetModal.tsx, server/db/agi.ts, client/src/components/agi/DebateView.tsx, server/services/essence/solar-surface-coherence.ts
```

### Worst #13: repo_tech_15_how-does-the-system-prevent-report-scaffold-responses-for-relation-promp
- family: repo_technical
- question: How does the system prevent report-scaffold responses for relation prompts?
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.concept_plus_system_mapping intent_strategy=hybrid_explain report_mode=true relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
# Trace and Essence System Tree.

# Trace and Essence System Tree.

A second grounded claim from docs/knowledge/trace-system-tree.json narrows uncertainty and prevents generic fallback text.

Mechanism: # Trace and Essence System Tree. This causes downstream outcomes because multiple linked conditions compound over time rather than acting in isolation.

Sources: docs/knowledge/trees/trace-system-tree.md, docs/knowledge/trace-system-tree.json, client/src/lib/agi/api.ts, client/src/components/agi/essence.tsx, client/src/components/agi/JobsBudgetModal.tsx, server/db/agi.ts, client/src/components/agi/DebateView.tsx, server/services/essence/solar-surface-coherence.ts
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

### Worst #15: ambiguous_01_define-lattice
- family: ambiguous_general
- question: Define lattice.
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Unverified:

No confirmed evidence was found yet.

Reasoned connections (bounded):

Need at least two grounded points before drawing a connection.

Sources: docs/knowledge/warp/casimir-lattice.md, server/energy-pipeline.ts, docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/natario-zero-expansion.md, docs/knowledge/warp/shift-vector-expansion-scalar.md, docs/knowledge/resonance-tree.json, docs/knowledge/physics/brick-lattice-dataflow-tree.json, docs/knowledge/warp/warp-mechanics-tree.json
```

## Recommendation
- decision: needs_patch
- [0] Validation provenance gate: Require origin/main + HEAD provenance in reports before accepting decision-grade outcomes.
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
