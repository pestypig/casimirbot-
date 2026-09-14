# Durable delivery consent discovery

O2/O3/O5 prerequisite under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: source admission and durable evidence recovery.

Added optional `invitationDelivery: automatic` to the internal approval and
invitation request contracts. Absence retains copy-only behavior. The trusted
human authorizer must return the same delivery mode as the reviewed request;
a caller-supplied automatic flag alone fails scope validation. The delivery
service now requires this explicit committed approval before connecting a provider.
No legacy grant is upgraded or assigned new consent by recovery.

The encrypted pairing row itself retains the delivery intent in the same issuance
commit as consent. Added owner-scoped, bounded, cursor-based ledger discovery of
pending automatic grants. The cursor follows scanned rows, including filtered
copy-only rows. Authenticated service discovery confirms durability first and
returns IDs only; it does not connect or send. The normal delivery operation
revalidates the selected pairing before creating/recovering its separate outbox.
This allows recovery after issuance but before outbox insertion without relying
on a volatile post-issue callback.

57 focused tests pass across ledger, delivery contract and delivery repository/
service suites. New cases reconstruct repositories/services over retained
encrypted database state with no outbox row, discover the committed automatic
approval, filter it at exact expiry, exclude/reject copy-only grants, and reject
an automatic request whose human authorizer returned copy-only consent.

These are service/database fixtures, not native crash proof. Multi-page scanning,
concurrent scan transitions, public handler/UI delivery-mode review, actual host
adapter and automatic scheduling remain unverified or unimplemented. Current
client request schema has no automatic-delivery field, and no production route
or factory enables the new delivery service. No runtime restart or consent action
occurred. Full O1–O6, CS1–CS4, CS5 and original ET6 remain open.
