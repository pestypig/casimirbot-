# Shared Live Room control

Status: draft shared provider capability behind the Shared Live Rooms policy.

## Purpose

Expose the existing Shared Live Room lifecycle through exact provider-neutral
workstation capabilities without creating another room store, agent loop,
authentication path, event journal, or terminal writer. The six capabilities
read fresh evidence from one exactly bound room, list and inspect rooms, create
a room idempotently, and let a policy-admitted owner list or create
observation-only source bindings when the active room-source experiment admits
their account.

## Owner

- Capability ids: `room.evidence.read_bound`, `room.list`, `room.inspect`,
  `room.create`, `room.source.list`, and `room.source.create`.
- Panel: none; these are shared control-service capabilities.
- Permission profiles: `read` for list/inspect and `act` for create.
- Account availability: developers and explicitly admitted public-experiment
  user sessions. Source control remains owner-only.
- `room.create` and `room.source.create` require explicit confirmation.

## Admission

- Tenant, account, profile, session, and ownership identity come only from the
  authenticated server context.
- Client, prompt, model, source, and Minecraft fields cannot supply or override
  those identities.
- Room reads recheck current account policy and membership.
- Bound-room evidence is admitted only inside an authenticated external Agent
  continuation and rechecks exact run-room binding, membership role, consent
  version/receipt, source provenance, freshness, and current-turn re-entry. The
  canonical current-turn projection must explicitly satisfy the required
  evidence family and provide current observation, evidence, or receipt
  artifact references; generic executor requirement resolution or a
  previous-turn artifact cannot clear the hard gate.
- Mutations require an affirmative operator command and a stable
  `idempotency_key`.
- Source controls require an admitted room owner and the room-source policy
  flag. Account type alone is not the grant.
- These workstation controls are not placed in Agent API `database_scope`.

## Negative Admission Cases

Contextual, negated, historical, future, conditional, quoted, explanatory, and
screen-visible mentions do not admit a mutation. Missing confirmation, missing
or conflicting idempotency, wrong-account room access, stale membership,
non-owner source access, and any model-supplied owner identity fail closed.
Minecraft command requests return `command_execution_not_enabled`; they never
fall through to a shell or source connector.

## Inputs

- `room.list`: no arguments.
- `room.evidence.read_bound`: no caller identity or room arguments; all
  identity comes from the active external continuation policy and binding.
- `room.inspect`: exact opaque `room_id`.
- `room.create`: required `idempotency_key`; optional bounded `title`.
- `room.source.list`: exact opaque `room_id`.
- `room.source.create`: exact `room_id`, required `idempotency_key`, and
  optional bounded world/adapter/label/TTL metadata.
- No capability accepts tenant, account, profile, session, run, chat, bearer,
  command text, shell text, or code-mutation arguments.

## External binding cleanup boundary

Run-room and run-chat withdrawal belong to the external Agent API REST/MCP
facades, not these six workstation capabilities and not Agent API
`database_scope`. They accept only an opaque binding reference and derive the
tenant, issuer, subject, and linked-profile owner tuple from the authenticated
principal. REST rejects body or query identity. Exact-owner withdrawal is
idempotent, exposes no run/room/chat identity, and remains available as cleanup
after the current room feature is policy-locked; reads and new binds remain
blocked. A replacement is always a fresh normal binding with a new opaque
reference, never mutation or reactivation of the revoked row.

## Observation

- `room.list` emits `helix.shared_live_room.list_receipt.v1`.
- `room.evidence.read_bound` emits
  `helix.shared_live_room.bound_room_evidence_observation.v1`.
- `room.inspect` emits `helix.shared_live_room.inspect_receipt.v1`.
- `room.create` emits `helix.shared_live_room.create_receipt.v1`.
- `room.source.list` emits
  `helix.shared_live_room.source_list_receipt.v1`.
- `room.source.create` emits
  `helix.shared_live_room.source_create_receipt.v1`.
- Source projections omit credential material and raw source payloads.
- Source creation returns only a short-lived, owner-bound credential-delivery
  handle; the source bearer is minted and shown only by the separate trusted
  browser claim path.
- Every output carries `assistant_answer=false`,
  `terminal_eligible=false`, and `raw_content_included=false`.

## Authority boundary

Room and source receipts prove only that the shared control service admitted or
rejected the requested lifecycle operation. They are not answers, world
observations, evidence authority, terminal products, or permission for a later
command. A required evidence family is not satisfied by a generic
`resolvedRequirements` claim. Only explicit current-turn satisfaction backed by
current artifact references may clear it, and only the canonical Helix solver
path may produce terminal content.

## Host Projection

The host may project room identifiers, bounded room state, participant counts,
source-binding metadata, idempotent replay state, delivery-handle expiry, and
typed failures. It must not project source bearers, private chat identifiers,
raw Minecraft payloads, debug secrets, or receipt text as an assistant answer.

## Visible Trace

```txt
Affirmative room control request
Server-derived account and policy admission
Shared control-service execution
Nonterminal room/source receipt
Model evidence re-entry when part of an Ask turn
Canonical terminal-authority evaluation
```

## Tests

- exact room lifecycle and idempotent replay
- tenant/account/profile spoof fields rejected by closed input schemas
- current membership and owner source policy rechecked
- negated, quoted, historical, future, conditional, and mixed intents do not
  admit mutations
- source bearer absent from gateway, MCP, events, chat, debug, and model context
- command execution remains disabled with the stable typed error
- scope-required evidence cannot be cleared by generic executor resolution or
  prior-turn artifacts
- external owner withdrawal is exact-tuple, path/input-ref only, idempotent,
  secret-free, policy-lock tolerant for cleanup, and followed only by a fresh
  replacement binding
- receipt re-entry remains nonterminal until canonical Helix authority
