import type {
  HelixAgentRunTurnExecutor,
  HelixAgentRunTurnExecutorInput,
  HelixAgentRunTurnExecutorResult,
} from "./types";
import { assertHelixExternalExecutionActive } from "../helix-ask/runtime/external-capability-policy";
import { executeGovernedHelixAskExternalTurn } from "./governed-external-turn-executor";
import { containsHelixAgentSensitiveText } from "./sensitive-text";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export type HelixAgentConversationContextReader = (
  input: HelixAgentRunTurnExecutorInput,
) => Promise<string>;

export type FullHelixAskTurnExecutorDependencies = {
  readConversationContext?: HelixAgentConversationContextReader;
  executeExternalTurn?: typeof executeGovernedHelixAskExternalTurn;
};

const buildQuestion = (
  input: HelixAgentRunTurnExecutorInput,
  conversationContext: string,
): string => {
  const lines = [
    `Objective: ${input.objective}`,
    input.instruction ? `Current instruction: ${input.instruction}` : "",
    input.constraints.length > 0
      ? `Constraints:\n${input.constraints
          .map((entry: string) => `- ${entry}`)
          .join("\n")}`
      : "",
    input.databaseScope.length > 0
      ? `Admitted logical data scopes: ${input.databaseScope.join(", ")}`
      : "",
    conversationContext,
    input.previousSummary
      ? `Previous durable progress summary: ${input.previousSummary}`
      : "",
    [
      ...input.previousObservationRefs,
      ...input.previousEvidenceRefs,
      ...input.previousReceiptRefs,
    ].length > 0
      ? `Previously admitted evidence references:\n${[
          ...input.previousObservationRefs,
          ...input.previousEvidenceRefs,
          ...input.previousReceiptRefs,
        ]
          .slice(-64)
          .map((entry: string) => `- ${entry}`)
          .join("\n")}`
      : "",
    input.previousUnresolvedRequirements.length > 0
      ? `Open requirements from durable state:\n${input.previousUnresolvedRequirements
          .slice(0, 64)
          .map((entry: string) => `- ${entry}`)
          .join("\n")}`
      : "",
    input.previousContradictions.length > 0
      ? `Open contradictions from durable state:\n${input.previousContradictions
          .slice(0, 64)
          .map((entry: string) => `- ${entry}`)
          .join("\n")}`
      : "",
    input.pendingQuestions.length > 0
      ? `Outstanding question IDs:\n${input.pendingQuestions
          .map(
            (
              question: HelixAgentRunTurnExecutorInput["pendingQuestions"][number],
            ) => `- ${question.question_id}: ${question.prompt}`,
          )
          .join("\n")}`
      : "",
    `Remaining bounded steps after this turn: ${Math.max(0, input.remainingSteps)}`,
    `This turn deadline is ${input.deadlineAt}.`,
    "Return only a result supported by admitted evidence. Disclose unresolved requirements or contradictions.",
  ];
  return lines.filter(Boolean).join("\n\n");
};

const failureCodeFromPayload = (payload: RecordLike): string | null =>
  readString(
    payload.terminal_error_code ??
      payload.fail_reason ??
      payload.error ??
      readRecord(payload.typed_failure)?.error_code,
  ) || null;

const protectedContentFailure = (): HelixAgentRunTurnExecutorResult => ({
  ok: false,
  statusCode: 422,
  summary:
    "Helix Ask content was withheld because it contained protected credential material.",
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
    status: 422,
    ok: false,
    final_status: "blocked",
    response_type: "typed_failure",
    terminal_artifact_kind: null,
    final_answer_source: null,
    terminal_authority_status: "blocked",
    terminal_authority_reason: "protected_sensitive_content_rejected",
    terminal_authority_ref: null,
    terminal_product: null,
    failure_code: "protected_sensitive_content_rejected",
    solver_path_completed: false,
    observation_refs: [],
    evidence_refs: [],
    receipt_refs: [],
    raw_provider_payload_included: false,
    chain_of_thought_included: false,
  },
});

export class FullHelixAskTurnExecutor implements HelixAgentRunTurnExecutor {
  private readonly readConversationContext: HelixAgentConversationContextReader;
  private readonly executeExternalTurn: typeof executeGovernedHelixAskExternalTurn;

  constructor(dependencies: FullHelixAskTurnExecutorDependencies = {}) {
    this.readConversationContext =
      dependencies.readConversationContext ?? (async () => "");
    this.executeExternalTurn =
      dependencies.executeExternalTurn ?? executeGovernedHelixAskExternalTurn;
  }

  async executeTurn(
    input: HelixAgentRunTurnExecutorInput,
  ): Promise<HelixAgentRunTurnExecutorResult> {
    assertHelixExternalExecutionActive({
      signal: input.signal,
      deadlineAt: input.deadlineAt,
    });
    const conversationContext = await this.readConversationContext(input);
    assertHelixExternalExecutionActive({
      signal: input.signal,
      deadlineAt: input.deadlineAt,
    });
    const question = buildQuestion(input, conversationContext);
    if (containsHelixAgentSensitiveText(question)) {
      return protectedContentFailure();
    }
    const result = await this.executeExternalTurn({
      run_id: input.runId,
      question,
      session_id: input.internalSessionId,
      turn_id: input.turnId,
      trace_id: input.traceId,
      persona_id: input.principal.accountProfileId,
      tenant_id: input.principal.tenantId,
      issuer: input.principal.issuer,
      subject_id: input.principal.subjectId,
      account_type: input.principal.accountType,
      oauth_scopes: input.principal.scopes,
      account_policy: input.principal.accountContext.account_policy,
      mode: "read",
      allow_tools: input.allowedTools,
      required_evidence: input.requiredEvidence,
      signal: input.signal,
      deadline_at: input.deadlineAt,
    });
    assertHelixExternalExecutionActive({
      signal: input.signal,
      deadlineAt: input.deadlineAt,
    });
    const payload = result.payload;
    const projection = result.projection;
    let protectedContentDetected = false;
    try {
      protectedContentDetected = containsHelixAgentSensitiveText(
        JSON.stringify({ payload, projection }),
      );
    } catch {
      protectedContentDetected = true;
    }
    if (protectedContentDetected) {
      return protectedContentFailure();
    }
    const terminalAuthorityStatus =
      projection?.terminal_authority_status ?? "blocked";
    const observationRefs = projection?.observation_refs ?? [];
    const evidenceRefs = projection?.evidence_refs ?? [];
    const receiptRefs = projection?.receipt_refs ?? [];
    const terminalProduct = projection?.terminal_product ?? null;
    const artifactKind = terminalProduct?.artifact_kind ?? "";
    const failureCode = failureCodeFromPayload(payload);
    const needsInput =
      (projection?.pending_questions.length ?? 0) > 0 ||
      payload.needs_confirmation === true ||
      readString(payload.response_type) === "clarification" ||
      readString(payload.final_status) === "needs_input";
    const ok = result.status < 400 && payload.ok !== false;
    const fallbackSummary =
      readString(
        payload.message ??
          payload.fail_reason ??
          payload.error ??
          readRecord(payload.typed_failure)?.message,
      ) ||
      (terminalAuthorityStatus === "pending_helix_terminal_authority"
        ? "Helix Ask returned a nonterminal result."
        : "Helix Ask completed without an externally projectable answer.");
    const summary = (terminalProduct?.text || fallbackSummary).slice(0, 2_000);
    const solverTrace = readRecord(payload.ask_turn_solver_trace);

    return {
      ok,
      statusCode: result.status,
      summary,
      observationRefs,
      evidenceRefs,
      receiptRefs,
      claimsSupported: [],
      claimsContradicted: [],
      unresolvedRequirements: projection
        ? [
            ...projection.unresolved_requirements,
            ...projection.missing_evidence_requirements.map(
              (requirement: string) => `required_evidence:${requirement}`,
            ),
          ]
        : needsInput
          ? [failureCode ?? "user_input_required"]
          : [],
      resolvedRequirements: projection
        ? input.previousUnresolvedRequirements.filter((requirement: string) => {
            if (!requirement.startsWith("required_evidence:")) return false;
            return projection.satisfied_evidence_requirements.includes(
              requirement.slice("required_evidence:".length),
            );
          })
        : [],
      satisfiedEvidenceRequirements:
        projection?.satisfied_evidence_requirements ?? [],
      contradictions: [],
      resolvedContradictions: [],
      pendingQuestions: projection?.pending_questions ?? [],
      terminalAuthorityStatus,
      terminalProduct,
      outputFields: terminalProduct
        ? {
            text: terminalProduct.text,
            authority_ref: terminalProduct.authority_ref,
            artifact_kind: terminalProduct.artifact_kind,
            supporting_evidence_refs: terminalProduct.supporting_evidence_refs,
          }
        : {},
      failureCode,
      needsInput,
      sanitizedResult: {
        status: result.status,
        ok,
        final_status: readString(payload.final_status) || null,
        response_type: readString(payload.response_type) || null,
        terminal_artifact_kind: artifactKind || null,
        final_answer_source: readString(payload.final_answer_source) || null,
        terminal_authority_status: terminalAuthorityStatus,
        terminal_authority_reason:
          projection?.terminal_authority_reason ?? "projection_unavailable",
        terminal_authority_ref: terminalProduct?.authority_ref ?? null,
        terminal_product: terminalProduct,
        failure_code: failureCode,
        solver_path_completed: solverTrace?.completed_solver_path === true,
        observation_refs: observationRefs,
        evidence_refs: evidenceRefs,
        receipt_refs: receiptRefs,
        raw_provider_payload_included: false,
        chain_of_thought_included: false,
      },
    };
  }
}
