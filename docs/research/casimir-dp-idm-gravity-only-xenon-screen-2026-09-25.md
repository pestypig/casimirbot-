# Gravity-only xenon recoil screen at the IDM benchmark

Date: September 25, 2026. This calculation tests whether the 1.08 TeV particle used in the IDM interpretation could produce the LZ high-energy recoil through ordinary gravity alone. It is deliberately constructed as an upper-bound diagnostic; it is not an LZ analysis or a model of the ultralight star field.

## Method and assumptions

For a nonrelativistic point-mass gravitational potential, Rutherford scattering gives

`d sigma / d E_R = 2 pi (G m_chi m_A)^2 / (m_A v^2 E_R^2)`.

I integrate this above `E_R=248 keV` for `m_chi=1080 GeV` on Xe-131. The local density is set to `0.4 GeV/cm^3`, the full density is assigned to the heavy species, and the incident speed is chosen to maximize the rate kernel subject to the source benchmark's `798 km/s` cutoff. The optimum is `583 km/s`, where the kinematic endpoint is `744 keV`. I then assume a pure Xe-131 target, unit efficiency, and unit nuclear mass form factor. At these momentum transfers the last assumption is overly favorable: resolving the nucleus would suppress the rate.

## Result

The integrated gravitational cross section above 248 keV is only `1.12e-86 cm^2`, corresponding to `9.9e-47` expected events in `2.84 tonne-year` under all of the rate-enhancing assumptions above. A realistic halo speed distribution, isotope mixture, detector response, and finite nuclear form factor reduce this further. This is effectively zero for LZ.

The inference is specific: placing dark matter in a gravitational environment does not mean gravity supplies the force responsible for a detectable LZ nuclear recoil. Gravity-only detection proposals instead exploit correlated impulses on arrays of quantum-limited force sensors and target ultraheavy candidates around the Planck mass or above; that is a different observable and mass range ([Carney et al.](https://arxiv.org/abs/1903.00492)). A TeV-scale LZ interpretation needs a non-gravitational nucleus coupling, such as the IDM's electroweak inelastic interaction.

## Compatibility consequence

This closes the gravity-only explanation of the LZ recoil for the current TeV benchmark by roughly 46 orders of magnitude even before nuclear form-factor suppression. It does not rule out gravitationally bound ultralight boson stars as astrophysical structures, nor does it exclude a separate non-gravitational heavy-particle interaction. But the gravitational link cannot itself serve as the xenon scattering kernel or as a measurable Casimir-DP collision source. The two sectors need a separate, explicitly calculated coupling if they are to produce a shared laboratory signature.

Reproduce with `python -B docs/research/casimir-dp-idm-gravity-only-xenon-screen-2026-09-25.py`; the adjacent JSON stores the inputs and result. The falsifier would be a mistake in the Newtonian differential cross-section mapping or rate normalization large by more than forty orders, or evidence for a non-gravitational coupling, which would be a different model.

Status: gravity-only xenon recoil is excluded as a useful detector channel at this benchmark under the stated conservative upper-bound construction. The overall compatibility goal remains active.
