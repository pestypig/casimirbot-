import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { planRouter, resetHelixAskDebugPayloadCacheForTests } from "../routes/agi.plan";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
} from "../services/helix-ask/golden-path-runtime";
import { HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY } from "../services/helix-ask/workspace-directory-resolver";

const originalGoldenPathFlag = process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG];

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

const parseSseEvents = (text: string): Array<{ event: string; data: Record<string, unknown> }> =>
  text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const event =
        block
          .split(/\n/)
          .find((line) => line.startsWith("event:"))
          ?.slice("event:".length)
          .trim() ?? "";
      const dataText = block
        .split(/\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trim())
        .join("\n");
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(dataText);
      } catch {
        data = {};
      }
      return { event, data };
    });

afterEach(() => {
  resetHelixAskDebugPayloadCacheForTests();
  if (originalGoldenPathFlag === undefined) {
    delete process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG];
  } else {
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = originalGoldenPathFlag;
  }
});

describe("Helix Ask golden-path route gate", () => {
  it.each([
    {
      name: "calculator",
      body: {
        turn_id: "ask:test:golden-route-calculator",
        prompt: "helix_ask_golden_path_runtime use scientific-calculator.solve_expression",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        calculator_expression: "2 + 2",
      },
      expectedTerminalKind: "workstation_tool_evaluation",
      expectedObservationKind: "calculator_receipt",
    },
    {
      name: "capability catalog",
      body: {
        turn_id: "ask:test:golden-route-catalog",
        prompt: "helix_ask_golden_path_runtime use helix_ask.inspect_capability_catalog",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      },
      expectedTerminalKind: "capability_help_summary",
      expectedObservationKind: "capability_registry",
    },
    {
      name: "docs locate",
      body: {
        turn_id: "ask:test:golden-route-docs",
        prompt: "helix_ask_golden_path_runtime use docs-viewer.locate_in_doc",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        doc_path: "docs/helix-ask-turn-solver-spine.md",
        query: "terminal authority",
        doc_content: [
          "# Solver Spine",
          "Terminal authority selects the answer after observations re-enter reasoning.",
          "Receipts remain observations until terminal authority accepts a supported product.",
        ].join("\n"),
      },
      expectedTerminalKind: "doc_location_matches",
      expectedObservationKind: "doc_location_matches",
    },
    {
      name: "repo search",
      body: {
        turn_id: "ask:test:golden-route-repo",
        prompt: "helix_ask_golden_path_runtime use repo-code.search_concept",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        concept: "terminal authority",
        repo_files: [
          {
            path: "server/services/helix-ask/runtime-authority-contract.ts",
            content: "terminal authority selects the visible final answer from supported runtime evidence.",
          },
          {
            path: "docs/helix-ask-turn-solver-spine.md",
            content: "The completed solver path gates terminal authority and projection.",
          },
        ],
      },
      expectedTerminalKind: "repo_code_evidence_answer",
      expectedObservationKind: "repo_code_evidence_observation",
    },
    {
      name: "scholarly research",
      body: {
        turn_id: "ask:test:golden-route-scholarly",
        prompt: "helix_ask_golden_path_runtime use scholarly-research.lookup_papers",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        scholarly_query: "Casimir cavity force papers",
        scholarly_papers: [
          {
            title: "Casimir forces in cavity systems",
            abstract: "Reports measurements and theory for Casimir force estimates.",
            url: "https://example.test/casimir",
            evidence_refs: ["paper:casimir"],
          },
        ],
      },
      expectedTerminalKind: "scholarly_research_answer",
      expectedObservationKind: "scholarly_research_observation",
    },
    {
      name: "workspace directory",
      body: {
        turn_id: "ask:test:golden-route-workspace-directory",
        prompt: "helix_ask_golden_path_runtime use workspace-directory.resolve",
        goldenPathRuntime: true,
        requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        workspace_directory_query: "docs/helix-ask-turn-solver-spine.md",
      },
      expectedTerminalKind: "workspace_directory_resolution",
      expectedObservationKind: "workspace_directory_resolution",
    },
  ])("routes explicit $name turns through the golden-path runtime", async ({ body, expectedTerminalKind, expectedObservationKind }) => {
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = "1";
    const app = createApp();

    const response = await request(app).post("/api/agi/ask/turn").send(body).expect(200);

    expect(response.body).toMatchObject({
      final_status: "final_answer",
      terminal_artifact_kind: expectedTerminalKind,
      final_answer_source: expectedTerminalKind,
      terminal_error_code: null,
      debug: {
        golden_path_runtime: expect.objectContaining({
          legacy_route_bypassed: true,
        }),
        terminal_artifact_kind: expectedTerminalKind,
      },
      ask_turn_solver_trace: {
        completed_solver_path: true,
        observed_artifact_kind: expectedObservationKind,
        terminal_artifact_kind: expectedTerminalKind,
      },
    });
    expect(response.body.current_turn_artifact_ledger?.some((artifact: { kind?: string }) => artifact.kind === expectedObservationKind)).toBe(true);
    expect(response.body.current_turn_artifact_ledger?.filter((artifact: { kind?: string }) => artifact.kind === expectedTerminalKind)).toHaveLength(1);
  });

  it("routes a docs plus calculator compound turn through the golden-path runtime", async () => {
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = "1";
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        turn_id: "ask:test:golden-route-docs-calculator",
        prompt: "helix_ask_golden_path_runtime use docs-viewer.locate_in_doc and scientific-calculator.solve_expression",
        goldenPathRuntime: true,
        requested_capabilities: [
          HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
          HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        ],
        doc_path: "docs/helix-ask-turn-solver-spine.md",
        query: "terminal authority",
        doc_content: "Terminal authority selects the answer after observations re-enter reasoning.",
        calculator_expression: "(9 + 3) * 2",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      final_status: "final_answer",
      terminal_artifact_kind: "compound_evidence_synthesis_answer",
      final_answer_source: "compound_evidence_synthesis_answer",
      terminal_error_code: null,
      debug: {
        golden_path_runtime: expect.objectContaining({
          legacy_route_bypassed: true,
        }),
        golden_path_runtime_status: "docs_calculator_compound",
      },
      ask_turn_solver_trace: {
        completed_solver_path: true,
        requested_capability: "compound_capability_contract",
        observed_artifact_kind: "compound_subgoal_observations",
        terminal_artifact_kind: "compound_evidence_synthesis_answer",
        compound_subgoal_count: 2,
      },
    });
    expect(response.body.compound_capability_contract?.ordered_subgoals).toHaveLength(2);
    expect(response.body.current_turn_artifact_ledger?.map((artifact: { kind?: string }) => artifact.kind)).toContain("doc_location_matches");
    expect(response.body.current_turn_artifact_ledger?.map((artifact: { kind?: string }) => artifact.kind)).toContain("calculator_receipt");
  });

  it("routes stream turns through the golden-path runtime before legacy carryover", async () => {
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = "1";
    const app = createApp();

    const response = await request(app)
      .post("/api/agi/ask/turn/stream")
      .send({
        turn_id: "ask:test:golden-stream-calculator",
        prompt: "helix_ask_golden_path_runtime use scientific-calculator.solve_expression",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        calculator_expression: "5 * 6",
      })
      .expect(200);
    const finalEvent = parseSseEvents(response.text).find((event) => event.event === "turn_final");

    expect(finalEvent?.data).toMatchObject({
      final_status: "final_answer",
      terminal_artifact_kind: "workstation_tool_evaluation",
      final_answer_source: "workstation_tool_evaluation",
      terminal_error_code: null,
      stream_used: true,
      stream_mode: "golden_path_runtime",
      ask_turn_solver_trace: {
        completed_solver_path: true,
        observed_artifact_kind: "calculator_receipt",
        terminal_artifact_kind: "workstation_tool_evaluation",
      },
    });
    expect((finalEvent?.data.debug as { golden_path_runtime?: unknown } | undefined)?.golden_path_runtime).toEqual(
      expect.objectContaining({
        legacy_route_bypassed: true,
      }),
    );
  });
});
