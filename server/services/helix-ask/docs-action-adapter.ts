import {
  HELIX_DOCS_OPEN_DOC_CAPABILITY,
  HELIX_DOCS_SEARCH_CAPABILITY,
} from "./docs-capability-contract";

export type HelixDocsPanelAction = {
  panel_id: "docs-viewer";
  action_id: "open" | "open_doc_by_path" | "search_docs";
  args: Record<string, unknown>;
};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArrayFirst = (value: unknown): string | null =>
  Array.isArray(value) ? readString(value[0]) : null;

const normalizeDocsPath = (value: unknown): string | null => {
  const raw = readString(value);
  if (!raw) return null;
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized.startsWith("docs/") || normalized.includes("..") || /^[a-z]:\//i.test(normalized)) return null;
  return normalized;
};

export const buildCanonicalDocsPanelAction = (input: {
  capability: string | null | undefined;
  args?: Record<string, unknown> | null;
  fallbackQuery?: string | null;
  fallbackPath?: string | null;
}): HelixDocsPanelAction | null => {
  const args = input.args ?? {};
  if (input.capability === HELIX_DOCS_SEARCH_CAPABILITY) {
    const query =
      readString(args.query) ??
      readString(args.topic) ??
      readString(args.title) ??
      readString(input.fallbackQuery);
    if (!query) return null;
    const path = normalizeDocsPath(readStringArrayFirst(args.paths));
    return {
      panel_id: "docs-viewer",
      action_id: "search_docs",
      args: {
        query,
        limit: Number(args.limit) || 5,
        ...(path ? { path } : {}),
      },
    };
  }
  if (input.capability === HELIX_DOCS_OPEN_DOC_CAPABILITY) {
    const path =
      normalizeDocsPath(args.path) ??
      normalizeDocsPath(args.selected_path) ??
      normalizeDocsPath(args.doc_path) ??
      normalizeDocsPath(input.fallbackPath);
    return path
      ? { panel_id: "docs-viewer", action_id: "open_doc_by_path", args: { path } }
      : { panel_id: "docs-viewer", action_id: "open", args: {} };
  }
  return null;
};
