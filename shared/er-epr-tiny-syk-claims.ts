export const ER_EPR_TINY_SYK_CLAIM_IDS = [
  "tiny_syk_solver_is_toy_model.v1",
  "tiny_syk_hamiltonian_seeded_reproducibility.v1",
  "two_sided_syk_traversable_protocol_context.v1",
  "double_trace_coupling_traversability_context.v1",
  "operator_size_winding_guardrail.v1",
  "small_model_gravity_feature_critique_guardrail.v1",
  "noncommutativity_thermalization_scrambling_required.v1",
  "entropy_washout_qst_visibility_guardrail.v1",
  "tiny_syk_not_real_universe_er_epr_evidence.v1",
  "tiny_syk_not_nhm2_propulsion_evidence.v1",
] as const;

export type ErEprTinySykClaimId = (typeof ER_EPR_TINY_SYK_CLAIM_IDS)[number];

export function allErEprTinySykClaimIds(): string[] {
  return [...ER_EPR_TINY_SYK_CLAIM_IDS];
}

export function citationsForErEprTinySykClaims(): string[] {
  return [
    "https://arxiv.org/abs/1306.0533",
    "https://journals.aps.org/prd/abstract/10.1103/PhysRevD.94.106002",
    "https://arxiv.org/abs/1608.05687",
    "https://link.springer.com/article/10.1007/JHEP07(2021)097",
    "https://www.nature.com/articles/s41586-022-05424-3",
    "https://www.nature.com/articles/s41586-025-08939-7",
    "https://arxiv.org/abs/2411.00972",
  ];
}

export function sourceRolesForErEprTinySykClaims(): Record<string, string> {
  return {
    "https://arxiv.org/abs/1306.0533": "supports_boundary",
    "https://journals.aps.org/prd/abstract/10.1103/PhysRevD.94.106002": "supports_model",
    "https://arxiv.org/abs/1608.05687": "supports_model",
    "https://link.springer.com/article/10.1007/JHEP07(2021)097": "supports_model",
    "https://www.nature.com/articles/s41586-022-05424-3": "supports_precedent",
    "https://www.nature.com/articles/s41586-025-08939-7": "supports_guardrail",
    "https://arxiv.org/abs/2411.00972": "supports_guardrail",
  };
}

export function uncertaintyNotesForErEprTinySykClaims(): string[] {
  return [
    "Tiny SYK telemetry is model-internal and dimension-limited.",
    "Taylor time evolution is a deterministic tiny-matrix numerical method, not a gravity solution.",
    "Control failure and entropy washout are required before any model-internal support language is allowed.",
  ];
}
