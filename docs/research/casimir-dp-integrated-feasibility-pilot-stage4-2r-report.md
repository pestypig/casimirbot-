# Casimir-DP Stage-4.2R integrated feasibility-pilot readiness report

**Run:** `casimir-dp-integrated-feasibility-pilot-stage4-2r-v1-20260808T210000000Z`  
**Evidence:** empirical-input readiness contract only  
**Claim ceiling:** integrated pilot packet and acceptance contract only

## Decision

The executable packet contract is `pass`; the empirical feasibility pilot is `not_authorized`. 0/8 same-apparatus authority packets are ready. No absent packet is replaced by a synthetic or cross-apparatus surrogate.

## Two estimands that must not be conflated

The primary collapse comparator is the held-out contraction across mass, separation, and hold time after the frozen ordinary model is applied. For the leading apparatus, the registered Gaussian exponent is 0.029511464722144533, giving conditional visibility 0.9709197462522698 and loss 0.029080253747730156. At the registered SNR floor of 5, the one-sigma magnitude uncertainty must be no larger than 0.005816050749546031. This remains a model forecast, not measured evidence.

The boundary interaction estimator is

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2r-four-cell-cross-ratio -->
$$
R_4=\frac{C_{\mathrm{active,sep}}C_{\mathrm{reference,compact}}}{C_{\mathrm{active,compact}}C_{\mathrm{reference,sep}}}.
$$

A boundary-independent Diósi factor multiplies both separated cells and cancels: its ratio factor is 1 with numerical cancellation error 0. Thus non-unit $R_4$ tests boundary-by-superposition nonfactorization after ordinary calibration; it is not the primary standard-Diósi signal.

## Quantitative acceptance contract

<!-- helix-doc-equation-action/v1 id=cdp-stage4-2r-diosi-precision-target -->
$$
V_{\rm D}=e^{-\Gamma_{\rm D}t},\qquad
\sigma_{|C|}\leq\frac{1-e^{-\Gamma_{\rm D}t}}{\mathrm{SNR}_{\min}}.
$$

The registered phase-noise ceiling is 0.03464404998245921 rad. Relative covariance drift must not exceed 0.1 without an explicitly preregistered uncertainty propagation or redesign. Train/holdout separation, custody, and confirmatory blinding are mandatory. Cross-apparatus covariance fusion remains forbidden.

## Required empirical packets

| authority | status | content addressed | gate |
| --- | --- | --- | --- |
| state_preparation_recombination | absent | no | missing |
| as_built_geometry_and_green_response | absent | no | missing |
| measured_material_spectral_response | absent | no | missing |
| worldline_and_phase_covariance | absent | no | missing |
| quantum_gas_collision_kernel | absent | no | missing |
| four_cell_complex_coherence | absent | no | missing |
| independent_companion_channel | absent | no | missing |
| exact_registered_model_external_bound_recast | absent | no | missing |

The missing packets are: `state_preparation_recombination`, `as_built_geometry_and_green_response`, `measured_material_spectral_response`, `worldline_and_phase_covariance`, `quantum_gas_collision_kernel`, `four_cell_complex_coherence`, `independent_companion_channel`, `exact_registered_model_external_bound_recast`.

## Scientific standing

Stage 4.2R closes the specification of what must be measured together, on the leading apparatus, before the pilot may begin. It does not close those measurements. Measured evidence, joint-protocol validation, and ordinary-null authority remain `not_ready`; residual attribution, collapse identification, and manifold dynamics remain `blocked`; physical viability remains `not_evaluated`. The frozen Diósi law is unchanged, no Casimir-to-collapse kernel is registered, and no observable bridge edge is added.
