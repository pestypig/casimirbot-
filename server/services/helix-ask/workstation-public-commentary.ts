import type {
  HelixAskPublicCommentaryStatus,
  HelixAskPublicCommentaryTiming,
  HelixAgentCommentaryCertaintyClass,
} from "@shared/helix-agent-commentary";
import type { HelixWorkstationAffordanceFamily } from "@shared/helix-workstation-affordance";

type RecordLike = Record<string, unknown>;

export type HelixAskPublicCommentaryRowDraft = {
  timing: HelixAskPublicCommentaryTiming;
  status: HelixAskPublicCommentaryStatus;
  text: string;
  evidenceRefs?: string[];
  capabilityKey?: string | null;
  expectedArtifact?: string;
  doneCondition?: string;
  certaintyClass: HelixAgentCommentaryCertaintyClass;
};

const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const compact = (value: unknown, maxChars = 150): string | null => {
  const text = readString(value)?.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length <= maxChars ? text : `${text.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

const humanize = (value: unknown): string =>
  (readString(value) ?? "")
    .replace(/[_./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const joinNatural = (values: string[]): string => {
  const clean = values.map((value) => value.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  if (clean.length === 2) return `${clean[0]}, then ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, then ${clean[clean.length - 1]}`;
};

const FAMILY_COMMENTARY: Record<HelixWorkstationAffordanceFamily, {
  plan: string;
  before: string;
  after: string;
}> = {
  calculation: {
    plan: "I'm treating this as a calculator-backed reasoning turn.",
    before: "I'm evaluating the required numeric subgoal.",
    after: "The calculator produced a receipt; I'm checking units and quantity before synthesis.",
  },
  documents: {
    plan: "I'm using the document tool as evidence, not as a final answer by itself.",
    before: "I'm searching the docs for the requested source context.",
    after: "I found document evidence and am checking whether it covers the prompt.",
  },
  notes: {
    plan: "I'm treating this as a notes action with a visible receipt.",
    before: "I'm updating the note state through the workstation action.",
    after: "The note receipt is recorded; I'm checking the visible state change.",
  },
  clipboard: {
    plan: "I'm treating this as a clipboard action with a receipt.",
    before: "I'm applying the clipboard operation.",
    after: "The clipboard receipt is recorded; I'm checking whether the requested state changed.",
  },
  history: {
    plan: "I'm inspecting the process or history state as evidence.",
    before: "I'm querying the process graph or timeline.",
    after: "I have a history snapshot and am checking the relevant nodes.",
  },
  live_source: {
    plan: "I'm treating this as a live-source state change or observation.",
    before: "I'm checking the live source action against the current binding.",
    after: "The live-source receipt is recorded; I'm checking freshness and binding.",
  },
  live_answer_environment: {
    plan: "I'm treating this as a live answer environment operation.",
    before: "I'm updating the live environment state.",
    after: "The live environment receipt is recorded; I'm checking the active environment state.",
  },
  situation_room: {
    plan: "I'm using Situation Room artifacts as evidence and receipts.",
    before: "I'm running the Situation Room action through its affordance contract.",
    after: "The Situation Room receipt is recorded; I'm checking the evidence it produced.",
  },
  ideology: {
    plan: "I'm using the ideology framework as context, not as command authority.",
    before: "I'm retrieving the relevant framework context.",
    after: "The ideology context receipt is recorded; I'm checking how it frames the answer.",
  },
  debug: {
    plan: "I'm inspecting debug evidence as a diagnostic source.",
    before: "I'm checking the current debug evidence.",
    after: "The debug evidence is recorded; I'm checking what it proves.",
  },
  admin: {
    plan: "I'm treating this as an administrative workstation action.",
    before: "I'm checking the requested admin action against its contract.",
    after: "The admin receipt is recorded; I'm checking whether the requested state changed.",
  },
};

const inferFamily = (input: {
  workstationToolPlan?: unknown;
  workstationAffordances?: unknown[] | null;
  currentTurnArtifactLedger?: unknown[] | null;
  calculatorCompoundPlan?: unknown;
}): HelixWorkstationAffordanceFamily | null => {
  if (asRecord(input.calculatorCompoundPlan)) return "calculation";
  const plan = asRecord(input.workstationToolPlan);
  const intent = readString(plan?.intent);
  if (intent?.startsWith("calculator_")) return "calculation";
  if (intent?.startsWith("notes_")) return "notes";
  if (intent?.startsWith("ideology_")) return "ideology";
  if (intent === "dottie_observer") return "situation_room";
  if (intent === "live_environment_create") return "live_answer_environment";
  const affordanceFamily = readArray(input.workstationAffordances)
    .map(asRecord)
    .map((record) => readString(record?.family))
    .find(Boolean);
  if (affordanceFamily && affordanceFamily in FAMILY_COMMENTARY) {
    return affordanceFamily as HelixWorkstationAffordanceFamily;
  }
  const artifactKinds = readArray(input.currentTurnArtifactLedger)
    .map(asRecord)
    .map((record) => readString(record?.kind))
    .filter(Boolean)
    .join(" ");
  if (/doc_|docs/i.test(artifactKinds)) return "documents";
  if (/process|history/i.test(artifactKinds)) return "history";
  if (/clipboard/i.test(artifactKinds)) return "clipboard";
  if (/live_source|live_pipeline/i.test(artifactKinds)) return "live_source";
  return null;
};

const receiptEvidenceRefs = (receipts: unknown[]): string[] =>
  receipts
    .map(asRecord)
    .map((receipt) => readString(receipt?.receipt_id) ?? readString(receipt?.artifact_id))
    .filter(Boolean) as string[];

const validationEvidenceRefs = (validations: unknown[]): string[] =>
  validations
    .map(asRecord)
    .map((validation) => readString(validation?.validation_id) ?? readString(validation?.artifact_id))
    .filter(Boolean) as string[];

const subgoalById = (subgoals: RecordLike[]): Map<string, RecordLike> => {
  const byId = new Map<string, RecordLike>();
  for (const subgoal of subgoals) {
    const id = readString(subgoal.id);
    if (id) byId.set(id, subgoal);
  }
  return byId;
};

export const buildCalculatorCompoundCommentaryRows = (input: {
  calculatorCompoundPlan?: unknown;
  calculatorSubgoalReceipts?: unknown[] | null;
  calculatorResultValidations?: unknown[] | null;
  workstationToolEvaluation?: unknown;
  toolObservationContinuation?: unknown;
  reasoningContinuationResult?: unknown;
}): HelixAskPublicCommentaryRowDraft[] => {
  const plan = asRecord(input.calculatorCompoundPlan);
  if (!plan) return [];
  const subgoals = readArray(plan.subgoals).map(asRecord).filter(Boolean) as RecordLike[];
  const receipts = readArray(input.calculatorSubgoalReceipts).map(asRecord).filter(Boolean) as RecordLike[];
  const validations = readArray(input.calculatorResultValidations).map(asRecord).filter(Boolean) as RecordLike[];
  const evaluation = asRecord(input.workstationToolEvaluation);
  const rows: HelixAskPublicCommentaryRowDraft[] = [];
  const planEvidence = readString(plan.plan_id) ?? readString(plan.turn_id);
  rows.push({
    timing: "before_step",
    status: "using_tool",
    text: "I'm treating this as a calculator-backed problem with numeric receipts and an explanation.",
    evidenceRefs: planEvidence ? [planEvidence] : [],
    capabilityKey: "scientific-calculator.solve_expression",
    expectedArtifact: "calculator_compound_plan",
    certaintyClass: "hypothesis",
  });
  if (subgoals.length > 0) {
    const labels = subgoals
      .slice(0, 3)
      .map((subgoal) => compact(subgoal.label, 60) ?? humanize(subgoal.id))
      .filter(Boolean);
    rows.push({
      timing: "before_step",
      status: "thinking",
      text: `I planned ${subgoals.length} calculator subgoal${subgoals.length === 1 ? "" : "s"}: ${joinNatural(labels)}.`,
      evidenceRefs: planEvidence ? [planEvidence] : [],
      capabilityKey: "scientific-calculator.solve_expression",
      expectedArtifact: "calculator_subgoal_receipt",
      certaintyClass: "hypothesis",
    });
  }
  const subgoalsById = subgoalById(subgoals);
  const receiptsBySubgoal = new Map<string, RecordLike>();
  for (const receipt of receipts) {
    const subgoalId = readString(receipt.subgoal_id);
    if (subgoalId && !receiptsBySubgoal.has(subgoalId)) receiptsBySubgoal.set(subgoalId, receipt);
  }
  for (const subgoal of subgoals.slice(0, 5)) {
    const subgoalId = readString(subgoal.id);
    const label = compact(subgoal.label, 80) ?? humanize(subgoalId);
    const dependencies = readArray(subgoal.depends_on).map(readString).filter(Boolean) as string[];
    const dependencyLabel = dependencies
      .map((dependencyId) => compact(subgoalsById.get(dependencyId)?.label, 45) ?? humanize(dependencyId))
      .find(Boolean);
    rows.push({
      timing: "before_step",
      status: "using_tool",
      text: dependencyLabel
        ? `I'm using the validated ${dependencyLabel} result for ${label}.`
        : `I'm evaluating ${label}.`,
      evidenceRefs: subgoalId ? [subgoalId] : [],
      capabilityKey: "scientific-calculator.solve_expression",
      expectedArtifact: "calculator_subgoal_receipt",
      certaintyClass: "hypothesis",
    });
    const receipt = subgoalId ? receiptsBySubgoal.get(subgoalId) : null;
    if (receipt) {
      const result = compact(receipt.result_text, 70) ?? "the numeric result";
      const quantity = humanize(receipt.result_quantity ?? subgoal.expected_quantity);
      const unit = readString(receipt.result_unit ?? subgoal.expected_unit);
      rows.push({
        timing: "after_step",
        status: "checking",
        text: `The calculator returned ${result}${unit ? ` ${unit}` : ""}; I'm checking that it is ${quantity || "the expected quantity"}.`,
        evidenceRefs: [readString(receipt.receipt_id), subgoalId].filter(Boolean) as string[],
        capabilityKey: "scientific-calculator.solve_expression",
        expectedArtifact: "calculator_result_validation",
        certaintyClass: "reasoned",
      });
    }
  }
  if (validations.length > 0) {
    const passed = validations.filter((validation) => validation.satisfied === true).length;
    rows.push({
      timing: "after_step",
      status: passed === validations.length ? "checking" : "repairing",
      text:
        passed === validations.length
          ? "The calculator receipts passed quantity and unit validation."
          : "At least one calculator receipt still needs validation or repair.",
      evidenceRefs: validationEvidenceRefs(validations),
      capabilityKey: "scientific-calculator.solve_expression",
      expectedArtifact: "workstation_tool_evaluation",
      certaintyClass: "reasoned",
    });
  }
  const continuation = asRecord(input.toolObservationContinuation);
  const reasoningContinuation = asRecord(input.reasoningContinuationResult);
  if (continuation || reasoningContinuation || evaluation) {
    rows.push({
      timing: "before_step",
      status: "checking",
      text: "The numeric receipts are complete, so I'm synthesizing the equation setup, result, and physical meaning.",
      evidenceRefs: [
        ...receiptEvidenceRefs(receipts),
        ...validationEvidenceRefs(validations),
        readString(evaluation?.evaluation_id),
        readString(continuation?.continuation_id),
        readString(reasoningContinuation?.result_id),
      ].filter(Boolean) as string[],
      capabilityKey: "scientific-calculator.solve_expression",
      expectedArtifact: "workstation_tool_evaluation",
      certaintyClass: "reasoned",
    });
  }
  return rows;
};

export const buildValidationCommentaryRows = (input: {
  calculatorResultValidations?: unknown[] | null;
}): HelixAskPublicCommentaryRowDraft[] => {
  const validations = readArray(input.calculatorResultValidations);
  if (validations.length === 0) return [];
  const refs = validationEvidenceRefs(validations);
  return [{
    timing: "after_step",
    status: "checking",
    text: "I recorded validation evidence before allowing the tool result into synthesis.",
    evidenceRefs: refs,
    expectedArtifact: "validation",
    certaintyClass: "reasoned",
  }];
};

export const buildToolReceiptCommentaryRows = (input: {
  currentTurnArtifactLedger?: unknown[] | null;
}): HelixAskPublicCommentaryRowDraft[] => {
  const ledger = readArray(input.currentTurnArtifactLedger).map(asRecord).filter(Boolean) as RecordLike[];
  const receiptArtifacts = ledger.filter((artifact) => /receipt|tool_evaluation/i.test(readString(artifact.kind) ?? ""));
  if (receiptArtifacts.length === 0) return [];
  return [{
    timing: "after_step",
    status: "checking",
    text: "I recorded the tool receipt and am checking whether it satisfies the requested result.",
    evidenceRefs: receiptArtifacts
      .map((artifact) => readString(artifact.artifact_id))
      .filter(Boolean) as string[],
    expectedArtifact: readString(receiptArtifacts[0]?.kind) ?? "tool_receipt",
    certaintyClass: "reasoned",
  }];
};

export const buildWorkstationFamilyCommentaryRows = (input: {
  workstationToolPlan?: unknown;
  workstationAffordances?: unknown[] | null;
  currentTurnArtifactLedger?: unknown[] | null;
  calculatorCompoundPlan?: unknown;
}): HelixAskPublicCommentaryRowDraft[] => {
  const family = inferFamily(input);
  if (!family) return [];
  const phrases = FAMILY_COMMENTARY[family];
  const plan = asRecord(input.workstationToolPlan);
  const planId = readString(plan?.plan_id);
  const stepCount = readArray(plan?.steps).length;
  const rows: HelixAskPublicCommentaryRowDraft[] = [{
    timing: "before_step",
    status: family === "calculation" ? "using_tool" : "checking",
    text: phrases.plan,
    evidenceRefs: planId ? [planId] : [],
    capabilityKey: family === "calculation" ? "scientific-calculator.solve_expression" : null,
    expectedArtifact: family === "calculation" ? "calculator_receipt" : undefined,
    certaintyClass: "hypothesis",
  }];
  if (family !== "calculation" && stepCount > 0) {
    rows.push({
      timing: "before_step",
      status: "using_tool",
      text: phrases.before,
      evidenceRefs: planId ? [planId] : [],
      certaintyClass: "hypothesis",
    });
    rows.push({
      timing: "after_step",
      status: "checking",
      text: phrases.after,
      evidenceRefs: readArray(input.currentTurnArtifactLedger)
        .map(asRecord)
        .map((artifact) => readString(artifact?.artifact_id))
        .filter(Boolean) as string[],
      certaintyClass: "reasoned",
    });
  }
  return rows;
};
