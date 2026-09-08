# Up-singlet matching source audit

September 7, 2026. Exploratory source and convention audit. The previous QCD sensitivity packet made progress by isolating the top–messenger coefficient. This packet corrects the next source selection before any model-specific coefficient is imported.

## Representation mismatch in the initial lead

[Bobeth et al., 1609.04783v3](https://arxiv.org/pdf/1609.04783), PDF page 2 and section 2, restrict their phenomenology to five representations with the relevant down-quark couplings. Their list is D, QV, Qd, Td and Tu. It omits the up-type SU(2) singlet U=(3,1,2/3) used in our model. In particular, Tu is a triplet, not another name for our singlet. The generic EFT framework can inform the workflow, but the paper does not directly furnish our singlet's model-specific matching coefficients. Its absence from the analysis does not imply zero loop effects in kaons.

## Applicable replacement source

[Crivellin, Kirk, Kitahara and Mescia, 2204.05962v2](https://arxiv.org/pdf/2204.05962), stamped August 12, 2022, explicitly includes U=(3,1,2/3). Equation II.5 gives the Higgs interaction xi_i^U Ubar Htilde-dagger q_i plus its conjugate. Equation II.6 defines dimensionful Warsaw coefficients through L=L_SM+sum C_i Q_i. Equation II.10 gives for U alone:

```
C_Hq^(1) + C_Hq^(3) = 0,
[C_Hq^(1) - C_Hq^(3)]_ij = xi_i* xi_j/(2 M_U²).
```

The supplementary material provides one-loop four-quark and gauge-current coefficients. The source's top/charm phenomenological fit is not our first-generation alignment and cannot be imported as a bound. Nor does electroweak one-loop matching by itself supply the two-loop QCD correction to a kaon box.

## Initial convention bridge (our inference)

In the up mass basis with real yL, set xi=(yL,0,0). At leading order in 1/M², C_Hq^(1)=+yL² diag(1,0,0)/(4M²), C_Hq^(3)=-C_Hq^(1). For yL=0.2 and M=2000 GeV, their nonzero entries are ±2.5e-9 GeV^-2. The corresponding neutral-current shift delta gLu=-v²(C1-C3)/2=-yL²v²/(4M²) matches the small-mixing expansion of the archived exact result -D/2. The down neutral-current combination vanishes at this order. This establishes a normalization cross-check, not loop-level closure.

For down-basis application rotate the rank-one coefficient as C_down=V0-dagger C_up V0, using the same underlying unitary three-generation V0 as the archived enlarged current. Thus [C_down]_ij is proportional to V0_ui* V0_uj. Do not set xi=(yL,0,0) independently in both bases or substitute the nonunitary light-current subblock without accounting for the EFT expansion: either would change the declared flavor alignment.

The source does not include our additional light pseudoscalar A and its yR interaction. Those fields remain in the EFT below M, so source results can only cover the common pure-Higgs/messenger subset. A complete matching must retain the light A field and subtract light-field contributions consistently. No already-computed full-theory box should be added to an EFT coefficient and its loop matrix element if these describe the same contribution.

## Next work and non-claims

Authenticate the relevant supplementary four-quark coefficients and identify the combination contributing to the aligned sd amplitude after basis rotation. Expand the existing full electroweak loop at large M and compare it with the matched coefficient plus EFT running and electroweak matrix elements. This overlap check precedes adding QCD evolution and prevents double counting. Preserve the scalar-input ledger and the frozen two-target baseline.

No new eta factor, fitted point, experimental exclusion or shared-model admission follows from this source audit. The small-yL family remains conditional; the local-scattering prediction remains too small to explain the DP forecast under the existing assumptions.

Validation: source representation and coefficient conventions inspected in the version-stamped PDFs; tree-level current normalization checked algebraically above. Physics root-leaf documentation validation is separate from physics matching. No certificate claim applies.
