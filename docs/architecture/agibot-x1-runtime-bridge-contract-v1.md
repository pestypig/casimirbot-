# AGIBOT X1 Runtime Bridge Contract v1

Status: diagnostic/runtime-safety slice (Wave 2 Prompt 6).

## Envelope

- Contract: `agibot.x1.runtime.bridge.v1`
- Transport: `aimrt | ros2 | protobuf`
- Runtime default transport: `aimrt` (safe deterministic default)

## Safety rules

1. Envelope must validate against `zMissionBridgeEnvelope`.
2. Actuator-level argument keys are forbidden in mission bridge args.
3. Runtime rejects forbidden keys with `FORBIDDEN_CONTROL_PATH`.
4. Rejections include `trace_id` and deterministic `run_id` linkage.

## Maturity claim

This bridge is execution-path scaffolding only and does not certify physical deployment readiness.
