import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { SolarKhiObservationV1Schema } from "@shared/contracts/solar-khi-observation.v1";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe("DKIST FastCam ingest tool", () => {
  it("hashes and preserves native MFBD/speckle frames with first-class registration", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "dkist-fastcam-ingest-"));
    tempRoots.push(root);
    const mfbd = path.join(root, "mfbd");
    const speckle = path.join(root, "speckle");
    fs.mkdirSync(mfbd);
    fs.mkdirSync(speckle);
    fs.writeFileSync(path.join(mfbd, "frame-000.npy"), Buffer.from([1, 2, 3, 4]));
    fs.writeFileSync(path.join(speckle, "frame-000.npy"), Buffer.from([4, 3, 2, 1]));
    const registration = path.join(root, "registration.json");
    fs.writeFileSync(registration, JSON.stringify({
      source_frame: "DKIST_FastCam",
      target_frame: "SDO_HMI",
      transform_kind: "cross_correlation",
      matrix_3x3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      residual_rms_arcsec: 0.03,
      covariance_2x2_arcsec2: [0.001, 0, 0, 0.001],
    }));
    const output = path.join(root, "manifest.json");
    const result = spawnSync("python", [
      path.join(process.cwd(), "tools", "dkist_fastcam_ingest.py"),
      "--mfbd", mfbd,
      "--speckle", speckle,
      "--registration-json", registration,
      "--output", output,
      "--observation-id", "fastcam-test",
      "--observation-time", "2025-02-01T00:00:00Z",
      "--native-width-px", "967",
      "--native-height-px", "725",
      "--footprint-width-arcsec", "8",
      "--footprint-height-arcsec", "6",
      "--hgs-lon-deg", "-9",
      "--hgs-lat-deg", "10",
      "--carrington-lon-deg", "121",
      "--carrington-lat-deg", "10",
      "--wcs-ref", "artifact://wcs",
      "--psf-ref", "artifact://psf",
      "--quality-report-ref", "artifact://quality",
      "--context-ref", "artifact://vbi",
      "--context-ref", "artifact://hmi",
    ], { encoding: "utf8" });

    expect(result.status, result.stderr).toBe(0);
    const manifest = SolarKhiObservationV1Schema.parse(JSON.parse(fs.readFileSync(output, "utf8")));
    expect(manifest.reconstruction_products.map((product) => product.kind)).toEqual(["mfbd", "speckle"]);
    expect(manifest.reconstruction_products.every((product) => product.native_width_px === 967)).toBe(true);
    expect(manifest.registrations[0].artifact_ref).toMatch(/^file:/);
    expect(manifest.provenance.manifest_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(manifest.energy_calibration).toBe("not_applicable_aia_193");
    expect(manifest.numerical_measurement_authority).toBe(true);
  });
});
