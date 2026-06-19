import {
  WORKSTATION_AGENT_GOAL_CONTEXT_FEED_QUERY_ACTUATORS,
  type AgentGoalActuatorV1,
  type AgentGoalContextFeedKindV1,
} from "@shared/contracts/workstation-goal-context.v1";

export type WorkstationContextFeedQueryCapability = `live_env.${AgentGoalActuatorV1}`;

export type WorkstationContextFeedQueryToolContractSpec = {
  feedKind: AgentGoalContextFeedKindV1;
  actuator: AgentGoalActuatorV1;
  capability: WorkstationContextFeedQueryCapability;
  label: string;
  aliases: string[];
  toolFamilyRequiredObservationKinds: string[];
  explicitRequiredObservationKind: string;
  plannerExpectedReceiptKind: string;
};

const capabilityForFeed = (feedKind: AgentGoalContextFeedKindV1): WorkstationContextFeedQueryCapability =>
  `live_env.${WORKSTATION_AGENT_GOAL_CONTEXT_FEED_QUERY_ACTUATORS[feedKind]}` as WorkstationContextFeedQueryCapability;

const querySpec = (
  feedKind: AgentGoalContextFeedKindV1,
  input: {
    aliases: string[];
    label: string;
    toolFamilyRequiredObservationKinds: string[];
    explicitRequiredObservationKind: string;
    plannerExpectedReceiptKind?: string;
  },
): WorkstationContextFeedQueryToolContractSpec => ({
  feedKind,
  actuator: WORKSTATION_AGENT_GOAL_CONTEXT_FEED_QUERY_ACTUATORS[feedKind],
  capability: capabilityForFeed(feedKind),
  label: input.label,
  aliases: [
    WORKSTATION_AGENT_GOAL_CONTEXT_FEED_QUERY_ACTUATORS[feedKind],
    feedKind,
    ...input.aliases,
  ],
  toolFamilyRequiredObservationKinds: [
    ...input.toolFamilyRequiredObservationKinds,
    "helix.workstation_goal_context_update.v1",
  ],
  explicitRequiredObservationKind: input.explicitRequiredObservationKind,
  plannerExpectedReceiptKind: input.plannerExpectedReceiptKind ?? input.toolFamilyRequiredObservationKinds[0] ?? input.explicitRequiredObservationKind,
});

export const WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS: readonly WorkstationContextFeedQueryToolContractSpec[] = [
  querySpec("visual_summaries", {
    label: "visual summaries",
    aliases: ["visual_capture_summaries", "stage_play_workstation_context_feed_query_result/v1"],
    toolFamilyRequiredObservationKinds: ["stage_play_workstation_context_feed_query_result"],
    explicitRequiredObservationKind: "stage_play_workstation_context_feed_query_result/v1",
  }),
  querySpec("audio_transcripts", {
    label: "audio transcripts",
    aliases: ["transcription_loop", "stage_play_workstation_context_feed_query_result/v1"],
    toolFamilyRequiredObservationKinds: ["stage_play_workstation_context_feed_query_result"],
    explicitRequiredObservationKind: "stage_play_workstation_context_feed_query_result/v1",
  }),
  querySpec("translated_transcripts", {
    label: "translation segments",
    aliases: ["translation_segments", "translated_segments", "stage_play_workstation_context_feed_query_result/v1"],
    toolFamilyRequiredObservationKinds: ["stage_play_workstation_context_feed_query_result"],
    explicitRequiredObservationKind: "stage_play_workstation_context_feed_query_result/v1",
  }),
  querySpec("microdeck_outputs", {
    label: "MicroDeck outputs",
    aliases: ["micro_reasoner_outputs", "stage_play_workstation_context_feed_query_result/v1"],
    toolFamilyRequiredObservationKinds: ["stage_play_workstation_context_feed_query_result"],
    explicitRequiredObservationKind: "stage_play_workstation_context_feed_query_result/v1",
  }),
  querySpec("live_answer_lines", {
    label: "Live Answer state",
    aliases: ["live_answer_state", "stage_play_workstation_context_feed_query_result/v1"],
    toolFamilyRequiredObservationKinds: ["stage_play_workstation_context_feed_query_result"],
    explicitRequiredObservationKind: "stage_play_workstation_context_feed_query_result/v1",
  }),
  querySpec("source_health", {
    label: "source health",
    aliases: ["source_health_query", "source_capability_read", "helix.situation_source_capability_read.v1"],
    toolFamilyRequiredObservationKinds: ["helix.situation_source_capability_read"],
    explicitRequiredObservationKind: "helix.situation_source_capability_read.v1",
    plannerExpectedReceiptKind: "helix.situation_source_capability_read.v1",
  }),
  querySpec("trace_memory", {
    label: "trace memory",
    aliases: [
      "reasoning_trace_memory",
      "workstation_reasoning_trace",
      "proof_recall_trace",
      "helix.workstation_reasoning_trace_query_result.v1",
    ],
    toolFamilyRequiredObservationKinds: ["helix.workstation_reasoning_trace_query_result"],
    explicitRequiredObservationKind: "helix.workstation_reasoning_trace_query_result.v1",
  }),
  querySpec("narrator_events", {
    label: "narrator events",
    aliases: ["narrator_bindings", "narrator_streams", "stage_play_workstation_context_feed_query_result/v1"],
    toolFamilyRequiredObservationKinds: ["stage_play_workstation_context_feed_query_result"],
    explicitRequiredObservationKind: "stage_play_workstation_context_feed_query_result/v1",
  }),
  querySpec("packet_traces", {
    label: "packet traces",
    aliases: [
      "per_packet_traces",
      "packet_causal_trace",
      "live_source_causal_trace/v1",
      "stage_play_packet_trace_query_result/v1",
    ],
    toolFamilyRequiredObservationKinds: ["stage_play_packet_trace_query_result", "live_source_causal_trace/v1"],
    explicitRequiredObservationKind: "stage_play_packet_trace_query_result/v1",
    plannerExpectedReceiptKind: "stage_play_packet_trace_query_result",
  }),
  querySpec("route_evidence", {
    label: "route evidence",
    aliases: ["route_watch_evidence", "route_watch_updates", "stage_play_workstation_context_feed_query_result/v1"],
    toolFamilyRequiredObservationKinds: ["stage_play_workstation_context_feed_query_result"],
    explicitRequiredObservationKind: "stage_play_workstation_context_feed_query_result/v1",
  }),
  querySpec("automation_policies", {
    label: "automation policies",
    aliases: ["automation_policy", "workstation_automations", "automation_status", "stage_play_workstation_context_feed_query_result/v1"],
    toolFamilyRequiredObservationKinds: ["stage_play_workstation_context_feed_query_result"],
    explicitRequiredObservationKind: "stage_play_workstation_context_feed_query_result/v1",
  }),
];

export const WORKSTATION_CONTEXT_FEED_QUERY_CAPABILITIES: readonly WorkstationContextFeedQueryCapability[] =
  WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS.map((spec) => spec.capability);

export const WORKSTATION_CONTEXT_FEED_QUERY_ACTUATORS: readonly AgentGoalActuatorV1[] =
  WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS.map((spec) => spec.actuator);

const contextFeedQueryAliasEntries = WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS.flatMap((spec) =>
  spec.aliases.map((alias) => ({
    alias,
    normalizedAlias: alias.toLowerCase(),
    capability: spec.capability,
  })),
);
const contextFeedQueryAliasCounts = contextFeedQueryAliasEntries.reduce((counts, entry) => {
  counts.set(entry.normalizedAlias, (counts.get(entry.normalizedAlias) ?? 0) + 1);
  return counts;
}, new Map<string, number>());

export const executableAliasesForWorkstationContextFeedQuerySpec = (
  spec: WorkstationContextFeedQueryToolContractSpec,
): string[] =>
  spec.aliases.filter((alias) => contextFeedQueryAliasCounts.get(alias.toLowerCase()) === 1);

export const workstationContextFeedQueryCapabilityForAlias = (
  alias: string | null | undefined,
): WorkstationContextFeedQueryCapability | null => {
  const normalizedAlias = String(alias ?? "").trim().toLowerCase();
  if (!normalizedAlias) return null;
  const match = contextFeedQueryAliasEntries.find((entry) =>
    entry.normalizedAlias === normalizedAlias &&
    contextFeedQueryAliasCounts.get(entry.normalizedAlias) === 1
  );
  return match?.capability ?? null;
};

export const workstationContextFeedQuerySpecForCapability = (
  capability: string | null | undefined,
): WorkstationContextFeedQueryToolContractSpec | null => {
  const normalized = String(capability ?? "").trim();
  if (!normalized) return null;
  return WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS.find((spec) => spec.capability === normalized) ?? null;
};
