import * as fs from "node:fs";
import * as path from "node:path";

export type MathEvidenceDocument = {
  path: string;
  title?: string;
  text: string;
  lines: string[];
};

export const uniqueStrings = (values: Array<string | null | undefined>): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
};

export const normalizeWorkspaceDocPath = (value: unknown): string | null => {
  const raw = typeof value === "string" ? value.trim().replace(/\\/g, "/") : "";
  if (!raw) return null;
  const withoutLeadingSlash = raw.replace(/^\/+/, "");
  if (!withoutLeadingSlash.toLowerCase().startsWith("docs/")) return null;
  return `/${withoutLeadingSlash}`;
};

export const tokenizeMathEvidenceQuery = (query: string): string[] =>
  uniqueStrings(
    query
      .replace(/0p(\d+)/gi, "0.$1")
      .split(/[^A-Za-z0-9_.]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2),
  );

export const extractExplicitDocPaths = (text: string): string[] =>
  uniqueStrings(
    Array.from(text.matchAll(/(?:^|\s)(\/?docs\/[^\s"'<>]+?\.md)\b/gi))
      .map((match) => normalizeWorkspaceDocPath(match[1]) ?? null)
      .filter((entry): entry is string => Boolean(entry)),
  );

export const inferMathEvidenceTargetTerms = (query: string): string[] => {
  const tokens = tokenizeMathEvidenceQuery(query);
  const preferred = [
    "NHM2",
    "alpha",
    "proper",
    "coordinate",
    "properTimeS_expected",
    "coordinateTimeS",
    "centerlineDtauDt",
    "properVsCoordinate_ratio",
    "coordinateVsClassical_ratio",
    "0.7",
  ];
  return uniqueStrings([
    ...preferred.filter((term) => query.toLowerCase().includes(term.toLowerCase())),
    ...tokens.filter((token) => /^(?:NHM2|alpha|proper|coordinate|calculator|equation|formula|0\.7|0p7000)$/i.test(token)),
  ]);
};

export const readMarkdownDocs = (root = process.cwd(), sourcePath?: string | null): MathEvidenceDocument[] => {
  const docsRoot = path.resolve(root, "docs");
  const paths: string[] = [];
  const explicit = normalizeWorkspaceDocPath(sourcePath);
  if (explicit) {
    paths.push(path.resolve(root, explicit.replace(/^\/+/, "")));
  } else {
    const visit = (dir: string): void => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          visit(full);
        } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
          paths.push(full);
        }
      }
    };
    if (fs.existsSync(docsRoot)) visit(docsRoot);
  }

  return paths.flatMap((fullPath) => {
    try {
      const text = fs.readFileSync(fullPath, "utf8");
      const rel = path.relative(root, fullPath).replace(/\\/g, "/");
      const docPath = rel.startsWith("/") ? rel : `/${rel}`;
      const lines = text.split(/\r?\n/);
      const title = lines.find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, "").trim();
      return [{ path: docPath, title, text, lines }];
    } catch {
      return [];
    }
  });
};

export const lineWindow = (lines: string[], index: number, radius = 1): { text: string; line_start: number; line_end: number } => {
  const start = Math.max(0, index - radius);
  const end = Math.min(lines.length - 1, index + radius);
  return {
    text: lines.slice(start, end + 1).join(" ").replace(/\s+/g, " ").trim(),
    line_start: start + 1,
    line_end: end + 1,
  };
};

export const includesFolded = (text: string, term: string): boolean => {
  const lowerText = text.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const foldedText = lowerText.replace(/[._\-\s]+/g, "");
  const foldedTerm = lowerTerm.replace(/[._\-\s]+/g, "");
  return lowerText.includes(lowerTerm) || (!!foldedTerm && foldedText.includes(foldedTerm));
};
