# Inclusive scalar-density closure screen

Exploratory research, September 7, 2026. This tests whether collective final states alone can overturn the very small local scalar estimate in the [assembled contact model](casimir-dp-axion-assembled-subsets-2026-09-07.md). The result changes the priority of that material-response question, without completing or excluding the full axion model.

## Explicit scope

Assume a weak Born scalar interaction represented by point-nucleus density operators with constant coefficients, an isolated finite target, rotationally averaged target response, and target transitions with nonnegative energy transfer. Retain the same incident speed distribution, frozen sphere and hold duration. The averaging assumption is material: this is not a directional prediction for a fixed crystal in the halo wind. Negative-energy transitions from thermal excitation, driven apparatus energy, electronic operators, spin interactions and new long-range kernels are outside this calculation.

The scalar contact coefficients are extrapolated as an envelope throughout the integration region. That is an assumption of this screen, not a demonstrated bound on the UV interaction or nucleon form factors at GeV momentum. The largest momentum allowed by the incident particle is about 2.1 GeV. Consequently the result is a bound inside the defined model, not a certified full-material bound.

## Closure argument

For density rho(q)=sum_j c_j exp(i q.r_j), each translation factor is unitary, so the operator norm is at most sum_j |c_j|. Summing over all final target states gives

`sum_f |<f|rho(q)|i>|² = <i|rho†rho|i> <= (sum_j |c_j|)²`.

For the rotationally averaged response, integrate the energy-conserving angular delta function first. Nonnegative target energy implies q<=2 m_chi v; replacing the allowed spectral weight by the full closure sum then bounds the Born cross section by

`sigma <= m_chi² (sum_j |c_j|)² / pi`.

This uses m_chi rather than a nuclear reduced mass and permits maximum constructive coherence at every momentum. It intentionally overestimates the point-density model; a finite sphere cannot ordinarily saturate it throughout this interval. Multiplying by incident flux and hold duration gives N_bound; the absolute coherence exponent obeys D<=2N_bound under the same independent-encounter treatment. This is not a postselected visibility bound.

The use of dynamic target response rather than independent recoil final states is motivated by the established crystal-scattering framework; for example, [Berghaus et al.](https://arxiv.org/abs/2210.06490) distinguish inclusive sum rules from exclusive phonon response. Their light-particle Migdal results are not imported numerically. The conservative norm estimate here is our derivation.

## Numerical implication

The frozen sphere contains about 1.55057e10 carbon nuclei. At portal quartic 0.03, the squared assembled scalar subset gives:

| Scalar quantity | Value |
|---|---:|
| Independent-nucleus exponent upper estimate | 2.16462e-29 |
| Inclusive closure exponent bound in this model | 4.53410e-16 |
| Frozen DP comparator exponent | 0.0295115 |

The bound permits an enhancement of about 2.09e13 over the independent estimate, yet remains about 6.5e13 below the comparator. At quartic 0.1 the central closure bound is 5.04076e-15. None of the four quartics or six speed scenarios scanned approaches the comparator. These are benchmark choices, not an allowed parameter region or confidence statement.

Do not add the closure bound to the independent-nucleus rate: it bounds the inclusive scalar process in place of that approximation. It also does not add a boundary signal; a common multiplicative response still cancels in the four-cell ratio.

The [script](casimir-dp-axion-scalar-closure-bound-2026-09-07.py) authenticates its parent and records [24 rows](casimir-dp-axion-scalar-closure-bound-2026-09-07.json). Numerical checks cover phase samples, aligned-phase saturation, comparison with the independent estimate and the comparator gap. The operator inequality is justified analytically above; random phase samples are not its proof. Root/leaf validation passes.

## Priority consequence

Collective enhancement by itself is not a promising way to recover a percent-level signal in this scalar contact channel. Detailed material response remains necessary for a quantitative small-signal prediction and to address fixed orientation, thermal energy release and operator validity. Research aimed at detectable overlap must instead identify a different momentum kernel, energy/population account or extended interaction profile, subject to the existing flux, force and kinematic screens. Missing UV matching still matters for model admission but should not be described as likely to bridge this gap without a mechanism.
