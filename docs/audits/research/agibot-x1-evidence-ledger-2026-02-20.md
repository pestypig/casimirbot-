# AGIBOT X1 Evidence Ledger (2026-02-20)

## Scope

This ledger separates **confirmed**, **inferred**, and **unknown** claims for AGIBOT X1 + Helix Ask integration. It is planning evidence only and does not claim physical certification.

## Claim Ledger

| claim_id | claim_text | source_url | source_date | confidence | status | integration_impact | conflict_or_gap | deterministic_follow_up |
|---|---|---|---|---|---|---|---|---|
| AGX1-CLAIM-001 | AGIBOT X1 public developer materials exist with implementation guidance and bundle references. | https://github.com/agibot-x1 | 2026-02-20 | medium | inferred | Baseline input for integration ticketing and adapter assumptions. | Public index may not include full firmware/tooling parity. | Archive exact referenced assets with commit SHA and checksum manifest before implementation wave. |
| AGX1-CLAIM-002 | Mission/skill/servo split is required to keep Helix at deliberative scope and out of actuator control loops. | docs/ADAPTER-CONTRACT.md | 2026-02-20 | high | confirmed | Defines safety boundary and forbidden control path policy. | None in-repo; external runtime mapping still open. | Enforce API contract tests that reject actuator-level verbs from mission layer routes. |
| AGX1-CLAIM-003 | Runtime bridge must support transport-neutral envelopes and map to ROS2/protobuf/AimRT adapters. | docs/robot-recollection-cloud-build-plan-2026.md | 2026-02-20 | medium | confirmed | Enables deterministic bridge implementation without protocol lock-in. | Concrete AGIBOT channel schemas remain unresolved. | Produce v1 runtime bridge contract with canonical command envelopes + fail-closed reason codes. |
| AGX1-CLAIM-004 | Reproducible runs require calibration metadata (actuator IDs, CAN IDs, firmware, control mode, zero offsets, IMU profile) linked to traces. | docs/audits/research/agibot-x1-physical-ai-deep-research-prompt-2026-02-20.md | 2026-02-20 | high | confirmed | Needed for comparable experiments and postmortem replay. | Existing trace schema may omit some fields. | Add typed schema fields with backwards-compatible optionality; add schema tests for trace linkage. |
| AGX1-CLAIM-005 | Safety bring-up must default to desktop-joint-test-only plus hard preflight checks. | docs/audits/research/agibot-x1-helix-codex-cloud-batch-prompt-pack-2026-02-20.md | 2026-02-20 | high | confirmed | Prevents unsafe expansion before evidence maturity. | Missing explicit runbook and block-reason registry. | Create bring-up runbook + deterministic preflight rule table used by operators. |
| AGX1-CLAIM-006 | Current public evidence is insufficient to claim certified physical viability. | WARP_AGENTS.md | 2026-02-20 | high | confirmed | Forces diagnostic maturity language and anti-overclaim posture. | None; policy already explicit. | Keep all readiness reports constrained to diagnostic/reduced-order claims unless stronger evidence appears. |
| AGX1-CLAIM-007 | Ubuntu 22.04 PREEMPT_RT + CAN FD support is the expected baseline for low-level real-time and bus determinism. | https://ubuntu.com/blog/real-time-ubuntu and https://www.iso.org/standard/67194.html | 2026-02-20 | low | unknown | Affects deployment target and latency budgets. | External references not yet pinned into repo evidence bundle. | Capture exact versioned RT kernel and CAN FD validation report in repo-local evidence appendix. |

| AGX1-CLAIM-008 | Bring-up must fail closed on missing preflight evidence with deterministic block reasons. | docs/runbooks/agibot-x1-bringup-preflight.md | 2026-02-20 | high | confirmed | Prevents unsafe runtime enablement from partial setup evidence. | Runtime hook still pending. | Enforce fixed-order preflight gate in execution path and reject arm requests on first missing check. |

## Unresolved Conflicts and Priority Actions

1. **Open-source completeness conflict** (AGX1-CLAIM-001): package index existence does not guarantee hardware parity artifacts.  
   **Action:** build a deterministic asset manifest (URL, SHA256, license, missing flag) and block implementation claims if any critical artifact is missing.
2. **Runtime channel ambiguity** (AGX1-CLAIM-003): transport families are known, but channel schemas and reliability requirements are underspecified.  
   **Action:** define required mission RPC envelopes and explicit no-actuator semantics in a bridge contract before adapter coding.
3. **Calibration provenance gap** (AGX1-CLAIM-004): schema requirement is clear, but persistence/export integrity needs typed coverage.  
   **Action:** add optional calibration fields in shared schema + trace store and prove round-trip export stability.

## Status Summary

- Confirmed: 6
- Inferred: 1
- Unknown: 1
- Blocking unknowns with deterministic follow-up: 3


## Readiness companion

- Final readiness rollup: `reports/agibot-x1-helix-integration-readiness-2026-02-20.md`.
