# Forward vector pair: spin-dependent operator

Exploratory matching result, September 7, 2026. This is the explicitly specified diagram pair, not a completed Majorana amplitude.

Keep the previous denominator routing and electron Compton sum. Choose the dark numerator gamma^nu*(slash(P+l)+M+delta)*gamma^mu, with electron order gamma^mu*(slash(p+l)+m)*gamma^nu for s=+1 and gamma^nu*(slash(p-l)+m)*gamma^mu for s=-1. External rest spinors are normalized by their 2m factors, so their full spin operators are the upper two-by-two blocks. The script fixes this convention explicitly rather than inferring a spin term from a spin-averaged trace.

After rotational integration, the resulting four-by-four operator decomposes into A*identity+B*(sigma_chi dot sigma_e). Explicit gamma matrices give the spin polynomial -2*delta*l0+2*l0^2-(4/3)*|l_vector|^2 for each routing. Its constant term vanishes. All four polynomial coefficient matrices satisfy the scalar-plus-spin decomposition within 1.90e-14 absolute.

Using the previous loop tensor moments, the spin parameter integrand is x*[(2*delta*Q0+2*Q0^2)/Delta^2-3/Delta], with common factor 1/(16*pi^2). The two integrated coefficients before couplings are -0.000424902927096 and -0.000423911215189 GeV^-2. Two coordinate choices agree within 3.7e-13 relative.

At unchanged coupling their sum gives conditional B=-1.23584836e-12 GeV^-2. The previously derived conditional A has magnitude 1.80307726e-12 GeV^-2. These coefficients are therefore comparable for this diagram convention. Here sigma denotes Pauli matrices, not spin operators S=sigma/2; the coefficient of S_chi dot S_e is 4B. Averaging a free two-spin operator squared would give |A|^2+3|B|^2, but this is not a bulk diamond response or a justified detector rate.

The [Berlin-Kling SI matching framework](https://inspirehep.net/files/8e9cf20ffaddb4d651a261ac379eed74) supplies the earlier SI limiting check, not validation of this new spin term. Complete Majorana exchange conventions, spin-channel limiting checks, nonzero momentum and material spin susceptibility remain necessary. No spin-independent dielectric function may stand in for the spin response without an explicit approximation. No claim is made that diamond's electrons behave as independent free spins.

Decision: retain separate density and spin channels during completion of the virtual electron calculation. The spin trace alone was insufficient to define the material observable. No complete matched interaction, measurable shared signal or goal completion follows.
