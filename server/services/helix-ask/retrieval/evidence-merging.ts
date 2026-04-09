type AgiEvidenceLike = {
  hash?: string | null;
  kind?: string | null;
  id?: string | null;
  path?: string | null;
};

export const buildEvidenceKey = (item: AgiEvidenceLike): string =>
  item.hash ?? `${item.kind ?? ""}:${item.id ?? ""}:${item.path ?? ""}`;

export const mergeEvidence = <T extends AgiEvidenceLike>(primary: T[], extra: T[]): T[] => {
  const output: T[] = [];
  const seen = new Set<string>();
  for (const item of [...primary, ...extra]) {
    const key = buildEvidenceKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
};
