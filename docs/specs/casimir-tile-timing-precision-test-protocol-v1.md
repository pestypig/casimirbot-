# Casimir Tile Timing Precision Test Protocol v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Test-ready protocol for timing-precision acceptance in synchronization lanes used by Casimir tile control and measurement systems.

## Scope
Applies to:
- White Rabbit (WR) profile timing lanes
- IEEE 1588/PTP hardware timestamped lanes
- long-haul exploratory timing demonstrations

Does not apply to:
- uninstrumented software-timestamp-only timing claims
- generic timing claims without topology and measurement conditions

## Core Definitions and Equations

Let:
- `tM_i` = master timestamp at event `i`
- `tS_i` = slave timestamp at event `i`
- `dhat_i` = estimated path-delay correction at event `i`
- `e_i` = corrected timing error sample

1. Error sample:
- `e_i = tS_i - tM_i - dhat_i`

2. Mean offset:
- `mu_e = (1/N) * sum(e_i)`

3. RMS timing jitter:
- `sigma_t = sqrt((1/(N-1)) * sum((e_i - mu_e)^2))`

4. Peak-to-peak time error:
- `TIE_pp = max(e_i) - min(e_i)`

5. Packet delay variation proxy:
- `PDV_pp = max(dhat_i) - min(dhat_i)`

6. Frequency error over window `DeltaT`:
- `y = (mu_e(t+DeltaT) - mu_e(t)) / DeltaT`

## Measurement Preconditions

Hard preconditions for WR-profile acceptance:
1. Hardware timestamping enabled at relevant network interfaces.
2. Profile supports syntonization (SyncE-capable path where required).
3. Link topology and asymmetry calibration state are documented.
4. Transparent/boundary clock behavior along path is documented.

Fail-closed if any precondition is missing.

## Acceptance Profiles

### Profile WR-SHORT-PS
Use when topology and instrumentation match WR conditions for short/metro links.

Required metrics:
- `sigma_t_ps` (RMS jitter) <= `100 ps`
- `TIE_pp_ps` <= declared bound for test window
- `PDV_pp_ps` <= declared bound for path class

Fail if:
- any metric exceeds bound
- uncertainty interval crosses bound
- required preconditions not met

### Profile WR-LONGHAUL-EXP
Use for long-haul WR demonstrations (hundreds of km) unless replicated under identical conditions.

Required metrics:
- `sigma_t_ps`, `TIE_pp_ps`, `PDV_pp_ps` reported with uncertainty
- topology-specific compensation details present

Rule:
- exploratory only unless independently reproduced in-house with matching topology.

## Uncertainty Requirements

Minimum required uncertainty outputs:
- `u_sigma_t_ps`
- `u_TIE_pp_ps`
- `u_PDV_pp_ps`
- `u_mu_e_ps`

Decision rule:
- accept only if metric confidence interval remains within profile bounds.

## Data Contract

Required output fields per run:
- `run_id`, `lot_id`, `path_id`, `profile_id`
- `N_samples`, `window_s`
- `sigma_t_ps`, `TIE_pp_ps`, `PDV_pp_ps`, `mu_e_ps`
- uncertainty fields above
- `timestamping_mode` (`hardware` or `software`)
- `synce_enabled` (bool)
- `clock_mode` (`transparent`, `boundary`, `mixed`)

## Deterministic Falsifiers

1. `timestamping_mode != hardware` for WR-SHORT-PS claims.
2. Missing SyncE/syntonization evidence for WR profile claims.
3. `sigma_t_ps` above profile bound.
4. Uncertainty interval crosses profile bound.
5. Claimed long-haul parity without matching topology metadata.

## Traceability
- `spec_version`: `casimir-tile-timing-precision-test-protocol-v1`
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `timing-and-controls`
- `status`: `draft_v1`
