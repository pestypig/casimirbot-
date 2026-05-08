# NHM2 Equation Visualizer Workbench

The NHM2 Equation Visualizer Workbench turns observable-equation-map nodes into diagnostic calculator and graphing presets.

Each preset binds a display equation, computable form, variable scope, graph mode, source artifacts, units/normalization, blocker status, and claim boundary.

The workbench is intended for inspection, sensitivity analysis, and figure generation. It does not validate NHM2, does not establish a physical mechanism, and does not promote the run.

## Pipeline

```text
Equation map node
-> computable expression or operator
-> variables from repo artifacts, constants, manual defaults, or sweep axes
-> graph spec
-> rendered figure
-> source-data JSON, Vega spec, preset trace, and manifest
```

## Equation Forms

Every equation keeps separate human and machine forms:

- `displayEquation` / `equationLatex` for people and KaTeX.
- `computableForms.expression` for math.js scalar expressions.
- `operatorKind` for non-scalar operations such as field sampling, tensor residuals, region aggregation, worldline sampling, or gate status.

The workbench does not execute LaTeX.

## Initial Demo Presets

- `alpha_centerline_profile`
- `beta_shift_component_profile`
- `same_basis_residual_component`
- `tile_source_parameter_sweep`
- `qei_sampling_window_demo`

These are diagnostic outputs only. Missing tensor/source/QEI data must be shown as missing, review-gated, or blocked, never as zero.

## Claim Boundary

All visualizer presets and outputs preserve:

```text
diagnosticOnly=true
doesValidateNHM2=false
validationClaimAllowed=false
physicalMechanismClaimAllowed=false
promotionAllowed=false
```

## Re-run

```bash
npm run nhm2:validate-equation-visualizer-presets
npm run nhm2:render-equation-visualizer-demos
npm run nhm2:validate-equation-visualizer-artifacts
npm run test:nhm2:equation-visualizer
npm run nhm2:equation-visualizer:check
```
