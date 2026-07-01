import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type { HelixAgentProvider } from "../agent-providers/types";
import {
  runHelixCapabilityLaneOneShotRequests,
  type HelixCapabilityLaneOneShotRunnerResult,
} from "./one-shot-runner";

export type HelixCapabilityLaneProviderAdapterContext = {
  schema: "helix.capability_lane.provider_adapter_context.v1";
  one_shot: HelixCapabilityLaneOneShotRunnerResult;
  debug_projection: HelixCapabilityLaneOneShotRunnerResult["debug_projection"];
  observation_packets: HelixAgentStepObservationPacket[];
  artifact_ledger: Array<Record<string, unknown>>;
  prompt_observation_block: string;
  calls_succeeded: boolean;
  terminal_eligible: false;
  assistant_answer: false;
  raw_content_included: false;
};

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const buildCapabilityLaneArtifactLedger = (input: {
  turnId: string;
  packets: HelixAgentStepObservationPacket[];
}): Array<Record<string, unknown>> =>
  input.packets.map((packet, index) => {
    const firstProducedRef = packet.produced_artifact_refs.find((ref) => ref.trim().length > 0);
    const artifactId =
      firstProducedRef ??
      `${input.turnId}:capability_lane_observation:${packet.capability_key}:${index + 1}`;
    return {
      schema: "helix.current_turn_artifact.v1",
      artifact_id: artifactId,
      producer_item_id: packet.call_id,
      kind: "capability_lane_observation_packet",
      observation_kind: packet.capability_key,
      turn_id: input.turnId,
      capability_key: packet.capability_key,
      produced_artifact_refs: packet.produced_artifact_refs,
      payload: packet,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  });

export const buildHelixCapabilityLaneProviderAdapterContext = (input: {
  provider: HelixAgentProvider;
  body: Record<string, unknown>;
  turnId?: string | null;
  iteration?: number | null;
  env?: NodeJS.ProcessEnv;
}): HelixCapabilityLaneProviderAdapterContext => {
  const turnId = readString(input.turnId) || readString(input.body.turn_id ?? input.body.turnId) || "ask:capability-lane";
  const oneShot = runHelixCapabilityLaneOneShotRequests({
    provider: input.provider,
    body: input.body,
    turnId,
    iteration: input.iteration,
    env: input.env,
  });
  const artifactLedger = buildCapabilityLaneArtifactLedger({
    turnId,
    packets: oneShot.observation_packets,
  });
  return {
    schema: "helix.capability_lane.provider_adapter_context.v1",
    one_shot: oneShot,
    debug_projection: oneShot.debug_projection,
    observation_packets: oneShot.observation_packets,
    artifact_ledger: artifactLedger,
    prompt_observation_block: JSON.stringify(oneShot.call_results, null, 2),
    calls_succeeded:
      oneShot.call_results.length === 0 ||
      oneShot.call_results.every((result) => result.ok === true),
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};
