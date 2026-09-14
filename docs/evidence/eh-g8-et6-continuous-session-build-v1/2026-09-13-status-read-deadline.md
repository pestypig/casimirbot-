# Account status read deadline

Classification: presentation; O4/O5 recovery prerequisite. No authority change.

Two new fake-clock component cases reproduced a persistent Checking state and
disabled Refresh control when either GET headers or its JSON body never settled.
Before the repair both cases failed at the 15-second recovery assertion.

The status read now expires after 15 seconds, aborts its request, reports
unavailable without inferring a link, and permits an explicit Refresh. Abort and
settlement clear the timer. Late results cannot overwrite the newer observation.
There is no automatic retry, OAuth POST, consent mutation or grant renewal.

The complete AgentAccountBindingReadiness component suite passed 16/16 using:

`npx vitest run client/src/components/agent-access/__tests__/AgentAccountBindingReadiness.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`

This source repair is not in the currently running release-oauth-dispatch package.
It does not fix or qualify the Chrome callback handoff, actual linking, task
pairing, automatic delivery, continuous movement or packaged restart recovery.
CS1–CS4/O1–O6 remain incomplete; CS5 full handoff remains required. ET6 remains
unpassed and NAV1 unqualified.

The preceding registration-notification experiment was interrupted by the native
Computer Use browser-URL safety check before confirmed diagnostic launch. A shell
association notification was sent, but its effect is unproved. No production
registration repair is justified by that incomplete experiment. The temporary
diagnostic listener was stopped on continuation.
