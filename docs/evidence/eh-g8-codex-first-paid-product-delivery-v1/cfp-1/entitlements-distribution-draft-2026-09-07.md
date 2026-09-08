Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1 entitlement and distribution specification draft
Capability or component: Paid external-agent software access, delivery and recovery
Lifecycle stage: admission and presentation specification
Reaction timescale: durable commercial planning; bounded runtime revocation
Authority owner: Product owner selects terms; licensing and release owners approve distribution; service policy owns admission; Codex owns reasoning
Current maturity: specified
Target maturity: specified with owner-selected terms and frozen acceptance scenarios
Required evidence: CFP-0 inventory, explicit owner choices, reviewed rights, exact implementation handoffs and acceptance results in subsequent stages
Explicit non-goals: no runtime changes, payments, publication, source privatization, provider resale, new runtime ownership or capability promotion
Downstream gate unlocked: CFP-3 contract preparation after CFP-1 decisions and the parent stage prerequisites

# Entitlement and distribution draft — 2026-09-07

Status: proposals for coordinator and owner review. The coordinator reports
that the owner selected bounded Minecraft assistance; commercial term and all
numeric thresholds below remain unselected. No test was executed for this
draft. Relative source paths are relative to the authoritative repository.

Parent: `docs/work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md`.
Stage authority remains `docs/helix-environment-harness-work-program-v1.md`.

## Inspected implementation facts

- `shared/helix-billing-entitlement.ts` specifies sandbox status and credits,
  with provider traffic and billable lease authority literally false.
  `server/services/helix-account/billing-entitlement-store.ts` owns payment
  event deduplication, ordered state and credit/refund accounting. Its verified
  sandbox ledger is not a software admission contract.
- `server/routes/desktop-auth0-step-up.ts` requires a developer profile for
  installed sensitive operations. `server/routes/installed-account-services.ts`
  likewise requires developer and installed-service feature access. Public
  purchase/account management cannot be assumed from these handlers.
- `shared/helix-account-session.ts` preserves developer wildcard access and
  public user restrictions. MCP room and Minecraft lifecycle boundaries in
  `server/mcp/helix-mcp-server.ts` enforce those restrictions directly.
- `apps/desktop/src/mcp-tunnel.ts` stages an OpenAI secure MCP tunnel with
  protected tunnel credentials and OAuth configuration. The selected installed
  path therefore has hosted transport/identity dependencies even on one PC.
  This inspection does not prove a hosted-free local transport alternative.
- `apps/desktop/src/updater.ts` requires explicit check/download/install,
  disables automatic quit installation, disables web installer and sets
  `allowDowngrade=false`. Existing code does not implement the proposed
  entitlement state machine or license-aware update eligibility below.
- `apps/desktop/electron-builder.config.cjs` publishes draft GitHub releases to
  `pestypig/casimirbot-`; release signing is required in release mode and update
  signature verification is enabled. `shared/desktop-release.ts` allowlists
  that exact repository. `apps/desktop/scripts/site-release-metadata-lib.mjs`
  verifies installer/publisher evidence, package metadata and Casimir PASS with
  certificate integrity OK before generating the site download projection.
- Actual shipped dependencies and provider dashboards were not inspected here.
  Builder resources explicitly include the tunnel-client executable and its
  license, a Codex marketplace plugin, sharp/@img unpacking and environment
  launcher script. Rights review must cover these; a private npm flag does not
  establish proprietary distribution rights.

## Independent authority model

Proposed admission conjunction for paid environment work:

`trusted profile + server account policy + eligible software capability +
registered installation + authorized client scope + exact environment/player
binding + consent + fresh evidence + current effect lease`.

Optional hosted-room access and optional provider spending are additional
independent checks only when those capabilities are requested. A payment event,
credit balance, update entitlement or successful login grants no environment
effect authority. Purchase does not change account type. Developer remains the
development superset under existing developer policy; its bypass of a public
software purchase must never bypass binding, consent, safety or spend limits.

Unlicensed/signed-out users retain local stop, revocation and safe diagnostics.
History/export/account recovery require their normal identity and privacy
checks; safety access does not expose another profile's data.

## Proposed software record and transition rules

Use a separately versioned software entitlement record, not extra inferred
meaning attached to a provider-credit balance. Proposed fields are profile ID,
product/capability set and revision, term type, effective start/end, update
eligibility boundary, cancellation schedule, revocation revision/reason,
installation grants, server event/version authority and signed validation lease.
These names are conceptual until CFP-3 freezes a schema. Secrets and processor
objects are excluded from client projections and MCP.

| State or event | Proposed effective access and transition |
| --- | --- |
| `unlicensed` | Compatibility/setup/evaluation only as selected; purchase processing does not admit paid work. |
| `activation_pending` | Payment still being verified or device grant incomplete; no paid admission. Only authoritative server activation advances state. |
| `trial_active` | Exact trial capabilities and fixed expiry, if owner selects a trial. No automatic paid conversion without separately authorized terms. |
| `active` | Frozen capabilities usable subject to all independent checks. Credit exhaustion in optional inference does not cancel software access. |
| `cancel_scheduled` | Subscription capabilities remain active through the paid end; renewals disabled. Cancel intent and end-of-term enforcement are separate events. |
| `validation_grace` | Last authentic lease still within bounded cached validity; no new capability, device or term expansion. This is validation availability, not an extension of the paid term. |
| `expired` | Trial/subscription end reached, or cached validation allowance exhausted. Reject new paid admissions and release running authority at the bounded boundary. Safety/account/export remain. |
| `revoked` | Effective refund/chargeback/fraud/device revocation policy removes the affected grant when learned. Persist monotonically; old signed leases do not reactivate it on this node. |
| Renew/reactivate | Fresh server-verified term/revision may restore eligible access. It never restores old environment grants or silently resumes side effects. |

Partial refund handling is an explicit line-item decision: a provider-credit
refund adjusts that ledger only; a software refund follows the selected
software policy. Payment failure does not invent a new grace term: use the
actual already-paid boundary and selected retry policy. Duplicate/reordered
events must not double grant credit, extend terms, or resurrect revoked access.
Equal-time conflicts require a deterministic authoritative processor-state
resolution, not arrival-order assumptions.

For a version license, software use may remain active after update/support
eligibility ends. That is a separate `updates_ended` projection, not software
expiry. A perpetual local software license cannot promise perpetual hosted
transport funding without an explicit funded service term or accepted local
alternative. Do not select that option by silently assuming such an alternative.

## Concrete owner options

| Choice | Recommended candidate for discussion | Alternative and consequence |
| --- | --- | --- |
| Term | Renewable software subscription including essential identity/tunnel service and maintenance | Version license plus explicit hosted-service/update term; more continuity but more entitlement combinations and transport-support obligations |
| Evaluation | 14-day useful constrained trial, no auto-charge | Attended paid pilot only; smaller abuse/control surface but less self-service evaluation |
| Devices | Two registered Windows installations, one simultaneous paid environment session | One device lowers abuse/support complexity but increases replacement friction; more simultaneous sessions require an explicitly funded offer |
| Validation | Refresh every 24 hours; at most 72 hours from last verified time, never past software term end | Always-online activation is simpler but outage-sensitive; longer allowance improves resilience and increases revocation delay |
| Revocation | Connected admission rechecks within 60 seconds; stop-release budget at most 5 seconds after effective loss, subject to measured connector safety | Tighter budgets require evidence that each connector can enforce them; do not relabel polling as instant revocation |
| Expiry | Reject new work; bounded safe cancellation, no automatic resume on renewal | Finish-current-task rule is unsafe without a defined finite task/effect ceiling and can hide indefinite work |

All numbers are PROPOSED, not measured or accepted. CFP-1 must freeze or replace
them. If a selected connector cannot meet the release budget, narrow the
capability or revise the owner-approved contract before evaluation.

License-cache expiry must use authenticated server time plus monotonic elapsed
time within a process, persist a high-water mark and fail to online recovery on
clock rollback or untrusted restart time. Same-device admin rollback resistance
must be evaluated rather than advertised as tamper-proof. Known revocation
beats cached grants. An offline node cannot learn a new remote revocation
instantly: maximum exposure is the bounded lease validity, which must also cap
its effect leases. No offline guarantee is made for Codex model access, OAuth
refresh, tunnel connectivity or unaccepted environment paths.

Device replacement requires owner authentication, revocation of the old grant
and explicit enrollment of the new node. Lost-device revoke is available
without possession of that device. Concurrent admission must reserve a server
slot atomically; cache leases must reserve distinct slots so two offline nodes
cannot both inherit one supposedly exclusive slot. If that cannot be proven,
prohibit new offline paid-session admission in the initial offer.

## Hosted dependencies and payer disclosure

Base candidate includes Casimir account identity, license validation, installed
agent connection/tunnel routing, essential metadata and download/update delivery.
Freeze actual providers, operational ownership, recurring cost, service outage
states and deletion/support policy before promising continuity. A same-host
session is not automatically hosted-free or offline.

External Codex account/model usage belongs to the user and provider. CasimirBot
does not collect that app's password/token as an API key. Optional managed
inference, BYOP credentials, image transformation, remote rooms and multi-device
collaboration remain separately selected offers; the SPB provider stages retain
their order. Software-only acceptance neither completes SPB5–9 nor requires
buying unused inference. No silent API billing fallback is allowed.

### Hosting sustainability worksheet

Before choosing a version license, freeze a funded hosting period in months M
and obtain current vendor quotes separately. This draft contains no invented
vendor prices. Monthly per-active-install cost is the sum of identity cost per
active identity, tunnel connection-hours and transferred GB, license API/DB
requests and storage, download/update egress, operational monitoring, and
measured support minutes times loaded support cost. Add allocated fixed service
cost at the declared active-install count and payment/refund/incident reserve.

Required prepaid reserve per sale = M times a conservative measured monthly
cost at the declared active rate, plus onboarding/support and payment costs.
Compare low/expected/high connection-hours, update-download GB, support minutes
and active-install counts. The owner must approve the reserve and maintenance
obligation before a one-time sale is represented as covering that service term.
A perpetual hosted promise has no finite M and is not supported by this model.
Options are renewable hosted service after the funded term, a finite complete
support/service term, or an independently accepted local transport; the latter
cannot be advertised merely because MCP has local transports in principle.

The coordinator's rights audit flags Minecraft EULA mod monetization as an
unresolved classification/permission issue. Selling the harness while making
the mod free does not establish clearance. Commercial packaging/pilot work
depending on that classification stays pending the rights reviewer; this
specification is not legal approval and does not supersede their source audit.

## Proposed delivery migration and recovery

Recommended candidate: a public binary-only release repository, with private
source development and software activation controlling paid capabilities.
Benefits: customer downloads need no GitHub token and fit current updater shape.
Costs: installer binaries remain publicly downloadable and repository/allowlist
references must be migrated deliberately. Alternative: a hosted HTTPS feed with
anonymous signed downloads or short-lived customer grants. Authenticated feeds
add renewal, redirect, caching and updater credential support to test; never ship
a privileged GitHub token in the installer or feed.

Migration sequence proposal:

1. Rights reviewer approves exact binaries, SBOM, bundled notices and any source
   offers. Preserve existing third-party license terms and prior grants.
2. Build immutable signed release plus manifest, hashes, publisher evidence,
   allowed artifact names and applicable Casimir release evidence.
3. Implement new feed/download origin with explicit allowlists and redirect
   policy in builder, site metadata, shared release validation, server projection,
   updater configuration and tests. Version any changed manifest contract.
4. Produce a forward-version bridge release through the old public channel;
   prove installed old version -> bridge -> new feed -> newer signed release.
   Keep old signed metadata/binaries accessible for the documented migration
   window. Only then may the owner consider source visibility change.
5. Preserve publisher/signature/checksum verification, explicit installation,
   and no-downgrade. Publish a repair as a higher version with corrected behavior
   and compatible data migration, never overwrite assets under an existing tag.
6. If the app cannot launch, provide the same-or-newer signed repair installer
   through the verified download page. Preserve protected profile data and
   offer a sanitized support/export path; test same-version repair support
   rather than assume NSIS provides the needed result. Never delete user state
   to conceal migration failures. Unsupported backward data migration is not a
   rollback plan.

Expired customers should retain access to the emergency/security repair channel
and eligible installed-version repairs; new paid feature entitlement remains
separate. For version licenses, define how eligible versions are selected without
downgrading or losing access to compatible safety fixes. This is an owner
proposal requiring cost and product review, not existing updater behavior.

## Frozen-test candidates for CFP-3 and CFP-4

Each test records source/runtime/client identity, exact grant revision, clocks,
capability IDs, expected/actual admission and observed effects. Fresh signed
acceptance is separate from deterministic tests. Replace proposal parameters
with owner-selected values before execution.

| ID | Arrange/action | Required observation |
| --- | --- | --- |
| ENT-01 | Public user buys verified software without provider credits/key | Account stays user; exact selected capabilities admitted only after separate consent; developer supersets remain. |
| ENT-02 | UI bypass, direct API/MCP/service with absent, forged, wrong-owner, wrong-device grant | Typed rejection before effects; no payment or receipt becomes authority. |
| ENT-03 | Schedule cancellation then cross paid end using controlled clocks | Access before end; no new admission after end; controls released within frozen bound; history/account/safety retained. |
| ENT-04 | Duplicate, reordered, equal-time disputed webhook; partial credit refund vs software refund | One authoritative state and one ledger effect; no resurrection; line items remain separate. |
| ENT-05 | Disable validation network; restart; roll clock backward; replay old lease | Frozen cache limit enforced, term not extended, known revocation retained; actionable recovery and no secret output. |
| ENT-06 | Register replacement/lost device and race concurrent sessions | Atomic device/session limits; no copied grants, no stale authority replay, truthful offline revocation limit. |
| ENT-07 | Model limit/expired provider credits during licensed software session | No Casimir-funded call or provider switch; safe declared outcome, independent software status. |
| ENT-08 | Entitlement expires during admitted bounded action, then renew | Measured bounded release/no duplicate effect; new explicit admission needed after renewal. |
| DIST-01 | Fresh nondeveloper Windows user downloads with no repository membership | Exact signed artifact obtained and installed; useful accepted task possible without developer credential. |
| DIST-02 | Installed old channel -> bridge -> new channel | Both forward updates validate publisher/hashes and preserve identity/data; private source permission irrelevant. |
| DIST-03 | Tamper payload, publisher, checksum, origin/redirect; offer lower version | Fail closed; installed version remains usable under its entitlement; no downgrade or privileged token disclosure. |
| DIST-04 | Interrupt download/install and force app startup failure | Supported higher-version or tested same-version repair succeeds with protected state preserved; no duplicate resumed effect. |
| DIST-05 | Expired/version-license customer requests feature vs safety update | Frozen eligibility rule enforced; safety/account/export path remains; no downgrade or accidental paid capability grant. |

## Bounded implementation packets to prepare

- CFP-3.LICENSE: shared software grant schema, trusted verifier/cache, device and
  concurrent grant store, admission integration and ENT-01/02/03/05/06/07/08.
  Read account/MCP/adapter contracts; keep runtime sampling and completion in
  Codex. Actual handler changes need applicable Helix tests and gates.
- CFP-3.COMMERCE: selected software SKU adapter, authoritative webhook state,
  public-owner step-up/purchase/portal path and ENT-04. Reuse the SPB ledger
  only at its existing scope. First prove deterministic and owner-attended
  deployed sandbox; production transactions belong to explicitly authorized
  CFP-5, not this draft.
- CFP-3.DISTRIBUTION: reviewed target feed, bridge migration, source-independent
  download, notices, updater compatibility and DIST-01/02/03/05. No visibility
  switch or publication without the actual owner-selected migration action.
- CFP-3.SIGNING and CFP-4.RECOVERY: same immutable signed artifact identity,
  applicable Casimir PASS/certificate integrity, clean machine installation and
  DIST-04 plus all entitlement/effect interruption cases. Do not substitute an
  unpacked build, existing certificate or source unit test for installed proof.

Unknowns remain explicitly owned: owner chooses term/trial/device/offline and
service terms; rights reviewer clears shipped components and prior grants;
release owner establishes feed/signing provisioning; implementation owners
freeze and execute schemas/tests. No dependent stage is accepted by this draft.
