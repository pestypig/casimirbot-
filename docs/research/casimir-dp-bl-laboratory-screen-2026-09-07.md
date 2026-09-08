# B-L light candidate: conservative laboratory force screen

Date: 2026-09-07. Exploratory research; no measured local residual or shared detection.

## Result and scope

Demote the simple unscreened 0.01 eV vector candidate with the frozen scattering products. It cannot simultaneously satisfy the conservative laboratory force screen below and the chosen dark perturbativity criterion g_dark^2/(4 pi) <= 1. The earlier 16.90% local contrast forecast remains a conditional mathematical calculation, not a viable model prediction. This conclusion is restricted to this completion, population and normalization; it is not a theorem excluding all B-L or strongly coupled dark sectors.

## Primary evidence

[Lee et al., New Test of the Gravitational 1/r^2 Law](https://arxiv.org/pdf/2002.11761), Figure 5 bottom on page 4, plots 95% confidence limits on absolute Yukawa strength. Visual inspection at lambda = 19.73 micrometers places the Eot-Wash 2020 curve well below 1000. We adopt 1000 as a deliberately weak envelope, not a digitized limit or a reconstructed likelihood. The paper identifies platinum test bodies. Its convention is Newtonian potential times [1 + alpha exp(-r/lambda)]; a repulsive vector force has negative alpha. The plotted absolute-value limit supplies the comparison.

The source PDF SHA256 is ffcddf6d2c1a758f07112a3125ae8583254a3089b1022ac2cf459a052652504c. The full relevant page was rendered with Poppler and inspected locally after the web screenshot route failed in the previous packet. No precision curve coordinates are asserted.

## Conversion and consistency

For neutral matter with neutron fractions f1 and f2 per atomic mass unit,

abs(alpha_Yukawa) = g_SM^2 f1 f2 / (4 pi G m_u^2).

Use G=6.70883e-39 GeV^-2 and m_u=0.93149410242 GeV. Platinum has neutron fraction approximately 0.60; we reduce both fractions to 0.50 for this conservative composition screen. This is a platinum-dominated approximation, not a full layered apparatus torque fit.

The envelope gives g_SM <= 1.7106e-17. The fixed product alpha_dark-SM = 8.531719830643956e-13 then requires g_dark >= 6.2677e5, or dark alpha >= 3.1261e10. Conversely, dark alpha <= 1 demands g_SM >= 3.0244e-12: a gap of about 1.77e5 in coupling. Numerical precision in the JSON documents arithmetic only; physical precision is much lower.

The gap is far larger than plausible changes from the simplified composition conversion, but this packet does not provide a new confidence-level fit. An exact exclusion contour would require digitized primary values and a layered composition recast. The heavy 1 GeV mediator cannot cancel the ordinary long-range vector force at these separations.

## Research consequence

Do not invest in transport calculations as though this simple light candidate were already a viable microscopic interaction. A strongly coupled or screened completion is a new hypothesis requiring its own justified xenon normalization and response; it cannot inherit the existing forecast unchanged. The 1 eV candidate has a different range and is not excluded by transferring this bound. Its approximately 0.10% local forecast remains conditional and its applicable short-range and stellar constraints should be screened next before computing transport.

Reproduce with the matching Python script. It authenticates the frozen product JSON, checks the coupling product and writes the matching result JSON. The roadmap records this decision. No GR/runtime/certificate surfaces were changed.
