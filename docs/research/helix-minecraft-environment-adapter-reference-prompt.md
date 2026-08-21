# Helix Minecraft environment-adapter reference prompt

Use this packet when planning or reviewing Minecraft environment-adapter work.
It is a reference directory, not an instruction to copy another project's code
or replace Helix identity, provenance, authority, evidence, or terminal gates.

## Goal reference directory

These are the three direct comparison targets for the active goal:

- Minecraft-God-AI:
  <https://github.com/Michael-Andrzejewski/Minecraft-God-AI>
  - Study its Mineflayer embodiment, agent-to-game action loop, task examples,
    and creative Minecraft-command path.
- Pathmind client automation:
  <https://github.com/soymods/pathmind>
  - Runtime structure: `docs/node-architecture.md`
  - Sensor limits: `docs/sensor-range-and-loaded-chunks.md`
  - Treat its All Rights Reserved source as architecture research only; do not
    copy, modify, or redistribute it without permission.
- OpenAI Codex reference implementation:
  <https://github.com/openai/codex>
  - Prefer the ignored, read-only local comparison checkout at
    `external/openai-codex-compare` when present.
  - Do not mutate or commit that checkout as part of Helix work.

Additional server-authority reference:

- Minecraft GPT God plugin:
  <https://github.com/YOUSY0US3F/minecraft-gpt-god-plugin>
  - Event stream and compaction: `EventLogger.java`
  - Current situation digest: `ServerInfoSummarizer.java`
  - Typed actions and server-command fallback: `GptActions.java` and
    `GenerateCommands.java`

Optional clean-room companion-embodiment reference:

- Verity JE official project:
  <https://modrinth.com/mod/verity-je-official>
  - The official metadata identifies a Forge 1.20.1 client-and-server mod,
    Groq-backed AI assistance, and an All Rights Reserved license. Modrinth
    currently publishes no official source-repository URL for this project.
  - Pin any behavioral comparison to an exact published artifact. The
    `v5.7.4` primary artifact is `verity-5.7.4.jar`, with official Modrinth
    SHA-512
    `1e9ccc1a5166112d96213e0f44d1dbb607d6dc7418b0b99c871ec00b6a07722c7072477864134113431253837727e36592f9d8fa1b298bde3f6e70f5a4e34f3c`.
  - Study only public behavior and general clean-room patterns: a distinct
    embodied actor, semantic mode selection followed by local persistent
    behavior, pathfinding hysteresis, event coalescing, asynchronous semantic
    work, authoritative-thread effects, spatial presentation, and tool-result
    re-entry.
  - Do not copy or redistribute its code, decompiled implementation, models,
    textures, sounds, archives, prompts, or other assets. Third-party source
    mirrors are not an implementation dependency or authority for CasimirBot.
  - CasimirBot's projected `companion_entity` must add exact actor/owner/
    beneficiary identity, finite leases, bounded chunk activity, a trusted
    local arbiter, canonical proposal-to-effect evidence, manual override, and
    Emergency Stop. Verity is comparative evidence for the product pattern,
    not acceptance evidence for those guarantees.
  - The clean-room CasimirBot target and its lifecycle acceptance cases are
    `docs/architecture/helix-minecraft-companion-embodiment-v1.md`.

## Required development order

For every new Minecraft objective family, run two separate validations:

1. **Reference capability proof:** let Codex use the consented local Minecraft
   command/capability surface directly, discover a practical procedure, and
   record executed calls, observations, preconditions, postconditions,
   cancellation, retries, and bounded failures.
2. **Governed Helix parity:** convert the proven behavior into provider-neutral
   capabilities and observation contracts, restore an equivalent starting
   state, and submit the same natural prompt through Helix.

If the reference run fails, improve Minecraft mechanics access, sensors,
documentation, or the connector before changing Helix. If the reference run
succeeds and Helix fails, locate the first adapter divergence. Never encode the
reference prompt or its one successful command sequence as deterministic
adapter reasoning.

## Automated local rebuild and live-proof handoff

When the operator explicitly delegates the local cycle while away, the test
agent should complete the mechanical handoff without repeatedly asking the
operator to close, relaunch or direct-connect Minecraft:

1. Verify the exact Fabric dedicated server is listening on loopback, record
   host memory pressure, and distinguish its `java` process from the Minecraft
   client `javaw` process. Never stop every Java process.
2. If the client has the connector JAR loaded, request a normal window close
   for that exact verified client and wait. Force-stop only that same PID if
   the operator expressly delegated shutdown and the graceful close does not
   complete. The dedicated world server remains running.
3. Stop a keyed CasimirBot process only through its already-owned terminal
   session. Restart it only with the opaque `start-myapp-for-codex` launcher;
   never inspect the launcher, credentials, environment blocks or
   secret-bearing process command lines.
4. Run the narrow Fabric controller/scheduler regression first with the
   repository's Java 21 toolchain and one low-memory Gradle worker. Build the
   mod only after it passes. Do not overlap Gradle, Vitest and keyed-server
   startup under memory pressure.
5. Replace only the exact installed
   `HelixFabricPlayerAgent-0.4.0.jar`, then require the installed length and
   SHA-256 to equal the newly tested artifact before launch.
6. Start and connect the selected Fabric 1.21.8 profile with the existing typed
   workstation launcher:

   ```powershell
   npm run helix:minecraft:launch-fabric-loopback -- --Address localhost:25565
   ```

   This path identifies the rendered launcher Play control, stages the bounded
   one-shot loopback auto-join inbox, closes only the launcher UI after the
   client starts, and returns a
   `helix.minecraft.workstation_launch_receipt.v1`. Do not substitute guessed
   screen coordinates, raw Minecraft arguments, account tokens or launcher
   command-line inspection. The locator must derive a complete button region
   from the current rendered window and click its center; a coordinate, scan
   line or edge fragment learned from an earlier resolution is not a durable
   control identity. Validate locator changes against at least one captured
   launcher image with a different size or DPI before relying on unattended
   startup. Reject a stale `Minecraft game output` window as a launcher target;
   after verifying its exact title/process, close that stale output window and
   reacquire the real launcher. If the display size changes, rescan the complete
   green Play band and click its current center instead of reusing a prior
   coordinate that can drift toward the button's left edge.

   The 2026-08-14 unattended rehearsal proved this whole path after a display
   geometry change: the locator selected the current Play center, launched the
   Fabric 1.21.8 profile, observed the Helix mod-load marker, staged auto-join
   and returned `status: connected` with `credentials_exposed: false`. The
   receipt then reported 97.2% host memory because protected Windows File
   History was simultaneously consuming about 1.45 GB. The operator stopped
   only the receipt-identified Minecraft client, retained both Fabric and
   Helix servers, and returned memory to 83.6%. A correct launch receipt does
   not override the independent memory safety boundary.
7. Treat an established client TCP connection, the Helix mod-load signal, an
   admitted manifest and a fresh heartbeat as readiness. A Play click, a
   running process or an authority lease alone is not readiness.
8. Restore the exact bounded fixture, run one natural keyed Ask prompt, capture
   its exact-turn evidence/debug artifacts, and clean up or heal the fixture.
   Compare connector reaction time separately from provider deliberation and
   terminal-materialization time.

Do not start the provider request and an active-workflow watcher inside one
`Promise.all`-style wait and then inject the fixture event only after the whole
batch returns. The longer provider wait can hide the earlier readiness signal
and make the perturbation arrive after execution. Start the watcher first,
start the provider request independently, wait on the watcher alone, apply the
event immediately when it reports persistent active controls, and then wait on
the provider result. Hold the changed state until the workflow releases its
controls unless the scenario explicitly requires a pulse.

If memory reaches 90%, pause new heavy work and remove duplicate test/runtime
processes. At 95%, stop the active heavy phase and preserve the dedicated world
and artifacts before continuing. These thresholds are operational safety, not
permission for Helix to change Codex's reasoning or answer.

Treat an unexpected `fhmanagew.exe` launch as Windows File History pressure,
not as a failed Helix or test process. Close it only when the current account
owns that exact process. If Windows runs it under the protected `fhsvc` service
and denies a normal close, do not disable or escalate against the service. Stop
the exact Minecraft client before the 95% boundary, preserve the dedicated
server and evidence, and relaunch through the typed workstation launcher after
memory recovers.

## Diagnostic interposition and act-only continuity

A retryable failed mutation may need a fresh read before Codex can author a
better retry. Helix may admit one already-admitted non-mutating diagnostic such
as actor status, inventory or bounded spatial inspection between the failed
mutation and its repair. This is evidence gathering, not substitution:

- the failed semantic operation remains unsatisfied;
- the diagnostic observation must re-enter Codex;
- an act-only continuation must force another model-authored capability request
  even when no deterministic `next_admissible_affordance` exists;
- Helix may admit the repaired original mutation, but may not silently switch
  to a different mutating sibling; and
- a later physical failure becomes the next `last_attempt` and must re-enter
  Codex while continuation budget remains.

This diagnostic opening does not apply when a trusted reactive-graph contract
rejection identifies only structural invariants before current game state could
affect the outcome. Another actor, inventory or world read cannot repair its
resource declarations, graph topology, unique IDs or mutation ceilings.
Re-enter the exact typed invariant and keep the next model decision on a
corrected request for the same capability. A generic missing executable input
may still justify a read when that world observation can supply the input, and
genuine execution failures remain free to use admitted diagnostics.

The water-bucket fixture established two regression receipts. Attempt 63 showed
Codex requesting `actor.status.read` and then `inventory.check` after a rejected
guardian graph; a stale post-observation branch incorrectly rejected both
diagnostics. Attempt 64 admitted `spatial_region.inspect`, re-entered its fresh
225-column geometry, and preserved the guardian requirement. The next guardian
still timed out accurately because the authored graph contained placement but
no locomotion: zero motion, zero placement, zero mutations, full health and all
controls released. That is a connector/control failure to repair through the
next Codex decision, not evidence for an answer or permission for a hidden
adapter strategy.

## Semantic completion is not workflow settlement

Keep three outcomes distinct throughout itinerary execution, continuation and
terminal review:

1. the connector accepted and durably settled a workflow;
2. a safety interrupt or manual override was handled correctly; and
3. current-turn measurements prove the player/world action requested by the
   user actually occurred.

The first two are valid evidence and must remain in provenance. They do not, by
themselves, satisfy a Player Embodiment action subgoal. When the canonical
Minecraft action-result envelope is present, its measured semantic effects are
authoritative: player motion or interaction, inventory/world mutation,
successful action receipts, goal-specific satisfied checkpoints, or a
goal-specific evidenced postcondition. Generic postconditions such as
`minecraft.player.reactive_program_completed`, workflow settlement, or control
release only prove lifecycle closure. They cannot turn a zero-action safety
settlement into task completion.

If semantic evidence remains missing, Helix must retain the completed transport
receipt, leave the subgoal pending, and return that exact observation to Codex
for a repaired model-authored request. It must not approve an answer, invent a
strategy, erase the attempt, or rewrite the connector result as a failure.

Attempts 65 through 67 provide the regression sequence. Attempt 65 exposed an
act-only continuation review that counted reviews without sampling Codex.
Attempt 66b proved the repaired reviewer made twelve real model decisions but
hit the outer request timeout. Attempt 67 settled and produced an honest final
candidate, but an immediate tick-zero safety interrupt executed no actions,
motion, interaction, placement, or mutation. The old itinerary projection
incorrectly cleared the guardian subgoal from the transport `succeeded` label.
The corrected rule keeps that exact receipt as evidence while requiring Codex
continuation until semantic action evidence or an accurate typed terminal
failure exists.

Attempt 68 proved that correction against the live keyed path: the same
transport-settled/no-effect result no longer satisfied the semantic action
subgoal, and the turn continued through multiple model-authored repairs before
ending in an accurate bounded failure. Its next first divergence was the
reactive graph itself. A required placement lane used a 20-tick wait while the
concurrent walk requested 1,200 ms (normally 24 scheduler ticks), so the
placement lane reached `abort_no_target` before a usable trajectory existed;
`all_required` then canceled the unfinished work. The provider-neutral timing
contract is therefore explicit: wait/timeout windows begin when their node is
entered, action durations consume approximately `ceil(duration_ms / 50)`
Minecraft ticks, and any failed, timed-out or canceled required lane settles an
`all_required` program as failure. Live bindings such as
`predicted_collision_cell` resolve at action execution time. A model-authored
graph should first wait for a measured trajectory-producing transition, then
for the relevant short-horizon collision condition, and only then execute the
bound placement. These are scheduler semantics and repair evidence, not a
hardcoded rescue strategy.

Attempt 70 isolated the next model-visible mechanics gap. Minecraft reported
the stationary grounded player with `Motion.y = -0.0784`, while the authored
fall event used `vertical_velocity_at_most: -0.01`. The event therefore fired
before the player left the platform. The following live placement action
acquired its declared camera, locomotion, hand, inventory, world and workflow
resources while waiting for a usable below-actor collision cell, starving the
concurrent walk lane; both timed out with zero completed actions and zero world
mutations. After several typed failures and diagnostic reads, a later candidate
was rejected at the hard continuation-step ceiling. The general correction is
to expose mechanics semantics before sampling: grounded vanilla motion may
retain a small negative delta-y, `predicted_collision_within` can see the
immediate support collision, and landing-sensitive actions must be gated behind
measured airborne or materially downward state (for example grounded false or
a descent threshold near `-0.25`) before they acquire shared resources. Helix
still does not author the graph; Codex chooses the action, threshold and repair
from current evidence.

Attempt 71 then completed the unchanged keyed request through the normal Helix
runtime. Codex repaired its own earlier candidates, authored one bounded
sequential guardian lane plus an interrupt-only health lane, walked off the
platform, observed `player_grounded: false` and vertical velocity at or below
`-0.25`, resolved one reachable `predicted_collision_cell`, placed exactly one
`minecraft:water` source with `item_use`, changed the held item from
`minecraft:water_bucket` to `minecraft:bucket`, preserved `20/20` health and
released every resource. The fresh observation re-entered Codex and its
grounded Markdown synthesis survived terminal authority. The original live
probe nevertheless labeled the run FAIL because it required a separate
`predicted_collision_within` condition node. That verifier rule was narrower
than the capability contract: the action-time placement forecast already
proved an applicable, reachable collision target and the successful placement
receipt proved the mutation. Acceptance now permits either the explicit
condition observation or that stronger verified binding path; an inapplicable,
unreachable or unmutated forecast still fails closed.

Attempt 72 showed why a single success is not a latency or reliability claim.
The same prompt spent roughly 501 seconds across repeated validator repairs and
ended in an accurate `solver_continuation_pending` failure without a placement.
Codex eventually corrected the fall threshold and place-resource set, but it
also took actor, inventory and spatial reads after validator-only failures,
repeated forbidden graph cycles, reused node IDs, and split causally ordered
shared-resource work into competing required lanes. None of those reads could
repair the rejected graph. The provider-neutral correction is twofold: expose
the graph rules on every repair turn, and do not offer world diagnostics for a
pre-execution validation error. Ordered shared-resource work should remain in
one causal required lane; parallel lanes are for genuinely compatible work or
interrupt-only watchers. Polling uses bounded checkpoint, event, maintain or
repeat nodes, never a branch self-cycle, and node/interrupt IDs are globally
unique.

## Reactive guardian settlement and first-divergence proof

Emergency reaction has two separate latency budgets. Codex may take seconds or
minutes to interpret a natural goal and author a bounded resident program.
After admission, the Fabric scheduler must observe and react on Minecraft's
local tick loop without waiting for another remote model turn. Terminal Codex
synthesis may happen later and must describe the resulting evidence rather than
control the already-settled emergency.

Attempt 71 measured that separation concretely. The full natural keyed turn
took about 243 seconds because Codex authored and repaired several candidates,
while the admitted successful Fabric program completed in 18 scheduler ticks
(about 0.9 seconds at 20 TPS). The local reaction path is therefore already
sub-second once admitted; the dominant remaining latency is provider graph
authoring and continuation, followed by terminal synthesis. Report those
numbers separately. Do not hide minutes of preparation behind the connector's
tick latency or blame the tick scheduler for provider deliberation.

An admitted interrupt is not a failed task merely because it intentionally
cancels required work. For an `all_required` guardian program, treat the result
as a handled interrupt only when fresh execution evidence proves all of the
following:

- the exact admitted interrupt condition became true;
- its exact interrupt-only lane reached an explicit terminal node;
- at least one required active lane was canceled by that interrupt;
- every other required lane either succeeded or was canceled by the same
  interrupt; and
- all controls were released.

The connector may then report `reactive_program_interrupted` and the exact
settled interrupt identity as a successful execution observation. Helix still
validates identity, consent, scope, provenance, evidence shape and terminal
eligibility. The receipt remains an observation, not an assistant answer;
Codex owns the final explanation after current-turn re-entry. A forged,
unobserved, mismatched or incomplete interrupt remains a hard evidence failure.

When behavior is unclear, use the same fixture on three surfaces:

1. **A0 — Fabric direct diagnostic:** proves the local controller, condition,
   physical effect, cancellation and control release without Helix admission.
2. **A1 — Codex through Helix MCP:** proves room/account authority, broker
   admission, delivery, evidence normalization and re-entry without Helix Ask
   prompt or terminal projection.
3. **B — Helix Ask/Shared Live Room:** proves natural-language admission,
   Codex continuation, exact observation re-entry, final-candidate survival and
   terminal authority.

Repair the first surface that diverges. Do not add a prompt-specific strategy
or a downstream answer writer to conceal an earlier lifecycle contradiction.

## Copyable goal prompt

> Before editing, read
> `docs/research/helix-minecraft-environment-adapter-reference-prompt.md` and
> compare the current Helix Minecraft server connector and Helix Ask lifecycle
> with Minecraft-God-AI, Pathmind, and openai/codex. Use Minecraft-God-AI to
> study agent embodiment and creative command use; use the GPT God plugin to
> study semantic event summaries, compact situation context, typed actions, and
> command fallback; use Pathmind only to study validated client-side workflows,
> sensors, progress, cancellation, and manual override; and use openai/codex as
> the reference for model-owned tool selection, execution-result re-entry,
> retries, and completion. Preserve Helix ownership of identity, permission,
> provenance, evidence quality, route authority, and terminal eligibility.
> Prove each new practical operation with direct reference Codex first, freeze
> the public execution trace as a capability benchmark, then run the same
> natural prompt and equivalent starting state through Helix. Helix may admit,
> normalize, verify, re-enter repairable rejection, or fail closed at a genuine
> hard boundary; it must not replace Codex semantic step choice or supported
> final synthesis with deterministic adapter prose.
> Maintain separate World Authority and Player Embodiment planes behind one
> provider-neutral environment capability catalog. Do not generate or execute
> host code, do not copy Pathmind source, do not grow the retired
> `server/routes/agi.plan.ts`, and diagnose failures by the first differential
> lifecycle divergence rather than by prompt-specific patches.
