# Helix Minecraft environment agency baseline audit — 2026-08-03

Status: **in progress; live gameplay closure is not yet claimed**

## Scope and ownership

This audit covers the first concrete game environment adapter,
`minecraft.fabric_mod.v1`, through the existing Helix Environment Connector and
Helix Ask/Codex lifecycle. The change spans source admission, tool admission,
evidence normalization, evidence re-entry, follow-up reasoning, terminal
authority, and presentation. It does not add a private model sampler, tool
runtime, retry loop, approval system, session manager, or terminal writer to
Helix. Codex remains responsible for reasoning and sequential tool use; Helix
owns identity, policy, provenance, trusted schemas, receipts, and terminal
eligibility.

The retired monolith `server/routes/agi.plan.ts` is not an implementation home
for this baseline. Environment work remains in the recrowned connector,
workstation-gateway, Ask contract/provider, shared contract, and thin host
adapter directories.

## Implemented contract

- The Fabric adapter advertises the eight shared read probes plus the bounded
  `com.casimirbot.minecraft.spatial_region.inspect` extension.
- A room member selects an online player identity. The server retains the
  connector identity and epoch; stale, wrong-world, ambiguous, and unbound
  subjects fail closed.
- Read ingress and command ingress use separate credentials and leases. Full
  Minecraft command authority still cannot grant host shell, files, RCON,
  processes, network credentials, or connector secrets.
- Structural and safety prompts admit an inspect → mechanics/catalog → bounded
  act → fresh inspect workflow. Each Minecraft command request contains exactly
  one command, and Helix cannot terminalize a success before the resulting
  observation re-enters provider reasoning.
- `helixgame checkpoint capture|capture_box|restore|discard|status` supplies
  bounded, in-memory rollback for local builds. `capture_box` records the exact
  inclusive mutation envelope selected by Codex rather than an approximate
  player-centered radius. Restore skips block-entity cells rather than
  overwriting container state.
- `helixgame fall_rescue arm|status|disarm` supplies a short-lived local
  tick-driven rescue lease. It can place a temporary water source for an
  unprotected survival fall and removes only the source it placed. Settled or
  expired leases retain a read-only result for ten minutes so a slow agent
  follow-up cannot erase trigger, cleanup, or no-trigger evidence.
- The mechanics collection explains structure planning, safe fireplace
  qualification, rollback, ambiguous command outcomes, and fall rescue without
  itself granting command authority.

## Spatial evidence boundary

The Fabric spatial probe is centered on the selected player and bounded to a
maximum horizontal radius of 7 and vertical radius of 8. The connector wire
uses `relative_xz_relative_y_palette_flags_v1`; Helix validates that frozen
schema before expanding it into absolute model-visible columns.

The final wire envelope is capped at 33,500 UTF-8 JSON bytes. The receipt
reports the exact serialized byte count and independent completeness state for:

- palette block types;
- retained columns and vertical runs;
- semantic anchors; and
- evaluated fireplace candidates.

When compaction omits evidence, the corresponding retained and omitted counts
are explicit. A solver must narrow/repeat the probe or return an actionable
typed limitation; absence in incomplete evidence is not proof of absence.

## Verification completed so far

| Evidence | Result |
| --- | --- |
| Fabric Java test/build after exact completeness accounting | PASS |
| Focused Fabric spatial survey, exact-box rollback checkpoint, and fall-rescue tests (Java 21) | PASS |
| Fabric exact wire-size and explicit omission tests | PASS |
| Connector catalog, legacy normalization, and environment probe tests | 38/38 PASS |
| Environment agency contract battery (12 files: command risk, subject binding, probe ingress, mechanics retrieval, compound contract, continuation authority) | 308/308 PASS |
| Keyed `/api/account/session` | HTTP 200 |
| Keyed `/api/helix/pipeline` | HTTP 200 |
| Keyed `/api/agi/agent-providers` | HTTP 200; Codex runtime launchable |
| Fabric 1.21.8 runtime with sensor 0.2.0 | PASS |
| New Fabric manifest admission | PASS; 9 read capabilities |
| Command catalog before a renewed room lease | Correctly rejected with `command_authority_inactive` |
| Post-observation continuation correction regressions | 5/5 targeted PASS; exact corrective request and retry-exhaustion typed failure covered |
| Required-grounding correction matrix | 13/13 PASS |
| Exact-footprint schema, normalization, gateway, and sequencing battery | 55/55 PASS |
| Environment routing, mechanics retrieval, docs intent, and probe battery | 226/226 PASS |
| Provider Minecraft re-entry and continuation subset | 3/3 PASS |
| Provider attempt-supersession and terminal pass-through subset | 43/43 PASS |
| Deterministic API-parity rail/terminal subset | 12/12 PASS |
| Helix Ask discipline quick check | PASS |
| Command-text documentation adversary | Focused capability, gateway, and prompt benchmark PASS; live keyed UI lifecycle PASS with zero mismatches |
| Keyed Ask API parity, current enabled matrix | 3/16 procedural PASS; current failures remain in the separately known visual/live-source admission and identity-diagnosis fixture lane |
| Casimir adapter verification | PASS; certificate `GREEN`, integrity OK, hash `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45` |
| Direct-Codex versus Helix live teleport comparison | PASS; prerequisite check, mutation, verification, evidence re-entry, and single-writer terminal authority matched |

Current tested build output:

- path: `minecraft/helix-fabric-sensor/build/libs/HelixFabricSensor-0.2.0.jar`
- size: `198995` bytes
- SHA-256: `bb6427cb49f19155021917dabe21f21adc3dae4abc99c28234c6255d35656c60`
- source-tree SHA-256: `1c2d0c063d7cc0aba70511813c5856e02b49be51672b753ea6a18bc3a5f3b98e`

The exact same `198995`-byte JAR and SHA-256 is staged in `run/mods` and loaded
by the current Java 21 Fabric process. A Java 21 `test build` passed before the
staged copy, the server saved all three dimensions cleanly, and the restarted
connector admitted both its observation manifest and live Brigadier catalog.
The final resource-capped Java 21 `clean test build` passed on 2026-08-05 with
one worker and reproduced that exact staged JAR. Live fall-rescue and
text/voice closure remain pending.

### Exact mutation-envelope checkpoint

The original rollback command captured a symmetric volume around the player.
That was useful for small experiments but could not honestly prove rollback of
an exact wall or structure footprint. The command tree now includes
`helixgame checkpoint capture_box <name> <x1> <y1> <z1> <x2> <y2> <z2>`.
Corners are order-independent, inclusive, restricted to the current dimension
build height, no more than 32 blocks from the selected player on any axis, and
capped at 16,384 in-memory block states. Helix and Fabric independently
classify the command as server-administration authority. Exact-volume,
coordinate-reversal, overflow, and classifier tests pass; the live wall journey
must still prove capture, mutation, verification, and restore receipts through
the real Ask/Codex loop.

The Ask sequence guard also recognizes both `checkpoint capture` and
`checkpoint capture_box` as checkpoint-producing observations. This prevents
the exact-box command's server-administration classification from being
mistaken for an ordinary mutation that itself requires a prior checkpoint. The
focused sequencing and risk-classification battery passes 46/46.

### Mechanics evidence preservation

A title-free retrieval regression exposed an evidence-projection defect. The
room-scoped mechanics search selected the correct rollback section and built a
bounded cited passage containing the adjacent `capture_box` code example, but
the Codex model-visible document projection omitted `hit.text` and all
`evidence_passages`. Codex could therefore receive the correct document and
still not receive the exact command syntax.

The model-visible projection now retains bounded hit text plus up to eight
cited evidence passages with path, section, exact line range, relevance,
matched terms, and citation reference. These remain non-terminal evidence and
cannot grant command or answer authority. Focused gateway and provider
normalization regressions prove that the natural query "how do I capture only
its exact rollback footprint?" delivers the exact
`helixgame checkpoint capture_box` line to the post-tool Codex step without
mentioning a document title.

## Direct oracle and runtime comparison - 2026-08-04

The direct server console was used only as a diagnostic oracle. It established
that Minecraft itself could answer the safety and position questions without
depending on the Helix reasoning path:

- `DatDamPig` was the only online player.
- The nearest plains result was centered on block `(-102, 67, -76)`.
- Direct block reads proved `minecraft:grass_block` at `(-102, 66, -76)` and
  `minecraft:air` at both `(-102, 67, -76)` and `(-102, 68, -76)`.
- Before the live Ask run, the player remained near the original structure at
  approximately `(-38, 68, -11)`.

The first Helix attempt requested `docs.search`, re-entered that observation,
then terminalized with the required live-environment and Minecraft-command
itinerary still missing. That classified the defect as shared follow-up
reasoning / post-observation continuation, not connector transport, Minecraft
syntax, source admission, or terminal presentation.

The provider now performs one bounded corrective model pass when all of the
following are true: a current observation has re-entered, Helix still exposes
an exact untried continuation affordance, and Codex returned no structured lane
request. The correction lists only the admitted exact affordances and their
input contracts. Helix does not choose or synthesize the command. A compliant
Codex request continues; a second prose response executes no additional tool
and remains an authoritative typed failure.

After the keyed restart, the same natural prompt succeeded through the room's
active Fabric source and selected player:

1. Codex requested a Minecraft command that confirmed grass support and two
   air cells at the destination.
2. Codex requested the teleport only after that observation re-entered.
3. The connector reported `Teleported DatDamPig to -101.500000, 67.000000,
   -75.500000`.
4. Codex requested and re-entered a second Minecraft command observation for
   the resulting position.
5. Helix's single terminal writer authorized a
   `compound_evidence_synthesis_answer` only after both observations were
   present.
6. An independent direct server read returned
   `[-101.5d, 67.0d, -75.5d]`, matching the runtime answer exactly.

This closes the specific direct-oracle parity question and proves a real
inspect -> act -> verify path. It does not yet close the wall, fireplace, or
fall-rescue demonstrations below.

The latest keyed API parity artifact is
`artifacts/helix-ask-api-parity/api-parity-1785847768545`. All 16 scenarios
completed, but only three met the current procedural oracle. The failures are
in the pre-existing visual/live-source rail-admission and identity-diagnosis
fixture lane: unexpected `workstation.active_context` or
`workstation.readable_surface.observe` calls lacked admission proof, and legacy
situation-run diagnoses were absent or mismatched. They are tracked separately
from the Minecraft room connector path, but remain release debt for the broad
Ask baseline. The deterministic rail/terminal subset of the unit parity matrix
passed 12/12; the provider-backed reconstruction cases must still be rerun with
the interactive servers stopped because their first concurrent run soft-locked
under workstation memory pressure.

## Exact post-action verification repair - 2026-08-04

The first live wall journey exposed a semantic verification defect rather than
a failed mutation. The `fill` command built all 15 stone-brick cells, but Codex
then reused `purpose=build_planning`. That purpose correctly searches for empty
build space, so it could not prove an already occupied wall and the runtime
terminalized a false failure.

The spatial capability is now version 2 and accepts the fail-closed
`structure_verification` purpose with exact inclusive endpoints and an expected
canonical block ID. Fabric scans the bounded footprint, reports total, sampled,
matching, mismatched, and unobserved cells plus bounded mismatch samples, and
Helix independently recomputes `complete` and `all_match`. Dense survey columns
remain compacted while the exact verification result remains visible during
evidence re-entry.

Post-mutation sequencing derives exact verification requests only for absolute
solid `fill` and `setblock` programs. Relative, hollow, outline-like, or
otherwise ambiguous footprints fail closed. Block-state and NBT suffixes are
removed only for canonical material comparison, so a command such as
`minecraft:fire[age=0]` is verified against the connector's canonical
`minecraft:fire` identity. For bounded multi-command programs, every successful
block footprint must receive a later complete all-match observation before the
compound "finished result verified" requirement can resolve. A verified last
step can no longer conceal an earlier unverified mutation.

Focused evidence for this repair is 55/55 TypeScript tests, 226/226 environment
routing/mechanics tests, 3/3 provider re-entry/continuation tests, and a clean
Fabric Java build/test for sensor 0.2.0. The real room/Codex path still needs the
online-player demonstrations below before this audit can become release-ready.

### Live exact wall evidence

The real room mutation turn `ask:d39f8eb6-9589-4bea-bbe8-96e756855c22`
executed the bounded command `fill -63 69 -2 -59 71 -2
minecraft:stone_bricks`, producing 15 wall cells. The later exact-verification
turn `ask:741d3d38-2713-4421-8493-dd4c373060c7` requested the spatial probe
twice through the workstation gateway and re-entered the resulting observation
`ask:741d3d38-2713-4421-8493-dd4c373060c7:workstation_gateway:com.casimirbot.minecraft.spatial_region.inspect:a1a317e3a1068f49`.

Fabric and Helix agreed on the exact inclusive volume from `(-63,69,-2)` to
`(-59,71,-2)`: 15 expected cells, 15 `minecraft:stone_bricks` matches, zero
mismatches, and no unobserved cells. The observation timestamp was
`2026-08-04T15:32:27.513Z`; age at admission was 487 ms under the requested
5000 ms ceiling. Terminal authority selected
`compound_evidence_synthesis_answer` only after re-entry. This proves the live
mutation and exact post-state half of the wall journey. A current-run checkpoint
capture and restore demonstration remains required before the rollback portion
of item 4 is closed.

### Fall-rescue safety hardening

The local reactive controller now restores temporary water through the lease's
recorded dimension when a lease is re-armed or disarmed. If that dimension is
unavailable, the operation fails closed and retains the lease for later safe
cleanup instead of attempting restoration at the same coordinates in the
player's new dimension. The focused controller test now also covers gliding,
spectator mode, and insufficient downward velocity. The focused controller test
and the complete resource-bounded Fabric build pass under Java 21. Natural
fall-rescue routing plus contextual, negated, deferred, quoted, historical, and
explanatory adversaries pass in the 214/214 environment route battery. Live
trigger, landing, and cleanup evidence remains pending.

An additional offline-player audit found that the tick loop previously skipped
the entire lease when the player disconnected. A source of rescue water could
therefore remain until the player rejoined even after its cleanup deadline or
lease expiry. Offline leases now continue to advance against their recorded
dimension: cleanup restores the replaced block at the bounded deadline, expiry
restores and removes the lease, and a missing dimension remains fail-closed for
later safe cleanup. The focused offline cleanup/expiry regression and complete
Fabric build pass under Java 21. The rebuilt remapped artifact has SHA-256
`D0B4D3AA6A80E5A0940CC4C921189969865C3E0ABD720E86DEFC2A362B1C8BA2`.
Live trigger, safe landing, water cleanup, and an optional disconnect-after-
placement adversary remain direct-current-run evidence requirements.

The `D0B4...` fingerprint above records that intermediate non-clean Gradle
build, not the current release candidate. It is superseded by the staged and
running `4F5157...` artifact identified in **Artifact status**. The current JAR
contains the offline cleanup repair and its passing tests.

### Live offline-subject regression

After restarting the keyed server with the narrowed mechanics-document intent
and expanded actor-status matcher, the room retained an active Fabric source
and its autonomous server-administrator lease while reporting no online
subjects. The natural prompt `Using my paired Minecraft Fabric environment,
check my current player health and exact position now. Do not mutate anything.
If my selected player is offline, fail accurately and actionably instead of
using stale evidence.` committed to
`com.casimirbot.minecraft.actor.status.read`, produced and re-entered a failed
gateway observation, and blocked terminal authority for observation state.
The authoritative terminal was the typed failure
`subject_binding_required`; it did not reuse the previously observed health or
coordinates and did not route to mechanics documentation. The corresponding
Ask turn was `ask:fb7ab9a1-855a-4afe-9427-35483e8e5f1c`.

The post-repair static discipline quick check also passed. This proves the
offline half of the subject-binding contract; a fresh online read remains part
of the live closure below.

## Reasoning-loss differential and exact-command repair - 2026-08-04

The live exact-command comparison established both a green control and a
downstream contradiction.

- Turn `ask:255584a5-90b2-4012-9c0b-30306748d056` requested exactly one
  read-only `time query daytime` command. One physical command executed, its
  fresh observation re-entered Codex, Codex authored the successful answer,
  and candidate hash plus support refs were preserved through route-product
  materialization, the terminal single writer, and presentation. The
  differential audit was green.
- Turn `ask:2227926b-97de-489f-931a-aa24fb9247ac` requested exactly one
  `setblock -50 68 -2 minecraft:fire` mutation and explicitly prohibited every
  other tool. Minecraft changed the block successfully and emitted command
  execution `command_execution:6f30ac9e-0456-4fd1-ac1c-45fe04bc07c0`.
  Helix nevertheless expanded the semantic “ignite” preface into spatial
  inspection and command-catalog subgoals. The added spatial probe failed with
  `producer_epoch_mismatch`; the later terminal rail surfaced that helper
  failure instead of returning the successful command observation to Codex for
  final synthesis. The old audit falsely reported green because its isolated
  command detector depended on the already-expanded semantic extraction.

The repair derives exact-command exclusivity below semantic capability
extraction. A prompt that names `com.casimirbot.minecraft.command`, supplies a
quoted command, affirmatively requests exactly one command, and forbids other
tools now materializes:

- `exclusive_tool_capabilities = [com.casimirbot.minecraft.command]`;
- `requested_tool_cardinality = 1`; and
- a single command capability in extraction, compound planning, and tool
  admission.

Contextual, negated, deferred, quoted/transcript, and explanatory variants do
not activate this constraint. The independent lifecycle differential now also
counts failed helper attempts as violations; a prohibited tool is a contract
breach even when that tool fails before producing evidence.

This case supplies the general reasoning-loss method used for subsequent
adapter work:

1. Record the prompt's operator constraints and admitted capability IDs.
2. Count physical executions separately from logical retries and idempotent
   replays.
3. Match normalized observation refs to verified `observation.reentered`
   events.
4. Compare the final Codex message hash with the authorized provider candidate.
5. Preserve candidate ref, text hash, and current-turn support refs through
   materialization, terminal selection, and visible presentation.
6. Classify the first divergence as tool execution, evidence re-entry,
   follow-up reasoning, scientific evidence, terminal materialization,
   terminal authority, or presentation.
7. Distinguish an adapter contradiction from a hard evidence/policy boundary.
   A recoverable rejection must re-enter Codex; an unrecoverable boundary must
   fail closed with its stable reason codes and may never silently generate a
   substitute answer.

Focused regressions after the repair passed 248/248 across environment
capability routing, operational constraints, and lifecycle differential tests.
A wider already-dirty provider/compound run passed 457/475; its 18 failures are
in pre-existing translation, scholarly, capability-catalog, and contract-map
expectations and are not evidence for or against this exact-command repair.

### Live exact-command and post-state closure

After the keyed restart, turn
`ask:b4ccd515-43d5-4f9e-ad2a-3d372863889c` executed exactly the requested
`setblock -50 68 -2 minecraft:fire` command. No semantic helper was admitted or
attempted. Minecraft emitted command execution
`command_execution:cf3151c6-369e-4b44-a18c-ccfd2be72ee6`, the observation
re-entered Codex, and Helix selected the model-authored answer only after the
runtime completed. The lifecycle differential had no mismatch and preserved
the candidate ref, answer hash, evidence refs, single-writer text, and visible
presentation.

The first separate post-state inspection, turn
`ask:a8de8b03-8b1d-4c65-b61c-eb083365ef43`, failed accurately with
`producer_epoch_mismatch`: the participant's player binding predated the active
connector producer epoch. The evidence boundary was correct, but the room UI
still rendered `You are DatDamPig` and pinned the selector to the same value,
making a same-player renewal appear to do nothing.

The room environment contract now reports `reverification_required` whenever
the projected self binding is stale. The UI renders `Reverify <player>`, clears
the controlled selector value, and explains that the connector session changed.
Selecting the same online player therefore creates a new binding under the
current epoch and relinks the existing member command grant. The full route
test proves epoch rollover, fail-closed resolution, same-player renewal, and
restored active resolution; the client test proves the actionable presentation.

With the renewed binding, live turn
`ask:a036ba29-ceea-4c4b-ad6d-5276ea4a83bc` inspected exactly
`(-50,68,-2)`. Fabric and Helix reported one requested cell, one
`minecraft:fire` match, zero mismatches, and no mismatch samples. Its canonical
event log records tool completion, exact observation re-entry, post-observation
Codex completion, runtime completion, terminal eligibility, and turn
completion. Lifecycle integrity and the projection audit were both green, and
the single writer copied the exact model-synthesized answer.

That debug export also revealed a diagnostic ordering issue: the nested
differential snapshot was initially computed before the provider attached the
final canonical lifecycle, so its optional runtime continuity checks remained
`not_observed` even though the later authoritative log proved both re-entry and
follow-up reasoning. The provider now refreshes the diagnostic after attaching
the lifecycle. This refresh is diagnostic only; it cannot select, reject, or
rewrite an answer. The focused lifecycle, terminal-writer, room-route, and UI
battery passes 108/108.

### Live attempt-supersession and single-writer repair

Turn `ask:98d4f7c8-c1f9-4b09-a777-8296b269bb97` exposed a second downstream
contradiction. Its first spatial read produced
`current_turn_reentry_ineligible`; a later same-capability attempt succeeded,
the fresh observation re-entered Codex, and Codex completed a supported answer.
The provider bridge authorized that candidate, but the aggregate gateway
reduction still treated the earlier failed attempt as a current blocker. The
terminal writer consequently selected `typed_failure` while preserving the
successful answer text. This was an adapter contradiction, not a scientific
evidence failure or model-reasoning failure.

The shared provider authority contract now distinguishes attempt history from
effective blockers. A failed `read`, `observe`, or `verify` attempt with
`current_turn_reentry_ineligible` is superseded only by a strictly later
successful observation from the same capability. The failed attempt remains
visible in provenance. The exception does not apply to mutations, a different
capability, reverse ordering, or a failure without later success.

The focused authority and pass-through battery passes 43/43 and includes all
of those boundaries. The first post-restart live turn
`ask:f86b51df-972d-4b80-9de0-24a5827e35b5` then failed correctly with
`producer_epoch_mismatch`; both attempts failed, so nothing was eligible to
supersede and Helix remained fail closed. After renewing the selected
`DatDamPig` subject binding against the active connector epoch, turn
`ask:b1631590-1afb-409c-94d9-b5ea0ecbcd0c` completed the same natural prompt
through the real Fabric source.

The accepted turn reported one total cell, one `minecraft:fire` match, zero
mismatches, and an empty mismatch-sample list. Evidence re-entry passed, the
provider bridge granted authority, and candidate SHA-256
`a2b7680f98de5ab08a97c7acd51c7514b871d875e6fec8c41ede9c216f4a671e`
was preserved through `model_synthesized_answer` materialization, the terminal
single writer, and visible presentation. The lifecycle projection audit was
green, the differential contained no mismatches or failed continuity checks,
and the scientific evidence disposition passed.

### Record-only execution contradiction and diagnostic method

The full continuation gate exposed the same class of lifecycle defect outside
Minecraft. A procedure-memory request had already produced the authoritative
typed failure `PROCEDURE_MEMORY_ACTIVE_SITUATION_RUN_MISSING`. A later runtime
projection labeled the turn `record_only` but still entered executable runtime
paths. Five unrelated repository-search attempts were rejected, the loop
exhausted its budget, and the downstream envelope replaced the original failure
code with `agent_loop_budget_exhausted`. This was an adapter projection
contradiction: neither the source evidence nor Codex requested repository
search.

The canonical uppercase procedure-memory failure is now recognized by the
shared settled-failure reconciliation before generic continuation. For the
specific terminal-failure `record_only` reason, the lifecycle differential
checks independently that no `runtime_tool_call` or
`runtime_tool_observation` was created and reports
`record_only_admission_executed_runtime_steps` at the `tool_execution` stage.
The route regression also requires the original stable evidence code and
proves that no runtime tool artifact exists.

Focused verification passes 27/27 lifecycle/reconciliation tests and the real
procedure-memory route regression. That route retains the actionable Auntie
Dot explanation, exposes the original source failure, and records the terminal
state without sampling an unrelated capability loop.

The committed-HEAD discipline rerun then passed all prompt cases (4/4 prelude
plus 31/31 enabled adversarial cases), the fixed API matrix (15/15), all four
API scenario shards (16/16), live-source continuation (26/26), and live-source
identity (8/8). The production server build also passed at commit
`f0dfd07085af214797458081b246ab87f1175c72`; its four warnings are pre-existing
duplicate-key/case diagnostics outside this environment and lifecycle scope.
One full-route continuation fixture required its timeout to rise from 20 to 90
seconds after an isolated run demonstrated 65 seconds of valid processing and
all assertions passed. No application behavior was relaxed for that timing
adjustment.

### Fabric catalog restart-gap repair

A live catalog prompt exposed a separate connector recovery gap. Helix had an
active Fabric source and the failed catalog observation reached the capability
lane, but the keyed server had restarted quickly enough that its persisted
command catalog was empty while Fabric never observed a failed manifest. The
old connector republished the command tree only after an observed source
failure, so a clean short restart could leave the source active but command
inspection unavailable indefinitely.

The Fabric runtime now performs an idempotent catalog republish after successful
manifest admission, bounded to once per 30 seconds. A valid command lane is not
paused during republish. The focused `FabricCommandRuntimeTest` passed under
Java 21, and the complete Fabric Gradle build passed. The initial non-clean
build of that repair emitted SHA-256
`D5E2DFB56F12E308E21E235ECF10A733BEA183F8A0696601CFCF02046EA2984A`.
That chronological fingerprint is superseded by the current staged and loaded
`4F5157...` candidate described in **Artifact status**; its source receipt also
records the catalog-republish regression as passing. The previous JAR remains
recoverable as
`HelixFabricSensor-0.2.0.jar.pre-catalog-republish-20260805`. A deliberate
Fabric restart and real post-restart catalog prompt are still required before
this recovery path is accepted as live proof.

The pre-restart natural catalog turn
`ask:9b2624b1-5383-49eb-b106-57854cbd9e2a` then established the expected old
state. Two bounded catalog attempts returned
`command_catalog_changed` / "server has not published its live command
catalog." The failed observation was present in the capability-lane
`lane_reentered` event and Codex received it before terminal selection. Helix
returned the actionable catalog failure instead of relabeling the observation
as never executed or inventing a command path. An exact one-command
`save-all flush` turn, `ask:03a24060-b99f-4849-b61c-2c9bb2ca1f63`, was also
blocked by the same catalog boundary; its failed observation re-entered Codex
and no save success was claimed.

The local Fabric server was restarted from the staged JAR after a current
`level.dat` save was verified. The new connector reached `Done`, published an
admitted manifest, and started its command lane. Its first catalog publish
correctly returned `http_409_command_authority_inactive`: the restart did not
silently inherit command authority into the connector. The owner UI now shows
the source active with nine read capabilities and preserves the configured
full/autonomous ceiling, but pairing is disabled until the selected player is
online. Post-restart catalog admission therefore remains pending one player
join and one-time in-game command pairing.

After the later keyed-server restart, the same active Fabric process resumed
manifest admission and continued bounded catalog publication. With no current
room command-authority record it now fails closed as
`http_404_command_authority_not_found`; zero players are online. This is the
expected pre-pairing state, not catalog-admission proof.

### Mechanics command-text intent and answer-identity repair - 2026-08-05

The real UI prompt “give the exact command form” exposed another deterministic
expansion defect. Turn `ask:e4202f2b-fbec-4257-8ac3-5398ee106259` explicitly
asked Helix to retrieve and cite rollback mechanics and prohibited Minecraft
execution. `docs.search` succeeded, its exact passage re-entered Codex, and
Codex authored a supported answer. The natural Minecraft action detector then
misread the documentation phrase's word `give` as the game's mutating `give`
verb. It injected a second `com.casimirbot.minecraft.command` subgoal that the
operator had neither requested nor authorized.

That invented subgoal failed for missing command arguments and a missing live
catalog, and a downstream rail surfaced the helper failure instead of the
supported Codex answer. The independent lifecycle differential correctly
reported `provider_candidate_disagrees_with_runtime_message` with first
divergence `followup_reasoning`. The provider candidate hash was
`933328...`; the later typed-failure hash was `7bbb17...`. Evidence re-entry
and the scientific evidence disposition were green, so this was prompt
interpretation plus follow-up reconciliation failure, not an evidence-quality,
provenance, or model-reasoning failure.

The shared action detector now treats requests to give, show, provide, return,
report, write, quote, or cite command form, syntax, text, examples, or snippets
as documentation intent with `execution_intent=none`. The boundary is narrow:
affirmative requests such as “Give my selected Minecraft player a diamond now”
and “Give my selected Minecraft player a temporary glowing effect now” still
admit the Minecraft command capability. Focused capability-arbitration and
gateway regressions prove both sides.

The identical natural prompt was then replayed through the real keyed in-app
Ask UI as turn `ask:76661899-a140-443e-93cc-b5a82dd1881d`. Only `docs.search`
was proposed, admitted, executed, and re-entered. Codex cited
`docs/game-mechanics/minecraft-command-playbook-v1.md#L213-L229` and returned:

```text
execute as @s at @s run helixgame checkpoint capture_box agency_build <x1> <y1> <z1> <x2> <y2> <z2>
```

No Minecraft command executed. The canonical lifecycle audit was green with
zero mismatches; no first broken rail or stale failure was visible; the terminal
writer selected `model_synthesized_answer`; the visible text matched the
selected candidate; and the only compound subgoal was the mechanics document
search. This is the required natural keyed proof that command-language evidence
can inform Codex without a deterministic rail converting the text into an
unrequested game action or discarding the supported answer.

### Live exact-wall rollback proof - 2026-08-05

The current keyed room and paired Fabric world completed the exact reversible
wall journey through normal Ask/Codex turns:

- `ask:95c1316e-71ae-4dd5-9078-402dc90813e3` captured checkpoint
  `helix_wall_closure_1` for exactly `(-53,67,0)` through `(-49,69,0)`: 15
  blocks, with zero block-entity positions skipped.
- `ask:4e6967a9-3cc1-4dd4-b84c-51da4667b5f0` filled only that inclusive volume
  with `minecraft:stone_bricks`; the command receipt reported 15 changed
  blocks.
- `ask:b42b620f-2999-410e-a4f8-cd2f5856d654` performed a fresh read-only
  spatial verification: 15 of 15 cells matched and zero mismatches were
  reported.
- `ask:f90d2ad3-7b37-49bb-81c4-d897130609b5` restored the checkpoint: 15
  blocks changed back, zero already matched, and zero block-entity positions
  skipped.
- `ask:dc5c8b75-7608-4307-a49e-03f4c4a9f8d3` performed the fresh rollback
  verification: all 15 cells again matched `minecraft:air`, with zero
  mismatches.

Each command or spatial observation reached `lane_observation`, re-entered
Codex at `lane_reentered`, and preceded the selected terminal answer. This is
direct current-run evidence of exact inspection, checkpoint capture, bounded
mutation, after-state verification, restore, and restored-state verification.

### Fall-rescue settled-result preservation - 2026-08-05

The first live rescue attempt proved arming and controlled movement but exposed
an evidence-lifetime contradiction. Turn
`ask:fd691653-fb2e-4715-ae4e-4d1ee869e3be` inspected the landing area, armed
the local lease, and re-entered fresh actor status. Turn
`ask:0adb6576-9864-4917-a44c-9194e56d07cf` renewed it to 300 seconds, and turn
`ask:140e64c0-39d5-40c2-a901-6c25402feb64` teleported the selected Survival
player from Y=68 to Y=75 through the governed command lane. The later read-only
status turn `ask:35f0e19c-98d2-4add-b84f-bfb73a679d0a` correctly re-entered
`Water fall rescue is not armed`, but the old controller had already removed
the expired lease and with it every trigger/outcome field. The evidence could
not distinguish a completed rescue from no trigger, so no rescue success is
claimed.

The shared adapter now settles every expired or dimension-ended lease only
after water cleanup, then retains a read-only result for ten minutes. Status
reports `remaining_seconds=0`, `trigger_count`, `last_outcome`,
`last_position`, and `result_age_seconds`; a new arm or server stop clears it.
This is evidence preservation only: it cannot place water, extend the lease,
or grant command authority. Java 21 `test build` passes, and the rebuilt JAR
was staged and loaded after a clean world save. A post-restart live trigger and
cleanup observation remains required.

## Required live closure

The following evidence is deliberately pending and must not be inferred from
unit tests:

1. Rejoin the restarted local Fabric server as the intended room player and
   renew the participant binding against the new connector producer epoch.
2. **Complete:** The explicit server-administrator command lease and separate
   in-game command credential remain scoped to the room/source, and the
   restarted connector's live catalog was admitted. Current-player binding is
   renewed with item 1 rather than inherited across the producer epoch.
3. **Complete:** Send a natural read-only prompt that inspects nearby blocks, structure
   boundaries, and fireplace candidates. Confirm the compact observation is
   admitted, expanded, re-entered, and terminalized without a 413 or schema
   rejection.
4. **Complete:** The exact 15-block wall journey proved inspection, rollback
   capture, bounded mutation, fresh spatial verification, checkpoint restore,
   and fresh restored-state verification through the real Ask/Codex loop.
5. **Complete:** Send a natural fireplace prompt. Prove that an unsafe or ambiguous candidate
   is rejected, then prove one safe nonflammable hearth ignition and fresh
   post-state inspection.
6. Arm fall rescue through the same runtime-agent tool path, perform one
   controlled player fall, and prove trigger, safe landing, and placed-water
   cleanup.
7. Compare the authoritative text result with the voice/read-aloud projection;
   voice certainty must not exceed the text receipt.
8. Run the resource-safe Helix discipline, prompt, continuation, API-parity,
   production server build, documentation metadata, and diff-hygiene gates.

Only after all eight items have direct current-run evidence may this audit be
changed to release-ready.
