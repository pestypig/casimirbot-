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
| WARP_AUDIT | shared/contracts/nhm2-full-loop-audit.v1.ts | Stage 2 | Typed NHM2 full-loop audit contract for claim-tier readiness, failure surfaces, and separate NHM2 policy-layer reporting without redefining generic warp certification. | tests/nhm2-full-loop-audit-contract.spec.ts, WARP_AGENTS.md |
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

## Quantum-Spacetime Proxy Modules

| Tag | Module | Stage | Notes | Checks |
| --- | --- | --- | --- | --- |
| QST_PROXY | shared/quantum-spacetime-congruence.ts | Stage 0 | Quantum-spacetime proxy contract for entropy stretch, holographic area proxy, and vacuum-channel gating. | tests/quantum-spacetime-congruence.spec.ts, docs/warp-tree-dag-congruence-policy.md |
| ER_EPR_STAGE1_SIM | shared/er-epr-simulation.ts | Stage 1 | ER=EPR simulation verdict contract for controlled holographic toy models, QST entropy-stretch demotion, and StarSim structure-prior boundaries. | tests/er-epr-simulation.spec.ts, docs/research/er-epr-stage1-simulation.md, docs/warp-tree-dag-congruence-policy.md |
| ER_EPR_STAGE1_RUNNER | shared/er-epr-stage1-runner.ts | Stage 1 | Reproducible ER=EPR Stage 1 fixture/null-control runner and batch report contract; report artifacts are generated evidence, not primary math source. | tests/er-epr-stage1-runner.spec.ts, tests/er-epr-stage1-report.spec.ts, tests/fixtures/er-epr-stage1/plan.fixture.json |
| ER_EPR_STAGE1_RUNNER | shared/er-epr-safe-language.ts | Stage 1 | Claim-safe ER=EPR Stage 1 report language renderer and forbidden-phrase validator. | tests/er-epr-safe-language.spec.ts |
| ER_EPR_STAGE1_SOLVER_ADAPTER_V1 | shared/er-epr-raw-observables.ts | Stage 1 | Raw ER=EPR solver telemetry contract for declared toy-dual and control backends before interpretation. | tests/er-epr-raw-observables.spec.ts, tests/fixtures/er-epr-solver/two-sided-syk-raw.fixture.json |
| ER_EPR_STAGE1_SOLVER_ADAPTER_V1 | shared/er-epr-observable-normalizer.ts | Stage 1 | Normalizes raw solver telemetry into the existing ER_EPR_STAGE1_SIM observable contract. | tests/er-epr-observable-normalizer.spec.ts |
| ER_EPR_STAGE1_SOLVER_ADAPTER_V1 | shared/er-epr-solver-adapter.ts | Stage 1 | Solver adapter connecting raw declared toy-dual telemetry to ER_EPR_STAGE1_SIM evaluations with provenance gates. | tests/er-epr-solver-adapter.spec.ts, docs/research/er-epr-stage1-solver-adapter-v1.md |
| ER_EPR_STAGE1_SOLVER_ADAPTER_V1 | shared/er-epr-solver-safe-language.ts | Stage 1 | Safe-language renderer blocking real-universe, wormhole, NHM2 propulsion, stress-energy, and CL4 claims from solver telemetry. | tests/er-epr-solver-safe-language.spec.ts, tests/er-epr-solver-artifact.spec.ts |
| ER_EPR_TINY_SYK_EXACT_DIAG_V1 | shared/er-epr-majorana-operators.ts | Stage 1 | Tiny Clifford/Majorana operator construction for the Stage 1 SYK-like toy solver. | tests/er-epr-majorana-operators.spec.ts, docs/research/er-epr-tiny-syk-exact-diag-v1.md |
| ER_EPR_TINY_SYK_EXACT_DIAG_V1 | shared/er-epr-tiny-syk-hamiltonian.ts | Stage 1 | Seeded q=4 tiny SYK-like Hamiltonian and double-trace-like two-sided coupling builder. | tests/er-epr-tiny-syk-hamiltonian.spec.ts, tests/fixtures/er-epr-tiny-syk/tiny-syk-plan.fixture.json |
| ER_EPR_TINY_SYK_EXACT_DIAG_V1 | shared/er-epr-tiny-syk.ts | Stage 1 | Tiny two-sided SYK-like solver backend that emits raw telemetry through the existing solver adapter with hashes and model-internal caveats. | tests/er-epr-tiny-syk-telemetry.spec.ts, tests/er-epr-tiny-syk-evolution.spec.ts, docs/research/er-epr-tiny-syk-exact-diag-v1.md |
| ER_EPR_TINY_SYK_EXACT_DIAG_V1 | shared/er-epr-tiny-syk-safe-language.ts | Stage 1 | Safe-language renderer for tiny SYK reports, blocking real-universe, NHM2, stress-energy, and CL4 overclaims. | tests/er-epr-tiny-syk-safe-language.spec.ts, tests/er-epr-tiny-syk-artifact.spec.ts |
| ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1 | shared/er-epr-tiny-syk-validation-sweep.ts | Stage 1 | Validation sweep aggregating seeded tiny SYK-like runs, required controls, numerical honesty, and entropy washout. | tests/er-epr-tiny-syk-validation-sweep.spec.ts, tests/fixtures/er-epr-tiny-syk-validation/sweep-plan.fixture.json, docs/research/er-epr-tiny-syk-validation-sweep-v1.md |
| ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1 | shared/er-epr-tiny-syk-convergence.ts | Stage 1 | Numerical-method honesty checks for tiny SYK validation sweeps. | tests/er-epr-tiny-syk-convergence.spec.ts |
| ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1 | shared/er-epr-tiny-syk-control-aggregate.ts | Stage 1 | Required-control aggregation for wrong-sign, no-coupling, disentangled, shuffled, random-matrix, and spin-chain controls. | tests/er-epr-tiny-syk-control-aggregate.spec.ts |
| ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1 | shared/er-epr-tiny-syk-validation-safe-language.ts | Stage 1 | Safe-language renderer for tiny SYK validation reports, blocking real-universe, NHM2, stress-energy, exact-label, and CL4 overclaims. | tests/er-epr-tiny-syk-validation-safe-language.spec.ts, tests/er-epr-tiny-syk-validation-artifact.spec.ts |
| STARSIM_FUSION_MICROPHYSICS_STAGE1 | shared/starsim-fusion-microphysics.ts | Stage 1 | StarSim reduced-order stellar fusion microphysics prior for fusion channels, fusion-zone volumes, hSpectralFit calibration, compact-object context, and star-map structure priors; proxy-only and not direct ER=EPR evidence. | tests/starsim-fusion-microphysics.spec.ts, docs/research/starsim-fusion-microphysics-stage1.md, docs/knowledge/math-claims/starsim-fusion-microphysics.claims.json |
| STARSIM_FUSION_MICROPHYSICS_STAGE1 | shared/starsim-fusion-artifact.ts | Stage 1 | Artifact schema for StarSim fusion evaluations with claim IDs, citations, caveats, and reproducibility status. | tests/starsim-fusion-artifact.spec.ts |
| STARSIM_FUSION_SAFE_LANGUAGE | shared/starsim-fusion-safe-language.ts | Stage 1 | Claim-safe StarSim fusion report renderer with forbidden-phrase validation, source roles, uncertainty notes, and validity domains. | tests/starsim-fusion-safe-language.spec.ts, tests/starsim-fusion-claims.spec.ts |
| STARSIM_FUSION_PROFILE_IMPORT_STAGE2_PREP | shared/starsim-fusion-profile-import.ts | Stage 1 | MESA-compatible StarSim fusion profile import schema for fixture and external shell profiles; Stage 2 preparation only. | tests/starsim-fusion-profile-import.spec.ts, docs/research/starsim-fusion-profile-import-stage2-prep.md, docs/knowledge/math-claims/starsim-fusion-profile-import.claims.json |
| STARSIM_FUSION_PROFILE_IMPORT_STAGE2_PREP | shared/starsim-fusion-profile-validation.ts | Stage 1 | Profile validation computes shell-integrated luminosity, channel fractions, fusion-zone radii, closure warnings, and Stage 1 proxy comparison without promotion. | tests/starsim-fusion-profile-validation.spec.ts |
| STARSIM_FUSION_PROFILE_IMPORT_STAGE2_PREP | shared/starsim-fusion-profile-artifact.ts | Stage 1 | Artifact schema for profile validation outputs with safe-language and hSpectralFit guardrails. | tests/starsim-fusion-profile-artifact.spec.ts |
| STARSIM_FUSION_BENCHMARK_STAGE2_CANDIDATE | shared/starsim-fusion-benchmark-runner.ts | Stage 1 | Deterministic StarSim fusion benchmark runner for profile packs, closure checks, uncertainty summaries, blockers, and Stage 2 candidate verdicts without promotion. | tests/starsim-fusion-benchmark-runner.spec.ts, tests/fixtures/starsim-fusion-benchmarks/plan.fixture.json, docs/research/starsim-fusion-benchmark-stage2-candidate.md |
| STARSIM_FUSION_BENCHMARK_STAGE2_CANDIDATE | shared/starsim-fusion-uncertainty.ts | Stage 1 | Interval and deterministic fixture Monte Carlo uncertainty propagation for profile-derived fusion quantities. | tests/starsim-fusion-uncertainty.spec.ts |
| STARSIM_FUSION_BENCHMARK_STAGE2_CANDIDATE | shared/starsim-fusion-profile-closure.ts | Stage 1 | Surface Teff, logg, luminosity closure, and metadata warning checks for benchmark reports. | tests/starsim-fusion-profile-closure.spec.ts |
| STARSIM_FUSION_BENCHMARK_STAGE2_CANDIDATE | shared/starsim-fusion-benchmark-safe-language.ts | Stage 1 | Claim-safe benchmark report renderer blocking direct ER=EPR, propulsion, stress-energy, CL4, and Planck-constant overclaims. | tests/starsim-fusion-benchmark-safe-language.spec.ts |
| STARSIM_FUSION_EXTERNAL_REPRO_STAGE2_GATE | shared/starsim-fusion-stage2-gate.ts | Stage 1 | External-reproduction Stage 2 gate for MESA/GYRE metadata, solar closure, blockers, and ready-for-review verdicts without certification. | tests/starsim-fusion-stage2-gate.spec.ts, tests/fixtures/starsim-fusion-stage2-gate/solar-mesa-repro.fixture.json, docs/research/starsim-fusion-external-repro-stage2-gate.md |
| STARSIM_FUSION_EXTERNAL_REPRO_STAGE2_GATE | shared/starsim-fusion-neutrino-closure.ts | Stage 1 | Solar neutrino residual closure for pp-chain observational gate checks. | tests/starsim-fusion-neutrino-closure.spec.ts |
| STARSIM_FUSION_EXTERNAL_REPRO_STAGE2_GATE | shared/starsim-fusion-asteroseismic-closure.ts | Stage 1 | GYRE-style asteroseismic closure summaries for Stage 2 gate review. | tests/starsim-fusion-asteroseismic-closure.spec.ts |
| STARSIM_FUSION_EXTERNAL_REPRO_STAGE2_GATE | shared/starsim-fusion-stage2-gate-safe-language.ts | Stage 1 | Claim-safe Stage 2 gate renderer blocking certification, direct ER=EPR, propulsion, stress-energy, CL4, and Planck-constant overclaims. | tests/starsim-fusion-stage2-gate-safe-language.spec.ts |
| STARSIM_SOLAR_REFERENCE_REPRO_RUN_V1 | shared/starsim-solar-reference-run.ts | Stage 1 | Canonical solar reference runner that links runtime policy, profile validation, benchmark handoff, and Stage 2 gate handoff. | tests/starsim-solar-reference-run.spec.ts, tests/fixtures/starsim-solar-reference/solar-reference-plan.fixture.json, docs/research/starsim-solar-reference-repro-run-v1.md |
| STARSIM_SOLAR_REFERENCE_REPRO_RUN_V1 | server/modules/starsim/external/mesa-solar-runner.ts | Stage 1 | MESA solar runtime adapter with explicit fixture-only and unavailable external solver behavior. | tests/mesa-solar-runner.spec.ts |
| STARSIM_SOLAR_REFERENCE_REPRO_RUN_V1 | server/modules/starsim/external/gyre-summary-import.ts | Stage 1 | GYRE summary import helper for optional solar oscillation closure. | tests/gyre-summary-import.spec.ts |
| STARSIM_SOLAR_REFERENCE_REPRO_RUN_V1 | shared/starsim-solar-reference-safe-language.ts | Stage 1 | Claim-safe solar reference renderer blocking solver, ER=EPR, propulsion, stress-energy, CL4, and Planck-constant overclaims. | tests/starsim-solar-reference-safe-language.spec.ts |
| STARSIM_SOLAR_MESA_DOCKER_REPRO_V1 | server/modules/starsim/external/mesa-runtime-adapter.ts | Stage 1 | External/import MESA runtime adapter with no fixture fallback and hash requirements. | tests/mesa-runtime-adapter.spec.ts, ops/mesa/solar-reference/mesa-runtime-policy.import-fixture.json, docs/research/starsim-solar-mesa-docker-repro-v1.md |
| STARSIM_SOLAR_MESA_DOCKER_REPRO_V1 | server/modules/starsim/external/mesa-output-parser.ts | Stage 1 | MESA-like profile/history parser for StarSim solar fusion profile imports. | tests/mesa-output-parser.spec.ts |
| STARSIM_SOLAR_MESA_DOCKER_REPRO_V1 | shared/starsim-solar-mesa-repro-artifact.ts | Stage 1 | Artifact contract for MESA solar reproduction/import reports with QST boundaries. | tests/starsim-solar-mesa-repro-artifact.spec.ts |
| STARSIM_SOLAR_MESA_DOCKER_REPRO_V1 | shared/starsim-solar-mesa-repro-safe-language.ts | Stage 1 | Safe-language renderer for MESA solar reproduction/import reports. | tests/starsim-solar-mesa-repro-safe-language.spec.ts |
| STARSIM_ACCORDION_GALACTIC_DYNAMICS_NULL_MODEL_V1 | shared/starsim-accordion-cosmology-context.ts | Stage 1 | Observable Universe Accordion cosmology context with bound-system expansion guardrails. | tests/starsim-accordion-cosmology-context.spec.ts, docs/research/starsim-accordion-galactic-dynamics-null-model-v1.md |
| STARSIM_ACCORDION_GALACTIC_DYNAMICS_NULL_MODEL_V1 | shared/starsim-galactic-rotation-controls.ts | Stage 1 | Galactic rotation null controls for baryonic, dark-matter, MOND, and SPARC-like reference comparisons. | tests/starsim-galactic-rotation-controls.spec.ts, tests/fixtures/starsim-accordion/sparc-rotation-curve.fixture.json |
| STARSIM_ACCORDION_GALACTIC_DYNAMICS_NULL_MODEL_V1 | shared/starsim-accordion-galactic-null-model.ts | Stage 1 | Composes Accordion context, StarSim star nodes, fusion priors, rotation controls, and proxy-only QST annotations into a null-model report. | tests/starsim-accordion-galactic-null-model.spec.ts, tests/fixtures/starsim-accordion/accordion-local-volume.fixture.json |
| STARSIM_ACCORDION_GALACTIC_DYNAMICS_NULL_MODEL_V1 | shared/starsim-galactic-dynamics-safe-language.ts | Stage 1 | Safe-language renderer blocking direct ER=EPR, wormhole, propulsion, stress-energy, hydrostatic-rotation, and CL4 overclaims. | tests/starsim-galactic-dynamics-safe-language.spec.ts |

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
