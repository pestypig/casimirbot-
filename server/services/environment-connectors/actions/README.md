# Environment connector action lane

This namespace owns durable policy and transport for the provider-neutral
`room.environment.act` contract. It is separate from the Minecraft server
command broker because a player workflow can remain active, publish progress,
detect manual input, and be canceled without becoming a sequence of replayable
server commands.

The shared lifecycle and safety schemas live in
`shared/helix-environment-action.ts`. Minecraft capability arguments live in
`shared/helix-minecraft-player-capabilities.ts`. The architecture contract is
`docs/architecture/helix-minecraft-dual-plane-adapter-v1.md`.

Implementation in this namespace must provide:

- separately paired action authority and a connector-only credential;
- exact room/source/world/member/player and connector-epoch admission;
- idempotent request creation without automatic replay;
- outbound polling, progress submission and one settled result;
- cancellation, manual-override and emergency-stop transport;
- current-turn result-observation re-entry and postcondition evidence.

It must not sample a model, choose goals, privately retry ambiguous effects,
write terminal prose, reuse observation or command credentials, or expose host
shell/files/processes/credentials. The gateway may publish the reviewed action
contracts, but an execution remains unavailable unless the exact room authority
has a current paired client manifest, heartbeat and catalog snapshot. Optional
engines remain absent from the live client manifest until the running connector
discovers and declares them. Fabric player-agent `0.2.0` implements the six
bounded reusable workflows; their terminal action events must include the
measurements Helix validates against the admitted arguments and side-effect
ceilings before success can re-enter Codex.

`workflow-differential-audit.ts` is an observer-only comparison of normalized
public direct-Codex and Helix workflow traces. It may report the first divergent
stage, but it cannot admit, retry, rewrite, approve or terminalize an action.
The trace retains final observation refs and their support continuity through
the Codex candidate, provider route product and single terminal writer. These
stage hashes are hashes of the same canonicalized public answer text, not of
private reasoning or structurally different envelopes. A missing re-entry in
both lanes is still a lifecycle defect; symmetric omission cannot produce a
passing audit.
