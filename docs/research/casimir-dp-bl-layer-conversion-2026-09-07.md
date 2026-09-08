# B-L layered source/probe conversion

Date: 2026-09-07. Exploratory verification of the composition approximation.

[Chen et al., equation 2](https://arxiv.org/pdf/1410.7267) supply exponential depth weights for the gold/chromium/sapphire probe and the gold-minus-silicon source. At 197.327 nm, use probe coating thicknesses 250 and 10 nm. Replacing density by density times neutron fraction in both kernels gives the charge-to-mass-kernel ratio. Common source overlayer attenuation, patterned-layer thickness, separation, radius and harmonic factors cancel in this ratio within the published geometry approximation.

The positive probe weights are 0.718306, 0.0139198 and 0.267775. Using nominal densities 19.3, 7.19 and 3.98 g/cm3, with silicon 2.33, and illustrative dominant-isotope fractions Au=118/197, Cr=28/52, sapphire=52/102, Si=0.5, the effective probe fraction is 0.592258. The differential source fraction is 0.612575. Their product is C=0.362803, replacing the earlier assumed 0.20.

These nominal material values are modelling inputs, not measured film-density or isotope-composition certificates. As a broad sensitivity box, allow every neutron fraction independently between 0.45 and 0.65. Positivity of the probe weights bounds its fraction directly. The source difference is minimized by low gold fraction and high silicon fraction. This yields C between 0.190143 and 0.440349 at fixed densities. This is a sensitivity box, not a statistical interval. The earlier 0.20 estimate is close to, but not below, this deliberately broad lower corner.

Retaining the prior visual force ceiling of 1e11 gives nominal g_SM <= 1.4200e-13. Across the box the weakest ceiling is 1.9614e-13. Compare with the fixed-product perturbative floor 3.0244e-12: a factor 21.3 nominal and at least 15.4 across this box. Thus resolving the layered composition does not rescue the simple one-eV completion.

The matching Python independently integrates each exponential depth interval and checks agreement with the closed-form probe result to 1e-10 relative tolerance. JSON records outputs. This validates the layer algebra, not the experimental likelihood. Remaining qualifications are the visual force envelope, nominal film inputs, and published finite-geometry approximation; no exact finite-sphere or raw-force reanalysis is claimed. No local coherence forecast or frozen apparatus value is changed.

Decision: retain demotion of this simple perturbative benchmark and move to a new explicit microscopic lead. Do not describe all B-L interactions as excluded. No physical certificate or proof-maturity promotion follows from this check.
