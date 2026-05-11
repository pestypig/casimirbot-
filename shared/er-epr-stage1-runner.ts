import { z } from "zod";

import {
  REQUIRED_ER_EPR_CONTROL_KINDS,
  classifyErEprControlFailure,
  erEprControlKindSchema,
  type ErEprControlFailureSummary,
  type ErEprControlKind,
} from "./er-epr-control-suite";
import {
  evaluateErEprSimulation,
  erEprSimulationInputSchema,
  erEprSimulationVerdictSchema,
  type ErEprSimulationEvaluation,
  type ErEprSimulationInput,
  type ErEprSimulationVerdict,
} from "./er-epr-simulation";
import {
  getErEprStage1CitationsForClaimIds,
  getErEprStage1SourceRoles,
  getErEprStage1UncertaintyNotes,
  type ErEprStage1ClaimId,
  type ErEprStage1SourceRole,
} from "./er-epr-research-claims";

const nonEmptyStringArray = z.array(z.string().min(1)).min(1);

export const erEprStage1ThresholdProfileSchema = z.object({
  signalMin: z.number().finite().min(0).max(1).default(0.7),
  controlMax: z.number().finite().min(0).max(1).default(0.35),
  diagnosticMin: z.number().finite().min(0).max(1).default(0.6),
  entropyAreaTrackingMin: z.number().finite().min(0).max(1).default(0.6),
  entropyVisibilityMin: z.number().finite().min(0).max(1).default(0.05),
  strongSupportMin: z.number().finite().min(0).max(1).default(0.82),
});

export const erEprStage1RunEntrySchema = z.object({
  runId: z.string().min(1),
  modelRef: z.string().min(1),
  inputHash: z.string().min(1),
  input: erEprSimulationInputSchema,
  claimIds: nonEmptyStringArray,
  citations: nonEmptyStringArray,
  caveats: nonEmptyStringArray,
});

export const erEprStage1ControlRunEntrySchema = erEprStage1RunEntrySchema.extend({
  controlKind: erEprControlKindSchema,
});

export const erEprStage1RunPlanSchema = z.object({
  schemaVersion: z.literal("er-epr-stage1-run-plan/1"),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  modelRefs: nonEmptyStringArray,
  thresholdProfile: erEprStage1ThresholdProfileSchema.default({}),
  candidateRuns: z.array(erEprStage1RunEntrySchema).min(1),
  controlRuns: z.array(erEprStage1ControlRunEntrySchema).min(1),
  entropySweep: z.array(erEprStage1RunEntrySchema).default([]),
  starSimPolicy: z.object({
    allowedRole: z.literal("cosmological_structure_prior"),
    directEvidenceAllowed: z.literal(false),
  }).default({
    allowedRole: "cosmological_structure_prior",
    directEvidenceAllowed: false,
  }),
  citationPolicy: z.object({
    requiredClaimIds: nonEmptyStringArray,
    requiredCitations: nonEmptyStringArray,
  }),
  reproducibilityStatus: z.enum(["fixture_only", "simulated", "reproduced"]).default("fixture_only"),
});

export const erEprStage1BatchReportSchema = z.object({
  schemaVersion: z.literal("er-epr-stage1-batch-report/1"),
  runId: z.string().min(1),
  planId: z.string().min(1),
  createdAt: z.string().datetime(),
  candidateEvaluations: z.array(z.unknown()).min(1),
  controlEvaluations: z.array(z.unknown()).min(1),
  entropySweepResults: z.array(z.unknown()),
  failedControlSummary: z.object({
    requiredControlsPresent: z.boolean(),
    missingRequiredControls: z.array(erEprControlKindSchema),
    signalCarryingControls: z.array(z.unknown()),
    overclaimBlockedControls: z.array(z.unknown()),
    entropyWashoutObserved: z.boolean(),
    starSimPriorOnlyOk: z.boolean(),
    batchShouldDemote: z.boolean(),
  }),
  strongestVerdict: erEprSimulationVerdictSchema,
  strongestAllowedClaim: z.object({
    claimTier: z.literal("Stage1_falsifiable_model_support"),
    statement: z.string().min(1),
  }),
  blockedOverclaims: z.array(z.string()),
  claimIds: nonEmptyStringArray,
  citations: nonEmptyStringArray,
  sourceRoles: z.record(z.string()),
  uncertaintyNotes: nonEmptyStringArray,
  reproducibilityStatus: z.enum(["fixture_only", "simulated", "reproduced", "failed"]),
  caveats: nonEmptyStringArray,
});

export type ErEprStage1ThresholdProfile = z.output<typeof erEprStage1ThresholdProfileSchema>;
export type ErEprStage1RunEntry = z.output<typeof erEprStage1RunEntrySchema>;
export type ErEprStage1ControlRunEntry = z.output<typeof erEprStage1ControlRunEntrySchema>;
export type ErEprStage1RunPlan = z.input<typeof erEprStage1RunPlanSchema>;
export type ParsedErEprStage1RunPlan = z.output<typeof erEprStage1RunPlanSchema>;

export type ErEprStage1EvaluatedRun = ErEprStage1RunEntry & {
  evaluation: ErEprSimulationEvaluation;
};

export type ErEprStage1EvaluatedControlRun = ErEprStage1ControlRunEntry & {
  evaluation: ErEprSimulationEvaluation;
};

export type ErEprStage1BatchReport = Omit<
  z.output<typeof erEprStage1BatchReportSchema>,
  "candidateEvaluations" | "controlEvaluations" | "entropySweepResults" | "failedControlSummary" | "sourceRoles"
> & {
  candidateEvaluations: ErEprStage1EvaluatedRun[];
  controlEvaluations: ErEprStage1EvaluatedControlRun[];
  entropySweepResults: ErEprStage1EvaluatedRun[];
  failedControlSummary: ErEprControlFailureSummary;
  sourceRoles: Record<string, ErEprStage1SourceRole>;
};

const VERDICT_RANK: Record<ErEprSimulationVerdict, number> = {
  not_tested: 0,
  ordinary_control_explains_signal: 1,
  proxy_only_structure_prior: 2,
  overclaim_blocked: 3,
  model_internal_er_epr_support: 4,
  dual_model_support_strong: 5,
};

export function runErEprStage1Plan(plan: ErEprStage1RunPlan): ErEprStage1BatchReport {
  const parsed = erEprStage1RunPlanSchema.parse(plan);
  validateRunPlanClaimMetadata(parsed);
  const thresholds = parsed.thresholdProfile;
  const candidateEvaluations = parsed.candidateRuns.map((run) => evaluateRun(run, thresholds));
  const controlEvaluations = parsed.controlRuns.map((run) => ({
    ...run,
    evaluation: evaluateErEprSimulation(run.input, thresholds),
  }));
  const entropySweepResults = parsed.entropySweep.map((run) => evaluateRun(run, thresholds));
  const failedControlSummary = classifyErEprControlFailure(
    controlEvaluations.map((control) => ({
      runId: control.runId,
      controlKind: control.controlKind,
      evaluation: control.evaluation,
    })),
    thresholds,
  );
  const candidateVerdict = strongestCandidateVerdict(candidateEvaluations);
  const blockedOverclaims = collectBlockedOverclaims(candidateEvaluations, controlEvaluations, entropySweepResults);
  const strongestVerdict = resolveBatchVerdict({
    candidateVerdict,
    failedControlSummary,
    blockedOverclaims,
  });
  const claimIds = collectClaimIds(parsed, candidateEvaluations, controlEvaluations, entropySweepResults);
  const citations = [...new Set([...parsed.citationPolicy.requiredCitations, ...getErEprStage1CitationsForClaimIds(claimIds)])];
  const caveats = collectCaveats(parsed, candidateEvaluations, controlEvaluations, entropySweepResults);
  const report: ErEprStage1BatchReport = {
    schemaVersion: "er-epr-stage1-batch-report/1",
    runId: `${parsed.planId}:run`,
    planId: parsed.planId,
    createdAt: parsed.createdAt,
    candidateEvaluations,
    controlEvaluations,
    entropySweepResults,
    failedControlSummary,
    strongestVerdict,
    strongestAllowedClaim: {
      claimTier: "Stage1_falsifiable_model_support",
      statement: allowedClaimStatement(strongestVerdict),
    },
    blockedOverclaims,
    claimIds,
    citations,
    sourceRoles: getErEprStage1SourceRoles(claimIds),
    uncertaintyNotes: getErEprStage1UncertaintyNotes(claimIds),
    reproducibilityStatus: parsed.reproducibilityStatus,
    caveats,
  };

  return erEprStage1BatchReportSchema.parse(report) as ErEprStage1BatchReport;
}

export function summarizeErEprStage1Batch(report: ErEprStage1BatchReport): string {
  const lines = [
    `# ER=EPR Stage 1 Report`,
    "",
    `- Run ID: ${report.runId}`,
    `- Plan ID: ${report.planId}`,
    `- Reproducibility: ${report.reproducibilityStatus}`,
    `- Strongest verdict: ${report.strongestVerdict}`,
    `- Strongest allowed claim: ${report.strongestAllowedClaim.statement}`,
    `- Claim IDs: ${report.claimIds.join(", ")}`,
    `- Citations: ${report.citations.join(", ")}`,
    `- Entropy washout observed: ${report.failedControlSummary.entropyWashoutObserved}`,
    `- Required controls present: ${report.failedControlSummary.requiredControlsPresent}`,
    "",
    "## Caveats",
    ...report.caveats.map((caveat) => `- ${caveat}`),
    "",
    "## Uncertainty Notes",
    ...report.uncertaintyNotes.map((note) => `- ${note}`),
  ];
  return lines.join("\n");
}

function evaluateRun(run: ErEprStage1RunEntry, thresholds: ErEprStage1ThresholdProfile): ErEprStage1EvaluatedRun {
  return {
    ...run,
    evaluation: evaluateErEprSimulation(run.input, thresholds),
  };
}

function validateRunPlanClaimMetadata(plan: ParsedErEprStage1RunPlan): void {
  const allRuns = [...plan.candidateRuns, ...plan.controlRuns, ...plan.entropySweep];
  for (const run of allRuns) {
    if (run.claimIds.length === 0) {
      throw new Error(`ER=EPR run ${run.runId} is missing claimIds.`);
    }
    if (run.citations.length === 0) {
      throw new Error(`ER=EPR run ${run.runId} is missing citations.`);
    }
  }
}

function strongestCandidateVerdict(candidateEvaluations: ErEprStage1EvaluatedRun[]): ErEprSimulationVerdict {
  return candidateEvaluations
    .map((run) => run.evaluation.evidence.verdict)
    .sort((left, right) => VERDICT_RANK[right] - VERDICT_RANK[left])[0] ?? "not_tested";
}

function resolveBatchVerdict(args: {
  candidateVerdict: ErEprSimulationVerdict;
  failedControlSummary: ErEprControlFailureSummary;
  blockedOverclaims: string[];
}): ErEprSimulationVerdict {
  if (args.blockedOverclaims.length > 0) return "overclaim_blocked";
  if (args.failedControlSummary.batchShouldDemote) return "ordinary_control_explains_signal";
  return args.candidateVerdict;
}

function collectBlockedOverclaims(
  candidates: ErEprStage1EvaluatedRun[],
  controls: ErEprStage1EvaluatedControlRun[],
  entropySweep: ErEprStage1EvaluatedRun[],
): string[] {
  return [
    ...candidates,
    ...controls,
    ...entropySweep,
  ].flatMap((run) => run.evaluation.guards.blockedClaims.map((claim) => `${run.runId}:${claim}`));
}

function collectClaimIds(
  plan: ParsedErEprStage1RunPlan,
  candidates: ErEprStage1EvaluatedRun[],
  controls: ErEprStage1EvaluatedControlRun[],
  entropySweep: ErEprStage1EvaluatedRun[],
): ErEprStage1ClaimId[] {
  return [
    ...new Set([
      ...plan.citationPolicy.requiredClaimIds,
      ...candidates.flatMap((run) => [...run.claimIds, ...run.evaluation.evidence.claimIds]),
      ...controls.flatMap((run) => [...run.claimIds, ...run.evaluation.evidence.claimIds]),
      ...entropySweep.flatMap((run) => [...run.claimIds, ...run.evaluation.evidence.claimIds]),
    ]),
  ] as ErEprStage1ClaimId[];
}

function collectCaveats(
  plan: ParsedErEprStage1RunPlan,
  candidates: ErEprStage1EvaluatedRun[],
  controls: ErEprStage1EvaluatedControlRun[],
  entropySweep: ErEprStage1EvaluatedRun[],
): string[] {
  return [
    ...new Set([
      "Stage 1 simulated evidence only",
      "proxy-only",
      "requires independent theoretical and experimental validation",
      "fixture-only inputs are normalized observables, not raw solver output",
      "no CL0-CL4 promotion",
      ...candidates.flatMap((run) => [...run.caveats, ...run.evaluation.evidence.uncertaintyNotes]),
      ...controls.flatMap((run) => [...run.caveats, ...run.evaluation.evidence.uncertaintyNotes]),
      ...entropySweep.flatMap((run) => [...run.caveats, ...run.evaluation.evidence.uncertaintyNotes]),
      `StarSim policy: ${plan.starSimPolicy.allowedRole}; directEvidenceAllowed=${plan.starSimPolicy.directEvidenceAllowed}`,
    ]),
  ];
}

function allowedClaimStatement(verdict: ErEprSimulationVerdict): string {
  switch (verdict) {
    case "dual_model_support_strong":
      return "Stage 1 simulated evidence: strong model-internal support in the declared controlled holographic/toy-dual simulation after required controls failed.";
    case "model_internal_er_epr_support":
      return "Stage 1 simulated evidence: model-internal support in the declared controlled holographic/toy-dual simulation after required controls failed.";
    case "proxy_only_structure_prior":
      return "Proxy-only structure prior; no ER=EPR support claim is allowed.";
    case "ordinary_control_explains_signal":
      return "Ordinary controls or required-control gaps explain or weaken the signal; no model-internal ER=EPR support claim is allowed.";
    case "overclaim_blocked":
      return "Overclaim blocked by proxy-only and provenance gates.";
    case "not_tested":
      return "Not tested.";
  }
}

export function stableErEprStage1Hash(value: unknown): string {
  const text = stableJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
}
