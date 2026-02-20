# AGIBOT X1 Helix Control Contract v1

Status: diagnostic integration contract (not certification)  
Date: 2026-02-20

## 1) Layer ownership, frequency, and authority

| layer | nominal frequency | owner | allowed outputs | forbidden outputs |
|---|---:|---|---|---|
| mission layer | 0.1-2 Hz | Helix Ask orchestration | mission intent, constraints, acceptance criteria, abort conditions | actuator, PWM, torque/current setpoints, joint PID writes |
| skill layer | 10-50 Hz | deterministic runtime coordinator | validated skill RPC calls, plan fragments, bounded retries, safety gate requests | direct hardware bus writes, bypass of preflight or estop gates |
| servo layer | ~1 kHz | realtime deterministic controller | actuator scheduling and closed-loop control under hard limits | LLM-originated commands, unbounded control updates |

### Forbidden control paths (hard)

1. `Helix Ask -> actuator command` (blocked with `FORBIDDEN_CONTROL_PATH`).
2. `mission layer -> CAN/fieldbus direct write` (blocked with `MISSION_BUS_WRITE_FORBIDDEN`).
3. `skill layer -> servo bypass of safety envelope` (blocked with `SAFETY_GATE_BYPASS`).

## 2) Required command envelope

All cross-layer calls must be transport-neutral and deterministic.

```json
{
  "contract_version": "agibot.x1.control.v1",
  "trace_id": "string",
  "session_id": "string",
  "mission_id": "string",
  "issued_at": "ISO-8601",
  "issuer": { "layer": "mission|skill", "component": "string" },
  "command": {
    "name": "navigate|manipulate|diagnose|calibrate",
    "args": { "...": "typed payload" },
    "constraints": {
      "max_duration_ms": 0,
      "safety_profile": "string",
      "workspace_scope": "desktop-joint-test-only|..."
    }
  },
  "evidence": {
    "calibration_ref": "string",
    "imu_profile_ref": "string",
    "certificate_hash": "string|null"
  }
}
```

## 3) Required response envelope

```json
{
  "contract_version": "agibot.x1.control.v1",
  "trace_id": "string",
  "run_id": "string",
  "status": "accepted|rejected|executed|aborted",
  "deterministic": true,
  "fail_reason": "string|null",
  "first_fail": {
    "id": "string",
    "severity": "HARD|SOFT",
    "note": "string"
  },
  "artifacts": [
    { "kind": "training-trace-export", "ref": "/api/agi/training-trace/export" }
  ]
}
```

## 4) Fail-closed policy

Runtime must reject execution when any evidence-critical input is missing:

- missing calibration reference -> `CALIBRATION_STATE_MISSING`
- missing IMU baseline profile -> `IMU_BASELINE_MISSING`
- missing estop readiness declaration -> `ESTOP_READINESS_MISSING`
- envelope contract mismatch -> `CONTROL_ENVELOPE_INVALID`
- mission command asks for actuator-level operation -> `FORBIDDEN_CONTROL_PATH`

When rejected, response must remain deterministic and trace-linked (`trace_id`, `run_id`, `first_fail`).

## 5) Contract maturity framing

- This document defines a **diagnostic-stage** software integration boundary.
- It does not claim physical certification or deployment readiness.
