import {
  buildHelixPostToolSynthesisPlanV1,
  type HelixPostToolAnswerIntent,
  type HelixPostToolSynthesisPlanV1,
  type HelixPostToolSynthesisSectionId,
} from "../../../shared/contracts/helix-post-tool-synthesis-plan.v1";

export type PlanPostToolSynthesisInput = {
  turnId: string;
  prompt: string;
  receipts: Array<Record<string, unknown>>;
  evaluation?: Record<string, unknown> | null;
  route?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function receiptKind(receipt: Record<string, unknown>): string | null {
  return (
    readString(receipt.kind) ??
    readString(receipt.artifactId) ??
    readString(receipt.schema) ??
    readString(receipt.schemaVersion) ??
    readString(receipt.evaluation_id)?.replace(/:.+$/, "") ??
    null
  );
}

function receiptRef(receipt: Record<string, unknown>): string | null {
  return (
    readString(receipt.receiptId) ??
    readString(receipt.receipt_id) ??
    readString(receipt.evaluation_id) ??
    readString(receipt.admissionId) ??
    readString(receipt.synthesisPlanId) ??
    readString(receipt.artifact_id) ??
    null
  );
}

function hasClaimBoundary(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (Array.isArray(value.claim_boundary_notes) || Array.isArray(value.claimBoundaryNotes)) return true;
  const text = JSON.stringify(value).toLowerCase();
  return text.includes("claimboundary") || text.includes("claim boundary") || text.includes("diagnostic/proxy");
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function chooseIntents(prompt: string, observedReceiptKinds: string[], route: string | null): HelixPostToolAnswerIntent[] {
  const normalized = prompt.toLowerCase();
  const intents: HelixPostToolAnswerIntent[] = [];
  const hasCalculator = observedReceiptKinds.some((kind) => /calculator/i.test(kind));
  const hasReflection =
    observedReceiptKinds.some((kind) => /theory_context_reflection|reflection/i.test(kind)) ||
    /theory_context_reflection|physics_calculation_context/i.test(route ?? "");
  const hasRuntime = observedReceiptKinds.some((kind) =>
    /runtime|gate|evidence/i.test(kind) && !/reflection|calculator/i.test(kind),
  );

  if (/\b(?:what\s+(?:does|is)|explain|meaning|means?|from first principles)\b/i.test(prompt)) {
    intents.push("concept_explanation");
  }
  if (/\b(?:calculate|compute|solve|evaluate|numeric|result|value)\b/i.test(prompt) || hasCalculator) {
    intents.push("numeric_result");
  }
  if (/\b(?:where|map|graph|badge|fit|placement|route)\b/i.test(prompt) || hasReflection) {
    intents.push("theory_graph_mapping");
  }
  if (hasRuntime || /\b(?:runtime|evidence|gate|receipt|artifact|blocked|claim)\b/i.test(prompt)) {
    intents.push("evidence_review");
  }
  if (/\b(?:debug|trace|tools?\s+used|what\s+tools?|tool\s+trace)\b/i.test(prompt)) {
    intents.push("debug_report");
  }
  if (/\b(?:create|open|load|attach|update|save|write)\b/i.test(normalized)) {
    intents.push("action_confirmation");
  }
  if (/\be\s*=\s*h\s*f\b/i.test(prompt) && !intents.includes("concept_explanation")) {
    intents.unshift("concept_explanation");
  }
  return unique(intents.length ? intents : ["concept_explanation"]);
}

const SECTION_LABELS: Record<HelixPostToolSynthesisSectionId, string> = {
  direct_answer: "Direct answer",
  concept_explanation: "Concept explanation",
  numeric_result: "Numeric result",
  tool_observation_summary: "Tool observation summary",
  graph_placement: "Graph placement",
  runtime_boundary: "Runtime boundary",
  claim_boundary: "Claim boundary",
  next_steps: "Next steps",
};

function section(id: HelixPostToolSynthesisSectionId, required = true): HelixPostToolSynthesisPlanV1["requiredAnswerSections"][number] {
  return { id, label: SECTION_LABELS[id], required };
}

function requiredSections(intents: HelixPostToolAnswerIntent[], hasReceipts: boolean, includeClaimBoundary: boolean) {
  const sections: HelixPostToolSynthesisSectionId[] = ["direct_answer"];
  if (intents.includes("concept_explanation") || intents.includes("mixed")) sections.push("concept_explanation");
  if (intents.includes("numeric_result") || intents.includes("mixed")) sections.push("numeric_result");
  if (intents.includes("theory_graph_mapping") || intents.includes("mixed")) sections.push("graph_placement");
  if (hasReceipts) sections.push("tool_observation_summary");
  if (intents.includes("evidence_review") || includeClaimBoundary) sections.push("runtime_boundary");
  if (includeClaimBoundary) sections.push("claim_boundary");
  if (intents.includes("debug_report")) sections.push("next_steps");
  return unique(sections).map((id) => section(id));
}

export function planPostToolSynthesis(args: PlanPostToolSynthesisInput): HelixPostToolSynthesisPlanV1 {
  const receiptKinds = unique(args.receipts.map(receiptKind).filter((kind): kind is string => Boolean(kind)));
  const evidenceRefs = unique(args.receipts.map(receiptRef).filter((ref): ref is string => Boolean(ref)));
  const rawIntents = chooseIntents(args.prompt, receiptKinds, args.route ?? null);
  const answerIntent: HelixPostToolAnswerIntent = rawIntents.length > 1 ? "mixed" : rawIntents[0] ?? "concept_explanation";
  const secondaryIntents = answerIntent === "mixed" ? rawIntents : rawIntents.slice(1);
  const includeClaimBoundary = args.receipts.some(hasClaimBoundary);
  const hasReceipts = receiptKinds.length > 0;
  const hasMoralLivingSubstrateReflection = receiptKinds.some((kind) =>
    /moral_living_substrate_reflection/i.test(kind),
  );
  const hasMoralGraphReflection = receiptKinds.some((kind) =>
    /(?:^|[._-])moral_graph_reflection|helix\.moral_graph_reflection_observation/i.test(kind),
  );

  return buildHelixPostToolSynthesisPlanV1({
    turnId: args.turnId,
    prompt: args.prompt,
    answerIntent,
    secondaryIntents,
    evidenceRefs,
    observedReceiptKinds: receiptKinds,
    requiredAnswerSections: requiredSections(rawIntents, hasReceipts, includeClaimBoundary),
    prohibitedMoves: [
      "Do not present a route/classifier/receipt as the final answer.",
      "Do not copy a receipt summary verbatim as the answer body.",
      "Do not use theory reflection as proof of a physics claim.",
      "Do not imply calculator scalar success validates runtime/gate claims.",
      "Do not promote diagnostic/proxy claims.",
      ...(hasMoralLivingSubstrateReflection
        ? [
            "Do not convert Moral Graph substrate reflection into personhood, free-will, legal, or final moral verdict authority.",
            "Do not summarize moral substrate badges without using the procedural chain's present and missing transition links.",
          ]
        : []),
      ...(hasMoralGraphReflection
        ? [
            "Do not convert Moral Graph reflection into a final moral verdict, web evidence, or civilization-bound claim.",
            "Do not summarize badge names without using locator, procedural classification, fruition, and claim-boundary evidence.",
          ]
        : []),
    ],
    synthesisInstructions: [
      "Answer the user's intent first, then summarize tool observations as evidence.",
      "Use calculator receipts only for numeric claims.",
      "Use reflection receipts only for context placement.",
      "Keep runtime, evidence, and claim-boundary limitations visible when present.",
      ...(hasMoralLivingSubstrateReflection
        ? [
            "For Moral Graph substrate reflection, reason from procedural_chain transitions: identify which links are present, which are partial or missing, and state conclusions conditionally.",
          ]
        : []),
      ...(hasMoralGraphReflection
        ? [
            "For Moral Graph reflection, reason from located badges, procedural classification, fruition, and claim-boundary notes; state what the derivation supports and what remains missing.",
          ]
        : []),
    ],
  });
}
