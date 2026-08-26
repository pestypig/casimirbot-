Program gate: G1 — real calibrated solar baseline
Workstream: controlled stellar composition transport
Capability or component: zero-transport solar-age MESA baseline and observational calibration
Current maturity: reduced_order_diagnostic; fixture/import solar scaffolding only
Target maturity: calibrated_baseline
Required frozen inputs: G0 result and preregistration, current StarSim MESA runtime policy, versioned solar reference data, selected MESA release and runtime image
Required evidence: frozen calibration objective and tolerances, real solver logs and hashes, converged solar-age model, observational residual vector, zero fixture fallback
Stop/fail criteria: unavailable solver identity, fixture substitution, unversioned target or tolerance, non-converged calibration, luminosity/structure closure failure, or post-result retuning
Explicit non-goals: composition-transport intervention, lifetime extension, GYRE candidate campaign, actuator or fleet mechanism, NHM2 or warp promotion
Downstream gate unlocked: G2 — conservative transport implementation

# G1 real calibrated solar baseline

This is the sole active packet. G1 must produce one externally executed,
zero-transport, solar-age reference model before any controlled composition
transport is implemented or evaluated.

## Ordered work

1. Inventory the existing MESA import/reproduction adapter and identify the
   exact gap between current `mesa_imported` artifacts and a real solver run.
2. Select and freeze the MESA release/revision, runtime mode, container or WSL
   identity, compiler/toolchain, nuclear network, reaction rates, EOS, opacity,
   atmosphere, diffusion/settling, convection, and resolution policy.
3. Replace placeholder reference URLs with authoritative, versioned calibration
   and uncertainty sources before freezing numerical tolerances.
4. Freeze the joint solar-age calibration objective, covariance/multiple-test
   policy, convergence requirements, and G0 milestone thresholds.
5. Freeze input hashes and a no-fixture-fallback execution policy.
6. Execute the baseline, retaining inlists, logs, histories, profiles, photos,
   runtime identities, exit status, and hashes.
7. Evaluate luminosity, radius, effective temperature, surface Z/X, surface
   helium, convection-zone depth, sound-speed and density residuals, and the
   declared neutrino vector.
8. Stop at the first hard failure. Any revised calibration is a new versioned
   attempt, not an overwrite of the failed receipt.

## Admission rule

G1 closes only if one model:

- was produced by an actual MESA or explicitly approved equivalent execution;
- reaches the frozen solar age under the frozen zero-transport configuration;
- passes the preregistered numerical-convergence and observational vector;
- retains complete input/output/runtime hashes and solver logs; and
- is reproducible enough to serve as the parent baseline for G2.

An imported profile, four-shell fixture, mock worker, successful parser test,
or `stage2_gate_mesa_reproduced` string cannot close G1.

## Terminal decisions

- `PASS_CALIBRATED_BASELINE`: exactly one content-addressed baseline is admitted
  and G2 becomes eligible; or
- `BLOCKED_BASELINE_CALIBRATION`: the first hard solver, provenance,
  convergence, or observational failure is preserved and G2 remains blocked.

