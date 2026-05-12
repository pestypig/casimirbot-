# ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1

Verdict: model_internal_validation_support_observed
Candidate pass rate: 1
Candidate runs: 3

Allowed claim: model-internal validation support observed only when the declared seed ensemble, controls, numerical-method checks, and entropy-stretch washout pass.

Numerical method boundary: current reports use tiny matrix evolution with Taylor matrix evolution labels, not exact diagonalization labels.

QST boundary: proxy-only; mayPromoteToCL4=false.

Boundary: this is not real-universe ER=EPR evidence, not an ER-bridge catalog, not a source term, and not NHM2 evidence.

Blockers:
- none

Claim IDs:
- tiny_syk_validation_requires_seed_ensemble.v1
- tiny_syk_validation_requires_control_battery.v1
- tiny_syk_validation_requires_numerical_convergence.v1
- tiny_syk_validation_requires_entropy_washout.v1
- tiny_syk_validation_small_model_critique_guardrail.v1
- tiny_syk_validation_model_internal_only.v1
- tiny_syk_validation_not_nhm2_evidence.v1

Citations:
- https://journals.aps.org/prd/abstract/10.1103/PhysRevD.94.106002
- https://link.springer.com/article/10.1007/JHEP12(2017)151
- https://link.springer.com/article/10.1007/JHEP07(2021)097
- https://www.nature.com/articles/s41586-022-05424-3
- https://www.nature.com/articles/s41586-025-08939-7
- https://www.nature.com/articles/s41586-025-08995-z
- https://arxiv.org/abs/2411.00972

Uncertainty notes:
- Validation is an ensemble check over tiny toy-model runs, not external reproduction.
- The current backend records Taylor matrix evolution and does not claim exact diagonalization.
- Model-internal support remains blocked by any required control leakage or nonmonotonic entropy washout.
