import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  writeCurvatureLeverageBenchmarkLadder,
  type CurvatureLeverageBenchmarkLadderReport,
} from "../scripts/curvature-leverage-benchmark-ladder";
import { kappa_body } from "../shared/curvature-proxy";
import { C, G } from "../shared/physics-const";

const constantsPath = "configs/constants/codata-2022.v1.json";
const benchmarksPath = "configs/curvature-leverage-benchmarks.v1.json";
const tempRoots: string[] = [];

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function makeNhm2Fixture(): { root: string; nhm2Path: string; outPath: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "curvature-benchmark-ladder-"));
  tempRoots.push(root);
  const nhm2Path = path.join(root, "nhm2-curvature-leverage.json");
  const outPath = path.join(root, "ladder.json");

  writeJson(nhm2Path, {
    artifactId: "nhm2_curvature_leverage_report",
    schemaVersion: "v1",
    promotionAllowed: false,
    regions: [
      {
        lane: "nhm2_full_solve",
        region: "wall",
        leverage: 1e-28,
        sourceRegionStatus: "review",
        observerClosureStatus: "review",
        qeiStatus: "missing",
        conservationStatus: "present",
        promotionAllowed: false,
      },
      {
        lane: "nhm2_full_solve",
        region: "hull",
        leverage: 1e-9,
        sourceRegionStatus: "fail",
        observerClosureStatus: "review",
        qeiStatus: "missing",
        conservationStatus: "missing",
        promotionAllowed: false,
      },
    ],
  });

  return { root, nhm2Path, outPath };
}

function readConstants(): Record<string, { value: number }> {
  return JSON.parse(fs.readFileSync(constantsPath, "utf8")).constants;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("curvature leverage benchmark ladder", () => {
  it("proves the body-density leverage identity against compactness fixtures", () => {
    const { outPath } = makeNhm2Fixture();
    const report = writeCurvatureLeverageBenchmarkLadder({
      constantsPath,
      benchmarksPath,
      nhm2ReportPath: "missing-nhm2-report.json",
      outPath,
      generatedAt: "2026-05-19T00:00:00.000Z",
    });

    for (const id of [
      "earth_nominal_iau_b3",
      "sun_nominal_iau_b3",
      "jupiter_nominal_iau_b3",
    ]) {
      const record = report.benchmarks.find((entry) => entry.id === id);
      expect(record).toBeTruthy();
      expect(record?.lane).toBe("compactness_identity");
      expect(record?.relativeError).toBeLessThan(1e-14);
      expect(record?.promotionAllowed).toBe(false);
    }

    const constants = readConstants();
    const mu = constants.nominal_terrestrial_GM_m3_s2.value;
    const radius = constants.nominal_terrestrial_equatorial_radius_m.value;
    const mass = mu / G;
    const density = (3 * mass) / (4 * Math.PI * radius ** 3);
    expect(kappa_body(density) * radius * radius).toBeCloseTo(
      (2 * mu) / (radius * C * C),
      14,
    );
  });

  it("places quantum, Casimir, planetary, stellar, and horizon references on one scale", () => {
    const { outPath } = makeNhm2Fixture();
    const report = writeCurvatureLeverageBenchmarkLadder({
      constantsPath,
      benchmarksPath,
      nhm2ReportPath: "missing-nhm2-report.json",
      outPath,
    });

    const byId = new Map(report.benchmarks.map((entry) => [entry.id, entry]));
    expect(byId.get("planck_mass_planck_length")?.leverage).toBeCloseTo(2, 14);
    expect(byId.get("schwarzschild_horizon")?.leverage).toBe(1);

    const hydrogen = byId.get("hydrogen_bohr_radius");
    expect(hydrogen?.leverage).toBeGreaterThan(1e-45);
    expect(hydrogen?.leverage).toBeLessThan(1e-42);

    const proton = byId.get("proton_charge_radius");
    expect(proton?.leverage).toBeGreaterThan(1e-40);
    expect(proton?.leverage).toBeLessThan(1e-37);

    const casimirGap = byId.get("casimir_1nm_gap_scale");
    expect(casimirGap?.leverage).toBeGreaterThan(1e-54);
    expect(casimirGap?.leverage).toBeLessThan(1e-51);

    const casimirKm = byId.get("casimir_1nm_1km_scale");
    expect(casimirKm?.leverage).toBeGreaterThan(1e-30);
    expect(casimirKm?.leverage).toBeLessThan(1e-27);

    expect(byId.get("earth_nominal_iau_b3")?.leverage).toBeGreaterThan(1e-10);
    expect(byId.get("earth_nominal_iau_b3")?.leverage).toBeLessThan(1e-8);
    expect(byId.get("sun_nominal_iau_b3")?.leverage).toBeGreaterThan(1e-6);
    expect(byId.get("sun_nominal_iau_b3")?.leverage).toBeLessThan(1e-5);
  });

  it("emits NHM2 comparisons without allowing benchmark promotion", () => {
    const { nhm2Path, outPath } = makeNhm2Fixture();
    const report = writeCurvatureLeverageBenchmarkLadder({
      constantsPath,
      benchmarksPath,
      nhm2ReportPath: nhm2Path,
      outPath,
      generatedAt: "2026-05-19T00:00:00.000Z",
    });

    expect(fs.existsSync(outPath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(outPath, "utf8")) as CurvatureLeverageBenchmarkLadderReport;
    expect(written).toEqual(report);
    expect(written.promotionAllowed).toBe(false);
    expect(written.nhm2Comparisons.length).toBe(2);

    for (const comparison of written.nhm2Comparisons) {
      expect(comparison.promotionAllowed).toBe(false);
      expect(comparison.nearestBenchmark.id).toBeTruthy();
      expect(comparison.ordersAboveRawCasimir1km).not.toBeNull();
      expect(comparison.ordersBelowBlackHoleHorizon).not.toBeNull();
      expect(["missing", "present"]).toContain(comparison.qeiStatus);
      expect(["missing", "present"]).toContain(comparison.conservationStatus);
    }

    const wall = written.nhm2Comparisons.find((entry) => entry.region === "wall");
    expect(wall?.sourceClosureStatus).toBe("review");
    expect(wall?.ordersAboveRawCasimir1km).toBeGreaterThan(0);
    expect(JSON.stringify(written)).not.toContain("\"promotionAllowed\":true");
  });
});
