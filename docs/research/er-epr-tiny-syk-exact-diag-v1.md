# ER_EPR_TINY_SYK_EXACT_DIAG_V1

## Claim Boundary

`ER_EPR_TINY_SYK_EXACT_DIAG_V1` is a Stage 1 model-internal toy solver lane. It can emit raw ER=EPR-like telemetry for a declared tiny two-sided SYK-like backend, then route that telemetry through `ER_EPR_STAGE1_SOLVER_ADAPTER_V1`.

This solver can only support a model-internal Stage 1 statement about a declared tiny SYK-like backend. It cannot prove real-universe ER=EPR, cannot inventory wormholes, cannot source stress-energy, and cannot validate NHM2, Needle Hull, or warp claims.

## Why Tiny SYK Is Used

SYK is useful here because the SYK literature gives a controlled quantum-mechanical toy setting with random many-body interactions, low-energy holographic motivation, and two- and four-point diagnostic structure. The implementation here is intentionally small and deterministic. It is not a bulk gravity solver and does not claim external reproduction.

## Relation To ER=EPR Literature

Maldacena and Susskind motivate ER=EPR through entangled black-hole states. That context is not a license to infer ER bridges from stellar maps, galaxy maps, or arbitrary entanglement. The repo therefore treats ER=EPR as a controlled toy-dual simulation lane only.

## Relation To Double-Trace Traversability

Gao, Jafferis, and Wall motivate two-boundary interactions as a way to make an ER bridge traversable in a specific holographic setting. The tiny solver mirrors that structure as a declared double-trace-like toy coupling:

```text
H_total = H_L + H_R + H_int(t)
H_int(t) = i mu(t) sum_j chi^L_j chi^R_j
```

The coupling sign and timing define candidate, wrong-sign, and no-coupling controls.

## Relation To SYK Teleportation Protocols

The Gao-Jafferis SYK teleportation protocol is the direct conceptual target. The repo does not claim to reproduce the full protocol at this stage. It records toy telemetry with hashes, controls, and caveats so later solver improvements can be audited.

## Majorana Operator Construction

The implementation constructs a Clifford representation with the convention:

```text
{ gamma_i, gamma_j } = 2 delta_ij
chi_i = gamma_i / sqrt(2)
```

The tests verify Hermiticity, anticommutation, dimensions, and normalization metadata.

## Hamiltonian And Coupling Definition

The side Hamiltonians use seeded q=4 SYK-like random couplings:

```text
H_SYK = - sum_{i<j<k<l} J_ijkl chi_i chi_j chi_k chi_l
```

The two-sided model adds a declared interaction:

```text
H_int = i mu sum_j chi^L_j chi^R_j
```

All solver-simulated telemetry must include seed and Hamiltonian hash.

## Raw Telemetry

The solver emits raw telemetry before interpretation:

```text
teleportationFidelityRaw
leftRightMutualInformation
entanglementEntropy_nats
twoPointCorrelator
outOfTimeOrderCorrelator
operatorSizeCurve
timeDelayEstimate
causalOrderingPass
```

The existing solver adapter normalizes these values for the Stage 1 evaluator.

## Control Suite

Required controls include wrong-sign coupling, no coupling, disentangled state, shuffled Hamiltonian, random-matrix, and spin-chain labels. Any control leakage above the declared threshold demotes the support verdict.

## Entropy-Stretch Washout

QST entropy stretch remains delegated to `shared/quantum-spacetime-congruence.ts`. The solver does not redefine QST. It treats:

```text
lambda_S = exp(deltaS_eff)
quantumVisibility = 1 / lambda_S
```

as a visibility and demotion rule, not as a physical change in Planck's constant.

## Small-Model Critique Guardrails

The 2025 critique of small commuting model experiments motivates explicit guardrails: noncommutativity, thermalization, scrambling, control leakage, and safe-language checks. This implementation records those diagnostics as small-model guardrails rather than standalone proof.

## Safe-Language Policy

Generated reports must say model-internal, tiny SYK-like, solver-simulated, and proxy-only. They must not say that ER=EPR is proved, a physical wormhole was found, NHM2 propulsion is supported, stress-energy is sourced, or CL0-CL4 promotion occurred.

## Model-Internal Support

A future bounded support statement requires:

```text
- non-fixture solver telemetry,
- seed and Hamiltonian hash,
- correct-sign candidate signal,
- required controls below leakage threshold,
- causal ordering and delay checks,
- size/scrambling/thermalization diagnostics,
- entropy-area proxy tracking,
- entropy-stretch washout demotion,
- safe-language validation.
```

## What This Still Cannot Claim

This lane cannot claim real-universe ER bridges, local wormhole density, stellar-core ER nodes, galaxy-rotation explanation, stress-energy sourcing, NHM2 source closure, or warp viability.

## Next Step

The next step is a model-internal claim report that collects raw telemetry, controls, entropy sweep, hashes, citations, and safe language into a single bounded artifact.
