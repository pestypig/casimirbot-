import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import {
  HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY,
  HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS,
} from "@shared/helix-environment-connector";
import { HELIX_RESEARCH_LIBRARY_READ_CAPABILITY } from "@shared/helix-research-library";
import {
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
} from "@shared/helix-scholarly-research-observation";
import { HELIX_THEORY_CONTEXT_REFLECTION_CAPABILITY } from "../helix-ask/theory-congruence/capability-contract";

export type HelixAgentDatabaseScopePolicy = {
  allowedTools: readonly string[];
  requiredEvidence: readonly string[];
  oauthScope: string;
};

export const HELIX_AGENT_BOUND_ROOM_EVIDENCE_DATABASE_SCOPE =
  "bound_room_evidence" as const;
export const HELIX_AGENT_BOUND_ROOM_EVIDENCE_CAPABILITY =
  "room.evidence.read_bound" as const;
export const HELIX_AGENT_BOUND_ROOM_EVIDENCE_REQUIREMENT =
  "shared_live_room_evidence" as const;
export const HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_DATABASE_SCOPE =
  "bound_room_environment_probe" as const;
export const HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_CAPABILITY =
  HELIX_MINECRAFT_INVENTORY_CHECK_CAPABILITY;
export const HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_CAPABILITIES =
  HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS;
export const HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_REQUIREMENT =
  "shared_live_room_environment_probe" as const;

/*
 * This is deliberately code-owned. Deployment configuration may enable these
 * logical scopes, but it cannot invent capability IDs or raise a scope's
 * read-only ceiling.
 */
export const HELIX_AGENT_DATABASE_SCOPE_CATALOG: ReadonlyMap<
  string,
  HelixAgentDatabaseScopePolicy
> = new Map([
  [
    "public_web",
    {
      allowedTools: [HELIX_INTERNET_SEARCH_CAPABILITY],
      requiredEvidence: ["internet_search_evidence"],
      oauthScope: "helix.data.public_web.read",
    },
  ],
  [
    "scholarly_research",
    {
      allowedTools: [
        HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
        HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
      ],
      requiredEvidence: ["scholarly_evidence"],
      oauthScope: "helix.data.scholarly_research.read",
    },
  ],
  [
    "research_library",
    {
      allowedTools: [HELIX_RESEARCH_LIBRARY_READ_CAPABILITY],
      requiredEvidence: ["research_library_evidence"],
      oauthScope: "helix.data.research_library.read",
    },
  ],
  [
    "repository_evidence",
    {
      allowedTools: [
        "repo-code.search_concept",
        "repo.search",
        "docs.search",
        "docs-viewer.search_docs",
        "docs-viewer.validate_doc_candidates",
        "docs-viewer.summarize_doc",
        "docs-viewer.locate_in_doc",
        "docs-viewer.read_visible_surface",
        "docs-viewer.read_active_translation",
      ],
      requiredEvidence: ["repository_evidence"],
      oauthScope: "helix.data.repository_evidence.read",
    },
  ],
  [
    "theory_registry",
    {
      allowedTools: [
        HELIX_THEORY_CONTEXT_REFLECTION_CAPABILITY,
        "theory-badge-graph.reflect_discussion_context",
      ],
      requiredEvidence: ["theory_registry_evidence"],
      oauthScope: "helix.data.theory_registry.read",
    },
  ],
]);

export const HELIX_AGENT_DATABASE_OAUTH_SCOPES: readonly string[] =
  Object.freeze(
    Array.from(
      new Set(
        Array.from(
          HELIX_AGENT_DATABASE_SCOPE_CATALOG.values(),
          (policy: HelixAgentDatabaseScopePolicy) => policy.oauthScope,
        ),
      ),
    ),
  );

export const configuredHelixAgentDatabaseScopePolicies = (
  configuredScopeIds: ReadonlySet<string>,
): ReadonlyMap<string, HelixAgentDatabaseScopePolicy> => {
  const selected = new Map<string, HelixAgentDatabaseScopePolicy>();
  for (const scopeId of configuredScopeIds) {
    const policy = HELIX_AGENT_DATABASE_SCOPE_CATALOG.get(scopeId);
    if (policy) selected.set(scopeId, policy);
  }
  return selected;
};

export const evidenceRequirementFamiliesForArtifactKind = (
  artifactKind: string,
): readonly string[] => {
  const normalized = artifactKind.trim().toLowerCase();
  if (!normalized) return [];
  const families = new Set<string>();
  if (/internet_search|web_research/.test(normalized)) {
    families.add("internet_search_evidence");
  }
  if (/scholarly|paper_result|full_text/.test(normalized)) {
    families.add("scholarly_evidence");
  }
  if (/research_library/.test(normalized)) {
    families.add("research_library_evidence");
  }
  if (/repo_|repo_code|doc_search|doc_summary|doc_location/.test(normalized)) {
    families.add("repository_evidence");
  }
  if (/theory_context|theory_badge|frontier_vector/.test(normalized)) {
    families.add("theory_registry_evidence");
  }
  if (
    /bound_room_evidence|shared_live_room.*evidence|minecraft.*bound_room/.test(
      normalized,
    )
  ) {
    families.add(HELIX_AGENT_BOUND_ROOM_EVIDENCE_REQUIREMENT);
  }
  if (/environment_probe|minecraft.*inventory/.test(normalized)) {
    families.add(HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_REQUIREMENT);
  }
  return Array.from(families);
};
