# Full-phase Yukawa bound and new inelastic leads

Date: September 6, 2026 America/New_York. Gate S1 remains active. Conditional theoretical diagnostic only; no LZ fit, experimental admission or frozen-input change.

## Result

The apparent 10-eV mediator overlap from `casimir-dp-shared-yukawa-screen-2026-09-06.md` does not survive a conservative full-phase elastic bound. At precisely the same coupling, alpha=4.77788534e-11, visibility loss is at most **0.0155452%** within the straight-line eikonal model, rather than the Born extrapolation of about 2.9%. The exponent bound is 1.5546383e-4, versus the comparator 0.0295115, about 190 times smaller. No coupling was refitted.

This is an upper bound, not a predicted rate. It covers the complete rigid elastic eikonal channel without the earlier low-q cutoff, but does not cover internal excitation or a different interaction. A finite potential and small deflection are still assumptions of the eikonal treatment; the result is not an exact quantum-scattering exclusion.

## Derivation retaining the phase

For a real potential, S(b)=exp[i chi(b)] has unit modulus. In the impact-parameter eikonal approximation,

\[
\sigma_{el}=\int d^2b\,|1-S(b)|^2,
\qquad |1-e^{i\chi}|^2\le\min(4,\chi^2).
\]

This uses the full exponential instead of extending its first-order expansion into strong phase. Impact-parameter scattering is standard; see the [eikonal treatment in this nuclear-scattering review](https://faculty.tamuc.edu/cbertulani/cab/papers/1910.14094.pdf). [Riedel and Yavin, Appendix F](https://arxiv.org/pdf/1609.04145) discuss coherent Born breakdown specifically for dark-matter decoherence.

The following bound is derived here for the same uniform Yukawa sphere. Write a=m_phi R and H(a)=3(a cosh a−sinh a)/a³. Outside the sphere, its exact Yukawa potential equals the point-source potential multiplied by H(a). Consequently, for b≥R the straight-line phase is

\[
\chi(b)=\frac{2\alpha A H(a)}v K_0(m_\phi b).
\]

Bound the interior by four times its area, while keeping the external Yukawa tail:

\[
\sigma_{el}\le 4\pi R^2+2\pi\int_R^\infty b\,db\,
\min\{4,\chi(b)^2\},\qquad
D\le2\Phi t\sigma_{el}.
\]

The last inequality follows from 1−cos(q·d)≤2. It is deliberately loose and independent of branch orientation. No physical-sphere-area bound is imposed on the exterior. The interior bound remains nonzero even at zero coupling, so this envelope is unsuitable for weak-limit recovery or predicting small signals.

The exterior integral is split where chi=2. Its omitted numerical tail is bounded analytically using K0(y)≤sqrt[pi/(2y)] exp(−y). Exponentially scaled functions avoid overflow in H and underflow in K0. Extending the numerical tail changes the result by less than 1e-9 relatively.

## Same-coupling results

Each coupling is inherited from the earlier, invalid Born inversion to the DP comparator; these are diagnostic test points, not fitted parameters.

| Mediator | Exponent upper bound | Consequence at this coupling |
|---|---:|---|
| 0.001 eV | 522.16 | Bound uninformative about percent-level loss |
| 0.01 eV | 5.89459 | Bound uninformative |
| 0.1 eV | 0.072305 | Does not decide the DP-comparator comparison |
| 1 eV | 0.00129123 | Below comparator; loss ≤0.12904% |
| 10 eV | 0.000155464 | Below comparator; loss ≤0.0155452% |

For these points kR=3.6244e9 and the central potential/incident kinetic-energy ratio is below 3.6e-8. These support the high-momentum, weak-deflection regime despite large accumulated phase; they are not a certified error estimate. All targets, exposure, incident speed/density and coupling conventions remain those of the parent packet. Large bounds for long-range interactions must not be interpreted as predictions of large decoherence.

## Newly authenticated model lead

[Di Mauro, arXiv:2609.02608v2](https://arxiv.org/html/2609.02608v2), revised September 3, proposes a pseudo-Dirac off-diagonal vector benchmark with mass near 1 TeV, splitting near 297 keV and nucleon cross section near 6.5e-43 cm². It relates scattering strength to a simplified relic-abundance calculation. It also discusses a 1.1-TeV Higgsino at about 377-keV splitting, but flags solar-capture constraints. Its analysis is a recoil-level public-information recast, not the official event likelihood. Those constraints and normalization need independent audit before adoption.

Our own free-nucleus kinematics, using the same mean Xe mass as previous packets, give:

| Benchmark | Minimum speed for 248-keV Xe recoil | Carbon maximum splitting at 776 km/s |
|---|---:|---:|
| 1 TeV / 297 keV | 700.303 km/s | 37.0327 keV |
| 1.1 TeV / 377 keV | 794.325 km/s | 37.0700 keV |

Both direct endothermic free-carbon channels are closed in this benchmark. The Higgsino point also requires speeds above the previous 776-km/s cap, so it cannot be imported without changing and explicitly auditing the incident distribution. Isotopes, seasonal velocities and halo uncertainties matter. A closed tree-level upscatter does not imply all local decoherence vanishes: loop-induced elastic terms, excited-state fractions and solid response need calculation within the same complete model.

The next useful work is therefore twofold: evaluate the longer-range Yukawa cases with the actual coherence filter beyond Born, and audit the pseudo-Dirac model's operator, normalization and surviving local channels. The inelastic model has a more specific spectral rationale than tuning the simple elastic example to one high-energy count.

## Replay and verification

Run `python docs/research/casimir-dp-yukawa-eikonal-bound-2026-09-06.py` from the canonical repository root with SciPy. The adjacent JSON records six passing checks, source/config hashes, approximation assumptions, bounds and new-lead kinematics. Checks cover the tail extension, phase envelope, small-a charge limit, large kR, small potential and the 10-eV comparator decision. They do not authenticate a detector likelihood or certify physical viability.

Atlas build, canonical-article why and upstream trace completed before additions. Frozen configuration hash matches the parent. This packet changes only offline research diagnostics and documentation; no runtime physics, adapter, constraint, certificate or maturity authority changes. The overall goal and S1 remain open.
