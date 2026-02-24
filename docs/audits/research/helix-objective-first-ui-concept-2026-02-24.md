# Helix Objective-First UI Concept

Date: 2026-02-24  
Primary surface: `HelixAskPill`

## Design goal

When a user asks a question, the UI should immediately shift from chat-only to a mission loop:
1. objective created,
2. gap state visible,
3. callout/suppression explainable,
4. operator action available,
5. closure progress visible.

## UI model

### Panel A: Objective card
- Objective statement (editable)
- Objective status: `init`, `active`, `debrief_ready`, `closed`
- Confidence posture badge

### Panel B: Gap tracker
- Top 3 unresolved gaps sorted by severity then age
- Each row shows:
  - gap label,
  - why it blocks progress,
  - linked evidence count,
  - action button

### Panel C: Callout stream
- Compact stream of emitted callouts
- Suppressed entries visible with reason label
- Voice state chip: `idle`, `requesting`, `playing`, `suppressed`, `error`

### Panel D: Mission linkage strip
- `missionId`, latest `eventId`, `traceId`
- Quick open for transcript/debug artifacts

## Interaction contract

### On first ask submit
- Create objective from prompt.
- Set objective state to `active`.
- Initialize gap list from deterministic rules.

### On each new event
- Re-evaluate gap deltas.
- Recompute speak eligibility via shared policy evaluator.
- Add emitted or suppressed row to callout stream.

### On operator action
- Persist action and ack to mission-board.
- Resolve or narrow linked gap.
- Update closure metrics and progress state.

## Copy style

- Tone: concise, operational, non-narrative.
- Template:
  - `CHANGE: ...`
  - `IMPACT: ...`
  - `NEXT: ...`
  - `EVIDENCE: ...`

## Accessibility and clarity requirements

- Suppression reason must be visible without hover.
- Voice state changes require text indicator and icon change.
- Critical/action callouts use high-contrast emphasis.
- Keyboard-only flow must support all action controls.

## Telemetry fields

Emit for each render/update:
- `objective_id`
- `gap_count_open`
- `callout_mode`
- `suppression_reason` (if any)
- `policy_clock`
- `ui_update_latency_ms`

## Acceptance criteria

- Objective card appears on first response cycle.
- Gap tracker updates deterministically for repeated fixture replay.
- Suppression reason shown for every non-emitted callout.
- No voice certainty escalation relative to displayed text certainty.
