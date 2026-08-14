# Helix Minecraft fluid execution audit — 2026-08-12

Status: implementation and deterministic verification complete for the 0.3
fluid-sequence increment; direct-Codex, keyed-Helix and Shared GPT Live runtime
acceptance remain open. This document must not be cited as live completion
evidence until the pending rows have exact public artifacts.

## Scope and ownership boundary

The increment adds one provider-neutral Player Embodiment capability:

```text
com.casimirbot.minecraft.player.sequence.execute
```

Codex owns objective decomposition, route/resource/crafting strategy,
typed-program generation, result interpretation, replanning and final
synthesis. Fabric owns deterministic 20 Hz execution and immediate condition
evaluation. Helix owns exact identity, capability/ruleset/engine admission,
finite leases, mutation ceilings, provenance, evidence identity and terminal
eligibility. No new planner or answer writer was added to Helix, and the
retired `server/routes/agi.plan.ts` was not grown.

`survival_tas` is executable through Player Embodiment. The contract names but
does not admit `command_assisted_sandbox`, which requires separately governed
World Authority, or `copilot_speedrun`, which is guidance-only. The sequence
cannot contain arbitrary code, Minecraft commands, host shell, files, RCON,
process control, URLs or credentials.

## Implemented contract

- one finite acyclic graph with 2–256 nodes and a maximum 36,000 world ticks;
- tick-addressed look, sprint/walk, jump, use and hotbar input segments;
- embedded navigate, look, walk, jump, interact, hotbar, equip, follow,
  collect, mine, place, craft and inventory-transfer nodes;
- whitelisted branches/checkpoints over tick, pose, health/food, position,
  inventory/resources, equipment/tools, focus/reachability, exact block state,
  dimension, nearby portal, bounded hazards, recipe craftability, prior node
  outcome and checkpoint progress;
- explicit mutation regions, block allowlists, mutation/transfer ceilings and
  `combat_allowed=false`;
- manual override, cancel, disconnect, timeout and emergency-stop propagation
  through the existing production controller;
- exact scheduler ticks and separately measured wall-clock time;
- executed node/checkpoint identities, per-node outcomes, deviations, retries
  and inventory/world-effect counts; and
- changed-condition observations capped at 512. Helix validates shape,
  admitted node/condition identity, count, monotonic bounded ticks and rejects
  repeated unchanged values.

The direct-reference starting-state record now includes current pose, health,
food/saturation, dimension, aggregated inventory counts, equipped items,
focus type/distance/reachability, bounded nearby hazard types, nearby portal
kinds and available crafting-grid size. It contains no raw NBT and has no
assistant-answer authority.

## Current deterministic evidence

| Requirement | Evidence | Verdict |
| --- | --- | --- |
| Shared sequence/ruleset/graph/scope contract | `server/__tests__/minecraft-fluid-sequence-contract.test.ts` | 8/8 passed |
| Gateway, sequence and frozen profile/catalog integration | three focused Vitest files, one worker | 22/22 passed |
| Fabric scheduler, embedded production actions, branches, manual override and emergency stop | `FluidSequenceEngineTest.java` plus the full Fabric Gradle suite | passed |
| Fabric client build | Java 21, one worker, `build --no-daemon` | passed |
| Installed local artifact | `HelixFabricPlayerAgent-0.3.0.jar`, SHA-256 `3420E6C8DE37ECE44340269A0AA84BF7640886A334031E5908135FB56AA98A85` | build/install hashes matched |
| Local direct authority | persisted non-secret `full` scope; no staged stale request at inspection | ready, not executed |
| Fabric server | `localhost:25565` listening during preparation | ready at inspection |
| Host resource discipline | builds serialized; 90% soft pause and 95% stop retained | followed |
| Helix Ask ownership classifier | `npm run helix:ask:discipline:quick` | static checks passed; receipt/terminal warnings retained for review |

Earlier dual-plane workflow and gateway matrices remain regression evidence,
but they do not prove this new composite capability live. A new live artifact
is mandatory.

## Required runtime acceptance still open

1. Join the rebuilt 0.3 client to the local Fabric server.
2. Capture a direct-Codex inspect–act–verify micro-course requiring look,
   sprint/walk, timed jump, reachable interaction, equipment/hotbar plus
   inventory or crafting work, a state-driven branch and verified checkpoints.
3. Capture the one-action-per-turn baseline from equivalent starting state and
   compare exact world ticks, wall time and remote round trips.
4. Preserve a natural typed failure, manual interruption, cancellation and
   emergency-stop proof with `controls_released=true`.
5. Restart keyed CasimirBot only through the opaque launcher if its current
   process is not the rebuilt source, create or refresh the exact 0.3 room
   authority/pairing, and replay the identical natural prompt.
6. Compare direct and Helix public traces at request, admission, execution,
   normalized observations, evidence re-entry, later Codex candidate, route
   product, terminal writer and visible text/voice hashes. Repair the first
   shared-contract divergence, never prompt wording.
7. Run the applicable discipline, API parity, production build and Casimir
   adapter-verification gates, then attach their current verdicts.

## Explicit limitations

- The 0.3 native engine is a bounded client controller, not a full-game bot or
  unrestricted program runtime.
- Baritone remains optional and unavailable unless the exact client manifest
  discovers and declares it.
- Long-distance unknown-terrain routing, projectile prediction, richer mod
  GUIs/components, arbitrary recipes and autonomous combat are not proven.
- The sequence controls only the exactly paired player. A second player needs
  a separate participant/player binding and authority.
- World Authority commands remain a separate capability and credential plane;
  this sequence cannot silently escalate into them.
- Unit/build success does not prove observation re-entry, terminal authority,
  Shared GPT Live voice relay, or user-perceived fluidity.

## Release verdict

Not release-ready yet. The implementation is materially closer to the intended
fluid agent experience, but the core product claim depends on the direct and
keyed live micro-course plus text/voice parity. Until those artifacts exist,
the honest status is **deterministic implementation passed; live acceptance
pending**.
