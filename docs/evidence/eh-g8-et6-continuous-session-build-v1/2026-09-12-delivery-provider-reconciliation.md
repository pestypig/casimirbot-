# Provider delivery reconciliation fixture

O3/O5 prerequisite under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: deterministic transport and evidence normalization. No model
sampling, generic execution runtime, timer or task creation is introduced.

Added an internal `PairingDeliveryService` with mandatory owner authentication
and exact authenticated provider-target connection dependencies. It rechecks
the pending pairing after asynchronous boundaries, persists unknown before
provider lookup/send, and confirms only an exact provider message identity.
The adapter contract requires provider-side idempotent sending and lookup;
passing an ID to an arbitrary send API cannot satisfy that contract.

The fixture issues a pairing through the real invitation service using a test-only
human authorizer, encrypted ledger, migrated pg-mem database and encrypted delivery
repository. The provider commits one message and throws a lost-reply error.
A reconstructed service reconciles it via lookup without a second send. There
is one pairing and one provider message; pairing acceptance remains null.
Additional cases reject a foreign target, revocation during lookup and an unknown
provider outcome before sending. Combined contract/repository/service tests pass
13/13. Earlier repository concurrency tests remain in the same executed suite.

This is service-level integration with an isolated provider, not public HTTP
handler or native UI proof. No production adapter, worker, route or factory
enables delivery. The operation has finite control flow but adapter I/O deadlines
are not implemented yet; hung-provider behavior remains unverified. Durable
recovery between human issuance and outbox insertion also remains pending, as do
actual host integration, revoke-during-send acceptance rejection and process-level
delivery recovery. No claim of full O3/O5 completion follows. Original CS1–CS4,
CS5 handoff completion and ET6 acceptance remain open.
