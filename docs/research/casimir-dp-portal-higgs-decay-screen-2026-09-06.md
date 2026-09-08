# Higgs eigenmass and invisible-decay screen of the scalar portal

September 6, 2026. Conditional tree-level external-constraint screen. Earlier demonstration inputs remain an immutable example, not a frozen viable candidate. This packet neither changes the canonical apparatus nor supplies a full collider recast.

## Result

The previous illustrative point m_S=1000 GeV, b=100 GeV and kappa=1000 GeV predicts an excessive invisible Higgs signal under the explicit assumptions below. Matching the light heavy-block eigenmass to the 125 GeV benchmark gives |sin(theta)|=0.025003 and a new partial width of 49.748 MeV. With a 4.1 MeV SM-width benchmark, the new invisible branching fraction is 0.92390 and the SM-production-normalized signal is **0.92333**.

The [ATLAS Run-1/Run-2 combination](https://arxiv.org/abs/2301.10731v2) reports an observed 95% upper limit of 0.107 on invisible branching fraction under SM Higgs production. For universal production rescaling and unchanged accepted event kinematics, we compare the predicted production-normalized invisible yield to that value. This is a deliberately identified published constraint, not a claim that it is the latest or strongest available result.

The large-portal example exceeds this screen for all displayed SM-width benchmarks, 3, 4.1 and 5 MeV. The nearby b=10 GeV case is marginal and changes classification with that width choice; it must not be treated as a robust exclusion from these numbers alone. No surviving example is declared allowed by all experiments.

## Calculation and assumptions

With heavy block `A=[[m_S²,bv],[bv,m_h,0²]]`, imposing one eigenvalue m_h² fixes

`m_h,0² = m_h² + (bv)²/(m_S²-m_h²)`.

For m_h=125 GeV and the previous b=100 GeV choice, the required diagonal parameter is 127.4393 GeV. This corrects the earlier distinction between a diagonal mass input and an eigenmass; it is not a precision fit to Higgs mass data.

The light eigenstate contains an S fraction sin(theta). In the displayed portal model, and neglecting light/heavy mixing induced by a tiny phi background, its coupling to two light scalars is `g_hphiphi = kappa sin(theta)`. With interaction convention `-g_hphiphi h phi²/2`, the identical-particle decay width is

`Gamma_new = g_hphiphi²/(32 pi m_h) sqrt(1-4m_phi²/m_h²)`.

The phase-space factor is effectively one for the light scalar in this study. Let c²=cos²(theta). Assuming universal SM coupling rescaling, production and SM partial widths scale with c², giving

`B_new = Gamma_new/(c² Gamma_SM + Gamma_new)`,

`mu_invisible = c² B_new`.

The small SM invisible contribution is omitted, making this new-channel-only screen slightly weaker. Additional invisible or visible decays, new production mechanisms, or modified kinematics would need an updated treatment. Gamma_SM values are explicit stress benchmarks, not a measured width posterior.

This screen assumes the produced phi particles escape invisibly. Their detector propagation and lifetime have not been simulated. It also assumes there is no independently chosen H†H phi² amplitude cancelling the decay, and that the phi background is small enough for the two-heavy-field mixing approximation. The prior quartic scan includes large-background cases; those require the full three-field calculation before this decay formula is applied to them. Loop effects and running are not included.

## Shared-parameter consequence

At fixed b=100 GeV and the nominal width, the screen requires kappa<=99.377 GeV. In the tree matching already derived, C_chiN does not depend on kappa, whereas a_chi*a_N and Delta_lambda scale as kappa². At fixed effective light quartic, the largest corresponding light coupling product is about **0.009876 of the kappa=1000 value**. Thus this way of repairing the Higgs decay overproduction reduces the local light interaction by about a factor of 101 while leaving the direct heavy contact unchanged at this order.

Changing b instead also changes C_chiN. Adjusting lambda_eff to restore a desired light coupling increases the explicit threshold-cancellation requirement. Neither adjustment is a free independent normalization of one experiment. These statements are matching consequences, not a refit or a claim that naturalness forbids a cancellation.

The eigenmass-matched contact coefficient for b=100 GeV is 1.80177e-10 GeV^-2 with the preceding y_chi and illustrative nucleon form factor. It must still be tested against the actual xenon spectrum; the Higgs screen cannot establish an LZ explanation.

## Evidence and decision

Run `python docs/research/casimir-dp-portal-higgs-decay-screen-2026-09-06.py`. The companion JSON contains four mixing choices and three width benchmarks. Four checks pass: recovery of the chosen physical eigenmass, the zero-mixing decay limit, mixing normalization and inversion of the rate ceiling. They test the declared tree-level calculation, not the missing collider transport or likelihood.

Classify the large-portal, negligible-light-background example as failing this conditional invisible-decay screen. Keep the family exploratory, with full background/mixing, QCD/material matching, direct-detection constraints, scalar noise and radiative stability unresolved. The demonstrated shared-parameter relation remains useful even though this illustrative point fails. S1 and the user goal remain active.
