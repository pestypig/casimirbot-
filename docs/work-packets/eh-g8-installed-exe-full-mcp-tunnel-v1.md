Program gate: G8 — environment-harness release evaluation
Workstream: Installed multi-surface harness convergence and profile-native MCP recovery
Capability or component: Explicit developer-only full Helix MCP mode for the installed EXE private tunnel
Lifecycle stage: Installed client connection, native consent, tunnel start, OAuth catalog admission, reconnect, and revocation
Reaction timescale: Operator-session startup and bounded reconnect; never Minecraft tick control
Authority owner: Exact signed-in CasimirBot developer profile plus the authenticated external MCP client
Current maturity: implemented
Target maturity: deterministically verified
Required evidence: read-only default preservation; native developer-account enforcement; explicit operator selection; full endpoint selection without URL or credential projection; OAuth scope enforcement; unchanged room, source, Player Embodiment, World Authority, execution-lease, manual-override, and Emergency Stop contracts; DPAPI vault and process-argument secret exclusion; stop/restart reset to read-only; focused desktop/tunnel/transport/account-policy tests; production desktop build; installed-node source-pair and REC1 consume trace; managed catalog refresh state
Explicit non-goals: no ordinary-user full MCP mode; no tunnel-readiness-to-action-authority implication; no credential, tunnel ID, runtime key, desktop session secret, pairing material, OAuth token, or private endpoint in renderer/model/MCP output; no bypass of OAuth, room ownership, source admission, subject selection, or action authority; no World Authority grant; no REC2 hostile, Nether, Wither, arbitrary shell, filesystem, browser, or desktop-control authority; no release-ready or G8-closure claim from this packet
Downstream gate unlocked: Installed EXE REC0/REC1 A1 acceptance and later G8 managed-client catalog convergence

# EH-G8 installed EXE full MCP tunnel v1

## Problem

The installed CasimirBot EXE successfully supervises the pinned OpenAI
`tunnel-client`, protects its runtime key with native safe storage, injects the
per-launch desktop session header opaquely, and proves `/healthz` plus
`/readyz`. The shipped tunnel intentionally targets only
`/mcp/local-supervisor-coordination`. Its green state therefore proves a
read-only coordination/Device Check transport, not the full authenticated
Helix MCP surface needed by REC1 source pairing and Player Embodiment.

The 2026-08-28 C0 handoff reproduced that distinction: the installed tunnel was
ready while the active Codex task exposed no CasimirBot environment tools.
Port 1522 was unnecessary and remained free, but tunnel transport health alone
could not satisfy source admission or action readiness.

## Bounded implementation

1. Preserve `local_supervisor_coordination_and_device_check` as the default and
   as the only mode selected after every desktop start.
2. Add a separate `full_helix_agent` start mode. Selection is ephemeral and is
   not written beside the DPAPI-protected tunnel credentials.
3. Before the native host starts that mode, query the private installed account
   session with the per-launch desktop header and require
   `account_type=developer`. Renderer state is not authority.
4. In full mode only, point `tunnel-client` at the existing `/mcp` route. Keep
   the desktop session header in an environment reference, never a process
   argument. External requests still require the canonical OAuth principal and
   every tool retains its exact scope, profile, room, binding, lease, and
   postcondition checks.
5. Expose the active mode in the sanitized native state and make the UI label
   explicit. `ready=true` remains transport health; it must not project source
   freshness or environment action readiness.
6. Stop, failure, process exit, clear, and desktop restart return the requested
   mode to the read-only default. Changing modes requires a stop/start boundary.

## Acceptance sequence

1. Deterministically prove read-only default, strict state parsing, exact MCP
   URL selection, no sensitive process arguments, developer denial, developer
   admission, and reset behavior.
2. Build the desktop host and production client and rerun the environment docs
   audit.
3. Install/relaunch the resulting EXE, explicitly start full developer MCP,
   attach an authenticated Codex client, and prove catalog presence without a
   loopback Node server.
4. Resume REC1 at source-only pair, fresh device/subject observation, exact
   DatDamPig selection, consume-only authority inspection, controlled stew
   consume, independent server-state verification, and control release.

No deterministic or installed trace may promote this capability beyond the
work program's exact maturity terms.

## 2026-08-28 implementation evidence

- The native host preserves read-only coordination as the default, parses an
  exact start request, and revalidates the signed-in native developer account
  before admitting `full_helix_agent`.
- The tunnel controller selects the full `/mcp` endpoint only for that explicit
  ephemeral mode. Stop, failure, exit, clear, and restart return the sanitized
  state to the read-only scope; credentials remain in the existing DPAPI vault
  and the desktop session secret remains an environment reference.
- The Device Check panel exposes distinct read-only and full-developer starts,
  labels the active transport scope, and does not equate tunnel readiness with
  environment authority.
- Focused battery: `tests/desktop-mcp-tunnel.spec.ts`,
  `tests/desktop-host-security.spec.ts`, and
  `client/src/components/__tests__/DeviceCheckPanel.spec.tsx` — 16 tests pass.
- `npx tsc -p apps/desktop/tsconfig.json --noEmit`,
  `npm --prefix apps/desktop run build:host`, and `npm run build:client` pass.
  The production builds retain their pre-existing bundler warnings.
- A concurrent repository `dist:win` run completed after this patch was
  present. The resulting local unsigned alpha.9 archive contains the exact
  `full_helix_agent` marker; its installer SHA-256 is
  `961d9bdd0dbabea5c5031846b44aac5ca70a1ae68d14dcbfb2a2971aaa51d481`.
  This is local package identity only, not signing or release evidence.
- The broad repository `npm run check` was cancelled when workstation memory
  crossed the packet's 95% hard-stop threshold. This is a resource cancellation,
  not a pass or a test failure.

This evidence establishes `implemented`, not `deterministically verified` or
`live accepted`. A packaged installed-EXE run, external OAuth catalog attach,
managed refresh/reconnect, and the REC1 consume trace are still required.

## 2026-08-29 continuation evidence

- The packaged alpha.9 `win-unpacked` EXE was the active native process; port
  1522 was not required. The desktop mode still reset to the read-only tunnel
  after startup as specified.
- Focused verification passed 37 tests: desktop tunnel selection (6), desktop
  host security (7), Device Check presentation (4), MCP Device Check/local
  supervisor/public catalog (15), and the brokerage R3 live-shadow contract
  (5). One static host-security assertion was updated to match the stronger
  current call that passes the freshly revalidated native account session into
  `DesktopMcpTunnelController.start`.
- Desktop TypeScript, the environment-harness documentation audit, the Helix
  Ask quick discipline guard, and the desktop host/bundled-service build pass.
  The host build retained four unrelated pre-existing duplicate-key/case
  warnings.
- A fresh client production rebuild was cancelled when host memory reached the
  packet's 95% hard-stop threshold (measured at 97%). The already packaged
  alpha.9 client artifact was not modified or invalidated by that cancelled
  build.
- Native UI automation could not perform the explicit mode switch because the
  Windows helper twice returned `GetCursorPos failed: Access is denied
  (0x80070005)`. No guessed input, credential bypass, provider call, brokerage
  mutation, or authority expansion followed that failure.

The capability remains `implemented`. The next acceptance action is the
explicit operator-visible `full_helix_agent` start in Device Check, followed by
an authenticated catalog attach and managed reconnect proof. Brokerage R3
shadow evidence resumes only after that transport proof and refreshed
owner-private Robinhood read authorization; provider mutations remain zero.

## 2026-08-29 alpha.11 installed catalog convergence evidence

- Local package `0.1.0-alpha.11` was built from the current production client,
  desktop host, and bundled service, installed over the per-user CasimirBot
  path, and verified byte-for-byte against `win-unpacked`. The unsigned local
  installer SHA-256 is
  `adec06e9a6a32d26fd33c4bee31a1c1c1f8b49f4973d8ff9bc9f4a7691bdf396`.
- Runtime-tree verification passed for 611 renderer files and pinned native
  tunnel-client 0.0.13. The installed runtime manifest exactly matches the
  packaged manifest at SHA-256
  `7033bec09351f4c2825e56a4d1e1a91715a07bb3756780efb5aa0448359381c0`.
- The upgraded native host produced a fresh service-ready receipt and, after
  exact active developer-account revalidation, auto-started the configured
  read-only coordination tunnel. Official tunnel `/healthz` and `/readyz`
  probes returned 200. Port 1522 remained unnecessary; no ad hoc loopback
  acceptance server was started.
- This Codex continuation registered live presence on service instance
  `service_instance:a03af272d00207db15990d01c6b52016`. Its live
  `helix_public_ui_catalog` projection exactly matched the deterministic
  builder for all 20 surfaces, 398 controls, 40 capabilities, and the complete
  core catalog (`110472` serialized bytes, FNV-1a-64
  `43941b49ef5762ee`).

This satisfies installed read-only private-tunnel public-catalog convergence.
It does not satisfy this packet's full-mode acceptance: the current thread's
cached connector schema did not expose the newly registered transition tools,
so no leased native broker transition or full `/mcp` catalog refresh was
claimed.
