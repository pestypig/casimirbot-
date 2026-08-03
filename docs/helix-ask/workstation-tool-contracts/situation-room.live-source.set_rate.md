# Situation Room Live Source Cadence

Status: draft.

Capability: `situation-room.live-source.set_rate`

Observation schema: `helix.visual_producer_cadence_receipt.v1`

## Purpose

Change the capture cadence and mode for an already-bound Situation Room visual
producer through the shared workstation gateway. This action changes producer
behavior; it does not create a source or grant evidence or answer authority.

## Owner

Codex owns the explicit tool call and post-receipt reasoning. Helix owns
affirmative intent admission, account policy, confirmation, structured receipt
normalization, evidence re-entry, and terminal eligibility. The host applies
only the admitted cadence setting.

## Inputs

The model supplies `cadence_ms` and `capture_mode`. It cannot supply credentials,
private endpoints, source admission, terminal state, or a synthetic receipt.

## Observation

The gateway emits `helix.visual_producer_cadence_receipt.v1` with the applied or
blocked cadence result. It remains nonterminal evidence:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Host Projection

Only a confirmed, policy-admitted action is projected to the active producer.
Panel text or a model statement that a cadence changed is not execution proof.

## Visible Trace

The trace shows affirmative admission, confirmation, tool start, the cadence
receipt, observation re-entry, and only then any provider terminal candidate.

## Negative Admission Cases

The action must not execute for quoted, negated, historical,
future/conditional, explanatory, or screen-visible cadence wording, nor when
confirmation, active producer identity, or account policy is missing.

## Tests

Primary coverage:

```txt
server/services/helix-ask/workstation-tool-gateway/__tests__/live-pipeline-control.test.ts
server/__tests__/helix.ask.live-pipeline-tool-trace.test.ts
server/services/helix-ask/__tests__/live-pipeline-control-terminal.test.ts
```
