# Warp Geometry CL1–CL2 Chart Contract (M1)

Status: draft  
Owner: dan  
Scope: Chart and slicing contracts for CL1/CL2 comparisons

## Purpose
Define chart labels and slicing expectations so CL1–CL2 comparisons are made consistently. This contract prevents silent misuse of the stationary-slice reduction (C3) when d_t gamma_ij is not actually zero in the chosen chart.

## Chart Labels (Vocabulary)

| Chart Label | Description | d_t gamma_ij Handling |
| --- | --- | --- |
| lab_cartesian | (t, x, y, z) with x_s(t) in the lab frame | Use full C2 if gamma_ij depends on t via r_s(t). |
| comoving_cartesian | (t, xi, y, z) with xi = x - x_s(t) | C3 allowed when gamma_ij is time-independent in this chart. |
| spherical_comoving | (t, r, theta, phi) with x-axis as polar axis | C3 allowed when r_s is time-independent and gamma_ij is time-independent in this chart. |

## Chart Contract Rules
1. Any CL1 or CL2 comparison must declare the chart label used.
2. Use C3 (stationary reduction) only if the chart contract explicitly states d_t gamma_ij = 0.
3. If r_s depends on t in the chosen chart and gamma_ij depends on r_s, use full C2.
4. For any chart change (lab to comoving), record the coordinate relation in the adapter.

## Contract Status Flags (runtime)
The metric adapter now reports chart contract status to avoid silent misuse:

- `contractStatus = ok` when the chart label and dtGamma policy match defaults and no missing data is required.
- `contractStatus = override` when dtGammaPolicy is manually overridden away from the default for the chart.
- `contractStatus = unknown` when the chart label is unspecified, dtGammaPolicy is unknown, or dtGammaPolicy is "computed" but no dtGamma data is provided.

These flags are surfaced in the proof pack as:
- `metric_chart_contract_status`
- `metric_chart_contract_reason`

If status is `unknown` or `override`, CL1/CL2 comparisons are not considered chart-clean unless the reason is explicitly justified in the report.

## Adapter Chart Declarations (Current)
These declarations are the intended defaults for congruence checks.

| Metric Family | Preferred Chart | Notes on d_t gamma_ij |
| --- | --- | --- |
| Alcubierre | lab_cartesian or comoving_cartesian | gamma_ij = delta_ij is time-independent in both charts; C3 is valid. |
| Natario general class | lab_cartesian or comoving_cartesian | gamma_ij = delta_ij; C3 is valid if chart is fixed and consistent with X. |
| Natario zero-expansion (construction) | spherical_comoving | Use the chart where r_s is time-independent; C3 is valid if gamma_ij is stationary. |
| Van Den Broeck | comoving_cartesian | gamma_ij = B^2(r_s) delta_ij; use comoving chart or include d_t gamma_ij with C2 in lab chart. |

## CL1–CL2 Comparison Checklist
- Record chart label in the comparison table.
- If using C3, state why d_t gamma_ij = 0 in this chart.
- If using C2, document how d_t gamma_ij is computed (or approximated).

## Artifacts
- This chart contract is referenced by Phase M1 in `docs/warp-tree-dag-task.md`.
