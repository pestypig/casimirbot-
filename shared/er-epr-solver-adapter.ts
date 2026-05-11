import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  evaluateErEprSimulation,
  erEprModelFamilySchema,
  type ErEprSimulationEvaluation,
  type ErEprSimulationInput,
} from "./er-epr-simulation";
import {
  type ErEprRawSolverObservables,
  erEprRawSolverObservablesSchema,
} from "./er-epr-raw-observables";
import {
  normalizeErEprRawObservables,
  type ErEprNormalizationThresholds,
} from "./er-epr-observable-normalizer";
import {
  allErEprSolverClaimIds,
  citationsForErEprSolverClaims,
  sourceRolesForErEprSolverClaims,
  uncertaintyNotesForErEprSolverClaims,
} from "./er-epr-solver-claims";

export const erEprSolverAdapterRequestSchema = z.object({
  schemaVersion: z.literal("er-epr-solver-adapter-request.v1"),
  requestId: z.string().min(1),
  createdAt: z.string().datetime(),
  raw: erEprRawSolverObservablesSchema,
  thresholds: z.object({
    signalMin: z.number().min(0).max(1).optional(),
    controlMax: z.number().min(0).max(1).optional(),
    diagnosticMin: z.number().min(0).max(1).optional(),
    entropyAreaTrackingMin: z.number().min(0).max(1).optional(),
    entropyVisibilityMin: z.number().min(0).max(1).optional(),
    strongSupportMin: z.number().min(0).max(1).optional(),
  }).default({}),
  normalizationThresholds: z.object({
    timeDelayScale: z.number().positive().optional(),
    sizeWindingGrowthScale: z.number().positive().optional(),
    scramblingDropScale: z.number().positive().optional(),
    thermalizationVarianceScale: z.number().positive().optional(),
    entropyAreaProxyScale: z.number().positive().optional(),
  }).default({}),
  entropyStretch: z.object({
    deltaS_nats: z.number().nonnegative().default(0),
  }).default({ deltaS_nats: 0 }),
  requestedSpacetimeCL: z.enum(["proxy_only", "CL0", "CL1", "CL2", "CL3", "CL4"]).default("proxy_only"),
});

export type ErEprSolverAdapterRequest = z.input<typeof erEprSolverAdapterRequestSchema>;

export type ErEprSolverAdapterResult = {
  schemaVersion: "er-epr-solver-adapter-result.v1";
  adapterRunId: string;
  createdAt: string;
  raw: ErEprRawSolverObservables;
  normalizedInput: ErEprSimulationInput;
  evaluation: ErEprSimulationEvaluation;
  evidence: {
    stage: "ER_EPR_STAGE1_SOLVER_ADAPTER_V1";
    claimTier:
      | "fixture_only_solver_adapter"
      | "solver_simulated_model_internal_adapter"
      | "externally_reproduced_model_internal_adapter"
      | "failed_solver_adapter";
    claimIds: string[];
    citations: string[];
    sourceRoles: Record<string, string>;
    uncertaintyNotes: string[];
  };
  qstBoundary: {
    spacetimeCL: "proxy_only";
    mayPromoteToCL4: false;
    caveats: string[];
  };
};

export function runErEprSolverAdapter(
  request: ErEprSolverAdapterRequest,
): ErEprSolverAdapterResult {
  const parsed = erEprSolverAdapterRequestSchema.parse(request);
  validateSolverProvenance(parsed.raw);
  const normalizedInput = buildSimulationInput(
    parsed.raw,
    parsed.normalizationThresholds,
    parsed.entropyStretch,
    parsed.requestedSpacetimeCL,
  );
  const evaluation = evaluateErEprSimulation(normalizedInput, parsed.thresholds);
  const claimIds = allErEprSolverClaimIds();
  return {
    schemaVersion: "er-epr-solver-adapter-result.v1",
    adapterRunId: `er-epr-solver-adapter:${randomUUID()}`,
    createdAt: new Date().toISOString(),
    raw: parsed.raw,
    normalizedInput,
    evaluation,
    evidence: {
      stage: "ER_EPR_STAGE1_SOLVER_ADAPTER_V1",
      claimTier: claimTierFor(parsed.raw),
      claimIds,
      citations: citationsForErEprSolverClaims(claimIds),
      sourceRoles: sourceRolesForErEprSolverClaims(claimIds),
      uncertaintyNotes: uncertaintyNotesForErEprSolverClaims(claimIds),
    },
    qstBoundary: {
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      caveats: [
        "Solver adapter output is model-internal only.",
        "Raw telemetry is not real-universe ER=EPR evidence.",
        "No NHM2 propulsion, stress-energy, wormhole-inventory, or CL0-CL4 claim is allowed.",
      ],
    },
  };
}

function buildSimulationInput(
  raw: ErEprRawSolverObservables,
  normalizationThresholds: ErEprNormalizationThresholds,
  entropyStretch: { deltaS_nats: number },
  requestedSpacetimeCL: "proxy_only" | "CL0" | "CL1" | "CL2" | "CL3" | "CL4",
): ErEprSimulationInput {
  return {
    modelFamily: modelFamilyForBackend(raw.backend),
    nQubitsOrModes: raw.model.nQubitsOrModes,
    temperatureRegime: raw.model.temperatureRegime,
    initialState: raw.model.statePreparation,
    coupling: raw.model.coupling,
    probeInsertionTime: raw.rawTelemetry.injectionTime ?? 0,
    measurementWindow: Math.max(
      1e-12,
      (raw.rawTelemetry.extractionTime ?? 1) - (raw.rawTelemetry.injectionTime ?? 0),
    ),
    requestedSpacetimeCL,
    entropyStretch,
    observables: normalizeErEprRawObservables(raw, normalizationThresholds),
    starSim: { role: "not_used" },
  };
}

function modelFamilyForBackend(rawBackend: ErEprRawSolverObservables["backend"]): z.infer<typeof erEprModelFamilySchema> {
  switch (rawBackend) {
    case "two_sided_syk_tiny_exact_diag":
    case "two_sided_sparse_syk_import":
      return "two_sided_SYK";
    case "jt_gravity_fixture_import":
      return "JT_gravity_dual";
    case "tensor_network_ads_toy":
      return "tensor_network_ads";
    case "random_matrix_control":
      return "random_matrix_control";
    case "spin_chain_control":
      return "spin_chain_control";
  }
}

function validateSolverProvenance(raw: ErEprRawSolverObservables): void {
  if (raw.provenance.reproducibilityStatus === "solver_simulated") {
    if (!raw.model.hamiltonianHash || raw.model.seed === undefined) {
      throw new Error("solver_simulated ER=EPR raw telemetry requires hamiltonianHash and seed");
    }
    if (raw.rawTelemetry.teleportationFidelityRaw === undefined) {
      throw new Error("solver_simulated ER=EPR raw telemetry requires teleportationFidelityRaw");
    }
  }
  if (raw.provenance.reproducibilityStatus === "externally_reproduced" && !raw.model.hamiltonianHash) {
    throw new Error("externally_reproduced ER=EPR raw telemetry requires hamiltonianHash");
  }
}

function claimTierFor(
  raw: ErEprRawSolverObservables,
): ErEprSolverAdapterResult["evidence"]["claimTier"] {
  switch (raw.provenance.reproducibilityStatus) {
    case "fixture_only":
      return "fixture_only_solver_adapter";
    case "solver_simulated":
      return "solver_simulated_model_internal_adapter";
    case "externally_reproduced":
      return "externally_reproduced_model_internal_adapter";
    case "failed":
      return "failed_solver_adapter";
  }
}
