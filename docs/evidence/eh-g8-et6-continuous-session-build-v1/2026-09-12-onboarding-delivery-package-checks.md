# Delivery package build and isolated startup

O6 artifact prerequisite under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Client production build passed in 33.74 seconds, desktop no-emit TypeScript check
passed, and host build/staging passed. Existing browser externalization/eval and
four server duplicate-key/case warnings remain. Packaging completed with exit 0
in `apps/desktop/release-onboarding-delivery-20260912/win-unpacked` without replacing
the ordinary running display package.

[Content comparison](2026-09-12-onboarding-delivery-package.json) verifies all
645 runtime files, 635 renderer files and eight host artifacts with no mismatch
or extra file. EXE SHA256:
`0d163316135ecd0a4146e32ae28fd7480306f3dac4ec305b01bf872fb7fe7ac3`.
Service SHA256:
`2684cad97017d53582529622ad88b29c15c99dc1dfb9c217b9b70dd3c5adbb25`.
The checkout remains dirty at 0ecb9650f110aa62b2293760b15380f0766a3e04.

[Fixture scan](2026-09-12-delivery-package-fixture-scan.json) inspected 825 text
artifacts and ten known markers, including the new automatic-provider fixture
markers, with no hits. Production pairing-tool positive controls remain present.
This proves exclusion of known fixture markers/paths only, not absence of every
possible authentication bypass.

The existing packaged-launch smoke passed with isolated user data: four processes,
four loopback listeners, full readiness and service-listener receipts, provider
credential key vault and preserved protocol registration. Minimum observed free
physical memory was 4.32 GiB; maximum commit 59.1%. Friends coordination broker
was not configured. The test did not use the user's ordinary profile or accept
pairing/environment consent.

Ordinary launch with retained profile and integrated session rehearsal remain
pending. The display package stays running. No production automatic-delivery
adapter is configured, and source/service/browser fixtures are not actual host
or environment acceptance. All full CS1–CS4, O1–O6 and original ET6 exits remain
unfinished; no stage or navigation prerequisite is promoted.
