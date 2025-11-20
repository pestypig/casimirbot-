import type { KnowledgeProjectExport } from "@shared/knowledge";

export function mergeKnowledgeBundles(
  base?: KnowledgeProjectExport[],
  extra?: KnowledgeProjectExport[],
): KnowledgeProjectExport[] | undefined {
  if ((!base || base.length === 0) && (!extra || extra.length === 0)) {
    return undefined;
  }
  const map = new Map<string, KnowledgeProjectExport>();
  for (const bundle of base ?? []) {
    map.set(bundle.project.id, { ...bundle, files: [...bundle.files] });
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
    });
  }
  return Array.from(map.values());
}
