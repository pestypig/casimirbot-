import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { HelixTurnLifecycle } from "@shared/helix-turn-lifecycle";
import type { HelixRuntimeSemanticRouteProposal } from "../../runtime/runtime-intent-packet";
import { createHelixTurnLifecycleRecorder } from "../../runtime/turn-lifecycle";
import type { HelixWorkstationCapabilityManifest } from "../../workstation-tool-gateway/types";
import {
  buildCodexNativeDynamicToolCatalog,
  HELIX_CODEX_ROUTE_PROPOSAL_TOOL,
} from "./dynamic-tools";
import {
  CODEX_NATIVE_DISABLED_FEATURES,
  createCodexAppServerProcessTransport,
} from "./process-transport";
import {
  CodexAppServerJsonRpcClient,
  CodexAppServerProtocolError,
  type CodexAppServerTransport,
} from "./protocol";

type RecordLike = Record<string, unknown>;

export type CodexNativeRouteAdmission = {
  ok: boolean;
  proposal: HelixRuntimeSemanticRouteProposal | null;
  admittedCapabilityIds: string[];
  reason: string;
};

export type CodexNativeCapabilityExecutionResult = {
  ok: boolean;
  content: unknown;
  observationRef?: string | null;
};

export type CodexNativeAppServerDebug = {
  schema: "helix.codex_native_app_server_debug.v1";
  transport: "app_server_stdio_jsonl";
  ephemeral_thread: true;
  isolated_runtime_workspace: true;
  sandbox_policy: "read_only";
  network_access: false;
  approval_policy: "never";
  built_in_tools_disabled: true;
  disabled_native_features: string[];
  model_visible_tools: string[];
  route_proposal: HelixRuntimeSemanticRouteProposal | null;
  route_admission_reason: string | null;
  route_admitted_tools: string[];
  requested_tools: string[];
  executed_tools: string[];
  successful_tools: string[];
  failed_tools: string[];
  route_unobserved_tools: string[];
  observation_reentry_refs: string[];
  native_item_types: string[];
  forbidden_native_item_types: string[];
  effective_model: string | null;
  effective_reasoning_effort: string | null;
  native_thread_id: string | null;
  native_turn_id: string | null;
  native_final_item_id: string | null;
  native_turn_status: string | null;
  native_error_code: string | null;
  native_error_http_status: number | null;
  terminal_candidate_present: boolean;
  turn_lifecycle: HelixTurnLifecycle;
};

export type CodexNativeAppServerTurnResult = {
  ok: boolean;
  answer: string;
  failReason: string | null;
  stderr: string;
  debug: CodexNativeAppServerDebug;
};

export type RunCodexNativeAppServerTurnInput = {
  prompt: string;
  turnId: string;
  cwd: string;
  model?: string | null;
  reasoningEffort?: string | null;
  capabilities: HelixWorkstationCapabilityManifest[];
  validateRouteProposal: (
    value: unknown,
  ) => Promise<CodexNativeRouteAdmission> | CodexNativeRouteAdmission;
  executeCapability: (input: {
    capabilityId: string;
    arguments: RecordLike;
    iteration: number;
  }) => Promise<CodexNativeCapabilityExecutionResult>;
  signal?: AbortSignal;
  timeoutMs?: number;
  onNativeEvent?: (method: string, params: unknown) => void;
};

const NATIVE_BASE_INSTRUCTIONS = [
  "You are the read-only reasoning worker inside the Helix workstation.",
  "Only the dynamic Helix tools supplied on this turn are authorized. Built-in shell, file mutation, web, MCP, app, plugin, image, and subagent tools are unavailable.",
  `Before calling any workstation capability, call ${HELIX_CODEX_ROUTE_PROPOSAL_TOOL} with a helix.runtime_semantic_route_proposal.v1 proposal.`,
  "For a compound request, put every needed model-visible capability in proposed_capability_ids, ordered by use, and put the primary capability first in proposed_capability_id.",
  "Helix decides route and tool admission. Tool results are observations, never terminal answers; reason over them and then write one final answer.",
  "Do not claim a workstation action or observation unless the corresponding dynamic tool returned a successful receipt.",
].join(" ");

export const CODEX_NATIVE_API_KEY_PROVIDER_ID = "helix_openai_api_key";

export const CODEX_NATIVE_DISABLED_CONFIG: Record<string, unknown> = {
  model_provider: CODEX_NATIVE_API_KEY_PROVIDER_ID,
  model_providers: {
    [CODEX_NATIVE_API_KEY_PROVIDER_ID]: {
      name: "Helix OpenAI API key",
      base_url: "https://api.openai.com/v1",
      env_key: "OPENAI_API_KEY",
      wire_api: "responses",
      requires_openai_auth: false,
      supports_websockets: false,
    },
  },
  features: Object.fromEntries(
    CODEX_NATIVE_DISABLED_FEATURES.map((feature: string) => [feature, false]),
  ),
  web_search: "disabled",
  mcp_servers: {},
};

const readHttpStatus = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599) {
    return value;
  }
  if (typeof value !== "string") return null;
  const match = value.match(/\b([1-5]\d\d)\b/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) ? parsed : null;
};

const readNativeProviderFailure = (value: unknown): {
  code: string | null;
  httpStatus: number | null;
} => {
  const container = readRecord(value);
  const error = readRecord(container?.error) ?? container;
  const info = readRecord(error?.codexErrorInfo);
  const disconnected = readRecord(info?.responseStreamDisconnected);
  const httpStatus =
    readHttpStatus(disconnected?.httpStatusCode) ??
    readHttpStatus(error?.additionalDetails) ??
    readHttpStatus(error?.message);
  const code = httpStatus === 401
    ? "provider_auth_failed"
    : httpStatus === 403
      ? "provider_access_denied"
      : httpStatus === 429
        ? "provider_rate_limited"
        : httpStatus !== null && httpStatus >= 500
          ? "provider_upstream_error"
          : readString(error?.message)
            ? "provider_turn_failed"
            : null;
  return { code, httpStatus };
};

const readRecord = (value: unknown): RecordLike =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values));

const boundedToolContent = (value: unknown): string => {
  const serialized = JSON.stringify(value);
  if (serialized.length <= 64_000) return serialized;
  return JSON.stringify({
    schema: "helix.codex_native_tool_content_truncated.v1",
    original_char_count: serialized.length,
    preview: serialized.slice(0, 60_000),
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  });
};

const toolResponse = (content: unknown, success: boolean) => ({
  contentItems: [{ type: "inputText", text: boundedToolContent(content) }],
  success,
});

const timeoutForTurn = (input: RunCodexNativeAppServerTurnInput): number => {
  if (typeof input.timeoutMs === "number" && input.timeoutMs > 0) return input.timeoutMs;
  const configured = Number(process.env.HELIX_CODEX_NATIVE_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 120_000;
};

const forbiddenItemTypes = new Set([
  "commandExecution",
  "fileChange",
  "mcpToolCall",
  "collabToolCall",
  "webSearch",
  "imageView",
]);

export const runCodexNativeAppServerTurnWithTransport = async (
  input: RunCodexNativeAppServerTurnInput,
  transport: CodexAppServerTransport,
): Promise<CodexNativeAppServerTurnResult> => {
  const lifecycle = createHelixTurnLifecycleRecorder({
    turnId: input.turnId,
    scope: "codex_native_provider_cycle",
  });
  const turnStartedEvent = lifecycle.append({
    kind: "turn.started",
    producer: "helix_adapter",
    status: "started",
  });
  const catalog = buildCodexNativeDynamicToolCatalog(input.capabilities);
  const client = new CodexAppServerJsonRpcClient(transport);
  const modelVisibleTools = input.capabilities.map(
    (capability: HelixWorkstationCapabilityManifest) => capability.capability_id,
  );
  const knownCapabilities = new Set(modelVisibleTools);
  const requestedTools: string[] = [];
  const executedTools: string[] = [];
  const successfulTools: string[] = [];
  const failedTools: string[] = [];
  const observationRefs: string[] = [];
  const nativeItemTypes: string[] = [];
  const forbiddenItems: string[] = [];
  const pendingReentryByCallId = new Map<string, {
    completionEventId: string;
    capabilityId: string | null;
    observationRefs: string[];
  }>();
  let routeAdmission: CodexNativeRouteAdmission | null = null;
  let activeRouteCommitId: string | null = null;
  let nativeThreadId: string | null = null;
  let nativeTurnId: string | null = null;
  let nativeTurnStatus: string | null = null;
  let nativeFinalItemId: string | null = null;
  let nativeErrorCode: string | null = null;
  let nativeErrorHttpStatus: number | null = null;
  let answer = "";

  const recordToolResponse = (args: {
    callId: string;
    capabilityId: string | null;
    kind: "tool.call.completed" | "tool.call.failed" | "tool.call.rejected";
    content: unknown;
    success: boolean;
    reasonCode?: string;
    observationRefs?: string[];
    causationId?: string;
  }): ReturnType<typeof toolResponse> => {
    const completionEvent = lifecycle.append({
      kind: args.kind,
      producer: args.kind === "tool.call.rejected" ? "helix_policy" : "helix_adapter",
      status:
        args.kind === "tool.call.completed"
          ? "succeeded"
          : args.kind === "tool.call.rejected"
            ? "blocked"
            : "failed",
      causation_id: args.causationId,
      route_commit_id: activeRouteCommitId ?? undefined,
      call_id: args.callId,
      capability_id: args.capabilityId ?? undefined,
      observation_refs: args.observationRefs ?? [],
      reason_code: args.reasonCode,
    });
    pendingReentryByCallId.set(args.callId, {
      completionEventId: completionEvent.event_id,
      capabilityId: args.capabilityId,
      observationRefs: args.observationRefs ?? [],
    });
    return toolResponse(args.content, args.success);
  };

  client.setServerResponseSentHandler(({ id, method, params }) => {
    if (method !== "item/tool/call") return;
    const request = readRecord(params);
    const callId =
      readString(request.callId) ??
      readString(request.call_id) ??
      String(id);
    const pending = pendingReentryByCallId.get(callId);
    if (!pending) return;
    lifecycle.append({
      kind: "observation.reentered",
      producer: "helix_adapter",
      status: "succeeded",
      causation_id: pending.completionEventId,
      route_commit_id: activeRouteCommitId ?? undefined,
      native_request_id: String(id),
      call_id: callId,
      capability_id: pending.capabilityId ?? undefined,
      observation_refs: pending.observationRefs,
    });
    pendingReentryByCallId.delete(callId);
  });

  client.setServerRequestHandler(async (method: string, rawParams: unknown) => {
    if (method !== "item/tool/call") {
      forbiddenItems.push(`server_request:${method}`);
      throw new CodexAppServerProtocolError(
        "unsupported_server_request",
        `Helix denied unexpected Codex app-server request ${method}.`,
      );
    }
    const params = readRecord(rawParams);
    const toolName = readString(params.tool) ?? "";
    const args = readRecord(params.arguments);
    const callId =
      readString(params.callId) ??
      readString(params.call_id) ??
      `${input.turnId}:native-tool:${requestedTools.length + 1}`;

    if (toolName === HELIX_CODEX_ROUTE_PROPOSAL_TOOL) {
      if (routeAdmission) {
        return toolResponse(
          {
            schema: "helix.codex_native_route_admission.v1",
            ok: false,
            reason: "route_already_committed",
            terminal_eligible: false,
            assistant_answer: false,
          },
          false,
        );
      }
      const proposedCapabilityIds = uniqueStrings([
        readString(args.proposed_capability_id),
        ...(Array.isArray(args.proposed_capability_ids)
          ? args.proposed_capability_ids.map(readString)
          : []),
      ].filter((value): value is string => Boolean(value)));
      const routeProposedEvent = lifecycle.append({
        kind: "route.proposed",
        producer: "codex_runtime",
        status: "succeeded",
        causation_id: turnStartedEvent.event_id,
        native_request_id: callId,
        capability_ids: proposedCapabilityIds,
      });
      for (const capabilityId of proposedCapabilityIds) {
        lifecycle.append({
          kind: "capability.proposed",
          producer: "codex_runtime",
          status: "succeeded",
          causation_id: routeProposedEvent.event_id,
          capability_id: capabilityId,
        });
      }
      const proposedAdmission = await input.validateRouteProposal(args);
      routeAdmission = {
        ...proposedAdmission,
        admittedCapabilityIds: uniqueStrings(
          proposedAdmission.admittedCapabilityIds.filter((capabilityId: string) =>
            knownCapabilities.has(capabilityId),
          ),
        ),
      };
      const routeDecisionEvent = lifecycle.append({
        kind: routeAdmission.ok ? "route.committed" : "route.rejected",
        producer: "helix_policy",
        status: routeAdmission.ok ? "succeeded" : "blocked",
        causation_id: routeProposedEvent.event_id,
        route_commit_id: routeAdmission.ok
          ? `${input.turnId}:route:${routeProposedEvent.sequence}`
          : undefined,
        capability_ids: routeAdmission.admittedCapabilityIds,
        reason_code: routeAdmission.reason,
      });
      activeRouteCommitId = routeDecisionEvent.route_commit_id ?? null;
      for (const capabilityId of proposedCapabilityIds) {
        const admitted = routeAdmission.admittedCapabilityIds.includes(capabilityId);
        lifecycle.append({
          kind: admitted ? "capability.admitted" : "capability.rejected",
          producer: "helix_policy",
          status: admitted ? "succeeded" : "blocked",
          causation_id: routeDecisionEvent.event_id,
          route_commit_id: activeRouteCommitId ?? undefined,
          capability_id: capabilityId,
          reason_code: admitted ? routeAdmission.reason : "capability_not_admitted",
        });
      }
      return toolResponse(
        {
          schema: "helix.codex_native_route_admission.v1",
          ok: routeAdmission.ok,
          proposal: routeAdmission.proposal,
          admitted_capability_ids: routeAdmission.admittedCapabilityIds,
          reason: routeAdmission.reason,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
        routeAdmission.ok,
      );
    }

    const capabilityId = catalog.capabilityIdByToolName.get(toolName);
    if (!capabilityId) {
      requestedTools.push(`unknown:${toolName || "missing"}`);
      return recordToolResponse({
        callId,
        capabilityId: null,
        kind: "tool.call.rejected",
        content: {
          schema: "helix.codex_native_tool_block.v1",
          ok: false,
          reason: "dynamic_tool_not_registered",
          terminal_eligible: false,
          assistant_answer: false,
        },
        success: false,
        reasonCode: "dynamic_tool_not_registered",
      });
    }
    requestedTools.push(capabilityId);
    if (!routeAdmission?.ok) {
      return recordToolResponse({
        callId,
        capabilityId,
        kind: "tool.call.rejected",
        content: {
          schema: "helix.codex_native_tool_block.v1",
          ok: false,
          capability_id: capabilityId,
          reason: "route_proposal_required",
          terminal_eligible: false,
          assistant_answer: false,
        },
        success: false,
        reasonCode: "route_proposal_required",
      });
    }
    if (!routeAdmission.admittedCapabilityIds.includes(capabilityId)) {
      return recordToolResponse({
        callId,
        capabilityId,
        kind: "tool.call.rejected",
        content: {
          schema: "helix.codex_native_tool_block.v1",
          ok: false,
          capability_id: capabilityId,
          reason: "capability_outside_committed_route",
          terminal_eligible: false,
          assistant_answer: false,
        },
        success: false,
        reasonCode: "capability_outside_committed_route",
      });
    }

    const toolStartedEvent = lifecycle.append({
      kind: "tool.call.started",
      producer: "codex_runtime",
      status: "started",
      route_commit_id: activeRouteCommitId ?? undefined,
      call_id: callId,
      capability_id: capabilityId,
    });
    const execution = await input.executeCapability({
      capabilityId,
      arguments: args,
      iteration: executedTools.length + 1,
    });
    executedTools.push(capabilityId);
    if (execution.ok) successfulTools.push(capabilityId);
    else failedTools.push(capabilityId);
    if (execution.observationRef) observationRefs.push(execution.observationRef);
    return recordToolResponse({
      callId,
      capabilityId,
      kind: execution.ok ? "tool.call.completed" : "tool.call.failed",
      content: execution.content,
      success: execution.ok,
      observationRefs: execution.observationRef ? [execution.observationRef] : [],
      causationId: toolStartedEvent.event_id,
      reasonCode: execution.ok ? undefined : "capability_execution_failed",
    });
  });

  let resolveCompleted: (value: void) => void = () => undefined;
  let rejectCompleted: (error: Error) => void = () => undefined;
  const completed = new Promise<void>((
    resolve: (value: void | PromiseLike<void>) => void,
    reject: (reason?: unknown) => void,
  ) => {
    resolveCompleted = resolve;
    rejectCompleted = reject;
  });
  const timeout = setTimeout(() => {
    rejectCompleted(
      new CodexAppServerProtocolError(
        "native_turn_timeout",
        `Codex native turn exceeded ${timeoutForTurn(input)}ms.`,
      ),
    );
  }, timeoutForTurn(input));
  const abort = () => {
    rejectCompleted(
      new CodexAppServerProtocolError("native_turn_aborted", "Codex native turn was aborted."),
    );
    client.close();
  };
  input.signal?.addEventListener("abort", abort, { once: true });

  client.onNotification((method: string, rawParams: unknown) => {
    input.onNativeEvent?.(method, rawParams);
    const params = readRecord(rawParams);
    if (method === "error") {
      const failure = readNativeProviderFailure(params);
      nativeErrorCode = failure.code ?? nativeErrorCode;
      nativeErrorHttpStatus = failure.httpStatus ?? nativeErrorHttpStatus;
    }
    if (method === "item/started" || method === "item/completed") {
      const item = readRecord(params.item);
      const itemType = readString(item.type);
      if (itemType) nativeItemTypes.push(itemType);
      if (itemType && forbiddenItemTypes.has(itemType)) forbiddenItems.push(itemType);
      if (method === "item/completed" && itemType === "agentMessage") {
        answer = readString(item.text) ?? answer;
        nativeFinalItemId = readString(item.id) ?? nativeFinalItemId;
        if (answer) {
          lifecycle.append({
            kind: "agent.message.completed",
            producer: "codex_runtime",
            status: "succeeded",
            causation_id:
              lifecycle.latest("observation.reentered")?.event_id ??
              turnStartedEvent.event_id,
            route_commit_id: activeRouteCommitId ?? undefined,
            native_item_id: nativeFinalItemId ?? undefined,
            native_turn_id: nativeTurnId ?? undefined,
            message_sha256: crypto.createHash("sha256").update(answer).digest("hex"),
          });
        }
      }
    }
    if (method === "turn/completed") {
      const turn = readRecord(params.turn);
      nativeTurnId = readString(turn.id) ?? nativeTurnId;
      nativeTurnStatus = readString(turn.status) ?? "completed";
      const failure = readNativeProviderFailure(turn);
      nativeErrorCode = failure.code ?? nativeErrorCode;
      nativeErrorHttpStatus = failure.httpStatus ?? nativeErrorHttpStatus;
      lifecycle.append({
        kind: nativeTurnStatus === "completed" ? "runtime.turn.completed" : "runtime.turn.failed",
        producer: "codex_runtime",
        status: nativeTurnStatus === "completed" ? "succeeded" : "failed",
        causation_id:
          lifecycle.latest("agent.message.completed")?.event_id ??
          lifecycle.latest("observation.reentered")?.event_id ??
          turnStartedEvent.event_id,
        route_commit_id: activeRouteCommitId ?? undefined,
        native_turn_id: nativeTurnId ?? undefined,
        reason_code: nativeTurnStatus === "completed" ? undefined : nativeErrorCode ?? nativeTurnStatus,
      });
      resolveCompleted();
    }
  });

  let failReason: string | null = null;
  try {
    await client.request("initialize", {
      clientInfo: {
        name: "casimirbot_helix",
        title: "CasimirBot Helix",
        version: "1.0.0",
      },
      capabilities: {
        experimentalApi: true,
        requestAttestation: false,
      },
    });
    client.notify("initialized");

    const threadResponse = readRecord(
      await client.request("thread/start", {
        model: input.model ?? undefined,
        cwd: input.cwd,
        approvalPolicy: "never",
        sandbox: "read-only",
        config: CODEX_NATIVE_DISABLED_CONFIG,
        baseInstructions: NATIVE_BASE_INSTRUCTIONS,
        ephemeral: true,
        dynamicTools: catalog.specs,
      }),
    );
    nativeThreadId = readString(readRecord(threadResponse.thread).id);
    if (!nativeThreadId) {
      throw new CodexAppServerProtocolError(
        "missing_thread_id",
        "Codex app-server thread/start did not return a thread ID.",
        threadResponse,
      );
    }

    const turnResponse = readRecord(
      await client.request("turn/start", {
        threadId: nativeThreadId,
        input: [{ type: "text", text: input.prompt, text_elements: [] }],
        cwd: input.cwd,
        approvalPolicy: "never",
        sandboxPolicy: { type: "readOnly", networkAccess: false },
        model: input.model ?? undefined,
        effort: input.reasoningEffort ?? undefined,
      }),
    );
    nativeTurnId = readString(readRecord(turnResponse.turn).id);
    await completed;
    const observedToolSet = new Set(executedTools);
    const routeUnobservedTools = routeAdmission?.admittedCapabilityIds.filter(
      (capabilityId: string) => !observedToolSet.has(capabilityId),
    ) ?? [];
    if (nativeTurnStatus !== "completed") {
      failReason = nativeErrorCode
        ? `native_${nativeErrorCode}`
        : `native_turn_${nativeTurnStatus ?? "unknown"}`;
    } else if (forbiddenItems.length > 0) {
      failReason = "forbidden_native_tool_activity";
    } else if (input.capabilities.length > 0 && !routeAdmission?.ok) {
      failReason = "native_route_proposal_missing";
    } else if (routeAdmission?.ok && routeAdmission.admittedCapabilityIds.length === 0) {
      failReason = "native_route_capability_missing";
    } else if (routeUnobservedTools.length > 0) {
      failReason = "native_route_observation_missing";
    } else if (!answer.trim()) {
      failReason = "native_terminal_candidate_missing";
    }
  } catch (error) {
    failReason =
      error instanceof CodexAppServerProtocolError
        ? error.code
        : "native_app_server_error";
  } finally {
    clearTimeout(timeout);
    input.signal?.removeEventListener("abort", abort);
    client.close();
  }

  const eligibilityEvent = lifecycle.append({
    kind: "terminal.eligibility.checked",
    producer: "helix_policy",
    status: failReason === null ? "succeeded" : "blocked",
    causation_id:
      lifecycle.latest("runtime.turn.completed")?.event_id ??
      lifecycle.latest("runtime.turn.failed")?.event_id ??
      lifecycle.latest()?.event_id ??
      turnStartedEvent.event_id,
    route_commit_id: activeRouteCommitId ?? undefined,
    terminal_kind: "agent_provider_terminal_candidate",
    terminal_eligible: failReason === null,
    reason_code: failReason ?? undefined,
  });
  lifecycle.append({
    kind: failReason === null ? "turn.completed" : "turn.failed",
    producer: "helix_adapter",
    status: failReason === null ? "succeeded" : "failed",
    causation_id: eligibilityEvent.event_id,
    route_commit_id: activeRouteCommitId ?? undefined,
    terminal_kind: failReason === null ? "agent_provider_terminal_candidate" : "typed_failure",
    terminal_eligible: failReason === null,
    reason_code: failReason ?? undefined,
  });

  const debug: CodexNativeAppServerDebug = {
    schema: "helix.codex_native_app_server_debug.v1",
    transport: "app_server_stdio_jsonl",
    ephemeral_thread: true,
    isolated_runtime_workspace: true,
    sandbox_policy: "read_only",
    network_access: false,
    approval_policy: "never",
    built_in_tools_disabled: true,
    disabled_native_features: [...CODEX_NATIVE_DISABLED_FEATURES],
    model_visible_tools: modelVisibleTools,
    route_proposal: routeAdmission?.proposal ?? null,
    route_admission_reason: routeAdmission?.reason ?? null,
    route_admitted_tools: routeAdmission?.admittedCapabilityIds ?? [],
    requested_tools: requestedTools,
    executed_tools: executedTools,
    successful_tools: successfulTools,
    failed_tools: failedTools,
    route_unobserved_tools:
      routeAdmission?.admittedCapabilityIds.filter(
        (capabilityId: string) => !new Set(executedTools).has(capabilityId),
      ) ?? [],
    observation_reentry_refs: observationRefs,
    native_item_types: uniqueStrings(nativeItemTypes),
    forbidden_native_item_types: uniqueStrings(forbiddenItems),
    effective_model: input.model ?? null,
    effective_reasoning_effort: input.reasoningEffort ?? null,
    native_thread_id: nativeThreadId,
    native_turn_id: nativeTurnId,
    native_final_item_id: nativeFinalItemId,
    native_turn_status: nativeTurnStatus,
    native_error_code: nativeErrorCode,
    native_error_http_status: nativeErrorHttpStatus,
    terminal_candidate_present: Boolean(answer.trim()),
    turn_lifecycle: lifecycle.snapshot(),
  };
  return {
    ok: failReason === null,
    answer: failReason === null ? answer.trim() : "",
    failReason,
    stderr: transport.stderr,
    debug,
  };
};

export const runCodexNativeAppServerTurn = async (
  input: RunCodexNativeAppServerTurnInput,
): Promise<CodexNativeAppServerTurnResult> => {
  const codexHome = fs.mkdtempSync(path.join(os.tmpdir(), "helix-codex-native-"));
  const nativeCwd = path.join(codexHome, "workspace");
  fs.mkdirSync(nativeCwd, { recursive: true });
  let transport: CodexAppServerTransport | null = null;
  try {
    transport = createCodexAppServerProcessTransport({
      cwd: nativeCwd,
      codexHome,
    });
    return await runCodexNativeAppServerTurnWithTransport(
      { ...input, cwd: nativeCwd },
      transport,
    );
  } catch (error) {
    const failReason =
      error instanceof CodexAppServerProtocolError
        ? error.code
        : "native_app_server_launch_failed";
    const lifecycle = createHelixTurnLifecycleRecorder({
      turnId: input.turnId,
      scope: "codex_native_provider_cycle",
    });
    const started = lifecycle.append({
      kind: "turn.started",
      producer: "helix_adapter",
      status: "started",
    });
    const runtimeFailure = lifecycle.append({
      kind: "runtime.turn.failed",
      producer: "helix_adapter",
      status: "failed",
      causation_id: started.event_id,
      reason_code: failReason,
    });
    const eligibility = lifecycle.append({
      kind: "terminal.eligibility.checked",
      producer: "helix_policy",
      status: "blocked",
      causation_id: runtimeFailure.event_id,
      terminal_kind: "typed_failure",
      terminal_eligible: false,
      reason_code: failReason,
    });
    lifecycle.append({
      kind: "turn.failed",
      producer: "helix_adapter",
      status: "failed",
      causation_id: eligibility.event_id,
      terminal_kind: "typed_failure",
      terminal_eligible: false,
      reason_code: failReason,
    });
    return {
      ok: false,
      answer: "",
      failReason,
      stderr: transport?.stderr ?? (error instanceof Error ? error.message : String(error)),
      debug: {
        schema: "helix.codex_native_app_server_debug.v1",
        transport: "app_server_stdio_jsonl",
        ephemeral_thread: true,
        isolated_runtime_workspace: true,
        sandbox_policy: "read_only",
        network_access: false,
        approval_policy: "never",
        built_in_tools_disabled: true,
        disabled_native_features: [...CODEX_NATIVE_DISABLED_FEATURES],
        model_visible_tools: input.capabilities.map(
          (capability: HelixWorkstationCapabilityManifest) => capability.capability_id,
        ),
        route_proposal: null,
        route_admission_reason: null,
        route_admitted_tools: [],
        requested_tools: [],
        executed_tools: [],
        successful_tools: [],
        failed_tools: [],
        route_unobserved_tools: [],
        observation_reentry_refs: [],
        native_item_types: [],
        forbidden_native_item_types: [],
        effective_model: input.model ?? null,
        effective_reasoning_effort: input.reasoningEffort ?? null,
        native_thread_id: null,
        native_turn_id: null,
        native_final_item_id: null,
        native_turn_status: null,
        native_error_code: null,
        native_error_http_status: null,
        terminal_candidate_present: false,
        turn_lifecycle: lifecycle.snapshot(),
      },
    };
  } finally {
    transport?.close();
    try {
      fs.rmSync(codexHome, { recursive: true, force: true });
    } catch {
      // The app-server process can briefly retain Windows handles after exit.
    }
  }
};
