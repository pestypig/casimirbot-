# NDR higher-order evolution and convention audit

Exploratory snapshot, September 7, 2026. Previous turn supplied LO thresholded running. This packet checks the relevant evanescent convention and computes a conditional NLO low-energy factor.

## Convention evidence

[Dekens–Stoffer, Eq. 4.7](https://arxiv.org/pdf/1908.05295) uses a same-chirality three-gamma reduction with coefficient 4(4-b_ev epsilon). The installed library sets bEvan=1. [Buras–Misiak–Urban, Appendix A](https://arxiv.org/pdf/hep-ph/0005183) subtracts (16-4 epsilon) times the VLL operator. These coefficients agree. The latter source's Eq. 2.21 gives gamma0=4 and gamma1=-7+4nf/9 for three colors.

This checks the relevant three-gamma convention, not every finite term. Dekens–Stoffer v3, section 4.2, reports revised finite renormalizations from tree-level Fierz-evanescent insertions. The installed implementation's coverage of that revision and its consequence for this flavor channel still require a targeted audit. No additional finite conversion is invented here.

## Conditional NLO result

Using the same weak coefficient, alpha_s(162.6)=0.108 and bottom/charm thresholds 4.18/1.3 GeV, the NDR NLO RGI/weak factor is **0.57630633597**, compared with the previous LO factor 0.59038581915. The conditional imaginary RGI coefficient is **1.59898740725e-15 GeV^-2**.

This factor is derived from the low-energy evolution rather than copied from the earlier approximate heavy-box eta. Its numerical proximity to that old factor does not validate the old use across the full high-energy interval.

For each nf, beta0=11-2nf/3, beta1=102-38nf/3, a=gamma0/(2 beta0), and

`J = gamma0 beta1/(2 beta0^2) - gamma1/(2 beta0)`.

The fixed-nf coefficient factor is `(alpha_h/alpha_l)^a [1+J(alpha_l-alpha_h)/(4 pi)]`. In the three-flavor EFT, `C_hat=C alpha^(2/9) [1-J3 alpha/(4 pi)]`, where **J3=307/162**. All bracket products are expanded only through NLO. The corresponding Bhat convention has the opposite powers/signs, so their product matches C(mu)B(mu) to this order.

## Checks and scope

The [script](casimir-dp-axion-ndr-qcd-evolution-2026-09-07.py) authenticates the preceding weak coefficient and uses two-loop alpha evolution. [JSON](casimir-dp-axion-ndr-qcd-evolution-2026-09-07.json) contains the threshold ledger and 2/3/4 GeV results. A symbolic derivative check cancels through alpha^2; the standard J3 value is reproduced; and the explicitly truncated RGI factor is independent of the final hadronic scale. The latter cancellation is a consistency property of this construction, not evidence that unknown higher orders vanish. The root-leaf documentation check passes separately.

Alpha and C are continuous at the chosen thresholds at this order. No NNLO decoupling or complete higher-order UV matching is supplied. The weak boundary still has the prior restricted UV/input assumptions. This packet therefore does not issue a precision epsilon_K value or revised exclusion.

Next audit the relevant finite Fierz-renormalization terms and align the numerical hadronic input, then carry out the conditional observable conversion with the full approximation ledger. The xenon/coherence predictions and model admission remain unchanged; the goal stays active.
