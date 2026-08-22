# Helix environment harness G4 closure audit — 2026-08-22

Program gate: G4 — Live-mail wake bridge
Workstream: Minecraft environment semantic escalation
Capability or component: Source-bound situation-digest to Stage Play mailbox bridge and sequential Runtime Codex wake re-entry
Lifecycle stage: source admission → evidence normalization → evidence re-entry → follow-up reasoning → terminal authority → presentation
Reaction timescale: short semantic replanning; never tick reflex
Authority owner: Helix owns identity, freshness, provenance, wake admission, evidence identity, and terminal eligibility; Runtime Codex owns interpretation, replanning, and answer synthesis; Fabric owns tick-scale viability
Current maturity: live accepted
Target maturity: live accepted
Required evidence: deterministic semantic selection, deduplication and typed identity failures; exact live packet/read/decision/loop continuity; material keyed Runtime Codex replan; terminal and presentation continuity; retained G1–G3 and `/helix ask` behavior
Explicit non-goals: tick processing, resident effects, a second reasoning role, private model loops, answer authorship by live mail, durable goals, concurrent reasoning, learned control, arbitrary command expansion, or growth of retired `server/routes/agi.plan.ts`
Downstream gate unlocked: G5 — Durable survival goal

## Verdict

G4 is **closed** for the bounded Minecraft semantic-wake surface. A fresh,
meaningful, provenance-valid situation change can produce one exact room-scoped
mail item and wake, enter the current Runtime Codex turn through
`live_env.read_processed_live_source_mail`, materially revise the next plan,
record the resulting interpretation and loop state as nonterminal evidence, and
reach one Helix-authorized terminal answer. Equivalent traffic coalesces, while
stale or identity-invalid evidence fails before mailbox admission.

This verdict does not claim durable environment goals, concurrent reasoning,
generic resident-controller extraction, learned control, or a second-domain
adapter. Those remain later gates.

## Accepted causal chain

```text
protected Minecraft room-source events
→ canonical situation digest
→ semantic-change and coalescing decision
→ source-bound live-source mail
→ processed mail packet and nonterminal wake
→ current-turn live_env.read_processed_live_source_mail observation
→ Runtime Codex interpretation and material replan
→ nonterminal decision/checkpoint plus next loop state
→ Helix terminal eligibility
→ synchronized visible text and applicable voice policy
```

The earlier live acceptance candidate is
`artifacts/helix-environment-g4-live-2026-08-21-final-accepted/final-mail-decision-loop.json`.
It preserves Ask turn
`ask:7c213cfd-435a-499e-adf2-ff51ff0969e7`, processed packet
`stage_play_processed_mail_packet:dbd9edefe2d404e8fe`, the current-turn
`live_env.read_processed_live_source_mail` observation, the recorded
interpretation, and the next loop state. Runtime Codex changed the plan from an
assumed exploration continuation to an inventory-management checkpoint and
requested inventory, chest, or crafting evidence before resuming exploration.

The first fresh keyed confirmation on 2026-08-22 used Ask turn
`ask:a36d8d57-fb89-466e-be09-55bdd566d285`, mail
`stage_play_live_source_mail:59314e656eb629cb6f`, processed packet
`stage_play_processed_mail_packet:82e0ce8a12ff0ce777`, digest
`environment_situation_digest:9852066aae12a096baa8d459ad0ff0b7c9a5454edd13bba8`,
and observation revision `4762`. The exact lifecycle contained
`tool.call.completed → observation.reentered → agent.message.completed →
terminal.eligibility.checked → turn.completed`, with lifecycle integrity and
projection audit both clean. The selected answer recognized the inventory
transition and 11-diamond state, withheld reflex/world action, and revised the
plan toward local inventory resolution and safety checks. Final review then
found that its mailbox fast layer had privately sampled prompted
micro-reasoners before Runtime Codex. That trace remains useful diagnostic
evidence, but it is not the closure authority for G4's no-private-sampling
requirement.

The accepted post-repair authority is the redacted debug artifact
`artifacts/helix-environment-g4-live-2026-08-22-deterministic/helix-minecraft-player-ask-5a72c8a7-4dc7-4546-bf88-15c41a66700f.json`
(SHA-256
`850dbc1d90fed92b9086cf787cffb744a696aed0391fa5d0185d894fcc764068`).
It records Ask turn `ask:5a72c8a7-4dc7-4546-bf88-15c41a66700f`, mail
`stage_play_live_source_mail:e570e113566079d212`, processed packet
`stage_play_processed_mail_packet:dadc4de84713461183`, digest
`environment_situation_digest:05a92052b6bbcba64ab103fcc880731c84f82ce7393e3f70`,
and observation revision `5193`.

All 22 mailbox preprocessing runs visible to the current-turn tool observation
reported `modelUsed: deterministic`, and the packet contained no
`prompted_micro_reasoner:*` evidence reference. The debug export's
`gpt-4o-mini` string identifies the generally configured HTTP fallback model;
it is not an executed mailbox preprocessing run. Runtime Codex read the exact
packet, classified the change as an inventory-management transition, preserved
uncertainty about concrete changed contents, and materially changed the next
plan to wait and classify the next inventory, crafting/equipment, or exploration
branch. No environment action observation was created.

## Identity and admission evidence

The fresh confirmation retained these exact identities through the mailbox and
Ask evidence set:

- room `shared_realtime_room:dac2ee22-8449-431e-b72d-1b3dc43f9744`;
- room-source binding `room_source_binding:ab59557e-d056-4bd0-a97a-0f70b6e23e1c`;
- source `source:room-ingress:f253e7b0-ae57-4bc1-b27c-7afe95ec9049`;
- world `minecraft:connector:4ea1d4ab-ebf`;
- connector epoch `adapter_epoch:887a96a9af60ddf49ebf95ff1125251230cb4f60`;
- subject binding `environment_subject_binding:6a3fcc6c-2f97-40bb-a147-45b4e4c6a309`;
- selected player `environment_subject:96bd748e9a363bca2fca851779058d62abf16b2d86d76077`;
- room participant `shared_realtime_participant:dc04795a-d12e-4169-a1b5-a69197532660`.

The bridge regression covers routine baseline suppression, position-only
coalescing, duplicate-digest coalescing, exact hazard wake admission,
provenance-invalid rejection, regressed-revision rejection, missing selected
subject, wrong participant/subject, and Player Embodiment room-identity
separation. The API-parity and identity audits retain actionable cases for
missing environment source, no situation run, no field evaluations, stale
interpretation, fresh unbound source, and wrong environment.

## Authority and presentation findings

- Mail, processed packets, micro-reasoner products, decisions, and loop state
  remained evidence-only and nonterminal.
- Minecraft mailbox preprocessing was deterministic only. No private model
  sampling, private retry loop, second reasoning mind, or prompted reasoner
  evidence preceded Runtime Codex.
- `evidence_reentry_proof.passed` and the canonical re-entry gate were true;
  post-observation Runtime Codex reasoning and terminal selection both ran.
- The terminal authority was server-authoritative, eligible, single-writer
  synchronized, and debug-export synchronized. The lifecycle projection audit
  reported no mismatches.
- The semantic packet selected no voice callout. Voice was disabled by policy,
  so text described the medium-salience change while voice correctly remained
  silent rather than expressing stronger certainty.
- No Minecraft action capability, resident effect, reflex controller, or world
  mutation was admitted by the G4 turn.
- The local probe incorrectly displayed three obsolete generic re-entry fields
  as false even though the canonical evidence gate passed. The probe now derives
  its bounded continuity summary from the canonical evidence-reentry proof and
  terminal authority without becoming a reconciler or answer authority.

## Verification

- The pre-repair focused live-source and continuation battery remained
  **150/150 passed** across the Minecraft digest bridge, mailbox tool, provider
  normalization, and live-source continuation routing.
- Post-repair wake-runner verification: **105/105 passed** across the full Stage
  Play mailbox battery (**90/90**) and Minecraft semantic bridge battery
  (**15/15**). The new adversarial case enables a configured LLM and fake API
  key, fails on any network call, and proves the Minecraft wake still produces
  deterministic-only runs without prompted reasoner references.
- Helix Ask discipline quick check: **passed**. Static warnings identified
  receipt/shortcut-sensitive files in the already-dirty worktree; the accepted
  turn proves those receipts remained observations and re-entered the solver.
- Prompt-solving discipline: fixed prelude **4/4 passed**; adversarial shards
  **31/31 passed**.
- API parity: fixed rail/route contracts **15/15 passed**; scenario shards
  **16/16 passed**.
- Live-source identity audit: **9/9 passed**.
- Server production build after the deterministic-only repair: **passed**. Four unrelated existing duplicate-key or
  duplicate-case warnings remain outside this gate.
- Retained in-game interaction evidence:
  `docs/work-packets/eh-parallel-minecraft-in-game-ask-v1.md` records the keyed
  `/helix ask` health journey with exact observation re-entry, terminal authority,
  room-thread retention, and the authoritative Minecraft chat answer.
- Retained G1, G2, and G3 evidence remains in their dated closure audits. G4 did
  not modify or broaden their authority surfaces.

Casimir verification was not applicable: G4 changed environment/mailbox and
Helix Ask lifecycle surfaces, not warp/GR, constraint, certificate, proof
maturity, or training-trace semantics.

## Remaining work

G5 may now implement one durable survival objective with checkpointed progress
and recovery across disconnect, death, restart, and authorized continuation.
OAuth, desktop, Shared Room, participant/player, source, and device identity
must converge for the G5 acceptance journey. G5 must consume the accepted G4
semantic wake as evidence; it must not turn live mail into reflex control or a
second answer writer.
