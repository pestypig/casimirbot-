# Conditional automatic-delivery review UI

O4/O5 implementation evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: presentation and explicit consent scope.

Destination listing now reports whether a trusted delivery service is configured.
This is adapter availability, not destination attestation; issuance still verifies
the exact target. Default production composition reports unavailable. Older list
responses remain readable and default to unavailable.

Added a conditional invitation-delivery selector and persisted reviewed mode.
Changing it clears approval through the existing review-change path. After one
human-approved automatic issuance, the client requests delivery of that pairing
without sending the invitation secret back in the delivery request. It validates
pairing/destination identity on the response and displays delivered separately
from pending acceptance. Unknown/failure preserves explicit reconciliation and
copy fallback. No polling mutation retry or automatic acceptance is introduced.

20 rendered component tests pass, including new automatic-mode approval reset,
issuance/send sequencing and delivery-versus-acceptance display. The initial new
assertion matched both clipboard and pairing status elements; selecting the
pairing text corrected the test without changing production behavior. The 17
route tests passed after availability advertisement was added. All eight real-
handler Chromium copy-path cases pass again (18.5 seconds), with the retained
fixture import.meta warning.

Automatic mode currently has mocked-HTTP component evidence plus separate real
HTTP service evidence, not their browser composition. Late identity changes,
unknown delivery and reload behavior on the new automatic UI still need focused
qualification. No actual host adapter is configured, and these UI changes are
not in the running EXE. Full O1–O6, CS1–CS4 and original ET6 remain incomplete.
