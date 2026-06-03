// @vitest-environment jsdom
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StagePlayBadgeGraphPanel from "../panels/StagePlayBadgeGraphPanel";
import { useStagePlayBadgeGraphPanelStore } from "@/store/useStagePlayBadgeGraphPanelStore";
import { useLiveAnswerEnvironmentStore } from "@/store/useLiveAnswerEnvironmentStore";
import {
  buildStagePlayBadgeGraphV1,
  type StagePlayBadgeGraphV1,
  type StagePlayBadgeV1,
} from "@shared/contracts/stage-play-badge-graph.v1";

const visualProducerMock = vi.hoisted(() => ({
  getActiveVisualFrameStream: vi.fn(() => null),
  getLatestActiveVisualFrameStream: vi.fn(() => null),
  startVisualFrameProducerInterval: vi.fn(async (input: { sourceId: string }) => ({
    source_id: input.sourceId,
    frame_id: "visual_frame:test",
    evidence_id: "visual_evidence:test",
    summary: "mock visual capture",
    evidence: null,
  })),
  stopVisualFrameProducerInterval: vi.fn(),
}));

vi.mock("@/lib/helix/visualFrameProducer", () => visualProducerMock);

const sourceWindow: StagePlayBadgeGraphV1["sourceWindow"] = {
  threadId: "thread:stage-play-ui",
  roomId: "room:minecraft",
  worldId: "world:overworld",
  environmentId: "live_env:minecraft",
  fromTs: "2026-06-02T00:00:00.000Z",
  toTs: "2026-06-02T00:00:01.000Z",
  latestObservationRefs: ["live_source_observation:ui"],
  latestRawSessionBufferRefs: ["stage_play_raw_session_buffer_entry:ui"],
  sources: [
    {
      sourceId: "source:visual-tab",
      modality: "visual_frame",
      status: "active",
      contribution: "Visual frames provide compact scene context.",
      fidelityScore: 0.84,
      selectedForStagePlay: true,
      routeTo: "visual_context",
      cadenceMs: 10000,
      lastEventTs: "2026-06-02T00:00:01.000Z",
      missingReason: null,
      nextRequiredAction: null,
      evidenceRefs: ["live_source_observation:ui", "stage_play_raw_session_buffer_entry:ui"],
    },
    {
      sourceId: "source:audio-transcript",
      modality: "audio_transcript",
      status: "configured_missing",
      contribution: "Audio transcript can provide dialogue once attached.",
      fidelityScore: 0,
      selectedForStagePlay: false,
      routeTo: "narrative_stage_play",
      cadenceMs: null,
      lastEventTs: null,
      missingReason: "No audio transcript source is currently attached.",
      nextRequiredAction: "Attach audio transcript",
      evidenceRefs: [],
    },
    {
      sourceId: "source:live-answer",
      modality: "live_answer_output",
      status: "active",
      contribution: "Live Answer output receives projected Stage Play evidence lanes after explicit projection.",
      fidelityScore: 0.7,
      selectedForStagePlay: false,
      routeTo: "live_answer_output",
      cadenceMs: null,
      lastEventTs: "2026-06-02T00:00:01.000Z",
      missingReason: null,
      nextRequiredAction: null,
      evidenceRefs: ["live_answer_environment:ui"],
    },
  ],
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
        id: "observer.live_sources",
        title: "Observer",
        plainMeaning: "Source custody and routing for the Stage Play window.",
        whyItMatters: "Observer shows source availability before story or world facts are interpreted.",
        kind: "observer",
        status: "observed",
        liveBindings: [],
        intentModule: undefined,
        evidenceRefs: ["live_source_observation:ui"],
        reasonCodes: ["observer_source_custody"],
        dataTray: {
          title: "Observer",
          summary: "latest scene summary available",
          updatedAt: "2026-06-02T00:00:01.000Z",
          freshness: "fresh",
          confidence: 0.84,
          evidenceRefs: ["live_source_observation:ui"],
        },
      }),
      badge({
        id: "source.visual_tab",
        title: "Visual Tab Source",
        plainMeaning: "Visual source handle routed into the Stage Play graph.",
        whyItMatters: "Source nodes make live-source custody selectable from the graph instead of buried in the console.",
        kind: "source",
        status: "observed",
        subjects: ["source:visual-tab"],
        tags: ["source", "visual_frame"],
        sourceRefs: [
          { kind: "live_source_observation", id: "live_source_observation:ui" },
          { kind: "stage_play_raw_session_buffer_entry", id: "stage_play_raw_session_buffer_entry:ui" },
        ],
        liveBindings: [{
          bindingKind: "source_modality",
          sourceRefIds: ["live_source_observation:ui"],
          freshness: "fresh",
          confidence: 0.84,
          compactValue: "visual_frame:active:visual_context",
        }],
        intentModule: undefined,
        evidenceRefs: ["live_source_observation:ui", "stage_play_raw_session_buffer_entry:ui"],
        reasonCodes: ["source_handle"],
      }),
      badge({
        id: "interpreter.stage_play_reflection",
        title: "Stage Play interpreter",
        plainMeaning: "A compact interpretation job can reduce selected sources into stage facts and procedural bindings.",
        whyItMatters: "The interpreter may produce evidence projections, but it cannot answer or act.",
        kind: "interpreter",
        status: "candidate",
        subjects: ["thread:stage-play-ui", "room:minecraft"],
        tags: ["interpreter", "reflect_stage_play_context", "evidence_only"],
        liveBindings: [{
          bindingKind: "source_status",
          sourceRefIds: ["live_source_observation:ui"],
          freshness: "fresh",
          confidence: 0.76,
          compactValue: "fresh",
        }],
        intentModule: undefined,
        evidenceRefs: ["live_source_observation:ui"],
        reasonCodes: ["stage_play_interpreter", "compact_source_window"],
      }),
      badge({
        id: "compact_observation.latest",
        title: "Latest Compact Observation",
        plainMeaning: "The latest compact observation summarizes source facts without raw transcript or frames.",
        whyItMatters: "Compact observations are the source-window facts that downstream stage badges can cite.",
        kind: "compact_observation",
        status: "observed",
        subjects: ["source:visual-tab"],
        tags: ["compact_observation", "visual_context"],
        sourceRefs: [{ kind: "stage_play_compact_observation", id: "stage_play_compact_observation:ui" }],
        liveBindings: [{
          bindingKind: "source_status",
          sourceRefIds: ["stage_play_compact_observation:ui"],
          freshness: "fresh",
          confidence: 0.76,
          compactValue: "scene window: player visible",
        }],
        intentModule: undefined,
        admission: null,
        confidence: 0.76,
        evidenceRefs: ["stage_play_compact_observation:ui"],
        reasonCodes: ["compact_source_window"],
        dataTray: {
          title: "Compact observation",
          summary: "latest compact fact summary",
          updatedAt: "2026-06-02T00:00:01.000Z",
          freshness: "fresh",
          confidence: 0.76,
          evidenceRefs: ["stage_play_compact_observation:ui"],
        },
      }),
      badge({
        id: "helix_ask.checkpoint.latest",
        title: "Latest Ask Checkpoint",
        plainMeaning: "The latest Ask checkpoint records whether the solver completed a model-reviewed path.",
        whyItMatters: "Only completed model-reviewed checkpoints can uphold an answer snapshot.",
        kind: "helix_ask_checkpoint",
        status: "observed",
        subjects: ["thread:stage-play-ui"],
        tags: ["ask_checkpoint", "model_reviewed"],
        liveBindings: [],
        intentModule: undefined,
        admission: null,
        confidence: 0.92,
        evidenceRefs: ["ask_turn_solver_trace:ui"],
        reasonCodes: ["completed_solver_path", "route_authority_passed"],
        checkpoint: {
          askTurnId: "ask-turn:ui",
          solverTraceRef: "ask_turn_solver_trace:ui",
          terminalArtifactKind: "workstation_tool_evaluation",
          finalAnswerSource: "model",
          modelReviewed: true,
        },
        dataTray: {
          title: "Ask checkpoint",
          summary: "solver completed; model reviewed",
          updatedAt: "2026-06-02T00:00:02.000Z",
          freshness: "fresh",
          confidence: 0.92,
          evidenceRefs: ["ask_turn_solver_trace:ui"],
        },
      }),
      badge({
        id: "checkpoint_request.ui",
        title: "Checkpoint Request: Meaningful Perturbation",
        plainMeaning: "A bounded Helix Ask checkpoint has been requested for this Stage Play job.",
        whyItMatters: "The request queues visible reasoning without creating a hidden answer loop.",
        kind: "checkpoint_request",
        status: "ask_user_required",
        subjects: ["stage_play_job:ui", "stage_play_badge_graph:ui-fixture"],
        tags: ["checkpoint_request", "meaningful_perturbation", "queued"],
        liveBindings: [],
        sourceRefs: [{ kind: "stage_play_checkpoint_request", id: "stage_play_checkpoint_request:ui" }],
        intentModule: undefined,
        admission: "ask_user",
        confidence: 0.72,
        evidenceRefs: [
          "stage_play_checkpoint_request:ui",
          "stage_play_badge_graph:ui-fixture",
          "stage_play_perturbation_event:ui",
        ],
        reasonCodes: [
          "stage_play_checkpoint_request",
          "checkpoint_reason_meaningful_perturbation",
          "checkpoint_status_queued",
          "requires_user_approval",
        ],
        dataTray: {
          title: "Checkpoint request",
          summary: "Meaningful perturbation is queued; visible queue first.",
          updatedAt: "2026-06-02T00:00:02.500Z",
          freshness: "fresh",
          confidence: 0.72,
          evidenceRefs: ["stage_play_checkpoint_request:ui"],
        },
      }),
      badge({
        id: "answer_snapshot.latest",
        title: "Latest Answer Snapshot",
        plainMeaning: "The latest upheld answer snapshot came from a model-reviewed Ask checkpoint.",
        whyItMatters: "Answer snapshots separate reviewed output from evidence projections.",
        kind: "answer_snapshot",
        status: "observed",
        subjects: ["thread:stage-play-ui"],
        tags: ["answer_snapshot", "model_reviewed"],
        liveBindings: [],
        intentModule: undefined,
        admission: null,
        confidence: 0.9,
        evidenceRefs: ["ask_turn_solver_trace:ui", "stage_play_badge_graph:ui-fixture"],
        reasonCodes: ["model_reviewed_answer_snapshot"],
        checkpoint: {
          askTurnId: "ask-turn:ui",
          solverTraceRef: "ask_turn_solver_trace:ui",
          terminalArtifactKind: "workstation_tool_evaluation",
          finalAnswerSource: "model",
          modelReviewed: true,
        },
        output: {
          lineKey: "answer_snapshot",
          text: "Hold position until the next observation confirms the scene.",
          state: "model_reviewed",
          voiceEligible: false,
        },
        dataTray: {
          title: "Answer snapshot",
          summary: "latest upheld answer",
          updatedAt: "2026-06-02T00:00:03.000Z",
          freshness: "fresh",
          confidence: 0.9,
          evidenceRefs: ["ask_turn_solver_trace:ui"],
        },
      }),
      badge({
        id: "live_output.current",
        title: "Current Live Output",
        plainMeaning: "Live output can display reviewed or projected answer lines without becoming tool authority.",
        whyItMatters: "The output lane shows what the workstation can present after the right authority boundary.",
        kind: "live_output",
        status: "candidate",
        subjects: ["thread:stage-play-ui"],
        tags: ["live_output"],
        liveBindings: [],
        intentModule: undefined,
        admission: null,
        confidence: 0.7,
        evidenceRefs: ["live_answer_environment:ui"],
        reasonCodes: ["live_answer_projection"],
        output: {
          lineKey: "possibilities",
          text: "Project Stage Play possibilities into Live Answer.",
          state: "projected",
          voiceEligible: false,
        },
        dataTray: {
          title: "Live output",
          summary: "possibilities projected",
          updatedAt: "2026-06-02T00:00:04.000Z",
          freshness: "fresh",
          confidence: 0.7,
          evidenceRefs: ["live_answer_environment:ui"],
        },
      }),
      badge({
        id: "voice_output.current",
        title: "Current Voice Output",
        plainMeaning: "Voice output can speak only from a model-reviewed answer snapshot.",
        whyItMatters: "Voice certainty must be no stronger than the reviewed answer boundary.",
        kind: "voice_output",
        status: "observed",
        subjects: ["thread:stage-play-ui"],
        tags: ["voice_output", "model_reviewed"],
        liveBindings: [],
        intentModule: undefined,
        admission: null,
        confidence: 0.86,
        evidenceRefs: ["answer_snapshot.latest", "ask_turn_solver_trace:ui"],
        reasonCodes: ["voice_cites_answer_snapshot"],
        output: {
          lineKey: "voice_callout",
          text: "Hold position until the next observation confirms the scene.",
          state: "model_reviewed",
          voiceEligible: true,
        },
        dataTray: {
          title: "Voice output",
          summary: "reviewed answer eligible for voice",
          updatedAt: "2026-06-02T00:00:05.000Z",
          freshness: "fresh",
          confidence: 0.86,
          evidenceRefs: ["answer_snapshot.latest"],
        },
      }),
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
        id: "edge:checkpoint-request:ask-checkpoint",
        from: "checkpoint_request.ui",
        to: "helix_ask.checkpoint.latest",
        relation: "needs_check",
        label: "awaits Ask checkpoint",
        evidenceRefs: ["stage_play_checkpoint_request:ui"],
        reasonCodes: ["checkpoint_request_awaits_ask"],
      },
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
    checkpointRequests: [
      {
        artifactId: "stage_play_checkpoint_request",
        schemaVersion: "stage_play_checkpoint_request/v1",
        checkpointRequestId: "stage_play_checkpoint_request:ui",
        jobId: "stage_play_job:ui",
        graphId: "stage_play_badge_graph:ui-fixture",
        objective: "Track the visual source and produce visible checkpoints.",
        userPromptRef: null,
        reason: "meaningful_perturbation",
        question: "A meaningful Stage Play perturbation occurred; what current answer snapshot should Helix Ask produce?",
        currentGraphRefs: ["stage_play_badge_graph:ui-fixture"],
        compactObservationRefs: ["stage_play_compact_observation:ui"],
        perturbationRefs: ["stage_play_perturbation_event:ui"],
        priorAnswerSnapshotRefs: ["answer_snapshot.latest"],
        missingEvidence: ["Audio transcript is missing."],
        checkpointPolicy: {
          autoRunEligible: true,
          requiresUserApproval: true,
          minMsSinceLastCheckpoint: 15_000,
        },
        status: "queued",
        assistant_answer: false,
        context_role: "tool_evidence",
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

function fetchJsonBodies(pathPart: string): Array<Record<string, unknown>> {
  const calls = vi.mocked(fetch).mock.calls as Array<[RequestInfo | URL, RequestInit?]>;
  return calls
    .filter((call) => String(call[0]).includes(pathPart))
    .map((call) => {
      const body = call[1]?.body;
      return typeof body === "string" ? JSON.parse(body) as Record<string, unknown> : {};
    });
}

function renderPanel(options: {
  descriptors?: Array<Record<string, unknown>>;
  producers?: Array<Record<string, unknown>>;
  graph?: StagePlayBadgeGraphV1;
} = {}) {
  const graph = options.graph ?? buildFixture();
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
    if (url.includes("/api/helix/stage-play/raw-session-buffer/clear")) {
      return new Response(JSON.stringify({
        ok: true,
        schema: "stage_play_raw_session_buffer_clear/v1",
        clearedCount: 1,
        clearedEntryIds: ["stage_play_raw_session_buffer_entry:ui"],
        assistant_answer: false,
        context_role: "audit_buffer_not_graph",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/api/helix/stage-play/raw-session-buffer")) {
      return new Response(JSON.stringify({
        ok: true,
        schema: "stage_play_raw_session_buffer_list/v1",
        sessionId: "stage_play_session:thread:stage-play-ui:room:minecraft",
        threadId: "thread:stage-play-ui",
        roomId: "room:minecraft",
        sourceId: "source:visual-tab",
        entries: [
          {
            schema: "stage_play_raw_session_buffer_entry/v1",
            entryId: "stage_play_raw_session_buffer_entry:ui",
            sessionId: "stage_play_session:thread:stage-play-ui:room:minecraft",
            threadId: "thread:stage-play-ui",
            roomId: "room:minecraft",
            sourceId: "source:visual-tab",
            modality: "visual_frame",
            sourceEventId: "visual_frame:ui",
            fromTs: "2026-06-02T00:00:01.000Z",
            toTs: "2026-06-02T00:00:01.000Z",
            rawKind: "frame_ref",
            rawRef: "visual_frame:ui",
            rawTextPreview: "Compact preview of the captured frame.",
            retention: {
              policy: "session_ttl",
              ttlMs: 3600000,
              expiresAt: "2026-06-02T01:00:01.000Z",
            },
            evidenceRefs: ["visual_frame:ui"],
            assistant_answer: false,
            context_role: "audit_buffer_not_graph",
          },
        ],
        assistant_answer: false,
        context_role: "audit_buffer_not_graph",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/api/helix/stage-play/project-live-answer")) {
      return new Response(JSON.stringify({
        ok: true,
        schema: "stage_play_live_answer_projection_response/v1",
        graph,
        outputLaneProjection: {
          artifactId: "stage_play_output_lane_projection",
          schemaVersion: "stage_play_output_lane_projection/v1",
          graphId: graph.graphId,
          generatedAt: graph.generatedAt,
          lanes: [],
          evidenceRefs: ["live_source_observation:ui"],
          context_role: "tool_evidence",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          post_tool_model_step_required: true,
        },
        liveAnswerDelta: {
          changed_line_keys: ["situation", "risk"],
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          model_invoked: false,
        },
        liveAnswerEnvironment: null,
        projectedLineKeys: ["situation", "affordances", "risk", "possibilities", "unknowns", "next_check"],
        skippedLineKeys: ["recommendation"],
        reason: "projected",
        assistant_answer: false,
        raw_content_included: false,
        context_role: "tool_evidence",
        terminal_eligible: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/api/helix/stage-play/checkpoint-queue/action")) {
      const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
      const requestedCheckpointRequest = graph.checkpointRequests.find((request) =>
        request.checkpointRequestId === body.checkpointRequestId
      ) ?? graph.checkpointRequests[0] ?? {};
      return new Response(JSON.stringify({
        ok: true,
        schema: "stage_play_checkpoint_queue_action_response/v1",
        action: body.action ?? "run",
        request: {
          ...requestedCheckpointRequest,
          status: body.action === "run" ? "running" : "skipped",
        },
        queue: {
          schema: "stage_play_checkpoint_queue/v1",
          jobId: body.jobId ?? "stage_play_job:ui",
          requests: graph.checkpointRequests,
          jobState: null,
          assistant_answer: false,
          context_role: "tool_evidence",
        },
        reason: "updated",
        assistant_answer: false,
        context_role: "tool_evidence",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/api/agi/situation/live-answer-environment")) {
      return new Response(JSON.stringify({
        ok: true,
        schema: "helix.live_answer_environment_read.v1",
        environment: null,
        deltas: [],
        assistant_answer: false,
        raw_content_included: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/api/agi/situation/visual-source/start")) {
      const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
      const sourceId = typeof body.source_id === "string" ? body.source_id : "source:visual-tab";
      return new Response(JSON.stringify({
        ok: true,
        schema: "helix.visual_snapshot_source_start_response.v1",
        source: {
          source_id: sourceId,
          thread_id: body.thread_id ?? "helix-ask:desktop",
          room_id: body.room_id ?? null,
          status: "permission_required",
        },
        receipt: {
          source: {
            source_id: sourceId,
            thread_id: body.thread_id ?? "helix-ask:desktop",
            room_id: body.room_id ?? null,
            status: "permission_required",
          },
        },
        assistant_answer: false,
        raw_content_included: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/api/agi/situation/audio-source/permission-granted")) {
      return new Response(JSON.stringify({
        ok: true,
        schema: "helix.audio_source_permission_response.v1",
        assistant_answer: false,
        raw_content_included: false,
        raw_transcript_included: false,
      }), {
        status: 200,
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
    expect(screen.getByTestId("stage-play-tool-activity-strip")).toBeTruthy();
    expect(screen.getByText("Latest reflect_stage_play_context")).toBeTruthy();
    expect(screen.getByText("14 badges")).toBeTruthy();
    expect(screen.getByText("0 missing checks")).toBeTruthy();
    expect(screen.getByText(/checkpoint queue: Meaningful Perturbation \/ queued/i)).toBeTruthy();
    expect(screen.getByTestId("stage-play-run-checkpoint")).toBeTruthy();
    const promptEvents: CustomEvent[] = [];
    window.addEventListener("helix-ask:prompt", ((event: Event) => {
      promptEvents.push(event as CustomEvent);
    }) as EventListener);
    fireEvent.click(screen.getByTestId("stage-play-run-checkpoint"));
    await waitFor(() => {
      const checkpointQueueBody = fetchJsonBodies("/api/helix/stage-play/checkpoint-queue/action").at(-1);
      expect(checkpointQueueBody).toEqual(expect.objectContaining({
        jobId: "stage_play_job:ui",
        checkpointRequestId: "stage_play_checkpoint_request:ui",
        action: "run",
      }));
      expect(promptEvents).toHaveLength(1);
    });
    expect(promptEvents[0]?.detail).toMatchObject({
      autoSubmit: true,
      panelId: "stage-play-badge-graph",
      forceReasoningDispatch: true,
      suppressWorkstationPayloadActions: true,
    });
    expect(String(promptEvents[0]?.detail?.question)).toContain("Use the Stage Play reflection capability live_env.reflect_stage_play_context");
    expect(String(promptEvents[0]?.detail?.question)).toContain("Reflect the active Stage Play Badge Graph");
    expect(String(promptEvents[0]?.detail?.question)).toContain("stage_play_checkpoint_request:ui");
    expect(String(promptEvents[0]?.detail?.question)).toContain("Leave visual/audio capture cadence unchanged.");
    expect(screen.getByTestId("stage-play-lane-observer")).toBeTruthy();
    expect(screen.getByTestId("stage-play-lane-compact_observation")).toBeTruthy();
    expect(screen.getByTestId("stage-play-lane-stage_bounds")).toBeTruthy();
    expect(screen.getByTestId("stage-play-lane-affordances_missing_checks")).toBeTruthy();
    expect(screen.getByTestId("stage-play-lane-procedural_bindings")).toBeTruthy();
    expect(screen.getByTestId("stage-play-lane-helix_ask_checkpoint")).toBeTruthy();
    expect(screen.getByTestId("stage-play-lane-answer_snapshot")).toBeTruthy();
    expect(screen.getByTestId("stage-play-lane-validation_feedback")).toBeTruthy();
    expect(screen.getByTestId("stage-play-lane-live_voice_output")).toBeTruthy();
    expect(screen.getAllByTestId("stage-play-data-tray").length).toBeGreaterThanOrEqual(12);
    expect(screen.getByText(/visual frame active - latest scene summary available/i)).toBeTruthy();
    expect(screen.getByText(/latest compact fact summary/i)).toBeTruthy();
    expect(screen.getAllByText(/confidence 0\.76/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/solver completed; model reviewed/i)).toBeTruthy();
    expect(screen.getByText(/route authority passed/i)).toBeTruthy();
    expect(screen.getByText(/Meaningful perturbation is queued/i)).toBeTruthy();
    expect(screen.getAllByText(/Hold position until the next observation confirms the scene/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/model reviewed/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Project Stage Play possibilities into Live Answer/i)).toBeTruthy();
    const nodeSlots = screen.getAllByTestId("stage-play-node-slot");
    const occupiedSlots = nodeSlots.map((slot) => `${slot.style.left}:${slot.style.top}`);
    expect(new Set(occupiedSlots).size).toBe(occupiedSlots.length);
    expect(screen.getAllByTestId("stage-play-output-node").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("stage-play-binding-overlay")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play console" }));
    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();
    expect(await screen.findByTestId("stage-play-builder-artifacts")).toBeTruthy();
    const overlay = screen.getByTestId("stage-play-binding-overlay");
    const overlayText = overlay.textContent ?? "";
    expect(overlayText.indexOf("Builder Palette")).toBeLessThan(overlayText.indexOf("Tool assembly"));
    expect(overlayText.indexOf("Tool assembly")).toBeLessThan(overlayText.indexOf("Source handles"));
    expect(screen.getByText("stage_play_builder_catalog/v1")).toBeTruthy();
    expect(screen.getByText("stage_play_source_query/v1")).toBeTruthy();
    expect(screen.getByText("stage_play_graph_draft_validation/v1")).toBeTruthy();
    expect(screen.getAllByText("Builder Palette").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Observer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Fusion\b/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Intent Module/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Procedure/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close Stage Play console" }));
    fireEvent.click(screen.getByRole("button", { name: "Observer" }));
    expect(screen.getByTestId("stage-play-observer-node-controls")).toBeTruthy();
    expect(screen.getByText("Observer Source Routes")).toBeTruthy();
    expect(screen.getAllByText("visual frame").length).toBeGreaterThan(0);
    expect(screen.getAllByText("audio transcript").length).toBeGreaterThan(0);
    expect(screen.getByTestId("stage-play-project-live-answer")).toBeTruthy();
    fireEvent.click(screen.getByTestId("stage-play-project-live-answer"));
    const observerProjectionText = (await screen.findByTestId("stage-play-tool-activity-strip")).textContent ?? "";
    expect(observerProjectionText).toMatch(
      /Projected 6 interpretation lanes: situation, affordances, risk, possibilities, unknowns, next_check/i,
    );
    expect(observerProjectionText).toMatch(/Skipped: recommendation requires model review/i);
    expect(fetchJsonBodies("/api/helix/stage-play/project-live-answer").at(-1)).toEqual(expect.objectContaining({
      ensureStagePlayLineSchema: true,
      createIfMissing: true,
      preferredPreset: "minecraft_run_monitor",
    }));
    fireEvent.click(screen.getAllByRole("button", { name: "Use for Stage Play" })[0]);
    expect(screen.getByTestId("stage-play-draft-parameter-editor")).toBeTruthy();
    expect(screen.getByDisplayValue("use_for_stage_play")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Defensive Retreat Barrier" })[0]);

    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();
    expect(screen.getByTestId("stage-play-procedural-binding-node-controls")).toBeTruthy();
    expect(screen.getByText("Procedural Binding")).toBeTruthy();
    expect(screen.getAllByText(/retreat \+ intent.move_away \+ intent.maintain_line_of_sight \+ intent.place_block/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Admission")).toBeTruthy();
    expect(screen.getAllByText(/Candidate: retreat while tracking threat/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/agent executable: false/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /execute|run command|auto move|auto place/i })).toBeNull();
  });

  it("runs the current graph checkpoint request before stale queued requests", async () => {
    const baseGraph = buildFixture();
    const baseRequest = baseGraph.checkpointRequests[0];
    const staleRequest = {
      ...baseRequest,
      checkpointRequestId: "stage_play_checkpoint_request:stale",
      graphId: "stage_play_badge_graph:stale",
      currentGraphRefs: ["stage_play_badge_graph:stale"],
      reason: "first_usable_observation" as const,
      question: "A stale first observation should not drive the current checkpoint.",
      status: "queued" as const,
    };
    const currentRequest = {
      ...baseRequest,
      checkpointRequestId: "stage_play_checkpoint_request:current",
      graphId: baseGraph.graphId,
      currentGraphRefs: [baseGraph.graphId],
      reason: "meaningful_perturbation" as const,
      question: "Current visual-source graph has a meaningful perturbation; review the active checkpoint.",
      status: "queued" as const,
    };
    renderPanel({
      graph: {
        ...baseGraph,
        checkpointRequests: [staleRequest, currentRequest],
      },
    });

    expect(await screen.findByText(/checkpoint queue: Meaningful Perturbation \/ queued/i)).toBeTruthy();
    const promptEvents: CustomEvent[] = [];
    window.addEventListener("helix-ask:prompt", ((event: Event) => {
      promptEvents.push(event as CustomEvent);
    }) as EventListener);
    fireEvent.click(screen.getByTestId("stage-play-run-checkpoint"));
    await waitFor(() => {
      const checkpointQueueBody = fetchJsonBodies("/api/helix/stage-play/checkpoint-queue/action").at(-1);
      expect(checkpointQueueBody).toEqual(expect.objectContaining({
        jobId: "stage_play_job:ui",
        checkpointRequestId: "stage_play_checkpoint_request:current",
        action: "run",
      }));
      expect(promptEvents).toHaveLength(1);
    });
    expect(String(promptEvents[0]?.detail?.question)).toContain("stage_play_checkpoint_request:current");
    expect(String(promptEvents[0]?.detail?.question)).not.toContain("stage_play_checkpoint_request:stale");
  });

  it("shows Observer controls in the Stage Console inspector when Observer is selected", async () => {
    useStagePlayBadgeGraphPanelStore.setState({
      selectedBadgeId: "observer.live_sources",
      selectedBadgeIds: ["observer.live_sources"],
    });
    renderPanel();

    await screen.findByTestId("stage-play-badge-graph-scrollport");
    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play console" }));

    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();
    expect(screen.getAllByText("Observer Source Routes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Source Setup").length).toBeGreaterThan(0);
  });

  it("shows source route controls when a Source node is selected", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Visual Tab Source" }));

    expect(screen.getByTestId("stage-play-source-node-controls")).toBeTruthy();
    expect(screen.getByText("Source Route Controls")).toBeTruthy();
    expect(screen.getByText("Route to Narrative")).toBeTruthy();
    expect(screen.getByText("Review source evidence")).toBeTruthy();
    expect(screen.getByText("Open raw buffer preview")).toBeTruthy();
  });

  it("switches the Stage Console to node-specific interaction surfaces", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Latest Compact Observation" }));
    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();
    expect(screen.getByTestId("stage-play-compact-observation-node-controls")).toBeTruthy();
    expect(screen.getByText("Compact Observation Evidence")).toBeTruthy();
    expect(screen.getByText("Evidence Refs")).toBeTruthy();
    expect(screen.getByText("Audit Links")).toBeTruthy();
    expect(screen.getByText("Open raw buffer preview")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Latest Ask Checkpoint" }));
    expect(screen.getByTestId("stage-play-ask-checkpoint-node-controls")).toBeTruthy();
    expect(screen.getByText("Helix Ask Checkpoint")).toBeTruthy();
    expect(screen.getByText("Ask Prompt")).toBeTruthy();
    expect(screen.getByText("Tool Observation")).toBeTruthy();
    expect(screen.getByText("Solver / Debug Status")).toBeTruthy();
    expect(screen.getByText(/Raw prompt text is not embedded/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Latest Answer Snapshot" }));
    expect(screen.getByTestId("stage-play-answer-snapshot-node-controls")).toBeTruthy();
    expect(screen.getByText("Upheld Answer")).toBeTruthy();
    expect(screen.getAllByText(/Hold position until the next observation confirms the scene/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Source Refs")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Current Live Output" }));
    expect(screen.getByTestId("stage-play-live-output-node-controls")).toBeTruthy();
    expect(screen.getByText("Projection State")).toBeTruthy();
    expect(screen.getByText("Voice Boundary")).toBeTruthy();
    expect(screen.getByText("Output Text")).toBeTruthy();
    expect(screen.getByText(/Voice eligible:/i)).toBeTruthy();
    expect(screen.getByText(/Answer snapshot citation:/i)).toBeTruthy();
    expect(screen.getByTestId("stage-play-voice-boundary-locked")).toBeTruthy();
    expect(screen.queryByTestId("stage-play-speak-reviewed-answer")).toBeNull();
    expect(screen.getAllByText(/Project Stage Play possibilities into Live Answer/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Current Voice Output" }));
    expect(screen.getByTestId("stage-play-voice-output-node-controls")).toBeTruthy();
    expect(screen.getByText("Voice Boundary")).toBeTruthy();
    expect(screen.getAllByText(/answer_snapshot\.latest/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("stage-play-speak-reviewed-answer")).toBeTruthy();
    expect(screen.queryByTestId("stage-play-voice-boundary-locked")).toBeNull();
  });

  it("projects from the Interpreter node and Live Answer output node controls", async () => {
    renderPanel();

    await screen.findByTestId("stage-play-badge-graph-scrollport");
    fireEvent.click(screen.getByTestId("stage-play-project-live-answer-interpreter"));

    const interpreterProjectionText = (await screen.findByTestId("stage-play-tool-activity-strip")).textContent ?? "";
    expect(interpreterProjectionText).toMatch(
      /Projected 6 interpretation lanes: situation, affordances, risk, possibilities, unknowns, next_check/i,
    );
    expect(interpreterProjectionText).toMatch(/Skipped: recommendation requires model review/i);

    fireEvent.click(screen.getByRole("button", { name: "Stage Play interpreter" }));
    expect(screen.getByText("Live Interpretation Projection")).toBeTruthy();
    expect(screen.getByTestId("stage-play-project-live-answer-inspector")).toBeTruthy();

    fireEvent.click(screen.getByTestId("stage-play-project-live-answer-output"));
    expect(fetchJsonBodies("/api/helix/stage-play/project-live-answer").length).toBeGreaterThanOrEqual(2);
  });

  it("starts visual source setup through the visual producer from the Observer panel", async () => {
    const stream = {
      getVideoTracks: () => [],
      getTracks: () => [{ readyState: "live", stop: vi.fn(), addEventListener: vi.fn() }],
    } as unknown as MediaStream;
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getDisplayMedia: vi.fn(async () => stream),
      },
    });
    visualProducerMock.startVisualFrameProducerInterval.mockClear();

    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Observer" }));
    expect(screen.getByTestId("stage-play-observer-node-controls")).toBeTruthy();
    expect(screen.getByText("Source Setup")).toBeTruthy();
    expect(screen.getByText("Narrative test defaults")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "30s" }));
    fireEvent.click(screen.getByRole("button", { name: "Capture browser tab visual" }));

    expect(await screen.findByText(/browser tab visual interval active every 30s/i)).toBeTruthy();
    expect(visualProducerMock.startVisualFrameProducerInterval).toHaveBeenCalledWith(expect.objectContaining({
      sourceId: "source:visual-tab",
      threadId: "helix-ask:desktop",
      cadenceMs: 30000,
    }));
    expect(screen.getByTestId("stage-play-draft-parameter-editor")).toBeTruthy();
    expect(screen.getByDisplayValue("start_visual_interval")).toBeTruthy();
    expect(screen.getAllByDisplayValue("narrative_stage_play").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("session_ttl")).toBeTruthy();
  });

  it("opens Observer source setup when the graph Observer badge is clicked", async () => {
    renderPanel();

    expect(screen.queryByTestId("stage-play-binding-overlay")).toBeNull();

    fireEvent.click(await screen.findByRole("button", { name: "Observer" }));

    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();
    expect(screen.getByTestId("stage-play-observer-node-controls")).toBeTruthy();
    expect(screen.getByText("Source Setup")).toBeTruthy();
    expect(screen.getByText("Observer Source Routes")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Capture browser tab visual" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Attach browser audio transcript" })).toBeTruthy();
  });

  it("opens raw buffer previews from Observer source evidence without graph ownership", async () => {
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Observer" }));
    expect(screen.getByTestId("stage-play-observer-node-controls")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Open raw buffer preview" })[0]);

    expect(await screen.findByText("Source Evidence Audit")).toBeTruthy();
    expect(await screen.findByText("Compact preview of the captured frame.")).toBeTruthy();
    expect(screen.getAllByText("stage_play_raw_session_buffer_entry:ui").length).toBeGreaterThan(0);
    expect(screen.getByText("audit buffer, not graph")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Clear raw buffer" })[0]);
    expect(await screen.findByText(/Cleared raw buffer entries for source:visual-tab/i)).toBeTruthy();
    expect(fetchCallUrls().some((url) => url.includes("/api/helix/stage-play/raw-session-buffer/clear"))).toBe(true);
  });

  it("adds matching live nodes from the builder palette into the selected trace", async () => {
    renderPanel();

    await screen.findByTestId("stage-play-badge-graph-scrollport");
    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play console" }));

    fireEvent.click(screen.getByRole("button", { name: /Intent Module/i }));

    expect(screen.getByText("intent module evidence nodes")).toBeTruthy();
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

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play console" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Remove draft node" }));

    expect(screen.queryByTestId("stage-play-draft-node")).toBeNull();
    expect(screen.queryByTestId("stage-play-draft-parameter-editor")).toBeNull();
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

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play console" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play console" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play console" }));
    expect(screen.getByTestId("stage-play-binding-overlay")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close Stage Play console" }));

    expect(screen.queryByTestId("stage-play-binding-overlay")).toBeNull();
    expect(screen.getByTestId("stage-play-badge-graph-scrollport")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open Stage Play console" }));

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
