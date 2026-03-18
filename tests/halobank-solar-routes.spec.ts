import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { halobankSolarRouter } from "../server/routes/halobank-solar";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", halobankSolarRouter);
  return app;
}

describe("halobank solar vectors route", () => {
  it("serves deterministic vector payload with time scales and provenance", async () => {
    const app = makeApp();
    const path =
      "/api/horizons/vectors?ts=2026-02-17T12:00:00.000Z&targets=199,299,399,499,599,699,799,899&center=0&frame=BCRS&aberration=lt+s";
    const resA = await request(app).get(path).expect(200);
    const resB = await request(app).get(path).expect(200);

    expect(resA.body.time_scales?.utc).toBe("2026-02-17T12:00:00.000Z");
    expect(Array.isArray(resA.body.states)).toBe(true);
    expect(resA.body.states.length).toBe(8);
    expect(resA.body.provenance?.kernel_bundle_id).toBeDefined();
    expect(resA.body.gate?.deterministic).toBe(true);
    expect(resA.body).toEqual(resB.body);
  });

  it("fails strict provenance gate when no canonical evidence refs are supplied", async () => {
    const app = makeApp();
    const res = await request(app)
      .get("/api/horizons/vectors?ts=2026-02-17T12:00:00.000Z&strict_provenance=1")
      .expect(200);
    expect(res.body.gate?.verdict).toBe("FAIL");
    expect(res.body.gate?.firstFail).toBe("HALOBANK_SOLAR_STRICT_PROVENANCE_MISSING");
  });

  it("returns deterministic orientation fail id for unsupported body-fixed observer kernel", async () => {
    const app = makeApp();
    const observer = encodeURIComponent(
      JSON.stringify({
        mode: "body-fixed",
        body: 599,
        lon_deg: 0,
        lat_deg: 0,
        height_m: 0,
      }),
    );
    const res = await request(app)
      .get(`/api/horizons/vectors?ts=2026-02-17T12:00:00.000Z&observer=${observer}`)
      .expect(200);
    expect(res.body.gate?.verdict).toBe("FAIL");
    expect(res.body.gate?.firstFail).toBe("HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING");
  });
});

