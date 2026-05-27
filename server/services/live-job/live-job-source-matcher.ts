import type { LiveSourceObservation } from "@shared/live-source-observation";
import type { SituationRoomLiveJobContract } from "@shared/situation-room-live-job-contract";

const sourceRequirementMatches = (
  source: SituationRoomLiveJobContract["source_requirements"][number],
  observation: LiveSourceObservation,
): boolean => {
  if (source.source_kind !== observation.source_kind) return false;
  if (!source.binding_id) return true;
  return source.binding_id === observation.binding_id || source.binding_id === observation.source_id;
};

export function liveJobAcceptsSourceObservation(input: {
  contract: SituationRoomLiveJobContract;
  sourceObservation: LiveSourceObservation;
}): boolean {
  const { contract, sourceObservation } = input;
  if (contract.runtime_status === "stopped" || contract.runtime_status === "paused") return false;
  return contract.source_requirements.some((source) => {
    if (!sourceRequirementMatches(source, sourceObservation)) return false;
    if (source.required) return true;
    if (source.status === "connected") return true;
    return sourceObservation.event_kind === "direct_address" || sourceObservation.freshness.status !== "fresh";
  });
}
