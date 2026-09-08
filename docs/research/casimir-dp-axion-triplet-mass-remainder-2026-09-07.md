# Triplet finite remainder: mass dependence

Exploratory snapshot, September 7, 2026. Previous turn narrowed the qq comparison to a finite triplet remainder. This packet identifies a candidate function for that remainder on the symmetric mixed probe, without updating the physical model.

## Result

For Cqq3_1133=Cqq3_3311=amplitude/2 in the up basis, the difference between the library's explicitly mt-dependent terms and the selected matching is numerically reproduced by

`delta H_sd = [g2^2/(16 pi^2)] amplitude Pt_sd Pu_sd [2 x ln(x)/(x-1)]`,

where x=mt^2/MW^2. Across eight masses (120, 162.6, 173, 207, 250, 400, 600 and 1000 GeV) and three matching scales (80.379, 173 and 300 GeV), the maximum relative complex error is **2.47e-11**. The 207 and 600 GeV points were added after recognizing the candidate function. Scale independence and phase alignment also pass.

This is a tested numerical identity for the stated probe, not a symbolic general-flavor derivation. No coefficient was fitted independently at either experimental target.

## Interpretation

The function grows as 2 ln(x) at large x, rather than as x. With the displayed prefactor, the remainder tends to zero as g2^2 ln(1/g2^2) when g2 tends to zero at fixed v and mt (MW=g2 v/2). Its scaling is therefore consistent with a subleading electroweak contribution rather than a missing leading yt^2 term.

[Endo, Kitahara and Ueda](https://arxiv.org/pdf/1811.04961), text following Eq. 2.32, explicitly describe omitting O(g^2) contributions in their selected approximation. This supports checking an approximation-scope explanation. It does not establish that our algebraic partition is gauge invariant or identify a unique omitted diagram. The broader library follows [Dekens and Stoffer](https://arxiv.org/abs/1908.05295).

At mt=173 GeV and amplitude=1e-6 GeV^-2, the imaginary remainder is 3.240218953e-13 GeV^-2, consistent with the preceding packet. This algebraic probe value is not a correction to the candidate's evolved coefficient.

## Reproducibility and next step

The [script](casimir-dp-axion-triplet-mass-remainder-2026-09-07.py) SHA-authenticates prior definitions and the library, retains its 104 additive explicit-mt Cqq3 terms, and makes only the loop mass configurable in memory. It changes the selected formula's x consistently at every mass. [JSON](casimir-dp-axion-triplet-mass-remainder-2026-09-07.json) contains all 24 comparisons. No installed or archived source is changed. Varying the mass is an algebraic test, not a pole-to-running scheme conversion. The physics root-leaf documentation check passes separately.

The non-explicit-mt library terms remain outside this comparison. Next derive the remainder symbolically for the probe, then check independent flavor tensors to determine its covariant extension and its relation to the full gauge terms. Do not add this probe-specific expression to the full model before that check. The evidence favors an approximation-scope explanation for this remainder, but full qq matching overlap is not yet established.

The xenon/coherence prediction and model-admission status are unchanged. Shared-scattering goal remains active.
