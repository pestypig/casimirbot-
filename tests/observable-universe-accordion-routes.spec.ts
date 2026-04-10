import fs from "node:fs";
import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { helixRelativisticMapRouter } from "../server/routes/helix/relativistic-map";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/helix/relativistic-map", helixRelativisticMapRouter);
  return app;
};

describe("observable universe accordion ETA route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the explicit NHM2 contract-backed trip-estimate surface for the supported target", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "sun_centered_accessibility",
        sourceModel: "warp_worldline_route_time",
        etaMode: "proper_time",
        catalog: [{ id: "alpha-cen-a", position_m: [4, 0, 0] }],
      })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.projection?.kind).toBe("observable_universe_accordion_eta_surface");
    expect(res.body.projection?.status).toBe("computed");
    expect(res.body.projection?.defaultOperatingProfileId).toBe(
      "stage1_centerline_alpha_0p8200_v1",
    );
    expect(res.body.projection?.supportedBandFloorProfileId).toBe(
      "stage1_centerline_alpha_0p8000_v1",
    );
    expect(res.body.projection?.evidenceFloorProfileId).toBe(
      "stage1_centerline_alpha_0p7700_v1",
    );
    expect(res.body.projection?.entries?.[0]?.estimateKind).toBe("proper_time");
    expect(res.body.projection?.entries?.[0]?.drivingProfileId).toBe(
      "stage1_centerline_alpha_0p8200_v1",
    );
  });

  it("keeps unsupported nearby entries visible as render-only when a supported target is present", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "sun_centered_accessibility",
        sourceModel: "warp_worldline_route_time",
        etaMode: "proper_time",
        catalog: [
          { id: "alpha-cen-a", label: "Alpha Centauri A", position_m: [4, 0, 0] },
          { id: "tau-ceti", label: "Tau Ceti", position_m: [0, 4, 0] },
        ],
      })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.projection?.status).toBe("computed");
    expect(
      res.body.projection?.entries?.find((entry: any) => entry.id === "alpha-cen-a")?.etaSupport,
    ).toBe("contract_backed");
    const tau = res.body.projection?.entries?.find((entry: any) => entry.id === "tau-ceti");
    expect(tau?.etaSupport).toBe("render_only");
    expect(tau?.mappedRadius_m).toBeNull();
    expect(tau?.renderOnlyReason).toMatch(/render-only/i);
  });

  it("can resolve the nearby local-rest preset into a mixed accordion catalog", async () => {
    const app = makeApp();
    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "sun_centered_accessibility",
        sourceModel: "warp_worldline_route_time",
        catalogPreset: "nearby_local_rest_small",
      })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.projection?.status).toBe("computed");
    expect(
      res.body.projection?.entries?.some((entry: any) => entry.id === "alpha-cen-a"),
    ).toBe(true);
    expect(
      res.body.projection?.entries?.some((entry: any) => entry.id === "proxima"),
    ).toBe(true);
    expect(
      res.body.projection?.entries?.some((entry: any) => entry.id === "barnard"),
    ).toBe(true);
    expect(
      res.body.projection?.entries?.filter((entry: any) => entry.etaSupport === "render_only")
        ?.length,
    ).toBeGreaterThan(0);
  });

  it("remains fail-closed when the explicit contract source is missing", async () => {
    const originalReadFileSync = fs.readFileSync.bind(fs);
    vi.spyOn(fs, "readFileSync").mockImplementation(
      ((filePath: Parameters<typeof fs.readFileSync>[0], options?: any) => {
        if (
          String(filePath).includes(
            "stage1_centerline_alpha_0p8200_v1\\nhm2-mission-time-comparison-latest.json",
          )
        ) {
          throw new Error("ENOENT");
        }
        return originalReadFileSync(filePath, options);
      }) as typeof fs.readFileSync,
    );

    const app = makeApp();
    const res = await request(app)
      .post("/api/helix/relativistic-map/project")
      .send({
        projectionKind: "sun_centered_accessibility",
        sourceModel: "warp_worldline_route_time",
        catalog: [{ id: "alpha-cen-a", position_m: [4, 0, 0] }],
      })
      .expect(200);

    expect(res.body.ok).toBe(false);
    expect(res.body.projection?.status).toBe("unavailable");
    expect(res.body.projection?.fail_id).toBe("NHM2_EXPLICIT_CONTRACT_MISSING");
  });

  it("does not silently fall back to flat-SR for targets outside the explicit contract", async () => {
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
    expect(res.body.projection?.fail_id).toBe("NHM2_TARGET_NOT_IN_EXPLICIT_CONTRACT");
    expect(
      res.body.projection?.nonClaims?.some((entry: string) =>
        entry.includes("route_map_eta_surface"),
      ),
    ).toBe(true);
  });
});
