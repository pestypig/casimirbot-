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

type TestSourceHandle = {
  sourceId: string;
  sourceClass: string;
  status: string;
  label: unknown;
  descriptorId: unknown;
  producerId: unknown;
  surface: unknown;
  origin: unknown;
  cadenceMs: unknown;
  latestEvidenceRefs: string[];
};

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

function buildSourceHandles(options: {
  descriptors?: Array<Record<string, unknown>>;
  producers?: Array<Record<string, unknown>>;
}): TestSourceHandle[] {
  const producers: Array<Record<string, unknown>> = options.producers ?? [];
  const producerBySource = new Map<string, Record<string, unknown>>(
    producers.map((producer: Record<string, unknown>) => [String(producer.source_id), producer]),
  );
  const handles = new Map<string, TestSourceHandle>();
  for (const descriptor of options.descriptors ?? []) {
    const sourceId = String(descriptor.source_id);
    const serving = descriptor.serving_context as Record<string, unknown> | undefined;
    const producer = producerBySource.get(sourceId);
    handles.set(sourceId, {
      sourceId,
      sourceClass: String(descriptor.modality),
      status: String(descriptor.current_state),
      label: descriptor.user_label ?? null,
      descriptorId: descriptor.descriptor_id ?? null,
      producerId: producer?.producer_id ?? null,
      surface: serving?.surface ?? null,
      origin: serving?.source_origin ?? null,
      cadenceMs: descriptor.cadence_ms ?? producer?.cadence_ms ?? null,
      latestEvidenceRefs: [
        descriptor.descriptor_id,
        producer?.producer_id,
        ...(Array.isArray(descriptor.latest_observation_refs) ? descriptor.latest_observation_refs : []),
        producer?.latest_chunk_id,
      ].filter((entry): entry is string => typeof entry === "string" && entry.length > 0),
    });
  }
  for (const producer of producers) {
    const sourceId = String(producer.source_id);
    if (handles.has(sourceId)) continue;
    handles.set(sourceId, {
      sourceId,
      sourceClass: String(producer.modality),
      status: String(producer.status),
      label: null,
      descriptorId: null,
      producerId: producer.producer_id ?? null,
      surface: null,
      origin: null,
      cadenceMs: producer.cadence_ms ?? null,
      latestEvidenceRefs: [producer.producer_id, producer.latest_chunk_id]
        .filter((entry): entry is string => typeof entry === "string" && entry.length > 0),
    });
  }
  return Array.from(handles.values());
}

function sourceIdFromDraftNode(node: Record<string, unknown>): string {
  const bind = node.bind as Record<string, unknown> | null;
  return String(bind?.sourceId ?? "");
}

function fetchCallUrls(): string[] {
  const calls = vi.mocked(fetch).mock.calls as Array<[RequestInfo | URL, RequestInit?]>;
  return calls.map((call: [RequestInfo | URL, RequestInit?]) => String(call[0]));
}

function renderPanel(options: {
  descriptors?: Array<Record<string, unknown>>;
  producers?: Array<Record<string, unknown>>;
} = {}) {
  const graph = buildFixture();
  const sourceHandles = buildSourceHandles(options);
  const fetchMock = vi.fn(async (requestInput: RequestInfo | URL, init?: RequestInit) => {
    const url = String(requestInput);
    if (url.includes("/api/helix/stage-play/builder")) {
      return new Response(JSON.stringify({
        artifactId: "stage_play_builder_context",
        schemaVersion: "stage_play_builder_context/v1",
        generatedAt: "2026-06-02T00:00:00.000Z",
        catalog: {
          artifactId: "stage_play_builder_catalog",
          schemaVersion: "stage_play_builder_catalog/v1",
          generatedAt: "2026-06-02T00:00:00.000Z",
          nodeKinds: ["source", "interpreter", "intent_module", "procedural_binding"],
          edgeRelations: ["feeds", "interprets", "composes_with", "constrains"],
          sourceClasses: ["visual_frame", "audio_transcript", "minecraft_world_events"],
          portKinds: ["source_handle", "incoming_compact_window", "checkpoint_receipt"],
          requiredFlow: ["source feeds interpreter", "all outputs remain evidence-only"],
          authority: {
            assistant_answer: false,
            raw_content_included: false,
            raw_payload_included: false,
            terminal_eligible: false,
            agent_executable: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
            instruction_authority: "none",
            ask_instruction_authority: "none",
          },
        },
        sourceQuery: {
          artifactId: "stage_play_source_query",
          schemaVersion: "stage_play_source_query/v1",
          generatedAt: "2026-06-02T00:00:00.000Z",
          threadId: "helix-ask:desktop",
          environmentId: null,
          sourceHandles,
          authority: {
            assistant_answer: false,
            raw_content_included: false,
            raw_payload_included: false,
            terminal_eligible: false,
            agent_executable: false,
            context_role: "tool_evidence",
            ask_context_policy: "evidence_only",
            instruction_authority: "none",
            ask_instruction_authority: "none",
          },
        },
        authority: {
          assistant_answer: false,
          raw_content_included: false,
          raw_payload_included: false,
          terminal_eligible: false,
          agent_executable: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
          instruction_authority: "none",
          ask_instruction_authority: "none",
        },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/api/helix/stage-play/draft/validate")) {
      const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
      const draft = body.draft as Record<string, unknown> | undefined;
      const nodes = Array.isArray(draft?.nodes) ? draft.nodes as Array<Record<string, unknown>> : [];
      const sourceHandleById = new Map(sourceHandles.map((handle: TestSourceHandle) => [handle.sourceId, handle]));
      const resolvedSourceIds = nodes
        .map(sourceIdFromDraftNode)
        .filter((sourceId: string) => sourceHandleById.has(sourceId));
      const issues = nodes
        .map(sourceIdFromDraftNode)
        .filter((sourceId: string) => sourceId.length > 0 && !sourceHandleById.has(sourceId))
        .map((sourceId: string) => `source handle unavailable: ${sourceId}`);
      const validation = {
        artifactId: "stage_play_graph_draft_validation",
        schemaVersion: "stage_play_graph_draft_validation/v1",
        generatedAt: "2026-06-02T00:00:01.000Z",
        ok: issues.length === 0,
        draftId: String(draft?.draftId ?? "stage_play_panel_draft"),
        issues,
        warnings: nodes.some((node: Record<string, unknown>) => node.kind === "interpreter") ? [] : ["draft has no interpreter node"],
        resolvedSourceIds,
        evidenceRefs: sourceHandles
          .filter((handle: TestSourceHandle) => resolvedSourceIds.includes(handle.sourceId))
          .flatMap((handle: TestSourceHandle) => handle.latestEvidenceRefs),
        missingEvidence: [],
        authority: {
          assistant_answer: false,
          raw_content_included: false,
          raw_payload_included: false,
          terminal_eligible: false,
          agent_executable: false,
          context_role: "tool_evidence",
          ask_context_policy: "evidence_only",
          instruction_authority: "none",
          ask_instruction_authority: "none",
        },
      };
      return new Response(JSON.stringify({
        ...validation,
      }), {
        status: validation.ok ? 200 : 422,
        headers: { "Content-Type": "application/json" },
      });
    }
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

function dispatchPointer(target: EventTarget, type: string, clientX: number, clientY: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  fireEvent(target, event);
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
    expect(screen.queryByTestId("stage-play-binding-overlay")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play bindings" }));
    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();
    expect(await screen.findByTestId("stage-play-builder-artifacts")).toBeTruthy();
    const overlay = screen.getByTestId("stage-play-binding-overlay");
    const overlayText = overlay.textContent ?? "";
    expect(overlayText.indexOf("Node builder")).toBeLessThan(overlayText.indexOf("Tool assembly"));
    expect(overlayText.indexOf("Tool assembly")).toBeLessThan(overlayText.indexOf("Source handles"));
    expect(screen.getByText("stage_play_builder_catalog/v1")).toBeTruthy();
    expect(screen.getByText("stage_play_source_query/v1")).toBeTruthy();
    expect(screen.getByText("stage_play_graph_draft_validation/v1")).toBeTruthy();
    expect(screen.getByText("Node builder")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Intent Module/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Procedure/i })).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Defensive Retreat Barrier" })[0]);

    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();
    expect(screen.getByText("Procedural Binding")).toBeTruthy();
    expect(screen.getAllByText(/retreat \+ intent.move_away \+ intent.maintain_line_of_sight \+ intent.place_block/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Admission")).toBeTruthy();
    expect(screen.getByText(/Candidate: retreat while tracking threat/i)).toBeTruthy();
    expect(screen.getByText(/agent executable: false/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /execute|run command|auto move|auto place/i })).toBeNull();
  });

  it("adds matching live nodes from the builder palette into the selected trace", async () => {
    renderPanel();

    await screen.findByTestId("stage-play-badge-graph-scrollport");
    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play bindings" }));

    fireEvent.click(screen.getByRole("button", { name: /Intent Module/i }));

    expect(screen.getByText("intent module nodes")).toBeTruthy();
    expect(screen.getAllByText(/move_away/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/maintain_line_of_sight/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/place_block/i).length).toBeGreaterThan(0);
  });

  it("drags a builder node onto the graph as a local draft node", async () => {
    renderPanel();

    const scrollport = await screen.findByTestId("stage-play-badge-graph-scrollport");
    Object.defineProperty(scrollport, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        right: 900,
        bottom: 600,
        width: 900,
        height: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperty(scrollport, "scrollLeft", { configurable: true, value: 40 });
    Object.defineProperty(scrollport, "scrollTop", { configurable: true, value: 20 });
    scrollport.scrollBy = vi.fn();

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play bindings" }));
    dispatchPointer(screen.getByRole("button", { name: /Hazard/i }), "pointerdown", 120, 160);

    expect(screen.queryByTestId("stage-play-binding-overlay")).toBeNull();
    expect(screen.getByTestId("stage-play-held-builder-node")).toBeTruthy();

    dispatchPointer(window, "pointermove", 890, 590);
    expect(scrollport.scrollBy).toHaveBeenCalled();

    dispatchPointer(window, "pointerup", 240, 220);

    expect(screen.queryByTestId("stage-play-held-builder-node")).toBeNull();
    expect(screen.getByTestId("stage-play-draft-node")).toBeTruthy();
    expect(screen.getByTestId("stage-play-draft-parameter-editor")).toBeTruthy();
    expect(screen.getByDisplayValue("hazard_type")).toBeTruthy();
    expect(screen.getByDisplayValue("severity")).toBeTruthy();
    expect(screen.getByDisplayValue("radius_or_position")).toBeTruthy();
  });

  it("edits and adds local draft node parameters", async () => {
    renderPanel();

    const scrollport = await screen.findByTestId("stage-play-badge-graph-scrollport");
    Object.defineProperty(scrollport, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        right: 900,
        bottom: 600,
        width: 900,
        height: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperty(scrollport, "scrollLeft", { configurable: true, value: 0 });
    Object.defineProperty(scrollport, "scrollTop", { configurable: true, value: 0 });
    scrollport.scrollBy = vi.fn();

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play bindings" }));
    dispatchPointer(screen.getByRole("button", { name: /Actor/i }), "pointerdown", 120, 160);
    dispatchPointer(window, "pointerup", 240, 220);

    expect(screen.getByTestId("stage-play-draft-parameter-editor")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Parameter value entity_id"), {
      target: { value: "player:dan" },
    });

    expect(screen.getByDisplayValue("player:dan")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Add parameter" }));

    expect(screen.getByDisplayValue("parameter")).toBeTruthy();
  });

  it("binds a dropped source node to an active live source handle", async () => {
    renderPanel({
      descriptors: [
        {
          schema: "helix.live_source_descriptor.v1",
          descriptor_id: "live_source_descriptor:visual",
          source_id: "source:visual-tab",
          thread_id: "helix-ask:desktop",
          environment_id: "live_env:minecraft",
          modality: "visual_frame",
          user_label: "Anime tab",
          serving_context: {
            surface: "browser_tab",
            app_hint: "Chrome",
            window_title_hint: "Legend of the Galactic Heroes",
            source_origin: "browser_getDisplayMedia",
          },
          capabilities: ["frame_capture"],
          current_state: "active_interval",
          cadence_ms: 10000,
          latest_observation_refs: ["visual_observation:latest"],
          raw_content_included: false,
          assistant_answer: false,
        },
      ],
      producers: [
        {
          schema: "helix.live_source_producer.v1",
          producer_id: "live_source_producer:visual",
          source_id: "source:visual-tab",
          thread_id: "helix-ask:desktop",
          modality: "visual_frame",
          status: "active",
          cadence_ms: 10000,
          capture_mode: "interval",
          latest_chunk_id: "live_source_chunk:visual",
          next_chunk_due_at: null,
          backpressure_policy: { max_buffered_chunks: 12 },
          raw_content_policy: "ephemeral",
          assistant_answer: false,
        },
      ],
    });

    const scrollport = await screen.findByTestId("stage-play-badge-graph-scrollport");
    Object.defineProperty(scrollport, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        left: 0,
        top: 0,
        right: 900,
        bottom: 600,
        width: 900,
        height: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperty(scrollport, "scrollLeft", { configurable: true, value: 0 });
    Object.defineProperty(scrollport, "scrollTop", { configurable: true, value: 0 });
    scrollport.scrollBy = vi.fn();

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play bindings" }));
    dispatchPointer(screen.getByRole("button", { name: /Source Class/i }), "pointerdown", 120, 160);
    dispatchPointer(window, "pointerup", 240, 220);

    expect(screen.getByTestId("stage-play-draft-parameter-editor")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Source class"), {
      target: { value: "visual_frame" },
    });
    expect(screen.getByDisplayValue("visual_frame")).toBeTruthy();

    const activeSource = await screen.findByRole("button", { name: /Anime tab/i });
    fireEvent.click(activeSource);

    expect(screen.getByDisplayValue("source:visual-tab")).toBeTruthy();
    expect(screen.getByDisplayValue("live_source_descriptor:visual")).toBeTruthy();
    expect(screen.getByDisplayValue("live_source_producer:visual")).toBeTruthy();
    expect(screen.getByDisplayValue("visual_observation:latest")).toBeTruthy();
    expect(await screen.findByText("Draft accepted")).toBeTruthy();
    expect(screen.getByText(/Resolved source: source:visual-tab/i)).toBeTruthy();
  });

  it("lets the bindings overlay close and reopen without removing the graph", async () => {
    renderPanel();

    expect(await screen.findByTestId("stage-play-badge-graph-scrollport")).toBeTruthy();
    expect(screen.queryByTestId("stage-play-binding-overlay")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play bindings" }));
    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close Stage Play bindings" }));

    expect(screen.queryByTestId("stage-play-binding-overlay")).toBeNull();
    expect(screen.getByTestId("stage-play-badge-graph-scrollport")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play bindings" }));

    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();
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
    const graphUrl = fetchCallUrls().find((url: string) => url.includes("/api/helix/stage-play/graph?")) ?? "";
    expect(graphUrl).toContain("/api/helix/stage-play/graph?");
    expect(graphUrl).toContain("threadId=helix-ask%3Adesktop");
    expect(graphUrl).toContain("roomId=room%3Aminecraft-env");
    expect(graphUrl).toContain("environmentId=live_env%3Aui");
    const builderUrl = fetchCallUrls().find((url: string) => url.includes("/api/helix/stage-play/builder?")) ?? "";
    expect(builderUrl).toContain("/api/helix/stage-play/builder?");
    expect(builderUrl).toContain("threadId=helix-ask%3Adesktop");
    expect(builderUrl).toContain("environmentId=live_env%3Aui");
  });
});
