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
