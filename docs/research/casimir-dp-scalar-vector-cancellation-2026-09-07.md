# Scalar–vector force cancellation: retained signal and precision requirements

Program gate: S1. New exploratory interaction class; no physical admission or experimental recast.

## Explicit static toy interaction

Take an attractive scalar and a repulsive vector between identical ordinary sources, with linear real couplings gS and gV. Their potential is [-gS² exp(-mS r)+gV² exp(-mV r)]/(4 pi r). At equal masses and |gS|=|gV| it vanishes in this ideal static channel. This is distinct from adding only scalars, whose identical-source contributions all attract.

For a stable Dirac dark particle, the corresponding static dark/ordinary potential contains -yChi gS+gChiV gV. With matched ordinary couplings and equal masses, its magnitude relative to scalar-only exchange is |1-gChiV/yChi| in the chosen charge convention. A dark particle neutral under the new vector retains the scalar signal; identical dark scalar/vector ratios cancel it; opposite ratios double it. These are leading static amplitudes, not full spin/velocity-dependent Xe spectra. Antiparticle populations also change the vector contribution and need specification.

Thus ordinary-force cancellation does not algebraically require cancellation of dark scattering. It also does not establish a gauge-consistent or allowed model. Visible vector charges require a consistent conserved current, anomaly treatment where applicable, and matching to composite sources.

## Precision transported from the existing screen

Let epsilon be the inherited ordinary-force ceiling divided by the individual scalar force at the old percent-level Yukawa benchmark. The earlier force-screen JSON gives:

| Mediator mass | Residual fraction epsilon | Approximate coupling matching | Approximate mass matching at r=range |
|---|---:|---:|---:|
| 0.001 eV | 1.00614e-13 | 5.03072e-14 | 2.01229e-13 |
| 0.01 eV | 6.47985e-7 | 3.23992e-7 | 1.29597e-6 |

Coupling matching means |delta g/g| roughly below epsilon/2 with masses fixed. Mass matching means |delta m/m| roughly below 2 epsilon with couplings fixed at r=1/m. The force radial function is f(x)=(1+x)exp(-x); d ln f/d ln m=-x²/(1+x), giving -1/2 at x=1. These are linearized tolerance diagnostics. They are not a two-mediator force likelihood, a bound across all geometries, or evidence that tuning achieves physical viability.

For a relative mass mismatch 1e-6, matching the force exactly at one range leaves fractional residuals -3.33333e-7 at half that distance and +8.33333e-7 at twice it. A cancellation calibrated at a single separation is therefore not sufficient. The code evaluates the exact force ratios using expm1 for numerical stability.

## Composition and radiation tests

For cancellation between every pair of materials A,B at equal range, their charge vectors must obey qV(A)qV(B)=qS(A)qS(B). Nonzero charges therefore require a common proportionality, qV(A)=+qS(A) for all A or the common negative choice, after normalization. Matching one test material does not prove this condition. A scalar charge containing nuclear binding response and an additive conserved vector charge need not be proportional; the previous mixed-nucleus packet already shows why mass and nucleon count cannot be interchanged at arbitrary precision.

Vacuum emission of a scalar and emission of a vector are distinct final states. Their inclusive probabilities do not cancel simply because their static forces have opposite signs. Consequently a force cancellation does not remove stellar production constraints. Medium-induced mixing and transport require their own amplitudes and cannot be inferred from this static potential. Different spin, thermal response and radiative mass corrections also mean equality must be protected or explicitly maintained by the model; no stability assumption is granted here.

## Decision

This is an algebraically possible escape from the scalar-only force argument, but not yet a viable measurable-both candidate. The next useful evidence is a concrete scalar/vector symmetry or matching construction that maintains the required mass and composition relations while retaining nonzero dark scattering, followed by its stellar and detector predictions. An unconstrained pair of tuned mediator masses is not enough. Do not inherit the old percent-level coherence or Xe normalization before rebuilding both amplitudes and transport.

The companion script authenticates the inherited screen, computes tolerance diagnostics and checks the single-distance match. These are numerical checks of the stated toy relations, not experimental validation. The frozen apparatus and all runtime, GR and certificate surfaces remain unchanged.

- `py` SHA256: `6745a981ff98e6f71c85beab804d9cf27300f50caf0dd6fb816e9fa6c278047c`
- `json` SHA256: `44f0e922124ee6e0fbdeb3240c9cd0cc8fa511bcf9ed54cc95a830d0545090b9`
