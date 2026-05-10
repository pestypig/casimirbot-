import type { ErEprSimulationVerdict, ErEprUnsupportedClaim } from "./er-epr-simulation";

export const ER_EPR_STAGE1_CLAIM_IDS = {
  erEprEntangledBlackHoleBridgeContext: "er_epr_entangled_black_hole_bridge_context.v1",
  rtHolographicEntropyAreaProxy: "rt_holographic_entropy_area_proxy.v1",
  vanRaamsdonkEntanglementConnectivityContext: "van_raamsdonk_entanglement_connectivity_context.v1",
  gjwDoubleTraceTraversabilityModel: "gjw_double_trace_traversability_model.v1",
  sykProcessorSimulationPrecedent: "syk_processor_simulation_precedent.v1",
  smallCommutingModelCritiqueGuardrail: "small_commuting_model_critique_guardrail.v1",
  entropyStretchQuantumVisibilityDemotesClaims: "entropy_stretch_quantum_visibility_demotes_claims.v1",
  starsimAstrometryStructurePriorOnly: "starsim_astrometry_structure_prior_only.v1",
} as const;

export type ErEprStage1ClaimId =
  (typeof ER_EPR_STAGE1_CLAIM_IDS)[keyof typeof ER_EPR_STAGE1_CLAIM_IDS];

export type ErEprStage1SourceRole =
  | "supports_context"
  | "supports_model"
  | "supports_guardrail"
  | "supports_boundary";

export const ER_EPR_STAGE1_CLAIM_SOURCES: Record<ErEprStage1ClaimId, string[]> = {
  [ER_EPR_STAGE1_CLAIM_IDS.erEprEntangledBlackHoleBridgeContext]: [
    "https://arxiv.org/abs/1306.0533",
  ],
  [ER_EPR_STAGE1_CLAIM_IDS.rtHolographicEntropyAreaProxy]: [
    "https://arxiv.org/abs/hep-th/0603001",
  ],
  [ER_EPR_STAGE1_CLAIM_IDS.vanRaamsdonkEntanglementConnectivityContext]: [
    "https://arxiv.org/abs/1005.3035",
  ],
  [ER_EPR_STAGE1_CLAIM_IDS.gjwDoubleTraceTraversabilityModel]: [
    "https://arxiv.org/abs/1608.05687",
  ],
  [ER_EPR_STAGE1_CLAIM_IDS.sykProcessorSimulationPrecedent]: [
    "https://www.nature.com/articles/s41586-022-05424-3",
  ],
  [ER_EPR_STAGE1_CLAIM_IDS.smallCommutingModelCritiqueGuardrail]: [
    "https://doi.org/10.1038/s41586-025-08939-7",
    "https://doi.org/10.1038/s41586-025-08995-z",
  ],
  [ER_EPR_STAGE1_CLAIM_IDS.entropyStretchQuantumVisibilityDemotesClaims]: [
    "https://arxiv.org/abs/quant-ph/0306072",
    "https://arxiv.org/abs/quant-ph/0312059",
  ],
  [ER_EPR_STAGE1_CLAIM_IDS.starsimAstrometryStructurePriorOnly]: [
    "https://arxiv.org/abs/1511.06717",
    "https://arxiv.org/abs/1802.09943",
    "https://arxiv.org/abs/1609.04153",
  ],
};

export const ER_EPR_STAGE1_CLAIM_SOURCE_ROLES: Record<ErEprStage1ClaimId, ErEprStage1SourceRole> = {
  [ER_EPR_STAGE1_CLAIM_IDS.erEprEntangledBlackHoleBridgeContext]: "supports_context",
  [ER_EPR_STAGE1_CLAIM_IDS.rtHolographicEntropyAreaProxy]: "supports_model",
  [ER_EPR_STAGE1_CLAIM_IDS.vanRaamsdonkEntanglementConnectivityContext]: "supports_context",
  [ER_EPR_STAGE1_CLAIM_IDS.gjwDoubleTraceTraversabilityModel]: "supports_model",
  [ER_EPR_STAGE1_CLAIM_IDS.sykProcessorSimulationPrecedent]: "supports_model",
  [ER_EPR_STAGE1_CLAIM_IDS.smallCommutingModelCritiqueGuardrail]: "supports_guardrail",
  [ER_EPR_STAGE1_CLAIM_IDS.entropyStretchQuantumVisibilityDemotesClaims]: "supports_guardrail",
  [ER_EPR_STAGE1_CLAIM_IDS.starsimAstrometryStructurePriorOnly]: "supports_boundary",
};

export const ER_EPR_STAGE1_CLAIM_UNCERTAINTY_NOTES: Record<ErEprStage1ClaimId, string> = {
  [ER_EPR_STAGE1_CLAIM_IDS.erEprEntangledBlackHoleBridgeContext]:
    "ER=EPR is used only as holographic/black-hole research context, not a generic real-universe wormhole inventory.",
  [ER_EPR_STAGE1_CLAIM_IDS.rtHolographicEntropyAreaProxy]:
    "The area/entropy relation is a holographic proxy and is not arbitrary-spacetime metric equivalence.",
  [ER_EPR_STAGE1_CLAIM_IDS.vanRaamsdonkEntanglementConnectivityContext]:
    "Entanglement/connectivity reasoning remains interpretive holographic context, not standalone engineering evidence.",
  [ER_EPR_STAGE1_CLAIM_IDS.gjwDoubleTraceTraversabilityModel]:
    "Double-trace traversability applies to a specific holographic model family and is not a local propulsion mechanism.",
  [ER_EPR_STAGE1_CLAIM_IDS.sykProcessorSimulationPrecedent]:
    "The processor result is a small toy-model simulation precedent, not proof of real-universe wormholes.",
  [ER_EPR_STAGE1_CLAIM_IDS.smallCommutingModelCritiqueGuardrail]:
    "The toy-model interpretation is contested; thermalization, scrambling, noncommuting controls, and leakage checks remain mandatory.",
  [ER_EPR_STAGE1_CLAIM_IDS.entropyStretchQuantumVisibilityDemotesClaims]:
    "Entropy stretch is diagnostic bookkeeping that can demote visibility; it does not physically alter hbar.",
  [ER_EPR_STAGE1_CLAIM_IDS.starsimAstrometryStructurePriorOnly]:
    "StarSim/Gaia-like astrometry is an ordinary structure prior or null-model context, not direct ER=EPR evidence.",
};

export const ER_EPR_STAGE1_CLAIM_BOUNDARIES = {
  verdicts: {
    not_tested: [ER_EPR_STAGE1_CLAIM_IDS.erEprEntangledBlackHoleBridgeContext],
    ordinary_control_explains_signal: [
      ER_EPR_STAGE1_CLAIM_IDS.gjwDoubleTraceTraversabilityModel,
      ER_EPR_STAGE1_CLAIM_IDS.smallCommutingModelCritiqueGuardrail,
      ER_EPR_STAGE1_CLAIM_IDS.entropyStretchQuantumVisibilityDemotesClaims,
    ],
    proxy_only_structure_prior: [
      ER_EPR_STAGE1_CLAIM_IDS.starsimAstrometryStructurePriorOnly,
      ER_EPR_STAGE1_CLAIM_IDS.entropyStretchQuantumVisibilityDemotesClaims,
    ],
    model_internal_er_epr_support: [
      ER_EPR_STAGE1_CLAIM_IDS.erEprEntangledBlackHoleBridgeContext,
      ER_EPR_STAGE1_CLAIM_IDS.rtHolographicEntropyAreaProxy,
      ER_EPR_STAGE1_CLAIM_IDS.vanRaamsdonkEntanglementConnectivityContext,
      ER_EPR_STAGE1_CLAIM_IDS.gjwDoubleTraceTraversabilityModel,
      ER_EPR_STAGE1_CLAIM_IDS.sykProcessorSimulationPrecedent,
      ER_EPR_STAGE1_CLAIM_IDS.smallCommutingModelCritiqueGuardrail,
      ER_EPR_STAGE1_CLAIM_IDS.entropyStretchQuantumVisibilityDemotesClaims,
    ],
    dual_model_support_strong: [
      ER_EPR_STAGE1_CLAIM_IDS.gjwDoubleTraceTraversabilityModel,
      ER_EPR_STAGE1_CLAIM_IDS.sykProcessorSimulationPrecedent,
      ER_EPR_STAGE1_CLAIM_IDS.smallCommutingModelCritiqueGuardrail,
      ER_EPR_STAGE1_CLAIM_IDS.rtHolographicEntropyAreaProxy,
      ER_EPR_STAGE1_CLAIM_IDS.entropyStretchQuantumVisibilityDemotesClaims,
    ],
    overclaim_blocked: [ER_EPR_STAGE1_CLAIM_IDS.erEprEntangledBlackHoleBridgeContext],
  } satisfies Record<ErEprSimulationVerdict, ErEprStage1ClaimId[]>,
  blockedClaims: {
    astrometric_prior_as_direct_er_epr_evidence: [
      ER_EPR_STAGE1_CLAIM_IDS.starsimAstrometryStructurePriorOnly,
    ],
    er_epr_sim_to_spacetime_CL_promotion: [
      ER_EPR_STAGE1_CLAIM_IDS.erEprEntangledBlackHoleBridgeContext,
      ER_EPR_STAGE1_CLAIM_IDS.rtHolographicEntropyAreaProxy,
      ER_EPR_STAGE1_CLAIM_IDS.gjwDoubleTraceTraversabilityModel,
    ],
    non_holographic_control_as_er_epr_support: [
      ER_EPR_STAGE1_CLAIM_IDS.erEprEntangledBlackHoleBridgeContext,
      ER_EPR_STAGE1_CLAIM_IDS.rtHolographicEntropyAreaProxy,
      ER_EPR_STAGE1_CLAIM_IDS.vanRaamsdonkEntanglementConnectivityContext,
    ],
  } satisfies Record<ErEprUnsupportedClaim, ErEprStage1ClaimId[]>,
} as const;

function uniqueClaimIds(claimIds: ErEprStage1ClaimId[]): ErEprStage1ClaimId[] {
  return [...new Set(claimIds)];
}

export function getErEprStage1ClaimIdsForEvidence(args: {
  verdict: ErEprSimulationVerdict;
  blockedClaims: ErEprUnsupportedClaim[];
  entropyVisibilityPass: boolean;
}): ErEprStage1ClaimId[] {
  const claimIds: ErEprStage1ClaimId[] = [
    ...ER_EPR_STAGE1_CLAIM_BOUNDARIES.verdicts[args.verdict],
  ];

  for (const blockedClaim of args.blockedClaims) {
    claimIds.push(...ER_EPR_STAGE1_CLAIM_BOUNDARIES.blockedClaims[blockedClaim]);
  }

  if (!args.entropyVisibilityPass) {
    claimIds.push(ER_EPR_STAGE1_CLAIM_IDS.entropyStretchQuantumVisibilityDemotesClaims);
  }

  return uniqueClaimIds(claimIds);
}

export function getErEprStage1CitationsForClaimIds(claimIds: ErEprStage1ClaimId[]): string[] {
  return [...new Set(claimIds.flatMap((claimId) => ER_EPR_STAGE1_CLAIM_SOURCES[claimId]))];
}

export function getErEprStage1UncertaintyNotes(claimIds: ErEprStage1ClaimId[]): string[] {
  return claimIds.map((claimId) => ER_EPR_STAGE1_CLAIM_UNCERTAINTY_NOTES[claimId]);
}

export function getErEprStage1SourceRoles(
  claimIds: ErEprStage1ClaimId[],
): Record<string, ErEprStage1SourceRole> {
  return Object.fromEntries(
    claimIds.map((claimId) => [claimId, ER_EPR_STAGE1_CLAIM_SOURCE_ROLES[claimId]]),
  );
}
