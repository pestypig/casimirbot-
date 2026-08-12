# Casimir-DP Stage-4.2S retarded-source propagation report

**Run:** `casimir-dp-retarded-source-propagation-stage4-2s-v1-20260810T180000000Z`  
**Evidence:** analytic and synthetic ordinary-electromagnetic recovery only  
**Claim ceiling:** retarded-source ordinary-null contract and software recovery only

## Result

The software contract is `pass`; ordinary-null integration is `not_authorized`. The analytic radiation, causality, transversality, current-conservation, energy-flux, distance-scaling, and polarization recoveries pass. All 7 same-apparatus empirical authorities remain absent, so no physical pilot or residual attribution is authorized.

## Retarded propagation recovery

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2s-retarded-radiation-field -->
$$
\mathbf E_{\rm rad}(\mathbf r,t)=\frac{q}{4\pi\epsilon_0c^2R}\,\hat{\mathbf n}\times[\hat{\mathbf n}\times\mathbf a(t-R/c)].
$$

The benchmark field amplitude is 1.6021766348722553e-10 V/m, its retarded delay is 3.3356409519815207e-10 s, and doubling distance halves the amplitude. Numerical angular integration recovers the Larmor power with relative error 2.574078182646336e-16. The transverse-field error is 0, current-conservation residual is 0, and circular-basis projector error is 2.220446049250313e-16.

## Propagation-scale audit

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2s-propagation-scale -->
$$
kL=\frac{2\pi fL}{c}.
$$

| source | evidence class | frequency (Hz) | kL | regime |
| --- | --- | ---: | ---: | --- |
| boundary_modulation_fundamental | frozen_design_frequency_only | 0.5 | 8.383380087806728e-13 | quasistatic_candidate |
| boundary_switching_edge_benchmark | synthetic_recovery_benchmark | 1000 | 1.6766760175613455e-9 | quasistatic_candidate |
| rf_control_benchmark | synthetic_recovery_benchmark | 1000000 | 0.0000016766760175613454 | quasistatic_candidate |
| optical_readout_benchmark_1550nm | synthetic_recovery_benchmark | 193414489032258.06 | 324.2934352092689 | retarded_wave |

The frozen 0.5-Hz boundary label gives kL=8.383380087806728e-13; the 1550-nm synthetic optical benchmark gives kL=324.2934352092689. The former is deeply quasistatic by geometric retardation alone, while the latter requires wave propagation. Neither classifies unmeasured switching edges, material relaxation, or transfer functions.

## Ordinary response in complex-coherence space

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2s-green-to-coherence -->
$$
E_i(\mathbf r,\omega)=i\mu_0\omega\int d^3r'\,G^{\rm ret}_{ij}(\mathbf r,\mathbf r',\omega)J_j(\mathbf r',\omega),\qquad C_0=C(0)e^{i\Phi_{\rm EM}-\chi_{\rm EM}}.
$$

The synthetic branch fixture produces ordinary nuisance vector (log magnitude, phase)=(-1.9252972766962668e-10, 1.181759250446502e-8), absorbed power 6.070237311923373e-28 W, and recoil momentum diffusion 2.88528051732268e-64 kg^2 m^2 s^-3. These numbers verify algebra only; they are not apparatus forecasts.

## Missing same-apparatus authorities

| authority | status | content addressed | gate |
| --- | --- | --- | --- |
| measured_source_current_maps_and_waveforms | absent | no | missing |
| as_built_retarded_green_tensor | absent | no | missing |
| measured_complex_material_response | absent | no | missing |
| branch_geometry_and_polarization_transfer | absent | no | missing |
| switching_edge_spectral_coverage | absent | no | missing |
| phase_loss_recoil_heating_covariance | absent | no | missing |
| independent_solver_and_energy_balance | absent | no | missing |

## Claim boundary

This campaign strengthens the ordinary electromagnetic null by requiring every time-dependent source to propagate causally into phase, contraction, recoil, heating, and covariance. It does not derive radiation from field-line pictures, modify the frozen Diósi generator, register a Casimir-to-collapse kernel, identify collapse, or establish manifold dynamics. Measured evidence and the retarded-source covariance remain `not_ready`; residual attribution and collapse identification remain `blocked`; physical viability remains `not_evaluated`.
