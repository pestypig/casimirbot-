# EH G8 profile room authority continuity v1

Program gate: G8
Workstream: Parallel delivery lane — profile-native room and authorization lifecycle
Capability or component: Active-room switching plus typed Environment Action Authority MCP failures
Lifecycle stage: Authority admission and recovery
Reaction timescale: Configuration-time; no tick-loop authority
Authority owner: Signed-in Casimir profile when it owns the room; a participant or agent cannot manufacture owner consent
Current maturity: Live measured for profile-owned room setup, private source/player pairing, bounded camera authority, and C0 target tracking; combat MCP mapping and timeout reconciliation are implemented and deterministically verified but await an installed-node refresh
Target maturity: Live measured profile-owned C0 room setup with bounded Player Embodiment lease and uninterrupted MCP action/reaction
Required evidence: Focused UI/MCP/action-broker tests, Helix Ask discipline guard, environment-harness documentation audit, live camera receipt, and an installed-node combat/reconciliation acceptance after coordinated refresh
Explicit non-goals: No participant self-grant, no ambient full-computer-access equivalence, no credential exposure, no authority inheritance from room membership, no second execution authority, no M1 room closure, and no C0 combat-pass claim before live evidence
Downstream gate unlocked: Profile-owned C0 zombie baseline followed by C1 perception/action reaction testing

## Problem statement

The live C0 task was attached as a participant to an M1 room owned by another
profile. The signed-in Codex OAuth client had the environment-action read/write
scopes, but the room owner remained the only principal allowed to configure
Player Embodiment. A participant MCP call correctly failed at the ownership
boundary, but the MCP adapter collapsed the domain error into a generic
`internal_error`. At the same time, the active-room UI exposed only the
destructive Leave/Close path; room creation and switching were shown only when
no room was active.

This produced an avoidable human interruption. The user should not have to
close or leave an unrelated shared room merely to create a profile-owned test
room, and Codex should receive a typed consent/ownership failure that it can
reason over. The ownership boundary itself must remain intact.

## Patch classification

- `presentation`: expose Create/Join/Existing Rooms from an active room in a
  non-destructive disclosure.
- `evidence normalization` and `evidence re-entry`: preserve
  `EnvironmentActionAuthorityError` identity through MCP instead of returning
  a generic server failure.
- Not Codex-owned runtime behavior: this packet adds no sampling loop, retry
  loop, approval system, session manager, generic tool executor, or terminal
  completion machinery.

## Implemented behavior

1. An active Shared Live Room now offers **Switch or create another room**.
   Creating or opening another room changes the browser's active room without
   closing the prior room, revoking its grants, or removing membership.
2. Environment Action Authority failures now return
   `helix.environment_action_authority_error.v1` with the stable domain code,
   retryability derived from the domain status, and explicit non-answer and
   non-terminal fields.
3. A participant attempting owner-only configuration receives
   `action_authority_forbidden`; it no longer appears to Codex as
   `internal_error`.
4. A timed-out broker workflow may receive a release-only cancel because a
   broker observation deadline does not prove that the connector released its
   local controls. Timeout failures preserve admitted request/workflow refs so
   Codex can address the exact workflow rather than an `*_uncreated` surrogate.
5. A reused physical action identity is detected before database insertion and
   returns a typed `duplicate_request` instead of leaking a raw unique-index
   failure.
6. The MCP action-kind registry now maps `attack` to
   `com.casimirbot.minecraft.player.combat.attack`.

## Intended installed-node journey

After a coordinated keyed-harness refresh loads this patch:

1. Keep the M1 room and membership intact.
2. In the active-room disclosure, create a C0 combat-testing room under the
   current Casimir profile.
3. Pair the existing Fabric source privately to the C0 room.
4. Bind the selected Minecraft player.
5. As the C0 room owner, grant only the Player Embodiment capabilities and
   lease duration required by the current combat stage.
6. Let Codex inspect, request, extend, and exercise that bounded authority
   through MCP. Credentials remain outside model-visible results.
7. Revoke or expire the lease and verify post-revocation denial.

This journey removes routine UI handoffs after the profile-owned authority has
been explicitly established. It does not make “full computer access” an
implicit substitute for room ownership or game authority.

## Deterministic evidence

Run:

```powershell
npx vitest run client/src/components/helix/ask-console/shared-live-room/__tests__/SharedLiveRoomDialog.spec.tsx server/mcp/__tests__/helix-mcp-environment-reasoning-role.test.ts server/mcp/__tests__/helix-mcp-minecraft-action.test.ts server/services/helix-ask/workstation-tool-gateway/__tests__/environment-action.test.ts server/services/environment-connectors/actions/__tests__/authority-supersession.test.ts --pool=forks
npm run helix:ask:discipline:quick
npm run helix:environment-harness:docs-audit
```

Expected focused assertions:

- creating a new room from an active room does not call `leaveRoom`;
- an owner-only authority denial retains
  `action_authority_forbidden`, is non-retryable, contains no credential, and
  is not terminal/answer authority; and
- the result does not contain `internal_error`.

Focused suites passed on 2026-08-26: 34 assertions in the room/authority set,
29 assertions in the reconciliation set, and the two MCP Minecraft boundary
tests including exact combat mapping.

## Live C0 evidence (2026-08-26)

- The signed-in profile created owner room
  `shared_realtime_room:43b93243-1f90-49fd-88c9-bd2f4cbdf3d3` without leaving
  or closing the unrelated M1 room.
- The Fabric source and DatDamPig subject were privately paired. The active
  Player Embodiment lease is policy version 2 with only camera tracking and
  exact hostile attack admitted, manual override `cancel`, and no credential in
  MCP output.
- Two camera attempts produced trustworthy tick-zero
  `request_canceled/screen_open` receipts with no side effect and controls
  released. Desktop inspection showed a blank Minecraft chat input that looked
  like ordinary chat history at first glance. Closing that screen required no
  credential or room-owner handoff.
- The next camera attempt succeeded:
  `environment_action_evidence:c963eb7a608748b58a8a8708ac75a3e245915859e`.
  The client retained the exact zombie for 24/24 measured ticks, mean and p95
  angular error 1.17 degrees, zero target-loss ticks, zero reacquisitions, no
  manual override, and controls released.
- The zombie remained ten blocks away, visible, hostile, stationary, and not
  targeting DatDamPig. This proves camera lock only; it is not a combat victory
  or reactive-zombie pass.
- The first exact attack request was rejected before admission because the live
  MCP action-kind registry omitted `attack`. The repository patch and regression
  test now cover that mapping; live combat acceptance awaits a graceful opaque
  Node refresh.

## Product gaps exposed by the live journey

1. **Profile-aware local pairing target.** Local source handoff defaults to the
   repository's base Fabric run directory and player handoff defaults to
   `%APPDATA%\\.minecraft`. The active test profiles were
   `combat-c0-server` and `%APPDATA%\\.minecraft-helix-c0`, so the opaque inboxes
   had to be moved between verified fixed roots. A Casimir profile must retain
   the approved server run directory and client game directory and pass them to
   the bounded handoff service; Codex must never infer or print credentials.
2. **Sanitized screen sensing.** The perception snapshot currently reports
   `client_screen_state: unobserved`. It should expose a bounded state such as
   `gameplay`, `chat`, `inventory`, `pause`, or `other_screen`, plus freshness,
   without screen text. This would have made `screen_open` actionable before a
   mutation attempt.
3. **Manual-input heartbeat semantics.** The Fabric heartbeat latches
   `manual_input_detected` after any override even after the workflow has
   canceled and controls are released. Publish current input activity separately
   from last-override history so readiness does not look perpetually manual.
4. **Deadline reconciliation.** A paused connector workflow can outlive the
   broker's observation deadline. The patch preserves its real workflow ID and
   permits release-only cancel from `timed_out`; installed-node acceptance must
   prove the connector ends with zero active workflows and controls released.
5. **Physical-identity conflict normalization.** Authority rotation plus an
   unchanged perception/action hash reached a raw database uniqueness error.
   The patch detects this before insert and returns a typed duplicate boundary;
   it never treats a new authority as permission to replay an unknown physical
   effect.

## Live stop conditions

Stop rather than improvise if:

- the keyed listener is not the verified installed-node instance;
- refreshing would terminate another task's retained server without a
  coordinated handoff;
- the current profile does not own the new C0 room;
- the Fabric source/world/player identity does not match the disposable arena;
- requested action capabilities exceed the current C0 stage;
- manual override, Emergency Stop, stale source, or revoked authority is
  observed; or
- any pairing credential or invite would enter chat, logs, command lines, or
  artifacts.
