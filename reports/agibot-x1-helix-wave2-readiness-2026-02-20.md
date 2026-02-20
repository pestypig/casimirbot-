# AGIBOT X1 Helix Wave 2 Readiness Report (2026-02-20)

## Prompt-by-prompt execution status

| prompt_id | status | commit_sha | casimir_verdict | casimir_traceId | casimir_runId | certificateHash | integrityOk |
|---|---|---|---|---|---|---|---:|
| 0 | done | `N/A` | `N/A` | `N/A` | `N/A` | `N/A` | false |
| 1 | done | `e426af0` | PASS | `adapter:b2d14fc1-3d54-49ca-a5d1-6032e089fea1` | `1` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true |
| 2 | done | `de21e11` | PASS | `adapter:af8b32be-5e59-40bb-9152-62d727ab3836` | `2` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true |
| 3 | done | `e666a85` | PASS | `adapter:83ded9b2-123a-4f88-ae78-72ab722aab6c` | `3` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true |
| 4 | done | `b833668` | PASS | `adapter:a82399d7-82b4-44cd-a7ea-1115b5918684` | `4` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true |
| 5 | partial-blocked | `7b7df52` | PASS | `adapter:42f41946-7a35-43b9-b856-02b6aee890a5` | `5` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true |
| 6 | done | `3198433` | PASS | `adapter:68d97347-1092-4259-8398-77f6b3ea3946` | `6` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true |
| 7 | done | `a9f6a72` | PASS | `adapter:1142d7e0-db3f-4ea0-8ad2-88d776b3b44b` | `7` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true |
| 8 | done | `HEAD@prompt8` | PASS | `adapter:71ca02ff-b814-45bc-a558-378b03709db4` | `8` | `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` | true |

## Runtime-enforced guarantees

- Mission interface hard-rejects actuator-level phrasing (`FORBIDDEN_CONTROL_PATH`) and keeps direct LLM-to-actuator paths blocked.
- Bring-up preflight gate now fails closed in deterministic order: scope -> calibration -> IMU baseline -> estop readiness.
- Training-trace intake rejects malformed calibration packet structures with deterministic reason code.
- Runtime bridge envelope path is validated with transport constrained to `aimrt|ros2|protobuf` and actuator-like argument keys rejected.
- HIL packet schema is now accepted and exported as JSONL evidence for replay.

## Documentation-only guarantees

- External AGIBOT asset list is checksum-pinned and validator-backed, but artifact availability is still declaration-level until fetched in execution environment.
- HIL runbook documents capture workflow, but does not itself establish hardware execution evidence.

## Remaining blockers

1. Repository-wide TypeScript debt remains high; prompt-5 scope is only partially blocked and broader type health is unresolved.
2. External AGIBOT assets are pinned but not all are availability-proven (`availability_status` not fully `available`).
3. Hardware-in-loop evidence packets exist, but physical hardware replay campaign evidence is still pending.

## No-go statement for physical deployment claim

Physical deployment-readiness remains **NO-GO** in this wave. Current evidence is diagnostic/runtime-hardening grade and does not close hardware replay + full safety signoff blockers.
