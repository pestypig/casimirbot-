# Dark radial scalar: elastic coupling and transition selection

Exploratory new candidate branch. Previous turn made progress by restricting single-vector incoherent recycling. This packet examines the radial scalar already needed to generate Majorana masses. It compares a NEW symmetric branch against the previously specified asymmetric pilot; it does not rewrite that pilot or retune the apparatus.

## Derivation from the mass-generating field

Let S=(w+s)/sqrt(2), with charge two in units of the dark fermion charge, so mV=2gchi*w. The two-Weyl mass matrix is M(w)=[[mL(w),mD],[mD,mR(w)]], with mL,mR proportional to w and an invariant mD. The physical radial Yukawa matrix is Y=V^T (dM/dw) V, where V performs the positive-mass Takagi transformation. It is not a separately adjustable apparatus coupling.

Write gap=mL+mR, a=(mL-mR)/2 and D=sqrt(mD^2+a^2). On the same opposite-signed-eigenvalue branch used in the prior audit, the physical diagonal couplings are (-gap/2+a^2/D)/w and (+gap/2+a^2/D)/w. The transition magnitude is |a mD/(D w)|. The transition is imaginary in the selected positive-mass convention; its four-component interpretation requires the corresponding pseudoscalar bilinear, rather than silently treating it as a scalar transition.

For equal Majorana terms, a=0, the transition vanishes exactly at tree level while the diagonal couplings remain opposite and nonzero: y1=-gap/(2w), y2=+gap/(2w). Thus a light radial scalar can mediate elastic scattering without opening chi_star -> chi+s at this order. The vector remains off-diagonal. This does not establish all-orders protection or total excited-state survival.

[The niDM model, Appendix A and table 2](https://arxiv.org/html/2405.08081v2#A1) provides the general scalar/mass framework. Its phenomenological analysis assumes a heavy scalar, so its allowed regions cannot be imported into this light-scalar branch. The simplified matrix calculation here is independently checked.

## Explicit gauge-sector pilot

Choose w=500 GeV and gchi=0.1, giving mV=100 GeV, well above the selected gaps. Using the archived tree baryon contact to set gchi*gB/mV^2 gives gB=3.09834e-4 (40 GeV dark mass) or 3.05573e-4 (100 GeV). These are illustrative matching inputs, not a complete baryonic anomaly-free theory or a detector fit. Timelike mixing, loop matching and isotope charge corrections remain open.

| Dark mass | Symmetric radial diagonal magnitudes | Previous asymmetric pilot transition magnitude |
|---|---|---|
| 40 GeV | 1.00625e-6 | 5.03126e-7 |
| 100 GeV | 5.51301e-7 | 2.75650e-7 |

The last column explains why simply adding a light scalar to the asymmetric pilot is not equivalent to the symmetric candidate: it restores a real-scalar transition channel. The symmetric case also removes the tree axial elastic vector coupling previously calculated; its candidate local interaction is instead the scalar channel.

## Required scalar portal closure

Mixing the radial scalar with the SM Higgs supplies its ordinary-matter coupling. For light/heavy scalar masses ms,mh and mixing angle theta, the elastic nucleon coefficient has the structure y_i*(fN*mN/vEW)*sin(theta)*cos(theta)*[1/(q^2+ms^2)-1/(q^2+mh^2)], up to a field-sign convention. Both propagators must be retained in matching. Opposite y_i signs matter for amplitude interference even when their isolated rates agree.

Neither ms nor theta is fixed by the xenon vector normalization. They must be specified through the same scalar potential and constrained by scalar-mediated ordinary forces, collider/stellar data as applicable, and the full two-target response. A light mass is not automatically radiatively stable in the presence of a 100 GeV vector. The scalar portal cannot be fitted independently to the local forecast while leaving its effects on xenon and matter out of the model.

Next derive the scalar potential/mass-mixing relations and translate ordinary-force bounds into the same portal coupling before selecting a local signal benchmark. Symmetry breaking by the baryonic/anomaly sector and possible loop-induced transitions must be audited before claiming survival. No measured local effect or gravitational cause follows from this structural lead.

Reproduce with `python docs/research/casimir-dp-dark-scalar-selection-2026-09-07.py`. It authenticates the archived input, checks positive Takagi masses, diagonal Yukawa expressions and the transition formula. Numerical symmetric off-diagonal residues near 1e-23 are floating-point zeros, not predicted nonzero decays. Root-leaf validation is separate; no runtime/GR/certificate changes and no model admission.
