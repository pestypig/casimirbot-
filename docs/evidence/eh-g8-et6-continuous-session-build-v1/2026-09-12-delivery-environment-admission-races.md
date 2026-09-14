# Environment eligibility during provider verification

O2/O3/O5 real-handler fixture evidence under the
[onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Extended the automatic invitation HTTP fixture with exact room/run selection.
One case removes membership during provider verification; the other makes the
run ineligible during the same await. Both reject with 409
pairing_environment_unavailable and preserve the existing three ledger rows.
No new invitation or delivery is created. All 17 route tests pass.

Together with the retained trust, registration and account-link cases, these
tests cover each input re-read by the post-provider approval resolver. Membership
and run eligibility are injected fixture dependencies; these tests prove route
composition, not live environment membership discovery or action authority.
They do not establish atomicity across every subsequent database/encryption
boundary. No production patch, runtime restart or consent action was needed.

Actual host and packaged automatic-delivery qualification remain unfinished;
the full onboarding, CS1–CS4 and original ET6 acceptance criteria remain open.
