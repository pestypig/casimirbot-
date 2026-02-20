# AGIBOT X1 Runtime Bridge Contract v1 (AimRT / ROS2 / protobuf)

Status: diagnostic integration contract (transport-neutral)

## Mission RPC surfaces (skill-level only)

Supported mission commands:

1. `navigate(target_pose, constraints)`
2. `manipulate(object_id, approach, force_limits)`
3. `diagnose(subsystem)`
4. `calibrate(joint_group)`

These are **mission/skill intents** and must never expose actuator-level controls.

## Transport-neutral envelope

```json
{
  "contract_version": "agibot.x1.runtime.bridge.v1",
  "trace_id": "string",
  "run_id": "string",
  "channel": "aimrt|ros2|protobuf",
  "command": {
    "name": "navigate|manipulate|diagnose|calibrate",
    "args": { "...": "typed payload" },
    "constraints": {
      "max_duration_ms": 10000,
      "workspace_scope": "desktop-joint-test-only",
      "safety_profile": "default"
    }
  },
  "policy": {
    "forbid_actuator_path": true,
    "fail_closed": true
  }
}
```

## ROS2/protobuf guidance

- Keep mission command names and typed fields stable across transports.
- ROS2 message wrappers and protobuf messages should carry the same canonical command schema and reason codes.
- Include `trace_id` and `run_id` in every request and response for replay-safe linkage.

## Forbidden interfaces

- No torque/current/PWM/joint PID fields in mission command payloads.
- No direct bus identifiers as writable command fields in mission RPC surface.
- Any such field must produce `FORBIDDEN_CONTROL_PATH` and reject the request.

## Fail-closed outcomes

- Missing calibration linkage -> `CALIBRATION_STATE_MISSING`
- Missing preflight scope -> `DESKTOP_JOINT_SCOPE_REQUIRED`
- Missing estop readiness evidence -> `ESTOP_NOT_READY`
- Actuator-level command in mission interface -> `FORBIDDEN_CONTROL_PATH`
