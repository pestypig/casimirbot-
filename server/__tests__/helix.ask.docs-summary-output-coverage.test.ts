import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const docPath = "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md";

const workspaceSnapshot = (sessionId: string) => ({
  sessionId,
  activePanel: "docs-viewer",
  activeDocPath: docPath,
  hasDocContext: true,
  hasNoteContext: false,
});

const visibleBulletCount = (text: string): number =>
  text.split(/\r?\n/).filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+\S/.test(line)).length;

describe("Helix Ask docs summary output coverage", () => {
  it("covers requested summary bullet count and path before allowing terminal success", async () => {
    const app = createApp();
    const sessionId = `docs-summary-covered-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: `Summarize ${docPath} from docs in 5 bullets. Include the path.`,
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: workspaceSnapshot(sessionId),
      })
      .expect(200);

    const answerText = String(response.body?.selected_final_answer ?? response.body?.answer ?? response.body?.text ?? "");
    const coverage = response.body?.prompt_requirement_coverage;
    expect(response.body?.terminal_artifact_kind).not.toBe("typed_failure");
    expect(answerText).toContain(docPath);
    expect(visibleBulletCount(answerText)).toBeGreaterThanOrEqual(5);
    expect(
      response.body?.agent_runtime_loop?.iterations?.some(
        (iteration: any) =>
          iteration?.chosen_capability === "docs-viewer.summarize_doc" &&
          ["executed_tool_result", "preobserved_tool_result"].includes(iteration?.observation_role) &&
          Array.isArray(iteration?.observed_artifact_refs) &&
          iteration.observed_artifact_refs.some((ref: unknown) => String(ref).includes(":doc_summary:")),
      ),
    ).toBe(true);
    expect(coverage?.coverage).toBe("complete");
    expect(coverage?.requirements?.some((entry: any) => entry?.id === "doc_summary_min_5_bullets" && entry?.satisfied === true)).toBe(true);
    expect(coverage?.requirements?.some((entry: any) => entry?.id === "doc_summary_path_included" && entry?.satisfied === true)).toBe(true);
  }, 60000);
});
