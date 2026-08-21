# EH parallel work packet: Minecraft in-game Ask v1

Program gate: G3 remains active; this packet is a parallel room/interaction delivery lane.
Workstream: Minecraft in-game Helix request and presentation surface.
Capability or component: `/helix ask`, `/helix status`, `/helix cancel`, and local `/helix emergency-stop` in the Fabric player companion.
Lifecycle stage: request (primary), with admission, reasoning, terminal authority, and presentation continuity.
Reaction timescale: short semantic replanning; Emergency Stop remains an immediate local control operation.
Authority owner: Runtime Codex owns semantic reasoning and completion; Helix owns participant/player/room/world identity, permission, evidence, and terminal eligibility; Fabric owns command registration and chat presentation.
Current maturity: live accepted for one keyed local natural prompt.
Target maturity: live accepted; retain as a regression while G3 remains active.
Required evidence: dedicated request credential isolation; exact paired identity; one ordinary `/api/agi/ask/turn` lifecycle; authoritative answer or actionable typed failure in Minecraft chat; the same room-thread turn retained for room clients; deterministic/adversarial tests; Fabric build; applicable Helix Ask discipline/parity checks.
Explicit non-goals: no private model loop, prompt-to-command classifier, authority expansion, sensor/action credential reuse, G3 persistent viability claim, G4 wake control, durable goals, concurrent reasoning roles, learned controller, host shell, files, processes, RCON, or credentials.
Downstream gate unlocked: none; G3 remains independently active.

## Contract

Minecraft chat is an input and presentation client for the normal room-scoped
Helix Ask turn. The command text is not interpreted by Fabric and does not
become an action by lexical matching:

```text
/helix ask <natural language>
  -> dedicated participant/request credential
  -> exact room, participant, player, source, world and connector epoch
  -> ordinary Helix Ask/Codex turn
  -> admitted tools and current observations
  -> Codex final candidate or typed failure
  -> Helix terminal authority
  -> Minecraft chat plus retained room-thread presentation
```

The request credential is issued beside, but is cryptographically and
semantically separate from, the player-action credential. It may submit,
inspect, or cancel only the paired participant's bounded Ask request. It may
not poll actions, submit observations, issue Minecraft commands, widen a lease,
or expose any credential through chat, logs, model context, MCP, or debug
exports.

`/helix emergency-stop` remains local-first. It releases controls immediately
and then uses the existing governed Emergency Stop handoff when a paired action
runtime is available. It does not wait for a model response.

## Failure behavior

Unpaired, expired, revoked, stale-epoch, wrong-room, wrong-world,
wrong-player, missing-scope, duplicate/conflicting, disconnected, and canceled
requests return stable typed failures. A successful HTTP response is not
success by itself: only the terminal product selected by canonical terminal
authority may be displayed as an answer.

## Live acceptance evidence — 2026-08-21

The keyed local acceptance used the ordinary Minecraft command surface, not a
diagnostic substitute:

```text
/helix ask Use the live Minecraft environment to report my current health only.
```

The exact retained turn was
`ask:minecraft_ingame:6e01c63f-486d-4175-a9cd-f007983c629a` under room thread
`helix-ask:room:shared_realtime_room:1ac9e158-c650-4644-8485-29974d406ef7`.
Codex selected and executed
`com.casimirbot.minecraft.actor.status.read`; the resulting observation carried
`environment_probe_evidence:0648cd390d3f1b9ab11879f18c9d442831c10c7e`, was
marked nonterminal and re-entry-required, and re-entered before completion.
Minecraft chat displayed the authoritative terminal answer:

```text
Helix: Health: 20/20
```

The terminal record was `final_answer` / `model_synthesized_answer`; canonical
terminal authority was server-authoritative and eligible. The lifecycle
differential audit passed all 15 continuity checks with zero mismatches and no
first divergence. The room-thread journal retained start, terminal, and
completion checkpoints for the same turn and reported the latest status as
`completed`.

Two shared lifecycle defects were exposed and repaired during acceptance:

- Exact server hard-capacity rejections such as `memory_hard_pressure` are now
  projected as actionable typed failures. The projector reconstructs text only
  from the exact server admission envelope; provider-shaped free text cannot
  spoof terminal authority.
- A slow Codex step no longer converts ordinary room-presence aging into false
  consent revocation. An authenticated in-game turn refreshes only its exact
  room/profile membership immediately before a probe. Explicit leave, room
  closure, participant mismatch, and consent changes still fail closed.

Targeted acceptance regressions cover both repairs, including spoofed admission
payloads and rejected membership refresh. This work does not advance or claim
G3 persistent viability; it remains a parallel interaction-delivery result.
