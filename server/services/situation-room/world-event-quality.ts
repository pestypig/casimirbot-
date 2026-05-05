import type { HelixWorldEvent } from "@shared/helix-world-event";

export type WorldEventQualitySummary = {
  has_evidence: boolean;
  has_source_id: boolean;
  has_actor: boolean;
  has_location: boolean;
};

export function summarizeWorldEventQuality(event: HelixWorldEvent): WorldEventQualitySummary {
  return {
    has_evidence: event.evidence_refs.length > 0,
    has_source_id: Boolean(event.source_id),
    has_actor: Boolean(event.actor_id || event.actor_label),
    has_location: Boolean(event.location),
  };
}

