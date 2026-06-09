import { describe, expect, it } from "vitest";
import {
  buildCasimirMaterialReceipt,
  buildIdealCasimirMaterialReceipt,
  isCasimirMaterialReceipt,
  isMaterialReceiptedCasimirMaterialReceipt,
} from "../shared/contracts/casimir-material-receipt.v1";

describe("casimir material receipt contract", () => {
  it("keeps perfect-conductor rows as ideal scalar only", () => {
    const receipt = buildIdealCasimirMaterialReceipt({
      generatedAt: "2026-06-09T00:00:00.000Z",
      tileBatchId: "tile_batch:test",
      gapMeters: 1e-9,
      temperatureK: 20,
    });

    expect(isCasimirMaterialReceipt(receipt)).toBe(true);
    expect(receipt.status).toBe("ideal_scalar_only");
    expect(receipt.material.modelKind).toBe("perfect_conductor_ideal");
    expect(receipt.claimBoundary.idealCasimirDoesNotValidateTileSource).toBe(true);
  });

  it("blocks a Lifshitz label when receipt evidence is incomplete", () => {
    const receipt = buildCasimirMaterialReceipt({
      generatedAt: "2026-06-09T00:00:00.000Z",
      tileBatchId: "tile_batch:lifshitz-incomplete",
      geometry: {
        gapMeters: 1e-9,
        gapMetrologyStatus: "design",
        roughnessRmsMeters: null,
        beyondPfaValidity: "not_evaluated",
      },
      material: {
        modelKind: "lifshitz",
        finiteConductivityIncluded: true,
        finiteTemperatureIncluded: true,
        roughnessCorrectionIncluded: false,
      },
      environment: {
        vacuumSealEvidence: "proxy",
        temperatureK: 20,
      },
      correctionFactors: {
        conductivity: 0.8,
        temperature: null,
        roughness: null,
        geometry: null,
      },
    });

    expect(isCasimirMaterialReceipt(receipt)).toBe(true);
    expect(receipt.status).toBe("blocked");
    expect(isMaterialReceiptedCasimirMaterialReceipt(receipt)).toBe(false);
  });

  it("marks material_receipted only when material, metrology, environment, and corrections are complete", () => {
    const receipt = buildCasimirMaterialReceipt({
      generatedAt: "2026-06-09T00:00:00.000Z",
      tileBatchId: "tile_batch:lifshitz-complete",
      geometry: {
        gapMeters: 1e-9,
        gapMetrologyStatus: "measured",
        roughnessRmsMeters: 1e-10,
        beyondPfaValidity: "pass",
      },
      material: {
        modelKind: "lifshitz",
        dielectricResponseRef: "artifact://dielectric/au",
        finiteConductivityIncluded: true,
        finiteTemperatureIncluded: true,
        roughnessCorrectionIncluded: true,
      },
      environment: {
        vacuumSealEvidence: "present",
        temperatureK: 300,
      },
      correctionFactors: {
        conductivity: 0.82,
        temperature: 0.98,
        roughness: 0.94,
        geometry: 0.91,
      },
    });

    expect(isCasimirMaterialReceipt(receipt)).toBe(true);
    expect(receipt.status).toBe("material_receipted");
    expect(isMaterialReceiptedCasimirMaterialReceipt(receipt)).toBe(true);
  });
});
