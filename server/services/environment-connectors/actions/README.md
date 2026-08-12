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

`workflow-differential-trace-capture.ts` supplies the missing normalization
step for real acceptance evidence. It accepts only operator-selected public
lifecycle facts, explicitly rejects hidden-reasoning claims, hashes structured
fixture/argument/progress values canonically, and emits the existing
non-authoritative differential trace contract. Every capture must retain at
least one exact public source-artifact ref and receives a canonical capture
hash, so a later edit cannot remain silently attached to the older trace
identity. Use
`npm run helix:minecraft:player-trace -- --input <public-capture.json> --out
<trace.json>` for each lane before running the observer audit. A schema-valid
operator example lives at
`docs/runbooks/fixtures/helix-minecraft-player-differential-capture.example.json`;
its placeholder refs/text are never acceptance evidence and must be replaced
from the exact turn without backfilling a missing stage from a later one.

For the Fabric client's local reference controller, first run the bounded
`/helix-player diagnostic ...` action, then use
`npm run helix:minecraft:player-direct-capture -- --log <latest.log> --prompt
<semantic-request> --out <public-capture.json>`. The parser selects one exact
diagnostic workflow, requires its terminal controller event, retains starting
state plus normalized progress, and labels admission and terminal authority as
`not_applicable`. It does not write a Helix observation or assistant answer.
