# Mission Overwatch SLO Runbook (2026-02-22)

## Target SLOs
- Callout decision latency (p95): <= 300 ms
- Board update latency (p95): <= 500 ms
- False positive callout rate: <= 2% over rolling 7-day window

## Measurement points
- event ingest timestamp
- salience decision timestamp
- board snapshot publish timestamp
- operator action acknowledgment timestamp

## Notes
This runbook is staged as policy baseline; production instrumentation wiring is deferred.
