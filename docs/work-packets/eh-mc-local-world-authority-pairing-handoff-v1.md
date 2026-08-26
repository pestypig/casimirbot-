Program gate: G8 — environment-harness release evaluation; bounded same-host setup lane for the reserved Nether N0 course
Workstream: Installed Minecraft World Authority credential separation and local connector enrollment
Capability or component: Opaque same-host Fabric server pairing handoff
Lifecycle stage: owner authorization, one-time pairing creation, bounded local staging, connector redemption, and sanitized readiness observation
Reaction timescale: operator-triggered setup before N0 Player Embodiment execution
Authority owner: the authenticated room owner authorizes pairing; Helix creates and hashes the one-time material; the same-host Fabric server consumes it; the installed host owns the bounded inbox path; neither Codex nor the room receives the code or credential
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: exact owner/room/binding validation; command-only pairing separation; bounded atomic same-host inbox; regular-file, size, age, and command-shape validation; delete-before-redemption behavior; sanitized MCP output; deterministic service and Fabric tests; and later one live command-readiness receipt
Explicit non-goals: no raw command execution through MCP, no source credential reuse, no pairing code in model context or process arguments, no arbitrary server path, no remote-server claim, no N0 fixture execution, no survival postcondition, and no N1–N4 acceptance claim
Downstream gate unlocked: credential-free World Authority enrollment for the N0 snapshot/setup/verify/release course on the repository-standard same-host Fabric server

# EH-MC local World Authority pairing handoff v1

The existing local Player Embodiment handoff proves that an authenticated owner
can create an action-only pairing and stage it into a fixed Fabric client inbox
without exposing the one-time code. World Authority still requires an operator
to copy `/helix pair ...` into the dedicated-server console. That asymmetry
blocks unattended N0 fixture preparation and makes the local harness depend on
a developer-only console gesture.

This packet adds the same narrow transport pattern to the repository-standard
Fabric server. The MCP tool creates only a command-credential rotation for the
exact existing room-source binding, writes the generated command atomically to
`minecraft/helix-fabric-sensor/run/config/helix-fabric-sensor.pairing-inbox`,
and returns only sanitized pairing metadata plus `server_pairing_inbox_staged`.
The Fabric mod claims and deletes the inbox before redemption, validates its
regular-file identity, 512-byte ceiling, two-minute freshness, and exact
`/helix pair CODE` grammar, then uses the existing pairing client and command
credential separation.

The fixed repository-relative server path is intentional for this same-host
acceptance lane. Remote and installed-profile paths remain owner-UI work and
must not be accepted by passing arbitrary filesystem paths through MCP.

Passing this packet proves only opaque enrollment transport. Command authority,
fixture plan admission, snapshot handling, Player Embodiment postconditions,
and Nether readiness remain separate gates.

## Deterministic verification record — 2026-08-24

The TypeScript staging service accepts only the exact server command, binds its
destination to the repository-standard Fabric server profile beneath the
current workspace, creates the config directory when needed, and atomically
replaces the bounded inbox through a private pending file. It rejects the
client-only `/helix-player` form and other malformed material.

The Fabric server inbox claims and deletes valid material, rejects malformed
and stale files without echoing their contents, and is polled only once per
second from the server tick lifecycle. Redemption reuses the existing pairing
client and its source/command credential separation; inbox failures emit only
typed sanitized reasons.

The authenticated MCP registration requires room-source-management scope,
passes only exact room, owner profile, binding, TTL, and idempotency identity to
the pairing service, and returns neither pairing code nor credential. Focused
Vitest coverage passes four tests across the MCP and local handoff surfaces.
The complete Fabric sensor suite passes 54 tests across 16 suites with zero
failures, errors, or skips. A broad repository type-check produced no compiler
diagnostic before reaching Node's default heap limit; a guarded larger-heap
retry was stopped when host use crossed the harness's 95% memory boundary. That
resource stop is not counted as passing type-check evidence.

The handoff is `deterministically verified`, not live accepted. A rebuilt and
installed Fabric server artifact, keyed MCP catalog refresh, one opaque live
redemption, and sanitized command-readiness observation remain required before
using it to provision the N0 fixture.

The production server bundle subsequently passed with only unrelated existing
duplicate-key/case warnings. The rebuilt Fabric server artifact also passed its
complete build and was installed at the repository-standard server profile with
SHA-256
`4564A099CA7B042F67CBCAF852FA2502FF2D6CC34FC38265E6393AF03E14EB01`.
The replaced installed jar remains recoverable as
`HelixFabricSensor-0.3.0.jar.pre-world-pairing-20260824.disabled`, SHA-256
`4A56F05431340236DF19C4ED156DB5140BC680FC0726227014BB26D5CDB6F7C0`.

The keyed CasimirBot server was reloaded through the approved opaque launcher
and returned to full readiness. The already-loaded Codex MCP catalog correctly
did not gain a newly registered tool mid-session, so no unrelated existing tool
was repurposed to bypass source-management scope. The running Fabric server
still has the prior jar loaded and exposes neither RCON nor another clean
lifecycle channel; it was deliberately not killed. Live acceptance therefore
still requires a graceful dedicated-server restart plus either a fresh MCP
catalog or the authenticated owner UI. No Codex restart is needed for the
backend itself, and no Minecraft survival action was taken during this work.

## Signed-in owner UI reachability — 2026-08-24

The same opaque handoff is now reachable from the existing World Authority
owner controls as **Pair local server privately**. The same-origin,
cookie-authenticated route accepts only a command-only rotation for an exact
existing room-source binding, performs the same fixed-path atomic inbox stage,
and returns no pairing code, pairing command, or credential. The manual
operator pairing control remains available for non-local servers.

Focused UI and handoff coverage passes eight tests across the source-binding
panel and local staging service. The UI test verifies that the private route is
called with command-only intent, displays only the sanitized success message,
and removes a previously displayed manual `/helix pair ...` command. This
closes the user-reachability gap without changing command-authority policy or
making the local filesystem path caller-selectable.

The dedicated Fabric server was then stopped through an attached-console
`Ctrl+C`, released port 25565 cleanly, and restarted with the installed jar
whose SHA-256 is recorded above. The sensor loaded and the client was returned
to the same-host world. Player identity was re-verified against the new
producer epoch, its finite Player Embodiment authority was reissued and paired
through the existing opaque client inbox, and a live `look_at current_focus`
action succeeded with valid provenance and released controls. Live World
Authority acceptance still requires one private owner-UI pairing click and a
fresh probe-ready receipt.
