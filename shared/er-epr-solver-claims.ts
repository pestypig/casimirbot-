export const ER_EPR_SOLVER_CLAIM_IDS = {
  rawTelemetryBeforeInterpretation: "er_epr_raw_telemetry_before_interpretation.v1",
  declaredToyDualBackendOnly: "er_epr_declared_toy_dual_backend_only.v1",
  doubleTraceTraversabilityProtocolContext:
    "er_epr_double_trace_traversability_protocol_context.v1",
  sykTeleportationProtocolContext: "er_epr_syk_teleportation_protocol_context.v1",
  controlBatteryRequired: "er_epr_solver_control_battery_required.v1",
  entropyWashoutDemotesSolverSignal: "er_epr_entropy_washout_demotes_solver_signal.v1",
  solverTelemetryNotRealUniverseWormholes:
    "er_epr_solver_telemetry_not_real_universe_wormholes.v1",
  solverTelemetryNotNhm2Propulsion: "er_epr_solver_telemetry_not_nhm2_propulsion.v1",
} as const;

export type ErEprSolverClaimId =
  (typeof ER_EPR_SOLVER_CLAIM_IDS)[keyof typeof ER_EPR_SOLVER_CLAIM_IDS];

export type ErEprSolverSourceRole =
  | "supports_model"
  | "supports_guardrail"
  | "supports_boundary"
  | "supports_context";

export const ER_EPR_SOLVER_CLAIM_SOURCES: Record<ErEprSolverClaimId, string[]> = {
  [ER_EPR_SOLVER_CLAIM_IDS.rawTelemetryBeforeInterpretation]: [
    "https://www.nature.com/articles/s41586-022-05424-3",
    "https://www.nature.com/articles/s41586-025-08939-7",
  ],
  [ER_EPR_SOLVER_CLAIM_IDS.declaredToyDualBackendOnly]: [
    "https://arxiv.org/abs/1306.0533",
    "https://arxiv.org/abs/hep-th/0603001",
  ],
  [ER_EPR_SOLVER_CLAIM_IDS.doubleTraceTraversabilityProtocolContext]: [
    "https://link.springer.com/article/10.1007/JHEP12(2017)151",
  ],
  [ER_EPR_SOLVER_CLAIM_IDS.sykTeleportationProtocolContext]: [
    "https://link.springer.com/article/10.1007/JHEP07(2021)097",
  ],
  [ER_EPR_SOLVER_CLAIM_IDS.controlBatteryRequired]: [
    "https://www.nature.com/articles/s41586-025-08939-7",
    "https://www.nature.com/articles/s41586-025-08995-z",
  ],
  [ER_EPR_SOLVER_CLAIM_IDS.entropyWashoutDemotesSolverSignal]: [
    "https://arxiv.org/abs/2411.00972",
  ],
  [ER_EPR_SOLVER_CLAIM_IDS.solverTelemetryNotRealUniverseWormholes]: [
    "https://arxiv.org/abs/1306.0533",
  ],
  [ER_EPR_SOLVER_CLAIM_IDS.solverTelemetryNotNhm2Propulsion]: [
    "https://arxiv.org/abs/1306.0533",
    "https://arxiv.org/abs/2411.00972",
  ],
};

export const ER_EPR_SOLVER_CLAIM_SOURCE_ROLES: Record<
  ErEprSolverClaimId,
  ErEprSolverSourceRole
> = {
  [ER_EPR_SOLVER_CLAIM_IDS.rawTelemetryBeforeInterpretation]: "supports_guardrail",
  [ER_EPR_SOLVER_CLAIM_IDS.declaredToyDualBackendOnly]: "supports_boundary",
  [ER_EPR_SOLVER_CLAIM_IDS.doubleTraceTraversabilityProtocolContext]: "supports_model",
  [ER_EPR_SOLVER_CLAIM_IDS.sykTeleportationProtocolContext]: "supports_model",
  [ER_EPR_SOLVER_CLAIM_IDS.controlBatteryRequired]: "supports_guardrail",
  [ER_EPR_SOLVER_CLAIM_IDS.entropyWashoutDemotesSolverSignal]: "supports_guardrail",
  [ER_EPR_SOLVER_CLAIM_IDS.solverTelemetryNotRealUniverseWormholes]: "supports_boundary",
  [ER_EPR_SOLVER_CLAIM_IDS.solverTelemetryNotNhm2Propulsion]: "supports_boundary",
};

export const ER_EPR_SOLVER_CLAIM_UNCERTAINTY_NOTES: Record<ErEprSolverClaimId, string> = {
  [ER_EPR_SOLVER_CLAIM_IDS.rawTelemetryBeforeInterpretation]:
    "Raw solver telemetry must be preserved before normalized scores are interpreted.",
  [ER_EPR_SOLVER_CLAIM_IDS.declaredToyDualBackendOnly]:
    "Backend declarations bound the claim to a toy-dual or control model family.",
  [ER_EPR_SOLVER_CLAIM_IDS.doubleTraceTraversabilityProtocolContext]:
    "Double-trace traversability applies to specific holographic setups and is not a propulsion mechanism.",
  [ER_EPR_SOLVER_CLAIM_IDS.sykTeleportationProtocolContext]:
    "SYK teleportation protocols are model-internal analogues and need controls before interpretation.",
  [ER_EPR_SOLVER_CLAIM_IDS.controlBatteryRequired]:
    "Wrong-sign, no-coupling, disentangled, shuffled, random-matrix, and spin-chain controls constrain false positives.",
  [ER_EPR_SOLVER_CLAIM_IDS.entropyWashoutDemotesSolverSignal]:
    "Entropy stretch is a visibility/demotion diagnostic and does not physically change hbar.",
  [ER_EPR_SOLVER_CLAIM_IDS.solverTelemetryNotRealUniverseWormholes]:
    "Solver telemetry cannot prove real-universe Einstein-Rosen bridges or wormhole inventories.",
  [ER_EPR_SOLVER_CLAIM_IDS.solverTelemetryNotNhm2Propulsion]:
    "Solver telemetry is a QST sidecar result and cannot validate NHM2 propulsion or stress-energy sourcing.",
};

export function allErEprSolverClaimIds(): ErEprSolverClaimId[] {
  return Object.values(ER_EPR_SOLVER_CLAIM_IDS);
}

export function citationsForErEprSolverClaims(claimIds: ErEprSolverClaimId[]): string[] {
  return [...new Set(claimIds.flatMap((claimId) => ER_EPR_SOLVER_CLAIM_SOURCES[claimId]))];
}

export function sourceRolesForErEprSolverClaims(
  claimIds: ErEprSolverClaimId[],
): Record<ErEprSolverClaimId, ErEprSolverSourceRole> {
  return Object.fromEntries(
    claimIds.map((claimId) => [claimId, ER_EPR_SOLVER_CLAIM_SOURCE_ROLES[claimId]]),
  ) as Record<ErEprSolverClaimId, ErEprSolverSourceRole>;
}

export function uncertaintyNotesForErEprSolverClaims(claimIds: ErEprSolverClaimId[]): string[] {
  return claimIds.map((claimId) => ER_EPR_SOLVER_CLAIM_UNCERTAINTY_NOTES[claimId]);
}
