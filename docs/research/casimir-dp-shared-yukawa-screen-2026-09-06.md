# Shared Yukawa scattering: first two-target calculation

Date: September 6, 2026 America/New_York. Program gate S1 remains open. Evidence class: exploratory conditional benchmark; no detector fit, physical admission, or baseline retuning.

## Finding

A single finite-range potential now produces a diagnostic xenon spectrum and a low-momentum coherent contribution to the sphere's visibility loss. An apparent overlap near a 10-eV mediator fails a validity check: extrapolating to the DP comparison exponent gives about 1.08 raw xenon events in the chosen band, but a central sphere scattering phase of 104 radians. The Born approximation cannot support that apparent agreement. All eight scanned mediator masses fail the same screen at their comparator-inverted couplings. This rejects those extrapolated predictions, not the underlying interactions.

The [Riedel–Yavin scattering-decoherence paper](https://arxiv.org/pdf/1609.04145), particularly Appendix F, explicitly analyzes breakdown of coherent Born scattering. The following calculations are our own diagnostic implementation.

## Model and units

In natural units, V(r) = −alpha A exp(−m_phi r)/r, with alpha = g_chi g_N/(4 pi), equal proton/neutron couplings and zero electron coupling. Extended sources convolve this potential with their number density. This is a phenomenological scalar-attraction model, not a Higgs identification or UV completion. Separate g_chi and g_N remain necessary for external force and self-interaction constraints.

The shared incident population is an isotropic shell at 776 km/s, mass 1 TeV, density 0.3 GeV/cm³. This is a transparent-environment benchmark, not the Standard Halo Model or either site's measured distribution.

For uniform spherical sources F(x)=3(sin x−x cos x)/x³, with F(0)=1. The Born kernel is

\[
\frac{d\sigma_A}{dq^2}=\frac{4\pi\alpha^2 A^2}{v^2(q^2+m_\phi^2)^2}|F(qR_A)|^2.
\]

The differential cross section has units GeV⁻⁴; conversion uses 1 GeV⁻² = 0.3893793721 × 10⁻²⁷ cm². Xenon uses mean A=131.293, mass A u and a chosen uniform radius 1.2 A^(1/3) fm. This is not the isotope-resolved nuclear response used by [LZ](https://arxiv.org/html/2609.02823v1). The point-source rate exceeds this uniform-source rate by about 1,344 in the selected high-energy band for light mediators, demonstrating why authentic nuclear responses are essential. These two approximations are not a calibrated uncertainty interval.

The xenon output assumes unit efficiency and 2.84 tonne-years; the selected 200–270-keV true-energy band is a diagnostic window, not a likelihood. A second CSV provides the 1–270-keV spectrum.

The sphere retains the frozen mass, radius, separation and 0.25-s hold. Its nucleon charge is mass/u. Only its rigid coherent elastic channel at qR ≤ 80 (q below about 57 eV) is included. This does not include internal excitation, hard constituent collisions or survival/postselection. Constant separation during the hold approximates the actual branch histories.

For isotropic incidence,

\[
D_{soft}=t\Phi\int^{q_{cut}^2}_0dq^2\frac{d\sigma}{dq^2}[1-\operatorname{sinc}(qd)].
\]

The phase averages to zero by symmetry. Define K_D=D_soft/alpha² and K_Xe=lambda_raw/alpha². Their dimensionless ratio includes both actual benchmark exposures. No coupling is fitted and the DP exponent is a theoretical comparator, not measured data.

| Mediator | K_D/K_Xe | Alpha formally giving D=0.0295115 | Central phase there |
|---|---:|---:|---:|
| 0.001 eV | 1,073.54 | 2.4053e-13 | 253.61 |
| 0.1 eV | 313.279 | 4.4526e-13 | 174.84 |
| 1 eV | 31.0373 | 1.4146e-12 | 134.48 |
| 10 eV | 0.0272077 | 4.7779e-11 | 104.10 |
| 1 keV | 3.0161e-10 | 4.5380e-7 | 99.92 |

The last two columns are invalid-extrapolation diagnostics. At the fixed weak reference alpha=1e-20, central phases remain below 1.1e-5 and both effects are very small. Restricting the central phase to 0.1 gives soft exponents between approximately 4.6e-9 and 3.0e-8 across the scan. This operational restriction is not an exact error certificate or universal sensitivity bound.

## Extended-object phase check

The uniform sphere's projected density is 3A sqrt(1−b²/R²)/(2 pi R²). Combining it with the Yukawa line integral gives

\[
|\chi(0)|=\frac{6\alpha A}{v}\int_0^1du\,u\sqrt{1-u^2}K_0(m_\phi R u).
\]

K0 is the modified Bessel function. The short-range limit is 6 alpha A/[v(m_phi R)²], checked independently. A small phase permits expanding exp(i chi); a large one requires retaining the exponential or another suitable scattering solution. The current code evaluates this diagnostic phase, not the resummed amplitude. High kR and small deflection must also be checked for an eikonal solution.

The qR cutoff change from 40 to 80 changes K_D by at most 0.115% in this scan. This is a numerical truncation check inside the specified channel, not evidence that omitted physical channels are negligible. Every mediator mass is nonzero; no divergent massless rate is used.

## Constraints, observable, and next calculation

No point is externally admitted. Ordinary-matter forces, self-interactions, cosmology, site transport and low-energy recoil data still need separate couplings and authenticated conventions. The xenon likelihood, real isotope response and sphere dynamic response remain open.

With unchanged histories and a homogeneous flux this interaction has no Casimir-boundary dependence. It can attenuate primary coherence but cancels from the boundary cross-ratio when its active/reference factors match. A laboratory wind requires the vector coherence filter and can alter phase and time dependence. Rigid elastic scattering preserves internal state by assumption, not by a survival measurement.

The next priority is the same potential beyond Born, recovering these weak-coupling kernels before evaluating the apparent overlap. Long-range tails must remain included: the physical sphere's area is not a universal scattering bound for a long-range force. Authenticated xenon and solid responses follow; LZ O1 and L10 remain separate leads. S1 and the overall goal remain active.

## Replay and verification

Run `python docs/research/casimir-dp-shared-yukawa-screen-2026-09-06.py` from the repository root with SciPy (run used 1.16.1). It writes the same-prefix JSON/CSV and `casimir-dp-shared-yukawa-xe-spectrum-2026-09-06.csv`. The JSON preserves assumptions, config hash, eight checks and invalid-extrapolation flags. All eight checks pass. The independent short-range phase test initially exposed a factor-two error in its expected value; deriving the projected integral corrected that expectation to six, without changing the computed kernels.

Atlas build completed. The work-program identifier was not indexed; why/upstream queries subsequently succeeded for the canonical article. The initial diagnostic file had already been added before that fallback, so its intended pre-edit lookup sequence was not fully satisfied. No runtime physics, adapters, constraints, certificates or canonical candidate were changed; no physical-verification claim is made.
