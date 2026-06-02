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
