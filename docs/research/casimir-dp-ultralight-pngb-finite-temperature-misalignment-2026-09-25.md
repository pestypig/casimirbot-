# Finite-temperature misalignment evolution for the ultralight pNGB branch

Date: September 25, 2026. Status: reproducible background-evolution screen; no charge-generation or structure calculation.

## Model and method

This refines the broad sudden-onset screen in [the initial misalignment packet](casimir-dp-ultralight-misalignment-abundance-screen-2026-09-25.md). It evolves one canonical real component `X` of the proposed `O(3)/O(2)` pseudo-Goldstone field with the harmonic potential `V(X)=m_phi^2 X^2/2`, `m_phi=1e-17 eV`, in radiation domination. The background includes a finite-temperature electron-positron equation of state and neutrinos that decouple instantaneously at 2 MeV, followed by electron-positron entropy transfer. The Klein-Gordon equation is integrated in `N=ln(a)` from 10 MeV (`H/m=4459`) until `H/m=0.01`; the late comoving scalar energy is averaged over its last oscillation and normalized to today's dark-matter density.

This avoids choosing a sudden `H=m` versus `3H=m` transition. It remains a homogeneous, quadratic-potential approximation; it does not solve the full pNGB multiplet or the radial mode.

## Abundance and BBN-era energy fraction

For `Omega_DM h^2=0.1198` and `h=0.674`, the required canonical real-field initial displacement is:

| Cosmic pNGB fraction | Initial displacement | Angle using `f=6.7e17 GeV` | Largest `rho_phi/rho_rad` among 2, 1, 0.5, 0.2, 0.1 and 0.05 MeV samples |
|---:|---:|---:|---:|
| 10% | `2.46e15 GeV` | `0.00368` | `1.47e-6` |
| 100% | `7.79e15 GeV` | `0.0116` | `1.47e-5` |

The field is frozen and subdominant at 1–2 MeV; it begins rolling into oscillations as `H` approaches its mass around 0.1–0.2 MeV. Its fraction of the radiation density remains small in this model. This is a background-energy diagnostic, not a light-element abundance or BBN likelihood. Numerical assumptions are instantaneous neutrino decoupling, no QED corrections and radiation domination.

## Conditional inflationary isocurvature check

For a light spectator present before inflation, assume `delta X=H_I/(2 pi)`, no post-inflation symmetry restoration, an uncorrelated nearly scale-invariant CDM-isocurvature mode, and that the rest of dark matter is adiabatic. For a quadratic misalignment field, `S_CDM=f_phi delta(rho_phi)/rho_phi = f_phi H_I/(pi X_i)`. Using the Planck 2018 uncorrelated CDI bound `beta_iso<0.038` and `P_zeta=2.1e-9` gives:

```text
H_I < 7.05e11 GeV  for f_phi=0.10
H_I < 2.23e11 GeV  for f_phi=1.00
```

These are conditional ceilings, not universal limits on the pNGB model. They do not apply unchanged if the symmetry is restored after inflation, the field is heavy during inflation, fluctuations are suppressed/correlated, or multiple sources modify the isocurvature transfer. Under the listed assumptions they disfavor ordinary high-scale inflation for this small-angle pre-inflationary misalignment branch; the cosmology needs a low inflationary Hubble scale or an explicit suppression mechanism. The Planck bound and assumptions are described in [Planck 2018 inflation constraints](https://arxiv.org/abs/1807.06211).

## Charge and star-formation gap

The calculation evolves a single real direction and generates **zero** conserved `U(1)` charge. It therefore supplies coherent pNGB energy but does not initialize the charged complex boson stars in the candidate model. A rotating field with nonzero charge, a kinetic-misalignment mechanism, or a neutral real-field/particle-antiparticle soliton is a separate hypothesis and needs its own abundance, perturbation and stability calculation. Nor does a homogeneous misalignment abundance establish the fraction of this field that later forms compact stars.

This is still the cleanest cold-production route found so far for the ultralight component because it bypasses the thermal IDM portals that produced hot daughters or severe naturalness tension. It adds no microscopic interaction to the IDM, xenon or Casimir-DP channels; their shared prediction remains missing.

## Reproduction

Run with Python, NumPy and SciPy installed:

```powershell
python -B docs/research/casimir-dp-ultralight-pngb-finite-temperature-misalignment-2026-09-25.py
```

The script writes the adjacent JSON, including the thermodynamic grid, temperatures, field fractions, solver settings and limitations. Its final-cycle comoving-energy scatter is about 1.1%; this is the reported numerical normalization residual. The broad sudden-onset script remains useful as an independent order-one cross-check but is superseded for the thermal-history estimate by this finite-temperature integration.
