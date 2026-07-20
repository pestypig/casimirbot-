import crypto from "node:crypto";
import type { HelixRuntimeSemanticRouteProposal } from "../../runtime/runtime-intent-packet";
import { normalizeHelixRuntimeSemanticRouteProposal } from "../../runtime/runtime-intent-packet";
import {
  callAccountAuthorizedWorkstationGatewayCapability,
  listAccountAuthorizedWorkstationGatewayCapabilities,
  type HelixWorkstationGatewayAccountContext,
} from "../../workstation-tool-gateway/account-policy";
import type { HelixWorkstationGatewayCallResult } from "../../workstation-tool-gateway/types";
import {
  runCodexNativeAppServerTurn,
  type CodexNativeAppServerTurnResult,
  type RunCodexNativeAppServerTurnInput,
} from "./app-server-turn";

type NativeTurnRunner = (
  input: RunCodexNativeAppServerTurnInput,
) => Promise<CodexNativeAppServerTurnResult>;

export type CodexNativeWorkstationTurnResult = {
  ok: boolean;
  answer: string;
  failReason: string | null;
  native: CodexNativeAppServerTurnResult | null;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  debug: {
    schema: "helix.codex_native_workstation_turn_debug.v1";
    account_type: "developer" | "user";
    profile_bound: boolean;
    raw_profile_id_included: false;
    trusted_account_session: boolean;
    trusted_account_binding_required: boolean;
    account_binding_status: "trusted" | "anonymous_public" | "blocked";
    requested_mode: string;
    effective_mode: string;
    requested_runtime: "codex";
    native_transport: "app_server_stdio_jsonl";
    ephemeral_thread: true;
    isolated_runtime_workspace: true;
    sandbox_policy: "read_only";
    network_access: false;
    approval_policy: "never";
    built_in_tools_disabled: true;
    disabled_native_features: string[];
    model_visible_tools: string[];
    account_locked_tools: string[];
    goal_allowed_tools: string[] | null;
    route_prompt_hash: string;
    route_proposal: HelixRuntimeSemanticRouteProposal | null;
    route_admission_reason: string | null;
    route_admitted_tools: string[];
    requested_tools: string[];
    executed_tools: string[];
    successful_tools: string[];
    failed_tools: string[];
    route_unobserved_tools: string[];
    observation_reentry_refs: string[];
    effective_model: string | null;
    effective_reasoning_effort: string | null;
    native_item_types: string[];
    forbidden_native_item_types: string[];
    native_thread_id: string | null;
    native_turn_id: string | null;
    native_final_item_id: string | null;
    native_turn_status: string | null;
    terminal_candidate_present: boolean;
    compatibility_fallback_required: boolean;
    compatibility_fallback_reason: string | null;
    terminal_eligible: false;
    assistant_answer: false;
    raw_content_included: false;
  };
};

const hashPrompt = (turnId: string, prompt: string): string =>
  `prompt:${crypto.createHash("sha256").update(`${turnId}\n${prompt}`).digest("hex").slice(0, 24)}`;

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const isGatewayCallResult = (value: unknown): value is HelixWorkstationGatewayCallResult =>
  readString(readRecord(value).schema) === "helix.workstation_tool_gateway.call_result.v1";

const intersectGoalTools = (capabilityIds: string[], allowedTools?: string[] | null): string[] => {
  if (allowedTools == null || allowedTools.includes("*")) return capabilityIds;
  const allowed = new Set(allowedTools.map((entry) => entry.trim()).filter(Boolean));
  return capabilityIds.filter((capabilityId) => allowed.has(capabilityId));
};

export const runCodexNativeWorkstationTurn = async (input: {
  prompt: string;
  turnId: string;
  cwd: string;
  accountContext: HelixWorkstationGatewayAccountContext;
  requestedMode?: string | null;
  model?: string | null;
  reasoningEffort?: string | null;
  allowedWorkstationTools?: string[] | null;
  requireTrustedAccountBinding?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  onNativeEvent?: (method: string, params: unknown) => void;
  nativeTurnRunner?: NativeTurnRunner;
}): Promise<CodexNativeWorkstationTurnResult> => {
  const requestedMode = readString(input.requestedMode) ?? "act";
  const promptHash = hashPrompt(input.turnId, input.prompt);
  const listing = listAccountAuthorizedWorkstationGatewayCapabilities({
    accountContext: input.accountContext,
    requestedMode,
    requestedRuntime: "codex",
  });
  const nonMutatingCapabilities = listing.capabilities.filter(
    (capability) =>
      capability.mutating === false &&
      capability.code_mutation === false &&
      capability.shell_access === false &&
      (capability.permission_profile_required === "observe" ||
        capability.permission_profile_required === "read"),
  );
  const goalVisibleIds = intersectGoalTools(
    nonMutatingCapabilities.map((capability) => capability.capability_id),
    input.allowedWorkstationTools,
  );
  const goalVisibleSet = new Set(goalVisibleIds);
  const capabilities = nonMutatingCapabilities.filter((capability) =>
    goalVisibleSet.has(capability.capability_id),
  );
  let validatedRouteCapabilityIds = new Set<string>();
  const gatewayCallResults: HelixWorkstationGatewayCallResult[] = [];
  const requireTrustedAccountBinding = input.requireTrustedAccountBinding === true;
  const accountBindingBlocked =
    requireTrustedAccountBinding && !input.accountContext.trusted_account_session;
  const admittedCapabilitySetEmpty =
    input.allowedWorkstationTools != null && capabilities.length === 0;

  const baseDebug: CodexNativeWorkstationTurnResult["debug"] = {
    schema: "helix.codex_native_workstation_turn_debug.v1",
    account_type: input.accountContext.account_policy.account_type,
    profile_bound: Boolean(input.accountContext.profile_id),
    raw_profile_id_included: false,
    trusted_account_session: input.accountContext.trusted_account_session,
    trusted_account_binding_required: requireTrustedAccountBinding,
    account_binding_status: accountBindingBlocked
      ? "blocked"
      : input.accountContext.trusted_account_session
        ? "trusted"
        : "anonymous_public",
    requested_mode: requestedMode,
    effective_mode: listing.policy_gate.effective_mode,
    requested_runtime: "codex",
    native_transport: "app_server_stdio_jsonl",
    ephemeral_thread: true,
    isolated_runtime_workspace: true,
    sandbox_policy: "read_only",
    network_access: false,
    approval_policy: "never",
    built_in_tools_disabled: true,
    disabled_native_features: [],
    model_visible_tools: goalVisibleIds,
    account_locked_tools: listing.locked_capabilities.map((capability) => capability.capability_id),
    goal_allowed_tools: input.allowedWorkstationTools ?? null,
    route_prompt_hash: promptHash,
    route_proposal: null,
    route_admission_reason: null,
    route_admitted_tools: [],
    requested_tools: [],
    executed_tools: [],
    successful_tools: [],
    failed_tools: [],
    route_unobserved_tools: [],
    observation_reentry_refs: [],
    effective_model: input.model ?? null,
    effective_reasoning_effort: input.reasoningEffort ?? null,
    native_item_types: [],
    forbidden_native_item_types: [],
    native_thread_id: null,
    native_turn_id: null,
    native_final_item_id: null,
    native_turn_status: null,
    terminal_candidate_present: false,
    compatibility_fallback_required:
      accountBindingBlocked || admittedCapabilitySetEmpty,
    compatibility_fallback_reason: accountBindingBlocked
      ? "trusted_account_binding_required"
      : admittedCapabilitySetEmpty
        ? "native_admitted_capability_set_empty"
        : null,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };

  if (accountBindingBlocked) {
    return {
      ok: false,
      answer: "",
      failReason: "trusted_account_binding_required",
      native: null,
      gatewayCallResults,
      debug: baseDebug,
    };
  }

  if (admittedCapabilitySetEmpty) {
    return {
      ok: false,
      answer: "",
      failReason: "native_admitted_capability_set_empty",
      native: null,
      gatewayCallResults,
      debug: baseDebug,
    };
  }

  const promptWithRouteBinding = [
    input.prompt,
    "",
    "Helix native route proposal binding:",
    JSON.stringify({
      schema: "helix.codex_native_route_binding.v1",
      turn_id: input.turnId,
      prompt_hash: promptHash,
      model_visible_capability_ids: goalVisibleIds,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    }),
  ].join("\n");

  const native = await (input.nativeTurnRunner ?? runCodexNativeAppServerTurn)({
    prompt: promptWithRouteBinding,
    turnId: input.turnId,
    cwd: input.cwd,
    model: input.model,
    reasoningEffort: input.reasoningEffort,
    capabilities,
    signal: input.signal,
    timeoutMs: input.timeoutMs,
    onNativeEvent: input.onNativeEvent,
    validateRouteProposal: (value) => {
      const raw = readRecord(value);
      const suppliedPromptHash = readString(raw.prompt_hash);
      const proposal = normalizeHelixRuntimeSemanticRouteProposal({
        value,
        turnId: input.turnId,
        promptHash,
        dependencies: {
          readString,
          hashPayloadShort: (payload) =>
            crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 20),
        },
      });
      if (!proposal) {
        return {
          ok: false,
          proposal: null,
          admittedCapabilityIds: [],
          reason: "runtime_semantic_route_proposal_invalid",
        };
      }
      if (suppliedPromptHash && suppliedPromptHash !== promptHash) {
        return {
          ok: false,
          proposal,
          admittedCapabilityIds: [],
          reason: "runtime_semantic_route_prompt_hash_mismatch",
        };
      }
      const proposedCapabilityIds = Array.from(new Set([
        proposal.proposed_capability_id,
        ...proposal.proposed_capability_ids,
      ].filter((capabilityId: string | null): capabilityId is string => Boolean(capabilityId))));
      const capabilityOutsideVisibleSet = proposedCapabilityIds.find(
        (capabilityId: string) => !goalVisibleSet.has(capabilityId),
      );
      if (capabilityOutsideVisibleSet) {
        return {
          ok: false,
          proposal,
          admittedCapabilityIds: [],
          reason: "runtime_semantic_route_capability_not_model_visible",
        };
      }
      if (
        !proposal.proposed_route &&
        !proposal.proposed_tool_family &&
        !proposal.proposed_capability_id
      ) {
        return {
          ok: false,
          proposal,
          admittedCapabilityIds: [],
          reason: "runtime_semantic_route_empty",
        };
      }
      if (proposedCapabilityIds.length === 0) {
        return {
          ok: false,
          proposal,
          admittedCapabilityIds: [],
          reason: "runtime_semantic_route_capability_missing",
        };
      }
      validatedRouteCapabilityIds = new Set(proposedCapabilityIds);
      return {
        ok: true,
        proposal,
        admittedCapabilityIds: proposedCapabilityIds,
        reason: "runtime_semantic_route_validated_against_helix_admission",
      };
    },
    executeCapability: async ({ capabilityId, arguments: args, iteration }) => {
      if (!goalVisibleSet.has(capabilityId)) {
        return {
          ok: false,
          content: {
            schema: "helix.codex_native_tool_block.v1",
            ok: false,
            capability_id: capabilityId,
            reason: "capability_not_model_visible",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          observationRef: `${input.turnId}:${capabilityId}:${iteration}:blocked`,
        };
      }
      if (!validatedRouteCapabilityIds.has(capabilityId)) {
        return {
          ok: false,
          content: {
            schema: "helix.codex_native_tool_block.v1",
            ok: false,
            capability_id: capabilityId,
            reason: "capability_outside_validated_route",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          observationRef: `${input.turnId}:${capabilityId}:${iteration}:blocked`,
        };
      }
      const governed = await callAccountAuthorizedWorkstationGatewayCapability({
        accountContext: input.accountContext,
        requestedMode,
        requestedRuntime: "codex",
        capabilityId,
        arguments: args,
        turnId: input.turnId,
        iteration,
      });
      if (isGatewayCallResult(governed.body)) gatewayCallResults.push(governed.body);
      const packet = isGatewayCallResult(governed.body)
        ? governed.body.observation_packet
        : null;
      return {
        ok: governed.status_code === 200 && governed.body.ok === true,
        content: governed.body,
        observationRef:
          packet?.produced_artifact_refs[0] ??
          packet?.call_id ??
          `${input.turnId}:${capabilityId}:${iteration}`,
      };
    },
  });

  return {
    ok: native.ok,
    answer: native.answer,
    failReason: native.failReason,
    native,
    gatewayCallResults,
    debug: {
      ...baseDebug,
      disabled_native_features: native.debug.disabled_native_features,
      route_proposal: native.debug.route_proposal,
      route_admission_reason: native.debug.route_admission_reason,
      route_admitted_tools: native.debug.route_admitted_tools,
      requested_tools: native.debug.requested_tools,
      executed_tools: native.debug.executed_tools,
      successful_tools: native.debug.successful_tools,
      failed_tools: native.debug.failed_tools,
      route_unobserved_tools: native.debug.route_unobserved_tools,
      observation_reentry_refs: native.debug.observation_reentry_refs,
      effective_model: native.debug.effective_model,
      effective_reasoning_effort: native.debug.effective_reasoning_effort,
      native_item_types: native.debug.native_item_types,
      forbidden_native_item_types: native.debug.forbidden_native_item_types,
      native_thread_id: native.debug.native_thread_id,
      native_turn_id: native.debug.native_turn_id,
      native_final_item_id: native.debug.native_final_item_id,
      native_turn_status: native.debug.native_turn_status,
      terminal_candidate_present: native.debug.terminal_candidate_present,
      compatibility_fallback_required: !native.ok,
      compatibility_fallback_reason: native.failReason,
    },
  };
};
