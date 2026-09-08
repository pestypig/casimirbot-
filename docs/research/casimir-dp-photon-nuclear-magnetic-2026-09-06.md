# Photon dipole: matched charge and nuclear magnetic components

September 6, 2026. Conditional two-component prediction; not a full electromagnetic model of the apparatus or an LZ fit. The prior tail packet made substantive progress by bounding the smooth rigid charge component. We now retain it and add nuclear magnetism with the same dark-matter magnetic moment.

## Inputs and common normalization

Use the magnetic term of [Barger, Keung and Marfatia, equations 3–4](https://arxiv.org/pdf/1007.4345). For spin-half dark matter, nuclear spin I, and nuclear moment mu_hat in nuclear magnetons:

\[
\frac{1}{\alpha\mu_\chi^2}\frac{d\sigma_{mag}}{dE_R}
=\frac{I+1}{3I}\widehat\mu_A^2\frac{m_A}{m_p^2v^2}|G_M(q)|^2.
\]

It is added to the previously calculated charge term. The unpolarized leading formula has no free relative coefficient between them. The common alpha mu_chi² and flux cancel in the two-target ratio.

For xenon, use ground-state moments -0.7779607 and +0.6918451 nuclear magnetons from [Makulski's 2015 gas-phase NMR measurement](https://pubmed.ncbi.nlm.nih.gov/25594841/), for xenon-129 and xenon-131 respectively. The [NIST carbon table](https://physics.nist.gov/PhysRefData/Handbook/Tables/carbontable1.htm) supplies carbon-13's +0.70241. These are electromagnetic moments, appropriate to this photon interaction; they are not substitutes for isoscalar spin matrix elements in the earlier contact model. Isomeric-state xenon moments are not used.

**Finite-q form factors are assumptions:** set xenon G_M=G_E=Helm, a simplifying prescription also used in the cited dipole paper, rather than claiming a complete magnetic nuclear-response calculation. Carbon uses the normalized p1/2 oscillator shape (1-2y)exp(-y), with its q=0 amplitude fixed by the measured moment. Fixing that normalization does not authenticate the finite-q shape or its many-body error.

The shared population remains 776-km/s mono-speed. Xenon has natural isotopes, 2.84 tonne-years and unit efficiency. Local inputs retain the frozen mass, separation and hold, representative carbon-13 fraction 0.0107, independent unpolarized carbon nuclei and the smooth neutral charge model with assumed electron rms radius 0.1 nm. No fitted coupling is inserted.

## Conditional results

For carbon oscillator length 1.6 fm:

| DM mass | Predicted raw Xe full/high-window ratio | Upper local two-component D per raw full-window Xe count |
|---|---:|---:|
| 100 GeV | 6123.0 | 8.813e-30 |
| 200 GeV | 5280.6 | 9.506e-30 |
| 1000 GeV | 4766.1 | 1.013e-29 |

The full window is 5.4–270 keV and the high window is 200–270 keV. These are predicted relative yields, not fits assigning one signal count to the observed candidate.

At 1 TeV, the high-window shape integral is 0.400925 from charge and 0.191795 from magnetism. Adding magnetism reduces the previous full/high ratio from approximately 6888 to 4766 under the assumed form factors. Thus the omitted nuclear magnetic term changes the quantitative comparison but does not remove the strong low-energy companion prediction in this benchmark.

For the local magnetic channel, integrate the free-carbon differential cross section and use D_mag<=2N_mag, valid for any orientation of this independent scattering channel. Add the prior rigid charge upper bound for the inherited isotropic benchmark. At 1 TeV their full-window-normalized contributions are respectively 9.494e-30 and 6.318e-31. This is a bound on the sum of these two **modeled components**, not on every electromagnetic interaction in diamond.

## Remaining uncertainty and decision

The tested nuclear magnetic term does not make this a promising explanation for percent-level local coherence loss. However, the high-energy xenon spectrum is sensitive to magnetic form factors; G_M=Helm is not adequate authority for an experimental exclusion. Electronic magnetism/excitation, discrete atomic and crystal scattering, surface charge, medium response, correlations and selected-path survival remain outside this calculation. The halo and detector likelihood also need their own treatment before experimental admission.

The next useful work is a material-response calculation that includes the discrete/inelastic channels, or an independently sourced response that materially changes the model comparison. Further precision on the already tiny rigid or independent-carbon components alone would not resolve those missing channels. Preserve the present null prediction and low-energy companion test in the comparison packet.

Replay: `python docs/research/casimir-dp-photon-nuclear-magnetic-2026-09-06.py`. Four checks pass, including independent normalization equivalence between the source's dimensionful-moment and nuclear-magneton formulas and the carbon point-form-factor limit. JSON contains 24 mass/oscillator/window cases; CSV separates the 1-TeV xenon charge and magnetic shapes. Parent and frozen-config hashes are enforced. Atlas retrieval and root-leaf validation passed. No runtime, adapter, constraint, certificate or hardware changes; the overall goal remains active.
