# Nether journey survival evidence — 2026-08-25

Program gate: G8 environment-harness release evaluation (G7-completed capability exercised as unknown-world Nether evidence)
Workstream: Minecraft World Authority and Player Embodiment
Capability or component: Goal-directed survival progression through the Fabric environment connector
Lifecycle stage: Live validation
Reaction timescale: Turn-by-turn action/observation with bounded native sequences
Authority owner: Room owner / player `DatDamPig`
Current maturity: Live-controlled, recovery-aware demonstration in progress; Nether transition not yet proven
Target maturity: Constructed and ignited Nether portal followed by a fresh, provenance-valid `minecraft:the_nether` observation
Required evidence: Typed action/probe receipts, screenshot checkpoints, preserved Survival mode, exact player/world binding, and no command or Creative-mode shortcut
Explicit non-goals: Raw server commands, Creative mode, credential exposure, unattended authority expansion, or treating screenshots as a substitute for typed world-state evidence
Downstream gate unlocked: Repeatable G7 Nether-journey acceptance run and harness-fidelity findings for release hardening

## Bound identities and constraints

- Room: `shared_realtime_room:1ac9e158-c650-4644-8485-29974d406ef7`
- Environment: `environment_binding:legacy:897791b2c62787c63c0c051157f3d86ffb1fd91d`
- World binding: `minecraft:local-fabric:g2-a1`
- Player: `DatDamPig`
- Action authority: `environment_action_authority:7f29660f-6227-486a-87fc-a525b4defe3f`
- Rules: legitimate Survival progression, manual override policy `cancel`, bounded admitted actions only

## Checkpoint 00 — authenticated starting state

The fresh actor probe reported Survival mode in `minecraft:overworld`, full health and food, near `(-90, 64, -42)`. Visual inspection established that the starting inventory was not empty: it included a diamond pickaxe, 11 diamonds, limited wood, and miscellaneous resources.

- [Starting position](checkpoint-00-starting-position.png)
- [Starting inventory](checkpoint-00-inventory.png)

## Progress receipts

1. Cleared obstructing oak leaves and navigated to reachable oak logs using admitted Player Embodiment actions.
2. Mined two oak logs, then separately collected the dropped items.
   - Mine evidence: `environment_action_evidence:53c072454097ed2864066fc816d1b7e33e664ea51`
   - Collect evidence: `environment_action_evidence:6fd8cf5bb338491d35cd4e903b54c588abf3ee93d`
3. Located an iron-ore target near `(-89, 35, -51)`. Direct Baritone descent could not find a safe route.
4. Performed bounded vertical excavation with a health checkpoint after every block:
   - 12 andesite removals, all health checks passed: `environment_action_evidence:e8dc3783e2a335b7086182d814fe4edb883bb4b49`
   - 24 stone removals, all health checks passed: `environment_action_evidence:e0e655630d00813ab2f09dc8e7a383b13ab49ab6d`
   - 8 additional stone removals and checks passed before focus stalled: `environment_action_evidence:a0acc7e23dcaed3c53dbab498b9b8a3ebf6e3c32b`
5. No health loss was observed during the excavation sequences.

## Checkpoint 01 — recovery after unexpected relocation

After the final excavation sequence stalled, a fresh probe showed an unexpected displacement from approximately `(-88.5, 41, -50.3)` to `(-38.5, 68, -13.5)`. Repeated telemetry confirmed the new position. Authority inspection reported:

- connector ready and heartbeat fresh;
- no active workflow and no asserted controls;
- `manual_input_detected: true`;
- authority still active with the same player and world bindings.

The screen shows a constructed base at the reported coordinates, and the inventory remains intact. This is recorded as a manual-override recovery checkpoint rather than a proven death, respawn, or connector reset. Typed probe evidence: `environment_probe_evidence:bdba07e9a74aa6203b096fff7eb3fcf382247092`.

- [Recovered base position](checkpoint-01-unexpected-relocation.png)
- [Inventory preserved after relocation](checkpoint-01-inventory-after-relocation.png)

## Harness findings observed during the run

- Actor probes require the room participant to be marked present immediately before the request; presence otherwise expires quickly.
- Mining admits a block type and search radius but not an exact block coordinate, so the connector may select a different nearby matching block. This reduces precise excavation fidelity.
- Mine and collect are distinct mutations; a successful block removal does not itself prove inventory pickup.
- Repeated identical direct actions may be content-deduplicated; admitted sequences can express bounded repetition with checkpoints.
- Region-scoped sequence admission rejected apparently exact vertical scopes, while an empty region list with narrow block allowlists and mutation limits admitted the same work.
- The authority advertises viability-guardian capabilities, but the currently exposed MCP input union rejected a guardian-arm payload before execution. No world mutation occurred.
- A type-only surface mine removed two nearby grass blocks and allowed an unplanned fall from Y69 to Y57. The fresh probe measured health `17.17`, food `17`, and saturation `0`; the run therefore stopped blind vertical excavation. Evidence: `environment_action_evidence:3a7f1f6f0a66ddf55301ab5a9a324f1c577a76bc4`.
- Even when the crosshair and actor probe identify a reachable block, type-only mining can select a closer same-type block elsewhere in the admitted radius. In this shaft that repeatedly preferred floor stone over the intended wall block, demonstrating why exact target coordinates are needed for safe smooth action/reaction.
- A narrowly bounded Computer Use fallback sent ordinary Survival attack clicks to the visible crosshair. It did not remove a block and only changed the camera, so it was abandoned; the following typed probe confirmed unchanged position and health. [Fallback screenshot](checkpoint-02b-computer-input-fallback.png).
- The equipped-item action proved one `minecraft:golden_carrot` is present (`environment_action_evidence:2a43208f53216e73883e79acfa7c8ebee306d87e8`), but both admitted `interact/use` targets rejected eating because they require a compatible block or entity focus. This exposes a missing self/item-use-in-air affordance.

## Checkpoint 02 — iron approach and safety divergence

The connector located iron ore at `(-43, 55, 6)`. Bounded movement and excavation reached approximately Y54 while preserving Survival mode and health `17.17`, but the vein has not yet been removed or collected. The run remains recoverable, though food restoration and exact-coordinate mining are now the immediate safety/fidelity concerns.

- [Underground approach at Y57](checkpoint-02-iron-approach-y57.png)
- Successful focused obstruction removals include `environment_action_evidence:a6eb9c976b0f7f396e52e8b6209aa548ef8e06ccc`, `environment_action_evidence:5b3d5630fcd32851a040db10c4791d2c3fb9dc46c`, `environment_action_evidence:ce8bef6f21080f8a7e2daf30bf03d06be6ab5ba5b`, and `environment_action_evidence:62f837eb5fb6ddf058b62497dc09148b33dbfb355`.

## Current status and next proof checkpoints

## Checkpoint 03 — base recovery and storage audit

The player repeatedly recovered at the established bed/base position near `(-38.5, 68, -13.5)` after unsafe ravine descents. Fresh probes continued to report Survival mode, full health and food, the same player/world binding, and released controls. The base chest was opened and visually audited; it contained mostly dirt, saplings, and miscellaneous items, with no additional iron available.

- [Base recovery](checkpoint-03-base-recovery-after-shaft.png)
- [Inventory after recovery](checkpoint-03-inventory-after-base-recovery.png)
- [Base chest contents](checkpoint-04-base-chest-contents.png)

## Checkpoint 04 — first durable raw iron

The connector exposed and mined iron ore at `(-43, 55, 6)`, then immediately collected the dropped raw iron. The pickup was proven independently from removal:

- Mine evidence: `environment_action_evidence:c3e7e708a2864ebd0ae82e038a256a8139c8cc3a8`
- Collect evidence: `environment_action_evidence:e7b18eebce5c395957003269d8a32d321db17fd69`
- Post-respawn inventory preservation/equip evidence: `environment_action_evidence:3e1faa5815718fda8acd617d9005dac1cc7b2fa2e`

An earlier removal, `environment_action_evidence:620c1e81cb38243ed740fae7295897d64f01990b1`, did not become inventory proof because the connector/server transport failed before collection and the drop later despawned. This is retained as a negative durability finding, not counted toward materials.

## Checkpoint 05 — corrected mining loadout

The inventory already contained a diamond pickaxe. A typed equip action succeeded and verified it in the main hand: `environment_action_evidence:d697b3480010c8900e79dfcc862daabb705c5d1c8`. This corrects the earlier unsafe condition in which raw iron remained selected during an ore approach.

- [Diamond pickaxe equipped at the base](checkpoint-05-diamond-pick-equipped.png)

## Checkpoint 06 — second-vein shaft and inventory audit

A later broad loaded-world scan identified an intact iron-ore block at `(-49, 48, -7)`. The player established a controlled shaft approach and repeatedly used exact cobblestone placement/removal to change elevation. A deep-shaft inventory frame independently preserves the known loadout before the second-vein attempt.

- [Deep-shaft inventory audit](checkpoint-06-deep-shaft-inventory-audit.png)
- Verified raw iron already held: one item from Checkpoint 04
- Other visible prerequisites include the diamond pickaxe, 11 diamonds, coal, wood, cobblestone, and one existing iron ingot

One exact placement request at about 5.1 blocks entered a postcondition-polling deadlock even though the block visibly appeared. Opening the game screen triggered the configured manual-override cancellation and released controls. Cancellation evidence: `environment_action_evidence:b659ee33f9e592b957636e1e0a80922b5ef966db3`. After the keyed server restart, requests carrying the reused `principal_turn_id` were rejected as conflicting idempotency content; omitting `principal_turn_id` while retaining caller-unique `idempotency_key` values restored novel action admission.

## Checkpoint 07 — exact focus mismatch reproduced

From approximately `(-49.7, 51, -5.7)`, an exact typed look toward the known ore produced a fresh raycast of stone at `(-50, 50, -7)`, distance 1.72 blocks, marked within interaction range. The typed miner independently selected that same coordinate but failed with `focus_reachable=false` and `reason_code=mining_focus_stalled`; it performed no world mutation and released controls.

- Look evidence: `environment_action_evidence:ffcfe0fc5d644c19e2a6f16caf051d7a15d411689`
- Failed mine evidence: `environment_action_evidence:30e44f70859702781d492b07bbe58175abaf00e99`
- [Verified second-vein approach](checkpoint-07-verified-iron-approach.png)

This is a concrete live reproduction of the open N0 mismatch described in `docs/work-packets/eh-mc-nether1-responsive-action-reaction-sensing-v1.md`: the read-only actor raycast and the mining executor can disagree about focusability for the same nominally reachable block.

Computer Use cannot hold the primary mouse button through its supported API. Tiny drags, rapid centered clicks, and batched text/key experiments either rotated Minecraft's raw-input camera or failed to create sustained block-breaking progress. A temporary Attack/Destroy keyboard binding was tested and then restored to `Left Button`; no item or world mutation was attributed to those unsuccessful fallback attempts.

## Checkpoint 08 — closer-face mine and legitimate recovery

A one-block lateral navigation succeeded with position receipt `environment_action_evidence:d4a6e1230e3e4a3684f29f5719779b6b1783f2905`, then exposed an unobserved shaft drop from Y51 to Y44. From that lower pose, the actor raycast identified a different stone face at `(-49, 46, -7)`, distance 1.12 blocks. Mining the closer face succeeded in 91 game ticks and verified exactly one requested/removed block:

- Successful obstruction mine: `environment_action_evidence:451ceaaab0a0b3dd960252a5fc2998c365b3e26a6`
- Postcondition: `minecraft.world.matching_blocks_removed = satisfied`
- Mutation count: one block
- Controls released: true

After the support block was removed, the player fell and legitimately respawned at the established bed/base near `(-38.5, 68, -13.5)`. The next fresh probe reported full health, full food, Survival mode, and the same Overworld/player binding. Keep-inventory preserved all durable materials.

- [Post-shaft inventory with tooltip](checkpoint-08-post-shaft-recovery-inventory.png)
- [Unobstructed post-shaft inventory](checkpoint-08b-post-shaft-inventory-clear.png)
- [Recovered base state](checkpoint-09-base-recovery.png)

The target ore at `(-49, 48, -7)` was not removed or collected in this attempt, so the material count remains one proven raw iron plus one existing iron ingot.

## Checkpoint 09 — repeatable shaft descent and placement deadlock

From the restored base, movement-only Baritone reached the known shaft lip within 3.01 blocks but its native final approach stalled. The resulting fresh pose at `(-49.93, 68, -5.81)` was directly over the plank-covered opening. Two narrowly scoped oak-plank mines succeeded, followed by an exact 0.596-block step into the open column.

- Baritone approach evidence: `environment_action_evidence:72fd11bcdc3d2b5d89f4ab743c2b6c0c095af3357`
- Plank removals: `environment_action_evidence:5bd1a5a990cba863a763e99e6d4a74314aa49cbf1`, `environment_action_evidence:e6fefc6471de2ce9a20adacf32aa18cc6130a0334`
- First controlled step: `environment_action_evidence:10ad89051ff3a6e30927a6dac074acd2bf6a1049d`

The player landed at Y60 with health 18.17. Removing the verified Y59 cobblestone support (`environment_action_evidence:c3babe8a21c93c502c84e7d58da70df31aab644c8`) produced a second landing at Y51 with health 14. A straight-down raycast then reported no intervening block, and a 0.437-block step (`environment_action_evidence:a6258a716ddf1d8f0eda8e41c5b2f56083363245e`) reached Y43. Delayed fall damage settled health at 10, but the known Y46 obstruction was again within eye interaction range.

The proposed adjacent cobblestone recovery step reproduced the exact-placement polling deadlock. After 1,385 ticks, screen-open manual override canceled the workflow. The cancellation receipt reports no world or inventory mutation, `manual_override_detected=true`, `manual_input_reason=screen_open`, and `controls_released=true`: `environment_action_evidence:cb9a23060bb3c0328d82c61f34130432351691212`. The player died during the prolonged polling window and recovered at the bed with full health/food and preserved inventory.

- [Second controlled-descent recovery](checkpoint-10-second-controlled-descent-recovery.png)

A final direct iron request still selected the intact ore at `(-49,48,-7)` but stopped after 201 non-progress ticks while 23.48 blocks away. It made no world/inventory mutation and released controls: `environment_action_evidence:9552bb66f64975278adbaf180e5b76b531f05390f`.

This repeat establishes two distinct open harness issues before the legitimate Nether terminal can be considered reliable: exact placement can poll indefinitely after an unreachable/failed interaction, and the miner's approach/focus model can disagree with fresh actor raycast distance. Both fail safely under manual override, but neither yet supplies smooth consecutive action/reaction.

## Checkpoint 11 — exact-coordinate mining admitted and proven

The general mine capability was extended with an optional exact integer
`target_position`. Exact mode requires count one, retains the loaded-client
search radius and existing mutation ceiling, and requires the terminal
measurement to name the same requested coordinate. The first attempt against
the older MCP catalog failed closed before execution because the field was not
yet advertised. After the keyed server and client were restarted into the new
catalog/JAR epoch, the first post-restart actor probe also failed closed until a
fresh connector admission arrived. Both negative results performed no world
mutation.

A fresh actor observation then identified a reachable grass block at
`(-11,62,-4)`. Exact mining removed that coordinate in 19 game ticks:

- Action evidence: `environment_action_evidence:9b5e698f806578eee1b903bb735ea3152721d0df8`
- Verified target: `(-11,62,-4)`
- Verified removals/world mutations: one/one
- Postcondition: `minecraft.world.matching_blocks_removed = satisfied`
- Provenance valid, no manual override, controls released
- Separate post-action actor evidence: `environment_probe_evidence:bfbab85518e73af2fd3695ebd56a65170ebda352`
- [Exact-target mining checkpoint](checkpoint-11-exact-target-mining.png)

The remapped client JAR is
`6338062B35878FCB8B6E94817D22DA5CEE4196352644AA2B9EA9F77BF28361E4`;
the focused TypeScript contract test passed 18 cases and the Fabric suite passed
142 tests. The bounded implementation packet is
`docs/work-packets/eh-mc-nether1-exact-mine-target-v1.md`.

This closes the type-only target ambiguity for one live keyed removal. Repeated
exact excavation and exact ore collection remain to be demonstrated before the
material milestone advances.

## Checkpoint 12 — controlled switchback reaches Y58

The repaired exact-target capability supported consecutive action/reaction, not
only the first single-block proof. Runtime Codex observed and removed exact
grass, dirt, and stone cells to form a two-column switchback above the known
iron column. Bounded walk receipts moved the player down one level at a time.
Fresh actor observations at every level retained full health, full food,
Survival mode, the Overworld identity, and no status flags.

The current safe checkpoint is approximately `(-10.5,58,-1.3)`, four levels
below the first controlled opening. The visible frame shows the enclosed mined
passage, Y58 coordinate, full hearts/food, and diamond pickaxe:

- [Controlled switchback at Y58](checkpoint-12-controlled-switchback-y58.png)
- Fresh checkpoint evidence: `environment_probe_evidence:a2f13c4a1924b473d204af53af8c6524fc6a86df`
- Latest exact floor removal: `environment_action_evidence:27cd53bf0aa1a0c8b26fbf45a2a165ea090f424f2`
- Latest bounded step: `environment_action_evidence:07125ad926dcd2271c9759f8486c273f4dbe7b2f3`

The environment docs audit and Helix Ask discipline quick check passed. The
required Casimir adapter gate returned `PASS`, certificate status `GREEN`, and
integrity OK for hash
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.

The known iron target remains `(-11,40,-2)`. The next action/reaction slice
continues the same exact switchback toward that coordinate; no ore or inventory
count is claimed yet.

## Checkpoint 13 — switchback reaches Y51 without damage

The exact two-column switchback continued from Y58 through changing stone and
granite layers. Each level retained the same observe, exact mine, bounded step,
and fresh actor-verification sequence. Unexpected granite stopped the stone-only
precondition before mutation and was admitted only after a fresh actor raycast
named the exact granite coordinate. The Y51 frame preserves the full
Survival HUD, diamond pickaxe, and enclosed staircase:

- [Controlled switchback at Y51](checkpoint-13-switchback-y51.png)
- Y51 actor evidence: `environment_probe_evidence:295df2565362f016bc92992fbe71331eb9b2c473`
- Health/food: 20/20
- World/game mode: `minecraft:overworld` / `survival`

## Checkpoints 14–16 — the required iron is acquired and proven

At Y41, a fresh exact raycast exposed iron ore at `(-11,40,-2)`. That exact
block was removed and its raw-iron drop was independently collected into the
inventory. Removing it exposed a second iron-ore block directly below at
`(-11,39,-2)`:

- [First iron ore exposed at Y40](checkpoint-14-iron-ore-exposed-y40.png)
- First ore removal: `environment_action_evidence:1ab0188ec9c73e1264175ff1f0d31578ca9e16444`
- First raw-iron collection: `environment_action_evidence:20bdf1e389a7525e4f2626b74958113b795d81231`
- [Second ore exposed at Y39](checkpoint-15-second-iron-ore-y39.png)
- Second ore removal: `environment_action_evidence:ea8fd55996420594d90303dd8045f7047059f4635`

The immediate explicit collection request after the second removal returned
zero because the falling player had already picked up the drop between the two
actions; that failed collect receipt is retained as
`environment_action_evidence:44ec96e46058867410bd81bcfff21117e32b3de16`
and is not itself treated as pickup proof. A later equip action verified raw
iron in the main hand, the visible stack count was three, and the furnace
transfer subsequently measured an exact three-item raw-iron inventory decrease:

- Equip proof: `environment_action_evidence:99cb4e42dbaa134ddbfe65ccef2430bd4fda55c41`
- [Three raw iron visibly equipped](checkpoint-16-raw-iron-equipped-inventory-proof.png)
- Exact three-item furnace deposit: `environment_action_evidence:c6ce5f503bd4951fc961330fe6895ebbfbf6c6ba8`

Together those independent postconditions prove the original raw iron plus the
two newly mined drops were present before smelting.

## Checkpoint 17 — underground smelting and bucket milestone

Using only Survival inventory and nearby exact placement, the run crafted and
placed a crafting table and furnace in a small Y39 alcove. It transferred three
raw iron into the furnace input and one coal into the fuel slot, then later
withdrew exactly three smelted ingots. Combining those with the pre-existing
one ingot made the four-ingot prerequisite concrete, and a bucket was crafted:

- Crafting table craft/place: `environment_action_evidence:c4cb36f46cc63c56ae5d1b0666452bd35b991e9d2`, `environment_action_evidence:07dda2f64b3f91965ed0f250940d8ac0bbf7ec5b6`
- Furnace craft/place: `environment_action_evidence:2d2c6d596cccf576dd4b98eccb766aba6e3edb3f2`, `environment_action_evidence:a4db169f930fcb00984121c6d245c244718243a46`
- Coal transfer: `environment_action_evidence:ceda306ead9c9aff1cc1fbe272d5d054c5d5c03c2`
- [Furnace visibly smelting](checkpoint-17-furnace-smelting-three-raw-iron.png)
- Three-ingot withdrawal: `environment_action_evidence:4dd6811db99d816adffba71f843b780e81d4a9b6c`
- Bucket craft: `environment_action_evidence:b265c486b02c8d8104f900f19cd269af9d5eac6d9`

The remaining iron ingot is reserved for flint-and-steel. A direct craft
precondition correctly failed because no flint was yet present; it made no
inventory or world mutation.

## Checkpoint 18 — repaired egress and safe reconnect pause

A loaded gravel target was discovered at `(-20,53,-13)`, but the first mining
approach stopped 18.53 blocks away with zero removals. Rather than forcing the
pathfinder, the run repaired the shaft: an exact three-cobblestone floor bridge
was placed (`environment_action_evidence:e365cf9651a3c89f92c6e036037eb5bd444732e8c`),
then the original descending cells were converted into a climbable staircase
with one verified support placement and jump per level. The player reached Y53
at full health:

- [Repaired egress at Y53](checkpoint-18-repaired-egress-y53.png)
- Y53 actor evidence: `environment_probe_evidence:a326d3764904d74dc56a49c871a3f84c8e108963`

The keyed MCP server later dropped during the first directional tunnel block.
The authorized opaque launcher restored the keyed server, and
`/api/account/session`, `/api/helix/pipeline`, and
`/api/agi/agent-providers` all returned HTTP 200. Because the restored server
correctly classified the old Fabric heartbeat as stale, only the exact
Minecraft client was restarted through the standard typed loopback launcher.
Its launch receipt reported `status=connected`, Fabric 1.21.8,
`autojoin_staged`, and `credentials_exposed=false`.

The launch receipt also measured host memory at 96.6%, still 96.3% after the
initial settle interval. The runbook's 95% hard stop was therefore applied:
no post-reconnect world mutation has been attempted. The active goal is
preserved at the safe Y53 checkpoint pending lower host memory and a fresh
connector heartbeat.

Screenshot SHA-256 integrity values for the new progression packet:

- `checkpoint-13-switchback-y51.png`: `EBCA54E778E5B00C25B7371580D112D61508ED72178BBD304176ECC06EC966B4`
- `checkpoint-14-iron-ore-exposed-y40.png`: `A04A7A3ACBBF0143EACF1DEC1079DBE9F0BF483215F337C4564E4E3E4F274F08`
- `checkpoint-15-second-iron-ore-y39.png`: `6F5010D417D7F5E44D5EE2F2CC84B3A80C108703A99D87E46F49BBBBB9FC1290`
- `checkpoint-16-raw-iron-equipped-inventory-proof.png`: `0157F687BBB114F5879CB8EDDADC25C45DAB3358B659FC7A0D5F0464FFB2FD46`
- `checkpoint-17-furnace-smelting-three-raw-iron.png`: `FE6752E37B4E2014B2993BA15A154D9081363D3447E5DA3EC7767B7C49DEE9AC`
- `checkpoint-18-repaired-egress-y53.png`: `99AF97061A933C7BE891BEA7B8C2D1E138396E1F80A528FF626CB7AA6C11AC5E`
- `checkpoint-19-gravel-exposed.jpg`: `D58121392CA93B06A3B5D2B72D985275E6565E8C05D965DD16DEB212A7ECB3C5`
- `checkpoint-20-flint-equipped.jpg`: `B04565708F0ADA6D14C6088C414F662B949228E99128C5D1D9593260D2EAAC92`
- `checkpoint-21-broad-mine-fall-low-health.jpg`: `7A625396FD67851CDF26CB232F2490A4C1D22A9DCBC61773390135384BBD465C`
- `checkpoint-22-inventory-no-food.jpg`: `AF62628BF1B136626052945386DC2B2E160161C8F5D08891F2E7C9C38399CF03`
- `checkpoint-23-safety-disconnected.jpg`: `980DA190EDAFA547CCDD0CCECAADB38C991A2F1C253D0282C3F053405F43751E`

## Checkpoints 19–20 — gravel reached and flint acquired

Fresh actor evidence proved the unchanged Y53 Survival state after reconnect.
The run completed the north tunnel to z=-13 and turned west, observing every
two-block cell before mining it. Gravel was exposed at `(-19,54,-13)`:

- Gravel actor proof: `environment_probe_evidence:d6cc0583e55e4f54ff36031eb2b6997e788e023b`
- [Gravel visibly exposed](checkpoint-19-gravel-exposed.jpg)
- First gravel removal: `environment_action_evidence:98543a6d46e4d20de416ee799d67c09c7217cf85e`

The first drop was explicitly shown not to be flint by failed equip receipt
`environment_action_evidence:68b684cfd097df054375be0a1f305d53288288842`.
The returned gravel was placed and mined in an exact nearby cell. The third
controlled cycle produced flint, independently verified by a successful
main-hand equip postcondition:

- Flint equip proof: `environment_action_evidence:2964386d353325224f04ef488d6b89203bc279f79`
- [Flint visibly equipped](checkpoint-20-flint-equipped.jpg)

The flint-and-steel craft made no inventory mutation. Independent equip probes
proved flint present but iron ingot and raw iron absent. This contradicts the
earlier reservation assumption: the bucket is proven, but one new ingot must
be acquired and smelted.

## Checkpoints 21–22 — broad-mine fall incident and safety stop

The furnace and crafting table were packed from the Y39 station for a new iron
expedition. Exact tunneling preserved full health until one unseen floor drop
caused 0.33 fall damage; the loop stopped and waited for full regeneration.

A later broad native mining approach was unsafe despite returning only a typed
non-progress failure. It moved the player from Y27 to Y9 and reduced health to
5/20 while removing zero iron ore:

- Unsafe broad-mine receipt: `environment_action_evidence:dcbec534588dfbdd7809690a0dffe3587d4956672`
- Low-health actor proof: `environment_probe_evidence:45f438989f80acc385e02d0efa093b4b418645b4`
- [Low-health cave state](checkpoint-21-broad-mine-fall-low-health.jpg)
- [Inventory inspection showing no carried food](checkpoint-22-inventory-no-food.jpg)

The run immediately stopped movement and mining. Fourteen common food IDs were
checked through non-world-mutating equip attempts; none were present. The
current state is health 5/20, food 17/20, saturation zero, at approximately
`(-24.7,9,-0.5)` in the Overworld. An adjacent crafting-table placement failed
safely because no valid support face existed; no table or diamonds were
consumed. The next live action must be a low-risk recovery action, not another
broad mining approach.

A second placement used the independently proven stone support at
`(-25,9,0)` and successfully placed the packed crafting table at
`(-25,10,0)` (`environment_action_evidence:831f9f182e834e6f4266a328b71eecca4ada2b3f4`).
The apparent inventory diamond stack was one diamond with component metadata,
so the diamond-chestplate craft correctly failed with zero production. A short
no-dig climb onto the table also failed with zero position or health change.
Because multiplayer time would continue to expose the 5/20-health player to
mobs, the client was deliberately disconnected at the exact saved checkpoint:

- [Disconnected safety checkpoint](checkpoint-23-safety-disconnected.jpg)

The active goal and legitimate Survival state are preserved. Recovery should
resume by reconnecting, verifying the exact actor state, then using only exact
supported mining/placement and bounded movement; broad native `mine` approaches
are excluded until the fall-safety defect is fixed and regression-tested.

The run has demonstrated authenticated observation, movement, exact mining,
collection, crafting, furnace inventory transfer, three-ingot smelting, bucket
crafting, bounded sequence execution, health checkpoints, manual-override
detection, server/client recovery, and state preservation across respawn. It
has **not** yet proven the G7 terminal result.

Remaining checkpoints:

1. Recover safely from the current 5/20-health, 17-food Y9 state without broad native mining or an uncontrolled fall; obtain food or establish a supported defensive crafting position.
2. Acquire and smelt one additional iron ore, then craft and equip flint-and-steel with the already-proven flint.
3. Acquire water/lava with the proven bucket or mine enough obsidian for a legal portal frame.
4. Place and ignite the frame in Survival mode.
5. Enter it and verify a fresh `minecraft:the_nether` actor observation.
6. Capture recovery, flint-and-steel, portal-frame, ignition, and Nether-arrival screenshots as supplementary visual evidence.

## Harness repair checkpoint — fall-safe locomotion

The full Survival journey remains paused. Development repaired the first
execution divergence instead of continuing from the damaged low-health state.
The Fabric companion now evaluates current health/fire/lava/fall state and a
bounded loaded landing-support probe before movement-producing reusable
workflows, native navigation, bounded walk, native final approach, and fluid
sequence input segments may assert forward control. Level support and a
one-block descent are admitted; low health, unknown geometry, lava, an active
fall, and a larger predicted drop return a typed refusal with released controls.

The clean companion build passes 151 tests with zero failures/errors. The
remapped and installed JAR hashes match at
`6E99DF6AC5829B9DF7B5F5BFDC30F2538C7FB58E50B2C7E033CBFA9DE7D8D0D4`.

One keyed live low-health walk probe initially exposed a false evidence claim:
the zero-tick refusal was labeled as motion. The result builder was repaired and
the current keyed retry now proves zero effects, zero motion, released controls,
`effect_prevented=true`, and exact reason
`locomotion_health_floor_crossed`:

- action evidence: `environment_action_evidence:d903b1a50b33483da855a72f38e51b23c069b34a3`
- pre-action actor evidence: `environment_probe_evidence:4dffb0a70c8f7c5f5c93f2b7d606ae6cb5b18ecb`

The final sequence-guard build is installed and the Minecraft client is safely
closed. A positive supported-movement/consecutive-action controlled course and
action/sensor heartbeat convergence remain required before declaring the
harness ready and resetting for the next full Nether journey.

## Checkpoint 24 — fall-safe positive course and harness-ready stop

The final 151-test companion was launched after an opaque local credential
rotation. The replacement policy-6 action authority admitted all 18 declared
capabilities; sanitized readiness reported a fresh manifest, fresh active
heartbeat, both native Fabric and Baritone control engines, zero active
workflows, released controls, no manual input, and no exposed credential.

The post-rotation negative boundary passed first. At health 5, a 250 ms walk
was refused in zero ticks with `locomotion_health_floor_crossed`, known level
landing geometry, `effect_prevented=true`, zero motion/effects, and released
controls:

- Actor: `environment_probe_evidence:2f08d8183817e72d9934d2e730f57408155e1680`
- Refusal: `environment_action_evidence:0c341c9219bd06bdf2369a1993b1124367f343bba`

Visible bread in the legitimate Survival inventory was moved to the hotbar and
consumed with a bounded input hold. No command, creative inventory, teleport,
or World Authority mutation was used. Food reached 20 and health recovered to
8.83 without displacement:

- Recovery actor proof: `environment_probe_evidence:2f04249805d9faa82745ac0514c39a90ab4a9a0c`

The positive action/reaction course then completed on the same loaded ledge:

- Forward 200 ms / 0.627 blocks:
  `environment_action_evidence:41f315f12f80e42befe9435f913f9055653aa57ad`
- Forward reaction at z=2.70:
  `environment_probe_evidence:f793908a3fd8b19645c089d19f410931f6eff112`
- Reverse 200 ms / 0.627 blocks:
  `environment_action_evidence:26168ea180617908821510a480886bc2ee5a834d0`
- Return reaction at z=1.84:
  `environment_probe_evidence:0d4d48cf5aad003dade2198d16e9bccf58ee051f`

One compact `survival_tas` sequence then performed six alternating supported
one-tick movement handoffs. All six inputs and the terminal node succeeded in
12 client ticks / 610 ms, with zero retries, zero deviations, no inventory or
world mutation, and released controls:

- Sequence: `environment_action_evidence:da660e4fdf5ccbe0e0e83e543696d0277d569fa77`
- Post-course actor at z=1.85, unchanged Y and no health loss:
  `environment_probe_evidence:b9a7c288e3987c34e6f0ba30e2848fcd0f0475fb`
- [Fall-safe positive course return](checkpoint-24-fall-safe-positive-course-return.jpg)
- Screenshot SHA-256:
  `AA25C9A34DBC903105219AD29888196936890018108EAAB600BE32094ED201FD`

This closes the harness-repair acceptance packet: fail-closed negative safety,
positive supported motion, consecutive local handoffs, compact evidence,
credential rotation, manifest admission, and action/sensor heartbeat
convergence all have live proof. It does not claim the G7 Nether terminal
result. The next goal may start the clean full Survival Nether journey using
this harness; broad unbounded mining remains excluded.

Minecraft was disconnected through the game menu and closed. The client
process was absent, and after the heartbeat lease elapsed the connector
correctly became `stale` and non-actionable while retaining zero workflows and
released controls. The recovered Survival checkpoint is therefore preserved
for the next goal.
