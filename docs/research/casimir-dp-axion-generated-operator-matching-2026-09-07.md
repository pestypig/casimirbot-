# Generated-operator VLL matching inventory

Exploratory snapshot, September 7, 2026. Previous turn included electroweak/Higgs running. This packet inventories the resulting operators and evaluates their linearized finite contribution to the left-left vector kaon coefficient (VLL). No fitted inputs or experimental claims are introduced.

## Result

There are 31 non-SM coefficient entries above the numerical inventory threshold of 1e-25 GeV^-2, including the six already used (phiq1, phiq3, qq1, qq3, qu1, qu8). The remaining **25 entries** produce a combined imaginary finite VLL contribution of **3.351973092e-20 GeV^-2**, approximately **+0.00121%** of the previous partial coefficient.

The largest responses are phil3, +3.344346155e-20 GeV^-2, and ll, +7.626933705e-23 GeV^-2. These enter the library's Fermi-constant input relation. Several larger-norm Wilson tensors give negligible VLL responses on this flavor configuration: coefficient norm alone does not rank relevance to kaon mixing. Responses at the numerical floor are not interpreted as physical signals.

Evaluating all active entries together and adding the tree qq contribution once gives **2.77454420929e-15 GeV^-2** for the imaginary VLL coefficient. This agrees with the previously selected/broader-qq assembly plus the small additional response. It is a partial matching result, not epsilon_K or a full kaon constraint.

## Method

The [script](casimir-dp-axion-generated-operator-matching-2026-09-07.py) authenticates the preceding evolution and extraction chain. The library flavor-rotation utility uses Uq=V-dagger and identity rotations for the other fermions; its qq3 result is checked against our direct four-index rotation. This preserves the down-mass right-handed basis and makes the up-type left-handed basis explicit.

All finite responses use the extracted VddLL expression with loop mt configured to 162.6 GeV in memory. Symmetric positive/negative coefficient evaluations isolate the linear response and suppress even nonlinear input-shift terms. Amplification factors 100 and 300 test numerical conditioning. Generated terms are evaluated separately and together; the full active-coefficient response is also checked at both factors. Scalar Hermitian coefficients are converted to real only after asserting any imaginary part is below a relative roundoff threshold.

[JSON](casimir-dp-axion-generated-operator-matching-2026-09-07.json) preserves the full ranked inventory and complex responses. Flavor rotation, generated-term linearity and both amplification checks pass. The root-leaf documentation check passes separately. Neither installed nor archived files are modified.

The finite implementation is the previously authenticated library based on [Dekens–Stoffer matching](https://arxiv.org/abs/1908.05295). This calculation's extraction and parameter limitations remain as documented in the preceding packets.

## Remaining scope and next step

Only VLL has been evaluated here. The additional operators' possible right-handed, scalar and mixed-chirality kaon contributions still require an explicit audit. The UV boundary is restricted, electroweak inputs are diagnostic tree-derived values, dimension-six input backreaction and finite scheme conversion are not fully reconciled, and low-energy QCD evolution and matrix elements remain outstanding. The small generated VLL shift is not a bound on those gaps.

Next inspect all relevant Delta-S=2 low-energy operator structures and their tree/finite response before converting coefficients to observables. Xenon and local-coherence predictions and the shared-model admission status remain unchanged. The goal stays active.
