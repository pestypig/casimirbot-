# Casimir-DP Stage-4.2D cross-scale recovery and field-metrology report

**Run:** `casimir-dp-cross-scale-metrology-stage4-2d-v1-20260728T193200000Z`  
**Evidence class:** `synthetic_fixture`  
**Claim ceiling:** `spectroscopic_field_metrology_and_classical_gravity_recovery_only`  
**Campaign gate:** `pass`  
**Observable bridge edges added:** `0`

## Result at a glance

Stage 4.2D establishes a runnable calibration and recovery ladder. It does not add evidence for DP collapse. Stark, Zeeman, and blackbody dynamic-Stark relations are admitted only as apparatus field-to-frequency transfers. Schwarzschild compactness, potato radius, and Jeans length are admitted only as conventional-gravity recovery checks. The frozen Stage-4.2C mass-density DP generator remains unchanged.

## Spectroscopic field-metrology projection

- Zeeman shift: `699812.2458528455 Hz`; response `13996244917.056908 Hz/T`.
- Circular-pair separation: `1399624.491705691 Hz`.
- Static Stark shift: `-1 Hz`; response `-0.02 Hz/(V/m)`.
- Blackbody dynamic-Stark shift: `-0.0001539 Hz`; response `-0.000002052 Hz/K`.
- Response-to-complex-coherence transfer: `not_ready`.

These are synthetic design-coefficient projections. The empirical feasibility pilot must measure transition-specific response coefficients, field uncertainties, drift, covariance, and the apparatus-to-coherence transfer before these witnesses can populate the Stage-4.2C measured control vectors.

## Classical-gravity recovery ladder

- Solar Schwarzschild radius: `2953.3393820668784 m`; compactness `0.000004245133508792408`.
- Selected-object compactness: `1.0448945505816126e-36`.
- Material-strength crossover radius: `239.2284491356108 km`.
- Jeans length: `0.0675239984974372 pc`; Jeans mass `0.9215325684740843 solar masses`; free-fall time `3377187733453.6787 s`.

These quantities show when self-gravity dominates a competing scale—relativistic escape, material yield, or pressure support. They do not show gravity turning on, and they do not define a DP threshold.

## Equation congruence and non-bridge rule

| Relation | Class | DP-rate admission |
|---|---|---:|
| `electric_field_to_stark_frequency` | `sourced_calibration_transfer` | no |
| `magnetic_field_to_zeeman_frequency` | `sourced_calibration_transfer` | no |
| `blackbody_field_to_dynamic_stark_frequency` | `sourced_calibration_transfer` | no |
| `maxwell_and_curvature_spinors` | `representation_equivalence` | no |
| `mass_radius_to_schwarzschild_compactness` | `classical_gravity_recovery` | no |
| `yield_strength_to_potato_crossover` | `classical_gravity_recovery` | no |
| `pressure_support_to_jeans_crossover` | `classical_gravity_recovery` | no |
| `branch_density_difference_to_dp_rate` | `frozen_hypothesis_transfer` | yes, frozen DP lane only |

The optimization rule is to prefer measured, sourced transfers closest to the apparatus; use cross-scale equations to test constants, dimensions, limiting behavior, and language; and keep every collapse inference blocked unless a separately registered dynamics kernel predicts the held-out coherence signature.

## Spinor boundary

Penrose spinors represent relativistic fields and curvature. They are not mass objects and do not supply a Maxwell-to-collapse law. Penrose's 1960 spinor paper explicitly attempts no quantization; the 1996 objective-reduction proposal is instead expressed through the gravitational self-energy of differing mass distributions.

## Fixture and scientific standing

- Fixtures passed: `10/10`.
- Algebraic maximum relative error: `1.9081958235744914e-15`.
- Spectroscopic response authority: `not_ready`.
- Physical pilot readiness: `not_ready`.
- Measured evidence: `not_ready`.
- Collapse identification: `blocked`.
- Manifold dynamics: `blocked`.
- Physical viability: `not_evaluated`.

## Sources and support boundaries

- [A spinor approach to general relativity](https://doi.org/10.1016/0003-4916(60)90021-X)
  - Supports: Spinor representation of curvature and source-free electromagnetism; the paper explicitly attempts no quantization.
  - Does not support: Mass as a spinor, a Maxwell-to-collapse transfer, or objective reduction.
- [On Gravity's role in Quantum State Reduction](https://doi.org/10.1007/BF02105068)
  - Supports: A proposed lifetime of order hbar over the gravitational self-energy of the difference between two mass distributions.
  - Does not support: Schwarzschild-horizon formation or a Casimir-boundary modifier.
- [A universal master equation for the gravitational violation of quantum mechanics](https://doi.org/10.1016/0375-9601(87)90681-5)
  - Supports: A mass-distribution-dependent gravitationally motivated coherence-damping model.
  - Does not support: A spectroscopic, spinor, blackbody, Jeans, potato-radius, or Schwarzschild transfer into the collapse rate.
- [NIST Atomic Spectroscopy: Zeeman Effect](https://www.nist.gov/pml/atomic-spectroscopy-compendium-basic-ideas-notation-data-and-formulas/atomic-spectroscopy-zeeman)
  - Supports: The weak-field energy shift Delta E equals g M mu_B B and polarization-resolved Zeeman spectroscopy.
  - Does not support: Gravity-related collapse or a DP response.
- [Electromagnetically induced transparency based Rydberg-atom sensor for traceable voltage measurements](https://doi.org/10.1116/5.0097746)
  - Supports: Stark spectroscopy as an electric-field and voltage calibration method with an uncertainty budget.
  - Does not support: A universal apparatus coefficient or a transfer from electric-field frequency shifts to collapse.
- [Experimental Verification of the Shift of the Cesium Hyperfine Transition Frequency due to Blackbody Radiation](https://doi.org/10.1103/PhysRevLett.78.622)
  - Supports: A measured dynamic Stark frequency shift caused by blackbody electromagnetic fields.
  - Does not support: A thermal or blackbody contribution to Gamma_DP.
- [The Potato Radius: a Lower Minimum Size for Dwarf Planets](https://arxiv.org/abs/1004.1091)
  - Supports: An approximately 200 to 300 km self-gravity versus material-strength shape crossover.
  - Does not support: A universal gravity-onset density or quantum-collapse threshold.
- [Unravelling the structure of magnetized molecular clouds with SILCC-Zoom](https://academic.oup.com/mnras/article/525/1/721/7222386)
  - Supports: The thermal Jeans length c_s sqrt(pi over G rho) as a pressure-support versus self-gravity scale, with magnetic extensions.
  - Does not support: A microscopic collapse law or a density at which gravity begins to exist.
- [NASA Imagine the Universe: Black Holes](https://imagine.gsfc.nasa.gov/science/objects/black_holes2.html)
  - Supports: The nonrotating Schwarzschild radius 2GM over c squared and horizon compactness.
  - Does not support: The Diósi-Penrose collapse criterion.

## Claim boundary

A successful Stage-4.2D run validates software, units, source boundaries, synthetic witness response propagation, classical-gravity recovery, and zero unsupported transfer edges. It does not measure electric or magnetic field response in the apparatus, prepare the mesoscopic superposition, measure coherence, exclude DP, identify objective collapse, establish a Casimir modifier, or establish manifold dynamics or physical viability.

