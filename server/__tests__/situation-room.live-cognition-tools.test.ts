import { describe, expect, it } from "vitest";
import { planLiveLineToolRequest } from "../services/helix-ask/live-line-tool-request-planner";
import { buildLiveCardLineStates } from "../services/situation-room/live-card-line-state-builder";
import {
  getLiveCognitionTool,
  readLiveCognitionToolRegistry,
} from "../services/situation-room/live-cognition-tool-registry";
import { selectLiveCognitionToolForLine } from "../services/situation-room/live-cognition-tool-policy";
import { createLiveAnswerEnvironment } from "../services/situation-room/live-answer-environment-store";
import { appendInterpretedEvent, listInterpretedEvents } from "../services/situation-room/interpreted-event-log-store";
import { projectPresentStateCard } from "../services/situation-room/present-state-card-projector";
import { synthesizePresentState } from "../services/situation-room/present-state-synthesizer";

const now = "2026-05-15T00:00:00.000Z";

describe("live cognition tool registry and present-state synthesis", () => {
  it("lists initial cognition tools as non-answer tools", () => {
    const registry = readLiveCognitionToolRegistry();
    expect(registry.assistant_answer).toBe(false);
    expect(registry.tools.map((tool) => tool.tool_id)).toEqual(expect.arrayContaining([
      "minecraft.query_event_window",
      "minecraft.query_world_sense_window",
      "minecraft.lookup_semantics",
      "visual.align_latest_with_event_window",
      "visual.capture_now",
      "visual.compare_to_place_memory",
      "scientific-calculator.solve_with_steps",
      "docs-viewer.lookup_reference",
      "workstation-notes.append_to_note",
      "situation-room.run_agentic_review",
      "situation-room.run_present_state_review",
    ]));
    expect(registry.tools.every((tool) => tool.creates_assistant_answer === false)).toBe(true);
  });

  it("maps representative lines to cognition tools", () => {
    expect(selectLiveCognitionToolForLine({
      key: "risk",
      label: "Risk",
      value: "DatDamPig has a nearby Minecraft threat.",
    })?.tool_id).toBe("minecraft.query_event_window");

    expect(selectLiveCognitionToolForLine({
      key: "entities",
      label: "Entities",
      value: "contained chicken cluster near wheat farm.",
    })?.tool_id).toBe("minecraft.query_world_sense_window");

    expect(selectLiveCognitionToolForLine({
      key: "missing_evidence",
      label: "Missing evidence",
      value: "visual frame does not prove the vertical relation.",
    })?.tool_id).toBe("visual.align_latest_with_event_window");

    expect(selectLiveCognitionToolForLine({
      key: "current_equation",
      label: "Equation",
      value: "solve 64 + 12 + 3 with calculator.",
    })?.tool_id).toBe("scientific-calculator.solve_with_steps");
  });

  it("extends line tool planning to visual uncertainty lines", () => {
    const request = planLiveLineToolRequest({
      threadId: "thread:live-cognition:visual",
      line: {
        key: "missing_evidence",
        label: "Missing evidence",
        value: "visual frame does not yet prove automation or vertical relation.",
        evidence_refs: ["visual_evidence:test"],
      },
      autoRecord: false,
      now,
    });
    expect(request).toMatchObject({
      requested_tool: "visual.align_latest_with_event_window",
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("builds line state with evidence, missing evidence, next tool, and last check result", () => {
    const states = buildLiveCardLineStates({
      lines: [{
        key: "risk",
        label: "Risk",
        value: "nearby hostile context, no damage event in current window.",
        confidence: 0.61,
        evidence_refs: ["event:hostile"],
        updated_at: now,
      }],
      evaluations: [{
        schema: "helix.live_line_tool_evaluation.v1",
        evaluation_id: "eval:risk",
        request_id: "request:risk",
        thread_id: "thread:line-state",
        line_key: "risk",
        tool_receipt_refs: ["receipt:risk"],
        supports_line: "partial",
        confidence_delta: 0.1,
        next_line_value: null,
        missing_evidence: ["No damage event observed."],
        summary: "Risk partially supported.",
        deterministic: true,
        model_invoked: false,
        deterministic_content_role: "evidence_not_assistant_answer",
        raw_content_included: false,
        assistant_answer: false,
        created_at: now,
      }],
      now,
    });
    expect(states[0]).toMatchObject({
      evidence_status: "partial",
      next_best_tool: "minecraft.query_event_window",
      last_check_result: "partial",
      last_check_refs: ["receipt:risk"],
      assistant_answer: false,
      role: "ui_projection",
    });
    expect(states[0].missing_evidence).toContain("No damage event observed.");
  });

  it("rewrites reducer-shaped Minecraft lines into Dot-style present-state lines", () => {
    const lineStates = buildLiveCardLineStates({
      lines: [
        {
          key: "goal",
          label: "Goal",
          value: "collect cobblestone slab",
          confidence: null,
          evidence_refs: ["source:setup"],
          updated_at: now,
        },
        {
          key: "progress",
          label: "Progress",
          value: "Waiting for meaningful progress events.",
          confidence: null,
          evidence_refs: ["source:setup"],
          updated_at: now,
        },
        {
          key: "unknowns",
          label: "Unknowns",
          value: "exact_block_edits, vertical_descent",
          confidence: null,
          evidence_refs: ["source:setup"],
          updated_at: now,
        },
      ],
      now,
    });
    const synthesis = synthesizePresentState({
      threadId: "thread:synthesis",
      roomId: "room:minecraft",
      lineStates,
      interpretedEvents: [
        {
          schema: "helix.interpreted_event.v1",
          event_id: "visual:event",
          thread_id: "thread:synthesis",
          room_id: "room:minecraft",
          source_family: "visual_snapshot",
          kind: "visual_observation",
          title: "Visual frame analyzed",
          summary: "The frame shows wheat rows, chickens, and slab blocks near a farm boundary.",
          confidence: 0.72,
          evidence_refs: ["visual_evidence:farm"],
          source_event_ids: ["frame:farm"],
          related_artifact_ids: [],
          related_job_ids: [],
          created_at: now,
          model_invoked: true,
          deterministic: false,
          assistant_answer: false,
          raw_logs_included: false,
          context_policy: "compact_context_pack_only",
        },
      ],
      now,
    });
    expect(synthesis.assistant_answer).toBe(false);
    expect(synthesis.role).toBe("ui_projection");
    expect(synthesis.lines.map((line) => `${line.label}: ${line.value}`)).toEqual(expect.arrayContaining([
      "Place: Wheat/chicken farm area.",
      "Activity: Decorating or editing the farm boundary.",
      "Next check: Align latest visual frame with recent slab/block/entity events.",
    ]));
    expect(synthesis.evidence_refs).toContain("visual_evidence:farm");
  });

  it("projects synthesis onto the present-state card and records an interpreted synthesis row", () => {
    const threadId = `thread:project:${Date.now()}`;
    createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: "turn:test",
      objective: "Minecraft Cortana monitor",
      room_id: "room:minecraft-live-cognition",
      source_ids: ["source:minecraft-server"],
      preset: "minecraft_run_monitor",
      now,
    });
    appendInterpretedEvent({
      thread_id: threadId,
      room_id: "room:minecraft-live-cognition",
      source_family: "visual_snapshot",
      kind: "visual_observation",
      title: "Visual frame analyzed",
      summary: "Wheat rows, chickens, and slabs are visible near the farm boundary.",
      evidence_refs: ["visual_evidence:farm-card"],
      source_event_ids: ["frame:farm-card"],
      model_invoked: true,
      deterministic: false,
      created_at: now,
    });

    const card = projectPresentStateCard({
      threadId,
      roomId: "room:minecraft-live-cognition",
    });
    expect(card.present_state_synthesis).toMatchObject({
      assistant_answer: false,
      role: "ui_projection",
    });
    expect(card.line_states?.length).toBeGreaterThan(0);
    expect(card.lines.some((line) => line.label === "Place" && /wheat\/chicken farm/i.test(line.value))).toBe(true);
    expect(listInterpretedEvents({ threadId, roomId: "room:minecraft-live-cognition", limit: 20 }).some((event) => event.kind === "present_state_synthesis")).toBe(true);
    expect(getLiveCognitionTool(card.line_states?.[0]?.next_best_tool ?? "")?.creates_assistant_answer ?? false).toBe(false);
  });
});
