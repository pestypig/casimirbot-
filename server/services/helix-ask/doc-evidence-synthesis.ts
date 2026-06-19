import type {
  HelixDocEvidenceSynthesisAnswer,
  HelixDocEvidenceSynthesisKind,
} from "@shared/helix-doc-evidence-synthesis-answer";
import type { HelixCommittedAskRoute } from "@shared/helix-committed-ask-route";
import { extractUnquotedDocsMarkdownPaths } from "./docs-viewer-intent";

type RecordLike = Record<string, unknown>;

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

export type DocEvidenceSynthesisPlan = {
  schema: "helix.doc_evidence_synthesis_plan.v1";
  turn_id: string;
  synthesis_kind: HelixDocEvidenceSynthesisKind;
  required_doc_paths: string[];
  required_anchors: string[];
  required_questions: string[];
  required_observation_kinds: Array<
    "doc_summary" |
    "doc_location_result" |
    "doc_evidence_location" |
    "doc_equation_context"
  >;
  terminal_product: "doc_evidence_synthesis_answer";
  assistant_answer: false;
  raw_content_included: false;
};

export type DocEvidenceSynthesisCoverage = {
  schema: "helix.doc_evidence_synthesis_coverage.v1";
  turn_id: string;
  sufficient: boolean;
  observed_doc_paths: string[];
  observed_artifact_refs: string[];
  final_answer_draft_ref?: string | null;
  final_answer_draft_support_refs?: string[];
  support_refs_count?: number;
  missing_requirements: string[];
  assistant_answer: false;
  raw_content_included: false;
};

type DocsSynthesisTerminalContractResolution = {
  allowed: boolean;
  goalKind: string | null;
  goalKindSource: string | null;
  requiredTerminalKind: string | null;
  requiredTerminalKindSource: string | null;
  disallowReason: string | null;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const allowedTerminalArtifactKinds = (payload: RecordLike): string[] => {
  const routeProductContract = readRecord(payload.route_product_contract);
  const committedRoute = readSameTurnCommittedRoute(
    payload,
    readString(payload.turn_id) ?? readString(payload.turnId) ?? readString(payload.active_turn_id) ?? "",
  );
  return unique([
    ...readArray(routeProductContract?.allowed_terminal_artifact_kinds)
      .map(readString)
      .filter((entry): entry is string => Boolean(entry)),
    ...(committedRoute?.canonical_goal.allowed_terminal_artifact_kinds ?? []),
  ]);
};

const normalizeDocsPath = (value: unknown): string | null => {
  const text = readString(value);
  if (!text) return null;
  const cleaned = text.trim().replace(/^[('"`\s]+/, "").replace(/[)'".,;:!?]+$/g, "");
  if (!/^(?:\/?docs\/|docs\\)/i.test(cleaned)) return null;
  return cleaned.replace(/\\/g, "/").startsWith("/") ? cleaned.replace(/\\/g, "/") : `/${cleaned.replace(/\\/g, "/")}`;
};

const artifactPayload = (artifact: ArtifactLike): RecordLike | null => readRecord(artifact.payload);

const artifactKind = (artifact: ArtifactLike): string =>
  readString(artifact.kind) ?? readString(artifactPayload(artifact)?.kind) ?? "";

const artifactSchema = (artifact: ArtifactLike): string =>
  readString(artifactPayload(artifact)?.schema) ?? "";

const artifactId = (artifact: ArtifactLike): string | null =>
  readString(artifact.artifact_id) ?? readString(artifactPayload(artifact)?.artifact_id);

const artifactText = (artifact: ArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  return readString(payload?.answer_text) ?? readString(payload?.text) ?? readString(payload?.summary);
};

const stringArray = (value: unknown): string[] =>
  readArray(value).map(readString).filter((entry): entry is string => Boolean(entry));

const hasLineBackedLocationPayload = (payload: RecordLike | null): boolean => {
  if (!payload) return false;
  const candidateArrays = [
    readArray(payload.locations),
    readArray(payload.matches),
    readArray(payload.line_spans),
    readArray(payload.snippets),
  ].filter((items) => items.length > 0);
  return candidateArrays.some((items) =>
    items.some((item) => {
      const record = readRecord(item);
      if (!record) return false;
      return [
        record.line,
        record.line_number,
        record.line_start,
        record.line_end,
        record.start_line,
        record.end_line,
        record.start,
        record.end,
      ].some((value) => Number.isFinite(Number(value)));
    }),
  );
};

const readSameTurnCommittedRoute = (payload: RecordLike, turnId: string): HelixCommittedAskRoute | null => {
  const committed = readRecord(payload.committed_ask_route) as HelixCommittedAskRoute | null;
  if (committed?.schema !== "helix.committed_ask_route.v1") return null;
  if (readString(committed.turn_id) !== turnId) return null;
  return committed;
};

const recordCapabilityText = (value: unknown): string =>
  readArray(value)
    .map(readRecord)
    .map((entry) => [
      readString(entry?.requested_capability),
      readString(entry?.runtime_capability),
      readString(entry?.executed_capability),
      readString(entry?.selected_capability),
      readString(entry?.capability_hint),
    ].filter(Boolean).join(" "))
    .join(" ");

const resolveCompoundDocsSynthesisTerminalContract = (
  payload: RecordLike,
): DocsSynthesisTerminalContractResolution | null => {
  const readiness = readRecord(payload.compound_capability_synthesis_readiness);
  const readinessGoalKind = readString(readiness?.goal_kind);
  const readinessTerminalKind = readString(readiness?.required_terminal_kind);
  if (
    (readiness?.synthesis_required === true || readiness?.complete === true) &&
    readinessGoalKind === "doc_evidence_synthesis" &&
    readinessTerminalKind === "doc_evidence_synthesis_answer"
  ) {
    return {
      allowed: true,
      goalKind: "doc_evidence_synthesis",
      goalKindSource: "compound_capability_synthesis_readiness.goal_kind",
      requiredTerminalKind: "doc_evidence_synthesis_answer",
      requiredTerminalKindSource: "compound_capability_synthesis_readiness.required_terminal_kind",
      disallowReason: null,
    };
  }

  const itinerary = readRecord(payload.capability_itinerary);
  const terminalCriteria = readRecord(itinerary?.terminal_success_criteria);
  const executionState =
    readRecord(payload.capability_itinerary_execution_state) ??
    readRecord(itinerary?.execution_state);
  const contract = readRecord(itinerary?.compound_capability_contract);
  const requiredFamilies = readArray(terminalCriteria?.required_observation_families)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  const requiredCapabilities = readArray(terminalCriteria?.required_capabilities)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  const subgoals = readArray(contract?.subgoals);
  const capabilityText = [
    requiredCapabilities.join(" "),
    recordCapabilityText(itinerary?.planned_steps),
    recordCapabilityText(subgoals),
    recordCapabilityText(executionState?.compound_subgoal_ledger),
  ].join(" ");
  const hasDocsSubgoal =
    requiredFamilies.includes("docs_viewer") ||
    /docs-viewer\.(?:locate_in_doc|summarize_doc|search_docs)/i.test(capabilityText);
  const isCompound =
    requiredFamilies.length > 1 ||
    requiredCapabilities.length > 1 ||
    subgoals.length > 1;
  if (
    terminalCriteria?.requires_post_observation_synthesis === true &&
    executionState?.complete === true &&
    isCompound &&
    hasDocsSubgoal
  ) {
    return {
      allowed: true,
      goalKind: "doc_evidence_synthesis",
      goalKindSource: "capability_itinerary.terminal_success_criteria",
      requiredTerminalKind: "doc_evidence_synthesis_answer",
      requiredTerminalKindSource: "capability_itinerary.terminal_success_criteria",
      disallowReason: null,
    };
  }

  return null;
};

const resolveDocsSynthesisTerminalContract = (input: {
  turnId: string;
  payload: RecordLike;
  draftPayload?: RecordLike | null;
}): DocsSynthesisTerminalContractResolution => {
  const committedRoute = readSameTurnCommittedRoute(input.payload, input.turnId);
  const canonicalGoal = readRecord(input.payload.canonical_goal_frame);
  const committedGoal = committedRoute?.canonical_goal;
  const compoundTerminalContract = resolveCompoundDocsSynthesisTerminalContract(input.payload);
  if (compoundTerminalContract) return compoundTerminalContract;
  const committedForbidden = committedGoal?.forbidden_terminal_artifact_kinds ?? [];
  if (committedForbidden.includes("doc_evidence_synthesis_answer")) {
    return {
      allowed: false,
      goalKind: committedGoal?.goal_kind ?? null,
      goalKindSource: "committed_ask_route.canonical_goal.goal_kind",
      requiredTerminalKind: committedGoal?.required_terminal_kind ?? null,
      requiredTerminalKindSource: "committed_ask_route.canonical_goal.required_terminal_kind",
      disallowReason: "same_turn_committed_route_forbids_doc_evidence_synthesis_answer",
    };
  }
  const routeAllowedTerminalKinds = allowedTerminalArtifactKinds(input.payload);
  const candidates: Array<{
    goalKind: string | null;
    goalKindSource: string;
    requiredTerminalKind: string | null;
    requiredTerminalKindSource: string;
  }> = [
    ...(routeAllowedTerminalKinds.includes("doc_evidence_synthesis_answer") ||
      routeAllowedTerminalKinds.includes("doc_evidence_synthesis")
      ? [{
          goalKind: "doc_evidence_synthesis",
          goalKindSource: "route_product_contract.allowed_terminal_artifact_kinds",
          requiredTerminalKind: "doc_evidence_synthesis_answer",
          requiredTerminalKindSource: "route_product_contract.allowed_terminal_artifact_kinds",
        }]
      : []),
    {
      goalKind: readString(committedGoal?.goal_kind),
      goalKindSource: "committed_ask_route.canonical_goal.goal_kind",
      requiredTerminalKind: readString(committedGoal?.required_terminal_kind),
      requiredTerminalKindSource: "committed_ask_route.canonical_goal.required_terminal_kind",
    },
    {
      goalKind: readString(canonicalGoal?.goal_kind),
      goalKindSource: "canonical_goal_frame.goal_kind",
      requiredTerminalKind: readString(canonicalGoal?.required_terminal_kind),
      requiredTerminalKindSource: "canonical_goal_frame.required_terminal_kind",
    },
    {
      goalKind: readString(input.draftPayload?.goal_kind),
      goalKindSource: "final_answer_draft.goal_kind",
      requiredTerminalKind: readString(input.draftPayload?.required_terminal_kind),
      requiredTerminalKindSource: "final_answer_draft.required_terminal_kind",
    },
  ];
  const selected = candidates.find((candidate) =>
    candidate.goalKind === "doc_evidence_synthesis" &&
    candidate.requiredTerminalKind === "doc_evidence_synthesis_answer",
  );
  if (selected) {
    return {
      allowed: true,
      goalKind: selected.goalKind,
      goalKindSource: selected.goalKindSource,
      requiredTerminalKind: selected.requiredTerminalKind,
      requiredTerminalKindSource: selected.requiredTerminalKindSource,
      disallowReason: null,
    };
  }
  const fallback = candidates.find((candidate) => candidate.goalKind || candidate.requiredTerminalKind);
  return {
    allowed: false,
    goalKind: fallback?.goalKind ?? null,
    goalKindSource: fallback?.goalKindSource ?? null,
    requiredTerminalKind: fallback?.requiredTerminalKind ?? null,
    requiredTerminalKindSource: fallback?.requiredTerminalKindSource ?? null,
    disallowReason: "docs_synthesis_terminal_contract_not_found",
  };
};

const artifactIdentity = (artifact: ArtifactLike, index: number): string =>
  artifactId(artifact) ??
  [
    readString(artifact.kind),
    readString(artifactPayload(artifact)?.kind),
    readString(artifactPayload(artifact)?.schema),
    index,
  ].filter(Boolean).join(":");

export function effectiveArtifactLedger(input: {
  payload: RecordLike;
  artifactLedger?: ArtifactLike[] | null;
}): ArtifactLike[] {
  const fromArg = input.artifactLedger ?? [];
  const fromPayload = readArray(input.payload.current_turn_artifact_ledger)
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry)) as ArtifactLike[];
  const topDraft = readRecord(input.payload.final_answer_draft);
  const topDraftArtifact = topDraft
    ? [{
        artifact_id: readString(topDraft.artifact_id) ?? "final_answer_draft:top_level",
        kind: "final_answer_draft",
        payload: topDraft,
      } satisfies ArtifactLike]
    : [];
  const merged = [...fromArg, ...fromPayload, ...topDraftArtifact];
  const byIdentity = new Map<string, ArtifactLike>();
  merged.forEach((artifact, index) => {
    if (!artifact) return;
    byIdentity.set(artifactIdentity(artifact, index), artifact);
  });
  return Array.from(byIdentity.values());
}

const isDocsEvidenceArtifact = (artifact: ArtifactLike): boolean => {
  const signature = [artifactKind(artifact), artifactSchema(artifact)].join(" ");
  if (/\b(?:doc_location_result|doc_evidence_location|doc_location_matches)\b/i.test(signature)) {
    return hasLineBackedLocationPayload(artifactPayload(artifact));
  }
  return /\b(?:doc_summary|doc_equation_context|doc_equation_location|doc_calculator_evidence|agent_step_observation_packet)\b/i.test(signature);
};

const finalAnswerDraftPayload = (
  artifactLedger: ArtifactLike[],
  finalAnswerDraftRef?: string | null,
): RecordLike | null => {
  const drafts = artifactLedger.filter((artifact) => {
    if (artifactKind(artifact) === "final_answer_draft") return true;
    if (artifactSchema(artifact) === "helix.final_answer_draft.v1") return true;
    return false;
  });
  if (finalAnswerDraftRef) {
    const matched = drafts.find((artifact) => artifactId(artifact) === finalAnswerDraftRef);
    if (matched) return artifactPayload(matched);
  }
  return artifactPayload(drafts.at(-1) ?? {});
};

const finalAnswerDraftSupportRefs = (
  artifactLedger: ArtifactLike[],
  finalAnswerDraftRef?: string | null,
): string[] => {
  const payload = finalAnswerDraftPayload(artifactLedger, finalAnswerDraftRef);
  if (!payload) return [];
  const sourceDocRefs = readArray(payload.source_docs).flatMap((doc) => {
    const record = readRecord(doc);
    return [
      readString(record?.path),
      ...stringArray(record?.evidence_refs),
    ];
  });
  return unique([
    ...stringArray(payload.artifact_refs),
    ...stringArray(payload.support_refs),
    ...stringArray(payload.evidence_refs),
    ...sourceDocRefs,
  ]);
};

const pathsFromPayload = (payload: RecordLike | null): string[] => {
  if (!payload) return [];
  const direct = [
    payload.path,
    payload.source_path,
    payload.active_doc_path,
    payload.doc_path,
    payload.document_path,
  ].map(normalizeDocsPath).filter((entry): entry is string => Boolean(entry));
  const fromMatches = readArray(payload.matches).flatMap((match) => {
    const record = readRecord(match);
    return normalizeDocsPath(record?.path) ?? normalizeDocsPath(record?.source_path) ?? [];
  });
  const fromSourceDocs = readArray(payload.source_docs).flatMap((doc) => {
    const record = readRecord(doc);
    return normalizeDocsPath(record?.path) ?? [];
  });
  return unique([...direct, ...fromMatches, ...fromSourceDocs]);
};

const anchorsFromPayload = (payload: RecordLike | null): string[] => {
  if (!payload) return [];
  const direct = [
    payload.anchor,
    payload.heading,
    payload.section,
    payload.section_anchor,
    payload.title,
  ].map(readString).filter((entry): entry is string => Boolean(entry));
  const arrays = [
    ...readArray(payload.anchors),
    ...readArray(payload.cited_anchors),
    ...readArray(payload.matches),
    ...readArray(payload.snippets),
  ].flatMap((entry) => {
    const record = readRecord(entry);
    if (!record) return readString(entry) ?? [];
    return [
      readString(record.anchor),
      readString(record.heading),
      readString(record.section),
      readString(record.title),
    ].filter((value): value is string => Boolean(value));
  });
  return unique([...direct, ...arrays]).slice(0, 12);
};

const lineStartFromPayload = (payload: RecordLike | null): number | null => {
  const value = payload?.line_start ?? payload?.lineStart;
  return typeof value === "number" ? value : null;
};

const lineEndFromPayload = (payload: RecordLike | null): number | null => {
  const value = payload?.line_end ?? payload?.lineEnd;
  return typeof value === "number" ? value : null;
};

const citationLinesFromEvidence = (evidenceArtifacts: ArtifactLike[]): string[] => {
  const lines: string[] = [];
  for (const artifact of evidenceArtifacts) {
    const payload = artifactPayload(artifact);
    if (!payload || !hasLineBackedLocationPayload(payload)) continue;
    const candidates = [
      ...readArray(payload.matches),
      ...readArray(payload.locations),
      ...readArray(payload.snippets),
      ...readArray(payload.line_spans),
    ];
    for (const item of candidates) {
      const record = readRecord(item);
      if (!record) continue;
      const path =
        normalizeDocsPath(record.path) ??
        normalizeDocsPath(record.source_path) ??
        normalizeDocsPath(payload.source_path) ??
        normalizeDocsPath(payload.path) ??
        normalizeDocsPath(payload.doc_path);
      const lineStart = Number(record.line_start ?? record.start_line ?? record.line ?? record.start);
      if (!path || !Number.isFinite(lineStart)) continue;
      const lineEnd = Number(record.line_end ?? record.end_line ?? record.end ?? lineStart);
      const lineLabel = `L${lineStart}${Number.isFinite(lineEnd) && lineEnd !== lineStart ? `-L${lineEnd}` : ""}`;
      const heading = readString(record.heading) ?? readString(record.section) ?? readString(payload.heading);
      lines.push(`${path}:${lineLabel}${heading ? ` (${heading})` : ""}`);
    }
  }
  return unique(lines).slice(0, 6);
};

const appendDocEvidenceCitationLines = (answerText: string, evidenceArtifacts: ArtifactLike[]): string => {
  if (/\bDocument evidence:\b/i.test(answerText) || /\/?docs\/[^\s:]+\.md:L\d+/i.test(answerText)) {
    return answerText;
  }
  const citations = citationLinesFromEvidence(evidenceArtifacts);
  if (citations.length === 0) return answerText;
  return [
    answerText,
    "",
    "Document evidence:",
    ...citations.map((citation) => `- ${citation}`),
  ].join("\n");
};

export function buildDocEvidenceSynthesisPlan(input: {
  turnId: string;
  promptText: string;
  committedAskRoute?: HelixCommittedAskRoute | null;
}): DocEvidenceSynthesisPlan {
  const prompt = input.promptText.trim();
  const paths = extractUnquotedDocsMarkdownPaths(prompt);
  const synthesisKind: HelixDocEvidenceSynthesisKind =
    /\b(?:compare|comparison|differences?|versus|vs\.?|two-column|table)\b/i.test(prompt)
      ? "compare"
      : /\b(?:locate|find|where|anchors?|sections?|cite)\b/i.test(prompt)
          ? "locate_then_explain"
          : /\b(?:runbook|playbook|checklist|steps?\s+(?:to|for|through)|step-by-step)\b/i.test(prompt)
            ? "runbook_answer"
            : paths.length > 1
              ? "multi_doc_summary"
              : "focused_explanation";
  const requiredObservationKinds: DocEvidenceSynthesisPlan["required_observation_kinds"] =
    synthesisKind === "compare" || synthesisKind === "multi_doc_summary"
      ? ["doc_summary"]
      : ["doc_location_result", "doc_evidence_location"];
  const anchorMatches = Array.from(prompt.matchAll(/["']([^"']{3,100})["']/g))
    .map((match) => match[1]?.trim())
    .filter((entry): entry is string => Boolean(entry));
  return {
    schema: "helix.doc_evidence_synthesis_plan.v1",
    turn_id: input.turnId,
    synthesis_kind: synthesisKind,
    required_doc_paths: paths,
    required_anchors: unique(anchorMatches),
    required_questions: prompt ? [prompt] : [],
    required_observation_kinds: requiredObservationKinds,
    terminal_product: "doc_evidence_synthesis_answer",
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function readExistingDocEvidenceSynthesisPlan(
  payload: RecordLike,
): DocEvidenceSynthesisPlan | null {
  const existing = readRecord(payload.doc_evidence_synthesis_plan);
  if (existing?.schema !== "helix.doc_evidence_synthesis_plan.v1") return null;
  if (readString(existing.terminal_product) !== "doc_evidence_synthesis_answer") return null;
  const synthesisKind = readString(existing.synthesis_kind) as HelixDocEvidenceSynthesisKind | null;
  if (!synthesisKind) return null;
  return {
    schema: "helix.doc_evidence_synthesis_plan.v1",
    turn_id: readString(existing.turn_id) ?? "",
    synthesis_kind: synthesisKind,
    required_doc_paths: stringArray(existing.required_doc_paths),
    required_anchors: stringArray(existing.required_anchors),
    required_questions: stringArray(existing.required_questions),
    required_observation_kinds: stringArray(existing.required_observation_kinds)
      .filter((entry): entry is DocEvidenceSynthesisPlan["required_observation_kinds"][number] =>
        entry === "doc_summary" ||
        entry === "doc_location_result" ||
        entry === "doc_evidence_location" ||
        entry === "doc_equation_context",
      ),
    terminal_product: "doc_evidence_synthesis_answer",
    assistant_answer: false,
    raw_content_included: false,
  };
}

const synthesisKindStrength = (kind: HelixDocEvidenceSynthesisKind): number => {
  if (kind === "compare") return 50;
  if (kind === "locate_then_explain") return 45;
  if (kind === "runbook_answer") return 40;
  if (kind === "multi_doc_summary") return 35;
  return 10;
};

const planStrength = (plan: DocEvidenceSynthesisPlan | null): number => {
  if (!plan) return -1;
  return (
    synthesisKindStrength(plan.synthesis_kind) +
    plan.required_doc_paths.length * 8 +
    plan.required_questions.length * 4 +
    plan.required_anchors.length * 3 +
    plan.required_observation_kinds.length
  );
};

export function chooseStrongerDocEvidenceSynthesisPlan(
  existingPlan: DocEvidenceSynthesisPlan | null,
  rebuiltPlan: DocEvidenceSynthesisPlan,
): DocEvidenceSynthesisPlan {
  if (!existingPlan) return rebuiltPlan;
  const existingStrongOperation =
    (existingPlan.synthesis_kind === "compare" || existingPlan.synthesis_kind === "locate_then_explain") &&
    (existingPlan.required_doc_paths.length > 0 || existingPlan.required_questions.length > 0);
  const rebuiltWeakBlank =
    rebuiltPlan.synthesis_kind === "focused_explanation" &&
    rebuiltPlan.required_doc_paths.length === 0 &&
    rebuiltPlan.required_questions.length === 0;
  if (existingStrongOperation && rebuiltWeakBlank) return existingPlan;
  return planStrength(existingPlan) >= planStrength(rebuiltPlan) ? existingPlan : rebuiltPlan;
}

export function collectDocEvidenceForSynthesis(input: {
  artifactLedger: ArtifactLike[];
}): ArtifactLike[] {
  return input.artifactLedger.filter((artifact) => {
    if (!isDocsEvidenceArtifact(artifact)) return false;
    const text = artifactText(artifact);
    const paths = pathsFromPayload(artifactPayload(artifact));
    return Boolean(text || paths.length > 0 || anchorsFromPayload(artifactPayload(artifact)).length > 0);
  });
}

export function evaluateDocEvidenceSynthesisCoverage(input: {
  turnId: string;
  plan: DocEvidenceSynthesisPlan;
  evidenceArtifacts: ArtifactLike[];
}): DocEvidenceSynthesisCoverage {
  const observedRefs = input.evidenceArtifacts.map(artifactId).filter((entry): entry is string => Boolean(entry));
  const observedPaths = unique(input.evidenceArtifacts.flatMap((artifact) => pathsFromPayload(artifactPayload(artifact))));
  const missing: string[] = [];
  if (input.evidenceArtifacts.length === 0) missing.push("doc_evidence_observation");
  for (const path of input.plan.required_doc_paths) {
    const normalized = normalizeDocsPath(path) ?? path;
    if (!observedPaths.some((observed) => observed === normalized || observed.replace(/^\//, "") === normalized.replace(/^\//, ""))) {
      missing.push(`doc_path:${normalized}`);
    }
  }
  if (input.plan.synthesis_kind === "compare" && input.plan.required_doc_paths.length >= 2 && observedPaths.length < 2) {
    missing.push("multi_doc_coverage");
  }
  return {
    schema: "helix.doc_evidence_synthesis_coverage.v1",
    turn_id: input.turnId,
    sufficient: missing.length === 0,
    observed_doc_paths: observedPaths,
    observed_artifact_refs: observedRefs,
    missing_requirements: unique(missing),
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function buildDocEvidenceSynthesisModelPrompt(input: {
  promptText: string;
  plan: DocEvidenceSynthesisPlan;
  evidenceArtifacts: ArtifactLike[];
}): string {
  const evidenceLines = input.evidenceArtifacts.map((artifact, index) => {
    const payload = artifactPayload(artifact);
    const ref = artifactId(artifact) ?? `doc_evidence:${index + 1}`;
    const paths = pathsFromPayload(payload);
    const anchors = anchorsFromPayload(payload);
    const text = artifactText(artifact) ?? "";
    return [
      `Evidence ${index + 1}: ${ref}`,
      paths.length ? `Path: ${paths.join(", ")}` : null,
      anchors.length ? `Anchors: ${anchors.join("; ")}` : null,
      text ? `Observation: ${text.slice(0, 900)}` : null,
    ].filter(Boolean).join("\n");
  });
  const outputShape =
    input.plan.synthesis_kind === "compare"
      ? "Give the requested comparison, with clear differences grounded in the provided document observations."
      : input.plan.synthesis_kind === "runbook_answer" || /\bchecklist\b/i.test(input.promptText)
        ? "Give the requested checklist or runbook, grounded in the located document observations."
        : input.plan.synthesis_kind === "locate_then_explain"
          ? "Explain the located document section and cite the relevant anchor names."
          : "Answer from the provided document observations.";
  return [
    "You are the Docs evidence synthesis step for Helix Ask.",
    "Use only the document observations below. Do not call tools. Do not answer from general knowledge.",
    "Produce the final answer text for a doc_evidence_synthesis_answer.",
    outputShape,
    "",
    `Required terminal kind: doc_evidence_synthesis_answer`,
    `Synthesis kind: ${input.plan.synthesis_kind}`,
    `Required document paths: ${input.plan.required_doc_paths.join(", ") || "none"}`,
    `Required anchors: ${input.plan.required_anchors.join(", ") || "none"}`,
    "",
    "User request:",
    input.promptText,
    "",
    "Document observations:",
    evidenceLines.join("\n\n") || "No document observations were provided.",
  ].join("\n");
}

export function buildDocEvidenceSynthesisAnswerCandidate(input: {
  turnId: string;
  plan: DocEvidenceSynthesisPlan;
  answerText: string;
  evidenceArtifacts: ArtifactLike[];
  finalAnswerDraftRef?: string | null;
}): HelixDocEvidenceSynthesisAnswer | null {
  const answerText = appendDocEvidenceCitationLines(input.answerText.trim(), input.evidenceArtifacts);
  if (!answerText) return null;
  const evidenceByPath = new Map<string, { refs: Set<string>; anchors: Set<string>; title: string | null }>();
  const citedAnchors: HelixDocEvidenceSynthesisAnswer["cited_anchors"] = [];
  for (const artifact of input.evidenceArtifacts) {
    const payload = artifactPayload(artifact);
    const ref = artifactId(artifact) ?? `${input.turnId}:doc_evidence:${evidenceByPath.size}`;
    const paths = pathsFromPayload(payload);
    const anchors = anchorsFromPayload(payload);
    const title = readString(payload?.source_title) ?? readString(payload?.title) ?? null;
    for (const path of paths.length > 0 ? paths : ["unknown-doc"]) {
      const entry = evidenceByPath.get(path) ?? { refs: new Set<string>(), anchors: new Set<string>(), title };
      entry.refs.add(ref);
      if (title && !entry.title) entry.title = title;
      for (const anchor of anchors) entry.anchors.add(anchor);
      evidenceByPath.set(path, entry);
      for (const anchor of anchors) {
        citedAnchors.push({
          path,
          anchor,
          line_start: lineStartFromPayload(payload),
          line_end: lineEndFromPayload(payload),
          evidence_ref: ref,
        });
      }
    }
  }
  const supportRefs = unique([
    input.finalAnswerDraftRef ?? "",
    ...Array.from(evidenceByPath.values()).flatMap((entry) => Array.from(entry.refs)),
  ]);
  return {
    schema: "helix.doc_evidence_synthesis_answer.v1",
    artifact_id: `${input.turnId}:doc_evidence_synthesis_answer:from_final_answer_draft`,
    turn_id: input.turnId,
    answer_text: answerText,
    source_target: "docs_viewer",
    goal_kind: "doc_evidence_synthesis",
    terminal_artifact_kind: "doc_evidence_synthesis_answer",
    source_docs: Array.from(evidenceByPath.entries()).map(([path, entry]) => ({
      path,
      title: entry.title,
      evidence_refs: Array.from(entry.refs),
      anchors: Array.from(entry.anchors),
    })),
    cited_anchors: citedAnchors.slice(0, 16),
    synthesis_kind: input.plan.synthesis_kind,
    missing_requirements: [],
    support_refs: supportRefs,
    terminal_eligible: true,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function materializeDocEvidenceSynthesisAnswer(input: {
  turnId: string;
  promptText: string;
  payload: RecordLike;
  artifactLedger: ArtifactLike[];
  answerText: string;
  finalAnswerDraftRef?: string | null;
}): { ok: boolean; answer?: HelixDocEvidenceSynthesisAnswer; coverage: DocEvidenceSynthesisCoverage; blocked_reason?: string } {
  const artifactLedger = effectiveArtifactLedger({
    payload: input.payload,
    artifactLedger: input.artifactLedger,
  });
  const committedRoute = readSameTurnCommittedRoute(input.payload, input.turnId);
  const draftPayload = input.finalAnswerDraftRef
    ? artifactLedger
        .map((artifact) => readRecord(artifact.payload))
        .find((payload) => readString(payload?.artifact_id) === input.finalAnswerDraftRef)
    : readRecord(input.payload.final_answer_draft);
  const terminalContract = resolveDocsSynthesisTerminalContract({
    turnId: input.turnId,
    payload: input.payload,
    draftPayload,
  });
  const rebuiltPlan = buildDocEvidenceSynthesisPlan({
    turnId: input.turnId,
    promptText: input.promptText,
    committedAskRoute: committedRoute,
  });
  const plan = chooseStrongerDocEvidenceSynthesisPlan(
    readExistingDocEvidenceSynthesisPlan(input.payload),
    rebuiltPlan,
  );
  input.payload.doc_evidence_synthesis_plan = plan;
  const evidenceArtifacts = collectDocEvidenceForSynthesis({ artifactLedger });
  const coverage = evaluateDocEvidenceSynthesisCoverage({
    turnId: input.turnId,
    plan,
    evidenceArtifacts,
  });
  const evidenceRefs = coverage.observed_artifact_refs;
  const draftSupportRefs = finalAnswerDraftSupportRefs(artifactLedger, input.finalAnswerDraftRef);
  const hasDraftSupportForDocs = draftSupportRefs.some((ref) =>
    evidenceRefs.includes(ref) ||
    evidenceRefs.some((evidenceRef) => ref.includes(evidenceRef) || evidenceRef.includes(ref)),
  );
  coverage.final_answer_draft_ref = input.finalAnswerDraftRef ?? null;
  coverage.final_answer_draft_support_refs = draftSupportRefs;
  coverage.support_refs_count = hasDraftSupportForDocs ? draftSupportRefs.length : 0;
  if (!hasDraftSupportForDocs) {
    coverage.sufficient = false;
    coverage.missing_requirements = unique([
      ...coverage.missing_requirements,
      "final_answer_draft_doc_support_refs",
    ]);
  }
  input.payload.doc_evidence_synthesis_coverage = coverage;
  input.payload.docs_synthesis_debug = {
    ...(readRecord(input.payload.docs_synthesis_debug) ?? {}),
    schema: "helix.docs_synthesis_debug.v1",
    materializer_goal_kind: terminalContract.goalKind,
    materializer_goal_kind_source: terminalContract.goalKindSource,
    materializer_required_terminal_kind: terminalContract.requiredTerminalKind,
    materializer_required_terminal_kind_source: terminalContract.requiredTerminalKindSource,
    materializer_contract_allowed: terminalContract.allowed,
    materializer_contract_disallow_reason: terminalContract.disallowReason,
    assistant_answer: false,
    raw_content_included: false,
  };
  if (!terminalContract.allowed) {
    return { ok: false, coverage, blocked_reason: "route_contract_disallowed" };
  }
  if (!coverage.sufficient) {
    return { ok: false, coverage, blocked_reason: "doc_evidence_coverage_missing" };
  }
  const answer = buildDocEvidenceSynthesisAnswerCandidate({
    turnId: input.turnId,
    plan,
    answerText: input.answerText,
    evidenceArtifacts,
    finalAnswerDraftRef: input.finalAnswerDraftRef,
  });
  if (!answer) return { ok: false, coverage, blocked_reason: "draft_empty" };
  input.payload.doc_evidence_synthesis_answer = answer;
  return { ok: true, answer, coverage };
}
