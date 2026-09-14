# Optional automatic-delivery HTTP integration

O3/O5 prerequisite under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: source admission and evidence normalization.

Added a trusted server dependency for the delivery service. Automatic invitation
issuance requires that dependency and exact authenticated target verification
in addition to existing browser/session, device trust, account-link and optional
environment checks. With no adapter it returns typed provider-unavailable (503),
replacing the earlier generic approval-scope mismatch observation. Default
production composition supplies no adapter; no environment flag or request
header can install one.

Added owner-authenticated public handlers for paged candidate discovery and
explicit delivery of one pairing. Delivery requests accept no extra body fields.
Responses retain execution/answer-authority false and no-store headers. Candidate
discovery and send remain separate operations; there is no automatic scheduler.

Extended the real HTTP route fixture using the encrypted repositories, migrations,
registered destination, retained-trust fixture and isolated idempotent provider.
An automatic approval is committed, discovered, delivered and replayed with one
provider message. The response contains no invitation secret; pairing acceptance
remains null. Bearer-only delivery without the fixture human cookie returns 401.
Initially the new fixture reused a permissive session resolver that accepted
missing cookies; restricting it to the exact session corrected the failed test.
The production resolver was not changed.

All 17 route tests and quick static discipline pass. The latter also scans earlier
unrelated dirty changes and is not runtime proof. This is public-handler fixture
integration, not real host attestation, native browser approval or packaged
automatic delivery. Post-provider-verification admission races and full UI
automatic-mode review remain to be qualified. No production service factory was
enabled and no running EXE restart occurred. All full goal exits remain open.
