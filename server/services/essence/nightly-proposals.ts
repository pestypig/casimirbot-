import type { TPhaseProfile } from "@shared/essence-activity";
import { detectPhaseProfiles } from "./phase-detector";
import type { SynthesizedTemplateResult } from "./template-synthesizer";
import { synthesizeTemplatesForProfiles } from "./template-synthesizer";

type NightlyOptions = {
  ownerId: string;
  hours?: number;
  minScore?: number;
  limit?: number;
  persist?: boolean;
};

export async function runNightlyProposalSynthesis(opts: NightlyOptions): Promise<SynthesizedTemplateResult[]> {
  const { ownerId, hours, minScore = 0.6, limit = 3, persist = true } = opts;
  const detected = await detectPhaseProfiles({
    ownerId,
    hours,
    minScore,
    persist: true,
  });
  if (!detected.length) {
    return [];
  }
  const shortlisted: TPhaseProfile[] = detected.slice(0, Math.max(1, Math.min(5, limit)));
  return synthesizeTemplatesForProfiles({
    ownerId,
    profiles: shortlisted,
    persist,
  });
}
