# Helix Ask Equation Benchmark Matrix

- run_id: `2026-03-17T06-18-20-174Z`
- benchmark_file: `scripts/helix-ask-equation-benchmark.json`
- matrix_file: `scripts/helix-ask-equation-benchmark-matrix.json`

## Profiles

- `baseline`: pass_rate=0.8571, avg_score=81.14, p95_latency_ms=15022.7, failures=3
- `equation_focus_balanced`: pass_rate=0.8571, avg_score=81.14, p95_latency_ms=15024, failures=3
- `equation_focus_compact`: pass_rate=1, avg_score=83.43, p95_latency_ms=14898.9, failures=0

## Recommendation

- best_profile: `equation_focus_compact`
- baseline_profile: `baseline`
- delta_pass_rate: `0.1429`
- delta_avg_score: `2.29`
- delta_p95_latency_ms: `-123.8`
- delta_failure_count: `-3`
