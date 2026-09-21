Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.POLICY public account and installed-node decision
Capability or component: Verified account, device allowance, replacement, concurrent personal use and offline behavior
Lifecycle stage: admission and recovery specification
Reaction timescale: sign-in, enrollment, each personal/hosted request and device loss
Authority owner: Product owner selects customer device and offline terms; account/security owners freeze session and revocation bounds; CFP-2/3 owners implement and prove them
Current maturity: specified
Target maturity: specified with selected terms and executable positive/negative acceptance
Required evidence: current account, installed-device and native route inspection; owner selections; account/security review; installed cross-device and outage traces in CFP-2/3
Explicit non-goals: no runtime, database, account, Stripe or release change; no present public account/device support claim, offline guarantee, model-account sharing or G8 promotion
Downstream gate unlocked: CFP-2.PUBLIC/ONBOARD and CFP-3.LICENSE receive frozen inputs only after CFP-1 closure

# CFP-1 public account, device and offline policy decision v1

The owner selected the recommended **multiple separately enrolled Windows devices, no paid personal-device cap, online verified enrollment and no general offline-effect promise** as the provisional first-customer direction in [selection 106](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-recommended-direction-owner-selection-106.md). Hosted limits remain per verified sponsoring account. The [P1 stdio/IPC contract](eh-g8-cfp1-p1-stdio-local-bridge-qualification-v1.md) is the first Codex qualification route with a separate per-installation grant; its [finite session/grant proposal](eh-g8-cfp1-public-session-and-client-grant-lifecycle-decision-v1.md) supplies account/security review values and exact denial cases. The [HTTP helper candidate](eh-g8-cfp1-p1-local-mcp-credential-and-recovery-contract-v1.md) is held pending wrong-listener proof. Account/security review and CFP-2 installed acceptance must still freeze and prove identity, custody, grant lifetime, device, expiry and revocation before this becomes a support claim.

The [CFP-1 offer](eh-g8-cfp1-product-rights-and-offer-contract-v1.md)
provides the complete **supported** personal MCP experience free and charges
only for eligible hosted collaboration. The [P1 profile](eh-g8-cfp1-free-personal-codex-connection-profile-v1.md)
qualifies Codex desktop and the installed harness on the same computer first.
This packet gathers the remaining public account/device decisions for that
profile and hosted sponsorship. It is a decision brief, not an implemented
public allowance or an offline promise.

## Current source and already selected boundaries

| Boundary | Inspected source or existing selection | Implication |
| --- | --- | --- |
| Account identity | [Domain account plan](../architecture/casimirbot-domain-accounts-and-delivery-plan-v1.md) maps Google/Auth0 sign-in and native linking. `server/routes/account-session.ts` still exposes a local profile-selection route without verified external ownership; Google/web sessions can have null server-side `expires_at`. | Public hosted and device enrollment must resolve a verified internal account. A local profile name, email match, browser cookie lifetime or Codex login cannot establish CasimirBot ownership. Account/security owners freeze server-side session expiry and tested identity modes. |
| Device record | `server/db/migrations/070_installed_security_devices.ts` keys devices by `(profile_id, device_id)` and has active/revoked/recovery statuses without a count constraint. `server/services/helix-account/installed-security-store.ts` registers, revokes and recovers a device. `recoverDevice` advances a generation and clears full-harness trust, but `registerDevice` currently reactivates a revoked same-ID row without incrementing `recovery_generation`. | Current persistence can represent multiple devices but neither enforces nor selects a public allowance. CFP-2 must close the same-ID re-registration bypass so no reactivated device can restore an old client or program grant. |
| Current management route | `server/routes/desktop-auth0-step-up.ts` binds device operations to a native step-up receipt; its status path requires a developer session. The [domain plan](../architecture/casimirbot-domain-accounts-and-delivery-plan-v1.md) identifies developer-only public trust/management paths. | CFP-2.PUBLIC must introduce narrowly scoped ordinary-user enrollment, inspection and revoke/recovery admission; a payment or broad developer role cannot be the repair. |
| Hosted quantity | The owner selected one host sponsoring guests and [provisional seven-day trial limits](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-provisional-hosted-trial-limits-owner-selection-48.md) of one room, one invited guest, one connected program and ten verified effects per sponsor. | Count trial use across the verified sponsor identity and all its installations. Device count is a separate customer term and cannot multiply room/program/effect allowance. |

## Owner choice: free personal device allowance

The recommended first-customer policy is **multiple separately enrolled
Windows computers for one verified account**, without a purchase-based device
cap. Each installation has its own node identity, local MCP client credential,
source/subject binding, consent and revocable program grants. The account may
inspect and revoke each enrolled installation. Two installations do not share
an action lease, native secret, personal context or program authority. This
fits the personal offer's account-based free entitlement and the current
profile/device schema without inventing a subscription device SKU. This
direction is provisionally owner-selected in selection 106.

Alternatives are one or two active installations per account. Either requires
an atomic cross-node admission count, a customer-visible replacement path,
concurrent enrollment/race handling and a clear rule for inactive/offline rows.
It must never be implemented as an invisible deny after a user reinstalls.
Regardless of allowance, hosted sponsorship and trial quotas are checked
server-side per verified sponsor, not multiplied by device or browser session.
Concurrent use of two owned personal programs is separate from connecting
multiple programs to a trial room; the latter remains under the selected
one-program provisional trial ceiling.

## Proposed recovery and outage contract for review

1. First enrollment requires verified CasimirBot ownership, explicit native
   enrollment and a fresh client authorization for the chosen installation.
   A clean browser or Codex login does not enroll a device or grant effects.
2. On lost-device report, the account revokes that exact device and its MCP
   authorization, local connector references and derived hosted-room binding.
   Report local stop as verified or uncertain from actual connector evidence;
   do not promise remote control of an unreachable machine. Other devices and
   independent personal grants remain intact.
3. Replacement or same-ID recovery creates a new trust generation through
   **every** reactivation route, including device registration after revoke or
   `recovery_required`. CFP-2 must either reject that registration path and
   require explicit recovery, or atomically advance the generation and fence
   prior credentials/grants during registration. Require fresh user approval
   for personal program/effect grants and separately reauthorize hosted
   attachment. Never resurrect a stale token, room grant or in-flight effect
   through recovery or account reactivation.
4. Account switch on a shared Windows machine clears the previous profile's
   client/connection projection before showing the new profile's tools. No
   provider login, matching email or local profile selector transfers a node.
5. **Proposed customer wording:** online verified sign-in and enrollment are
   required; no general offline-use promise at launch. During a domain or
   identity outage, new account enrollment, hosted entitlement and any effect
   lacking independently valid local authority fail closed. Locally available
   stop/revoke and outcome inspection remain accessible to the extent the
   installed node can enforce them. Any further offline personal reads/actions
   need a separately bounded, revocable local lease and signed-install outage
   evidence before they are advertised. The no-general-offline-effect direction
   is owner-selected; exact wording and revocation latency still need
   account/security review and installed testing.

## Acceptance and freeze handoff

CFP-1 has recorded the provisional device allowance and offline direction. Account/security owners must freeze final customer wording, server-enforced web/native session expiry,
step-up requirement, device identity/replacement and revocation bounds. Test
an ordinary `user` through Google/approved alternate sign-in, P1 setup,
second-device enrollment according to the selected allowance, account switch,
loss/recovery, simultaneous enrollment, never-subscribed personal use and
expired-hosted personal use. Test a hosted sponsor on two devices against one
shared trial counter, and a guest's distinct account and program grant. Repeat
online and with identity, database, tunnel and local service failures separated.
Wrong profile, stale generation, revoked token, old room reference and
unverified local profile selection must fail at API, MCP, service enqueue and
immediate connector effect boundaries. Exercise both `recoverDevice` and a
revoked same-ID `registerDevice` attempt; neither may restore the former
generation's MCP token, personal source, hosted reference or effect lease.
Record exact signed build, Codex client,
device identities, current grant revisions, expected/actual admission and
stop/effect evidence. CFP-2.PUBLIC/ONBOARD own personal installed proofs;
CFP-3.LICENSE owns hosted-device and quota proofs; G8 integrated release
acceptance remains separate.
