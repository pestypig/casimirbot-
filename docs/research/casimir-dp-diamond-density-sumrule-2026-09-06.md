# Density-response sum-rule ceiling

September 6, 2026. Exploratory S1 packet. Frozen configuration unchanged; no experimental fit, physical certification or full-interaction exclusion.

## New lead and result

[Barker et al., arXiv:2608.05282v1](https://arxiv.org/html/2608.05282v1), posted August 5, derives density-scattering bounds from spectral sum rules. Its equation 2 uses the all-electron plasma frequency, including core electrons. This permits a response-independent ceiling without assuming that a finite dielectric grid exhausts the response. We apply that identity to our previously normalized magnetic-dipole density kernel; the calculation below is our extension, not a magnetic-dipole result reported by that paper.

At 1 TeV, speed 776 km/s and moment 10^-6 GeV^-1, the density contribution with energy transfer **at least 5.5 eV and momentum at most 100 keV/c** has D <= 5.458e-24 within the stated nonrelativistic response model. The same moment gives about 76.82 raw full-window xenon events, yielding D/raw-Xe-count <= 7.104e-26. Normalizing instead to the approximate 200–270 keV xenon window gives <= 3.386e-22 per raw event. This remains far below the frozen DP comparator 0.0295115.

This ceiling includes energy transfers above the archived 150 eV endpoint, up to kinematic allowance, and momenta between its 74.616 keV/c endpoint and the stated cutoff. It is a ceiling on the entire stated region, not a correction to add to the grid answer. Neither unmeasured spectral strength nor numerical integration error can fill the enormous gap *inside this conditional region*. No conclusion about all electronic channels follows.

## Bound derivation

Let L(q,w) = Im[-1/epsilon(q,w)] >= 0 and B = pi omega_p²/2. For the all-electron nonrelativistic density response, integral w L dw = B. Twelve electrons per two-carbon unit cell in the authenticated archive give omega_p = 38.1877 eV.

The preceding packet's rate integral is I = integral q dq dw K(q,w)L(q,w), where

`K = v² - w/m_chi - w²/q²`.

This follows by cancellation of the q²/(4m_chi²) term against its counterpart in v_perp². The domain still requires v_perp² >= 0; K alone is not the kinematic admission condition.

For w >= g = 5.5 eV, `K/w = v²/w - 1/m_chi - w/q²` decreases strictly with w. Positivity and the f-sum rule therefore give

`I <= B [(v²/g - 1/m_chi)(Q²-q_-²)/2 - g ln(Q/q_-)]`,

where `q_- = 2g/[v+sqrt(v²-2g/m_chi)]`, `q_+ = m_chi[v+sqrt(v²-2g/m_chi)]`, and `Q = min(q_cut,q_+)`, for Q > q_-. Extending the energy integral to infinity only enlarges the upper bound. Multiply by the same rate prefactors as the prior density packet, then apply D <= 2N. No static-dielectric-sign assumption or fitted oscillator distribution is needed.

The 5.5 eV value defines the region being bounded. It is **not** an assertion that all electronic, defect, surface or coupled lattice responses vanish below that energy.

## Limits and checks

The script reports cutoff cases 74.616 and 100 keV/c plus a deliberately labeled formal all-q nonrelativistic extension. For 1 TeV the formal endpoint is 5.177 GeV/c, outside the controlled electronic nonrelativistic regime. Its number must not be promoted to a physical all-q exclusion. Even 100 keV/c is a stated nonrelativistic cutoff choice, not an exact relativistic guarantee; corrections require separate matching. The future high-q calculation must use a suitable relativistic response or justified bound.

The archived 0–150 eV data consume at most 69.952% of the all-electron f-sum budget at any tabulated momentum. There is no overshoot in this diagnostic. This neither validates the entire dataset nor licenses subtracting the tabulated weight from an exact budget without its systematic error. The ceiling conservatively uses the whole budget.

Four checks pass: positive partial spectral moments, absence of f-sum overshoot at the specified tolerance, independent log-coordinate quadrature of the analytic ceiling, and the ceiling exceeding the prior finite-grid integral. The script authenticates its prior numerical input and dielectric archive. Run `python docs/research/casimir-dp-diamond-density-sumrule-2026-09-06.py`; results are in the companion JSON. No previous result-producing script is executed.

The next useful branches are below-threshold response, electronic transverse-current/spin and mixed terms, and high-q relativistic matching. Shared halo/detector folding, external constraints, survival and the boundary-controlled observable remain necessary before model admission. S1 and the user goal remain active.
