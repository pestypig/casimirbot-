# Long-range scattering: full-phase coherence and force constraints

Date: September 6, 2026 America/New_York. Exploratory shared-model comparison. Frozen apparatus and tested coupling products unchanged; no experimentally admitted model or LZ fit.

## Finding

The full eikonal calculation resolves the previously undecided long-range cases. At the old comparator-inverted couplings, the two lightest mediators still give percent-level visibility loss mathematically. However, their minimal unscreened scalar realization fails existing ordinary-matter force constraints if the dark-matter coupling is perturbative. The shorter-range cases lose most of the apparent Born enhancement.

| Mediator | Full-phase exponent D | Visibility loss | Full D / prior Born D |
|---|---:|---:|---:|
| 0.001 eV | 0.0182589 | 1.80932% | 0.618705 |
| 0.01 eV | 0.0112184 | 1.11557% | 0.380137 |
| 0.1 eV | 0.00235485 | 0.235207% | 0.0797943 |
| 1 eV | 0.000168016 | 0.0168002% | 0.00569326 |
| 10 eV | 0.0000285541 | 0.00285537% | 0.000967560 |

The earlier Born values were all about D=0.0295115 by construction. No value in this table was fitted to a measured local residual. The xenon calculation at these couplings remains the earlier diagnostic spectrum, not an accepted-event inference.

## Why a large phase was not sufficient to decide coherence

The earlier audit correctly rejected a small-phase expansion where the phase itself was large. Nevertheless, decoherence depends on a difference of phases. Nearly common phases on two paths can cancel. We now keep the exponential and compute that difference rather than using the total elastic cross section as a proxy.

For an incident direction making angle theta with branch separation d, the transverse displacement is s=d sin(theta). In the small-angle eikonal approximation, the real decoherence kernel is

\[
D=t\Phi\left\langle\int d^2b\,
\left[1-\cos\{\chi(b)-\chi(|\mathbf b-\mathbf s|)\}\right]\right\rangle_{\theta}.
\]

This follows from the overlap of the two impact-parameter S matrices, S=exp(i chi), or equivalently from Parseval's identity applied to the scattering amplitudes and the transverse translation filter. The factor is one minus cosine, not twice that expression. Expanding it to half the squared phase difference must reproduce the independently calculated Born coherence kernel. We test that explicitly.

The scattering-to-decoherence framework and need to check Born validity are discussed by [Riedel and Yavin](https://arxiv.org/pdf/1609.04145). The impact-parameter implementation and numerical comparison here are our calculations, not values imported from that paper.

For the uniform Yukawa sphere, with x=b/R and a=m_phi R, the phase per coupling product inside the sphere is

\[
\frac{\chi(x)}\alpha=\frac{6A}{v}\left[
K_0(ax)\int_0^x du\,u\sqrt{1-u^2}I_0(au)
+I_0(ax)\int_x^1du\,u\sqrt{1-u^2}K_0(au)\right].
\]

Outside the sphere it is 2A H(a) K0(ax)/v, with H(a)=3(a cosh a−sinh a)/a³. The interior expression follows by angular averaging the projected-density convolution. It has a finite central limit and matches the exterior at x=1. The calculation averages uniformly over isotropic incident directions and azimuth, using the same 1-TeV, 776-km/s population and density as the earlier benchmark.

This is still a rigid-target, straight-line eikonal model. It neglects longitudinal momentum transfer, internal excitations, environmental transport and other apparatus material. The previous large-kR/small-potential checks support the approximation but do not certify its physical error. Isotropy makes the ensemble phase shift vanish; the complex phase of an anisotropic wind needs its own calculation.

## Numerical validation

The quadratic phase-difference kernel agrees with the independent momentum-space Born result to better than 3.5e-6 relatively across these points. Doubling radial, azimuthal and incident-angle sampling changes the full exponent by at most 0.046%. Extending the distant integration limit is stable within the stated check; weak-phase recovery, zero separation and boundary continuity also pass. A separate doubling of profile quadrature order and interpolation nodes changes sampled profiles by less than 1e-5 of the maximum profile magnitude.

The elementary inequality 1−cos(x)≤x²/2 ensures the full-phase result cannot exceed its quadratic counterpart at fixed coupling within this model. This is a property of the phase-overlap calculation, not a universal statement about nonperturbative scattering.

## Ordinary-matter force admission

The potential previously specified alpha=g_chi g_N/(4 pi). For one unscreened scalar with universal same-sign nucleon coupling, define alpha_chi=g_chi²/(4 pi) and alpha_N=g_N²/(4 pi). Then alpha²=alpha_chi alpha_N. Adopting alpha_chi≤1 as the perturbative-domain criterion gives alpha_N≥alpha².

Writing the matter-matter force relative to Newtonian gravity as a_Y, the approximate nucleon-number-to-mass mapping gives

\[
a_Y=\frac{\alpha_N}{\alpha_G}\ge\frac{\alpha^2}{\alpha_G},
\qquad\alpha_G=\frac{G u^2}{\hbar c}=5.82113\times10^{-39}.
\]

This is a coupling-product constraint: reducing the ordinary-matter coupling cannot help indefinitely while preserving the tested scattering strength and perturbative dark-matter coupling.

| Mediator range | Minimum a_Y at tested coupling | Conservative screening ceiling | Excess factor |
|---|---:|---:|---:|
| 197.327 micrometres | 9.94e12 | 1 | 9.94e12 |
| 19.7327 micrometres | 1.54e13 | 1e7 | 1.54e6 |

The first ceiling conservatively uses the [Lee et al. torsion-balance result](https://arxiv.org/abs/2002.11761), which excludes gravitational-strength Yukawa interactions with ranges above 38.6 micrometres. The second deliberately loosens the approximately million-times-gravity sensitivity above 10 micrometres summarized by [Venugopalan et al., v2](https://arxiv.org/abs/2412.13167v2) to ten million. We do not reconstruct a new exclusion curve or confidence interval from those summaries.

At those conservative force ceilings and alpha_chi=1, the corresponding quadratic coherence diagnostics are about 2.97e-15 and 1.91e-8, respectively. Both are far below a percent-level exponent. Composition corrections at the nucleon-number-to-mass mapping level cannot bridge the quoted margins.

This rejects the two tested percent-level cases **within the minimal unscreened perturbative scalar realization**. It does not exclude screened or multiple-mediator theories, tuned cancellations, nonperturbative dark sectors, or other operator structures. Any such extension changes the model and must rederive both targets and the matter-force response; it cannot inherit this benchmark's predicted signal without further work. Shorter-range force limits have not been evaluated in this packet.

## Reproducibility and next decision

Run `casimir-dp-yukawa-full-phase-2026-09-06.py` and then `casimir-dp-yukawa-force-screen-2026-09-06.py`, both under `docs/research`, from the canonical root with NumPy/SciPy. The adjacent JSONs preserve parent/config hashes, seven full-phase checks, three force-screen checks and explicit assumptions. The parent numerical packets remain unchanged.

Atlas build/why/upstream trace completed before additions. No runtime physics, adapters, constraints, certificate semantics or frozen apparatus inputs changed. No physical-admissibility certificate is claimed.

The long-range scalar lead is now less promising for a detectable shared cause: its largest local signals fail a concrete external constraint, while the electroweak lead currently predicts a local null in its direct channel. Next prioritize a fully specified operator with independently matched elastic terms and complete its detector/solid-response comparison, rather than adding an unmotivated escape from the force limits. S1 and the overall goal remain active.
