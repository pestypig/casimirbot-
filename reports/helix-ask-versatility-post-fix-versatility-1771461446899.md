# Helix Ask Post-fix Validation Campaign

- run_id: versatility-1771461446899
- timestamp: 2026-02-19T00:41:08.306Z
- precheck_status: pass_3_of_3
- baseline_summary: missing (`artifacts/experiments/helix-ask-versatility/20260218T232914Z/versatility-1771457356197/summary.json`)

## Availability precheck (hard gate)
1. probe_1: HTTP 200, error=null, fail_reason=null, debug.last_error=null
2. probe_2: HTTP 200, error=null, fail_reason=null, debug.last_error=null
3. probe_3: HTTP 200, error=null, fail_reason=null, debug.last_error=null

## Before vs after metrics

| Metric | Before (baseline) | After (this run) |
|---|---:|---:|
| intent_id_correct_rate | N/A (baseline missing) | 0.9333 |
| report_mode_correct_rate | N/A (baseline missing) | 0.9222 |
| relation_packet_built_rate | N/A (baseline missing) | 0.8667 |
| relation_dual_domain_ok_rate | N/A (baseline missing) | 0.8667 |
| citation_presence_rate | N/A (baseline missing) | 0.9667 |
| min_text_length_pass_rate | N/A (baseline missing) | 1.0000 |
| invalid/error rate | N/A (baseline missing) | 0.0000 |
| run_complete | N/A (baseline missing) | true |
| completion_rate | N/A (baseline missing) | 1.0000 |

## Top failure signatures
1. report_mode_mismatch (21)
2. relation_packet_built (12)
3. relation_dual_domain (12)
4. bridge_count_low (12)
5. evidence_count_low (12)
6. citation_missing (9)
7. intent_mismatch (6)

## Campaign commands
- `HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone`
- `HELIX_ASK_VERSATILITY_START_SERVER=0 HELIX_ASK_VERSATILITY_SEEDS=7,11,13 HELIX_ASK_VERSATILITY_TEMPS=0.2 HELIX_ASK_VERSATILITY_MAX_RETRIES=3 HELIX_ASK_VERSATILITY_TIMEOUT_MS=15000 HELIX_ASK_VERSATILITY_MAX_CASE_WALL_MS=25000 HELIX_ASK_VERSATILITY_CHECKPOINT_EVERY=10 HELIX_ASK_VERSATILITY_FAIL_ON_INCOMPLETE=1 npx tsx scripts/helix-ask-versatility-record.ts`

## Casimir verify
- verdict: PASS
- traceId: adapter:5f499abf-edc3-4885-952d-cfdafcad9de0
- runId: 294
- certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- integrityOk: true
