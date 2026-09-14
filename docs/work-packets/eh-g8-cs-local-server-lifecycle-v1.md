Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding recovery
Capability or component: saved local Fabric dedicated-server workstation startup
Lifecycle stage: tool admission; execution; evidence normalization
Reaction timescale: bounded application startup, outside gameplay ticks
Authority owner: human consents to installed-device workstation lifecycle; server resolves the authenticated owner's saved profile
Current maturity: specified
Target maturity: deterministically verified and separately evidenced packaged rehearsal
Required evidence: real executor tests for startup/reuse/conflict/unknown outcome, exact profile negatives, native package comparison and actual MCP startup receipt
Explicit non-goals: no gameplay grant, server commands, EULA acceptance, world/profile mutation, arbitrary executable/arguments, private model loop, ET6 substitution or NAV1 promotion
Downstream gate unlocked: none; complete parent CS1-CS4 exits remain required

# Saved Fabric server startup

This bounded repair continues the [onboarding plan](eh-g8-cs-onboarding-pairing-plan-v1.md)
and [continuous-session packet](eh-g8-et6-continuous-session-build-v1.md).
The [work program](../helix-environment-harness-work-program-v1.md) remains the
sole active-gate and maturity authority. It is independently allowed within the
current CS prerequisite scope and cannot qualify movement or navigation.

The [packaged admission rehearsal](../evidence/eh-g8-et6-continuous-session-build-v1/2026-09-13-pending-bootstrap-launch.json)
reached `minecraft_loopback_server_not_listening`. The current fixed lifecycle
starts a client only; the saved dedicated server is stopped. Default Java on
this host is 8, while the Minecraft Launcher already provides Java 21. These
observations justify a product startup repair, not ad hoc server launch commands.

Classify the change as **tool admission, execution and evidence normalization**.
Codex still chooses when to invoke a fixed capability, reviews the observation
and decides the next step. No semantic or generic execution loop is added.

## Frozen boundaries

1. Derive profile ownership from the authenticated caller. Resolve the existing
   native saved server/player selection; never accept paths from an MCP or
   browser request or silently select another profile.
2. Start only the fixed Fabric server launcher JAR in that selected directory,
   using a compatible installed Minecraft Launcher Java runtime. Do not alter
   PATH, download a runtime, accept the EULA or edit server properties.
3. Require existing EULA acceptance, an exact loopback bind/address/port match,
   regular expected files, and preserved host memory guards. Missing selection,
   incompatible runtime or configuration returns a typed setup requirement.
4. Serialize launch decisions across concurrent requests and service restarts.
   Retain nonsecret PID/start-time/profile provenance. Reuse only an exact live
   process; fail on unrelated port ownership or uncertain prior launch outcome.
   Never kill or replace another process to obtain the port.
5. Bound server startup waits. A timeout is not proof that a process stopped.
   Preserve the owned process observation and reconcile it on retry; do not spawn
   again merely because a prior call timed out or the EXE restarted.
6. Continue into the existing fixed client launcher only after server readiness.
   Preserve the saved player directory and existing restart authority. Return
   server startup/reuse separately from client connection; if client startup
   fails, retain truthful partial-effect evidence.
7. A server listening or client connected receipt grants no gameplay, pairing,
   observation freshness, answer or terminal authority. Source/player admission
   and the original natural prompt/execution/re-entry tests remain required.

## Verification

The later packaged server-start rehearsal reached the client selection guard.
Normal Launcher selection changed the visible profile button without changing
`lastUsed`; new-client startup must check the exact current Launcher window and
unique visible profile/version button immediately before Play. It must reject
wrong-window, absent, ambiguous or unavailable observations, without selecting
another profile or editing Launcher configuration. Existing-client admission is
not broadened by this correction. Test the real narrow guard with isolated UI
observation fixtures and separately rehearse the packaged path.

The next packaged diagnostic found an empty managed UI Automation button query
even with the exact Launcher foreground. An isolated native window reproduced
the fault: its standard buttons were projected as generic panes. The repaired
reader uses the Windows COM UI Automation client on a windowless MTA worker,
with exact-window scope, bounded button count and explicit object release.
It does not invoke controls. Missing observation is a typed observation failure,
not an instruction to select the same profile again. The native fixture tests
the real reader without operating a user's Launcher, account or consent UI;
the separate guard fixtures retain wrong-profile/version/window and ambiguity
negatives. Follow the Windows SDK `UIAutomationClient.h` interface order and
[Microsoft's threading guidance](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-threading).

Use isolated filesystem/process fixtures for exact owner selection, missing or
changed configuration, startup, repeat/reordered calls, conflict, timeout,
unknown outcome, PID reuse and restart recovery. Exercise real handlers with
fixture OS ports without adding production consent bypasses. Check script
syntax and the packaged allowlist/fixture exclusion. Preserve existing action,
restart and source-admission regressions. Run discipline quick, documentation
audit and the applicable Casimir adapter verification after contract changes.

Report deterministic components, native package rehearsal and live environment
acceptance separately. Supplement every CS5 requirement; no narrower passing
startup check closes the parent goal or original ET6.
