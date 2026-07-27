import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import {
  assertHelixExternalExecutionActive,
  runWithHelixExternalCapabilityPolicy,
} from "../helix-ask/runtime/external-capability-policy";
import {
  projectHelixAskExternalTurn,
  type HelixAskExternalTurnProjection,
} from "../helix-ask/external-turn-projection";

type RecordLike = Record<string, unknown>;

export type HelixAskExternalTurnExecutionInput = {
  run_id: string;
  question: string;
  session_id: string;
  turn_id: string;
  trace_id: string;
  persona_id: string;
  tenant_id: string;
  issuer: string;
  subject_id: string;
  account_type: "developer" | "user";
  oauth_scopes: ReadonlySet<string>;
  account_policy: HelixAccountCapabilityPolicy;
  mode?: "read" | "observe" | "act" | "verify";
  allow_tools?: string[];
  required_evidence?: string[];
  signal?: AbortSignal;
  deadline_at?: string;
};

export type HelixAskExternalTurnExecutionResult = {
  status: number;
  payload: RecordLike;
  streamed_text: string;
  projection: HelixAskExternalTurnProjection | null;
};

export type HelixAskExternalTurnPreparedExecution =
  | {
      ok: false;
      issues: unknown[];
    }
  | {
      ok: true;
      execute(input: {
        responder: {
          send(status: number, payload: unknown): void;
        };
        streamChunk(chunk: string): void;
        signal?: AbortSignal;
        deadlineAt?: string;
      }): Promise<void>;
    };

export type HelixAskExternalTurnRouteBridge = {
  prepareRequest(input: {
    request: RecordLike;
    personaId: string;
    tenantId: string;
  }): HelixAskExternalTurnPreparedExecution;
  finalizePayload(input: {
    payload: RecordLike;
    threadId: string;
    turnId: string;
    prompt: string;
    sessionId: string;
  }): RecordLike;
};

type GovernedExternalTurnDependencies = {
  loadRouteBridge?: () => Promise<HelixAskExternalTurnRouteBridge>;
  projectTurn?: typeof projectHelixAskExternalTurn;
};

const defaultRouteBridge =
  async (): Promise<HelixAskExternalTurnRouteBridge> => {
    const routeModule = await import("../../routes/agi.plan");
    return routeModule.helixAskExternalTurnRouteBridge;
  };

const asPayload = (value: unknown): RecordLike =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : { value };

/**
 * Executes exactly one existing Helix Ask turn under the external-agent
 * read-only policy. Sampling, tool dispatch, retries, approval, and terminal
 * completion remain owned by the existing Helix/Codex runtime.
 */
export const executeGovernedHelixAskExternalTurn = async (
  input: HelixAskExternalTurnExecutionInput,
  dependencies: GovernedExternalTurnDependencies = {},
): Promise<HelixAskExternalTurnExecutionResult> => {
  const executionPolicy = {
    runId: input.run_id,
    tenantId: input.tenant_id,
    issuer: input.issuer,
    subjectId: input.subject_id,
    accountProfileId: input.persona_id,
    accountType: input.account_type,
    oauthScopes: input.oauth_scopes,
    accountPolicy: input.account_policy,
    allowedCapabilities:
      input.allow_tools && input.allow_tools.length > 0
        ? input.allow_tools
        : ["__helix_external_agent_no_tools__"],
    readOnly: true as const,
    signal: input.signal,
    deadlineAt: input.deadline_at,
  };
  assertHelixExternalExecutionActive(executionPolicy);

  const bridge = await (dependencies.loadRouteBridge ?? defaultRouteBridge)();
  assertHelixExternalExecutionActive(executionPolicy);
  const prepared = bridge.prepareRequest({
    request: {
      question: input.question,
      raw_user_prompt: input.question,
      question_source: "raw_prompt",
      sessionId: input.session_id,
      turnId: input.turn_id,
      traceId: input.trace_id,
      personaId: input.persona_id,
      account_type: input.account_type,
      mode: input.mode ?? "observe",
      allowTools: input.allow_tools,
      requiredEvidence: input.required_evidence,
      debug: true,
    },
    personaId: input.persona_id,
    tenantId: input.tenant_id,
  });
  if (!prepared.ok) {
    return {
      status: 400,
      payload: {
        ok: false,
        error: "invalid_external_agent_turn",
        issues: prepared.issues,
      },
      streamed_text: "",
      projection: null,
    };
  }

  let response: HelixAskExternalTurnExecutionResult | null = null;
  const streamedChunks: string[] = [];
  await runWithHelixExternalCapabilityPolicy(executionPolicy, () =>
    prepared.execute({
      responder: {
        send: (status, payload) => {
          if (response) return;
          response = {
            status,
            payload: asPayload(payload),
            streamed_text: streamedChunks.join(""),
            projection: null,
          };
        },
      },
      streamChunk: (chunk) => {
        if (typeof chunk === "string" && chunk) streamedChunks.push(chunk);
      },
      signal: input.signal,
      deadlineAt: input.deadline_at,
    }),
  );
  assertHelixExternalExecutionActive(executionPolicy);

  const resolved: HelixAskExternalTurnExecutionResult = response ?? {
    status: 500,
    payload: {
      ok: false,
      error: "helix_ask_no_response",
    },
    streamed_text: streamedChunks.join(""),
    projection: null,
  };
  let finalizedPayload = resolved.payload;
  if (resolved.status < 400) {
    assertHelixExternalExecutionActive(executionPolicy);
    try {
      finalizedPayload = bridge.finalizePayload({
        payload: finalizedPayload,
        threadId: input.session_id,
        turnId: input.turn_id,
        prompt: input.question,
        sessionId: input.session_id,
      });
    } catch {
      finalizedPayload = {
        ok: false,
        error: "external_turn_finalization_failed",
        fail_reason: "The governed Helix terminal boundary did not finalize.",
        terminal_error_code: "external_turn_finalization_failed",
        turn_id: input.turn_id,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
  }
  assertHelixExternalExecutionActive(executionPolicy);

  const projectTurn = dependencies.projectTurn ?? projectHelixAskExternalTurn;
  const projection = projectTurn({
    payload: finalizedPayload,
    status: resolved.status,
    turnId: input.turn_id,
    threadId: input.session_id,
    requiredEvidence: input.required_evidence ?? [],
  });
  assertHelixExternalExecutionActive(executionPolicy);
  return {
    ...resolved,
    payload: finalizedPayload,
    projection,
  };
};
