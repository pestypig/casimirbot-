import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { resetHelixAskTurnAdmissionForTests } from "../services/helix-ask/ask-turn-admission";
import { runtimeMemoryGovernor } from "../services/runtime/runtime-memory-governor";
import { resetStagePlayLiveSourceMailWakeStoreForTest } from "../services/stage-play/stage-play-live-source-mail-wake-store";

type RecordLike = Record<string, unknown>;

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
];

const expectRailTableShape = (railTable: RecordLike, turnId: string): void => {
  expect(railTable).toMatchObject({
    schema: "helix.codex_parity_agent_spine_rail_table.v1",
    turn_id: turnId,
    assistant_answer: false,
    raw_content_included: false,
  });
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
  runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests();
  resetHelixAskTurnAdmissionForTests();
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
  runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests();
  resetHelixAskTurnAdmissionForTests();
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
  runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests();
  resetHelixAskTurnAdmissionForTests();
  resetStagePlayLiveSourceMailWakeStoreForTest();
});

describe("Helix Ask Codex-parity agent spine convergence", () => {
  it.each([
    {
      id: "calculator",
      prompt:
        "Call scientific-calculator.solve_expression with this exact expression: 2 + 2. Wait for calculator_receipt and answer from workstation_tool_evaluation.",
      requestedCapability: "scientific-calculator.solve_expression",
    },
    {
      id: "workspace_status",
      prompt: "Use workspace_os.status to inspect workstation status.",
      requestedCapability: "workspace_os.status",
    },
    {
      id: "docs_locate",
      prompt: "Use docs-viewer.locate_in_doc to locate the rule of thumb in docs/helix-ask-codex-loop-discipline.md.",
      requestedCapability: "docs-viewer.locate_in_doc",
    },
    {
      id: "repo_search",
      prompt: "Use repo-code.search_concept to find where terminal authority selects the answer.",
      requestedCapability: "repo-code.search_concept",
    },
    {
      id: "internet_search",
      prompt: "Use internet_search.web_research to find current public evidence about OpenAI Codex.",
      requestedCapability: "internet_search.web_research",
      selectedCapability: "internet-search.search_web",
    },
    {
      id: "live_source_mail",
      prompt: "Use live_env.read_processed_live_source_mail to inspect the latest processed live-source mail.",
      requestedCapability: "live_env.read_processed_live_source_mail",
    },
  ])("$id explicit capability is reflected in the API/debug rail table", async (scenario) => {
    const { turnRail } = await fetchRailTable({
      app: createApp(),
      prompt: scenario.prompt,
      sessionId: `helix-ask:spine-convergence:${scenario.id}:${Date.now()}`,
    });

    expect(turnRail.requested_capability).toBe(scenario.requestedCapability);
    expect(turnRail.selected_capability).toBe(scenario.selectedCapability ?? scenario.requestedCapability);
    expect(turnRail.admitted_capability).toBe(scenario.selectedCapability ?? scenario.requestedCapability);
    expect(turnRail.codex_parity_class).not.toBe("explicit_capability_demoted");
    if (scenario.id === "internet_search") {
      expect(turnRail.codex_parity_class).toBe("provider_config_missing");
      expect(turnRail.rail_failure_code).toBe("config_missing");
      expect(turnRail.first_broken_rail).toBe("config");
      expect(turnRail.repair_target).toBe("operator_config");
    }
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
});
