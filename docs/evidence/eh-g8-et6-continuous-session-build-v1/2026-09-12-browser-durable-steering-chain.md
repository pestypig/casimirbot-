# Browser pairing to durable steering integration

Under [onboarding O5](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and parent CS2. Classification: evidence re-entry testability; server-internal
dependency wiring, no identity/continuation protocol or authority change.

The real-browser fixture previously injected pairing persistence but would use
native storage for steering. Added optional DurableSteeringRepository dependency
to the production router constructor. Default production construction remains
the native repository factory. No HTTP input, environment flag, alternate route,
principal bypass or consent mechanism selects the fixture dependency.

The fixture now applies migration090 to its isolated database and injects its
ephemeral encrypted repository into both real browser-route access and task
binding access. After human-fixture pairing/replacement acceptance, the browser
POSTs a typed prompt to the actual exact-chat steering route. An identical retry
returns the same 202 event, task-scoped read returns one pending event with the
same text/origin, acknowledgement returns acknowledged, and the database contains
one steering row. Subsequent rendered revocation makes task pickup reject with
pairing_revoked. Existing invitation and replacement assertions remain.

Validation:

- Focused pointer/keyboard normal paths: 2 passed, 11.1 seconds.
- Full real-handler browser suite: 8 passed, 20.4 seconds (normal, lost issuance
  reply, chat switch and account switch). The four identity-switch cases return
  before prompt dispatch, preserving their zero-issuance assertions.
- Agent connection route regressions: 17 passed, exit 0.
- Discipline quick: exit 0; no sensitive Ask files classified. Not full discipline.

Prompt submission uses fetch from the isolated browser test, not the normal Ask
composer. Pickup and acknowledgement use the actual access layer with injected
fixture admission, not actual Codex tools. There is no visible prompt/answer
claim, provider delivery proof or gameplay. This extends deterministic integration
coverage without qualifying O6/CS2 live acceptance. Not yet packaged. All O1–O6,
CS1–CS4 and CS5 remain in scope; ET6 unpassed and NAV1 gated.
