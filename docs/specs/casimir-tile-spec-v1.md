# Casimir Tile Spec v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Authoritative tile-definition contract for manufacturing, metrology, and governance handoff.

## Tile Type Split

| Tile type | Purpose | Authority level | Typical usage |
|---|---|---|---|
| Lab Coupon Tile | Fabrication and measurement target for physical cavity characterization | Authoritative for build/test | MEMS fabrication, metrology, uncertainty closure |
| System Mechanism Tile | Pipeline/scenario abstraction for campaign simulation and ledgers | Authoritative for model/governance only | Reduced-order campaign parameters, telemetry, what-if scans |

## Versioned Parameter Block

- `spec_version`: `casimir-tile-spec-v1`
- `commit_pin`: `83ad2276e89f6766b863d0b10ab7a09d569585da`
- `owner`: `research-governance`

### Lab Coupon Tile (v1)

| Parameter | Symbol | Target | Allowed range/band | Unit | Notes |
|---|---|---:|---:|---|---|
| Gap target | `gap_nm_target` | 96 | 80-150 | nm | Bench-first target band |
| Active area | `area_mm2` | 1.0 | 0.25-1.0 | mm^2 | Increase support density as area grows |
| Span topology | `support_topology` | segmented membrane | required | n/a | No unsupported 1 mm free span at 100 nm class |
| Substrate | `substrate` | HR-Si | Si or equivalent | n/a | Low-loss baseline |
| Membrane | `membrane` | low-stress SiN | SiN/SOI derived | n/a | Must publish residual stress |
| Coating | `coating` | optional Au | Ti/Au or equivalent | n/a | Coating choice must be declared |
| Vacuum target | `vacuum_torr_max` | 1e-6 | <=1e-6 | Torr | Packaged retention target |
| Temperature mode | `temperature_mode` | room or cryo | 300 K / 4-20 K | K | Mode must be explicit per test lot |

### System Mechanism Tile (v1)

| Parameter | Symbol | Default | Unit | Scope note |
|---|---|---:|---|---|
| Gap (mechanism model) | `gap_nm` | 1 | nm | Model abstraction; not direct fabrication target |
| Tile area (mechanism model) | `tileArea_cm2` | 25 | cm^2 | Scenario parameter for pipeline narratives |
| Duty-cycle control | `dutyCycle` | model-dependent | fraction | Campaign control variable |

## Metrology Contract

| Measurement | Symbol | Method class | Unit | Acceptance threshold | Uncertainty field | Deterministic fail condition |
|---|---|---|---|---|---|---|
| Mean gap | `g_mean` | interferometry/capacitance cross-check | nm | within declared band | `u_g_nm` | fail if `g_mean` out of band |
| Gap uniformity | `g_sigma` | map across active area | nm | <= declared lot limit | `u_gsigma_nm` | fail if above limit |
| Parallelism/tilt | `theta_tilt` | optical metrology | urad | <= declared tilt limit | `u_theta_urad` | fail if above limit |
| Surface roughness | `Rq` | AFM/profilometry | nm | <= declared roughness limit | `u_rq_nm` | fail if above limit |
| Patch potential RMS | `V_patch_rms` | KPFM/electrostatic calibration | mV | <= declared patch limit | `u_vpatch_mV` | fail if above limit |
| Casimir pressure response | `P_casimir` | force-gap sweep fit | Pa | model-fit residual <= limit | `u_p_pa` | fail if residual exceeds limit |
| Package leak/hermeticity | `leak_rate` | package leak test | atm*cc/s | <= declared leak limit | `u_leak` | fail if above limit |

## Uncertainty and Falsifiers

| Metric | Required uncertainty value | Decision rule | Falsifier |
|---|---|---|---|
| Gap and uniformity | `u_g_nm`, `u_gsigma_nm` | Accept only if measured value and uncertainty keep metric inside band | Any confidence interval crossing fail threshold |
| Patch potential | `u_vpatch_mV` | Accept only if electrostatic load uncertainty does not dominate Casimir inference | Patch-driven force uncertainty exceeds allowed fraction |
| Pressure fit | `u_p_pa` | Accept only if fit residual and uncertainty satisfy contract | Residual or uncertainty violates contract |
| Packaging leak | `u_leak` | Accept only if leak criterion holds with uncertainty margin | Leak criterion violated under uncertainty |

## Traceability

| Field | Value |
|---|---|
| `commit_pin` | `83ad2276e89f6766b863d0b10ab7a09d569585da` |
| `artifact_links` | `docs/specs/casimir-tile-manufacturing-delta-v1.md`, `docs/specs/casimir-tile-test-vehicle-plan-v1.md`, `docs/specs/casimir-tile-rfq-pack-v1.md` |
| `owner` | `research-governance` |
| `status` | `draft_v1` |
