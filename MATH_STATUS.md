# Math Status Registry

Purpose: track math maturity across the repo so we can apply the right level of
checks for each component (exploratory -> certified). This avoids over-claiming
and keeps validation proportional to the model's resolution.

## Stages

Stage 0 (Exploratory / Proxy)
- Allowed claims: qualitative trends, intuition-building, visualization.
- Checks: bounds/sanity, unit consistency, "does not crash" (no hard fail).

Stage 1 (Reduced-order / Approximate)
- Allowed claims: coarse estimates, simplified dynamics, proxy constraints.
- Checks: regression snapshots or known-case tests.

Stage 2 (Diagnostic / High-fidelity)
- Allowed claims: numerical diagnostics, constraint residuals, trend analysis.
- Checks: residual thresholds + stability checks.

Stage 3 (Certified / Policy-gated)
- Allowed claims: "pass/fail" under named policy, certificate-backed.
- Checks: hard constraints + certificate integrity + required tests (see
  `WARP_AGENTS.md`).
- Narrative: `motivation` + `conceptualWaypoints` (3-7 waypoints) required for
  certified modules.

## Core GR/Warp Modules (Tagged)

| Tag | Module | Stage | Notes | Checks |
| --- | --- | --- | --- | --- |
| GR_CORE | modules/gr/bssn-state.ts | Stage 2 | Grid + BSSN state definitions. | tests/gr-constraint-network.spec.ts |
| GR_CORE | modules/gr/bssn-evolve.ts | Stage 2 | BSSN evolution + constraint fields. | tests/gr-constraint-gate.spec.ts, tests/gr-constraint-network.spec.ts |
| GR_CORE | server/gr/evolution/solver.ts | Stage 2 | Runs BSSN evolution (diagnostic). | tests/gr-constraint-network.spec.ts |
| GR_CORE | server/gr-evolve-brick.ts | Stage 2 | Builds GR diagnostics + residuals. | tests/gr-constraint-gate.spec.ts, tests/gr-constraint-network.spec.ts |
| GR_GATE | server/gr/constraint-evaluator.ts | Stage 3 | GR gate evaluation from diagnostics. | tests/gr-constraint-gate.spec.ts |
| GR_GATE | server/gr/gr-evaluation.ts | Stage 3 | Gate + certificate checks (policy). | tests/gr-agent-loop.spec.ts |
| GR_LOOP | server/gr/gr-agent-loop.ts | Stage 3 | Orchestration + acceptance gate. | tests/gr-agent-loop.spec.ts, tests/gr-agent-loop-baseline.spec.ts |
| WARP_CORE | modules/warp/natario-warp.ts | Stage 1 | Analytic warp proxy (not full GR). | tests/theory-checks.spec.ts |
| WARP_CORE | modules/warp/warp-module.ts | Stage 1 | Warp module wrapper + diagnostics. | tests/theory-checks.spec.ts |
| PIPELINE | server/energy-pipeline.ts | Stage 1 | Energy pipeline core (mixed proxies + calibration). | tests/pipeline-ts-qi-guard.spec.ts |
| WARP_EVAL | tools/warpViability.ts | Stage 2 | Warp viability evaluation from pipeline + guardrails. | tools/__tests__/warpViability.spec.ts, WARP_AGENTS.md |
| WARP_POLICY | modules/physics/warpAgents.ts | Stage 1 | Warp guardrail definitions (policy registry). | tests/theory-checks.spec.ts, WARP_AGENTS.md |
| WARP_CERT | tools/warpViabilityCertificate.ts | Stage 3 | Certificate issuance (policy-gated). | tests/theory-checks.spec.ts |
| WARP_CERT | tools/verifyCertificate.ts | Stage 3 | Certificate integrity verification. | tests/theory-checks.spec.ts |
| WARP_IO | server/skills/physics.warp.viability.ts | Stage 3 | Public viability tool endpoint. | WARP_AGENTS.md required tests |
| WARP_IO | server/routes/warp-viability.ts | Stage 3 | HTTP route for viability + trace emission. | WARP_AGENTS.md required tests |
| STRESS_MAP | server/stress-energy-brick.ts | Stage 1 | Reduced-order stress-energy mapping. | tests/stress-energy-brick.spec.ts, tests/stress-energy-matter.spec.ts |
| STRESS_MAP | server/gr/evolution/stress-energy.ts | Stage 1 | Pipeline -> stress-energy fields. | tests/stress-energy-brick.spec.ts, tests/stress-energy-matter.spec.ts |
| DYNAMIC | modules/dynamic/stress-energy-equations.ts | Stage 1 | Dynamic stress-energy helpers for pipeline/warp mapping. | tests/stress-energy-brick.spec.ts, tests/stress-energy-matter.spec.ts |
| DYNAMIC | modules/dynamic/dynamic-casimir.ts | Stage 1 | Dynamic Casimir sweep helpers (pipeline). | tests/theory-checks.spec.ts |
| DYNAMIC | modules/dynamic/natario-metric.ts | Stage 1 | Natario metric proxy helpers (pipeline). | tests/theory-checks.spec.ts |

## Additional GR Modules (Tagged)

| Tag | Module | Stage | Notes | Checks |
| --- | --- | --- | --- | --- |
| GR_CORE | modules/gr/rk4.ts | Stage 2 | RK4 integrator for BSSN evolution. | tests/gr-constraint-network.spec.ts |
| GR_CORE | modules/gr/stencils.ts | Stage 2 | Finite-difference stencils. | tests/gr-constraint-network.spec.ts |
| STRESS_FIELDS | modules/gr/stress-energy.ts | Stage 1 | Stress-energy field helpers. | tests/stress-energy-matter.spec.ts |
| GR_CORE | server/gr-initial-brick.ts | Stage 2 | Initial data brick assembly. | tests/gr-constraint-network.spec.ts |
| GR_CORE | server/gr/evolution.ts | Stage 2 | GR evolution driver. | tests/gr-constraint-network.spec.ts |
| GR_CORE | server/gr/evolution/brick.ts | Stage 2 | GR evolution brick serialization. | tests/gr-constraint-network.spec.ts |
| GR_CORE | server/gr/evolution/initial-data.ts | Stage 2 | Initial data solve utilities. | tests/gr-constraint-network.spec.ts |
| GR_CONSTRAINT | server/gr/gr-constraint-network.ts | Stage 2 | Constraint network evaluation. | tests/gr-constraint-network.spec.ts |
| GR_POLICY | server/gr/gr-constraint-policy.ts | Stage 1 | Constraint policy thresholds. | tests/gr-constraint-gate.spec.ts |
| GR_LOOP | server/gr/gr-agent-loop-schema.ts | Stage 1 | GR agent loop schema. | tests/gr-agent-loop.spec.ts |
| GR_WORKER | server/gr/gr-worker-client.ts | Stage 0 | GR worker client. | n/a |
| GR_WORKER | server/gr/gr-worker-types.ts | Stage 0 | GR worker message types. | n/a |
| GR_WORKER | server/gr/gr-worker.ts | Stage 0 | GR worker runtime. | n/a |

## Extended Verification + Analysis Modules

| Tag | Module | Stage | Notes | Checks |
| --- | --- | --- | --- | --- |
| TRACE | server/services/observability/training-trace-store.ts | Stage 2 | Training trace storage/export. | server/__tests__/training-trace.test.ts |
| TRACE | server/routes/training-trace.ts | Stage 2 | Training trace API routes. | server/__tests__/training-trace.test.ts |
| ADAPTER | server/routes/agi.adapter.ts | Stage 2 | Adapter API (actions -> verdict). | server/__tests__/agi.adapter.test.ts |
| PACKS | server/services/observability/constraint-pack-evaluator.ts | Stage 2 | Constraint-pack evaluators. | server/__tests__/constraint-packs.evaluate.test.ts |
| PACKS | server/services/observability/constraint-pack-normalizer.ts | Stage 2 | Evaluations -> trace records. | server/__tests__/constraint-packs.evaluate.test.ts |
| PACKS | server/services/observability/constraint-pack-telemetry.ts | Stage 2 | Telemetry ingestion helpers. | server/__tests__/constraint-packs.evaluate.test.ts |
| PACKS | server/routes/agi.constraint-packs.ts | Stage 2 | Pack list/evaluate/policy routes. | server/__tests__/constraint-packs.evaluate.test.ts |
| PACKS | server/services/constraint-packs/constraint-pack-policy.ts | Stage 1 | Policy overrides + ladder enforcement. | server/__tests__/constraint-packs.evaluate.test.ts |
| PACKS | server/services/constraint-packs/constraint-pack-policy-store.ts | Stage 1 | Policy profile JSONL store. | server/__tests__/constraint-packs.evaluate.test.ts |
| ANALYSIS | modules/analysis/constraint-loop.ts | Stage 0 | Generic constraint loop (prototype). | n/a |
| ANALYSIS | modules/analysis/noise-field-loop.ts | Stage 0 | Noise field loop (prototype). | n/a |
| ANALYSIS | modules/analysis/diffusion-loop.ts | Stage 0 | Diffusion loop stub. | n/a |
| ANALYSIS | modules/analysis/belief-graph-loop.ts | Stage 0 | Belief graph loop. | n/a |
| ANALYSIS | server/routes/analysis-loops.ts | Stage 0 | Analysis loop API routes. | n/a |
| OBS | server/services/observability/otel-tracing.ts | Stage 0 | OTEL instrumentation helpers. | n/a |
| OBS | server/services/observability/otel-middleware.ts | Stage 0 | OTEL middleware. | n/a |
| OBS | server/services/observability/otel-span-store.ts | Stage 0 | OTEL span store. | n/a |

## AGI Route Modules (Tagged)

| Tag | Module | Stage | Notes | Checks |
| --- | --- | --- | --- | --- |
| AGI_PLAN | server/routes/agi.plan.ts | Stage 1 | Plan/execute route. | tests/agi-plan.spec.ts |
| AGI_EVAL | server/routes/agi.eval.ts | Stage 1 | Eval route. | tests/eval-endpoint.spec.ts |
| AGI_MEMORY | server/routes/agi.memory.ts | Stage 1 | Memory routes. | tests/agi-memory.spec.ts |
| AGI_TRACE | server/routes/agi.memory.trace.ts | Stage 1 | Memory trace stream. | tests/trace-api.spec.ts |
| AGI_PERSONA | server/routes/agi.persona.ts | Stage 1 | Persona route. | tests/persona-policy.spec.ts |
| AGI_PROFILE | server/routes/agi.profile.ts | Stage 1 | Profile summarizer endpoints. | tests/essence-dal.spec.ts |
| AGI_SPECIALISTS | server/routes/agi.specialists.ts | Stage 1 | Specialists routing. | tests/specialists.math.spec.ts |
| AGI_STAR | server/routes/agi.star.ts | Stage 1 | Star telemetry route. | tests/solar-energy-adapter.spec.ts |
| AGI_TRACE | server/routes/agi.trace.ts | Stage 1 | Trace/log streaming routes. | tests/trace-api.spec.ts |
| AGI_DEBATE | server/routes/agi.debate.ts | Stage 1 | Debate routing. | tests/debate-orchestrator.spec.ts |

## Neuro Coherence Modules

| Tag | Module | Stage | Notes | Checks |
| --- | --- | --- | --- | --- |
| NEURO | shared/neuro-config.ts | Stage 0 | Neuro coherence defaults (gamma band + equilibrium thresholds). | docs/stellar-consciousness-orch-or-review.md |

## DP Collapse Modules

| Tag | Module | Stage | Notes | Checks |
| --- | --- | --- | --- | --- |
| DP_COLLAPSE | shared/dp-collapse.ts | Stage 0 | Diosi-Penrose collapse estimator (DeltaE from mass-density difference). | tests/dp-collapse.spec.ts |
| DP_COLLAPSE | server/services/dp-adapters.ts | Stage 0 | Stress-energy -> DP mass-density adapters (brick + GR fields). | tests/dp-adapters.spec.ts |
| DP_COLLAPSE | server/services/dp-adapter-build.ts | Stage 0 | Build DP adapter inputs from stress-energy + GR evolve bricks. | tests/collapse-benchmark.phase2.routes.spec.ts |
| DP_COLLAPSE | shared/dp-planner.ts | Stage 0 | DP planning calculator schema (visibility, detectability, tau). | tests/dp-planner.spec.ts |
| DP_COLLAPSE | server/services/dp-planner.ts | Stage 0 | DP planning calculator (visibility decay, detectability ratio). | tests/dp-planner.spec.ts |

## Observability + Audit Modules (Tagged)

| Tag | Module | Stage | Notes | Checks |
| --- | --- | --- | --- | --- |
| GR_AUDIT | server/services/observability/gr-agent-loop-store.ts | Stage 2 | GR agent loop audit log storage. | tests/gr-agent-loop.spec.ts |
| LOG_STORE | server/services/observability/tool-log-store.ts | Stage 0 | Tool log store (non-math telemetry). | n/a |

## Automation

- Canonical metadata lives in `shared/math-stage.ts`.
- Validator: `npm run math:validate`
- Dependency graph: `MATH_GRAPH.json` (stage inheritance + waivers).
- Default stage policy: `math.config.json` (path-based stage suggestions).
- Inline overrides: optional file headers like `// math-stage: diagnostic` (first
  few lines) to override the path defaults.
- Evidence profiles: `math.evidence.json` (default evidence types + commands).
- Starter templates: `templates/math/` (copy `MATH_STATUS.md`, `math.config.json`,
  and `math.evidence.json` into a new repo).
- Narrative fields: `motivation` and `conceptualWaypoints` in `shared/math-stage.ts`.
- Waivers: `math.waivers.json` (local exceptions for stage/evidence/unit/narrative).
- Strictness: `math.config.json` `strictStages` (default warn-only). Override
  with `MATH_STRICT=1` or `MATH_STRICT_STAGES=diagnostic,certified`.
- Report: `npm run math:report` (writes `reports/math-report.json` and `.md`).
- Traceback: `npm run math:trace -- gr` (prints chain + stage + evidence).
- Unit signatures: `shared/math-stage.ts` `units` fields (dimension expectations).
- Keep this registry and `shared/math-stage.ts` in sync when modules move
  stages or gain new checks.

## Update Rules

- Add a row when a new GR/warp component is introduced.
- Only move a module to a higher stage after the required checks exist.
- For Stage 3 components, ensure WARP_AGENTS.md required tests remain green.
