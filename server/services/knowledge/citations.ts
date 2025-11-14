export function extractCitations(text: string): { proj: Array<{ slug: string; file: string }>; ess: string[] } {
  const proj: Array<{ slug: string; file: string }> = [];
  const projRe = /\[project:([a-z0-9\-_.]+)\/file:([^\]]+)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = projRe.exec(text)) !== null) {
    proj.push({ slug: m[1], file: m[2] });
  }
  const ess: string[] = [];
  const essRe = /\bessence:([a-f0-9\-]{8,})\b/gi;
  while ((m = essRe.exec(text)) !== null) {
    ess.push(m[1]);
  }
  return { proj, ess };
}

type AttachedProject = {
  project?: { name?: string; hashSlug?: string };
  files?: Array<{ name?: string }>;
};

export function verifyCitations(
  attached: AttachedProject[] | undefined,
  extracted: { proj: Array<{ slug: string; file: string }>; ess: string[] },
  limit = 5,
): { pass: boolean; missing: string[] } {
  if (!attached || attached.length === 0) return { pass: true, missing: [] };
  const want = new Set<string>();
  for (const p of attached) {
    const slug = (p.project?.hashSlug || p.project?.name || "").trim();
    if (!slug) continue;
    for (const f of p.files ?? []) {
      const name = (f.name || "").trim();
      if (!name) continue;
      want.add(`${slug}/${name}`);
    }
  }
  const got = new Set<string>(extracted.proj.map((p) => `${p.slug}/${p.file}`));
  const missing: string[] = [];
  for (const key of want) {
    if (!got.has(key)) {
      missing.push(key);
      if (missing.length >= limit) break;
    }
  }
  return { pass: missing.length === 0, missing };
}

