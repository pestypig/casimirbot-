import { describe, expect, it, vi } from "vitest";
import { kappa_drive_from_power } from "../shared/curvature-proxy";
import { proofPackSchema } from "../shared/schema";

const loadPipelineModules = async () => {
  vi.resetModules();
  const pipeline = await import("../server/energy-pipeline");
  const proofPack = await import("../server/helix-proof-pack");
  return { ...pipeline, ...proofPack };
};

describe("proof pack contract", () => {
  it("matches pipeline snapshots and conversions", async () => {
    const { initializePipelineState, calculateEnergyPipeline, buildProofPack } =
      await loadPipelineModules();

    const state = initializePipelineState();
    const snapshot = await calculateEnergyPipeline(state);
    const pack = buildProofPack(snapshot);

    const parsed = proofPackSchema.safeParse(pack);
    expect(parsed.success).toBe(true);

    const unitChecks: Array<[string, string]> = [
      ["power_avg_W", "W"],
      ["power_avg_MW", "MW"],
      ["duty_effective", "1"],
      ["duty_burst", "1"],
      ["hull_area_m2", "m^2"],
      ["tile_area_cm2", "cm^2"],
      ["tile_area_m2", "m^2"],
      ["gap_nm", "nm"],
      ["gap_m", "m"],
      ["cavity_volume_m3", "m^3"],
      ["rho_tile_J_m3", "J/m^3"],
      ["U_static_total_J", "J"],
      ["kappa_drive", "1/m^2"],
      ["kappa_drive_gain", "1"],
      ["ts_ratio", "1"],
      ["zeta", "1"],
    ];
    for (const [key, unit] of unitChecks) {
      expect(pack.values[key]?.unit).toBe(unit);
    }

    const powerW = pack.values.power_avg_W.value;
    const powerMW = pack.values.power_avg_MW.value;
    expect(typeof powerW).toBe("number");
    expect(typeof powerMW).toBe("number");
    if (typeof powerW === "number" && typeof powerMW === "number") {
      expect(powerMW).toBeCloseTo(powerW / 1e6, 8);
    }

    const expectedDuty =
      (snapshot as any).d_eff ??
      snapshot.dutyEffectiveFR ??
      snapshot.dutyEffective_FR ??
      snapshot.dutyShip ??
      snapshot.dutyEff ??
      snapshot.dutyCycle ??
      null;
    const duty = pack.values.duty_effective.value;
    if (typeof expectedDuty === "number") {
      expect(duty).toBeCloseTo(expectedDuty, 8);
    } else {
      expect(duty).toBe(null);
    }

    const hullArea =
      snapshot.hullArea_m2 ??
      (snapshot as any).hullArea?.value ??
      (snapshot as any).tiles?.hullArea_m2 ??
      null;
    const packHullArea = pack.values.hull_area_m2.value;
    if (typeof hullArea === "number") {
      expect(packHullArea).toBeCloseTo(hullArea, 6);
    }

    const gapNm = pack.values.gap_nm.value;
    const gapM = pack.values.gap_m.value;
    if (typeof gapNm === "number" && typeof gapM === "number") {
      expect(gapM).toBeCloseTo(gapNm * 1e-9, 12);
    }

    const tileAreaCm2 = pack.values.tile_area_cm2.value;
    const tileAreaM2 = pack.values.tile_area_m2.value;
    if (typeof tileAreaCm2 === "number" && typeof tileAreaM2 === "number") {
      expect(tileAreaM2).toBeCloseTo(tileAreaCm2 * 1e-4, 12);
    }

    const uStatic = pack.values.U_static_J.value;
    const tileCount = pack.values.tile_count.value;
    const uStaticTotal = pack.values.U_static_total_J.value;
    if (typeof uStatic === "number" && typeof tileCount === "number") {
      expect(uStaticTotal).toBeCloseTo(uStatic * tileCount, 6);
    }

    const gain =
      pack.values.kappa_drive_gain.value ?? pack.values.gamma_geo.value ?? null;
    const kappa = pack.values.kappa_drive.value;
    if (
      typeof powerW === "number" &&
      typeof packHullArea === "number" &&
      typeof duty === "number" &&
      typeof gain === "number" &&
      typeof kappa === "number"
    ) {
      const expectedKappa = kappa_drive_from_power(
        powerW,
        packHullArea,
        duty,
        gain,
      );
      expect(kappa).toBeCloseTo(expectedKappa, 12);
    }

    const natario = pack.values.natario_ok.value;
    if (typeof snapshot.natarioConstraint === "boolean") {
      expect(natario).toBe(snapshot.natarioConstraint);
    }
  });
});
