# EH-G8 PNA2 provider-neutral Agent Connections v1

Program gate: G8 — environment-harness release evaluation
Workstream: provider-neutral external-agent onboarding
Capability or component: PNA2 — versioned client profiles, profile-owned connection readiness, and resumable guided setup
Lifecycle stage: client authorization and source admission (primary); readiness presentation (supporting)
Reaction timescale: none
Authority owner: the signed-in CasimirBot profile owns CasimirBot authorization; the installed node owns connection readiness and catalog evidence; the external AI application owns its MCP settings, OAuth UI, restart, chats, model session, and continuation lifecycle
Current maturity: deterministically verified
Target maturity: integrated accepted
Required evidence: versioned Codex App and standards-based MCP client profiles; profile/node/OAuth-client/client-session/thread-bound sanitized status; deterministic manifest, route, ownership, stale-presence, reconnect, revocation, secret-exclusion, and setup-state tests; desktop guided setup with Choose, Back, Retry, Explain, optional Skip, safe Device Check, restart recovery, one actionable blocker, keyboard/status-announcement, compact layout, and Advanced manual fallback; authenticated expected least-scope catalog from one installed Codex connection; one independent standards probe completing OAuth-protected discovery; canonical documentation audit
Explicit non-goals: no bundled or private model runtime; no provider credential capture; no silent external-app configuration mutation; no claim that CasimirBot can install a Codex plugin, restart Codex, create/select/mirror a Codex chat, or wake a closed task unless a provider-supported transport proves it; no hidden reasoning; no environment authority from MCP connectivity; no Stage 3 activity/composer/voice/mission implementation; no private tool loop, approval system, sandbox, compaction, or terminal writer
Downstream gate unlocked: PNA Stage 3 — Helix operator and activity surface

## First affected boundary

This packet implements Stage 2 of
`docs/work-packets/eh-g8-provider-neutral-agent-connection-and-helix-activity-v1.md`.
The first affected boundary is client authorization/source admission. It does
not modify prompt interpretation, model sampling, generic tool execution,
evidence re-entry, follow-up reasoning, or terminal authority.

The connection flow must preserve this distinction:

```text
CasimirBot profile signed in
  != external AI application available
  != OAuth authorization active
  != MCP client currently online
  != catalog probe observed
  != provider task/thread attached
  != continuation transport ready
  != environment ready
```

## Supported-client profiles

PNA2 introduces one provider-neutral manifest contract and two profiles:

1. `codex_app` is the first product profile. Its agent connection uses the
   OAuth-protected local-supervisor coordination MCP endpoint. CasimirBot may
   separately integrity-check and open its packaged **Device Check-only**
   plugin entry point, but that optional observation surface is never agent
   connection, catalog, presence, or task proof. Codex retains installation,
   OAuth, restart, new-chat, task, and model-session ownership.
2. `standard_mcp` describes an OAuth-capable Streamable HTTP client. CasimirBot
   provides endpoint and capability information without accepting tokens or
   inventing a generic cross-client deep link.

Both profiles use the same server-authoritative CasimirBot readiness axes. A
selected profile is a user preference, not verified client identity. Exact MCP
identity is established only by the authenticated principal and current
presence/catalog probe.

The Codex-specific facts are aligned with official OpenAI documentation as
read on 2026-08-31:

- local Codex clients support Streamable HTTP and OAuth MCP servers;
- ChatGPT desktop, Codex CLI, and the IDE extension share MCP configuration on
  a Codex host;
- desktop MCP settings require Add server, Save, and Restart;
- plugins can request connection/authentication during or after install; and
- a newly installed plugin is used from a new chat.

Source: `https://developers.openai.com/codex/mcp` and
`https://developers.openai.com/codex/plugins`. These product-owned steps must
remain explicit until OpenAI exposes a supported automation surface.

## Server-authoritative readiness

The owner-only status route combines:

- the exact cookie-authenticated CasimirBot profile;
- the installed node/service instance;
- active server-verified account binding;
- an active authenticated MCP client presence for the same profile;
- the server-derived MCP client session and declared conversation thread; and
- the capability of the selected client profile.

An active authenticated call to the local-supervisor presence tool is the
minimum catalog adoption probe because it proves the client reached the current
node, passed OAuth admission for that tool, declared a continuation, and
received the tool contract. It does not prove every broader tool is visible,
does not identify the provider application by itself, and grants no environment
authority.

Stale presence, revoked binding, profile mismatch, node epoch change, missing
MCP identity, or absent thread declaration fails closed. The renderer receives
only opaque references and fixed flags: no bearer, OAuth subject, claims,
provider-thread content, credentials, private endpoints, or hidden reasoning.

## Guided setup

The ordinary-user path is a resumable state machine:

```text
Choose AI app
  -> Sign in to CasimirBot
  -> Authorize CasimirBot access
  -> Open the supported client connection surface
  -> Complete the client-owned install/auth/restart or reconnect step
  -> Run safe connection check
  -> Ready / one actionable blocker
```

The browser stores only the selected profile and last viewed setup step. Every
authorization, presence, catalog, and attachment fact is re-read from the
server/native host after resume; local progress never becomes authority.

Controls:

- **Back** changes only the viewed step;
- **Retry** rereads native and server evidence;
- **Explain** expands the current blocker without adding another action;
- **Skip Device Check** is available only when that observation is optional;
- **Open Codex** uses the integrity-checked native bridge and never edits Codex
  configuration; it is labelled as optional Device Check and never advances
  agent-connection readiness;
- **Disconnect** uses the existing profile-owned revocation boundary and must
  explain when the action affects all clients linked to that binding; and
- **Advanced setup** retains the current manual examples without making them
  the default journey.

## Work slices

### PNA2.1 — contract and status route

- define and test the client-profile and connection-status schemas;
- project exact profile/node/client/session/thread references without secrets;
- filter presence by exact profile and freshness;
- fail revoked or absent authorization closed; and
- preserve non-answer and zero-environment-authority flags.

### PNA2.2 — resumable desktop setup

- implement the setup reducer and bounded persisted preference;
- combine the server facts with trusted native Codex-plugin availability;
- render one blocker and one recovery action;
- provide Back, Retry, Explain, optional Skip, and Advanced paths; and
- reuse the native Auth0 PKCE and Codex plugin bridges.

### PNA2.3 — installed and independent-client acceptance

- verify the expected least-scope catalog through the installed Codex client;
- observe exact profile/node/client/session/thread convergence;
- test reconnect, restart recovery, and revocation; and
- run an independent OAuth-capable MCP probe against the same discovery and
  catalog contract.

## Stop/fail criteria

Stop without promoting Stage 2 if:

- local setup state is treated as authorization or presence;
- a plugin-open receipt is treated as install, OAuth, catalog, or chat proof;
- a tunnel-ready state is treated as client, thread, or environment readiness;
- one profile can observe or revoke another profile's connection;
- stale presence survives a binding revocation or node epoch change;
- setup asks the user to paste a bearer, provider token, callback port, or
  provider credential;
- CasimirBot writes provider settings through an unsupported path;
- a connection projection gains mutation, assistant-answer, or terminal
  authority; or
- deterministic tests are promoted to installed Codex or independent-client
  acceptance.

## Verification map

Use narrow checks first:

```text
npx vitest run shared/__tests__/helix-agent-client-profile.spec.ts server/routes/__tests__/agent-connections.test.ts client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks
npx vitest run client/src/components/agent-access/__tests__/AgentAccountBindingReadiness.spec.tsx tests/desktop-codex-plugin.spec.ts server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks
npm run helix:ask:discipline:quick
npm run helix:environment-harness:docs-audit
```

Run one installed Codex and one independent-probe journey only against the
user's existing keyed/tunneled service or an explicitly authorized opaque
launcher. Do not substitute an unkeyed server.

## 2026-08-31 implementation checkpoint

PNA2.1 and PNA2.2 are implemented at deterministic maturity:

- `helix.agent_client_profile.v1` defines the Codex App and standards-based
  Streamable HTTP MCP profiles without accepting provider credentials or
  claiming provider-chat, hidden-reasoning, environment, answer, or terminal
  authority;
- both profiles expose a least-scope coordination endpoint and an explicit
  full-harness consent-upgrade variant; scope increase is never silent and
  requires authoritative catalog re-enumeration;
- both profiles separate capability scopes from the `offline_access` session
  continuity request. The external AI client owns refresh-token custody;
  `offline_access` grants no Helix capability, environment, mutation, answer,
  or terminal authority;
- the Thread Observability Bridge distinguishes `tool_activity_only`, optional
  `checkpoint_publish`, and provider-transport-dependent
  `continuation_ready`; checkpoint negotiation carries bounded freshness,
  `current_session|profile_durable` retention, and independent revocation while
  ordinary MCP requires no checkpoint;
- `helix.agent_connection_status.v1` projects only the signed-in profile,
  current service instance, active opaque binding, authenticated MCP client,
  client session, declared thread, freshness, and fixed non-authority flags;
- the owner-only readiness route fails absent/revoked authorization, stale
  presence, another profile, another node epoch, or missing MCP identity closed;
- the workstation now defaults to a resumable Agent Connections flow and moves
  endpoint/configuration examples behind **Advanced manual setup**;
- persisted setup state contains only the selected profile and viewed step;
  and
- optional Codex Device Check is explicitly separate from agent connection,
  catalog, presence, and task proof.

The independent `standard_mcp` `full_harness` variant completed authenticated
discovery and one safe catalog call on 2026-08-31. The sanitized evidence is
`docs/evidence/eh-g8-pna2-provider-neutral-agent-connections-v1/2026-08-31-independent-client-live-checkpoint.json`.
This proves the independent-client exit item for that endpoint variant only; it
does not prove coordination-only presence, a client brand, Codex acceptance,
checkpoint publication, continuation transport, or environment authority.

Deterministic evidence on this checkpoint:

```text
new PNA2 contract/route/state/UI battery: 4 files, 16 tests passed
existing binding/plugin/local-supervisor regression battery: 3 files, 32 tests passed
Helix Ask discipline quick guard: passed; no sensitive Ask-loop files changed
environment-harness documentation audit: passed at G8
production client build: passed
production server build: passed (four pre-existing duplicate-key/case warnings)
repository-wide TypeScript check: baseline failed across unrelated CLI,
translation, Helix fixture, and warp files; no clean global claim made
standalone PNA2 TypeScript diagnostics: none after strict callback annotation repair;
the shared monolithic `server/index.ts` and `helix-mcp-server.ts` remain inside
the unrelated repository-wide baseline failure, so no clean global claim is made
combined PNA2/profile/OAuth/plugin/local-supervisor battery: 8 files, 65 tests passed
```

The installed Codex authorization and restart-continuity slice is now live
accepted. The original `oauth_refresh_token_missing` /
`TRIGGER_REAUTHENTICATION` blocker was reproduced after login and restart. The
authorization server advertised `offline_access` and the refresh-token grant,
but **Allow Offline Access** was disabled on both the canonical CasimirBot API
and the installed OpenAI tunnel API. Both exact settings were enabled and
verified after reload without adding a capability scope or Helix authority.
After one fresh provider-owned login, Device Check returned provenance-valid
owner-scoped evidence, authenticated installed-client presence registered, and
the same harmless read plus presence heartbeat succeeded after a Codex restart
with no intervening login. The sanitized evidence is
`docs/evidence/eh-g8-pna2-provider-neutral-agent-connections-v1/2026-08-31-installed-codex-refresh-continuity-checkpoint.json`.

PNA2 remains active rather than `integrated accepted`: the public
protected-resource metadata URLs still resolve to the website SPA instead of
the required JSON documents. Installed-client presence disconnect projected
the exact client inactive with immediate heartbeat expiry and no retained
claims, then authenticated reconnect succeeded.

The current-source desktop Agent Connections journey is now live accepted in a
fresh unpacked Windows build. The UI required an action-time two-step
confirmation, projected the profile binding as revoked, and returned to the
native Auth0 PKCE link step. That first relink exposed a real reconnect defect:
the verified native callback did not pass the account-link store's required
explicit `reactivate` flag, so a deliberately revoked binding could never be
relinked. Native PKCE completion now passes `reactivate:true` only after a
fresh user-started authorization succeeds. The focused account-link battery
passes 18/18 tests, and a second fresh unpacked build completed revoked ->
fresh Auth0 authorization -> active binding -> authenticated presence ->
**CONNECTED**, with current catalog and chat attachment. The sanitized evidence
is `docs/evidence/eh-g8-pna2-provider-neutral-agent-connections-v1/2026-08-31-agent-connections-disconnect-reactivation-acceptance.json`.

This accepts the current-source unpacked desktop journey, not a signed installed
release. A signed/current installer validation and the public protected-resource
metadata deployment remain open. No hidden endpoint was used and no credential
was requested, copied, logged, projected, or inferred.

The Stage 2 completion audit is recorded in
`docs/evidence/eh-g8-pna2-provider-neutral-agent-connections-v1/2026-08-31-stage2-completion-audit.json`.
The focused completion battery passes 122/122 tests across 14 files. The desktop
release-slice manifest now includes the provider profiles, guided setup,
readiness route, local-supervisor presence contract, live checkpoints, and the
stable workspace-registry subscription required by the installed journey. Its
audit passes with 161 owned files, 12 explicitly hunk-reviewed shared files,
zero staged files, and all unrelated worktree changes left outside the slice.
The production smoke now fails unless the base MCP, Device Check, and
local-supervisor coordination metadata paths all return JSON with their exact
least-scope expectations. Its current runtime attempt failed closed before
launch because the existing `dist` belonged to an older commit; no stale build
was accepted as deployment evidence.
The signed desktop workflow now runs this complete Stage 2 battery plus the
canonical environment-harness documentation audit before release preflight or
signing. Workflow YAML and ordering regressions pass. Because this changes a
release-verification surface, Casimir adapter run `2605` was required and
returned `PASS`, certificate hash
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
integrity OK, status GREEN. This gate evidence does not substitute for an
actual signed workflow run or installed-release acceptance.
This closes the locally actionable release-slice omission but does not promote
PNA2: the hosted metadata paths still return the website shell, no signed
desktop workflow has run, and the current changes are not a reviewed commit or
production deployment.
The public apex and metadata responses currently terminate at Google Frontend.
Because the same metadata contracts pass in source and the deployed `/healthz`
contract is absent, the remaining public failure is classified as a stale
hosted deployment or edge-route boundary rather than another metadata-handler
implementation gap. That is an inference from the public response and must be
retested after the reviewed source is deployed.

Signed-in browser visual acceptance was not substituted with an unkeyed server:
the in-app browser controller could not initialize its local kernel-assets
runtime. The production client build and jsdom keyboard/focus/status tests pass,
but a rendered installed-node UI observation remains unclaimed.

## 2026-09-01 source-delivery and hosting handoff

The complete current working-tree checkpoint was reviewed for credential-shaped
content, committed as `e9d5e0a1c432f0f9f6220669a1db39907756da63`, pushed to
`origin/main`, and verified byte-for-byte by matching local and remote commit
identities. This closes the earlier source-delivery omission without treating a
Git push as a production deployment or signed release.

The memory-bounded Stage 2 release gate remains green at 122/122 focused tests
across 14 files. `npm run helix:ask:discipline:quick` passed with no Ask-sensitive
changes, and `npm run helix:environment-harness:docs-audit` passed at G8. The new
immutable checkpoint is
`docs/evidence/eh-g8-pna2-provider-neutral-agent-connections-v1/2026-09-01-source-delivery-and-replit-handoff.json`.

The public route failure remains unchanged after source delivery: the base MCP,
Device Check, and local-supervisor coordination protected-resource metadata
paths each return `200 text/html` with the website shell instead of their JSON
contracts. The authenticated Replit project was identified at
`https://replit.com/@pestypig/CasimirBot`, but no deployment mutation was made;
the full workspace did not expose an inspectable deployment panel before the
bounded browser-control attempts timed out. PNA2 therefore remains
`deterministically verified`. Production route materialization and the signed
installed-current-release journey remain required for promotion.
