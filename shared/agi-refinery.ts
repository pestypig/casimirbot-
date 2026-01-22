import { z } from "zod";

export const agiIntentSchema = z
  .object({
    wantsWarp: z.boolean().optional(),
    wantsPhysics: z.boolean().optional(),
    wantsImplementation: z.boolean().optional(),
  })
  .passthrough();
export type AgiIntent = z.infer<typeof agiIntentSchema>;

export const agiQuerySchema = z.object({
  text: z.string(),
  topK: z.number().int().positive().optional(),
  source: z.string().optional(),
  filters: z.record(z.string()).optional(),
});
export type AgiQuery = z.infer<typeof agiQuerySchema>;

export const agiEvidenceSchema = z.object({
  id: z.string().optional(),
  kind: z.string().optional(),
  path: z.string().optional(),
  hash: z.string().optional(),
  hashType: z.string().optional(),
  score: z.number().optional(),
  ownerId: z.string().optional(),
  createdAt: z.string().optional(),
  envelopeId: z.string().nullable().optional(),
  keys: z.array(z.string()).optional(),
  snippetHash: z.string().optional(),
  source: z.string().optional(),
  extra: z.record(z.unknown()).optional(),
});
export type AgiEvidence = z.infer<typeof agiEvidenceSchema>;

export const agiOutputSchema = z.object({
  text: z.string().optional(),
  summary: z.string().optional(),
  citations: z.array(z.string()).optional(),
  format: z.string().optional(),
});
export type AgiOutput = z.infer<typeof agiOutputSchema>;

export const agiSafetyStageSchema = z.enum([
  "input",
  "evidence",
  "output",
  "execution",
]);
export type AgiSafetyStage = z.infer<typeof agiSafetyStageSchema>;

export const agiSafetyKindSchema = z.enum([
  "secret",
  "pii",
  "injection",
  "restricted_path",
  "policy",
  "other",
]);
export type AgiSafetyKind = z.infer<typeof agiSafetyKindSchema>;

export const agiSafetyActionSchema = z.enum([
  "refuse",
  "redact",
  "filter_retrieval",
  "request_auth",
  "allow",
  "block",
  "unknown",
]);
export type AgiSafetyAction = z.infer<typeof agiSafetyActionSchema>;

export const agiSafetyAssessmentSchema = z.object({
  stage: agiSafetyStageSchema.optional(),
  kind: agiSafetyKindSchema.optional(),
  action: agiSafetyActionSchema.optional(),
  handled: z.boolean().optional(),
  pass: z.boolean().optional(),
  flags: z.array(z.string()).optional(),
});
export type AgiSafetyAssessment = z.infer<typeof agiSafetyAssessmentSchema>;

export const agiExecutionEnvelopeSchema = z
  .object({
    stepId: z.string().optional(),
    stepKind: z.string().optional(),
    toolName: z.string().optional(),
    toolKind: z.string().optional(),
    toolVersion: z.string().optional(),
    requestId: z.string().optional(),
    startTs: z.string().optional(),
    endTs: z.string().optional(),
    durationMs: z.number().int().nonnegative().optional(),
    timeoutMs: z.number().int().nonnegative().optional(),
    attempt: z.number().int().nonnegative().optional(),
    ok: z.boolean().optional(),
    errorClass: z.string().optional(),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    stackFingerprint: z.string().optional(),
    fingerprint: z.string().optional(),
    hostContext: z.string().optional(),
  })
  .passthrough();
export type AgiExecutionEnvelope = z.infer<typeof agiExecutionEnvelopeSchema>;

export const agiTrajectoryMetaSchema = z
  .object({
    origin: z.enum(["live", "variant", "replay"]).optional(),
    model: z.string().optional(),
    plannerVersion: z.string().optional(),
    executorVersion: z.string().optional(),
    toolVersions: z.record(z.string()).optional(),
    knowledgeHash: z.string().optional(),
    knowledgeProjects: z.array(z.string()).optional(),
    resourceHints: z.array(z.string()).optional(),
    searchQuery: z.string().optional(),
    summaryFocus: z.string().optional(),
    topK: z.number().int().optional(),
    durationMs: z.number().int().nonnegative().optional(),
    tokens: z.number().int().nonnegative().optional(),
    executionOk: z.boolean().optional(),
    executionErrorTypes: z.array(z.string()).optional(),
    executionEnvelopes: z.array(agiExecutionEnvelopeSchema).optional(),
    formatOk: z.boolean().optional(),
    testsRun: z.boolean().optional(),
    testsOk: z.boolean().optional(),
    testsRequired: z.boolean().optional(),
    codeTouched: z.boolean().optional(),
    codeTouchedPaths: z.array(z.string()).optional(),
    contractRequired: z.boolean().optional(),
    contractOk: z.boolean().optional(),
    contractIssues: z.array(z.string()).optional(),
    constraintRequired: z.boolean().optional(),
    constraintOk: z.boolean().optional(),
    constraintIssues: z.array(z.string()).optional(),
    constraintSources: z.array(z.string()).optional(),
    budgetOk: z.boolean().optional(),
    safetyOk: z.boolean().optional(),
    safety: agiSafetyAssessmentSchema.optional(),
    groundingCount: z.number().int().nonnegative().optional(),
    retrievalCandidates: z.array(agiEvidenceSchema).optional(),
    retrievalSelected: z.array(agiEvidenceSchema).optional(),
    citationCompletionApplied: z.boolean().optional(),
    candidateRecallPreCompletion: z.number().min(0).max(1).optional(),
    candidateRecallPostCompletion: z.number().min(0).max(1).optional(),
    selectedRecallPreCompletion: z.number().min(0).max(1).optional(),
    selectedRecallPostCompletion: z.number().min(0).max(1).optional(),
    citationsPreCompletion: z.number().int().nonnegative().optional(),
    citationsPostCompletion: z.number().int().nonnegative().optional(),
    completionQueriesCount: z.number().int().nonnegative().optional(),
    completionLatencyMs: z.number().int().nonnegative().optional(),
    variantOf: z.string().optional(),
    variantId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .passthrough();
export type AgiTrajectoryMeta = z.infer<typeof agiTrajectoryMetaSchema>;

export const agiTrajectorySchema = z.object({
  id: z.string(),
  traceId: z.string().optional(),
  sessionId: z.string().optional(),
  personaId: z.string().optional(),
  createdAt: z.string(),
  x: z.string(),
  z: agiIntentSchema.optional(),
  s: z.string().optional(),
  q: z.array(agiQuerySchema).default([]),
  E: z.array(agiEvidenceSchema).default([]),
  y: agiOutputSchema.optional(),
  meta: agiTrajectoryMetaSchema.optional(),
});
export type AgiTrajectory = z.infer<typeof agiTrajectorySchema>;

export const agiGateSchema = z.object({
  name: z.enum([
    "grounding",
    "format",
    "safety",
    "execution",
    "tests",
    "contract",
    "constraints",
    "budget",
  ]),
  pass: z.boolean(),
  score: z.number().min(0).max(1).optional(),
  reason: z.string().optional(),
});
export type AgiGate = z.infer<typeof agiGateSchema>;

export const agiRejectReasonSchema = z.enum([
  "safety_input_disallowed",
  "safety_sensitive_evidence",
  "safety_output_violation",
  "execution_tool_error",
  "execution_timeout",
  "tests_required",
  "contract_mismatch",
  "constraint_failed",
  "budget_exceeded",
  "retrieval_empty",
  "schema_invalid",
  "other",
]);
export type AgiRejectReason = z.infer<typeof agiRejectReasonSchema>;

export const agiRunModeSchema = z.enum([
  "anchor_mining",
  "variant_expansion",
  "mixed",
]);
export type AgiRunMode = z.infer<typeof agiRunModeSchema>;

export const agiGateReportSchema = z.object({
  trajectoryId: z.string().optional(),
  traceId: z.string().optional(),
  createdAt: z.string(),
  policyVersion: z.string().optional(),
  accepted: z.boolean(),
  rejectReason: agiRejectReasonSchema.optional(),
  gates: z.array(agiGateSchema),
  safety: agiSafetyAssessmentSchema.optional(),
});
export type AgiGateReport = z.infer<typeof agiGateReportSchema>;

export const agiRefinerySummarySchema = z.object({
  createdAt: z.string(),
  total: z.number().int().nonnegative(),
  accepted: z.number().int().nonnegative(),
  acceptanceRate: z.number().min(0).max(1),
  totalTokens: z.number().int().nonnegative().optional(),
  avgTokens: z.number().nonnegative().optional(),
  originShares: z.record(z.number()).optional(),
  runMode: agiRunModeSchema.optional(),
  expectedAlphaMin: z.number().min(0).max(1).optional(),
  expectedAlphaMax: z.number().min(0).max(1).optional(),
  governorEngaged: z.boolean().optional(),
  byIntent: z.record(z.number()).optional(),
  byEvidenceKind: z.record(z.number()).optional(),
  byStrategy: z.record(z.number()).optional(),
  byDifficulty: z.record(z.number()).optional(),
  bySurface: z.record(z.number()).optional(),
  acceptanceByStrategy: z.record(z.number()).optional(),
  acceptanceByDifficulty: z.record(z.number()).optional(),
  acceptanceBySurface: z.record(z.number()).optional(),
  byFailure: z.record(z.number()).optional(),
  byRejectReason: z.record(z.number()).optional(),
});
export type AgiRefinerySummary = z.infer<typeof agiRefinerySummarySchema>;

export const agiDatasetExportSchema = z.object({
  createdAt: z.string(),
  total: z.number().int().nonnegative(),
  accepted: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  realRatio: z.number().min(0).max(1).optional(),
  syntheticRatio: z.number().min(0).max(1).optional(),
  alphaAvailable: z.number().min(0).max(1).optional(),
  alphaTarget: z.number().min(0).max(1).optional(),
  maxAtTargetAlpha: z.number().int().nonnegative().optional(),
  alphaShortfall: z.number().int().nonnegative().optional(),
  minAlpha: z.number().min(0).max(1).optional(),
  alphaRun: z.number().min(0).max(1).optional(),
  alphaExport: z.number().min(0).max(1).optional(),
  variantReservoirPath: z.string().optional(),
  variantReservoirAdded: z.number().int().nonnegative().optional(),
  variantReservoirUsed: z.number().int().nonnegative().optional(),
  variantReservoirAvailable: z.number().int().nonnegative().optional(),
  executionUnknownCount: z.number().int().nonnegative().optional(),
  surfaceShares: z.record(z.number()).optional(),
  surfaceMinimums: z.record(z.number()).optional(),
  surfaceMaximums: z.record(z.number()).optional(),
  minClientServerShare: z.number().min(0).max(1).optional(),
  maxDocsSharedShare: z.number().min(0).max(1).optional(),
  blocked: z.boolean().optional(),
  blockedReasons: z.array(z.string()).optional(),
  sftPath: z.string().optional(),
  dpoPath: z.string().optional(),
  dpoPairs: z.number().int().nonnegative().optional(),
  dpoDensity: z.number().min(0).optional(),
});
export type AgiDatasetExport = z.infer<typeof agiDatasetExportSchema>;

export const agiRefineryRequestSchema = z.object({
  origin: z.enum(["live", "variant", "replay"]).optional(),
  seedId: z.string().optional(),
  variantId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type AgiRefineryRequest = z.infer<typeof agiRefineryRequestSchema>;
