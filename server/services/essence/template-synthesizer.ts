import { createHash, randomUUID } from "node:crypto";
import type { EssenceProposal } from "@shared/proposals";
import { ProposalTemplate, type TPhaseProfile, type TProposalTemplate } from "@shared/essence-activity";
import { upsertProposal } from "../../db/proposals";
import { ensureEssenceEnvironment } from "./environment";

type SynthesizeOptions = {
  ownerId: string;
  profiles: TPhaseProfile[];
  dayKey?: string;
  persist?: boolean;
  rewardTokens?: number;
};

export type SynthesizedTemplateResult = {
  profile: TPhaseProfile;
  template: TProposalTemplate;
  proposal: EssenceProposal | null;
};

const PANEL_LAYOUT_ORDER = ["primary", "secondary", "tertiary", "auxiliary", "floating", "reference"];

export async function synthesizeTemplatesForProfiles(opts: SynthesizeOptions): Promise<SynthesizedTemplateResult[]> {
  const { ownerId, profiles, persist = true, rewardTokens = 0 } = opts;
  if (!profiles.length) {
    return [];
  }
  const envContext = await ensureEssenceEnvironment(ownerId);
  if (!envContext) {
    throw new Error("essence_environment_missing");
  }
  const day = opts.dayKey ?? new Date().toISOString().slice(0, 10);
  const results: SynthesizedTemplateResult[] = [];
  for (const profile of profiles) {
    const template = buildTemplate(profile, envContext.template.id, envContext.template.templateVersion, ownerId);
    const proposalId = makeNightlyProposalId(ownerId, day, profile.id);
    const nowIso = new Date().toISOString();
    const proposal: EssenceProposal = {
      id: proposalId,
      kind: "layout",
      status: "new",
      source: "essence:proposal",
      title: makeTitle(profile),
      summary: makeSummary(profile),
      explanation: template.rationale,
      target: { type: "environment", scope: "desktop-template", ownerId },
      patchKind: "ui-config",
      patch: JSON.stringify({
        template,
        phase: profile,
      }),
      rewardTokens,
      ownerId,
      safetyStatus: "unknown",
      safetyScore: profile.score,
      safetyReport: null,
      jobId: null,
      evalRunId: null,
      metadata: {
        proposalTemplate: template,
        phaseProfile: profile,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
      createdForDay: day,
    };
    const stored = persist ? await upsertProposal(proposal) : null;
    results.push({
      profile,
      template,
      proposal: stored,
    });
  }
  return results;
}

function buildTemplate(
  profile: TPhaseProfile,
  templateId: string,
  templateVersion: number,
  ownerId: string,
): TProposalTemplate {
  const openPanels = (profile.topPanels ?? []).slice(0, PANEL_LAYOUT_ORDER.length).map((panelId, idx) => ({
    id: panelId,
    layout: PANEL_LAYOUT_ORDER[idx] ?? "floating",
  }));
  const pinFiles = (profile.topFiles ?? []).slice(0, 6);
  const consoleTabs = pinFiles.slice(0, 4);
  const template = ProposalTemplate.parse({
    id: `${templateId}-nightly-${profile.id}-${randomUUID().slice(0, 8)}`,
    baseOsImage: templateId,
    templateVersion: `${templateVersion}`,
    userOverridesRef: ownerId,
    changes: {
      openPanels,
      pinFiles,
      setEnv: profile.envHints ?? {},
      consoleTabs,
    },
    rationale: profile.rationale ?? `Auto template for ${profile.id}`,
    safety: {},
    createdAt: new Date().toISOString(),
    phaseId: profile.id,
  });
  return template;
}

function makeNightlyProposalId(ownerId: string, day: string, phaseId: string): string {
  const hash = createHash("sha256").update(`${ownerId}:${day}:${phaseId}`).digest("hex");
  return `nightly-${hash.slice(0, 16)}`;
}

function makeTitle(profile: TPhaseProfile): string {
  return `Nightly desktop for ${profile.id}`;
}

function makeSummary(profile: TPhaseProfile): string {
  const panels = profile.topPanels?.slice(0, 3).join(", ") || "recent panels";
  return `Reopen ${panels} with env hints tuned for ${profile.id}.`;
}
