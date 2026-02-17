# Helix Ask Versatility Evaluation Report

- run_id: versatility-1771313339773
- base_url: http://127.0.0.1:5173
- prompts: 90
- seeds: 7,11,13
- temperatures: 0.2
- total_runs: 270

## Aggregate by Prompt Family
| family | runs | pass_rate | intent_correct_rate | report_mode_correct_rate | stub_rate | latency_p50_ms | latency_p95_ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| relation | 90 | 26.7% | 40.0% | 61.1% | 13.3% | 414 | 546 |
| repo_technical | 90 | 20.0% | 0.0% | 58.9% | 25.6% | 619 | 2063 |
| ambiguous_general | 90 | 40.0% | 0.0% | 93.3% | 20.0% | 843 | 1752 |

## Core Metrics
- intent_id_correct_rate: 40.00%
- report_mode_correct_rate: 71.11%
- relation_packet_built_rate: 40.00%
- relation_dual_domain_ok_rate: 40.00%
- stub_text_detected_rate: 19.63%
- deterministic_fallback_relation_rate: 0.00%
- contract_parse_fail_relation_rate: 0.00%
- citation_repair_rate: 0.00%
- citation_presence_rate: 40.74%
- min_text_length_pass_rate: 40.74%
- latency_total_p50_ms: 582
- latency_total_p95_ms: 1752
- latency_retrieval_p50_ms: 261 (samples=205)
- latency_retrieval_p95_ms: 386 (samples=205)
- latency_synthesis_p50_ms: 1 (samples=208)
- latency_synthesis_p95_ms: 6 (samples=208)

## Top Failure Signatures
- text_too_short: 160
- citation_missing: 160
- report_mode_mismatch: 78
- request_failed: 62
- intent_mismatch: 54
- relation_packet_built: 54
- relation_dual_domain: 54
- bridge_count_low: 54
- evidence_count_low: 54
- stub_text_detected: 53

## Tie-in vs Prior Reports
- This campaign extends relation-mode coverage beyond goal-zone by adding repo-technical and ambiguous prompt families at production endpoint scale.
- Compared with `reports/helix-ask-evidence-cards-ab.md` (A/B/C all had `n_valid=0`, `invalid_rate=1.0`), this run produced 270 endpoint-complete samples and non-zero quality signals, making it suitable for triage-level routing/fallback decisions.
- Compared with `reports/helix-ask-crossover-ablation-report.md` (all variants `infra_fail_rate=100%`), this run reduced infra-failure dominance and exposed actionable quality failures: relation packet built rate 40.0%, report-mode correctness 71.11%, citation presence 40.74%.
- Decision should prefer real-model reruns for release-grade quality gates whenever stub-text rate is non-zero (current stub-text rate: 19.63%).

## 15 Worst Examples
### Worst #1: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #2: relation_19_how-do-certificate-integrity-and-mission-ethos-cohere-for-warp-bubble-wo
- family: relation
- question: How do certificate integrity and mission ethos cohere for warp bubble work?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #3: relation_20_how-does-casimir-verification-connect-to-ideology-accountability-in-warp
- family: relation
- question: How does Casimir verification connect to ideology accountability in warp work?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #4: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
- family: relation
- question: Could warp bubble progress violate mission ethos? How is that prevented?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #5: relation_05_what-s-the-relationship-between-warp-bubble-viability-and-ideology-tree-
- family: relation
- question: What's the relationship between warp bubble viability and ideology tree commitments?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #6: relation_22_which-shared-constraints-bind-warp-bubble-engineering-to-ideology-values
- family: relation
- question: Which shared constraints bind warp bubble engineering to ideology values?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #7: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #8: relation_20_how-does-casimir-verification-connect-to-ideology-accountability-in-warp
- family: relation
- question: How does Casimir verification connect to ideology accountability in warp work?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #9: relation_22_which-shared-constraints-bind-warp-bubble-engineering-to-ideology-values
- family: relation
- question: Which shared constraints bind warp bubble engineering to ideology values?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #10: relation_23_compare-and-connect-warp-bubble-viability-gates-with-mission-ethos-gates
- family: relation
- question: Compare and connect warp bubble viability gates with mission ethos gates.
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #11: relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented
- family: relation
- question: Could warp bubble progress violate mission ethos? How is that prevented?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #12: relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th
- family: relation
- question: Explain the relation between warp bubble physics and mission ethos in this repo.
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #13: relation_05_what-s-the-relationship-between-warp-bubble-viability-and-ideology-tree-
- family: relation
- question: What's the relationship between warp bubble viability and ideology tree commitments?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #14: relation_05_what-s-the-relationship-between-warp-bubble-viability-and-ideology-tree-
- family: relation
- question: What's the relationship between warp bubble viability and ideology tree commitments?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

### Worst #15: relation_11_in-one-clear-narrative-why-does-mission-ethos-matter-for-warp-bubble-cla
- family: relation
- question: In one clear narrative: why does mission ethos matter for warp bubble claims?
- failures: request_failed:400, intent_mismatch:missing, report_mode_mismatch:undefined, relation_packet_built:undefined, relation_dual_domain:undefined, bridge_count_low:0, evidence_count_low:0, text_too_short:0, citation_missing
- likely_root_cause: relation_topology_or_context_gap
- patch_suggestion: Add relation-specific fallback enforcement when intent_id resolves to hybrid.warp_ethos_relation.
- debug: intent_id=undefined intent_strategy=undefined report_mode=undefined relation_packet_built=undefined relation_dual_domain_ok=undefined deterministic_fallback_used_relation=undefined contract_parse_fail_rate_relation=undefined citation_repair=undefined
- final_answer:
```text

```

## Recommendation
- decision: needs_patch
- [1] Relation-mode fallback hardening: Increase deterministic fallback usage when relation intent is selected but generated answer omits warp/ethos linkage signals.
- [2] Citation persistence guard: Guarantee hybrid/repo responses keep at least one valid Sources line after final cleanup and repairs.
- [3] Stub environment policy split: Separate decision-grade campaigns from stub-mode smoke runs to avoid polluted quality metrics.
