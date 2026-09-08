# Conditional scalar and spin-2 separation

Exploratory operator extraction, September 7, 2026. No candidate or apparatus retuning.

Use the [Berlin-Kling C1-C2 operator convention](https://inspirehep.net/files/8e9cf20ffaddb4d651a261ac379eed74). With the dark particle at rest, the relevant electron operators are m_e*bar(e)*e and O_e^(2)00. For an on-shell electron normalized by 2E, their forward matrix elements are m_e^2/E and E-m_e^2/(4E), respectively. The Majorana potential convention used in the preceding limit test therefore gives

F(E)=2*[c0*m_e^2/E+c2*(E-m_e^2/(4E))],

where F and the coefficients here initially omit the common coupling factor (4*pi*alpha_eff)^2. Under this two-operator ansatz,

c2=[E*F(E)-m_e*F(m_e)]/(2*p_e^2), and c0=F(m_e)/(2*m_e)-3*c2/4.

The actual-candidate samples at electron momenta 3, 30 and 100 keV/c give c0=0.606295660, 0.606295604, 0.606295028 and c2=0.807267715, 0.807267790, 0.807268559 GeV^-3 before couplings. The companion script records the physical coupling factors and source hash, and checks rest reconstruction. Their stability is evidence for this leading forward parametrization, not a proof that omitted operators vanish.

A separate executed heavy-limit check used validation masses M=1 GeV, m_e=delta=1e-4 GeV, m_A=30 GeV, and p_e=1e-5 GeV. Reusing the forward integrand with absolute quadrature tolerance 1e-15 yields c0=1.48178006e-7 and c2=1.38613298e-7 GeV^-3. The C7 asymptotic references without couplings are -3*M*(1-4*log(m_A/M))/(32*pi^2*m_A^4) and -M*(1-12*log(m_A/M))/(36*pi^2*m_A^4). Numerical/reference ratios are 1.00244749 and 1.00196449. This checks both combinations individually, rather than just their rest sum. Finite hierarchy and splitting corrections are retained numerically.

Material implication: scalar density and electron energy/stress are separate operators before the nonrelativistic expansion. A constant rest coefficient does not establish their full bound-state response. The spin-dependent channel from the previous packet also remains separate. Next reduce these operators with controlled kinetic/binding terms and nonzero momentum transfer; retain the unresolved complete-diagram assumptions. No coherence rate or measurable shared model is admitted.
