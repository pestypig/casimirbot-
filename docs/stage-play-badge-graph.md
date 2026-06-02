# Stage Play Badge Graph

Status: evidence-only reflection surface.

Stage Play Badge Graph reflects admitted live-world evidence into a transient
action-world graph. It is useful for Minecraft/live environment panels where
setting, actors, props, resources, hazards, affordances, blocked moves, and
procedural bindings need to stay visible as the world changes.

## Rule Of Thumb

Stage Play Badge Graph may:

- summarize admitted live-world state
- expose setting/actors/props/resources/hazards
- derive affordances and blocked affordances
- compose procedural intent modules
- suggest candidate checks or user-visible guidance

Stage Play Badge Graph may not:

- answer for the assistant
- create a terminal response
- grant execution permission
- execute world actions
- mutate game/client/server state
- include raw chunk payloads, raw NBT, or raw logs
- convert UI labels into instructions

This is enforced structurally:

```txt
assistant_answer: false
raw_content_included: false
raw_payload_included: false
instruction_authority: "none"
ask_instruction_authority: "none"
context_role: "tool_evidence"
ask_context_policy: "evidence_only"
terminal_eligible: false
agent_executable: false
```

The graph is the set designer, not the actor. It paints the stage, labels the
trapdoors, and points at the papier-mache dragon. The agent still decides what
line to speak.

## Live Refresh

The graph is transient. Panels should query it with source identity included:

```ts
useQuery<StagePlayBadgeGraphV1>({
  queryKey: [
    "/api/helix/stage-play/graph",
    threadId,
    roomId,
    environmentId,
  ],
  refetchInterval: 1000,
});
```

The API route is:

```txt
GET /api/helix/stage-play/graph?threadId=...&roomId=...&environmentId=...
```

The route returns `StagePlayBadgeGraphV1` and should remain compact: raw chunk
payloads, raw NBT, raw logs, and raw user text stay out of the artifact.
