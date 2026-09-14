# Continuous-session handoff after controlled-course preflight

Recorded 2026-09-14T17:30:14.855Z. G8 remains active. CS1–CS4 and O1–O6
remain incomplete; ET6 remains unpassed and NAV1 still requires NAV-EQ.
Follow the [work program](../../helix-environment-harness-work-program-v1.md),
[continuous-session packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md),
[onboarding packet](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md),
[linked trial](../../work-packets/eh-g8-cs3-linked-walk-development-v1.md), and
[retained-result repair](../../work-packets/eh-g8-cs3-retained-interruption-status-v1.md).
The [preceding handoff](2026-09-14-snapshot-confirmation-cs5-handoff.md) remains
an immutable snapshot of persistence repair and MCP/EXE readiness evidence.

The distinct linked-walk root was admitted in 1,577 ms. Fresh pose later showed
8.8 blocks of southward displacement. No successor was submitted. Two exact
status reads omitted its retained result; native status reported canceled.
See the immutable [trial record](2026-09-14-cs3-linked-walk-trial-1.json).

The reader incorrectly compared result outcomes literally with request lifecycle
states, hiding request_canceled/manual_override under canceled and other mapped
terminal outcomes. It now uses the broker's existing mapping and includes all
existing terminal states, preserving scope, identity, provenance, current
authorization, unique-request and read-race checks. Nine added deterministic
cases failed before repair; the retained-reader and action-control suites then
passed all 27 cases. Existing unrelated broker changes were preserved.

The rebuilt package recovered the same accepted pairing on its first request.
Ready up passed all ten checks with fresh perception and zero repairs. Reading
the exact prior workflow now returns its original 17:00:41.512Z result:
request_canceled / temporal_runway_exhausted. It records no manual override,
released controls, no automatic replay, no inventory/world/interaction mutation,
and motion performed. The committed window ended at scheduler unit 279 with
no successor; the larger overall ceiling did not authorize further committed
motion. Duration is 229 resident ticks, with 230 scheduler ticks and 11,407 ms
wall time; these are workflow measurements, not measured useful-motion duration.
Fresh controller heartbeat is idle with controls not asserted, and fresh pose
remains (-2.1, 65, 7.7), health 20. The historical release result is not used as
current control-state evidence. No workflow was replayed to obtain this result.
See [runtime recovery evidence](2026-09-14-retained-outcome-runtime.json).

| Requirement | Evidence and remaining exit |
| --- | --- |
| CS1.1 Shared Ready up | Prior MCP and native EXE checks passed; new package automatic MCP check again passes all ten layers. Full first-session/recovery matrix remains open. |
| CS1.2 Exact identity | Same authenticated client/continuation, pairing, chat, room, run, goal and player survive another package restart. Full integrated adversarial identity matrix remains required. |
| CS1.3 Idempotency | Prior same-request Ready up and prompt retries preserve identity; current repair only reads the prior action. Full integrated zero-duplicate-effect matrix remains open. |
| CS1.4 Finite authority | Existing gameplay grant expires 17:58:15.074Z, source 17:44:06.075Z, pairing 22:00:36.357Z, run 20:14:10.898Z. No deadline was renewed. Reinspect before further actions. |
| CS1.5 Durable recovery | Goal revision 22/hash and accepted pairing survive restart. Prior actual expiry/rebound/checkpoint recovery remains evidenced. Full cold recovery/revocation matrix remains required. |
| CS2.1 Exact-chat ingress | Prior agent-origin event reached this exact bound task. Native panel now also explicitly shows its acknowledged state. Full user-facing interaction/re-entry journey remains open. |
| CS2.2 Scoped idempotent ingress | Prior identical retry preserves event/cursor/hash/ack time. Component negative scope/identity/reorder evidence retains its scope; full integrated matrix remains required. |
| CS2.3 Origin and delivery | Native panel labels agent-submitted prompts and acknowledges transport pickup. Polling does not imply idle-task wake or assistant-answer authority. |
| CS3.1 Three successors | New root moved 8.8 blocks and stopped on committed-window expiry; zero successors submitted. Trial 2 stopped before any submission because fresh forward feet/head clearance was blocked. Three consumed moving successors remain unqualified. |
| CS3.2 Frozen timing | Root admission 1,577 ms; native dispatch-to-accept 33 ms and first tick 37 ms. Fresh wall evidence prevents counting the full held-control duration as useful motion; successor admission/activation capacity remains unmeasured. Prior failed trials remain. |
| CS3.3 Changed affordance/faults | This trial establishes missing-successor exhaustion only. Live changed affordance, backpressure, reconnect and duplicate-effect matrix remain open. |
| CS4.1 Interruption | Typed request cancellation and separate fresh idle/release evidence are recovered. This was temporal exhaustion, not manual input or Emergency Stop. Actual manual interruption and queued-successor invalidation remain required. |
| CS4.2 Revocation | Existing deterministic revocation/persistence evidence remains. Actual player-grant revocation and fresh no-motion evidence remain required. |
| CS4.3 Fresh re-entry | Exact retained result keeps its original timestamp and enters this task alongside fresh controller and pose. Full motion/interruption re-entry and stale-action rejection remain open. |
| CS4.4 Package identity | 647 runtime, 636 client and eight host artifacts match staging; zero mismatches/extras. Known-fixture scan: 828 text files, zero hits, 12 positive controls. No universal isolation/certificate claim. |
| CS4.5 Ordinary workflow | Normal native close/launch, saved device trust, same pairing recovery and first automatic Ready up pass are evidenced. No new invitation or consent was needed. Full cold onboarding and complete moving/interruption workflow remain open. |
| CS5.1 Full handoff | All 17 exits retained; component, simulation, packaged rehearsal and live acceptance are distinguished. Persistent goal remains incomplete. |

O1 adds the actual missing-result boundary and original cancellation diagnosis.
O2 retains fixed persistence recovery without new binding approval. O3 preserves
polling/copy fallback and no unsupported automatic-delivery claim. O4 preserves
human consent and independent finite deadlines. O5 adds nine red/green terminal
mapping cases, with 27 focused cases passing in total. O6 adds exact packaged
result recovery; complete movement/interruption and ordinary workflow remain open.

Package: `apps/desktop/release-retained-outcome-20260914/win-unpacked/CasimirBot.exe`.
EXE SHA256 `b0ea252960c39db6311013f77c8144f1e55c1d989f03849117679c4dee5e2629`.
Service SHA256 `886caf8ade56dec27f51d74f1321784658099f7fd54a2bff1238932b572fd7cb`.
Runtime manifest SHA256 `257e11d0b2e0705d05627fe9ac86996c62aa36b7380eafe1c40a8b5cdd73921b`.
See [package comparison](2026-09-14-retained-outcome-package.json) and
[known-fixture scan](2026-09-14-retained-outcome-fixture-scan.json).
Service `service_instance:f2cf417b2f16319a9e859a2040f131cb`, PID 13832,
ready 17:11:28.353Z. Binding `reasoning_binding:838061660dcd296daeb2513f921011b8`,
epoch 1. Goal revision 22 hash
`sha256:c8e659eae1561c42b0031de895fbf2b075cd3c69068ec93eb63086bebe3f1eb4`.

The nonphysics application patch does not require Casimir verification and
makes no adapter/certificate integrity claim. Component tests and artifact
comparison pass; the subsequent documentation audit and discipline quick also pass.
Next development work must retain this failed trial and explicitly obtain fresh
perception and exact predecessor context before each distinct successor. Do not
replay an admitted root or silently enlarge its frozen limits.

## Latest preflight and next prerequisite

Trial 2 [freeze](2026-09-14-cs3-linked-walk-trial-2-freeze.json) retained the prior limits.
Its [fresh stop](2026-09-14-cs3-linked-walk-trial-2-preflight-stop.json) records blocked forward clearance before any action.
The [survey and EXE supplement](2026-09-14-cs3-course-preflight-supplement.json) records the platform wall and no support beyond it within surveyed bounds.
The current EXE shows active binding and acknowledged prompts. Its Ready up interaction was captured preparing and later aged out; no fresh-ready banner was captured in this later check. The preceding package retains that successful banner and the current MCP pass remains.

The [controlled-corridor packet](../../work-packets/eh-g8-cs3-controlled-corridor-preparation-v1.md) and [proposal](2026-09-14-cs3-controlled-corridor-proposal.json) define a possible guarded 200-block route. Five fill proposals pass local nonoverlap, 5,628-position bounds and existing world-build risk classification. None was executed.
The callable command tool explicitly disables execution and the existing player-centered checkpoint cannot span the box. Establish a governed snapshot/setup path before requesting separate human World Authority consent. Do not use sensor credentials, raw console/RCON, unbounded mutation or a weakened checkpoint limit. No new human click is pending yet.
