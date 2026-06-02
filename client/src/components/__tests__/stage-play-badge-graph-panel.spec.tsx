// @vitest-environment jsdom
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StagePlayBadgeGraphPanel from "../panels/StagePlayBadgeGraphPanel";
import { useStagePlayBadgeGraphPanelStore } from "@/store/useStagePlayBadgeGraphPanelStore";
import { useLiveAnswerEnvironmentStore } from "@/store/useLiveAnswerEnvironmentStore";
import {
  buildStagePlayBadgeGraphV1,
  type StagePlayBadgeGraphV1,
  type StagePlayBadgeV1,
} from "@shared/contracts/stage-play-badge-graph.v1";

const sourceWindow: StagePlayBadgeGraphV1["sourceWindow"] = {
  threadId: "thread:stage-play-ui",
  roomId: "room:minecraft",
  worldId: "world:overworld",
  environmentId: "live_env:minecraft",
  fromTs: "2026-06-02T00:00:00.000Z",
  toTs: "2026-06-02T00:00:01.000Z",
  latestObservationRefs: ["live_source_observation:ui"],
  latestSnapshotRefs: ["environment_snapshot:ui"],
  latestDeltaOverlayRefs: [],
  latestNavigationRefs: ["navigation_state:ui"],
  freshness: "fresh",
};

const sourceRefs: StagePlayBadgeV1["sourceRefs"] = [
  { kind: "live_source_observation", id: "live_source_observation:ui" },
  { kind: "environment_state_snapshot", id: "environment_snapshot:ui" },
];

function badge(overrides: Partial<StagePlayBadgeV1>): StagePlayBadgeV1 {
  return {
    id: "intent.move_away",
    title: "Move away",
    plainMeaning: "Create distance from a nearby threat.",
    whyItMatters: "Distance changes the immediate action bounds.",
    kind: "intent_module",
    status: "candidate",
    subjects: ["player"],
    tags: ["movement"],
    liveBindings: [],
    sourceRefs,
    evidenceRefs: ["environment_snapshot:ui"],
    confidence: 0.82,
    missingEvidence: [],
    reasonCodes: ["live_world_hazard_nearby"],
    intentModule: { verb: "move_away", actorId: "actor.player" },
    admission: "ask_user",
    ...overrides,
  };
}

function buildFixture(): StagePlayBadgeGraphV1 {
  return buildStagePlayBadgeGraphV1({
    graphId: "stage_play_badge_graph:ui-fixture",
    title: "Stage Play Badge Graph",
    description: "Fixture-backed live-world action graph.",
    sourceWindow,
    badges: [
      badge({
        id: "actor.player",
        title: "Player",
        plainMeaning: "The current player actor is present in the source window.",
        whyItMatters: "Player state anchors possible actions.",
        kind: "actor",
        status: "observed",
        liveBindings: [{
          bindingKind: "actor_pose",
          sourceRefIds: ["environment_snapshot:ui"],
          freshness: "fresh",
          confidence: 1,
          compactValue: "x=4 y=64 z=8",
        }],
        intentModule: undefined,
      }),
      badge({ id: "intent.move_away", title: "Move away", intentModule: { verb: "move_away", actorId: "actor.player" } }),
      badge({
        id: "intent.maintain_line_of_sight",
        title: "Maintain line of sight",
        intentModule: { verb: "maintain_line_of_sight", actorId: "actor.player", preserves: ["threat_visibility"] },
      }),
      badge({
        id: "intent.place_block",
        title: "Place block",
        intentModule: { verb: "place_block", actorId: "actor.player", requires: ["resource.cobblestone.available"] },
      }),
      badge({
        id: "procedure.defensive_retreat_barrier",
        title: "Defensive Retreat Barrier",
        plainMeaning: "Player creates distance while preserving threat visibility and placing blocks as a barrier.",
        whyItMatters: "This is a candidate action composition, not execution permission.",
        kind: "procedural_binding",
        status: "candidate",
        intentModule: {
          verb: "retreat",
          actorId: "actor.player",
          requires: ["intent.move_away", "intent.maintain_line_of_sight", "intent.place_block"],
          preserves: ["threat_visibility", "floor_integrity"],
        },
        reasonCodes: ["live_world_hazard_nearby", "low_health_constraint", "placeable_blocks_available"],
      }),
    ],
    edges: [
      {
        id: "edge:move-away:defensive-retreat-barrier",
        from: "intent.move_away",
        to: "procedure.defensive_retreat_barrier",
        relation: "composes_with",
        label: "move away contributes to retreat barrier",
        evidenceRefs: ["environment_snapshot:ui"],
        reasonCodes: ["live_world_hazard_nearby"],
      },
      {
        id: "edge:line-of-sight:defensive-retreat-barrier",
        from: "intent.maintain_line_of_sight",
        to: "procedure.defensive_retreat_barrier",
        relation: "preserves",
        label: "preserves threat visibility",
        evidenceRefs: ["environment_snapshot:ui"],
        reasonCodes: ["live_world_hazard_nearby"],
      },
      {
        id: "edge:place-block:defensive-retreat-barrier",
        from: "intent.place_block",
        to: "procedure.defensive_retreat_barrier",
        relation: "requires",
        label: "requires placeable blocks",
        evidenceRefs: ["environment_snapshot:ui"],
        reasonCodes: ["placeable_blocks_available"],
      },
    ],
    recommendedActions: [
      {
        id: "stage-action:defensive-retreat-barrier",
        label: "Candidate: retreat while tracking threat and place blocks as barrier",
        actionType: "navigation_hint",
        admission: "ask_user",
        agentExecutable: false,
        reasonCodes: ["live_world_hazard_nearby", "low_health_constraint", "requires_user_world_action"],
        evidenceRefs: ["environment_snapshot:ui"],
        missingEvidence: [],
      },
    ],
  });
}

function renderPanel() {
  const graph = buildFixture();
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    return new Response(JSON.stringify(graph), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StagePlayBadgeGraphPanel />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  useStagePlayBadgeGraphPanelStore.getState().resetPanelMemory();
  useLiveAnswerEnvironmentStore.setState({
    environmentByThread: {},
    environmentById: {},
    deltasByEnvironment: {},
    latestReadByThread: {},
    diagnosticsByThread: {},
  });
  vi.unstubAllGlobals();
  cleanup();
});

describe("StagePlayBadgeGraphPanel", () => {
  it("renders the Theory-style shell with Stage Play badge semantics", async () => {
    renderPanel();

    expect(await screen.findByTestId("stage-play-badge-graph-scrollport")).toBeTruthy();
    expect(screen.getAllByText("Defensive Retreat Barrier").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Defensive Retreat Barrier" })[0]);

    expect(screen.getByText("Procedural Binding")).toBeTruthy();
    expect(screen.getByText(/retreat \+ intent.move_away \+ intent.maintain_line_of_sight \+ intent.place_block/i)).toBeTruthy();
    expect(screen.getByText("Admission")).toBeTruthy();
    expect(screen.getByText(/Candidate: retreat while tracking threat/i)).toBeTruthy();
    expect(screen.getByText(/agent executable: false/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /execute|run command|auto move|auto place/i })).toBeNull();
  });

  it("requests the transient graph with live thread, room, and environment identifiers", async () => {
    useLiveAnswerEnvironmentStore.setState({
      environmentByThread: {
        "helix-ask:desktop": {
          schema: "helix.live_answer_environment.v1",
          environment_id: "live_env:ui",
          thread_id: "helix-ask:desktop",
          created_turn_id: "turn:ui",
          objective: "Reflect live world bounds.",
          room_id: "room:minecraft-env",
          source_ids: [],
          graph_id: null,
          status: "active",
          mode: "text_only",
          preset: "minecraft",
          line_keys: [],
          active_lines: [],
          token_budget: 0,
          evidence_refs: [],
          created_at: "2026-06-02T00:00:00.000Z",
          updated_at: "2026-06-02T00:00:00.000Z",
          context_role: "tool_evidence",
          terminal_eligible: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
          raw_content_included: false,
          deterministic_content_role: "observation_not_assistant_answer",
        },
      },
      environmentById: {},
      deltasByEnvironment: {},
      latestReadByThread: {},
      diagnosticsByThread: {},
    });

    renderPanel();

    await screen.findByTestId("stage-play-badge-graph-scrollport");
    const firstUrl = String(vi.mocked(fetch).mock.calls[0]?.[0] ?? "");
    expect(firstUrl).toContain("/api/helix/stage-play/graph?");
    expect(firstUrl).toContain("threadId=helix-ask%3Adesktop");
    expect(firstUrl).toContain("roomId=room%3Aminecraft-env");
    expect(firstUrl).toContain("environmentId=live_env%3Aui");
  });
});
