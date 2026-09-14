# Typed steering visible-message deduplication

Under [parent CS2](../../work-packets/eh-g8-et6-continuous-session-build-v1.md)
and onboarding O4/O5. Patch classification: presentation. No prompt interpretation,
origin, identity, admission, provider runtime or terminal-authority change.

Tracing the production renderer found that typed dispatch in HelixAskPill used
addMessage after every successful transport response. That store operation always
appends a randomly identified message, whereas server retries return the same
steering event. Thus an idempotent retry could append duplicate visible messages.

Changed that call to the existing appendMessageOnce operation using the server
steering_event_ref and created_at. Text, user role and client trace reference stay
the same. No receipt is promoted to an assistant answer. The agent-submitted
display is a separate component and was not modified or claimed tested here.

Existing append-once store and bound-agent bridge regressions passed 10 tests,
exit 0. These cover the store's exact-once/title/persistence behavior and the
bridge; they do not directly render the full HelixAskPill dispatch callback.
Discipline quick passed, classifying the large Pill file as a thin runtime adapter.
The actual diff is presentation-only; no classifier/admission shortcut was added.

Full composer retry and packaged native verification remain outstanding. This
fix is not in the running clipboard package. All O1–O6/CS1–CS4 exits and CS5
remain in scope; original ET6 remains unpassed and NAV1 gated.
