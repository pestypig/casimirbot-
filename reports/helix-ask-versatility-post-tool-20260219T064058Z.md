# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: work
- git_head: 48dbb8b
- git_origin_main: missing
- git_ahead_behind: missing
- provenance_gate_pass: false
- provenance_warnings: git_origin_remote_missing, git_origin_main_ref_missing
- decision_grade_ready: false
- provenance_blocked: true
- run_id: versatility-1771483259807
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 165720
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: /workspace/casimirbot-/artifacts/experiments/helix-ask-versatility-post-tool/versatility-1771483259807

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 86.7% | 93.3% | 100.0% | 0.0% | 355 | 449 |
| repo_technical | 90 | 83.3% | 0.0% | 83.3% | 0.0% | 612 | 1603 |
| ambiguous_general | 90 | 83.3% | 0.0% | 93.3% | 0.0% | 649 | 1318 |

## Core Metrics
- intent_id_correct_rate: 93.33%
- report_mode_correct_rate: 92.22%
- relation_packet_built_rate: 86.67%
- relation_dual_domain_ok_rate: 86.67%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 86.67%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 96.67%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 497
- latency_total_p95_ms: 1422
- latency_retrieval_p50_ms: 164 (samples=256)
- latency_retrieval_p95_ms: 301 (samples=256)
- latency_synthesis_p50_ms: 1 (samples=270)
- latency_synthesis_p95_ms: 8 (samples=270)

## Top Failure Signatures
- report_mode_mismatch: 21
- relation_packet_built: 12
- relation_dual_domain: 12
- bridge_count_low: 12
- evidence_count_low: 12
- citation_missing: 9
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

Mechanism: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. -> coupled constraints and feedback operators -> observable outcomes tied to docs/ethos/ideology.json, because feedback loops shape the resulting behavior.

Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached.

Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity.

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

Mechanism: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. -> coupled constraints and feedback operators -> observable outcomes tied to docs/ethos/ideology.json, because feedback loops shape the resulting behavior.

Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached.

Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity.

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

Mechanism: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. -> coupled constraints and feedback operators -> observable outcomes tied to docs/ethos/ideology.json, because feedback loops shape the resulting behavior.

Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached.

Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity.

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

### Worst #7: relation_18_warp-ethos-relation-prompt-test-explain-links-and-guardrails
- family: relation
- question: warp/ethos relation prompt test: explain links and guardrails
- failures: relation_packet_built:false, relation_dual_domain:false, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

- Definition: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.
- Evidence: Notes: Tags: stewardship, compassion; , beginners-mind, struggle-testament, devotion-course, worldview-integrity (+28 more).

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: docs/knowledge/ethos/mission-ethos.md
```

### Worst #8: relation_18_warp-ethos-relation-prompt-test-explain-links-and-guardrails
- family: relation
- question: warp/ethos relation prompt test: explain links and guardrails
- failures: relation_packet_built:false, relation_dual_domain:false, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

- Definition: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.
- Evidence: Notes: Tags: stewardship, compassion; , beginners-mind, struggle-testament, devotion-course, worldview-integrity (+28 more).

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: docs/knowledge/ethos/mission-ethos.md
```

### Worst #9: relation_18_warp-ethos-relation-prompt-test-explain-links-and-guardrails
- family: relation
- question: warp/ethos relation prompt test: explain links and guardrails
- failures: relation_packet_built:false, relation_dual_domain:false, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.

- Definition: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.
- Evidence: Notes: Tags: stewardship, compassion; , beginners-mind, struggle-testament, devotion-course, worldview-integrity (+28 more).

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Sources: docs/knowledge/ethos/mission-ethos.md
```

### Worst #10: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: relation_packet_built:false, relation_dual_domain:false, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. Key questions include: Which bubble model is used and where are its constraints checked? See modules/warp/warp-module.ts and modules/warp/natario-warp.ts for the implementation.

In practice, those standards guide how evidence and justification are weighed in specific contexts.

Sources: docs/knowledge/warp/warp-bubble.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/knowledge/warp/natario-zero-expansion.md, docs/stellar-consciousness-orch-or-review.md, docs/warp-console-architecture.md, docs/knowledge/warp/shift-vector-expansion-scalar.md, docs/knowledge/warp/warp-mechanics-tree.json
```

### Worst #11: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: relation_packet_built:false, relation_dual_domain:false, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. Key questions include: Which bubble model is used and where are its constraints checked? See modules/warp/warp-module.ts and modules/warp/natario-warp.ts for the implementation.

In practice, those standards guide how evidence and justification are weighed in specific contexts.

Sources: docs/knowledge/warp/warp-bubble.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/knowledge/warp/natario-zero-expansion.md, docs/stellar-consciousness-orch-or-review.md, docs/warp-console-architecture.md, docs/knowledge/warp/shift-vector-expansion-scalar.md, docs/knowledge/warp/warp-mechanics-tree.json
```

### Worst #12: relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics
- family: relation
- question: How do we connect Natario warp bubble constraints to mission ethics?
- failures: relation_packet_built:false, relation_dual_domain:false, bridge_count_low:0, evidence_count_low:0
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.warp_ethos_relation intent_strategy=hybrid_explain report_mode=false relation_packet_built=false relation_dual_domain_ok=false deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. Key questions include: Which bubble model is used and where are its constraints checked? See modules/warp/warp-module.ts and modules/warp/natario-warp.ts for the implementation.

In practice, those standards guide how evidence and justification are weighed in specific contexts.

Sources: docs/knowledge/warp/warp-bubble.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/knowledge/warp/natario-zero-expansion.md, docs/stellar-consciousness-orch-or-review.md, docs/warp-console-architecture.md, docs/knowledge/warp/shift-vector-expansion-scalar.md, docs/knowledge/warp/warp-mechanics-tree.json
```

### Worst #13: ambiguous_01_define-lattice
- family: ambiguous_general
- question: Define lattice.
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Key questions: How many sectors are active and how is the lattice scheduled? Notes: The lattice logic is refl...

- Definition: Key questions: How many sectors are active and how is the lattice scheduled? Notes: The lattice logic is refl...
- Evidence: Key questions: How many sectors are active and how is the lattice scheduled?
- Constraint: Notes: The lattice logic is refl...

In practice, Key questions: How many sectors are active and how is the lattice scheduled?

Sources: docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/natario-zero-expansion.md, docs/knowledge/warp/shift-vector-expansion-scalar.md, docs/knowledge/resonance-tree.json, docs/knowledge/physics/brick-lattice-dataflow-tree.json, docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/casimir-lattice.md, docs/knowledge/trees/panel-concepts-tree.md
```

### Worst #14: ambiguous_01_define-lattice
- family: ambiguous_general
- question: Define lattice.
- failures: report_mode_mismatch:true
- likely_root_cause: routing_or_report_mode_policy
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Key questions: How many sectors are active and how is the lattice scheduled? Notes: The lattice logic is refl...

- Definition: Key questions: How many sectors are active and how is the lattice scheduled? Notes: The lattice logic is refl...
- Evidence: Key questions: How many sectors are active and how is the lattice scheduled?
- Constraint: Notes: The lattice logic is refl...

In practice, Key questions: How many sectors are active and how is the lattice scheduled?

Sources: docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/natario-zero-expansion.md, docs/knowledge/warp/shift-vector-expansion-scalar.md, docs/knowledge/resonance-tree.json, docs/knowledge/physics/brick-lattice-dataflow-tree.json, docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/casimir-lattice.md, docs/knowledge/trees/panel-concepts-tree.md
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
Key questions: How many sectors are active and how is the lattice scheduled? Notes: The lattice logic is refl...

- Definition: Key questions: How many sectors are active and how is the lattice scheduled? Notes: The lattice logic is refl...
- Evidence: Key questions: How many sectors are active and how is the lattice scheduled?
- Constraint: Notes: The lattice logic is refl...

In practice, Key questions: How many sectors are active and how is the lattice scheduled?

Sources: docs/knowledge/warp/warp-bubble.md, docs/knowledge/warp/natario-zero-expansion.md, docs/knowledge/warp/shift-vector-expansion-scalar.md, docs/knowledge/resonance-tree.json, docs/knowledge/physics/brick-lattice-dataflow-tree.json, docs/knowledge/warp/warp-mechanics-tree.json, docs/knowledge/warp/casimir-lattice.md, docs/knowledge/trees/panel-concepts-tree.md
```

## Recommendation
- decision: needs_patch
- [0] Validation provenance gate: Require origin/main + HEAD provenance in reports before accepting decision-grade outcomes.
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
