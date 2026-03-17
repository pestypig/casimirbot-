# Helix Ask Equation Benchmark

- run_id: `2026-03-17T06-11-55-492Z`
- generated_at: `2026-03-17T06:18:08.927Z`
- benchmark_file: `scripts/helix-ask-equation-benchmark.json`
- pass_rate: `0.4286`
- avg_score: `37.14`
- p95_latency_ms: `60017.8`

## Top Failures

- `missing_section:Primary Topic`: 4
- `missing_section:Primary Equation`: 4
- `missing_section:Mechanism Explanation`: 4
- `primary_equation_block_missing`: 4
- `mechanism_too_short`: 4
- `required_mechanism_pattern_missing`: 4
- `consensus_frame_missing`: 4
- `preferred_source_path_missing`: 3
- `preferred_equation_pattern_missing`: 2
- `topic_mismatch:expected_collapse`: 1

## Case Results

### collapse_wave_equation_broad (FAIL)
- label: collapse wave equation broad intent
- score: 0
- latency_ms: 60019
- failures: missing_section:Primary Topic, missing_section:Primary Equation, missing_section:Mechanism Explanation, topic_mismatch:expected_collapse, primary_equation_block_missing, preferred_equation_pattern_missing, preferred_source_path_missing, mechanism_too_short, required_mechanism_pattern_missing, consensus_frame_missing
- warnings: no_sources_line_detected

### collapse_wave_equation_with_path_hint (PASS)
- label: collapse wave equation explicit path hint
- score: 90
- latency_ms: 15023

### casimir_equation_mechanism (PASS)
- label: dynamic casimir equation mechanism
- score: 85
- latency_ms: 15009

### warp_congruence_equation (PASS)
- label: warp congruence equation
- score: 85
- latency_ms: 15018

### polytrope_equation (FAIL)
- label: polytrope or hydrostatic equation
- score: 0
- latency_ms: 60015
- failures: missing_section:Primary Topic, missing_section:Primary Equation, missing_section:Mechanism Explanation, primary_equation_block_missing, preferred_equation_pattern_missing, preferred_source_path_missing, mechanism_too_short, required_mechanism_pattern_missing, consensus_frame_missing
- warnings: no_sources_line_detected

### phase_pipeline_equation (FAIL)
- label: phase pipeline equation
- score: 0
- latency_ms: 60015
- failures: missing_section:Primary Topic, missing_section:Primary Equation, missing_section:Mechanism Explanation, primary_equation_block_missing, preferred_source_path_missing, mechanism_too_short, required_mechanism_pattern_missing, consensus_frame_missing
- warnings: no_sources_line_detected

### broad_equation_scientific (FAIL)
- label: broad scientific equation request
- score: 0
- latency_ms: 60014
- failures: missing_section:Primary Topic, missing_section:Primary Equation, missing_section:Mechanism Explanation, primary_equation_block_missing, mechanism_too_short, required_mechanism_pattern_missing, consensus_frame_missing
- warnings: no_sources_line_detected

