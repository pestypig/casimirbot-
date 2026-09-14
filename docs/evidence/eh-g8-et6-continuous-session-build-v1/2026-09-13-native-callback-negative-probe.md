# Native callback negative probe and diagnostic correction

Classification: evidence normalization. Scope: O6 prerequisite diagnosis.

Dispatched a deliberately invalid, non-secret `casimirbot://oauth/callback`
URI through Windows' registered protocol handler, with `error=access_denied`
and a fabricated diagnostic state unrelated to any issued request. No code,
real state or credential was supplied. The running callback-diagnostic EXE
then displayed `Auth0 account linking did not complete. You can try again.`
Its account projection remained Not linked.

This is packaged negative-probe evidence for Windows dispatch, native callback
handling and delivery of a rejected result to the UI. It is not Auth0 browser
handoff, token exchange, successful linking or exact-task acceptance.

The startup journal measured exactly 262144 bytes, its configured cap. Existing
append logic drops every later event. Thus prior missing callback markers were
not proof of missing callbacks. Preserve those earlier observations but reject
that inference.

Source now writes fixed OAuth event names to an independent 64 KiB bounded
journal, resetting that diagnostic file at its cap. It accepts no arbitrary
event text and does not record URLs, states, authorization codes or identities.
Diagnostic I/O failure cannot interrupt callback handling. The host build
passed. This logging correction is not yet packaged or running; no fourth build
was created under the new retention policy.

The underlying successful OAuth handoff remains unproved. All CS1–CS4 and O1–O6
requirements remain open; ET6 is unpassed and NAV1 unqualified. The work program
remains the sole status authority.
