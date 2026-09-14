# Automatic invitation delivery: implementation boundary

Read-only feasibility evidence for O3/O5 of the
[onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
No implementation, supported-host integration or maturity promotion is claimed.

## Inspected local boundary

`pairing-invitation-service.ts` authorizes exact human-reviewed scope and commits
an encrypted pairing row before returning the invitation. Request replay reconciles
the same row. `pairing-ledger-contract.ts` records approval, deadlines, acceptance,
revocation and supersession, but no delivery state or provider delivery receipt.
`pairing-destination-registration.ts` explicitly reports authenticated client
declaration; it does not attest host task ownership. Scoped searches of desktop
host and local-supervisor TypeScript found no `thread/list`, `turn/start`,
`app-server` or `send_message_to_thread` adapter. This is a scoped search, not a
claim about every repository file.

The assistant catalog has Codex task listing and send tools. Their exposure to
the assistant is not an authenticated API endpoint available to the EXE. No send
was attempted and no invitation was created. The three durable pairing tools
remain unavailable in this task, independently of host automatic delivery.

## Official interface evidence

[Codex App Server documentation](https://learn.chatgpt.com/docs/app-server),
retrieved September 12, describes `thread/list`, `turn/start`, stdio, Unix control
sockets and experimental TCP WebSocket transport. It describes initializing a
client against a server and version-specific schema generation. These documented
primitives do not themselves prove that the installed Windows Desktop instance
offers CasimirBot authorized access to this already-running task. A separately
launched server is not proof of attachment to its live owner. No listener was
started, credentials read, host UI automated or private transport probed.

## Frozen adapter requirements before automatic delivery is enabled

1. A supported host connection must establish issuer, installation and client
   identity and authorize exact existing-task enumeration. Stable IDs select;
   titles only distinguish visible choices. Prove access to the actual host,
   rather than infer it from readable historical logs.
2. Human issuance commits the existing exact approval and a durable delivery
   intent atomically, or uses a reconciler that demonstrably cannot lose an
   approved intent between commits. Keep the acceptance secret inside the
   existing encrypted boundary; an outbox references its pairing, not plaintext.
3. Persist one delivery identity per pairing and exact destination. Before
   sending, revalidate current pending state, finite deadline and approved host
   identity. Unavailable providers leave an explicit unavailable/pending state;
   they cannot silently choose a different task.
4. Require provider idempotency or a supported delivery-status reconciliation
   operation. A lost response is unknown delivery, not permission to send a
   second visible invitation. Without either capability, surface the unknown
   outcome and honest fallback; do not claim exactly-once delivery.
5. Delivery receipts identify the destination and message, but never accept the
   pairing. Acceptance continues through the authenticated exact-destination
   transition service. Revoke/expiry before or during dispatch prevents later
   acceptance even if the provider already displayed the invitation.
6. Restart preserves delivery identity and unknown/confirmed state without
   renewing consent. Retry conflicts, reordered replies and concurrent workers
   must not overwrite newer revocation, expiry or delivery evidence.

The first isolated fixture should issue through the real human route, commit
the intent, simulate provider delivery with a lost reply, replace the service
object, reconcile that same delivery, and prove one provider message and one
pairing. Repeat with revoke during delivery and prove no accepted grant. Then
cover wrong host/task, same-title tasks, unavailable provider and restart before
dispatch. This is a frozen next test specification, not an executed test.

Actual-host connection/identity, delivery idempotency/reconciliation and current
task acceptance remain unproved. No automatic bridge is enabled on this evidence.
The outbox and its real-handler fixture remain implementation work; the fallback
does not satisfy O3. All original CS exits and ET6 acceptance remain intact.
