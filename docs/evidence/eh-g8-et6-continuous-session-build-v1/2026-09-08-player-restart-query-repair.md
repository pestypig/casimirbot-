Program gate: G8
Workstream: CS1/CS4 restart recovery
Capability or component: Player HTTP poll endpoint relocation
Lifecycle stage: evidence re-entry
Reaction timescale: resident control polling
Authority owner: existing authenticated connector and finite player authority
Current maturity: specified
Target maturity: deterministically verified
Required evidence: reproduced port-change failure, focused transport regressions and later packaged/live recovery
Explicit non-goals: no authority renewal, private execution loop, action replay or ET6 acceptance
Downstream gate unlocked: none

The new EXE (`2026-09-08-cs4-status-recovery-package.json`) launched normally
after closing the previous EXE. Native launch discovery initially timed out;
the service subsequently completed its 24,836 ms database restore and exposed
the window. MCP full transport recovered under existing trusted-device
delegation without a user reconnect. The original goal revision/hash, run
version, player authority and controller epoch survived. Exact observations
and limitations are in `2026-09-08-cs4-restart-poll-boundary.json`.

The first status request after restart expired without being leased. Native
logs repeatedly reported `action_poll_unreachable`, although heartbeats
reached the new service. `PlayerActionHttpClient` appended `/controls/pending?limit=4`
before calling the installed-service resolver. That resolver intentionally
rejects query-bearing inputs. Consequently, polls retained the closed original
port while heartbeat URLs moved to the current receipt origin.

Classification: evidence re-entry / connector transport. Resolve the paired base
URL before appending the fixed protocol suffix. The existing resolver still
prefers a reachable paired origin and rejects untrusted receipt origins. The
connector path and bearer remain unchanged; there is no transport replay,
credential rotation, new permission or weakening of native admission.

`PlayerActionRestartTransportTest` uses two real loopback HTTP servers and the
actual installed-origin resolver with a temporary ready receipt. Before the
repair, heartbeat followed the replacement but the subsequent control poll
failed with `ConnectException`. After the repair, heartbeat, control polling
and action polling each arrive exactly once with the original path, query and
fixture credential. While the old service remains reachable, it stays selected.

Focused Gradle tests passed: restart transport (1), installed-origin resolver
(3), HTTP fault handling (4): **8/8**. The initial red run also invoked the
existing five synthetic-world GameTests through Gradle's task dependency;
those passed, but are not live session acceptance. The green run excluded that
already-run task. Existing deprecation warnings remain unrelated.

This source repair is not yet installed in the running Minecraft JVM. The EXE
package does not hot-replace the player mod. Retained workflow status remains
unverified through live MCP until the repaired companion handles the native
status request. No three-successor movement or interruption/revocation
acceptance is claimed.

The service-local exact-chat binding disappeared on restart. PNA3.4b explicitly
requires an epoch rotation on service restart; replaying the old claim would be
wrong. The UI now exposes the same verified run for review. The prior Helix
chat is also absent from the current native chat list; profile snapshot writes
return 413. That separate exact-chat recovery boundary still needs diagnosis
before asking the user to bind a replacement local chat. No consent control was
activated and no new goal, run or player authority was created.

CS1–CS4 remain incomplete, CS5 remains a handoff inventory, ET6 remains
unpassed, and NAV1 remains gated. This non-physics HTTP construction change
does not alter an adapter schema, certificate or release-verification contract;
no Casimir verification result is claimed.
