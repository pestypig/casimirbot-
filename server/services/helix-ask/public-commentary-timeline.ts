import crypto from "node:crypto";
import {
  HELIX_ASK_PUBLIC_COMMENTARY_EVENT_SCHEMA,
  type HelixAskPublicCommentaryEventV1,
  type HelixAskPublicCommentaryStatus,
  type HelixAskPublicCommentaryTiming,
  type HelixAgentCommentaryCertaintyClass,
} from "@shared/helix-agent-commentary";
import { interpretHelixAskPrompt } from "./prompt-interpretation";
import {
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
} from "./contextual-tool-admission";
import {
  buildCalculatorCompoundCommentaryRows,
  buildToolReceiptCommentaryRows,
  buildWorkstationFamilyCommentaryRows,
  type HelixAskPublicCommentaryRowDraft,
} from "./workstation-public-commentary";

type RecordLike = Record<string, unknown>;

const asRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const normalizeSentence = (value: unknown, maxChars = 180): string | null => {
  const text = readString(value)
    ?.replace(/\s+/g, " ")
    .replace(/\b(?:turn_purpose|why_this_capability|expected_artifacts|observation_summary|next_step_reason)\b/gi, "")
    .trim();
  if (!text) return null;
  const withoutJsonShape = /^[{[]/.test(text) ? null : text;
  if (!withoutJsonShape) return null;
  const clipped =
    withoutJsonShape.length <= maxChars
      ? withoutJsonShape
      : `${withoutJsonShape.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
  return /[.!?]$/.test(clipped) ? clipped : `${clipped}.`;
};

const humanizeKey = (value: unknown): string => {
  const text = readString(value) ?? "";
  return text
    .replace(/[_./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const conceptsFromPrompt = (prompt: string): string[] => {
  const concepts: string[] = [];
  const add = (label: string, pattern: RegExp): void => {
    if (pattern.test(prompt) && !concepts.includes(label)) concepts.push(label);
  };
  add("GR light cones", /\blight\s+cones?\b|\bcausal\s+cone/i);
  add("material refraction", /\brefraction|refractive\s+index|indexes?\s+of\s+materials?\b/i);
  add("matter's quantum state", /\bsuper\s*position|superposition|quantum\s+state|mass\s+clock|e\s*=\s*h\s*f\b/i);
  add("spacetime geometry", /\bspace\s*time|spacetime|geometry|hypersurface\b/i);
  add("source evidence", /\b(?:repo|code|source|file|line-backed|implementation)\b/i);
  add("visible context", /\b(?:screen|visual|capture|image|current\s+window)\b/i);
  return concepts.slice(0, 4);
};

const compactRequirementText = (value: unknown): string | null => {
  const record = asRecord(value);
  const text = readString(record?.text ?? value);
  if (!text) return null;
  return text
    .replace(/\?+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const turnStartText = (input: {
  prompt: string;
  promptInterpretation?: RecordLike | null;
  compoundPromptContract?: RecordLike | null;
}): string => {
  const contextualSuppression = detectContextualToolAdmissionSuppression(input.prompt);
  const calculatorMentionIsContext =
    contextualToolSuppressionBlocksFamily(contextualSuppression, "scientific_calculator");
  if (!calculatorMentionIsContext && /\b(?:scientific\s+calculator|calculator|compute|calculate|solve|evaluate)\b/i.test(input.prompt)) {
    if (/\b(?:photon|joules?|ev|electronvolts?|energy|wavelength|frequency)\b/i.test(input.prompt)) {
      return "I'm treating this as a calculator-backed physics problem with numeric receipts and an explanation.";
    }
    return "I'm treating this as a calculator-backed problem with a checked numeric result.";
  }
  const concepts = conceptsFromPrompt(input.prompt);
  if (concepts.length >= 3) {
    const last = concepts[concepts.length - 1];
    return `I'm separating this into ${concepts.slice(0, -1).join(", ")}, and ${last}.`;
  }
  const requirements = readArray(input.compoundPromptContract?.requirements)
    .map(compactRequirementText)
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 3);
  if (requirements.length >= 2) {
    return `I'm separating this into ${requirements.length} requested pieces before choosing the answer path.`;
  }
  const summary = normalizeSentence(input.promptInterpretation?.user_task_summary, 130);
  return summary ?? "I'm identifying the requested answer shape before choosing the next step.";
};

const decisionCommentary = (decision: RecordLike | null): RecordLike | null => {
  const modelDecision = asRecord(decision?.model_decision);
  return asRecord(modelDecision?.commentary) ?? asRecord(decision?.public_commentary);
};

const firstExpectedArtifact = (decision: RecordLike | null): string | undefined => {
  const expected = readArray(decision?.expected_artifacts).map(readString).filter(Boolean) as string[];
  return expected[0] || readString(decisionCommentary(decision)?.expected_artifacts) || undefined;
};

const beforeStepText = (decision: RecordLike | null, prompt: string): string => {
  const publicSummary = normalizeSentence(asRecord(decision?.public_commentary)?.summary, 170);
  if (publicSummary) return publicSummary;
  const capability = readString(decision?.chosen_capability ?? asRecord(decision?.model_decision)?.chosen_capability);
  if (capability === "model.direct_answer" || /model_only|direct_answer/i.test(capability ?? "")) {
    if (conceptsFromPrompt(prompt).length >= 3) {
      return "This looks answerable without a tool; I will keep the GR, optics, and quantum-state boundaries explicit.";
    }
    return "This looks answerable without a tool; I will keep the response scoped to the requested distinctions.";
  }
  const commentary = decisionCommentary(decision);
  const why = normalizeSentence(commentary?.why_this_capability, 150);
  if (why && !/\bnecessary information is already available\b/i.test(why)) return why;
  if (capability) return `I am using ${humanizeKey(capability)} because it fits the next required observation.`;
  return "I am checking the next step against the available observations before answering.";
};

const afterStepText = (input: {
  event?: RecordLike | null;
  decision?: RecordLike | null;
  prompt: string;
}): string => {
  const event = input.event;
  const artifacts = readArray(event?.actual_artifacts).map(readString).filter(Boolean) as string[];
  const capability = readString(input.decision?.chosen_capability ?? asRecord(input.decision?.model_decision)?.chosen_capability);
  if (artifacts.includes("direct_answer_text") || capability === "model.direct_answer") {
    return "I have a draft answer; now I am checking that it covers the requested distinctions before presenting it.";
  }
  if (artifacts.length > 0) {
    return `I observed ${artifacts.slice(0, 3).map(humanizeKey).join(", ")} and am checking whether that satisfies the goal.`;
  }
  return "I recorded the step result and am checking whether another observation is needed.";
};

const finalReadyText = (prompt: string, failed: boolean): string => {
  if (failed) return "I cannot safely present this as an answer, so I am returning the typed failure path.";
  if (/\blight\s+cones?\b/i.test(prompt) && /\brefraction/i.test(prompt)) {
    return "I have enough to answer, with the key distinction that refractive index changes optical paths, not the GR light cone.";
  }
  return "I have enough to answer, and the terminal checks allow the final response.";
};

const terminalAuthoritySelectedAnswer = (value: unknown): boolean => {
  const authority = asRecord(value);
  if (!authority) return false;
  const terminalKind =
    readString(authority.terminal_artifact_kind) ??
    readString(authority.selected_terminal_artifact_kind) ??
    readString(authority.terminal_kind);
  const terminalError =
    readString(authority.terminal_error_code) ??
    readString(authority.error_code) ??
    readString(authority.failure_code);
  if (terminalError) return false;
  return Boolean(terminalKind && terminalKind !== "typed_failure" && terminalKind !== "failure");
};

const makeEvent = (input: {
  turnId: string;
  traceId: string;
  iteration?: number;
  decisionId?: string | null;
  capabilityKey?: string | null;
  timing: HelixAskPublicCommentaryTiming;
  status: HelixAskPublicCommentaryStatus;
  text: string;
  expectedArtifact?: string;
  doneCondition?: string;
  evidenceRefs?: string[];
  certaintyClass: HelixAgentCommentaryCertaintyClass;
}): HelixAskPublicCommentaryEventV1 => {
  const text = normalizeSentence(input.text) ?? "I am updating the public step trace.";
  return {
    schema: HELIX_ASK_PUBLIC_COMMENTARY_EVENT_SCHEMA,
    event_id: `public_commentary:${hashShort([
      input.turnId,
      input.timing,
      input.iteration ?? null,
      input.decisionId ?? null,
      text,
    ])}`,
    turn_id: input.turnId,
    trace_id: input.traceId,
    ...(input.iteration !== undefined ? { iteration: input.iteration } : {}),
    ...(input.decisionId ? { decision_id: input.decisionId } : {}),
    ...(input.capabilityKey ? { capability_key: input.capabilityKey } : {}),
    timing: input.timing,
    status: input.status,
    text,
    ...(input.expectedArtifact ? { expected_artifact: input.expectedArtifact } : {}),
    ...(input.doneCondition ? { done_condition: input.doneCondition } : {}),
    evidence_refs: input.evidenceRefs ?? [],
    certainty_class: input.certaintyClass,
    assistant_answer: false,
    raw_reasoning_included: false,
  };
};

export const buildHelixAskPublicCommentaryTimeline = (input: {
  turnId: string;
  traceId?: string | null;
  prompt: string;
  turnEvents?: unknown[] | null;
  promptInterpretation?: unknown;
  compoundPromptContract?: unknown;
  agentStepDecision?: unknown;
  initialAgentStepDecision?: unknown;
  agentStepCommentaries?: unknown[] | null;
  currentTurnArtifactLedger?: unknown[] | null;
  agentRuntimeLoop?: unknown;
  workstationToolPlan?: unknown;
  workstationAffordances?: unknown[] | null;
  calculatorCompoundPlan?: unknown;
  calculatorSubgoalReceipts?: unknown[] | null;
  calculatorResultValidations?: unknown[] | null;
  workstationToolEvaluation?: unknown;
  toolObservationContinuation?: unknown;
  reasoningContinuationResult?: unknown;
  goalSatisfactionEvaluation?: unknown;
  terminalAuthority?: unknown;
  finalStatus?: string | null;
}): HelixAskPublicCommentaryEventV1[] => {
  const promptInterpretation =
    asRecord(input.promptInterpretation) ?? interpretHelixAskPrompt(input.prompt);
  const compoundPromptContract =
    asRecord(input.compoundPromptContract) ??
    asRecord(promptInterpretation?.compound_contract);
  const traceId = input.traceId?.trim() || input.turnId;
  const events = readArray(input.turnEvents).map(asRecord).filter(Boolean) as RecordLike[];
  const decisions = [
    asRecord(input.initialAgentStepDecision),
    asRecord(input.agentStepDecision),
  ].filter(Boolean) as RecordLike[];
  const terminalFailed = input.finalStatus === "final_failure" && !terminalAuthoritySelectedAnswer(input.terminalAuthority);
  const timeline: HelixAskPublicCommentaryEventV1[] = [
    makeEvent({
      turnId: input.turnId,
      traceId,
      timing: "turn_start",
      status: "thinking",
      text: turnStartText({
        prompt: input.prompt,
        promptInterpretation,
        compoundPromptContract,
      }),
      evidenceRefs: [
        `${input.turnId}:prompt_interpretation`,
        ...(compoundPromptContract ? [`${input.turnId}:compound_prompt_contract`] : []),
      ],
      certaintyClass: "hypothesis",
    }),
  ];

  const primaryDecision = decisions[decisions.length - 1] ?? null;
  const decisionId = readString(primaryDecision?.decision_id);
  const capability = readString(primaryDecision?.chosen_capability ?? asRecord(primaryDecision?.model_decision)?.chosen_capability);
  const toolOrResultEvent = [...events].reverse().find((event) =>
    event.type === "tool_result" || event.type === "observation_recorded" || event.type === "item_completed",
  );
  const workstationRows = [
    ...buildWorkstationFamilyCommentaryRows({
      workstationToolPlan: input.workstationToolPlan,
      workstationAffordances: input.workstationAffordances,
      currentTurnArtifactLedger: input.currentTurnArtifactLedger,
      calculatorCompoundPlan: input.calculatorCompoundPlan,
    }),
    ...buildCalculatorCompoundCommentaryRows({
      calculatorCompoundPlan: input.calculatorCompoundPlan,
      calculatorSubgoalReceipts: input.calculatorSubgoalReceipts,
      calculatorResultValidations: input.calculatorResultValidations,
      workstationToolEvaluation: input.workstationToolEvaluation,
      toolObservationContinuation: input.toolObservationContinuation,
      reasoningContinuationResult: input.reasoningContinuationResult,
    }),
    ...buildToolReceiptCommentaryRows({
      currentTurnArtifactLedger: input.currentTurnArtifactLedger,
    }),
  ];
  const normalizedStepCommentaryRows: HelixAskPublicCommentaryRowDraft[] = readArray(input.agentStepCommentaries)
    .map(asRecord)
    .map((commentary) => normalizeSentence(commentary?.public_summary ?? commentary?.text, 170))
    .filter((text): text is string => Boolean(text))
    .slice(0, 2)
    .map((text) => ({
      timing: "after_step",
      status: "checking",
      text,
      evidenceRefs: decisionId ? [decisionId] : [],
      certaintyClass: "reasoned",
    }));

  const rowDrafts: HelixAskPublicCommentaryRowDraft[] =
    workstationRows.length > 0
      ? [...workstationRows, ...normalizedStepCommentaryRows]
      : [
          {
            timing: "before_step",
            status: capability && !/^model\./.test(capability) ? "using_tool" : "checking",
            text: beforeStepText(primaryDecision, input.prompt),
            expectedArtifact: firstExpectedArtifact(primaryDecision),
            doneCondition: normalizeSentence(decisionCommentary(primaryDecision)?.what_would_make_this_done, 150) ?? undefined,
            evidenceRefs: decisionId ? [decisionId] : [],
            certaintyClass: "hypothesis",
          },
          {
            timing: terminalFailed ? "fail_closed" : "after_step",
            status: terminalFailed ? "repairing" : "checking",
            text: afterStepText({
              event: toolOrResultEvent,
              decision: primaryDecision,
              prompt: input.prompt,
            }),
            expectedArtifact: firstExpectedArtifact(primaryDecision),
            evidenceRefs: [
              ...(decisionId ? [decisionId] : []),
              ...readArray(toolOrResultEvent?.actual_artifacts).map(readString).filter(Boolean) as string[],
            ],
            certaintyClass: "reasoned",
          },
          ...normalizedStepCommentaryRows,
        ];
  const maxRows = asRecord(input.calculatorCompoundPlan) ? 14 : 8;
  const maxStepRows = Math.max(0, maxRows - 2);
  const cappedRowDrafts = rowDrafts.slice(0, maxStepRows);
  const synthesisRow = rowDrafts.find((row) => /\bsynthesizing\b/i.test(row.text));
  if (synthesisRow && !cappedRowDrafts.some((row) => row.text === synthesisRow.text) && cappedRowDrafts.length > 0) {
    cappedRowDrafts[cappedRowDrafts.length - 1] = synthesisRow;
  }
  for (const [index, row] of cappedRowDrafts.entries()) {
    timeline.push(makeEvent({
      turnId: input.turnId,
      traceId,
      iteration: index + 1,
      decisionId,
      capabilityKey: row.capabilityKey ?? capability,
      timing: row.timing,
      status: terminalFailed && row.timing !== "turn_start" ? "repairing" : row.status,
      text: row.text,
      expectedArtifact: row.expectedArtifact ?? firstExpectedArtifact(primaryDecision),
      doneCondition: row.doneCondition,
      evidenceRefs: row.evidenceRefs ?? [],
      certaintyClass: row.certaintyClass,
    }));
  }

  timeline.push(makeEvent({
    turnId: input.turnId,
    traceId,
    iteration: 1,
    decisionId,
    capabilityKey: capability,
    timing: terminalFailed ? "fail_closed" : "final_ready",
    status: terminalFailed ? "repairing" : "done",
    text: finalReadyText(input.prompt, terminalFailed),
    evidenceRefs: [
      ...(asRecord(input.goalSatisfactionEvaluation) ? [`${input.turnId}:goal_satisfaction_evaluation`] : []),
      ...(asRecord(input.terminalAuthority) ? [`${input.turnId}:terminal_answer_authority`] : []),
    ],
    certaintyClass: terminalFailed ? "reasoned" : "confirmed",
  }));

  const seen = new Set<string>();
  return timeline.filter((event) => {
    if (seen.has(event.event_id)) return false;
    seen.add(event.event_id);
    return true;
  });
};
