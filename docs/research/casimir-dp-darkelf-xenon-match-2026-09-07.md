# Shared dark-photon coefficients: diamond and xenon

Exploratory diagnostic; measurable overlap remains unproven. The Python/JSON companions match the executed partial diamond coefficient to a xenon spectrum using the same 100 GeV mass, 10 MeV mediator and proton-reference normalization.

## Normalization clarification

The prior DarkELF constructor uses q0=mchi*(220 km/s)/c=73.3841 MeV. Its reference proton cross section 1e-38 cm^2 therefore corresponds to 3.00877e-35 cm^2 at zero momentum. The previous packet's unspecified reference momentum must not be read as zero. No previous numerical coefficient is changed here; xenon uses exactly this convention and the package's 0.94 GeV proton mass. Reference-momentum dependence cancels from the matched ratio.

For each xenon isotope, use

`d sigma/dE = sigma_p * m_A/(2 mu_p^2 v^2) * Z^2 F_Helm(q)^2 * [(q0^2+mmed^2)/(q^2+mmed^2)]^2`,

with q^2=2 m_A E and elastic endpoint imposed. Isotopes and Helm parameters reuse the earlier recorded xenon inputs, without importing that script's dipole interaction. Exposure is 2.84 tonne-year and a year is 365 days to match the local calculation. The fast population is an unattenuated mono-speed 776 km/s distribution, normalized to 1 particle/cm^3. It is a conditional diagnostic, not the halo or a transport prediction. At these nuclear recoil momenta, the elastic electron cloud is neglected.

## Executed comparison

Per fast particle/cm^3, the raw 200-269.9 keV coefficient is 3.74669e6 events; the raw 5.4-269.9 keV coefficient is 4.11827e11 events. Their ratio is 109918. Thus normalizing this spectrum to one raw high-window event also predicts about 110000 raw full-window events. This is a spectral-shape warning that requires detector folding, not an official LZ exclusion. Energy-window endpoints are bookkeeping limits, not hard detector thresholds; neither coefficient bounds accepted counts in the presence of resolution tails.

The shared coupling cancels in D_partial/N_Xe, leaving a factor n_slow/n_fast:

| Conditional slow temperature | D_partial per raw high-window event at equal density | Density ratio for DP comparator and one raw high-window event |
|---|---:|---:|
| 300 K | 7.63560e-30 | 3.86498e27 |
| 5000 K | 1.88792e-24 | 1.56317e22 |

The DP exponent 0.0295115 is a forecast comparator, not a measured residual or detection threshold. These enormous density ratios are formal requirements for the calculated partial channel only, not necessary conditions for the total response. No terrestrial model has supplied them. In particular, changing coupling alone cannot improve the ratio while retaining these distributions and linear scattering assumptions.

## Verification and remaining work

The script verifies the prior JSON hash, isotope-fraction sum and analytical point-charge propagator integral separately for each isotope. It records a differential xenon spectrum. The preceding diamond grid refinement remains applicable. These checks do not validate Helm-systematic uncertainty, omitted material channels, Earth transport, external constraints or detector response.

Next assess this spectral tension and the supply/attenuation relation before treating a large captured population as a viable bridge. Retain the missing low-q and other-energy diamond responses explicitly; neither the large density ratios nor the raw spectral ratio exclude the complete mechanism. The shared parameter convention is now concrete, but the two populations are still conditional inputs, so this is not yet a joint prediction model.

Reproduce: `C:\Python313\python.exe docs/research/casimir-dp-darkelf-xenon-match-2026-09-07.py`.
