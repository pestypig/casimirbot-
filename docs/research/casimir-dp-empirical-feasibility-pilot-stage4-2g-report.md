# Casimir-DP Stage-4.2G empirical-feasibility pilot report

**Run:** `casimir-dp-empirical-feasibility-pilot-stage4-2g-v1-20260730T030000000Z`  
**Evidence class:** `acquisition_readiness_and_synthetic_ingestion_validation`  
**Claim ceiling:** `frozen_single_apparatus_prediction_and_empirical_pilot_protocol_only`  
**Campaign gate:** `pass`  
**Current packet:** `casimir-dp-stage4-2g-unacquired-template-v1` (`unacquired_template`)  
**Observable bridge edges added:** `0`

## Decision

The software and acquisition contract is ready; the empirical pilot is not. Stage 4.2G freezes one apparatus design, regenerates the registered DP coherence and heating predictions from exactly that mass-density identity, validates a fail-closed packet ingestion path, and states the laboratory receipts required for a pilot go/no-go. No measured packet was supplied to this authoritative run.

## Frozen single-apparatus identity

- Identity: `silica_high_mass_identifiable_single_object_v1`.
- Material/geometry: `silica` `sphere`.
- Radius: `2.76302362398029e-7 m`.
- Mass: `1.94385e-16 kg`.
- Branch separation: `1.6e-7 m`.
- Hold time: `0.25 s`.
- Cavity gap and modulation: `0.0000012 m`, `0.5 Hz`.

This is a design freeze, not evidence that the object, cavity, or superposition has been built.

## Internally consistent named-DP prediction

- Model: `diosi_1989_gaussian_regularized_nondissipative`.
- Registered sensitivity point: (r_0=1e-7 m), authority `sensitivity_only_not_admitted`.
- (E_G=2.5314157026284577e-36 J).
- Γ_DP = `0.02400420398374263 s^-1`.
- τ_DP = `41.659369362019746 s`.
- Visibility at 0.25 s: `0.9940169193456441`.
- Visibility loss: `0.005983080654355932`.
- Heating companion: `1.9297884642410306e-40 W`.
- Numerical/analytic cross-check: `pass` (`6.535731754181348e-7`).

The mass, separation, hold time, coherence prediction, momentum diffusion, and heating companion now share one parameter manifest. No Maxwell, polarization, cavity, Compton, Higgs, blackbody, or light-cone frequency enters the registered DP generator.

## Companion detector requirement

For `100` independent samples and target SNR `5`, the one-shot standard uncertainty must be no larger than `3.859576928482061e-40 W`. This is an instrument requirement, not demonstrated detector performance.

## Packet and recomputation result

- Unacquired packet identifiability: `not_evaluated`.
- Synthetic ingestion identifiability: `pass`.
- Synthetic maximum whitened cosine: `2.7755575615628914e-17`.
- Synthetic normalized Gram condition: `1`.
- Synthetic forecast power: `1`.

The synthetic packet tests the parser, whitening-space gate recomputation, power calculation, and failure boundaries only. It is not apparatus response, covariance, detector sensitivity, or measured evidence.

## Acquisition products required before pilot go/no-go

- `apparatus_mass_geometry`: `unacquired`.
- `material_response`: `unacquired`.
- `finite_geometry_maxwell_green`: `unacquired`.
- `state_preparation`: `unacquired`.
- `branch_hold_metrology`: `unacquired`.
- `boundary_modulation_transfer`: `unacquired`.
- `environment_backgrounds`: `unacquired`.
- `complex_coherence_response`: `unacquired`.
- `block_covariance`: `unacquired`.
- `companion_detector`: `unacquired`.
- `blind_custody_freeze`: `unacquired`.
- `independent_solver_replication`: `unacquired`.
- `complete_apparatus_stress_energy`: `unacquired`.

The complete conserved apparatus stress-energy product is separately required for a manifold/metric-response interpretation. It is not required to ask the narrower, nonrelativistic registered-DP coherence question.

## Current scientific standing

- `software_and_packet_contract`: `pass`.
- `design_identity_freeze`: `pass`.
- `dp_companion_internal_consistency`: `pass`.
- `physical_apparatus_identity`: `not_ready`.
- `finite_geometry_maxwell_authority`: `not_ready`.
- `measured_material_green_authority`: `not_ready`.
- `state_preparation_authority`: `not_ready`.
- `branch_hold_metrology_authority`: `not_ready`.
- `quasistatic_modulation_authority`: `not_ready`.
- `measured_background_covariance`: `not_ready`.
- `companion_detector_authority`: `not_ready`.
- `empirical_pilot_readiness`: `not_ready`.
- `complete_apparatus_stress_energy`: `not_ready`.
- `measured_evidence`: `not_ready`.
- `collapse_identification`: `blocked`.
- `manifold_dynamics`: `blocked`.
- `physical_viability`: `not_evaluated`.

A measured pilot packet can make the apparatus inputs and pilot identifiability ready. It cannot by itself identify objective collapse: the blinded confirmatory campaign and independent replication remain subsequent evidence stages.

