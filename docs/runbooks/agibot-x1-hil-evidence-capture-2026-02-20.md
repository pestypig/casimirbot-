# AGIBOT X1 HIL Evidence Capture (2026-02-20)

Status: diagnostic evidence scaffolding only.

## HIL packet fields

- `run_id`
- `hardware_profile`
- `preflight_status`
- `estop_liveness_result`
- `calibration_ref`
- `safety_gate_outcome`

## Capture workflow

1. Execute preflight and keep deterministic trace linkage.
2. Record HIL packet in `/api/agi/training-trace` payload.
3. Export JSONL via `/api/agi/training-trace/export` and verify packet round-trip.

No deployment certification claim is made by this packet alone.
