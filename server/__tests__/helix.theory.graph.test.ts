import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { helixTheoryRouter } from "../routes/helix/theory";

describe("GET /api/helix/theory/graph", () => {
  it("returns a theory_badge_graph/v1 artifact", async () => {
    const app = express();
    app.use("/api/helix/theory", helixTheoryRouter);

    const response = await request(app).get("/api/helix/theory/graph").expect(200);

    expect(response.body.artifactId).toBe("theory_badge_graph");
    expect(response.body.schemaVersion).toBe("theory_badge_graph/v1");
    expect(response.body.badges).toEqual(expect.any(Array));
    expect(response.body.badges.length).toBeGreaterThan(0);
    expect(response.body.edges).toEqual(expect.any(Array));
    expect(response.body.edges.length).toBeGreaterThan(0);
    expect(response.body.summary.calculatorLoadableCount).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(response.body)).not.toMatch(
      /\b(validated propulsion|working warp drive|physical mechanism confirmed|QEI passed|proven warp)\b/i,
    );
  });
});
