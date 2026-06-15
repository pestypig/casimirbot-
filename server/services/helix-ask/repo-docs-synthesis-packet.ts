import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
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
  | "exact_section_evidence_missing"
  | "missing_exact_section_terms"
  | "unsupported_exact_section_terms"
  | "shallow_broad_concept_answer"
  | "missing_broad_concept_coverage"
  | "insufficient_evidence_role_coverage"
  | "response_language_contract_violated";

export type HelixRepoDocsAnswerCoveragePoint =
  | "identity"
  | "responsibilities"
  | "workflow_or_surfaces"
  | "evidence_or_authority_boundary";

export type HelixSourceTargetExactContract = {
  schema: "helix.source_target_exact_contract.v1";
  contract_id: string;
  turn_id: string;
  requested_source_kind:
    | "repo_heading_section"
    | "repo_path"
    | "repo_symbol"
    | "repo_source";
  requested_source_identity: string;
  requested_path?: string;
  requested_heading?: string;
  extraction_status: "found" | "ambiguous" | "missing" | "unsupported";
  evidence_refs: string[];
  evidence_hash: string;
  required_terms: string[];
  required_claims: string[];
  unsupported_terms: string[];
  unsupported_claims: string[];
  terminal_allowed: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

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
  exact_section_contract?: {
    contract_kind: "field_list";
    requested_path?: string;
    requested_heading?: string;
    extraction_status?: "found" | "ambiguous" | "missing" | "unsupported";
    required_terms: string[];
    evidence_refs: string[];
    evidence_hash?: string;
    evidence_missing: boolean;
  };
  source_target_exact_contract?: HelixSourceTargetExactContract;
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

const hashContractEvidence = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

const normalizePath = (value: string): string =>
  value.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/[.,;:!?]+$/g, "").trim().toLowerCase();

const promptPathHint = (promptText: string): string | undefined => {
  const match = promptText.match(/\b((?:docs|server|client|shared|README)\b[^\s"',)]*)/i);
  return match?.[1] ? normalizePath(match[1]) : undefined;
};

const promptHeadingHint = (promptText: string): string | undefined => {
  const quotedHeading = promptText.match(/\bheading\s+["']([^"']{3,120})["']/i)?.[1];
  if (quotedHeading) return quotedHeading.trim();
  const afterHeading = promptText.match(/\bheading\s+([A-Z][A-Za-z0-9 /_-]{3,120})(?:\.|,|\?|$)/)?.[1];
  return afterHeading?.trim();
};

const exactFieldListPrompt = (promptText: string): boolean =>
  /\b(?:list|what|which|find)\b[\s\S]{0,180}\b(?:required\s+fields?|fields?\s+under|loop\s+fields?)\b/i.test(promptText) ||
  /\brequired\s+fields?\b/i.test(promptText);

const extractSnakeTerms = (text: string): string[] =>
  unique((text.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g) ?? []))
    .filter((term) => term.length >= 5)
    .slice(0, 40);

const extractRequiredFieldTerms = (text: string): string[] => {
  const requiredIndex = text.search(/\brequired\s+fields?\b/i);
  if (requiredIndex >= 0) {
    const requiredSlice = text.slice(requiredIndex);
    const fenced = requiredSlice.match(/```[^\n]*\n([\s\S]*?)```/);
    if (fenced?.[1]) return extractSnakeTerms(fenced[1]);
    const bounded = requiredSlice.split(/\n\s*(?:The shared loop boundary|Patch instructions|Receipt terminal products)\b/i)[0] ?? requiredSlice;
    const terms = extractSnakeTerms(bounded);
    if (terms.length > 0) return terms;
  }
  return extractSnakeTerms(text);
};

const buildExactSectionContract = (input: {
  promptText: string;
  evidence: HelixRepoDocsSynthesisPacket["compact_evidence"];
}): HelixRepoDocsSynthesisPacket["exact_section_contract"] | undefined => {
  if (!exactFieldListPrompt(input.promptText)) return undefined;
  const requestedPath = promptPathHint(input.promptText);
  const requestedHeading = promptHeadingHint(input.promptText);
  const headingNeedle = requestedHeading?.toLowerCase();
  const candidates = input.evidence.filter((entry) => {
    const pathOk = requestedPath ? normalizePath(entry.path).includes(requestedPath) : true;
    const headingOk = headingNeedle ? entry.excerpt.toLowerCase().includes(headingNeedle) : true;
    return pathOk && headingOk;
  });
  const fallbackCandidates = candidates.length > 0
    ? candidates
    : input.evidence.filter((entry) => requestedPath ? normalizePath(entry.path).includes(requestedPath) : true);
  const requiredTerms = unique(fallbackCandidates.flatMap((entry) => extractRequiredFieldTerms(entry.excerpt)));
  if (!requestedPath && !requestedHeading && requiredTerms.length === 0) return undefined;
  const evidenceRefs = fallbackCandidates.map((entry) => entry.ref);
  const extractionStatus: HelixSourceTargetExactContract["extraction_status"] =
    requiredTerms.length > 0 && evidenceRefs.length > 0 ? "found" : "missing";
  return {
    contract_kind: "field_list",
    requested_path: requestedPath,
    requested_heading: requestedHeading,
    extraction_status: extractionStatus,
    required_terms: requiredTerms,
    evidence_refs: evidenceRefs,
    evidence_hash: hashContractEvidence({
      requestedPath,
      requestedHeading,
      evidenceRefs,
      requiredTerms,
    }),
    evidence_missing: requiredTerms.length === 0,
  };
};

const buildSourceTargetExactContract = (input: {
  turnId: string;
  exactSectionContract?: HelixRepoDocsSynthesisPacket["exact_section_contract"];
}): HelixSourceTargetExactContract | undefined => {
  const exact = input.exactSectionContract;
  if (!exact) return undefined;
  const requestedPath = exact.requested_path;
  const requestedHeading = exact.requested_heading;
  const requestedSourceKind: HelixSourceTargetExactContract["requested_source_kind"] =
    requestedPath && requestedHeading
      ? "repo_heading_section"
      : requestedPath
        ? "repo_path"
        : "repo_source";
  const requestedSourceIdentity =
    requestedPath && requestedHeading
      ? `${requestedPath}#${requestedHeading}`
      : requestedPath ?? requestedHeading ?? "repo_source";
  const extractionStatus =
    exact.extraction_status ??
    (exact.evidence_missing || exact.required_terms.length === 0 || exact.evidence_refs.length === 0 ? "missing" : "found");
  const evidenceHash = exact.evidence_hash ?? hashContractEvidence({
    requestedSourceKind,
    requestedSourceIdentity,
    evidenceRefs: exact.evidence_refs,
    requiredTerms: exact.required_terms,
  });
  return {
    schema: "helix.source_target_exact_contract.v1",
    contract_id: `${input.turnId}:source_target_exact_contract`,
    turn_id: input.turnId,
    requested_source_kind: requestedSourceKind,
    requested_source_identity: requestedSourceIdentity,
    ...(requestedPath ? { requested_path: requestedPath } : {}),
    ...(requestedHeading ? { requested_heading: requestedHeading } : {}),
    extraction_status: extractionStatus,
    evidence_refs: exact.evidence_refs,
    evidence_hash: evidenceHash,
    required_terms: exact.required_terms,
    required_claims: [],
    unsupported_terms: [],
    unsupported_claims: [],
    terminal_allowed: extractionStatus === "found" && exact.evidence_refs.length > 0 && exact.required_terms.length > 0,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const safeRepoRelativePath = (value: string | undefined): string | null => {
  if (!value) return null;
  const normalized = normalizePath(value);
  if (!/^(?:docs|server|client|shared|README)(?:\/|\.|$)/i.test(normalized)) return null;
  if (normalized.includes("..") || path.isAbsolute(normalized)) return null;
  return normalized;
};

const readExactHeadingSection = (input: {
  requestedPath?: string;
  requestedHeading?: string;
}): HelixRepoDocsSynthesisPacket["compact_evidence"][number] | null => {
  const repoPath = safeRepoRelativePath(input.requestedPath);
  if (!repoPath || !input.requestedHeading) return null;
  const root = process.cwd();
  const absolutePath = path.resolve(root, repoPath);
  if (!absolutePath.toLowerCase().startsWith(path.resolve(root).toLowerCase())) return null;
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return null;
  const lines = fs.readFileSync(absolutePath, "utf8").split(/\r?\n/);
  const escapedHeading = input.requestedHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingRe = new RegExp(`^(#{1,6})\\s+${escapedHeading}\\s*$`, "i");
  const startIndex = lines.findIndex((line) => headingRe.test(line.trim()));
  if (startIndex < 0) return null;
  const headingLevel = lines[startIndex]?.trim().match(/^(#{1,6})/)?.[1]?.length ?? 6;
  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const heading = lines[index]?.trim().match(/^(#{1,6})\s+\S/);
    if (heading && heading[1].length <= headingLevel) {
      endIndex = index;
      break;
    }
  }
  const sectionLines = lines.slice(startIndex, endIndex);
  const excerpt = sectionLines.join("\n").trim();
  if (!excerpt) return null;
  const ref = `${repoPath}:${startIndex + 1}-${endIndex}`;
  return {
    ref,
    path: repoPath,
    source_kind: "repo_doc",
    role: "definition",
    excerpt: excerpt.length > 1600 ? `${excerpt.slice(0, 1599).trim()}...` : excerpt,
    why_relevant: `Exact heading section "${input.requestedHeading}" from ${repoPath}.`,
  };
};

const supplementExactSectionEvidence = (input: {
  promptText: string;
  evidence: HelixRepoDocsSynthesisPacket["compact_evidence"];
  maxEvidenceItems: number;
}): HelixRepoDocsSynthesisPacket["compact_evidence"] => {
  if (!exactFieldListPrompt(input.promptText)) return input.evidence;
  const requestedPath = promptPathHint(input.promptText);
  const requestedHeading = promptHeadingHint(input.promptText);
  const contract = buildExactSectionContract({
    promptText: input.promptText,
    evidence: input.evidence,
  });
  if (contract && contract.required_terms.length > 0) return input.evidence;
  const exactEvidence = readExactHeadingSection({ requestedPath, requestedHeading });
  if (!exactEvidence) return input.evidence;
  const withoutDuplicate = input.evidence.filter((entry) => entry.ref !== exactEvidence.ref);
  return [exactEvidence, ...withoutDuplicate].slice(0, Math.max(1, input.maxEvidenceItems));
};

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
  let compactEvidence = selectRoleDiverseEvidence(Array.from(byRef.values()), maxEvidenceItems);
  compactEvidence = supplementExactSectionEvidence({
    promptText: input.promptText,
    evidence: compactEvidence,
    maxEvidenceItems,
  });
  const exactSectionContract = buildExactSectionContract({
    promptText: input.promptText,
    evidence: compactEvidence,
  });
  const sourceTargetExactContract = buildSourceTargetExactContract({
    turnId: input.turnId,
    exactSectionContract,
  });
  const files = unique(compactEvidence.map((entry) => entry.path));
  const hasCodeEvidence = compactEvidence.some((entry) => entry.source_kind === "repo_code" || /\.(?:ts|tsx|js|jsx|py)$/i.test(entry.path));
  const hasDocEvidence = compactEvidence.some((entry) => entry.source_kind === "repo_doc" || /\.(?:md|mdx|txt)$/i.test(entry.path));
  const hasTestEvidence = compactEvidence.some((entry) => entry.role === "test_contract");
  const concept =
    observationRecords.map((record) => readString(record.concept)).find(Boolean) ??
    readString(readRecord(input.artifactLedger.find(isRepoObservationArtifact)?.payload)?.concept) ??
    undefined;
  const aliasEntry = findRepoConceptAliasEntry(concept ?? input.promptText);
  const broadConcept = Boolean(aliasEntry?.broad_concept);
  const requiredEvidenceRoles = aliasEntry?.required_evidence_roles ?? [];
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
  const requiredCoveragePoints: HelixRepoDocsAnswerCoveragePoint[] = broadConcept
    ? ["identity", "responsibilities", "workflow_or_surfaces", "evidence_or_authority_boundary"]
    : ["identity"];
  const answerDepthGuidance = broadConcept
    ? "Write an internal concept overview, not a label definition: cover what it is, what responsibilities it has, how the UI/tool/runtime pieces connect, and what boundary or uncertainty the evidence establishes."
    : "Write a concise direct answer from the evidence.";

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
    answer_depth_contract: {
      depth_mode: broadConcept ? "internal_concept_overview" : "concise_fact",
      min_word_count: broadConcept ? 90 : 24,
      min_distinct_evidence_roles: broadConcept ? Math.min(3, Math.max(2, requiredEvidenceRoles.length || 2)) : 1,
      required_coverage_points: requiredCoveragePoints,
      required_evidence_roles: requiredEvidenceRoles,
      guidance: answerDepthGuidance,
    },
    ...(exactSectionContract ? { exact_section_contract: exactSectionContract } : {}),
    ...(sourceTargetExactContract ? { source_target_exact_contract: sourceTargetExactContract } : {}),
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
      answerDepthGuidance,
      broadConcept
        ? "Use a compact structure with 3-5 short paragraphs or bullets: identity, responsibilities, workflow/surfaces, authority boundary, and sources."
        : "",
      "Preserve authority claims exactly: receipts are observations/supporting artifacts, not final-answer authority.",
      "Do not claim evidence is missing when compact_evidence is non-empty.",
      "Use compact refs from compact_evidence as support_refs for terminal authority.",
      exactSectionContract
        ? "For exact section field-list questions, copy only required_terms from exact_section_contract; do not invent field names, aliases, or adjacent contract labels."
        : "",
      sourceTargetExactContract
        ? "The source_target_exact_contract is the exact source identity gate. Synthesize only after honoring its requested_source_identity, evidence_refs, required_terms, and terminal_allowed state."
        : "",
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
    ...(packet.source_target_exact_contract ? [packet.source_target_exact_contract.contract_id] : []),
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
  if (violations.has("response_language_contract_violated")) return "failed";
  if (
    violations.has("shallow_broad_concept_answer") ||
    violations.has("missing_broad_concept_coverage") ||
    violations.has("insufficient_evidence_role_coverage")
  ) {
    return "failed";
  }
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
  if (
    violations.has("exact_section_evidence_missing") ||
    violations.has("missing_exact_section_terms") ||
    violations.has("unsupported_exact_section_terms")
  ) {
    const terms = input.packet?.source_target_exact_contract?.required_terms.join(", ") ??
      input.packet?.exact_section_contract?.required_terms.join(", ");
    const termSentence = terms
      ? ` The exact section requires these terms: ${terms}.`
      : "";
    return `${prefix}${common}${evidenceSentence}${termSentence} The previous answer did not stay bound to the requested exact-source contract. Rewrite from the exact heading/path evidence only, include every required field term, and remove any invented field names or adjacent contract labels.`;
  }
  if (violations.has("missing_support_refs")) {
    return `${prefix}${common}${evidenceSentence} The previous answer lacked support refs; attach refs from the synthesis packet.`;
  }
  if (
    violations.has("shallow_broad_concept_answer") ||
    violations.has("missing_broad_concept_coverage") ||
    violations.has("insufficient_evidence_role_coverage")
  ) {
    const depthGuidance = input.packet?.answer_depth_contract?.guidance
      ? ` ${input.packet.answer_depth_contract.guidance}`
      : "";
    return `${prefix}${common}${depthGuidance}${evidenceSentence} The previous answer was too shallow for a broad repo concept; rewrite it as an internal concept overview that covers identity, responsibilities, workflow or UI/runtime surfaces, and authority boundaries or uncertainty.`;
  }
  if (violations.has("wrong_model_step_identity") || violations.has("missing_model_synthesis")) {
    return `${prefix}${common}${evidenceSentence} The retry must be authored as the post-observation synthesis step for the repo/docs evidence.`;
  }
  if (violations.has("response_language_contract_violated")) {
    return `${prefix}${common}${evidenceSentence} The previous answer violated the response language contract. Rewrite the answer in the requested response language while preserving file paths, code identifiers, API names, and exact quoted source text unchanged.`;
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
  if (
    violations.has("exact_section_evidence_missing") ||
    violations.has("missing_exact_section_terms") ||
    violations.has("unsupported_exact_section_terms")
  ) {
    return `repo_docs_synthesis_exact_section_mismatch${suffix}`;
  }
  if (
    violations.has("shallow_broad_concept_answer") ||
    violations.has("missing_broad_concept_coverage") ||
    violations.has("insufficient_evidence_role_coverage")
  ) {
    return `repo_docs_synthesis_depth_incomplete${suffix}`;
  }
  if (input.status === "missing_support_refs") return `repo_docs_synthesis_missing_support_refs${suffix}`;
  if (violations.has("wrong_model_step_identity") || violations.has("missing_model_synthesis")) {
    return `repo_docs_synthesis_wrong_model_step${suffix}`;
  }
  if (violations.has("response_language_contract_violated")) {
    return `repo_docs_synthesis_response_language_contract_violated${suffix}`;
  }
  if (input.status === "empty") return `repo_docs_synthesis_empty${suffix}`;
  return `repo_docs_synthesis_quality_failed${suffix}`;
}
