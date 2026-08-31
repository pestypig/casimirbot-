# REC1 direct A0 live evidence and authenticated A1 boundary

Date: 2026-08-27  
World: `helix_combat_c0_world` on `127.0.0.1:25566`  
Player: `DatDamPig`  
Fixture: zero hostile mobs, one `minecraft:mushroom_stew`, health above the
hard floor, reduced hunger, no bowl before use  
Scope: REC0/REC1 only; REC2 hostile pressure, Nether progression and Wither
progression were not entered.

## Direct A0 result

The direct reference lane staged
`scripts/fixtures/minecraft-consume-mushroom-stew-rec1.json` as
`direct_diagnostic_request:rec1-live-a0`. The client admitted action request
`direct_player_action_request:34f01952-4947-463e-9ea6-585bd4b3206e` and ran
workflow
`direct_player_action_workflow:a63a2e37-8815-4d16-a4a1-191b61c599d9`.

The exact server-console precondition was:

- food `14`, saturation `0.0`, health `20.0`;
- iron sword x1, bread x8 and mushroom stew x1;
- bowl x0 and no zombie present.

The terminal client event was `workflow.succeeded` with:

- `consumed_count=1`;
- `food_before=14`, `food_after=20`, `food_gain=6`;
- `saturation_before=0`, `saturation_after=7.2000003`;
- `health_before=20`, `health_after=20`, `health_delta=0`;
- `inventory_mutations_performed=1`;
- `expected_remainder_item_id=minecraft:bowl` and
  `remainder_item_delta=1`;
- `use_ticks=34` and `world_mutations_performed=0`;
- `reason_code=consume_postconditions_satisfied`;
- `controls_released=true` and `manual_override_detected=false`.

An independent server-console postcondition read confirmed food `20`,
saturation `7.2000003`, health `20.0`, iron sword x1, bread x8, bowl x1 and no
mushroom stew. This is a live direct-A0 pass. It is not authenticated MCP or
Helix terminal-answer acceptance.

## Authenticated A1 setup and first divergence

The authenticated owner MCP configured consume-only authority
`environment_action_authority:408dc0ad-35cb-4259-90a9-d767a5497ef7` for the
exact C0 room participant and paired the action companion opaquely. Because the
same-host MCP handoff still targets the default `.minecraft` path, the unread
28-byte inbox file had to be moved to `.minecraft-helix-c0`. The client then
reported a ready connector, 21 admitted capabilities, fresh active heartbeat
and both `native_fabric` and `baritone` engines.
The exact consume-only lease and its existing action credential were later
extended without changing policy version or capability scope through
`2026-08-28T19:00:00.000Z`; a subsequent inspection remained action-ready with
no asserted controls or active workflow.

The A1 fixture was independently reset to food `13`, saturation `0.0`, health
`20.0`, mushroom stew x1, bowl x0 and no zombie. The screenshot
`rec1-a1-precondition-fixture.png` records the visible precondition and has
SHA-256
`4343D0DFAB6F31E3AB9E3D118D25C3B99617C1D8830F22C5BF2B3E4BEAEE5F43`.

Two authenticated MCP consume requests then failed closed before workflow
creation with `outcome=wrong_environment` and evidence ref
`environment_action_failure:8b731ca081de8c77856191d271deefb80cfc024d`.
The first request included a non-matching display label; the second omitted the
label and proved that the actual blocker was zero active Minecraft source
projections. Neither request created an action workflow or physical effect, so
the A1 fixture remains staged.

The first divergent lifecycle stage is source admission/materialization: the
Fabric server is publishing under a historical room-source binding while the
C0 binding has no fresh source heartbeat. The new authenticated owner-only
`helix_environment_source_pair_local` implementation is present and
deterministically verified in the running checkout, but this Codex chat's MCP
catalog was loaded before that tool was added. Restarting only the keyed Node
service did not refresh the app-owned MCP tool catalog. The available Chrome
harness surface was guest-only and the in-app browser automation surface was
unavailable, so no browser login or authority bypass was attempted.

REC1 therefore has a live direct-A0 pass, while authenticated MCP A1 and REC0
same-binding fresh sensing remain open. Overall capability maturity must not be
promoted until the source-only tool is loaded, the C0 server is opaquely
re-paired to the exact binding, the fixture is freshly observed, and one later
authenticated consume receipt proves the same postconditions.

A final authenticated recheck at `2026-08-27T19:37:49.255Z` confirmed the
boundary without altering the fixture. Ports `1522` and `25566` were listening;
the consume companion remained `ready_for_actions=true`, with fresh active
heartbeat, zero active workflows, no asserted controls, and no emergency stop.
The corresponding Fabric server environment remained `connection_status=missing`
with `latest_observed_at=null`, an empty subject directory, and the existing
DatDamPig subject binding marked stale. The active sensing installation reported
`blocking_reasons=[contact_stale]`. The app catalog still exposed only
`helix_environment_player_pair_local` and the command-authority
`helix_environment_server_pair_local`, not the required source-only pairing
operation. The authenticated consume was therefore correctly withheld rather
than acting without the REC1 observe-before-act precondition.

## Installed-EXE replay on 2026-08-29

The installed EXE was rebuilt with a narrow native-session exception for the
separately authenticated Player Embodiment connector namespace. The exact C0
source became fresh, the consume-only authority remained active, and the Fabric
client reported ready. World Authority remained off.

After rejecting one invalid Peaceful-mode fixture that refilled hunger and
timed out with controls released, the accepted direct replay used food `13`,
saturation `0.0`, health `20.0`, stew x1, bowl x0 and no hostile. Workflow
`direct_player_action_workflow:fa76fdce-7254-4be8-8364-c2f4a611ca46`
reported `workflow.succeeded`: one stew consumed, food `13 -> 19`, saturation
`0 -> 7.2000003`, health unchanged, bowl delta +1, 32 use ticks, zero world
mutations, no manual override and controls released. Independent server reads
confirmed food `19`, saturation `7.2000003`, health `20.0`, stew x0 and bowl
x1.

The authenticated fixture is now restaged at food `15`, saturation `0.0`,
health `20.0`, stew x1 and bowl x0. The local MCP alias is OAuth-authorized and
its configured allowlist contains `helix_minecraft_player_action`, but the
already-loaded task catalog predates that login. Authenticated A1 remains open
until one refreshed client catalog performs the same consume and re-enters its
receipt. REC2, Nether and Wither were not entered.
