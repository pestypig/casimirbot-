Program gate: G8 — environment-harness release evaluation
Workstream: M1 installed-node multi-client convergence
Capability or component: Signed supervisor ownership receipt and authenticated local-supervisor MCP coordination
Lifecycle stage: admission; secondary stages are observation, evidence normalization, and presentation
Reaction timescale: none
Authority owner: the signed native or approved opaque launcher owns service/process admission; Helix owns authenticated profile, OAuth-client, room, run, connector, and execution authority; Codex owns whether and when to publish or acknowledge advisory coordination
Current maturity: deterministically verified
Target maturity: live accepted
Required evidence: Ed25519 receipt verification bound to exact workspace and short boot epoch; legacy boolean rejection; unknown-listener fail-closed behavior; one shared browser/MCP coordination store; server-derived client sessions; explicit client-declared continuation identity; two-client relay and acknowledgement; wrong-profile and wrong-continuation denial; server-owned resource verification; command-like inertness; bounded load; live keyed two-client trace
Explicit non-goals: no arbitrary process control; no PID, command-line, credential, private endpoint, hidden reasoning, or ambient host access; no democratic restart authority; no second-host federation; no environment mutation; no M2 behavior
Downstream gate unlocked: none until the approved launcher emits the signed ownership receipt and the live two-client trace passes

# EH-G8 local-supervisor MCP coordination v1

## Result

One installed node is now the shared service boundary for browser and MCP
clients. The server constructs one coordination store for the service epoch and
injects it into both transports. Stateless MCP requests therefore observe the
same bounded presence, relay, acknowledgement, and recommendation state without
sharing credentials, native account sessions, or model context.

The MCP client does not choose its sender identity. Helix derives
`client_session_ref` from the current service instance, signed account profile,
signed OAuth client, and a bounded client-declared continuation reference. The
projection labels those four identity inputs respectively as server epoch,
server verified, server verified, and client declared. A reconnect with the
same tuple resolves the same client; a different profile, OAuth client, thread,
or service epoch resolves a different client.

## M1 progress ledger — 2026-08-27

This packet is the canonical progress record for the installed-node M1 stage.
The CasimirBot EXE work completed in this increment is:

| Area | Addition | Evidence/status |
| --- | --- | --- |
| Installed-node ownership | The packaged EXE supervises one private CasimirBot node and selects its own ephemeral loopback port. Agents no longer allocate port 1522 or launch competing harness processes. | Installed and live-observed |
| Private runtime boundary | Direct unauthenticated access to the EXE-owned runtime fails closed; desktop-session and runtime keys remain outside the renderer, web service, and Codex context. | Live-observed |
| Restricted MCP surface | Added `/mcp/local-supervisor-coordination`, publishing Device Check and exactly five bounded presence/relay coordination tools. General MCP, environment actions, workstation control, and pairing tools are absent. | Deterministically verified |
| Tunnel contract | The desktop tunnel now targets the restricted coordination surface. Its sanitized shared contract is version 2 and reports scope without revealing its credential, endpoint, secret, runtime key, or selected local port. | Deterministically verified |
| Device Check UX | Device Check explains the restricted read/coordination boundary and provides start, stop, readiness, and console controls. Credential removal is disabled while the tunnel is running. | Installed and live-observed |
| Package synchronization | The web renderer and Electron native host were rebuilt together, installed over the stable alpha.9 application path, and reopened with the developer session and locally held tunnel credential intact. | Build passed; installed |
| Live tunnel readiness | The already-configured outbound tunnel transitioned from `Stopped` to `Ready` in the installed EXE without an opaque-launcher or fixed-port edit. | Live-observed |
| Two-client acceptance | Two separately OAuth-authorized Codex clients must still attach to the same service epoch and pass presence, relay, acknowledgement, release, wrong-profile, reconnect, inert-command, and bounded-load checks. | Pending; M1 is not live accepted |
| Public release path | Production OAuth discovery and the public “Open in Codex” installation path remain locked until deployed and verified. | Pending; explicit release blocker |

Current operational rule: keep one installed CasimirBot EXE running and keep
Device Check at `Ready`. Each Codex conversation must attach as a distinct
authorized client/continuation identity; sharing the node does not share a
profile, credentials, model context, mutation lease, or answer authority.

The admitted MCP vocabulary is:

- `helix_local_supervisor_presence_update`;
- `helix_local_supervisor_coordination_read`;
- `helix_local_supervisor_relay_publish`;
- `helix_local_supervisor_relay_acknowledge`; and
- `helix_local_supervisor_presence_disconnect`.

## Agent attachment procedure

Agents do not allocate separate ports or launch separate harness processes.
They connect to the one configured MCP origin and follow this bounded sequence:

1. register or refresh presence using one stable
   `client_continuation_ref` for that Codex conversation;
2. read coordination before waiting on a contested resource and after receiving
   a handoff or release notice;
3. publish a bounded handoff request only to the server-derived target client;
4. acknowledge only relays addressed to the caller's derived identity;
5. keep concurrent activity read-only unless the existing environment runtime
   grants the exact one-shot execution lease; and
6. disconnect presence when complete, then reconnect and revalidate all room,
   connector, run, and execution grants after a service-epoch change.

No port vote, client count, relay text, or heartbeat may start, stop, replace,
or take ownership of the node.

Presence and reads require the room-read OAuth scope. Relay, acknowledgement,
and disconnect additionally require room management. Relay summaries remain
inert advisory text even when they resemble commands. They cannot execute a
tool, stop a process, transfer authority, satisfy evidence, or become an
assistant answer.

## Resource-claim fidelity

Client-authored claims remain `client_declared` unless a server-owned resolver
supplies an exact proof reference. The MCP adapter currently verifies:

- room-read claims only after current room inspection proves membership;
- environment-binding read claims only after the owner/room-scoped Device Check
  finds that exact binding; and
- retained-run claims only after the owner-scoped Agent API finds the exact run
  in `queued`, `running`, or `waiting` lifecycle state.
- active mutation claims only after the room membership and the real
  environment-action request prove an unexpired one-shot execution lease for
  the same participant, room, environment binding, run, source, workflow, and
  action authority.

Active mutation claims do not become collision authority from MCP prose. A
missing, expired, settled, wrong-room, wrong-participant, wrong-environment, or
wrong-run lease remains client-declared. Consequently, one mutation arbiter
remains the action boundary.

The coordination store admits at most 256 retained client identities per
service epoch by default. It never evicts an active client to admit another;
capacity fails closed with a typed 429. Expired or explicitly inactive presence
may be reclaimed. Relay history is separately bounded to 300 entries and reads
return at most 100 relevant relays.

## Protected supervisor receipt

`CASIMIR_KEYED_LAUNCHER_SUPERVISED=1` is no longer accepted as proof. An
external keyed launcher must supply a short-lived Ed25519-signed receipt bound
to the exact opaque workspace reference and boot nonce, and the service must
verify it against a configured public trust root. A missing, malformed,
tampered, expired, overlong, or wrong-workspace receipt leaves the process in
`external_process` mode with `one_instance_enforced=false`.

The receipt, signature, public key, workspace path, process identity, and
credentials are never projected through status or MCP. The repository defines
and verifies this contract but does not inspect or modify the protected opaque
launcher.

### Launcher-side receipt encoding

For Windows `.cmd` integration, the launcher may pass the trust root as the
single-line environment value
`CASIMIR_LOCAL_SUPERVISOR_TRUSTED_PUBLIC_KEYS_SPKI_B64URL`. Its value is the
base64url encoding of the Ed25519 public key's DER SPKI bytes. The existing
`CASIMIR_LOCAL_SUPERVISOR_TRUSTED_PUBLIC_KEYS` PEM form remains accepted, but
the launcher must set only one representation. Neither form is secret. The
private key must remain inside the protected launcher/signing boundary and must
never enter the child environment.

For every new physical launch, the launcher constructs UTF-8 JSON with exactly:

```json
{
  "schema": "helix.local_supervisor_ownership_receipt.v1",
  "workspace_ref": "workspace:<64 lowercase hex>",
  "boot_nonce": "<24-160 base64url characters>",
  "issued_at": "<ISO-8601 timestamp>",
  "expires_at": "<ISO-8601 timestamp no more than 300 seconds later>",
  "supervisor_mode": "external_keyed_launcher"
}
```

It base64url-encodes those exact payload bytes, signs the original payload bytes
with Ed25519, and then base64url-encodes UTF-8 JSON containing only `payload`
and `signature`. That final envelope becomes
`CASIMIR_LOCAL_SUPERVISOR_OWNERSHIP_RECEIPT` for the child service. The legacy
`CASIMIR_KEYED_LAUNCHER_SUPERVISED` flag is ignored.

Before starting, the launcher must attach to one already-ready instance only
when its protected ownership classification, workspace reference, supervisor
mode, and exclusion flags all match. A free selected origin may be atomically
bound and started once. A foreign or unknown listener must never be stopped or
replaced. After start, the launcher must run the repository post-bind verifier
and advertise readiness only when the exact selected origin reports
`external_keyed_launcher` and `one_instance_enforced=true`.

## Deterministic acceptance — 2026-08-27

The focused nine-file supervisor/MCP battery passed 65 tests. It proves signed
receipt acceptance; legacy-boolean, tamper, expiry, and workspace rejection;
two simultaneous OAuth clients; stable reconnect identity; wrong-continuation
and wrong-profile acknowledgement denial; inert command-like relay and exact
target acknowledgement; server-verified room membership without elevating a
fabricated retained runtime; exact real execution-lease matching; complete
recommendation/handoff/acknowledgement/release clearance; a hard active-client
capacity; and 64 distinct client continuations on one service epoch. The Helix
Ask discipline quick check passed; warnings reported other pre-existing
dirty-worktree files and no private sampling, execution, or terminal-completion
loop was added here.

## Live promotion boundary

The approved opaque launcher must adopt the signed receipt inputs before a live
two-client attachment can pass. Until the running service reports
`external_keyed_launcher` and `one_instance_enforced=true`, the canonical
preflight must stop at `supervisor_not_enforcing`. Deterministic MCP acceptance
does not convert that typed blocker into live acceptance.

## Installed-EXE setup surface

The packaged Windows application is the user-facing bootstrap; the opaque
`start-myapp-for-codex` launcher remains a developer acceptance mechanism. An
ordinary user must never edit a key-bearing command file. Opening the installed
application already enforces one Electron instance, selects a private loopback
origin, starts one child service with a per-launch secret, and supervises that
child. The child reports `desktop_single_instance` and
`one_instance_enforced=true` through the sanitized supervisor status contract.

The installed workstation now registers a separate Local Harness panel for the
public `user` policy, including the signed-out/no-session default. It projects
only the sanitized supervisor status contract and explains whether the current
node is the packaged native bootstrap, a verified signed developer launch, or
an ordinary unprotected source process. Its refresh is read-only and exposes no
private key, signed receipt, process identity, workspace path, credential, or
private endpoint. Sign-in is required later for profile-owned MCP clients,
rooms, and environment grants, not for proving that the local supervisor is
ready.

Connections, Billing & Security remains a developer-only management surface.
The user panel neither exposes the opaque launcher nor weakens the server-side
`installed_service_management` boundary. A running child UI cannot rewrite or
upgrade its parent launcher; source-tree live acceptance still requires the
protected launcher to adopt the signed receipt outside model and renderer
context.

### Live promotion attempt — 2026-08-27

Port 1522 was independently free and the approved opaque launcher started the
patched current-worktree service. The service reached ready as
`service_instance:414c5dc99444b9b09461d4d1c50ca356`; its public status excluded
credentials, paths, endpoints, process identity, and account identity. The
launcher still supplied no verifiable signed ownership receipt, so the service
correctly reported `supervisor_mode=external_process` and
`one_instance_enforced=false`. The cookie-authenticated coordination route also
failed closed with HTTP 401 when called without an account session.

This is the first live divergence. Per the acceptance rule, no second Codex
client was attached and no live relay/load claim was made. The exact retained
launcher was stopped normally with Ctrl+C and port 1522 was released. The next
promotion attempt requires launcher adoption of the two protected boot inputs:
the signed receipt envelope and its configured Ed25519 public trust root.

### GPT app restart re-check — 2026-08-27

After the GPT app was restarted, port 1522 remained free until the approved
opaque launcher was invoked again. The resulting patched keyed service reached
ready as `service_instance:eba25b4000d027f9ff08d50b462c948f`; account-session,
Helix pipeline, and agent-provider health routes each returned HTTP 200. Its
sanitized supervisor status still reported `external_process` and
`one_instance_enforced=false`. This confirms that restarting the GPT app or
creating a new service epoch does not manufacture the protected launcher
receipt. No second client was attached. The exact retained launch was stopped
normally and port 1522 was released.

### Installed-node coordination tunnel repair — 2026-08-27

The installed alpha.9 EXE was opened and the developer profile was verified as
active. Its Local Harness panel reported `desktop_single_instance` readiness,
and the packaged host selected its own private loopback origin without using
port 1522 or the opaque developer launcher. Direct unauthenticated requests to
the private runtime failed closed with `desktop_session_required`, as intended.

Live inspection found a separate product-path divergence: the bundled Secure
MCP Tunnel still targeted `/mcp/device-check`, so it could not carry the five
already-verified local-supervisor coordination tools. The advertised production
OAuth metadata and discovery URLs on `casimirbot.com` also returned the website
application shell rather than deployed metadata. An active account binding was
therefore necessary but not sufficient for Codex attachment.

The installed tunnel now targets the separate
`/mcp/local-supervisor-coordination` resource. That resource publishes exactly
Device Check plus presence update, coordination read, relay publish, relay
acknowledgement, and presence disconnect. It fails closed without the shared
service-epoch store and does not publish Minecraft action, pairing, general
agent-run, brokerage, workstation-control, or arbitrary MCP tools. The internal
desktop-session header continues to be injected only into the tunnel child;
OAuth profile and client scopes remain independently required at the MCP
resource.

This repair removes any need for a user or Codex task to edit a launcher port.
The installed EXE owns ephemeral port allocation, and multiple authenticated
clients converge through one tunnel alias onto the one installed-node epoch.
It does not create port voting, restart authority, mutation authority, or a
second local service. Live acceptance still requires rebuilding the installed
EXE, starting the already-configured tunnel, and attaching two separately
authorized Codex clients to the resulting current tunnel endpoint.

The synchronized renderer and native-host rebuild was then installed over the
existing alpha.9 path. The developer session and locally held tunnel credential
survived the update. Device Check accepted the version-2 sanitized tunnel state,
displayed the coordination-specific boundary copy, and transitioned from
`Stopped` to `Ready` through the already-configured outbound tunnel. No private
endpoint, tunnel credential, desktop-session secret, runtime key, or local port
was projected into the workstation UI or this evidence record.

This closes the installed-package and tunnel-readiness portion of the M1 live
promotion attempt. It does not yet close the two-client acceptance gate: the
production Codex plugin remains locked because OAuth discovery for the public
release path is not deployed, and two separately authorized Codex clients have
not yet completed the same-epoch presence, relay, acknowledgement, release,
wrong-profile, reconnect, and load trace.

### Connector attachment checkpoint — 2026-08-27

The supported OpenAI Secure MCP Tunnel operator path was rechecked against the
current public `openai/tunnel-client` documentation. The installed EXE remains
the one runtime owner; the user-facing OpenAI connector selects the same opaque
tunnel identity, while the restricted runtime API key remains only in the
encrypted desktop vault. The current Codex MCP inventory contains only the old
fixed-port local profiles and does not yet contain the installed-node tunnel
connector. The OpenAI Platform sign-in and workspace-selection handoff
subsequently completed. With explicit operator confirmation, the existing
CasimirBot tunnel was assigned to the only eligible ChatGPT workspace. The
platform returned a successful update receipt, and a refreshed tunnel-table
read showed a bound workspace instead of the previous empty value. No
credential, tunnel id, workspace id, private endpoint, runtime key, or
authorization code is retained in this packet or projected into model-visible
connector evidence.

The focused deterministic battery was refreshed while the operator handoff was
pending: all 51 coordination, identity, launch-orchestration, origin-selection,
post-bind, and route-admission tests passed. The eight restricted MCP tests also
passed. One agent-transport test exceeded its five-second timeout only in the
combined Windows run; that exact case passed alone in 78 ms with a bounded
15-second timeout, so it is recorded as local combined-run load rather than a
reproduced contract failure. Live two-client acceptance remains pending.

### ChatGPT connector OAuth first-divergence — 2026-08-28

The workspace-bound Secure MCP Tunnel reached the installed restricted MCP
resource. Tunnel polling and response delivery returned HTTP 200, the protected
resource metadata probe returned HTTP 200, and the tunnel client's redacted
effective configuration confirmed that both runtime and discovery requests
carried the native desktop-session header. Runtime MCP requests created with
ChatGPT's **No Auth** option returned HTTP 401. This is the expected OAuth
resource boundary, not a missing desktop-header injection: the restricted MCP
router separately requires a verified bearer token, linked Helix account,
tenant, OAuth-client identity, and exact scopes.

After refreshing the ChatGPT connector surface, **OAuth** was selected and the
existing tunnel was discovered successfully. The connector then advanced to
its OAuth client-registration gate. Dynamic Client Registration was unavailable
because the Auth0 authorization-server metadata advertises no registration
endpoint, and Client Identifier Metadata Document registration was unavailable
on this discovered local profile. ChatGPT therefore requires one user-defined
OAuth client, its exact callback URL, token endpoint authentication method, and
default scopes before connector creation can complete.

The Auth0 tenant did not contain a dedicated ChatGPT MCP client and reported
that its application/SSO-integration limit had been reached, explaining the
failed Auth0 **Create Application** attempt. No new OAuth client, connector, or
permission was created. The existing developer-only G2 Codex MCP client is a
public Native/PKCE client with token endpoint authentication `none`, so it is a
technically compatible bounded M1 acceptance fallback if the operator explicitly
authorizes adding the one exact ChatGPT callback URL. That fallback must request
only `helix.rooms.read` and `helix.rooms.manage`, remain developer-only, and must
not be presented as the public release architecture. Production still requires
a dedicated OpenAI client registration through a separate Auth0 application,
CIMD, or DCR-capable authorization-server profile.

### ChatGPT PKCE validator checkpoint — 2026-08-28

With explicit operator confirmation, the exact ChatGPT callback URL was added
to the existing developer-only G2 Native/PKCE client. The ChatGPT connector was
configured as a user-defined public client with token endpoint authentication
`none` and only `helix.rooms.read` plus `helix.rooms.manage` as default scopes.
Auth0's public OAuth and OpenID metadata both advertised
`code_challenge_methods_supported` containing `S256`; the tunnel admin surface
also reported an HTTP 200 discovery response and parsed `S256` without exposing
the issuer, callback, client id, tunnel id, runtime key, or desktop secret in
this packet.

ChatGPT nevertheless rejected connector creation with the typed error that the
authorization-server metadata must advertise PKCE `S256`. A stopped local node
was separately observed during one earlier retry, relaunched only through the
approved opaque launcher, and then removed as a confounder: the same PKCE error
reproduced while the keyed node and tunnel were both ready.

The installed desktop artifact was then advanced from pinned OpenAI
`tunnel-client` 0.0.11 to 0.0.13. The 0.0.13 Windows archive matched the official
release checksum, the executable and license were re-pinned, the focused tunnel
and desktop-host security suite passed 9/9, and the rebuilt alpha.9 installer
was installed over the existing local application. Device Check subsequently
reported `Ready` with tunnel-client 0.0.13. ChatGPT still returned the identical
PKCE validator error.

This is now the M1 live first divergence. It is not evidence that Auth0 lacks
PKCE, that the desktop session header is missing, that the tunnel is stopped,
or that the pinned tunnel client is stale. Connector creation and the two-client
same-epoch trace remain pending until the OpenAI connector surface accepts the
preserved authorization-server metadata or a dedicated registration path is
available. Do not weaken the MCP resource to No Auth and do not broaden scopes
to bypass this gate.

### Operator-confirmed connector retry — 2026-08-28

After the operator confirmed that the signed-in ChatGPT connector form was
ready, **Create** was submitted exactly once with the preserved user-defined
public client, token endpoint authentication `none`, and only
`helix.rooms.read` plus `helix.rooms.manage`. ChatGPT again rejected connector
creation before authorization with the same typed PKCE-metadata error. The form
remained intact and no connector, token, room grant, or MCP client session was
created.

The focused current-worktree M1 battery then passed 64/64 tests across the
local-supervisor identity, origin selection, launch orchestration, post-bind
verification, coordination, restart coordination, restricted MCP, and desktop
service-environment contracts. This refresh preserves deterministic maturity;
it does not substitute for the missing two-client live trace. The signed
receipt's public trust root remains an input owned by the approved native or
opaque launcher profile, while the corresponding private signing key must stay
outside the child environment, renderer, MCP, and model context. A renderer or
ordinary child process cannot promote itself by changing UI state.
