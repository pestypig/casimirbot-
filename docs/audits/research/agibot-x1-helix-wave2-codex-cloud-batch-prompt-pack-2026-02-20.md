# AGIBOT X1 -> Helix Ask Wave 2 Codex Cloud Batch Prompt Pack (2026-02-20)

Derived from:
- `reports/agibot-x1-helix-integration-readiness-2026-02-20.md`
- `docs/audits/research/agibot-x1-risk-backlog-2026-02-20.md`
- `docs/runbooks/agibot-x1-bringup-preflight.md`

## Shared guardrails (include in every Codex Cloud run)

```text
Hard constraints:
1) No direct LLM-to-actuator control path is allowed.
2) Keep maturity claims honest (diagnostic/reduced-order unless stronger evidence exists).
3) Any missing safety-critical contract must fail closed with deterministic reason codes.
4) Do not make physical deployment-readiness claims from docs-only evidence.

Mandatory verification gate after each patch:
npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci

If verdict is FAIL:
- fix the first failing HARD constraint
- rerun until PASS

Always report:
- files changed
- behavior delta
- tests/checks run
- verdict
- firstFail
- certificateHash
- integrityOk
- traceId
- runId
```

## Prompt 0: Coordinator (run once)

```text
Use this file as source of truth.

Execute prompts sequentially in this order:
1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

Rules:
- One prompt scope per commit.
- Do not broaden scope outside allowed_paths.
- Run prompt-specific checks plus Casimir verification after each prompt.
- If blocked, implement the maximum additive subset and leave deterministic TODO notes.
```

## Prompt 1: Prompt-to-commit traceability ledger

```text
Objective:
Make execution traceability reproducible so every prompt maps to a verifiable commit and artifact set.

Allowed paths:
- docs/audits/research/agibot-x1-wave2-execution-ledger-2026-02-20.md (new)
- reports/agibot-x1-helix-integration-readiness-2026-02-20.md

Requirements:
1) Add a strict ledger schema with:
   - prompt_id
   - commit_sha
   - files_changed
   - checks_run
   - casimir_traceId/runId
2) Add validation notes for handling rebases/squashes (when direct prompt sha is unavailable).
3) Keep deterministic evidence references.

Checks:
- docs lint/check if available
- casimir verify command

Done criteria:
- Traceability ledger is present and can be used to audit prompt execution end-to-end.
```

## Prompt 2: Arm-time preflight enforcement hook

```text
Objective:
Enforce the AGIBOT bring-up preflight runbook in runtime command admission (fail closed).

Allowed paths:
- server/routes/agi.plan.ts
- server/routes/agi.adapter.ts
- docs/runbooks/agibot-x1-bringup-preflight.md
- tests/helix-ask-modes.spec.ts

Requirements:
1) Add deterministic preflight gate evaluation before mission/actuation bridge admission.
2) Block on first missing mandatory check in fixed order:
   - DESKTOP_JOINT_SCOPE_REQUIRED
   - CALIBRATION_STATE_INCOMPLETE
   - IMU_BASELINE_NOT_CONFIGURED
   - ESTOP_NOT_READY
3) Keep trace_id/run_id linkage in all blocked responses.
4) Preserve existing controller-boundary protections.

Checks:
- npx vitest run tests/helix-ask-modes.spec.ts -t "rejects actuator-level command phrases in mission interface"
- add/extend targeted preflight-gate tests
- casimir verify command

Done criteria:
- Runtime path enforces preflight checks deterministically and fail-closed.
```

## Prompt 3: Calibration evidence integrity hardening

```text
Objective:
Harden calibration metadata contracts and export integrity for reproducible runs.

Allowed paths:
- shared/schema.ts
- server/services/observability/training-trace-store.ts
- server/routes/training-trace.ts
- tests/trace-export.spec.ts

Requirements:
1) Keep calibration fields required in schema when packet is present:
   - actuator_id
   - can_id
   - firmware_version
   - control_mode
   - zero_offset
   - imu_profile
2) Add deterministic validation failure on malformed calibration packets.
3) Ensure JSONL export round-trip keeps calibration values stable.

Checks:
- npx vitest run tests/trace-export.spec.ts
- casimir verify command

Done criteria:
- Calibration packet integrity is enforced and export coverage is test-backed.
```

## Prompt 4: Asset manifest and checksum pinning

```text
Objective:
Create checksum-pinned AGIBOT external asset manifest and a deterministic validation script.

Allowed paths:
- docs/audits/research/agibot-x1-asset-manifest-2026-02-20.md (new)
- scripts/validate-agibot-asset-manifest.ts (new)
- package.json (script hook only if needed)
- tests (new or existing validation tests)

Requirements:
1) Manifest fields:
   - asset_id
   - source_url
   - expected_sha256
   - license
   - required_for_phase (P0/P1/P2)
   - availability_status
2) Validation script fails deterministically on missing checksum or missing required asset.
3) Add one command to run validator in CI/local workflows.

Checks:
- run new validator command
- casimir verify command

Done criteria:
- Asset availability claims are checksum-pinned and machine-validated.
```

## Prompt 5: Touched-path TypeScript baseline repair

```text
Objective:
Eliminate TypeScript errors in touched AGIBOT Wave 1/2 paths and produce a scoped green check.

Allowed paths:
- server/routes/agi.adapter.ts
- server/routes/agi.plan.ts
- shared/local-call-spec.ts
- shared/schema.ts
- tests/helix-ask-modes.spec.ts
- tests/trace-export.spec.ts
- docs/audits/research/agibot-x1-wave2-execution-ledger-2026-02-20.md

Requirements:
1) Resolve TS errors in touched paths only (no broad unrelated rewrites).
2) Add a scoped typecheck command or tsconfig include set for touched paths.
3) Record remaining repo-wide TS debt separately without hiding it.

Checks:
- scoped typecheck command (new or existing)
- npm run check (informational; may still fail due unrelated files)
- casimir verify command

Done criteria:
- Touched AGIBOT paths are type-clean under deterministic scoped check.
```

## Prompt 6: Runtime bridge first implementation slice (protobuf/AimRT-first)

```text
Objective:
Implement first executable mission bridge slice with transport-neutral envelope and protobuf/AimRT-first mapping.

Allowed paths:
- shared/local-call-spec.ts
- server/routes/agi.plan.ts
- docs/architecture/agibot-x1-runtime-bridge-contract-v1.md
- tests/helix-ask-modes.spec.ts

Requirements:
1) Validate mission bridge envelope contract at runtime.
2) Keep transport field limited to aimrt|ros2|protobuf; default to deterministic safe profile.
3) Reject actuator-level fields with FORBIDDEN_CONTROL_PATH.
4) Keep response fail reasons deterministic and trace-linked.

Checks:
- targeted helix-ask mode tests
- add bridge-envelope negative-path tests
- casimir verify command

Done criteria:
- First runtime bridge slice is executable with deterministic validation and safety rails.
```

## Prompt 7: Hardware-in-loop evidence packet scaffolding

```text
Objective:
Add hardware-in-loop evidence packet schema and capture workflow (without over-claiming readiness).

Allowed paths:
- docs/runbooks/agibot-x1-hil-evidence-capture-2026-02-20.md (new)
- shared/schema.ts
- server/routes/training-trace.ts
- tests/trace-export.spec.ts

Requirements:
1) Define HIL packet fields:
   - run_id
   - hardware_profile
   - preflight_status
   - estop_liveness_result
   - calibration_ref
   - safety_gate_outcome
2) Add trace export coverage for HIL packet structure.
3) Keep claims diagnostic; no deployment certification language.

Checks:
- npx vitest run tests/trace-export.spec.ts
- casimir verify command

Done criteria:
- HIL evidence packet is schema-backed and exportable for future replay audits.
```

## Prompt 8: Wave 2 readiness report

```text
Objective:
Publish a wave-2 readiness report that states what is now enforced in runtime vs what remains blocked.

Allowed paths:
- reports/agibot-x1-helix-wave2-readiness-2026-02-20.md (new)
- docs/audits/research/agibot-x1-wave2-execution-ledger-2026-02-20.md
- docs/audits/research/agibot-x1-risk-backlog-2026-02-20.md

Requirements:
1) Include prompt-by-prompt status table with commit SHAs and verification metadata.
2) Separate:
   - runtime-enforced guarantees
   - documentation-only guarantees
   - remaining blockers
3) Add explicit no-go statement for physical deployment if blockers remain.

Checks:
- casimir verify command

Done criteria:
- Report is decision-grade and replay-auditable.
```

## Suggested run order

1. `Prompt 0`
2. `Prompt 1`
3. `Prompt 2`
4. `Prompt 3`
5. `Prompt 4`
6. `Prompt 5`
7. `Prompt 6`
8. `Prompt 7`
9. `Prompt 8`
