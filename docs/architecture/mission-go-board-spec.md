# Mission Go Board Specification (v1)

Status: draft.

## Purpose
Define a shared mission-state model for Helix Ask and Dot-style overwatch so
operators can see what changed, why it matters, and what action is pending.

## Design goals
- Event-driven board updates from live Helix Ask and system signals.
- Deterministic state transitions for replay and audit.
- Evidence-linked entries to preserve scientific posture.
- Readable by both UI panels and voice callout orchestration.

## Core entities
- `Mission`
  - `missionId`
  - `title`
  - `phase`
  - `status` (`active|degraded|blocked|complete|aborted`)
  - `startedAt`, `updatedAt`
- `Objective`
  - `objectiveId`
  - `missionId`
  - `label`
  - `priority` (`low|medium|high|critical`)
  - `status` (`open|in_progress|resolved|stalled`)
  - `owner`
- `Threat`
  - `threatId`
  - `missionId`
  - `severity` (`warn|critical`)
  - `state` (`suspected|confirmed|mitigated|escalated`)
  - `impactSummary`
- `Timer`
  - `timerId`
  - `missionId`
  - `kind` (`deadline|countdown|stale_window`)
  - `targetTs`
  - `state` (`on_track|at_risk|breached`)
- `Signal`
  - `signalId`
  - `source` (`helix_ask|tool|telemetry|operator`)
  - `classification` (`info|warn|critical|action`)
  - `text`
  - `ts`
- `Action`
  - `actionId`
  - `missionId`
  - `type` (`clarify|retrieve|verify|execute|escalate|abort`)
  - `status` (`pending|accepted|rejected|completed`)
  - `requestedBy`
  - `requestedAt`

## Mission phase machine
Canonical phases:
- `observe`
- `plan`
- `retrieve`
- `gate`
- `synthesize`
- `verify`
- `execute`
- `debrief`

Transition rules:
- Phase can only advance one step unless an explicit degrade/escalate event
  is emitted.
- Any `critical` unresolved threat can force `verify` or `debrief` transition.
- `aborted` missions move to `debrief` with required fail reason.

## Confidence and evidence model
Each mutable board item carries:
- `confidence` (`confirmed|reasoned|hypothesis|unknown`)
- `evidenceRefs` (file paths, symbols, tool artifacts, or trace IDs)
- `failReason` (typed, deterministic when available)
- `lastVerifiedAt`

Rule: confidence labels must align with Helix Ask output contract and cannot be
upgraded by voice/UI formatting.

## Timers and decay
- Every `critical` objective must have either a countdown timer or stale window.
- If `updatedAt` exceeds stale window, item auto-marks `at_risk`.
- Repeated stale breaches emit board-level `risk` events for Dot callouts.

## Event model
Required board event fields:
- `eventId`
- `missionId`
- `type` (`state_change|threat_update|timer_update|action_required|debrief`)
- `classification`
- `text`
- `fromState`, `toState` (where applicable)
- `evidenceRefs`
- `ts`

### Prompt-style alignment fields (v1, additive)

For uniform text/voice/board behavior, board events should also include:
- `certaintyClass` (`confirmed|reasoned|hypothesis|unknown`)
- `suppressionReason` (typed deterministic enum when callout was suppressed)

Reference contract:
- `docs/architecture/helix-ask-dottie-prompt-style-contract.v1.md`

Alignment rule:
- Any board event that can emit voice callouts must keep certainty class no stronger than the paired text payload certainty.

## API surface (proposed)
- `GET /api/mission-board/:missionId`
  - Returns current board snapshot.
- `GET /api/mission-board/:missionId/events?cursor=<cursor>&limit=<n>`
  - Returns ordered board events.
- `POST /api/mission-board/:missionId/actions`
  - Creates operator action decision.
- `POST /api/mission-board/:missionId/ack`
  - Records acknowledgment for a board event/callout.

## Error envelope
All endpoints should return deterministic envelopes:
- `error` (stable code)
- `message`
- `details` (optional typed payload)
- `traceId` (if present)

## Persistence notes
- Board snapshots should be reconstructable from event logs.
- Keep mission summary table for fast reads and event table for replay.
- Link mission records to Helix Ask job/trace IDs where available.

## Acceptance criteria (v1)
- Same event stream always produces the same board state.
- Critical events appear on board within one update cycle.
- Board item confidence labels match source evidence posture.
- Voice layer can consume board deltas without extra inference.

## Mission trace linkage note (2026-02-22)

For prompt-batch replay safety, mission-overwatch callouts and operator actions should carry stable linkage fields:
- `mission_id`
- `event_id`
- `trace_id`

Derived micro-debrief events should reference the originating source event IDs to preserve deterministic replay provenance.
