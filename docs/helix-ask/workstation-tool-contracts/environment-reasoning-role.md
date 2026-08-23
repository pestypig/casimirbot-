# Environment reasoning role capabilities

Capabilities:

- `com.casimirbot.environment.reasoning_role.record`
- `com.casimirbot.environment.reasoning_role.inspect`
- `com.casimirbot.environment.reasoning_role.disposition`
- `com.casimirbot.environment.reasoning_role.arbitrate`

Observation schema: `helix.environment_reasoning_role_observation.v1`

## Purpose

These G6 capabilities carry bounded perception, prospective-planning, and
verification support into the selected Runtime Codex turn. Every output is
bound to the exact room, source, world, producer epoch, subject, action
authority, durable-goal revision, observation revision, and principal turn.
It is append-only, nonterminal evidence and has neither execution nor answer
authority.

## Owner

The selected Runtime Codex remains the principal reasoner and owns adoption,
revision, capability choice, repair, and completion. Helix owns protected
identity, revision and provenance validation, append-only recording, stale
invalidation, and terminal eligibility. The existing action admission path and
Fabric remain the sole arbiter and mutation authority.

## Inputs

`record` requires `goal_id`, `expected_goal_revision`,
`expected_ledger_revision`, `observation_revision`, `input_evidence_refs`, a
typed `payload`, and `expires_in_seconds`. The server derives protected room,
player, source, and authority identity; model-authored identity is not accepted.

`inspect` requires `goal_id` and reconstructs the authorized ledger without
selecting an output.

`disposition` requires `goal_id`, `expected_ledger_revision`, `role_output_id`,
`disposition`, nullable `adopted_capability_id`, nullable exact
`adopted_capability_arguments`, and `rationale_summary`. Helix hashes adopted
arguments server-side. Only the exact
principal Runtime Codex turn may adopt, revise, ignore, or reject its support.
Adoption does not execute.

`arbitrate` requires `goal_id`, `expected_goal_revision`,
`expected_ledger_revision`, `observation_revision`,
`considered_role_output_ids`, nullable `selected_role_output_id`, and `reason`.
It invalidates stale outputs and may select at most one current output already
adopted by the principal. The selected capability must still pass the ordinary
tool and environment-action admission path, which remains the sole mutation
authority.

## Observation

All success and typed-failure observations require a post-tool model step. No
receipt, projection, supporting role, or arbitration may become an assistant
answer or terminal product.

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Host Projection

The host may render a read-only view of current and invalidated supporting
outputs. It may not adopt, arbitrate, execute, rewrite, or terminalize them.

## Visible Trace

The Ask trace keeps role output, currentness evaluation, principal disposition,
arbitration, ordinary tool admission, execution, measured result, Codex
re-entry, and terminal eligibility as distinct stages.

## Negative Admission

The gateway fails closed for unsigned or non-room turns, unresolved speakers,
ambiguous environments, stale or future goal/observation revisions, expired or
mismatched authority, poisoned hashes, missing evidence, ledger conflicts, and
attempts to adopt an output from another principal turn. Quoted, negated,
hypothetical, historical, future, explanatory, and screen-visible references
do not authorize recording or adoption.

## Tests

Primary coverage:

```txt
shared/__tests__/helix-environment-reasoning-role.spec.ts
server/db/migrations/__tests__/062_environment_reasoning_roles.spec.ts
server/services/environment-connectors/reasoning-roles/__tests__/environment-reasoning-role-store.test.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/environment-reasoning-role.test.ts
```

## Implementation Anchors

```txt
shared/helix-environment-reasoning-role.ts
server/db/migrations/062_environment_reasoning_roles.ts
server/services/environment-connectors/reasoning-roles/environment-reasoning-role-store.ts
server/services/helix-ask/workstation-tool-gateway/environment-reasoning-role.ts
```
