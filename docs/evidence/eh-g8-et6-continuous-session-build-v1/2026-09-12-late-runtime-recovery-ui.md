# Late runtime recovery after account or chat change

Under [onboarding O4/O5](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Classification: test-only presentation isolation coverage.

Inspected DurableTaskPairing and its HTTP helper. Requests already bound both
fetch and JSON-body reads to ten seconds; account/chat changes remount the
review. No implementation correction was needed for the tested boundary.

Added two rendered tests: hold the current pairing's runtime-binding inspection,
switch account or chat, then release the old request with HTTP 409. The old
failure must not invoke the binding callback (including null-clearing), display
its recovery error in the new review, select consent, or cause a mutation.
Both pass; the full DurableTaskPairing suite passes 17 tests, exit 0.

This uses injected HTTP responses to test UI lifecycle behavior. It does not
prove real-handler authorization, a late successful runtime response, or live
pairing acceptance. The missing current-task pairing tools remain an external
boundary. O1–O6, CS1–CS4 and the CS5 handoff remain open. Original ET6 unpassed;
NAV1 gated.
