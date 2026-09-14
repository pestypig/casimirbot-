Program gate: G8
Workstream: CS1-CS4 prerequisite onboarding and binding repair
Capability or component: saved device trust, packaged database recovery and first-start admission
Lifecycle stage: source admission; tool admission; presentation
Reaction timescale: human-paced setup and bounded workstation startup
Authority owner: human grants device trust; authenticated MCP identifies the task; Helix admits scoped setup
Current maturity: implemented
Target maturity: deterministically verified admission repair and separately evidenced packaged rehearsal
Required evidence: actual MCP and native setup observations, real-store regressions, package comparison and unchanged CS5 inventory
Explicit non-goals: no gameplay consent, private model loop, impersonation, hidden reasoning, ET6 substitution or NAV1 promotion
Downstream gate unlocked: none

# Trust and first-start boundary, 2026-09-13 local date

This immutable increment supplements the [PostgreSQL recovery snapshot](2026-09-13-real-postgres-recovery.md)
and [parent continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md).
Timestamps below are UTC; work crossed midnight UTC while still September 13 locally.
The [work program](../../helix-environment-harness-work-program-v1.md) remains the sole status roadmap.

## Human trust and packaged recovery

The human reported clicking **Trust this device for Full Harness**. Native Agent
Access subsequently displayed **This device is trusted for Full Harness** and
the inverse removal control. A supported finite MCP tunnel request received
`trusted_device_delegation_applied: true`. No agent clicked a consent control.

The [PostgreSQL recovery package](2026-09-13-pg-recovery-package.json) was built,
compared and launched through ordinary native app control. Its EXE SHA256 is
`9ff5d362b6e0388586a6d716f0f7c01828a17fb9f01d8e01b3d8bc47039305da`.
The [fixture exclusion scan](2026-09-13-pg-recovery-fixture-scan.json) found no
known fixture markers. Main PID 9532, service PID 18116, window 264774 and service
readiness at `2026-09-14T00:03:10.965Z` were independently checked. The loopback
origin was `http://127.0.0.1:63376`; it is an observation, not a future default.
Service hash `3b4c80d0ae5c98824abb3237c5b32721b5596d6724637df53265e61842276be1`
matched the actual desktop build and packaged archive. All eight host artifacts,
645 runtime files and 635 renderer files matched their staged inputs.

After restart, a new five-minute request
`desktop_tunnel_request:15a3a05b-95d2-46bd-9b27-5aa246301d7a` received the saved
trust delegation and executed at `00:04:44.365Z`. No new trust, MFA, catalog
refresh or reconnect was requested. Native trust text remained present at the
later inspection around `00:25Z`. The old finite lease is not claimed current.

## Exact task and preparation observations

Authenticated supervisor presence declared only `tool_activity_only` for
`codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`. Profile and MCP client were
server verified; task continuation was client declared, not provider attested.
No earlier task's continuation, claim or binding was reused.

- Service: `service_instance:bea01374bfa9d3266db9472848d20f77`.
- Client session: `supervisor_client:4281f89a0845df2941f500d5136238cd`.
- Owner profile: `user:earnDsXQhAxnMGRbxwikP3Lt5iqtDGoF`.
- MCP client: `mcp_client:native_desktop:0fa264e9afc8db953121030a73f03842e7c60d940b4109108ccb89cdef0be5e4`.
- Durable destination: `pairing_destination:4e1c49b385d9ef121d3a90ecd843527b741d7cda8e657fae719e97463f016c92`.
- Destination digest: `690f1f336017b2f435e380af52e9d9a4cef247de10ee12aa4e127829db8dca98`.

Retrying the same destination registration preserved its ID, digest and
`2026-09-14T07:57:39.680Z` expiry across package restart. This proves registration
persistence in this rehearsal, not accepted pairing or current task availability.

The authenticated account initially had no visible room. MCP created one room,
`shared_realtime_room:2fb2513b-9914-4428-961a-12442cc4c621`, at
`2026-09-13T23:58:58.229Z`, with idempotency key
`cs-onboarding-20260913-linked-account-room-01`. Its sole participant was
`shared_realtime_participant:5660f9e8-893a-4d64-b430-7565a269a4ab`; all media
consents remained false. The exact room survived restart.

Ordinary **Ready up this room** created authenticated browser preparation intent
`environment_preparation:2f4c3f1aa4ac1c7432dcfc675350b092`, scoped to Helix chat
`534a24b1-62e2-4feb-9e47-48a8f6caff64`, the exact task and the room. The chosen
3600 seconds was a run budget, not permission. `discover_runs` returned no
candidates. Supported `prepare_run` created
`run_40672a22-8ced-4d4a-9909-d5fd1e72fbb1`, version 1, at `00:06:03.048Z` and
`agent_room_binding:3ad7c312-b0db-40f0-ad59-43bfe50f34e6`, version 1. Verified
room/run claims were published and revalidated. `ready` and task/action authority
remained false. No player or action lease was selected.

MCP created read-only Fabric source binding
`room_source_binding:96064865-879e-4c39-b7c7-35b7abe9536c` for
`source:room-ingress:17ff5685-c3a1-49a8-ab00-4c1cb6a87e2d`, adapter
`minecraft.fabric_mod.v1`, with the returned world ID
`minecraft:minehut:8fc80440-6fe`. The world ID is recorded literally; it does not
prove a running Minehut or local server. Supported opaque local pairing staged
`connector_pairing:4eeed25c-3044-499d-a8a6-2928397d039b` at `00:08:10.613Z`.
It expired at `00:18:10.613Z`; no redemption or connector manifest was observed.
No credential, show-once handle, pairing code or inbox content is recorded here.

## First divergence and repair

The actual MCP lifecycle call used the inspected pending projection
`environment_binding:pending:9a41b2c9bc242ab5fe5499cbc7272b18ed6bf703`, the exact
room, null action authority, explicit operator setup authorization and no client
restart. It returned `action_environment_not_found` before reaching the fixed
OS executor. The handler required an active environment even on the separately
trusted first-start path. Neither Java server nor Minecraft client was running.

The repair is **tool admission**. Pending startup now checks current room owner,
membership, open room, exact stored active Fabric source and absence of any
materialized connector together. It matches the pending ID using the existing
server-derived identity function. It does not trust a prefix or client projection.
Saved device trust is rechecked; a supplied player authority still takes the
existing exact active-authority path, and restart without that lease still fails.

The new real-store MCP fixture reproduced the same `action_environment_not_found`
failure before the patch. After the patch, 29 tests passed across pending-source
admission, existing lifecycle MCP and executor suites. Cases include forged ID,
wrong room, revoked source, non-Fabric source, non-owner member, closed room,
absent player authority, forbidden restart and device-trust revocation. The
fixture reaches an injected OS runner reporting `minecraft_loopback_server_not_listening`;
it does not launch a game or prove a packaged workflow. Quick discipline passed.

Logs: `.tmp/pending-bootstrap-red-20260913.log`,
`.tmp/pending-bootstrap-green-20260913.log`, and
`.tmp/pending-bootstrap-discipline-20260913.log`.

The next inspected prerequisite is separate: the existing lifecycle script only
joins a listening server and has no dedicated-server start branch. The saved
current-profile server directory is `minecraft/helix-fabric-sensor/run/combat-c0-server`
in this checkout; its configured loopback port is **25566**, not the tool default
25565. Its existing EULA file says accepted. No server properties, profile mapping,
credentials or EULA were modified, and no server was started through an ad hoc
command. Ordinary packaged server startup remains required.

## Requirement-by-requirement CS5 supplement

All exits remain incomplete; this table retains the prior full requirement inventory.

| ID | Evidence added / remaining proof |
| --- | --- |
| CS1.1 | Actual shared browser-intent/MCP preparation exercised; fully ready MCP/EXE agreement still required |
| CS1.2 | Exact task/chat/room/run preparation recorded; admitted source/player/lease/controller/goal chain still required |
| CS1.3 | Durable destination and room reused across restart; three integrated Ready up calls and zero unnecessary rotations still required |
| CS1.4 | Human device trust saved and reused; full independent finite pairing/source/action/goal lifecycle still required |
| CS1.5 | Packaged PG repair and registration restart observed; complete wrong-profile/stale-subject/durable-goal recovery matrix still required |
| CS2.1 | No accepted task pairing or prompt trace; visible natural ingress, truthful origin, pickup and acknowledgement still required |
| CS2.2 | No new ingress negatives; exact-chat/run/epoch isolation and duplicate-effect proof still required |
| CS2.3 | Public checkpoint and supported exact-task delivery remain unqualified; authoritative post-observation answer path still required |
| CS3.1 | No movement executed; useful course and three linked successors through actual compiler/broker/resident executor still required |
| CS3.2 | No live movement timing; observation/admission/delivery/activation/runway/stall/release timings still required |
| CS3.3 | First-start failure identified; complete four-plan faults and live reconnect/backpressure matrix still required |
| CS4.1 | No gameplay interruption; override/stop, successor invalidation and release latency still required |
| CS4.2 | Trust revocation covered in fixture only; broker/connector/executor action revocation and fresh no-motion proof still required |
| CS4.3 | Setup receipts re-entered this task; fresh environment observation changing reasoning and response still required |
| CS4.4 | PG repair packaged and launched; pending-source repair packaging was in progress at this snapshot; complete companion/package qualification still required |
| CS4.5 | Trust and setup survive ordinary EXE restart; full consent/prompt/result/recovery workflow and server startup still required |
| CS5.1 | Requirements retained without promotion; complete CS1-CS4 acceptance handoff still required |

O1/O2/O5/O6 gain scoped setup and recovery evidence, without closing their full
matrices. Automatic delivery remains unavailable in the native panel. Durable
pairing was neither approved nor accepted. Original ET6 remains unpassed; NAV1
remains unqualified, with the separate NAV-EQ dependency rule unchanged. No
physics, adapter contract, certificate, trace-export or release-verifier behavior
was changed in this admission patch; no Casimir verification claim is made.
The persistent goal remains active and incomplete.
