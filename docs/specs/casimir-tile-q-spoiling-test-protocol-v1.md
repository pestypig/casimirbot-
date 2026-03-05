# Casimir Tile Q-Spoiling Test Protocol v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Test-ready protocol for cavity Q baseline and spoil-mechanism characterization with deterministic equations, uncertainty propagation, and fail-closed decision rules.

## Scope
Applies to:
- copper reference cavity lanes
- cryogenic niobium SRF lanes
- mechanism-specific spoil sweeps (oxide/TLS, hydride/Q disease, trapped flux)

Does not apply to:
- campaign-level physical-feasibility claims
- runtime API behavior or solver threshold changes

## Core Variables and Equations

Definitions:
- `f0`: resonance frequency
- `Delta_f_3dB`: 3 dB bandwidth
- `Q_L`: loaded Q
- `Q_0`: intrinsic/unloaded Q
- `beta_i`: external coupling coefficient at port `i`
- `Q_ei`: external Q at port `i`

Primary extraction:
1. `Q_L = f0 / Delta_f_3dB`
2. Two-port cavity relation: `Q_0 = Q_L * (1 + beta_1 + beta_2)`
3. Single-port cavity relation: `Q_0 = Q_L * (1 + beta)`
4. External Q relation: `Q_ei = Q_0 / beta_i`

Coupling correction:
- Use complex circle-fit of VNA data as authoritative method for `beta_i`.
- If fallback magnitude method is used (single-port):
  - let `Gamma0 = |S11(f0)|`
  - under-coupled estimate: `beta = (1 - Gamma0) / (1 + Gamma0)`
  - over-coupled estimate: `beta = (1 + Gamma0) / (1 - Gamma0)`
- Fallback magnitude method must be flagged and cross-checked with circle-fit in at least one reference run.

Spoil-factor extraction:
1. Mechanism-specific spoil factor:
   - `F_Q_spoil,m = Q0_clean / Q0_spoiled,m`
2. Inverse-Q increment:
   - `Delta(1/Q0)_m = (1/Q0_spoiled,m) - (1/Q0_clean)`
3. Surface-resistance increment (if geometry factor `G` known):
   - `Delta_Rs,m = G * Delta(1/Q0)_m`

## Measurement Setups

### Setup A: Two-Port Transmission Cavity (recommended)
- Instrument: VNA (full two-port calibration)
- Outputs: `S21`, `S11`, `S22` around resonance
- Extraction: circle-fit + Lorentzian bandwidth cross-check

### Setup B: Single-Port Reflection Cavity
- Instrument: VNA one-port calibration
- Outputs: `S11` around resonance
- Extraction: circle-fit preferred; fallback magnitude method only with flagged status

## Test Sequence
1. Baseline preparation:
   - document geometry, coupling hardware, temperature, ambient field, and vacuum/medium state
2. Baseline run:
   - measure `Q_L`, coupling coefficients, and compute `Q_0`
3. Spoil sweep by mechanism:
   - oxide/TLS lane
   - hydride/Q disease lane
   - trapped-flux lane
4. Per-lane recompute:
   - `Q_0`, `F_Q_spoil,m`, `Delta(1/Q0)_m`
5. Repeatability:
   - run required repeat count across dies/lots and report variance

## Mechanism-Specific Lane Controls

| Mechanism lane | Controlled variable | Required control notes | Required output |
|---|---|---|---|
| Oxide/TLS | surface state and low-field regime | document oxide condition and field range | `F_Q_spoil,oxide`, low-field slope summary |
| Hydride / Q disease | thermal history/cooldown hold profile | document hold window and cooldown path | `F_Q_spoil,hydride` |
| Trapped flux | ambient magnetic field and thermal gradient | document field shielding and cooldown gradient | `F_Q_spoil,flux` |

## Acceptance and Falsifier Rules

Per-lane acceptance:
- Baseline lane must report reproducible `Q_0` with coupling-corrected extraction.
- Spoil lane `m` passes only if `F_Q_spoil,m <= B_m` where `B_m` is declared program bound.

Global fail-closed triggers:
1. Missing coupling correction evidence (`beta` values unavailable).
2. Using fallback coupling method without reference cross-check.
3. Missing uncertainty for any published `Q_0` or `F_Q_spoil,m`.
4. Any enabled mechanism lane missing in report.
5. Any enabled lane with `F_Q_spoil,m > B_m`.

## Uncertainty Propagation

Minimum uncertainty outputs:
- `u_f0`, `u_Delta_f`, `u_Q_L`, `u_beta`, `u_Q0`, `u_FQ_spoil`

Propagation formulas:
1. `u_Q_L = Q_L * sqrt((u_f0/f0)^2 + (u_Delta_f/Delta_f_3dB)^2)`
2. Let `kappa = 1 + sum(beta_i)` then `Q_0 = Q_L * kappa`
   - `u_Q0 = Q_0 * sqrt((u_Q_L/Q_L)^2 + (u_kappa/kappa)^2)`
3. `u_FQ_spoil = F_Q_spoil * sqrt((u_Q0clean/Q0_clean)^2 + (u_Q0spoil/Q0_spoiled)^2)`

## Data Contract

Required outputs per run:
- `run_id`, `lot_id`, `die_id`, `mechanism_lane`
- `f0`, `Delta_f_3dB`, `Q_L`, `Q_0`
- `beta_1`, `beta_2` (or `beta` for one-port)
- `F_Q_spoil,m`, `Delta(1/Q0)_m`, optional `Delta_Rs,m`
- uncertainty fields for all published quantities
- extraction method tag (`circle_fit` or `fallback_magnitude`)

## Bookkeeping Requirements
- Register each protocol execution in:
  - `docs/specs/casimir-tile-spec-bookkeeping-v1.md`
- Link protocol outputs to:
  - `docs/specs/casimir-tile-spec-v1.md`
  - `docs/specs/casimir-tile-manufacturing-delta-v1.md`
  - `docs/specs/casimir-tile-test-vehicle-plan-v1.md`
  - `docs/specs/casimir-tile-rfq-pack-v1.md`

## Traceability
- `spec_version`: `casimir-tile-q-spoiling-test-protocol-v1`
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `RF-and-surface-physics`
- `status`: `draft_v1`
