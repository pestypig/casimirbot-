export function normalizeDocsViewerAnchorPath(value: string): string {
  const normalized = value.replace(/\\/g, "/").trim();
  if (/^[a-z]:\//i.test(normalized)) return normalized;
  return normalized.replace(/^\/+/, "");
}

export function normalizeDocViewerPathForAskSnapshot(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || /^[a-z]:\//i.test(normalized)) return null;
  return normalized.startsWith("docs/") ? normalized : null;
}

export function extractExplicitDocsViewerPath(question: string): string | null {
  const lineMatch = question.match(/document path:\s*([^\n\r]+)/i);
  const inlinePath = lineMatch?.[1]?.trim();
  if (inlinePath) {
    const normalized = normalizeDocsViewerAnchorPath(inlinePath);
    if (normalized) return normalized;
  }
  const tokenMatch = question.match(
    /\b([a-z0-9_./-]+\.(?:ts|tsx|js|jsx|json|md|mdx|txt|pdf|docx?|ya?ml|py|go|rs))\b/i,
  );
  const tokenPath = tokenMatch?.[1]?.trim();
  if (tokenPath) {
    const normalized = normalizeDocsViewerAnchorPath(tokenPath);
    if (normalized) return normalized;
  }
  return null;
}

export function normalizeDocPathForDebugCompare(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\\/g, "/");
  if (!trimmed) return null;
  return trimmed.replace(/^\/+/, "");
}
