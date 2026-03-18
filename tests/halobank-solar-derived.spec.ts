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

describe("halobank solar derived route", () => {
  it("runs mercury precession module and emits deterministic artifacts + tree_dag contract", async () => {
    const app = makeApp();
    const payload = {
      module: "mercury_precession",
      input: {
        start_iso: "2000-01-01T00:00:00.000Z",
        end_iso: "2030-01-01T00:00:00.000Z",
        step_days: 5,
      },
      evidence_refs: ["artifact:halobank.solar.test:fixture-1"],
    };
    const resA = await request(app).post("/api/halobank/derived").send(payload).expect(200);
    const resB = await request(app).post("/api/halobank/derived").send(payload).expect(200);

    expect(resA.body.module).toBe("mercury_precession");
    expect(resA.body.result?.measured_arcsec_per_century).toBeTypeOf("number");
    expect(resA.body.gate?.verdict).toBe("PASS");
    expect(resA.body.artifacts?.length).toBeGreaterThan(0);
    expect(resA.body.tree_dag?.claim_id).toBe("claim:halobank.solar:mercury_precession");
    expect(resA.body).toEqual(resB.body);
  });

  it("fails mercury module with deterministic firstFail when perihelion events are insufficient", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "mercury_precession",
        input: {
          start_iso: "2026-01-01T00:00:00.000Z",
          end_iso: "2026-02-01T00:00:00.000Z",
          step_days: 5,
        },
      })
      .expect(200);
    expect(res.body.gate?.verdict).toBe("FAIL");
    expect(res.body.gate?.firstFail).toBe("HALOBANK_SOLAR_MERCURY_INSUFFICIENT_EVENTS");
  });

  it("applies strict provenance fail for derived calls without evidence refs", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "resonance_libration",
        strict_provenance: true,
        input: {
          start_iso: "2020-01-01T00:00:00.000Z",
          end_iso: "2030-01-01T00:00:00.000Z",
          step_days: 20,
          primary_id: 599,
          secondary_id: 699,
          p: 5,
          q: 2,
        },
      })
      .expect(200);
    expect(res.body.gate?.verdict).toBe("FAIL");
    expect(res.body.gate?.firstFail).toBe("HALOBANK_SOLAR_STRICT_PROVENANCE_MISSING");
  });

  it("finds a candidate eclipse event window for August 2026 geocenter view", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "earth_moon_eclipse_timing",
        input: {
          start_iso: "2026-08-10T00:00:00.000Z",
          end_iso: "2026-08-14T00:00:00.000Z",
          step_minutes: 1,
          observer: { mode: "geocenter" },
        },
      })
      .expect(200);

    expect(res.body.gate?.verdict).toBe("PASS");
    expect(Array.isArray(res.body.result?.events)).toBe(true);
    expect(res.body.result?.events.length).toBeGreaterThan(0);
  });
});
