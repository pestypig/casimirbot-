Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.SCOPE / CFP-1.CLAIMS / CFP-1.POLICY draft
Capability or component: Proposed paid external-Codex local Minecraft assistance and public-user admission
Lifecycle stage: presentation (primary); admission and acceptance specification only
Reaction timescale: durable planning; proposed runtime limits below require review
Authority owner: Product owner selects scope; canonical program owners reconcile dependencies; Codex owns reasoning; Helix owns identity/admission/evidence; Fabric owns admitted effects
Current maturity: specified
Target maturity: specified with owner-selected scope and frozen acceptance contract
Required evidence: reviewed CFP-0 inventory, exact handler mappings, owner decisions, prerequisite disposition and twelve-requirement matrix
Explicit non-goals: no canonical or runtime edits; no live tests; no stage promotion; no license/charge/publication; no bundled reasoning runtime
Downstream gate unlocked: none from this proposal; CFP-1 coordinator review and closure are required

# Scope, claims and public policy proposal

Draft status: owner selected bounded Minecraft assistance first. Exact task,
thresholds, commercial classification and remaining choices await review.
Prepared from the current Desktop working tree, not a clean release checkout.
No test result is asserted from the presence of source or test files. This draft
does not change the canonical G8/CFP stage, public permissions or existing gates.

## Proposed useful task and scope

Recommend a bounded **local resource collection assistant** for the initial
pilot: on the user's already licensed Minecraft Java installation, external
Codex inspects an owner-selected small work area, proposes a finite mining and
collection plan, obtains explicit effect approval, performs it through ordinary
Player Embodiment, and reports measured blocks removed and inventory received.

Candidate natural task within the selected bounded-assistance scope: "Collect six cobblestone from the stone in this work
area for my next build. Show me the plan first, stop if the area becomes unsafe,
and tell me what actually reached my inventory."

Commercial admission blocker: the parallel rights review identified Minecraft
EULA mod-monetization restrictions requiring classification/permission review
for the intended paid distribution. This draft is a technical candidate only.
Neither a free connector nor charging for an adjacent harness is assumed to
resolve those restrictions. Do not close CFP-1 or admit paid Minecraft
implementation until the rights reviewer resolves the selected distribution.

The Usage Guidelines also restrict direct or indirect verification of access
to out-of-game products affecting in-game functions. All software-to-Minecraft
checks below are conditional proposals, not approved implementation instructions.
CFP-2 uses only the isolated pre-release evaluation boundary specified in the
parent; CFP-3 adds verified commercial grants. Neither design bypasses rights review.

Candidate measurement envelope (all values PROPOSED, not accepted): a selected
6 x 6 x 4-block region; six ordinary stone removals maximum; six cobblestone
inventory increase; one pre-existing suitable pickaxe; no inventory grants,
crafting, placement, commands or World Authority during measurement; up to
five minutes after effect approval; at most two bounded repair attempts with
fresh evidence; one explicit initial effect approval, additional approval only
if scope would change. The user positions the actor at a safe reachable work
face and may walk it to recover; the product does not promise autonomous route
finding. If drop collection needs unaccepted movement, return measured partial
completion and stop; do not broaden navigation authority to satisfy the target.

This task deliberately includes inventory collection: a mined-block receipt
alone is insufficient customer value or proof of delivered resources. It is a
candidate until adapter owners verify that mining plus bounded collection can
satisfy the envelope without unaccepted NAV or ET rolling semantics. Failure
of that feasibility review returns scope to the owner; it does not authorize
a scripted success path. A lighter "remove six reachable stone blocks" offer
is an explicit alternative with weaker value, requiring owner choice.

External Codex funds its own reasoning. The installer provisions the selected
harness/companion components and documented connection, not a second reasoning
runtime. Freeze exact Windows build/architecture, Codex build, MCP transport,
Minecraft/Fabric/Java/connector versions, machine memory/CPU/GPU baseline and
artifact hashes in the child acceptance manifest. The coordinator's current
source inventory proposes Minecraft 1.21.8, Fabric Loader 0.18.4, Fabric API
0.136.1+1.21.8, Java 21, PlayerAgent 0.4.12, Sensor 0.3.0, core 0.2.0,
desktop 0.1.0-alpha.11 and Electron 43.4.0. These are source-version candidates,
not a proven compatible release. The older PNA3.6 receipt names PlayerAgent
0.4.0 and cannot qualify the newer set. Freeze the actual external client's
executable version, hash, build identity and supported connection behavior in
preflight; an evolving Codex/ChatGPT desktop product name or "latest" cannot
substitute for that identity. Exact Windows build/hardware remains to select.

Proposed performance envelope: exactly ten planned normal trials across two
clean ordinary-user profiles, all ten required to pass, plus separate adversarial
scenarios; report all trials with no discarded failures. First-run readiness <= 15 minutes excluding clearly
logged external downloads/login waits; repeat readiness <= 2 minutes; task <=
5 minutes after approval; repair from supported reconnect <= 60 seconds after
transport restoration. No secrets, cross-owner grants, duplicate effects or
late effects after the accepted stop boundary in any trial. Keep the existing
4 ms p95 sensor budget where applicable; a new upper bound may tighten but may
not weaken an existing contract. Proposed safety stop target is <= 2 healthy
Fabric ticks after local stop admission, with separate wall-clock measurement
and loss-of-tick/watchdog acceptance from the adapter contract. Do not claim
end-to-end emergency-stop latency from that local interval alone.

The initial paid pilot excludes fluent exploration, Nether completion, combat,
public companion gather/craft, voice control, remote sharing, second-device
continuation and closed-task wake as advertised pilot features. This is an
offer exclusion, not removal of those canonical G8 acceptance obligations.

## Concrete capability and handler map

Existing identifiers below are source-inspected. The proposed software SKU
`casimir.minecraft.local_assistance.v1` is NEW SPECIFICATION ONLY and must not
be represented as an existing entitlement or capability registration.

| Operation | Existing identifier / boundary | Source and proposed treatment |
| --- | --- | --- |
| Launch selected local session | `environment.minecraft.fabric_loopback.launch_and_join`; MCP `helix_minecraft_local_lifecycle_launch` | `shared/helix-minecraft-local-lifecycle.ts:3`; `server/mcp/helix-mcp-server.ts:7754`; `server/services/helix-ask/workstation-tool-gateway/minecraft-local-lifecycle.ts:157`; `server/services/environment-connectors/installations/minecraft-fabric-loopback-lifecycle.ts`. Existing MCP checks trusted developer at 7779 and gateway checks developer at 170. CFP-2.PUBLIC must admit an exact paid-user local-host path without the broad developer bootstrap. Launch grants no game effects. |
| Observe actor / area / inventory | MCP `helix_minecraft_actor_status`, `helix_minecraft_situation_probe` | `server/mcp/helix-mcp-server.ts:7892` and `:8046`. Exact room/player/source/epoch/read grants remain mandatory. Paid capability selection must name supported probe kinds; compatibility actor-status projection is not dedicated-tool catalog acceptance. |
| Configure, inspect, revoke effect authority | MCP `helix_environment_action_authority_configure`, `helix_environment_action_authority_inspect`, `helix_environment_action_authority_revoke` | `server/mcp/helix-mcp-server.ts:7319`, `:7366`, `:7420`; `server/services/environment-connectors/actions/authority-store.ts`. User grants exact effects; payment never configures a lease automatically. Revoke stays reachable without an active purchase. |
| Mine and collect | `com.casimirbot.minecraft.player.mine`, `com.casimirbot.minecraft.player.collect`; MCP `helix_minecraft_player_action` | `shared/helix-minecraft-player-capabilities.ts:35`; `server/mcp/helix-mcp-server.ts:8919`; `server/services/helix-ask/workstation-tool-gateway/environment-action.ts`; `server/services/environment-connectors/actions/action-broker.ts`. Trusted software eligibility belongs in shared admission, not only MCP/UI. Apply six-block/effect/area limits after exact capability decoding; do not allow every action accepted by the union schema. |
| Look / bounded reposition if separately needed | `com.casimirbot.minecraft.player.look`, `.walk` | Same capability file and player-action handler. Default proposal permits look; walk requires separately frozen displacement/boundary limits. `.navigate`, sequence and guardian program admission are not inferred from mine entitlement. |
| Stop and status | `com.casimirbot.minecraft.player.workflow.status`, `.workflow.cancel`, `.emergency_stop`; workstation `environment.action_authority.revoke` | Same capability file; `server/services/helix-ask/workstation-tool-gateway/environment-action-control.ts`; authority store. Permit authorized safety control regardless of billing expiry. No permission to stop another owner's unrelated run. |
| Monitor and re-entry | MCP `helix_environment_monitor_create`, `_inspect`, `_read`, `_acknowledge`, `_snapshot_record`, `_revoke` | `server/mcp/helix-mcp-server.ts:8250–8450`; existing monitor store. Exact continuation/run/epoch/cursor; finite budgets, no closed-task wake claim. Needed if selected task relies on semantic events/durable-goal recovery. |
| Exact task and public lifecycle | `helix_reasoning_task_binding_claim`, `helix_reasoning_steering_read`, `helix_reasoning_steering_acknowledge` | `server/mcp/helix-mcp-server.ts:4566–4633`; PNA lifecycle contracts. External principal claims its own task; native desktop cannot impersonate plugin principal. Voice transport is not required for the proposed pilot. |
| Connector execution delivery | action manifest/heartbeat/poll/event/result/control routes | `server/routes/environment-action-routes.ts:114` onward. These are connector bearer-scoped southbound routes, not purchase-activated customer endpoints. Revalidate lease/epoch/eligibility at trusted enqueue and immediate effect boundary; do not replace connector credentials with a software license. |
| Room/account reachability | `shared_realtime_rooms`, exact owner room membership and relevant public capability policy | `shared/helix-account-session.ts:118–191`, `:236`; `server/routes/agi.workstation-tool-gateway.ts`; MCP `requireCurrentRoomFeature`. Public catalog inclusion is not room access. Need a narrow ordinary-user owner-session/work-room route using existing contracts; do not broadly enable all room controls. Exact affected room routes must be enumerated by CFP-2.PUBLIC before edits. |

## Public policy contract

Keep account types `developer` and `user`; no session remains `user`. Purchase
does not convert account type. Developer remains a superset of every current
panel, action and experimental capability, under existing consent/identity
boundaries; a commercial restriction must not make developer access disappear.

For a normal user, trusted admission requires: authenticated profile; eligible
software grant for this capability and device; current supported client
authorization; exact owner room, participant and player binding; fresh source
and connector epoch; explicit effect consent; finite current effect lease;
resource arbiter admission; no stop/revoke/expiry barrier. Model billing is a
separate external-client responsibility. Payment is never action approval.

Specify one server-derived eligibility decision shared by UI projection, direct
API, MCP and service enqueue paths. Add exact capability/action constraints at
the trusted service boundary; never admit arbitrary actions because one MCP
tool contains a union of many operations. Do not use client-submitted account
type, plan label, receipt, panel visibility or feature flag as trusted proof.

Admission/cancellation rules must preserve safety when software access ends:
deny new effects and new lease extensions, keep status/history/export/account
management and owner stop/revoke reachable, and settle/reconcile admitted work
under the selected expiry contract. Whether already admitted work finishes or
stops at its next safe checkpoint is an OWNER DECISION; in neither case can
expiry replay ambiguous effects or silently renew authority.

Required rejection matrix for every selected mutation: signed out, user with
no entitlement, wrong device/owner/room/player, revoked or expired grant,
scheduled cancellation before period end, actual period end, refund/reversal,
expired OAuth, stale epoch/observation, forged account/plan claim, exhausted
effect ceiling, manual override and Emergency Stop. Test through UI/direct
API/MCP and bypass-oriented direct service calls. Scheduled cancellation must
follow selected paid-period semantics, not be treated automatically as immediate
revocation. Include unchanged developer reachability and unrelated capability
denial as independent tests. Keep negative governance success separate from
positive task success.

## C01–C08 proposed canonical reconciliation

| Conflict | Proposed resolution; owner and retained boundary |
| --- | --- |
| C01 | PNA owner labels PNA3.6 a hash-bound unpacked diagnostic installed action observation composed with earlier external-task evidence. Retain narrow evidence and PNA2 signed-repeat prerequisite; no full Stage 3 installed acceptance. |
| C02 | Environment/perception owner records later narrow Survival walk/lava-scene observations after historical Invalid session; P3 labelled benchmark and P4 full course remain unaccepted and capability remains specified. |
| C03 | Product owner chooses explicitly whether M3-X/EH-NFO-1 are universal G8 requirements or federation-release requirements. Recommendation: reserve broader federation acceptance for its own offer while retain twelve canonical core obligations; this still requires a real second-device checkpoint for requirement 9. Until approved canonical edit, stricter federation dependency remains. |
| C04 | Distinguish pilot advertised features from complete G8 room/voice/second-device acceptance. Recommendation: permit a narrowly labelled pilot after its complete acceptance matrix, but do not call it G8 closed/release-ready. PNA Stage 5 requirements are preserved until scope owner explicitly reconciles them. |
| C05 | Label companion C3 A1/B private immutable-case retrieval with exact identity/revoke evidence; no public live mining/gather/craft authority. C4/S6 remain blocked on NAV8. |
| C06 | Product/business/SPB owners distinguish paid software SKU from optional managed model credits/RTP and existing public licensing rights. Reuse SPB foundations, retain optional provider stage ordering; no claim SPB5–9 are complete. Rights reviewer must approve actual source/distribution boundary. |
| C07 | Canonical capability table owns current scoped maturity; historical headers are history. Helix parity G1 remains independently active with its own live evidence requirements; environment G8 does not close it. |
| C08 | Link ET6 supplement's exact passing isolated diagnostic startup while retaining stage_breakdown_complete=false and no live capacity result. ET owner closes attribution then original ET6 qualification; NAV1 remains locked. |

## Twelve canonical G8 acceptance scenarios

Every row remains a G8 obligation. Numeric targets above are proposals only;
existing stronger adapter or safety bounds prevail. An omitted pilot feature
does not turn a broader requirement into PASS or not-applicable.

| ID / canonical requirement | Concrete acceptance scenario | Dependency / proposed offer classification |
| --- | --- | --- |
| G8-01 ordinary-user install | Clean Windows user installs signed immutable host/companion without repository checkout, developer secret, command launcher or model-runtime package; performs proposed task. | PNA1/2, CFP-2.PUBLIC/ONBOARD, CFP-3.SIGNING/DISTRIBUTION. Pilot required. |
| G8-02 exact OAuth identity | Two profiles authorize supported client; exact profile/node/client binding, denied cross-profile access, revoke and fresh consent recovery; zero secret material in logs/model/UI exports. | Native broker/SPB3/PNA2; pilot required. |
| G8-03 catalog parity | Same release advertises selected paid-user capabilities in UI/API/MCP; enumerate actual catalog after restart/upgrade and execute each allowed narrow handler; denied capabilities remain denied. | Public policy/catalog/PNA2; pilot required, connection-only insufficient. |
| G8-04 natural durable objective | External Codex selects bounded mine/collect operations from current observations; checkpoint objective identity survives a supported interruption without a scripted mine sequence or duplicate effect. | Existing durable-goal/action admission; ET6 required if implementation uses temporal rolling; pilot task cannot assert durable acceptance unless this passes. |
| G8-05 time-critical local invariant | During deliberate provider delay, admitted local controller stops on a selected hazard/lease loss and releases controls under frozen adapter timing; no model-per-tick dependence. | Responsive sensing/guardian evidence and relevant ET6 if used; broader G8 required. Pilot at least requires its selected stop/watchdog invariant. |
| G8-06 unexpected change | Owner interrupts or removes a target using ordinary gameplay; event/fresh observation re-enters same exact Codex task; visibly changed plan or truthful safe cancellation, no unchanged retry loop. | Monitor/perception/re-entry; pilot required. No induced dangerous fixture needed. |
| G8-07 failed attempt continuity | One bounded obstruction fails with typed reason; later valid re-observation and admitted retry produces verified subgoal result while failure remains in public ordered trace. | PNA activity, durable identity, exact receipt re-entry; pilot required. |
| G8-08 release/fail-closed | Independently test manual override, revoke, effect lease/software expiry, disconnect and Emergency Stop; controls settle, no duplicate/replayed late effects, status/revoke remain accessible. | Broker/arbiter/native controls + selected expiry contract; pilot required. |
| G8-09 member/second device | Real second physical device/member observes or steers only consented scope; reconnect/revocation exact, no ambient authority. Same-device dual-EXE cannot count. | M3-X and stricter M7/EH-NFO-1 interpretation until C03 reconciled; outside pilot claims, retained G8. |
| G8-10 text/API/voice terminal | Feed exact final supported outcome and failure into each supported surface, compare terminal identity/support refs/uncertainty; voice never stronger than text. | PNA voice/terminal projection/Helix parity; text/API pilot required, voice broader G8 retained. |
| G8-11 direct/keyed parity | Matched direct Codex, authenticated MCP and keyed Helix conditions/permissions/sources yield same admissible task effect, observation and terminal semantics; record first divergence. | Separate Helix parity G1+required subsequent acceptance; external-client success alone insufficient. Broader G8 retained. |
| G8-12 one-computer resource/recovery | Frozen machine runs same signed artifact+Codex+Minecraft; record setup/task/reconnect timings, peak memory/commit/CPU, tick/control timing; crash/restart resumes exact checkpoint or fails closed without lowering memory guard. | CFP-4.RECOVERY, ET6 relevant timing and intended-hardware profile; pilot required. |

Second-domain transfer remains the accepted read-only/shadow G7 regression;
no brokerage mutation entitlement follows from this Minecraft offer. Canonical
Nether/unknown-world monitor/steering requirements remain separately open even
if all proposed bounded pilot task trials pass.

## Evidence, unresolved choices and handoff

Source inspected: CFP1 handoff, CFP0 audit C01–C08 and supplemental ET6 capture,
canonical environment work program and product acceptance goal, environment
reasoning/dual-plane contracts, shared account policy and Minecraft capability
constants, MCP lifecycle/action/monitor/reasoning registration and handlers,
gateway local lifecycle/action entry, connector action routes. No runtime
tests or new live evidence. The CFP0 historical evidence set remains the exact
baseline; no present signing, user-policy, useful-task or performance PASS.

Owner-selected scope: bounded Minecraft assistance first. Choices still needed:
six-resource collection versus lighter block-removal within that scope;
selected environment/hardware/version baseline;
proposed limits/repeated-trial thresholds; commercial expiry semantics; narrow
pilot versus full G8 release scope; C03 federation scope; whether optional
voice/remote features enter the offer. Rights/price/distribution decisions are
separate assignments. Broader durable gathering is not the selected initial
scope. Do not infer remaining choices from silence. Minecraft commercial
classification/permission remains an explicit rights blocker.

Before CFP-2 dispatch, CFP-1 coordinator must freeze those decisions, verify
mine/collect feasibility, enumerate exact owner-room public route bindings,
and create PUBLIC/ONBOARD/CAPABILITY child packets with file ownership and
targeted rejection/acceptance tests. Any temporal/navigation reliance consumes
ET6/NAV gates; selecting a small task does not waive implementation dependencies.
