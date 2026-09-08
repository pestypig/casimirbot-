# Exothermic benchmark: constraint synthesis and decision

Date: 2026-09-07. Exploratory conditional screen. No model admitted.

## Magnetic observable

For a 1 GeV vector with electromagnetic coupling epsilon e, use the one-loop contribution

`delta a_mu = alpha epsilon^2/(2 pi) integral_0^1 dz 2z(1-z)^2 / [(1-z)^2 + z(m_A/m_mu)^2]`.

The adjacent script obtains 7.88656259e-6 per epsilon squared, checks an independent integration variable and the heavy-mass limit. The interaction convention follows the [dark-photon magnetic-moment analysis](https://arxiv.org/html/1902.05075). This does not import that older paper's experimental discrepancy.

The [2025 Theory Initiative v3](https://arxiv.org/abs/2505.21476v3) gives experiment minus its adopted Standard Model prediction as 38(63)e-11. Taking the upper endpoint of a central Gaussian 95% interval gives delta a_mu <= 1.6148e-9, hence epsilon <= 0.0143092. This is our stated statistical screen, not a published joint-model confidence region. It assumes no additional new-physics contribution cancels this positive term and uses that specific Standard Model baseline.

At fixed illustrative xenon product P=f_H alpha_D epsilon^2=1.7e-17, the epsilon screen and an explicitly declared alpha_D cap imply a minimum fraction. Combining this with the earlier all-speed uniform-sphere envelope yields:

| alpha_D cap | Minimum f_H | Conditional rigid-channel D upper |
| --- | ---: | ---: |
| 0.1 | 8.3027e-13 | 4.9554e-10 |
| 1 | 8.3027e-14 | 4.9554e-8 |

These values are envelopes, not attained signals or solved cosmologies. The larger cap is a scope choice, not proof that omitted radiative effects are negligible.

## Resonance-search coverage audit

The inspected DarkCast BaBar_Lees2014xha table has sentinel-valued rows at 0.999 and 1.05 GeV bracketing the benchmark; it supplies no usable interpolated bound there. The LHCb 2019 prompt table likewise brackets 1 GeV with a sentinel row at 0.96 and a finite row at 1.162 GeV. Do not interpolate over this gap. The [LHCb analysis](https://arxiv.org/html/1910.06926) explicitly avoids resonant mass peaks. The [KLOE combined search](https://arxiv.org/abs/1807.02691) covers only through 973 MeV. These observations establish limits of the inspected inputs, not absence of all experimental constraints at 1 GeV.

## Research decision

Demote the source-like exothermic benchmark's direct and calculated additive rigid channels for the measurable-in-both priority. The latter remains below even the hypothetical D=1e-6 target throughout this declared magnetic-screen/coupling domain. That target is not an authenticated sensitivity threshold. Smaller measurable targets cannot be decided without the apparatus sensitivity, and other microscopic material channels are outside the bound.

Do not continue fine-tuning this channel's halo speed or adding nuclear amplitudes as an unexplained enhancement. Reopening it requires a specifically derived additional response, a consistent population/coupling solution outside the screened assumptions, or a demonstrated apparatus sensitivity that makes a smaller prediction relevant. The shared goal remains open; these calculations do not establish dark matter, a gravitational origin, or a boundary-dependent residual.
