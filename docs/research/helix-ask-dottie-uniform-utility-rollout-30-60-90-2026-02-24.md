# Helix Ask x Dottie Uniform Utility Rollout Plan (30/60/90)

## 0-30 days
- Stabilize prompt-style contract adoption in voice + mission board surfaces.
- Enable deterministic AGI admission control in staging with alerting.
- Validate timer update semantics and closure-link integrity.

## 31-60 days
- Expand parity tests into replay bundles.
- Ship deterministic ack linkage field migration.
- Publish ops runbook for suppression reason diagnostics.

## 61-90 days
- Promote parity/noise/latency KPIs to release gate dashboard.
- Add rollout-safe configuration toggles for mission voice modes.
- Conduct closure-loop reliability game day with mission-overwatch operators.

## Rollback posture
- Keep admission control max configurable (`AGI_ADMISSION_MAX`).
- Preserve additive schema behavior; allow legacy events without timer payload unless `timer_update`.
- For any regression in deterministic reasons, pin to previous stable route bundle and replay snapshot.
