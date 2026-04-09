import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION } from "../server/modules/starsim/contract";

type StarSimRouteModule = typeof import("../server/routes/star-sim");

let artifactRoot = "";

const buildApp = async () => {
  vi.resetModules();
  const routeModule: StarSimRouteModule = await import("../server/routes/star-sim");
  const app = express();
  app.use(express.json());
  app.use("/api/star-sim", routeModule.starSimRouter);
  return app;
};

beforeEach(() => {
  artifactRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starsim-resolve-"));
  process.env.STAR_SIM_ARTIFACT_ROOT = artifactRoot;
  process.env.STAR_SIM_SOURCE_FETCH_MODE = "fixture";
  process.env.STAR_SIM_MESA_RUNTIME = "mock";
});

afterEach(() => {
  delete process.env.STAR_SIM_ARTIFACT_ROOT;
  delete process.env.STAR_SIM_SOURCE_FETCH_MODE;
  delete process.env.STAR_SIM_GAIA_DR3_MODE;
  delete process.env.STAR_SIM_SDSS_ASTRA_MODE;
  delete process.env.STAR_SIM_LAMOST_DR10_MODE;
  delete process.env.STAR_SIM_GAIA_DR3_ENDPOINT;
  delete process.env.STAR_SIM_SDSS_ASTRA_ENDPOINT;
  delete process.env.STAR_SIM_LAMOST_DR10_ENDPOINT;
  delete process.env.STAR_SIM_TESS_MAST_MODE;
  delete process.env.STAR_SIM_TASOC_MODE;
  delete process.env.STAR_SIM_TESS_MAST_ENDPOINT;
  delete process.env.STAR_SIM_TASOC_ENDPOINT;
  delete process.env.STAR_SIM_SOURCE_TIMEOUT_MS;
  delete process.env.STAR_SIM_SOURCE_USER_AGENT;
  delete process.env.STAR_SIM_MESA_RUNTIME;
  fs.rmSync(artifactRoot, { recursive: true, force: true });
  vi.resetModules();
});

describe("star-sim source resolution route", () => {
  it("merges Gaia DR3 identity/astrometry with SDSS Astra spectroscopy into a structure-ready draft", async () => {
    const app = await buildApp();
    const resolveResponse = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        requested_lanes: ["structure_mesa"],
      })
      .expect(200);

    expect(resolveResponse.body.schema_version).toBe("star-sim-source-resolve-v1");
    expect(resolveResponse.body.source_resolution.status).toBe("resolved");
    expect(resolveResponse.body.source_resolution.fetch_mode).toBe("fixture");
    expect(resolveResponse.body.source_resolution.selection_manifest.schema_version).toBe(STAR_SIM_SOURCE_SELECTION_SCHEMA_VERSION);
    expect(resolveResponse.body.structure_mesa_ready).toBe(true);
    expect(resolveResponse.body.supported_domain_preview?.passed).toBe(true);
    expect(resolveResponse.body.identifiers_resolved.gaia_dr3_source_id).toBe("123456789012345678");
    expect(resolveResponse.body.identifiers_resolved.sdss_apogee_id).toBe("2M00000000+0000000");
    expect(resolveResponse.body.benchmark_target_id).toBe("demo_solar_a");
    expect(resolveResponse.body.benchmark_target_match_mode).toBe("matched_by_identifier");
    expect(resolveResponse.body.crossmatch_summary.accepted).toBeGreaterThan(0);
    expect(resolveResponse.body.crossmatch_summary.rejected).toBe(0);
    expect(
      (resolveResponse.body.crossmatch_summary.fallback_fields as Array<{ field_path: string }>).some(
        (entry) => entry.field_path === "spectroscopy.teff_K",
      ),
    ).toBe(false);
    expect(resolveResponse.body.canonical_request_draft.astrometry.parallax_mas).toBe(59.2);
    expect(resolveResponse.body.canonical_request_draft.spectroscopy.teff_K).toBe(5821);
    expect(resolveResponse.body.canonical_request_draft.spectroscopy.field_sources.teff_K).toBe("sdss_astra");

    const runResponse = await request(app)
      .post("/api/star-sim/v1/run")
      .send({
        ...resolveResponse.body.canonical_request_draft,
        requested_lanes: ["structure_mesa"],
      })
      .expect(200);

    expect(runResponse.body.lanes[0].status).toBe("unavailable");
    expect(runResponse.body.lanes[0].status_reason).toBe("async_job_required");
  });

  it("returns a partial Gaia-only resolution when fallback spectroscopy is disabled", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        source_hints: {
          preferred_catalogs: ["gaia_dr3"],
          allow_fallbacks: false,
        },
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("partial");
    expect(res.body.structure_mesa_ready).toBe(false);
    expect(res.body.source_resolution.reasons).toContain("spectroscopy_unresolved");
    expect(res.body.canonical_request_draft.astrometry.parallax_mas).toBe(59.2);
    expect(res.body.canonical_request_draft.spectroscopy).toBeUndefined();
  });

  it("adds TASOC seismic summaries and marks oscillation readiness when requested", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        requested_lanes: ["structure_mesa", "oscillation_gyre"],
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("resolved");
    expect(res.body.structure_mesa_ready).toBe(true);
    expect(res.body.oscillation_gyre_ready).toBe(true);
    expect(res.body.canonical_request_draft.asteroseismology.numax_uHz).toBe(3085.2);
    expect(res.body.canonical_request_draft.asteroseismology.deltanu_uHz).toBe(134.7);
    expect(res.body.canonical_request_draft.asteroseismology.field_sources.numax_uHz).toBe("tasoc");
    expect(res.body.source_resolution.selection_manifest.fields["asteroseismology.numax_uHz"].selected_from).toBe("tasoc");
  });

  it("returns a partial oscillation preview when seismic summaries are unavailable", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar B",
        },
        identifiers: {
          gaia_dr3_source_id: "987654321098765432",
        },
        requested_lanes: ["structure_mesa", "oscillation_gyre"],
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("partial");
    expect(res.body.structure_mesa_ready).toBe(true);
    expect(res.body.oscillation_gyre_ready).toBe(false);
    expect(res.body.source_resolution.reasons).toContain("seismology_unresolved");
  });


  it("records explicit crossmatch rejection reasons on identifier conflict", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
          sdss_apogee_id: "BAD-ID",
        },
      })
      .expect(200);

    expect(res.body.quality_rejections.length).toBeGreaterThan(0);
    expect(res.body.quality_rejections.some((entry: any) => entry.reason === "rejected_identifier_conflict")).toBe(true);
  });

  it("marks fallback as used when Astra is absent and LAMOST provides selected spectroscopy", async () => {
    process.env.STAR_SIM_SDSS_ASTRA_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
      })
      .expect(200);

    expect(res.body.source_resolution.selection_manifest.fields["spectroscopy.teff_K"].selected_from).toBe("lamost_dr10");
    expect(res.body.crossmatch_summary.fallback_used).toBe(true);
    expect(res.body.crossmatch_summary.fallback_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_path: "spectroscopy.teff_K",
          selected_from: "lamost_dr10",
          preferred_catalog: "sdss_astra",
          preferred_status: "absent",
        }),
      ]),
    );
  });

  it("marks fallback as used when TASOC is absent and TESS provides selected seismic summaries", async () => {
    process.env.STAR_SIM_TASOC_MODE = "disabled";
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Demo Solar A",
        },
        identifiers: {
          gaia_dr3_source_id: "123456789012345678",
        },
        requested_lanes: ["oscillation_gyre"],
      })
      .expect(200);

    expect(res.body.source_resolution.selection_manifest.fields["asteroseismology.numax_uHz"].selected_from).toBe("tess_mast");
    expect(res.body.crossmatch_summary.fallback_used).toBe(true);
    expect(res.body.crossmatch_summary.fallback_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_path: "asteroseismology.numax_uHz",
          selected_from: "tess_mast",
          preferred_catalog: "tasoc",
          preferred_status: "absent",
        }),
      ]),
    );
  });

  it("fails unresolved targets honestly with explicit reasons", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: {
          name: "Unknown Demo Star",
        },
        identifiers: {
          gaia_dr3_source_id: "000000000000000000",
        },
      })
      .expect(200);

    expect(res.body.source_resolution.status).toBe("unresolved");
    expect(res.body.canonical_request_draft).toBeNull();
    expect(res.body.source_resolution.reasons).toContain("gaia_target_not_found");
  });
});
