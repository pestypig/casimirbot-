# Virtual interaction: common nuclear normalization

Date: 2026-09-07. Exploratory raw spectrum, not an LZ fit or allowed model.

This packet moves from unnormalized atomic toys to one finite-range virtual interaction. Choose m_dark=100 GeV, mediator mass 10 MeV and positive splitting 10 MeV, with the prior diagnostic incident speed 776 km/s and density 0.003/cm3. No previous B-L coupling products are reused. Each nucleus is a uniform charge sphere of radius 1.2 A^(1/3) fm; this is a nuclear modelling assumption, not a precision isotope charge distribution.

Define alpha=g_dark g_EM/(4 pi) and U=alpha Z u(r), with u the finite-sphere Yukawa potential per unit charge. In the local large-gap approximation, W(r)=-U squared/gap. Its Fourier transform is W_tilde(q)=-4 pi B Z squared integral dr r squared u(r) squared sinc(qr), where B=alpha squared/gap. Then d sigma/d E_R = m_A |W_tilde| squared/(2 pi v squared), in natural units. The reduced mass cancels from this expression but remains in the kinematic endpoint.

The finite-sphere potential and second-order route follow [Batell, Pospelov and Ritz, equations 22-27](https://arxiv.org/html/0903.3396). The script implements the explicit potential convention above rather than importing a source coupling convention. It uses the existing natural-xenon isotope table and 2.84 tonne-year exposure. All counts are raw and unattenuated, without detector efficiency or energy resolution.

Normalizing to one raw 200-269.9 keV recoil gives B=7.82506e-12 GeV^-1, alpha=2.79733e-7 and a raw 5.4-200 keV/high-window ratio of 15962.75. Under the same convention and normalization, the carbon-12 nuclear forward coefficient is W_tilde_C(0)=-1.53594e-7 GeV^-2. It is a carbon nuclear coefficient, not a complete neutral-atom or diamond response.

Radial quadrature refinement from 384 to 768 nodes per interior/exterior segment changes integrated counts by 4.2e-12 relative. This checks radial numerics only: the 80-node energy quadrature is fixed, and the local-gap, uniform-charge, omitted-electron and detector uncertainties are not included. In particular, finite-gap checks on the earlier Gaussian forward toy do not establish errors at xenon recoil momenta.

The mediator range is about 19.7 fm, far shorter than the earlier massless atomic toy. Its 4.7933% neighbor overlap cannot be imported here. The complete atomic calculation must add electrons and cross terms consistently before calculating a sphere rate. Likewise individual dark/ordinary couplings and external bounds remain unspecified.

Decision: this benchmark is a common normalization, but its strong lower-recoil preference is unfavorable for explaining an isolated high-energy candidate. Do not tune the carbon amplitude independently. Next assess the neutral-carbon completion and the resulting conditional coherence magnitude, then compare this branch with mechanisms that change the high/low recoil spectrum. No experimental exclusion or measurable overlap is established.

Matching Python/JSON reproduce the calculation. Frozen apparatus values and GR/certificate authority are unchanged.
