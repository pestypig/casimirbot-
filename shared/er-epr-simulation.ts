import { z } from "zod";

import {
  buildQuantumSpacetimeCongruence,
  quantumSpacetimeCongruenceInputSchema,
  rtAreaProxyM2,
} from "./quantum-spacetime-congruence";
import {
  getErEprStage1CitationsForClaimIds,
  getErEprStage1ClaimIdsForEvidence,
  getErEprStage1SourceRoles,
  getErEprStage1UncertaintyNotes,
  type ErEprStage1SourceRole,
} from "./er-epr-research-claims";

export const erEprModelFamilySchema = z.enum([
  "two_sided_SYK",
  "JT_gravity_dual",
  "tensor_network_ads",
  "random_matrix_control",
  "spin_chain_control",
]);

export const erEprInitialStateSchema = z.enum([
  "thermofield_double",
  "partially_entangled",
  "disentangled_control",
  "random_control",
]);

export const erEprCouplingSchema = z.enum([
  "double_trace_correct_sign",
  "double_trace_wrong_sign",
  "none",
]);

export const erEprSimulationVerdictSchema = z.enum([
  "not_tested",
  "ordinary_control_explains_signal",
  "proxy_only_structure_prior",
  "model_internal_er_epr_support",
  "dual_model_support_strong",
  "overclaim_blocked",
]);

export type ErEprSimulationVerdict = z.infer<typeof erEprSimulationVerdictSchema>;

export type ErEprUnsupportedClaim =
  | "er_epr_sim_to_spacetime_CL_promotion"
  | "astrometric_prior_as_direct_er_epr_evidence"
  | "non_holographic_control_as_er_epr_support";

export type ErEprOverclaimWarning =
  | "not_real_universe_er_bridge_proof"
  | "not_metric_equivalence_lane"
  | "not_stress_energy_source"
  | "not_wormhole_inventory"
  | "starsim_is_structure_prior_only";

const scoreSchema = z.number().finite().min(0).max(1);

export const erEprSimulationInputSchema = z.object({
  modelFamily: erEprModelFamilySchema,
  nQubitsOrModes: z.number().int().positive(),
  temperatureRegime: z.enum(["low", "intermediate", "high"]),
  initialState: erEprInitialStateSchema,
  coupling: erEprCouplingSchema,
  probeInsertionTime: z.number().finite(),
  measurementWindow: z.number().finite().positive(),
  requestedSpacetimeCL: z.enum(["proxy_only", "CL0", "CL1", "CL2", "CL3", "CL4"]).default("proxy_only"),
  entropyStretch: quantumSpacetimeCongruenceInputSchema.shape.entropyStretch.default({ deltaS_nats: 0 }),
  observables: z.object({
    mutualInformation: z.number().finite().nonnegative(),
    entanglementEntropy_nats: z.number().finite().nonnegative(),
    teleportationFidelity: scoreSchema,
    causalOrderingScore: scoreSchema,
    timeDelayScore: scoreSchema,
    operatorSizeWindingScore: scoreSchema,
    scramblingScore: scoreSchema,
    thermalizationScore: scoreSchema,
    entropyAreaProxyTrackingScore: scoreSchema,
    ordinaryTeleportationControlScore: scoreSchema,
    shuffledHamiltonianControlScore: scoreSchema,
    disentangledControlScore: scoreSchema,
    wrongSignCouplingControlScore: scoreSchema,
  }),
  starSim: z.object({
    role: z.enum(["not_used", "cosmological_structure_prior", "direct_er_epr_evidence"]).default("not_used"),
    clusteringEntropy_nats: z.number().finite().nonnegative().optional(),
    localDensityContrast: z.number().finite().optional(),
    velocityDispersion_km_s: z.number().finite().nonnegative().optional(),
  }).default({ role: "not_used" }),
});

export type ErEprSimulationInput = z.input<typeof erEprSimulationInputSchema>;
export type ParsedErEprSimulationInput = z.output<typeof erEprSimulationInputSchema>;

export type ErEprSimulationEvaluation = ParsedErEprSimulationInput & {
  qst: ReturnType<typeof buildQuantumSpacetimeCongruence>;
  values: {
    rtAreaProxy_m2: number;
    signalComposite: number;
    controlLeakage: number;
    diagnosticComposite: number;
    entropyVisibility: number;
    visibilityAdjustedSignal: number;
  };
  gates: {
    holographicModel: boolean;
    entangledTwoSidedState: boolean;
    correctTraversableCoupling: boolean;
    entangledStateSignal: boolean;
    ordinaryControlsFail: boolean;
    diagnosticChecksPass: boolean;
    entropyAreaProxyTracksSignal: boolean;
    entropyVisibilityPass: boolean;
    canClaimModelInternalSupport: boolean;
  };
  guards: {
    spacetimeCL: "proxy_only";
    mayPromoteToCL4: false;
    blockedClaims: ErEprUnsupportedClaim[];
    overclaimWarnings: ErEprOverclaimWarning[];
  };
  evidence: {
    stage: "ER_EPR_STAGE1_SIM";
    claimTier: "Stage1_falsifiable_model_support";
    verdict: ErEprSimulationVerdict;
    citations: string[];
    claimIds: string[];
    uncertaintyNotes: string[];
    sourceRoles: Record<string, ErEprStage1SourceRole>;
  };
};

const HOLOGRAPHIC_MODEL_FAMILIES = new Set<z.infer<typeof erEprModelFamilySchema>>([
  "two_sided_SYK",
  "JT_gravity_dual",
  "tensor_network_ads",
]);

const round = (value: number): number => Number(value.toFixed(6));
const mean = (values: number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

export function evaluateErEprSimulation(
  input: ErEprSimulationInput,
  thresholds: {
    signalMin?: number;
    controlMax?: number;
    diagnosticMin?: number;
    entropyAreaTrackingMin?: number;
    entropyVisibilityMin?: number;
    strongSupportMin?: number;
  } = {},
): ErEprSimulationEvaluation {
  const parsed = erEprSimulationInputSchema.parse(input);
  const signalMin = thresholds.signalMin ?? 0.7;
  const controlMax = thresholds.controlMax ?? 0.35;
  const diagnosticMin = thresholds.diagnosticMin ?? 0.6;
  const entropyAreaTrackingMin = thresholds.entropyAreaTrackingMin ?? 0.6;
  const entropyVisibilityMin = thresholds.entropyVisibilityMin ?? 0.05;
  const strongSupportMin = thresholds.strongSupportMin ?? 0.82;

  const qst = buildQuantumSpacetimeCongruence({
    claimTier: "toy_model",
    entropyStretch: parsed.entropyStretch,
    holographicProxy: {
      erEprEligible: HOLOGRAPHIC_MODEL_FAMILIES.has(parsed.modelFamily),
      entanglementEntropy_nats: parsed.observables.entanglementEntropy_nats,
      regionArea_m2: 1,
    },
    congruenceGate: {
      spacetimeCL: parsed.requestedSpacetimeCL,
      quantumCL: "QCL3_holographic_area_proxy",
    },
  });

  const signalComposite = mean([
    parsed.observables.teleportationFidelity,
    parsed.observables.causalOrderingScore,
    parsed.observables.timeDelayScore,
  ]);
  const controlLeakage = Math.max(
    parsed.observables.ordinaryTeleportationControlScore,
    parsed.observables.shuffledHamiltonianControlScore,
    parsed.observables.disentangledControlScore,
    parsed.observables.wrongSignCouplingControlScore,
  );
  const diagnosticComposite = mean([
    parsed.observables.operatorSizeWindingScore,
    parsed.observables.scramblingScore,
    parsed.observables.thermalizationScore,
  ]);
  const entropyVisibility = qst.entropyStretch.quantumVisibility;
  const visibilityAdjustedSignal = signalComposite * entropyVisibility;
  const blockedClaims = collectErEprUnsupportedClaims(parsed);

  const gates = {
    holographicModel: HOLOGRAPHIC_MODEL_FAMILIES.has(parsed.modelFamily),
    entangledTwoSidedState: parsed.initialState === "thermofield_double" || parsed.initialState === "partially_entangled",
    correctTraversableCoupling: parsed.coupling === "double_trace_correct_sign",
    entangledStateSignal: signalComposite >= signalMin,
    ordinaryControlsFail: controlLeakage <= controlMax,
    diagnosticChecksPass: diagnosticComposite >= diagnosticMin,
    entropyAreaProxyTracksSignal: parsed.observables.entropyAreaProxyTrackingScore >= entropyAreaTrackingMin,
    entropyVisibilityPass: entropyVisibility >= entropyVisibilityMin,
    canClaimModelInternalSupport: false,
  };
  gates.canClaimModelInternalSupport =
    blockedClaims.length === 0 &&
    gates.holographicModel &&
    gates.entangledTwoSidedState &&
    gates.correctTraversableCoupling &&
    gates.entangledStateSignal &&
    gates.ordinaryControlsFail &&
    gates.diagnosticChecksPass &&
    gates.entropyAreaProxyTracksSignal &&
    gates.entropyVisibilityPass;

  const verdict = resolveErEprVerdict({
    parsed,
    gates,
    blockedClaims,
    signalComposite,
    diagnosticComposite,
    strongSupportMin,
  });
  const claimIds = getErEprStage1ClaimIdsForEvidence({
    verdict,
    blockedClaims,
    entropyVisibilityPass: gates.entropyVisibilityPass,
  });
  const baseCitations = [
    "https://arxiv.org/abs/1306.0533",
    "https://arxiv.org/abs/hep-th/0603001",
    "https://arxiv.org/abs/1005.3035",
    "https://arxiv.org/abs/1608.05687",
    "https://www.nature.com/articles/s41586-022-05424-3",
    "https://doi.org/10.1038/s41586-025-08939-7",
    "https://doi.org/10.1038/s41586-025-08995-z",
  ];

  return {
    ...parsed,
    qst,
    values: {
      rtAreaProxy_m2: rtAreaProxyM2(parsed.observables.entanglementEntropy_nats),
      signalComposite: round(signalComposite),
      controlLeakage: round(controlLeakage),
      diagnosticComposite: round(diagnosticComposite),
      entropyVisibility: round(entropyVisibility),
      visibilityAdjustedSignal: round(visibilityAdjustedSignal),
    },
    gates,
    guards: {
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      blockedClaims,
      overclaimWarnings: buildErEprOverclaimWarnings(parsed),
    },
    evidence: {
      stage: "ER_EPR_STAGE1_SIM",
      claimTier: "Stage1_falsifiable_model_support",
      verdict,
      citations: [...new Set([...baseCitations, ...getErEprStage1CitationsForClaimIds(claimIds)])],
      claimIds,
      uncertaintyNotes: getErEprStage1UncertaintyNotes(claimIds),
      sourceRoles: getErEprStage1SourceRoles(claimIds),
    },
  };
}

function collectErEprUnsupportedClaims(parsed: ParsedErEprSimulationInput): ErEprUnsupportedClaim[] {
  const blocked: ErEprUnsupportedClaim[] = [];
  if (parsed.requestedSpacetimeCL !== "proxy_only") {
    blocked.push("er_epr_sim_to_spacetime_CL_promotion");
  }
  if (parsed.starSim.role === "direct_er_epr_evidence") {
    blocked.push("astrometric_prior_as_direct_er_epr_evidence");
  }
  if (!HOLOGRAPHIC_MODEL_FAMILIES.has(parsed.modelFamily) && parsed.initialState !== "random_control") {
    blocked.push("non_holographic_control_as_er_epr_support");
  }
  return blocked;
}

function buildErEprOverclaimWarnings(parsed: ParsedErEprSimulationInput): ErEprOverclaimWarning[] {
  const warnings = new Set<ErEprOverclaimWarning>([
    "not_real_universe_er_bridge_proof",
    "not_metric_equivalence_lane",
    "not_stress_energy_source",
    "not_wormhole_inventory",
  ]);
  if (parsed.starSim.role !== "not_used") {
    warnings.add("starsim_is_structure_prior_only");
  }
  return [...warnings];
}

function resolveErEprVerdict(args: {
  parsed: ParsedErEprSimulationInput;
  gates: ErEprSimulationEvaluation["gates"];
  blockedClaims: ErEprUnsupportedClaim[];
  signalComposite: number;
  diagnosticComposite: number;
  strongSupportMin: number;
}): ErEprSimulationVerdict {
  if (args.blockedClaims.length > 0) {
    return "overclaim_blocked";
  }
  if (args.parsed.starSim.role === "cosmological_structure_prior" && !args.gates.holographicModel) {
    return "proxy_only_structure_prior";
  }
  if (!args.gates.canClaimModelInternalSupport) {
    return "ordinary_control_explains_signal";
  }
  if (
    args.signalComposite >= args.strongSupportMin &&
    args.diagnosticComposite >= args.strongSupportMin &&
    args.parsed.observables.entropyAreaProxyTrackingScore >= args.strongSupportMin
  ) {
    return "dual_model_support_strong";
  }
  return "model_internal_er_epr_support";
}
