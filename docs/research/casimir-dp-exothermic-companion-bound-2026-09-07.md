# Exothermic elastic companion: conditional potential bound

Date: 2026-09-07. Exploratory; no full-model exclusion or sensitivity claim.

Following the direct-channel screen, consider ground-state particles scattering through a virtual excited state. [Batell, Pospelov and Ritz](https://arxiv.org/html/0903.3396) motivate this second-order interaction. We explicitly define the nonrelativistic Yukawa potential U(q)=4 pi alpha_eff Z/(q^2+m_A^2). This is a potential-model calculation, not authenticated relativistic Majorana matching.

Retain the [new exothermic proposal's](https://arxiv.org/html/2609.05204v1) illustrative normalization P=f_H alpha_D epsilon^2=1.7e-17 and masses 45 GeV, 1 MeV splitting, 1 GeV mediator. Then alpha_eff^2=alpha_EM P/f_H. Xenon down-scattering alone cannot separate the population fraction from the coupling. The fraction 0.0062 below is a conditional input from the source's population discussion, not an independently reproduced cosmology.

For free carbon, the largest relative kinetic energy at 798 km/s is 31.7207 keV, below the 1 MeV gap. The second-Born resolvent therefore has no open-channel pole. Its absolute amplitude obeys

`|W(p',p)| <= [1/(delta-Emax)] integral d^3k/(2pi)^3 |U(p'-k) U(k-p)|`

`<= 2 pi alpha_eff^2 Z^2 / [m_A (delta-Emax)]`.

The second line follows from Cauchy-Schwarz and translation invariance of the Yukawa L2 norm. Replacing a normalized nonnegative nuclear charge form factor by one is conservative for this norm bound. Unlike a local -U^2/delta approximation, this inequality does not discard the intermediate kinetic energy as an equality.

Integrating d sigma/dE = M |W|^2/(2 pi v^2) over the elastic recoil interval gives sigma <= mu_C^2 W_bound^2/pi. Use the ground-state density (1-f_H) rho/m and D <= 2 times the expected independent-carbon collision count. The frozen mass and hold time give:

| Excited fraction | Independent-carbon D upper per hold |
| --- | ---: |
| 0.5 | 6.8901e-38 |
| 0.0062 | 8.9065e-34 |
| 1e-6 | 3.4450e-26 |

The scaling is (1-f_H)/f_H^2 at fixed P. Decreasing f_H is therefore a new population/coupling requirement, not a free enhancement. The third row is a sensitivity example, not a cosmologically or experimentally admitted point.

The adjacent script authenticates the frozen configuration and checks the convolution norm analytically. An independent zero-momentum integration agrees with the exact potential resolvent integral to 2.3e-16 relative. These checks validate the stated mathematics only.

Decision: this independent-nucleus companion does not rescue the source-like population benchmark for a measurable joint signal. The calculation omits relativistic matching, additional operators, electron response, interference across different nuclei, collective solid response and the excited-state incident elastic channel. It is not a total coherence bound. The next worthwhile extension must quantitatively establish a distinct collective or matched interaction rather than infer one from the existence of a virtual state. Boundary-differential visibility remains a separate observable.
