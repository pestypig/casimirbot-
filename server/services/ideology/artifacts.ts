import {
  IDEOLOGY_ARTIFACTS,
  type IdeologyArtifact,
  type IdeologyArtifactSearchParams,
  type IdeologyArtifactSearchResponse
} from "@shared/ideology/ideology-artifacts";

export const ZEN_SOCIETY_STRICT_FAIL_REASON = "ZEN_SOCIETY_PROVENANCE_MISSING";

export type EthosKnowledgeProvenance = {
  provenance_class: "inferred";
  claim_tier: "diagnostic";
  certifying: false;
};

export type IdeologyArtifactWithProvenance = IdeologyArtifact & EthosKnowledgeProvenance;

type IdeologyArtifactSearchResponseWithProvenance = IdeologyArtifactSearchResponse & {
  items: IdeologyArtifactWithProvenance[];
  fail_reason?: string;
};

const DEFAULT_ETHOS_KNOWLEDGE_PROVENANCE: EthosKnowledgeProvenance = {
  provenance_class: "inferred",
  claim_tier: "diagnostic",
  certifying: false,
};

const hasCompleteKnowledgeProvenance = (artifact: Partial<IdeologyArtifactWithProvenance>): boolean =>
  typeof artifact.provenance_class === "string" &&
  artifact.provenance_class.length > 0 &&
  typeof artifact.claim_tier === "string" &&
  artifact.claim_tier.length > 0 &&
  typeof artifact.certifying === "boolean";

const withKnowledgeProvenance = (artifact: IdeologyArtifact): IdeologyArtifactWithProvenance => ({
  ...artifact,
  ...DEFAULT_ETHOS_KNOWLEDGE_PROVENANCE,
});

const isZenSocietyArtifact = (artifact: IdeologyArtifact): boolean => {
  const tags = (artifact.tags ?? []).map(normalize);
  if (artifact.nodeId === "citizens-arc") return true;
  return tags.includes("society") || tags.includes("governance");
};

const hasEvidenceProvenance = (artifact: IdeologyArtifact): boolean => {
  const tags = (artifact.tags ?? []).map(normalize);
  return artifact.nodeId === "provenance-protocol" || tags.includes("provenance");
};

const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";

const buildHaystack = (artifact: IdeologyArtifact) => {
  const parts = [
    artifact.title,
    artifact.summary ?? "",
    artifact.body ?? "",
    ...(artifact.tags ?? [])
  ];
  return normalize(parts.join(" "));
};

const matchesQuery = (artifact: IdeologyArtifact, query?: string) => {
  if (!query) return true;
  return buildHaystack(artifact).includes(normalize(query));
};

const matchesTags = (artifact: IdeologyArtifact, tags?: string[]) => {
  if (!tags || tags.length === 0) return true;
  const tagSet = new Set((artifact.tags ?? []).map(normalize));
  return tags.some((tag) => tagSet.has(normalize(tag)));
};

export const searchIdeologyArtifacts = (
  params: IdeologyArtifactSearchParams & { strictProvenance?: boolean }
): IdeologyArtifactSearchResponseWithProvenance => {
  const panelId = params.panelId?.trim() || undefined;
  const nodeId = params.nodeId?.trim() || undefined;
  const query = params.query?.trim() || undefined;
  const limit = Math.max(1, Math.min(params.limit ?? 50, 200));
  const offset = Math.max(0, params.offset ?? 0);
  const tags = params.tags?.map((tag) => tag.trim()).filter(Boolean);

  const filtered = IDEOLOGY_ARTIFACTS.filter((artifact) => {
    if (panelId && artifact.panelId !== panelId) return false;
    if (nodeId && artifact.nodeId !== nodeId) return false;
    if (!matchesTags(artifact, tags)) return false;
    return matchesQuery(artifact, query);
  });

  const pagedItems = filtered.slice(offset, offset + limit);
  const items = pagedItems.map(withKnowledgeProvenance);
  const strictMissingProvenance =
    params.strictProvenance === true &&
    filtered.some(
      (item) =>
        isZenSocietyArtifact(item) &&
        (!hasCompleteKnowledgeProvenance(item as Partial<IdeologyArtifactWithProvenance>) || !hasEvidenceProvenance(item)),
    );

  return {
    query,
    items,
    total: filtered.length,
    filters: { panelId, nodeId, tags },
    ...(strictMissingProvenance ? { fail_reason: ZEN_SOCIETY_STRICT_FAIL_REASON } : {}),
  };
};

export const getIdeologyArtifactById = (id: string): IdeologyArtifactWithProvenance | null => {
  const artifact = IDEOLOGY_ARTIFACTS.find((entry) => entry.id === id);
  return artifact ? withKnowledgeProvenance(artifact) : null;
};


export const getGuidanceArtifacts = (nodeIds: string[]) =>
  IDEOLOGY_ARTIFACTS.filter((artifact) =>
    artifact.tags?.includes("guidance-endpoint") || (artifact.nodeId ? nodeIds.includes(artifact.nodeId) : false),
  ).map(withKnowledgeProvenance);
