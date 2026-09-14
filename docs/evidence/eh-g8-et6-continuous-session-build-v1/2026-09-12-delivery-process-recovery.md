# Independent-process delivery recovery

O2/O3/O5 recovery evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Added the native delivery-repository factory using existing native pairing/broker
prerequisites, vault encryption and required local database snapshot barriers.
There is no plaintext or unkeyed fallback and no production dispatch caller.

Extended the existing isolated five-process steering fixture. The create process
also commits two automatic-delivery grants: one with an unknown delivery outcome,
one with consent only and no outbox. The parent terminates the process after its
durability-backed result, without a graceful database shutdown. The fresh recover
process uses the same retained fixture broker key and database snapshot and finds
the identical delivery row, revision and timestamps, both discoverable grant IDs,
and no invented outbox for the consent-only grant. The persisted delivery table
contains one encrypted row; automatic approval metadata is not plaintext.

Combined repository/service and process suites pass 17/17 tests. The process test
retains all previous steering recovery, expiry and revocation assertions. Its
five modes run as distinct processes; no user service or native profile is used.

This proves recovery of acknowledged writes using the native broker interface
with isolated test keys. It does not prove the production protected-key store,
actual Postgres concurrency, power loss or termination during a write. The
process fixture creates internal approved rows rather than exercising a human
HTTP approval route. Actual host delivery, UI integration and complete packaged
rehearsal remain outstanding. No stage or original ET6 acceptance is closed.
