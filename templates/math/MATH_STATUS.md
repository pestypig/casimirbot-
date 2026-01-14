# Math Status Registry (Starter)

Purpose: track math maturity across the repo so checks match the model's
resolution. This avoids over-claiming and keeps validation proportional.

## Stages
Stage 0 (Exploratory / Proxy)
- Allowed claims: qualitative trends, intuition-building, visualization.
- Checks: sanity checks and "does not crash" (no hard fail).

Stage 1 (Reduced-order / Approximate)
- Allowed claims: coarse estimates, simplified dynamics, proxy constraints.
- Checks: regression snapshots or known-case tests.

Stage 2 (Diagnostic / High-fidelity)
- Allowed claims: numerical diagnostics, constraint residuals, trend analysis.
- Checks: residual thresholds + stability checks.

Stage 3 (Certified / Policy-gated)
- Allowed claims: pass/fail under named policy, certificate-backed.
- Checks: hard constraints + certificate integrity + required tests.
- Narrative: `motivation` + `conceptualWaypoints` (3-7 waypoints) required for
  certified modules.

## Modules (Example)

| Tag | Module | Stage | Notes | Checks |
| --- | --- | --- | --- | --- |
| CORE | src/gr/solver.ts | Stage 2 | BSSN evolution step. | tests/gr-constraint.spec.ts |
| PIPELINE | src/pipeline/energy.ts | Stage 1 | Reduced-order energy model. | tests/pipeline.spec.ts |
| CERT | src/gr/gate.ts | Stage 3 | Gate + certificate checks. | tests/gr-gate.spec.ts, policy.md |

## Automation
- Registry metadata lives in `shared/math-stage.ts` (or your equivalent).
- Validator: `npm run math:validate`
- Report: `npm run math:report`
- Traceback: `npm run math:trace -- gr` (optional)
- Default stage policy: `math.config.json`
- Evidence profiles: `math.evidence.json`
- Inline overrides: `// math-stage: diagnostic` in the first few lines of a file.
- Narrative fields: `motivation` and `conceptualWaypoints` in `shared/math-stage.ts`.
