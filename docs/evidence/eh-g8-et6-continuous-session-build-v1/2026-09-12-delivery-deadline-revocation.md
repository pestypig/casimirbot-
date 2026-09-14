# Provider deadlines and revoke during send

O3/O5 prerequisite under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: deterministic transport and evidence normalization.

Provider connect, lookup and send now each receive an AbortSignal and a five-second
deadline. Timeout rejects with a stable code and ends the service continuation.
A late successful provider result cannot continue into receipt publication.
Connect timeout creates no outbox row; lookup/send timeout retains unknown state.
Cancellation does not assert that an already-issued provider send had no effect;
recovery must still reconcile the stable delivery identity.

Added three deterministic deadline cases and a revoke-during-send case to the
real encrypted-repository fixture. The latter lets the provider obtain the
invitation, revokes through the real pairing transition service, and then returns
a message receipt. Delivery rejects the now-unavailable grant; subsequent exact
provider acceptance rejects; acceptedAt remains null and delivery remains unknown.
The provider may already have displayed the invitation, which is not acceptance.

All 17 focused contract/repository/service tests pass. The initial three deadline
tests timed out because broad fake timers intercepted pg-mem scheduling; limiting
fake timers to setTimeout/clearTimeout preserves database scheduling and exercises
the provider deadline directly. This was a fixture correction, not a longer
production deadline or weakened assertion.

Five seconds is per provider operation, not a proven end-to-end ten-second
onboarding budget. Owner authentication, database and vault deadlines are not
established by these tests. No public route, native adapter or automatic worker
is enabled. Issuance-to-outbox recovery and actual supported-host qualification
remain open, along with full O1–O6, CS1–CS4, CS5 and original ET6 acceptance.
