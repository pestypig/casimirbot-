# OAuth wait deadline supplement

Classification: presentation. Scope: O4/O6 prerequisite recovery.

The native account-link controller issues ten-minute requests. The prior UI
retained a callback wait beyond that period. Source now uses the parsed receipt
expiry to schedule a bounded local wait (at most ten minutes). At the deadline
it releases busy state, explains the device-clock limitation and refreshes the
server binding projection. It neither creates another request nor grants access.
Callback completion, Stop waiting and unmount cancel the timer through effect
cleanup. Server expiry and authority are unchanged.

The focused AgentAccountBindingReadiness component suite passed 9/9 tests. The
new elapsed-deadline case proves one native open, one POST, a second read-only
GET, restored retry and no inferred linked state. This fixture does not prove
future timer accuracy under suspension, late native-open settlement, concurrent
attempt correlation, browser callback dispatch or live OAuth acceptance.

This source change is not packaged. The running package is
`release-oauth-callback-20260913`; its ordinary launch and navigation through
Activity & setup → External agent setup → Open Agent Access were observed.
Link Auth0 is enabled and the account-link projection remains absent. No
callback marker appeared in the latest inspected journal tail.

All original CS1–CS4/O1–O6 requirements remain incomplete; the CS5 inventory
retains their full scope. ET6 remains unpassed and NAV1 unqualified. The work
program remains the sole status authority.
