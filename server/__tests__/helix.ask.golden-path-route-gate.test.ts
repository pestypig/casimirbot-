import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { planRouter, resetHelixAskDebugPayloadCacheForTests } from "../routes/agi.plan";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
  HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
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
    {
      name: "workspace status",
      body: {
        turn_id: "ask:test:golden-route-workspace-status",
        prompt: "helix_ask_golden_path_runtime use workspace_os.status",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        workspace_status_records: [
          { capability_id: "docs-viewer.locate_in_doc", status: "available" },
          { capability_id: "scientific-calculator.solve_expression", status: "available" },
        ],
      },
      expectedTerminalKind: "workspace_status_answer",
      expectedObservationKind: "workspace_os_status_observation",
    },
    {
      name: "processed live-source mail",
      body: {
        turn_id: "ask:test:golden-route-processed-mail",
        prompt: "helix_ask_golden_path_runtime use live_env.read_processed_live_source_mail",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        processed_mail_packet: {
          packetId: "stage_play_processed_mail_packet:route",
          observedFacts: ["The UI shows a pending action banner"],
          inferredFacts: ["The turn should summarize the live-source packet before advising"],
          evidenceRefs: ["visual_frame:route"],
        },
      },
      expectedTerminalKind: "model_synthesized_answer",
      expectedObservationKind: "stage_play_processed_mail_packet",
    },
    {
      name: "stage play reflection",
      body: {
        turn_id: "ask:test:golden-route-stage-play",
        prompt: "helix_ask_golden_path_runtime use live_env.reflect_stage_play_context",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
        stage_play_reflection_result: {
          graph: { graphId: "stage_play_badge_graph:route", missingEvidence: ["model_reviewed_checkpoint"] },
          liveAnswerProjection: { projected: true, projectedLineKeys: ["risk"], changedLineKeys: ["risk"] },
          debugReceipt: { graphId: "stage_play_badge_graph:route", sourceRefs: ["visual_evidence:route"] },
        },
      },
      expectedTerminalKind: "stage_play_reflection_answer",
      expectedObservationKind: "stage_play_reflection_result",
    },
    {
      name: "internet search",
      body: {
        turn_id: "ask:test:golden-route-internet",
        prompt: "helix_ask_golden_path_runtime use internet_search.web_research",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        internet_search_query: "OpenAI Codex documentation",
        internet_search_results: [
          {
            result_id: "web:codex-docs",
            title: "OpenAI Codex documentation",
            url: "https://platform.openai.com/docs/codex",
            snippet: "Codex documentation for agentic coding workflows.",
            rank: 1,
          },
        ],
      },
      expectedTerminalKind: "internet_search_answer",
      expectedObservationKind: "internet_search_observation",
    },
    {
      name: "theory reflection",
      body: {
        turn_id: "ask:test:golden-route-theory",
        prompt: "helix_ask_golden_path_runtime use helix_ask.reflect_theory_context",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        topic: "Casimir tile duty budget",
        anchors: ["Casimir Cavities and Curvature"],
      },
      expectedTerminalKind: "theory_context_reflection_answer",
      expectedObservationKind: "helix_theory_context_reflection_tool_receipt",
    },
    {
      name: "civilization bounds reflection",
      body: {
        turn_id: "ask:test:golden-route-civilization",
        prompt: "helix_ask_golden_path_runtime use helix_ask.reflect_civilization_bounds",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        civilization_bounds_tool_result: {
          roadmap: {
            roadmapId: "civilization-bounds:route",
            title: "Civilization Bounds Roadmap",
            systems: [{ systemId: "energy", label: "Energy system" }],
            missingEvidence: ["source_backed_capacity_measurements"],
          },
        },
      },
      expectedTerminalKind: "civilization_bounds_reflection_answer",
      expectedObservationKind: "helix_civilization_bounds_tool_result",
    },
    {
      name: "zen graph reflection",
      body: {
        turn_id: "ask:test:golden-route-zen",
        prompt: "helix_ask_golden_path_runtime use helix_ask.reflect_ideology_context",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        helix_zen_graph_reflection_tool_result: {
          reflection: {
            reflectionId: "ideology-context-reflection:route",
            input: { summary: "Reflect right speech as an evidence-only lens." },
            authority: { terminal_eligible: false, context_role: "tool_policy" },
          },
        },
      },
      expectedTerminalKind: "ideology_context_reflection_answer",
      expectedObservationKind: "helix_zen_graph_reflection_tool_result",
    },
    {
      name: "visual capture",
      body: {
        turn_id: "ask:test:golden-route-visual",
        prompt: "helix_ask_golden_path_runtime use image_lens.inspect",
        goldenPathRuntime: true,
        requested_capability: HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
        visual_summary: "The Docs Viewer is focused on the NHM2 whitepaper.",
        detected_objects: ["Docs Viewer", "NHM2 whitepaper"],
      },
      expectedTerminalKind: "situation_context_pack",
      expectedObservationKind: "visual_frame_evidence",
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

  it.each([
    {
      name: "catalog plus workspace status",
      body: {
        turn_id: "ask:test:golden-route-catalog-workspace",
        prompt: "helix_ask_golden_path_runtime use helix_ask.inspect_capability_catalog and workspace_os.status",
        goldenPathRuntime: true,
        requested_capabilities: [
          HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
          HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        ],
        workspace_os_status: {
          counts: { total: 34, available: 18, degraded: 1, blocked: 3, error: 0, unknown: 12 },
        },
      },
      expectedStatus: "catalog_workspace_compound",
      expectedObservationKinds: ["capability_registry", "workspace_os_status_observation"],
    },
    {
      name: "repo search plus docs locate",
      body: {
        turn_id: "ask:test:golden-route-repo-docs",
        prompt: "helix_ask_golden_path_runtime use repo-code.search_concept and docs-viewer.locate_in_doc",
        goldenPathRuntime: true,
        requested_capabilities: [
          HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
          HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        ],
        concept: "terminal authority",
        repo_files: [
          {
            path: "server/services/helix-ask/runtime-authority-contract.ts",
            content: "terminal authority selects the final answer only after runtime evidence exists.",
          },
        ],
        doc_path: "docs/helix-ask-turn-solver-spine.md",
        query: "completed solver path terminal authority",
        doc_content: "The completed solver path gates terminal authority and visible projection.",
      },
      expectedStatus: "repo_docs_compound",
      expectedObservationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate", "doc_location_matches"],
    },
    {
      name: "internet research plus theory reflection",
      body: {
        turn_id: "ask:test:golden-route-internet-theory",
        prompt: "helix_ask_golden_path_runtime use internet_search.web_research and helix_ask.reflect_theory_context",
        goldenPathRuntime: true,
        requested_capabilities: [
          HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
          HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        ],
        internet_search_query: "OpenAI Codex tool call lifecycle",
        internet_search_results: [
          {
            result_id: "web:codex-lifecycle",
            title: "OpenAI Codex tool call lifecycle",
            url: "https://platform.openai.com/docs/codex",
            snippet: "Codex executes requested tool calls before finalizing.",
            rank: 1,
          },
        ],
        topic: "Codex parity for Helix Ask observations",
      },
      expectedStatus: "internet_research_reflection_compound",
      expectedObservationKinds: ["internet_search_observation", "helix_theory_context_reflection_tool_receipt"],
    },
    {
      name: "visual capture plus calculator",
      body: {
        turn_id: "ask:test:golden-route-visual-calculator",
        prompt: "helix_ask_golden_path_runtime use image_lens.inspect and scientific-calculator.solve_expression",
        goldenPathRuntime: true,
        requested_capabilities: [
          HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
          HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        ],
        visual_summary: "The current screen shows Docs Viewer and a calculator panel.",
        detected_objects: ["Docs Viewer", "scientific calculator"],
        calculator_expression: "6 * 7",
      },
      expectedStatus: "visual_calculator_compound",
      expectedObservationKinds: ["visual_frame_evidence", "calculator_receipt"],
    },
    {
      name: "civilization bounds plus zen graph reflection",
      body: {
        turn_id: "ask:test:golden-route-civilization-zen",
        prompt: "helix_ask_golden_path_runtime use helix_ask.reflect_civilization_bounds and helix_ask.reflect_ideology_context",
        goldenPathRuntime: true,
        requested_capabilities: [
          HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
          HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        ],
        civilization_bounds_tool_result: {
          roadmap: {
            roadmapId: "civilization-bounds:route-compound",
            title: "Civilization Bounds Roadmap",
            systems: [{ systemId: "energy", label: "Energy system" }],
            missingEvidence: ["source_backed_capacity_measurements"],
          },
        },
        helix_zen_graph_reflection_tool_result: {
          reflection: {
            reflectionId: "ideology-context-reflection:route-compound",
            input: { summary: "Relate civilization bounds to two-key review." },
            authority: { terminal_eligible: false, context_role: "tool_policy" },
          },
        },
      },
      expectedStatus: "civilization_bounds_zen_reflection_compound",
      expectedObservationKinds: ["helix_civilization_bounds_tool_result", "helix_zen_graph_reflection_tool_result"],
    },
  ])("routes $name compound turns through the golden-path runtime", async ({ body, expectedStatus, expectedObservationKinds }) => {
    process.env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG] = "1";
    const app = createApp();

    const response = await request(app).post("/api/agi/ask/turn").send(body).expect(200);
    const ledgerKinds = response.body.current_turn_artifact_ledger?.map((artifact: { kind?: string }) => artifact.kind) ?? [];

    expect(response.body).toMatchObject({
      final_status: "final_answer",
      terminal_artifact_kind: "compound_evidence_synthesis_answer",
      final_answer_source: "compound_evidence_synthesis_answer",
      terminal_error_code: null,
      debug: {
        golden_path_runtime: expect.objectContaining({
          legacy_route_bypassed: true,
        }),
        golden_path_runtime_status: expectedStatus,
      },
      ask_turn_solver_trace: {
        completed_solver_path: true,
        requested_capability: "compound_capability_contract",
        observed_artifact_kind: "compound_subgoal_observations",
        terminal_artifact_kind: "compound_evidence_synthesis_answer",
        compound_subgoal_count: 2,
      },
    });
    for (const expectedKind of expectedObservationKinds) {
      expect(ledgerKinds).toContain(expectedKind);
    }
    expect(response.body.current_turn_artifact_ledger?.filter((artifact: { kind?: string }) => artifact.kind === "compound_evidence_synthesis_answer")).toHaveLength(1);
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
