import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { helixRelativisticMapRouter } from "../server/routes/helix/relativistic-map";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/helix/relativistic-map", helixRelativisticMapRouter);
  return app;
};

describe("relativistic map route", () => {
  it("returns an outer-reference accessibility projection for flat-SR requests", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "sun_centered_accessibility",
        sourceModel: "flat_sr_flip_burn_control",
        catalog: [{ id: "alpha-centauri", position_m: [4, 0, 0] }],
        control: {
          properAcceleration_m_s2: 9.80665,
        },
      })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.projection?.status).toBe("computed");
    expect(res.body.projection?.semantics).toBe("outer_reference_only");
    expect(res.body.projection?.observerFamily).toBe("grid_static");
    expect(res.body.projection?.claim_tier).toBe("diagnostic");
    expect(res.body.projection?.certifying).toBe(false);
  });

  it("fails closed for warp route-time requests instead of falling back to flat-SR", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "sun_centered_accessibility",
        sourceModel: "warp_worldline_route_time",
        catalog: [{ id: "tau-ceti", position_m: [12, 0, 0] }],
      })
      .expect(200);

    expect(res.body.ok).toBe(false);
    expect(res.body.projection?.status).toBe("unavailable");
    expect(res.body.projection?.fail_id).toBe("RELATIVISTIC_MAP_WARP_WORLDLINE_REQUIRED");
  });

  it("returns a 400 for flat-SR requests that omit the declared control law", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "instantaneous_ship_view",
        sourceModel: "flat_sr_flip_burn_control",
        catalog: [{ id: "demo", position_m: [1, 0, 0] }],
      })
      .expect(400);

    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("invalid-request");
  });
});
