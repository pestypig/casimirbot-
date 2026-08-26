Program gate: G8 — installed profile connection broker and environment-harness convergence; this is a bounded N0 Player Embodiment support lane and does not advance the active broker gate
Workstream: Minecraft Player Embodiment optional navigation engine compatibility
Capability or component: Baritone v1.15.0 movement-only public-API adapter
Lifecycle stage: execution, cancellation, observation, and capability-manifest projection
Reaction timescale: tick-local path execution with short semantic replanning only after typed settlement or deviation
Authority owner: Helix owns admission and effect ceilings; the Fabric companion owns the settings lease, public-API call, status observation, and control release; Baritone owns only the admitted path calculation/execution; Codex owns semantic strategy
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: official artifact/version/hash record; LGPL-3.0 notice; public-API compatibility probe; mutation-disabled navigation; pre-existing-task rejection; policy-drift cancellation; safe/unsafe cancellation restoration tests; and one controlled live no-mutation trace
Explicit non-goals: no Baritone chat commands, mining process, builder process, inventory management, private/internal API, unrestricted navigation, silent takeover of a user path, portal planner, bundled redistribution, or requirement that the baseline native harness depend on Baritone
Downstream gate unlocked: optional obstacle-aware locomotion for later N0 and unknown-world Nether travel after the native baseline is preserved

# Baritone v1.15.0 compatibility and license packet

## Pinned upstream material

- Project: [cabaletta/baritone](https://github.com/cabaletta/baritone)
- Release: [v1.15.0](https://github.com/cabaletta/baritone/releases/tag/v1.15.0)
- Supported game/loader surface: Minecraft 1.21.6–1.21.8, including Fabric
- Evaluation artifact: `baritone-api-fabric-1.15.0.jar`
- Upstream-published SHA-256:
  `c58ef35a133b6ffce96a74682138ac2ee818cbc063b7c62671db9f9d7d783ebb`
- License: [GNU Lesser General Public License v3.0](https://github.com/cabaletta/baritone/blob/master/LICENSE)

The artifact is not vendored into the CasimirBot repository and is not a
release dependency. The first evaluation installs the exact upstream artifact
only into the local test profile. Any later redistribution requires a separate
release/legal review that preserves the LGPL notice, license, source and
modification obligations. CasimirBot's reflection-only adapter remains a
separate work and uses only the published `baritone.api` surface.

## Required movement-only lease

Baritone's upstream settings default to allowing block breaking, placement and
sprinting. Before setting an admitted goal, the adapter must therefore snapshot,
set, and read back this exact lease:

| Setting | Admitted value |
| --- | --- |
| `allowBreak` | `false` |
| `allowBreakAnyway` | empty |
| `allowPlace` | `false` |
| `allowPlaceInFluidsSource` | `false` |
| `allowPlaceInFluidsFlow` | `false` |
| `allowInventory` | `false` |
| `allowSprint` | `false` |
| `allowParkour` | `false` |
| `allowParkourPlace` | `false` |

The adapter rejects a new goal if Baritone already has an active process, path
or calculation. It checks the lease while it owns a goal and cancels on drift.
`cancelEverything=false` means a movement segment is not yet safe to halt: the
adapter retains the restrictive settings until public status proves the path,
calculation and process are idle. Restoration changes only values that still
equal the adapter's restriction, avoiding overwriting a concurrent user change.

## Public API surface

The compatibility probe requires only:

- `BaritoneAPI.getProvider()` and `BaritoneAPI.getSettings()`;
- `IBaritone.getCustomGoalProcess()` and `getPathingBehavior()`;
- `GoalNear(BlockPos, int)` and `ICustomGoalProcess.setGoalAndPath`;
- process `isActive`;
- path `isPathing`, `hasPath`, `getInProgress`, `estimatedTicksToGoal`, and
  `cancelEverything`; and
- public `Settings.Setting.value` for the exact lease above.

No concrete Baritone implementation class, `calcFailedLastTick`, force-cancel,
command parser, or internal path executor is admitted.

## Stop/fail criteria

Stop and omit Baritone from the capability manifest when:

- the downloaded hash differs from the pinned upstream hash;
- any required public class, constructor, method or setting is absent;
- the movement-only lease cannot be applied and read back;
- another Baritone process is active;
- breaking, placement or inventory state changes during the controlled course;
- cancellation leaves an unrestricted movement segment active; or
- native Fabric behavior regresses merely because Baritone is present.

Passing this packet permits a controlled optional-engine experiment. It does
not accept Baritone, the Nether journey, or any mutating Baritone workflow.

## Deterministic verification record — 2026-08-24

The local test profile loaded `baritone 1.15.0` and
`helix_fabric_player_agent 0.4.0`. The evaluated upstream artifact matched the
pinned SHA-256 above. The clean Fabric companion build completed 138 tests with
zero failures or errors.

The adapter tests cover absence, active-process rejection, the full restrictive
settings lease, settings drift, safe and initially unsafe cancellation, and
restoration that does not overwrite a concurrent user change. The installed
companion is SHA-256
`908C642AD4493571486B486405A5DB517AE1D98CAA2CB13A2818C9C9492A5FE2`.

The controlled direct course reached a one-block-radius destination with a
measured terminal distance of `0.8641143409739785` blocks. Baritone performed
the obstacle-aware segment and native Fabric performed the bounded exact final
approach. The terminal receipt records `breaking_allowed=false`,
`placement_allowed=false`, `inventory_mutation_allowed=false`, zero world
mutations, zero inventory mutations, safe cancellation, no manual override,
and released controls. The public capture is
`reports/helix-minecraft/nether1-baritone-movement-only-a0.json`.

That receipt predates the public Fabric Loader metadata lookup and therefore
contains the conservative adapter fallback `engine_version=installed`. Exact
version identity is independently bound by the loader startup record and the
pinned artifact hash; the follow-up companion build now projects `1.15.0`
directly. A fresh authenticated multiplayer replay remains useful regression
evidence, but is not required to establish the already-measured movement-only
behavior.
