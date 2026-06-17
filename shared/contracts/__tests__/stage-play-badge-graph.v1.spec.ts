import { describe, expect, it } from "vitest";
import {
  buildStagePlayBadgeGraphV1,
  isStagePlayBadgeGraphV1,
  validateStagePlayBadgeGraphV1,
  type StagePlayBadgeGraphV1,
  type StagePlayBadgeV1,
} from "../stage-play-badge-graph.v1";

const sourceWindow: StagePlayBadgeGraphV1["sourceWindow"] = {
  threadId: "thread:stage-play",
  roomId: "room:minecraft",
  worldId: "world:minecraft:overworld",
  environmentId: "env:minecraft",
  fromTs: "2026-06-02T12:00:00.000Z",
  toTs: "2026-06-02T12:00:01.000Z",
  latestObservationRefs: ["observation:1"],
  sources: [
    {
      sourceId: "source:visual-tab",
      modality: "visual_frame",
      status: "active",
      contribution: "Visual frame source provides compact scene context.",
      fidelityScore: 0.82,
      selectedForStagePlay: true,
      routeTo: "visual_context",
      cadenceMs: 10000,
      lastEventTs: "2026-06-02T12:00:01.000Z",
      missingReason: null,
      nextRequiredAction: null,
      evidenceRefs: ["observation:1"],
    },
  ],
  latestSnapshotRefs: ["snapshot:1"],
  latestDeltaOverlayRefs: [],
  latestNavigationRefs: [],
  freshness: "fresh",
};

const emptySourceWindow: StagePlayBadgeGraphV1["sourceWindow"] = {
  latestObservationRefs: [],
  sources: [],
  latestSnapshotRefs: [],
  latestDeltaOverlayRefs: [],
  latestNavigationRefs: [],
  freshness: "missing",
};

const actorBadge: StagePlayBadgeV1 = {
  id: "actor:player",
  title: "Player",
  plainMeaning: "Actor pose is observed in the admitted environment snapshot.",
  whyItMatters: "Action possibilities are actor-relative and source-window bound.",
  kind: "actor",
  status: "observed",
  subjects: ["player"],
  tags: ["actor_state"],
  liveBindings: [
    {
      bindingKind: "actor_pose",
      sourceRefIds: ["snapshot:1"],
      freshness: "fresh",
      confidence: 0.9,
      compactValue: "0,64,0",
    },
  ],
  sourceRefs: [{ kind: "environment_state_snapshot", id: "snapshot:1" }],
  evidenceRefs: ["snapshot:1"],
  confidence: 0.9,
  missingEvidence: [],
  reasonCodes: ["actor_state_observed"],
  admission: null,
};

const sourceBadge: StagePlayBadgeV1 = {
  id: "source:visual-tab",
  title: "Visual frame source",
  plainMeaning: "A live source handle can feed compact Stage Play interpretation.",
  whyItMatters: "Source nodes identify source class and active handle before interpreted claims are formed.",
  kind: "source",
  status: "observed",
  subjects: ["source:visual-tab"],
  tags: ["visual_frame", "browser_tab"],
  liveBindings: [
    {
      bindingKind: "source_descriptor",
      sourceRefIds: ["live_source_descriptor:visual-tab"],
      freshness: "fresh",
      confidence: 0.9,
      compactValue: "visual_frame",
    },
  ],
  sourceRefs: [
    { kind: "live_source_descriptor", id: "live_source_descriptor:visual-tab" },
    { kind: "live_source_producer", id: "live_source_producer:visual-tab" },
  ],
  evidenceRefs: ["live_source_descriptor:visual-tab", "live_source_producer:visual-tab"],
  confidence: 0.86,
  missingEvidence: [],
  reasonCodes: ["live_source_descriptor"],
  admission: "auto",
};

const interpreterBadge: StagePlayBadgeV1 = {
  id: "interpreter:stage-play",
  title: "Stage Play interpreter",
  plainMeaning: "A continual evidence reducer can interpret selected source refs into stage facts.",
  whyItMatters: "Interpreter nodes expose reflection boundaries without answer or execution authority.",
  kind: "interpreter",
  status: "candidate",
  subjects: ["thread:stage-play"],
  tags: ["reflect_stage_play_context", "evidence_only"],
  liveBindings: [
    {
      bindingKind: "source_status",
      sourceRefIds: ["live_source_descriptor:visual-tab"],
      freshness: "fresh",
      confidence: 0.8,
      compactValue: "active_interval",
    },
  ],
  sourceRefs: sourceBadge.sourceRefs,
  evidenceRefs: sourceBadge.evidenceRefs,
  confidence: 0.76,
  missingEvidence: [],
  reasonCodes: ["stage_play_interpreter"],
  admission: "auto",
};

const askCheckpointBadge: StagePlayBadgeV1 = {
  id: "ask_checkpoint:latest",
  title: "Helix Ask checkpoint",
  plainMeaning: "Helix Ask reviewed Stage Play evidence and produced a bounded checkpoint receipt.",
  whyItMatters: "Checkpoint badges distinguish model-reviewed answer snapshots from evidence projection.",
  kind: "ask_checkpoint",
  status: "observed",
  subjects: ["thread:stage-play"],
  tags: ["helix_ask", "checkpoint", "model_reviewed"],
  liveBindings: [],
  sourceRefs: [{ kind: "synthetic_evidence", id: "ask_turn_solver_trace:123" }],
  evidenceRefs: ["ask:turn:123", "ask_turn_solver_trace:123"],
  confidence: 0.88,
  missingEvidence: [],
  reasonCodes: ["completed_solver_path", "model_reviewed_checkpoint"],
  dataTray: {
    title: "Latest Ask checkpoint",
    summary: "Solver path completed and route authority passed.",
    updatedAt: "2026-06-02T12:00:02.000Z",
    freshness: "fresh",
    confidence: 0.88,
    evidenceRefs: ["ask:turn:123", "ask_turn_solver_trace:123"],
  },
  checkpoint: {
    askTurnId: "ask:turn:123",
    solverTraceRef: "ask_turn_solver_trace:123",
    terminalArtifactKind: "model_synthesized_answer",
    finalAnswerSource: "final_answer_draft",
    modelReviewed: true,
  },
  admission: "auto",
};

const answerSnapshotBadge: StagePlayBadgeV1 = {
  id: "answer_snapshot:latest",
  title: "Answer snapshot",
  plainMeaning: "The latest upheld answer snapshot came from a model-reviewed checkpoint.",
  whyItMatters: "Answer snapshots keep output text separate from raw source observations and graph projections.",
  kind: "answer_snapshot",
  status: "observed",
  subjects: ["thread:stage-play"],
  tags: ["answer_snapshot", "model_reviewed"],
  liveBindings: [],
  sourceRefs: [{ kind: "synthetic_evidence", id: "ask:turn:123" }],
  evidenceRefs: ["ask:turn:123", "ask_turn_solver_trace:123"],
  confidence: 0.84,
  missingEvidence: [],
  reasonCodes: ["answer_snapshot_from_checkpoint"],
  dataTray: {
    title: "Upheld answer",
    summary: "Use the visual source as narrative context and attach audio to resolve dialogue intent.",
    updatedAt: "2026-06-02T12:00:02.000Z",
    freshness: "fresh",
    confidence: 0.84,
    evidenceRefs: ["ask:turn:123"],
  },
  output: {
    lineKey: "recommendation",
    text: "Attach audio/transcript before treating the narrative intent as resolved.",
    state: "model_reviewed",
    voiceEligible: false,
  },
  admission: "auto",
};

const buildFixture = (overrides: Partial<StagePlayBadgeGraphV1> = {}): StagePlayBadgeGraphV1 =>
  buildStagePlayBadgeGraphV1({
    generatedAt: "2026-06-02T12:00:02.000Z",
    graphId: "stage_play_badge_graph:test",
    title: "Stage Play Badge Graph",
    description: "Evidence-only bounded action-world reflection.",
    sourceWindow,
    badges: [actorBadge],
    edges: [],
    recommendedActions: [
      {
        id: "action:observe_more",
        label: "Observe more",
        actionType: "observe_more",
        admission: "auto",
        agentExecutable: false,
        reasonCodes: ["diagnostic_only"],
        evidenceRefs: ["snapshot:1"],
        missingEvidence: [],
      },
    ],
    ...overrides,
  });

describe("stage_play_badge_graph/v1", () => {
  it("builds a canonical evidence-only graph", () => {
    const graph = buildFixture();

    expect(graph.artifactId).toBe("stage_play_badge_graph");
    expect(graph.schemaVersion).toBe("stage_play_badge_graph/v1");
    expect(validateStagePlayBadgeGraphV1(graph)).toEqual([]);
    expect(isStagePlayBadgeGraphV1(graph)).toBe(true);
    expect(graph.summary.badgeCount).toBe(1);
    expect(graph.summary.edgeCount).toBe(0);
    expect(graph.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      raw_payload_included: false,
      terminal_eligible: false,
      agent_executable: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
      instruction_authority: "none",
      ask_instruction_authority: "none",
    });
  });

  it("accepts source and interpreter badges as evidence-only graph handles", () => {
    const graph = buildFixture({
      sourceWindow: {
        ...sourceWindow,
        latestSourceDescriptorRefs: ["live_source_descriptor:visual-tab"],
        latestSourceProducerRefs: ["live_source_producer:visual-tab"],
      },
      badges: [sourceBadge, interpreterBadge, actorBadge],
      edges: [
        {
          id: "edge:source:feeds:interpreter",
          from: sourceBadge.id,
          to: interpreterBadge.id,
          relation: "feeds",
          label: "source handle feeds interpreter",
          evidenceRefs: sourceBadge.evidenceRefs,
          reasonCodes: ["source_interpreter_binding"],
        },
        {
          id: "edge:interpreter:interprets:actor",
          from: interpreterBadge.id,
          to: actorBadge.id,
          relation: "interprets",
          label: "interpreter derives actor badge",
          evidenceRefs: actorBadge.evidenceRefs,
          reasonCodes: ["interpreter_actor_binding"],
        },
      ],
    });

    expect(validateStagePlayBadgeGraphV1(graph)).toEqual([]);
    expect(graph.summary.kindCounts.source).toBe(1);
    expect(graph.summary.kindCounts.interpreter).toBe(1);
    expect(graph.authority.agent_executable).toBe(false);
    expect(JSON.stringify(graph)).not.toMatch(/agent[_ -]?executable\s*[:=]\s*true/i);
  });

  it("accepts workstation state-plane badges as evidence-only process handles", () => {
    const statePlaneBadge: StagePlayBadgeV1 = {
      id: "workstation_state_plane.current",
      title: "Workstation state plane",
      plainMeaning: "Read-only circuit map of sources, gates, buffers, transforms, outputs, and control signals.",
      whyItMatters: "The agent can inspect structured process state without treating the graph as an answer or action authority.",
      kind: "workstation_state_plane",
      status: "observed",
      subjects: ["stage_play_badge_graph:test", "source:visual-tab"],
      tags: ["workstation_state_plane", "evidence_only"],
      liveBindings: [],
      sourceRefs: [{ kind: "synthetic_evidence", id: "stage_play_badge_graph:test" }],
      evidenceRefs: ["stage_play_badge_graph:test", "source:visual-tab"],
      confidence: 0.82,
      missingEvidence: [],
      reasonCodes: ["workstation_state_plane", "process_graph_reflection", "not_terminal_authority"],
      dataTray: {
        title: "State plane",
        summary: "Maps source, gate, buffer, transform, output, and control nodes.",
        updatedAt: "2026-06-02T12:00:02.000Z",
        freshness: "fresh",
        confidence: 0.82,
        evidenceRefs: ["stage_play_badge_graph:test"],
        inputRefs: ["source:visual-tab"],
        transformLabel: "workstation graph reducer",
        outputRefs: ["stage_play_badge_graph:test"],
        outputPreview: "evidence-only process graph overlay",
      },
      admission: "auto",
    };
    const graph = buildFixture({
      badges: [sourceBadge, interpreterBadge, statePlaneBadge],
      edges: [
        {
          id: "edge:state-plane:contains:source",
          from: statePlaneBadge.id,
          to: sourceBadge.id,
          relation: "contains",
          label: "state plane contains source badge",
          evidenceRefs: statePlaneBadge.evidenceRefs,
          reasonCodes: ["workstation_state_plane_contains_role"],
        },
        {
          id: "edge:state-plane:contains:interpreter",
          from: statePlaneBadge.id,
          to: interpreterBadge.id,
          relation: "contains",
          label: "state plane contains interpreter badge",
          evidenceRefs: statePlaneBadge.evidenceRefs,
          reasonCodes: ["workstation_state_plane_contains_role"],
        },
      ],
    });

    expect(validateStagePlayBadgeGraphV1(graph)).toEqual([]);
    expect(graph.summary.kindCounts.workstation_state_plane).toBe(1);
    expect(graph.authority.assistant_answer).toBe(false);
    expect(graph.authority.terminal_eligible).toBe(false);
    expect(graph.authority.agent_executable).toBe(false);
  });

  it("accepts checkpoint and output badges without granting graph authority", () => {
    const graph = buildFixture({
      badges: [sourceBadge, interpreterBadge, askCheckpointBadge, answerSnapshotBadge],
      edges: [
        {
          id: "edge:interpreter:produces:checkpoint",
          from: interpreterBadge.id,
          to: askCheckpointBadge.id,
          relation: "produces",
          label: "interpreter evidence is reviewed by Ask checkpoint",
          evidenceRefs: askCheckpointBadge.evidenceRefs,
          reasonCodes: ["checkpoint_from_interpreter"],
        },
        {
          id: "edge:checkpoint:produces:answer",
          from: askCheckpointBadge.id,
          to: answerSnapshotBadge.id,
          relation: "produces",
          label: "model-reviewed checkpoint produces answer snapshot",
          evidenceRefs: answerSnapshotBadge.evidenceRefs,
          reasonCodes: ["answer_snapshot_from_checkpoint"],
        },
      ],
    });

    expect(validateStagePlayBadgeGraphV1(graph)).toEqual([]);
    expect(graph.summary.kindCounts.ask_checkpoint).toBe(1);
    expect(graph.summary.kindCounts.answer_snapshot).toBe(1);
    expect(askCheckpointBadge.checkpoint?.modelReviewed).toBe(true);
    expect(graph.authority.assistant_answer).toBe(false);
    expect(graph.authority.agent_executable).toBe(false);
    expect(graph.authority.terminal_eligible).toBe(false);
  });

  it("accepts voice output only when it cites a model-reviewed answer snapshot", () => {
    const voiceOutputBadge: StagePlayBadgeV1 = {
      ...answerSnapshotBadge,
      id: "voice_output:current",
      title: "Voice output",
      plainMeaning: "Policy-gated voice output cites the upheld answer snapshot.",
      whyItMatters: "Voice output must be sourced from model-reviewed answer text, not raw projection.",
      kind: "voice_output",
      subjects: ["voice_output"],
      tags: ["voice_output", "model_reviewed", "voice_policy"],
      evidenceRefs: ["ask:turn:123", "answer_snapshot:latest"],
      reasonCodes: ["explicit_voice_policy", "voice_output_from_answer_snapshot"],
      dataTray: {
        title: "Current voice output",
        summary: "Voice output cites the answer snapshot.",
        updatedAt: "2026-06-02T12:00:02.000Z",
        freshness: "fresh",
        confidence: 0.8,
        evidenceRefs: ["answer_snapshot:latest"],
      },
      output: {
        lineKey: "voice_output",
        text: "Attach audio before resolving narrative intent.",
        state: "model_reviewed",
        voiceEligible: true,
      },
    };
    const graph = buildFixture({
      badges: [askCheckpointBadge, answerSnapshotBadge, voiceOutputBadge],
      edges: [
        {
          id: "edge:checkpoint:produces:answer",
          from: askCheckpointBadge.id,
          to: answerSnapshotBadge.id,
          relation: "produces",
          label: "model-reviewed checkpoint produces answer snapshot",
          evidenceRefs: answerSnapshotBadge.evidenceRefs,
          reasonCodes: ["answer_snapshot_from_checkpoint"],
        },
        {
          id: "edge:answer:produces:voice",
          from: answerSnapshotBadge.id,
          to: voiceOutputBadge.id,
          relation: "produces",
          label: "answer snapshot produces policy-gated voice output",
          evidenceRefs: voiceOutputBadge.evidenceRefs,
          reasonCodes: ["explicit_voice_policy"],
        },
      ],
    });

    expect(validateStagePlayBadgeGraphV1(graph)).toEqual([]);
  });

  it("rejects voice output without model review, policy, and answer-snapshot citation", () => {
    const unsafeVoiceBadge = (overrides: Partial<StagePlayBadgeV1>): StagePlayBadgeV1 => ({
      ...answerSnapshotBadge,
      id: "voice_output:unsafe",
      title: "Unsafe voice output",
      kind: "voice_output",
      tags: ["voice_output"],
      evidenceRefs: ["ask:turn:123"],
      reasonCodes: ["voice_output_from_projection"],
      output: {
        lineKey: "voice_output",
        text: "Speak projected source state.",
        state: "projected",
        voiceEligible: true,
      },
      ...overrides,
    });

    expect(validateStagePlayBadgeGraphV1(buildFixture({
      badges: [
        askCheckpointBadge,
        {
          ...answerSnapshotBadge,
          output: {
            ...(answerSnapshotBadge.output ?? {}),
            voiceEligible: true,
          },
        },
      ],
    })).join("\n")).toMatch(/output\.voiceEligible is only allowed on live_output or voice_output badges/);

    expect(validateStagePlayBadgeGraphV1(buildFixture({
      badges: [askCheckpointBadge, answerSnapshotBadge, unsafeVoiceBadge({})],
    })).join("\n")).toMatch(/output\.voiceEligible requires model_reviewed output state/);

    expect(validateStagePlayBadgeGraphV1(buildFixture({
      badges: [
        askCheckpointBadge,
        answerSnapshotBadge,
        unsafeVoiceBadge({
          output: {
            lineKey: "voice_output",
            text: "Speak without policy.",
            state: "model_reviewed",
            voiceEligible: true,
          },
        }),
      ],
    })).join("\n")).toMatch(/output\.voiceEligible requires explicit voice policy evidence/);

    expect(validateStagePlayBadgeGraphV1(buildFixture({
      badges: [
        askCheckpointBadge,
        answerSnapshotBadge,
        unsafeVoiceBadge({
          tags: ["voice_policy"],
          reasonCodes: ["explicit_voice_policy"],
          output: {
            lineKey: "voice_output",
            text: "Speak without answer snapshot citation.",
            state: "model_reviewed",
            voiceEligible: true,
          },
        }),
      ],
    })).join("\n")).toMatch(/output\.voiceEligible requires citation to a model-reviewed answer_snapshot/);
  });

  it("allows raw session buffer ids as refs without allowing raw content in the graph", () => {
    const rawBufferRef = "stage_play_raw_session_buffer_entry:abc123";
    const graph = buildFixture({
      sourceWindow: {
        ...sourceWindow,
        latestRawSessionBufferRefs: [rawBufferRef],
        sources: [
          {
            ...sourceWindow.sources[0],
            evidenceRefs: [...sourceWindow.sources[0].evidenceRefs, rawBufferRef],
          },
        ],
      },
      badges: [
        {
          ...sourceBadge,
          sourceRefs: [
            ...sourceBadge.sourceRefs,
            { kind: "stage_play_raw_session_buffer_entry", id: rawBufferRef },
          ],
          evidenceRefs: [...sourceBadge.evidenceRefs, rawBufferRef],
        },
      ],
    });
    const graphWithRawTranscript = buildFixture({
      badges: [
        {
          ...sourceBadge,
          plainMeaning: "Contains full transcript text from the raw log.",
        },
      ],
    });

    expect(validateStagePlayBadgeGraphV1(graph)).toEqual([]);
    expect(JSON.stringify(graph)).toContain(rawBufferRef);
    expect(validateStagePlayBadgeGraphV1(graphWithRawTranscript)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/forbidden raw-content phrase matched/i),
      ]),
    );
  });

  it("allows empty badges only when there is no admitted source window", () => {
    const emptyWithoutSource = buildFixture({
      sourceWindow: emptySourceWindow,
      badges: [],
      recommendedActions: [],
    });
    const emptyWithSource = buildFixture({
      badges: [],
      recommendedActions: [],
    });

    expect(validateStagePlayBadgeGraphV1(emptyWithoutSource)).toEqual([]);
    expect(validateStagePlayBadgeGraphV1(emptyWithSource)).toContain(
      "badges may be empty only when there is no admitted source window",
    );
  });

  it("rejects missing edge endpoints and invalid confidence values", () => {
    const graph = buildFixture({
      badges: [
        {
          ...actorBadge,
          confidence: Number.NaN,
          liveBindings: [{ ...actorBadge.liveBindings[0], confidence: 1.5 }],
        },
      ],
      edges: [
        {
          id: "edge:missing",
          from: "actor:player",
          to: "missing:badge",
          relation: "targets",
          label: "invalid target",
          evidenceRefs: ["snapshot:1"],
          reasonCodes: ["test"],
        },
      ],
    });
    const issues = validateStagePlayBadgeGraphV1(graph).join("\n");

    expect(issues).toMatch(/badges\[0\]\.confidence must be between 0 and 1/);
    expect(issues).toMatch(/badges\[0\]\.liveBindings\[0\]\.confidence must be between 0 and 1/);
    expect(issues).toMatch(/edges\[0\]\.to references missing badge: missing:badge/);
  });

  it("rejects invalid source routing entries", () => {
    const graph = buildFixture({
      sourceWindow: {
        ...sourceWindow,
        sources: [
          {
            ...sourceWindow.sources[0],
            status: "active_interval",
            fidelityScore: 1.4,
            selectedForStagePlay: "yes",
            routeTo: "execute_world_action",
          } as StagePlayBadgeGraphV1["sourceWindow"]["sources"][number],
        ],
      },
    });
    const issues = validateStagePlayBadgeGraphV1(graph).join("\n");

    expect(issues).toMatch(/sourceWindow\.sources\[0\]\.status is invalid/);
    expect(issues).toMatch(/sourceWindow\.sources\[0\]\.fidelityScore must be between 0 and 1/);
    expect(issues).toMatch(/sourceWindow\.sources\[0\]\.selectedForStagePlay must be boolean/);
    expect(issues).toMatch(/sourceWindow\.sources\[0\]\.routeTo is invalid/);
  });

  it("rejects executable recommendations and non-evidence graph authority", () => {
    const graph = buildFixture({
      recommendedActions: [
        {
          id: "action:bad",
          label: "Bad action",
          actionType: "navigation_hint",
          admission: "auto",
          agentExecutable: true,
          reasonCodes: ["test"],
          evidenceRefs: ["snapshot:1"],
          missingEvidence: [],
        } as StagePlayBadgeGraphV1["recommendedActions"][number],
      ],
      authority: {
        ...buildFixture().authority,
        terminal_eligible: true,
      } as StagePlayBadgeGraphV1["authority"],
    });
    const issues = validateStagePlayBadgeGraphV1(graph).join("\n");

    expect(issues).toMatch(/recommendedActions\[0\]\.agentExecutable must be false/);
    expect(issues).toMatch(/authority\.terminal_eligible must be false/);
  });

  it("rejects invalid checkpoint and output badge fields", () => {
    const graph = buildFixture({
      badges: [
        {
          ...actorBadge,
          dataTray: {
            title: "",
            summary: "Invalid tray",
            freshness: "hot",
            confidence: 2,
            evidenceRefs: ["snapshot:1"],
          },
          checkpoint: {
            askTurnId: 12,
            modelReviewed: "yes",
          },
          output: {
            lineKey: 3,
            text: "",
            state: "spoken",
            voiceEligible: "yes",
          },
        } as unknown as StagePlayBadgeV1,
      ],
    });
    const issues = validateStagePlayBadgeGraphV1(graph).join("\n");

    expect(issues).toMatch(/badges\[0\]\.dataTray\.title must be a non-empty string/);
    expect(issues).toMatch(/badges\[0\]\.dataTray\.freshness is invalid/);
    expect(issues).toMatch(/badges\[0\]\.dataTray\.confidence must be between 0 and 1/);
    expect(issues).toMatch(/badges\[0\]\.checkpoint\.askTurnId must be a string or null/);
    expect(issues).toMatch(/badges\[0\]\.checkpoint\.modelReviewed must be boolean/);
    expect(issues).toMatch(/badges\[0\]\.checkpoint may only appear on ask_checkpoint, helix_ask_checkpoint, or answer_snapshot badges/);
    expect(issues).toMatch(/badges\[0\]\.output\.lineKey must be a string or null/);
    expect(issues).toMatch(/badges\[0\]\.output\.text must be a non-empty string/);
    expect(issues).toMatch(/badges\[0\]\.output\.state is invalid/);
    expect(issues).toMatch(/badges\[0\]\.output\.voiceEligible must be boolean/);
    expect(issues).toMatch(/badges\[0\]\.output may only appear on answer_snapshot, live_output, or voice_output badges/);
  });

  it("rejects recommended actions that reference execution tooling", () => {
    const graph = buildFixture({
      recommendedActions: [
        {
          id: "stage-action:bad",
          label: "Call Baritone movement API",
          actionType: "navigation_hint",
          admission: "ask_user",
          agentExecutable: false,
          reasonCodes: ["baritone"],
          evidenceRefs: ["snapshot:1"],
          missingEvidence: [],
        },
      ],
    });

    expect(validateStagePlayBadgeGraphV1(graph).join("\n")).toMatch(/must not reference execution tooling/);
  });

  it("rejects raw world payload phrases and badge answer authority", () => {
    const graph = buildFixture({
      badges: [
        {
          ...actorBadge,
          title: "Player raw NBT payload",
          assistant_answer: true,
        } as StagePlayBadgeV1,
      ],
    });
    const issues = validateStagePlayBadgeGraphV1(graph).join("\n");

    expect(issues).toMatch(/forbidden raw-content phrase matched/);
    expect(issues).toMatch(/badges\[0\] must not claim assistant-answer authority/);
  });
});
