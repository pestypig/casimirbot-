import { describe, expect, it } from "vitest";
import {
  buildStagePlayBuilderCatalogV1,
  buildStagePlaySourceQueryV1,
  normalizeStagePlayGraphDraftV1,
  validateStagePlayGraphDraftV1,
} from "../stage-play-builder.v1";

const sourceHandles = [
  {
    sourceId: "source:visual-tab",
    sourceClass: "visual_frame",
    status: "active_interval",
    descriptorId: "live_source_descriptor:visual",
    producerId: "live_source_producer:visual",
    surface: "browser_tab",
    origin: "browser_getDisplayMedia",
    cadenceMs: 10000,
    latestEvidenceRefs: [
      "live_source_descriptor:visual",
      "live_source_producer:visual",
      "visual_observation:latest",
    ],
  },
];

describe("stage_play_builder/v1", () => {
  it("describes the evidence-only stage builder grammar", () => {
    const catalog = buildStagePlayBuilderCatalogV1({
      generatedAt: "2026-06-02T12:00:00.000Z",
      sourceClasses: ["visual_frame"],
    });

    expect(catalog.artifactId).toBe("stage_play_builder_catalog");
    expect(catalog.schemaVersion).toBe("stage_play_builder_catalog/v1");
    expect(catalog.nodeKinds).toEqual(expect.arrayContaining(["source", "interpreter", "procedural_binding"]));
    expect(catalog.edgeRelations).toEqual(expect.arrayContaining(["feeds", "interprets", "composes_with"]));
    expect(catalog.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
    });
  });

  it("returns source handles without answer authority", () => {
    const query = buildStagePlaySourceQueryV1({
      threadId: "thread:stage-builder",
      sourceHandles,
      generatedAt: "2026-06-02T12:00:00.000Z",
    });

    expect(query.artifactId).toBe("stage_play_source_query");
    expect(query.sourceHandles[0]?.latestEvidenceRefs).toContain("visual_observation:latest");
    expect(query.authority.assistant_answer).toBe(false);
  });

  it("validates a model-proposed graph draft against available sources", () => {
    const normalized = normalizeStagePlayGraphDraftV1({
      objective: "Predict likely next character action.",
      nodes: [
        { id: "source.visual", kind: "source", bind: { sourceClass: "visual_frame", sourceId: "source:visual-tab" } },
        { id: "interpreter.stage", kind: "interpreter" },
        { id: "actor.primary", kind: "actor" },
        { id: "procedure.next", kind: "procedural_binding" },
      ],
      edges: [
        { from: "source.visual", to: "interpreter.stage", relation: "feeds" },
        { from: "interpreter.stage", to: "actor.primary", relation: "interprets" },
        { from: "actor.primary", to: "procedure.next", relation: "constrains" },
      ],
      checkpointPolicy: {
        cadenceMs: 10000,
        completeEachWindow: true,
        standingJobRemainsOpen: true,
      },
    });

    const validation = validateStagePlayGraphDraftV1({
      draft: normalized.draft,
      initialIssues: normalized.issues,
      sourceHandles,
      generatedAt: "2026-06-02T12:00:01.000Z",
    });

    expect(validation.ok).toBe(true);
    expect(validation.resolvedSourceIds).toEqual(["source:visual-tab"]);
    expect(validation.evidenceRefs).toEqual(expect.arrayContaining(["visual_observation:latest"]));
    expect(validation.authority.agent_executable).toBe(false);
  });

  it("rejects missing source handles and execution-like drafts", () => {
    const normalized = normalizeStagePlayGraphDraftV1({
      objective: "Run command through the graph",
      nodes: [
        { id: "source.bad", kind: "source", bind: { sourceClass: "visual_frame", sourceId: "source:missing" } },
      ],
      edges: [
        { from: "source.bad", to: "missing.node", relation: "feeds" },
      ],
      checkpointPolicy: {
        completeEachWindow: true,
        standingJobRemainsOpen: false,
      },
      agentExecutable: true,
    });
    const validation = validateStagePlayGraphDraftV1({
      draft: normalized.draft,
      initialIssues: normalized.issues,
      sourceHandles,
    });

    expect(validation.ok).toBe(false);
    expect(validation.issues.join("\n")).toMatch(/source:missing/);
    expect(validation.issues.join("\n")).toMatch(/standingJobRemainsOpen/);
    expect(validation.issues.join("\n")).toMatch(/execution/);
  });
});
