# AGIBOT X1 Bring-up Preflight (Helix Experiments)

Status: fail-closed runbook (diagnostic stage)  
Scope: Helix-assisted experiments; no direct actuator path from LLM.

## Mandatory preflight checks (all required)

| check_id | requirement | pass_condition | block_reason |
|---|---|---|---|
| AGX1-PREFLIGHT-001 | Motion scope restriction | Experiment plan explicitly sets `desktop-joint-test-only`. | `DESKTOP_JOINT_SCOPE_REQUIRED` |
| AGX1-PREFLIGHT-002 | Calibration completeness | Calibration record contains actuator_id, can_id, firmware_version, control_mode, zero_offset, imu_profile. | `CALIBRATION_STATE_INCOMPLETE` |
| AGX1-PREFLIGHT-003 | IMU baseline | IMU profile exists and baseline timestamp is recorded for current run. | `IMU_BASELINE_NOT_CONFIGURED` |
| AGX1-PREFLIGHT-004 | Emergency stop readiness | Operator checklist confirms estop line armed and independently reachable. | `ESTOP_NOT_READY` |

## Deterministic fail-closed policy

If any check is missing or unknown:

1. return `status=blocked`
2. emit first failing `block_reason` from table order
3. emit deterministic `trace_id` and `run_id`
4. do not arm runtime command bridge

## Operator sequence

1. Load run manifest and assert motion scope `desktop-joint-test-only`.
2. Validate calibration packet fields are complete and trace-linkable.
3. Validate IMU baseline profile/version is pinned for this run.
4. Perform estop liveness test and record operator attestation.
5. Start mission-layer run only after all checks PASS.

## Replay-safety notes

- Keep check order fixed for deterministic first-fail behavior.
- Persist preflight output with trace linkage for postmortem export.
- Do not downgrade missing evidence to warnings.
