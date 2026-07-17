export const HELIX_THEORY_CONTEXT_REFLECTION_CAPABILITY =
  "helix_ask.reflect_theory_context" as const;

export const HELIX_THEORY_CONTEXT_REFLECTION_LEGACY_ALIASES = [
  "theory-badge-graph.reflect_discussion_context",
] as const;

export type HelixTheoryContextReflectionLegacyAlias =
  (typeof HELIX_THEORY_CONTEXT_REFLECTION_LEGACY_ALIASES)[number];

export const isHelixTheoryContextReflectionLegacyAlias = (
  capabilityId: string,
): capabilityId is HelixTheoryContextReflectionLegacyAlias =>
  (HELIX_THEORY_CONTEXT_REFLECTION_LEGACY_ALIASES as readonly string[]).includes(capabilityId);

/**
 * Keeps retired panel-action identifiers as input compatibility only. Runtime
 * admission, execution, observations, and advertised capability identity use
 * the Ask-owned open-world reflection/congruence capability.
 */
export const canonicalizeHelixTheoryContextReflectionCapability = (
  capabilityId: string,
): string =>
  isHelixTheoryContextReflectionLegacyAlias(capabilityId)
    ? HELIX_THEORY_CONTEXT_REFLECTION_CAPABILITY
    : capabilityId;
