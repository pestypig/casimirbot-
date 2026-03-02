# Helix Ask Versatility Evaluation Report

- summary_schema_version: 2
- git_branch: main
- git_head: 75557ef5
- git_origin_main: 75557ef5
- git_ahead_behind: 0	0
- provenance_gate_pass: true
- provenance_warnings: none
- decision_grade_ready: true
- provenance_blocked: false
- provenance_hard_blocker_reason: none
- ship_recommendation_blocked_by_hard_blocker: false
- run_id: versatility-1772431929234
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- run_complete: true
- completion_rate: 100.00%
- run_duration_ms: 725790
- terminated_early_reason: none
- global_cooldown_applied_ms: 0
- resumed_from_latest: false
- resumed_runs: 0
- output_run_dir: C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\experiments\helix-ask-versatility\versatility-1772431929234

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 90.0% | 90.0% | 100.0% | 0.0% | 1285 | 3024 |
| repo_technical | 90 | 70.0% | 0.0% | 100.0% | 0.0% | 1567 | 11805 |
| ambiguous_general | 90 | 40.0% | 0.0% | 96.7% | 0.0% | 3893 | 5432 |

## Core Metrics
- intent_id_correct_rate: 90.00%
- report_mode_correct_rate: 98.89%
- relation_packet_built_rate: 100.00%
- relation_dual_domain_ok_rate: 100.00%
- avg_attempts_per_run: 1.00
- p95_attempts_per_run: 1
- stub_text_detected_rate: 0.00%
- deterministic_fallback_relation_rate: 83.33%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 74.44%
- min_text_length_pass_rate: 100.00%
- latency_total_p50_ms: 1584
- latency_total_p95_ms: 8547
- latency_retrieval_p50_ms: 184 (samples=230)
- latency_retrieval_p95_ms: 774 (samples=230)
- latency_synthesis_p50_ms: 1 (samples=258)
- latency_synthesis_p95_ms: 1 (samples=258)

## Top Failure Signatures
- citation_missing: 69
- runtime_fallback_answer: 12
- intent_mismatch: 9
- report_mode_mismatch: 3

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Evidence-card and crossover studies emphasized quality/latency tradeoffs under controlled prompt sets; this report adds durability tracking across 90 prompt formulations with 3 seeded runs each.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero.

## 15 Worst Examples
### Worst #1: ambiguous_04_what-is-stability
- family: ambiguous_general
- question: What is stability?
- failures: report_mode_mismatch:true, citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=true relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Stability constraints determine how small time steps must be to avoid numerical blow-up. How is the timestep chosen and which limits are enforced? Notes...

Stability constraints determine how small time steps must be to avoid numerical blow-up. How is the timestep chosen and which limits are enforced? Notes...

Mechanism: Stability constraints determine how small time steps must be to avoid numerical blow-up. How is the timestep chosen and which limits are enforced? Notes... -> constrained interaction dynamics -> Stability constraints determine how small time steps m.

Mechanism: Stability constraints determine how small time steps must be to avoid numerical blow-up. How is the timestep chosen and which limits are enforced? Notes... -> coupled constraints and feedback operators -> observable outcomes tied to, because feedback loops shape the resulting behavior.

Maturity (exploratory): this answer is mechanism-grounded but remains non-certified until dedicated tests and certificate-linked evidence are attached.

Missing evidence: provide higher-fidelity measurements and verification artifacts to move toward diagnostic/certified maturity.
```

### Worst #2: repo_tech_14_what-determines-relation-packet-bridge-count-and-evidence-count
- family: repo_technical
- question: What determines relation_packet_bridge_count and evidence_count?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

### Worst #3: repo_tech_17_explain-retrieval-confidence-and-deterministic-contract-signal-threshold
- family: repo_technical
- question: Explain retrieval confidence and deterministic contract signal thresholds.
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

### Worst #4: repo_tech_16_where-are-citation-allowlists-normalized-before-sanitizesourcesline
- family: repo_technical
- question: Where are citation allowlists normalized before sanitizeSourcesLine?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

### Worst #5: ambiguous_23_what-is-a-practical-debug-payload-used-for
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

### Worst #6: ambiguous_27_what-s-a-robust-pass-criterion-for-prompts
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

### Worst #7: ambiguous_26_how-do-seeds-help-evaluation-reliability
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

### Worst #8: ambiguous_06_help-me-compare-precision-and-recall-quickly
- family: ambiguous_general
- question: Help me compare precision and recall quickly.
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Viability in this repo means the constraint gates pass and a certificate is admissible; it is not a claim of real-world feasibility. Which gates must pa...

- Evidence: Energy conditions (NEC, WEC, SEC, DEC) are inequalities that restrict stress-energy tensors to physically reasonable regimes. Which conditions are check...
- Constraint: Numerical precision describes how floating-point rounding and truncation affect reported values. What tolerances are assumed and where are they enforced...

In practice, Energy conditions (NEC, WEC, SEC, DEC) are inequalities that restrict stress-energy tensors to physically reasonable regimes. Which conditions are check...

Mechanism: Viability in this repo means the constraint gates pass and a certificate is admissible; it is not a claim of real-world feasibility. Which gates must pa... -> constrained interaction dynamics -> Energy conditions (NEC, WEC, SEC, DEC) are inequalitie.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #9: ambiguous_29_explain-why-short-prompts-can-confuse-routing
- family: ambiguous_general
- question: Explain why short prompts can confuse routing.
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

### Worst #10: repo_tech_26_explain-how-answer-path-is-populated-and-useful-for-diagnostics
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

### Worst #11: ambiguous_01_define-lattice
- family: ambiguous_general
- question: Define lattice.
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.conceptual_define_compare intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
How many sectors are active and...

In practice, coupled constraints and feedback loops determine how outcomes evolve over time.

Mechanism: How many sectors are active and... -> constrained interaction dynamics -> How many sectors are active and..., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add directly relevant repo paths or artifact refs to raise confidence.
```

### Worst #12: ambiguous_03_explain-resonance-in-simple-terms
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

### Worst #13: ambiguous_09_can-you-explain-system-integrity-for-non-experts
- family: ambiguous_general
- question: Can you explain system integrity for non-experts?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

### Worst #14: ambiguous_16_how-can-ambiguity-be-reduced-in-prompts
- family: ambiguous_general
- question: How can ambiguity be reduced in prompts?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

### Worst #15: ambiguous_17_when-should-i-request-citations
- family: ambiguous_general
- question: When should I request citations?
- failures: citation_missing
- likely_root_cause: citation_cleanup_or_contract_fill_gap
- patch_suggestion: Strengthen citation fallback append after final cleaning for hybrid/repo outputs.
- debug: intent_id=general.fallback intent_strategy=general_explain report_mode=false relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text
Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

In practice, Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.

Mechanism: Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete. -> constrained interaction dynamics -> Evidence is limited in current retrieval; claims are bounded to available artifacts and may be incomplete., because linked constraints amplify or dampen outcomes over time.

Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.

Missing evidence: add stronger repo citations and linked test artifacts before upgrading maturity.
```

## Recommendation
- decision: ship
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
