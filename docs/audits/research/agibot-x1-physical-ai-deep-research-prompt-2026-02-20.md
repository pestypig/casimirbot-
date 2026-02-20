# Deep Research Prompt: AGIBOT X1 Physical-AI + Helix Ask Integration (2026-02-20)

## Purpose

Convert the current AGIBOT X1 assessment into a source-verified, implementation-ready research handoff that can be translated into Codex Cloud build tickets.

This prompt is for research and planning output only, unless explicitly told to implement.

## Prompt (paste into Deep Research as-is)

```text
Task:
Audit and harden the AGIBOT X1 open-source integration thesis for Helix Ask so it is ready for deterministic Codex Cloud implementation batches.

Primary objective:
Validate what is actually available, what is inferred, and what is missing for a safe mission-skill-servo integration stack:
Helix mission orchestration -> skill runtime -> deterministic servo control boundary.

Source policy:
1) Separate findings into:
   - confirmed by primary source
   - inferred (explain why)
   - unknown/open risk
2) Every major claim must include:
   - source URL
   - source date
   - confidence (high/medium/low)
3) If two sources conflict, mark unresolved and propose disambiguation steps.

Required source surfaces (minimum):
- AGIBOT X1 development guide (including open-source bundle links)
- AGIBOT X1 product spec page (DoF, mass, hardware stack)
- AGIBOT runtime references for AimRT and protocol support (ROS2/protobuf)
- Ubuntu 22.04 real-time kernel reference (PREEMPT_RT context)
- CAN FD primary standards/context references
- Repo policies:
  - AGENTS.md
  - WARP_AGENTS.md
  - docs/ADAPTER-CONTRACT.md
  - docs/robot-recollection-cloud-build-plan-2026.md

Research questions:
Q1. What portions of X1 hardware/software are truly reproducible from public assets today?
Q2. What minimum control-boundary contract is needed so Helix Ask never directly controls actuators?
Q3. Which bring-up/calibration state variables must be tracked as immutable experiment metadata?
Q4. What are the top integration blockers for perception, safety, and runtime interoperability?
Q5. What sequence of additive patches can deliver a useful first integration without over-claiming maturity?

Required deliverables:

A) Evidence ledger
Table with:
- claim_id
- claim_text
- source_url
- source_date
- confidence
- status (confirmed|inferred|unknown)
- integration impact

B) Control-boundary contract v1
Define deterministic interfaces for:
- mission layer (0.1-2 Hz)
- skill layer (10-50 Hz)
- servo layer (~1 kHz)
Include fail-closed behavior and forbidden paths.

C) Bring-up and calibration metadata schema
Define fields for:
- actuator IDs
- CAN IDs
- firmware versions
- control mode
- zero offsets
- IMU config
- run/session trace linkage

D) Safety and runtime risk register
Prioritize P0/P1/P2 risks with:
- failure mode
- probable cause
- detection signal
- gate/mitigation
- residual risk after mitigation

E) Codex Cloud ticket seed set
Produce 8-12 ticket-ready prompts with:
- ticket_id
- objective
- allowed_paths
- required_tests_or_checks
- done_criteria
- gate_requirements

F) Disconfirmation criteria
For each major conclusion, provide one condition that would invalidate it.

Constraints:
- Do not claim physical viability or certification from this research alone.
- Keep maturity language explicit: exploratory, reduced-order, diagnostic, certified.
- Assume AGI-to-actuator direct control is prohibited.
- Keep recommendations additive, replay-safe, and deterministic.

Return format:
1) Executive summary
2) Evidence ledger
3) Control-boundary contract
4) Metadata schema proposal
5) Risk register (P0/P1/P2)
6) Ticket seed set
7) Disconfirmation criteria
8) Open unknowns and required next evidence
```

## Notes

- Treat the current assessment as a strong hypothesis, not final truth.
- The goal is to produce a build-ready research packet that can be executed as isolated Codex Cloud batches with strict verification reporting.

## Evidence ledger companion

- Canonical claim-status split for this research packet: `docs/audits/research/agibot-x1-evidence-ledger-2026-02-20.md`.
- All implementation prompts should reference claim IDs from that ledger when asserting readiness or blockers.
