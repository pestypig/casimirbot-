Program gate: G0 — reduced-order ledger repair and preregistration
Workstream: controlled stellar composition transport
Capability or component: deep-mixing ledgers, guardrails, and future-gate semantic contract
Current maturity: reduced_order_diagnostic
Target maturity: preregistered and internally consistent reduced-order diagnostic
Required frozen inputs: G0 active packet, legacy physics/preset code, restoration theory graph, August 23, 2026 numerical audit
Required evidence: typed ledger, numerical reproduction, adversarial guardrail tests, versioned preregistration, theory boundary validation
Stop/fail criteria: unresolved rate semantics, alpha-epsilon circularity, asymmetric safety gate, fixture promotion, or failed targeted verification
Explicit non-goals: stellar-evolution solution, lifetime-extension validation, actuator feasibility, NHM2 or warp promotion
Downstream gate unlocked: G1 — real calibrated solar baseline

# G0 result record

Decision: **`PASS_REDUCED_ORDER_PREREGISTERED`**

Decision date: **August 24, 2026**

## Closed discrepancies

- The ambiguous `DOTM_SUN_KG_S` identifier was replaced by
  `SOLAR_HYDROGEN_BURN_REFERENCE_KG_S`; it is explicitly a hydrogen-burning
  mass-processing reference and not solar mass loss.
- The typed ledger now separates gross circulation, composition contrast,
  transport efficiency, net inward hydrogen delivery, cumulative accessible
  hydrogen, and `alpha`.
- `alpha` is computed as cumulative net hydrogen delivery divided by the
  envelope hydrogen reservoir. It is not assigned from `epsilon`.
- Requested lifetime thresholds retain separate `epsilonHypothesis` UI values;
  the implementation no longer exposes an `epsilon` field as though it were
  derived from the requested extension.
- Luminosity and core-temperature drifts use absolute magnitudes.
- Seismic and neutrino channels require residual value, uncertainty, sample
  age, and evidence mode. Invalid, stale, non-finite, uncertainty-free, or
  synthetic inputs fail closed.
- The theory boundary is now titled **Controlled Stellar Composition Transport
  Feasibility Proposition**, and the transition hazard is explicitly
  non-evidentiary.

## Reproduced audit

With the frozen G0 constants and a Julian year of `31,557,600 s`:

| Quantity | G0 result |
| --- | ---: |
| Gross circulation at `epsilon=0.01` | `6.0e9 kg s^-1` |
| Net hydrogen delivery at `Delta X=0.36`, `eta=1` | `2.16e9 kg s^-1` |
| Reference burn offset | `0.0036` |
| Tachocline radial setpoint | approximately `1.0067e-10 m s^-1` |
| No-mix constant one-zone depletion | approximately `6284.804 Myr` |
| Mixed constant one-zone depletion | approximately `6307.511 Myr` |
| Constant one-zone extension | approximately `22.707 Myr` |
| Epsilon required for a `600 Myr` one-zone extension | approximately `0.242079` |
| Corresponding gross circulation | approximately `1.452474e11 kg s^-1` |
| Corresponding tachocline speed | approximately `76.90 mm yr^-1` |

These are reduced-order bookkeeping results, not physical solar predictions.

## Frozen future-gate semantics

The versioned contract is
[`controlled-stellar-composition-transport-g0-preregistration.v1.json`](../../configs/research/controlled-stellar-composition-transport-g0-preregistration.v1.json).
It freezes milestone meanings, the acceptance-vector fields, numerical-policy
requirements, claim locks, and terminal outcomes. Exact observational
tolerances and milestone thresholds remain null and must be versioned in G1
before any intervention outcome is viewed.

## Verification evidence

- `tests/deep-mixing-g0.spec.ts`: **11/11 PASS**.
- StarSim and merged Theory Graph tests: **7/7 PASS**.
- `npm run math:validate`: **PASS, 318 entries**.
- Isolated TypeScript check for `deepMixingPhysics.ts` and
  `deepMixingPreset.ts`: **PASS**.
- Direct Vite production client build: **PASS, 3,250 modules transformed**.
- Repository-wide TypeScript check: no source verdict; the process exhausted
  its 4 GB heap. This does not replace the successful isolated typecheck and
  production build and is recorded rather than reported as a pass.

Casimir verification was not required: this gate changed stellar
reduced-order diagnostics, UI wording, theory planning rows, tests, and
documentation without changing warp/GR physics, adapter contracts, constraint
packs, certificates, training traces, or physical-viability authority.

## Authority after closure

G0 unlocks only G1 baseline calibration. It does not admit a transport
candidate, validate any lifetime extension, authorize actuation, or permit
engineering-feasibility language.

