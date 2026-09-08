# Absorption normalization and first shared rate

Exploratory snapshot, September 7, 2026. This is the coherent nuclear channel of a vector operator at leading order in the heavy-target expansion. It is not a full absorption model, detector likelihood or incoherent-response bound.

[Dror, Elor and McGehee, equations 34–41](https://arxiv.org/html/1908.10861) specify the vector absorption operator and the leading velocity-independent integrated rate. Their area-like sigma_NC is m_chi^2/(4 pi Lambda^4). The physical cross section contains an inverse incident speed; multiplying by incident flux cancels it. Higher-order halo dependence can broaden the recoil line. This source supplies the convention, not an empirical fit at our mass.

Our independent check uses the temporal nuclear vector current J0 approximately 2 M A F. The unpolarized chi-to-massless-neutrino trace gives L00 = m_chi E_nu. Hence, as M becomes large and E_nu approaches m_chi,

```text
average |amplitude|^2 = 4 M^2 A^2 F^2 m_chi^2 / Lambda^4
sigma v = [1/(4 m_chi M)] * [q/(4 pi sqrt(s))] * average |amplitude|^2
        -> m_chi^2 A^2 F^2/(4 pi Lambda^4).
```

The first bracket is the incoming normalization and the second the integrated two-body phase space. With v dimensionless in units of c, the physical coefficient is c*sigma_NC in cm^3/s. At m_chi=0.247 GeV, Lambda=11.5 TeV, this gives sigma_NC=1.08085e-46 cm^2 and c*sigma_NC=3.24031e-36 cm^3/s. The common number density is 0.3/0.247 cm^-3. No extra mean halo velocity or inverse-speed average is inserted in the leading total rate.

The nuclear line energy uses exact rest-frame kinematics from the preceding packet, but the amplitude remains leading order in m_chi/M. This ratio is approximately 0.022 for carbon, so the exact line calculation does not make the amplitude exact. The same coefficient and density are applied to both targets.

Three explicit nuclear prescriptions are compared:

- Helm: F = 3 j1(q R1)/(q R1) exp[-(q s)^2/2], with c=1.23 A^(1/3)-0.60 fm, a=0.52 fm, s=0.9 fm and R1^2=c^2+7 pi^2 a^2/3-5s^2.
- Klein–Nystrand: F = 3 j1(q RA)/(q RA)/(1+a^2 q^2), with RA=1.23 A^(1/3) fm and a=0.7 fm.
- Point nucleus: F=1, a deliberately loose exclusive-channel comparison.

These are declared prescriptions, not fitted isotope responses or confidence bounds. In particular a smooth carbon density ansatz is not an authenticated C12 nuclear transition calculation at 247 MeV momentum. The Xe isotope abundances and canonical carbon count/hold are inherited from pinned repository inputs.

| Form prescription | Raw xenon events, all lines, 2.84 tonne-years | Expected local absorptions per 0.25 s hold | Conditional independent-encounter D <= 2N |
|---|---:|---:|---:|
| Helm | 4.09063 | 4.28421e-26 | 8.56841e-26 |
| Klein–Nystrand | 0.225368 | 3.10390e-26 | 6.20780e-26 |
| Point nucleus | 27936.3 | 2.20095e-24 | 4.40191e-24 |

There is no detector efficiency, smearing or candidate-window fit in the xenon column. The roughly eighteen-fold difference between the two finite-size predictions shows that matching a peak location alone does not determine the absorption normalization. No coupling was separately tuned between the two targets.

The local column assumes independent absorption opportunities on carbon nuclei. For Poisson encounters with normalized conditional state overlap eta, the unconditioned visibility exponent is N(1-Re eta), bounded by 2N. This statement is conditional on that encounter description and applies only to the calculated channel. The point-nucleus row does not bound all nuclear knockout, material, additional UV-induced or postselected channels. A hard absorption may remove a run from the accepted ensemble; that requires explicit survival/readout accounting rather than calling the number above measured coherence loss. Boundary-independent equal factors still cancel in the canonical four-cell ratio.

Implication: this absorption benchmark supplies a possible xenon-scale normalization in selected nuclear prescriptions, but its calculated local contribution is negligible relative to the frozen DP comparator. It has not established a detectable shared cause. The [new absorption interpretation](https://arxiv.org/html/2609.01592v1) also discusses incoherent channels and KamLAND tension; these are still to be independently checked at the same operator convention. An apparent one-event agreement cannot override those requirements or lifetime constraints.

Four checks pass: explicit spin trace, heavy-limit phase-space normalization, cancellation of incident speed, and the point response exceeding the selected finite-size exclusive responses. The sibling script/JSON reproduce the numbers. Ordinary research-document validation applies; no certificate or model-admission claim is made.
