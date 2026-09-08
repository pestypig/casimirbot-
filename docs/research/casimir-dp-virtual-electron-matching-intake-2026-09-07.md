# Virtual electron response: matching requirements

Date: 2026-09-07. Exploratory research intake; no electronic rate or experimental validation claimed.

The frozen virtual nuclear benchmark has m_chi=100 GeV, m_A=0.01 GeV, delta=0.01 GeV and effective alpha=2.797331193591714e-7. Its resolved nuclear components are negligible for local coherence. The next measurable-overlap test is the electronic response, with these parameters retained.

## Primary-source lead and rejected shortcut

Berlin and Kling, [PRD 99, 015021, Appendix C](https://inspirehep.net/files/8e9cf20ffaddb4d651a261ac379eed74), match loop-induced fermionic inelastic-dark-matter scattering onto scalar and spin-2 electron operators. Their free-electron amplitude is M_e=m_e(c_e^(0)+3c_e^(2)/4), and their convention gives sigma=4 mu_e^2 |M_e|^2/pi. Equations C7-C8 assume m_f << m_chi << m_A. They establish a useful operator framework, but do not provide a formula valid for the present light-mediator hierarchy. Crossed diagrams are also required.

Here m_A/m_chi=1e-4, the reverse of the necessary heavy-mediator ordering. Do not insert this ratio into C8 or report the result as a prediction. The benchmark also has delta/m_A=1; small delta/m_chi alone does not justify dropping the gap in soft loop denominators.

## Electron-specific scale check

At a diagnostic internal momentum p=m_A=10 MeV, using m_e=0.51099895 MeV, nonrelativistic electron recoil p^2/(2m_e) is about 97.85 MeV; relativistic recoil sqrt(p^2+m_e^2)-m_e is about 9.50 MeV. This is a scale warning, not a calculation of which loop momenta dominate. The nuclear static-gap potential cannot be transferred to electrons without a relativistic matching calculation.

## Response decision

Two insertions of the charge interaction generally involve intermediate target states. Squaring their sum requires more target information than an ordinary single-density loss function supplies. However, matching both insertions onto a local one-electron operator can permit use of an ordinary material response after the operator's nonrelativistic reduction is established. Thus neither blindly reusing DarkELF nor declaring its data categorically unusable is justified.

The next calculation must retain the excited-state gap and light-mediator mass in the box and crossed-box amplitudes, specify fermion/spin and coupling conventions, and recover a known limit. It must determine the leading electron operator and corrections over the diamond grid before convolution. Contributions with insertions on different constituents require separate treatment and overlap subtraction; adding a complete free-nucleus calculation to the smooth-sphere result is still disallowed.

Acceptance requires the same coupling product as the xenon normalization, an explicit matching error estimate, and a branch-filtered material prediction. No retuning is licensed by this intake. The present numerical nuclear normalization remains conditional on its own local-gap approximation; an eventual full theory must reproduce or correct that normalization consistently.

Decision: retain relativistic electronic matching as the next lead, with C7-C8 explicitly inapplicable to this benchmark. No measurable signal in both configurations has yet been demonstrated. This document changes no frozen apparatus, GR, certificate, or physical-viability authority.
