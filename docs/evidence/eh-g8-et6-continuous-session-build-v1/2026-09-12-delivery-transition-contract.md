# Invitation delivery transition contract

Scope: O3/O5 under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: evidence normalization; internal delivery policy only.

Added `pairing-delivery-contract.ts` with separate delivery revision and stable
pairing/destination-derived identity. Pending moves to unknown before dispatch;
unknown requires provider reconciliation and cannot re-enter fresh dispatch.
Confirmation records a provider message identity, replays the same receipt without
changing time/revision, and rejects conflicting receipts. Current pending grant
scope and clock are checked before dispatch and confirmation. Delivery never
sets pairing acceptance or includes an invitation secret.

Six focused Vitest cases pass: stable identity/unknown outcome/replayed receipt,
revocation, exact expiry, prior acceptance, foreign destination, and invalid or
regressed clock/receipt-before-send. Grant acceptance/revision remain unchanged.
Serialization in this test is not durable storage or process recovery proof.

This is the first implementation step from the
[feasibility specification](2026-09-12-automatic-delivery-feasibility.md).
There is no repository, migration, provider adapter, HTTP integration or worker
yet. Production callers do not import the contract. The planned real-handler
lost-reply/restart fixture remains unexecuted. Next work must persist delivery
state with CAS and prevent an issuance-to-outbox crash gap before any dispatch
is enabled. The actual supported host remains unproved; O3/O5 and all full
CS1–CS4 exits remain incomplete. No ET6 or NAV qualification is claimed.
