# Helix Ask x Dottie Prompt Style Contract (v1)

Status: draft  
Contract ID: `dottie.prompt_style.v1`

## Purpose

Define a machine-checkable contract that keeps text, voice, and mission-board outputs aligned for event-driven situational awareness.

## Scope

This contract applies to:
- Helix Ask mission-oriented responses.
- Dot-style voice callouts through `/api/voice/speak`.
- Mission Go Board event rendering and action hints.

## Normative rules

1. Voice certainty must not exceed text certainty.
2. Repo-attributed claims require evidence anchors.
3. Speak eligibility must be deterministic from context/session/voice mode and event class.
4. Suppression/failure reasons must use stable typed labels.
5. Tier 1 context events are only speak-eligible while session state is `active`.

## Canonical enums

### `event_type`
- `state_change`
- `threat_update`
- `timer_update`
- `action_required`
- `debrief`

### `classification`
- `info`
- `warn`
- `critical`
- `action`

### `certainty_class`
- `confirmed`
- `reasoned`
- `hypothesis`
- `unknown`

Certainty ordering:
- `confirmed > reasoned > hypothesis > unknown`

### `suppression_reason`
- `context_ineligible`
- `dedupe_cooldown`
- `mission_rate_limited`
- `voice_rate_limited`
- `voice_budget_exceeded`
- `voice_backend_error`
- `missing_evidence`
- `contract_violation`

## Canonical utility payload

```json
{
  "contract_version": "dottie.utility.v1",
  "mission_id": "mission-123",
  "event_id": "evt-abc",
  "event_type": "action_required",
  "classification": "action",
  "certainty_class": "reasoned",
  "evidence_refs": ["docs/helix-ask-flow.md#L1"],
  "text_payload": {
    "what_changed": "CHANGE: action_required/action -- verifier gate failed.",
    "why_it_matters": "IMPACT: release blocked until first HARD constraint is fixed.",
    "next_action": "NEXT: fix firstFail and rerun Casimir verify.",
    "evidence_anchor": "EVIDENCE: docs/helix-ask-agent-policy.md"
  },
  "voice_payload": {
    "mode": "briefing",
    "text": "Action required: fix first failing hard constraint and rerun verify.",
    "certainty_class": "reasoned"
  },
  "suppression": {
    "suppressed": false,
    "reason": null,
    "cooldown_ms": 0
  }
}
```

## Template requirements

Required text fields:
- `what_changed`
- `why_it_matters`
- `next_action`
- `evidence_anchor`

Field rules:
- `what_changed`: one-sentence delta, max 160 chars.
- `why_it_matters`: mission impact + constraint/risk, max 220 chars.
- `next_action`: imperative verb + target + timeframe, max 160 chars.
- `evidence_anchor`: explicit refs; if missing for repo-attributed claims, downgrade certainty or suppress.

Voice rules:
- `mode`: `callout | briefing | debrief`
- max text by mode:
  - `callout`: 220 chars
  - `briefing`: 420 chars
  - `debrief`: 420 chars
- voice text must be a projection of text payload and must not increase certainty.

## Prompt-style matrix

| Tier | Session state | Voice mode | Event class | Certainty | Format | Max chars | Speak | Suppression |
|---|---|---|---|---|---|---:|---|---|
| `0` | any | any | any | any | utility text block | 900 | no | `context_ineligible` |
| `1` | `idle/requesting/stopping/error` | any | any | any | utility text block | 900 | no | `context_ineligible` |
| `1` | `active` | `normal` | `info` | `confirmed/reasoned` | callout | 140 | conditional | `dedupe_cooldown/mission_rate_limited` |
| `1` | `active` | `normal` | `warn` | `confirmed/reasoned/hypothesis` | callout | 160 | conditional | `dedupe_cooldown/mission_rate_limited` |
| `1` | `active` | `critical_only` | `critical/action` | any | callout | 220 | yes | `dedupe_cooldown/voice_budget_exceeded` |
| `1` | `active` | `normal` | `action_required` | `confirmed/reasoned` | briefing | 420 | yes | `missing_evidence` if claim is repo-attributed without refs |
| `1` | `active` | `normal` | `debrief` | any | debrief | 420 | optional | suppress if no operator action/outcome linkage |
| `1` | `active` | `off/dnd` | any | any | utility text block | 900 | no | `context_ineligible` |

## Invariants

### Certainty parity invariant

For every emitted voice payload:

```text
rank(voice.certainty_class) <= rank(text.certainty_class)
```

Violation handling:
- suppress voice payload
- set reason `contract_violation`
- preserve text payload

### Evidence parity invariant

If text/voice contains repo-attributed or system-state claims:
- `evidence_refs` must be non-empty, or
- certainty must be downgraded to `hypothesis`, or
- output suppressed with `missing_evidence`.

## Deterministic suppression contract

Each suppressed callout must include:
- `suppressed: true`
- one value from `suppression_reason`
- deterministic dedupe key basis: `(mission_id, event_type, classification, normalized_text)`

## Compatibility

This contract is additive and does not replace existing endpoint contracts:
- `/api/agi/ask`
- `/api/voice/speak`
- mission board routes under `/api/mission-board/*`

Where fields are absent in legacy payloads, adapters must default deterministically and never upgrade certainty by default.

## Test requirements (minimum)

1. Certainty parity tests for text vs voice outputs.
2. Missing evidence suppression tests for repo-attributed callouts.
3. Replay test: identical event sequence -> identical speak/no-speak + reason outputs.
4. Matrix coverage test for tier/session/voice mode eligibility behavior.
