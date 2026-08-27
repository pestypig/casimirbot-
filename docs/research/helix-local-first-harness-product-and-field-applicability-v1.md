# Helix Local-First Harness Product and Field Applicability v1

Status: research-backed product recommendation, captured 2026-08-26. This file
does not replace the canonical gate, maturity, dependency, or acceptance status
in `docs/helix-environment-harness-work-program-v1.md`.

## Conclusion

The product direction is viable and increasingly differentiated, but it is not
yet ordinary-user-ready. The strongest product is a local-first installed
CasimirBot node with a small cloud coordination plane, rather than either a
website-only agent or a desktop program that directly exposes arbitrary host and
network access.

The installed node should own credentials, environment connectors, local policy,
evidence normalization, monitoring, and execution arbitration. The website
should own identity coordination, device registration, Shared Live Room
membership, narrowed grants, revocation, presence, recovery signaling, and
optional relay discovery. Codex, ChatGPT, or another supported reasoning client
should reach the node through authenticated MCP or governed application APIs.

```text
AI client on phone, desktop, or web
  → authenticated MCP / governed API
  → website coordination and identity plane
  → outbound secure transport
  → profile-owned installed CasimirBot node
  → local connector and authority broker
  → exact authorized environment subject
```

This architecture makes the website the multiplayer and coordination surface
without making it the custodian of every provider or device credential. It also
lets a field computer retain useful local operation when the coordination plane
is temporarily unavailable, subject to cached finite policy, lease expiry, and
fail-closed renewal rules.

## What research supports

### Native applications should not embed a reusable client secret

OAuth native applications are public clients: a secret shipped inside an EXE
can be extracted. RFC 8252 requires native apps to use an external user agent
and PKCE rather than treating an embedded application secret as confidential.
The first-run CasimirBot experience should therefore open the system browser,
complete Authorization Code with PKCE, return through an exact registered
redirect, and store only the resulting protected renewal material. The old Pake
launcher is a useful first-run UX precedent, but an embedded browser or bundled
static secret is not the security architecture.

For a headless companion or input-constrained device, RFC 8628 device
authorization is appropriate: the companion makes outbound HTTPS requests and
the user approves the exact request on a separate phone or computer. It should
not replace browser-based PKCE on a capable desktop.

Sources:

- [RFC 8252: OAuth 2.0 for Native Apps](https://datatracker.ietf.org/doc/rfc8252/)
- [RFC 8628: OAuth 2.0 Device Authorization Grant](https://www.rfc-editor.org/info/rfc8628/)

### Biometrics release a key; CasimirBot should never store biometric data

WebAuthn and Windows Hello support the desired user experience without giving
CasimirBot a fingerprint or face template. The platform authenticator performs
local verification and authorizes use of a scoped private key. The service sees
a signed assertion or challenge response, not biometric data.

Use passkeys/WebAuthn for account authentication and Windows Hello or an
equivalent platform authenticator for local step-up approval of sensitive key
use. A successful Windows sign-in alone must not silently grant a new connector,
room, or mutation scope.

Sources:

- [W3C WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/)
- [Microsoft Windows Hello for Windows apps](https://learn.microsoft.com/en-us/windows/apps/develop/security/windows-hello)

### OS-protected storage is necessary but not magically unretrievable

Electron `safeStorage` uses Windows DPAPI. That protects encrypted state from
offline reading and other Windows users, but Electron documents that it does
not protect the secret from every application running in the same user context.
No product claim should say that a credential “cannot be retrieved.” The honest
claim is that raw credentials remain under OS-protected local custody, are not
projected to the renderer, model, room, MCP result, logs, command line, or cloud
coordination database, and require a tightly bounded broker operation to use.

For higher-consequence connectors, prefer a non-exportable TPM/Windows Hello
key to wrap or authorize use of the credential-encryption key. Keep the service
process narrow, restrict local IPC, zero plaintext buffers when practical,
rotate refresh material, and assume that same-user arbitrary-code execution can
act as the user while it persists. Encryption at rest does not solve a fully
compromised endpoint.

Source:

- [Electron safeStorage](https://github.com/electron/electron/blob/main/docs/api/safe-storage.md)

### Remote MCP is compatible with a local node, but it is not the private LAN

OpenAI's platform supports remote MCP servers, tool allowlists, OAuth
authorization, and per-tool approval policy. Data sent to a remote MCP server is
subject to that server's data policies. CasimirBot should expose a narrow MCP
facade and normalized evidence, not private endpoints or a general route into
the site network.

The existing CasimirBot Secure MCP Tunnel is the preferred OpenAI-facing
transport for its accepted surface. Cloudflare Tunnel is a viable additional
web/API transport because it creates outbound connections without a public IP
or inbound firewall port. Cloudflare Access can place identity-aware policy in
front of a self-hosted application. Neither transport should grant callers a
raw RFC1918 route, WARP-style full private-network access, or an arbitrary
scanner merely because those products can support private networking.

Sources:

- [OpenAI Realtime remote MCP tool reference](https://platform.openai.com/docs/api-reference/realtime-server-events/response/mcp_call/in_progress)
- [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data)
- [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/)
- [Cloudflare private web application](https://developers.cloudflare.com/cloudflare-one/setup/secure-private-apps/private-web-app/)

### A small coordination database is sufficient for an initial product

CasimirBot does not need to operate a large identity database to begin. It
should delegate authentication to the existing reviewed identity provider or
another standards-compliant OIDC/WebAuthn provider. The CasimirBot coordination
store needs only the durable product metadata required for collaboration and
revocation:

```text
profile subject reference
registered installed-node public identity
MCP client and continuation references
room, membership, role, and invitation state
connection and capability-grant references
lease, cursor, freshness, and revocation state
auditable lifecycle and recovery receipts
```

It should not store user passwords, biometrics, device management passwords,
SNMP keys, provider access tokens, or raw local network addresses. Multiplayer
cannot be completely serverless: exact room membership, narrowed grants,
revocation, invitations, and cross-device recovery need a durable coordination
authority. That requirement is modest in storage volume but serious in backup,
availability, tenant isolation, rate limiting, audit, and incident response.

The control-plane/data-plane separation is a proven product pattern. Tailscale,
for example, documents a coordination plane for identity, device registration,
keys, and access policy while private device keys and data-plane execution stay
on the nodes. CasimirBot should apply the pattern to governed capabilities and
evidence rather than to general packet routing.

Sources:

- [Tailscale control and data planes](https://tailscale.com/docs/concepts/control-data-planes)
- [Tailscale security architecture](https://tailscale.com/security)

## Recommended product topology

### 1. Native Windows EXE — primary personal and field product

The signed installed application should provide:

- first-run system-browser sign-in using Authorization Code with PKCE;
- optional passkey and Windows Hello enrollment;
- one profile-owned node identity and local public/private device keypair;
- OS-protected credential broker and narrowly supervised child connectors;
- local connector enrollment without secret relay;
- private loopback service and renderer isolation;
- exact capability, lease, monitor, evidence, and revocation state;
- signed updates, one-instance ownership, crash recovery, and safe uninstall;
- a plain-language Account and Connections surface; and
- outbound-only secure MCP/API transport.

This should be the default download because native code can integrate with the
OS authenticator, protected storage, network-interface chooser, USB devices,
serial drivers when later admitted, desktop lifecycle, and local consent UI.

### 2. Website — coordination, rooms, onboarding, and optional hosted tools

The website should provide:

- account identity and passkey enrollment through the identity provider;
- device registration and sanitized readiness;
- Shared Live Room creation, invitations, roles, and revocation;
- narrowed references to profile-owned connections;
- run, evidence, presence, and terminal-product projections permitted to each
  member;
- download, documentation, support diagnostics, and recovery entry points; and
- selected server-native tools whose credentials and data are appropriate for
  hosted custody.

The website should not imply that joining a room transfers a host's device or
provider credential. It coordinates authority references; the installed node
continues to own the local connection and enforcement.

### Shared-room capability federation

One installed node may serve multiple authenticated room members. Those members
can benefit from the host's governed observations and principal Runtime Codex
reasoning through the browser, phone, MCP, or another supported room surface;
they do not need a second harness merely to observe or steer within the host's
explicit grant.

If another member wants the room to use an environment physically connected to
their own computer, that computer contributes its own installed node or approved
companion. The room may then reason over separately owned connections from both
nodes, but every call remains bound to one exact owner, node, connection,
environment, subject, connector epoch, capability, and grant. This is capability
federation, not device federation: no member receives ambient access to another
computer, and room membership does not combine everyone into one permission set.

For two Minecraft players, a shared world observation may be common while each
Player Embodiment remains bound to that player's exact participant, subject,
client companion, and finite authority lease. A cooperative action needs both
owners' current delegation and initially serializes through one room/world
arbiter. A player who only wants to observe or help reason may use the room
without installing a harness; a player whose local Minecraft client is to be
acted through needs an approved companion on the machine controlling that
client.

The exact projected G8 contract is
`docs/work-packets/eh-g8-shared-room-multi-host-capability-federation-v1.md`.

### 3. Docker — optional headless and deployment form

Docker is useful for:

- deterministic connector fixtures and conformance testing;
- a headless Linux connector on a server, NAS, lab gateway, or branch appliance;
- self-hosted coordination/API services;
- reproducible CI and enterprise deployment; and
- protocol drivers that do not require desktop UI, platform biometrics, or
  direct Windows device integration.

Docker should not be the primary consumer onboarding experience. Containers
add friction around OS authenticators, desktop consent, selected-interface
semantics, USB/HID, multicast, serial devices, updates, and support. Docker
Compose secrets are safer than environment-variable injection, but they do not
replace an identity-aware native credential broker.

Source:

- [Docker Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/)

### 4. Transport choices — interchangeable, least exposure first

Support a transport interface rather than binding the product to one network
vendor:

1. OpenAI Secure MCP Tunnel for the supported Codex/ChatGPT integration.
2. Cloudflare Tunnel plus Access for the website and reviewed remote API/MCP
   deployment.
3. Direct enterprise ingress only when the operator owns certificates, reverse
   proxy, policy, logging, and patching.
4. No inbound exposure for an offline/local-only mode.

Every option terminates at the same authenticated capability facade. None
changes connector authority or exposes the private site network.

## User-friendliness assessment

### Useful today

The repository is already useful to developers and controlled field pilots
because governed environment calls can supply fresh, typed evidence that a bare
Codex session would otherwise have to reconstruct procedurally. The accepted
lifecycle, desktop package, tunnel, Device Check, profile connection slice,
Shared Live Rooms, and semantic monitor justify installing a development node
when work depends on a persistent external environment.

### Not yet ordinary-user-ready

The product remains below a public usability threshold while any normal user
must understand or manually perform:

- opaque developer launcher selection;
- MCP CLI login, callback ports, resource parameters, or configuration edits;
- token, key, or pairing-code relay;
- client/server restart ordering or tool-catalog cache behavior;
- provider credentials in a web renderer;
- unexplained profile, room, source, connector, or lease mismatches; or
- recovery by deleting files or killing processes.

### Minimum friendly alpha journey

```text
download signed installer
→ launch exactly one owned node
→ sign in through the system browser
→ optionally enable passkey / Windows Hello
→ choose “Connect Codex or ChatGPT”
→ approve a clearly named read-only scope
→ install or enroll one local companion without seeing a secret
→ select the site and local interface in trusted native UI
→ receive a successful Device Check and first snapshot
→ invite a second user or device to a read-only room
→ see what is shared and what remains private
→ revoke the room or connector in one action
→ reconnect or recover without CLI instructions
```

The UI should consistently answer four questions:

1. What is connected?
2. What can it observe or change?
3. Who currently has access?
4. How do I stop or repair it?

## Field applicability

### Strong first markets

| Field | First useful outcome | Why it fits |
| --- | --- | --- |
| Managed service providers and independent network technicians | Repeatable site inventory, interface health, evidence gaps, visit-to-visit change report | Heterogeneous small sites often lack a trustworthy current diagram. |
| Branch offices, retail, restaurants, and multi-site small businesses | WAN, switch, gateway, UPS, phone-gateway, and critical-service dependency snapshot | A local companion can retain site access while a remote specialist reasons through normalized evidence. |
| Building communications and facilities support | Evidence-backed phone, gateway, network, and power dependency graph | The observer can combine digital telemetry with technician-declared and instrument-measured records without claiming unknown wiring. |
| Labs, workshops, makerspaces, and advanced home networks | Device inventory, service discovery, power state, contradiction and stale-evidence tracking | The environment is diverse but the consequence of read-only observation is comparatively bounded. |
| Temporary sites, events, construction trailers, and mobile field kits | Before/after topology and readiness snapshot | Explicit selected-interface and site-session scope match changing deployments. |
| Remote support and equipment commissioning assistance | Shared, current, credential-free evidence for an off-site expert | Shared Live Rooms can expose the observation without transferring management credentials. |

The standardized IF-MIB exposes read-only interface operational state, speed,
counters, and lower-layer status. mDNS supplies link-local discovery, but its
answers are interface-specific and silence does not prove absence. Those
standards support the bounded observer design rather than unrestricted scanning.

Sources:

- [RFC 2863: Interfaces Group MIB](https://www.rfc-editor.org/info/rfc2863/)
- [RFC 6762: Multicast DNS](https://www.rfc-editor.org/info/rfc6762/)
- [CISA BOD 23-01 asset visibility](https://www.cisa.gov/news-events/directives/bod-23-01-improving-asset-visibility-and-vulnerability-detection-federal-networks)

### Later, higher-assurance markets

Operational technology, utilities, generators, transfer switches, elevators,
emergency communications, hospitals, and life-safety systems value asset
inventory and monitoring, but they are not appropriate first mutation markets.
NIST treats OT as a distinct security environment spanning control systems,
PLCs, communications, and remote access. These deployments require segmented
read paths, equipment-specific drivers, qualified personnel, documented threat
models, site-owner approval, regulatory review, and independent acceptance.

Use EH-NFO as diagnostic evidence support in those environments. Do not market
it as a compliance inspector, emergency-call verifier, safety controller, or
generic OT discovery tool.

Source:

- [NIST SP 800-82 Rev. 3: Guide to OT Security](https://www.nist.gov/publications/guide-operational-technology-ot-security)

## Recommended commercial sequence

1. Finish G8 native sign-in, protected renewal, managed reconnect/catalog
   refresh, one-instance supervision, and recovery.
2. Ship a signed developer/field alpha with Device Check and one read-only
   companion.
3. Complete EH-NFO-0 deterministic fixture and EH-NFO-1 single-driver live
   acceptance.
4. Pilot with a small number of network technicians or MSPs using equipment
   models the team can explicitly support.
5. Measure onboarding completion, first-snapshot time, blocker recovery,
   evidence usefulness, false merges, stale claims, and revocation success.
6. Add Shared Live Room read-only collaboration and second-device continuity.
7. Generalize the connector SDK and vendor-driver review process from pilot
   evidence.
8. Offer Docker only for headless/enterprise nodes after the native path is
   understandable and supportable.
9. Add monitor-only transitions after on-demand reads are trusted.
10. Treat every mutation package as a separate consequence, credential,
    approval, idempotency, reconciliation, and acceptance product.

## Product claim boundary

Recommended claim:

> CasimirBot is a local-first governed environment harness that lets an
> authorized AI client observe and work through narrow adapters while device
> credentials and enforcement remain on the user's computer.

Do not yet claim:

- universal device access;
- credential theft immunity;
- released biometric authorization;
- automatic MCP catalog convergence;
- closed-task remote wake;
- unattended critical-infrastructure control;
- a public multi-user release; or
- regulatory or physical-topology proof from network telemetry.

## Relationship to current packets

- `docs/work-packets/eh-nfo-0-network-field-observer-v1.md` owns the bounded
  Network Field Observer delivery sequence.
- `docs/work-packets/eh-g8-installed-profile-connection-broker-v1.md` owns the
  first profile-connection and protected credential-broker slice.
- `docs/work-packets/eh-g8-profile-semantic-mcp-monitor-v1.md` owns finite
  semantic monitor leases, cursor, reconnect, gaps, and revocation.
- `docs/work-packets/eh-g8-shared-room-multi-host-capability-federation-v1.md`
  owns the projected one-host/many-member and multi-host/one-room capability
  federation contract.
- `docs/helix-environment-harness-work-program-v1.md` remains the sole current
  gate, maturity, dependency, and advancement roadmap.
