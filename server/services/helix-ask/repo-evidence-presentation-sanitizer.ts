import { createHash } from "node:crypto";

const MATH_ALNUM_START = 0x1d400;
const MATH_ALNUM_END = 0x1d7ff;

const hashShort = (value: string): string =>
  createHash("sha256").update(value).digest("hex").slice(0, 16);

const normalizeMathStyledAscii = (value: string): { text: string; removedCodepoints: string[] } => {
  const removedCodepoints: string[] = [];
  let text = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= MATH_ALNUM_START && code <= MATH_ALNUM_END) {
      const normalized = char.normalize("NFKC");
      if (normalized !== char) {
        text += normalized;
        removedCodepoints.push(`U+${code.toString(16).toUpperCase()}`);
        continue;
      }
    }
    text += char;
  }
  return { text, removedCodepoints };
};

export function sanitizeRepoEvidenceExcerptForPresentation(input: {
  raw: string;
  maxChars?: number;
}): {
  sanitized: string;
  changed: boolean;
  removedCodepoints: string[];
  warnings: string[];
  rawHash: string;
} {
  const raw = String(input.raw ?? "");
  const maxChars = Math.max(80, Math.min(input.maxChars ?? 360, 1200));
  const warnings: string[] = [];
  const mathNormalized = normalizeMathStyledAscii(raw);
  let sanitized = mathNormalized.text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\S\n\t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const controlMatches = sanitized.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g) ?? [];
  if (controlMatches.length > 0) warnings.push("removed_control_characters");
  sanitized = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  if (sanitized.length > maxChars) {
    sanitized = `${sanitized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}...`;
    warnings.push("truncated");
  }

  if (mathNormalized.removedCodepoints.length > 0) warnings.push("normalized_math_styled_alphanumerics");
  const changed = sanitized !== raw;
  return {
    sanitized,
    changed,
    removedCodepoints: Array.from(new Set(mathNormalized.removedCodepoints)),
    warnings,
    rawHash: hashShort(raw),
  };
}
