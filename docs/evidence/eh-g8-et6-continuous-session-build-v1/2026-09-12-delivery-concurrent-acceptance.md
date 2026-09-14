# Concurrent provider delivery and exact acceptance

O3/O5 fixture evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Added a two-worker test starting from a persisted unknown delivery. Both provider
lookups deliberately report absent before either send proceeds. Both send calls
carry the same delivery ID. The fixture provider implements atomic idempotency
and creates one message; the two real delivery-service calls reconcile one
identical receipt in the encrypted repository. This proves two send requests,
not one network request. Provider-side idempotency is a required assumption,
not something the local CAS alone guarantees.

The same test proves delivery leaves pairing acceptance null, rejects acceptance
by a foreign task, and permits exact-provider acceptance through the real
transition service. Its replay returns the identical accepted pairing. There is
one pairing row and one delivery row. Fixture authentication and provider behavior
remain isolated; no actual host message was sent.

All 18 focused contract/repository/service tests pass. A TypeScript no-emit
compiler-API check using repository compiler options and five roots (delivery
contract, repository, service, repository/service tests and migration 091) reports
zero diagnostics, including their loaded dependencies. Initial checking found a
widened string literal in a mocked lookup; an explicit return type fixed it.
This is not a whole-repository typecheck or native build.

Consent-to-outbox recovery, public-route integration, native delivery recovery,
actual supported-host idempotency and the full onboarding/environment acceptance
remain unfinished. No runtime adapter was enabled and no maturity promoted.
