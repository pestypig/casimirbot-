import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { resetHelixAskTurnAdmissionForTests } from "../services/helix-ask/ask-turn-admission";
import { runtimeMemoryGovernor } from "../services/runtime/runtime-memory-governor";
import { resetStagePlayLiveSourceMailWakeStoreForTest } from "../services/stage-play/stage-play-live-source-mail-wake-store";

type RecordLike = Record<string, unknown>;

const CODEX_PARITY_CLASSES = [
  "complete",
  "tool_surface_missing",
  "explicit_capability_demoted",
  "tool_admission_rejected",
  "selected_not_executed",
  "observation_missing",
  "observation_not_reentered",
  "goal_contract_mismatch",
  "terminal_product_not_allowed",
  "terminal_authority_mismatch",
  "visible_projection_mismatch",
  "debug_mirror_stale",
  "provider_config_missing",
] as const;

type ExpectedRailOutcome = {
  visibleToolSurface: string[];
  selectedCapability?: string;
  admittedCapability?: string;
  executedCapability?: string;
  observationKind?: string;
  reentryStatus: "reentered" | "not_reentered" | "no_observation";
  goalSatisfaction: string;
  requiredTerminalKind?: string;
  selectedTerminalKind?: string;
  visibleTerminalKind?: string;
  railStatus: "complete" | "broken" | "fail_closed";
  codexParityClass: (typeof CODEX_PARITY_CLASSES)[number];
  railFailureCode?: string | null;
  firstBrokenRail?: string | null;
  repairTarget?: string | null;
};

type ExplicitCapabilityScenario = {
  id: string;
  prompt: string;
  requestedCapability: string;
  expected: ExpectedRailOutcome;
};

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const TEST_MIB = 1024 * 1024;

const resetEndpointAdmissionForTests = (): void => {
  runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
    memoryReader: () => ({
      rss: 512 * TEST_MIB,
      heapTotal: 256 * TEST_MIB,
      heapUsed: 128 * TEST_MIB,
      external: 8 * TEST_MIB,
      arrayBuffers: 1 * TEST_MIB,
    }),
    hostMemoryReader: () => ({
      freeMiB: 8192,
      totalMiB: 16384,
      freeRatio: 0.5,
    }),
  });
  resetHelixAskTurnAdmissionForTests();
};

const expectRailTableShape = (railTable: RecordLike, turnId: string): void => {
  expect(railTable).toMatchObject({
    schema: "helix.codex_parity_agent_spine_rail_table.v1",
    turn_id: turnId,
    assistant_answer: false,
    raw_content_included: false,
  });
  expect(Array.isArray(railTable.visible_tool_surface)).toBe(true);
  for (const key of [
    "prompt",
    "requested_capability",
    "selected_capability",
    "admitted_capability",
    "executed_capability",
    "observation_kind",
    "observation_ref",
    "goal_satisfaction",
    "required_terminal_kind",
    "selected_terminal_kind",
    "visible_terminal_kind",
    "first_broken_rail",
    "repair_target",
    "rail_failure_code",
  ]) {
    expect(railTable).toHaveProperty(key);
    expect(railTable[key] === null || typeof railTable[key] === "string").toBe(true);
  }
  expect(["reentered", "not_reentered", "no_observation"]).toContain(railTable.reentry_status);
  expect(["complete", "broken", "fail_closed"]).toContain(railTable.rail_status);
  expect(CODEX_PARITY_CLASSES).toContain(railTable.codex_parity_class);
  if (railTable.rail_status === "complete" || railTable.codex_parity_class === "complete") {
    expect(railTable.first_broken_rail).toBeNull();
    expect(railTable.rail_failure_code).toBeNull();
  } else {
    expect(typeof railTable.first_broken_rail).toBe("string");
    expect(String(railTable.first_broken_rail).length).toBeGreaterThan(0);
  }
};

const fetchRailTable = async (input: {
  app: express.Express;
  prompt: string;
  sessionId: string;
}): Promise<{
  turnId: string;
  turnRail: RecordLike;
  debugRail: RecordLike;
}> => {
  resetEndpointAdmissionForTests();
  const turn = await request(input.app)
    .post("/api/agi/ask/turn")
    .send({
      sessionId: input.sessionId,
      question: input.prompt,
      mode: "read",
      debug: false,
    })
    .expect(200);
  const turnId = readString(turn.body?.turn_id);
  expect(turnId).toBeTruthy();
  const debug = await request(input.app)
    .get(`/api/agi/ask/turn/${encodeURIComponent(turnId as string)}/debug-export?view=rail`)
    .expect(200);
  const turnRail = readRecord(turn.body?.codex_parity_agent_spine_rail_table);
  const debugRail = readRecord(debug.body?.payload?.codex_parity_agent_spine_rail_table);
  expect(turnRail).toBeTruthy();
  expect(debugRail).toBeTruthy();
  expectRailTableShape(turnRail as RecordLike, turnId as string);
  expectRailTableShape(debugRail as RecordLike, turnId as string);
  expect(debugRail).toEqual(turnRail);
  (turn as unknown as { body?: unknown }).body = undefined;
  (debug as unknown as { body?: unknown }).body = undefined;
  resetEndpointAdmissionForTests();
  return { turnId: turnId as string, turnRail: turnRail as RecordLike, debugRail: debugRail as RecordLike };
};

const seedVisualCapture = async (input: {
  app: express.Express;
  sessionId: string;
}): Promise<void> => {
  await request(input.app)
    .post("/api/agi/situation/test-harness/live-visual-source")
    .send({
      thread_id: input.sessionId,
      source_id: `visual_source:spine-convergence:${Date.now()}`,
      scene_text: "A backend-seeded visual capture shows a workstation panel with a visible status table.",
      activity: "Reviewing a workstation panel with status rows.",
      objects: "workstation panel, status table, visible controls",
      confidence: 0.82,
    })
    .expect(200);
};

beforeEach(() => {
  resetEndpointAdmissionForTests();
  resetStagePlayLiveSourceMailWakeStoreForTest();
});

describe("Helix Ask Codex-parity agent spine convergence", () => {
  it.each<ExplicitCapabilityScenario>([
    {
      id: "calculator",
      prompt:
        "Call scientific-calculator.solve_expression with this exact expression: 2 + 2. Wait for calculator_receipt and answer from workstation_tool_evaluation.",
      requestedCapability: "scientific-calculator.solve_expression",
      expected: {
        visibleToolSurface: ["scientific-calculator.solve_expression"],
        executedCapability: "scientific-calculator.solve_expression",
        observationKind: "calculator_receipt",
        reentryStatus: "reentered",
        goalSatisfaction: "satisfied",
        requiredTerminalKind: "workstation_tool_evaluation",
        selectedTerminalKind: "workstation_tool_evaluation",
        visibleTerminalKind: "workstation_tool_evaluation",
        railStatus: "complete",
        codexParityClass: "complete",
        railFailureCode: null,
        firstBrokenRail: null,
        repairTarget: null,
      },
    },
    {
      id: "workspace_status",
      prompt: "Use workspace_os.status to inspect workstation status.",
      requestedCapability: "workspace_os.status",
      expected: {
        visibleToolSurface: ["workspace_os.status"],
        executedCapability: "workspace_os.status",
        observationKind: "workspace_os_status_observation",
        reentryStatus: "reentered",
        goalSatisfaction: "satisfied",
        requiredTerminalKind: "model_synthesized_answer",
        selectedTerminalKind: "model_synthesized_answer",
        visibleTerminalKind: "model_synthesized_answer",
        railStatus: "complete",
        codexParityClass: "complete",
        railFailureCode: null,
        firstBrokenRail: null,
        repairTarget: null,
      },
    },
    {
      id: "docs_locate",
      prompt: "Use docs-viewer.locate_in_doc to locate the rule of thumb in docs/helix-ask-codex-loop-discipline.md.",
      requestedCapability: "docs-viewer.locate_in_doc",
      expected: {
        visibleToolSurface: ["docs-viewer.locate_in_doc"],
        executedCapability: "docs-viewer.locate_in_doc",
        observationKind: "doc_location_matches",
        reentryStatus: "reentered",
        goalSatisfaction: "satisfied",
        requiredTerminalKind: "doc_location_matches",
        selectedTerminalKind: "typed_failure",
        visibleTerminalKind: "typed_failure",
        railStatus: "fail_closed",
        codexParityClass: "goal_contract_mismatch",
        railFailureCode: "terminal_not_materialized",
        firstBrokenRail: "terminal_materialization",
        repairTarget: "terminal_materializer",
      },
    },
    {
      id: "repo_search",
      prompt: "Use repo-code.search_concept to find where terminal authority selects the answer.",
      requestedCapability: "repo-code.search_concept",
      expected: {
        visibleToolSurface: ["repo-code.search_concept"],
        executedCapability: "repo-code.search_concept",
        observationKind: "repo_code_evidence_observation",
        reentryStatus: "reentered",
        goalSatisfaction: "not_satisfied",
        requiredTerminalKind: "repo_code_evidence_answer",
        selectedTerminalKind: "typed_failure",
        visibleTerminalKind: "typed_failure",
        railStatus: "fail_closed",
        codexParityClass: "observation_not_reentered",
        railFailureCode: "weak_evidence_repair_loop",
        firstBrokenRail: "evidence_reentry",
        repairTarget: "repo_retrieval_repair_policy",
      },
    },
    {
      id: "internet_search",
      prompt: "Use internet_search.web_research to find current public evidence about OpenAI Codex.",
      requestedCapability: "internet_search.web_research",
      expected: {
        visibleToolSurface: ["internet_search.web_research"],
        selectedCapability: "internet-search.search_web",
        admittedCapability: "internet-search.search_web",
        executedCapability: "internet-search.search_web",
        observationKind: "internet_search_observation",
        reentryStatus: "reentered",
        goalSatisfaction: "not_satisfied",
        requiredTerminalKind: "internet_search_answer",
        selectedTerminalKind: "typed_failure",
        visibleTerminalKind: "typed_failure",
        railStatus: "fail_closed",
        codexParityClass: "provider_config_missing",
        railFailureCode: "config_missing",
        firstBrokenRail: "config",
        repairTarget: "operator_config",
      },
    },
    {
      id: "live_source_mail",
      prompt: "Use live_env.read_processed_live_source_mail to inspect the latest processed live-source mail.",
      requestedCapability: "live_env.read_processed_live_source_mail",
      expected: {
        visibleToolSurface: ["live_env.read_processed_live_source_mail"],
        executedCapability: "live_env.read_processed_live_source_mail",
        observationKind: "reasoning_context",
        reentryStatus: "reentered",
        goalSatisfaction: "not_satisfied",
        requiredTerminalKind: "model_synthesized_answer",
        selectedTerminalKind: "typed_failure",
        visibleTerminalKind: "typed_failure",
        railStatus: "fail_closed",
        codexParityClass: "observation_missing",
        railFailureCode: "required_observation_missing",
        firstBrokenRail: "observation_artifact",
        repairTarget: "observation_materializer",
      },
    },
  ])("$id explicit capability is reflected in the API/debug rail table", async (scenario) => {
    const { turnRail } = await fetchRailTable({
      app: createApp(),
      prompt: scenario.prompt,
      sessionId: `helix-ask:spine-convergence:${scenario.id}:${Date.now()}`,
    });

    expect(turnRail.requested_capability).toBe(scenario.requestedCapability);
    expect(turnRail.visible_tool_surface).toEqual(expect.arrayContaining(scenario.expected.visibleToolSurface));
    expect(turnRail.selected_capability).toBe(scenario.expected.selectedCapability ?? scenario.requestedCapability);
    expect(turnRail.admitted_capability).toBe(
      scenario.expected.admittedCapability ?? scenario.expected.selectedCapability ?? scenario.requestedCapability,
    );
    expect(turnRail.executed_capability).toBe(scenario.expected.executedCapability ?? scenario.requestedCapability);
    expect(turnRail.observation_kind).toBe(scenario.expected.observationKind);
    expect(turnRail.reentry_status).toBe(scenario.expected.reentryStatus);
    expect(turnRail.goal_satisfaction).toBe(scenario.expected.goalSatisfaction);
    expect(turnRail.required_terminal_kind).toBe(scenario.expected.requiredTerminalKind);
    expect(turnRail.selected_terminal_kind).toBe(scenario.expected.selectedTerminalKind);
    expect(turnRail.visible_terminal_kind).toBe(scenario.expected.visibleTerminalKind);
    expect(turnRail.rail_status).toBe(scenario.expected.railStatus);
    expect(turnRail.codex_parity_class).toBe(scenario.expected.codexParityClass);
    expect(turnRail.rail_failure_code).toBe(scenario.expected.railFailureCode ?? null);
    expect(turnRail.first_broken_rail).toBe(scenario.expected.firstBrokenRail ?? null);
    expect(turnRail.repair_target).toBe(scenario.expected.repairTarget ?? null);
    expect(turnRail.codex_parity_class).not.toBe("explicit_capability_demoted");
  }, 60_000);

  it("answers capability catalog questions from runtime catalog evidence, not repo existence", async () => {
    const { turnRail } = await fetchRailTable({
      app: createApp(),
      prompt: "What tools are available for the helix ask to use?",
      sessionId: `helix-ask:spine-convergence:catalog:${Date.now()}`,
    });

    expect(turnRail.selected_capability).toBe("helix_ask.inspect_capability_catalog");
    expect(turnRail.admitted_capability).toBe("helix_ask.inspect_capability_catalog");
    expect(turnRail.executed_capability).toBe("helix_ask.inspect_capability_catalog");
    expect(turnRail.observation_kind).toBe("capability_registry");
    expect(turnRail.codex_parity_class).toBe("complete");
  }, 60_000);

  it("keeps negated calculator references suppressed instead of treating them as progress", async () => {
    const { turnRail } = await fetchRailTable({
      app: createApp(),
      prompt:
        "Do not call scientific-calculator.solve_expression. Explain why calculator receipts are observations rather than terminal authority.",
      sessionId: `helix-ask:spine-convergence:negated-calculator:${Date.now()}`,
    });

    expect(turnRail.requested_capability).toBeNull();
    expect(turnRail.selected_capability).toBe("suppressed_contextual_tool_reference");
    expect(turnRail.executed_capability).not.toBe("scientific-calculator.solve_expression");
    expect(turnRail.codex_parity_class).not.toBe("complete");
  }, 60_000);

  it("routes current-screen visual questions through visual capture evidence", async () => {
    const app = createApp();
    const sessionId = `helix-ask:spine-convergence:visual:${Date.now()}`;
    await seedVisualCapture({ app, sessionId });

    const { turnRail } = await fetchRailTable({
      app,
      prompt: "What is happening right now in the visual screen capture?",
      sessionId,
    });

    expect(turnRail.visible_tool_surface).toEqual(
      expect.arrayContaining(["situation-room.describe_visual_capture"]),
    );
    expect(turnRail.selected_capability).toBe("situation-room.describe_visual_capture");
    expect(turnRail.admitted_capability).toBe("situation-room.describe_visual_capture");
    expect(turnRail.executed_capability).toBe("situation-room.describe_visual_capture");
    expect(turnRail.codex_parity_class).toBe("complete");
  }, 60_000);

  it("fails closed when an image lens request reaches visual capture but does not execute", async () => {
    const app = createApp();
    const sessionId = `helix-ask:spine-convergence:image-lens:${Date.now()}`;
    await seedVisualCapture({ app, sessionId });

    const { turnRail } = await fetchRailTable({
      app,
      prompt: "Use image_lens.inspect to inspect the current image lens visual source.",
      sessionId,
    });
    expect(turnRail.requested_capability).toBe("image_lens.inspect");
    expect(turnRail.visible_tool_surface).toEqual(
      expect.arrayContaining(["image_lens.inspect", "situation-room.describe_visual_capture"]),
    );
    expect(turnRail.selected_capability).toBe("situation-room.describe_visual_capture");
    expect(turnRail.admitted_capability).toBe("situation-room.describe_visual_capture");
    expect(turnRail.executed_capability).toBeNull();
    expect(turnRail.observation_kind).toBe("tool_observation");
    expect(turnRail.reentry_status).toBe("reentered");
    expect(turnRail.goal_satisfaction).toBe("not_satisfied");
    expect(turnRail.required_terminal_kind).toBe("model_synthesized_answer");
    expect(turnRail.selected_terminal_kind).toBe("typed_failure");
    expect(turnRail.visible_terminal_kind).toBe("typed_failure");
    expect(turnRail.first_broken_rail).toBe("capability_execution");
    expect(turnRail.repair_target).toBe("tool_execution");
    expect(turnRail.rail_failure_code).toBe("required_observation_missing");
    expect(turnRail.codex_parity_class).toBe("selected_not_executed");
  }, 60_000);
});
