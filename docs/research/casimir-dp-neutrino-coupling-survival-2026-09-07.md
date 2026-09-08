# Shared coupling competition: production, decay and local coherence

Exploratory snapshot, September 7, 2026. This is a conditional prescribed-path screen within the previously stated kernels, not an experimental exclusion or a fitted common mechanism.

The coupling product cannot increase xenon production independently of decay. With masses fixed, define x = [(y_chi y_q)/(y_chi y_q)_reference]^2 = (r/0.02 GeV^-1)^4. Both the tree production rate and the narrow pion-slice width scale as x. Each phase-space element therefore contributes

```text
dN_surv(x,L) = dN_reference * x * exp(-L b x)
b = Gamma_slice_reference/(hbar c beta_gamma).
```

For every b>0 and L>0, x exp(-L b x) <= 1/(e L b). Integrating this inequality gives a coupling-independent envelope within the assumed kernel. It allows each phase-space element its own optimal x, so it is conservative relative to requiring one common coupling. It is not a QCD-qualified bound once the conditional width or its scaling law is changed.

We separately scan the DUNE range below 10 TeV and the NuFlux range above 10 TeV through 100 PeV. Local maxima found on a logarithmic scan are refined numerically; the result is called the best located rate, not an analytical proof of a unique global optimum. The pointwise envelope is independent of that search. The domains retain their differing angular coverage and high-energy propagation limitations. Their separate optima must not be treated as one shared parameter set.

For a **hypothetical 1 cm flight requirement**, true recoils 202–269.9 keV and 2.84 tonne-year normalization:

| m_chi / m_phi (GeV) | Best located low-range surviving count | Low-range envelope for all x | x at best located rate | Local D upper at the same x |
|---|---:|---:|---:|---:|
| 1 / 1 | 4.42638e-5 | 4.66122e-5 | 0.00251196 | 2.42359e-25 |
| 1 / 10 | 6.08058e-5 | 6.40332e-5 | 0.00310831 | 6.15708e-24 |
| 2 / 10 | 9.71903e-7 | 1.01498e-6 | 0.00263137 | 2.46497e-24 |

The corresponding r values are 0.0044775, 0.0047224 and 0.0045298 GeV^-1. Equal Yukawa values are recorded in the JSON; no constraint fit or relic-density claim is made. The local column multiplies the archived DUNE independent-carbon upper estimate by the **same** x, preserving the canonical mass, separation and hold. It is not the total local response including high-energy flux, collective material effects or decay-energy deposition. The inherited four-cell boundary-independent cancellation remains applicable under its original assumptions. These numbers do not approach the frozen DP comparator, and there is no measured local residual to fit.

The separately optimized high-energy counts are at most 1.85e-16, with envelopes at most 1.91e-16. Their optimal x values differ from the low-energy optimum. Even summing the two domain envelopes remains below 6.404e-5 for these three prescriptions, but that sum describes a piecewise diagnostic using two sources, not a calibrated physical flux. The horizon gap, Earth transport, astrophysical component and energies beyond 100 PeV remain absent.

There is an exact rescaling within this prescription: changing L by a factor k changes optimal x and the best attainable count by 1/k. The numerical implementation verifies the count relation at L and 2L. Thus the envelope is ten times larger for 1 mm and ten times smaller for 10 cm. It diverges as L tends to zero; it cannot exclude near-boundary production or stand in for an actual geometry average.

Implication for prioritization: the **escaped-chi** explanation of an isolated recoil is now a low-priority detectable-bridge candidate for these masses and assumptions, even after allowing the common coupling to vary. This conclusion is narrower than excluding the microscopic interaction. Events with chi decay inside xenon still require daughter transport and reconstruction. The scalar-pion form factor retains its unresolved full uncertainty, and additional interactions could invalidate the simple x scaling. A detector selection need not demand a fixed flight length.

Four numerical checks pass: path scaling, the analytic envelope exceeding located maxima, optima away from scan boundaries, and joint energy/recoil quadrature refinement. The script loads hash-pinned parent definitions without rewriting their outputs. Ordinary research-document validation applies; no certificate or shared-model validation is claimed.

Next best work is to compare this restricted outcome with the other shared-interaction candidates, while keeping decay-cascade acceptance as the remaining route for this branch. Do not continue tuning the coupling to force a percent-level coherence match.
