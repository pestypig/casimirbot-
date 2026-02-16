# Business Model (Draft)

Status: draft. Derived from the offnote in `docs/product-narrative.md`.

## One sentence
A constraint-first engineering agent that uses solver-driven verification to
deliver reliable, testable system changes under finite compute budgets.

## Target users
- Systems engineering teams working on energy, timing, or field-sensitive systems
- R and D labs running simulations that must stay within physical constraints
- Platform and infra teams integrating code-gen into real codebases

## Problem
Modern code-generation tools are locally clever but globally sloppy. They often
miss cross-file dependencies, invariants, and build or test feedback loops, so
output looks done but does not land green.

## Solution
An agent that plans before it writes, reasons against explicit constraints,
verifies with solvers and tests, and escalates fidelity only when needed.

## Core value propositions
- Reliability: higher build success rate and lower time-to-green
- Auditability: constraints, certificates, and residuals are explicit artifacts
- Provenance: every answer ties to evidence, gates, and replayable traces
- Multi-fidelity reasoning: use cheap models first, expensive ones only when required
- Domain transfer: same loop applies to GR, noise, images, and belief graphs

## Product and packaging (planned)
- Open-source core stack (this repo)
- Helix console for operators and visibility
- Helix Ask surface for repo-grounded answers with inline provenance
- Helix Ask desktop bar + conversation panel for system-wide Q and A
- Seed mining and holdout panels for coverage and drift visibility
- Headless runner or CLI for CI and agent orchestration
- Enterprise deployment with policy controls and audit retention
- CPU-first deployment track for constrained environments (8 GB class)

## Differentiators
- Constraints are executable, not only documented
- Solver-driven verification gates outcomes
- Clear policy boundary for "viability" via `WARP_AGENTS.md`
- Release-candidate datasets (RC0/RC1) with pinned holdouts and manifest hashes
- Deployment gate with holdout thresholds before release
- Evidence identity normalization to keep citations and audits deterministic

## Revenue model (draft)
- Team licenses for agent orchestration and support
- Usage-based pricing for solver or verification runs
- Enterprise on-prem or air-gapped deployments

## Distribution and GTM
- Open-source as top-of-funnel for engineering teams
- Technical demos via solver-backed runs
- Early design partners in constrained engineering domains

## Metrics (product proof)
- Build success rate (green CI percentage)
- Time-to-green after a change
- Constraint violations per run (trend down)
- Performance or efficiency gains vs baseline
- Holdout precision/recall and citation recall (coverage and in-distribution)
- Gate pass rate with safety-handled outcomes
- RC dataset reproducibility (manifest hash stability)
- Helix Ask evidence-gate pass rate
- Helix Ask arbiter mix (`repo_grounded|hybrid|general|clarify`)
- Tree/DAG walk determinism rate (same inputs -> same ranked path/context)
- Graph-lock stability rate across multi-turn sessions

## Benefit story across generation mediums (measurable targets)
If every request (code, physics kernels, noise fields, diffusion stubs, coherence graphs)
runs through the same constraint-first loop, improvements are expected to show up as
measurable reductions in failure modes and measurable increases in verified yield as
verification coverage increases.

## Expansion and contraction execution model (2026)
This operating model explains how the system scales without drifting:

- Expansion is frontier generation: propose new trajectories, branches, and candidate actions.
- Contraction is reliable scaffolding: enforce constraints, policy gates, and certificate checks before accepting outcomes.
- Recollection is continuity: preserve traces, deltas, first-fail signals, and procedural reflections so each run starts from learned state, not from zero.

In this model, "singularity" is a convergence point where exploration speed and constraint fidelity remain aligned. It is not uncontrolled collapse; it is stable alignment under explicit limits.

### Collapse event (controlled contraction)
A collapse event is a deliberate narrowing step triggered when frontier motion exceeds verified scaffold capacity.

Typical trigger pattern:
- coherence drops and dispersion rises
- collapse pressure rises above the configured threshold
- first failing HARD constraint appears or certificate integrity/status is not admissible

Expected response:
- downgrade from frontier expansion to branch, clarification, or rollback
- lock to last certified baseline and preserve full artifact chain (trace, deltas, firstFail, certificate)
- emit recollection signals that inform the next action cycle

### Why this matters commercially
- Lower wasted labor: fewer speculative branches that cannot pass gates
- Faster maturity: teams can add frontier rungs while preserving reliability
- Higher trust: leadership decisions are auditable as "alignment under constraint"
- Durable innovation: invention widens freedom only after verification confirms stability

## Helix Ask reasoning and tree/DAG walk update (2026)
This update extends the business model from "constraint-first generation" to
"constraint-first retrieval and reasoning" at answer-time.

What changed in execution:
- Helix Ask now applies an anchor-and-walk graph resolver for configured tree topics before evidence gating.
- Tree/DAG traversal is deterministic under fixed tree files and walk config.
- Congruence-aware edge filtering tightens which paths are eligible by CL/chart/region conditions.
- Session graph-locks preserve tree-pack continuity across turns unless evidence shifts.
- Trace + memory layers preserve run artifacts and support replay-oriented recollection.

## Vision fit check (original -> current)
Original vision anchor: `docs/product-narrative.md` positions the product as a
constraint-first, verification-centered engineering agent that converges on
working systems under finite budgets.

Fit assessment:
- Fits directly: Helix Ask reasoning now uses the same gate discipline as
  solver/runtime paths (evidence gates, slot coverage, arbiter policy).
- Fits directly: deterministic tree/DAG walk reduces "plausible but ungrounded"
  answer drift and improves replayability.
- Fits directly: graph-lock + trace continuity supports durable, auditable
  multi-turn reasoning rather than stateless prompt completion.
- Partially fits: business ROI from this path is directionally clear but still
  under-instrumented in production KPI dashboards.

## What improved toward the goal
- Better repo-grounded consistency for complex prompts through graph-pack
  injection before synthesis.
- Lower answer variance from deterministic traversal and explicit walk rules.
- Stronger continuity for long tasks via session graph-lock behavior.
- Better forensic/debug quality from trace artifacts and training-trace export.
- Closer alignment between ideology-aware guidance and technical evidence paths.

## What remains undefined
- KPI baselines and SLO targets for Helix Ask-specific quality metrics
  (evidence-gate pass, arbiter mix, graph-lock stability).
- Promotion criteria that tie tree/DAG walk quality directly to release gates.
- A formal cross-domain policy for collapse-action thresholds outside current
  telemetry/governor defaults.
- Explicit economics model for answer-time verification cost vs latency budget
  at scale.
- Productized reporting surface that links these new reasoning metrics to
  customer ROI and renewal outcomes.

### Code + repo
- CI green rate up, time-to-green down
- Cross-file contract violations down (schema/pipeline/UI drift)
- Regression rate down (post-merge failures)

### GR / solver-backed evolution (internal calibration domain)
- Constraint residual norms remain bounded over steps (trend stability)
- Certificate issuance is traceable and reproducible
- Drift and instability events down via step-size control, gating, and escalation rules

### Noise field generation
- Laplacian RMS within bound (spatial coherence)
- Amplitude/saturation violations down (bounded extremes)
- Determinism up for (seed, constraints, budget) tuples

### Diffusion stubs
- Mask/prompt constraint violations down
- Collapse/degenerate outputs down
- Usable-output yield up per run under fixed budget

### Coherence graphs
- Contradiction count down
- Axiom satisfaction up
- Evidence-consistency score up with auditable traces

### Operator / trust
- Run artifacts are complete: plan, diff, constraint report, verification report, certificate (when required)
- Faster triage: fewer "why did this happen" incidents due to explicit residual and gate traces

## Current repo alignment
In place:
- GR solver, constraints, and evolution loop (`modules/gr/*`)
- Constraint gate evaluation and certificates (`server/gr/*`, `tools/warpViabilityCertificate.ts`)
- Agent loop with acceptance gate (`server/gr/gr-agent-loop.ts`)
- Multi-domain loop scaffolds (noise field, belief graph, 4D constraint network)

Gaps:
- Persistent audit logs (store is in-memory)
- KPI dashboards and reporting for operators
- Headless runner/CLI and CI integration
- Formal packaging and licensing model

## Risks and mitigations
- Overclaiming physics: keep GR internal and use it as a stress-test domain
- Compute cost: enforce model ladder and gating before high-fidelity runs
- Trust and compliance: make audit logs persistent and reviewable
- Deployment drift: enforce RC manifests + holdout gates before release
- Artifact drift on non-persistent hosts: hydrate model/index artifacts by hash

## Deployment constraints (2026)
- Target 8 GB RAM CPU-only environments with quantized models (1-3B, 4-bit).
- Treat models and indexes as versioned artifacts (object storage hydration).
- Keep context budgets small and rely on retrieval + gates for correctness.
- Reserve headroom for UI, retrieval, and render workloads (avoid OOM spikes).

## Next milestones
- Persist audit logs and expose summary dashboards
- Ship headless runner with documented endpoints
- Publish a pricing and packaging proposal tied to operator ROI
