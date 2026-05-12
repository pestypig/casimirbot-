export const ER_EPR_TINY_SYK_VALIDATION_CLAIM_IDS = [
  "tiny_syk_validation_requires_seed_ensemble.v1",
  "tiny_syk_validation_requires_control_battery.v1",
  "tiny_syk_validation_requires_numerical_convergence.v1",
  "tiny_syk_validation_requires_entropy_washout.v1",
  "tiny_syk_validation_small_model_critique_guardrail.v1",
  "tiny_syk_validation_model_internal_only.v1",
  "tiny_syk_validation_not_nhm2_evidence.v1",
] as const;

export function allErEprTinySykValidationClaimIds(): string[] {
  return [...ER_EPR_TINY_SYK_VALIDATION_CLAIM_IDS];
}

export function citationsForErEprTinySykValidationClaims(): string[] {
  return [
    "https://journals.aps.org/prd/abstract/10.1103/PhysRevD.94.106002",
    "https://link.springer.com/article/10.1007/JHEP12(2017)151",
    "https://link.springer.com/article/10.1007/JHEP07(2021)097",
    "https://www.nature.com/articles/s41586-022-05424-3",
    "https://www.nature.com/articles/s41586-025-08939-7",
    "https://www.nature.com/articles/s41586-025-08995-z",
    "https://arxiv.org/abs/2411.00972",
  ];
}

export function sourceRolesForErEprTinySykValidationClaims(): Record<string, string> {
  return {
    "https://journals.aps.org/prd/abstract/10.1103/PhysRevD.94.106002": "supports_model",
    "https://link.springer.com/article/10.1007/JHEP12(2017)151": "supports_model",
    "https://link.springer.com/article/10.1007/JHEP07(2021)097": "supports_model",
    "https://www.nature.com/articles/s41586-022-05424-3": "supports_precedent",
    "https://www.nature.com/articles/s41586-025-08939-7": "supports_guardrail",
    "https://www.nature.com/articles/s41586-025-08995-z": "supports_guardrail",
    "https://arxiv.org/abs/2411.00972": "supports_guardrail",
  };
}

export function uncertaintyNotesForErEprTinySykValidationClaims(): string[] {
  return [
    "Validation is an ensemble check over tiny toy-model runs, not external reproduction.",
    "The current backend records Taylor matrix evolution and does not claim exact diagonalization.",
    "Model-internal support remains blocked by any required control leakage or nonmonotonic entropy washout.",
  ];
}
