Program gate: EH-G8
Workstream: Governed MCP bootstrap and public Shared Live Room control
Capability or component: Stable transition shadow catalog and MCP Evidence Capability Conformance v1
Lifecycle stage: Transition admission and evidence re-entry
Reaction timescale: Interactive Codex tool loop
Authority owner: Native CasimirBot desktop broker plus existing room handlers
Current maturity: Deterministically verified, partially installed-accepted
Target maturity: Installed end-to-end transition and one governed room mutation
Required evidence: Schema parity, fail-closed pre-transition calls, native transition receipt, catalog refresh, room post-state receipt
Explicit non-goals: DOM automation, credential access, trading authority, private model/tool loop, terminal answer authority
Downstream gate unlocked: Uninterrupted Codex configuration of admitted public UI capabilities

# EH-G8 stable MCP transition shadow catalog v1

## Decision

The read-only coordination server advertises the governed desktop transition
tool and these nine Shared Live Room tools before the full transport is active:

- `helix_room_list`
- `helix_room_inspect`
- `helix_room_floor_inspect`
- `helix_room_create`
- `helix_room_presence_set`
- `helix_room_consent_revoke`
- `helix_room_consent_grant`
- `helix_room_floor_release`
- `helix_room_floor_acquire`

The declarations exactly reuse the full server's names, descriptions, schemas,
annotations and OAuth security schemes. Before a governed transition, every
shadow room call fails closed with `full_mcp_transition_required`; it never
invokes a room handler. This is catalog continuity, not authority escalation.

The native desktop broker still owns transition validation, developer-account
revalidation, lease bounds, immutable receipts, Emergency Stop behavior and
automatic return to read-only. The existing room handlers continue to own
account policy, membership, room identity, idempotency, signed one-use grant
delegation, exact floor epoch and post-state verification.

The transition receipt retains `catalog_refresh_required=true` because the
full environment catalog is not pre-advertised. It adds
`shared_live_room_catalog_pre_advertised=true` to distinguish this bounded
continuity slice from whole-catalog convergence.

## Public UI discovery contract

The public UI evidence catalog projects the same nine declarations in a
separate `mcp_bindings` collection. Each binding states the tool name,
capability identity, affected stable control IDs when an exact mapping exists,
OAuth scopes, mutation and idempotency properties, signed-delegation
requirement, fail-closed pre-transition behavior, and governed post-transition
behavior.

Browser controls keep their existing UI authority classification. An MCP
binding is an alternate governed semantic route, never a claim of DOM control.
Every projected artifact remains evidence-only:
`assistant_answer=false`, `answer_authority=false`,
`agent_executable=false`, `terminal_eligible=false`, and re-entry is required.

## Refresh contract

After the native broker accepts a transition, the MCP server sends standard
`notifications/tools/list_changed` and reports
`tool_list_changed_requested=true`. A safe idempotent replay sends the
notification again so a reconnecting host has another bounded refresh
opportunity. A rejected transition sends no notification.

The notification is advisory. It grants no authority and does not weaken the
existing reconnect requirement. Notification transport failure is kept
separate from the already-completed native side effect, preventing a lost
advisory signal from turning an accepted transition into a misleading tool
failure.

## Deterministic evidence

Verification on 2026-08-29:

- local-supervisor MCP: 12/12 tests pass;
- room consent, delegated grant/acquire, floor, Device Check, desktop
  transition executor and native boundary: 6 files, 16/16 tests pass;
- public UI MCP catalog: 3/3 tests pass, including nine route-owned bindings;
- `npm run helix:ask:discipline:quick`: pass;
- `npm run helix:environment-harness:docs-audit`: pass (`ok=true`);
- relevant `git diff --check`: pass, except line-ending warnings;
- desktop host/service bundle: pass, with pre-existing duplicate-code warnings
  outside this capability slice.

The local-supervisor test compares all nine shadow and full definitions across
name, title, description, input schema, output schema, annotations and OAuth
security schemes. It also calls shadow `helix_room_list` and proves typed denial
before any handler execution. Its protocol observer proves one tool-list signal
after native acceptance, another after safe idempotent replay, and none after a
rejected transition.

The full repository TypeScript check is inconclusive because the compiler
exhausted Node's approximately 4 GB heap after about 412 seconds. This is a
resource failure, not a diagnostic or a pass. Focused Vitest transforms and
executes the changed TypeScript successfully.

The all-public-control inventory gate is independently red: the source
inventory finds 411 controls while the generated runtime-safe catalog has 398.
All 13 additions are concurrent Image Lens changes and six lack semantic IDs.
This packet does not regenerate or overwrite that unrelated in-progress work.

## Package integrity

Acceptance packages were isolated and did not overwrite the known-good install:

- v1 packed service SHA-256:
  `4dc26bd205e7f1fc789c2e78a821977f295d6deed87def551c05e6753bed1335`;
  runtime manifest SHA-256:
  `94a74397fa671a8bb9395f4e267c988579de87c4647d8ea3a8158086685cc67a`.
- v2, containing tool-list notification support, packed service SHA-256:
  `426a3798b8c0b4482c777a00011f414d2c2d27c843faf44aca1171fb03d9745b`;
  runtime manifest SHA-256:
  `1ec69aad0d343a5e7267f772715c22d6d717c9e0c2d069cc5a070c7feba9bbef`.
- v3, containing the MCP-binding projection, packed service SHA-256:
  `31fab58a722fbd7387d3240cfa45f69b834345337a2af2d298971cbde2eeaaf4`;
  it exactly matches the built service. Its containing `app.asar` SHA-256 is
  `439643b80512ebee7ab5ab4b6421bc9fe5c6941c93dad2902b6b6553173f358b`.

Process inspection found the running Electron host/service rooted in the exact
isolated acceptance directory for each installed check.

## Installed acceptance

Device Check succeeded through the rebuilt private tunnel, including v2 durable
observation
`mcp_evidence_observation:helix.environment.device_check.inspect:1d994234-816d-45bf-9427-9001959ded74`.

The v3 running EXE returned all nine Shared Live Room MCP bindings, no orphan
capabilities and no control-binding failures through the already-admitted
`helix_public_ui_catalog` tool. Durable observation:
`mcp_evidence_observation:helix.public_ui.catalog.inspect:c8725e69-9c18-4bdf-a6c3-6d4b7da56d50`.
This closes the installed semantic-discovery slice.

The public-room browser audit observation
`mcp_evidence_observation:helix.public_ui.catalog.inspect:104a9645-290c-4246-832e-05ef5e595f7b`
found 103 controls: two route-owned floor controls and 101
`blocked_pending_contract`. That result motivated the separate MCP projection;
implemented semantic tools must be discoverable without falsely classifying
browser controls as executable DOM actions.

## Remaining end-to-end acceptance

The required terminal trace remains:

```text
remote connector admits transition plus nine room declarations
-> active exact OAuth-bound installed MCP presence
-> transition request
-> separate first-party native developer delegation
-> transition execute receipt
-> notifications/tools/list_changed and client relist
-> tunnel targets /mcp
-> same Codex continuation calls helix_room_list or helix_room_inspect
-> one authorized bounded room configuration call
-> typed post-state receipt
```

This Codex continuation still receives the previously admitted catalog from the
remote App SDK connector. Relaunching the EXE and ordinary turn continuation do
not update that remote admission. The local generic MCP entries are not the
provenance of the current Device Check app, plugin management has no catalog
refresh operation, and the ChatGPT-launched app-server exposes no attachable
control socket. Consequently the transition tool itself cannot yet be called
to emit the new refresh notification.

Once the remote connector admits `helix_desktop_tunnel_transition`, the native
transition and standards-based relist path can be tested without ChatGPT
computer control. Until that exact trace exists, do not claim installed room
configuration acceptance.

## 2026-08-29 connector-snapshot audit

A fresh Codex continuation attached the separately configured
`casimirbot_g2_a1_local` server and exposed its full development catalog. That
server is process `node.exe` listening on `127.0.0.1:1522`; it is not the
installed EXE's private tunnel. Through this development-only provenance,
Codex successfully changed its own participant presence in
`shared_realtime_room:43b93243-1f90-49fd-88c9-bd2f4cbdf3d3` from `away` to
`present`, independently inspected and confirmed `present`, restored `away`,
and independently confirmed the restoration. Both mutation and inspection
receipts retained `assistant_answer=false` and `terminal_eligible=false`.
This proves the room handler and Codex re-entry path, but it is deliberately
not counted as installed-EXE or private-tunnel acceptance.

The Codex app-server `app/read` method then queried the known remote app ID
`asdk_app_6a91d26fb68481918606bfc290b2ab0d` with tool summaries enabled after
a forced app-directory refetch. The committed remote snapshot still contains
exactly seven tools: Device Check, public UI catalog, presence update,
coordination read, relay publish, relay acknowledge, and presence disconnect.
It contains neither `helix_desktop_tunnel_transition` nor any room tool. This
proves the blocker is the server-side developer-app metadata snapshot rather
than the EXE build, MCP schemas, local Codex configuration, or a missing port.

Official OpenAI developer documentation defines the refresh procedure for a
developer-mode MCP connection: deploy or restart the MCP server, open the
connection at `https://chatgpt.com/plugins`, select **Refresh**, confirm the
advertised metadata changed, then start a new conversation and rerun the
affected tests. A forced `app/list` refetch is not that connection metadata
refresh. The available plugin-management tools expose permissions,
dependencies and removal only; they cannot refresh developer-app metadata.
The in-app browser runtime reported no available authenticated browser, so this
continuation cannot safely perform the required UI operation.

## 2026-08-30 connection refresh acceptance

After explicit user authorization, an authenticated Chrome connection became
available. The installed plugin detail page opened its management settings and
showed the expected stale seven-tool developer-mode snapshot. Selecting its
**Refresh** control completed successfully. The same connection view then
advertised 20 tools, including:

- `helix_desktop_tunnel_transition_request`
- `helix_desktop_tunnel_transition_inspect`
- `helix_desktop_tunnel_transition_execute`
- all nine `helix_room_*` tools projected by the public UI catalog
- `helix_evidence_observation_get`
- Device Check, public UI catalog, and the five supervisor coordination tools

A separate Codex app-server `app/read` call confirmed the committed remote app
snapshot contains exactly those 20 tool summaries. `app/installed` with
`forceRefresh=true` independently reported app
`asdk_app_6a91d26fb68481918606bfc290b2ab0d` as `enabled=true` and
`callable=true`.

The following Codex continuation admitted all 20 refreshed declarations and
successfully called Device Check and the local-supervisor presence heartbeat
through the exact v3 installed EXE. The transition request then failed closed
with `insufficient_scope`: the continuation's bearer predates
`helix.desktop.tunnel.transition.request`. The plugin settings correctly marked
the three transition declarations and `helix_room_presence_set` as
**Reconnect needed**.

The owner explicitly approved reconnecting the existing CasimirBot connection
for these additions:

- `helix.desktop.tunnel.transition.request`
- `helix.desktop.tunnel.transition.execute`
- `helix.environment_actions.write`

The OAuth callback completed, and an independent Codex app-server
`app/installed` forced refresh still reported the app enabled and callable.
However, repeated calls from this already-active task continued to present the
pre-reconnect bearer and received the same typed `insufficient_scope` result.
Starting another app-server and attempting to resume this exact task failed
closed with the deterministic single-writer error `thread-store conflict`;
the active task cannot be rebound to a second runtime merely to obtain a fresh
app credential.

This locates the first divergence at **host task credential admission**, after
catalog admission and before native transition admission. It is not an MCP
schema, installed tunnel, native presence, or room-handler regression. Do not
weaken OAuth scope enforcement or prefer the native desktop delegation over a
supplied external bearer to conceal it. The remaining installed acceptance
must start in a fresh Codex task after the approved reconnect, then execute the
existing request -> native delegation -> inspect -> execute -> relist -> room
mutation -> post-state -> restoration chain. Existing connections established
after the 20-tool metadata was published should receive these scopes during
their initial OAuth grant; this is specifically the migration path for a
connection created before the shadow catalog and its scopes existed.

## 2026-08-30 authority-stage correction

The owner repaired the Auth0 resource-server permissions and granted the exact
current ChatGPT third-party client all five CasimirBot Device Check scopes. One
subsequent OAuth consent completed successfully. The plugin then reported the
connection active, advertised all 20 tools and showed no `Reconnect needed`
markers.

A fresh installed MCP presence succeeded, but
`helix_desktop_tunnel_transition_request` failed closed with
`transition_native_developer_session_required`. Code inspection located a
two-part admission deadlock:

1. the request tool required a native desktop principal before it could create
   the request that the native desktop UI was supposed to approve; and
2. the transition store bound native approval to the requester's OAuth-derived
   session id even though the first-party desktop UI necessarily uses a
   distinct native account session.

The narrow correction preserves both authorities instead of preferring one:

- the request remains bound to the exact scoped OAuth client, derived MCP
  client session, continuation, profile and requester-session hash;
- only an active same-profile `developer` session on the same-origin native
  desktop route can grant the pending request;
- the store privately binds that separate native delegation session;
- inspect and execute remain restricted to the original OAuth requester; and
- the desktop broker receives only the separately delegated native session id
  and revalidates it against the installed app's active developer session.

Receipts now state whether the requesting client identity is
`native_tunnel_client_plus_server_derived_continuation` or
`external_oauth_client_plus_server_derived_continuation`, and accurately set
`independent_external_oauth_client_bound`. Neither form grants environment,
trading or terminal authority. Focused store, native consent-route and MCP
tests pass 23/23, including different-session OAuth request/native approval,
wrong-authority rejection, exact execution binding and notification behavior.
Installed acceptance remains open until the rebuilt installed service produces
the full request -> native delegation -> inspect -> execute -> relist -> room
mutation -> independent post-state -> exact restoration trace.

The first rebuilt installed retry then exposed a second, narrower admission
divergence. Production OAuth principals deliberately attenuate generic
`developer` account policy unless the bearer also has
`helix.agent_runs.developer`, but the Device Check client is intentionally
limited to its five capability-specific scopes. Transition admission now uses
the separately retained server-verified developer-profile classification for
an external OAuth requester, while still requiring the exact transition OAuth
scope and the separate same-profile native developer delegation. This does not
grant generic developer, environment, trading, or terminal authority.

The next installed execution produced an accepted native receipt and did start
the full-surface tunnel target, but the tunnel-client startup probe recorded
`/mcp -> Unauthorized`; the native safety path then restored the read-only
coordination target. The full `/mcp` mount had omitted the native-session
delegation adapter required because Secure MCP Tunnel authenticates the remote
OAuth client without relaying its bearer to the loopback target. The full mount
now binds only the five approved Device Check client scopes to the exact active
desktop account session after the separate governed transition. The loopback
desktop-session and account-session checks remain mandatory, and the change
does not admit any scope outside that five-scope bundle.

With `/mcp` initialization repaired, the first remote room call still consumed
the client's approximately 105-second reconnect timeout. The native panel had
hard-coded a 120-second grant even when the governed request asked for a longer
bounded lease, so approval time plus reconnect exhausted the grant and invoked
the correct read-only safety restoration before the retry. The native panel now
submits and displays the request's exact `requested_lease_seconds`; the existing
server validation continues to cap the grant at 300 seconds.

The rebuilt installed retry then reached the advertised room catalog but failed
closed with `account_policy_blocked`. The OAuth principal correctly remained a
generic `user` principal because the Device Check client does not hold generic
developer-run authority, but that attenuation also locked Shared Live Rooms
despite the bearer holding the exact room capability scopes. Principal policy
now enables only the Shared Live Rooms experiment when the verified bearer has
`helix.rooms.read` or `helix.rooms.manage`. It does not promote `accountType`,
and unrelated developer panels remain locked. A focused principal test covers
that exact boundary.

## 2026-08-30 installed v3 acceptance trace

The packaged v9 installed desktop passed its runtime-tree and smoke checks.
Its `app.asar` SHA-256 is
`60110FDED2219A265CE863D88C306C396AC61DF3DF12FF9DDCEE6D4BDBDB5F37`;
the Device Check renderer asset SHA-256 is
`9EFCA4DC09514DD7F2944AA9B8560C73991B8D3F45B0ECC85D896D4565CE5CE6`.

The fresh installed trace used service instance
`service_instance:cfdae79953059d6cff07a71976c2d4b0`, client session
`supervisor_client:566ac24081a7e555750bab2339aa9009`, and main request
`desktop_tunnel_request:3049ac2f-09b9-4d99-a992-2d7b56390848`. Its immutable
receipts were:

- requested: `desktop_tunnel_receipt:77e977f5-b036-4def-a444-de371c16bd1d`;
- delegated: `desktop_tunnel_receipt:e500f240-4f61-4c33-ad10-b212f4e5daef`;
- transition accepted: `desktop_tunnel_receipt:41f9c049-dfec-4881-8902-de099819a83c`;
- native transition: `native_transition_receipt:96LdDViUeiXcs64fl_SILCGL`.

The execute response requested `notifications/tools/list_changed`. The same
client then relisted exactly 20 tools: all nine room tools and all three
transition tools were present. A cold first `helix_room_list` call returned an
HTTP 504 and its immediate retry succeeded; both attempts remain provenance.

The chosen visible room was
`shared_realtime_room:07c009a9-cb6f-44f9-a1c4-48baa2e079ef` (`Shared GPT
Live`). Its linked participant was
`shared_realtime_participant:16b39455-1f7b-4d6f-b4bb-0a3965f816e3`. An
independent initial inspect recorded the exact original presence `present`.
Only that participant's presence changed:

- `helix_room_presence_set` changed `present -> away`; its typed
  `helix.shared_live_room.presence_set_receipt.v1` projected `away` with room
  `updated_at=2026-08-30T17:58:31.566Z`;
- an independent `helix_room_inspect` confirmed `away`;
- mandatory restoration changed `away -> present`; its typed receipt projected
  `present` with room `updated_at=2026-08-30T17:58:44.526Z`;
- the final independent inspect projected `present` for the same participant
  and retained the restoration `updated_at=2026-08-30T17:58:44.526Z`.

These room receipts do not emit durable `mcp_evidence.observation_ref` values;
their exact typed receipt schemas, operation names, room/participant ids and
timestamps are the post-state references. Every receipt remained
`answer_authority=false`, `assistant_answer=false`, and
`terminal_eligible=false`.

The first post-restoration inspect began at the end of the main lease and kept
an HTTP 504 as provenance. Two verification-only transitions were opened. The
first accepted receipt
`desktop_tunnel_receipt:5bad4817-b824-4cdd-bb30-7b03f0e38da4` also reached
its lease boundary during a cold read. The final verification-only request
`desktop_tunnel_request:57142351-5743-49f1-9554-dc37bc3cbd5f` produced
requested receipt `desktop_tunnel_receipt:8da5940f-7071-4d4c-8fb7-9d7fdeff9242`,
delegated receipt `desktop_tunnel_receipt:ac515277-616c-4b87-bcb1-635502664d29`,
accepted receipt `desktop_tunnel_receipt:7f2d3612-ffff-4d34-9020-f56a1d00ea05`,
and native receipt `native_transition_receipt:qSmvqNejnlRcokCxlMA8DP5x`. Its
catalog relist at `2026-08-30T18:14:57.101Z` again found 20/9/3 tools. The cold
inspect returned HTTP 504; its immediate retry at
`2026-08-30T18:17:04.183Z` independently confirmed the restored `present`
state.

No consent, floor, membership, other participant, environment authority, or
terminal authority changed. With the exact original presence restored and
independently verified, this completes the installed v3 Device Check v2
acceptance trace without promoting any room receipt to assistant-answer or
terminal authority.

## 2026-08-30 environment-catalog refresh and full-surface continuity repair

The installed Device Check v2 plugin was refreshed through its authenticated
plugin-management surface after the environment transition shadows were added.
The refreshed remote declaration visibly included
`helix_environment_subject_list`, `helix_environment_source_pair_local`,
`helix_minecraft_actor_status`, `helix_minecraft_player_action`, and
`helix_minecraft_workflow_control`. Only the public catalog and durable evidence
read declared an additional reconnect requirement for
`helix.agent_runs.read`; the Minecraft transition shadows themselves did not
request an ungranted environment scope. The already-running Codex task retained
its earlier immutable 20-tool snapshot. This distinguishes successful remote
plugin schema publication from host-side adoption by an existing task.

The same inspection found that the full `/mcp` router did not receive the
desktop transition store or native transition executor. As a result, the
governed bootstrap/recovery tools disappeared after a successful transition to
the more capable surface. The full router now registers the same transition
request, inspect, and execute controls as the restricted surface. Their
presence does not grant a transition: server-derived presence, exact requester
identity, native developer delegation, a finite lease, and the separate native
executor remain mandatory.

Focused verification passed:

- `keeps governed transition controls registered on the full MCP surface` —
  1/1 focused Vitest case;
- `npm run build:server` — pass, retaining four unrelated pre-existing build
  warnings.

The durable release shape is therefore a stable, pre-advertised plugin catalog
whose tools fail closed until their transport and authority prerequisites are
present. A scope change must not require the model to rediscover bootstrap
controls. Remaining product work is managed host catalog adoption and a
profile-owned local connector gateway that survives the installed service's
per-launch loopback-port changes. Neither catalog publication nor tunnel
readiness may imply Minecraft sensing or Player Embodiment readiness.

## 2026-09-02 durable native transport self-repair

Change classification: native transport supervision plus presentation. This
slice does not alter prompt interpretation, source admission, tool admission,
evidence re-entry, terminal authority, or Codex-owned sampling and execution.

The desktop host now supervises unexpected Secure MCP Tunnel process exits and
three consecutive failed health probes with a finite read-only recovery policy:

- retries use the fixed bounded schedule 1 second, 5 seconds, then 15 seconds;
- every attempt re-reads the active first-party account session and requires
  the same exact session id and `developer` account type that owned the failed
  tunnel;
- automatic recovery targets only
  `local_supervisor_coordination_and_device_check`, including after a failed
  full-surface process; it never restores `full_helix_agent` authority;
- operator stop, credential replacement or clear, explicit scope transition, lease restoration,
  and application quit cancel pending recovery before changing transport;
- a changed, unavailable, or non-developer account fails closed without
  starting a process; and
- three failed starts exhaust the circuit and project
  `manualInterventionRequired=true` instead of opening another retry, task,
  application restart, or connector-reconnect loop.

The strict desktop tunnel state is version 4 and includes the recovery phase,
attempt count, fixed budget, next attempt time, typed last reason, fixed
read-only automatic scope, and manual-intervention flag. Device Check renders
that bounded state and explicitly says automatic repair never restores full MCP
authority. Credentials, bearer material, provider content, and hidden reasoning
remain absent from the projection.

This repair can restore the native outbound transport so a standards-compliant
MCP client has a fresh reconnect and relist opportunity. It cannot assert that
Codex adopted a catalog: `notifications/tools/list_changed` remains advisory,
and only a subsequently observed client list-tools request or available tool
catalog is positive adoption evidence. No Codex UI automation or unsupported
host-control API is introduced.

Focused deterministic verification passes 21/21 across the tunnel boundary,
transition executor, finite recovery supervisor, and Device Check. The desktop
TypeScript project passes. The repository-wide TypeScript check remains
inconclusive on its default invocation because Node exhausted its approximately
4 GB heap. An 8 GB retry reached the dirty checkout's existing broad TypeScript
diagnostics outside this recovery slice. The focused desktop project and both
production builds remain the applicable passing type/build evidence.
