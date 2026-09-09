Program gate: G8 — CS1 active, original ET6 unpassed
Workstream: Continuous-session ordinary EXE recovery
Capability or component: Exact bound-room settings navigation
Lifecycle stage: presentation
Reaction timescale: operator review
Authority owner: authenticated room-read policy; human retains permission decisions
Current maturity: specified integrated prerequisite
Target maturity: unchanged CS1/CS4 exit criteria
Required evidence: exact room read, failure/cancellation safety, ordinary packaged navigation
Explicit non-goals: no room joining, consent mutation, binding replacement, gameplay or acceptance claim
Downstream gate unlocked: none

# Exact bound-room navigation repair

The prior package's Review environment settings request was declined when the
existing room controller was displaying a different room. The receiver accepted
only an already displayed matching room, preventing ordinary recovery despite
a valid exact task/run binding.

The receiver now uses the existing authenticated openRoom read for the explicit
requested ID. It does not join a room or change consent. The hook verifies the
returned room ID and rejects closed rooms before applying them. An abort signal
prevents a superseded navigation read from selecting a room, and the dialog is
rendered only when the displayed room matches the navigation target. A direct
normal room-button click cancels outstanding exact navigation. Failed reads are
reported back to Ready up without displaying another room's controls.

The 32-test focused battery passes: EnvironmentSessionReadyUp (22),
HelixAskSharedLiveRoomControls (6), BoundAgentPromptDisplay (4). It covers a
different current room, no dialog before the exact read, cancelled requests,
failed reads, existing-room/closed-room handling and default-renderer display
scope. This is component evidence, not packaged or live acceptance.

The renderer build is in progress at this snapshot. Current live binding remains
reasoning_binding:479541ee1cec7a8816acdc57ebc957fe, epoch 1; no replacement was
requested. Current finite run deadline remains 2026-09-08T17:43:50.629Z. No game
permission, durable environment goal or movement has been performed. CS1–CS4 and
CS5 remain incomplete, ET6 unpassed and NAV1 gated.
