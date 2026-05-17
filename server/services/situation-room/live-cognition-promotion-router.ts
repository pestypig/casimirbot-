import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import { createAskHandoff } from "../helix-ask/ask-handoff-router";
import { shouldCreateAskHandoffForGoal } from "../helix-ask/ask-handoff-policy";
import { createPlanContract } from "../helix-ask/plan-contract-boundary-guard";
import { generateGoalCardFromInterpretation } from "./goal-card-generator";
import { generateInterpretationCardFromObservation } from "./interpretation-card-generator";
import { auditLiveCognitionPromotion } from "./live-cognition-promotion-audit";
import {
  observationRoleForAnalysis,
  observationSourceLabelForModality,
} from "./observation-promotion-policy";
import { appendObservationJournalEntry } from "./observation-journal-store";

export type LiveCognitionPromotionRouterInput = {
  job: HelixLiveSourceAnalysisJob;
  chunk: HelixLiveSourceChunk;
  status: "completed" | "failed" | "suppressed";
  summary: string;
  outputRefs: string[];
  evidenceRefs?: string[];
  modelInvoked?: boolean;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)));

const shouldCreateRepairPlanContract = (goalType: string): boolean =>
  goalType === "resolve_missing_visual_evidence";

export function promoteLiveSourceAnalysisOutput(input: LiveCognitionPromotionRouterInput) {
  const evidenceRefs = uniqueStrings([
    input.job.job_id,
    input.chunk.chunk_id,
    ...input.outputRefs,
    ...(input.evidenceRefs ?? []),
    ...input.chunk.evidence_refs,
  ]);
  const role = observationRoleForAnalysis({
    chunk: input.chunk,
    status: input.status,
    modelInvoked: input.modelInvoked,
  });
  const observation = appendObservationJournalEntry({
    thread_id: input.chunk.thread_id,
    room_id: input.chunk.environment_id ?? null,
    source_id: input.chunk.source_id,
    role,
    modality: input.chunk.modality,
    text: input.summary,
    evidence_refs: evidenceRefs,
    model_invoked: role === "model_perception_observation" ? true : input.modelInvoked === true,
    confidence: input.status === "completed" ? 0.7 : 0.2,
    raw_image_ref: input.chunk.modality === "visual_frame" ? input.chunk.payload_ref ?? input.chunk.chunk_id : null,
  });

  const interpretation = generateInterpretationCardFromObservation({
    observation,
    chunk: input.chunk,
    status: input.status,
    summary: input.summary,
    modelInvoked: input.modelInvoked,
    evidenceRefs,
  });

  const goal = interpretation
    ? generateGoalCardFromInterpretation({
        interpretation,
        chunk: input.chunk,
        summary: input.summary,
      })
    : null;

  const handoffPolicy = goal
    ? shouldCreateAskHandoffForGoal({ goal, chunk: input.chunk, status: input.status })
    : { shouldCreate: false, reasoningBudget: "cheap" as const, expectedOutput: "grounded_micro_report" };
  const handoff = goal && interpretation && handoffPolicy.shouldCreate
    ? createAskHandoff({
        thread_id: input.chunk.thread_id,
        room_id: input.chunk.environment_id ?? null,
        handoff_type: "helix_ask_reasoning",
        objective: `Reason over ${observationSourceLabelForModality(input.chunk.modality)} observation without executing tools.`,
        question: `What is most likely happening based only on the promoted ${input.chunk.modality} observation?`,
        selected_evidence_refs: [observation.observation_id, ...evidenceRefs],
        interpretation_refs: [interpretation.interpretation_id],
        goal_refs: [goal.goal_id],
        allowed_inputs: {
          observation_refs: [observation.observation_id],
          interpretation_refs: [interpretation.interpretation_id],
          goal_refs: [goal.goal_id],
        },
        expected_output: handoffPolicy.expectedOutput,
        reasoning_budget: handoffPolicy.reasoningBudget,
        raw_context_approved: false,
      })
    : null;

  const planContract = goal && shouldCreateRepairPlanContract(goal.goal_type)
    ? createPlanContract({
        thread_id: input.chunk.thread_id,
        panel_id: "situation-room",
        action_id: "situation-room.live-source.capture_now",
        args: {
          source_id: input.chunk.source_id,
          modality: input.chunk.modality,
        },
        evidence_refs: [goal.goal_id, observation.observation_id, ...evidenceRefs],
        client_adoption_required: true,
        terminal_expectation: {
          type: "client_adoption_observation_required",
          artifact: "client_capability_adoption",
        },
      })
    : null;

  const audit = auditLiveCognitionPromotion({
    threadId: input.chunk.thread_id,
    observation,
    interpretation,
    goal,
    handoff,
    planContract,
  });

  return {
    observation,
    interpretation,
    goal,
    handoff,
    plan_contract: planContract,
    audit,
    counts: {
      observations: observation ? 1 : 0,
      interpretations: interpretation ? 1 : 0,
      goals: goal ? 1 : 0,
      handoffs: handoff ? 1 : 0,
      plan_contracts: planContract ? 1 : 0,
    },
    assistant_answer: false as const,
    raw_content_included: false as const,
    context_policy: "compact_context_pack_only" as const,
  };
}
