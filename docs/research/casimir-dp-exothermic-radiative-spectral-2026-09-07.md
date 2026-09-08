# Spectral connection for the radiative transition

Exploratory snapshot, September 7, 2026. Supplies the connection between a vector decay calculation and the off-shell excited-state process. No exact radiative lifetime is claimed.

[McDermott, Patel and Ramani](https://arxiv.org/pdf/1705.00619) calculate the finite-electron-mass vector-to-three-photon width and provide six large-electron-mass expansion coefficients in Table I. Their equations 9–10 normalize these to the Euler–Heisenberg width. The paper reports that the truncated series loses accuracy near the electron-pair threshold. These coefficients are an input to a diagnostic, not a certified remainder bound.

## Derived convolution

Let GammaV(sqrt(s)) be the width of a hypothetical vector of invariant mass sqrt(s), coupled to the electron current with ge. The inclusive conserved-current tensor is proportional to the transverse projector; its coefficient is `2 sqrt(s) GammaV/ge²`. Contracting it with the leading heavy dark transition current and factoring the two-body phase space gives

`dGamma_chi/ds = Ce²/(2 pi²) (Delta²-s)^(3/2) GammaV(sqrt(s))/(ge² sqrt(s))`.

Here Ce is the electron contact coefficient, constant over the integration range. The formula assumes Delta much smaller than the dark mass, a heavy mediator, and an inclusive final-state sum. It does not include other transition operators or momentum-dependent mixing. Substitution of `GammaV/ge²=sqrt(s)/(12pi)` recovers the massless electron-pair width `Ce² Delta^5/(60pi³)` and checks the normalization.

For the three-photon series, GammaV/sqrt(s) is proportional to `s^4 sum_k c_k(s/me²)^k`. The integrated kth correction relative to its leading term is

`c_k (Delta/me)^(2k) B(5+k,5/2)/B(5,5/2)`.

This weights the whole invariant-mass range; evaluating the vector correction solely at sqrt(s)=Delta is incorrect.

## Diagnostic results

The [script](casimir-dp-exothermic-radiative-spectral-2026-09-07.py) evaluates the analytic moments and independent quadrature, retaining the massless pair normalization check. The initial normalization check exposed insufficient default absolute quadrature tolerance; explicitly tightening it resolves the check without changing the formula.

| Mass | Integrated six-correction sum / leading term | Last retained correction | Endpoint-only sum |
|---|---|---|---|
| 40 GeV | 5.7091 | 0.3022 | 14.6987 |
| 100 GeV | 1.4930 | 0.0002211 | 1.8518 |

[JSON](casimir-dp-exothermic-radiative-spectral-2026-09-07.json) records every term. The 100 GeV sequence decreases quickly, while the 40 GeV sequence still has substantial terms. Neither sequence alone bounds the remainder. The sums must not be called exact lifetime corrections or used to claim population survival.

This supplies an implementable route to the finite-mass decay: obtain the authenticated full vector width as a function of invariant mass, divide out its electron coupling convention and apply this kernel. Compare the full result to these moments before propagating survival into both target rates. Baryonic/hadronic loops, neutrino couplings and other UV transition channels remain separate requirements.

Checks pass; root-leaf documentation validation is separate. Frozen apparatus and current model-admission status remain unchanged. Goal active.
