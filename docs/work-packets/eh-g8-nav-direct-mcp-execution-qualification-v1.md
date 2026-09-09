Program gate: G8 — environment-harness release evaluation
Workstream: Direct MCP execution prerequisite for environment spatial navigation
Capability or component: NAV-EQ — qualification of the existing compiler, broker, scheduler, controller and watchdog through direct authenticated MCP
Lifecycle stage: execution; secondary source admission, tool admission, evidence normalization and evidence re-entry
Reaction timescale: adapter cadence for control and interruption; measured MCP/model turnaround for horizon replenishment
Authority owner: The operator grants finite player authority; Runtime Codex selects the admitted plan; Helix enforces identity, authority and provenance; the existing local arbiter serializes effects and releases controls
Current maturity: specified
Target maturity: live accepted for a declared direct-MCP execution profile
Required evidence: exact runtime artifacts and identities; at least three rolling extensions through the real temporal compiler/broker/executor; fresh observation re-entry; changed-affordance repair; local and direct-user interruption; reconnect; explicit revocation and zero-effect stale rejection; measured capacity and interruption limits
Explicit non-goals: no full ET6 closure, hosted-room steering acceptance, bypass of existing membership or consent checks, replacement execution engine, learned controller, NAV search implementation, benchmark superiority, public-release or Nether acceptance
Downstream gate unlocked: NAV1–NAV7 development after NAV-EQ live acceptance for the same execution profile; NAV8 direct and room-driven acceptance remain separately scoped

# NAV direct MCP execution qualification

## Dependency decision — 2026-09-08

The canonical roadmap is `docs/helix-environment-harness-work-program-v1.md`.
This packet deliberately narrows NAV's engineering prerequisite from full ET6
closure to demonstrated execution capacity. It is a parallel G8 qualification
lane because a direct Codex task can submit its own MCP requests without
receiving hosted-room messages into that task. Full ET6 and CS1–CS5 retain
their original exits and maturity requirements.

Two contexts must remain distinct:

- Execution context: authenticated profile/client, environment/source, subject,
  finite action authority, goal/plan identities, current observations and
  cancellation. Existing room-scoped grants or associations required by the
  implementation must still be validated.
- Collaboration ingress: a room message is delivered to the intended existing
  provider task with exact binding, participant provenance and acknowledgement.
  This additional transport is required for room-driven steering.

Direct MCP does not inherently require hosted collaboration. This is an
architectural boundary, not a claim that the current implementation already
exposes a roomless temporal-plan endpoint. The preflight must determine that.
If existing temporal admission requires an exact association, preserve it or
implement and verify a separately scoped direct execution context before the
trial. Do not bypass preflight, fabricate a provider principal, treat an
in-process tool test as external MCP, or route around the real compiler and
broker. A private local authorization container may be an implementation
detail; its presence does not prove hosted collaboration acceptance.

## Qualification sequence

1. Inventory the actual callable MCP entry points and their authentication,
   association, goal, observation and authority prerequisites. Record the first
   missing boundary and reuse existing implementations, including applicable
   CS1/CS3 repairs. Room prompt submission, pickup and acknowledgement are not
   required for direct execution unless the tested action truly depends on
   them; document such coupling as a defect or prerequisite, never assume it
   away.
2. Freeze the runtime build hashes, world snapshot, subject and source epochs,
   movement-only capabilities, clock origins, measurement schema and numeric
   pass limits before the acceptance run. Use prior ET measurements or a
   separately labelled calibration run to choose the limits. Missing limits
   prevent acceptance; late changes require a new protocol and fresh run.
3. Run a bounded controlled movement course through external Codex MCP and the
   real temporal compiler, broker and resident executor. Demonstrate at least
   three successive rolling extensions with overlapping useful execution and
   planning. Serial settled walks and a long prewritten macro do not satisfy
   rolling execution. Preserve checkpoint and successor-plan lineage.
4. Introduce a changed affordance and a local interruption. Prove fresh
   post-state re-entry into Codex, an appropriate revised admitted plan, and
   release/stabilization within the frozen limits. No identical retry against
   unchanged failed evidence may count as repair.
5. Exercise direct user cancellation or steering through the current task's
   supported path, plus actual local manual takeover. Measure command arrival,
   cancellation, last effect and control release separately. Injected input
   flags are component evidence only. Room-message ingress is not claimed.
6. Exercise one supported transport reconnect, re-observe the exact execution
   context and reconcile the settled checkpoint without replaying effects.
   Explicitly revoke authority, attempt a stale repeat and observe rejection
   with zero further motion. Expiry alone is not explicit revocation.

## Required measurements and evidence

Record resident computation and dispatch-to-first-tick p50/p95/p99, useful
motion ratio, stationary/missed ticks, queue depth, successor readiness and
committed runway; observation-to-re-entry and replan delay; local/manual and
direct-user cancellation latency; duplicate and stale effects; evidence
volume; and progress per model/tool round trip. Report sample count, clock
origin, units, aggregation and unavailable measurements. Never encode missing
measurements as zero or infer a latency distribution from one event.

Retain an artifact manifest plus public MCP calls/results, plan/authority
references, timestamped executor checkpoints, observation hashes/re-entry
references and final release/revoke evidence under
`docs/evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/`.
Do not capture credentials or private reasoning. A test fixture can reset the
course under separate setup authority, released before measured movement.

Stop and fail the qualification on identity/authority divergence, hidden world
or inventory mutation, violated frozen limits, missing live measurements,
late effects after release, duplicate replay, or an unverified execution path.
The passing evidence applies only to its declared build/profile. Material
changes to compiler, broker, scheduler, interruption or authority semantics
require regression and proportionate live requalification before NAV relies
on them.

## Advancement and limits

NAV-EQ starts as `specified`. It becomes `live accepted` only after the actual
external-MCP course satisfies every requirement above. Component tests,
packaging, room transport success or selected historical action receipts alone
cannot close it. Full ET6 evidence may satisfy NAV-EQ only through an explicit
requirement-by-requirement mapping to the same execution profile.

NAV-EQ acceptance unlocks NAV implementation, not acceptance of the resulting
planner. NAV8 still requires its own direct A0/A1 and keyed Helix B evidence.
Any NAV8 trial using room messages additionally requires that room's binding,
provenance and delivery acceptance. NAV8 as a whole stays open until all its
declared paths pass. Companion C4/S6, Nether, ET6/ET8 and release evaluation
retain their additional gates. CS1–CS5 continues independently; common repairs
are shared, but each lane records exactly which exit they satisfy.

## Direct-path prerequisite audit — 2026-09-08

Evidence: [read-only MCP and source audit](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-08-direct-mcp-preflight.json).
NAV-EQ remains `specified`; no movement qualification or maturity promotion
occurred. The MCP device check succeeded and reported one fresh, probe-ready
Minecraft source with twelve sensing capabilities. This proves connectivity
and sensing readiness only, not Player Embodiment authority, temporal support,
or that the reported world is the intended controlled test course. The source
checkout is dirty and its HEAD is not evidence of the running package hash.

The existing temporal path still couples execution to collaboration identity:

- `server/mcp/helix-mcp-server.ts`, `helix_environment_temporal_plan_submit`:
  room-feature gate, authenticated client, exact reasoning-task association,
  then self-participant resolution before serial compiler/broker admission.
- `server/services/environment-connectors/session/bound-session-evidence.ts`:
  exact binding revalidation before and after asynchronous evidence reads.
- `server/services/environment-connectors/temporal-plans/temporal-admission-retention.ts`:
  retained reasoning-binding epoch and continuation, goal participant scope,
  predecessor/checkpoint lineage and resident request identity.

Consequently, making an MCP argument optional or removing the initial room
check would not establish a valid independent execution context. Existing
room-backed execution can still qualify NAV-EQ without room-message ingress
when this task has its own legitimately established association and authority.
Fully independent direct execution needs a deliberate context contract across
these boundaries; it must not adopt another task's association.

### Execution-context requirements — product-owned implementation

Ownership clarification — 2026-09-08: the requirements below are inputs to
the existing [personal product contract](../architecture/casimirbot-developer-platform-product-contract-v1.md)
and [CFP-2.ONBOARD](eh-g8-cfp2-external-client-onboarding-v1.md), not authorization
for this navigation task to build another execution-context service. Their
own admission/file-ownership gates still apply. NAV-EQ consumes and qualifies
the supported personal path; it does not own account, commercial or hosted
collaboration delivery. The [NAV packet](eh-g8-environment-spatial-navigation-v1.md)
now admits NAV1-D offline topology work in parallel while live execution
integration retains this qualification gate.

Change classification: source admission, tool admission and evidence identity;
no new provider runtime, navigation algorithm or scheduler.

1. Define a discriminated direct-execution versus room-steered context. Derive
   profile, authenticated client/session and task association on the server;
   bind the finite lease, goal/run, environment, source, player and epochs.
   Direct execution must not acquire room-message ingress privileges.
2. Reuse the current goal/catalog/perception checks, compiler, broker and
   resident executor. Preserve existing room-backed behavior. If a private
   local authorization container remains necessary, describe it explicitly;
   do not call it a fully roomless implementation.
3. Carry the context identity through admission retention, checkpoints,
   successors, reconnect reconciliation and explicit revocation. Revalidate
   after asynchronous reads and immediately before dispatch; losing an
   execution context must release its bounded controls without affecting a
   different task's lease.
4. Add adversarial fixtures for cross-profile/client/task/subject identity,
   expired or revoked context, stale epochs, duplicate/conflicting successors,
   injected identity fields, and attempted room ingress from a direct-only
   context. Verify existing room-binding denial behavior is unchanged.
5. Qualify the resulting direct path on an exact frozen runtime with the live
   sequence above. Local fixtures do not replace rolling motion, cancellation,
   manual takeover, reconnect and zero-effect revocation evidence.

Focused existing tests passed: temporal admission 5/5, preflight 9/9 and
successor context 11/11 (25/25 total). These establish component regression
evidence for the inspected checkout, not native handoff timing or external
MCP execution. Existing successor machinery is reusable; this audit does not
justify replacing the scheduler or declaring full ET6 passed.
