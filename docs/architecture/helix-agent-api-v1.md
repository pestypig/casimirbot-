# Helix Agent API v1

Status: implemented server contract; this document is not evidence that the
resource has been deployed publicly.

## Purpose and ownership

The Helix Agent API exposes a provider-neutral, durable specialist-run service
and its Shared Live Room control extension through two transport facades:

- conventional JSON over REST at `/api/v1/agent-runs` and `/api/v1/rooms`;
- stateless Streamable HTTP MCP at `/mcp`.

Both facades call the same service and durable store. A client owns the
multi-turn orchestration loop: `start` records a bounded objective, and each
`continue` executes one governed Helix Ask turn. The service does not run a
private model loop in the background.

```text
REST or MCP client
  -> OAuth principal and linked Helix account
  -> logical data-scope admission
  -> durable run and optimistic version claim
  -> one full Helix Ask solver turn in read mode
  -> admitted evidence re-entry and canonical terminal finalizer
  -> verify-only external projection
  -> durable run, evidence, and event records
```

The ownership boundary is intentional:

- the outer client decides whether to continue, stop, or ask its user;
- Helix Ask owns source and tool admission, evidence identity, provenance,
  completion policy, and terminal authority;
- the external API persists state and projects governed results;
- the Casimir adapter remains a separate, narrow verification endpoint and is
  not used as this service's orchestration or session runtime;
- the API, MCP tool result, event stream, and evidence bundle are never
  themselves assistant-answer authority.

Run ownership includes the signed tenant, token issuer, provider subject, and
linked Helix account profile. Reads and mutations are constrained to that exact
owner tuple.

### Internal Ask approval-host limitation

The internal workstation gateway and the external REST/MCP facades are separate
trust lanes. At trusted server bootstrap,
`HELIX_RUNTIME_APPROVAL_TRUSTED_PUBLIC_KEYS_JSON` may install an exact
issuer/key-ID Ed25519 receipt verifier together with the durable PostgreSQL
one-time replay ledger. Missing configuration fails closed; malformed or
ambiguous configured registries fail server bootstrap. The registry contains
public keys only and cannot mint approval.

The current production Codex-native bridge has no signer, confirmation UI, or
explicit-user runtime approval host. Its confirmation-governed room mutations
therefore remain unavailable and must be reported as the explicit internal Ask
limitation `runtime_approval_host_unconfigured`. Do not infer approval from an
affirmative prompt and do not auto-sign. A future host must own explicit-user
approval and private signing material, then pass the exact current-turn receipt
through the existing runtime host seam.

This does not disable the provider-neutral external room API. REST and MCP
clients retain their own host approval lifecycle and use the verified OAuth,
scope, owner-tuple, idempotency, and service admission contracts described
below.

## REST surface

All external v1 endpoints require `Authorization: Bearer <access-token>`.
Durable-run start/continue/cancel and room/source creation also require an
`Idempotency-Key` header containing 8-200 characters. The exact same validated
request replays its stored receipt; a different request under the same key
fails closed.

| Method | Path                                   | OAuth scope              | Purpose                                                      |
| ------ | -------------------------------------- | ------------------------ | ------------------------------------------------------------ |
| `POST` | `/api/v1/agent-runs`                   | `helix.agent_runs.write` | Create a durable run; does not execute the first solver turn |
| `GET`  | `/api/v1/agent-runs/{run_id}`          | `helix.agent_runs.read`  | Inspect the current owner-scoped snapshot                    |
| `POST` | `/api/v1/agent-runs/{run_id}/continue` | `helix.agent_runs.write` | Execute and persist one bounded solver turn                  |
| `POST` | `/api/v1/agent-runs/{run_id}/cancel`   | `helix.agent_runs.write` | Durably close a nonterminal run                              |
| `GET`  | `/api/v1/agent-runs/{run_id}/events`   | `helix.agent_runs.read`  | Poll ordered events using `after_seq` and `limit`            |
| `GET`  | `/api/v1/agent-runs/{run_id}/evidence` | `helix.agent_runs.read`  | Fetch the normalized evidence bundle                         |

`run_id` is opaque and matches `run_[A-Za-z0-9._:-]{8,200}`. Request JSON
schemas are strict; unknown object fields are rejected.

Every response has `Cache-Control: no-store`, `Pragma: no-cache`, and an
`X-Request-Id`. Run responses also carry a weak `ETag` derived from the run
version. Mutation responses carry `Idempotency-Replayed`; a successful start
also returns `Location`. Concurrency is controlled by `expected_version` in the
mutation body, not by `If-Match`.

### Start

```http
POST /api/v1/agent-runs
Authorization: Bearer ey...
Idempotency-Key: client-job-2041-start
Content-Type: application/json

{
  "objective": "Evaluate the candidate mechanisms against admitted evidence.",
  "constraints": [
    "Identify contradictory observations",
    "Return source-level provenance"
  ],
  "database_scope": ["scholarly_research", "research_library"],
  "completion_contract": {
    "min_evidence_refs": 2,
    "require_terminal_authority": true,
    "required_output_fields": ["text", "supporting_evidence_refs"],
    "max_unresolved_requirements": 0,
    "allow_conflicts": false
  },
  "budget": {
    "max_steps": 8,
    "expires_in_seconds": 3600
  }
}
```

Defaults are one evidence reference, required terminal authority, no required
output fields, no unresolved requirements, no conflicts, 12 steps, and a
one-hour expiry. `max_steps` is 1-64; expiry is 60 seconds through seven days.

A successful start returns `201` and version `1`. Its initial state is
`lifecycle_status: "waiting"`,
`completion_status: "needs_more_evidence"`, and
`terminal_authority_status: "not_evaluated"`.

### Continue

Use the current version returned by start, inspect, or the prior mutation:

```http
POST /api/v1/agent-runs/run_opaque-id/continue
Authorization: Bearer ey...
Idempotency-Key: client-job-2041-turn-1
Content-Type: application/json

{
  "expected_version": 1,
  "instruction": "Test the two remaining mechanisms and disclose conflicts.",
  "answers": []
}
```

A continuation must contain a nonempty `instruction`, at least one `answer`, or
both. Answers must refer exactly once to an outstanding `pending_questions`
identifier:

```json
{
  "expected_version": 3,
  "answers": [
    {
      "question_id": "request_2019_calibration_scope",
      "value": { "include": false }
    }
  ]
}
```

Each accepted continuation claims one step, executes one full solver turn, and
persists cumulative evidence, unresolved requirements, contradictions, pending
questions, a sanitized result, and ordered events.

### Inspect, evidence, and events

The run schema is `helix.agent_run.v1`. Its public fields are:

```text
run_id, ownership, objective, objective_hash, runtime_provider
lifecycle_status, completion_status, terminal_authority_status, version
completion_contract, constraints, database_scope, budget
summary, unresolved_requirements, contradictions, pending_questions
evidence, latest_result, recommended_next_action
created_at, updated_at, completed_at, cancelled_at
answer_authority=false, assistant_answer=false
terminal_eligible=false, raw_content_included=false
```

Ownership values are opaque hashes, not raw tenant or account identifiers.
`latest_result` is a bounded projection and excludes provider payloads and
chain-of-thought.

Evidence uses schema `helix.agent_run.evidence_bundle.v1` and separates
`observation_refs`, `evidence_refs`, and `receipt_refs`. It also reports
supported and contradicted claims, unresolved requirements, a provider terminal
candidate reference when present, and terminal-authority status. The bundle
always carries the four false authority/content flags shown above.

Events use schema `helix.agent_run.event.v1` and a monotonically increasing
per-run `seq`. Poll with:

```http
GET /api/v1/agent-runs/run_opaque-id/events?after_seq=41&limit=100
```

`limit` is 1-200. The response supplies `events`, `next_after_seq`, and
`has_more`. Event kinds cover run start/recovery, continuation receipt, evidence
re-entry, issue resolution, input requests, terminal-authority evaluation,
waiting, completion, blocking, failure, cancellation, and budget exhaustion.

### Cancel

```http
POST /api/v1/agent-runs/run_opaque-id/cancel
Authorization: Bearer ey...
Idempotency-Key: client-job-2041-cancel
Content-Type: application/json

{
  "expected_version": 4,
  "reason": "The caller no longer needs this investigation."
}
```

Cancellation changes durable state to `cancelled`, increments the version,
preserves audit events, and prevents later continuation. It is irreversible
through this API.

## Shared Live Room extension

The room facade reuses the Agent API's verified OAuth principal, linked account,
tenant isolation, durable run identity, and non-authoritative receipt rules. It
does not introduce another agent loop, journal, account store, or terminal
writer.

| Method   | Path                                        | OAuth scope                                           | Purpose                                                                                                                 |
| -------- | ------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/v1/rooms`                             | `helix.rooms.read`                                    | List only rooms visible to the linked account                                                                           |
| `POST`   | `/api/v1/rooms`                             | `helix.rooms.manage`                                  | Idempotently create a room using server-derived owner identity                                                          |
| `GET`    | `/api/v1/rooms/{room_id}`                   | `helix.rooms.read`                                    | Inspect one exact room after membership and policy checks                                                               |
| `POST`   | `/api/v1/rooms/run-bindings`                | `helix.rooms.manage` **and** `helix.agent_runs.write` | Durably bind one owned run to one room; an exact retry returns the existing binding and rebinding to another room fails |
| `DELETE` | `/api/v1/rooms/run-bindings/{binding_ref}`  | `helix.rooms.manage` **and** `helix.agent_runs.write` | Withdraw one exact owner-scoped run-room binding by opaque reference                                                    |
| `POST`   | `/api/v1/rooms/chat-bindings/claim`         | `helix.rooms.manage` **and** `helix.agent_runs.write` | Consume one browser-issued claim handle for the same linked account and exact run                                       |
| `DELETE` | `/api/v1/rooms/chat-bindings/{binding_ref}` | `helix.rooms.manage` **and** `helix.agent_runs.write` | Withdraw one exact owner-scoped claimed run-chat binding by opaque reference                                            |
| `GET`    | `/api/v1/rooms/{room_id}/sources`           | `helix.room_sources.manage`                           | List bounded source-binding projections without credentials                                                             |
| `POST`   | `/api/v1/rooms/{room_id}/sources`           | `helix.room_sources.manage`                           | Idempotently create a read-only source binding and deferred credential-delivery handle                                  |
| `POST`   | `/api/v1/rooms/{room_id}/commands`          | `helix.rooms.manage`                                  | Always return `command_execution_not_enabled`; no command is executed                                                   |

Room IDs and all owner/account fields are server-derived or looked up from the
verified principal. Caller-provided owner, tenant, account, participant, chat,
or source identity cannot replace those values. All room and source receipts
are observations or control receipts with false answer-authority flags.
Credential-shaped values are rejected before room/source mutation or schema
issue projection. Legacy and cross-lane room/source projections are traversed
recursively, including caller-controlled object keys, and protected material is
redacted before REST, MCP, event, debug, chat, or model-visible output. The only
intentional exceptions are the exact browser-issued chat claim on its claim
operation and the short-lived source credential-delivery handle described
below; neither is a source bearer.

### Owner withdrawal and replacement

Run-room and claimed run-chat withdrawal accept only the opaque binding
reference in the URL path. The request body and query string must be empty;
caller-supplied run, room, chat, tenant, account, profile, or owner identity is
rejected rather than used for authorization. The service derives the complete
owner tuple—tenant, token issuer, provider subject, and linked Helix account
profile—from the verified principal and matches the binding against that exact
tuple. A binding owned by another tuple is not found.

Withdrawal is idempotent for the exact owner. The false-authority receipt
contains the opaque `binding_ref`, `binding_status: "revoked"`, and
`revocation_status: "revoked"` or `"already_revoked"`; it does not expose the
run, room, chat, or stored context.

Owner withdrawal is a cleanup escape hatch. It still requires a valid linked
principal and both declared OAuth scopes, but it remains available after the
current account policy locks the Shared Live Room feature. Room reads, observer
reads, new run-room bindings, new browser observer bindings, and new chat-claim
consumption remain blocked by the current policy. A signed-in browser may
similarly disconnect its own exact observer binding after the policy lock,
while observer creation, inspection, event polling, and terminal projection
remain blocked.

Revocation closes the old binding permanently and releases its active-binding
slot. A later replacement must use the ordinary bind flow: create a fresh
run-room binding, or have the signed-in browser issue a fresh one-time chat
claim and claim it for the run. The replacement receives a new binding
reference. No endpoint changes an active binding's room or chat, reactivates a
revoked row, or lets an active run bypass the existing no-rebind rule.

### Browser-selected chat authorization and observation

Chat attachment is deliberately split across two trust boundaries:

1. A signed-in, non-guest browser selects or creates its own chat and calls the
   same-origin, cookie-authenticated
   `/api/agi/agent-run-observer/bindings` route. The browser may include only a
   bounded recent-chat snapshot: at most 12 user/assistant messages, 2,000
   characters each, and 12,000 characters total.
2. The browser receives a short-lived, show-once claim handle. The external
   agent passes that opaque handle and its owned `run_id` to
   `/api/v1/rooms/chat-bindings/claim`.
3. The server verifies the same linked account, consumes the handle once, and
   creates the durable run-to-chat binding. The agent-facing receipt exposes
   only an opaque binding reference, optional snapshot reference, and bounded
   counts. It never exposes a chat ID or a chat-session catalog.

The signed-in browser is the authority for its current local chat selection.
When the selected identifier already has a durable `agi_chat_sessions` row, the
server requires that row's owner to match the active browser profile. When the
chat is local-only and has no server row, the same-origin cookie-authenticated
request is the browser's bounded attestation that this is the chat it selected.
That local attestation does not create a globally enumerable chat record, admit
an agent-supplied chat ID, or give the external agent access to a chat catalog.
A guest browser is rejected, and an existing durable chat owned by a different
profile remains not found.

The snapshot is quoted conversation context only. It is not an operator
command, tool permission, source admission, evidence, provenance, or answer
authority. Secret-like bearer and claim values are redacted before storage and
again before model framing.

The browser polls its cookie-authenticated observer lane with
`after_seq` and a bounded `limit`. Progress receipts stay in that distinct
lane; they are not injected as assistant chat messages. Exactly one assistant
chat message may be projected only from the verified canonical terminal
product for the bound run. Event pages, receipts, evidence bundles, and
unverified terminal candidates cannot write that message.

### Deferred room-source credential delivery

External source creation returns the source identity projection plus a
short-lived `credential_delivery` object containing only an opaque claim
handle, claim URL, and expiry. It explicitly reports
`bearer_included: false` and `plugin_config_included: false`. The external REST
or MCP response, idempotency receipt, event stream, evidence, debug trace, and
model context never contain the source bearer.

Only the signed-in developer room owner may claim the delivery through the
same-origin, cookie-authenticated browser route. That browser response shows
the generated source bearer and plugin configuration once; the durable stores
retain its hash, not the raw secret. Rotation, revocation, expiry, room closure,
membership changes, and account-policy changes remain enforceable boundaries.
A source credential admits read-only world observations and probes only; it is
never an action credential.

### Bound room evidence

A run that needs live world observations requests the logical
`bound_room_evidence` database scope and must then be durably bound to one exact
room. Each continuation rechecks:

- the current Agent API owner and account policy;
- the active run-room binding and the same current profile, participant, and
  membership role that authorized it;
- room status plus the exact bind-time/current consent version and receipt
  identity;
- an active, currently credentialed registry-admitted environment source whose
  room, source, world, adapter profile/version/hash, manifest, producer epoch,
  request identity, and durable admission all match; and
- freshness plus exact request-level provenance for the bounded events or
environment snapshot.

Minecraft is the first enabled environment adapter. The code-owned profile,
fixture-only second adapter, exact manifest-admission contract, mechanics
binding, and extension procedure are specified in
`docs/architecture/helix-environment-adapter-registry-v1.md`.

The admitted capability is `room.evidence.read_bound`, required OAuth scope is
`helix.rooms.read`, and required evidence family is
`shared_live_room_evidence`. A successful observation is marked as current-turn
evidence but remains non-authoritative until it re-enters the ordinary solver
path. Scope-required evidence is a hard terminal-authority condition and cannot
be relaxed through the caller's unresolved-requirement allowance. Membership,
role, consent identity, and room status are checked again immediately before a
successful observation is projected. Missing bindings, changed membership,
stale observations, and identity mismatches return typed failures. This lane has
`execution_enabled: false` and cannot perform live actions.

The executor must explicitly report `shared_live_room_evidence` in its
current-turn satisfied-evidence set, and that same turn must contain at least
one current observation, evidence, or receipt artifact reference. A generic
`resolvedRequirements` assertion, a previous-turn artifact, or a terminal
candidate without current artifact re-entry cannot clear
`required_evidence:shared_live_room_evidence`. The service reconstructs any
missing scope-required evidence requirement independently, blocks terminal
authority, and strips the terminal product and output fields until the
condition is satisfied.

Fresh bindings persist the consent version and receipt reference atomically
with participant and role. Migration 036 adds those fields to development
databases that applied the earlier binding schema. Migration 037 revokes any
legacy active binding whose original consent identity cannot be reconstructed,
releases its active-run slot for an explicitly authorized replacement, and
enforces valid consent identity on all future active bindings. No migration
silently backfills consent from newer room state.

## MCP surface

`POST /mcp` is a stateless Streamable HTTP MCP endpoint with JSON responses.
There is no server-generated MCP session ID. `GET`, `DELETE`, and other methods
return `405`; clients should not expect an SSE session at this endpoint.

The core durable-run tools are:

| MCP tool                   | Scope | Input                                           |
| -------------------------- | ----- | ----------------------------------------------- |
| `helix_run_start`          | write | `idempotency_key`, start `request`              |
| `helix_run_continue`       | write | `run_id`, `idempotency_key`, continue `request` |
| `helix_run_cancel`         | write | `run_id`, `idempotency_key`, cancel `request`   |
| `helix_run_inspect`        | read  | `run_id`                                        |
| `helix_run_fetch_evidence` | read  | `run_id`                                        |
| `helix_run_list_events`    | read  | `run_id`, `after_seq`, `limit`                  |

The Shared Live Room extension tools are:

| MCP tool                        | OAuth scope                                       | Input                                          |
| ------------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| `helix_room_list`               | `helix.rooms.read`                                | none                                           |
| `helix_room_inspect`            | `helix.rooms.read`                                | `room_id`                                      |
| `helix_room_create`             | `helix.rooms.manage`                              | `idempotency_key`, create `request`            |
| `helix_room_bind_run`           | `helix.rooms.manage` and `helix.agent_runs.write` | run-binding `request`                          |
| `helix_room_claim_chat_binding` | `helix.rooms.manage` and `helix.agent_runs.write` | one-time chat-claim `request`                  |
| `helix_room_unbind_run`         | `helix.rooms.manage` and `helix.agent_runs.write` | opaque run-binding `binding_ref`               |
| `helix_room_unbind_chat`        | `helix.rooms.manage` and `helix.agent_runs.write` | opaque claimed-chat `binding_ref`              |
| `helix_room_source_list`        | `helix.room_sources.manage`                       | `room_id`                                      |
| `helix_room_source_create`      | `helix.room_sources.manage`                       | `room_id`, `idempotency_key`, source `request` |
| `helix_room_command_request`    | `helix.rooms.manage`                              | disabled command request                       |

The Minecraft Player Embodiment extension tools are:

| MCP tool                           | OAuth scopes                                          | Input |
| ---------------------------------- | ----------------------------------------------------- | ----- |
| `helix_minecraft_player_action`    | `helix.rooms.read`, `helix.environment_actions.write` | `room_id`, `idempotency_key`, optional environment label, typed `action` |
| `helix_minecraft_workflow_status`  | `helix.rooms.read`, `helix.environment_actions.read`  | `room_id`, exact `workflow_ref` |
| `helix_minecraft_workflow_control` | `helix.rooms.read`, `helix.environment_actions.write` | `room_id`, exact `workflow_ref`, resume/cancel/emergency-stop control |

These tools do not turn the Fabric mod into an MCP server and do not launch or
embed a model executable. Codex, ChatGPT, Gemini, or another MCP client connects
northbound to Helix; Helix resolves the current account, room,
participant/player binding, action authority, lease, live manifest, and
connector. The Fabric mod continues to poll the narrower southbound connector
protocol. Its credentials, private endpoint, and pairing material never enter
MCP arguments or results.

`helix_room_command_request` remains disabled. Typed player actions are not an
escape hatch to arbitrary Minecraft commands, host shell, files, RCON, launcher
credentials, or process control. Player motion and mutation remain bounded by
the admitted action schema, current authority, manual override, Emergency Stop,
and verified postconditions. Every action/control product is an observation for
Codex re-entry with `answer_authority: false` and `terminal_eligible: false`.

The authenticated MCP `tools/list` response is the source of truth for the
complete catalog and is not filtered into a misleading partial catalog based on
the token's granted scopes. Every protected tool declares its complete required
OAuth scope set; Shared Live Room tools carry their own scopes. Catalog
visibility does not grant permission: handlers enforce every declared scope and
the applicable current account policy. The two owner-withdrawal tools are the
deliberate cleanup exception to the current room-feature flag check; they still
enforce the complete OAuth scopes, linked principal, and exact owner tuple.

MCP mutation idempotency keys are explicit tool arguments. A JSON-RPC request ID
is not an idempotency key. The HTTP facade preflights the complete JSON-RPC
envelope before SDK dispatch: credential-shaped IDs, tool names, unknown keys,
or arguments are rejected with a static error and `id: null`, while the exact
opaque browser chat-claim argument remains admitted only to its named claim
tool. Successful calls return both text JSON and
`structuredContent`; failures return `isError: true` with a structured
`helix.agent_api.error.v1` value.

Every structured tool publishes an `outputSchema`. Protected tools publish
OAuth `securitySchemes` in the standard tool field and the compatibility
`_meta` field. A call rejected for `insufficient_scope` returns an MCP error
result with `_meta["mcp/www_authenticate"]`; an unauthenticated HTTP request
receives the corresponding `WWW-Authenticate` header. Account-policy,
host/origin, and tenant failures do not masquerade as OAuth scope failures.

## Public discovery and client configuration

The intended public addresses are:

- Agent Access guide:
  [`https://casimirbot.com/agent-access`](https://casimirbot.com/agent-access);
- Streamable HTTP MCP:
  `https://casimirbot.com/mcp`;
- OAuth protected-resource metadata:
  [`https://casimirbot.com/.well-known/oauth-protected-resource/mcp`](https://casimirbot.com/.well-known/oauth-protected-resource/mcp).

These addresses describe the production connection contract. Their presence in
this document does not prove that the current production release is deployed or
that any provider conformance test has passed.

Public retrieval and MCP tool invocation are separate capabilities. A search or
browser client may retrieve the public Agent Access page without gaining access
to protected tools. The MCP endpoint must be explicitly added by a user,
application developer, ChatGPT plugin, Codex or Gemini configuration, or outer
agent harness, and that client must complete OAuth. A page link, robots rule, or
search result cannot install or authorize the connection.

Keep access tokens out of source, prompts, URLs, screenshots, and logs. The
following examples show field names and environment-variable or placeholder
boundaries only; they do not contain usable credentials.

### ChatGPT

For a development connection, enable Developer mode under **Settings →
Security and login**, then open **Settings → Plugins**, select the plus button,
and add `https://casimirbot.com/mcp`. Review the tools and metadata discovered
from the server before using the connection. Availability can depend on the
user's account and workspace policy.

This developer-mode connection is separate from normal web retrieval. Broad
public distribution also requires packaging and publishing a reviewed ChatGPT
plugin; a search result or the Agent Access page cannot install either form of
connection.

### OpenAI Responses API

An application supplies CasimirBot as a remote MCP tool on each Responses API
request. The `authorization` value is the OAuth access token itself and should
come from the application's secret store:

```js
const casimirAccessToken = process.env.CASIMIRBOT_MCP_ACCESS_TOKEN;

const response = await openai.responses.create({
  model: process.env.OPENAI_MODEL,
  input: "Inspect this bounded research objective using admitted evidence.",
  tools: [
    {
      type: "mcp",
      server_label: "casimirbot",
      server_description:
        "Bounded Helix specialist runs with evidence and provenance.",
      server_url: "https://casimirbot.com/mcp",
      authorization: casimirAccessToken,
      allowed_tools: [
        "helix_run_start",
        "helix_run_continue",
        "helix_run_inspect",
        "helix_run_fetch_evidence",
        "helix_run_list_events",
        "helix_run_cancel",
      ],
      require_approval: "always",
    },
  ],
});
```

The application owns OAuth client registration and token acquisition. It also
owns approval handling and the bounded `start`/`continue` loop; CasimirBot does
not receive an OpenAI API key.

### Codex

Codex can store a remote Streamable HTTP server in user
`~/.codex/config.toml` or trusted-project `.codex/config.toml` without storing a
bearer token in that file:

```toml
[mcp_servers.casimirbot]
url = "https://casimirbot.com/mcp"
oauth_resource = "https://casimirbot.com/mcp"
scopes = [
  "helix.agent_runs.read",
  "helix.agent_runs.write",
  "helix.rooms.read",
  "helix.environment_actions.read",
  "helix.environment_actions.write",
]
enabled_tools = [
  "helix_run_start",
  "helix_run_continue",
  "helix_run_inspect",
  "helix_run_fetch_evidence",
  "helix_run_list_events",
  "helix_run_cancel",
  "helix_environment_device_check",
  "helix_minecraft_player_action",
  "helix_minecraft_workflow_status",
  "helix_minecraft_workflow_control",
]
enabled = true
required = false
startup_timeout_sec = 20
tool_timeout_sec = 360
```

When a remote MCP server has neither a bearer-token environment variable nor
static authentication headers, Codex discovers and performs OAuth for that
resource. After adding the entry, run `codex mcp login casimirbot` (or use the
Codex app's MCP sign-in control) and complete the provider-hosted OAuth flow.
Keep write-capable tools on the Codex host's write-sensitive approval policy;
approval policy is a host/app setting rather than an MCP-server field. A
controlled noninteractive host that already owns token acquisition may use
`bearer_token_env_var = "CASIMIRBOT_MCP_ACCESS_TOKEN"` instead of embedding a
token. ChatGPT does not read local Codex configuration; it needs its own
developer-mode MCP connection or an installed MCP-backed plugin, plus separate
user authorization.

### Gemini Interactions API

Gemini Interactions accepts remote MCP only over Streamable HTTP. Use a
hyphen-free server `name` and obtain the OAuth token in the calling
application:

```js
const casimirAccessToken = process.env.CASIMIRBOT_MCP_ACCESS_TOKEN;

const interaction = await gemini.interactions.create({
  model: process.env.GEMINI_MODEL,
  input: "Inspect this bounded research objective using admitted evidence.",
  tools: [
    {
      type: "mcp_server",
      name: "casimirbot",
      url: "https://casimirbot.com/mcp",
      headers: {
        Authorization: `Bearer ${casimirAccessToken}`,
      },
      allowed_tools: [
        "helix_run_start",
        "helix_run_continue",
        "helix_run_inspect",
        "helix_run_fetch_evidence",
        "helix_run_list_events",
        "helix_run_cancel",
      ],
    },
  ],
});
```

### Gemini Code Assist

Gemini Code Assist agent mode reads remote MCP definitions from the user's
Gemini settings. Its current remote-server fields are `httpUrl` and `headers`:

```json
{
  "mcpServers": {
    "casimirbot": {
      "httpUrl": "https://casimirbot.com/mcp",
      "headers": {
        "Authorization": "Bearer <OAUTH_ACCESS_TOKEN>"
      }
    }
  }
}
```

`<OAUTH_ACCESS_TOKEN>` is a documentation placeholder, not a literal value.
Populate the local setting through the user's approved credential workflow and
do not commit or publish the resolved file.

In every client, MCP results remain typed observations. The outer assistant must
continue the same `run_id` only while progress is possible, re-enter returned
evidence through its host reasoning loop, and respect Helix's source admission,
proof gates, completion contract, and canonical terminal-answer authority. A
receipt, event, evidence bundle, or MCP result cannot promote itself into the
final answer.

### Provider conformance probe

Run:

```text
npm run mcp:provider-conformance
```

The report is typed as `casimirbot.mcp_provider_conformance.v1` and recursively
redacts configured credentials. Without credentials it validates the public
Agent Access manifest, protected-resource metadata, and unauthenticated MCP
challenge. `CASIMIRBOT_MCP_ACCESS_TOKEN` adds authenticated `initialize` and
`tools/list`; adding `OPENAI_API_KEY` or `GEMINI_API_KEY` enables a separate
one-tool, one-step provider invocation. Each provider check creates at most one
60-second, one-step run and does not continue it.

For a keyed local server only, set
`CASIMIRBOT_MCP_PUBLIC_BASE_URL=http://127.0.0.1:1522` and
`CASIMIRBOT_MCP_CONFORMANCE_ALLOW_LOOPBACK_HTTP=1`. The opt-in does not permit
plain HTTP to a non-loopback host. Do not print, paste, or commit any of the
credential environment values.

Repository acceptance that needs the user's keys or signed-in browser state
must use the opaque `start-myapp-for-codex` launcher. The user starts that
server; an automated agent must not replace, bypass, or privately invoke the
keyed startup path. Deterministic unit, schema, and static checks do not need
that server. Stop the keyed server when live acceptance testing ends.

### Shared Live Room live acceptance harness

Run:

```text
npm run helix:shared-room:live-acceptance
```

The default invocation is a zero-network dry run that emits the typed,
secret-redacted acceptance plan. Configure live execution only through these
environment variables:

- `HELIX_SHARED_ROOM_ACCEPTANCE_BASE_URL` selects the target (default
  `https://casimirbot.com`).
- `HELIX_SHARED_ROOM_ACCEPTANCE_NETWORK=1` permits bounded network requests.
- `HELIX_SHARED_ROOM_ACCEPTANCE_ALLOW_LOOPBACK_HTTP=1` permits plain HTTP only
  for a loopback base URL.
- `HELIX_SHARED_ROOM_ACCEPTANCE_ACCESS_TOKEN` supplies the OAuth bearer without
  putting it in arguments or output.
- `HELIX_SHARED_ROOM_ACCEPTANCE_ALLOW_MUTATION=1`, together with the network
  opt-in, permits the bounded create, bind, unbind/rebind, cancel, and disabled
  command checks.
- `HELIX_SHARED_ROOM_ACCEPTANCE_TIMEOUT_MS` sets the per-request timeout from
  1,000 through 600,000 milliseconds.
- `HELIX_SHARED_ROOM_ACCEPTANCE_TOTAL_TIMEOUT_MS` bounds the full automated
  phase from 30,000 through 3,600,000 milliseconds (default 600,000), including
  a reserved cleanup window.
- `HELIX_SHARED_ROOM_ACCEPTANCE_REQUIRE_COMPLETE=1` makes a partial report exit
  nonzero so an unattended release job cannot mistake skipped live checkpoints
  for completion.

Room creation uses one caller-stable idempotency key
(`HELIX_SHARED_ROOM_ACCEPTANCE_ROOM_IDEMPOTENCY_KEY` may override it). The
harness deliberately retains that single room because the external facade has
no room-close operation. Each invocation uses a fresh run idempotency key.
When a mutation response is lost, the harness replays that exact key or the
naturally idempotent exact run-room bind to recover the opaque identifier
before cleanup, and it retries withdrawal and cancellation once. A typed
cleanup failure or outcome-unknown result remains a release failure; forced
process termination is not presented as successful cleanup.

The harness does not accept, scrape, or print a browser cookie, one-time chat
claim, or source bearer. A signed-in same-origin browser must still select the
chat, issue the one-time chat and source-delivery claims, exercise observer
disconnect/rebind and `after_seq`, and verify exactly one canonical terminal
append. A real Minecraft producer must then submit fresh exact-provenance
evidence. Representative keyed Ask, Realtime, text, and voice equivalence is a
companion interactive checkpoint, not an automated transport pass.

The v1 observer acceptance boundary is one active browser observer tab for the
bound chat. Stable terminal IDs deduplicate concurrent observer mounts in that
tab, and a persisted reload repairs only an exact canonical terminal copy that
the bounded chat cache truncated. Binding create/remove events synchronize
across tabs, but the general chat store remains a whole-envelope localStorage
snapshot without cross-tab transactional merge semantics. Do not claim
multi-tab durable terminal delivery. Supporting it later requires a
terminal-specific delivery ledger keyed by stable message ID, with exact
binding/authority/hash conflict checks and typed persistence failures; it must
not be implemented by union-merging the general chat envelope.

For loopback acceptance, the user must start the keyed server with the opaque
`start-myapp-for-codex` launcher and confirm that it is running before an agent
enables this harness's network mode. The harness never starts, replaces, or
bypasses that launcher. Stop the keyed server when the interactive acceptance
battery ends.

## Authentication and protected-resource metadata

The same configured audience protects REST and MCP. Discovery is available at:

```text
/.well-known/oauth-protected-resource
/.well-known/oauth-protected-resource/mcp
/.well-known/oauth-protected-resource/mcp/device-check
/.well-known/oauth-protected-resource/api/v1/agent-runs
/.well-known/oauth-protected-resource/api/v1/rooms
```

The Device Check path advertises the same canonical `resource` and authorization
server but only the `helix.rooms.read` scope. Its corresponding
`/mcp/device-check` server publishes only
`helix_environment_device_check`; the read-only plugin cannot discover the full
run, room, source, or command catalog. The other paths advertise the full run,
room, environment-action, and code-owned logical data scopes. Advertising a scope does not enable
its logical data scope; deployment admission still uses
`HELIX_AGENT_DATABASE_SCOPES`.

CasimirBot is the OAuth protected resource, not the authorization server. A
production connection therefore also needs an authorization server that:

- publishes OAuth 2.0 authorization-server or OpenID Connect discovery
  metadata;
- supports the authorization-code flow with PKCE `S256`;
- accepts and preserves the RFC 8707 `resource` value through authorization
  and token exchange, and issues the canonical CasimirBot resource as the
  access-token audience;
- supports Client ID Metadata Documents, dynamic client registration, or a
  pre-registered client for the OpenAI host;
- allowlists the provider-specific redirect URI and issues every requested
  Helix scope that the user actually grants.

The JWT verifier and protected-resource metadata in this application do not
manufacture those authorization-server capabilities. OpenAI's interactive
linking flow cannot pass until that server is selected and configured. Gemini
Interactions and Gemini Code Assist can send an already-issued bearer token,
but the surrounding application or credential workflow still has to obtain
that token safely.

### Auth0 profile for Codex and ChatGPT

Auth0 is the selected authorization server for the first production profile.
CasimirBot remains the resource server and continues to enforce account policy,
owner/tenant isolation, scopes, and its internal agent binding after Auth0 has
validated the user.

Configure an Auth0 API whose identifier exactly matches
`HELIX_AGENT_OAUTH_AUDIENCE` (`https://casimirbot.com/mcp` for production), use
RS256 access tokens, define `helix.rooms.read`,
`helix.environment_actions.read`, and `helix.environment_actions.write`, enable
manual Client ID Metadata Document registration, and import the OpenAI-hosted
CIMD URL presented for the MCP client. A Device Check-only client receives only
user-delegated `helix.rooms.read`; the full client receives environment action
scopes only after explicit user delegation. Populate
`HELIX_AGENT_OAUTH_ISSUER`, `HELIX_AGENT_OAUTH_JWKS_URL`,
`HELIX_AGENT_OAUTH_PROVIDER=auth0`, and `HELIX_AGENT_OAUTH_ALGORITHMS=RS256`
from the deployed tenant. Never package Auth0 administrative credentials,
client secrets, authorization codes, or bearer tokens in the desktop app or
plugin.

Auth0 configuration alone does not create a CasimirBot account binding. A
trusted Auth0 adapter must verify the callback identity and signed tenant before
calling the existing internal single-use account-link service. The public MCP
resource must continue to reject an otherwise valid Auth0 subject until that
exact binding exists and remains active.

Production verification uses a remote JWKS and validates the configured issuer,
audience, admitted asymmetric algorithm, subject, expiration, and a signed
tenant claim. Recognized tenant claim names are `tenantId`, `tenant_id`,
`customerId`, `customer_id`, `orgId`, and `org_id`. An optional
`X-Tenant-Id`, `X-Customer-Id`, or `X-Org-Id` header must match that signed
claim; a header cannot establish or override tenancy.

The configured provider alias and token subject must already exist in
`helix_account_linked_providers` and point to an active Helix account. The same
profile must also have a non-revoked `helix_agent_account_bindings` row matching
the token's exact issuer, signed tenant, provider alias, and subject. This
second, agent-specific grant prevents a provider subject from inheriting
profile access across tenants or issuer migrations. No account or binding is
created from token claims. Account policy is enforced in addition to OAuth
scopes. In production, developer account privileges also require the developer
OAuth scope and the existing developer-profile allowlist.

### Cookie-authenticated binding readiness and revocation

Binding management is a same-origin browser/account surface, not an MCP or
bearer-token surface:

| Method   | Path                                                | Authentication                | Purpose                                                        |
| -------- | --------------------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| `GET`    | `/api/account/session/agent-bindings`               | Active `helix_session` cookie | List sanitized bindings owned by the current Helix profile     |
| `DELETE` | `/api/account/session/agent-bindings/{binding_ref}` | Active `helix_session` cookie | Revoke the current profile's matching opaque binding reference |

Both routes re-resolve the active account session, and the store rechecks the
same session/profile tuple transactionally. Responses use `Cache-Control:
no-store`. A list projection has this shape:

```json
{
  "schema": "helix.agent_account_bindings.v1",
  "oauth_ready": true,
  "bindings": [
    {
      "binding_ref": "agent-binding:sha256:opaque",
      "issuer": "https://authorization-server.example",
      "tenant_ref": "tenant:sha256:opaque",
      "provider": "configured-provider-alias",
      "status": "active",
      "created_at": "2026-07-26T18:00:00.000Z",
      "updated_at": "2026-07-26T18:00:00.000Z",
      "revoked_at": null,
      "subject_included": false,
      "bearer_included": false
    }
  ]
}
```

`oauth_ready` means only that this Helix profile has at least one active
CasimirBot account binding. It does not prove authorization-server reachability,
client registration, granted scopes, access-token validity, or provider-client
connectivity. The projection never includes the provider subject, signed tenant
identifier, bearer token, authorization code, or provider credential.

Deleting a binding revokes CasimirBot's account admission for that exact
binding. It does not revoke an access or refresh token at the authorization
server; operators and users must perform provider-side revocation separately
when that is required. Repeating a delete of an already revoked binding is
idempotent.

There is no public `POST` create-link endpoint and no generic completion
callback that accepts client-supplied issuer, tenant, provider, or subject
claims. A concrete trusted provider adapter must:

1. complete the provider-hosted authorization flow;
2. verify the external identity and exact issuer, audience, tenant, provider
   alias, and subject;
3. invoke the internal transactional account-link service;
4. avoid persisting or projecting bearer tokens, authorization codes, or raw
   callback credentials.

The provider-neutral store supplies hashed, expiring, single-use link intent
state for that trusted adapter. Merely configuring the resource JWT verifier
does not create the adapter or expose a public completion route.

Production requests require HTTPS and an admitted `Host`. A supplied `Origin`
must also be admitted. Loopback HTTP exceptions exist only outside production.

## Logical data scopes

`database_scope` values are logical, code-owned policies. Deployment
configuration can enable a catalog entry but cannot invent capability IDs or
raise its read-only ceiling. A requested scope must pass all four checks:

1. enabled by `HELIX_AGENT_DATABASE_SCOPES`;
2. present in the code-owned catalog;
3. entitled by the matching OAuth data scope;
4. every exact capability admitted by that logical scope is available under the
   linked Helix account policy.

The policy is checked at start and checked again before every continuation so
revocation takes effect on the next turn.

| Logical scope ID      | Required OAuth scope                  | Required evidence family    | Admitted read capabilities                                         |
| --------------------- | ------------------------------------- | --------------------------- | ------------------------------------------------------------------ |
| `public_web`          | `helix.data.public_web.read`          | `internet_search_evidence`  | `internet-search.search_web`                                       |
| `scholarly_research`  | `helix.data.scholarly_research.read`  | `scholarly_evidence`        | paper lookup, full-text fetch, numeric extraction                  |
| `research_library`    | `helix.data.research_library.read`    | `research_library_evidence` | `research-library.read_document`                                   |
| `repository_evidence` | `helix.data.repository_evidence.read` | `repository_evidence`       | code, repository, and documentation search/read tools              |
| `theory_registry`     | `helix.data.theory_registry.read`     | `theory_registry_evidence`  | theory-context reflection tools                                    |
| `bound_room_evidence` | `helix.rooms.read`                    | `shared_live_room_evidence` | `room.evidence.read_bound` for the run's exact active room binding |
| `bound_room_environment_probe` | `helix.rooms.read` | `shared_live_room_environment_probe` | `com.casimirbot.minecraft.inventory.check` for the run's exact active room and paired read-only connector |

An empty deployment allowlist admits no logical data scopes. A run may still be
created with an empty `database_scope`; its external turn receives no admitted
retrieval tools.

## Completion loop

The three status fields answer different questions:

- `lifecycle_status`: storage/execution state (`queued`, `running`, `waiting`,
  `completed`, `failed`, or `cancelled`);
- `completion_status`: what the outer loop should do (`pending`, `completed`,
  `needs_more_evidence`, `needs_input`, `conflict_detected`, `blocked`,
  `failed`, `budget_exhausted`, or `cancelled`);
- `terminal_authority_status`: whether canonical Helix terminal authority was
  evaluated and verified.

The normal client loop is:

```text
start
  -> inspect returned version/status
  -> continue once
  -> if needs_input, obtain judgment and answer the named question
  -> if needs_more_evidence/conflict_detected/blocked and progress is possible,
     continue with a bounded instruction
  -> stop on completed, failed, budget_exhausted, or cancelled
```

Completion is evaluated after every turn against the stored contract: solver
success, minimum evidence count, required output fields, unresolved-requirement
limit, conflict policy, and—by default—canonical terminal authority. A run also
stops when `max_steps` is exhausted or its absolute expiry is reached.

## Evidence and terminal authority

Logical scopes resolve to an exact runtime capability set and required evidence
families. The external Helix Ask turn runs in read mode; both the model-visible
capability menu and runtime call validation enforce that set.

Evidence is externally projected only from the current turn's successful solver
artifact re-entry audit. When terminal grounding is required, projected
evidence is further intersected with the canonical authority's supporting
references.

Required-evidence families are satisfied only when the canonical current-turn
projection explicitly names the family and that turn supplies current
observation, evidence, or receipt artifact references. The service independently
reconstructs unsatisfied `required_evidence:*` requirements on every
continuation. Generic executor requirement resolution and cumulative
previous-turn references cannot remove this hard gate.

A terminal product is projected only after verification of the existing
canonical terminal-grounding authority, terminal presentation, terminal-answer
authority, text hash, artifact/source identity, and single-writer integrity.
The external verifier does not mint or repair authority. Even when
`terminal_authority_status` is `authorized`, the enclosing run, evidence bundle,
event, and MCP result retain:

```json
{
  "answer_authority": false,
  "assistant_answer": false,
  "terminal_eligible": false,
  "raw_content_included": false
}
```

An outer assistant may use the verified terminal product and evidence according
to its own host policy, but it must not treat a receipt or status record as an
answer.

## Idempotency and versioning

Idempotency is scoped by owner and operation. Reusing a key with the same
validated input replays the stored response; reusing it with different input
returns `idempotency_conflict`. A live reservation returns
`idempotency_in_progress`. If a mutation may have taken effect but its response
receipt was not durably completed, the API returns `outcome_unknown`; inspect
the named run before deciding whether to retry.

The current store retains completed idempotency receipts for 24 hours. The
processing lease is at least two minutes and otherwise one minute longer than
the configured turn timeout.

Every continuation and cancellation requires the current positive
`expected_version`. A stale value returns `version_conflict` with
`current_version`. A claimed continuation also prevents a concurrent
continuation; callers may receive `run_busy`. Durable compare-and-set
finalization prevents a stale turn result from overwriting a later cancellation
or version.

## Cancellation and timeout limits

Cancellation is authoritative for durable run state. On the same application
process, the service also aborts the active turn's `AbortController`. The turn
watchdog likewise races the executor against `HELIX_AGENT_TURN_TIMEOUT_MS` and
signals that controller when the deadline is reached.

This is cooperative cancellation, not a hard kill:

- the default executor forwards the process-local signal and effective
  deadline into the full Ask wrapper;
- Helix Ask checks that state before solver entry, at shared helper and LLM
  retry boundaries, before streamed or terminal emission, and again before
  external finalization and projection;
- those checks stop later phases once control returns to a boundary, but an
  underlying provider or tool call that does not consume the signal may
  continue until it returns;
- an abort signal is process-local and does not reach work executing in another
  application process;
- no distributed worker cancellation channel, process termination, or
  cross-process hard-kill guarantee is implemented;
- timeout or cancellation can therefore stop durable finalization without
  guaranteeing that all in-flight computation or network activity ended at the
  same instant.

The read-only scope boundary limits the impact of late work, and versioned
finalization prevents it from replacing the durable cancelled state. A
deployment needing hard termination must add a worker/job supervisor and
provider-specific cancellation protocol; this v1 contract does not provide one.

The turn timeout defaults to 120,000 ms and is clamped to 1,000-900,000 ms. The
effective deadline is the earlier of that timeout and the run's absolute
expiry.

## Deployment configuration

The protected resource is fail-closed when OAuth is incomplete. Configure:

| Variable                                                                                  | Purpose                                                                                                                                          |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CASIMIR_PUBLIC_BASE_URL`                                                                 | Canonical public HTTPS origin used in metadata and documentation links                                                                           |
| `TRUST_PROXY`                                                                             | Exact reverse-proxy trust or hop configuration needed when TLS terminates upstream so Express can validate forwarded HTTPS                       |
| `HELIX_AGENT_OAUTH_ISSUER`                                                                | Exact authorization-server issuer                                                                                                                |
| `HELIX_AGENT_OAUTH_AUDIENCE`                                                              | One canonical resource audience shared by REST and MCP                                                                                           |
| `HELIX_AGENT_OAUTH_JWKS_URL`                                                              | Remote signing-key set                                                                                                                           |
| `HELIX_AGENT_OAUTH_PROVIDER`                                                              | Provider alias used for the existing account link                                                                                                |
| `HELIX_AGENT_OAUTH_ALGORITHMS`                                                            | Admitted asymmetric algorithms                                                                                                                   |
| `HELIX_AGENT_ALLOWED_HOSTS`                                                               | Comma-separated request hosts                                                                                                                    |
| `HELIX_AGENT_ALLOWED_ORIGINS`                                                             | Comma-separated browser origins                                                                                                                  |
| `HELIX_AGENT_DATABASE_SCOPES`                                                             | Comma-separated enabled logical scope IDs                                                                                                        |
| `HELIX_AGENT_TURN_TIMEOUT_MS`                                                             | Per-continuation watchdog deadline                                                                                                               |
| `HELIX_AGENT_BODY_LIMIT`, `HELIX_MCP_BODY_LIMIT`                                          | Independent JSON body limits                                                                                                                     |
| `HELIX_AGENT_IP_RATE_LIMIT`, `HELIX_MCP_IP_RATE_LIMIT`                                    | Per-minute pre-auth limits                                                                                                                       |
| `HELIX_AGENT_PRINCIPAL_RATE_LIMIT`, `HELIX_MCP_PRINCIPAL_RATE_LIMIT`                      | Per-minute verified-principal limits                                                                                                             |
| `HELIX_RUNTIME_APPROVAL_TRUSTED_PUBLIC_KEYS_JSON`                                         | Exact bounded Ed25519 public-key registry for internal workstation approval receipts; empty fails closed and supplies no signer or approval host |
| `HELIX_ROOM_AGENT_BODY_LIMIT`                                                             | JSON body limit for the external room REST facade                                                                                                |
| `HELIX_ROOM_AGENT_IP_RATE_LIMIT`                                                          | Per-minute pre-auth room REST limit                                                                                                              |
| `HELIX_ROOM_AGENT_PRINCIPAL_RATE_LIMIT`                                                   | Per-minute verified-principal room REST limit                                                                                                    |
| `HELIX_AGENT_RUN_OBSERVER_IP_RATE_LIMIT`, `HELIX_AGENT_RUN_OBSERVER_ACCOUNT_RATE_LIMIT`   | Per-minute same-origin browser observer limits                                                                                                   |
| `HELIX_ROOM_SOURCE_BROWSER_IP_RATE_LIMIT`, `HELIX_ROOM_SOURCE_BROWSER_ACCOUNT_RATE_LIMIT` | Per-minute same-origin source-manager and credential-claim limits                                                                                |
| `HELIX_BOUND_ROOM_EVIDENCE_MAX_AGE_MS`                                                    | Freshness ceiling for exact-provenance bound-room evidence                                                                                       |

`HELIX_AGENT_ALLOW_LOCAL_HS256=1` plus a
`HELIX_AGENT_LOCAL_JWT_SECRET` of at least 32 characters is an explicit
nonproduction-only test path. It is rejected as the production verification
mode.

Before exposing the resource, complete this production checklist:

1. Deploy one full-stack application that serves `/mcp`,
   `/api/v1/agent-runs`, `/api/v1/rooms`,
   `/api/account/session/agent-bindings`, the cookie-authenticated browser
   observer/source routes, and source ingress. Do not route these paths to the
   static SPA fallback. When TLS terminates at a trusted reverse proxy, set
   `TRUST_PROXY` to that exact topology so Express can validate
   `X-Forwarded-Proto: https`; do not trust arbitrary client-supplied proxy
   headers.
2. Apply all database migrations, including the Helix account, Agent API,
   Shared Live Room binding/consent, and agent-account-link lifecycle
   migrations.
3. Select an authorization server and configure its discovery metadata,
   authorization-code flow with PKCE `S256`, RFC 8707 resource propagation,
   canonical CasimirBot audience, client-registration path, exact redirect
   allowlists, and requested Helix scopes.
4. Store provider credentials only in the deployment secret store. Set the
   exact issuer, audience, JWKS URL, provider alias, admitted algorithms,
   public base URL, host/origin allowlists, and logical data-scope allowlist.
   `HELIX_AGENT_OAUTH_PROVIDER` must exactly match the alias persisted by the
   trusted provider adapter.
5. Implement and configure that trusted adapter. It must verify the external
   identity before calling the internal account-link service; do not add a
   generic public callback that accepts raw identity claims.
6. From an active Helix browser session, complete the adapter-owned link flow.
   Confirm `GET /api/account/session/agent-bindings` reports one sanitized
   active binding and remember that `oauth_ready: true` proves binding
   readiness only.
7. Verify an issued access token contains the exact issuer, canonical audience,
   subject, expiration, signed tenant, and granted scopes expected by the
   protected resource. Confirm a different tenant, issuer, subject, provider
   alias, or Helix profile fails closed.
8. Exercise the unauthenticated MCP challenge, authenticated `initialize` and
   `tools/list`, per-tool insufficient-scope reauthorization, REST
   idempotency/version conflicts, rate limits, replay protection, and
   secret-free logs.
9. Exercise browser binding management: missing and expired sessions fail,
   cross-profile references are not found, sanitized fields remain absent, and
   `DELETE` makes subsequent bearer admission fail. Revoke provider-side tokens
   separately when required.
10. Run the production smoke and provider-conformance checks, then complete one
    bounded invocation through each supported OpenAI and Gemini client surface.

## Observability and operations

The routes run behind the application's OpenTelemetry middleware and return a
stable `X-Request-Id`. Safe caller-supplied values are bounded to 160
characters and preserved; credential-shaped values are replaced with a
server-generated request ID and are never reflected in headers or error bodies.
Durable events provide the replay/audit timeline; sequence numbers are local to
each run. Persisted run snapshots expose budget use, status, evidence refs,
unresolved requirements, contradictions, questions, timestamps, and sanitized
failure codes.

Operators should alert on repeated `internal_error`, `outcome_unknown`,
`run_busy`, timeout, scope-policy, authentication, and tenant-mismatch results;
track step and expiry exhaustion; and retain database backups appropriate to
the audit requirements. Event polling is currently pull-based. This v1 surface
does not implement webhooks, background job status streams, or a distributed
cancellation bus.
