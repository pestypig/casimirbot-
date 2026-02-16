import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("Helix Ask live events", () => {
  let server: Server;
  let baseUrl = "http://127.0.0.1:0";

  beforeAll(async () => {
    process.env.ENABLE_AGI = "1";
    process.env.HELIX_ASK_MICRO_PASS = "0";
    process.env.HELIX_ASK_MICRO_PASS_AUTO = "0";
    process.env.HELIX_ASK_TWO_PASS = "0";
    vi.resetModules();
    const { planRouter } = await import("../server/routes/agi.plan");
    const app = express();
    app.use(express.json({ limit: "5mb" }));
    app.use("/api/agi", planRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  }, 60000);

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  it("emits ladder stages in live events for a repo definition prompt", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "How does the Helix Ask pipeline work in this system?",
        debug: true,
        sessionId: "test-session",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      debug?: {
        live_events?: Array<{ stage: string }>;
        synthesis_mode?: string;
        synthesis_reason?: string;
      };
    };
    const stages = new Set(
      (payload.debug?.live_events ?? []).map((entry) => entry.stage),
    );
    const requiredStages = [
      "Intent resolved",
      "Topic tags",
      "Topic profile",
      "Plan",
      "Evidence gate",
      "Arbiter",
      "Synthesis prompt ready",
      "Platonic gates",
      "Coverage gate",
      "Belief gate",
      "Rattling gate",
      "Citations",
    ];
    const stageGroups: Array<{ label: string; alternatives: string[] }> = [
      { label: "Context ready", alternatives: ["Context ready", "Graph pack", "Preflight retrieval"] },
      { label: "Allowlist tier", alternatives: ["Allowlist tier", "Retrieval scope", "Topic profile"] },
    ];
    const missing = requiredStages.filter((stage) => !stages.has(stage));
    const missingGroups = stageGroups
      .filter((group) => !group.alternatives.some((alt) => stages.has(alt)))
      .map((group) => group.label);
    const allMissing = [...missing, ...missingGroups];
    if (allMissing.length) {
      console.log("Missing stages:", allMissing.join(", "));
    }
    expect(allMissing).toEqual([]);
    expect(payload.debug?.synthesis_mode).toBeDefined();
    expect(payload.debug?.synthesis_reason).toMatch(/mode=/);
  }, 20000);

  it("answers ideology concept query with grounded narrative + technical notes", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "How does Feedback Loop Hygiene affect society?",
        debug: true,
        sessionId: "test-ideology-concept",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      text: string;
      debug?: {
        answer_path?: string[];
        answer_extension_appended?: boolean;
        tree_walk_mode?: string;
        graph_pack_skip_reason?: string;
        graph_framework?: { trees?: Array<{ tree: string; nodes: string[] }> };
      };
      answer_path?: string[];
      answer_extension_appended?: boolean;
    };
    const answerPath = payload.debug?.answer_path ?? payload.answer_path ?? [];
    const text = payload.text.trim();
    expect(text).toMatch(/close loops only with verified signals/i);
    expect(text).toContain("Sources:");
    expect(answerPath).not.toContain("forcedAnswer:ideology");
    expect(answerPath).not.toContain("answer:forced");
    expect(answerPath).toContain("answer:llm");
    expect(payload.debug?.answer_extension_appended ?? false).toBe(false);
    expect(text).toMatch(/^In plain language/i);
    expect(payload.debug?.tree_walk_mode).toBe("root_to_leaf");
    expect(payload.debug?.graph_pack_skip_reason).toBeUndefined();
    expect((payload.debug?.graph_framework?.trees?.length ?? 0)).toBeGreaterThan(0);
    expect(text).not.toMatch(/^Confirmed:/i);
    expect(text).not.toMatch(/Next evidence:/i);
    expect(text).not.toMatch(/^additional repo context:/i);
    expect(text).not.toMatch(/client\/src\/components\/MissionEthosSourcePanel\.tsx/i);
    expect(text).toMatch(/docs\/knowledge\/ethos\/feedback-loop-hygiene\.md/i);
    expect(answerPath.some((entry) => entry.startsWith("concept_fast_path"))).toBe(false);
  }, 45000);

  it("keeps narrative ideology queries in full-root-to-leaf mode", async () => {
    const response = await fetch(`${baseUrl}/api/agi/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "How does Feedback Loop Hygiene affect society and public trust?",
        debug: true,
        sessionId: "test-ideology-narrative",
        verbosity: "extended",
      }),
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      text: string;
      debug?: {
        answer_path?: string[];
        tree_walk_mode?: string;
        graph_pack_skip_reason?: string;
      };
    };
    const answerPath = payload.debug?.answer_path ?? [];
    expect(payload.text).toMatch(/close loops only with verified signals/i);
    expect(payload.text).toContain("In practice,");
    expect(payload.debug?.tree_walk_mode).toBe("root_to_leaf");
    expect(payload.debug?.graph_pack_skip_reason).toBeUndefined();
    expect(answerPath.some((entry) => entry.startsWith("concept_fast_path"))).toBe(false);
  }, 45000);
});
