# Xenon-normalized Yukawa force screen

## Result

The existing phenomenological Yukawa kernel does not support a common measurable xenon/Casimir-DP claim under its simplest universal-scalar interpretation. First normalize its Born recoil kernel to one *raw* count in the repository's 200-270 keV true-energy diagnostic window. This requires `alpha_mix = 4.59e-11` near a 0.1 eV mediator (range `1.97 um`). If the same scalar couples universally and equally to nucleons, then `alpha_mix^2 = alpha_chi * alpha_N`. Imposing the deliberately generous perturbative ceiling `alpha_chi <= 1` gives `alpha_N >= 2.10e-21`, or a Yukawa strength at least `3.62e17` times gravity.

Figure 2 of Klimchitskaya and Mostepanenko's differential-Casimir reanalysis places its `new` curve around `1e8-1e10` at a range near 2 um. This is a conservative visual read from the plotted curve, not tabulated data or a formal recast. Even using the loose `1e10` end leaves an illustrative force excess of at least `3.6e7`. The primary source reports the underlying force comparison over separations `0.2-8 um` and says the differential measurement strengthens earlier Yukawa bounds; see [arXiv:2109.06534](https://arxiv.org/abs/2109.06534). Thus this minimal unscreened universal-coupling branch is strongly disfavored before the exact Casimir-DP integral.

## What this says about the previous match

The earlier Yukawa packet inverted its coupling to reproduce a frozen DP comparator. For mediator masses through 1 eV, those couplings predicted fewer than `0.001` raw counts in the diagnostic xenon window; they never jointly normalized both observables. The xenon-normalized Born quadratic DP exponents in the same packet are large for longer ranges (about 313 at 0.1 eV), but those are not valid exact coherence predictions at the corresponding strong eikonal phase. No xenon-normalized full-phase result is claimed here.

The xenon window itself assumes unit efficiency and a monochromatic 1 TeV isotropic population. It is not the LZ observed event spectrum, background model, or profile likelihood. The comparison is a mechanism screen, not a fit to LZ data.

## Next useful branch

Do not spend the next calculation on a high-phase eikonal integral for this already-disfavored minimal force mapping. The useful next step is to locate an explicit model ingredient that evades this particular relation: e.g. screened or nonuniversal nucleon couplings, a symmetry-protected mediator with a separately derived matter-force potential, or an inelastic interaction that changes the force/scattering map. Freeze such a Lagrangian first, then recompute xenon recoil with an actual detector response and use the same couplings in a numerically converged visibility calculation. Only a surviving candidate should be joined to the light boson-star population, relic abundance, and gamma-ray constraints. The boson-star field remains a distinct ultralight component unless the model explicitly demonstrates otherwise.

## Reproduction and claim limits

Run:

```powershell
python docs/research/casimir-dp-yukawa-xenon-normalization-force-screen-2026-09-25.py
```

The companion JSON records input hashes, the one-count coupling, force mapping, figure-read range, and checks. It is conditional on equal-sign universal nucleon coupling and `alpha_chi <= 1`; it does not exclude screened, nonuniversal, multi-mediator, nonperturbative, or inelastic theories. It establishes neither dark matter nor a boson-star population, and it does not establish a shared experimental prediction.
