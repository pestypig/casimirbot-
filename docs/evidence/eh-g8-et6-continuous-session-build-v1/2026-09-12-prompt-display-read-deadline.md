# Prompt display read deadline

Under [onboarding O4/O5](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and CS2 presentation. Classification: presentation; no authority change.

BoundAgentPromptDisplay previously waited indefinitely for fetch or JSON body,
retaining old displayed transport status and never scheduling another read.
Added a five-second deadline spanning both. On timeout the request is aborted,
old rows clear and the existing unavailable message is shown. Subsequent polling
gets a fresh controller; late completion of the old promise cannot re-enter UI
state. Polling remains display-only and never acknowledges or executes a prompt.

Deterministic fake-clock tests cover separately hung fetch and hung body after
an initially successful display: clear stale rows, abort, retry without remount,
then reject the late old result. All six display tests pass. The real-handler
Chromium pointer and keyboard normal paths also pass (2 tests, 12.8 seconds).
These checks do not simulate native network hangs or prove provider delivery.

This repair is not yet in the running clipboard package. Full O1–O6 and CS1–CS4
criteria and CS5 remain open; ET6 remains unpassed and NAV1 gated.
