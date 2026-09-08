# Symmetron density separation and recoil matching audit

September 6, 2026. Exploratory S1 audit of the explicit even-coupling extension in the preceding symmetron intake. No fitted model, experimental exclusion or frozen-input change.

## Density and size scales

The frozen sphere has density 3500 kg/m³. In natural units, one kg/m³ converts to `(c²/eV_J)(hbar c)³` eV⁴. Define the dimensionless density-size parameter x²=rho_C R²/M², neglecting mu² against the interior density term. Its characteristic scale sqrt(rho_C)R is **5.43848 GeV**.

For a concrete weak-screening scale criterion x²<=0.1, M>=17.198 GeV. The value 0.1 is a declared analytic screening criterion, not an apparatus tolerance or exact phase boundary. Bulk xenon restores the symmetry if rho_Xe/M²>mu², provided finite size and other sources permit the homogeneous approximation. For a safer illustrative density margin rho_Xe/M²>=2mu², the upper M values are:

| mu (eV) | Upper M (GeV), assumed Xe density 2900 kg/m³ | Overlap with M>=17.198 GeV |
|---|---|---|
| 0.001 | 2499.94 | Yes, as a scale window |
| 0.01 | 249.994 | Yes, as a scale window |
| 0.1 | 24.9994 | Yes, narrow |
| 1 | 2.49994 | No under these criteria |

Xenon densities 2700, 2900 and 3100 kg/m³ are explicit sensitivity benchmarks, not authenticated time-resolved LZ densities or uncertainty intervals. No exact exclusion rests on them. The sphere density and dimensions are frozen values. The screening mechanism and its finite-source dependence are described in [Banks et al., section II.2](https://arxiv.org/html/2511.09750v1).

At the illustrative point mu=0.01 eV and M=30 GeV, x²=0.0328634, while the benchmark bulk xenon density is 138.882 times its critical density. A linearized restored-xenon field decays over 1.68048 micrometers. In a simplified sphere calculation with density-dominated interior curvature and massless exterior, matching the regular interior sinh(mr)/r solution to a constant plus 1/r exterior gives phi_center/phi_infinity=sech(x)=0.983790. Here mu R=0.0140 and the sphere density term exceeds mu² by 167.6, supporting those *local* approximation hierarchies. These numbers do not replace a finite chamber/plate/sphere solution.

Halo and gas contributions to the effective mass are omitted only conditionally: the preceding model includes rho_chi/M_chi², which must be checked after M_chi is fixed. The example is therefore a geometric/background scale check, not an allowed particle-physics benchmark.

## Why this does not yet give a xenon interaction

The same model's linear vertices are proportional to phi_bar. In the homogeneous restored interior, phi_bar=0 and both vanish. A finite detector has boundary penetration, so an exact zero cannot be assigned everywhere without solving the profile. Nevertheless, using unsuppressed vacuum one-scalar exchange deep in a restored xenon region would be inconsistent with the mechanism being invoked.

Quadratic couplings survive:

`L contains -[m_chi/(2M_chi²)] phi² chi-bar chi -[m_N/(2M²)] phi² N-bar N`.

The two-scalar exchange diagram contains, up to vertex and symmetry factors,

`integral d^4l / [(l²-m_phi²)((l+q)²-m_phi²)]`.

At large loop momentum this scales as integral dl/l and is logarithmically ultraviolet divergent. Renormalization requires a local `(chi-bar chi)(N-bar N)` counterterm. Its renormalized coefficient must be fixed by a declared ultraviolet completion or a matching condition. The finite nonanalytic momentum dependence of the loop does not determine that independent contact contribution.

**Consequently, the five parameters listed in the initial intake are not sufficient to fix the absolute xenon recoil amplitude once this two-scalar channel is retained.** That earlier list defined an illustrative low-energy extension; this audit identifies the additional matching requirement. Choosing a subtraction scale or silently setting a contact coefficient to zero is not a physical prediction. Retaining only a long-distance two-scalar potential likewise discards contact sensitivity precisely where the hard-recoil calculation may require it.

This is a predictivity issue, not a claim that every screened scalar is excluded. A renormalizable completion could supply the coefficient, but its additional particles/couplings and constraints would then be part of the shared model. They must determine both experimental predictions without independently fitting a xenon contact term and a local force term.

## Decision and next admission requirement

The scale window confirms that small-sphere responsiveness and bulk-xenon restoration can coexist conditionally; similar material densities do not alone forbid it because the sizes differ greatly. It also exposes why that separation is insufficient: the desired xenon channel changes, and the remaining recoil calculation needs matching.

Retain the lead at exploratory status. Before investing in a full boundary-dependent coherence fit, specify the high-energy completion or an externally fixed contact coefficient, check the finite xenon profile, and define the scalar fluctuation state responsible for contraction rather than only phase. Optical-boundary changes at unchanged scalar sources remain a null in the minimal model. These requirements prevent screening from being used as an unquantified escape from the existing unscreened-force audit.

Reproduce the scale numbers with `python docs/research/casimir-dp-symmetron-density-screen-2026-09-06.py`; the companion JSON records twelve density/mu cases and the illustrative point. Four unit/scale consistency checks pass. The loop power-counting argument is analytic; no numerical loop amplitude, UV coefficient or experimental acceptance has been fabricated. S1 and the user goal remain active.
