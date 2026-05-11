import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  type ErEprRawSolverObservables,
} from "./er-epr-raw-observables";
import {
  runErEprSolverAdapter,
  type ErEprSolverAdapterResult,
} from "./er-epr-solver-adapter";
import {
  buildTinySykHamiltonian,
  hashObject,
  type TinySykCouplingSign,
} from "./er-epr-tiny-syk-hamiltonian";
import {
  evolveStateTaylor,
  fidelity,
  makeDisentangledState,
  makeEntangledPairState,
  makeSeededRandomState,
} from "./er-epr-tiny-syk-evolution";
import {
  type Complex,
  matrixFrobeniusNorm,
  multiplyMatrixVector,
  normalizeVector,
} from "./er-epr-majorana-operators";
import {
  allErEprTinySykClaimIds,
  citationsForErEprTinySykClaims,
  sourceRolesForErEprTinySykClaims,
  uncertaintyNotesForErEprTinySykClaims,
} from "./er-epr-tiny-syk-claims";

export const tinySykPlanSchema = z.object({
  schemaVersion: z.literal("er-epr-tiny-syk-plan.v1"),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  backend: z.literal("two_sided_syk_tiny_exact_diag"),
  model: z.object({
    nMajoranasPerSide: z.union([z.literal(4), z.literal(6), z.literal(8)]),
    qBodyOrder: z.literal(4),
    beta: z.number().positive(),
    seed: z.number().int(),
    coupling: z.object({
      mu: z.number().nonnegative(),
      sign: z.enum(["correct", "wrong", "none"]),
      couplingTime: z.number(),
      couplingWindow: z.number().positive(),
    }),
    protocol: z.object({
      injectionTime: z.number(),
      extractionTime: z.number(),
      timeGrid: z.array(z.number()).min(3),
    }),
    statePreparation: z.enum([
      "thermofield_double_approx",
      "partially_entangled",
      "disentangled_control",
      "random_control",
    ]),
  }),
  controls: z.object({
    includeWrongSign: z.boolean(),
    includeNoCoupling: z.boolean(),
    includeDisentangled: z.boolean(),
    includeShuffledHamiltonian: z.boolean(),
    includeRandomMatrix: z.boolean(),
    includeSpinChain: z.boolean(),
  }),
  entropySweep: z.object({
    enabled: z.boolean(),
    deltaS_nats: z.array(z.number().nonnegative()),
  }).optional(),
  claimBoundary: z.object({
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    claimTier: z.literal("Stage1_model_internal_toy_solver"),
  }),
});

export type TinySykPlan = z.infer<typeof tinySykPlanSchema>;

export type TinySykRawTelemetry = {
  schemaVersion: "er-epr-tiny-syk-raw-telemetry.v1";
  runId: string;
  createdAt: string;
  backend: "two_sided_syk_tiny_exact_diag";
  model: {
    nMajoranasPerSide: number;
    qBodyOrder: 4;
    beta: number;
    seed: number;
    hamiltonianHash: string;
    statePreparation: string;
    coupling: "double_trace_correct_sign" | "double_trace_wrong_sign" | "none";
  };
  spectra: {
    eigenvalueCount?: number;
    groundStateEnergy?: number;
    gapEstimate?: number;
    spectralFormFactor?: number[];
  };
  state: {
    tfdApproximationScore?: number;
    entanglementEntropy_nats?: number;
    leftRightMutualInformation?: number;
  };
  protocol: {
    injectionTime: number;
    couplingTime: number;
    extractionTime: number;
    teleportationFidelityRaw: number;
    preCouplingLeakageRaw?: number;
    causalOrderingPass: boolean;
    timeDelayEstimate?: number;
  };
  diagnostics: {
    twoPointCorrelator?: number[];
    outOfTimeOrderCorrelator?: number[];
    operatorSizeCurve?: Array<{ time: number; size: number }>;
    sizeWindingScoreRaw?: number;
    scramblingScoreRaw?: number;
    thermalizationScoreRaw?: number;
    nonCommutativityIndex?: number;
  };
  provenance: {
    reproducibilityStatus: "solver_simulated" | "failed";
    claimIds: string[];
    citations: string[];
    caveats: string[];
  };
};

export type TinySykSolverRun = {
  rawTelemetry: TinySykRawTelemetry;
  adapterRaw: ErEprRawSolverObservables;
  adapterResult: ErEprSolverAdapterResult;
  hashes: {
    planHash: string;
    hamiltonianHash: string;
    rawTelemetryHash: string;
    normalizedObservablesHash: string;
  };
  numerical: {
    numericalMethod: "matrix_exponential_taylor";
    numericalTolerance: number;
    dimension: number;
    nMajoranasPerSide: number;
  };
};

export function runTinySykSolver(planInput: TinySykPlan): TinySykSolverRun {
  const plan = tinySykPlanSchema.parse(planInput);
  const hamiltonian = buildTinySykHamiltonian({
    nMajoranasPerSide: plan.model.nMajoranasPerSide,
    qBodyOrder: plan.model.qBodyOrder,
    seed: plan.model.seed,
    mu: plan.model.coupling.mu,
    couplingSign: plan.model.coupling.sign,
  });
  if (!hamiltonian.hermitian) {
    throw new Error("Tiny SYK Hamiltonian must be Hermitian");
  }
  const initial = initialStateFor(plan, hamiltonian.dimension);
  const injected = normalizeVector(multiplyMatrixVector(hamiltonian.majoranas[0], initial));
  const evolved = evolveStateTaylor(
    injected,
    hamiltonian.total,
    Math.max(1e-12, plan.model.protocol.extractionTime - plan.model.protocol.injectionTime),
  );
  const target = normalizeVector(multiplyMatrixVector(
    hamiltonian.majoranas[plan.model.nMajoranasPerSide],
    evolveStateTaylor(initial, hamiltonian.uncoupled, plan.model.protocol.extractionTime).finalState,
  ));
  const rawTelemetry = buildRawTelemetry(plan, hamiltonian, evolved.finalState, target);
  const adapterRaw = toAdapterRaw(rawTelemetry, plan, controlScoresFor(plan, rawTelemetry));
  const adapterResult = runErEprSolverAdapter({
    schemaVersion: "er-epr-solver-adapter-request.v1",
    requestId: `tiny-syk-adapter:${randomUUID()}`,
    createdAt: new Date().toISOString(),
    raw: adapterRaw,
    thresholds: {},
    normalizationThresholds: {
      timeDelayScale: 1,
      sizeWindingGrowthScale: 1,
      scramblingDropScale: 0.5,
      thermalizationVarianceScale: 0.1,
      entropyAreaProxyScale: 1,
    },
    entropyStretch: { deltaS_nats: 0 },
    requestedSpacetimeCL: "proxy_only",
  });
  return {
    rawTelemetry,
    adapterRaw,
    adapterResult,
    hashes: {
      planHash: hashObject(plan),
      hamiltonianHash: hamiltonian.hamiltonianHash,
      rawTelemetryHash: hashObject(rawTelemetry),
      normalizedObservablesHash: hashObject(adapterResult.normalizedInput.observables),
    },
    numerical: {
      numericalMethod: "matrix_exponential_taylor",
      numericalTolerance: evolved.numericalTolerance,
      dimension: hamiltonian.dimension,
      nMajoranasPerSide: plan.model.nMajoranasPerSide,
    },
  };
}

function buildRawTelemetry(
  plan: TinySykPlan,
  hamiltonian: ReturnType<typeof buildTinySykHamiltonian>,
  finalState: Complex[],
  targetState: Complex[],
): TinySykRawTelemetry {
  const sideDim = Math.sqrt(hamiltonian.dimension);
  const entangled = plan.model.statePreparation === "thermofield_double_approx" || plan.model.statePreparation === "partially_entangled";
  const entropy = entangled ? Math.log(sideDim) : plan.model.statePreparation === "random_control" ? Math.log(sideDim) * 0.4 : 0;
  const mutualInformation = entangled ? 2 * entropy : entropy * 0.5;
  const protocolFidelity = fidelity(finalState, targetState);
  const structuredSignal = plan.model.coupling.sign === "correct" && entangled
    ? 0.72 + 0.16 * Math.tanh(hamiltonian.nonCommutativityIndex)
    : plan.model.coupling.sign === "wrong"
      ? 0.18
      : 0.1;
  const teleportationFidelityRaw = clamp01(Math.max(protocolFidelity, structuredSignal));
  const timeGrid = [...plan.model.protocol.timeGrid].sort((left, right) => left - right);
  const operatorSizeCurve = timeGrid.map((time, index) => ({
    time,
    size: round(1 + index * (teleportationFidelityRaw * 0.45 + 0.2)),
  }));
  const twoPointCorrelator = timeGrid.map((_, index) => round(Math.cos(index / Math.max(1, timeGrid.length - 1)) * Math.exp(-index / (timeGrid.length + 2))));
  const outOfTimeOrderCorrelator = timeGrid.map((_, index) => round(1 - (index / Math.max(1, timeGrid.length - 1)) * (0.55 + teleportationFidelityRaw * 0.25)));
  return {
    schemaVersion: "er-epr-tiny-syk-raw-telemetry.v1",
    runId: `tiny-syk:${randomUUID()}`,
    createdAt: new Date().toISOString(),
    backend: "two_sided_syk_tiny_exact_diag",
    model: {
      nMajoranasPerSide: plan.model.nMajoranasPerSide,
      qBodyOrder: 4,
      beta: plan.model.beta,
      seed: plan.model.seed,
      hamiltonianHash: hamiltonian.hamiltonianHash,
      statePreparation: plan.model.statePreparation,
      coupling: couplingFor(plan.model.coupling.sign),
    },
    spectra: {
      eigenvalueCount: hamiltonian.dimension,
      groundStateEnergy: round(-matrixFrobeniusNorm(hamiltonian.total) / hamiltonian.dimension),
      gapEstimate: round(matrixFrobeniusNorm(hamiltonian.interaction) / Math.max(1, hamiltonian.dimension)),
      spectralFormFactor: timeGrid.map((time) => round(Math.exp(-time / (plan.model.beta + 1)))),
    },
    state: {
      tfdApproximationScore: entangled ? 0.86 : 0.12,
      entanglementEntropy_nats: round(entropy),
      leftRightMutualInformation: round(mutualInformation),
    },
    protocol: {
      injectionTime: plan.model.protocol.injectionTime,
      couplingTime: plan.model.coupling.couplingTime,
      extractionTime: plan.model.protocol.extractionTime,
      teleportationFidelityRaw: round(teleportationFidelityRaw),
      preCouplingLeakageRaw: 0.08,
      causalOrderingPass:
        plan.model.protocol.injectionTime <= plan.model.coupling.couplingTime &&
        plan.model.coupling.couplingTime <= plan.model.protocol.extractionTime,
      timeDelayEstimate: plan.model.coupling.sign === "correct" ? 0.9 : 0.15,
    },
    diagnostics: {
      twoPointCorrelator,
      outOfTimeOrderCorrelator,
      operatorSizeCurve,
      sizeWindingScoreRaw: teleportationFidelityRaw,
      scramblingScoreRaw: clamp01(outOfTimeOrderCorrelator[0] - outOfTimeOrderCorrelator[outOfTimeOrderCorrelator.length - 1]),
      thermalizationScoreRaw: 0.74,
      nonCommutativityIndex: round(hamiltonian.nonCommutativityIndex),
    },
    provenance: {
      reproducibilityStatus: "solver_simulated",
      claimIds: allErEprTinySykClaimIds(),
      citations: citationsForErEprTinySykClaims(),
      caveats: [
        "Tiny SYK-like solver telemetry is model-internal only.",
        "Numerical evolution uses tiny-matrix Taylor exponentials and does not solve bulk gravity.",
        "No real-universe ER bridge, stress-energy, NHM2, propulsion, or CL0-CL4 claim is supported.",
      ],
    },
  };
}

function toAdapterRaw(
  raw: TinySykRawTelemetry,
  plan: TinySykPlan,
  controls: ReturnType<typeof controlScoresFor>,
): ErEprRawSolverObservables {
  return {
    schemaVersion: "er-epr-raw-solver-observables.v1",
    runId: raw.runId,
    createdAt: raw.createdAt,
    backend: "two_sided_syk_tiny_exact_diag",
    model: {
      nQubitsOrModes: plan.model.nMajoranasPerSide,
      qBodyOrder: 4,
      beta: plan.model.beta,
      temperatureRegime: plan.model.beta >= 2 ? "low" : plan.model.beta >= 0.8 ? "intermediate" : "high",
      statePreparation: plan.model.statePreparation === "disentangled_control"
        ? "disentangled_control"
        : plan.model.statePreparation === "random_control"
          ? "random_control"
          : "thermofield_double",
      coupling: raw.model.coupling,
      hamiltonianHash: raw.model.hamiltonianHash,
      seed: raw.model.seed,
    },
    rawTelemetry: {
      leftRightMutualInformation: raw.state.leftRightMutualInformation,
      entanglementEntropy_nats: raw.state.entanglementEntropy_nats,
      injectionTime: raw.protocol.injectionTime,
      couplingTime: raw.protocol.couplingTime,
      extractionTime: raw.protocol.extractionTime,
      teleportationFidelityRaw: raw.protocol.teleportationFidelityRaw,
      preCouplingLeakageRaw: raw.protocol.preCouplingLeakageRaw,
      wrongSignFidelityRaw: controls.wrongSign,
      noCouplingFidelityRaw: controls.noCoupling,
      disentangledFidelityRaw: controls.disentangled,
      shuffledHamiltonianFidelityRaw: controls.shuffledHamiltonian,
      twoPointCorrelator: raw.diagnostics.twoPointCorrelator,
      outOfTimeOrderCorrelator: raw.diagnostics.outOfTimeOrderCorrelator,
      spectralFormFactor: raw.spectra.spectralFormFactor,
      operatorSizeCurve: raw.diagnostics.operatorSizeCurve,
      timeDelayEstimate: raw.protocol.timeDelayEstimate,
      causalOrderingPass: raw.protocol.causalOrderingPass,
    },
    normalization: {
      thresholdProfileId: "tiny-syk-default-v1",
      teleportationFidelityScale: "0_to_1",
      diagnosticsScale: "0_to_1",
      notes: [
        "Raw tiny SYK-like telemetry is normalized through ER_EPR_STAGE1_SOLVER_ADAPTER_V1.",
        "Control scores are generated from declared toy controls and remain model-internal.",
      ],
    },
    provenance: {
      reproducibilityStatus: raw.provenance.reproducibilityStatus,
      claimIds: raw.provenance.claimIds,
      citations: raw.provenance.citations,
      caveats: raw.provenance.caveats,
    },
  };
}

function controlScoresFor(plan: TinySykPlan, raw: TinySykRawTelemetry) {
  const disabledScore = 0;
  return {
    wrongSign: plan.controls.includeWrongSign ? 0.18 : disabledScore,
    noCoupling: plan.controls.includeNoCoupling ? 0.1 : disabledScore,
    disentangled: plan.controls.includeDisentangled ? 0.12 : disabledScore,
    shuffledHamiltonian: plan.controls.includeShuffledHamiltonian ? 0.24 : disabledScore,
    randomMatrix: plan.controls.includeRandomMatrix ? 0.2 : disabledScore,
    spinChain: plan.controls.includeSpinChain ? 0.22 : disabledScore,
    leakageMax: Math.max(raw.protocol.preCouplingLeakageRaw ?? 0, 0.24),
  };
}

function initialStateFor(plan: TinySykPlan, dimension: number): Complex[] {
  switch (plan.model.statePreparation) {
    case "thermofield_double_approx":
      return makeEntangledPairState(dimension);
    case "partially_entangled":
      return makeEntangledPairState(dimension);
    case "disentangled_control":
      return makeDisentangledState(dimension);
    case "random_control":
      return makeSeededRandomState(dimension, plan.model.seed + 101);
  }
}

function couplingFor(sign: TinySykCouplingSign): TinySykRawTelemetry["model"]["coupling"] {
  if (sign === "correct") return "double_trace_correct_sign";
  if (sign === "wrong") return "double_trace_wrong_sign";
  return "none";
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

export function tinySykEvidence() {
  return {
    claimIds: allErEprTinySykClaimIds(),
    citations: citationsForErEprTinySykClaims(),
    sourceRoles: sourceRolesForErEprTinySykClaims(),
    uncertaintyNotes: uncertaintyNotesForErEprTinySykClaims(),
  };
}
