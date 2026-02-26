# Helix Ask Objective-First Situational Awareness Blueprint

Source note: this document captures the user-provided deep research synthesis for in-repo reference and planning continuity.

## Executive recommendation

Decision: GO (scoped), with a hard boundary on mission-grade claims until Operator Contract v1 is enforced end-to-end and repo-api lane degradation is reduced.

Why GO now:
- Helix Ask already has a staged ladder with live/debug signals.
- Mission-overwatch loop concepts and mission-board primitives exist.
- Dottie contract primitives exist (certainty parity and deterministic suppression reasons).

What GO covers:
- Operator Contract v1 for mission callouts (text + voice), with deterministic suppression behavior.
- Mission-overwatch loop wiring (ingest -> salience -> callout -> ack/debrief).
- Lane stability guardrails (preserve deterministic short-circuit lanes while proving HTTP-backed behavior).

Assumptions:
- `/api/agi/ask` continues emitting structured debug/live ladder telemetry.
- Mission-board APIs remain the integration surface for event display, ack, and voice gating.
- "Dot-like" means behavior constraints and operator contract, not persona roleplay.

## Dot behavior primitives to operationalize

1. State-change callouts (delta-first).
2. Consequence framing (objective/time/safety impact).
3. Single next action recommendation.
4. Confidence calibration via explicit certainty class.
5. Provenance/evidence anchors for claims.
6. Authority boundary signaling (no fabricated authority).
7. Suppression discipline (dedupe, cooldown, explicit reason).
8. Replayability and auditability (stable IDs and deterministic outcomes).

## Current-to-target capability matrix

| Primitive | Current capability | Gap | Proposed change | Verification |
|---|---|---|---|---|
| Delta-first callout | Mission-overwatch flow exists | High | Enforce Operator Contract v1 as sole callout shape | Conformance >= 0.98 |
| Consequence framing | `why_it_matters` pattern exists | High | Add strict impact taxonomy tags | Valid impact tag rate >= 0.95 |
| Single action | `next_action` supported | Medium | Enforce action cardinality rule | Multi-action violations < 2% |
| Certainty calibration | certainty class parity rule exists | High | Derive certainty from gates/evidence only | Voice <= text parity tests pass |
| Provenance minimums | evidence refs already modeled | High | Require refs for action/critical or suppress | Completeness >= 0.97 |
| Authority boundaries | auth/admission controls exist | Medium | Add authority scope field to callouts | Unsafe authority claims blocked |
| Suppression discipline | suppression reasons + cooldown concepts exist | High | Shared suppression ledger with stable dedupe key | Spam rate + false-positive metrics |
| Replay/audit | debug + trace export available | Medium | Immutable callout JSONL with suppression outcomes | Replay determinism >= 0.99 |
| Lane observability | lane runbook + `debug.llm_*` fields exist | Medium | Emit route degradation callouts on transitions only | Routing callout precision >= 0.9 |

## Operator Contract v1

Contract name: `helix.operator_callout.v1`

```json
{
  "contract_version": "helix.operator_callout.v1",
  "mission_id": "mission-123",
  "event_id": "evt-abc",
  "event_type": "state_change|threat_update|timer_update|action_required|debrief",
  "classification": "info|warn|critical|action",
  "change": "delta-first",
  "impact": "objective/time/safety/integrity/availability impact",
  "action": "single imperative next step",
  "confidence": {
    "certainty_class": "confirmed|reasoned|hypothesis|unknown",
    "score_0_to_1": 0.0,
    "basis": "short basis"
  },
  "provenance": {
    "provenance_class": "repo|runtime|user|external|mixed",
    "evidence_refs": ["path-or-signal"],
    "limits": ["missing_evidence", "sensor_gap", "policy_boundary"]
  },
  "suppression": {
    "suppressed": false,
    "reason": null,
    "dedupe_key": "stable-hash-key",
    "cooldown_ms": 0
  },
  "voice": {
    "eligible": false,
    "mode": "off|callout|briefing|debrief",
    "text": null,
    "certainty_class": null
  }
}
```

Normative rules:
- `change` is mandatory and delta-first.
- certainty class comes from gates/evidence, not prose tone.
- repo/system claims need provenance refs or downgraded certainty/suppression.
- `voice.certainty_class` rank must be <= text certainty rank.
- all suppressions carry stable typed reason.

## Operational loops

### Sensing loop
- Ingest ask live events, final ask debug payloads, and mission/timer signals.
- Normalize to deterministic internal event stream with stable IDs.

### Reasoning loop
- Classify events into `info|warn|critical|action`.
- Update mission state model (`phase`, `status`, `objectives`, `gaps`, `unresolvedCritical`).
- Dedupe and cooldown at state-change level.

### Communication loop
- Emit callouts for:
  - new critical/action events,
  - timer threshold crossings,
  - routing degradation transitions,
  - objective/gap state transitions.
- Voice is a projection of text payload, never a separate generation lane.

### Ack/debrief loop
- Ack receipts (`eventId`, optional note) persist to mission timeline.
- Emit micro-debrief entries with stage/class/evidence/action linkage.

### Suppression/escalation loop
- Suppress on ineligible context, dedupe/cooldown, rate limits, missing evidence, or contract violation.
- Escalate with a single degraded-state callout when repeated critical/action suppressions occur.

## UI loop blueprint

### Helix Ask panel
- Show answer + optional debug stage strip.
- Support operator mode toggle, verbosity, and debug.
- Clarify path on evidence obligation failure.

### Mission board
- Show mission snapshot and event feed with evidence refs.
- Support ack/action operations.
- Surface suppressed event reasons explicitly.

### Voice/context controls
- Expose voice mode and context tier/session state.
- Enforce mute-while-typing and context eligibility rules.

## Highest-impact quality gaps

1. Contract enforcement gap:
   - Contract exists but is not always a hard runtime boundary.
2. Mission loop wiring gap:
   - Ask ladder/live events are not yet uniformly projected to mission-board state changes.
3. Repo lane quality gap:
   - Repo-api prompts can degrade to fallback-like wording even with successful HTTP invocation.
4. Operator UX gap:
   - Suppression explainability not consistently surfaced in UI.

## 30/60/90 plan

### 30d (highest leverage, low churn)
- Enforce Operator Contract v1 serializer/validator.
- Add suppression ledger with stable dedupe keys.
- Wire ask events to mission board.
- Enforce text->voice projection parity.

### 60d (quality + robustness)
- Build Lane C regression harness and tighten repo evidence gating.
- Add provenance minimums by classification.
- Add replay determinism checks and route degradation transition logic.

### 90d (mission-grade polish)
- Integrate SLO gating for mission-overwatch and voice defaults.
- Expand operator debrief tooling and trust calibration metrics.

## Eval pack (scenario set)

1. Lane classification (short-circuit vs config vs provider success).
2. Missing-evidence repo callout behavior.
3. Timer threshold callout behavior.
4. Voice mode ineligibility suppression.
5. Admission-control degradation behavior.
6. Deterministic control prompt (no provider callout noise).
7. Weak-repo-evidence clarify behavior.
8. Objective open->blocked->resolved transitions.
9. Ack to debrief linkage.
10. Context session ineligibility voice suppression.

Pass/fail rubric:
- Pass: contract-conformant payload, single action, calibrated certainty, provenance present, suppression reason present when suppressed, voice parity valid.
- Fail: narrative drift, inflated certainty, missing provenance for repo claims, repeated spam callouts, voice emission when ineligible.

## Priority backlog summary

See `reports/helix-dot-gap-backlog.md` and `reports/helix-dot-priority-plan.json` for implementation-ready task list and phased acceptance gates.

