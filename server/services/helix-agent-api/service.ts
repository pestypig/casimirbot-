import crypto from "node:crypto";
import { resolveHelixWorkstationCapabilityAccess } from "@shared/helix-account-session";
import {
  HELIX_AGENT_API_VERSION,
  HELIX_AGENT_EVIDENCE_BUNDLE_SCHEMA,
  HELIX_AGENT_RUN_SCHEMA,
  helixAgentCancelRequestSchema,
  helixAgentContinueRequestSchema,
  helixAgentEvidenceReentryRequestSchema,
  helixAgentRunSchema,
  helixAgentStartRequestSchema,
  type HelixAgentCancelRequest,
  type HelixAgentCompletionStatus,
  type HelixAgentContinueRequest,
  type HelixAgentEvidenceReentryRequest,
  type HelixAgentEvidenceBundle,
  type HelixAgentLifecycleStatus,
  type HelixAgentPendingQuestion,
  type HelixAgentRun,
  type HelixAgentRunEvent,
  type HelixAgentRunEventType,
  type HelixAgentStartRequest,
} from "@shared/contracts/helix-agent-api.v1";
import { HelixAgentApiServiceError } from "./errors";
export { buildHelixAgentApiError, HelixAgentApiServiceError } from "./errors";
import { FullHelixAskTurnExecutor } from "./full-ask-turn-executor";
import {
  HelixAgentRunStore,
  type HelixAgentIdempotencyAcquireResult,
  type HelixAgentRunOwner,
  type HelixAgentRunRecord,
} from "./run-store";
import { appendAgentRunEventsToOperatorActivity } from "../helix-ask/operator-activity-ingestion";
import { createPostgresHelixMcpEvidenceObservationStore } from
  "../mcp-evidence/postgres-observation-store";
import { HelixMcpEvidenceObservationStoreError } from
  "../mcp-evidence/observation-store";
import type { HelixMcpEvidenceObservation } from
  "@shared/contracts/helix-mcp-evidence-capability.v1";
import type {
  HelixAgentApiPrincipal,
  HelixAgentRunTurnExecutor,
  HelixAgentRunTurnExecutorResult,
} from "./types";
import {
  configuredHelixAgentDatabaseScopePolicies,
  type HelixAgentDatabaseScopePolicy,
} from "./database-scope-policy";
import {
  containsHelixAgentSensitiveValue,
  redactHelixAgentSensitiveValue,
} from "./sensitive-text";

type RecordLike = Record<string, unknown>;
type HelixAgentScopeEntitlement = {
  scope: string;
  oauthScope: string;
};

export type HelixAgentMutationResult = {
  status: number;
  body: HelixAgentRun;
  idempotencyReplayed: boolean;
};

export type HelixAgentEventPage = {
  schema: "helix.agent_run.events_page.v1";
  run_id: string;
  events: HelixAgentRunEvent[];
  next_after_seq: number;
  has_more: boolean;
};

export type HelixAgentApiServiceDependencies = {
  store?: HelixAgentRunStore;
  executor?: HelixAgentRunTurnExecutor;
  now?: () => Date;
  randomId?: () => string;
  databaseScopeAllowlist?: ReadonlySet<string>;
  databaseScopePolicies?: ReadonlyMap<string, HelixAgentDatabaseScopePolicy>;
  turnTimeoutMs?: number;
  validateExternalObservationRef?: (input: {
    principal: HelixAgentApiPrincipal;
    observationRef: string;
  }) => Promise<HelixMcpEvidenceObservation>;
};

const unique = (values: string[]): string[] =>
  Array.from(
    new Set(values.map((value: string) => value.trim()).filter(Boolean)),
  );

const isRequiredEvidenceRequirement = (requirement: string): boolean =>
  requirement.startsWith("required_evidence:") &&
  requirement.slice("required_evidence:".length).trim().length > 0;

const assertNoProtectedAgentInput = (value: unknown): void => {
  if (!containsHelixAgentSensitiveValue(value)) return;
  throw new HelixAgentApiServiceError(
    400,
    "invalid_request",
    "Protected credential material is not accepted in agent-run input.",
    false,
    { failure_code: "protected_sensitive_content_rejected" },
  );
};

const mergePendingQuestions = (input: {
  previous: HelixAgentPendingQuestion[];
  answeredQuestionIds: ReadonlySet<string>;
  current: HelixAgentPendingQuestion[];
}): HelixAgentPendingQuestion[] => {
  const merged = new Map<string, HelixAgentPendingQuestion>();
  for (const question of input.previous) {
    if (!input.answeredQuestionIds.has(question.question_id)) {
      merged.set(question.question_id, question);
    }
  }
  for (const question of input.current) {
    merged.set(question.question_id, question);
  }
  return Array.from(merged.values());
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as RecordLike)
      .sort(([left]: [string, unknown], [right]: [string, unknown]) =>
        left.localeCompare(right),
      )
      .map(([key, entry]: [string, unknown]) => [key, canonicalize(entry)]),
  );
};

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const contentHash = (value: unknown): string =>
  `sha256:${sha256(JSON.stringify(canonicalize(value)))}`;

const opaqueRef = (kind: string, value: string): string =>
  `${kind}:sha256:${sha256(value).slice(0, 24)}`;

const ownerFor = (principal: HelixAgentApiPrincipal): HelixAgentRunOwner => ({
  tenantId: principal.tenantId,
  issuer: principal.issuer,
  subjectId: principal.subjectId,
  accountProfileId: principal.accountProfileId,
});

const isTerminalLifecycle = (status: HelixAgentLifecycleStatus): boolean =>
  status === "completed" || status === "failed" || status === "cancelled";

const publicRunRecommendedAction = (
  run: HelixAgentRunRecord,
): HelixAgentRun["recommended_next_action"] => {
  if (isTerminalLifecycle(run.lifecycleStatus)) {
    return {
      operation: "none",
      reason: `run_${run.lifecycleStatus}`,
    };
  }
  if (run.completionStatus === "needs_input") {
    return {
      operation: "continue",
      reason: "Provide the requested judgment or missing input.",
    };
  }
  if (
    run.completionStatus === "needs_more_evidence" ||
    run.completionStatus === "conflict_detected" ||
    run.completionStatus === "blocked"
  ) {
    return {
      operation: "continue",
      reason: "Continue the same run with a bounded follow-up instruction.",
    };
  }
  return {
    operation: "inspect",
    reason: "Inspect durable progress before choosing the next bounded action.",
  };
};

const publicRun = (run: HelixAgentRunRecord): HelixAgentRun => {
  const projection = {
    schema: HELIX_AGENT_RUN_SCHEMA,
    api_version: HELIX_AGENT_API_VERSION,
    run_id: run.runId,
    ownership: {
      tenant_ref: opaqueRef("tenant", run.tenantId),
      principal_ref: opaqueRef("principal", `${run.issuer}\n${run.subjectId}`),
      account_profile_ref: opaqueRef("account-profile", run.accountProfileId),
    },
    objective: run.objective,
    objective_hash: run.objectiveHash,
    runtime_provider: run.runtimeProvider,
    lifecycle_status: run.lifecycleStatus,
    completion_status: run.completionStatus,
    terminal_authority_status: run.terminalAuthorityStatus,
    version: run.version,
    completion_contract: run.configuration.completion_contract,
    constraints: run.configuration.constraints,
    database_scope: run.configuration.database_scope,
    budget: {
      max_steps: run.maxSteps,
      steps_used: run.stepsUsed,
      expires_at: run.expiresAt,
    },
    summary: run.latestSummary,
    unresolved_requirements: run.unresolvedRequirements,
    contradictions: run.contradictions,
    pending_questions: run.pendingQuestions,
    evidence: run.evidenceBundle,
    latest_result: run.latestResult,
    recommended_next_action: publicRunRecommendedAction(run),
    created_at: run.createdAt,
    updated_at: run.updatedAt,
    completed_at: run.completedAt,
    cancelled_at: run.cancelledAt,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  return helixAgentRunSchema.parse(redactHelixAgentSensitiveValue(projection));
};

const parseScopeAllowlist = (): ReadonlySet<string> =>
  new Set(
    (process.env.HELIX_AGENT_DATABASE_SCOPES ?? "")
      .split(",")
      .map((entry: string) => entry.trim())
      .filter(Boolean),
  );

const requireIdempotencyKey = (value: string): string => {
  const key = value.trim();
  if (key.length < 8 || key.length > 200) {
    throw new HelixAgentApiServiceError(
      400,
      "invalid_request",
      "Idempotency keys must contain between 8 and 200 characters.",
    );
  }
  return key;
};

const acquisitionError = (
  result: Exclude<
    HelixAgentIdempotencyAcquireResult,
    { kind: "acquired" | "replay" }
  >,
): never => {
  if (result.kind === "conflict") {
    throw new HelixAgentApiServiceError(
      409,
      "idempotency_conflict",
      "That idempotency key was already used with different validated input.",
    );
  }
  if (result.kind === "in_progress") {
    throw new HelixAgentApiServiceError(
      409,
      "idempotency_in_progress",
      "The idempotent operation is still in progress.",
      true,
      {
        lease_expires_at: result.leaseExpiresAt,
        run_id: result.runId,
      },
    );
  }
  throw new HelixAgentApiServiceError(
    409,
    "outcome_unknown",
    "A prior operation may have taken effect, but its response receipt was not durably completed. Inspect the run before retrying.",
    false,
    { run_id: result.runId },
  );
};

const executorFailure = (error: unknown): HelixAgentRunTurnExecutorResult => {
  const message = error instanceof Error ? error.message : String(error);
  const expired = message.includes("run_expired");
  const timeout = !expired && message.includes("timeout");
  const failureCode = expired
    ? "run_expired"
    : timeout
      ? "helix_ask_timeout"
      : "helix_ask_executor_failed";
  return {
    ok: false,
    statusCode: expired ? 408 : 500,
    summary: expired
      ? "The agent run expired before the governed turn could finalize."
      : "The Helix Ask executor failed before returning a governed result.",
    observationRefs: [],
    evidenceRefs: [],
    receiptRefs: [],
    claimsSupported: [],
    claimsContradicted: [],
    unresolvedRequirements: ["executor_result_unavailable"],
    resolvedRequirements: [],
    satisfiedEvidenceRequirements: [],
    contradictions: [],
    resolvedContradictions: [],
    pendingQuestions: [],
    terminalAuthorityStatus: "blocked",
    terminalProduct: null,
    outputFields: {},
    failureCode,
    needsInput: false,
    sanitizedResult: {
      ok: false,
      status: 500,
      failure_code: failureCode,
      raw_error_included: false,
      raw_provider_payload_included: false,
      chain_of_thought_included: false,
    },
  };
};

const protectedExecutorResult = (): HelixAgentRunTurnExecutorResult => ({
  ok: false,
  statusCode: 400,
  summary:
    "The governed executor result contained protected credential material and was rejected.",
  observationRefs: [],
  evidenceRefs: [],
  receiptRefs: [],
  claimsSupported: [],
  claimsContradicted: [],
  unresolvedRequirements: ["protected_sensitive_content_rejected"],
  resolvedRequirements: [],
  satisfiedEvidenceRequirements: [],
  contradictions: [],
  resolvedContradictions: [],
  pendingQuestions: [],
  terminalAuthorityStatus: "blocked",
  terminalProduct: null,
  outputFields: {},
  failureCode: "protected_sensitive_content_rejected",
  needsInput: false,
  sanitizedResult: {
    ok: false,
    status: 400,
    failure_code: "protected_sensitive_content_rejected",
    terminal_authority_status: "blocked",
    terminal_product: null,
    raw_error_included: false,
    raw_provider_payload_included: false,
    chain_of_thought_included: false,
  },
});

const completionState = (input: {
  run: HelixAgentRunRecord;
  result: HelixAgentRunTurnExecutorResult;
  evidenceBundle: HelixAgentEvidenceBundle;
  unresolvedRequirements: string[];
  contradictions: string[];
  pendingQuestions: HelixAgentPendingQuestion[];
}): {
  lifecycleStatus: HelixAgentLifecycleStatus;
  completionStatus: HelixAgentCompletionStatus;
  completedAt: boolean;
} => {
  const contract = input.run.configuration.completion_contract;
  const result = input.result;
  const evidenceCount = unique([
    ...input.evidenceBundle.observation_refs,
    ...input.evidenceBundle.evidence_refs,
    ...input.evidenceBundle.receipt_refs,
  ]).length;
  const missingOutputFields = contract.required_output_fields.filter(
    (field: string) =>
      !(field in result.outputFields) ||
      result.outputFields[field] === null ||
      result.outputFields[field] === undefined,
  );
  const authoritySatisfied =
    !contract.require_terminal_authority ||
    result.terminalAuthorityStatus === "authorized";
  const evidenceSatisfied = evidenceCount >= contract.min_evidence_refs;
  const unresolvedSatisfied =
    input.unresolvedRequirements.length <= contract.max_unresolved_requirements;
  const requiredEvidenceSatisfied = !input.unresolvedRequirements.some(
    isRequiredEvidenceRequirement,
  );
  const conflictSatisfied =
    contract.allow_conflicts || input.contradictions.length === 0;
  const completed =
    result.ok &&
    !result.needsInput &&
    input.pendingQuestions.length === 0 &&
    authoritySatisfied &&
    evidenceSatisfied &&
    unresolvedSatisfied &&
    requiredEvidenceSatisfied &&
    conflictSatisfied &&
    missingOutputFields.length === 0;

  if (completed) {
    return {
      lifecycleStatus: "completed",
      completionStatus: "completed",
      completedAt: true,
    };
  }
  if (result.failureCode === "run_expired") {
    return {
      lifecycleStatus: "failed",
      completionStatus: "failed",
      completedAt: false,
    };
  }
  if (input.run.stepsUsed >= input.run.maxSteps) {
    return {
      lifecycleStatus: "failed",
      completionStatus: "budget_exhausted",
      completedAt: false,
    };
  }
  if (result.statusCode >= 500) {
    return {
      lifecycleStatus: "failed",
      completionStatus: "failed",
      completedAt: false,
    };
  }
  if (result.needsInput || input.pendingQuestions.length > 0) {
    return {
      lifecycleStatus: "waiting",
      completionStatus: "needs_input",
      completedAt: false,
    };
  }
  if (!conflictSatisfied) {
    return {
      lifecycleStatus: "waiting",
      completionStatus: "conflict_detected",
      completedAt: false,
    };
  }
  if (!requiredEvidenceSatisfied) {
    return {
      lifecycleStatus: "waiting",
      completionStatus: "needs_more_evidence",
      completedAt: false,
    };
  }
  if (!result.ok || result.terminalAuthorityStatus === "blocked") {
    return {
      lifecycleStatus: "waiting",
      completionStatus: "blocked",
      completedAt: false,
    };
  }
  if (!unresolvedSatisfied) {
    return {
      lifecycleStatus: "waiting",
      completionStatus: "needs_more_evidence",
      completedAt: false,
    };
  }
  return {
    lifecycleStatus: "waiting",
    completionStatus: "needs_more_evidence",
    completedAt: false,
  };
};

export class HelixAgentApiService {
  private readonly store: HelixAgentRunStore;
  private readonly executor: HelixAgentRunTurnExecutor;
  private readonly now: () => Date;
  private readonly randomId: () => string;
  private readonly injectedDatabaseScopeAllowlist?: ReadonlySet<string>;
  private readonly injectedDatabaseScopePolicies?: HelixAgentApiServiceDependencies["databaseScopePolicies"];
  private readonly injectedTurnTimeoutMs?: number;
  private readonly validateExternalObservationRef: NonNullable<
    HelixAgentApiServiceDependencies["validateExternalObservationRef"]
  >;
  private readonly activeTurnControllers = new Map<string, AbortController>();

  constructor(dependencies: HelixAgentApiServiceDependencies = {}) {
    this.store = dependencies.store ?? new HelixAgentRunStore(
      undefined,
      async ({ owner, run, events }) => {
        await appendAgentRunEventsToOperatorActivity({ owner, run, events });
      },
    );
    this.executor = dependencies.executor ?? new FullHelixAskTurnExecutor();
    this.now = dependencies.now ?? (() => new Date());
    this.randomId = dependencies.randomId ?? (() => crypto.randomUUID());
    this.injectedDatabaseScopeAllowlist = dependencies.databaseScopeAllowlist;
    this.injectedDatabaseScopePolicies = dependencies.databaseScopePolicies;
    this.injectedTurnTimeoutMs = dependencies.turnTimeoutMs;
    const defaultEvidenceStore = dependencies.validateExternalObservationRef
      ? null
      : createPostgresHelixMcpEvidenceObservationStore();
    this.validateExternalObservationRef =
      dependencies.validateExternalObservationRef ??
      (async ({ principal, observationRef }) => {
        return defaultEvidenceStore!.get({
          owner: {
            tenantId: principal.tenantId,
            accountProfileId: principal.accountProfileId,
          },
          observationRef,
        });
      });
  }

  private id(prefix: string): string {
    return `${prefix}_${this.randomId()}`;
  }

  private turnTimeoutMs(): number {
    const candidate =
      this.injectedTurnTimeoutMs ??
      Number(process.env.HELIX_AGENT_TURN_TIMEOUT_MS ?? "120000");
    return Number.isFinite(candidate)
      ? Math.max(1_000, Math.min(15 * 60_000, Math.floor(candidate)))
      : 120_000;
  }

  private idempotencyWindow(now: Date) {
    const leaseMs = Math.max(2 * 60_000, this.turnTimeoutMs() + 60_000);
    return {
      leaseExpiresAt: new Date(now.getTime() + leaseMs).toISOString(),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60_000).toISOString(),
    };
  }

  private async executeTurnWithinDeadline(
    input: Parameters<HelixAgentRunTurnExecutor["executeTurn"]>[0],
    timeoutMs: number,
    controller: AbortController,
  ): Promise<HelixAgentRunTurnExecutorResult> {
    let timeout: NodeJS.Timeout | null = null;
    try {
      return await Promise.race([
        this.executor.executeTurn(input),
        new Promise<HelixAgentRunTurnExecutorResult>(
          (
            resolve: (
              value:
                | HelixAgentRunTurnExecutorResult
                | PromiseLike<HelixAgentRunTurnExecutorResult>,
            ) => void,
          ) => {
            timeout = setTimeout(
              () => {
                controller.abort(new Error("helix_ask_timeout"));
                resolve(executorFailure(new Error("helix_ask_timeout")));
              },
              Math.max(1, timeoutMs),
            );
            timeout.unref?.();
          },
        ),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private validateDatabaseScope(
    requested: string[],
    principal: HelixAgentApiPrincipal,
  ): {
    scopes: string[];
    executionPolicy: HelixAgentRunRecord["configuration"]["execution_policy"];
  } {
    const normalized = unique(requested);
    const configuredAllowlist =
      this.injectedDatabaseScopeAllowlist ?? parseScopeAllowlist();
    const policies =
      this.injectedDatabaseScopePolicies ??
      configuredHelixAgentDatabaseScopePolicies(configuredAllowlist);
    const allowlist =
      configuredAllowlist.size > 0
        ? configuredAllowlist
        : new Set(policies.keys());
    const denied = normalized.filter((scope: string) => !allowlist.has(scope));
    if (denied.length > 0) {
      throw new HelixAgentApiServiceError(
        403,
        "account_policy_blocked",
        "One or more requested logical database scopes are not admitted by this deployment.",
        false,
        { denied_scopes: denied },
      );
    }
    const missingPolicies = normalized.filter(
      (scope: string) => !policies.has(scope),
    );
    if (missingPolicies.length > 0) {
      throw new HelixAgentApiServiceError(
        503,
        "scope_policy_not_configured",
        "An admitted logical database scope has no executable capability policy.",
        false,
        { missing_scope_policies: missingPolicies },
      );
    }
    const missingEntitlements = normalized
      .map((scope: string): HelixAgentScopeEntitlement => ({
        scope,
        oauthScope: policies.get(scope)?.oauthScope ?? "",
      }))
      .filter(
        (entry: HelixAgentScopeEntitlement) =>
          !entry.oauthScope || !principal.scopes.has(entry.oauthScope),
      );
    if (missingEntitlements.length > 0) {
      throw new HelixAgentApiServiceError(
        403,
        "insufficient_scope",
        "The verified principal is not entitled to one or more logical database scopes.",
        false,
        {
          denied_scopes: missingEntitlements.map(
            (entry: HelixAgentScopeEntitlement) => entry.scope,
          ),
          required_oauth_scopes: missingEntitlements.map(
            (entry: HelixAgentScopeEntitlement) => entry.oauthScope,
          ),
        },
      );
    }
    const allowedTools = unique(
      normalized.flatMap((scope: string) => [
        ...(policies.get(scope)?.allowedTools ?? []),
      ]),
    );
    const requiredEvidence = unique(
      normalized.flatMap((scope: string) => [
        ...(policies.get(scope)?.requiredEvidence ?? []),
      ]),
    );
    const accountDeniedTools = allowedTools.filter(
      (capabilityId: string) =>
        resolveHelixWorkstationCapabilityAccess(
          principal.accountContext.account_policy,
          { capability_id: capabilityId },
        ).state !== "available",
    );
    if (accountDeniedTools.length > 0) {
      throw new HelixAgentApiServiceError(
        403,
        "account_policy_blocked",
        "The linked Helix account policy does not admit one or more scope capabilities.",
        false,
        { denied_capabilities: accountDeniedTools },
      );
    }
    if (allowedTools.length > 24 || requiredEvidence.length > 24) {
      throw new HelixAgentApiServiceError(
        503,
        "scope_policy_not_configured",
        "The resolved database-scope execution policy exceeds Helix Ask limits.",
      );
    }
    const normalizedPolicy = {
      allowed_tools:
        allowedTools.length > 0
          ? allowedTools
          : ["__helix_external_agent_no_tools__"],
      required_evidence: requiredEvidence,
    };
    return {
      scopes: normalized,
      executionPolicy: {
        ...normalizedPolicy,
        policy_hash: contentHash(normalizedPolicy),
      },
    };
  }

  private async acquireMutation(input: {
    principal: HelixAgentApiPrincipal;
    operation: string;
    idempotencyKey: string;
    validatedRequest: unknown;
    runId?: string | null;
    now: Date;
  }): Promise<{
    keyHash: string;
    requestHash: string;
    replay: HelixAgentMutationResult | null;
  }> {
    const key = requireIdempotencyKey(input.idempotencyKey);
    const keyHash = `sha256:${sha256(key)}`;
    const requestHash = contentHash(input.validatedRequest);
    const window = this.idempotencyWindow(input.now);
    const acquired = await this.store.acquireIdempotency({
      owner: ownerFor(input.principal),
      operation: input.operation,
      keyHash,
      requestHash,
      runId: input.runId,
      now: input.now.toISOString(),
      ...window,
    });
    if (acquired.kind === "replay") {
      return {
        keyHash,
        requestHash,
        replay: {
          status: acquired.status,
          body: helixAgentRunSchema.parse(
            redactHelixAgentSensitiveValue(acquired.receipt),
          ),
          idempotencyReplayed: true,
        },
      };
    }
    if (acquired.kind !== "acquired") acquisitionError(acquired);
    return { keyHash, requestHash, replay: null };
  }

  async startRun(input: {
    principal: HelixAgentApiPrincipal;
    idempotencyKey: string;
    request: HelixAgentStartRequest;
  }): Promise<HelixAgentMutationResult> {
    const request = helixAgentStartRequestSchema.parse(input.request);
    assertNoProtectedAgentInput(request);
    const scopeResolution = this.validateDatabaseScope(
      request.database_scope,
      input.principal,
    );
    const databaseScope = scopeResolution.scopes;
    const normalizedRequest = {
      ...request,
      database_scope: databaseScope,
    };
    const runId = this.id("run");
    const runUuid = this.randomId();
    const now = this.now();
    const operation = "start";
    const idempotency = await this.acquireMutation({
      principal: input.principal,
      operation,
      idempotencyKey: input.idempotencyKey,
      validatedRequest: normalizedRequest,
      runId,
      now,
    });
    if (idempotency.replay) return idempotency.replay;

    const createdAt = now.toISOString();
    const expiresAt = new Date(
      now.getTime() + request.budget.expires_in_seconds * 1_000,
    ).toISOString();
    const evidenceBundle: HelixAgentEvidenceBundle = {
      schema: HELIX_AGENT_EVIDENCE_BUNDLE_SCHEMA,
      run_id: runId,
      observation_refs: [],
      evidence_refs: [],
      receipt_refs: [],
      provider_terminal_candidate_ref: null,
      claims_supported: [],
      claims_contradicted: [],
      unresolved_requirements: [],
      terminal_authority_status: "not_evaluated",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    const record: HelixAgentRunRecord = {
      runId,
      tenantId: input.principal.tenantId,
      issuer: input.principal.issuer,
      subjectId: input.principal.subjectId,
      accountProfileId: input.principal.accountProfileId,
      objective: request.objective,
      objectiveHash: contentHash(request.objective),
      runtimeProvider: "helix-ask",
      providerGoalId: `external-agent-goal:${runUuid}`,
      providerThreadId: `external-agent-thread:${runUuid}`,
      providerSessionId: `external-agent-session:${runUuid}`,
      lifecycleStatus: "waiting",
      completionStatus: "needs_more_evidence",
      terminalAuthorityStatus: "not_evaluated",
      version: 1,
      configuration: {
        completion_contract: request.completion_contract,
        constraints: unique(request.constraints),
        database_scope: databaseScope,
        execution_policy: scopeResolution.executionPolicy,
      },
      evidenceBundle,
      runtimeSnapshot: null,
      latestResult: null,
      latestSummary:
        "The durable run is ready for its first bounded Helix Ask continuation.",
      unresolvedRequirements: [],
      contradictions: [],
      pendingQuestions: [],
      maxSteps: request.budget.max_steps,
      stepsUsed: 0,
      activeOperationId: null,
      operationStartedAt: null,
      expiresAt,
      createdAt,
      updatedAt: createdAt,
      completedAt: null,
      cancelledAt: null,
    };

    let created: HelixAgentRunRecord | null = null;
    try {
      created = (
        await this.store.createRun({
          run: record,
          eventId: this.id("evt"),
          now: createdAt,
        })
      ).run;
      const body = publicRun(created);
      await this.store.completeIdempotency({
        owner: ownerFor(input.principal),
        operation,
        keyHash: idempotency.keyHash,
        requestHash: idempotency.requestHash,
        runId,
        status: 201,
        receipt: body,
        now: this.now().toISOString(),
      });
      return { status: 201, body, idempotencyReplayed: false };
    } catch (error) {
      await this.store.markIdempotencyOutcomeUnknown({
        owner: ownerFor(input.principal),
        operation,
        keyHash: idempotency.keyHash,
        requestHash: idempotency.requestHash,
        runId: created?.runId ?? null,
        now: this.now().toISOString(),
      });
      throw error;
    }
  }

  async inspectRun(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
  }): Promise<HelixAgentRun> {
    const run = await this.store.getRun(ownerFor(input.principal), input.runId);
    if (!run) {
      throw new HelixAgentApiServiceError(
        404,
        "not_found",
        "Agent run not found.",
      );
    }
    return publicRun(run);
  }

  async reenterEvidence(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
    idempotencyKey: string;
    request: HelixAgentEvidenceReentryRequest;
  }): Promise<HelixAgentMutationResult> {
    const request = helixAgentEvidenceReentryRequestSchema.parse(input.request);
    assertNoProtectedAgentInput(request);
    const owner = ownerFor(input.principal);
    const existing = await this.store.getRun(owner, input.runId);
    if (!existing) {
      throw new HelixAgentApiServiceError(404, "not_found", "Agent run not found.");
    }
    const operation = `reenter_evidence:${input.runId}`;
    const idempotency = await this.acquireMutation({
      principal: input.principal,
      operation,
      idempotencyKey: input.idempotencyKey,
      validatedRequest: { run_id: input.runId, ...request },
      runId: input.runId,
      now: this.now(),
    });
    if (idempotency.replay) return idempotency.replay;

    let operationMayHaveTakenEffect = false;
    try {
      if (existing.version !== request.expected_version) {
        throw new HelixAgentApiServiceError(
          409,
          "version_conflict",
          "The run version is stale.",
          true,
          { current_version: existing.version },
        );
      }
      if (isTerminalLifecycle(existing.lifecycleStatus)) {
        throw new HelixAgentApiServiceError(
          409,
          "run_not_resumable",
          `A ${existing.lifecycleStatus} run cannot receive evidence.`,
        );
      }
      for (const observationRef of request.observation_refs) {
        try {
          const observation = await this.validateExternalObservationRef({
            principal: input.principal,
            observationRef,
          });
          if (
            !observation.provenance.valid ||
            observation.authority.assistant_answer !== false ||
            observation.authority.answer_authority !== false ||
            observation.authority.agent_executable !== false ||
            observation.authority.terminal_eligible !== false ||
            observation.authority.raw_content_included !== false ||
            observation.authority.reentry_required !== true
          ) {
            throw new HelixAgentApiServiceError(
              409,
              "invalid_request",
              "The requested MCP observation does not preserve the evidence-only authority boundary.",
              false,
              {
                failure_code: "observation_authority_invalid",
                observation_ref: observationRef,
              },
            );
          }
        } catch (error) {
          if (!(error instanceof HelixMcpEvidenceObservationStoreError)) {
            throw error;
          }
          throw new HelixAgentApiServiceError(
            error.code === "observation_corrupt" ? 500 : 404,
            error.code === "observation_corrupt" ? "internal_error" : "not_found",
            "The requested MCP observation is not eligible for exact run re-entry.",
            false,
            {
              failure_code: error.code,
              observation_ref: observationRef,
            },
          );
        }
      }
      const refs = unique(request.observation_refs);
      const evidenceBundle: HelixAgentEvidenceBundle = {
        ...existing.evidenceBundle,
        observation_refs: unique([
          ...existing.evidenceBundle.observation_refs,
          ...refs,
        ]),
        evidence_refs: unique([
          ...existing.evidenceBundle.evidence_refs,
          ...refs,
        ]),
        receipt_refs: existing.evidenceBundle.receipt_refs,
        provider_terminal_candidate_ref: null,
        terminal_authority_status: "not_evaluated",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      };
      operationMayHaveTakenEffect = true;
      const updated = await this.store.appendExternalEvidence({
        owner,
        runId: input.runId,
        expectedVersion: request.expected_version,
        evidenceBundle,
        observationRefs: refs,
        eventId: this.id("evt"),
        now: this.now().toISOString(),
      });
      if (!updated) {
        operationMayHaveTakenEffect = false;
        const current = await this.store.getRun(owner, input.runId);
        if (current && current.version !== request.expected_version) {
          throw new HelixAgentApiServiceError(
            409,
            "version_conflict",
            "The run version is stale.",
            true,
            { current_version: current.version },
          );
        }
        throw new HelixAgentApiServiceError(
          409,
          "run_not_resumable",
          "The run cannot receive evidence in its current lifecycle state.",
        );
      }
      const body = publicRun(updated);
      await this.store.completeIdempotency({
        owner,
        operation,
        keyHash: idempotency.keyHash,
        requestHash: idempotency.requestHash,
        runId: updated.runId,
        status: 200,
        receipt: body,
        now: this.now().toISOString(),
      });
      return { status: 200, body, idempotencyReplayed: false };
    } catch (error) {
      if (operationMayHaveTakenEffect) {
        await this.store.markIdempotencyOutcomeUnknown({
          owner,
          operation,
          keyHash: idempotency.keyHash,
          requestHash: idempotency.requestHash,
          runId: input.runId,
          now: this.now().toISOString(),
        });
      } else {
        await this.store.abandonIdempotency({
          owner,
          operation,
          keyHash: idempotency.keyHash,
          requestHash: idempotency.requestHash,
        });
      }
      throw error;
    }
  }

  async continueRun(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
    idempotencyKey: string;
    request: HelixAgentContinueRequest;
  }): Promise<HelixAgentMutationResult> {
    const request = helixAgentContinueRequestSchema.parse(input.request);
    assertNoProtectedAgentInput(request);
    const owner = ownerFor(input.principal);
    const existing = await this.store.getRun(owner, input.runId);
    if (!existing) {
      throw new HelixAgentApiServiceError(
        404,
        "not_found",
        "Agent run not found.",
      );
    }

    const now = this.now();
    const operation = `continue:${input.runId}`;
    const idempotency = await this.acquireMutation({
      principal: input.principal,
      operation,
      idempotencyKey: input.idempotencyKey,
      validatedRequest: { run_id: input.runId, ...request },
      runId: input.runId,
      now,
    });
    if (idempotency.replay) return idempotency.replay;

    const operationId = this.id("op");
    let claimed: HelixAgentRunRecord | null = null;
    let operationMayHaveTakenEffect = false;
    try {
      if (existing.version !== request.expected_version) {
        throw new HelixAgentApiServiceError(
          409,
          "version_conflict",
          "The run version is stale.",
          true,
          { current_version: existing.version },
        );
      }
      if (isTerminalLifecycle(existing.lifecycleStatus)) {
        throw new HelixAgentApiServiceError(
          409,
          "run_not_resumable",
          `A ${existing.lifecycleStatus} run cannot be continued.`,
        );
      }
      const currentScopeResolution = this.validateDatabaseScope(
        existing.configuration.database_scope,
        input.principal,
      );
      const currentAllowedTools = new Set(
        currentScopeResolution.executionPolicy.allowed_tools,
      );
      const effectiveAllowedTools =
        existing.configuration.execution_policy.allowed_tools.filter(
          (tool: string) => currentAllowedTools.has(tool),
        );
      const effectiveRequiredEvidence = unique([
        ...existing.configuration.execution_policy.required_evidence,
        ...currentScopeResolution.executionPolicy.required_evidence,
      ]);
      if (effectiveAllowedTools.length === 0) {
        effectiveAllowedTools.push("__helix_external_agent_no_tools__");
      }
      const pendingQuestionIds = new Set(
        existing.pendingQuestions.map(
          (question: HelixAgentPendingQuestion) => question.question_id,
        ),
      );
      const answeredQuestionIds = request.answers.map(
        (answer) => answer.question_id,
      );
      if (new Set(answeredQuestionIds).size !== answeredQuestionIds.length) {
        throw new HelixAgentApiServiceError(
          400,
          "invalid_request",
          "Each pending question may be answered at most once per continuation.",
        );
      }
      const unknownQuestionIds = answeredQuestionIds.filter(
        (questionId: string) => !pendingQuestionIds.has(questionId),
      );
      if (unknownQuestionIds.length > 0) {
        throw new HelixAgentApiServiceError(
          400,
          "invalid_request",
          "One or more answers do not match an outstanding question.",
          false,
          { unknown_question_ids: unknownQuestionIds },
        );
      }
      operationMayHaveTakenEffect = true;
      const turnTimeoutMs = this.turnTimeoutMs();
      const claim = await this.store.claimContinuation({
        owner,
        runId: input.runId,
        expectedVersion: request.expected_version,
        operationId,
        eventId: this.id("evt"),
        now: now.toISOString(),
        staleBefore: new Date(
          now.getTime() - turnTimeoutMs - 60_000,
        ).toISOString(),
      });
      if (claim.kind !== "claimed") {
        operationMayHaveTakenEffect = false;
        if (claim.kind === "budget_exhausted") {
          operationMayHaveTakenEffect = true;
          const exhausted =
            (await this.store.exhaustBudget({
              owner,
              runId: input.runId,
              expectedVersion: request.expected_version,
              eventId: this.id("evt"),
              now: this.now().toISOString(),
            })) ?? claim.run;
          const body = publicRun(exhausted);
          await this.store.completeIdempotency({
            owner,
            operation,
            keyHash: idempotency.keyHash,
            requestHash: idempotency.requestHash,
            runId: input.runId,
            status: 200,
            receipt: body,
            now: this.now().toISOString(),
          });
          return { status: 200, body, idempotencyReplayed: false };
        }
        if (claim.kind === "not_found") {
          throw new HelixAgentApiServiceError(
            404,
            "not_found",
            "Agent run not found.",
          );
        }
        if (claim.kind === "version_conflict") {
          throw new HelixAgentApiServiceError(
            409,
            "version_conflict",
            "The run version is stale.",
            true,
            { current_version: claim.currentVersion },
          );
        }
        if (claim.kind === "busy") {
          throw new HelixAgentApiServiceError(
            409,
            "run_busy",
            "Another continuation is already active for this run.",
            true,
            { current_version: claim.run.version },
          );
        }
        if (claim.kind === "expired") {
          operationMayHaveTakenEffect = true;
          const expired =
            (await this.store.expireRun({
              owner,
              runId: input.runId,
              expectedVersion: request.expected_version,
              eventId: this.id("evt"),
              now: this.now().toISOString(),
            })) ?? claim.run;
          const body = publicRun(expired);
          await this.store.completeIdempotency({
            owner,
            operation,
            keyHash: idempotency.keyHash,
            requestHash: idempotency.requestHash,
            runId: input.runId,
            status: 200,
            receipt: body,
            now: this.now().toISOString(),
          });
          return { status: 200, body, idempotencyReplayed: false };
        }
        throw new HelixAgentApiServiceError(
          409,
          "run_not_resumable",
          "The run cannot be continued from its current state.",
        );
      }
      claimed = claim.run;

      const answers =
        request.answers.length > 0
          ? `Question answers:\n${request.answers
              .map(
                (answer) =>
                  `- ${answer.question_id}: ${JSON.stringify(answer.value)}`,
              )
              .join("\n")}`
          : "";
      const instruction = [request.instruction ?? "", answers]
        .filter(Boolean)
        .join("\n\n");
      let executorResult: HelixAgentRunTurnExecutorResult;
      const controller = new AbortController();
      const deadlineMs = Math.min(
        new Date(claimed.expiresAt).getTime(),
        this.now().getTime() + turnTimeoutMs,
      );
      const deadlineAt = new Date(deadlineMs).toISOString();
      this.activeTurnControllers.set(claimed.runId, controller);
      try {
        executorResult = await this.executeTurnWithinDeadline(
          {
            runId: claimed.runId,
            runVersion: claimed.version,
            turnId: this.id("turn"),
            traceId: this.id("trace"),
            internalSessionId: claimed.providerSessionId,
            objective: claimed.objective,
            instruction,
            constraints: claimed.configuration.constraints,
            databaseScope: claimed.configuration.database_scope,
            allowedTools: effectiveAllowedTools,
            requiredEvidence: effectiveRequiredEvidence,
            previousSummary: claimed.latestSummary,
            previousObservationRefs:
              claimed.evidenceBundle.observation_refs.slice(-64),
            previousEvidenceRefs:
              claimed.evidenceBundle.evidence_refs.slice(-64),
            previousReceiptRefs: claimed.evidenceBundle.receipt_refs.slice(-64),
            previousUnresolvedRequirements:
              claimed.unresolvedRequirements.slice(0, 64),
            previousContradictions: claimed.contradictions.slice(0, 64),
            pendingQuestions: claimed.pendingQuestions,
            remainingSteps: Math.max(0, claimed.maxSteps - claimed.stepsUsed),
            deadlineAt,
            signal: controller.signal,
            principal: input.principal,
          },
          Math.max(1, deadlineMs - this.now().getTime()),
          controller,
        );
      } catch (error) {
        executorResult = executorFailure(error);
      } finally {
        if (this.activeTurnControllers.get(claimed.runId) === controller) {
          this.activeTurnControllers.delete(claimed.runId);
        }
      }
      if (this.now().getTime() >= new Date(claimed.expiresAt).getTime()) {
        controller.abort(new Error("run_expired"));
        executorResult = executorFailure(new Error("run_expired"));
      }
      if (containsHelixAgentSensitiveValue(executorResult)) {
        executorResult = protectedExecutorResult();
      }

      const currentArtifactRefs = unique([
        ...executorResult.observationRefs,
        ...executorResult.evidenceRefs,
        ...executorResult.receiptRefs,
      ]);
      const satisfiedEvidenceRequirements = new Set(
        currentArtifactRefs.length > 0
          ? executorResult.satisfiedEvidenceRequirements.filter(
              (requirement: string) =>
                effectiveRequiredEvidence.includes(requirement),
            )
          : [],
      );
      const serviceMissingRequiredEvidence = effectiveRequiredEvidence
        .filter(
          (requirement: string) =>
            !satisfiedEvidenceRequirements.has(requirement),
        )
        .map((requirement: string) => `required_evidence:${requirement}`);
      const currentTurnMissingRequiredEvidence =
        serviceMissingRequiredEvidence.length > 0 ||
        executorResult.unresolvedRequirements.some(
          isRequiredEvidenceRequirement,
        );
      const currentResolutionRefs = unique([
        ...currentArtifactRefs,
        ...(executorResult.terminalProduct &&
        !currentTurnMissingRequiredEvidence
          ? [executorResult.terminalProduct.authority_ref]
          : []),
      ]);
      const resolutionSupported = currentResolutionRefs.length > 0;
      const resolvedRequirements = resolutionSupported
        ? new Set([
            ...executorResult.resolvedRequirements.filter(
              (requirement: string) =>
                !isRequiredEvidenceRequirement(requirement) ||
                satisfiedEvidenceRequirements.has(
                  requirement.slice("required_evidence:".length),
                ),
            ),
            ...Array.from(satisfiedEvidenceRequirements).map(
              (requirement: string) => `required_evidence:${requirement}`,
            ),
          ])
        : new Set<string>();
      const resolvedContradictions = resolutionSupported
        ? new Set(executorResult.resolvedContradictions)
        : new Set<string>();
      const unresolvedRequirements = unique([
        ...claimed.unresolvedRequirements,
        ...executorResult.unresolvedRequirements,
        ...serviceMissingRequiredEvidence,
      ]).filter(
        (requirement: string) => !resolvedRequirements.has(requirement),
      );
      const contradictions = unique([
        ...claimed.contradictions,
        ...executorResult.contradictions,
      ]).filter(
        (contradiction: string) => !resolvedContradictions.has(contradiction),
      );
      const pendingQuestions = mergePendingQuestions({
        previous: claimed.pendingQuestions,
        answeredQuestionIds: new Set(answeredQuestionIds),
        current: executorResult.pendingQuestions,
      });
      const missingRequiredEvidence = unresolvedRequirements.filter(
        isRequiredEvidenceRequirement,
      );
      const governedExecutorResult: HelixAgentRunTurnExecutorResult =
        missingRequiredEvidence.length === 0
          ? executorResult
          : {
              ...executorResult,
              terminalAuthorityStatus: "blocked",
              terminalProduct: null,
              outputFields: {},
              sanitizedResult: {
                ...executorResult.sanitizedResult,
                terminal_authority_status: "blocked",
                terminal_authority_reason:
                  "required_current_turn_evidence_missing",
                terminal_product: null,
              },
            };
      const evidenceBundle: HelixAgentEvidenceBundle = {
        schema: HELIX_AGENT_EVIDENCE_BUNDLE_SCHEMA,
        run_id: claimed.runId,
        observation_refs: unique([
          ...claimed.evidenceBundle.observation_refs,
          ...executorResult.observationRefs,
        ]),
        evidence_refs: unique([
          ...claimed.evidenceBundle.evidence_refs,
          ...executorResult.evidenceRefs,
        ]),
        receipt_refs: unique([
          ...claimed.evidenceBundle.receipt_refs,
          ...executorResult.receiptRefs,
        ]),
        provider_terminal_candidate_ref:
          missingRequiredEvidence.length > 0
            ? null
            : (governedExecutorResult.terminalProduct?.authority_ref ??
              claimed.evidenceBundle.provider_terminal_candidate_ref),
        claims_supported: unique([
          ...claimed.evidenceBundle.claims_supported,
          ...executorResult.claimsSupported,
        ]),
        claims_contradicted: unique([
          ...claimed.evidenceBundle.claims_contradicted,
          ...executorResult.claimsContradicted,
        ]),
        unresolved_requirements: unresolvedRequirements,
        terminal_authority_status:
          governedExecutorResult.terminalAuthorityStatus,
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      };
      const state = completionState({
        run: claimed,
        result: governedExecutorResult,
        evidenceBundle,
        unresolvedRequirements,
        contradictions,
        pendingQuestions,
      });
      const terminalEvent: HelixAgentRunEventType =
        state.completionStatus === "completed"
          ? "run_completed"
          : state.completionStatus === "budget_exhausted"
            ? "budget_exhausted"
            : state.completionStatus === "failed"
              ? "run_failed"
              : state.completionStatus === "blocked"
                ? "run_blocked"
                : "run_waiting";
      const events: Array<{
        eventId: string;
        eventType: HelixAgentRunEventType;
        payload: RecordLike;
      }> = [];
      if (
        executorResult.observationRefs.length > 0 ||
        executorResult.evidenceRefs.length > 0 ||
        executorResult.receiptRefs.length > 0
      ) {
        events.push({
          eventId: this.id("evt"),
          eventType: "evidence_reentered",
          payload: {
            version: claimed.version + 1,
            observation_refs: executorResult.observationRefs,
            evidence_refs: executorResult.evidenceRefs,
            receipt_refs: executorResult.receiptRefs,
            evidence_is_terminal_answer: false,
          },
        });
      }
      if (resolvedRequirements.size > 0 || resolvedContradictions.size > 0) {
        events.push({
          eventId: this.id("evt"),
          eventType: "issues_resolved",
          payload: {
            version: claimed.version + 1,
            resolved_requirements: Array.from(resolvedRequirements),
            resolved_contradictions: Array.from(resolvedContradictions),
            resolution_support_refs: currentResolutionRefs,
          },
        });
      }
      if (pendingQuestions.length > 0) {
        events.push({
          eventId: this.id("evt"),
          eventType: "input_requested",
          payload: {
            version: claimed.version + 1,
            questions: pendingQuestions.map(
              (question: HelixAgentPendingQuestion) => ({
                question_id: question.question_id,
                prompt: question.prompt,
                required_fields: question.required_fields,
                options: question.options,
              }),
            ),
          },
        });
      }
      events.push(
        {
          eventId: this.id("evt"),
          eventType: "terminal_authority_evaluated",
          payload: {
            version: claimed.version + 1,
            terminal_authority_status:
              governedExecutorResult.terminalAuthorityStatus,
            terminal_product_projected:
              governedExecutorResult.terminalProduct !== null,
          },
        },
        {
          eventId: this.id("evt"),
          eventType: terminalEvent,
          payload: {
            version: claimed.version + 1,
            lifecycle_status: state.lifecycleStatus,
            completion_status: state.completionStatus,
            failure_code: executorResult.failureCode,
          },
        },
      );

      const finalized = await this.store.finalizeContinuation({
        owner,
        runId: claimed.runId,
        operationId,
        expectedClaimedVersion: claimed.version,
        update: {
          lifecycleStatus: state.lifecycleStatus,
          completionStatus: state.completionStatus,
          terminalAuthorityStatus:
            governedExecutorResult.terminalAuthorityStatus,
          evidenceBundle,
          runtimeSnapshot: {
            schema: "helix.agent_run.runtime_snapshot.v1",
            last_operation_ref: operationId,
            terminal_authority_status:
              governedExecutorResult.terminalAuthorityStatus,
            raw_provider_thread_included: false,
            raw_provider_payload_included: false,
            chain_of_thought_included: false,
          },
          latestResult: governedExecutorResult.sanitizedResult,
          latestSummary: executorResult.summary,
          unresolvedRequirements,
          contradictions,
          pendingQuestions,
          completedAt: state.completedAt ? this.now().toISOString() : null,
        },
        events,
        now: this.now().toISOString(),
      });
      if (!finalized) {
        throw new HelixAgentApiServiceError(
          409,
          "outcome_unknown",
          "The continuation lost durable operation ownership before finalization. Inspect the run before retrying.",
          false,
          {
            run_id: claimed.runId,
            claimed_version: claimed.version,
          },
        );
      }
      const body = publicRun(finalized);
      await this.store.completeIdempotency({
        owner,
        operation,
        keyHash: idempotency.keyHash,
        requestHash: idempotency.requestHash,
        runId: finalized.runId,
        status: 200,
        receipt: body,
        now: this.now().toISOString(),
      });
      return { status: 200, body, idempotencyReplayed: false };
    } catch (error) {
      if (operationMayHaveTakenEffect) {
        await this.store.markIdempotencyOutcomeUnknown({
          owner,
          operation,
          keyHash: idempotency.keyHash,
          requestHash: idempotency.requestHash,
          runId: claimed?.runId ?? input.runId,
          now: this.now().toISOString(),
        });
      } else {
        await this.store.abandonIdempotency({
          owner,
          operation,
          keyHash: idempotency.keyHash,
          requestHash: idempotency.requestHash,
        });
      }
      throw error;
    }
  }

  async cancelRun(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
    idempotencyKey: string;
    request: HelixAgentCancelRequest;
  }): Promise<HelixAgentMutationResult> {
    const request = helixAgentCancelRequestSchema.parse(input.request);
    assertNoProtectedAgentInput(request);
    const owner = ownerFor(input.principal);
    const existing = await this.store.getRun(owner, input.runId);
    if (!existing) {
      throw new HelixAgentApiServiceError(
        404,
        "not_found",
        "Agent run not found.",
      );
    }
    const now = this.now();
    const operation = `cancel:${input.runId}`;
    const idempotency = await this.acquireMutation({
      principal: input.principal,
      operation,
      idempotencyKey: input.idempotencyKey,
      validatedRequest: { run_id: input.runId, ...request },
      runId: input.runId,
      now,
    });
    if (idempotency.replay) return idempotency.replay;

    let operationMayHaveTakenEffect = false;
    try {
      if (existing.version !== request.expected_version) {
        throw new HelixAgentApiServiceError(
          409,
          "version_conflict",
          "The run version is stale.",
          true,
          { current_version: existing.version },
        );
      }
      if (isTerminalLifecycle(existing.lifecycleStatus)) {
        throw new HelixAgentApiServiceError(
          409,
          "run_not_resumable",
          `A ${existing.lifecycleStatus} run cannot be cancelled.`,
        );
      }
      operationMayHaveTakenEffect = true;
      const cancelled = await this.store.cancelRun({
        owner,
        runId: input.runId,
        expectedVersion: request.expected_version,
        reason: request.reason,
        eventId: this.id("evt"),
        now: now.toISOString(),
      });
      if (cancelled.kind === "not_found") {
        operationMayHaveTakenEffect = false;
        throw new HelixAgentApiServiceError(
          404,
          "not_found",
          "Agent run not found.",
        );
      }
      if (cancelled.kind === "version_conflict") {
        operationMayHaveTakenEffect = false;
        throw new HelixAgentApiServiceError(
          409,
          "version_conflict",
          "The run version is stale.",
          true,
          { current_version: cancelled.currentVersion },
        );
      }
      if (cancelled.kind === "not_resumable") {
        operationMayHaveTakenEffect = false;
        throw new HelixAgentApiServiceError(
          409,
          "run_not_resumable",
          `A ${cancelled.run.lifecycleStatus} run cannot be cancelled.`,
        );
      }
      this.activeTurnControllers
        .get(cancelled.run.runId)
        ?.abort(new Error("agent_run_cancelled"));
      const body = publicRun(cancelled.run);
      await this.store.completeIdempotency({
        owner,
        operation,
        keyHash: idempotency.keyHash,
        requestHash: idempotency.requestHash,
        runId: cancelled.run.runId,
        status: 200,
        receipt: body,
        now: this.now().toISOString(),
      });
      return { status: 200, body, idempotencyReplayed: false };
    } catch (error) {
      if (operationMayHaveTakenEffect) {
        await this.store.markIdempotencyOutcomeUnknown({
          owner,
          operation,
          keyHash: idempotency.keyHash,
          requestHash: idempotency.requestHash,
          runId: input.runId,
          now: this.now().toISOString(),
        });
      } else {
        await this.store.abandonIdempotency({
          owner,
          operation,
          keyHash: idempotency.keyHash,
          requestHash: idempotency.requestHash,
        });
      }
      throw error;
    }
  }

  async listEvents(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
    afterSeq: number;
    limit: number;
  }): Promise<HelixAgentEventPage> {
    const events = await this.store.listEvents({
      owner: ownerFor(input.principal),
      runId: input.runId,
      afterSeq: input.afterSeq,
      limit: input.limit + 1,
    });
    if (!events) {
      throw new HelixAgentApiServiceError(
        404,
        "not_found",
        "Agent run not found.",
      );
    }
    const hasMore = events.length > input.limit;
    const page = events.slice(0, input.limit);
    return redactHelixAgentSensitiveValue({
      schema: "helix.agent_run.events_page.v1",
      run_id: input.runId,
      events: page,
      next_after_seq: page[page.length - 1]?.seq ?? input.afterSeq,
      has_more: hasMore,
    }) as HelixAgentEventPage;
  }

  async fetchEvidence(input: {
    principal: HelixAgentApiPrincipal;
    runId: string;
  }): Promise<HelixAgentEvidenceBundle> {
    const run = await this.store.getRun(ownerFor(input.principal), input.runId);
    if (!run) {
      throw new HelixAgentApiServiceError(
        404,
        "not_found",
        "Agent run not found.",
      );
    }
    return redactHelixAgentSensitiveValue(run.evidenceBundle);
  }
}
