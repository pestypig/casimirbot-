# EH-MC-NETHER1 fluency and fall-safety repair v1

Program gate: G8 — Environment-harness release evaluation; supporting N0 work for the reserved post-G7 Minecraft integration objective
Workstream: Minecraft Player Embodiment locomotion safety, compact sensing, and consecutive bounded workflow execution
Capability or component: General movement-producing workflow safety envelope and provider-visible interruption evidence
Lifecycle stage: execution; secondary stages are observation normalization and evidence re-entry
Reaction timescale: Minecraft client tick local reflex with event-driven semantic replanning
Authority owner: Runtime Codex owns strategy and recovery selection; Helix owns admission, identity, leases, evidence, and terminal eligibility; Fabric owns the admitted tick-local safety decision, control release, and measured postcondition
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: deterministic fall, lava, unknown-geometry, low-health, control-release, and supported-step tests; full Fabric test/build; controlled no-damage locomotion micro-course; later A1 evidence re-entry
Explicit non-goals: no portal-specific planner, fixed Nether walkthrough, server command, creative inventory, teleportation, unrestricted pathing mutation, model call per tick, hidden reasoning capture, or N1 acceptance claim
Downstream gate unlocked: safe five-cell mining/staircase and portal-course execution needed before restarting the full Survival journey

## First divergence

The live Survival journey requested a broad native mining workflow from Y=27.
The connector returned only bounded non-progress after moving the selected player
to Y=9, reducing health from 20 to 5, and removing no requested iron. The first
divergence was Player Embodiment execution: target approach used a standable
terminal pose but did not reject an unsupported intermediate forward landing.
The later action-heartbeat split is retained as a separate lifecycle defect and
must not be used to explain away the locomotion failure.

Evidence anchors:

- action receipt `environment_action_evidence:dcbec534588dfbdd7809690a0dffe3587d4956672`
- actor probe `environment_probe_evidence:45f438989f80acc385e02d0efa093b4b418645b4`
- journey report `reports/helix-minecraft/nether-journey-20260825/progress.md`

## Repair boundary

Before each native movement-producing workflow asserts forward control, Fabric
must evaluate one bounded mechanics observation: current health/fire/lava/fall
state plus loaded landing support in the intended horizontal direction. Level
support and a one-block descent are admitted. Unknown geometry, lava, an active
fall, low health, or a larger predicted drop refuses the movement, releases
controls, and returns a typed reason with sensor identity and measurements.

This is a safety envelope, not route selection. A distinct explicitly admitted
recovery program may own movement after Codex interprets the refusal. Ordinary
mining/navigation cannot silently treat low-health escape as authorization.

## Verification course

1. Replay the Y=27 unsupported-forward geometry and require refusal before
   displacement or health loss.
2. Admit level support and a one-block descent so ordinary tunnel/stair movement
   remains usable.
3. Refuse unknown chunks and predicted lava.
4. Refuse ordinary locomotion below the health floor and preserve an exact
   recovery-required reason.
5. Run five consecutive supported target handoffs and verify no idle gap above
   one tick, no unchanged-target loop, and control release.
6. Prove the compact terminal receipt retains safety reason, frame revision,
   health, fall distance, predicted drop, and landing hazard.

The full Nether journey remains paused until this course passes and the exact
Survival state can be reset to a clean checkpoint.

## Deterministic verification checkpoint — 2026-08-25

The local guard is now applied before forward control in direct native
navigation, bounded walk, movement-producing reusable workflows, native final
approach after optional Baritone settlement, and tick-addressed fluid-sequence
input segments. The pure envelope admits supported level travel and a one-block
descent, and refuses low health, fire/lava contact, an already developing fall,
unknown landing geometry, predicted lava, and a larger predicted drop.

The full clean Fabric companion test/build completed with 151 tests, zero
failures, and zero errors. The remapped installed
`HelixFabricPlayerAgent-0.4.0.jar` SHA-256 is
`6E99DF6AC5829B9DF7B5F5BFDC30F2538C7FB58E50B2C7E033CBFA9DE7D8D0D4`.
The installed artifact hash matches the build artifact exactly.

The first keyed live low-health refusal proved the local stop but exposed an
evidence contradiction: a zero-tick, no-control action was reported as player
motion. The general result builder now accepts an exact
`effect_prevented=true` measurement and consequently reports all physical effect
flags false. The corrected keyed retry retained:

- `duration_ticks=0`;
- `reason_code=locomotion_health_floor_crossed`;
- `measured_health=5` and `stop_below_health=6`;
- known supported landing geometry with `predicted_drop_blocks=0`;
- `controls_released=true` and `effect_prevented=true`;
- `side_effects_performed=false` and `player_motion_performed=false`; and
- valid current-turn provenance in
  `environment_action_evidence:d903b1a50b33483da855a72f38e51b23c069b34a3`.

The exact actor remained at `(-24.5,12,1.96)` with health 5 before the retry,
supported by
`environment_probe_evidence:4dffb0a70c8f7c5f5c93f2b7d606ae6cb5b18ecb`.
This remains useful historical negative-boundary evidence, but it is not used
as post-rotation acceptance evidence.

## Post-rotation controlled live checkpoint — 2026-08-25

After a local diagnostic inspection crossed the credential-observability
boundary, the earlier Player Embodiment credential was treated as contaminated
and superseded. No secret value is retained in this packet. The room owner
created policy version 6 and used the opaque same-host player-pairing handoff;
the handoff returned neither a pairing code nor a connector credential. The
fresh authority is
`environment_action_authority:2344eacb-8aa7-4bf2-9f55-3cc759f44f06`.

The final 151-test artifact launched and consumed the staged pairing. Sanitized
readiness then reported:

- policy version 6 active with all 18 admitted capabilities;
- `state=ready`, `manifest_admitted=true`, and a fresh active heartbeat;
- `native_fabric` and `baritone` control engines available;
- zero active workflows, no asserted controls, no manual input, and no latched
  emergency stop; and
- no credential or pairing material in the result.

The fresh post-rotation low-health course refused a 250 ms walk before control
assertion. It measured health 5 below the floor of 6, known level landing
geometry, zero ticks, `effect_prevented=true`, zero physical effects, and
released controls. Provenance was valid in
`environment_action_evidence:0c341c9219bd06bdf2369a1993b1124367f343bba`;
the independent actor state is
`environment_probe_evidence:2f08d8183817e72d9934d2e730f57408155e1680`.

The visible Survival inventory contained bread. One bread was moved to the
hotbar and consumed through a bounded local input hold; no command, creative
inventory, teleport, or World Authority mutation was used. The subsequent
actor probe measured food 20 and health 8.83 at the unchanged position in
`environment_probe_evidence:2f04249805d9faa82745ac0514c39a90ab4a9a0c`.

The positive course then passed on the same loaded supported ledge:

- a 200 ms forward walk completed in four game ticks with 0.627 blocks of
  measured motion, a satisfied motion postcondition, and released controls in
  `environment_action_evidence:41f315f12f80e42befe9435f913f9055653aa57ad`;
- the reaction probe independently observed z=2.70 without Y, world, or health
  loss in `environment_probe_evidence:f793908a3fd8b19645c089d19f410931f6eff112`;
- a 200 ms reverse walk returned the actor with the same measured distance and
  released controls in
  `environment_action_evidence:26168ea180617908821510a480886bc2ee5a834d0`;
  and
- the reaction probe observed z=1.84 in
  `environment_probe_evidence:0d4d48cf5aad003dade2198d16e9bccf58ee051f`.

Finally, one admitted `survival_tas` fluid sequence executed six alternating
one-tick supported input segments plus its terminal node. All seven executed
nodes succeeded, retry and deviation counts were zero, no inventory or world
mutation occurred, controls were released, and the sequence completed in 12
client ticks / 610 ms. The exact receipt is
`environment_action_evidence:da660e4fdf5ccbe0e0e83e543696d0277d569fa77`.
The post-course actor probe returned z=1.85, unchanged Y, health 10.83, and valid
provenance in
`environment_probe_evidence:b9a7c288e3987c34e6f0ba30e2848fcd0f0475fb`.

The final sanitized readiness observation remained `ready` with a fresh
heartbeat, zero active workflows, and no asserted controls. The visual checkpoint
is [checkpoint-24-fall-safe-positive-course-return.jpg](../../reports/helix-minecraft/nether-journey-20260825/checkpoint-24-fall-safe-positive-course-return.jpg),
SHA-256
`AA25C9A34DBC903105219AD29888196936890018108EAAB600BE32094ED201FD`.

The repair packet's negative, positive, consecutive-handoff, control-release,
credential-rotation, manifest, and heartbeat evidence is now complete. This
does not prove the Nether result; it makes the harness ready for a clean full
Survival Nether attempt under the separate legitimate-journey packet.

The client was then disconnected through the game menu and closed. Its process
was absent, and after the 30-second heartbeat lease elapsed, sanitized readiness
converged to `state=stale`, `ready_for_actions=false`,
`heartbeat_fresh=false`, zero active workflows, and
`controls_asserted=false`. This closes the shutdown half of the lifecycle test
and preserves the Survival checkpoint for the next goal.
