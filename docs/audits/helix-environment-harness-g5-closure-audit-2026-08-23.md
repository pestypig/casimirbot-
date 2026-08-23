# Helix environment harness G5 closure audit — 2026-08-23

Program gate: G5 — Durable survival goal
Workstream: Minecraft durable objective persistence and authorized continuation
Capability or component: Canonical environment-goal ledger, recovery, Runtime Codex reconstruction, and participant-scoped continuation
Lifecycle stage: execution evidence → normalization → re-entry → follow-up reasoning → terminal authority → presentation
Reaction timescale: durable planning; Fabric retains tick reflex and G4 retains semantic wake
Authority owner: Runtime Codex owns strategy and synthesis; Helix owns identity, grants, evidence integrity, and terminal eligibility; Fabric owns admitted local effects
Current maturity: integrated accepted
Target maturity: integrated accepted
Required evidence: hash-linked milestones and recovery; current evidence re-entry; keyed natural report; exact terminal continuity; authorized second-participant continuation; no unclaimed action or voice delivery
Explicit non-goals: G6 concurrent roles, learned control, generic resident extraction, arbitrary commands, private Helix reasoning loops, or growth of retired `server/routes/agi.plan.ts`
Downstream gate unlocked: G6 — Concurrent reasoning roles

## Verdict

G5 is **closed** for the provider-neutral durable Minecraft goal lifecycle. The
canonical goal
`environment_durable_goal:874d1e25-c0a5-4763-add2-c979ba530032` completed at
revision 19 after consuming G4 wake evidence, recording a material
stop-movement replan, recovering across a connector-epoch change, verifying
restored viable control, and completing all three milestones. Runtime Codex
later reconstructed and explained that ledger from both the owner session and
an explicitly read-authorized second room participant without executing a new
Minecraft action.

This verdict accepts the durable lifecycle, not the projected full
all-advancements campaign and not G6 concurrent reasoning.

## Canonical recovery evidence

The accepted ledger preserved this causal sequence:

```text
fresh viable baseline
→ G4 semantic wake consumed
→ material stop-movement replan
→ connector_epoch_changed / recovery_required
→ fresh viable observation and bounded recovery evidence
→ authority_rebound
→ restored_viable_control checkpoint_verified
→ goal_resumed
→ restored_viable_control milestone_completed
→ goal_completed at revision 19
```

Checkpoint `restored_viable_control:1787465167286` verified health 20,
`controls_released=true`, a current successor connector epoch, and restored
player viability. Failed and recovery attempts remain in the immutable event
history; later evidence advanced the matching postconditions rather than
deleting earlier failures.

## Natural Runtime Codex report

Owner Ask turn `ask:ffae0c54-ac55-4ae9-8afc-c3e936edf83f` used the unchanged
natural prompt in
`artifacts/g5-durable-survival-goal/owner-natural-progress-report-final.json`.
The first exact inspect returned a typed list of the two readable goals and
their objectives. Runtime Codex selected the semantic-wake goal, retried with
its exact ID, re-entered both observations, and accurately reported completion,
wake-driven replanning, connector recovery, restored viable control, and the
terminal milestone state.

The provider candidate, Helix terminal authority, server projection, and
client-visible projection shared SHA-256
`615104d28c8c4afdd3d4442342bfcc0dc85bf1d5b294f8f1f489746ccc151cf9`.
Lifecycle integrity, projection audit, differential audit, and poison audit
were clean. No new game action executed.

## Authorized continuation

A newly joined participant initially received `durable_goal_not_found`, proving
that room membership alone did not disclose the owner ledger. The owner granted
only `read` continuation to participant
`shared_realtime_participant:cc09d2c3-25b0-451f-a675-9da68f1dae97` through the
same-origin room API. Ask turn
`ask:93bfc8fa-2965-4257-9997-e26c50c93425`, captured in
`artifacts/g5-durable-survival-goal/second-participant-natural-progress-report-authorized.json`,
then reconstructed the same goal and facts from its own account session.

Its provider/terminal/server/client hash was
`f8468c50a6699e0f7e4c70007372a44bc567c563a4c8596d69833ea50c4b3643`.
The wording was independently sampled, so it is not expected to equal the
owner turn byte-for-byte; authority and presentation remained exact within the
turn. The participant received no steer scope and executed no action.

## Adapter findings

The report journey repaired two general lifecycle surfaces:

1. early native completion facts are ignored when later workstation-gateway or
   capability-packet continuation facts exist, preventing a first tool cycle
   from erasing later execution and re-entry; and
2. omitted goal IDs resolve only when exact room/source/world/binding scope has
   one readable goal. Multiple goals re-enter Codex as a typed, repairable
   observation carrying objective summaries, allowing semantic selection and
   an exact retry without making Helix the planner.

Hard identity, provenance, participant, freshness, and terminal boundaries
remain fail-closed.

## Verification and limits

- focused lifecycle plus goal-gateway tests: 18/18;
- environment route and provider capability contracts: 357/357;
- Helix Ask discipline quick check: passed;
- retained API parity: 31/31;
- retained terminal equivalence: 6/6;
- keyed owner and authorized participant report turns: completed with exact
  intra-turn candidate/terminal/server/client hashes and clean audits.

The final broad API-parity rerun was interrupted to preserve the live system
after its test process exceeded 2 GiB and host-free memory fell below 1 GiB.
The final terminal-equivalence rerun was 5/6; the sixth turn was rejected by the
production memory governor with `memory_hard_pressure` at 835 MiB free, before
route authority or a solver trace could exist. These reruns are not counted as
passes and do not represent lifecycle contradictions.

Both accepted prompts originated from text. Voice interpretation was null and
speech/TTS lanes were `dry_run`; voice was therefore not applicable, and this
audit makes no audio-playback claim.

Casimir verification was not applicable because this gate changed environment
and Helix Ask lifecycle surfaces, not warp/GR, constraint, certificate,
training-trace, or proof-maturity semantics.

G6 may now add revision-bound perception and prospective-planning roles while
retaining one execution arbiter, one mutation authority, and the accepted G1–G5
sequential evidence/terminal path.
