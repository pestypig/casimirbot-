import type {
  LiveAgenticReviewReceipt,
  LiveAgenticReviewRequest,
  LiveAgenticReviewResult,
} from "@shared/helix-agentic-review";
import { appendHelixThreadEvent } from "../helix-thread/ledger";

const requests = new Map<string, LiveAgenticReviewRequest>();
const results = new Map<string, LiveAgenticReviewResult>();

export function recordLiveAgenticReviewRequest(input: {
  request: LiveAgenticReviewRequest;
  appendThread?: boolean;
}): LiveAgenticReviewReceipt {
  requests.set(input.request.review_id, input.request);
  if (input.appendThread !== false) {
    appendHelixThreadEvent({
      route: "/ask",
      thread_id: input.request.thread_id,
      turn_id: `live_agentic_review_request:${input.request.review_id}`,
      session_id: input.request.thread_id,
      event_type: "item_completed",
      item_id: input.request.review_id,
      item_type: "toolObservation",
      item_stream: "observation",
      item_status: "completed",
      observation_ref: {
        ...input.request,
        model_invoked: false,
        deterministic: true,
        context_role: "observation_not_assistant_answer",
      },
      meta: {
        kind: "live_agentic_review_request",
        primary_user_visible: false,
        model_invoked: false,
      },
      ts: input.request.created_at,
    });
  }
  return {
    schema: "helix.live_agentic_review_receipt.v1",
    ok: true,
    request: input.request,
    result: null,
    error: null,
  };
}

export function recordLiveAgenticReviewResult(input: {
  result: LiveAgenticReviewResult;
  userFacingAnswer?: boolean;
}): LiveAgenticReviewResult {
  results.set(input.result.review_id, input.result);
  appendHelixThreadEvent({
    route: "/ask",
    thread_id: input.result.thread_id,
    turn_id: `live_agentic_review_result:${input.result.review_id}`,
    session_id: input.result.thread_id,
    event_type: "item_completed",
    item_id: `${input.result.review_id}:result`,
    item_type: input.userFacingAnswer && input.result.decision === "answer_user" ? "answer" : "validation",
    item_stream: input.userFacingAnswer && input.result.decision === "answer_user" ? "answer" : "observation",
    item_status: "completed",
    observation_ref: input.userFacingAnswer && input.result.decision === "answer_user" ? undefined : input.result,
    assistant_text: input.userFacingAnswer && input.result.decision === "answer_user" ? input.result.summary : undefined,
    meta: {
      kind: "live_agentic_review_result",
      primary_user_visible: input.userFacingAnswer === true,
      model_invoked: true,
      context_policy: "compact_context_pack_only",
      raw_logs_included: false,
    },
    ts: input.result.created_at,
  });
  return input.result;
}

export function listLiveAgenticReviewRequests(): LiveAgenticReviewRequest[] {
  return Array.from(requests.values()).sort((a: LiveAgenticReviewRequest, b: LiveAgenticReviewRequest) => b.created_at.localeCompare(a.created_at));
}

export function listLiveAgenticReviewResults(): LiveAgenticReviewResult[] {
  return Array.from(results.values()).sort((a: LiveAgenticReviewResult, b: LiveAgenticReviewResult) => b.created_at.localeCompare(a.created_at));
}

export function resetLiveAgenticReviews(): void {
  requests.clear();
  results.clear();
}
