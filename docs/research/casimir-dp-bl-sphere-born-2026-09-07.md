# B-L sphere signal and Born-validity diagnostic

Exploratory finite-sphere model, 2026-09-07. The large Born exponents below are not accepted physical predictions.

Use a uniform sphere carrying the neutral C12 B-L charge Q=6 times atom count, approximately 9.31175e10. Its coherent form factor is 3 j1(qR)/(qR). Integrate the squared summed mediator amplitude with that form factor and 1-sinc(qd), using the frozen mass, radius, separation, hold, source and freshly normalized B-L products. The continuum integral is restricted to q<=qBZ.

| Light mediator, heavy fixed at 1 GeV | Formal Born exponent | Central accumulated phase magnitude | Central potential / incident energy |
|---|---:|---:|---:|
| 0.01 eV | 0.597808 | 308.441 | 2.52e-7 |
| 1 eV | 0.0268364 | 40.5536 | 1.06e-7 |
| 1 keV | 2.60876e-13 | 9.39e-5 | 2.59e-13 |

The first two formal exponents approach or exceed the comparator, but their phases are far outside a small-phase Born expansion. These entries cannot be presented as a measurable shared-model solution. The 1-keV row passes only the stated small-phase diagnostic; that is not a universal scattering validity certificate.

For a uniform sphere, integrate the Yukawa potential along a straight central trajectory. For each mediator, with a=m_i R/(hbar c), the magnitude convention used for its signed phase integral is

    chi_i(0) = 6 alpha_i Q/v integral_0^1 s sqrt(1-s²) K0(a s) ds.

The conventional eikonal phase may carry the opposite overall sign. Products are summed before interpreting the phase. The central potential is 3 alpha_i Q hbarc/R times [1-(1+a) exp(-a)]/a². These quantities are diagnostics derived from the same uniform charge density, not point-charge approximations. Momentum kR is approximately 3.6244e8. The small potential/kinetic-energy ratio and large kR motivate testing straight-line eikonal scattering even though the accumulated phase is large.

Doubling the momentum-grid count leaves the numerical Born integral stable within 1e-3 relative; this numerical stability does not fix approximation failure. The script also records the input B-L receipt hash and asserts the frozen apparatus hash. The optical scattering phase and potential are not additional fitted parameters.

Next retain exp(i chi(b)) rather than expanding it, compute the branch-sensitive decoherence cross section, and recover the Born result when products are scaled down. Check impact-parameter tails and angular averaging. Only then compare a phase-resummed signal to the comparator. External constraints and the separate dark/Standard Model couplings remain mandatory before claiming an allowed point. The incoming source is still assumed, not transported through Earth or apparatus.

    python docs/research/casimir-dp-bl-sphere-born-2026-09-07.py

Research-only calculation and documentation; no Casimir server verification applies.
