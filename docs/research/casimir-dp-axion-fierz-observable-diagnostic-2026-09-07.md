# Finite-revision flavor check and conditional observable scale

Exploratory snapshot, September 7, 2026. Previous turn supplied conditional NDR evolution. This packet checks a relevant finite-renormalization flavor structure and converts the coefficient using the dated comparison ledger. It does not claim a new exclusion or completed UV prediction.

## Finite-revision check

[Dekens–Stoffer v3, section 4.2](https://arxiv.org/pdf/1908.05295) explains that the revised tree-level Fierz-evanescent treatment contains finite renormalizations. For vector insertions, the one-particle-irreducible four-point contribution vanishes at b_ev=1, while penguin contributions remain. The installed library uses bEvan=1.

For a **single** QCD/QED penguin insertion with a flavor-diagonal produced current, the possible down-quark flavor tensors have the form

`b0 delta_ij A_kl + b1 delta_kl A_ij + b2 delta_il A_kj + b3 delta_kj A_il`.

For i=k=s and j=l=d, every displayed Kronecker delta is zero. The reverse orientation also vanishes. The [script](casimir-dp-axion-fierz-observable-diagnostic-2026-09-07.py) verifies this symbolically for arbitrary A and b coefficients. This supports absence of this single-insertion penguin revision in the local Delta-S=2 channel. It does not prove that every source-version difference is covered, or exclude bilocal double insertions, UV scheme corrections, or other interactions.

## Conditional observable scale

Using the preceding Im C_hat=1.59898740725e-15 GeV^-2 and the PL-current convention,

`Im M12_NP = Im C_hat fK^2 mK Bhat/3 = 4.902649368e-18 GeV`;

`|epsilon_NP| = kappa |Im M12_NP|/(sqrt(2) Delta mK) = 9.154307935e-4`.

This is **41.09%** of the dated measured magnitude 0.002228, and **9.23% below** the previous approximate NP estimate 0.0010085201023. It is not the predicted total epsilon_K: the SM amplitude and phase must be combined consistently, rather than adding magnitudes. The established opposite-sign concern in the original phase convention is not resolved by this reduction.

The retained comparison inputs are mK=0.497611 GeV, fK=0.1557 GeV, Bhat=0.7625, kappa=0.92 and Delta mK=3.484e-15 GeV. [FLAG 2021](https://arxiv.org/abs/2111.09849) is the dated source for the bag-parameter/decay-constant ledger. The fK number is a charged-kaon proxy here; no neutral-kaon/isospin conversion or fresh global input update has been supplied. A newer [FLAG 2024 review](https://arxiv.org/abs/2411.04268) exists and must be assessed before presenting this as a current precision comparison.

## Evidence and next step

[JSON](casimir-dp-axion-fierz-observable-diagnostic-2026-09-07.json) records the authenticated upstream coefficient, all numeric assumptions, symbolic zeros and normalization check. The root-leaf documentation check passes separately. No frozen microscopic or apparatus parameter is retuned.

The calculation now reaches an observable scale and still indicates substantial flavor tension at the reference point. Next update the neutral-kaon input ledger and test parameter dependence with the consistent pipeline, retaining the incomplete UV matching as a separate limitation. Do not turn this single-point magnitude into an allowed region, experimental exclusion or shared-cause claim.

The xenon/coherence prediction and model-admission status are unchanged. Shared-scattering goal remains active.
