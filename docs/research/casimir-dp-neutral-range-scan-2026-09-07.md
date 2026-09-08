# Longer-range mediator test at fixed products

Exploratory family sensitivity, 2026-09-07. These mass variations are not refitted xenon models or experimentally allowed points.

Hold the leading two-mediator products fixed, retain the heavy 1 GeV mediator, and vary the light mediator from 1 keV toward zero mass. Use the arbitrary-neutral-cell elastic envelope, rms electron distance <=0.1 nm, maximal N² positional coherence, the direction-independent branch bound, and q<=qBZ.

| Light mediator mass | Conditional elastic exponent envelope |
|---|---:|
| 1000 eV | 1.33248e-6 |
| 100 eV | 4.93502e-6 |
| 10 eV | 8.66127e-6 |
| 1 eV | 1.21833e-5 |
| 0.1 eV | 1.32297e-5 |
| Formal massless limit | 1.32688e-5 |

A continuum bound, not merely the discrete scan, follows from |A(q)| <= |alpha_light|/q² + |alpha_heavy|/(q²+m_heavy²) for every nonnegative light mass. Integrating that amplitude envelope gives D<=1.32687854e-5, about 2224 below the frozen comparator. The q->0 integral is finite: squared neutral charge bound contributes q², the branch bound contributes q², the squared massless propagator contributes q^-4, and phase-space measure contributes q dq. Thus the integrand vanishes linearly rather than diverging.

The numerical integration splits at the branch-bound saturation point and light-mass scale. Every scanned signed-amplitude result lies below the absolute-amplitude continuum envelope. Frozen geometry/products are asserted through the reused initialization. The massless endpoint is a formal kernel limit, not a completed microscopic theory.

Simply lowering mediator mass cannot make this neutral elastic channel reach the comparator at these products and incoming density. This conclusion does not extend the earlier inclusive all-channel bound to every new mediator mass: that bound has different mass dependence. Omitted inelastic response, nonneutral charge structure, changed coupling strengths, different operators and supplied slow populations remain separate possibilities. Any actual new mass point requires a fresh xenon normalization and external-constraint assessment; none is silently promoted here.

Next mechanism selection should require a concrete way to change the neutral charge coupling or supply phase space, rather than another light-mass scan of this same elastic kernel. The original diamond geometry and separate primary/control observables remain fixed.

    python docs/research/casimir-dp-neutral-range-scan-2026-09-07.py

Research-only diagnostic and documentation; no Casimir server verification applies.
