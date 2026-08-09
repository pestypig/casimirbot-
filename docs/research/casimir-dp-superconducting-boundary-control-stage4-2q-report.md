# Casimir-DP Stage-4.2Q superconducting-boundary control report

**Run:** `casimir-dp-superconducting-boundary-control-stage4-2q-v1-20260808T180000000Z`  
**Evidence:** synthetic superconducting control-identifiability only  
**Claim ceiling:** ordinary superconducting-boundary control design only

## Result

Software recovery is `pass`. The bounded synthetic strategy result is `bounded_candidate_found`; selected synthetic strategy: `magnetic_field_toggle`. Physical control authority remains `not_ready`.

## Gauge/condensate recovery

- London depth recovered: 3.9e-8 m (relative error 0).
- In-medium photon mass scale: 9.019674204078877e-36 kg.
- DC resistance: 0 ohm; finite-frequency impedance remains nonzero: true.
- Frozen synthetic impedance-to-Green transfer recovery: pass (maximum absolute phase/chi error 1.3010426069826053e-18).

This is the Anderson-Higgs/Meissner in-medium electromagnetic response. The registered linearized Green transfer is synthetic and not an as-built Maxwell solution. It is not the Standard-Model Higgs field and does not alter the registered Diosi generator.

## Boundary ratio and frozen Diosi cancellation

Maximum numerical Diosi cancellation error in C_SC/C_N: 2.220513810852149e-16; gate `pass`. The ratio diagnoses boundary state rather than the primary boundary-independent Diosi signal.

## Toggle-strategy assessment

| strategy | contrast SNR | max nuisance cosine | condition | synthetic gate |
| --- | ---: | ---: | ---: | --- |
| temperature_crossing | 12.515263011371022 | 1 | Infinity | no_go |
| magnetic_field_toggle | 10.042454540104556 | 0.3670128108497832 | 1.4695651082298706 | pass |
| matched_static_pair | 3.347484846701519 | 0.9999998093457427 | 3238.856624771159 | no_go |

Temperature crossing is rejected when thermal response is collinear with the desired contrast. The matched pair is too weak and fabrication-sensitive in this fixture. The magnetic toggle is only a synthetic candidate: field pickup, trap transfer, vortices, and sham covariance require measurement.

## Condensation-energy stress-energy screen

For the hypothetical coating, B_c^2 V/(2 mu_0) gives 2.0371832704672677e-11 J and mass equivalent 2.266672080076899e-28 kg, or 7.329565783621627e-13 of the sphere mass. This is an ordinary upper bound, not a collapse source.

## Bridge and non-bridge result

The runnable ordinary bridge is superconducting state -> measured finite-frequency impedance -> electromagnetic Green tensor -> phase/loss covariance -> complex coherence. Standard-Model Higgs -> Diosi, superconducting condensate -> Diosi, and BEC order parameter -> Diosi remain non-bridges. A BEC is a conditional replication platform only after a many-body mass-density contract is registered.

Measured specimen impedance, normal/superconducting Casimir contrast, as-built Green response, transition covariance, magnetic transfer, vortex state, and joint coherence cells remain absent. Measured evidence and ordinary-null authority remain `not_ready`; residual attribution, collapse identification, and manifold dynamics remain `blocked`; physical viability remains `not_evaluated`; no pilot or confirmatory campaign is authorized.
