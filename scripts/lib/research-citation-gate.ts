import fs from "node:fs";
import path from "node:path";

export type ResearchClaimStatus = "measured" | "derived" | "hypothesis";
export type ResearchCitationSourceType = "paper" | "web" | "github_clone";
export type ResearchChecklistStatus = "pending" | "done";

export type ResearchCitationChecklistItem = {
  id: string;
  title: string;
  status: ResearchChecklistStatus;
  note?: string;
  evidenceRef?: string;
};

export type ResearchCitationSource = {
  id: string;
  type: ResearchCitationSourceType;
  title: string;
  url?: string;
  doi?: string;
  repoUrl?: string;
  commitSha?: string;
  clonePath?: string;
  note?: string;
};

export type ResearchCitationClaim = {
  claimId: string;
  claimText: string;
  status: ResearchClaimStatus;
  artifactPaths: string[];
  sourceIds: string[];
  uncertaintyNote?: string;
};

export type ResearchCitationPatchChecklistManifest = {
  manifestType: "research_citation_patch_checklist/v1";
  generatedOn: string;
  policy?: {
    citationRequiredStatuses?: ResearchClaimStatus[];
    minSourcesPerClaim?: number;
    requireGithubCloneForMeasured?: boolean;
    requireCompletedChecklistItems?: boolean;
  };
  checklist: ResearchCitationChecklistItem[];
  sources: ResearchCitationSource[];
  claims: ResearchCitationClaim[];
};

export type ResearchCitationGateOptions = {
  manifestPath: string;
  citationRequiredStatuses?: ResearchClaimStatus[];
  minSourcesPerClaim?: number;
  requireGithubCloneForMeasured?: boolean;
  requireCompletedChecklistItems?: boolean;
};

export type ResearchCitationGateSummary = {
  manifestPath: string;
  checklistCount: number;
  sourceCount: number;
  claimCount: number;
  requiredClaimCount: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const normalizeStatuses = (value: unknown): ResearchClaimStatus[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is ResearchClaimStatus =>
      entry === "measured" || entry === "derived" || entry === "hypothesis",
  );
};

export const validateResearchCitationGateManifest = (
  input: unknown,
  options?: Omit<ResearchCitationGateOptions, "manifestPath">,
): {
  ok: boolean;
  issues: string[];
  summary: Omit<ResearchCitationGateSummary, "manifestPath"> | null;
} => {
  const issues: string[] = [];
  if (!isRecord(input)) {
    return { ok: false, issues: ["manifest_not_object"], summary: null };
  }
  if (input.manifestType !== "research_citation_patch_checklist/v1") {
    issues.push("manifest_type_invalid");
  }

  const policy = isRecord(input.policy) ? input.policy : {};
  const citationRequiredStatuses =
    options?.citationRequiredStatuses ??
    normalizeStatuses(policy.citationRequiredStatuses) ??
    ["measured", "derived"];
  const minSourcesPerClaim = Math.max(
    1,
    options?.minSourcesPerClaim ??
      (typeof policy.minSourcesPerClaim === "number" ? Math.floor(policy.minSourcesPerClaim) : 1),
  );
  const requireGithubCloneForMeasured =
    options?.requireGithubCloneForMeasured ??
    (policy.requireGithubCloneForMeasured === true);
  const requireCompletedChecklistItems =
    options?.requireCompletedChecklistItems ??
    (policy.requireCompletedChecklistItems !== false);

  const checklist = Array.isArray(input.checklist) ? input.checklist : [];
  const sources = Array.isArray(input.sources) ? input.sources : [];
  const claims = Array.isArray(input.claims) ? input.claims : [];

  if (checklist.length <= 0) issues.push("checklist_missing");
  if (sources.length <= 0) issues.push("sources_missing");
  if (claims.length <= 0) issues.push("claims_missing");

  const sourceById = new Map<string, ResearchCitationSource>();
  for (const [index, raw] of sources.entries()) {
    if (!isRecord(raw)) {
      issues.push(`source_${index}_not_object`);
      continue;
    }
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    if (!id) {
      issues.push(`source_${index}_id_missing`);
      continue;
    }
    if (sourceById.has(id)) {
      issues.push(`source_${index}_id_duplicate:${id}`);
      continue;
    }
    const type = raw.type;
    if (type !== "paper" && type !== "web" && type !== "github_clone") {
      issues.push(`source_${index}_type_invalid:${id}`);
      continue;
    }
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!title) {
      issues.push(`source_${index}_title_missing:${id}`);
      continue;
    }
    const source: ResearchCitationSource = {
      id,
      type,
      title,
      url: typeof raw.url === "string" ? raw.url.trim() : undefined,
      doi: typeof raw.doi === "string" ? raw.doi.trim() : undefined,
      repoUrl: typeof raw.repoUrl === "string" ? raw.repoUrl.trim() : undefined,
      commitSha: typeof raw.commitSha === "string" ? raw.commitSha.trim() : undefined,
      clonePath: typeof raw.clonePath === "string" ? raw.clonePath.trim() : undefined,
      note: typeof raw.note === "string" ? raw.note.trim() : undefined,
    };
    if (source.type === "github_clone") {
      if (!source.repoUrl) issues.push(`source_${index}_repo_missing:${id}`);
      if (!source.commitSha) issues.push(`source_${index}_commit_missing:${id}`);
      if (!source.clonePath) issues.push(`source_${index}_clone_path_missing:${id}`);
    } else if (!source.url && !source.doi) {
      issues.push(`source_${index}_reference_missing:${id}`);
    }
    sourceById.set(id, source);
  }

  for (const [index, raw] of checklist.entries()) {
    if (!isRecord(raw)) {
      issues.push(`checklist_${index}_not_object`);
      continue;
    }
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const status = raw.status;
    if (!id) issues.push(`checklist_${index}_id_missing`);
    if (!title) issues.push(`checklist_${index}_title_missing`);
    if (status !== "pending" && status !== "done") {
      issues.push(`checklist_${index}_status_invalid`);
      continue;
    }
    if (requireCompletedChecklistItems && status !== "done") {
      issues.push(`checklist_${index}_incomplete:${id || index}`);
    }
  }

  let requiredClaimCount = 0;
  const seenClaimIds = new Set<string>();
  for (const [index, raw] of claims.entries()) {
    if (!isRecord(raw)) {
      issues.push(`claim_${index}_not_object`);
      continue;
    }
    const claimId = typeof raw.claimId === "string" ? raw.claimId.trim() : "";
    const claimText = typeof raw.claimText === "string" ? raw.claimText.trim() : "";
    const status = raw.status;
    if (!claimId) {
      issues.push(`claim_${index}_id_missing`);
      continue;
    }
    if (seenClaimIds.has(claimId)) {
      issues.push(`claim_${index}_id_duplicate:${claimId}`);
      continue;
    }
    seenClaimIds.add(claimId);
    if (!claimText) issues.push(`claim_${index}_text_missing:${claimId}`);
    if (status !== "measured" && status !== "derived" && status !== "hypothesis") {
      issues.push(`claim_${index}_status_invalid:${claimId}`);
      continue;
    }
    const artifactPaths = Array.isArray(raw.artifactPaths)
      ? raw.artifactPaths.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];
    if (artifactPaths.length <= 0) {
      issues.push(`claim_${index}_artifact_paths_missing:${claimId}`);
    }
    const sourceIds = Array.isArray(raw.sourceIds)
      ? raw.sourceIds.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];
    const citationRequired = citationRequiredStatuses.includes(status);
    if (citationRequired) {
      requiredClaimCount += 1;
      if (sourceIds.length < minSourcesPerClaim) {
        issues.push(`claim_${index}_insufficient_sources:${claimId}`);
      }
    }
    const resolvedSources = sourceIds
      .map((id) => sourceById.get(id))
      .filter((entry): entry is ResearchCitationSource => entry != null);
    if (sourceIds.length !== resolvedSources.length) {
      issues.push(`claim_${index}_unknown_source_ref:${claimId}`);
    }
    if (
      status === "measured" &&
      requireGithubCloneForMeasured &&
      !resolvedSources.some((entry) => entry.type === "github_clone")
    ) {
      issues.push(`claim_${index}_github_clone_required:${claimId}`);
    }
    if (status === "hypothesis") {
      const uncertaintyNote =
        typeof raw.uncertaintyNote === "string" ? raw.uncertaintyNote.trim() : "";
      if (!uncertaintyNote) {
        issues.push(`claim_${index}_uncertainty_note_missing:${claimId}`);
      }
    }
  }

  if (requiredClaimCount <= 0) {
    issues.push("no_required_claims_for_policy");
  }

  return {
    ok: issues.length === 0,
    issues,
    summary: {
      checklistCount: checklist.length,
      sourceCount: sources.length,
      claimCount: claims.length,
      requiredClaimCount,
    },
  };
};

export const enforceResearchCitationGate = (
  options: ResearchCitationGateOptions,
): ResearchCitationGateSummary => {
  const manifestPath = path.resolve(options.manifestPath);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`citation_gate_manifest_missing:${manifestPath}`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`citation_gate_manifest_parse_failed:${detail}`);
  }
  const validation = validateResearchCitationGateManifest(raw, options);
  if (!validation.ok || validation.summary == null) {
    throw new Error(`citation_gate_failed:${validation.issues.join(",")}`);
  }
  return {
    manifestPath,
    checklistCount: validation.summary.checklistCount,
    sourceCount: validation.summary.sourceCount,
    claimCount: validation.summary.claimCount,
    requiredClaimCount: validation.summary.requiredClaimCount,
  };
};
