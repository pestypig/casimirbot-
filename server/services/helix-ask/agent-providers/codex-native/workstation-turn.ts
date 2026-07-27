import crypto from "node:crypto";
import type { HelixTurnLifecycle } from "@shared/helix-turn-lifecycle";
import type { HelixRuntimeSemanticRouteProposal } from "../../runtime/runtime-intent-packet";
import { normalizeHelixRuntimeSemanticRouteProposal } from "../../runtime/runtime-intent-packet";
import {
  callAccountAuthorizedWorkstationGatewayCapability,
  listAccountAuthorizedWorkstationGatewayCapabilities,
  type HelixWorkstationGatewayAccountContext,
} from "../../workstation-tool-gateway/account-policy";
import type { HelixWorkstationGatewayCallResult } from "../../workstation-tool-gateway/types";
import { HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY } from "@shared/helix-scholarly-research-observation";
import { enrichScholarlyNumericArgumentsFromGatewayResults } from "../scholarly-gateway-evidence";
import {
  buildSharedLiveRoomGatewayMutationApprovalPlanV1,
} from "../../workstation-tool-gateway/shared-live-room";
import {
  runCodexNativeAppServerTurn,
  type CodexNativeAppServerTurnResult,
  type RunCodexNativeAppServerTurnInput,
} from "./app-server-turn";
import {
  HELIX_CODEX_NATIVE_RUNTIME_APPROVAL_OUTCOME_SCHEMA,
  HELIX_CODEX_NATIVE_RUNTIME_APPROVAL_REQUEST_SCHEMA,
  findModelSuppliedRuntimeApprovalControlField,
  isCodexNativeRuntimeApprovalCapability,
  isCodexNativeRuntimeApprovalStartCapability,
  isCodexNativeSharedLiveRoomMutationApprovalCapability,
  readCodexNativeTrustedRuntimeStartPlans,
  resolveCodexNativeTrustedRuntimeStartPlan,
  type CodexNativeRuntimeApprovalContextV1,
  type CodexNativeRuntimeApprovalHostOutcomeV1,
} from "./runtime-approval-host";

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
    runtime_approval_host_available: boolean;
    runtime_approval_affirmative_execution_intent: boolean;
    runtime_approval_replay_protection:
      "durable_atomic" | "process_local" | "unavailable" | null;
    runtime_approval_start_tools: string[];
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
    turn_lifecycle: HelixTurnLifecycle | null;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const isGatewayCallResult = (
  value: unknown,
): value is HelixWorkstationGatewayCallResult =>
  readString(readRecord(value).schema) ===
  "helix.workstation_tool_gateway.call_result.v1";

const intersectGoalTools = (
  capabilityIds: string[],
  allowedTools?: string[] | null,
): string[] => {
  if (allowedTools == null || allowedTools.includes("*")) return capabilityIds;
  const allowed = new Set(
    allowedTools.map((entry) => entry.trim()).filter(Boolean),
  );
  return capabilityIds.filter((capabilityId) => allowed.has(capabilityId));
};

const buildRuntimeApprovalOutcome = (input: {
  capabilityId: string;
  planId: string | null;
  status: "declined" | "needs_input" | "failed";
  issue: string;
  reason?: string | null;
}) => ({
  schema: HELIX_CODEX_NATIVE_RUNTIME_APPROVAL_OUTCOME_SCHEMA,
  ok: false,
  status: input.status,
  capability_id: input.capabilityId,
  plan_id: input.planId,
  issues: [input.issue],
  ...(readString(input.reason) ? { reason: readString(input.reason) } : {}),
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

const normalizeRuntimeApprovalHostOutcome = (
  value: CodexNativeRuntimeApprovalHostOutcomeV1,
): CodexNativeRuntimeApprovalHostOutcomeV1 | null => {
  const record = readRecord(value);
  const status = readString(record?.status);
  if (status === "approved" && isRecord(record.receipt)) {
    return value;
  }
  if (status === "declined" || status === "needs_input") {
    return {
      status,
      ...(readString(record?.reason)
        ? { reason: readString(record?.reason) as string }
        : {}),
    };
  }
  if (status === "failed" && readString(record?.code)) {
    return {
      status,
      code: readString(record?.code) as string,
      ...(readString(record?.message)
        ? { message: readString(record?.message) as string }
        : {}),
    };
  }
  return null;
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
  authoritativeEvidenceArtifacts?: unknown[];
  trustedCurrentTurnGatewayCallResults?: readonly HelixWorkstationGatewayCallResult[];
  runtimeApproval?: CodexNativeRuntimeApprovalContextV1;
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
  const exactGoalTools = new Set(
    (input.allowedWorkstationTools ?? [])
      .map((capabilityId) => capabilityId.trim())
      .filter(Boolean),
  );
  const trustedCurrentTurnGatewayCallResults =
    input.trustedCurrentTurnGatewayCallResults ?? [];
  const runtimeApprovalHostReady =
    input.runtimeApproval?.affirmativeExecutionIntent === true &&
    input.runtimeApproval.replayProtection === "durable_atomic" &&
    input.accountContext.account_policy.account_type === "developer" &&
    input.accountContext.trusted_account_session === true &&
    Boolean(readString(input.accountContext.profile_id)) &&
    Boolean(readString(input.accountContext.session_id)) &&
    requestedMode === "act" &&
    listing.policy_gate.effective_mode === "act";
  const runtimeApprovalStartCapabilities = runtimeApprovalHostReady
    ? listing.capabilities.filter(
        (capability) =>
          isCodexNativeRuntimeApprovalCapability(
            capability.capability_id,
          ) &&
          exactGoalTools.has(capability.capability_id) &&
          capability.code_mutation === false &&
          capability.shell_access === false &&
          capability.requires_confirmation === true &&
          capability.permission_profile_required === "act" &&
          (isCodexNativeSharedLiveRoomMutationApprovalCapability(
            capability.capability_id,
          )
            ? capability.mutating === true
            : capability.mutating === false &&
              readCodexNativeTrustedRuntimeStartPlans({
                capabilityId: capability.capability_id,
                turnId: input.turnId,
                gatewayCallResults: trustedCurrentTurnGatewayCallResults,
              }).length > 0),
      )
    : [];
  const modelEligibleCapabilityIds = new Set([
    ...nonMutatingCapabilities.map((capability) => capability.capability_id),
    ...runtimeApprovalStartCapabilities.map(
      (capability) => capability.capability_id,
    ),
  ]);
  const modelEligibleCapabilities = listing.capabilities.filter((capability) =>
    modelEligibleCapabilityIds.has(capability.capability_id),
  );
  const goalVisibleIds = intersectGoalTools(
    modelEligibleCapabilities.map((capability) => capability.capability_id),
    input.allowedWorkstationTools,
  );
  const goalVisibleSet = new Set(goalVisibleIds);
  const capabilities = modelEligibleCapabilities.filter((capability) =>
    goalVisibleSet.has(capability.capability_id),
  );
  let validatedRouteCapabilityIds = new Set<string>();
  const gatewayCallResults: HelixWorkstationGatewayCallResult[] = [];
  const requireTrustedAccountBinding =
    input.requireTrustedAccountBinding === true;
  const accountBindingBlocked =
    requireTrustedAccountBinding &&
    !input.accountContext.trusted_account_session;
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
    runtime_approval_host_available: Boolean(input.runtimeApproval?.host),
    runtime_approval_affirmative_execution_intent:
      input.runtimeApproval?.affirmativeExecutionIntent === true,
    runtime_approval_replay_protection:
      input.runtimeApproval?.replayProtection ?? null,
    runtime_approval_start_tools: runtimeApprovalStartCapabilities.map(
      (capability) => capability.capability_id,
    ),
    account_locked_tools: listing.locked_capabilities.map(
      (capability) => capability.capability_id,
    ),
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
    turn_lifecycle: null,
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
            crypto
              .createHash("sha256")
              .update(JSON.stringify(payload))
              .digest("hex")
              .slice(0, 20),
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
      const proposedCapabilityIds = Array.from(
        new Set(
          [
            proposal.proposed_capability_id,
            ...proposal.proposed_capability_ids,
          ].filter((capabilityId: string | null): capabilityId is string =>
            Boolean(capabilityId),
          ),
        ),
      );
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
      let governedArguments =
        capabilityId === HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY
          ? enrichScholarlyNumericArgumentsFromGatewayResults(
              gatewayCallResults,
              args,
            )
          : args;
      let approvalReceipt: unknown;
      if (isCodexNativeRuntimeApprovalCapability(capabilityId)) {
        const suppliedControlField =
          findModelSuppliedRuntimeApprovalControlField(args);
        if (suppliedControlField) {
          return {
            ok: false,
            content: buildRuntimeApprovalOutcome({
              capabilityId,
              planId: readString(args.plan_id ?? args.planId),
              status: "failed",
              issue: "model_supplied_runtime_approval_control_rejected",
              reason: `Rejected model-supplied runtime control field: ${suppliedControlField}.`,
            }),
            observationRef: `${input.turnId}:${capabilityId}:${iteration}:runtime_approval_blocked`,
          };
        }
        let trustedPlan:
          | {
              capabilityId: string;
              planId: string;
              preparedRequestId: string | null;
              sealedInputSha256: string;
              gatewayArguments: Record<string, unknown>;
            }
          | null = null;
        if (
          isCodexNativeSharedLiveRoomMutationApprovalCapability(capabilityId)
        ) {
          try {
            const mutationPlan =
              await buildSharedLiveRoomGatewayMutationApprovalPlanV1({
                capabilityId,
                args,
              });
            trustedPlan = {
              capabilityId,
              planId: mutationPlan.planId,
              preparedRequestId: null,
              sealedInputSha256: mutationPlan.sealedInputSha256,
              gatewayArguments: mutationPlan.canonicalArguments,
            };
          } catch {
            return {
              ok: false,
              content: buildRuntimeApprovalOutcome({
                capabilityId,
                planId: null,
                status: "failed",
                issue: "runtime_approval_mutation_arguments_invalid",
              }),
              observationRef: `${input.turnId}:${capabilityId}:${iteration}:runtime_approval_blocked`,
            };
          }
        } else if (
          isCodexNativeRuntimeApprovalStartCapability(capabilityId)
        ) {
          trustedPlan = resolveCodexNativeTrustedRuntimeStartPlan({
            capabilityId,
            arguments: args,
            turnId: input.turnId,
            gatewayCallResults: [
              ...trustedCurrentTurnGatewayCallResults,
              ...gatewayCallResults,
            ],
          });
        }
        if (!trustedPlan) {
          return {
            ok: false,
            content: buildRuntimeApprovalOutcome({
              capabilityId,
              planId: readString(args.plan_id ?? args.planId),
              status: "failed",
              issue: "trusted_current_turn_plan_observation_required",
            }),
            observationRef: `${input.turnId}:${capabilityId}:${iteration}:runtime_approval_blocked`,
          };
        }
        const profileId = readString(input.accountContext.profile_id);
        const sessionId = readString(input.accountContext.session_id);
        if (
          !runtimeApprovalHostReady ||
          !input.runtimeApproval ||
          !profileId ||
          !sessionId
        ) {
          return {
            ok: false,
            content: buildRuntimeApprovalOutcome({
              capabilityId,
              planId: trustedPlan.planId,
              status: "failed",
              issue: "runtime_approval_durable_replay_protection_required",
            }),
            observationRef: `${input.turnId}:${capabilityId}:${iteration}:runtime_approval_blocked`,
          };
        }
        const binding = {
          capabilityId,
          planId: trustedPlan.planId,
          accountType: input.accountContext.account_policy.account_type,
          profileId,
          sessionId,
          turnId: input.turnId,
          sealedInputSha256: trustedPlan.sealedInputSha256,
        } as const;
        let hostOutcome: CodexNativeRuntimeApprovalHostOutcomeV1 | null = null;
        try {
          hostOutcome = normalizeRuntimeApprovalHostOutcome(
            await input.runtimeApproval.host({
              schema: HELIX_CODEX_NATIVE_RUNTIME_APPROVAL_REQUEST_SCHEMA,
              requiredReplayProtection: "durable_atomic",
              binding,
              summary: {
                capabilityId,
                planId: trustedPlan.planId,
                preparedRequestId: trustedPlan.preparedRequestId,
                sealedInputSha256: trustedPlan.sealedInputSha256,
              },
            }),
          );
        } catch {
          hostOutcome = {
            status: "failed",
            code: "runtime_approval_host_failed",
          };
        }
        if (!hostOutcome || hostOutcome.status !== "approved") {
          const status = hostOutcome?.status ?? "failed";
          const issue =
            status === "declined"
              ? "runtime_approval_declined"
              : status === "needs_input"
                ? "runtime_approval_needs_input"
                : hostOutcome?.status === "failed"
                  ? hostOutcome.code
                  : "runtime_approval_host_outcome_invalid";
          const reason =
            hostOutcome?.status === "declined" ||
            hostOutcome?.status === "needs_input"
              ? hostOutcome.reason
              : hostOutcome?.status === "failed"
                ? hostOutcome.message
                : null;
          return {
            ok: false,
            content: buildRuntimeApprovalOutcome({
              capabilityId,
              planId: trustedPlan.planId,
              status,
              issue,
              reason,
            }),
            observationRef: `${input.turnId}:${capabilityId}:${iteration}:runtime_approval_${status}`,
          };
        }
        governedArguments = trustedPlan.gatewayArguments;
        approvalReceipt = hostOutcome.receipt;
      }
      const governed = await callAccountAuthorizedWorkstationGatewayCapability({
        accountContext: input.accountContext,
        requestedMode,
        requestedRuntime: "codex",
        capabilityId,
        arguments: governedArguments,
        approvalReceipt,
        turnId: input.turnId,
        iteration,
        authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
      });
      if (isGatewayCallResult(governed.body))
        gatewayCallResults.push(governed.body);
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
      turn_lifecycle: native.debug.turn_lifecycle,
      compatibility_fallback_required: !native.ok,
      compatibility_fallback_reason: native.failReason,
    },
  };
};
