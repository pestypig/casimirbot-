# AGIBOT X1 -> Helix Ask Codex Cloud Batch Prompt Pack (2026-02-20)

Derived from:
- `docs/audits/research/agibot-x1-physical-ai-deep-research-prompt-2026-02-20.md`

## Shared guardrails (include in every Codex Cloud run)

```text
Hard constraints:
1) No direct LLM-to-actuator control path is allowed.
2) Keep maturity claims honest (diagnostic/reduced-order unless stronger evidence exists).
3) Any missing safety-critical contract must fail closed with deterministic reason codes.
4) Keep patch scope tight to allowed paths.

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
Use `docs/audits/research/agibot-x1-physical-ai-deep-research-prompt-2026-02-20.md` as source of truth.

Execute prompts sequentially in this order:
1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

Rules:
- One prompt per commit.
- Do not broaden scope outside allowed paths.
- Run prompt-specific checks plus Casimir verification after each prompt.
- If blocked, implement the maximum additive subset and leave deterministic TODO notes.
```

## Prompt 1: Evidence ledger and claim-status split

```text
Objective:
Create a repo-local, source-linked evidence ledger that separates confirmed vs inferred vs unknown claims for AGIBOT X1 integration.

Allowed paths:
- docs/audits/research/agibot-x1-evidence-ledger-2026-02-20.md (new)
- docs/audits/research/agibot-x1-physical-ai-deep-research-prompt-2026-02-20.md

Requirements:
1) Convert major claims into explicit claim IDs.
2) Add source URL + date + confidence per claim.
3) Flag unresolved conflicts with deterministic follow-up actions.

Checks:
- markdown lint or repo doc checks if available
- casimir verify command

Done criteria:
- Ledger exists with status split and actionable unknowns.
```

## Prompt 2: Mission-skill-servo contract doc (v1)

```text
Objective:
Define the integration contract where Helix Ask operates at mission level and deterministic control remains below.

Allowed paths:
- docs/architecture/agibot-x1-helix-control-contract-v1.md (new)
- docs/robot-recollection-cloud-build-plan-2026.md

Requirements:
1) Define layer frequencies, ownership, and forbidden control paths.
2) Specify required command/response envelopes between layers.
3) Define fail-closed rules when runtime evidence is missing.

Checks:
- casimir verify command

Done criteria:
- Contract is explicit enough to implement adapter surfaces without ambiguity.
```

## Prompt 3: Calibration and hardware identity schema

```text
Objective:
Add a typed schema for robot calibration state so runs are reproducible and comparable.

Allowed paths:
- shared/schema.ts
- server/services/observability/training-trace-store.ts
- tests/helix-ask-modes.spec.ts
- tests or schema contract tests related to trace payloads

Requirements:
1) Add calibration metadata fields:
   - actuator_id
   - can_id
   - firmware_version
   - control_mode
   - zero_offset
   - imu_profile
2) Ensure metadata is trace-linkable per run/session.
3) Keep backward compatibility for existing trace consumers.

Checks:
- npm run check
- scoped tests for touched schema/trace surfaces
- casimir verify command

Done criteria:
- Calibration state can be persisted and exported with deterministic schema behavior.
```

## Prompt 4: Bring-up safety runbook + preflight gate

```text
Objective:
Encode AGIBOT X1 bring-up constraints into a fail-closed preflight runbook for Helix-driven experiments.

Allowed paths:
- docs/runbooks/agibot-x1-bringup-preflight.md (new)
- scripts/toe-agent-preflight.ts (only if minimal hook needed)
- docs/audits/research/agibot-x1-evidence-ledger-2026-02-20.md

Requirements:
1) Add mandatory preflight checks for:
   - desktop-joint-test-only motion scope
   - calibration state completeness
   - IMU baseline configuration
   - emergency stop readiness
2) Define explicit block reasons when any check is missing.
3) Keep policy deterministic and replay-safe.

Checks:
- preflight command(s) used in repo
- casimir verify command

Done criteria:
- Runbook and preflight logic block unsafe execution by default.
```

## Prompt 5: Runtime protocol bridge contract (AimRT/ROS2/protobuf)

```text
Objective:
Create a runtime integration contract that maps Helix skill commands onto protocol-safe transport boundaries.

Allowed paths:
- docs/architecture/agibot-x1-runtime-bridge-contract-v1.md (new)
- shared/local-call-spec.ts
- server/routes/agi.plan.ts
- tests/helix-ask-modes.spec.ts

Requirements:
1) Define skill-level RPC/channel contract examples:
   - navigate(target_pose, constraints)
   - manipulate(object_id, approach, force_limits)
   - diagnose(subsystem)
   - calibrate(joint_group)
2) Include transport-neutral schema guidance for ROS2/protobuf surfaces.
3) Keep actuator-level commands out of mission interface.

Checks:
- npm run check
- scoped helix ask mode tests
- casimir verify command

Done criteria:
- Contract is implementable and preserves deterministic safety boundaries.
```

## Prompt 6: Risk register to implementation backlog mapping

```text
Objective:
Convert top risks into ordered implementation backlog items with acceptance gates.

Allowed paths:
- docs/audits/research/agibot-x1-risk-backlog-2026-02-20.md (new)
- docs/audits/research/agibot-x1-helix-codex-cloud-batch-prompt-pack-2026-02-20.md

Requirements:
1) Build P0/P1/P2 backlog rows with:
   - risk
   - owner lane
   - patch target
   - measurable acceptance check
2) Add disconfirmation triggers for each major assumption.
3) Keep ticket granularity suitable for one-prompt-per-commit execution.

Checks:
- casimir verify command

Done criteria:
- Backlog is execution-ready and mapped to deterministic acceptance checks.
```

## Prompt 7: Final integration readiness report

```text
Objective:
Produce a final report that states what is ready, what is blocked, and what evidence is still required before any physical deployment claim.

Allowed paths:
- reports/agibot-x1-helix-integration-readiness-2026-02-20.md (new)
- docs/audits/research/agibot-x1-risk-backlog-2026-02-20.md
- docs/audits/research/agibot-x1-evidence-ledger-2026-02-20.md

Requirements:
1) Summarize completed prompts and resulting artifacts.
2) Explicitly list remaining blockers and required evidence.
3) Include Casimir verification summary for each prompt run.

Checks:
- casimir verify command

Done criteria:
- Report can be used as a go/no-go input for next implementation wave.
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

## Prompt 6 execution mapping notes

For Prompt 6 backlog rows, keep each row implementation-ready with:
- explicit risk statement
- owner lane
- concrete patch target
- measurable acceptance command/check
- disconfirmation trigger that invalidates the underlying assumption
