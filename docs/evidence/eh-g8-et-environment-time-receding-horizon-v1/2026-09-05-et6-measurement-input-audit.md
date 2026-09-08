# ET6 measurement input audit — 2026-09-05

Scope: source-backed capture preparation, not live gameplay proof.

`scripts/helix-environment-capacity-report.ts` accepts an already assembled
`environment.capacity_capture.v1`. Its five focused tests passed during the
preflight turn. It validates and aggregates inputs; it does not itself collect
MCP calls, authenticate source evidence, or establish that a rolling extension
occurred. Searches of the inspected server/services and scripts trees found no
production caller assembling the full capacity sample. This is a scoped search
finding, not proof that no other tooling exists.

| Required measurement | Located source | Remaining correlation or limitation |
| --- | --- | --- |
| Resident computation and first-tick delay | Native `EnvironmentCapacityTelemetry.snapshot()` | Per-workflow counters; preserve workflow identity and native monotonic clock domain. First-tick delay starts at client dispatch receipt, not the original model call. |
| Scheduler, active-control, stalled and missed ticks | Same native snapshot | Active controls are not proof of player displacement. Stalled means a sampled scheduler tick without active control. Missed intervals use nominal 50 ms spacing. |
| Queue depth | Native `queue_depth_at_lease` | One lease-time sample is neither resident extension queue peak nor a continuously measured queue. Do not relabel it as either. |
| Planning runway | Native planned runway minus scheduler ticks | This is the finite workflow's nominal runway; it does not establish rolling extension lead time or realized useful motion. |
| Manual/safety release delay | Native nullable release-latency counter | Must join to the actual identified interruption event; automated safety and human manual input remain distinct. |
| Rolling cycles and extension lead time | Required by shared capacity sample/report | Need accepted resident extension records and same-clock boundary marks, not three finite dispatches or three observations. |
| Event/evidence/pickup/steering/replan latency | Required by shared sample | Join exact event, observation, steering, acknowledgement and action identities. Cross-clock subtraction needs a validated mapping; otherwise retain unknown. |
| Actual progress and duplicate effects | Required by shared sample | Fresh pre/post observations plus effect refs and reconnect evidence; neither an acceptance receipt nor asserted controls proves progress. |
| Observation bytes/tokens and course label | Nullable sample fields | Measure bounded serialized observations at the capture boundary; do not infer tokens from byte count or infer controlled-course identity from terrain appearance. |

## Deterministic follow-up before the next live session

Rehearse an evidence-to-sample mapping on retained sanitized records, preserving
exact identity and missing values. Do not add a second controller or strategy
loop. Missing required non-null metrics should block sample creation rather
than be replaced with zero. The live report must distinguish trusted evidence
collection from the report schema's syntactic validation.

Potential contract mismatch to investigate next: native `missed_ticks` counts
unsampled nominal intervals, while `scheduler_ticks` counts actual invocations.
The shared sample refinement currently bounds `stalled_ticks + missed_ticks`
by `scheduler_ticks`. A sufficiently delayed native stream may therefore be
unrepresentable even with honest counters. Establish an exact deterministic
fixture before changing either metric definition; do not discard missed ticks
to make capacity pass.

Source anchors:

- `minecraft/helix-fabric-player-agent/src/main/java/com/casimirbot/helixplayer/fabric/EnvironmentCapacityTelemetry.java`
- `shared/helix-environment-time.ts` capacity sample schema and report builder
- `scripts/helix-environment-capacity-report.ts`

No live movement, new grant, binding, or session was created for this audit.
