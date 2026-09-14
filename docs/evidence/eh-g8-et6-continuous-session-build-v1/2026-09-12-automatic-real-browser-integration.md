# Automatic delivery through rendered UI and real handlers

O3/O4/O5 fixture evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Extended the existing isolated Chromium fixture with migration 091, the real
delivery repository/service and an authenticated fixture provider. Added pointer
and keyboard cases for normal automatic delivery and provider-committed delivery
with a lost reply. The UI selects automatic mode and exercises the fixture human
approval. Actual invitation and delivery HTTP handlers perform validation and
encrypted writes. The provider receives the invitation directly; no user relay
or clipboard extraction supplies its acceptance input.

For a lost provider reply, the test reconstructs the runtime/router, reloads the
renderer and activates Reconcile delivery. Both normal replay and recovery show
one provider send, one message, one pairing and one delivery row. Delivery leaves
acceptance null. The real transition service rejects a wrong provider, accepts
the exact fixture provider idempotently, and the rendered status updates. UI
revocation then prevents further acceptance. Browser storage excludes the secret.

All 12 browser cases pass (22.3 seconds), including the eight prior copy/identity
switch cases. Initial automatic testing timed out on exact label lookup for the
select; using the exposed combobox accessible name corrected the fixture. The
first failed run was stopped before completing; it is not counted as a pass.
The existing import.meta/IIFE fixture warning remains.

This is real-handler browser composition with fixture identity, provider and
ephemeral encrypted database. It is not actual Codex host attestation, native
production consent, operating-system restart, automatic background scheduling,
or game-effect acceptance. Automatic tests exercise delivery/accept/revoke; they
do not repeat the full prompt/pickup/ack chain covered by the copy cases. No
production adapter was enabled or EXE rebuilt. Full goal completion remains open.
