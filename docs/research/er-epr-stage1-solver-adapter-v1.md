# ER=EPR Stage 1 Solver Adapter V1

## Claim boundary

`ER_EPR_STAGE1_SOLVER_ADAPTER_V1` prepares the ER=EPR Stage 1 lane to consume raw telemetry from declared toy-dual backends. It does not implement a full SYK, JT, or tensor-network solver by itself.

Allowed claim:

```text
Raw telemetry from a declared toy-dual backend was normalized and evaluated as model-internal ER=EPR Stage 1 evidence.
```

Disallowed claims:

```text
real-universe wormholes
wormhole inventory
NHM2 propulsion evidence
stress-energy source
CL0-CL4 support
```

## Raw observables before interpretation

Raw solver telemetry is represented by `er-epr-raw-solver-observables.v1`. It records backend family, state preparation, coupling, Hamiltonian hash, seed, raw fidelity values, correlator arrays, operator-size curve, time-delay estimate, causal-order status, and provenance.

## Supported backend declarations

The adapter recognizes:

```text
two_sided_syk_tiny_exact_diag
two_sided_sparse_syk_import
jt_gravity_fixture_import
tensor_network_ads_toy
random_matrix_control
spin_chain_control
```

Backends are declarations. They do not prove a gravitational dual unless the downstream evaluator, controls, and evidence gates pass.

## Normalization

`normalizeErEprRawObservables` converts raw telemetry into the existing `ErEprSimulationInput.observables` contract. It computes bounded scores for teleportation fidelity, causal ordering, time delay, operator-size growth, scrambling, thermalization, entropy-area proxy tracking, and control leakage.

## Provenance rules

`solver_simulated` requires:

```text
hamiltonianHash
seed
teleportationFidelityRaw
```

Fixture-only inputs remain fixture-only. Externally reproduced inputs require at least a Hamiltonian hash and should later be extended with independent reproduction artifacts.

## QST entropy-stretch relation

QST entropy stretch remains a visibility/demotion rule:

```text
lambda = exp(deltaS)
hbarEffectiveRatio = 1 / lambda
```

This is bookkeeping and does not change Planck's constant.

## ER=EPR and StarSim boundaries

The solver adapter is a QST sidecar lane. It does not inherit claims from StarSim, the Observable Universe Accordion, NHM2, or Needle Hull. StarSim and Accordion outputs remain astrophysical null context. Direct ER=EPR support remains restricted to controlled toy-dual solver telemetry evaluated under the Stage 1 gates.

## Future work

The next physics patch is `ER_EPR_TINY_SYK_EXACT_DIAG_V1`, which should generate raw telemetry directly from a small deterministic exact-diagonalization backend rather than relying on solver-shaped raw fixtures.
