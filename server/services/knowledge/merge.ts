import type { KnowledgeProjectExport } from "@shared/knowledge";

const KNOWLEDGE_CLAIM_TIER = "diagnostic" as const;

type MergeAudit = {
  claim_tier: typeof KNOWLEDGE_CLAIM_TIER;
  provenance: {
    class: "derived";
    stage: "merge";
    source: "knowledge.merge";
    deterministic: true;
  };
  status: "merged";
  context: {
    base_files: number;
    extra_files: number;
    merged_files: number;
  };
};

type AuditedProject = KnowledgeProjectExport & {
  audit?: {
    merge?: MergeAudit;
    [key: string]: unknown;
  };
};

export function mergeKnowledgeBundles(
  base?: KnowledgeProjectExport[],
  extra?: KnowledgeProjectExport[],
): KnowledgeProjectExport[] | undefined {
  if ((!base || base.length === 0) && (!extra || extra.length === 0)) {
    return undefined;
  }
  const map = new Map<string, KnowledgeProjectExport>();
  for (const bundle of base ?? []) {
    map.set(bundle.project.id, {
      ...bundle,
      files: [...bundle.files],
      audit: {
        ...((bundle as AuditedProject).audit ?? {}),
        merge: {
          claim_tier: KNOWLEDGE_CLAIM_TIER,
          provenance: {
            class: "derived",
            stage: "merge",
            source: "knowledge.merge",
            deterministic: true,
          },
          status: "merged",
          context: {
            base_files: bundle.files.length,
            extra_files: 0,
            merged_files: bundle.files.length,
          },
        },
      },
    } as KnowledgeProjectExport);
  }
  for (const bundle of extra ?? []) {
    const existing = map.get(bundle.project.id);
    if (!existing) {
      map.set(bundle.project.id, { ...bundle, files: [...bundle.files] });
      continue;
    }
    const seen = new Set(existing.files.map((file) => file.id));
    const mergedFiles = [...existing.files];
    for (const file of bundle.files) {
      if (seen.has(file.id)) {
        continue;
      }
      mergedFiles.push(file);
      seen.add(file.id);
    }
    const mergedOmitted = [
      ...(existing.omittedFiles ?? []),
      ...(bundle.omittedFiles ?? []),
    ].filter(Boolean);
    map.set(bundle.project.id, {
      project: existing.project,
      summary: existing.summary ?? bundle.summary,
      files: mergedFiles,
      approxBytes: (existing.approxBytes ?? 0) + (bundle.approxBytes ?? 0),
      omittedFiles: mergedOmitted.length > 0 ? mergedOmitted : undefined,
      audit: {
        ...((existing as AuditedProject).audit ?? {}),
        ...((bundle as AuditedProject).audit ?? {}),
        merge: {
          claim_tier: KNOWLEDGE_CLAIM_TIER,
          provenance: {
            class: "derived",
            stage: "merge",
            source: "knowledge.merge",
            deterministic: true,
          },
          status: "merged",
          context: {
            base_files: existing.files.length,
            extra_files: bundle.files.length,
            merged_files: mergedFiles.length,
          },
        },
      },
    } as KnowledgeProjectExport);
  }
  return Array.from(map.values());
}
