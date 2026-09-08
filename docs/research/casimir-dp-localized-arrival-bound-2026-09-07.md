# Localized interaction: arrival-rate ceiling

Date: 2026-09-07. Conditional eikonal bound; not a universal scattering theorem.

The repository already contains compact-composite and loose-composite breakup intakes. Before choosing another composite model, impose a coupling-independent arrival test. In straight-line elastic eikonal scattering, the decoherence cross section is integral d^2b [1-cos(chi(b)-chi(b+d_perp))]. Suppose the impact phase vanishes outside a disk of radius b_max. The integrand vanishes outside the union of two translated disks, whose area is at most 2 pi b_max^2. Since 1-cos<=2, sigma_dec<=4 pi b_max^2 and D<=4 pi (rho/M) v t b_max^2.

This deliberately loose bound does not require a small phase or Born scattering. With Poisson incident objects it bounds the ensemble coherence exponent, not a guarantee of repeatable observations in individual shots. The union bound remains valid for every branch orientation. It is a necessary condition, not a sufficient construction of a phase profile saturating it.

For the frozen sphere and hold, rho=0.3 GeV/cm^3 and v=776 km/s:

| Object mass (GeV) | D ceiling if b_max=R_sphere | Necessary b_max for theoretical DP comparator |
| ---: | ---: | ---: |
| 100 | 5.58344e-4 | 2.00876 micrometres |
| 1e5 | 5.58344e-7 | 63.5227 micrometres |
| 1e8 | 5.58344e-10 | 2.00876 millimetres |

The frozen radius is 0.276302 micrometres. Even saturated localized scattering of 100 GeV particles cannot reach D=0.02951146 within this impact-support assumption. Increasing composite mass reduces object flux, so increased constituent charge is not by itself enough. An extended composite, long-range force, or changed population must supply a correspondingly larger effective footprint or flux.

An exponential Yukawa tail is not compactly supported. Do not set b_max equal to the Compton wavelength and call the result rigorous: split the impact integral into an interior and an explicitly bounded tail. Wave scattering outside the eikonal regime, absorption and correlated arrivals require their own treatment. The present bound does not exclude those alternatives or the previously studied long-range B-L phases.

Decision: use this as an early necessary-condition screen for localized heavy-particle/composite leads. A new compact interaction that only raises its coupling cannot meet the theoretical comparator at the standard flux once it already saturates its footprint. This focuses further work on a quantitatively justified extended footprint or another population, subject to laboratory, transport and shared-xenon normalization constraints. The comparator remains a forecast rather than measured sensitivity; no shared model is validated.
