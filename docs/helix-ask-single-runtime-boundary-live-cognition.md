# Helix Ask Single Runtime Boundary For Live Cognition

Plain Observation, Evidence Interpretation, Goal Cards, Ask Handoffs, and Codex-Style Runtime Closure

## Doctrine

Helix Ask should not become a second Codex loop, and it should not become a passive policy shell. Helix Ask owns evidence policy, meaning, goal cards, handoff shaping, and grounded answer style. The runtime owns tool dispatch, observations, client adoption, loop continuation, and terminal closure.

The boundary is:

```txt
Observation Journal  = what was observed
Interpretation Card  = what the evidence may mean
Goal Card            = what may matter next
Ask Handoff          = what should be brought to Helix Ask
Plan Contract        = what runtime action is requested
Runtime Loop         = tool execution, observation, follow-up, terminal closure
Helix Ask Answer     = grounded final synthesis
```

## Observation Journal

The observation journal is the black box recorder. It may contain raw events and typed observations, including model-derived perception, but it must not contain strategy, goals, inferred intent, risk conclusions, or final answers.

Allowed roles:

```txt
raw_source_event
model_perception_observation
tool_observation
client_capability_observation
```

Model perception is allowed only when marked as model-invoked evidence:

```json
{
  "role": "model_perception_observation",
  "text": "Minecraft inventory screen is visible.",
  "model_invoked": true,
  "confidence": 0.94,
  "raw_image_included": false,
  "assistant_answer": false
}
```

## Interpretation Cards

Interpretation cards convert evidence into meaning. They require evidence references and an expiration time. If supporting evidence goes stale, the interpretation should be superseded or allowed to expire.

## Goal Cards

Goal cards are candidate aims. They cannot execute tools. They require next evidence needed and an expiration time.

Goal cards expire when:

```txt
no supporting evidence refreshes them
source state becomes stale
the user contradicts them
terminal action resolves them
```

## Ask Handoffs

Ask handoffs prepare selected evidence for Helix Ask. They carry a reasoning budget:

```txt
cheap
normal
deep
```

Continuous live sources should default to cheap or normal. Deep reasoning should be explicit.

## Plan Contracts

Plan contracts request runtime action. They do not execute themselves. Browser-owned actions must declare client adoption requirements when the server action alone is not proof.

```json
{
  "action_id": "situation-room.live-source.set_rate",
  "client_adoption_required": true,
  "terminal_expectation": {
    "type": "client_adoption_observation_required",
    "artifact": "client_capability_adoption"
  }
}
```

## Terminal Rule

Everything can become evidence. Only one terminal artifact becomes the authoritative answer for a turn.

Panels are projection only. Runtime artifacts are observations or validations. Helix Ask final answers are terminal-authoritative assistant answers.
