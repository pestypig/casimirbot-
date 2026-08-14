import fs from "node:fs";
import { deduplicateCodexModelInputSchema } from "../server/services/helix-ask/agent-providers/model-schema-projection";
import {
  buildCodexContinuationCapabilityInputContractLines,
  buildCodexModelCapabilityPromptProjection,
} from "../server/services/helix-ask/agent-providers/codex-provider";
import { formatHelixAgentContinuationStateForRuntime } from "../server/services/helix-ask/runtime/agent-continuation-state";

const artifact = JSON.parse(
  fs.readFileSync(
    "artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-35b-unavailable-inventory/guardian_unavailable_inventory_replan/ask-response.json",
    "utf8",
  ),
);
const capability = artifact.debug.workstation_gateway_manifest.capabilities.find(
  (entry: { capability_id?: string }) =>
    entry.capability_id === "com.casimirbot.minecraft.player.guardian.execute",
);
const question = String(
  artifact.question ??
    artifact.request?.question ??
    artifact.debug?.question ??
    "Prepare a bounded water-bucket rescue from safe ground. Confirm the player has a usable water bucket before movement. If unavailable, revise or cancel safely.",
);
const before = JSON.stringify(capability.input_schema);
const projected = deduplicateCodexModelInputSchema(capability.input_schema);
const after = JSON.stringify(projected);
const continuation = buildCodexContinuationCapabilityInputContractLines({
  continuationState: {
    missing_requirement_ids: ["minecraft.player_embodiment.action"],
    next_admissible_affordances: [],
    capability_proposal: {
      allowed: true,
      admitted_capability_ids: [capability.capability_id],
      authority: "helix_policy_admits_runtime_proposal",
    },
    allowed_decisions: ["act"],
    last_attempt: null,
  } as any,
  availableCapabilities: [capability],
  admittedCapabilityIds: [capability.capability_id],
}).join("\n");

const continuationState = artifact.agent_continuation_state ??
  artifact.debug?.agent_continuation_state ??
  artifact.debug?.provider_continuation_state ??
  null;
const manifest = artifact.debug.workstation_gateway_manifest;
const minecraftCapabilities = manifest.capabilities.filter(
  (entry: { capability_id?: string }) =>
    String(entry.capability_id ?? "").startsWith("com.casimirbot.minecraft."),
);
const minecraftManifest = {
  ...manifest,
  capabilities: minecraftCapabilities,
  ...(manifest.unavailable_capabilities
    ? { unavailable_capabilities: [] }
    : {}),
};
const projection = buildCodexModelCapabilityPromptProjection({
  question,
  gatewayManifest: minecraftManifest,
  alwaysDetailedCapabilityIds: [
    "com.casimirbot.minecraft.actor.inspect",
    "com.casimirbot.minecraft.inventory.check",
    "com.casimirbot.minecraft.spatial.inspect",
  ],
  maxSemanticallyRankedCapabilities: 2,
  preferMutatingCapabilities: true,
});

const jsonSize = (value: unknown): number => JSON.stringify(value ?? null).length;
const topDebugFields = Object.entries(artifact.debug ?? {})
  .map(([field, value]) => ({ field, chars: jsonSize(value) }))
  .sort((left, right) => right.chars - left.chars)
  .slice(0, 20);
const topResponseFields = Object.entries(artifact)
  .map(([field, value]) => ({ field, chars: jsonSize(value) }))
  .sort((left, right) => right.chars - left.chars)
  .slice(0, 15);
const adapterContract = artifact.agent_runtime_adapter_contract ??
  artifact.debug?.agent_runtime_adapter_contract ??
  {};
const topAdapterContractFields = Object.entries(adapterContract)
  .map(([field, value]) => ({ field, chars: jsonSize(value) }))
  .sort((left, right) => right.chars - left.chars)
  .slice(0, 20);
const policyLines = Array.isArray(adapterContract.prompt_policy_lines)
  ? adapterContract.prompt_policy_lines
  : [];
const sourceTargetIntent = artifact.source_target_intent ??
  artifact.route_metadata?.source_target_intent ??
  artifact.debug?.source_target_intent ??
  artifact.debug?.ask_turn_solver_trace?.source_target_intent ??
  null;
const promptInterpretation = artifact.prompt_interpretation ??
  artifact.debug?.ask_turn_solver_trace?.prompt_interpretation ??
  null;
process.stdout.write(
  `${JSON.stringify({
    before_chars: before.length,
    after_chars: after.length,
    reduction_pct: Math.round((1 - after.length / before.length) * 1_000) / 10,
    defs: Object.keys(projected.$defs as Record<string, unknown>).length,
    continuation_contract_chars: continuation.length,
    question_chars: question.length,
    continuation_state_chars: jsonSize(continuationState),
    continuation_runtime_chars: continuationState
      ? formatHelixAgentContinuationStateForRuntime(continuationState).length
      : 0,
    minecraft_capability_count: minecraftCapabilities.length,
    minecraft_manifest_chars: jsonSize(minecraftManifest),
    projection_index_chars: jsonSize(projection.capabilityIndex),
    projection_detail_chars: jsonSize(projection.detailedGatewayManifest),
    projection_protocol_chars: jsonSize(projection.requestProtocol),
    projection_detailed_ids: projection.detailedCapabilityIds,
    adapter_policy_line_count: policyLines.length,
    adapter_policy_lines_chars: policyLines.join("\n").length,
    adapter_policy_largest_lines: policyLines
      .map((line: unknown, index: number) => ({
        index,
        chars: String(line ?? "").length,
        prefix: String(line ?? "").slice(0, 100),
      }))
      .sort((left: { chars: number }, right: { chars: number }) =>
        right.chars - left.chars
      )
      .slice(0, 10),
    top_adapter_contract_fields: topAdapterContractFields,
    source_target_intent: sourceTargetIntent,
    prompt_interpretation: promptInterpretation,
    top_response_fields: topResponseFields,
    top_debug_fields: topDebugFields,
  })}\n`,
);
