# Curvature-Collapse Reproducibility Contract v1

This contract defines deterministic, falsifiable rules for the curvature-coupled collapse benchmark. It is a diagnostic framework and not a claim of faster-than-light signaling or literal objective-collapse physics.

## Scope
- Domain: `collapse_benchmark`
- GR framing: weak-field, kinematic diagnostic, `L_present <= c*tau`
- Claim ceiling: `diagnostic` unless promoted by explicit evidence policy

## Canonical Equations
- `p_trigger = 1 - exp(-dt/tau)`
- `L_present = min(r_c, c*tau)`
- `kappa_present = 1 / L_present^2`
- `instability = weighted(curvature ratio + residual + dispersion + incoherence + roots)`

## Reproducibility Rules
1. All benchmark runs must be seed-deterministic (`seed`, `step_index`).
2. Output must carry hash provenance (`inputs_hash`, `features_hash`, run/report hash).
3. Any promotion claim must include preregistered predictions and explicit null models.
4. Null models must be evaluated before coupling claims:
   - fixed `tau/r_c` baseline
   - DP-only baseline without curvature estimator
5. Every claim must state tier (`diagnostic`, `reduced-order`, `certified`) and uncertainty model.

## Promotion Gate
1. `diagnostic`:
   - requires unit consistency, monotonicity tests, deterministic replay, null-model comparison
   - cannot use language like "physically viable", "proven", or "admissible"
2. `reduced-order`:
   - requires external holdout, calibration, and cross-dataset replication
3. `certified`:
   - requires all HARD constraints pass, `ADMISSIBLE` certificate, and certificate integrity OK

## Required Artifacts
- `datasets/benchmarks/curvature-collapse-prediction-registry.v1.json`
- `configs/curvature-collapse-repro-contract.v1.json`
- `docs/specs/curvature-collapse-falsification-checklist-v1.md`
- `reports/math-report.json`

## Required Test Surfaces
- `tests/physics-contract.gate0.spec.ts`
- `tests/collapse-benchmark.phase1.spec.ts`
- `tests/collapse-benchmark.phase2.routes.spec.ts`
- `tests/collapse-benchmark.phase4.estimator.spec.ts`

## Deterministic Blockers
- Missing prediction preregistration record
- Null-model comparison missing or failed
- Casimir verification verdict not PASS
