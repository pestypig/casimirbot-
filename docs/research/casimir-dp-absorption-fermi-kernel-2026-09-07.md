Program gate: S1 — common-interaction screening.
Workstream: Absorption incoherent-channel normalization.
Capability or component: On-shell vector nucleon kernel averaged over a Fermi gas.
Current maturity: Exploratory calculation.
Target maturity: Reproducible conditional primary-rate diagnostic.
Required frozen inputs: 247 MeV particle, 11.5 TeV coupling scale, archived target counts and canonical hold.
Required evidence: Exact kinematic limits, invariant amplitude, phase space and blocking checks.
Stop/fail criteria: No identification of a primary nucleon interaction with an accepted detector event.
Explicit non-goals: No spectral-function fit, binding-energy model, transport, external exclusion or baseline change.
Downstream gate unlocked: A normalized kernel is available for subsequent nuclear-response work.

# Incoherent absorption kernel

The preceding turn made progress by reproducing the literal source form factor and exposing numerical differences from its quoted xenon estimate. This packet starts the missing nucleon channel from an independently normalized phase-space integral. It does not resolve those differences by adjusting the shared coupling.

[Ge and Titov, equations 2–8](https://arxiv.org/html/2405.05728), provides the normalized Fermi sphere, isotope-dependent proton/neutron Fermi momenta, exact outgoing-energy limits and vector amplitude. Its equation 7 makes explicit that the relative speed cancels in the rate. Section III implements Pauli blocking by requiring final nucleon momentum above the Fermi momentum and cautions that this idealized prescription can overestimate blocking. We implement these ingredients with on-shell nucleons and no separation energy.

## Calculation and interpretation

Let E=sqrt(M^2+p^2), E'=M+T, w=m+E-E', H=mE+m^2/2, and M=0.939 GeV for both nucleon species. The invariant amplitude is 4B/Lambda^4, where B=m[H(E+E')-w(mE'+M^2)]. Dividing its phase-space rate by sigma0=m^2/(4 pi Lambda^4) gives

`d(sigma v)/dT / sigma0 = B/(2 m^3 E p)`.

Integrate over the exact two-body T interval and normalized radial weight 3p^2/pF^3. For the blocked calculation, replace its lower T endpoint by max(Tmin,sqrt(M^2+pF^2)-M). Four-point Gaussian integration handles the polynomial T integrand, and adaptive quadrature handles the radial integral and blocking threshold. Physical rates multiply the result by (rho/m)c sigma0 with the same density 0.3 GeV/cm^3 and coupling used for coherent xenon and local carbon.

| Diagnostic | Xe primary interactions, 2.84 t yr | Local encounters in 0.25 s | Conditional local D <= 2N |
|---|---:|---:|---:|
| Unblocked on-shell Fermi gas | 180.519 | 1.53991e-25 | 3.07982e-25 |
| Hard Pauli-blocked Fermi gas | 104.276 | 1.07236e-25 | 2.14471e-25 |

Both rows sum proton and neutron contributions with natural isotope abundances. These are alternatives within the stated idealization, not a statistical interval or rigorous bounds on real nuclei. In particular the unblocked row does not implement a nuclear incoherent form factor. Neither includes removal energy, correlated spectral strength, intranuclear rescattering, nucleon form factors beyond the point vector current, neutron capture, quenching or event cuts. The count is a primary nucleon-interaction diagnostic, not an authenticated nuclear-breakup yield. No KamLAND event count or exclusion is inferred.

The exact stationary free-nucleon rate is 0.819986 times sigma0 at this mass. Thus using the heavy-nucleon leading rate uncritically would already miss an approximately 18% correction in this limit. This matters for normalizing a future carbon spectral-function calculation, even though it cannot make the computed local encounter rate appreciable.

The local Poisson relation D<=2N is conditional on an unconditioned independent-encounter description. A destructive event may instead remove a run from the observed ensemble. Postselection, heating and material response require explicit treatment. Do not add these rates to coherent nuclear rates as a claimed complete answer: the real nuclear response must partition elastic and inelastic channels consistently. No boundary-dependent residual follows from a homogeneous incident flux with unchanged branch histories.

## Validation and next decision

The [script](casimir-dp-absorption-fermi-kernel-2026-09-07.py) and [JSON](casimir-dp-absorption-fermi-kernel-2026-09-07.json) record species-level results. Four checks pass: the small-initial-momentum integral matches an independently evaluated stationary-target phase-space expression; the heavy-nucleon limit tends to sigma0; Pauli blocking lowers each rate; tighter adaptive tolerances change blocked rates by less than 7e-10 relatively. The hash-checked loader executes archived definitions without rewriting their outputs. `npm run validate:physics:root-leaf` passes; no certificate or physical-validation claim applies.

Next: add an authenticated carbon removal-energy/spectral-function prescription to this normalized kernel, then propagate outgoing neutrons through a documented detector-response matrix. A free or on-shell nucleon calculation cannot substitute for that matrix. Absorption remains an exploratory shared-model branch with a negligible local signal in the calculations completed so far.
