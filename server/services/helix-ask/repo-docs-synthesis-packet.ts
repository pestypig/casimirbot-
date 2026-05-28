import type { HelixRepoCodeEvidenceObservation } from "@shared/helix-repo-code-evidence-observation";
import {
  findRepoConceptAliasEntry,
  type RepoConceptEvidenceRole,
} from "./repo-concept-alias-registry";

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

type RecordLike = Record<string, unknown>;

export const HELIX_REPO_DOCS_SYNTHESIS_PACKET_SCHEMA =
  "helix.repo_docs_synthesis_packet.v1" as const;

export type HelixRepoDocsSynthesisAttemptStatus =
  | "succeeded"
  | "empty"
  | "stale"
  | "renderer_hostile"
  | "unsupported_claims"
  | "missing_support_refs"
  | "excerpt_like"
  | "failed";

export type HelixRepoDocsSynthesisViolation =
  | "missing_model_synthesis"
  | "empty_answer"
  | "excerpt_like_answer"
  | "file_list_only"
  | "canned_fallback_text"
  | "renderer_hostile_text"
  | "missing_support_refs"
  | "unsupported_repo_claim"
  | "wrong_model_step_identity"
  | "policy_claim_inversion"
  | "shallow_broad_concept_answer"
  | "missing_broad_concept_coverage"
  | "insufficient_evidence_role_coverage";

export type HelixRepoDocsAnswerCoveragePoint =
  | "identity"
  | "responsibilities"
  | "workflow_or_surfaces"
  | "evidence_or_authority_boundary";

export type HelixRepoDocsSynthesisPacket = {
  schema: typeof HELIX_REPO_DOCS_SYNTHESIS_PACKET_SCHEMA;
  turn_id: string;
  packet_id: string;
  route_family: "repo_evidence" | "docs_source";
  user_question: string;
  concept?: string;
  source_observation_refs: string[];
  answer_contract: {
    required_model_step_capability:
      | "model.synthesize_from_repo_evidence"
      | "model.synthesize_from_docs_evidence";
    required_terminal_kind:
      | "repo_code_evidence_answer"
      | "model_synthesized_answer";
    must_answer_meaning: true;
    must_include_compact_refs: true;
    must_not_emit_file_inventory: true;
    must_not_claim_missing_evidence_when_observations_exist: true;
  };
  answer_depth_contract: {
    depth_mode: "internal_concept_overview" | "concise_fact";
    min_word_count: number;
    min_distinct_evidence_roles: number;
    required_coverage_points: HelixRepoDocsAnswerCoveragePoint[];
    required_evidence_roles: RepoConceptEvidenceRole[];
    guidance: string;
  };
  compact_evidence: Array<{
    ref: string;
    path: string;
    source_kind: "repo_code" | "repo_doc" | "docs_source";
    role:
      | "definition"
      | "ui_surface"
      | "state_model"
      | "tool_registry"
      | "runtime_behavior"
      | "terminal_authority"
      | "test_contract"
      | "supporting_context";
    excerpt: string;
    why_relevant: string;
  }>;
  evidence_summary: {
    files_considered: number;
    spans_selected: number;
    has_code_evidence: boolean;
    has_doc_evidence: boolean;
    has_test_evidence: boolean;
  };
  model_instruction: string;
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const clip = (value: unknown, max = 620): string => {
  const text = readString(value)?.replace(/\s+/g, " ").trim() ?? "";
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const artifactPayload = (artifact: ArtifactLike): RecordLike | null => readRecord(artifact.payload);

const artifactId = (artifact: ArtifactLike): string | null =>
  readString(artifact.artifact_id) ?? readString(artifactPayload(artifact)?.artifact_id);

const isRepoObservationArtifact = (artifact: ArtifactLike): boolean => {
  const payload = artifactPayload(artifact);
  return (
    readString(artifact.kind) === "repo_code_evidence_observation" ||
    readString(payload?.schema) === "helix.repo_code_evidence_observation.v1"
  );
};

const evidenceRoleForPath = (path: string, excerpt: string): HelixRepoDocsSynthesisPacket["compact_evidence"][number]["role"] => {
  const haystack = `${path}\n${excerpt}`.toLowerCase();
  if (/test|spec|__tests__/.test(haystack)) return "test_contract";
  if (/terminal|authority|receipt|final[_-]?answer|voice_delivery|confirm_speak/.test(haystack)) return "terminal_authority";
  if (/workstation-dynamic-tools|panelcapabilities|panelactionadapters|tool[_-]?registry|capability/.test(haystack)) return "tool_registry";
  if (/client\/src\/store\/|use.*store\.ts$|store\.ts$|createRoom|appendSituationEvent|situationroomstore/.test(haystack)) return "state_model";
  if (/component|panel|ui|client\/src/.test(haystack)) return "ui_surface";
  if (/server\/(?:modules|routes)\//.test(haystack) || /runtime|observer|pipeline|situation-room|dottie|voice|commentary|manifest/.test(haystack)) return "runtime_behavior";
  if (/docs|readme|architecture|contract|manifest|preset|definition/.test(haystack)) return "definition";
  return "supporting_context";
};

const selectRoleDiverseEvidence = (
  entries: HelixRepoDocsSynthesisPacket["compact_evidence"],
  maxEvidenceItems: number,
): HelixRepoDocsSynthesisPacket["compact_evidence"] => {
  const rolePriority: Record<HelixRepoDocsSynthesisPacket["compact_evidence"][number]["role"], number> = {
    definition: 0,
    runtime_behavior: 1,
    tool_registry: 2,
    terminal_authority: 3,
    ui_surface: 4,
    state_model: 5,
    test_contract: 6,
    supporting_context: 7,
  };
  const sorted = [...entries].sort((left, right) =>
    rolePriority[left.role] - rolePriority[right.role] || left.path.localeCompare(right.path) || left.ref.localeCompare(right.ref),
  );
  const selected: HelixRepoDocsSynthesisPacket["compact_evidence"] = [];
  const selectedRefs = new Set<string>();
  const selectedPaths = new Set<string>();
  const pathCounts = new Map<string, number>();
  const add = (entry: HelixRepoDocsSynthesisPacket["compact_evidence"][number]): boolean => {
    if (selected.length >= maxEvidenceItems || selectedRefs.has(entry.ref)) return false;
    selected.push(entry);
    selectedRefs.add(entry.ref);
    selectedPaths.add(entry.path);
    pathCounts.set(entry.path, (pathCounts.get(entry.path) ?? 0) + 1);
    return true;
  };
  const roles = Array.from(new Set(sorted.map((entry) => entry.role)));
  for (const role of roles) {
    const roleEntry =
      sorted.find((entry) => entry.role === role && !selectedRefs.has(entry.ref) && !selectedPaths.has(entry.path)) ??
      sorted.find((entry) => entry.role === role && !selectedRefs.has(entry.ref));
    if (!roleEntry) continue;
    add(roleEntry);
    if (selected.length >= maxEvidenceItems) return selected;
  }
  for (const entry of sorted) {
    if (selected.length >= maxEvidenceItems) break;
    if (selectedRefs.has(entry.ref) || selectedPaths.has(entry.path)) continue;
    add(entry);
  }
  for (const entry of sorted) {
    if (selected.length >= maxEvidenceItems) break;
    if (selectedRefs.has(entry.ref) || (pathCounts.get(entry.path) ?? 0) >= 2) continue;
    add(entry);
  }
  for (const entry of sorted) {
    if (selectedRefs.has(entry.ref)) continue;
    add(entry);
    if (selected.length >= maxEvidenceItems) break;
  }
  return selected;
};

const sourceKindForPath = (
  routeFamily: "repo_evidence" | "docs_source",
  value: unknown,
): "repo_code" | "repo_doc" | "docs_source" => {
  const source = readString(value);
  if (source === "repo_doc" || source === "repo_code" || source === "docs_source") return source;
  if (routeFamily === "docs_source") return "docs_source";
  return "repo_code";
};

const spanRecordsFromObservation = (
  observation: RecordLike,
  routeFamily: "repo_evidence" | "docs_source",
): HelixRepoDocsSynthesisPacket["compact_evidence"] => {
  return readArray(observation.spans)
    .map(readRecord)
    .filter((span): span is RecordLike => Boolean(span))
    .map((span) => {
      const path = readString(span.path) ?? "repo evidence";
      const excerpt = clip(span.sanitized_excerpt ?? span.excerpt ?? span.raw_excerpt, 620);
      const ref = readString(span.ref) ?? path;
      return {
        ref,
        path,
        source_kind: sourceKindForPath(routeFamily, span.source_kind),
        role: evidenceRoleForPath(path, excerpt),
        excerpt,
        why_relevant: clip(span.reason ?? `${path} supports the repo/docs synthesis answer.`, 240),
      };
    })
    .filter((entry) => entry.excerpt || entry.path);
};

const observationRecordsFromArtifact = (artifact: ArtifactLike): RecordLike[] => {
  const payload = artifactPayload(artifact);
  if (!payload) return [];
  return [payload];
};

export function buildRepoDocsSynthesisPacket(input: {
  turnId: string;
  promptText: string;
  routeFamily: "repo_evidence" | "docs_source";
  repoObservation?: HelixRepoCodeEvidenceObservation | RecordLike | null;
  docsObservation?: RecordLike | null;
  artifactLedger: ArtifactLike[];
  maxEvidenceItems?: number;
}): HelixRepoDocsSynthesisPacket {
  const maxEvidenceItems = Math.max(1, input.maxEvidenceItems ?? 8);
  const observationRecords = [
    ...(input.repoObservation ? [input.repoObservation as RecordLike] : []),
    ...(input.docsObservation ? [input.docsObservation] : []),
    ...input.artifactLedger.filter(isRepoObservationArtifact).flatMap(observationRecordsFromArtifact),
  ];
  const sourceObservationRefs = unique([
    ...observationRecords.map((record) => readString(record.artifact_id)).filter((entry): entry is string => Boolean(entry)),
    ...input.artifactLedger.filter(isRepoObservationArtifact).map(artifactId).filter((entry): entry is string => Boolean(entry)),
  ]);
  const byRef = new Map<string, HelixRepoDocsSynthesisPacket["compact_evidence"][number]>();
  for (const record of observationRecords) {
    for (const evidence of spanRecordsFromObservation(record, input.routeFamily)) {
      if (!byRef.has(evidence.ref)) byRef.set(evidence.ref, evidence);
    }
  }
  const compactEvidence = selectRoleDiverseEvidence(Array.from(byRef.values()), maxEvidenceItems);
  const files = unique(compactEvidence.map((entry) => entry.path));
  const hasCodeEvidence = compactEvidence.some((entry) => entry.source_kind === "repo_code" || /\.(?:ts|tsx|js|jsx|py)$/i.test(entry.path));
  const hasDocEvidence = compactEvidence.some((entry) => entry.source_kind === "repo_doc" || /\.(?:md|mdx|txt)$/i.test(entry.path));
  const hasTestEvidence = compactEvidence.some((entry) => entry.role === "test_contract");
  const concept =
    observationRecords.map((record) => readString(record.concept)).find(Boolean) ??
    readString(readRecord(input.artifactLedger.find(isRepoObservationArtifact)?.payload)?.concept) ??
    undefined;
  const requiredCapability = input.routeFamily === "repo_evidence"
    ? "model.synthesize_from_repo_evidence"
    : "model.synthesize_from_docs_evidence";
  const requiredTerminalKind = input.routeFamily === "repo_evidence"
    ? "repo_code_evidence_answer"
    : "model_synthesized_answer";
  const isDottieConcept = /\bdottie\b/i.test(`${concept} ${input.promptText}`);
  const citationInstruction =
    "When citing, do not put each source on its own bullet line; use one short parenthetical citation or one compact Sources sentence with semicolon-separated refs.";
  const dottieInstruction = isDottieConcept
    ? "For Auntie Dottie, answer the identity question first: explain that it is a Dottie/Situation Room observer or preset for public commentary/evidence, mention voice proposals require confirmation when supported, and do not present it as terminal-answer authority."
    : "";

  return {
    schema: HELIX_REPO_DOCS_SYNTHESIS_PACKET_SCHEMA,
    turn_id: input.turnId,
    packet_id: `${input.turnId}:repo_docs_synthesis_packet`,
    route_family: input.routeFamily,
    user_question: input.promptText,
    concept,
    source_observation_refs: sourceObservationRefs,
    answer_contract: {
      required_model_step_capability: requiredCapability,
      required_terminal_kind: requiredTerminalKind,
      must_answer_meaning: true,
      must_include_compact_refs: true,
      must_not_emit_file_inventory: true,
      must_not_claim_missing_evidence_when_observations_exist: true,
    },
    compact_evidence: compactEvidence,
    evidence_summary: {
      files_considered: files.length,
      spans_selected: compactEvidence.length,
      has_code_evidence: hasCodeEvidence,
      has_doc_evidence: hasDocEvidence,
      has_test_evidence: hasTestEvidence,
    },
    model_instruction: [
      "Answer the user's question directly from the compact evidence.",
      "Explain what the evidence means; do not answer with a file list or raw excerpt dump.",
      "For broad internal concepts, synthesize across evidence roles: definition, UI/control surface, state model, tool/capability registry, runtime behavior, and authority boundaries when present.",
      "Preserve authority claims exactly: receipts are observations/supporting artifacts, not final-answer authority.",
      "Do not claim evidence is missing when compact_evidence is non-empty.",
      "Use compact refs from compact_evidence as support_refs for terminal authority.",
      citationInstruction,
      dottieInstruction,
      input.routeFamily === "repo_evidence"
        ? "The required model step is model.synthesize_from_repo_evidence and the terminal product is repo_code_evidence_answer."
        : "The required model step is model.synthesize_from_docs_evidence and the terminal product is model_synthesized_answer.",
    ].filter(Boolean).join(" "),
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function collectRepoDocsSynthesisPacketSupportRefs(packet: HelixRepoDocsSynthesisPacket): string[] {
  return unique([
    ...packet.compact_evidence.map((entry) => entry.ref),
    ...packet.source_observation_refs,
  ]).slice(0, 12);
}

export function attachSynthesisSupportRefs<T extends RecordLike>(input: {
  draft: T;
  packet: HelixRepoDocsSynthesisPacket;
  observation?: RecordLike | null;
}): T {
  const existing = unique([
    ...readArray(input.draft.artifact_refs).map(readString).filter((entry): entry is string => Boolean(entry)),
    ...readArray(input.draft.support_refs).map(readString).filter((entry): entry is string => Boolean(entry)),
  ]);
  const observationRefs = [
    ...readArray(input.observation?.evidence_refs).map(readString).filter((entry): entry is string => Boolean(entry)),
    ...readArray(input.observation?.spans)
      .map(readRecord)
      .map((span) => readString(span?.ref) ?? readString(span?.path))
      .filter((entry): entry is string => Boolean(entry)),
  ];
  const refs = unique([
    ...existing,
    ...collectRepoDocsSynthesisPacketSupportRefs(input.packet),
    ...observationRefs,
  ]).slice(0, 12);
  return {
    ...input.draft,
    artifact_refs: refs,
    support_refs: refs,
  };
}

export function classifyRepoDocsSynthesisAttemptStatus(input: {
  ok: boolean;
  violations: readonly string[];
  staleFallbackText?: boolean;
}): HelixRepoDocsSynthesisAttemptStatus {
  const violations = new Set(input.violations);
  if (input.ok) return "succeeded";
  if (violations.has("empty_answer")) return "empty";
  if (violations.has("canned_fallback_text") || input.staleFallbackText) return "stale";
  if (violations.has("renderer_hostile_text")) return "renderer_hostile";
  if (violations.has("unsupported_repo_claim")) return "unsupported_claims";
  if (violations.has("missing_support_refs")) return "missing_support_refs";
  if (violations.has("excerpt_like_answer") || violations.has("file_list_only")) return "excerpt_like";
  return "failed";
}

export function buildRepoDocsSynthesisRepairInstruction(input: {
  violations: readonly string[];
  packet: HelixRepoDocsSynthesisPacket | null;
}): string {
  const violations = new Set(input.violations);
  const prefix =
    "The repo/docs evidence retrieval succeeded, but the previous draft was not a valid terminal answer.";
  const evidenceRefs = input.packet?.compact_evidence
    .map((entry) => `${entry.ref} (${entry.role})`)
    .slice(0, 8)
    .join("; ");
  const evidenceSentence = evidenceRefs
    ? ` Use these compact evidence refs as support, not as the answer itself: ${evidenceRefs}.`
    : "";
  const dottieInstruction = input.packet && /\bdottie\b/i.test(`${input.packet.concept ?? ""} ${input.packet.user_question}`)
    ? " For Auntie Dottie, write two or three sentences that start by explaining what it is in this app before adding caveats about observer/preset behavior, commentary, or voice confirmation."
    : "";
  const common =
    " Write one concise natural-language synthesis that directly answers the user. Explain what the evidence establishes. Include compact support refs only as short inline citations or one semicolon-separated Sources sentence. Do not put each source on its own bullet line, do not paste code, do not list files as the answer, and do not claim evidence is missing.";
  if (violations.has("excerpt_like_answer") || violations.has("file_list_only")) {
    return `${prefix}${common}${dottieInstruction}${evidenceSentence} The previous answer was excerpt-like or file-list-like; replace it with prose about meaning and behavior.`;
  }
  if (violations.has("unsupported_repo_claim")) {
    return `${prefix}${common}${evidenceSentence} The previous answer incorrectly claimed evidence was missing even though compact evidence exists.`;
  }
  if (violations.has("policy_claim_inversion")) {
    return `${prefix}${common}${evidenceSentence} The previous answer inverted an authority rule. Preserve this doctrine when supported by evidence: receipts/tool outputs are observations or support, while final answers require model synthesis and terminal authority.`;
  }
  if (violations.has("missing_support_refs")) {
    return `${prefix}${common}${evidenceSentence} The previous answer lacked support refs; attach refs from the synthesis packet.`;
  }
  if (violations.has("wrong_model_step_identity") || violations.has("missing_model_synthesis")) {
    return `${prefix}${common}${evidenceSentence} The retry must be authored as the post-observation synthesis step for the repo/docs evidence.`;
  }
  return `${prefix}${common}${evidenceSentence}`;
}

export function repoDocsSynthesisTerminalErrorCode(input: {
  status: HelixRepoDocsSynthesisAttemptStatus;
  repairAttempted: boolean;
  violations: readonly string[];
}): string {
  const suffix = input.repairAttempted ? "_after_repair" : "";
  const violations = new Set(input.violations);
  if (violations.has("file_list_only")) return `repo_docs_synthesis_file_inventory${suffix}`;
  if (input.status === "excerpt_like" || violations.has("excerpt_like_answer")) {
    return `repo_docs_synthesis_excerpt_like${suffix}`;
  }
  if (input.status === "unsupported_claims") return `repo_docs_synthesis_refusal_after_evidence${suffix}`;
  if (violations.has("policy_claim_inversion")) return `repo_docs_synthesis_policy_claim_inversion${suffix}`;
  if (input.status === "missing_support_refs") return `repo_docs_synthesis_missing_support_refs${suffix}`;
  if (violations.has("wrong_model_step_identity") || violations.has("missing_model_synthesis")) {
    return `repo_docs_synthesis_wrong_model_step${suffix}`;
  }
  if (input.status === "empty") return `repo_docs_synthesis_empty${suffix}`;
  return `repo_docs_synthesis_quality_failed${suffix}`;
}
