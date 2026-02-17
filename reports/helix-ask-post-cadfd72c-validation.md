# Helix Ask post-`cadfd72c` validation

## Scope
Validation run focused on measurement-only checks after commit `cadfd72c`.

## Execution log
1. Branch sync attempt:
   - `git checkout main` → failed (`pathspec 'main' did not match`); continued from current branch/local head.
   - `git pull --ff-only origin main` was not runnable after missing local `main`.
   - `git rev-parse --short HEAD` → `cadfd72`.
2. Started AGI dev server once:
   - `npm run dev:agi:5173`.
3. Goal-zone strict run:
   - `HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone`
   - Output: `[goal-zone] iter=1 pass=true passRate=100.0% failedCases=0/5`.
4. Versatility campaign:
   - Required command attempted (`HELIX_ASK_VERSATILITY_START_SERVER=0 HELIX_ASK_VERSATILITY_MAX_RETRIES=3 HELIX_ASK_VERSATILITY_RETRY_STUB=1 npx tsx scripts/helix-ask-versatility-record.ts`) but stalled due cooldown/circuit-open behavior.
   - Retry campaign run with bounded request timeout to unblock data collection:
     - `HELIX_ASK_VERSATILITY_OUT=artifacts/helix-ask-post-cadfd72c/run1 HELIX_ASK_VERSATILITY_REPORT=reports/helix-ask-post-cadfd72c-run1.md HELIX_ASK_VERSATILITY_START_SERVER=0 HELIX_ASK_VERSATILITY_MAX_RETRIES=3 HELIX_ASK_VERSATILITY_RETRY_STUB=1 HELIX_ASK_VERSATILITY_TIMEOUT_MS=15000 npx tsx scripts/helix-ask-versatility-record.ts`
   - Collected 55/90 runs before repeated long stalls under retry/cooldown pressure (partial coverage).
5. Casimir verification:
   - `POST /api/agi/adapter/run` with `mode=constraint-pack`, `pack.id=repo-convergence`.
   - Verdict `PASS`, certificate hash present, integrity OK.
6. Training trace export:
   - `GET /api/agi/training-trace/export` saved JSONL artifact.

## Measured metrics (from collected run data: 55/90)
- goal-zone strict pass: `100%` (PASS)
- intent_id_correct_rate: `0.8727`
- report_mode_correct_rate: `0.9818`
- relation_packet_built_rate: `0.8182`
- relation_dual_domain_ok_rate: `0.8182`
- stub_text_detected_rate: `0.0000`
- citation_presence_rate: `0.9273`
- min_text_length_pass_rate: `0.9273`
- total latency p95: `493 ms`
- retrieval latency p95: `0 ms` (no retrieval timing samples in collected partial set)

## Gate assessment against required thresholds
- PASS: goal-zone strict pass, intent_id, report_mode, stub_text_detected, citation_presence, min_text_length, total latency p95.
- FAIL: relation_packet_built_rate (`0.8182 < 0.85`) and relation_dual_domain_ok_rate (`0.8182 < 0.85`).
- Data quality: campaign incomplete (`55/90`), so decision-grade confidence is reduced.

## Decision
`insufficient_run_quality`

Reason: versatility campaign did not complete to full 90-run coverage and showed circuit-open/cooldown-induced stalls; relation-packet quality gates also missed thresholds in sampled data.

## Casimir block
- verdict: `PASS`
- certificateHash: `d20fcd05db089de6763272727c264d842b254b4258c6474dc38c1d655896edcc`
- integrityOk: `true`
- training trace export: success (`158091` bytes)
