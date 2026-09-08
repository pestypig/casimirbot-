# Shared baryon/electric-charge target response and isospin ceiling

Exploratory conditional target calculation. Previous turn made progress by deriving kinetic-mixing suppression of the neutrino partial width. This packet carries the same electron mixing into nuclear scattering and tests whether isospin cancellation can materially improve the bridge to local coherence. No frozen inputs are retuned.

## Common interaction

Use Cb Jdark (Jbaryon+r Jem). At zero momentum Cp=Cb(1+r), Cn=Cb, Ce=-Cb r, so the coherent nuclear amplitude is Cb(A+r Z). This follows conserved baryon and electric charges; [Ilten et al.](https://arxiv.org/abs/1801.04847) discuss the baryonic-vector/photon-mixing setting. Our isotope convolution is a separate calculation. The reference cross section 1e-45 cm^2 normalizes Cb; the physical proton cross section becomes (1+r)^2 times that value. It must not be relabeled as unchanged sigma_p.

For each isotope we recompute its archived rate weight w using the frozen exothermic gap, halo, exposure and Helm model (carbon uses the independent-nucleus F=1 bound). Its new contribution is w(1+r Z/A)^2. At r=+alpha/(4 pi), the raw xenon count increases approximately 0.0478%, carbon by 0.0580%. After a common normalization adjustment to restore the raw xenon count, carbon increases only approximately 0.0102%. The negative sign produces the corresponding small decrease. This is a consistent leading-charge correction, not full momentum-dependent electroweak or hadronic matching.

## More permissive all-ratio test

Define response matrices X=sum_Xe w vv^T and C=sum_C w vv^T, v=(1,Z/A). The largest generalized eigenvalue of (C/C00, X/X00) gives the maximum enhancement of carbon relative to xenon over every real mixing ratio, including the pure-electric-charge limit. Xenon’s multiple isotope weights make X positive definite in these benchmarks: tuning a single nuclear cancellation cannot cancel them all. Real matrices also bound arbitrary complex constant coefficients by the same generalized Rayleigh quotient.

| Dark mass (GeV) | Maximum relative carbon/Xe enhancement | Extremizing Cmix/Cb | Maximum local D at reference raw Xe |
|---|---|---|---|
| 10 | 190.433 | -2.42983 | 2.56033e-22 |
| 15 | 187.872 | -2.43071 | 1.76790e-22 |
| 40 | 182.244 | -2.43300 | 6.34476e-23 |
| 100 | 179.084 | -2.43463 | 2.22535e-23 |

D is the independent-scattering decoherence-exponent upper bound 2N, not a measured visibility loss. Even this permissive maximum is over 20 orders below the frozen forecast D=0.0295115 (about 2.9% loss). The bound maximizes over ratios without requiring cosmological survival, perturbativity or external limits. Imposing those requirements cannot enlarge this constant-charge response maximum at the same raw xenon normalization. It does not justify the extremizing ratios as viable kinetic-mixing models.

This rules out isospin tuning as a route to percent-scale local coherence loss for these four benchmark masses, gaps and target approximations. It does NOT exclude every dark-matter mechanism. Momentum-dependent couplings, other operators, nuclear final states, correlated solid response, or a changed incident population require their own calculation. Four-cell cancellation also remains relevant. The Xe window is the archived raw truth-energy integral, not an accepted-event likelihood; no experimental confidence limit is inferred. Rescaling to another raw Xe target multiplies the local ceiling by the same factor.

## Reproducibility and next decision

The companion Python authenticates the original script and JSON, imports definitions without its output driver, and reconstructs both isotope sums. Zero-mixing rates agree with archived references within the existing numerical precision. Positive definiteness and generalized-eigenvector residuals are checked, and independent scalar optimization agrees with the eigenvalue maximum within 1e-7 relative tolerance. `npm run validate:physics:root-leaf` checks research documentation separately. No GR/runtime/certificate surfaces changed.

The next useful lead must alter the momentum or target response substantially, rather than merely tune the constant proton/neutron ratio. Completing the mediator and abundance calculation remains necessary for an honest conditional xenon model, but cannot by itself supply the missing local coherence magnitude within this bounded class.
