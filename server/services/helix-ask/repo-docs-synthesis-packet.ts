import type { HelixRepoCodeEvidenceObservation } from "@shared/helix-repo-code-evidence-observation";

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

type RecordLike = Record<string, unknown>;

export const HELIX_REPO_DOCS_SYNTHESIS_PACKET_SCHEMA =
  "helix.repo_docs_synthesis_packet.v1" as const;

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
  compact_evidence: Array<{
    ref: string;
    path: string;
    source_kind: "repo_code" | "repo_doc" | "docs_source";
    role:
      | "definition"
      | "ui_surface"
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
  if (/component|panel|ui|client\/src/.test(haystack)) return "ui_surface";
  if (/runtime|observer|pipeline|situation-room|dottie|voice|commentary|manifest/.test(haystack)) return "runtime_behavior";
  if (/docs|readme|architecture|contract|manifest|preset|definition/.test(haystack)) return "definition";
  return "supporting_context";
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
  const rolePriority: Record<HelixRepoDocsSynthesisPacket["compact_evidence"][number]["role"], number> = {
    definition: 0,
    runtime_behavior: 1,
    tool_registry: 2,
    terminal_authority: 3,
    ui_surface: 4,
    test_contract: 5,
    supporting_context: 6,
  };
  const compactEvidence = Array.from(byRef.values())
    .sort((left, right) => rolePriority[left.role] - rolePriority[right.role] || left.path.localeCompare(right.path))
    .slice(0, maxEvidenceItems);
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
      "Do not claim evidence is missing when compact_evidence is non-empty.",
      "Use compact refs from compact_evidence as support_refs for terminal authority.",
      input.routeFamily === "repo_evidence"
        ? "The required model step is model.synthesize_from_repo_evidence and the terminal product is repo_code_evidence_answer."
        : "The required model step is model.synthesize_from_docs_evidence and the terminal product is model_synthesized_answer.",
    ].join(" "),
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
