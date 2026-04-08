import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { starSimRouter } from "../server/routes/star-sim";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/star-sim", starSimRouter);
  return app;
};

describe("star-sim v1 route", () => {
  it("wraps solar classification, reduced structure, solar diagnostics, and barycenter context into one contract", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/run")
      .send({
        target: {
          object_id: "sun",
          name: "Sun",
          epoch_iso: "2026-01-01T00:00:00.000Z",
        },
        spectroscopy: {
          teff_K: 5772,
          logg_cgs: 4.438,
          metallicity_feh: 0,
        },
        structure: {
          mass_Msun: 1,
          radius_Rsun: 1,
        },
        activity: {
          replay_series_id: "gong-silso-cycle23-radial-band",
          flare_replay_series_id: "flare-sunquake-timing-replay",
          sunquake_replay_series_id: "flare-sunquake-timing-replay",
        },
        orbital_context: {
          naif_body_id: 10,
        },
      })
      .expect(200);

    expect(res.body.schema_version).toBe("star-sim-v1");
    expect(res.body.target.object_id).toBe("sun");
    expect(res.body.taxonomy.obs_class).toBe("O5");
    expect(res.body.taxonomy.phys_class).toBe("P4");
    expect(res.body.solver_plan.executed_lanes).toEqual([
      "classification",
      "structure_1d",
      "activity_solar_observed",
      "barycenter_analytic",
    ]);

    const classification = res.body.lanes.find((lane: any) => lane.lane_id === "classification");
    const activity = res.body.lanes.find((lane: any) => lane.lane_id === "activity_solar_observed");
    const barycenter = res.body.lanes.find((lane: any) => lane.lane_id === "barycenter_analytic");

    expect(classification.result.spectral_type).toBe("G2V");
    expect(activity.availability).toBe("available");
    expect(activity.tree_dag.parent_claim_ids).toContain("claim:halobank.solar:stellar_observables_diagnostic");
    expect(activity.tree_dag.parent_claim_ids).toContain("claim:halobank.solar:stellar_flare_sunquake_diagnostic");
    expect(barycenter.result.state_source.source_model).toBe("astronomy-engine-barycentric/1");
    expect(res.body.congruence.overall_score).toBeGreaterThan(0);
  });

  it("marks unsupported requested lanes as unavailable and drops the harmonic congruence score to zero", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/run")
      .send({
        target: {
          object_id: "kepler-11",
          name: "Kepler-11",
          epoch_iso: "2026-01-01T00:00:00.000Z",
        },
        requested_lanes: ["activity", "barycenter"],
        strict_lanes: true,
      })
      .expect(200);

    expect(res.body.solver_plan.unavailable_requested_lanes).toEqual(["activity", "barycenter"]);
    expect(res.body.lanes.every((lane: any) => lane.availability === "unavailable")).toBe(true);
    expect(res.body.congruence.overall_score).toBe(0);
  });
});
