# L10 identity, spin response and isotope discriminator

Date: September 6, 2026. Exploratory research; no LZ fit, experimental residual or physical-admissibility claim. Frozen apparatus unchanged.

## Decision

Keep the LZ contact L10 interaction and a photon-mediated magnetic dipole as separate leads. Their propagators, nucleon/electron couplings and low-momentum behavior differ. Neither may inherit the scalar sphere enhancement. This identity audit changes the next calculation from atomic charge screening to the carbon nuclear-spin response for the contact lead.

The [2026 LZ paper](https://arxiv.org/html/2609.02823v1) uses elastic isoscalar L10 as an illustrative magnetic-moment interaction. Its nuclear responses are calculated with WimPyDD and shell-model density matrices. This does not identify an electromagnetic photon mediator.

## Authenticated operator

The [2024 LZ covariant analysis, equations 2–4](https://arxiv.org/pdf/2404.17666) explicitly gives a product of two dipole currents, reduced at leading order to

\[
\mathcal L_{10}=4\left[\frac{q^2}{m_M^2}\mathcal O_4-
\frac{m_N^2}{m_M^2}\mathcal O_6\right]
=\frac4{m_M^2}(\mathbf q\times\mathbf S_\chi)\cdot(\mathbf q\times\mathbf S_N).
\]

It sets the momentum normalization mass m_M=m_N. This is a correlated combination of O4 and O6; separate published limits on either operator cannot simply be combined. Keep its overall coefficient and the 2026 normalization conventions explicit before computing a rate.

[Anand, Fitzpatrick and Haxton, Appendix A.3](https://arxiv.org/pdf/1308.6288) state that their default exchange is heavy and pointlike. A light mediator requires adding its momentum-dependent propagator. A photon completion also requires matching the actual electromagnetic charge and magnetic currents; an isoscalar contact coefficient alone does not specify those.

## Independent algebra and local consequences

For q along z the leading amplitude is proportional to q²(S_chi,x S_N,x + S_chi,y S_N,y): the longitudinal spin term cancels. Our explicit Pauli-matrix calculation for two spin-1/2 particles gives the unpolarized squared operator 2 q⁴/m_M⁴. This verifies the interference and low-q power, without importing nuclear matrix elements or a cross-section normalization.

For independent unpolarized nuclei, cross-site expectations factorize to zero: <S_a,i S_b,j>=0 when a differs from b. Spatially unresolved nuclei therefore do not automatically produce N² enhancement in this spin channel. This statement requires the specified spin ensemble; polarization, entanglement or correlations require their own structure factor. An inclusive spin-flip rate also need not equal coherence loss in the postselected surviving apparatus paths.

[NIST's carbon spin table](https://www.physics.nist.gov/PhysRefData/Handbook/Tables/carbontable1.htm) assigns spin zero to carbon-12 and spin 1/2 to carbon-13. Use [NIST's isotope-composition table](https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=C) for the representative carbon-13 number fraction 0.0107, rather than mixing its precision with the older rounded abundance. That composition is an assumption, not an assay of the proposed sphere.

The frozen mass then contains approximately 1.551e10 carbon atoms and 1.659e8 carbon-13 nuclei. Carbon-12 has no leading elastic nuclear-spin contribution to this operator. Carbon-13's response must be matched to its nucleon spin content; its measured electromagnetic magnetic moment is not a substitute for an isoscalar nucleon-spin matrix element. Subleading relativistic, induced or additional interactions are outside this leading statement.

At q=hbar/d=0.7893 eV versus the mean-xenon 248-keV recoil momentum 246.3 MeV, the q⁴ factor alone differs by 1.055e-34. This is a fixed-matrix-element comparison, **not a rate ratio or bound**: coherence integrates over all allowed momenta, hbar/d is not a hard cutoff, and target responses, flux integration, exposures and survival differ. In particular, hard independent-nucleus scattering is not ruled out by this soft-momentum comparison.

## Next prediction and falsifier

At fixed total atom count and uncorrelated spin preparation, the leading independent carbon-13 channel should scale linearly with carbon-13 fraction. At fixed mass include the small mean-atomic-mass correction. A boundary-independent channel still cancels from a perfectly matched boundary cross-ratio. The model must predict the actual readout, not merely a total event count.

An isotope sweep is a prospective discriminator, not authorization to retune the frozen design. Environmental spin noise can also depend on isotope fraction, so such scaling alone would not identify dark matter. A credible shared prediction requires carbon-13 and xenon spin responses with the same matched coefficient, solid excitation/survival treatment, and the existing detector constraints. No numerical rate is asserted before those inputs are supplied.

Replay: `python docs/research/casimir-dp-l10-operator-audit-2026-09-06.py`. Adjacent JSON records the frozen configuration hash, isotope assumption and five passing algebra checks. Atlas build/why/upstream trace completed against the canonical quantum-foam article before editing. This diagnostic research packet changes no runtime, adapter, constraints or certificate semantics. S1 and the user goal remain open.
