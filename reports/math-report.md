# Math Report

Generated: 2026-01-02T07:05:47.497Z
Registry entries: 63

## Coverage by Stage
- exploratory: 12
- reduced-order: 24
- diagnostic: 20
- certified: 7

## Unstaged Modules
none

## Missing Evidence
- modules/gr/rk4.ts (diagnostic): residual_check
- modules/gr/stencils.ts (diagnostic): residual_check
- server/gr-initial-brick.ts (diagnostic): residual_check
- server/gr/evolution/brick.ts (diagnostic): residual_check
- server/gr/evolution/initial-data.ts (diagnostic): residual_check
- server/gr/gr-worker-client.ts (exploratory): sanity_checks
- server/gr/gr-worker-types.ts (exploratory): sanity_checks
- server/gr/gr-worker.ts (exploratory): sanity_checks
- server/services/observability/gr-agent-loop-store.ts (diagnostic): residual_check
- server/services/observability/tool-log-store.ts (exploratory): sanity_checks
- modules/analysis/constraint-loop.ts (exploratory): sanity_checks
- modules/analysis/noise-field-loop.ts (exploratory): sanity_checks
- modules/analysis/diffusion-loop.ts (exploratory): sanity_checks
- modules/analysis/belief-graph-loop.ts (exploratory): sanity_checks
- server/routes/analysis-loops.ts (exploratory): sanity_checks
- server/services/observability/otel-tracing.ts (exploratory): sanity_checks
- server/services/observability/otel-middleware.ts (exploratory): sanity_checks
- server/services/observability/otel-span-store.ts (exploratory): sanity_checks

## Stage Violations (Edges)
none

## Stage Violations (Pipelines)
none

## Unit Coverage
- entries with units: 14/63
- missing units:
- server/gr/gr-evaluation.ts
- modules/gr/rk4.ts
- modules/gr/stencils.ts
- modules/gr/stress-energy.ts
- server/gr-initial-brick.ts
- server/gr/evolution.ts
- server/gr/evolution/brick.ts
- server/gr/evolution/initial-data.ts
- server/gr/gr-constraint-network.ts
- server/gr/gr-constraint-policy.ts
- server/gr/gr-agent-loop-schema.ts
- tools/warpViabilityCertificate.ts
- tools/verifyCertificate.ts
- server/skills/physics.warp.viability.ts
- server/routes/warp-viability.ts
- tools/warpViability.ts
- modules/physics/warpAgents.ts
- server/services/observability/training-trace-store.ts
- server/routes/training-trace.ts
- server/services/observability/gr-agent-loop-store.ts
- server/routes/agi.adapter.ts
- server/routes/agi.plan.ts
- server/routes/agi.eval.ts
- server/routes/agi.memory.ts
- server/routes/agi.memory.trace.ts
- server/routes/agi.persona.ts
- server/routes/agi.profile.ts
- server/routes/agi.specialists.ts
- server/routes/agi.star.ts
- server/routes/agi.trace.ts
- server/routes/agi.debate.ts
- server/services/observability/constraint-pack-evaluator.ts
- server/services/observability/constraint-pack-normalizer.ts
- server/services/observability/constraint-pack-telemetry.ts
- server/routes/agi.constraint-packs.ts
- server/services/constraint-packs/constraint-pack-policy.ts
- server/services/constraint-packs/constraint-pack-policy-store.ts

## Unit Violations
none

