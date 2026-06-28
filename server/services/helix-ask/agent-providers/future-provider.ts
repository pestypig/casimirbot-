import crypto from "node:crypto";
import type { HelixAgentProvider, HelixAgentRunResult } from "./types";
import { listWorkstationGatewayCapabilities } from "../workstation-tool-gateway/registry";
import type { HelixWorkstationCapabilityManifest } from "../workstation-tool-gateway/types";
import { buildHelixAgentRuntimeSelectionTrace } from "./runtime-debug";
import {
  readHelixAgentTurnId,
  runExplicitWorkstationGatewayCalls,
} from "./explicit-workstation-gateway";
import { buildHelixProviderGatewayObservationPayload } from "./workstation-gateway-observation";

const enabled = (): boolean => process.env.ENABLE_FUTURE_AGENT === "1";

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readQuestion = (body: Record<string, unknown>): string =>
  readString(body.question) ?? readString(body.prompt) ?? readString(body.raw_user_prompt) ?? "";

const readTurnId = (body: Record<string, unknown>): string =>
  readString(body.turn_id) ?? readString(body.turnId) ?? `ask:future:${crypto.randomUUID()}`;

export const runExplicitFutureWorkstationGatewayCalls = async (input: {
  body: Record<string, unknown>;
  turnId?: string | null;
}) =>
  runExplicitWorkstationGatewayCalls({
    body: input.body,
    agentRuntime: "future",
    turnId: input.turnId ?? readHelixAgentTurnId(input.body),
  });

export const futureProvider: HelixAgentProvider = {
  id: "future",
  label: "Future Agent Wrapper",
  permissionProfile: {
    id: "read-observe",
    label: "Read/observe only",
    allows: {
      observe: true,
      read: true,
      act: false,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled,
  supports: {
    streaming: false,
    workstationTools: true,
    codeMutation: false,
  },

  async runTurn(request): Promise<HelixAgentRunResult> {
    const question = readQuestion(request.body);
    const turnId = readTurnId(request.body);
    const gatewayManifest = listWorkstationGatewayCapabilities({
      agentRuntime: "future",
      mode: "observe",
    });
    const runtimeSelectionTrace = buildHelixAgentRuntimeSelectionTrace({
      route: request.route,
      requestedRuntime: request.runtime,
      provider: futureProvider,
      gatewayManifest,
    });
    const gatewayCallResults = await runExplicitFutureWorkstationGatewayCalls({
      body: request.body,
      turnId,
    });

    if (gatewayCallResults.length > 0) {
      return buildHelixProviderGatewayObservationPayload({
        provider: futureProvider,
        turnId,
        runtimeSelectionTrace,
        gatewayManifest,
        gatewayCallResults,
      });
    }

    const text = question
      ? "Future Agent Wrapper is selected, but no concrete future provider adapter has been attached yet."
      : "Future Agent Wrapper could not run because the Ask turn had no question.";

    return {
      ok: false,
      runtime: "future",
      response_type: "final_failure",
      final_status: "final_failure",
      text,
      answer: text,
      debug: {
        turn_id: turnId,
        agent_runtime: "future",
        fail_reason: question ? "future_provider_adapter_not_configured" : "missing_question",
        agent_runtime_selection_trace: runtimeSelectionTrace,
        selected_agent_provider: runtimeSelectionTrace.selected_agent_provider,
        workstation_gateway_manifest: gatewayManifest,
        workstation_gateway_manifest_version: gatewayManifest.manifest_version,
        workstation_gateway_capability_ids: gatewayManifest.capabilities.map(
          (capability: HelixWorkstationCapabilityManifest) => capability.capability_id,
        ),
        workstation_gateway_call_results: [],
        workstation_gateway_observation_packets: [],
        workstation_gateway_reentry_status: "pending_provider_reasoning",
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_answer_authority: null,
        final_answer_source: null,
        terminal_artifact_kind: null,
      },
    };
  },
};
