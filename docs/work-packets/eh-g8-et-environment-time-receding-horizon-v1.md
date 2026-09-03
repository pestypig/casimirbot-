# EH-G8 Environment Time and Receding-Horizon Action Planning v1

Program gate: G8 — environment-harness release evaluation.
Workstream: Operator-visible Codex steering and action-reaction fidelity.
Capability or component: ET — provider-neutral environment time, temporal action plans, progressive affordance frontiers and resident rolling execution; Minecraft is the capacity reference adapter.
Lifecycle stage: intent arbitration, source admission, tool admission, execution, evidence normalization, evidence re-entry, follow-up reasoning, terminal authority and presentation.
Reaction timescale: adapter cadence for execution and safety; subsecond semantic-event delivery; provider-dependent Codex planning and replanning.
Authority owner: Runtime Codex owns semantic objectives, plan construction, repair and final synthesis; Helix owns identity, admission, effects, provenance and terminal eligibility; adapters compile and sense; resident executors advance only admitted plans.
Current maturity: specified.
Target maturity: deterministically verified shared contract and Minecraft compatibility compiler, followed by live-accepted Minecraft capacity and cross-environment conformance evidence.
Required evidence: schema and adversarial fixtures; exact clock/epoch/authority binding; finite-plan validation; existing Fabric scheduler differential equivalence; rolling continuation without stalls or duplicate effects; affordance deltas; local and user interruption latency; fresh re-entry; Minecraft controlled and unknown-world capacity traces; second-adapter conformance; final revocation and terminal parity.
Explicit non-goals: no arbitrary macro/code language, private model loop, adapter-authored strategy, implicit authority, raw tick dump, unbounded future queue, provider-task creation, Codex UI automation, Minecraft authority transfer, or receipt/steering/scheduler terminal authority.
Downstream gate unlocked: measured G8 action-reaction fidelity and a reusable temporal-control substrate for later adapters.

## Classification

This packet spans `intent arbitration`, `source admission`, `tool admission`,
`evidence normalization`, `evidence re-entry`, `follow-up reasoning`, `terminal
authority`, `presentation`, and adapter-owned execution. It does not recreate
Codex sampling, generic tool execution, approvals, compaction, orchestration or
terminal completion.

## Problem

PNA3.6 proves one admitted Minecraft action, fresh post-state, revocation and
stale rejection. Existing Minecraft engines also run finite tick-addressed
sequences and concurrent reactive programs. The next boundary is continuity:
how much admitted future work keeps an actor moving through Codex latency, how
far Codex should plan before fresh state makes the plan stale, and how quickly
environment or user feedback can redirect it.

The solution must be portable. Minecraft drives maximum-capacity tests, but
shared types cannot require Minecraft keys, blocks, ticks or strategy.

Architecture: `docs/architecture/helix-environment-time-action-planning-v1.md`.

## Ordered delivery

### ET0 — Freeze semantics and fixtures

Deliver shared schema names/stable enums for clocks, plans, nodes, lanes,
resources, conditions, frontiers, interruptions and checkpoints; canonical
hash/idempotency fixtures; epoch invalidation; and adversarial cases for loops,
unknown conditions, stale state, conflicts, effect overflow and receipt-as-answer
misuse.

Exit: invalid plans fail closed and no adapter strategy leaks into shared types.

### ET1 — Shared validator, admission and lifecycle facts

Initial locations:

- `shared/helix-environment-time.ts`;
- `server/services/environment-connectors/temporal-plans/`;
- focused shared/service tests; and
- bounded MCP descriptions, not a general-purpose executor.

Exit: identity, revisions, epoch, authority, graph termination, resources,
deadline, effects and postconditions validate before dispatch; transitions are
append-only facts.

### ET2 — Minecraft compatibility compiler

Compile shared plans into existing `FluidSequenceEngine` and
`ConcurrentReactiveScheduler` inputs. Do not replace the engines or encode a
successful prompt. Differential fixtures compare nodes, ticks, conditions,
resources, interrupts, effects and control release.

Exit: N0 sequence/guardian behavior remains equivalent and first-divergence
diagnosis remains possible.

### ET3 — Rolling-window execution

Implement committed, decision and stop watermarks; exact append/replace;
low-runway notification; admitted stabilization; and cancellation of only
unexecuted incompatible work. Reconnect resumes from a settled checkpoint and
fresh epoch-bound snapshot.

Exit: timely extension preserves motion; late/invalid extension stops stably;
retry and reconnect produce zero duplicate effects.

### ET4 — Progressive affordance frontier

Derive a bounded snapshot and deltas with `available_now`, `conditional`,
`blocked` and `unknown`. Expose missing evidence and read-only probes, but no
adapter recommendation or goal choice.

Exit: Codex chooses relevant observations/actions without raw tick spam or an
exhaustive dump; each material availability transition appears exactly once.

### ET5 — Feedback and interruption

Unify Emergency Stop, revocation, manual takeover, safety events, explicit
cancellation, finalized steering, failed postconditions and low-runway signals.
Cancellation is authority-reducing; steering remains advisory until Codex
proposes a new admitted plan.

Exit: controls release, performed effects remain truthful, exact-task delivery
occurs once, replacement binds the resulting checkpoint, and text/API/voice use
one terminal writer.

### ET6 — Minecraft capacity qualification

Run a controlled N0 course, then an unknown-world segment. Sweep horizons,
queue depth and concurrency while introducing chunk loading, collision, damage,
target loss, screens, lag, manual input, steering, disconnect and revocation.

Record:

- resident computation and dispatch-to-first-tick p50/p95/p99;
- continuous-control ratio, stalled/missed ticks, queue depth and lead time;
- event-to-evidence, evidence-to-pickup and stop-to-replan latency;
- finalized steering-to-stop and manual/safety-to-release latency;
- replans and unnecessary replans per minute;
- observation bytes/tokens and coalescing ratio;
- effects, duplicate effects and release status; and
- verified progress/viability per model/tool round trip.

Select the horizon from the Pareto boundary between progress, stale exposure,
interrupt latency, model load and evidence volume. Do not predeclare it.

Exit: at least three rolling cycles, one changed-affordance replan, one local
intervention, one user steering interruption, one reconnect, zero duplicate
effects and final revocation.

### ET7 — Cross-environment conformance

Map a second adapter with a different native clock. Prefer an existing governed
deterministic/simulated surface; add no new live mutation authority merely to
prove reuse.

Exit: clock mapping, finite validation, affordance delta, interruption,
checkpoint recovery and receipt non-authority pass without Minecraft fields.

### ET8 — Installed multi-surface acceptance

Repeat through the packaged EXE, exact provider task and Helix chat/voice.
Correlate plan hashes, environment sequence, MCP cursor, operator trace,
checkpoints, receipts, interruption and final answer.

Exit: measured capacity artifact, no secrets/hidden reasoning, zero duplicate
effects, visible user interruption, final release/revocation and identical
terminal text/API/voice.

## Stop/fail criteria

Stop the current stage if an adapter invents strategy; stale identity can
execute; a plan can loop without a bound; steering directly authorizes action;
performed effects disappear or replay; raw ticks/secrets enter model context; a
terminal path leaks controls; a receipt overwrites Codex's candidate; or shared
types require Minecraft vocabulary.

## Verification

- ET0–ET1: shared validator, hash/idempotency, authority, epoch and adversarial
  Vitest suites.
- ET2–ET5: focused Java sequence/scheduler tests, Fabric game tests, MCP/action
  broker suites, discipline quick, prompt benchmark and API parity matrix.
- ET6–ET8: reference Codex then unchanged natural keyed Helix prompt, exact
  first-divergence trace, packaged EXE, percentile/coverage artifact, discipline
  full and environment-harness docs audit.

Only ET0 is authorized by this specification increment. Later stages remain
ordered implementation work and inherit no maturity from PNA3.6.

