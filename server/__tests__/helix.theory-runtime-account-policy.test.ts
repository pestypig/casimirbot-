import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { helixTheoryRuntimeRouter } from "../routes/helix/theory-runtime";
import { getPool } from "../db/client";
import {
  getAccountCapabilityPolicy,
  resetAccountSessionStore,
  signInLocalAccountSession,
} from "../services/helix-account/account-session-store";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/helix/theory/runtime-jobs", helixTheoryRuntimeRouter);
  return app;
};

describe("theory runtime HTTP account policy", () => {
  beforeEach(async () => {
    await resetAccountSessionStore();
  });

  it("allows no-session users through start policy admission", async () => {
    const response = await request(createApp())
      .post("/api/helix/theory/runtime-jobs")
      .send({ runtimeId: "unsupported.test.runtime", graphId: "graph", badgeIds: [] })
      .expect(400);

    expect(response.body).toMatchObject({
      error: "theory_runtime_start_rejected",
    });
  });

  it("allows no-session users through result-read policy admission", async () => {
    await request(createApp())
      .get("/api/helix/theory/runtime-jobs/request%3Aone/result")
      .expect(404, { error: "theory_runtime_job_not_found" });
  });

  it("does not let a persisted user-policy snapshot retain retired runtime locks", async () => {
    const receipt = await signInLocalAccountSession({
      profile_id: "runtime-policy-refresh-user",
      account_type: "user",
    });
    const sessionId = receipt.session?.session_id;
    expect(sessionId).toBeTruthy();

    const stalePolicy = buildHelixAccountCapabilityPolicy("user");
    stalePolicy.allowed_workstation_capabilities = stalePolicy.allowed_workstation_capabilities.filter(
      (capability) => !capability.includes("theory_runtime"),
    );
    await getPool().query(
      `UPDATE helix_account_sessions SET account_policy = $1 WHERE session_id = $2`,
      [JSON.stringify(stalePolicy), sessionId],
    );

    const currentPolicy = await getAccountCapabilityPolicy(sessionId);
    expect(currentPolicy.allowed_workstation_capabilities).toEqual(expect.arrayContaining([
      "scientific-calculator.run_theory_runtime",
      "scientific-calculator.read_theory_runtime_result",
      "scientific-calculator.read_visible_theory_run_result",
    ]));
  });
});
