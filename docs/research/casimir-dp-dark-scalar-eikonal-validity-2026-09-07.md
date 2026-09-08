# Scalar eikonal trajectory and distant-impact audit

Program gate: S1. Exploratory model consistency; no physical or experimental admission.

This packet checks two open assumptions in the preceding large-phase sphere calculation using its authenticated definitions and unchanged 1 eV scalar parameters. It does not retune either experiment.

## Trajectory diagnostics

Let k=mchi v, R be the frozen sphere radius, and alpha the pairwise Yukawa coupling. The potential magnitude at the center is

V0 = (3 Q |alpha|/R) [1-(1+a) exp(-a)]/a², a=ms R.

The dimensionless wavelength diagnostic is kR. For the eikonal profile chi(t), the deflection estimate is |d chi/dt|/(kR). The derivative maximum is sampled on the 30,001-point sphere profile with the exterior analytic derivative checked at its boundary. This is an approximation diagnostic, not a rigorous all-orders error bound.

| Dark mass | Speed | kR | V0 / kinetic energy | Estimated maximum deflection |
|---|---:|---:|---:|---:|
| 40 GeV | 10 km/s | 1.86826e6 | 6.43173e-4 | 5.95860e-4 rad |
| 100 GeV | 10 km/s | 4.67065e6 | 4.06778e-4 | 3.76855e-4 rad |
| 40 GeV | 300 km/s | 5.60478e7 | 7.14637e-7 | 6.62067e-7 rad |
| 100 GeV | 300 km/s | 1.40120e8 | 4.51976e-7 | 4.18728e-7 rad |

Potential/energy and the deflection estimate scale as 1/v². Thus the included interval's lower endpoint is the stricter of these speed checks. Large accumulated phase and small trajectory bending can coexist, explaining why the previous Born approximation can fail while an eikonal description remains plausible. These checks support its regime, but do not turn numerical convergence into a certified physical error bar.

Potential magnitude equals incident kinetic energy at about 0.2536 and 0.2017 km/s respectively. This identifies a region that should not be handled by blindly extrapolating straight paths. It is not a sharp validity threshold. Neither reflection for a repulsive branch nor focusing/resonances for an attractive branch has been computed there. The earlier quadratic low-speed remainder remains conditional on the eikonal model.

## Distant-impact bound

Outside the sphere J(t)=I K0(a t), with I=integral_0^1 du u sqrt(1-u²) I0(a u). Let s=branch separation/R. For midpoint impact t>=16, both shifted branch impacts lie outside the sphere. The mean value theorem and decreasing K1 imply

|J_plus-J_minus| <= I a s K1(a(t-s/2)).

Using 1-cos(x)<=x²/2 and integrating the azimuth gives a quadratic upper integrand pi t [P I a s/J(0)]² K1(a(t-s/2))², where P is the central phase at 300 km/s. Integrating t from 16 to infinity and the full halo inverse-speed moment yields D_tail <= 7.13515e-20 for either pilot. The analytic inequality is exact within the specified real eikonal phase; its numerical quadrature and profile normalization are not interval-certified. It conservatively uses maximum transverse separation and the full velocity distribution. This addresses the omitted distant-impact contribution without claiming a bound on other material channels.

## Decision and reproduction

The distant-impact tail cannot explain the gap between the computed D near 0.00108/0.000530 and the comparator near 0.0295. Trajectory diagnostics also give no reason to replace that suppression with the invalid Born target estimate over the included speeds. Continue to treat the scalar pilot as disfavored for a forecast-sized local signal under its stated assumptions. Full low-speed scattering, external constraints, scalar stability and combined xenon response remain unresolved. This is progress on the shared-model calculation, not proof that every scalar model is excluded.

Run the companion Python script to reproduce the JSON. It authenticates the prior eikonal script and imports definitions without rerunning its integration driver. No baseline, runtime, GR module, or certificate was changed.

- `py` SHA256: `303847b06829b145cb094f11a49751b54b6d5dcfdc0f8935a9c177737509d530`
- `json` SHA256: `3f73e21d2d456607706a43438bb3dc46883e9504694fc1675afaf5cc35e1cbad`
