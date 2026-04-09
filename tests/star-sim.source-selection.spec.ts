import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __buildFallbackSummaryForTest } from "../server/modules/starsim/sources/registry";

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
  artifactRoot = fs.mkdtempSync(path.join(os.tmpdir(), "starsim-selection-"));
  process.env.STAR_SIM_ARTIFACT_ROOT = artifactRoot;
  process.env.STAR_SIM_SOURCE_FETCH_MODE = "fixture";
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
  fs.rmSync(artifactRoot, { recursive: true, force: true });
  vi.resetModules();
});

describe("star-sim source selection policy", () => {
  it("lets user overrides win by default while preserving source-derived fallback fields", async () => {
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
        spectroscopy: {
          teff_K: 5900,
        },
      })
      .expect(200);

    expect(res.body.canonical_request_draft.spectroscopy.teff_K).toBe(5900);
    expect(res.body.canonical_request_draft.spectroscopy.logg_cgs).toBe(4.44);
    expect(res.body.source_resolution.selection_manifest.fields["spectroscopy.teff_K"].selected_from).toBe("user_override");
    expect(res.body.source_resolution.selection_manifest.fields["spectroscopy.logg_cgs"].selected_from).toBe("sdss_astra");
  });

  it("lets strict catalog resolution override user-supplied spectroscopy when requested", async () => {
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
        spectroscopy: {
          teff_K: 5900,
        },
        source_policy: {
          strict_catalog_resolution: true,
        },
      })
      .expect(200);

    expect(res.body.canonical_request_draft.spectroscopy.teff_K).toBe(5821);
    expect(res.body.source_resolution.selection_manifest.fields["spectroscopy.teff_K"].selected_from).toBe("sdss_astra");
    expect(res.body.source_resolution.selection_manifest.fields["spectroscopy.teff_K"].reason).toBe("strict_catalog_resolution");
  });

  it("selects Astra over LAMOST deterministically for conflicting spectroscopy by default preference", async () => {
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

    const selection = res.body.source_resolution.selection_manifest.fields["spectroscopy.teff_K"];
    expect(selection.selected_from).toBe("sdss_astra");
    expect(selection.candidates.map((candidate: any) => candidate.selected_from)).toEqual([
      "sdss_astra",
      "lamost_dr10",
    ]);
    expect(res.body.crossmatch_summary.fallback_used).toBe(false);
  });

  it("selects TASOC over TESS/MAST deterministically for seismic summaries by default preference", async () => {
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

    const selection = res.body.source_resolution.selection_manifest.fields["asteroseismology.numax_uHz"];
    expect(selection.selected_from).toBe("tasoc");
    expect(selection.candidates.map((candidate: any) => candidate.selected_from)).toEqual([
      "tasoc",
      "tess_mast",
    ]);
  });

  it("lets strict catalog resolution override manual seismic summaries when requested", async () => {
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
        asteroseismology: {
          numax_uHz: 3010,
        },
        source_policy: {
          strict_catalog_resolution: true,
        },
      })
      .expect(200);

    expect(res.body.canonical_request_draft.asteroseismology.numax_uHz).toBe(3085.2);
    expect(res.body.source_resolution.selection_manifest.fields["asteroseismology.numax_uHz"].selected_from).toBe("tasoc");
    expect(res.body.source_resolution.selection_manifest.fields["asteroseismology.numax_uHz"].reason).toBe("strict_catalog_resolution");
  });

  it("reports fallback_used only when fallback fields are actually selected", async () => {
    const app = await buildApp();
    const preferredWins = await request(app)
      .post("/api/star-sim/v1/resolve")
      .send({
        target: { name: "Demo Solar A" },
        identifiers: { gaia_dr3_source_id: "123456789012345678" },
      })
      .expect(200);
    expect(preferredWins.body.crossmatch_summary.fallback_used).toBe(false);

    const fallbackSummary = __buildFallbackSummaryForTest({
      selectionManifest: {
        schema_version: "star-sim-source-selection/2",
        target_query: { object_id: null, name: null, identifiers: {} },
        fields: {
          "spectroscopy.teff_K": {
            field_path: "spectroscopy.teff_K",
            selected_from: "lamost_dr10",
            reason: "fallback_catalog",
            chosen: {
              field_path: "spectroscopy.teff_K",
              selected_from: "lamost_dr10",
              value: 5790,
              unit: "K",
              uncertainty: null,
              status: "observed",
              source_record_id: "lamost_dr10:mock",
              identifiers: {},
              quality_flags: [],
              provenance_ref: "mock",
              raw_payload_ref: "mock",
            },
            candidates: [
              {
                field_path: "spectroscopy.teff_K",
                selected_from: "sdss_astra",
                value: 5821,
                unit: "K",
                uncertainty: null,
                status: "observed",
                source_record_id: "sdss_astra:mock",
                identifiers: {},
                quality_flags: [],
                provenance_ref: "mock",
                raw_payload_ref: "mock",
              },
              {
                field_path: "spectroscopy.teff_K",
                selected_from: "lamost_dr10",
                value: 5790,
                unit: "K",
                uncertainty: null,
                status: "observed",
                source_record_id: "lamost_dr10:mock",
                identifiers: {},
                quality_flags: [],
                provenance_ref: "mock",
                raw_payload_ref: "mock",
              },
            ],
          },
        },
      } as any,
      preferredCatalogs: ["gaia_dr3", "sdss_astra", "lamost_dr10", "tasoc", "tess_mast"],
      qualityRejections: [
        {
          catalog: "sdss_astra",
          reason: "rejected_identifier_conflict",
          field_path: "spectroscopy",
        },
      ],
    });
    expect(fallbackSummary.fallback_used).toBe(true);
    expect(fallbackSummary.fallback_fields.length).toBeGreaterThan(0);
  });
});
