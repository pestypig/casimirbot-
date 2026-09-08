# Forward electron trace: heavy-mediator normalization check

Exploratory matching verification, September 7, 2026. Validation masses below do not replace the 300 MeV candidate.

[Berlin and Kling, Appendix C, C7-C8](https://inspirehep.net/files/8e9cf20ffaddb4d651a261ac379eed74) give the heavy-mediator scalar and spin-2 coefficients. Their rest-electron combination is M_e=m_e(c0+3c2/4), with sigma=4*mu_e^2*|M_e|^2/pi. In the potential convention sigma=mu_e^2*|W|^2/pi, W=2*M_e up to an overall sign convention. Hence the reference normalized to (4*pi*alpha_eff)^2 is

W/(4*pi*alpha_eff)^2 = m_e*M*[60*log(m_A/M)-11]/(48*pi^2*m_A^4).

The companion script compares this to the equal-sign sum of the two normalized vector-trace routing integrals. It uses validation M=1 GeV, m_e=1e-4 GeV and gap=1e-4 GeV. At mediator/dark mass ratios 10, 30 and 100, numerical/reference ratios are approximately 1.02125, 1.00225 and 1.000046. Both integrals are summed before outer integration to reduce cancellation error; tightened quadrature provides a separate numerical check.

The trend supports the equal-sign combination and magnitude normalization in this forward spin-independent limit. It is not a derivation of all Majorana Feynman rules, a gauge-independence proof, or a full operator match. Finite electron mass and gap are retained in the numerical calculation while the reference is asymptotic, so exact equality is not required. An overall amplitude sign is not established by the cross-section comparison alone.

Next verify the complete diagram conventions and gauge cancellation, then evaluate the physical candidate and its momentum-dependent electron operators. Do not fold the spin-averaged trace into the material response as though it were the full spin-averaged squared amplitude. No measurable shared signal or goal completion is claimed.
