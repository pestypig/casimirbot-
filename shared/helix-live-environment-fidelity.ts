import type {
  HelixSituationSourceCapability,
  HelixSituationSourceModality,
} from "./helix-situation-source-capability";
import type {
  HelixLiveCardLineSourceCoverage,
} from "./helix-live-card-line-state";

export const HELIX_LIVE_ENVIRONMENT_FIDELITY_SCHEMA =
  "helix.live_environment_fidelity.v1" as const;

export type HelixLiveEnvironmentFidelity = {
  schema: typeof HELIX_LIVE_ENVIRONMENT_FIDELITY_SCHEMA;
  thread_id: string;
  room_id?: string | null;
  active_modalities: HelixSituationSourceModality[];
  missing_modalities: HelixSituationSourceModality[];
  stale_modalities: HelixSituationSourceModality[];
  fidelity_score: number;
  source_contribution_map: Record<string, string[]>;
  per_line_coverage: Record<string, HelixLiveCardLineSourceCoverage>;
  next_actions: string[];
  capabilities: HelixSituationSourceCapability[];
  raw_content_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
