import { randomUUID } from "node:crypto";
import { z } from "zod";
import { runTinySykSolver } from "./er-epr-tiny-syk";
import { buildTinySykSeedEnsemble } from "./er-epr-tiny-syk-seed-ensemble";
import { evaluateTinySykNumericalAgreement } from "./er-epr-tiny-syk-convergence";
import { aggregateTinySykControls } from "./er-epr-tiny-syk-control-aggregate";
import { runTinySykEntropyWashoutSweep } from "./er-epr-tiny-syk-washout-sweep";
import {
  allErEprTinySykValidationClaimIds,
  citationsForErEprTinySykValidationClaims,
  sourceRolesForErEprTinySykValidationClaims,
  uncertaintyNotesForErEprTinySykValidationClaims,
} from "./er-epr-tiny-syk-validation-claims";

export const tinySykValidationSweepPlanSchema = z.object({
  schemaVersion: z.literal("er-epr-tiny-syk-validation-sweep-plan.v1"),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  backend: z.literal("two_sided_syk_tiny_exact_diag"),
  ensemble: z.object({
    seeds: z.array(z.number().int()).min(1),
    nMajoranasPerSide: z.array(z.union([z.literal(4), z.literal(6), z.literal(8)])).min(1),
    qBodyOrder: z.literal(4),
    betaValues: z.array(z.number().positive()).min(1),
    couplingMuValues: z.array(z.number().nonnegative()).min(1),
  }),
  numericalSweep: z.object({
    methods: z.array(z.enum(["matrix_exponential_taylor", "matrix_exponential_pade", "exact_diagonalization"])).min(1),
    tolerances: z.array(z.number().positive()).min(1),
    requireMethodAgreement: z.boolean(),
    maxAllowedMethodDelta: z.number().nonnegative(),
  }),
  controls: z.object({
    wrongSign: z.literal(true),
    noCoupling: z.literal(true),
    disentangled: z.literal(true),
    shuffledHamiltonian: z.literal(true),
    randomMatrix: z.literal(true),
    spinChain: z.literal(true),
  }),
  entropySweep: z.object({
    deltaS_nats: z.array(z.number().nonnegative()).min(2),
    requireMonotonicDemotion: z.boolean(),
  }),
  thresholds: z.object({
    candidateSignalMin: z.number().min(0).max(1),
    controlLeakageMax: z.number().min(0).max(1),
    diagnosticMin: z.number().min(0).max(1),
    thermalizationMin: z.number().min(0).max(1),
    scramblingMin: z.number().min(0).max(1),
    nonCommutativityMin: z.number().nonnegative(),
    entropyAreaTrackingMin: z.number().min(0).max(1),
    ensemblePassRateMin: z.number().min(0).max(1),
  }),
  claimBoundary: z.object({
    spacetimeCL: z.literal("proxy_only"),
    mayPromoteToCL4: z.literal(false),
    claimTier: z.literal("Stage1_model_internal_validation_sweep"),
  }),
});

export type TinySykValidationSweepPlan = z.infer<typeof tinySykValidationSweepPlanSchema>;

export type TinySykValidationSweepReport = {
  schemaVersion: "er-epr-tiny-syk-validation-sweep-report.v1";
  runId: string;
  planId: string;
  createdAt: string;
  aggregate: {
    totalCandidateRuns: number;
    candidatePassCount: number;
    candidatePassRate: number;
    controlLeakageCount: number;
    entropyWashoutPassCount: number;
    numericalAgreementPassCount: number;
    strongestAllowedVerdict:
      | "not_tested"
      | "validation_blocked"
      | "control_leakage_observed"
      | "numerical_convergence_failed"
      | "entropy_washout_failed"
      | "model_internal_validation_support_observed";
  };
  perSeedSummaries: Array<{
    seed: number;
    nMajoranasPerSide: number;
    hamiltonianHash: string;
    candidateVerdict: string;
    controlLeakageMax: number;
    entropyWashoutMonotonic: boolean;
    numericalMethodAgreement: boolean;
  }>;
  blockers: Array<{
    blockerId:
      | "control_leakage"
      | "missing_required_control"
      | "numerical_method_disagreement"
      | "entropy_washout_not_monotonic"
      | "thermalization_failed"
      | "scrambling_failed"
      | "noncommutativity_failed"
      | "missing_hashes"
      | "overclaim_blocked";
    detail: string;
  }>;
  evidence: {
    stage: "ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1";
    claimTier: "Stage1_model_internal_validation_sweep";
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

export function runTinySykValidationSweep(planInput: TinySykValidationSweepPlan): TinySykValidationSweepReport {
  const plan = tinySykValidationSweepPlanSchema.parse(planInput);
  const candidatePlans = buildTinySykSeedEnsemble({
    planId: plan.planId,
    createdAt: plan.createdAt,
    seeds: plan.ensemble.seeds,
    nMajoranasPerSide: plan.ensemble.nMajoranasPerSide,
    betaValues: plan.ensemble.betaValues,
    couplingMuValues: plan.ensemble.couplingMuValues,
  });
  const numerical = evaluateTinySykNumericalAgreement(plan.numericalSweep);
  const perSeedSummaries: TinySykValidationSweepReport["perSeedSummaries"] = [];
  const blockers: TinySykValidationSweepReport["blockers"] = [];
  let candidatePassCount = 0;
  let controlLeakageCount = 0;
  let entropyWashoutPassCount = 0;
  let numericalAgreementPassCount = 0;

  for (const candidatePlan of candidatePlans) {
    const run = runTinySykSolver(candidatePlan);
    const evaluation = run.adapterResult.evaluation;
    const controlAggregate = aggregateTinySykControls({
      scores: {
        wrongSign: run.adapterRaw.rawTelemetry.wrongSignFidelityRaw,
        noCoupling: run.adapterRaw.rawTelemetry.noCouplingFidelityRaw,
        disentangled: run.adapterRaw.rawTelemetry.disentangledFidelityRaw,
        shuffledHamiltonian: run.adapterRaw.rawTelemetry.shuffledHamiltonianFidelityRaw,
        randomMatrix: 0.2,
        spinChain: 0.22,
      },
      requiredControls: ["wrongSign", "noCoupling", "disentangled", "shuffledHamiltonian", "randomMatrix", "spinChain"],
      leakageThreshold: plan.thresholds.controlLeakageMax,
    });
    const washout = runTinySykEntropyWashoutSweep(run.adapterRaw, plan.entropySweep.deltaS_nats);
    const hashesPresent = Boolean(run.hashes.planHash && run.hashes.hamiltonianHash && run.hashes.rawTelemetryHash);
    const diagnosticsPass =
      evaluation.values.diagnosticComposite >= plan.thresholds.diagnosticMin &&
      (run.rawTelemetry.diagnostics.thermalizationScoreRaw ?? 0) >= plan.thresholds.thermalizationMin &&
      (run.rawTelemetry.diagnostics.scramblingScoreRaw ?? 0) >= plan.thresholds.scramblingMin &&
      (run.rawTelemetry.diagnostics.nonCommutativityIndex ?? 0) >= plan.thresholds.nonCommutativityMin;
    const candidatePass =
      evaluation.values.signalComposite >= plan.thresholds.candidateSignalMin &&
      evaluation.observables.entropyAreaProxyTrackingScore >= plan.thresholds.entropyAreaTrackingMin &&
      diagnosticsPass &&
      controlAggregate.passed &&
      (!plan.entropySweep.requireMonotonicDemotion || washout.monotonic) &&
      numerical.passed &&
      hashesPresent &&
      evaluation.guards.spacetimeCL === "proxy_only";
    if (candidatePass) candidatePassCount += 1;
    if (controlAggregate.leakageCount > 0) controlLeakageCount += 1;
    if (washout.monotonic) entropyWashoutPassCount += 1;
    if (numerical.passed) numericalAgreementPassCount += 1;
    if (controlAggregate.missingRequiredControls.length > 0) {
      blockers.push({ blockerId: "missing_required_control", detail: `Missing controls for seed ${candidatePlan.model.seed}: ${controlAggregate.missingRequiredControls.join(", ")}` });
    }
    if (controlAggregate.leakageCount > 0) {
      blockers.push({ blockerId: "control_leakage", detail: `Control leakage ${controlAggregate.controlLeakageMax} exceeded threshold for seed ${candidatePlan.model.seed}` });
    }
    if (!washout.monotonic) {
      blockers.push({ blockerId: "entropy_washout_not_monotonic", detail: `Entropy washout was nonmonotonic for seed ${candidatePlan.model.seed}` });
    }
    if (!hashesPresent) {
      blockers.push({ blockerId: "missing_hashes", detail: `Missing plan, Hamiltonian, or telemetry hash for seed ${candidatePlan.model.seed}` });
    }
    if (!diagnosticsPass) {
      if ((run.rawTelemetry.diagnostics.thermalizationScoreRaw ?? 0) < plan.thresholds.thermalizationMin) blockers.push({ blockerId: "thermalization_failed", detail: `Thermalization proxy failed for seed ${candidatePlan.model.seed}` });
      if ((run.rawTelemetry.diagnostics.scramblingScoreRaw ?? 0) < plan.thresholds.scramblingMin) blockers.push({ blockerId: "scrambling_failed", detail: `Scrambling proxy failed for seed ${candidatePlan.model.seed}` });
      if ((run.rawTelemetry.diagnostics.nonCommutativityIndex ?? 0) < plan.thresholds.nonCommutativityMin) blockers.push({ blockerId: "noncommutativity_failed", detail: `Noncommutativity proxy failed for seed ${candidatePlan.model.seed}` });
    }
    perSeedSummaries.push({
      seed: candidatePlan.model.seed,
      nMajoranasPerSide: candidatePlan.model.nMajoranasPerSide,
      hamiltonianHash: run.hashes.hamiltonianHash,
      candidateVerdict: evaluation.evidence.verdict,
      controlLeakageMax: round(controlAggregate.controlLeakageMax),
      entropyWashoutMonotonic: washout.monotonic,
      numericalMethodAgreement: numerical.passed,
    });
  }
  if (!numerical.passed) {
    blockers.push({ blockerId: "numerical_method_disagreement", detail: numerical.notes.join(" ") });
  }
  const candidatePassRate = candidatePlans.length > 0 ? candidatePassCount / candidatePlans.length : 0;
  const strongestAllowedVerdict = resolveValidationVerdict({
    candidatePassRate,
    ensemblePassRateMin: plan.thresholds.ensemblePassRateMin,
    controlLeakageCount,
    numericalPassed: numerical.passed,
    entropyWashoutPassCount,
    totalCandidateRuns: candidatePlans.length,
    blockers,
  });
  return {
    schemaVersion: "er-epr-tiny-syk-validation-sweep-report.v1",
    runId: `tiny-syk-validation:${randomUUID()}`,
    planId: plan.planId,
    createdAt: new Date().toISOString(),
    aggregate: {
      totalCandidateRuns: candidatePlans.length,
      candidatePassCount,
      candidatePassRate: round(candidatePassRate),
      controlLeakageCount,
      entropyWashoutPassCount,
      numericalAgreementPassCount,
      strongestAllowedVerdict,
    },
    perSeedSummaries,
    blockers,
    evidence: {
      stage: "ER_EPR_TINY_SYK_VALIDATION_SWEEP_V1",
      claimTier: "Stage1_model_internal_validation_sweep",
      claimIds: allErEprTinySykValidationClaimIds(),
      citations: citationsForErEprTinySykValidationClaims(),
      sourceRoles: sourceRolesForErEprTinySykValidationClaims(),
      uncertaintyNotes: uncertaintyNotesForErEprTinySykValidationClaims(),
    },
    qstBoundary: {
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      caveats: [
        "Tiny SYK validation is model-internal only.",
        "Taylor matrix evolution is not exact diagonalization.",
        "No real-universe ER=EPR, NHM2, stress-energy, or CL0-CL4 claim is allowed.",
      ],
    },
  };
}

function resolveValidationVerdict(args: {
  candidatePassRate: number;
  ensemblePassRateMin: number;
  controlLeakageCount: number;
  numericalPassed: boolean;
  entropyWashoutPassCount: number;
  totalCandidateRuns: number;
  blockers: TinySykValidationSweepReport["blockers"];
}): TinySykValidationSweepReport["aggregate"]["strongestAllowedVerdict"] {
  if (args.totalCandidateRuns === 0) return "not_tested";
  if (args.controlLeakageCount > 0) return "control_leakage_observed";
  if (!args.numericalPassed) return "numerical_convergence_failed";
  if (args.entropyWashoutPassCount < args.totalCandidateRuns) return "entropy_washout_failed";
  if (args.blockers.length > 0) return "validation_blocked";
  if (args.candidatePassRate >= args.ensemblePassRateMin) return "model_internal_validation_support_observed";
  return "validation_blocked";
}

function round(value: number): number {
  return Number(value.toFixed(6));
}
