# Helix Ask post-ad92705b validation

- Baseline commit: `ad92705`
- Result type: `insufficient_run_quality`
- Measured versatility runs: `98` (expected `270`)

## Gates
- Reliability `campaign_completed`: `False`
- Reliability `terminated_early_reason_null`: `False`
- Reliability `invalid_error_rate_le_10pct`: `True`
- Reliability `no_dominant_circuit_or_case_wall`: `True`
- Reliability `checkpoint_exists`: `True`
- Reliability `checkpoint_stop_reason_coherent`: `False`
- Quality `goal_zone_pass_100`: `True`
- Quality `intent_id_correct_rate`: `True`
- Quality `report_mode_correct_rate`: `False`
- Quality `relation_packet_built_rate`: `False`
- Quality `relation_dual_domain_ok_rate`: `False`
- Quality `stub_text_detected_rate`: `True`
- Quality `citation_presence_rate`: `False`
- Quality `min_text_length_pass_rate`: `True`
- Quality `latency_p95_ms`: `True`
- Quality `retrieval_latency_p95_ms`: `False`

## Key metrics
- intent_id_correct_rate: `0.8555555555555555`
- report_mode_correct_rate: `0.8979591836734694`
- relation_packet_built_rate: `0.7872340425531915`
- relation_dual_domain_ok_rate: `0.7872340425531915`
- stub_text_detected_rate: `0.02040816326530612`
- citation_presence_rate: `0.0`
- min_text_length_pass_rate: `0.9081632653061225`
- latency_p95_ms: `2162`
- retrieval_latency_p95_ms: `None`
- retrieval_latency_sample_count: `0`
- invalid_error_rate: `0.04081632653061224`

## Casimir verification
- verdict: `PASS`
- certificateHash: `e58abff1a2ca7061cce7459eacbfd5cdc5466c56c84d17642108f2efdbb7c03f`
- integrityOk: `True`

## Training trace export
- file: `artifacts/helix-ask-post-ad92705b/training-trace.jsonl`
- size_bytes: `190300`

## Primary blockers (ordered)
- Versatility campaign did not reach expected 270 runs (only measured runs available).
- Checkpoint accounting is incoherent with raw run artifacts.
- Retrieval latency p95 is unavailable (sample count is zero).
- report_mode_correct_rate below 0.90 threshold.
- relation_packet_built_rate below 0.85 threshold.
- relation_dual_domain_ok_rate below 0.85 threshold.
- citation_presence_rate below 0.90 threshold.
