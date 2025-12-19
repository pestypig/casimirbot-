import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { TMemoryRecord, TTaskTrace } from "../shared/essence-persona";
import type { ToolSpecShape } from "../shared/skills";
import {
  PLAN_DSL_CHAIN,
  buildChatBPlan,
  compilePlan,
  executeCompiledPlan,
  renderChatBPlannerPrompt,
  type ExecutorStep,
} from "../server/services/planner/chat-b";
import { listMemoryRecords, putMemoryRecord, resetMemoryStore } from "../server/services/essence/memory-store";
import { llmLocalHandler, llmLocalSpec } from "../server/skills/llm.local";
import { registerTool } from "../server/skills";
import { kvReset } from "../server/services/llm/kv-budgeter";
import { __resetToolLogStore, getToolLogs } from "../server/services/observability/tool-log-store";

const baseRecord: TMemoryRecord = {
  id: "m-base",
  owner_id: "alice",
  created_at: "2025-11-09T00:00:00Z",
  kind: "semantic",
  text: "Alpha warp bubble is stable and ready for the handoff.",
  keys: ["warp bubble status", "handoff ready"],
  visibility: "public",
};

describe("Chat B planner", () => {
  beforeAll(() => {
    registerTool({ ...llmLocalSpec, handler: llmLocalHandler });
  });

  beforeEach(async () => {
    await resetMemoryStore();
    kvReset();
    __resetToolLogStore();
  });

  it("renders a planner prompt that references the PlanDSL chain and manifest", () => {
    const prompt = renderChatBPlannerPrompt({
      goal: "Report on Alpha bubble",
      personaId: "alice",
      manifest: [
        { name: "llm.local.generate", desc: "Local stub", deterministic: false, rateLimit: { rpm: 60 } },
      ],
      searchQuery: "Alpha warp bubble status",
      topK: 4,
      summaryFocus: "Call out blockers",
    });
    expect(prompt).toContain(PLAN_DSL_CHAIN);
    expect(prompt).toContain("Alpha warp bubble status");
    expect(prompt).toContain("llm.local.generate");
  });

  it("executes the SEARCH->SUMMARIZE->CALL(tool) plan", async () => {
    await putMemoryRecord(baseRecord);
    const { nodes } = buildChatBPlan({
      goal: "Summarize Alpha warp status",
      searchQuery: "Alpha warp bubble status",
      finalTool: llmLocalSpec.name,
    });
    const compiled = compilePlan(nodes);
    const sessionId = randomUUID();
    const goal = "Summarize Alpha warp status";
    const results = await executeCompiledPlan(compiled, { goal, sessionId });
    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject({ kind: "memory.search", ok: true });
    expect(results[1]).toMatchObject({ kind: "summary.compose", ok: true });
    const summaryOutput = results[1].ok ? (results[1].output as string) : "";
    expect(summaryOutput).toContain("Goal: Summarize Alpha warp status");
    const finalStep = results[2];
    expect(finalStep.ok).toBe(true);
    expect(finalStep).toMatchObject({ kind: "tool.call" });
    expect((finalStep.ok && (finalStep.output as any)?.text) ?? "").toBe("llm.local stub result");
    expect(results[0].citations).toContain(baseRecord.id);
    expect(results[1].citations).toEqual(results[0].citations);
    expect(results[2].citations).toEqual(results[1].citations);
  });

  it("summarizes evicted turns to Essence when the KV budget is exceeded", async () => {
    const previousBudget = process.env.KV_BUDGET_BYTES;
    const previousEssence = process.env.ENABLE_ESSENCE;
    process.env.KV_BUDGET_BYTES = "1";
    process.env.ENABLE_ESSENCE = "1";
    await putMemoryRecord(baseRecord);
    const { nodes } = buildChatBPlan({
      goal: "Summarize Alpha warp status",
      searchQuery: "Alpha warp bubble status",
      finalTool: llmLocalSpec.name,
    });
    const compiled = compilePlan(nodes);
    const sessionId = randomUUID();
    await executeCompiledPlan(compiled, { goal: "Summarize Alpha warp status", sessionId });
    const evictionSummaries = (await listMemoryRecords()).filter((record) => record.keys.includes("kv-eviction"));
    expect(evictionSummaries.length).toBeGreaterThan(0);
    const latest = evictionSummaries[evictionSummaries.length - 1];
    expect(latest.text ?? "").toContain("KV eviction summary");
    expect(latest.text ?? "").toContain(baseRecord.id);
    expect(latest.keys).toContain(`session:${sessionId}`);
    if (previousBudget === undefined) {
      delete process.env.KV_BUDGET_BYTES;
    } else {
      process.env.KV_BUDGET_BYTES = previousBudget;
    }
    if (previousEssence === undefined) {
      delete process.env.ENABLE_ESSENCE;
    } else {
      process.env.ENABLE_ESSENCE = previousEssence;
    }
  });

  it("records approvals for tools flagged as risky", async () => {
    const spec: ToolSpecShape = {
      name: "fs.write.test",
      desc: "writes envelopes to disk",
      inputSchema: {} as any,
      outputSchema: {} as any,
      deterministic: true,
      rateLimit: { rpm: 10 },
      safety: { risks: ["writes_files"] },
    };
    registerTool({
      ...spec,
      handler: async () => ({ ok: true }),
    });
    const steps: ExecutorStep[] = [
      { id: "call-1", kind: "tool.call", tool: spec.name, promptTemplate: "{{goal}}", extra: {} },
    ];
    const taskTrace: TTaskTrace = {
      id: "trace-approval",
      persona_id: "alice",
      created_at: new Date().toISOString(),
      goal: "Ensure approvals log",
      plan_json: [],
      steps: [],
      approvals: [],
    };
    await executeCompiledPlan(steps, { goal: "Ensure approvals log", sessionId: "trace-approval", taskTrace });
    expect(taskTrace.approvals).toHaveLength(1);
    expect(taskTrace.approvals[0]).toMatchObject({ tool: spec.name, capability: "writes_files" });
  });

  it("writes procedural reflections and readable tool logs when enabled", async () => {
    process.env.ENABLE_REFLECTION = "1";
    process.env.ENABLE_LOG_TEXT = "1";
    await putMemoryRecord(baseRecord);
    const { nodes } = buildChatBPlan({
      goal: "Summarize Alpha warp status",
      searchQuery: "Alpha warp bubble status",
      finalTool: llmLocalSpec.name,
    });
    const compiled = compilePlan(nodes);
    const taskTrace: TTaskTrace = {
      id: "trace-reflection",
      persona_id: "alice",
      created_at: new Date().toISOString(),
      goal: "Summarize Alpha warp status",
      plan_json: [],
      steps: [],
      approvals: [],
    };
    await executeCompiledPlan(compiled, {
      goal: "Summarize Alpha warp status",
      sessionId: taskTrace.id,
      personaId: "alice",
      taskTrace,
    });
    const memories = await listMemoryRecords();
    const reflection = memories.find((record) => record.kind === "procedural" && record.keys.includes("reflection"));
    expect(reflection).toBeTruthy();
    expect(reflection?.keys).toContain(`task:${taskTrace.id}`);
    const logs = getToolLogs({ limit: 1 });
    expect(logs[0]?.text).toContain("[ok] llm.local.generate");
    delete process.env.ENABLE_REFLECTION;
    delete process.env.ENABLE_LOG_TEXT;
  });
});
