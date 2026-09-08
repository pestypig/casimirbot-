# Generated right-handed-top operator matching

Exploratory research snapshot, September 7, 2026. The shared-scattering goal remains active. This packet changes no apparatus inputs or physical-authority claims.

## Result

Adding the generated `qu1` and `qu8` weak-scale matching terms changes the previously selected imaginary kaon Hamiltonian coefficient by **-0.005188%** at the frozen 2 TeV, yL=0.2 boundary. The updated partial coefficient is **2.70757229735e-15 GeV^-2**. This is not a complete kaon prediction or a revised allowed parameter region.

## Calculation

The reproducible [script](casimir-dp-axion-generated-qu-matching-2026-09-07.py) authenticates and loads the definitions of the previous coupled-flow script. It exposes its final tensors through an in-memory AST change to the outer return only; the archived file and its output driver are untouched. The original boundary, imposed QCD trajectory and full non-SM coefficient evolution are retained.

Use the first bracket of Eq. 2.24 and I1 from Eq. 2.28 of [Endo, Kitahara and Ueda, v2](https://arxiv.org/pdf/1811.04961). In the down-quark doublet basis and diagonal right-handed-up basis, for i=s, j=d:

`delta H = [g2^2/(16 pi^2)] Pt_sd I1 [(-2+2/3) Cqu8_sdtt - 4 Cqu1_sdtt]`.

Here g2=2 MW/v, and all coefficients are dimensionful. The singlet and octet imaginary contributions are respectively -1.34900017962e-19 and -5.58047850569e-21 GeV^-2. I1=0.00718227506 at mu=162.6 GeV. Its small value at this scale must not be interpreted as a scale-independent smallness theorem.

The [JSON](casimir-dp-axion-generated-qu-matching-2026-09-07.json) records both integration tolerances and explicit checks. Tightening rtol from 1e-7 to 1e-9 changes this isolated shift by less than 1e-10 fractionally. Independently translating the previous current normalization into the source's I1 convention agrees to numerical precision. These checks establish implementation consistency, not completeness.

## Remaining work and significance

The qq terms multiplying J and K still require a flavor-basis audit and matching. Also missing are the complete UV boundary, full SM trajectory, consistent below-weak-scale QCD evolution and observable conversion. The source notes residual scheme dependence beyond its perturbative order; this partial addition supplies no higher-order uncertainty estimate.

This term alone does not materially change the previously identified flavor-constraint concern. It neither establishes a shared cause nor changes the xenon/coherence calculation. Next, resolve the left-handed-top flavor contractions in the qq matching and test their scale consistency before assembling a complete coefficient for the declared approximation.
