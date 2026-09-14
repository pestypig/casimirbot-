# O3 actual-host delivery feasibility checkpoint

Evidence class: current source inspection, supported read-only Codex task
listing and official API documentation review. No delivery or acceptance test.
Supplement to the [CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md)
and [onboarding packet](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

## Observed boundaries

The production `server/index.ts` mounts `createAgentConnectionsRouter` with
coordination, reasoning binding and preparation binding stores only. It does
not install `pairingDeliveryService`. `reasoning-destinations` reports automatic
delivery availability from that dependency, and the rendered pairing component
shows the Copy invitation fallback when it is absent. Current service source
explicitly states that no production adapter enables `PairingDeliveryService`.
The [running package](2026-09-13-profile-settlement-package.md) matches the
inspected service build. Rebuilding or reconnecting alone cannot supply this
missing integration.

The supported Codex app `list_threads` tool succeeded with `limit: 1` and
returned this task exactly: `01a081e3-1973-76a3-b35b-0bd6d541933d`, host `local`,
status `active`, title `Complete continuous session build`, canonical Desktop
cwd. No unrelated returned titles or summaries are retained in this artifact.
This establishes that the development agent can list the exact task through
its app tool; it does not grant that API to the CasimirBot service or authenticate
a CasimirBot profile-to-provider destination mapping.

The available `send_message_to_thread` tool takes an exact task ID, prompt and
optional host/model settings. Its exposed contract has no delivery-id argument,
message lookup by client delivery ID, or documented concurrent/lost-response
idempotency guarantee. No send was attempted: there is no current consented
invitation, and sending a generic test message would not prove this contract.
No replacement task was created and no private provider state was accessed.

The [official Codex App Server documentation](https://learn.chatgpt.com/docs/app-server)
was searched and opened on 2026-09-13. It documents stdio/WebSocket/socket
transports, initialization, thread listing/reading/resumption and turn
start/steering. Those APIs describe app-server integrations; they do not by
themselves establish a supported connection from this EXE to this already-running
Desktop task. The inspected page did not establish delivery-key idempotency or
lookup for this invitation use case. This is a missing documented guarantee,
not proof that every provider deployment lacks such a capability.

## Exact missing integration required before enabling automatic delivery

1. A supported, user-consented host endpoint accessible to the installed
   CasimirBot service, tied to this already-running task's owning host rather
   than a new provider process or replacement task.
2. Authenticated mapping of issuer/profile/device/client/exact task identity
   across that endpoint. Task titles and local list visibility are insufficient.
3. A bounded send operation with stable delivery ID and a lookup result that
   distinguishes delivered, absent and unknown after a lost reply. Concurrent
   sends must linearize to one provider message, or a supported equivalent must
   be demonstrated before adapting the outbox contract.
4. Exact authenticated invitation acceptance through the current MCP session,
   separate from delivery and without treating a message receipt as pickup,
   acceptance, gameplay permission or an assistant answer.

`PairingDeliveryService` requires the first three through its injected
authenticated target and `lookup`/`sendOnce` ports. Existing tests prove these
ports only with an isolated provider fixture. They cannot supply the missing
actual host authority or semantics. The latest
[MCP revalidation](2026-09-13-pairing-default-browser-isolation.md) additionally
returned `Session terminated`; its cause remains unproved and its resolution
would not automatically establish the host delivery adapter.

O3 actual-host automatic delivery and O6 remain incomplete. The Copy invitation
path remains an explicit fallback, not closure of the automatic path. The next
live step is still genuine account/connection recovery and exact registration,
followed by the appropriate finite human consent. No credentials may be reused
across audiences, no human-only consent may be automated, and no private
sampling or execution runtime may be introduced to bridge this gap.

This checkpoint preserves every CS1–CS4/O1–O6 requirement. ET6 remains unpassed
and NAV1 is not qualified. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole dependency/status authority.
