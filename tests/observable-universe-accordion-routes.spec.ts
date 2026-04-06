import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getGlobalPipelineState,
  initializePipelineState,
  setGlobalPipelineState,
} from "../server/energy-pipeline";
import { helixRelativisticMapRouter } from "../server/routes/helix/relativistic-map";
import {
  makeWarpCatalogEtaProjectionFixture,
  makeWarpMissionTimeComparisonFixture,
  makeWarpMissionTimeEstimatorFixture,
  makeWarpRouteTimeWorldlineFixture,
  makeWarpWorldlineFixture,
} from "./helpers/warp-worldline-fixture";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/helix/relativistic-map", helixRelativisticMapRouter);
  return app;
};

describe("observable universe accordion route", () => {
  const previousState = getGlobalPipelineState();

  beforeEach(() => {
    setGlobalPipelineState(initializePipelineState());
  });

  afterEach(() => {
    setGlobalPipelineState(previousState);
  });

  it("computes raw-distance accordion output through the shared route", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "observable_universe_accordion",
        accordionMode: "raw_distance",
        catalog: [{ id: "demo", position_m: [3, 4, 0] }],
      })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.projection?.status).toBe("computed");
    expect(res.body.projection?.accordionMode).toBe("raw_distance");
  });

  it("keeps nhm2 accordion mode deferred when only the route-time estimator chain is present", async () => {
    const app = makeApp();
    const nextState = initializePipelineState();
    nextState.warpWorldline = makeWarpWorldlineFixture();
    nextState.warpRouteTimeWorldline = makeWarpRouteTimeWorldlineFixture(
      nextState.warpWorldline,
    );
    nextState.warpMissionTimeEstimator = makeWarpMissionTimeEstimatorFixture({
      worldline: nextState.warpWorldline,
      routeTime: nextState.warpRouteTimeWorldline,
    });
    nextState.warpMissionTimeComparison = makeWarpMissionTimeComparisonFixture({
      missionTimeEstimator: nextState.warpMissionTimeEstimator,
    });
    setGlobalPipelineState(nextState);

    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "observable_universe_accordion",
        accordionMode: "nhm2_accessibility",
        catalog: [{ id: "demo", position_m: [3, 4, 0] }],
      })
      .expect(200);

    expect(res.body.ok).toBe(false);
    expect(res.body.projection?.status).toBe("unavailable");
    expect(res.body.projection?.fail_id).toBe("OBSERVABLE_UNIVERSE_ACCORDION_NHM2_DEFERRED");
  });

  it("accepts nhm2 accordion mode once the explicit catalog ETA contract is present", async () => {
    const app = makeApp();
    const nextState = initializePipelineState();
    const worldline = makeWarpWorldlineFixture();
    const routeTime = makeWarpRouteTimeWorldlineFixture(worldline);
    const missionTimeEstimator = makeWarpMissionTimeEstimatorFixture({ worldline, routeTime });
    nextState.warpCatalogEtaProjection = makeWarpCatalogEtaProjectionFixture({
      missionTimeEstimator,
    });
    setGlobalPipelineState(nextState);

    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "observable_universe_accordion",
        accordionMode: "nhm2_accessibility",
        catalog: [{ id: "demo", position_m: [3, 4, 0] }],
      })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.projection?.status).toBe("computed");
    expect(res.body.projection?.contract_badge).toBe("warp_catalog_eta_projection/v1");
  });
});
