# Production agent-prompt display in the real-handler fixture

Under [onboarding O5](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and CS2 display. Classification: test-only integration.

The isolated browser entry now renders production BoundAgentPromptDisplay for
its recovered binding. A fixture event with agent_submitted origin is inserted
through the real internal binding-access layer; this is explicitly not MCP
principal authentication or provider delivery. Retrying it returns the same
event. The production display fetches its data through the real browser route
and encrypted repository.

Pointer/keyboard normal and lost-issuance-reply paths verify one visible agent
prompt article, pending status, acknowledged status after access-layer ack and
reload, exclusion of the separate typed event, and explicit transport-not-answer
copy. Rendered revocation removes the display. Storage contains two events total:
one typed and one agent-origin fixture event, with no retry duplicates.

Focused normal paths passed 2 tests in 12.9 seconds. The full real-handler suite
passed 8 in 21.5 seconds, exit 0; identity-switch cases retain their earlier branch.
The fixture bundle warns that import.meta is empty in IIFE format; the imported
chat store uses its default context budget. No production build change was made.

This is production display/handler integration inside an isolated fixture. It
does not prove full normal-composer rendering, native EXE display, authenticated
agent ingress, actual provider pickup or environment acceptance. All O1–O6,
CS1–CS4 and CS5 remain in scope; ET6 unpassed and NAV1 gated.
