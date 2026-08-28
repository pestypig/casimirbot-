Program gate: G8 — Environment-harness release evaluation
Workstream: EXE-first subscriptions, provider connections, and user-authorized agent capability
Capability or component: Installed CasimirBot subscription and provider-access broker v1
Lifecycle stage: identity → entitlement → provider connection → protected credential resolution → device capability grant → attended billable lease → metering → revocation and recovery
Reaction timescale: none for enrollment, payment, and revocation; `monitor_only` for usage and budget enforcement; ordinary semantic turns for Runtime Codex capability selection
Authority owner: The profile owner chooses a plan, provider, device, capability grant, and hard budget; the Casimir billing service owns entitlements, managed credits, and the usage ledger; the installed native host owns OS-protected user-secret custody; Helix owns scopes, leases, limits, provenance, and terminal eligibility; the admitted connector may resolve one credential for one admitted provider operation; Runtime Codex never receives credentials or approves spending
Current maturity: specified
Target maturity: integrated accepted on one signed installed Windows node for one Casimir-managed image-provider path and one user-owned provider path
Required evidence: frozen connection and entitlement classifications; developer-superset and public-user policy tests; signed-install identity; Auth0 login plus fresh step-up authentication; OS-protected native secret enrollment; opaque credential handles; no raw secret in renderer, browser, MCP, model, logs, process arguments, or debug export; idempotent payment webhooks; an auditable credit and usage ledger; exact per-session time, request, and currency ceilings; managed and user-owned provider acceptance; revocation, restart, offline, exhausted-budget, failed-payment, and recovery tests; sanitized MCP discovery; and one attended Realtime Texture Pack selected-window journey, using Minecraft as the first reference use case, with an immediate reveal-original and stop path
Explicit non-goals: no claim that ChatGPT or Codex subscription access is OpenAI API credit; no collection of provider secrets in chat, generic web forms, MCP configuration, prompts, or room state; no agent-created subscription, credential, device trust, MFA enrollment, budget increase, or unattended spend authority; no unlimited-usage plan; no provider resale before contract and legal review; no brokerage mutation; no ambient workstation, shell, filesystem, process, or private-network access; no multi-platform release, gaming-suitability, G8 closure, or profitability claim from this packet alone
Downstream gate unlocked: an installed public pilot in which a user can subscribe or bring a supported provider connection, grant one bounded capability to Codex, observe cost and provenance, and revoke it without exposing credentials

# EH-G8 EXE-first subscription and provider-access broker v1

## Product decision

The installed CasimirBot application is the primary harness product. The web
surface is an account, subscription, education, and constrained demonstration
surface. It may show sanitized device and usage status, but it must not imply
that a browser session alone owns or can operate a user's device harness.

The public journey converges on one signed CasimirBot EXE that owns the local
service boundary, native secret entry, device consent, capture consent, overlay,
Emergency Stop, and the governed MCP facade used by Codex. The existing opaque
repository launcher remains a development-only keyed test mechanism. It is not
the credential manager, subscription client, or public launcher design.

This packet is a parallel G8 delivery lane. It consumes the accepted identity,
profile-connection, account-policy, MCP, and native-host boundaries and uses
Realtime Texture Pack as its first visible acceptance customer. It does not
change the canonical agent loop, environment execution arbiter, or terminal
writer, and therefore does not perturb the open Minecraft G8 prerequisites.

Realtime Texture Pack is not limited to Minecraft. It is the generic Image Lens
prompt-conditioned display for one user-selected capturable window or browser
tab. Minecraft is the first visual reference journey because it makes the value
easy to experience; the same capture, prompt, provider, budget, overlay,
reveal-original, and stop contracts must work without application-specific code
for other eligible games, browsers, creative tools, simulations, and desktop
applications. Source selection grants no control over the selected application.

Exactly one implementation stage in this packet is active. SPB-0 through
SPB-2 are complete at deterministic maturity and SPB-3 is complete at live
acceptance. **SPB-4 is active.** SPB-5 through SPB-9 remain blocked until the
preceding stage records its named evidence.

## Uniform classification

Every surface must use these distinctions. A status in one class must never be
treated as authority in another.

| Class | Meaning | Example | Never implies |
| --- | --- | --- | --- |
| `profile_identity` | Who is signed in to CasimirBot | Auth0 profile/session | provider credit, device trust, or harness authority |
| `agent_client_connection` | Which reasoning client may reach CasimirBot | Codex app connected through scoped OAuth/MCP | OpenAI API access, a provider secret, or mutation authority |
| `device_installation` | Which installed node belongs to the profile | signed Windows CasimirBot installation | consent to capture, spend, or operate an environment |
| `service_entitlement` | Which Casimir features and managed credits the account may use | active Casimir-managed plan | a credential or permission to spend without a lease |
| `provider_connection` | How one provider operation may be authenticated | fal API key, provider OAuth, or managed fal pool | a harness capability or broad access to the provider account |
| `capability_grant` | Which exact harness capability may be advertised to a client | inspect or show Realtime Texture Pack | credential access, source selection, or billing changes |
| `billable_session_lease` | Fresh, bounded authority for one paid session | 60 seconds, 60 requests, USD 1.00 maximum | renewal, a higher ceiling, or unattended future sessions |

The supported access modes are:

| Access mode | Credential owner | Provider bill payer | Casimir charge |
| --- | --- | --- | --- |
| `casimir_managed` | Casimir server-side provider account | Casimir, reconciled to the exact user ledger | subscription and/or prepaid usage credits |
| `user_provider_oauth` | User's provider account; tokens remain in the approved broker | user/provider relationship | software/support plan; optional orchestration usage |
| `user_provider_key` | User, enrolled only through trusted native UI | user/provider relationship | software/support plan; optional orchestration usage |
| `local_only` | no cloud provider credential | none | software entitlement only, if applicable |

`codex_app_connection` and `openai_api_connection` are different connection
types. A user may be signed in to Codex through ChatGPT and still have no OpenAI
API balance or reusable API key. Conversely, a Casimir-managed OpenAI or fal
service does not expose its provider credential to Codex. The existing
`docs/helix-ask-codex-authentication-contract-v1.md` remains the authority for
Helix Ask's isolated Codex provider modes; this packet does not merge those
modes with product subscriptions.

## Target topology

```text
Casimir web: identity, plan purchase, receipts, demo, download
                  |
        entitlement + sanitized device status
                  |
signed CasimirBot EXE / private loopback node
  |               |                    |
native vault      policy + ledger      MCP OAuth facade
  |               |                    |
opaque handle --> admitted connector <- Codex capability request
                      |
             managed or user-owned provider
                      |
           normalized credential-free result
```

The web tier may operate the Casimir-managed provider account behind its own
server boundary. It must not receive a raw user API key merely because the user
can sign in there. User-owned raw keys are entered into a trusted native secret
control and replaced everywhere else by an opaque connection identifier.

## Commercial model and cost safety

The initial offer is not “unlimited APIs.” It is a measured entitlement with a
hard usage ceiling:

1. A Casimir-managed plan includes a defined amount of provider usage.
2. Usage beyond the included amount requires prepaid credits or an explicit
   one-time top-up; silent overage is forbidden for the first public pilot.
3. A bring-your-own-provider plan charges for Casimir software, orchestration,
   updates, active support, and development while the provider bills the user
   directly.
4. Every billable session has time, request, and currency ceilings below the
   account ceiling. The tightest applicable ceiling wins.
5. Provider cost is reconciled to append-only usage entries. UI estimates are
   labeled estimates until matched to provider billing evidence.

Pricing is not frozen until the live baseline measures cost per accepted frame,
useful minutes per dollar, dropped/stale work, payment fees, support burden,
refund exposure, and a reserve for price changes. The plan formula is:

```text
price floor = provider cost allowance
            + payment and tax handling
            + support and operations allowance
            + development allowance
            + bounded risk reserve
```

Before selling Casimir-managed access, the provider contract, resale terms,
privacy/data-processing terms, taxes, refunds, chargebacks, and regional
availability require explicit business and legal review. A technically working
shared credential is not authorization to resell a provider service.

## Secret and authentication boundary

### Native custody target

The current installed profile broker proves Electron `safeStorage` protection
of a Windows-user-bound credential-encryption key and AES-256-GCM ciphertext in
the local profile store. The release target narrows this further:

- the native broker unwraps a device master key with Windows DPAPI through
  Electron `safeStorage`;
- each credential record uses a distinct data-encryption key or equivalent
  provider-secret envelope with authenticated metadata;
- the private service receives an opaque handle or one-operation resolution,
  not a reusable master key in its inherited environment;
- secrets never enter renderer state, IPC response payloads, command-line
  arguments, browser storage, chat, prompts, MCP results, logs, traces, crash
  reports, analytics, room records, or repository configuration;
- backup/export excludes provider secrets by default; recovery that cannot
  unwrap an existing record fails closed and asks the owner to reconnect; and
- rotation and deletion invalidate active leases and produce a sanitized audit
  event.

Casimir-managed provider keys remain in a production server secret manager or
KMS, not in the downloadable client or database plaintext. The EXE receives
only the short-lived service result/stream admitted for its exact user and
session.

### MFA and step-up

Auth0 remains the identity provider. MFA is required as a fresh step-up—not
merely as an account checkbox—before:

- enrolling, replacing, exporting, or revoking a provider connection;
- registering a new device or recovering a protected vault;
- creating or changing a paid plan, payment method, top-up, or refund request;
- raising a usage ceiling or arming the first billable session on a device; and
- binding a new high-scope agent client.

The server must validate fresh authentication context (`acr`, `amr`, and
`auth_time` or the Auth0 equivalents) and issue a short-lived, one-purpose
receipt. Passkeys/WebAuthn are preferred where supported; authenticator-app
TOTP, including Microsoft Authenticator, is an acceptable recovery-compatible
factor. SMS should not be the only factor for high-risk changes. MFA factors,
recovery codes, and provider secrets are never visible to an agent.

## Agent and MCP authority

Codex may discover only sanitized facts such as:

- connection ID, provider kind, access mode, readiness, and owner profile;
- advertised capability and OAuth scopes;
- remaining session time/request/currency budgets and estimate timestamp;
- device/connector freshness, active lease identity, and stop state; and
- normalized provider output plus provenance allowed by the capability.

Codex may request or use an already admitted capability. It may not enroll,
replace, reveal, export, or delete a credential; subscribe, cancel, refund,
top-up, or change a payment method; register a device; satisfy MFA; increase a
budget; select a private capture source; or convert a request for approval into
approval. It may present a typed approval request. Only the native owner UI can
create the short-lived lease.

For Realtime Texture Pack, MCP may retain the existing sanitized inspect,
show, reveal-original, and stop controls for an already owner-armed session.
Start-capture, source selection, provider enrollment, and billing arm remain
native-user controls. The stop and reveal-original paths remain available even
if authentication, subscription, provider, or network state fails.

## Required EXE and web surfaces

### Installed EXE

- **Welcome / Sign in:** Auth0 login, account mode, subscription state, and
  signed-device registration.
- **Connections & Billing:** managed/BYOP choice, supported providers, native
  secret entry or OAuth launch, plan, included credits, top-up, hard limits,
  status, test, rotate, and revoke.
- **Device & Security:** installed nodes, session history, MFA state, trusted
  devices, vault health, recovery, and remote revoke.
- **Agent Access:** Codex/MCP connection, scopes, last use, capability grants,
  current leases, and disconnect.
- **Usage & Receipts:** per-session provider, access mode, requests, duration,
  estimate, settled cost, credits, and stop reason without prompts or pixels.
- **Image Lens:** local/provider mode, style presets, custom prompt, fixed
  baseline rate/resolution, capture consent, generic window/tab source picker,
  budget arm, overlay status, reveal-original, and stop.

Unfinished controls remain visible to `developer` accounts. A capability enters
the `user` policy only after its server-side authorization and acceptance tests
pass. No-session behavior remains the public `user` policy; hiding a control is
not an access boundary.

### Website

The website may host the demonstration, account creation, subscription purchase,
receipts, device list, download, documentation, and sanitized remote revocation.
It must identify local-only controls and direct the user to install/open
CasimirBot. The web demo uses demo-owned assets or an explicitly uploaded frame;
it does not capture or operate the user's desktop harness.

## Durable records

| Record | Purpose | Model-visible form |
| --- | --- | --- |
| `device_installation` | profile, signed build/channel, public device identity, trust/revocation state | sanitized device and freshness status when relevant |
| `provider_connection` | profile, provider, access mode, scopes, status, opaque credential handle | ID, kind, readiness, scopes; never secret material |
| `service_entitlement` | plan, feature grants, included credit, effective/expiry state | capability availability and bounded remaining allowance |
| `usage_ledger_entry` | immutable reservation, consumption, reconciliation, credit/refund adjustment | sanitized aggregate or exact current-session counters |
| `capability_grant` | profile/client/device/capability/scopes/revocation | exact admitted capability and scope |
| `billable_session_lease` | connection, device, session, time/request/currency caps, step-up receipt | remaining caps, expiry, stop state; no payment data |
| `security_audit_event` | enrollment, rotation, grant, denial, revoke, recovery | only owner/admin sanitized projection |

Payment-processor customer IDs and payment-method references are opaque. Full
card data must never transit or persist in CasimirBot; hosted payment fields or
redirects remain owned by the selected payment processor.

## Staged build plan

| Stage | State | Objective | Required completion evidence | Unlocks |
| --- | --- | --- | --- | --- |
| SPB-0 — classification and contract freeze | completed | Freeze the records, access modes, ownership, UI map, stage order, stop criteria, and relation to existing Codex/auth/provider contracts | packet linked from the G8 status roadmap, installed profile broker, product goal, and RTP fal packet; documentation audit passed on 2026-08-27 | SPB-1 |
| SPB-1 — native vault broker | completed — deterministically verified | Replace general child-environment master-key inheritance with authenticated one-operation native resolution; add per-record data keys, bounded master-key rotation, deletion, recovery, and migration | focused 28/28 vault/broker/environment/provider/route tests; desktop TypeScript and host build; private-service smoke; release-slice audit; evidence record below | SPB-2 |
| SPB-2 — EXE Connections, Billing, Device & Security UI | completed — deterministically verified | Add provider-neutral native screens and shared schemas while preserving the developer superset and server-side user policy | focused 16/16 component, route, projection, accessibility, account-policy, and direct-panel tests; desktop host and production client builds; release-slice audit; no generic web key form; evidence record below | SPB-3 |
| SPB-3 — Auth0 MFA and step-up | completed — live accepted | Enforce fresh high-risk authentication and device/session management | 16-file/91-test deterministic battery plus owner-attended installed TOTP enrollment, register/new-device restart, other-session revoke, device revoke, recovery-generation increment, and post-recovery restart evidence | SPB-4 |
| SPB-4 — payment and entitlement ledger | **active — deterministically verified** | Integrate Stripe in sandbox; implement idempotent signed webhooks, plans, prepaid credits, hard caps, refunds/adjustments, and failure states without provider traffic | 10-file/55-test deterministic coverage plus a hash-bound integrated acceptance record, including hosted Checkout/Portal, cumulative partial refunds, ordered subscription updates, cap rollback, and restart persistence; server/client/desktop builds; release/docs audits; owner sandbox purchase/cancel/refund receipts remain required for live acceptance | SPB-5 |
| SPB-5 — Casimir-managed provider path | blocked | Resolve one server-managed fal connection behind exact per-user entitlement, reservation, metering, and reconciliation | deterministic tenancy/cap tests and one manually approved capped provider trace with provider billing evidence | SPB-6 |
| SPB-6 — user-owned provider path | blocked | Enroll and revoke one fal credential in native custody; validate it without disclosure and run under user-provider billing | native enrollment/restart/revoke/rotation tests and one capped live trace; add OpenAI only as a separately classified provider later | SPB-7 |
| SPB-7 — Codex/MCP capability grants | blocked | Publish sanitized connection readiness and bounded capability leases through authenticated MCP without credential or payment authority | OAuth scope, catalog refresh, denial, approval-request, budget, revocation, reconnect, and no-secret tests on the installed client | SPB-8 |
| SPB-8 — Realtime Texture Pack installed acceptance | blocked | Run the generic 512 × 288, at-most-1-fps selected-window overlay with Minecraft as the first reference source, first using managed access and then the same contract with user-owned access | signed-node trace; exact selected application/window identity; source consent; proof that changing sources requires new owner selection; step-up/budget receipt; prompt/pixel secrecy; cost reconciliation; immediate reveal/stop; same session identities across EXE and MCP | SPB-9 |
| SPB-9 — signed public pilot | blocked | Package, sign, update, monitor, support, and roll back a bounded Windows pilot | signed installer/update evidence, crash/recovery and remote revoke, support/runbook readiness, privacy/terms/provider approval, pilot cohort hard limits | later release evaluation |

Each implementation turn must name one exact SPB stage and reproduce the packet
header with stage-specific evidence and stop criteria. Work from a later stage
may proceed only as a non-authoritative fixture or design exploration when it
cannot perturb an open prerequisite.

## SPB-1 deterministic evidence — 2026-08-27

The installed-node credential boundary now uses a native, authenticated
one-operation broker instead of passing the reusable provider-credential master
key to the private service:

- Electron `safeStorage` still protects the Windows-user-bound master material
  at rest. The protected file migrates from the v1 single-key schema to a v2
  keyring with one active key and at most two retired migration keys.
- The desktop host starts a private IPv4-loopback credential broker with a
  random per-launch bearer. The child inherits only the exact broker origin and
  ephemeral bearer; `HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY` is absent.
- New native envelopes use AES-256-GCM v2 with a random per-record data key. The
  data key is separately wrapped by the active native master key, and both the
  key wrap and payload are bound to the exact owner/connection AAD.
- The broker admits only authenticated `POST` operations from loopback, bounds
  request bodies, never returns the master key, zeroes temporary key buffers,
  and closes with the desktop service.
- The Robinhood profile-connection path uses the asynchronous storage boundary.
  Existing v1 ciphertext whose `env:` key ID matches the active or retired
  native key can be decrypted and is lazily rewritten with the active `native:`
  v2 envelope. Unknown keys, crossed AAD, broker loss, corrupt protected state,
  or incomplete broker configuration fail closed.
- Owner disconnect continues to delete the credential-bearing connection row
  and cascade dependent room bindings. Rotation support is code-owned in SPB-1;
  its owner-facing high-risk control remains blocked on SPB-3 step-up and SPB-6
  provider enrollment.
- Non-desktop deployments retain the prior environment/KMS-compatible vault
  path. Desktop-only public connections do not fall back to it when the native
  broker is unavailable.

Verification recorded:

- `npx vitest run tests/desktop-provider-credential-broker.spec.ts tests/desktop-provider-credential-key.spec.ts tests/desktop-service-environment.spec.ts server/services/brokerage/__tests__/provider-credential-vault.test.ts server/routes/__tests__/brokerage-connections.test.ts --pool=forks` — 5 files, 28 tests passed;
- `npx vitest run tests/desktop-host-security.spec.ts tests/desktop-release-slice.spec.ts --pool=forks` — 2 files, 15 supplemental desktop security/release-slice tests passed;
- `npx tsc -p apps/desktop/tsconfig.json --noEmit` — passed;
- `npm --prefix apps/desktop run build:host` — passed; the bundled service emitted four unrelated existing duplicate-key/case warnings;
- `npm --prefix apps/desktop run smoke:service-boundary` — passed with missing/wrong desktop sessions rejected, authorized readiness accepted, release closed, local state isolated, and Device Check policy closed; and
- `npm --prefix apps/desktop run release:audit-slice` — passed with outside changes reported but not staged.

The repository-wide root TypeScript check was also attempted, but it remains
red across a large pre-existing unrelated backlog in CLI, client tests, tools,
and warp modules. It is not counted as SPB-1 evidence. No signed installer,
live provider enrollment, MFA, payment, or public-user provider UI is claimed.

## SPB-2 deterministic evidence — 2026-08-27

The installed application now has a developer-visible provider-neutral
**Connections, Billing & Security** panel backed by a strict sanitized server
projection:

- `profile_identity`, `agent_client_connection`, `provider_connection`,
  `environment_provider_connection`, billing entitlement, device state, and
  agent authority remain separate typed fields. Codex app access is never
  represented as OpenAI API access.
- The installed-only route requires the private desktop session, an active
  developer profile, and the exact `installed_service_management` account
  feature. Hosted web, missing desktop authority, missing profile identity, and
  public-user access fail closed.
- The panel provides accessible Overview, Connections, Billing, and Device &
  Security tabs. It links to the existing Agent Access, Account & Sessions,
  Image Lens, and Robinhood OAuth surfaces without introducing a second
  authentication implementation.
- fal and OpenAI native-key enrollment, payment, top-up, MFA, and remote device
  controls are labeled with their prerequisite stage and disabled. No raw-key,
  password, payment-card, or simulated entitlement field is rendered.
- Developer remains the workstation superset. The unfinished panel is absent
  from the public-user launch allowlist, the feature is explicitly user-locked,
  and a direct public-user panel link resolves to the server-backed lock screen.
- The desktop runtime capability now reports native provider-vault readiness
  from the provider credential broker rather than from the unrelated MCP tunnel
  vault state.

Verification recorded:

- `npx vitest run shared/__tests__/helix-installed-account-services.spec.ts server/routes/__tests__/installed-account-services.test.ts client/src/components/workstation/__tests__/InstalledServicesPanel.spec.tsx --pool=forks` — 3 files, 12 tests passed;
- `npx vitest run client/src/components/workstation/__tests__/WorkstationPanelHost.account-policy.spec.tsx --pool=forks` — 1 file, 4 tests passed, including direct-panel denial and asynchronous localized lock chrome;
- `npx tsc -p apps/desktop/tsconfig.json --noEmit` — passed;
- `npm --prefix apps/desktop run build:host` — passed; the bundled service emitted four unrelated existing duplicate-key/case warnings;
- `npm run build:client` — passed; the new installed panel emitted as a lazy production chunk, with existing browser-externalization, dependency `eval`, mixed-import, and large-chunk warnings; and
- `npm --prefix apps/desktop run release:audit-slice` — passed with outside changes reported but not staged.

SPB-2 does not claim Auth0 MFA or fresh step-up, device registration/recovery,
payment or entitlement authority, managed provider traffic, native API-key
enrollment, public MCP grants, live Realtime Texture Pack acceptance, or a
signed public pilot. Those remain ordered SPB-3 through SPB-9 work.

## Acceptance journeys

### Managed-service user

1. The user signs in on the website, buys a bounded plan through hosted payment,
   downloads the signed EXE, and signs in there.
2. The EXE registers the device after fresh MFA and shows the entitlement; it
   receives no provider master key.
3. The user connects Codex through OAuth/MCP and grants only the Realtime Texture
   Pack inspect/show/reveal/stop scopes.
4. In Image Lens, the user selects one eligible window or browser tab—Minecraft
   is the first reference example—then chooses a style preset or custom prompt,
   the minimum 512 × 288 / at-most-1-fps baseline, and a hard session budget.
5. The owner manually arms the session. Codex may show the already-authorized
   overlay or reveal/stop it, but cannot raise or renew the budget.
6. Usage settles against the user ledger and the EXE displays a credential-free
   receipt. Exhaustion stops provider work and preserves reveal/stop.

### User-owned provider

The same journey substitutes trusted native provider-key entry or approved
provider OAuth for the managed entitlement. The EXE displays only an opaque
connection and provider-billed status. Casimir records orchestration usage but
does not present a provider estimate as a settled provider invoice.

### Revocation and failure

Revoking the capability, provider connection, Codex client, device, or profile
invalidates dependent leases. Failed payment disables new managed reservations,
not local reveal/stop or access to prior receipts. Network loss, provider error,
vault corruption, stale MFA, catalog drift, restart, and budget exhaustion each
produce a typed nonterminal or stopped state and never silently fall back to a
different credential or payer.

## Stop/fail criteria

- Any classification is collapsed—for example, Codex login is treated as an
  OpenAI API connection or a subscription as a capability grant.
- A raw secret reaches a renderer, browser response/storage, MCP result, model
  context, log, trace, crash report, command line, repository file, or room.
- A child process receives a reusable vault master key in the SPB-1 target.
- An agent can enroll credentials, satisfy step-up, create/cancel a plan, modify
  payment, raise caps, select capture, or arm/renew billable authority.
- A payment webhook can double-credit, usage can exceed the tightest ceiling,
  or tenant/profile/device identity can be substituted.
- Provider or payment terms do not permit the intended managed-service model.
- Stop, reveal-original, revoke, refund/adjustment, recovery, or audit evidence
  is missing or depends on provider availability.
- A web demonstration is presented as installed harness or device acceptance.

## Verification map

The documentation stage requires:

```text
npm run helix:environment-harness:docs-audit
git diff --check -- docs/helix-environment-harness-work-program-v1.md \
  docs/architecture/casimirbot-environment-harness-product-goal-v1.md \
  docs/work-packets/eh-g8-installed-profile-connection-broker-v1.md \
  docs/work-packets/eh-g8-realtime-texture-pack-fal-attended-api-v1.md \
  docs/work-packets/eh-g8-exe-first-subscription-provider-broker-v1.md
```

Later stages require focused shared-schema, vault, route, account-policy, Auth0,
payment-webhook, ledger, MCP, Realtime Texture Pack, and desktop packaging tests
plus the named live evidence. Ordinary documentation and commercial-boundary
work does not invoke the Casimir physics verification gate.
