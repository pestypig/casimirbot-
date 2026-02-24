# Helix Ask x Dottie Callout Templates (v1)

## Canonical template families

### 1) Callout (short event pulse)
- Purpose: immediate event-driven awareness.
- Max length: 220 chars.
- Required fields: `what_changed`, `why_it_matters`, `next_action`, `evidence_anchor`.

Template:
```text
CHANGE: {what_changed}
IMPACT: {why_it_matters}
NEXT: {next_action}
EVIDENCE: {evidence_anchor}
```

### 2) Briefing (operator action guidance)
- Purpose: action-required contexts.
- Max length: 420 chars.
- Includes bounded risk context and explicit command verb.

### 3) Debrief (closure loop)
- Purpose: summarize trigger -> action -> outcome.
- Max length: 420 chars.
- Must include `derived_from` reference.

## Stable suppression labels
- `context_ineligible`
- `dedupe_cooldown`
- `mission_rate_limited`
- `voice_rate_limited`
- `voice_budget_exceeded`
- `missing_evidence`
- `contract_violation`
- `overload_admission_control`

## Stable failure reason labels
- `invalid_event_shape`
- `missing_required_fields`
- `unknown_classification`
- `determinism_guard_failed`
- `replay_state_mismatch`
- `voice_backend_error`

## Deterministic bounds
- Enforce maximum output lengths per template mode.
- Enforce evidence anchor presence for repo-attributed claims.
- Enforce certainty parity (`voice <= text`).
