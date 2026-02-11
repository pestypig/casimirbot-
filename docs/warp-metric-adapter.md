# Warp Metric Adapter Spec

Status: draft  
Owner: dan  
Date: 2026-02-09  
Scope: Chart + ADM metadata contract for CL1/CL2 comparisons and downstream guardrails.

## Purpose
Provide a single, chart-aware adapter surface that exposes ADM inputs and slicing contracts for warp metrics. This adapter is the canonical source for CL1/CL2 comparisons and for determining whether a runtime path is geometry-derived.

Canonical contract (2026-02-11):
- Baseline family: `natario` (comoving_cartesian chart, Eulerian observer, SI stress normalization).
- Secondary family: `alcubierre` (supported for audits and alternate runs, not the baseline reference).

This spec mirrors `modules/warp/warp-metric-adapter.ts` and is referenced by:
- `docs/warp-geometry-cl1-cl2-chart-contract.md`
- `docs/proof-pack.md` (metric adapter keys)
- `docs/warp-congruence-build-plan.md` (Phase P1)

## Core Types (summary)

### Chart contract
- `label`: `lab_cartesian` | `comoving_cartesian` | `spherical_comoving` | `unspecified`
- `dtGammaPolicy`: `computed` | `assumed_zero` | `unknown`
- `coordinateMap`: optional chart mapping note
- `notes`: optional annotation
- `contractStatus`: `ok` | `override` | `unknown`
- `contractReason`: optional reason for non-`ok` status

### Adapter snapshot (runtime payload)
- `family`: `natario` | `natario_sdf` | `alcubierre` | `vdb` | `unknown`
- `chart`: chart contract block (above)
- `alpha`: lapse (scalar)
- `gammaDiag`: `[gamma_xx, gamma_yy, gamma_zz]` (diagonal slice metric)
- `betaSource`: `shiftVectorField` | `none`
- `requestedFieldType`: optional warp field request string
- `betaDiagnostics`: optional shift diagnostics
  - `method`: `hodge-grid` | `finite-diff` | `not-computed`
  - `thetaMax`, `thetaRms` (shift divergence estimates)
  - `curlMax`, `curlRms` (curl magnitude estimates)
  - `sampleCount`, `step_m`
  - `note`

### Input options
- `shiftVectorField.evaluateShiftVector(x,y,z)` to enable finite-diff diagnostics.
- `hodgeDiagnostics` to import precomputed Helmholtz-Hodge diagnostics.
- `dtGammaProvided` (boolean) to confirm `d_t gamma_ij` is provided when `dtGammaPolicy=computed`.

## Contract Status Rules
- `ok`: chart label + dtGamma policy match defaults and no missing `dtGamma` data is required.
- `override`: dtGamma policy overridden from defaults.
- `unknown`: chart label unspecified, dtGamma policy unknown, or `dtGammaPolicy=computed` with no `dtGamma` provided.

If `contractStatus` is `override` or `unknown`, CL1/CL2 comparisons require manual justification before being treated as chart-clean.

## Proof Pack Keys
Metric adapter snapshot fields are surfaced in the proof pack as:
- `metric_adapter_family`
- `metric_chart_label`
- `metric_dt_gamma_policy`
- `metric_chart_contract_status`
- `metric_chart_contract_reason`
- `metric_requested_field`
- `metric_chart_notes`
- `metric_coordinate_map`
- `metric_alpha`
- `metric_gamma_xx`, `metric_gamma_yy`, `metric_gamma_zz`
- `metric_beta_method`
- `metric_beta_theta_max`, `metric_beta_theta_rms`
- `metric_beta_curl_max`, `metric_beta_curl_rms`
- `metric_beta_sample_count`, `metric_beta_step_m`
- `metric_beta_note`

Proxy flags follow the contract status: if `contractStatus != ok`, chart contract values are marked proxy in the proof pack.

## Related Files
- `modules/warp/warp-metric-adapter.ts`
- `modules/warp/natario-warp.ts`
- `server/helix-proof-pack.ts`
- `client/src/components/WarpProofPanel.tsx`

## Next Steps
- Provide `dtGamma` diagnostics for any adapter operating in `lab_cartesian` where `gamma_ij` is time-dependent.
- Upgrade CL3/CL4 guardrails to consume geometry-derived metrics from adapters.
