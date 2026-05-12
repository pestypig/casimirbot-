# ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1

## Claim Boundary

This validation sweep can support only a model-internal Stage 1 statement about declared tiny SYK-like runs. It cannot prove real-universe ER=EPR, cannot inventory wormholes, cannot source stress-energy, and cannot validate NHM2, Needle Hull, or warp claims.

## Why One Tiny Run Is Not Enough

A single tiny solver run can be useful telemetry, but it is not enough for a bounded model-internal claim. The validation sweep requires an ensemble of seeded runs, required controls, numerical-method honesty, and QST entropy washout.

## Seed Ensemble

The sweep expands declared seeds, Majorana counts, beta values, and coupling strengths into candidate plans. Each accepted run must carry seed, Hamiltonian hash, raw telemetry hash, and normalized-observable hash.

## Required Control Battery

Every accepted candidate requires:

```text
wrong-sign coupling
no coupling
disentangled state
shuffled Hamiltonian
random-matrix control
spin-chain control
high-entropy washout
```

If any required control leaks above threshold, the aggregate verdict becomes `control_leakage_observed`.

## Numerical Convergence And Method-Label Honesty

The current backend records `matrix_exponential_taylor`. It must not be described as exact diagonalization. If a plan requests `exact_diagonalization`, validation blocks until an actual Hermitian eigensolver path exists.

## Thermalization, Scrambling, And Noncommutativity Guardrails

Small finite models can produce misleading signatures. The sweep therefore records noncommutativity, scrambling, thermalization, and control leakage as guardrails, not as proof of gravity.

## Entropy-Stretch Washout

The QST bridge is monotonic demotion:

```text
visibilityAdjustedSignal(deltaS=0)
  >= visibilityAdjustedSignal(deltaS=1)
  >= visibilityAdjustedSignal(deltaS=2)
```

Nonmonotonic washout blocks validation. This uses the existing QST entropy-stretch bookkeeping and does not redefine Planck's constant.

## Aggregate Verdict Ladder

```text
not_tested
validation_blocked
control_leakage_observed
numerical_convergence_failed
entropy_washout_failed
model_internal_validation_support_observed
```

## Model-Internal Validation Support

Model-internal support requires the declared ensemble pass rate to exceed threshold, all required controls to remain below leakage threshold, numerical labels to be honest, and entropy washout to be monotonic.

## What Still Cannot Be Claimed

The sweep cannot claim real-universe ER bridges, local wormhole density, stellar-core ER nodes, galaxy-rotation explanation, stress-energy sourcing, NHM2 source closure, or warp viability.

## Handoff

If the validation sweep passes, `ER_EPR_MODEL_INTERNAL_CLAIM_REPORT_V1` may produce a bounded claim report. The report must pair any model-internal support sentence with the explicit non-claim boundary.
