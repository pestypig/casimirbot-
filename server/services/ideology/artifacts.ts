import {
  IDEOLOGY_ARTIFACTS,
  type IdeologyArtifact,
  type IdeologyArtifactSearchParams,
  type IdeologyArtifactSearchResponse
} from "@shared/ideology/ideology-artifacts";

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
  params: IdeologyArtifactSearchParams
): IdeologyArtifactSearchResponse => {
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

  return {
    query,
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    filters: { panelId, nodeId, tags }
  };
};

export const getIdeologyArtifactById = (id: string) =>
  IDEOLOGY_ARTIFACTS.find((artifact) => artifact.id === id) ?? null;
