import { detectClarificationNeeds } from "../situation-room/clarification-need-detector";
import { planClarificationQuestions } from "../situation-room/clarification-question-planner";

export function planClarificationDialogue(input: {
  threadId: string;
  roomId?: string | null;
  visibleBudget?: number;
}) {
  const needs = detectClarificationNeeds({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
  });
  const proposals = planClarificationQuestions({
    needs,
    visibleBudget: input.visibleBudget ?? 1,
  });
  return {
    schema: "helix.clarification_dialogue_plan.v1" as const,
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    needs,
    proposals,
    raw_content_included: false as const,
    assistant_answer: false as const,
  };
}
