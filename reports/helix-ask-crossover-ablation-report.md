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
- parse_fail_rate: 100.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000

### B_det_cards_llm_contract
- sample_count: 360
- p95_latency_ms: 30.00
- parse_fail_rate: 100.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000

### C_llm_cards_det_contract
- sample_count: 360
- p95_latency_ms: 40.00
- parse_fail_rate: 100.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000

### D_current_adaptive
- sample_count: 360
- p95_latency_ms: 39.05
- parse_fail_rate: 100.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000

### E_det_e2e_with_optional_narration
- sample_count: 360
- p95_latency_ms: 53.00
- parse_fail_rate: 100.00%
- evidence_gate_pass_rate: 0.00%
- slot_coverage_pass_rate: 0.00%
- crossover_completeness_mean: 0.0000
- citation_validity_rate: 0.0000

## Paired Deltas vs D_current_adaptive

- A_deterministic_core: quality_delta mean=0.0000 [0.0000, 0.0000], latency_delta_ms mean=-5.05 [-7.60, -3.05]
- B_det_cards_llm_contract: quality_delta mean=0.0000 [0.0000, 0.0000], latency_delta_ms mean=-3.56 [-6.35, -1.53]
- C_llm_cards_det_contract: quality_delta mean=0.0000 [0.0000, 0.0000], latency_delta_ms mean=-0.51 [-2.14, 1.15]
- E_det_e2e_with_optional_narration: quality_delta mean=0.0000 [0.0000, 0.0000], latency_delta_ms mean=5.60 [3.18, 8.18]


## Failure Signatures

- parse_fail_frequency: 100% across all variants (service returned non-answer failures for all runs).
- deterministic_fallback_frequency: see `artifacts/experiments/helix-ask-crossover/summary.json` (`aggregate[].deterministic_fallback_rate`).
- dominant runtime error observed in raw payload debug fields: `repoScaffoldForPrompt is not defined`, with temporary unavailability/circuit-open responses in early runs.

## Validity Note

Because all `(prompt_id, seed)` executions failed before answer generation, this run is **infrastructure-failure dominated** and cannot support a quality comparison between deterministic vs LLM-heavy assembly. The data is still useful for identifying failure signatures and latency overhead under failure mode.

## Decision

- decision: **default_deterministic**
- preferred_default_variant: **A_deterministic_core**
- quality gate met: **false**
- latency/cost gate met: **false**

## Reproducibility

See `summary.json` and per-run raw payloads under each variant raw directory.
