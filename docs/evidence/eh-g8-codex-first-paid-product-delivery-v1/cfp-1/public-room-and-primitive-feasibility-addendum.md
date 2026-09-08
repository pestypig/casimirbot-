Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1 bounded technical handoff addendum
Capability or component: Ordinary-user owner-room route reachability and exact mining/collection primitives
Lifecycle stage: admission (primary); source-only execution-contract inspection
Reaction timescale: durable specification; native tick behavior inspected but not measured
Authority owner: Owner selects scope; Helix owns admission; external Codex chooses exact actions; native Fabric executes admitted effects
Current maturity: specified
Target maturity: specified with concrete implementation and acceptance assignments
Required evidence: source route/handler/test map and primitive feasibility findings
Explicit non-goals: no runtime/canonical edit, live test, rights clearance, paid implementation admission or maturity promotion
Downstream gate unlocked: none; CFP-1 and commercialization rights blockers remain

# Public owner-room and primitive feasibility addendum

Source-only inspection of the current Desktop working tree. No test was run.
This supplements the scope proposal without changing its earlier candidate or
claiming that its thresholds are already enforced.

## PUBLIC route inventory

The browser router mounts under `/api/agi` in `server/routes.ts:394`; paths in
the next table include that prefix. The external room API uses `/api/v1/rooms`.
Both surfaces must reach the same trusted policy and domain identity checks.
MCP access remains a third entry, not a replacement for API tests.

| Public owner journey | Exact browser route and source handler | Required retained boundary / tests |
| --- | --- | --- |
| Create/list/inspect owner work room | GET and POST `/api/agi/realtime/rooms`; GET `/api/agi/realtime/rooms/:roomId`; `server/routes/agi.realtime-room/room-lifecycle-routes.ts:42`, `:54`, `:120` | `requireSharedRoomAccountContext`, trusted profile, idempotent create, owner membership. Existing `server/services/helix-ask/realtime-room/__tests__/room-lifecycle-route.test.ts`. Add eligible ordinary-user creation plus signed-out/unentitled/cross-owner denial without developer promotion. |
| Owner presence and consent | POST `/api/agi/realtime/rooms/:roomId/presence`; PATCH `/api/agi/realtime/rooms/:roomId/consent`; `participant-routes.ts:56`, `:33` in same directory | Presence calls `updateSharedRealtimeRoomPresence`; consent calls `updateOwnConsentFromFirstPartyUi`. Existing `room-participant-route.test.ts` in same test directory. Consent cannot be inferred from paid state; exact participant only; revoke works after software expiry. |
| External room API | GET/POST `/api/v1/rooms`, GET `/:roomId`; `server/routes/helix-shared-live-rooms.ts:378`, `:397`, `:620` | Calls `SharedLiveRoomControlService.listRooms/createRoom/inspectRoom`; read/manage scopes and shared `requireFeature` at `server/services/shared-live-room-control/service.ts:640`. Existing `server/routes/__tests__/helix-shared-live-room-transports.test.ts`, `helix-shared-live-room-oauth-e2e.test.ts`, service `__tests__/service.test.ts`. Add same paid-user policy at service boundary, not route-only flag. |
| Bind source | GET/POST `/api/v1/rooms/:roomId/sources`; `server/routes/helix-shared-live-rooms.ts:536`, `:559` | `listSourceBindings/createSourceBinding`; source-manage scope and owner admission. Do not permit arbitrary source URI, credentials or another owner's connector. Reuse transport/service tests. |
| Inspect environment / select self player | GET `/api/agi/realtime/rooms/:roomId/environments`; GET `.../:environmentBindingId/subjects`; PUT/DELETE `.../:environmentBindingId/me`; `environment-routes.ts:269`, `:288`, `:320`, `:965` | Exact room/environment subject and profile binding. Existing `room-environment-subject-route.test.ts`; stale/wrong-player/epoch and self-unbind cases. Keep owner setting another participant's subject (`PUT .../participants/:participantId/subject`, line 988) outside initial single-user offer. |
| Pair local companion | GET/POST `/api/agi/realtime/rooms/:roomId/connector-pairings`; POST `.../local-source-handoff`, `.../local-player-handoff`; `connector-pairing-routes.ts:172`, `:344`, `:190`, `:294` | `ownerContext`, same-origin/no-store/rate limits and opaque native handoff. Existing pairing `__tests__/service.test.ts`, `bootstrap-service.test.ts`, `local-player-pairing-handoff.test.ts` under `server/services/environment-connectors/pairing/`. Source-only versus action-only pairing stays separate; exclude command-only local-server handoff from initial offer. No key-copy onboarding. |
| Admit effect lease / stop | GET/PUT `.../:environmentBindingId/action-authorities`; DELETE `.../action-authorities/:actionAuthorityId`; POST `.../action-authorities/:actionAuthorityId/controls`; `environment-routes.ts:485`, `:757`, `:843`, `:438` | `configureEnvironmentActionAuthority`, current owner/subject, exact bounded capabilities. Controls need exact workflow/kind/reason. Preserve revocation after billing loss. Existing MCP Minecraft action and gateway environment-action/control tests plus route coverage; add ordinary-user bounded authorization and direct-service bypass tests. |
| Native action credential | POST `.../:environmentBindingId/action-authorities/:actionAuthorityId/credential`; `environment-routes.ts:795` | Existing route can return credential material intended only for paired client. Do not expose through model or make it the public wizard path. Use native opaque player handoff and prove no secret in UI/MCP exports. |
| Readiness/durable identity | POST `.../:environmentBindingId/play-readiness`; POST `.../durable-goals`; GET `.../durable-goals/:goalId`; `environment-routes.ts:531`, `:629`, `:660` | Exact selected task, environment/player/epoch and monitor; readiness is not admission. Existing `environment-durable-goal-route.test.ts`. Retain failed attempts/reconnect with same objective and no automatic effect replay. |
| Bind external run/chat | POST `/api/v1/rooms/run-bindings`, `/chat-bindings/claim`; DELETE matching `/:bindingRef`; `server/routes/helix-shared-live-rooms.ts:430`, `:458`, `:488`, `:511` | Exact profile/run/room, one-time claim handle, manage+run-write scopes; `SharedLiveRoomBindingStore`. Existing `server/services/shared-live-room-control/__tests__/binding-store.test.ts` and transport tests. Revoke routes deliberately do not require current room-feature check; preserve safe withdrawal after entitlement loss. |

Public reachability changes must address `server/routes/agi.realtime-room/http-context.ts:76–103`,
shared account policy, room control service feature checks, MCP
`requireCurrentRoomFeature`, and gateway capability policy. The native lifecycle
MCP and gateway still explicitly require developer. The PUBLIC implementation
packet should introduce one narrowly scoped trusted eligible-owner-room
decision consumed at these boundaries, retaining all old developer permissions.
Do not simply enable the global `shared_realtime_rooms` flag for every purchaser.

Non-offer paths remain denied: invites/join/other members, arbitrary room
commands (`/api/v1/rooms/:roomId/commands` currently returns 501), command
authority/credentials/grants, provider session/media binding and unrelated
environment actions. First-party safety withdrawal remains available to its
owner independent of software eligibility.

## Mine plus collect feasibility

Confirmed existing schema in `shared/helix-minecraft-player-capabilities.ts:399–419`:
`collect` permits count 1–2304 and positive search radius <=128; `mine` permits
count 1–4096, integer radius 1–32 and optional exact `target_position`.
Exact-target mining requires count=1. These are engine/schema ceilings, not
appropriate paid-pilot limits or an owner-selected fixed work-area guarantee.

`NativeFabricWorkflowEngine.java:692–739` implements collection as a native
workflow: record inventory baseline, succeed when delta reaches requested
count, repeatedly select nearest matching live ItemEntity in a bounding box
around the **current player**, then call `navigateToward(...,0.75,true)`.
No matching target for over 40 ticks yields typed failure. It is not a raw item
pickup primitive: it moves and may sprint/jump. The search region moves with
the player; source inspected here does not establish a fixed world-area limit,
exact drop identity, origin-of-item provenance or exact upper inventory delta.
Already collected drops before the workflow baseline do not count toward its
requested delta. Blindly mine six then collect six may therefore wait for six
additional drops even if some cobblestone is already in inventory.

`navigateToward` at lines 2006–2050 uses local safety admission, then looks
toward target and asserts forward, jump on grounded collision, and caller's
sprint flag. It is existing native steering, not the ET rolling compiler or
the new NAV route-search stack. Thus collect is **navigation-dependent in
behavior**, although source shows no direct dependency on unimplemented NAV1
or ET6. We cannot advertise route competence or declare a fixed region safe
just because it uses an existing method. Selected movement/safety qualification
would still need acceptance under its current adapter contract.

Mining at lines 741–990 chooses nearest matching block unless exact target is
supplied, verifies loaded/matching/exposed target and uses sensor affordances.
Out-of-reach or insufficient focus can itself call `navigateToward` (lines
915 and 963). Even exact-target mine is **not a stationary guarantee**. It
releases movement while in range and focused, then uses ordinary native block
breaking. The result measures changed block IDs/removal count, not inventory
receipt. At lines 782–786 a target no longer matching the original block is
counted as removal; attribution to the agent rather than another actor needs
an adversarial acceptance case and potentially tighter evidence semantics.

Therefore six-cobblestone collection is not source-proven within the proposal's
fixed work area and no-navigation promise. Do not make it a mandatory success
target until fixed-region movement admission, item-delta semantics and causal
evidence are resolved. No need to ask the owner to interpret these internals.

## Recommended concrete initial task refinement

Use **clear an explicitly selected reachable stone obstruction** as the
smallest genuine work product supported by exact primitive source:

"Remove these two stone blocks blocking my build space. Show me the targets
first, remove only those, and stop if you cannot reach them safely."

Codex observes, proposes exact two block positions and their current IDs, gets
one bounded approval, then issues two independent `mine` actions with count=1,
exact `target_position`, `block_id=minecraft:stone`, and search_radius=3.
Each second action follows fresh observed state; no sequence/rolling program or
deterministic prompt-specific plan is introduced. Initial actor position must
place both exposed targets in native interaction range. Success is both exact
positions no longer stone, no other removed blocks, controls released and
truthful evidence re-entry. Inventory is reported as separately observed, not
guaranteed. Proposed upper task duration is 120 seconds; partial completion and
safe refusal remain visible, not mislabeled success.

Two necessary capability hardening items remain before promising "only these"
or a stationary work envelope: (1) trusted admitted request must carry the exact
positions plus a two-effect cumulative ceiling, not merely mine capability;
(2) deny or stop native approach outside the frozen movement allowance, with
an explicit no-approach/stationary policy if selected. The current schema does
not expose that switch. The bounded task is technically small but still needs
implementation/acceptance; it is not a source-only declaration of readiness.

CFP-2.CAPABILITY tests should extend existing
`NativeFabricWorkflowEngineMiningGeometryTest.java`, `MiningTargetAffordanceTest.java`,
`server/mcp/__tests__/helix-mcp-minecraft-action.test.ts`, gateway
`__tests__/environment-action.test.ts` and action-broker admission tests.
Add exact-target mismatch/unloaded/out-of-radius, obstructed focus, attempted
approach outside allowance, wrong block, external-actor target removal,
duplicate request/fingerprint, interruption after first block, stale epoch,
revoke and zero third effect. Existing geometry tests do not prove full native
live execution, pickup provenance or new public policy. No tests ran here.

Technical recommendation: freeze this obstruction-clearing candidate and its
conservative defaults in the implementation proposal, with collection reserved
as a separately qualified enhancement. Product owner may select greater value
later; there is no reason to weaken movement or evidence contracts to force
the original six-cobblestone wording. Commercialization review remains a
hard prerequisite for paid Minecraft implementation regardless of task size.
