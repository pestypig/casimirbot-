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
- Multi-fidelity reasoning: use cheap models first, expensive ones only when required
- Domain transfer: same loop applies to GR, noise, images, and belief graphs

## Product and packaging (planned)
- Open-source core stack (this repo)
- Helix console for operators and visibility
- Headless runner or CLI for CI and agent orchestration
- Enterprise deployment with policy controls and audit retention

## Differentiators
- Constraints are executable, not only documented
- Solver-driven verification gates outcomes
- Clear policy boundary for "viability" via `WARP_AGENTS.md`

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

## Benefit story across generation mediums (measurable targets)
If every request (code, physics kernels, noise fields, diffusion stubs, coherence graphs)
runs through the same constraint-first loop, improvements are expected to show up as
measurable reductions in failure modes and measurable increases in verified yield as
verification coverage increases.

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

## Next milestones
- Persist audit logs and expose summary dashboards
- Ship headless runner with documented endpoints
- Publish a pricing and packaging proposal tied to operator ROI
