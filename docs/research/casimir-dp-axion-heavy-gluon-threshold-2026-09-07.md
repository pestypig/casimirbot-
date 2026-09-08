# Heavy-messenger CP-even gluon threshold

Exploratory calculation, September 7, 2026. This supplies concrete additional operators for the [gluon ledger](casimir-dp-axion-higgs-hadronic-ledger-2026-09-07.md), without treating a partial threshold as a full scattering amplitude.

Use the [previous messenger convention](casimir-dp-axion-messenger-threshold-2026-09-07.md): M=[[0,b],[ic,MU]], b=yL h/sqrt(2), c=yR a, and neglect the SM up Yukawa. The squared singular values satisfy t_plus+t_minus=MU²+b²+c² and t_plus t_minus=b²c². At c=0 the heavy eigenvalue is MU²+b² and the light eigenvalue vanishes.

The leading CP-even heavy-Dirac-quark threshold is proportional to (alpha_s/12pi) log[m_heavy(background)/m_heavy(vacuum)] G². Its use requires momenta small compared with the integrated-out mass. The decoupling/low-energy-theorem framework is described by [Chetyrkin, Kniehl and Steinhauser](https://arxiv.org/abs/hep-ph/9708255) and [Gillioz et al.](https://arxiv.org/abs/1206.7120). We use only the heavy eigenstate; their model-specific numerical results are not transferred.

Since d t_plus/d(c²)=MU²/(MU²+b²) at c=0,

`d log(m_heavy)/d(c²) = MU²/[2(MU²+b²)²]`.

Writing the resulting local Lagrangian as

`L = (alpha_s/pi) G² [Kaa a² + Kh h_fluctuation + ...]`,

the coefficients at h=v are

`Kaa = yR² MU²/[24(MU²+b²)²]`,

`Kh = yL² v/[24(MU²+b²)]`.

These have dimensions GeV^-2 and GeV^-1, respectively. There is no extra color multiplicity factor: the stated low-energy coefficient already refers to one color-triplet Dirac quark. Kh uses the neutral Higgs background fluctuation before the Higgs/radial mass rotation. This calculation concerns CP-even G² operators, not a claim about CP-odd anomaly operators.

At MU=2000 GeV, yL=0.20, yR=0.0032 and v=246.2 GeV:

- Kaa = 1.066020406e-13 GeV^-2.
- Kh = 1.025522526e-7 GeV^-1.
- Kh is 3.02980e-4 times the leading Higgs coefficient from one SM heavy quark.

The Kaa mixing correction relative to yR²/(24MU²) is a factor 0.99939413. The operator persists at yL=0 because the heavy state still mixes with the right-handed up field in an a background. This is different from the previously calculated mixed Higgs/pseudoscalar quartic, which requires both Yukawas. Decoupling statements here hold at fixed Yukawas, not along a trajectory that holds the effective up coupling fixed while varying MU.

## What this enables and what it does not

Kaa can enter a dark-matter loop through the two pseudoscalar couplings. Kh supplies a messenger-specific scalar exchange contribution that is absent from the SM-heavy-flavor part of f_N. Neither term should be merged blindly with an un-subtracted full-theory box calculation. A consistent next step requires the EFT diagrams, light-field normalization, the restored up Yukawa, QCD evolution and the remainder of hard matching. Loop momenta in the dark-matter subdiagram are not automatically bounded by the external nuclear recoil: the ratio m_chi/MU=0.2 also matters to the heavy-mass expansion.

Using log det(Mdag M) for both eigenstates would wrongly integrate out the light up quark. It is singular at a=0 in the current approximation and is not the analytic heavy threshold. The light state remains in the effective theory. This distinction is essential at the 1 GeV mediator scale.

The [script](casimir-dp-axion-heavy-gluon-threshold-2026-09-07.py) and [JSON](casimir-dp-axion-heavy-gluon-threshold-2026-09-07.json) record the operator convention and coefficients. Four checks pass: high-precision finite differences of the exact heavy eigenvalue, the zero-mixing limit, positive coefficients and decoupling at fixed Yukawas. The derivative error decreases to 5e-9 at the smallest step. These are matching-subset consistency checks, not a complete two-loop or phenomenological validation. Existing joint forecasts remain unchanged until assembly and subtraction are verified.
