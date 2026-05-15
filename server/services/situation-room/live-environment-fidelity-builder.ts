import {
  HELIX_LIVE_ENVIRONMENT_FIDELITY_SCHEMA,
  type HelixLiveEnvironmentFidelity,
} from "@shared/helix-live-environment-fidelity";
import type { HelixLiveCardLineState } from "@shared/helix-live-card-line-state";
import type {
  HelixSituationSourceCapability,
  HelixSituationSourceModality,
} from "@shared/helix-situation-source-capability";
import { buildSituationSourceCapabilities } from "./situation-source-capability-store";

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const statusBucket = (
  capabilities: HelixSituationSourceCapability[],
  modality: HelixSituationSourceModality,
): "active" | "stale" | "missing" => {
  const entries = capabilities.filter((entry) => entry.modality === modality);
  if (entries.some((entry) => entry.status === "active")) return "active";
  if (entries.some((entry) => entry.status === "stale")) return "stale";
  return "missing";
};

export function buildLiveEnvironmentFidelity(input: {
  threadId: string;
  roomId?: string | null;
  lineStates?: HelixLiveCardLineState[];
  capabilities?: HelixSituationSourceCapability[];
  now?: string;
}): HelixLiveEnvironmentFidelity {
  const capabilities = input.capabilities ?? buildSituationSourceCapabilities({
    threadId: input.threadId,
    roomId: input.roomId,
    now: input.now,
  });
  const activeModalities = unique(capabilities
    .filter((entry) => entry.status === "active")
    .map((entry) => entry.modality));
  const staleModalities = unique(capabilities
    .filter((entry) => entry.status === "stale")
    .map((entry) => entry.modality)
    .filter((modality) => !activeModalities.includes(modality)));
  const expected: HelixSituationSourceModality[] = ["world_event", "visual_frame", "audio_transcript"];
  const missingModalities = unique([
    ...expected.filter((modality) => statusBucket(capabilities, modality) === "missing"),
    ...capabilities
      .filter((entry) => entry.status === "configured_missing" || entry.status === "permission_required" || entry.status === "error")
      .map((entry) => entry.modality)
      .filter((modality) => !activeModalities.includes(modality) && !staleModalities.includes(modality)),
  ]);
  const fidelityScore = capabilities.length === 0
    ? 0
    : Math.max(0, Math.min(1, capabilities.reduce((sum, entry) => sum + entry.fidelity_score, 0) / Math.max(1, capabilities.length)));
  const sourceContributionMap: Record<string, string[]> = {};
  for (const entry of capabilities) {
    sourceContributionMap[entry.modality] = unique([...(sourceContributionMap[entry.modality] ?? []), entry.contribution]);
  }
  const nextActions = unique(capabilities
    .map((entry) => entry.next_required_action)
    .filter((entry): entry is string => Boolean(entry)));
  if (missingModalities.includes("visual_frame") && !nextActions.includes("grant_visual_capture_permission")) {
    nextActions.push("grant_visual_capture_permission");
  }
  if (missingModalities.includes("world_event") && !nextActions.includes("attach_world_event_source")) {
    nextActions.push("attach_world_event_source");
  }
  return {
    schema: HELIX_LIVE_ENVIRONMENT_FIDELITY_SCHEMA,
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    active_modalities: activeModalities,
    missing_modalities: missingModalities,
    stale_modalities: staleModalities,
    fidelity_score: Number(fidelityScore.toFixed(3)),
    source_contribution_map: sourceContributionMap,
    per_line_coverage: Object.fromEntries((input.lineStates ?? []).map((state) => [state.line_key, state.source_coverage])),
    next_actions: nextActions.slice(0, 6),
    capabilities,
    raw_content_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
    created_at: input.now ?? new Date().toISOString(),
  };
}
