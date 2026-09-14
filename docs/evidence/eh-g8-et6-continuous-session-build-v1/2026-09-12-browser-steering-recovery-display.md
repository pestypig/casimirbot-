# Browser steering recovery and display endpoint

Under [onboarding O5](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and parent CS2 recovery. Classification: test-only integration.

Extended the real-handler browser chain after acknowledgement: replace the
service/store objects while retaining encrypted fixture storage, recover the
same grant into a fresh binding/session, and reload the renderer. Old task pickup
rejects reasoning_binding_not_found; browser dispatch with the old binding gets
409. Retry under the recovered binding returns the same acknowledged steering
event, created/expiry/ack timestamps and one persisted row.

The real browser chat-prompts GET returns exactly the same recovered delivery
as task-access read. Its display-only, no-provider-pickup, no-answer and
non-terminal flags remain false/true as required. Rendered revoke subsequently
blocks the recovered task's pickup.

Focused pointer/keyboard cases passed (2, 11.7 seconds). After adding the display
endpoint assertion, the full real-handler suite passed 8 cases in 19.5 seconds,
exit 0. Four normal/lost-reply cases exercise this added chain; four identity
switch cases retain their earlier zero-issuance branch.

This replaces objects in one test process; it is not native process/disk restart.
The browser fetch and display endpoint are tested, not the normal Ask composer
or visible steering queue. Fixture task-access read is not actual Codex pickup.
No live acceptance or maturity promotion. All O1–O6/CS1–CS4 and CS5 requirements
remain in scope, ET6 unpassed and NAV1 gated.
