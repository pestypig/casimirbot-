# Provider-verification admission race repair

O2/O3/O5 source-admission evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Reproduced a real-handler failure: the fixture revoked device trust during
provider target verification, but invitation issuance returned 200 instead of
403. This was a product race in the new optional automatic path, not a fixture
authentication failure.

Extracted the existing route approval resolver and repeat it after provider
verification. The same registration, installation, trust, account-link and
optional environment checks run again; changed approved scope is rejected before
issuance. Copy-only issuance retains its existing single resolution path.

The original red trust case now rejects with pairing_device_trust_required.
A second case revokes the destination registration inside provider verification
and rejects with pairing_registration_revoked. Neither adds a grant; all 17
route tests pass. Account-link and environment races follow the same resolver
but are not independently proven by these two cases. This does not establish
atomicity against every change during later database/encryption awaits.

No production adapter is configured or native package restarted. Actual host
verification, full browser automatic consent and the original integrated
onboarding/environment acceptance remain unfinished.
