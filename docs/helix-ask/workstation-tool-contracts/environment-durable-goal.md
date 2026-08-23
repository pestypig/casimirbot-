# Durable Environment Goal

Status: draft.

Capabilities:

- `com.casimirbot.environment.durable_goal.create`
- `com.casimirbot.environment.durable_goal.inspect`
- `com.casimirbot.environment.durable_goal.append`

Observation schema: `helix.environment_durable_goal_observation.v1`

## Purpose

Create, reconstruct, and append verified facts to one durable Minecraft
survival goal. Runtime Codex owns milestone strategy, retries, recovery,
replanning, and the eventual completion candidate. Helix verifies exact room,
participant, selected player, source, world, connector epoch, action authority,
event-chain integrity, checkpoint evidence, and terminal eligibility.

The goal projection is bounded context for Codex re-entry. It is not a plan,
assistant answer, mutation receipt, or terminal product.

## Owner

Runtime Codex owns objective interpretation, milestone selection, retries,
recovery planning, and completion proposals. Helix owns identity admission,
event-chain and checkpoint integrity, evidence provenance, continuation grants,
and terminal eligibility. Fabric retains tick-scale viability and performs only
separately admitted player effects.

## Inputs

Create requires `objective`. The objective contains Codex-authored milestones
and required postconditions. An optional `environment_label` may disambiguate
multiple active Minecraft sources but cannot supply protected identity.

Inspect requires `goal_id`.

Append requires `goal_id`, `expected_revision`, `payload`, and
`evidence_refs`. The payload must be one typed durable-goal event. Account,
room speaker, selected player, environment binding, action authority, source,
world, and connector epoch are resolved from trusted server context rather
than model arguments.

## Observation

Every successful or blocked operation emits
`helix.environment_durable_goal_observation.v1`. A successful observation
contains the bounded reducer projection and exact latest event reference. It
always remains nonterminal:

```txt
assistant_answer=false
raw_content_included=false
terminal_eligible=false
post_tool_model_step_required=true
```

## Host Projection

The host may show a read-only goal card derived from the reducer projection.
It may not append progress, hide failed attempts, rewrite recovery state, or
project completion without the canonical event and terminal-authority record.

## Visible Trace

The Ask trace shows capability request, protected-identity admission, ledger
operation, exact observation/event reference, Codex re-entry, the next Codex
candidate, and terminal eligibility as distinct stages. A ledger receipt cannot
occupy the answer row.

## Negative Admission

The gateway fails closed for an unsigned or non-room turn, unresolved speaker,
ambiguous environment, stale action authority, mismatched evidence identity,
revision conflict, malformed event, unauthorized continuation grant, or a
completion claim without every verified milestone postcondition.

Quoted, negated, hypothetical, historical, future, explanatory, and
screen-visible mentions of goal operations are not affirmative execution.
Failed attempts remain provenance and cannot be erased by a later success.

## Recovery

Disconnect, death, Fabric restart, Helix restart, revoked or expired authority,
world/subject change, and connector epoch rotation enter `recovery_required`.
That event uses the last canonical identity so an unavailable connector cannot
block recovery recording. Fresh runtime identity may enter the ledger only in
an evidence-backed `authority_rebound`, followed by a fresh checkpoint and
explicit resume.

## Tests

Primary coverage:

```txt
shared/__tests__/helix-environment-durable-goal.spec.ts
server/services/environment-connectors/goals/__tests__/durable-goal-store.test.ts
server/mcp/__tests__/helix-mcp-environment-durable-goal.test.ts
server/services/helix-ask/workstation-tool-gateway/__tests__/environment-durable-goal.test.ts
```

## Implementation Anchors

```txt
shared/helix-environment-durable-goal.ts
server/services/environment-connectors/goals/durable-goal-store.ts
server/services/helix-ask/workstation-tool-gateway/environment-durable-goal.ts
server/mcp/helix-mcp-server.ts
```
