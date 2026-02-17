# Helix Ask Crossover Ablation Report

- Endpoint: `POST /api/agi/ask`
- Debug mode: `true`
- Prompt pack: `artifacts/experiments/helix-ask-crossover/prompts.jsonl`
- Prompts: 120
- Seeds: 7, 11, 13
- Variants: A_deterministic_core, B_det_cards_llm_contract, C_llm_cards_det_contract, D_current_adaptive, E_det_e2e_with_optional_narration

## Aggregate Metrics

### A_deterministic_core
- sample_count: 360
- p95_latency_ms: 11.05
- infra_fail_rate: 100.00%
- parse_fail_rate: 0.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000
- successful_samples_only.count: 0
- successful_samples_only.crossover_completeness_mean: 0.0000

### B_det_cards_llm_contract
- sample_count: 360
- p95_latency_ms: 30.00
- infra_fail_rate: 100.00%
- parse_fail_rate: 0.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000
- successful_samples_only.count: 0
- successful_samples_only.crossover_completeness_mean: 0.0000

### C_llm_cards_det_contract
- sample_count: 360
- p95_latency_ms: 40.00
- infra_fail_rate: 100.00%
- parse_fail_rate: 0.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000
- successful_samples_only.count: 0
- successful_samples_only.crossover_completeness_mean: 0.0000

### D_current_adaptive
- sample_count: 360
- p95_latency_ms: 39.05
- infra_fail_rate: 100.00%
- parse_fail_rate: 0.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000
- successful_samples_only.count: 0
- successful_samples_only.crossover_completeness_mean: 0.0000

### E_det_e2e_with_optional_narration
- sample_count: 360
- p95_latency_ms: 53.00
- infra_fail_rate: 100.00%
- parse_fail_rate: 0.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000
- successful_samples_only.count: 0
- successful_samples_only.crossover_completeness_mean: 0.0000

## Top Failure Signatures

### A_deterministic_core
- infra_unavailable: 360 (100.00%)

### B_det_cards_llm_contract
- infra_unavailable: 360 (100.00%)

### C_llm_cards_det_contract
- infra_unavailable: 360 (100.00%)

### D_current_adaptive
- infra_unavailable: 360 (100.00%)

### E_det_e2e_with_optional_narration
- infra_unavailable: 360 (100.00%)

## Paired Deltas vs D_current_adaptive

- A_deterministic_core: quality_delta mean=0.0000 [0.0000, 0.0000], latency_delta_ms mean=-5.05 [-7.60, -3.05]
- B_det_cards_llm_contract: quality_delta mean=0.0000 [0.0000, 0.0000], latency_delta_ms mean=-3.56 [-6.35, -1.53]
- C_llm_cards_det_contract: quality_delta mean=0.0000 [0.0000, 0.0000], latency_delta_ms mean=-0.51 [-2.14, 1.15]
- E_det_e2e_with_optional_narration: quality_delta mean=0.0000 [0.0000, 0.0000], latency_delta_ms mean=5.60 [3.18, 8.18]

## Validity Note

Because all `(prompt_id, seed)` executions failed before answer generation, this run is **infrastructure-failure dominated** and cannot support quality deltas on successful samples.

## Decision

- decision: **default_deterministic**
- preferred_default_variant: **A_deterministic_core**
- quality gate met: **false**
- latency/cost gate met: **false**

## Reproducibility

See `summary.json` and per-run raw payloads under each variant raw directory.
