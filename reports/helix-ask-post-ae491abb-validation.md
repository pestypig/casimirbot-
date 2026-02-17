# Helix Ask post-ae491abb validation

- Commit target: `ae491abb` (evaluated on local HEAD `ae491ab`).
- Branch/remote note: `main` and `origin` were unavailable in this clone; validation executed against local branch `work`.
- Result type: `needs_reliability_patch`.

## Reliability gates

- PASS `reliability.expected_runs_complete`
- PASS `reliability.terminated_early_reason_null`
- FAIL `reliability.invalid_error_rate_le_10pct`
- PASS `reliability.checkpoint_exists_with_status_stop_reasons`
- FAIL `reliability.no_dominant_case_wall_or_circuit_open`

## Quality gates

- PASS `quality.goal_zone_strict_pass_100pct`
- FAIL `quality.intent_id_correct_rate_ge_0.85`
- FAIL `quality.report_mode_correct_rate_ge_0.90`
- FAIL `quality.relation_packet_built_rate_ge_0.85`
- FAIL `quality.relation_dual_domain_ok_rate_ge_0.85`
- PASS `quality.stub_text_detected_rate_le_0.05`
- FAIL `quality.citation_presence_rate_ge_0.90`
- FAIL `quality.min_text_length_pass_rate_ge_0.90`
- PASS `quality.total_latency_p95_le_2500ms`
- PASS `quality.retrieval_latency_p95_le_800ms_with_samples`

## Key metrics

- expected/completed runs: `270/270`
- invalid/error rate: `80.000%` (errors `216`, total `270`)
- stop reasons: `{'done': 54, 'circuit_open_short_circuit': 216}`
- goal-zone strict pass rate: `100%`
- intent_id_correct_rate: `0.533`
- report_mode_correct_rate: `0.200`
- relation_packet_built_rate: `0.500`
- relation_dual_domain_ok_rate: `0.500`
- citation_presence_rate: `0.189`
- min_text_length_pass_rate: `0.189`
- total latency p95: `348ms`
- retrieval latency p95: `10ms` (samples `42`)

## Casimir verify + training trace

- verdict: `PASS`
- certificateHash: `784b54b62451b242023ed252859bc38ccd49da7b09afdb0cf73d255c0cd78964`
- integrityOk: `True`
- trace export: `artifacts/helix-ask-post-ae491abb/training-trace.jsonl` (`88953` bytes)
