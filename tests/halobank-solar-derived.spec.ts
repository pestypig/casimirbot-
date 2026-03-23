import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { getBaryState } from "../server/modules/halobank-solar/ephemeris-core";
import { halobankSolarRouter } from "../server/routes/halobank-solar";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", halobankSolarRouter);
  return app;
}

function normalize(values: number[]): [number, number, number] {
  const norm = Math.hypot(...values);
  return [values[0] / norm, values[1] / norm, values[2] / norm];
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
    expect(resA.body.metric_context?.pn_gr_model_id).toBe("halobank.solar.iau2000b1.3-weak-field-ppn-gr/1");
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

  it("supports Earth body-fixed observers for earth-moon eclipse timing geometry", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "earth_moon_eclipse_timing",
        input: {
          start_iso: "2026-08-10T00:00:00.000Z",
          end_iso: "2026-08-14T00:00:00.000Z",
          step_minutes: 1,
          observer: {
            mode: "body-fixed",
            body: 399,
            lon_deg: -20,
            lat_deg: 65,
            height_m: 100,
          },
        },
      })
      .expect(200);

    expect(res.body.gate?.verdict).toBe("PASS");
    expect(res.body.result?.observer_context?.mode).toBe("body-fixed");
    expect(res.body.result?.observer_context?.resolved_body_id).toBe(399);
    expect(res.body.result?.observer_context?.warning).toBeNull();
    expect(Array.isArray(res.body.result?.events)).toBe(true);
    expect(res.body.result?.events.length).toBeGreaterThan(0);
  });

  it("fails body-fixed earth-moon eclipse timing requests for unsupported observer bodies with the route-matched fail id", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "earth_moon_eclipse_timing",
        input: {
          start_iso: "2026-08-10T00:00:00.000Z",
          end_iso: "2026-08-14T00:00:00.000Z",
          step_minutes: 1,
          observer: {
            mode: "body-fixed",
            body: 599,
            lon_deg: 0,
            lat_deg: 0,
            height_m: 0,
          },
        },
      })
      .expect(200);

    expect(res.body.gate?.verdict).toBe("FAIL");
    expect(res.body.gate?.firstFail).toBe("HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING");
    expect(res.body.result?.observer_context?.mode).toBe("body-fixed");
    expect(res.body.result?.observer_context?.requested_body_id).toBe(599);
    expect(res.body.result?.observer_context?.resolved_body_id).toBe(399);
    expect(res.body.result?.observer_context?.warning).toBe("HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING");
  });

  it("detects Saros recurrence pairs in a long global eclipse window", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "saros_cycle",
        input: {
          start_iso: "2000-01-01T00:00:00.000Z",
          end_iso: "2100-01-01T00:00:00.000Z",
          max_events: 512,
        },
      })
      .expect(200);

    expect(res.body.module).toBe("saros_cycle");
    expect(res.body.gate?.verdict).toBe("PASS");
    expect(res.body.result?.pair_count).toBeGreaterThan(0);
    expect(Array.isArray(res.body.result?.pairs)).toBe(true);
  });

  it("detects jovian moon transit/occultation timing candidates from Earth", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "jovian_moon_event_timing",
        input: {
          start_iso: "2026-01-01T00:00:00.000Z",
          end_iso: "2026-01-05T00:00:00.000Z",
          step_minutes: 5,
          moon: "io",
          event: "any",
        },
      })
      .expect(200);

    expect(res.body.module).toBe("jovian_moon_event_timing");
    expect(res.body.gate?.verdict).toBe("PASS");
    expect(Array.isArray(res.body.result?.events)).toBe(true);
    expect(res.body.result?.events.length).toBeGreaterThan(0);
  });

  it("supports Earth body-fixed observers for jovian moon timing geometry", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "jovian_moon_event_timing",
        input: {
          start_iso: "2026-01-01T00:00:00.000Z",
          end_iso: "2026-01-05T00:00:00.000Z",
          step_minutes: 5,
          moon: "io",
          event: "any",
          observer: {
            mode: "body-fixed",
            body: 399,
            lon_deg: -70,
            lat_deg: -30,
            height_m: 100,
          },
        },
      })
      .expect(200);

    expect(res.body.gate?.verdict).toBe("PASS");
    expect(res.body.result?.observer_context?.mode).toBe("body-fixed");
    expect(res.body.result?.observer_context?.resolved_body_id).toBe(399);
    expect(res.body.result?.observer_context?.warning).toBeNull();
    expect(Array.isArray(res.body.result?.events)).toBe(true);
    expect(res.body.result?.events.length).toBeGreaterThan(0);
  });

  it("fails body-fixed jovian moon timing requests for unsupported observer bodies with the route-matched fail id", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "jovian_moon_event_timing",
        input: {
          start_iso: "2026-01-01T00:00:00.000Z",
          end_iso: "2026-01-05T00:00:00.000Z",
          step_minutes: 5,
          moon: "io",
          event: "any",
          observer: {
            mode: "body-fixed",
            body: 599,
            lon_deg: 0,
            lat_deg: 0,
            height_m: 0,
          },
        },
      })
      .expect(200);

    expect(res.body.gate?.verdict).toBe("FAIL");
    expect(res.body.gate?.firstFail).toBe("HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING");
    expect(res.body.result?.observer_context?.mode).toBe("body-fixed");
    expect(res.body.result?.observer_context?.requested_body_id).toBe(599);
    expect(res.body.result?.observer_context?.resolved_body_id).toBe(399);
    expect(res.body.result?.observer_context?.warning).toBe("HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING");
  });

  it("runs the solar light-deflection module against pinned weak-field benchmarks", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "solar_light_deflection",
        input: {
          ts_iso: "2003-09-10T00:00:00.000Z",
          observer_body_id: 399,
          receiver_body_id: 699,
          source_ra_deg: 0,
          source_dec_deg: 60,
        },
        evidence_refs: ["artifact:halobank.solar.test:null-geodesic-fixture"],
      })
      .expect(200);

    expect(res.body.module).toBe("solar_light_deflection");
    expect(res.body.metric_context?.pn_gr_model_id).toBe("halobank.solar.iau2000b1.3-weak-field-ppn-gr/1");
    expect(res.body.gate?.verdict).toBe("PASS");
    expect(res.body.result?.signal_path?.geometry_mode).toBe("explicit_icrs_source");
    expect(res.body.result?.signal_path?.source_occulted).toBe(false);
    expect(res.body.result?.signal_path?.solar_elongation_deg).toBeGreaterThan(
      res.body.result?.signal_path?.solar_angular_radius_deg,
    );
    expect(res.body.result?.predicted_limb_arcsec).toBeGreaterThan(1.7);
    expect(res.body.result?.predicted_limb_arcsec).toBeLessThan(1.8);
    expect(res.body.result?.predicted_source_deflection_arcsec).toBeGreaterThan(0);
    expect(res.body.result?.shapiro_delay_us).toBeGreaterThan(0);
    expect(res.body.tree_dag?.claim_id).toBe("claim:halobank.solar:solar_light_deflection");
  });

  it("fails solar light-deflection deterministically when the explicit source is inside the solar disk", async () => {
    const app = makeApp();
    const tsIso = "2003-09-10T00:00:00.000Z";
    const date = new Date(tsIso);
    const earth = getBaryState(399, date);
    const sun = getBaryState(10, date);
    const sourceUnit = normalize([
      sun.pos[0] - earth.pos[0],
      sun.pos[1] - earth.pos[1],
      sun.pos[2] - earth.pos[2],
    ]);

    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "solar_light_deflection",
        input: {
          ts_iso: tsIso,
          observer_body_id: 399,
          receiver_body_id: 699,
          source_unit_icrs: sourceUnit,
        },
      })
      .expect(200);

    expect(res.body.gate?.verdict).toBe("FAIL");
    expect(res.body.gate?.firstFail).toBe("HALOBANK_SOLAR_LIGHT_DEFLECTION_SOURCE_OCCULTED");
    expect(res.body.result?.signal_path?.source_occulted).toBe(true);
    expect(res.body.result?.signal_path?.geometry_mode).toBe("explicit_icrs_source");
  });

  it("supports Earth body-fixed observers for solar light-deflection geometry", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "solar_light_deflection",
        input: {
          ts_iso: "2003-09-10T00:00:00.000Z",
          observer: {
            mode: "body-fixed",
            body: 399,
            lon_deg: -70,
            lat_deg: -30,
            height_m: 100,
          },
          receiver_body_id: 699,
          source_ra_deg: 0,
          source_dec_deg: 60,
        },
      })
      .expect(200);

    expect(res.body.gate?.verdict).toBe("PASS");
    expect(res.body.result?.observer_context?.mode).toBe("body-fixed");
    expect(res.body.result?.observer_context?.resolved_body_id).toBe(399);
    expect(res.body.result?.observer_context?.warning).toBeNull();
    expect(res.body.result?.signal_path?.source_occulted).toBe(false);
  });

  it("fails body-fixed solar light-deflection requests for unsupported observer bodies with the route-matched fail id", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "solar_light_deflection",
        input: {
          ts_iso: "2003-09-10T00:00:00.000Z",
          observer: {
            mode: "body-fixed",
            body: 599,
            lon_deg: 0,
            lat_deg: 0,
            height_m: 0,
          },
          receiver_body_id: 699,
          source_ra_deg: 0,
          source_dec_deg: 60,
        },
      })
      .expect(200);

    expect(res.body.gate?.verdict).toBe("FAIL");
    expect(res.body.gate?.firstFail).toBe("HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING");
    expect(res.body.result?.observer_context?.mode).toBe("body-fixed");
    expect(res.body.result?.observer_context?.requested_body_id).toBe(599);
    expect(res.body.result?.observer_context?.resolved_body_id).toBe(399);
    expect(res.body.result?.observer_context?.warning).toBe("HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING");
  });

  it("proves inner-solar parity across Mercury and null-geodesic benchmarks", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/halobank/derived")
      .send({
        module: "inner_solar_metric_parity",
        input: {
          mercury_start_iso: "2000-01-01T00:00:00.000Z",
          mercury_end_iso: "2030-01-01T00:00:00.000Z",
          mercury_step_days: 5,
          ts_iso: "2003-09-10T00:00:00.000Z",
          observer_body_id: 399,
          receiver_body_id: 699,
          source_ra_deg: 0,
          source_dec_deg: 60,
        },
        evidence_refs: ["artifact:halobank.solar.test:metric-parity-fixture"],
      })
      .expect(200);

    expect(res.body.module).toBe("inner_solar_metric_parity");
    expect(res.body.gate?.verdict).toBe("PASS");
    expect(res.body.result?.shared_metric_model_id).toBe("halobank.solar.iau2000b1.3-weak-field-ppn-gr/1");
    expect(res.body.result?.mercury_probe?.gate_verdict).toBe("PASS");
    expect(res.body.result?.null_probe?.gate_verdict).toBe("PASS");
    expect(res.body.result?.null_probe?.geometry_mode).toBe("explicit_icrs_source");
    expect(res.body.tree_dag?.claim_id).toBe("claim:halobank.solar:inner_solar_metric_parity");
  });

  it("calibrates the active local-rest solar-motion anchor against a pinned published reference", async () => {
    const previous = process.env.LSR_SOLAR_PECULIAR;
    try {
      process.env.LSR_SOLAR_PECULIAR = "huang2015";
      const app = makeApp();
      const res = await request(app)
        .post("/api/halobank/derived")
        .send({
          module: "local_rest_anchor_calibration",
          evidence_refs: ["artifact:halobank.solar.test:local-rest-anchor-fixture"],
        })
        .expect(200);

      expect(res.body.module).toBe("local_rest_anchor_calibration");
      expect(res.body.gate?.verdict).toBe("PASS");
      expect(res.body.result?.reference_id).toBe("huang2015");
      expect(res.body.result?.max_component_abs_delta_km_s).toBe(0);
      expect(res.body.tree_dag?.claim_id).toBe("claim:halobank.solar:local_rest_anchor_calibration");
    } finally {
      if (previous === undefined) {
        delete process.env.LSR_SOLAR_PECULIAR;
      } else {
        process.env.LSR_SOLAR_PECULIAR = previous;
      }
    }
  });
});
