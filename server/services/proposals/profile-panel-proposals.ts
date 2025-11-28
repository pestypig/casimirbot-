import crypto from "node:crypto";
import type { EssenceProposal } from "@shared/proposals";
import type { EssenceProfile, EssenceProfileSummaryResult } from "@shared/inferenceProfile";
import { getEssenceProfile } from "../../db/essenceProfile";
import { getLatestProfileSummary } from "../../db/profileSummaries";
import { upsertProposal } from "../../db/proposals";
import { buildProfileHelixPanelCode } from "../panels/profile-panel-from-profile";

const todayKey = () => new Date().toISOString().slice(0, 10);

const deterministicId = (personaId: string, day: string) =>
  crypto.createHash("sha1").update(`profile-panel:${personaId}:${day}`).digest("hex").slice(0, 16);

const targetPathForPersona = (personaId: string) =>
  `client/src/components/panels/profile-helix-${personaId.replace(/[^a-z0-9-_]+/gi, "-")}.tsx`;

const buildProposal = (
  personaId: string,
  profile: EssenceProfile,
  summary: EssenceProfileSummaryResult,
  day: string,
): EssenceProposal => {
  const targetPath = targetPathForPersona(personaId);
  const code = buildProfileHelixPanelCode(personaId, profile, summary);
  const nowIso = new Date().toISOString();
  return {
    id: deterministicId(personaId, day),
    kind: "panel",
    status: "new",
    source: "essence:proposal",
    title: `Helix Profile Panel for ${personaId}`,
    summary: "Start-window panel showing cycles, energy budget, signals, experiments, and resonance for this persona.",
    explanation:
      "Uses the latest Essence profile summary to shape rhythms (cycles), sustainability (energy budget), telemetry signals, and recurring resonance themes.",
    target: { type: "backend-file", path: targetPath },
    patchKind: "code-diff",
    patch: code,
    rewardTokens: 250,
    ownerId: personaId,
    safetyStatus: "unknown",
    safetyScore: undefined,
    safetyReport: null,
    jobId: null,
    evalRunId: null,
    metadata: {
      personaId,
      profileSummaryUpdatedAt: summary.updated_at,
      profileSummaryDay: day,
      targetPath,
      source: "profile-summary",
    },
    createdAt: nowIso,
    updatedAt: nowIso,
    createdForDay: day,
  };
};

export async function createOrUpdateProfilePanelProposal(personaId: string): Promise<EssenceProposal> {
  const day = todayKey();
  const profile = await getEssenceProfile(personaId);
  if (!profile) {
    throw new Error(`profile_missing:${personaId}`);
  }
  const summaryRecord = await getLatestProfileSummary(personaId);
  if (!summaryRecord) {
    throw new Error(`profile_summary_missing:${personaId}`);
  }
  const proposal = buildProposal(personaId, profile, summaryRecord.summary, day);
  return upsertProposal(proposal);
}
