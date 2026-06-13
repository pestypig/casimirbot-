import { beforeEach, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import {
  buildHelixConversationMemoryPacket,
  detectHelixFollowupReferences,
  resolveConversationMemoryAdmission,
} from "../services/helix-ask/conversation-memory-selector";
import { __resetConversationHistoryStore } from "../services/helix-ask/conversation-history";
import { appendHelixThreadCompletedItemLifecycle } from "../services/helix-ask/runtime/request-context";
import {
  __resetHelixThreadLedgerStore,
  appendHelixThreadServerRequestEvent,
  appendHelixTurnEvent,
} from "../services/helix-thread/ledger";

let threadId = "thread-memory-test";
let sessionId = "session-memory-test";

const completeTurn = (args: {
  turnId: string;
  user: string;
  answer?: string | null;
  failReason?: string | null;
}) => {
  appendHelixTurnEvent({
    thread_id: threadId,
    route: "/ask",
    event_type: "turn_started",
    turn_id: args.turnId,
    session_id: sessionId,
    turn_kind: "ask",
    thread_status: "active",
    user_text: args.user,
  });
  appendHelixThreadCompletedItemLifecycle({
    threadId,
    turnId: args.turnId,
    route: "/ask",
    sessionId,
    turnKind: "ask",
    itemType: "userMessage",
    text: args.user,
    userText: args.user,
  });
  if (args.answer) {
    appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId: args.turnId,
      route: "/ask",
      sessionId,
      turnKind: "ask",
      itemType: "answer",
      itemStream: "answer",
      text: args.answer,
      assistantText: args.answer,
    });
  }
  appendHelixTurnEvent({
    thread_id: threadId,
    route: "/ask",
    event_type: args.failReason ? "turn_failed" : "turn_completed",
    turn_id: args.turnId,
    session_id: sessionId,
    turn_kind: "ask",
    thread_status: args.failReason ? "failed" : "idle",
    user_text: args.user,
    assistant_text: args.answer ?? null,
    fail_reason: args.failReason ?? null,
  });
};

describe("Helix Ask conversation memory packet", () => {
  beforeEach(() => {
    __resetHelixThreadLedgerStore();
    __resetConversationHistoryStore();
    threadId = `thread-memory-test-${crypto.randomUUID()}`;
    sessionId = `session-memory-test-${crypto.randomUUID()}`;
  });

  it("builds a current-thread packet from a prior answer", () => {
    completeTurn({
      turnId: "turn-1",
      user: "What is Auntie Dottie?",
      answer: "Auntie Dottie is the app's helpful guide persona.",
    });

    const packet = buildHelixConversationMemoryPacket({
      threadId,
      currentTurnId: "turn-2",
      sessionId,
      promptText: "Explain that more simply.",
    });

    expect(packet).toMatchObject({
      schema: "helix.conversation_memory_packet.v1",
      memory_scope: "current_thread",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      allowed_for_current_goal: true,
    });
    expect(packet.resolved_references[0]).toMatchObject({
      phrase: "explain that more simply",
      refers_to_turn_id: "turn-1",
      refers_to_kind: "prior_assistant_answer",
    });
    expect(["high", "medium"]).toContain(packet.resolved_references[0]?.confidence);
    expect(packet.latest_answer_summary).toContain("Auntie Dottie");
  });

  it("does not admit memory without an active thread", () => {
    const packet = buildHelixConversationMemoryPacket({
      threadId: "",
      currentTurnId: "turn-2",
      sessionId,
      promptText: "Continue.",
    });

    expect(packet.allowed_for_current_goal).toBe(false);
    expect(packet.allowed_reason).toMatch(/no active thread/i);
    expect(packet.recent_user_goals).toEqual([]);
    expect(packet.recent_assistant_answers).toEqual([]);
  });

  it("blocks explicit rejection of previous context", () => {
    completeTurn({
      turnId: "turn-1",
      user: "Summarize this repo.",
      answer: "Prior answer text.",
    });

    const packet = buildHelixConversationMemoryPacket({
      threadId,
      currentTurnId: "turn-2",
      sessionId,
      promptText: "Do not use the previous answer. Explain this from scratch.",
    });

    expect(packet.allowed_for_current_goal).toBe(false);
    expect(packet.resolved_references).toEqual([]);
    expect(packet.allowed_reason).toMatch(/rejects previous/i);
  });

  it("allows model-only follow-up for pronoun binding but not source authority", () => {
    const followup = detectHelixFollowupReferences("Is that actually true?");
    const admission = resolveConversationMemoryAdmission({
      promptText: "Is that actually true?",
      sourceTarget: "model_only_concept",
      allowsPriorArtifacts: false,
      followup,
    });

    expect(admission.allowed_for_current_goal).toBe(true);
    expect(admission.allowed_use).toBe("conversational_continuity");

    completeTurn({
      turnId: "turn-1",
      user: "Tell me a claim.",
      answer: "A prior unsupported claim.",
    });
    const packet = buildHelixConversationMemoryPacket({
      threadId,
      currentTurnId: "turn-2",
      sessionId,
      promptText: "Is that actually true?",
      sourceTarget: "model_only_concept",
      allowsPriorArtifacts: false,
    });

    expect(packet.reusable_evidence_refs).toEqual([]);
    expect(packet.allowed_reason).toMatch(/non-terminal continuity/i);
  });

  it("reuses previous repo result only through cited evidence refs", () => {
    completeTurn({
      turnId: "turn-1",
      user: "Find the Auntie Dottie implementation.",
      answer: "The repo evidence points at server/auntie.ts.",
    });
    const evidenceItemId = appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId: "turn-1",
      route: "/ask",
      sessionId,
      turnKind: "ask",
      itemType: "retrieval",
      itemStream: "observation",
      text: "RAW CODE SPAN SHOULD NOT APPEAR",
      observationRef: {
        path: "server/auntie.ts",
        line_start: 10,
        line_end: 18,
        note: "Auntie implementation",
      },
    });
    appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId: "turn-1",
      route: "/ask",
      sessionId,
      turnKind: "ask",
      itemType: "answer",
      itemStream: "answer",
      text: "Cited answer.",
      sourceItemIds: [evidenceItemId],
      claimLinks: [{ claim_id: "claim-1", source_item_ids: [evidenceItemId] }],
    });

    const packet = buildHelixConversationMemoryPacket({
      threadId,
      currentTurnId: "turn-2",
      sessionId,
      promptText: "Use the previous repo result and explain it more simply.",
      allowsPriorArtifacts: true,
    });

    expect(packet.allowed_use).toBe("reuse_prior_evidence_refs");
    expect(packet.reusable_evidence_refs).toEqual(expect.arrayContaining(["server/auntie.ts:10-18"]));
    expect(packet.resolved_references[0]).toMatchObject({
      refers_to_kind: "prior_evidence",
    });
    expect(JSON.stringify(packet)).not.toContain("RAW CODE SPAN SHOULD NOT APPEAR");
  });

  it("rejects stale UI projection as evidence authority", () => {
    completeTurn({
      turnId: "turn-1",
      user: "Open a card.",
      answer: "A card was shown.",
    });
    appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId: "turn-1",
      route: "/ask",
      sessionId,
      turnKind: "ask",
      itemType: "toolObservation",
      itemStream: "observation",
      text: "client projection text",
      observationRef: { artifact_ref: "card:last" },
      meta: { role: "client_projection", kind: "live_card_projection" },
    });

    const packet = buildHelixConversationMemoryPacket({
      threadId,
      currentTurnId: "turn-2",
      sessionId,
      promptText: "Use the last card as proof.",
      allowsPriorArtifacts: true,
    });

    expect(packet.forbidden_or_stale_refs).toEqual(expect.arrayContaining(["card:last"]));
    expect(packet.reusable_evidence_refs).not.toContain("card:last");
    expect(packet.missing_or_uncertain.join(" ")).toMatch(/not admitted as evidence authority/i);
  });

  it("exposes previous failure as failure, not answer", () => {
    completeTurn({
      turnId: "turn-1",
      user: "Run the impossible route.",
      failReason: "missing_allowed_terminal_artifact",
    });

    const packet = buildHelixConversationMemoryPacket({
      threadId,
      currentTurnId: "turn-2",
      sessionId,
      promptText: "Why did it fail?",
    });

    expect(packet.open_failures).toEqual(expect.arrayContaining(["missing_allowed_terminal_artifact"]));
    expect(packet.resolved_references[0]).toMatchObject({
      refers_to_kind: "prior_failure",
    });
    expect(packet.assistant_answer).toBe(false);
    expect(packet.terminal_eligible).toBe(false);
  });

  it("keeps adversarial lexical cues from becoming high-confidence follow-ups", () => {
    const prompts = [
      "Do not continue from the previous answer.",
      "If I say continue later, what should happen?",
      "The screenshot says \"continue.\"",
      "Historically, \"that\" referred to a different project.",
    ];

    for (const promptText of prompts) {
      const followup = detectHelixFollowupReferences(promptText);
      expect(followup.is_followup).toBe(false);
      expect(followup.followup_kind).toBe("none");
    }
  });

  it("surfaces pending user input separately from answers", () => {
    completeTurn({
      turnId: "turn-1",
      user: "Ask me what file to inspect.",
      answer: "Which file should I inspect?",
    });
    appendHelixThreadServerRequestEvent({
      thread_id: threadId,
      route: "/ask",
      event_type: "server_request_created",
      turn_id: "turn-1",
      session_id: sessionId,
      turn_kind: "ask",
      request_id: "req-1",
      request_kind: "request_user_input",
      item_status: "in_progress",
      request_payload: { question: "Which file should I inspect?" },
    });

    const packet = buildHelixConversationMemoryPacket({
      threadId,
      currentTurnId: "turn-2",
      sessionId,
      promptText: "This one.",
    });

    expect(packet.pending_user_inputs).toEqual(expect.arrayContaining(["Which file should I inspect?"]));
    expect(packet.allowed_use).toBe("pending_request_resolution");
  });

  it("admits slot-fill text for unresolved triangle task frames", () => {
    completeTurn({
      turnId: "turn-1",
      user: "If the longest side of a triangle is 9 1/8 inches, what are the other two sides?",
      answer: "I need one more triangle constraint.",
    });
    appendHelixThreadServerRequestEvent({
      thread_id: threadId,
      route: "/ask",
      event_type: "server_request_created",
      turn_id: "turn-1",
      session_id: sessionId,
      turn_kind: "ask",
      request_id: "req-triangle",
      request_kind: "request_user_input",
      item_status: "in_progress",
      request_payload: {
        schema: "helix.pending_server_request.v1",
        prompt: "I need one more triangle constraint before calculating the other sides.",
        user_goal_summary: "If the longest side of a triangle is 9 1/8 inches, what are the other two sides?",
        required_fields: ["triangle_type", "angle", "another_side", "perimeter", "area", "side_ratio"],
        unresolved_task_frame: {
          id: "math_geometry_triangle:req-triangle",
          kind: "math_geometry_triangle",
          created_turn_id: "turn-1",
          updated_turn_id: "turn-1",
          status: "missing_slots",
          original_user_request: "If the longest side of a triangle is 9 1/8 inches, what are the other two sides?",
          known_slots: {
            longest_side: {
              raw: "9 1/8 inches",
              expression: "73/8",
              decimal: 9.125,
              unit: "in",
            },
          },
          missing_slots: ["triangle_type", "angle", "another_side", "perimeter", "area", "side_ratio"],
          constraints: ["0 < a <= c", "0 < b <= c", "a + b > c"],
          assumptions: [],
          source_request_user_input_id: "req-triangle",
          allowed_next_actions: ["ask_user", "merge_clarification", "route_calculator"],
        },
      },
    });

    const packet = buildHelixConversationMemoryPacket({
      threadId,
      currentTurnId: "turn-2",
      sessionId,
      promptText: "The other two sides are equal in length.",
    });

    expect(packet.allowed_use).toBe("pending_request_resolution");
    expect(packet.allowed_reason).toMatch(/fill a slot/i);
    expect(packet.unresolved_task_frames[0]).toMatchObject({
      kind: "math_geometry_triangle",
      status: "missing_slots",
      known_slots: {
        longest_side: {
          expression: "73/8",
          unit: "in",
        },
      },
    });
    expect(packet.resolved_references[0]).toMatchObject({
      refers_to_kind: "pending_user_input",
    });
  });
});
