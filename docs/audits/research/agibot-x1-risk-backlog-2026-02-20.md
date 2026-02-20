# AGIBOT X1 Risk -> Backlog Mapping (2026-02-20)

## P0/P1/P2 backlog

| priority | risk | owner_lane | patch_target | measurable_acceptance_check | disconfirmation_trigger |
|---|---|---|---|---|---|
| P0 | Mission interface accidentally permits actuator-level semantics. | API contract | `server/routes/agi.plan.ts`, `shared/local-call-spec.ts` | Mission requests with actuator terms return deterministic `FORBIDDEN_CONTROL_PATH`. | Any mission request can set torque/current/PWM or joint PID values. |
| P0 | Bring-up executed without complete safety preflight evidence. | Runtime safety | `docs/runbooks/agibot-x1-bringup-preflight.md`, preflight hooks | Preflight emits first-fail block reason for missing scope/calibration/IMU/estop fields. | Runtime arms bridge when any mandatory check is absent. |
| P0 | Calibration metadata missing from run trace, preventing reproducibility. | Observability | `shared/schema.ts`, `server/services/observability/training-trace-store.ts` | Training trace export contains calibration packet with required fields for seeded runs. | Two identical runs cannot be compared due absent actuator/CAN/firmware metadata. |
| P1 | Runtime transport mapping ambiguity across AimRT/ROS2/protobuf. | Integration bridge | `docs/architecture/agibot-x1-runtime-bridge-contract-v1.md` | Contract examples parse under a shared envelope with deterministic reason codes. | Bridge adapters require transport-specific semantics not represented in canonical envelope. |
| P1 | Evidence confidence drift causes over-claims in readiness docs. | Research governance | `docs/audits/research/agibot-x1-evidence-ledger-2026-02-20.md` | Every major claim has claim_id + status + confidence + follow-up action. | Readiness report contains claim without source/status split. |
| P2 | Ticket slices become too broad for deterministic one-prompt execution. | Delivery operations | batch prompt pack + backlog docs | Each backlog row maps to narrow path scope and single acceptance command. | A single row requires multi-domain file touching beyond declared allowed paths. |

## Execution ordering recommendation

1. P0 boundary/safety enforcement
2. P0 trace calibration reproducibility
3. P1 runtime bridge consolidation
4. P1 evidence governance hardening
5. P2 delivery hygiene refinements


## Artifact linkage

- readiness_report: `reports/agibot-x1-helix-integration-readiness-2026-02-20.md`
- evidence_ledger: `docs/audits/research/agibot-x1-evidence-ledger-2026-02-20.md`


## Wave 2 execution update

- Status: runtime fail-closed gates improved, but physical deployment remains blocked.
- Remaining no-go blockers: repo-wide TS debt, asset availability evidence, and hardware replay completion.
- Cross-reference: `reports/agibot-x1-helix-wave2-readiness-2026-02-20.md`.
