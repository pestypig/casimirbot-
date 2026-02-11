# Warp Geometry CL3 Constraint-First Path (M2)

Status: draft  
Owner: dan  
Scope: CL3 stress-energy congruence via Hamiltonian/momentum constraints

## Purpose
Define the constraint-first path for CL3: derive rho_E from geometry (gamma_ij, K_ij) and compare it to any pipeline T00. This prevents inverse-only mappings from being treated as congruent.

## CL3 Rule
CL3 equivalence is satisfied only when Eulerian energy density derived from the Hamiltonian constraint matches the pipeline stress-energy within a declared tolerance.

Default tolerance: `WARP_CL3_RHO_DELTA_MAX` (relative delta; default 0.1). This value is surfaced in proof packs as `gr_cl3_rho_threshold`.

## Constraint-First Flow
1. Adapter outputs alpha(x), beta^i(x), gamma_ij(x) and chart label.
2. Compute K_ij using C2 (full) or C3 (stationary) consistent with chart contract.
3. Compute rho_E from the Hamiltonian constraint:
```text
R + K^2 - K_ij K^ij = 16 pi rho_E
```
4. Compute residuals for Hamiltonian and momentum constraints.
5. Compare constraint-derived rho_E to pipeline T00 (if present).

## Runtime Wiring (current)
- `server/gr-evolve-brick.ts` computes `rho_constraint` when Ricci3, K, and KijKij channels are available.
- `server/helix-proof-pack.ts` exposes:
  - `gr_rho_constraint_*` (constraint-derived rho_E)
  - `gr_cl3_rho_delta_*` (relative deltas vs metric or matter T00)
  - `gr_cl3_rho_gate` (CL3 pass/fail)
- `tools/warpViability.ts` uses `rho_constraint` with metric-derived T00 when available, otherwise GR matter T00.
- `modules/warp/natario-warp.ts` now derives `warp.metric.T00` from the shift field (flat-slice finite differences) for Natario/Natario-SDF/irrotational paths, exposed as `metricT00` + `metricT00Source`.
- `modules/warp/natario-warp.ts` now prefers metric-derived stress tensors when `metricT00` is available, with pipeline stress kept as fallback.

Proxy note:
- Pipeline `rho_avg` deltas remain proxy-only.
- CL3 gate is non-proxy only when using `warp.metric.T00` (metric-only gate).

## Residual Policy (Draft)
- Hamiltonian residual: |R + K^2 - K_ij K^ij - 16 pi rho_E| <= epsilon_H
- Momentum residual: |D_j (K^ij - gamma^ij K) - 8 pi S^i| <= epsilon_M

## CL3 Comparison Rule
- If pipeline T00 is provided, declare CL3 congruent only when |rho_E - T00| <= tolerance_T00.
- Otherwise, CL3 is not established and remains proxy-only.

## Kickoff Checklist
- Identify current ADM field sources for the GR constraint gate.
- Enumerate existing proxy paths (Casimir to curvature proxy).
- Define initial epsilon_H, epsilon_M, and tolerance_T00 targets.
- Add a minimal report that prints rho_E (constraint-derived) vs T00 (pipeline).

## Artifacts
- This CL3 path is referenced by Phase M2 in `docs/warp-tree-dag-task.md`.
