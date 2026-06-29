import { readString, type RecordLike } from "./core";

export type HelixReflectionAnswerGuidanceInput = {
  promptText: string;
  selectedNodes: readonly unknown[];
  locatorRationale: string;
  supportRefs: readonly string[];
  constraintsIntroduced: readonly string[];
  missingEvidence: readonly string[];
  confidence?: "low" | "medium" | "high";
  maturity?: "exploratory" | "reduced_order" | "diagnostic" | "certified";
  practicalFraming: string;
  allowedClaims: readonly string[];
  conditionalClaims?: readonly string[];
  blockedClaims: readonly string[];
  reasoningMoves: readonly string[];
  suggestedAnswerShape: readonly string[];
  wordingGuidance: string;
  compoundHandoffNotes?: RecordLike;
  requiredCaveats?: readonly string[];
};

const readNodeLabel = (node: unknown, fallback: string): string => {
  if (typeof node === "string" && node.trim()) return node.trim();
  if (!node || typeof node !== "object" || Array.isArray(node)) return fallback;
  const record = node as RecordLike;
  return (
    readString(record.roadmapId) ??
    readString(record.roadmap_id) ??
    readString(record.reflectionId) ??
    readString(record.reflection_id) ??
    readString(record.artifactId) ??
    readString(record.artifact_id) ??
    readString(record.nodeId) ??
    readString(record.systemId) ??
    readString(record.badgeId) ??
    readString(record.boundId) ??
    readString(record.id) ??
    readString(record.label) ??
    readString(record.title) ??
    fallback
  );
};

const compactStrings = (values: readonly string[], fallback: readonly string[] = []): string[] => {
  const compacted = values.map((value) => value.trim()).filter(Boolean);
  return Array.from(new Set(compacted.length > 0 ? compacted : [...fallback]));
};

export const buildHelixReflectionProceduralReceipt = (
  input: HelixReflectionAnswerGuidanceInput,
): RecordLike => ({
  schema: "helix.reflection_procedural_receipt.v1",
  selected_nodes: input.selectedNodes.map((node, index) => ({
    id: readNodeLabel(node, `selected_node:${index + 1}`),
    raw: node,
  })),
  locator_rationale: input.locatorRationale,
  support_refs: compactStrings([...input.supportRefs]),
  constraints_introduced: compactStrings([...input.constraintsIntroduced], [
    "reflection output bounds claims but does not establish feasibility or authority",
  ]),
  missing_evidence: compactStrings([...input.missingEvidence]),
  confidence: input.confidence ?? "medium",
  maturity: input.maturity ?? "diagnostic",
  forbidden_overclaims: compactStrings([...input.blockedClaims], [
    "Do not treat the reflection receipt as terminal answer authority.",
  ]),
  required_caveats: compactStrings([...(input.requiredCaveats ?? [])], [
    "Receipt is observation-only until terminal synthesis and route authority select a supported answer.",
  ]),
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const buildHelixReflectionAnswerGuidance = (
  input: HelixReflectionAnswerGuidanceInput,
): RecordLike => ({
  schema: "helix.reflection_answer_guidance.v1",
  user_question_interpretation:
    input.promptText.trim() || "The user is asking for a bounded reflection over the selected evidence.",
  practical_framing: input.practicalFraming,
  allowed_claims: compactStrings([...input.allowedClaims]),
  conditional_claims: compactStrings([...(input.conditionalClaims ?? [])]),
  blocked_claims: compactStrings([...input.blockedClaims], [
    "Do not claim feasibility, moral authority, implementation readiness, or proof beyond the selected evidence.",
  ]),
  reasoning_moves: compactStrings([...input.reasoningMoves], [
    "Locate the prompt in the selected graph or evidence nodes.",
    "Name the constraints introduced by that location.",
    "Separate permitted, conditional, and blocked claims.",
    "Give the next evidence step.",
  ]),
  suggested_answer_shape: compactStrings([...input.suggestedAnswerShape], [
    "Start with the bounded interpretation.",
    "Explain why the selected node location matters.",
    "State what the constraints permit and block.",
    "End with the next evidence step.",
  ]),
  wording_guidance: input.wordingGuidance,
  compound_handoff_notes: input.compoundHandoffNotes ?? {},
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const buildHelixReflectionObservationLayers = (
  input: HelixReflectionAnswerGuidanceInput,
): RecordLike => ({
  procedural_receipt: buildHelixReflectionProceduralReceipt(input),
  answer_guidance: buildHelixReflectionAnswerGuidance(input),
});
