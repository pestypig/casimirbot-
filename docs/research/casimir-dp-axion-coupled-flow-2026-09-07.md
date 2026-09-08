# Coupled evolution of the declared SMEFT boundary subset

September 7, 2026. Exploratory integration, not a complete observable calculation. The preceding independent beta audit was progress and identified missing operator directions. This packet evolves them and tests their feedback.

## Fixed inputs and truncation

Use wilson 2.5.2 from the preceding audit, yL=0.2, M=2000 GeV, v=246.2 GeV, and the same archived CKM projectors. Evolve to mu0=162.6 GeV on the imposed six-flavour QCD trajectory alpha(mu0)=0.108 and yt(mu)=yt(mu0)[alpha(mu)/alpha(mu0)]^(4/7). Set electroweak gauge couplings, smaller Yukawas, Higgs quartic and Higgs mass parameter to zero in the beta-function input. This imposed SM trajectory deliberately does not include full top-Yukawa/electroweak SM running.

The boundary contains tree C_Hq^(1)=-C_Hq^(3)=B/(4M²), B=yL² Pu, and the pure-heavy plus mixed four-quark hard terms at mu=M. With Y=Gu Gu-dagger, the full flavor tensors are

```
Cqq^(1)_ijkl = Cqq^(3)_ijkl
 = -B_ij B_kl/(256 pi² M²)
   +(3/2)(B_ij Y_kl+Y_ij B_kl)/(256 pi² M²).
```

Their ijij elements reproduce the authenticated singlet coefficients. All other boundary coefficients are set to zero for this response experiment. This is an explicitly selected boundary subset, not the complete one-loop messenger boundary; for example the source also supplies bosonic and current matching terms. The light pseudoscalar is absent from ordinary SMEFT and remains outside this calculation.

Compare evolution retaining four coefficient tensors (phiq1, phiq3, qq1, qq3) against evolution allowing all 64 non-SM coefficient entries in the package dictionary to respond. These entries include flavor tensors; 64 is not a count of individual Wilson coefficients. The latter permits generated directions, including qu1, to feed back through the full gaugeless beta functions. Both evolutions include top-Yukawa terms; the four-tensor calculation is not the earlier pure-QCD analytic truncation.

## Diagnostic and results

At the final scale form the projected quantity -[Cqq^(1)+Cqq^(3)]_sdsd plus the previously authenticated current-operator finite electroweak matching, including its flavor sum evaluated with the evolved currents. **Other generated operators have not yet received their finite electroweak matching.** Consequently this projection cannot be labeled the complete Hamiltonian coefficient or multiplied into the old epsilon estimate as an updated result.

The imaginary projection is 2.717958685e-15 GeV^-2 in the four-tensor calculation and 2.707712778e-15 GeV^-2 in the coupled calculation. The ratio is 0.996230293: a 0.377% difference in this defined diagnostic. The largest generated qu1 component reaches 5.38091897e-11 GeV^-2; this is a tensor-component maximum, not a kaon observable.

Tightening the integration relative tolerance from 1e-7 to 1e-9 changes the coupled projection by less than 4e-12 fractionally. Integration uses dimensionless M²-scaled coefficients so absolute tolerances do not silently erase small physical coefficients. Numerical stability verifies the chosen equations, not their physical completeness.

## Next substantive completion

Match the generated quark operators at the electroweak threshold using the generic one-loop top-quark matching treatment, including its basis and input conventions. Add the omitted boundary coefficients or quantify why they do not contribute at the claimed order. Separate resummed higher logarithms from genuinely complete fixed-order terms; feeding generated operators through one-loop matching creates selected higher-loop contributions and does not supply all finite two-loop QCD effects.

This result does not identify a large hidden suppression, but the incomplete diagnostic cannot exclude one from missing physics. The smaller-yL family, full flavor fit and updated two-target prediction remain open. The frozen apparatus and previously negligible local scattering estimate are unchanged.

## Replay

Run `C:\Python313\python.exe docs/research/casimir-dp-axion-coupled-flow-2026-09-07.py` with the temporary wilson installation documented in the preceding packet. The script authenticates the prior beta audit, imports definitions only, declares its complete selected boundary, and writes the sibling JSON. Solver completion, tolerance stability and generation of the additional operator are checked. Root-leaf documentation validation is separate; no certificate or full-model admission is claimed.
