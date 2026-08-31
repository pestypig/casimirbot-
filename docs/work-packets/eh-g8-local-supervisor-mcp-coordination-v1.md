Program gate: G8 — environment-harness release evaluation
Workstream: M1 installed-node multi-client convergence
Capability or component: Signed supervisor ownership receipt and authenticated local-supervisor MCP coordination
Lifecycle stage: admission; secondary stages are observation, evidence normalization, and presentation
Reaction timescale: none
Authority owner: the signed native or approved opaque launcher owns service/process admission; Helix owns authenticated profile, authenticated MCP client, room, run, connector, and execution authority; Codex owns whether and when to publish or acknowledge advisory coordination
Current maturity: live accepted
Target maturity: live accepted
Required evidence: Ed25519 receipt verification bound to exact workspace and short boot epoch; legacy boolean rejection; unknown-listener fail-closed behavior; one shared browser/MCP coordination store; server-derived client sessions; explicit client-declared continuation identity; two-client relay and acknowledgement; wrong-profile and wrong-continuation denial; server-owned resource verification; command-like inertness; bounded load; live keyed two-client trace
Explicit non-goals: no arbitrary process control; no PID, command-line, credential, private endpoint, hidden reasoning, or ambient host access; no democratic restart authority; no second-host federation; no environment mutation; no M2 behavior
Downstream gate unlocked: M2 is eligible for a later explicit assignment; this packet grants no M2 behavior

# EH-G8 local-supervisor MCP coordination v1

## Result

One installed node is now the shared service boundary for browser and MCP
clients. The server constructs one coordination store for the service epoch and
injects it into both transports. Stateless MCP requests therefore observe the
same bounded presence, relay, acknowledgement, and recommendation state without
sharing credentials, native account sessions, or model context.

The MCP client does not choose its sender identity. Helix derives
`client_session_ref` from the current service instance, signed account profile,
server-verified authenticated MCP client (OAuth or protected native desktop
delegation), and a bounded client-declared continuation reference. The
projection labels those four identity inputs respectively as server epoch,
server verified, server verified, and client declared. A reconnect with the
same tuple resolves the same client; a different profile, authenticated MCP
client, thread, or service epoch resolves a different client. Native desktop
delegation remains explicitly distinct from OAuth and never claims an OAuth
client identity.

## M1 progress ledger — 2026-08-27

This packet is the canonical progress record for the installed-node M1 stage.
The CasimirBot EXE work completed in this increment is:

| Area | Addition | Evidence/status |
| --- | --- | --- |
| Installed-node ownership | The packaged EXE supervises one private CasimirBot node and selects its own ephemeral loopback port. Agents no longer allocate port 1522 or launch competing harness processes. | Installed and live-observed |
| Private runtime boundary | Direct unauthenticated access to the EXE-owned runtime fails closed; desktop-session and runtime keys remain outside the renderer, web service, and Codex context. | Live-observed |
| Restricted MCP surface | Added `/mcp/local-supervisor-coordination`, publishing Device Check, the public UI catalog, and exactly five bounded presence/relay coordination tools. General MCP, environment actions, workstation control, and pairing tools are absent. | Deterministically verified |
| Tunnel contract | The desktop tunnel now targets the restricted coordination surface. Its sanitized shared contract is version 2 and reports scope without revealing its credential, endpoint, secret, runtime key, or selected local port. | Deterministically verified |
| Device Check UX | Device Check explains the restricted read/coordination boundary and provides start, stop, readiness, and console controls. Credential removal is disabled while the tunnel is running. | Installed and live-observed |
| Package synchronization | The web renderer and Electron native host were rebuilt together, installed over the stable alpha.9 application path, and reopened with the developer session and locally held tunnel credential intact. | Build passed; installed |
| Live tunnel readiness | The already-configured outbound tunnel transitioned from `Stopped` to `Ready` in the installed EXE without an opaque-launcher or fixed-port edit. | Live-observed |
| Two-client acceptance | Two separately authorized Codex continuations attached to the same installed-node service epoch and passed distinct presence, reconnect, bounded load, advisory relay, target-only acknowledgement, handoff, release, disconnect, wrong-target, wrong-continuation, and command-inertness checks. Wrong-profile denial remains proven by the deterministic authenticated-profile battery because this attended trace intentionally used one owner profile. | Live accepted |
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
return at most 100 relevant relays. Relay deduplication state is evicted with
the corresponding bounded history entry, so repeated advisory traffic cannot
grow an unbounded side map.

## Protected supervisor receipt

`CASIMIR_KEYED_LAUNCHER_SUPERVISED=1` is no longer accepted as proof. An
external keyed launcher must supply a short-lived Ed25519-signed receipt bound
to the exact opaque workspace reference and boot nonce, and the service must
verify it against a configured public trust root. A missing, malformed,
tampered, expired, overlong, or wrong-workspace receipt leaves the process in
`external_process` mode with `one_instance_enforced=false`.

The verified boot nonce is also the keyed launcher's service epoch. Replaying
the same still-valid receipt therefore resolves the same service identity
rather than manufacturing a second boot identity; a newly signed boot nonce
resolves a new service epoch. Desktop single-instance supervision remains a
separate native-host enforcement mode.

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

### Exact-issuer retry — 2026-08-28

Both live Auth0 discovery documents were re-read and independently confirmed
to include `code_challenge_methods_supported` containing `S256`, public-client
token endpoint authentication `none`, and the authorization and token
endpoints. Because Auth0's exact issuer identifier ends in `/`, the ChatGPT
connector form was reconstructed with that exact trailing slash in
**Authorization server base**. The public client id, callback, token method,
and two room scopes were otherwise unchanged, and **Create** was submitted
once.

ChatGPT returned the identical PKCE-metadata error. The exact-issuer hypothesis
is therefore rejected for this connector build. The remaining first
divergence is inside or in front of ChatGPT's authorization-server metadata
validator: it is fetching a different document, rejecting another part of the
discovery response while projecting the generic PKCE error, or otherwise not
observing the `S256` value independently verified at both well-known URLs. No
connector or token was created. Do not repeat the trailing-slash retry, remove
OAuth, or broaden scopes as a workaround.

### Tunnel OAuth-metadata routing repair — 2026-08-28

The installed tunnel-client 0.0.13 admin evidence identified the first local
runtime divergence more precisely. Protected-resource discovery succeeded with
HTTP 200, and the authorization-server metadata fetch selected the RFC 8414
OAuth document with HTTP 200. However, the Harpoon channel retained zero
targets. Its redacted runtime log showed that the external authorization-server
and derived endpoint records were skipped by the default private-host
classifier, while the loopback protected-resource source was correctly rejected
as a plaintext Harpoon target. The tunnel was therefore ready for the main MCP
channel but could not offer its bounded OAuth-metadata route to the connector
validator.

The desktop child environment now derives one exact DNS hostname from the
already-configured HTTPS `HELIX_AGENT_OAUTH_ISSUER` and supplies only that
hostname through tunnel-client's documented
`HARPOON_HOSTS_INCLUDE_SUFFIX` admission input. It does not forward the issuer
environment value, accept HTTP, admit loopback or IP literals, enable arbitrary
Harpoon targets, broaden MCP scopes, or expose credentials. Plaintext Harpoon
remains disabled. The protected-resource metadata router also projects the
exact loopback resource identity for every explicitly registered `/mcp/*`
metadata route, including local-supervisor coordination, instead of falling
back to the generic MCP audience before tunnel-service performs its public URL
rewrite.

Focused deterministic verification passed the five-test desktop tunnel
boundary, including invalid issuer rejection, and the exact coordination
metadata regression. One unrelated REST case exceeded its original five-second
Windows timeout in a combined run after passing in the preceding run; both that
case and the new metadata case passed independently. Live promotion still
requires rebuilding the installed EXE, confirming a nonzero bounded OAuth
target set on the current tunnel epoch, and retrying connector creation once.

### ChatGPT OAuth and live read acceptance — 2026-08-28

The developer acceptance path advanced through Auth0 authorization and ChatGPT
connector creation without weakening the MCP resource to No Auth. Auth0 Dynamic
Client Registration was enabled only on the developer tenant, the authorization
server continued to require PKCE `S256`, and the connector requested only
`helix.rooms.read` plus `helix.rooms.manage`. The MCP protected-resource
audience remains stable across tunnel and desktop restarts. This developer DCR
configuration is acceptance infrastructure, not the production registration
or database architecture.

OpenAI Secure MCP Tunnel does not forward ChatGPT's bearer token to its private
local target. The installed host therefore admits a separate native delegation
only on the restricted local-supervisor MCP mount. That delegation requires the
exact per-launch desktop secret, loopback transport, and exact active account
session identifier held in the supervised child environment. It grants only
the mount's configured scopes. Any supplied bearer, valid or invalid, is sent
through the ordinary OAuth verifier and can never fall back to desktop
delegation; the general `/mcp` resource has no native delegation fallback.

The tunnel client's documented comma-separated multi-header environment form
was verified with dummy values against a local capture server: both protected
headers were present on discovery, initialization, and subsequent requests,
and no header value was retained in this packet. The restricted server also
implements the standards-defined compatibility response for the MCP 2026-07-28
`server/discover` probe: HTTP 404 with JSON-RPC `-32601` lets newer clients fall
back to the supported initialization lifecycle instead of receiving an opaque
500.

Live packaged acceptance exposed and repaired one desktop-only bundle defect.
The local-supervisor mount referenced `createHelixMcpServer` without importing
that binding into `server/index.ts`; esbuild emitted the unresolved reference,
so the tunnel's valid `initialize` reached the service and failed with a safe
`createHelixMcpServer is not defined` diagnostic. The import is now explicit,
server construction is inside the guarded MCP transport boundary, and the
signed unpacked Windows package was rebuilt. Device Check then transitioned
from `Stopped` to `Ready` on the current installed-node epoch.

ChatGPT refresh subsequently discovered the bounded catalog: Device Check,
public UI catalog, two read-only local-supervisor tools, and the separately
scoped relay/acknowledgement/disconnect tools. A live ChatGPT read of
`helix_public_ui_catalog` completed successfully and returned the current
public surface count. This is the first end-to-end receipt spanning ChatGPT
OAuth, public tunnel delivery, native desktop delegation, MCP discovery,
tool execution, and result re-entry.

The `helix_environment_device_check` smoke call reached the same tool surface
but returned a typed `internal_error`/`INVALID_ARGUMENT` result, so paired-device
read acceptance remains open and no claim about paired-device presence was
made. The successful public-catalog read closes the single-client transport
and execution slice only. M1 remains below `live accepted` until the
device-read failure is diagnosed and the required two-client same-epoch
presence, relay, acknowledgement, release, wrong-profile, reconnect, inert
command, and bounded-load trace passes.

### Native client identity and bounded-load correction — 2026-08-29

A read-only acceptance audit found that the installed tunnel delegation had no
authenticated client reference and received only the read scope. The MCP tools
therefore could be discovered while presence was structurally unable to begin,
and relay, acknowledgement, and disconnect lacked their bounded room-management
scope. The restricted mount now derives an opaque MCP client reference from the
server-owned desktop device, active account session, and authenticated profile.
It grants the union of only the coordination read and advisory-management
scopes. The OAuth client reference remains null on this native path; supplied
bearers still use only the OAuth verifier and never fall back.

Deterministic verification now covers stable native identity without raw device,
profile, or account-session projection; external OAuth identity; invalid-bearer
fail-closed behavior; 64 simultaneous client heartbeats; relay-history and
dedupe eviction; signed boot-nonce service-epoch binding; wrong-target/profile
denial; reconnect; handoff and release; and command-like inert relay text. The
focused regression battery passed 101 tests across 11 files. The Helix Ask
discipline static guard passed. A repository-wide TypeScript run exhausted its
default 4 GiB Node heap before producing diagnostics; an 8 GiB rerun completed
and reported the repository's existing broad CLI, physics-tool, and UI-test
type backlog rather than a clean baseline. The focused M1 compile-and-test
battery and authoritative desktop service bundle passed. Live M1 acceptance
remains pending completion of the rebuilt installed-node, same-service-epoch
two-client trace.

### Server-owned coordination identity convergence — 2026-08-29

The presence projection now keeps all five coordination identity dimensions
separate. It reports the authenticated profile, authenticated MCP client,
client-declared conversation continuation, server-inspected retained-run
version, and canonical connector producer epoch as distinct fields. The
client-declared `room_ref`, `environment_ref`, and `run_ref` remain advisory;
they do not become verified merely because they are syntactically valid or
match another client's prose.

Room verification now records the current server-owned participant identity.
Connector verification uses a canonical database reader that joins the exact
active room membership, environment binding, connector installation, device,
source, and current producer epoch. A non-owner must also hold a still-active
room grant for that same binding, installation, device, source, and producer
epoch. A rotated producer epoch, departed member, closed room, inactive
installation/device/binding, missing grant, or ambiguous result fails closed.

A retained-runtime claim now receives collision authority only when the
authenticated principal owns the inspected resumable Agent API run and that
run has an exact active run-to-room binding for the current room participant.
The projection preserves both run version and run-room-binding version. An
execution-lease claim must additionally match the canonical connector source
and current room participant, as well as the declared room, environment, and
run. The presence projection records the action request, workflow, action
authority, participant, source, expiry, and an opaque verification reference,
but it cannot create, renew, transfer, or release the lease. The existing
environment action broker remains the single mutation arbiter.

Verified identity fields and verified claims are cleared when a heartbeat
expires or disconnects. This prevents a stale presence row from presenting an
old room membership, connector epoch, retained run, or execution lease as
current authority. The database-backed identity fixture proves owner and
grantee resolution, producer-epoch rotation denial, and departed-member denial.
The focused MCP fixture proves exact retained-run binding/version projection,
connector/source-epoch projection, execution-lease correlation, and mismatch
fail-closed behavior. These additions remain deterministically verified until
the rebuilt installed node completes the live two-client trace below.

### Rebuilt-node read-only live acceptance — 2026-08-29

The signed Windows package was rebuilt, installed over the stable alpha.9
application path, and launched under desktop single-instance supervision. The
private service reached full API readiness on a fresh service epoch and the
Device Check panel started the restricted read-only coordination tunnel. The
live `helix_environment_device_check` call now returns a valid owner-scoped
empty device list instead of the prior typed `internal_error`, closing that
regression without enabling Shared Live Room mutation features for user policy.

Two independent Codex continuations then registered concurrently through the
same installed node, MCP origin, authenticated profile/client, and service
epoch. They received distinct derived client-session references. Repeating the
same heartbeat from each client preserved both its service epoch and exact
client-session identity. A bounded live burst of 16 simultaneous heartbeat
calls succeeded 16/16, produced 16 distinct client identities, and remained on
one service epoch. The coordination read returned no credentials, private
endpoints, hidden reasoning, answer authority, relays, or automatic
recommendations. A read using an unregistered continuation failed closed as
`supervisor_client_not_registered`.

The first live command-like relay attempt was rejected before publication with
typed `insufficient_scope`. The first divergence was the Auth0 resource-server
definition: it exposed only `helix.rooms.read`, so Auth0 correctly omitted the
requested `helix.rooms.manage` scope. The API was updated with exactly that
missing scope. Auth0's per-application access table then showed that ChatGPT had
dynamically registered a newer client for the current connection; the older
client was restored to read-only and the current client alone was granted both
approved room scopes. A fresh authorization-code flow presented an explicit
consent screen containing only `helix.rooms.read` and
`helix.rooms.manage`. After consent, ChatGPT removed every `Reconnect needed`
marker and the relay tool advanced past OAuth admission.

Two active continuations on the same service epoch then completed the live
write trace. A deliberately command-like relay was published and preserved
`advisory_only=true`, `execution_requested=false`,
`authority_transfer=false`, and `evidence_satisfied=false`; credential,
private-endpoint, hidden-reasoning, answer-authority, and terminal-eligibility
flags also remained false. The sender's attempt to acknowledge its own relay
failed closed as `supervisor_relay_ack_forbidden`, while the exact target read
and acknowledged it. The second client published an inert handoff request, the
first client acknowledged it and published an inert release notice, and the
second client acknowledged the release before disconnecting. The final read
showed all three relays acknowledged and the second presence as
`lifecycle_state=disconnected`, `active=false`, with empty resource claims; no
process or execution lease was touched.

The same installed node had already passed a 16/16 simultaneous live heartbeat
burst with distinct derived client sessions on one service epoch, plus live
reconnect identity and wrong-continuation denial. The focused deterministic
battery supplies the complementary wrong-authenticated-profile denial and
server-verified resource-owner recommendation cases that this single-profile,
no-live-lease trace could not safely manufacture. Taken together with the
signed supervisor ownership receipt, 122/122 focused tests, successful signed
Windows rebuild/install, and the live read/write trace above, M1 is `live
accepted`. This acceptance does not grant process control, a mutation lease,
cross-host federation, or any M2 behavior.
