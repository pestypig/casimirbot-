Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.ENTITLEMENTS / CFP-1.POLICY host-continuity specification
Capability or component: Explicit eligible-host sponsorship handoff for an existing hosted room
Lifecycle stage: admission, execution, recovery and presentation specification
Reaction timescale: durable account/room transition with bounded local effect release
Authority owner: Product owner selected explicit handoff; CFP-1 coordinator specifies its contract; room/account/commerce owners review and implement their authority; each program owner retains their grants
Current maturity: specified
Target maturity: specified with reviewed transition protocol and executable ENT/COLLAB/DOM cases
Required evidence: owner selection; room schema and owner/source/runtime checks; verified hosted eligibility; separate member and program grants; positive, negative, race and recovery fixtures
Explicit non-goals: no runtime, schema, payment, account-policy, production, release or rights change; no automatic trial-time, source-credential, program-grant or model-account transfer; no claim of current handoff support
Downstream gate unlocked: none automatically; CFP-1 closure and canonical G8 admission remain required

# CFP-1 explicit host handoff protocol v1

The owner selected [one host sponsoring invited guests](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-host-sponsorship-owner-selection-21.md) and [explicit handoff to another eligible host](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-host-handoff-owner-selection-22.md). This is a source-backed implementation proposal under [CFP-1](eh-g8-cfp1-product-rights-and-offer-contract-v1.md), not a shipped behavior. The [environment work program](../helix-environment-harness-work-program-v1.md) retains stage authority. Lost-host recovery authorization and the transfer window remain owner choices.

## Current source seam

At inspected HEAD `256554ca2637b2978a83616d9f9670069fdfd8c4`, the room model conflates room owner, first member and some source/transport authority:

| Source | Observed constraint | Handoff implication |
| --- | --- | --- |
| `server/db/migrations/030_shared_realtime_rooms.ts` and `server/services/helix-account/account-session-store.ts` | The room stores `owner_profile_id` with a hard-delete `ON DELETE CASCADE`; member slot 1 must be `owner`, slot 2 `participant`; capacity is two. The current account-delete service instead soft-deletes `helix_accounts.deleted_at` and signs out sessions. | Merely changing billing account or member role cannot promote the guest. Soft-delete recovery and any later hard-delete cascade need separate tests and a reviewed retention/migration policy; the current service does not prove room continuity or immediate room removal. |
| `server/services/helix-ask/realtime-room/room-store/rooms.ts` and `invites.ts` | Creation fills slot 1; invitation fills slot 2 with a new participant ID and consent. | Candidate needs their own verified account, membership, consent and eligible term. An invitation is not sponsor acceptance; do not relabel the former host's participant ID. |
| `room-store/participants.ts` | Owner leave closes the room and revokes invitations, source bindings/credentials, adapter admissions and subject bindings. | Current leave is not continuity. Handoff must commit before departure, or a separately authorized suspended/recovery state must replace closure. |
| `server/services/helix-ask/realtime-room/source-link-store.ts` and `server/services/shared-live-room-control/binding-store.ts` | Source management checks room owner; credential-delivery claim checks binding owner and room owner. | A new sponsor does not inherit old source credentials. Source owners must reissue only independently authorized bindings and deliveries. |
| `server/routes/agi.realtime-room/http-context.ts`, `media-signal-routes.ts` and `server/services/shared-live-room-control/service.ts` | Owner-gated room/media operations and host-browser transport use current membership role. | Every such route needs the revised room-control identity and epoch. Paid sponsor, media host, mission lead and program owner are separate roles unless explicitly assigned. |

This is targeted source inspection, not an exhaustive installed result. Room, source, connector, billing and client owners must enumerate all owner-derived checks before implementation; a database-only owner update is insufficient.

## Proposed transition to freeze

1. **Represent separate authority.** Keep historical creator, current hosted sponsor and term revision, current room-control member, each connection/program owner, and a monotonic governance revision. A successful handoff of the existing room retains its room ID and only the history each continuing member may already access; it never changes participant IDs, past attribution or program ownership by implication.
2. **Request and accept.** Normal transfer is requested by the authenticated current sponsor for one exact joined candidate and expected governance revision; the candidate accepts through their own authenticated account and currently eligible trial or paid term. Validate both identities, membership, capacity, term and revision; bind an idempotency key and finite offer expiry. A checkout redirect, invitation or request receipt is not acceptance.
3. **Quiesce effects.** Fence new sponsor-derived work before commit; stop or bound in-flight effects through their native arbiters and record completed, stopped and uncertain results separately. Direct owner stop/revoke remains available. The maximum release deadline comes from each capability's frozen lease, not from subscription time.
4. **Commit once.** Serialize the room transition; recheck eligibility and revisions, select one successor, increment governance revision and audit request, acceptance and commit. Duplicate retries return the committed result or typed stale conflict. Competing successors cannot both commit or replay effects. A database transaction cannot itself transfer external credentials or prove physical control release.
5. **Re-admit independently.** Invalidate predecessor-derived hosted/source/transport admission and pending secret deliveries. Reconnect the successor's client under their own authority. Re-evaluate each participant's processing consent and each program owner's grant, source, subject, lease and exact reasoning-task binding. No trial days, paid period, model account or private credential move with sponsorship. New shared-program effects wait for fresh applicable authority and observation.
6. **Present actual state.** Show `pending`, `suspended`, `accepted` or `closed` from authoritative state. Filter permitted history by each member's own rights and the still-open O-07 retention rule. An acceptance receipt cannot be presented as successful effect continuation.

An alternative implementation may satisfy the same invariants if independently reviewed through UI, direct API, MCP, service and connector paths. Exact benefit, eligibility, room limits, clocks and retention are O-02–07 inputs, not defaults invented by the room handler.

### Loss before acceptance: owner choice still open

If the sponsor leaves or loses verified trial/paid eligibility before commit, the **target** behavior suspends new hosted work and releases affected effects under their native bound. Independently authorized personal tools and the remaining owners' authenticated stop/revoke remain available. **No member is silently promoted.** Current owner leave instead closes the room. Current account deletion soft-deletes the profile and signs out sessions; it does not hard-delete the room, but existing owner checks and recovery after this state are unqualified. A same-room recovery promise after either event requires a reviewed schema, deletion/retention policy and acceptance evidence. Choose one explicit recovery authorization before dispatch:

| Candidate policy | Required acts and boundary |
| --- | --- |
| Preapproved successor only | While eligible, sponsor names a member who may later accept under their own eligible term within the frozen window. Preapproval does not confer any program grant. If absent, expired or declined, the handoff fails and any close/recreate path is a separately labeled degraded recovery. |
| Remaining-member request | An already joined, eligible member requests continuation of the existing room after verified sponsor loss and obtains the separately frozen room/participant approvals. Do not expose the former host's private data or credentials. If authorized same-room continuity cannot be proven, the handoff fails; a new room with explicit invitations and new program grants is degraded recovery, not fulfillment of the selected handoff. |

The owner's answer concerned continuation of an **existing room**. Successful handoff therefore retains that room ID; a close-and-recreate path is a failure/recovery outcome, never evidence that handoff succeeded. Neither lost-host authorization variant is selected here. The room/privacy owners must prove that the chosen variant can preserve the existing room and each member's permitted history without inheriting private history or grants. If they cannot, the selected promise needs an explicit owner revision before customer copy or dispatch.
Account deletion must separately test soft-delete loss, any later hard-delete cascade, the selected treatment of other members' permitted data/history, billing cancellation and source/connector revocation. No usable retained room or recovery window may be assumed from the current service; O-07 must define what survives deletion before implementation.

## Acceptance handoff

Use existing ENT-02/03/08, COLLAB-04/05, DOM-03/05 and the [room federation contract](eh-g8-shared-room-multi-host-capability-federation-v1.md). Freeze exact clocks and limits before dependent dispatch. One selected artifact and service must prove:

- Active trial and paid hosts transfer to separately eligible successors without transferring trial days or paid period; former host departure after commit preserves only authorized continuity.
- Trial expiry and paid-period end deny new hosted admission; scheduled cancellation retains otherwise valid eligibility only until its authoritative paid-period end under the current ENT-03 proposal. Immediate cancellation, refund, dispute and renewal failure follow their separately frozen O-06 effective boundaries. Wrong account/room, nonmember candidate, expired offer and stale governance revision fail closed with attributable reasons.
- Concurrent candidates, duplicate accept, uncertain response retry, restart and stale webhook/outage reconciliation yield at most one successor and cannot revive predecessor grants.
- UI, direct API, MCP, service and connector admission agree on sponsor revision, member identity, separate program-owner grant and effect lease. Old source deliveries, transport sessions and exact-task bindings cannot be adopted.
- In-flight action, stop/revoke, reconnect and regrant outcomes are measured separately; authorized history is member-filtered; host loss follows the selected recovery policy without silent promotion.
- Owner-account soft deletion and any later hard deletion prove the selected retained-history or close/recreate policy; no other member's private data or program grant is silently reassigned.
- Never-subscribed and expired-hosted users retain separately accepted free personal operations. Focused rights review classifies trial/paid/handoff-to-Minecraft-effect before commercial claims.

This proposal does not admit CFP-2/3/4 or amend the current leave handler. Final independent CFP-1 review must verify the selected recovery policy, operation set, rights disposition and exact fixtures together.
