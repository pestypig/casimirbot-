# Composite quadrupole excitation: response diagnostic

Program gate: S1. Conditional hydrodynamic response, not a joint prediction or fitted spectrum.

## Source and normalization

[Hardy et al., 1504.05419v2](https://arxiv.org/html/1504.05419v2), equations 15–19 and Appendix A, quantize an incompressible uniform droplet's surface modes. With mass density rho_D, B_l=rho_D R^5/l, omega_l^2=l(l+2)(l-1) sigma/(rho_D R^3), and epsilon_l=(2 B_l omega_l)^(-1/2). The normalized ground-to-one-phonon form-factor squared is 9(2l+1) epsilon_l^2 j_l(qR)^2/(4 pi). Its degeneracy factor is already included; do not multiply by 2l+1 again. The expansion requires small amplitudes and controlled epsilon_l qR. The paper derives a scalar contact response; applying a finite mediator propagator additionally assumes factorization in Born scattering. Its illustrative figure enhances amplitudes above the hydrodynamic estimate, which we do not import as a physical prediction.

## Conditional calculation

Retain total mass 100,000 GeV, N=10,000 and radius 0.815888 fm from the previous compact benchmark. Test l=2 gaps 28, 100 and 248 keV. These are declared hypothetical spectra: each fixes a different surface tension and amplitude. They are not derived from a microscopic binding theory, and the 248 keV gap is not identified with a measured recoil energy.

| Gap | epsilon | Normalized transition F squared at 248 keV Xe recoil | Minimum incident speed |
|---|---:|---:|---:|
| 28 keV | 0.2958 | 0.00128411 | 336.73 km/s |
| 100 keV | 0.1565 | 0.000359551 | 424.48 km/s |
| 248 keV | 0.09940 | 0.000144980 | 604.85 km/s |

The corresponding elastic dark form-factor squared is 0.810540. Transition values are response factors, not rates. In particular the 28 keV epsilon is not parametrically small; these rows cannot support a precision claim without higher-order control. Surface tension and gap cannot be varied independently to amplify a transition.

At q=hbar/(250 nm), an incident speed at most 794.2 km/s supplies qv at most 0.002091 eV. Energy conservation for endothermic scattering, omega+q^2/(2 mu)<=qv, forbids exciting any of these keV modes at that momentum. This is a scale-specific statement, not a bound on the full coherence integral. High-q events can also decohere, but their rate and target response must be calculated. The elastic channel remains available at soft q.

## Decision

This surface-mode implementation gives a concrete response to investigate but does not rescue the compact benchmark: its xenon transition strength is smaller than the elastic companion at the inspected momentum, while excitation costs additional kinetic energy. No integrated inelastic exclusion is inferred, especially near elastic diffraction zeros at other radii. An excited incident population allowing de-excitation is a different model and needs occupation, decay and replenishment calculations; do not reverse the gap sign without them.

Next useful work is an inclusive transition calculation over valid radii and modes, or a genuinely different constituent-resolved/breakup model. Preserve the published amplitude-gap relation and test approximation validity before fitting any spectrum. The original measurable-overlap objective remains unmet.

Validation: the script reconstructs each gap from its inferred tension and records amplitude, kinematic and elastic-companion diagnostics. Assertions passed. No experimental sensitivity or certificate claim.
