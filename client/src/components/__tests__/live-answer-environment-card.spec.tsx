// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveAnswerEnvironmentCard } from "@/components/helix/LiveAnswerEnvironmentCard";
import type { LiveAnswerEnvironment, LiveAnswerEnvironmentDelta } from "@shared/helix-live-answer-environment";

const environment: LiveAnswerEnvironment = {
  schema: "helix.live_answer_environment.v1",
  environment_id: "live_answer:test",
  thread_id: "helix-ask:test",
  created_turn_id: "turn:test",
  objective: "Watch my Minecraft run and tell me about danger or progress.",
  room_id: "room:minecraft-minehut",
  source_ids: ["source:minecraft-server"],
  graph_id: null,
  status: "active",
  mode: "text_only",
  line_schema: [],
  subgoals: [],
  lines: [
    {
      key: "risk",
      label: "Risk",
      update_policy: "salience_only",
      visibility: "answer_card",
      value: "Risk: DatDamPig is in danger at 4 health.",
      confidence: 0.86,
      evidence_refs: ["minecraft:event:risk"],
      updated_at: "2026-05-08T16:00:00.000Z",
      source: "deterministic_reducer",
      model_invoked: false,
    },
    {
      key: "debug",
      label: "Debug",
      update_policy: "projection_only",
      visibility: "debug_only",
      value: "raw detail",
      confidence: null,
      evidence_refs: [],
      updated_at: "2026-05-08T16:00:00.000Z",
      source: "deterministic_reducer",
      model_invoked: false,
    },
  ],
  latest_summary: "DatDamPig is in danger at 4 health.",
  evidence_refs: ["minecraft:event:risk"],
  created_at: "2026-05-08T16:00:00.000Z",
  updated_at: "2026-05-08T16:00:00.000Z",
  context_policy: "compact_context_pack_only",
  raw_transcript_included: false,
  raw_audio_included: false,
  deterministic_content_role: "observation_not_assistant_answer",
};

const delta: LiveAnswerEnvironmentDelta = {
  schema: "helix.live_answer_environment_delta.v1",
  delta_id: "delta:test",
  environment_id: "live_answer:test",
  thread_id: "helix-ask:test",
  reason: "salience_update",
  changed_line_keys: ["risk"],
  previous_hash: "before",
  next_hash: "after",
  environment_snapshot: environment,
  evidence_refs: ["minecraft:event:risk"],
  ts: "2026-05-08T16:00:00.000Z",
};

describe("LiveAnswerEnvironmentCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders answer-card lines only and opens delta trace", () => {
    render(<LiveAnswerEnvironmentCard environment={environment} deltas={[delta]} />);

    expect(screen.getByText("Live Answer Environment")).toBeTruthy();
    expect(screen.getByText("DatDamPig is in danger at 4 health.")).toBeTruthy();
    expect(screen.queryByText("raw detail")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show trace" }));
    expect(screen.getByText("Changed: risk")).toBeTruthy();
  });

  it("starts a direct Ask prompt through the card action", () => {
    const onAskHelix = vi.fn();
    render(<LiveAnswerEnvironmentCard environment={environment} onAskHelix={onAskHelix} />);
    fireEvent.click(screen.getByRole("button", { name: "Ask about this" }));
    expect(onAskHelix).toHaveBeenCalledWith(expect.stringContaining("live answer environment"));
  });
});
