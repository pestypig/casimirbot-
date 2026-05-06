# NHM2 Observable Equation Figure Plan

The NHM2 Observable Equation Map defines the whitepaper-grounded chain from 3+1 solve observables to metric-required source tensors, observer projections, source-side tile-effective counterparts, closure residuals, energy-condition/QEI requirements, reproducibility gates, and claim locks.

The map is not a validation artifact. It is a figure-planning and claim-boundary artifact.

External literature supplies method context and constraint boundaries only. External papers are not validation evidence for NHM2, propulsion, source-tensor closure, or QEI completion.

## Scope

The map binds each planned figure to:

- a symbol or equation,
- its mathematical or physical meaning,
- the repo field or artifact that supplies it,
- units or normalization status,
- the planned figure type,
- current claim status,
- missing blocker status,
- literature context.

## Figure Rule

A figure may only be generated if it is backed by an observable-equation-map node.

Every node answers:

1. What symbol or equation is this?
2. What observable or relation does it expose?
3. Which repo artifact or field supplies it?
4. What units or normalization are used?
5. Which figure type best represents it?
6. Which claim remains blocked?
7. Which literature sources provide context or constraints?

## Planned Figure Families

### 01 Equation Flow Map

Type: `equation_flow_dag`

Purpose: show the whitepaper chain from 3+1 observables to metric-required source, observer projections, tile-effective counterpart, closure residuals, QEI/energy-condition gates, reproducibility, and claim locks.

### 02 3+1 Observable Fields

Type: `field_slice`

Purpose: show `alpha`, `alpha - 1`, `beta_x`, `|beta|`, `theta`, and selected curvature diagnostics with units/normalization and field statistics.

### 03 Centerline Observer Decomposition

Type: `centerline_curve`

Purpose: show `d tau / dt`, observer energy density `E`, selected `J_i` and `S_ij` components along the centerline with hull/wall/exterior region bands.

### 04 Metric-Required Tensor

Type: `tensor_matrix`

Purpose: show `T_geom_ab = G_ab / 8 pi` components, component availability, basis, and region aggregation.

### 05 Tile-Effective Source Model

Type: `tile_layout`, `sector_schedule`, `tensor_matrix`

Purpose: show representative tile geometry, sector schedule, and available tile-effective counterpart tensor components.

### 06 Same-Basis Closure

Type: `residual_chart`, `tensor_matrix`

Purpose: show `T_geom_ab` versus `T_tile_eff_ab` in the same chart/basis, including regional hull/wall/exterior residuals.

### 07 Energy-Condition Observer Family

Type: `observer_family_surface`

Purpose: show which observer families have NEC/WEC/SEC/DEC evidence and which remain missing or review-gated.

### 08 QEI Sampling Requirement

Type: `qei_sampling_plot`

Purpose: show weighted worldline sampling requirement and dossier completeness. This is not a completed QEI bound unless the ledger explicitly promotes it.

### 09 Convergence Reproducibility

Type: `convergence_plot`, artifact table

Purpose: show grid convergence, run hashes, input artifacts, adapter status, and reproducibility blockers.

### 10 Claim Boundary

Type: `claim_boundary_strip`

Purpose: show `validationClaimAllowed=false`, `physicalMechanismClaimAllowed=false`, and `promotionAllowed=false`.

## Claim Boundary

All generated map and future atlas artifacts must preserve:

```text
validationClaimAllowed=false
physicalMechanismClaimAllowed=false
promotionAllowed=false
literatureDoesValidateNHM2=false
```

The figure plan may say:

- `3+1 observable`,
- `metric-required source`,
- `observer projection`,
- `tile-effective source counterpart`,
- `closure residual`,
- `QEI sampling requirement`,
- `literature context`.

The figure plan must not say:

- propulsion is validated,
- a physical mechanism is confirmed,
- external literature validates NHM2,
- QEI or energy conditions are cleared without explicit ledger evidence,
- source closure is promotion-safe without explicit ledger evidence.

## Re-run

```bash
npm run nhm2:validate-observable-equation-map
npm run test:nhm2:observable-equation-map
npm run nhm2:observable-equation-map:check
```
