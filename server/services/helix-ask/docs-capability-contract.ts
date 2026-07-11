export const HELIX_DOCS_SEARCH_CAPABILITY = "docs.search" as const;
export const HELIX_DOCS_READ_VISIBLE_SURFACE_CAPABILITY = "docs-viewer.read_visible_surface" as const;
export const HELIX_DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY = "docs-viewer.read_active_translation" as const;
export const HELIX_DOCS_OPEN_DOC_CAPABILITY = "docs-viewer.open_doc" as const;

export const HELIX_DOCS_SEARCH_ALIAS_CAPABILITIES = [
  "docs-viewer.search_docs",
  "docs-viewer.locate_in_doc",
  "docs-viewer.summarize_doc",
  "docs-viewer.doc_equation_context",
] as const;

export const HELIX_DOCS_OPEN_DOC_ALIAS_CAPABILITIES = [
  "docs-viewer.open",
  "docs-viewer.open_doc_by_path",
] as const;

export type HelixCanonicalDocsCapability =
  | typeof HELIX_DOCS_SEARCH_CAPABILITY
  | typeof HELIX_DOCS_READ_VISIBLE_SURFACE_CAPABILITY
  | typeof HELIX_DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY
  | typeof HELIX_DOCS_OPEN_DOC_CAPABILITY;

export const canonicalDocsRuntimeCapability = (capability: string): HelixCanonicalDocsCapability | null => {
  if (
    capability === HELIX_DOCS_SEARCH_CAPABILITY ||
    HELIX_DOCS_SEARCH_ALIAS_CAPABILITIES.includes(capability as (typeof HELIX_DOCS_SEARCH_ALIAS_CAPABILITIES)[number])
  ) return HELIX_DOCS_SEARCH_CAPABILITY;
  if (
    capability === HELIX_DOCS_OPEN_DOC_CAPABILITY ||
    capability === "docs-viewer.open_doc_by_path"
  ) return HELIX_DOCS_OPEN_DOC_CAPABILITY;
  if (capability === HELIX_DOCS_READ_VISIBLE_SURFACE_CAPABILITY) return capability;
  if (capability === HELIX_DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY) return capability;
  return null;
};

export const isDocsCompatibilityCapability = (capability: string): boolean =>
  HELIX_DOCS_SEARCH_ALIAS_CAPABILITIES.includes(capability as (typeof HELIX_DOCS_SEARCH_ALIAS_CAPABILITIES)[number]) ||
  HELIX_DOCS_OPEN_DOC_ALIAS_CAPABILITIES.includes(capability as (typeof HELIX_DOCS_OPEN_DOC_ALIAS_CAPABILITIES)[number]);
