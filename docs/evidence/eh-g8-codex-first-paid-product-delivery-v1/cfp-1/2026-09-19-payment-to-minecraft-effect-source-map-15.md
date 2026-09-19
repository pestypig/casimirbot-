# CFP-1 payment-to-Minecraft-effect source map — 2026-09-19

Status: read-only current-source trace for the R-MC-01 rights reviewer and the
free-personal/paid-hosted implementation handoff. This is not a live acceptance
result, commercial classification, complete call graph, permission to monetize,
or a new stage decision. The [CFP-1 contract](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md)
and [G8 work program](../../../helix-environment-harness-work-program-v1.md)
retain authority. Inspected Desktop HEAD:
`256554ca2637b2978a83616d9f9670069fdfd8c4`, with unrelated and CFP
documentation changes in the shared worktree.

## Inspected current path

| Step | Source observation | What it establishes |
| --- | --- | --- |
| Billing state | `server/routes/stripe-sandbox-webhook.ts` parses Stripe subscription events into `server/services/helix-account/billing-entitlement-store.ts`; its normalizer ignores live-mode events. The store records sandbox plan state and historical prepaid-credit behavior. | A sandbox billing ledger exists, but it does not implement the selected hosted-collaboration entitlement. Its credit functions are outside the selected initial offer. |
| Account/room admission | `shared/helix-account-session.ts` puts `shared_realtime_rooms` in the developer policy and locks it in the ordinary user policy. `server/services/helix-account/account-session-store.ts` derives an effective policy from account type; the public-room exception requires both the enabled experiment and a stored policy already enrolled with unlocked rooms. Nondeveloper source ingress and workstation capability reachability have additional experiment/production settings. None of these checks reads a billing record. | The present default public-user room path is policy-locked. The conditional experiment is not a paid subscription grant or proof of free personal action reachability. |
| MCP action entry | `server/mcp/helix-mcp-server.ts` registers `helix_minecraft_player_action` with room-read and environment-action-write OAuth scopes. Its handler checks those scopes and the active room feature, resolves a capability and invokes `executeEnvironmentActionGatewayCapability` with account context and an exact room thread. | Current MCP action is room-shaped and needs identity/scope/policy admission. Registration alone does not mean an ordinary user can execute it. |
| Gateway context | `server/services/helix-ask/workstation-tool-gateway/environment-action.ts` requires a trusted active account session, exact room/turn/tool-call identity, a current room participant, one matching active Minecraft environment (an exact label can disambiguate multiple active sources), and a resolved action context. `server/services/environment-connectors/actions/action-broker.ts` resolves that context through room membership, active player authority, fresh connector manifest and catalog capability. | The examined effect path is bounded by participant, target, authority, connector and capability checks. It is not a purchase check. |
| Native companion | The targeted `minecraft/` and `connectors/environment/` source search found no `subscription`, `entitlement`, `billing`, `stripe` or `payment` match. | No direct payment predicate was found in this inspected source scope. This negative search does not prove every installed profile, dynamic dependency, shipped JAR or future release behavior. |

The targeted search also found no payment/subscription check in the MCP
registration/handler, gateway, action broker or account-policy resolver named
above. It did find a descriptive “arm billing” prohibition on an unrelated
capture tool. These observations do **not** establish that a never-subscriber
can use Minecraft personally today: the current room requirement and default
user policy contradict that release claim. They also do not establish that a
future paid room layer cannot indirectly change access to game actions.

## R-MC-01 and implementation consequence

The selected future policy is free supported personal MCP tools and paid
maintained collaboration, with no funded inference at initial launch. A
commercial reviewer must examine the **future** implementation and offer, not
simply the absence of a billing call in the present action function. In
particular, the reviewer needs the exact hosted subscription predicate for
create/join/retain-room operations, the independent personal route and its
actual transport costs, the owner grant required for shared-player effects,
and the behavior of both routes after expiry, refund or hosted outage. The
[current rights delta](2026-09-19-rights-distribution-delta-09.md) provides the
customer-state table; the [hosted lifecycle packet](../../../work-packets/eh-g8-cfp1-hosted-participant-entitlement-lifecycle-v1.md)
assigns the later service checks. The official [Minecraft EULA](https://www.minecraft.net/en-us/eula)
and [Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines)
remain inputs for a qualified review of that exact relationship.

For CFP-2.PUBLIC/ONBOARD, prove a never-subscribed ordinary account can reach
the selected supported personal action through a compatible signed-in client,
with normal target/effect permission, even when hosted collaboration is
ineligible. For CFP-3.LICENSE/COMMERCE, check subscription state at selected
hosted-service admission without treating payment as a player grant. Retest
both paths with subscription active, canceled/refunded, hosted unavailable and
owner access revoked. Freeze the exact capability IDs, account/guest policy,
package/profile cohort and customer claims before claiming the resulting
rights boundary or release readiness. No runtime path was changed by this
source map.
