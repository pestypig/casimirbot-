# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 2c4a9397
- git_origin_main: 2c4a9397
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1772576101517
- base_url: http://localhost:5050
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 944956
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1772576101517

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 0.0% | 0.0% | 100.0% | 0.0% | 2433 | 4250 |
| repo_technical | 90 | 73.3% | 0.0% | 100.0% | 0.0% | 2829 | 8959 |
| ambiguous_general | 90 | 23.3% | 0.0% | 100.0% | 0.0% | 4260 | 7518 |

## Core Metrics
- intent_id_correct_rate: 0.00%
- report_mode_correct_rate: 100.00%
- relation_packet_built_rate: 93.33%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 0.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 62.22%
- min_text_length_pass_rate: 96.67%
- latency_total_p50_ms: 2803
- latency_total_p95_ms: 7439
- latency_retrieval_p50_ms: 195 (samples=249)
- latency_retrieval_p95_ms: 901 (samples=249)
- latency_synthesis_p50_ms: 200 (samples=270)
- latency_synthesis_p95_ms: 280 (samples=270)

## Top Failure Signatures
- citation_missing: 102
- intent_mismatch: 90
- text_too_short: 9
- relation_packet_built: 6

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: intent_mismatch:hybrid.composite_system_synthesis, text_too_short:194, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=hybrid.composite_system_synthesis intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Warp viability claims require the physics.warp.viability certificate path. Status: NOT_CERTIFIED (no certificate). First failing HARD constraint: FordRomanQI (not evaluated without certificate).
```

### Worst #2: relation_05_what-s-the-relationship-between-warp-bubble-viability-and-ideology-tree-
- family: relation
- question: What's the relationship between warp bubble viability and ideology tree commitments?
- failures: intent_mismatch:hybrid.composite_system_synthesis, text_too_short:194, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=hybrid.composite_system_synthesis intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Warp viability claims require the physics.warp.viability certificate path. Status: NOT_CERTIFIED (no certificate). First failing HARD constraint: FordRomanQI (not evaluated without certificate).
```

### Worst #3: relation_23_compare-and-connect-warp-bubble-viability-gates-with-mission-ethos-gates
- family: relation
- question: Compare and connect warp bubble viability gates with mission ethos gates.
- failures: intent_mismatch:hybrid.composite_system_synthesis, text_too_short:194, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=hybrid.composite_system_synthesis intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Warp viability claims require the physics.warp.viability certificate path. Status: NOT_CERTIFIED (no certificate). First failing HARD constraint: FordRomanQI (not evaluated without certificate).
```

### Worst #4: relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer
- family: relation
- question: Explain warp bubble + mission ethos for a skeptical engineer.
- failures: intent_mismatch:hybrid.composite_system_synthesis, relation_packet_built:undefined
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.composite_system_synthesis intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:
- The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] - In practice, 000 symbol=git-tracked file=docs/ethos/ideology.json. - Mechanism: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] Reasoned connections (bounded):
- The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] (see docs/ethos/ideology.json). In practice, 000 symbol=git-tracked file=docs/ethos/ideology.json. (see docs/ethos/ideology.json). Bounded linkage supported by cited evidence. [docs/knowledge/ethos/mission-ethos.md] Next evidence:
- Searched terms: mission overwatch intent context, warp bubble, calculateNatarioWarpBubble
- Checked files:,, docs/warp-console-architecture.md, docs/ethos/ideology.json
- Check files under docs. - Search docs headings for "Mission Ethos". [docs/knowledge/ethos/mission-ethos.md] - Search docs headings for "Mission". [docs/knowledge/ethos/mission-ethos.md] - Search docs headings for "Mission Ethos Seeds". [docs/knowledge/ethos/mission-ethos.md] Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md, docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/ethos/stewardship-ledger.md, docs/warp-console-architecture.md, docs/knowledge/ethos/verification-checklist.md, docs/warp-pulsed-power.md
```

### Worst #5: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
- family: relation
- question: Could warp bubble progress violate mission ethos? How is that prevented?
- failures: intent_mismatch:hybrid.composite_system_synthesis, relation_packet_built:undefined
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=hybrid.composite_system_synthesis intent_strategy=hybrid_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Confirmed:
- The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] - In practice, We use them to travel toward the unknown... [docs/knowledge/ethos/mission-ethos.md] - Mechanism: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] Reasoned connections (bounded):
- The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] (see docs/knowledge/ethos/ethos-knowledge-tree.json). In practice, We use them to travel toward the unknown... [docs/knowledge/ethos/mission-ethos.md] (see docs/knowledge/ethos/ethos-knowledge-tree.json). Bounded linkage supported by cited evidence. [docs/knowledge/ethos/mission-ethos.md] Next evidence:
- Searched terms: mission overwatch intent context, warp bubble, calculateNatarioWarpBubble
- Checked files:,, docs/warp-console-architecture.md, docs/ethos/ideology.json
- Check files under docs. - Search docs headings for "Mission Ethos". [docs/knowledge/ethos/mission-ethos.md] - Search docs headings for "Mission". [docs/knowledge/ethos/mission-ethos.md] - Search docs headings for "Mission Ethos Seeds". [docs/knowledge/ethos/mission-ethos.md] Sources: docs/knowledge/ethos/mission-ethos.md, docs/ethos/ideology.json, docs/ethos/why.md, docs/knowledge/ethos/ethos-knowledge-tree.json, docs/knowledge/warp/natario-zero-expansion.md, docs/knowledge/ethos/stewardship-ledger.md, docs/warp-console-architecture.md, docs/knowledge/ethos/verification-checklist.md
```

### Worst #6: ambiguous_02_what-s-a-cavity
- family: ambiguous_general
- question: What's a cavity?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a cavity is the Casimir/drive cavity mechanism where geometry, gap, and quality factor (Q) control stored energy, loss, and pipeline-level drive constraints.

- Evidence: cavity geometry and quality-factor mechanisms used by Casimir and warp-energy computations.
- Constraint: Interpretation: "cavity" is treated as Cavity Mechanism.

In practice, cavity geometry and quality-factor mechanisms used by Casimir and warp-energy computations.

Mechanism: In this repo, a cavity is the Casimir/drive cavity mechanism where geometry, gap, and quality factor (Q) control stored energy, loss, and pipeline-level drive constraints. -> constrained interaction dynamics -> cavity geometry and quality-factor mec.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #7: relation_12_how-does-the-ideology-tree-constrain-warp-bubble-deployment-decisions
- family: relation
- question: How does the ideology tree constrain warp-bubble deployment decisions?
- failures: intent_mismatch:hybrid.composite_system_synthesis
- likely_root_cause: mixed
- patch_suggestion: Tighten routing diagnostics and deterministic fallback conditions for this failure signature.
- debug: intent_id=hybrid.composite_system_synthesis intent_strategy=hybrid_explain report_mode=false relation_packet_built=true relation_dual_domain_ok=true deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] In practice, Which bubble model is used and where are its constraints checked? [docs/knowledge/warp/warp-bubble.md] Mechanism: In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] -> constrained interaction dynamics -> Which bubble model is used and where are its constraints checked?, because linked constraints. [docs/knowledge/warp/warp-bubble.md] Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. [docs/knowledge/warp/warp-bubble.md] Missing evidence: add directly relevant repo paths or artifact refs to raise confidence. [docs/knowledge/warp/warp-bubble.md] Sources: docs/knowledge/physics/viability-definition.md, docs/knowledge/physics/gr-solver-tree.json, modules/warp/warp-module.ts, modules/warp/natario-warp.ts

Sources: docs/knowledge/warp/warp-bubble.md, modules/warp/warp-module.ts, modules/warp/natario-warp.ts, docs/knowledge/physics/viability-definition.md, docs/knowledge/physics/gr-solver-tree.json, docs/ethos/ideology.json, docs/knowledge/bridges/ideology-physics-bridge-tree.json, docs/knowledge/physics/math-maturity-stages.md
```

### Worst #8: ambiguous_26_how-do-seeds-help-evaluation-reliability
- family: ambiguous_general
- question: How do seeds help evaluation reliability?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.general_how_to_process intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

1. Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

### Worst #9: ambiguous_27_what-s-a-robust-pass-criterion-for-prompts
- family: ambiguous_general
- question: What's a robust pass criterion for prompts?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

### Worst #10: ambiguous_23_what-is-a-practical-debug-payload-used-for
- family: ambiguous_general
- question: What is a practical debug payload used for?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, coupled constraints and feedback loops determine how outcomes evolve over time.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #11: ambiguous_03_explain-resonance-in-simple-terms
- family: ambiguous_general
- question: Explain resonance in simple terms.
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

### Worst #12: ambiguous_06_help-me-compare-precision-and-recall-quickly
- family: ambiguous_general
- question: Help me compare precision and recall quickly.
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Numerical precision describes how floating-point rounding and truncation affect reported values.

- Evidence: Interpretation: "precision" is treated as numerical-precision.
- Constraint: What tolerances are assumed and where are they enforced?

In practice, Interpretation: "precision" is treated as numerical-precision.

Mechanism: Numerical precision describes how floating-point rounding and truncation affect reported values. -> constrained interaction dynamics -> Interpretation: "precision" is treated as numerical-precision., because linked constraints amplify or dampen outc.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #13: repo_tech_26_explain-how-answer-path-is-populated-and-useful-for-diagnostics
- family: repo_technical
- question: Explain how answer_path is populated and useful for diagnostics.
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

### Worst #14: ambiguous_10_what-is-model-drift
- family: ambiguous_general
- question: What is model drift?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, coupled constraints and feedback loops determine how outcomes evolve over time.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #15: ambiguous_08_what-s-a-good-way-to-summarize-evidence
- family: ambiguous_general
- question: What's a good way to summarize evidence?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

In practice, coupled constraints and feedback loops determine how outcomes evolve over time.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

## Recommendation
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
