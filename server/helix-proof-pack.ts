import { kappa_drive_from_power } from "../shared/curvature-proxy.js";
import type { ProofPack, ProofValue } from "../shared/schema.js";
import { PAPER_GEO, type EnergyPipelineState } from "./energy-pipeline.js";

type NumberCandidate = {
  value: unknown;
  source: string;
  proxy?: boolean;
  scale?: number;
  fromUnit?: string;
};

type ResolvedNumber = {
  value: number | null;
  source: string;
  proxy: boolean;
  basis?: Record<string, string>;
};

const toFiniteNumber = (value: unknown): number | null => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const resolveNumber = (candidates: NumberCandidate[]): ResolvedNumber => {
  for (const candidate of candidates) {
    const raw = toFiniteNumber(candidate.value);
    if (raw == null) continue;
    const scaled =
      typeof candidate.scale === "number" ? raw * candidate.scale : raw;
    const basis =
      typeof candidate.scale === "number"
        ? {
            from: candidate.fromUnit ?? "unknown",
            scale: String(candidate.scale),
          }
        : undefined;
    return {
      value: scaled,
      source: candidate.source,
      proxy: candidate.proxy ?? false,
      basis,
    };
  }
  return { value: null, source: "missing", proxy: true };
};

const resolveBoolean = (value: unknown, source: string): ProofValue => {
  if (typeof value === "boolean") {
    return { value, source, proxy: false };
  }
  return { value: null, source: "missing", proxy: true };
};

const makeValue = (
  resolved: ResolvedNumber,
  unit?: string,
  note?: string,
): ProofValue => {
  const entry: ProofValue = {
    value: resolved.value,
    unit,
    source: resolved.source,
    proxy: resolved.proxy,
  };
  if (resolved.basis) entry.basis = resolved.basis;
  if (note) entry.note = note;
  return entry;
};

const makeDerivedNumber = (
  value: number | null,
  unit: string,
  source: string,
  proxy: boolean,
  note?: string,
): ProofValue => ({
  value,
  unit,
  source,
  proxy,
  note,
});

const resolveHullDims = (state: EnergyPipelineState) => {
  const hull = state.hull;
  const Lx = resolveNumber([
    { value: hull?.Lx_m, source: "hull.Lx_m" },
    { value: (state as any).Lx_m, source: "state.Lx_m", proxy: true },
  ]);
  const Ly = resolveNumber([
    { value: hull?.Ly_m, source: "hull.Ly_m" },
    { value: (state as any).Ly_m, source: "state.Ly_m", proxy: true },
  ]);
  const Lz = resolveNumber([
    { value: hull?.Lz_m, source: "hull.Lz_m" },
    { value: (state as any).Lz_m, source: "state.Lz_m", proxy: true },
  ]);
  const wall = resolveNumber([
    { value: hull?.wallThickness_m, source: "hull.wallThickness_m" },
    { value: (state as any).wallThickness_m, source: "state.wallThickness_m", proxy: true },
  ]);
  return { Lx, Ly, Lz, wall };
};

export function buildProofPack(state: EnergyPipelineState): ProofPack {
  const values: Record<string, ProofValue> = {};
  const notes: string[] = [];

  const power = resolveNumber([
    { value: (state as any).P_avg_W, source: "pipeline.P_avg_W" },
    { value: state.P_avg, source: "pipeline.P_avg", proxy: true, scale: 1e6, fromUnit: "MW" },
    { value: (state as any).P_avg_MW, source: "pipeline.P_avg_MW", proxy: true, scale: 1e6, fromUnit: "MW" },
  ]);
  values.power_avg_W = makeValue(power, "W");
  values.power_avg_MW = makeDerivedNumber(
    power.value == null ? null : power.value / 1e6,
    "MW",
    power.value == null ? "missing" : "derived:power_avg_W",
    power.proxy,
    "converted_from_W",
  );

  const dutyEffective = resolveNumber([
    { value: (state as any).d_eff, source: "pipeline.d_eff" },
    { value: state.dutyEffectiveFR, source: "pipeline.dutyEffectiveFR" },
    { value: state.dutyEffective_FR, source: "pipeline.dutyEffective_FR" },
    { value: state.dutyShip, source: "pipeline.dutyShip", proxy: true },
    { value: state.dutyEff, source: "pipeline.dutyEff", proxy: true },
    { value: state.dutyCycle, source: "pipeline.dutyCycle", proxy: true },
  ]);
  values.duty_effective = makeValue(dutyEffective, "1");

  const dutyBurst = resolveNumber([
    { value: state.dutyBurst, source: "pipeline.dutyBurst" },
    { value: state.localBurstFrac, source: "pipeline.localBurstFrac", proxy: true },
    { value: state.dutyCycle, source: "pipeline.dutyCycle", proxy: true },
  ]);
  values.duty_burst = makeValue(dutyBurst, "1");

  values.sectors_live = makeValue(
    resolveNumber([
      { value: state.concurrentSectors, source: "pipeline.concurrentSectors" },
      { value: state.activeSectors, source: "pipeline.activeSectors", proxy: true },
    ]),
    "1",
  );
  values.sectors_total = makeValue(
    resolveNumber([
      { value: state.sectorCount, source: "pipeline.sectorCount" },
      { value: (state as any).sectorsTotal, source: "pipeline.sectorsTotal", proxy: true },
    ]),
    "1",
  );

  const gammaGeo = resolveNumber([
    { value: state.gammaGeo, source: "pipeline.gammaGeo" },
    { value: (state as any).ampFactors?.gammaGeo, source: "pipeline.ampFactors.gammaGeo", proxy: true },
  ]);
  values.gamma_geo = makeValue(gammaGeo, "1");
  values.gamma_geo_cubed = makeDerivedNumber(
    gammaGeo.value == null ? null : Math.pow(gammaGeo.value, 3),
    "1",
    "derived:gamma_geo^3",
    gammaGeo.proxy,
  );

  const qCavity = resolveNumber([
    { value: state.qCavity, source: "pipeline.qCavity" },
  ]);
  values.q_cavity = makeValue(qCavity, "1");
  const qGain = resolveNumber([
    { value: state.gammaChain?.qGain, source: "pipeline.gammaChain.qGain" },
  ]);
  if (qGain.value != null) {
    values.q_gain = makeValue(qGain, "1");
  } else {
    const derivedQGain =
      qCavity.value == null ? null : Math.sqrt(Math.max(1, qCavity.value) / 1e9);
    values.q_gain = makeDerivedNumber(
      derivedQGain,
      "1",
      "derived:q_cavity",
      qCavity.proxy,
      "sqrt(Q/1e9)",
    );
  }

  const qSpoil = resolveNumber([
    { value: state.qSpoilingFactor, source: "pipeline.qSpoilingFactor" },
  ]);
  values.q_spoil = makeValue(qSpoil, "1");

  const gammaVdB = resolveNumber([
    { value: (state as any).gammaVanDenBroeck_mass, source: "pipeline.gammaVanDenBroeck_mass" },
    { value: state.gammaVanDenBroeck, source: "pipeline.gammaVanDenBroeck" },
    { value: (state as any).gammaVanDenBroeck_vis, source: "pipeline.gammaVanDenBroeck_vis", proxy: true },
  ]);
  values.gamma_vdb = makeValue(gammaVdB, "1");
  values.gamma_vdb_requested = makeValue(
    resolveNumber([
      { value: state.gammaVanDenBroeckGuard?.requested, source: "pipeline.gammaVanDenBroeckGuard.requested" },
    ]),
    "1",
  );

  values.theta_raw = makeValue(
    resolveNumber([
      { value: (state as any).thetaRaw, source: "pipeline.thetaRaw" },
    ]),
    "1",
  );
  values.theta_cal = makeValue(
    resolveNumber([
      { value: (state as any).thetaCal, source: "pipeline.thetaCal" },
      { value: (state as any).thetaScaleExpected, source: "pipeline.thetaScaleExpected", proxy: true },
    ]),
    "1",
  );
  if (state.gammaChain?.note) {
    values.gamma_chain_note = {
      value: state.gammaChain.note,
      source: "pipeline.gammaChain.note",
      proxy: false,
    };
  }

  values.ts_ratio = makeValue(
    resolveNumber([
      { value: state.TS_ratio, source: "pipeline.TS_ratio" },
      { value: state.TS_long, source: "pipeline.TS_long", proxy: true },
      { value: state.TS_geom, source: "pipeline.TS_geom", proxy: true },
      { value: (state as any).ts?.ratio, source: "pipeline.ts.ratio", proxy: true },
    ]),
    "1",
  );

  values.zeta = makeValue(
    resolveNumber([
      { value: state.zeta, source: "pipeline.zeta" },
      { value: (state as any).qi?.zeta, source: "pipeline.qi.zeta", proxy: true },
    ]),
    "1",
  );
  values.ford_roman_ok = resolveBoolean(
    state.fordRomanCompliance,
    "pipeline.fordRomanCompliance",
  );
  values.natario_ok = resolveBoolean(
    (state as any).natarioConstraint,
    "pipeline.natarioConstraint",
  );

  values.U_static_J = makeValue(
    resolveNumber([{ value: state.U_static, source: "pipeline.U_static" }]),
    "J",
  );
  values.U_geo_J = makeValue(
    resolveNumber([{ value: state.U_geo, source: "pipeline.U_geo" }]),
    "J",
  );
  values.U_Q_J = makeValue(
    resolveNumber([{ value: state.U_Q, source: "pipeline.U_Q" }]),
    "J",
  );
  values.U_cycle_J = makeValue(
    resolveNumber([{ value: state.U_cycle, source: "pipeline.U_cycle" }]),
    "J",
  );

  values.M_exotic_kg = makeValue(
    resolveNumber([{ value: state.M_exotic, source: "pipeline.M_exotic" }]),
    "kg",
  );
  values.M_exotic_raw_kg = makeValue(
    resolveNumber([{ value: state.M_exotic_raw, source: "pipeline.M_exotic_raw" }]),
    "kg",
  );
  values.mass_calibration = makeValue(
    resolveNumber([{ value: state.massCalibration, source: "pipeline.massCalibration" }]),
    "1",
  );

  values.rho_static_J_m3 = makeValue(
    resolveNumber([{ value: state.rho_static, source: "pipeline.rho_static" }]),
    "J/m^3",
  );
  values.rho_inst_J_m3 = makeValue(
    resolveNumber([{ value: state.rho_inst, source: "pipeline.rho_inst" }]),
    "J/m^3",
  );
  values.rho_avg_J_m3 = makeValue(
    resolveNumber([{ value: state.rho_avg, source: "pipeline.rho_avg" }]),
    "J/m^3",
  );

  const tileAreaCm2 = resolveNumber([
    { value: state.tileArea_cm2, source: "pipeline.tileArea_cm2" },
  ]);
  values.tile_area_cm2 = makeValue(tileAreaCm2, "cm^2");
  values.tile_area_m2 = makeDerivedNumber(
    tileAreaCm2.value == null ? null : tileAreaCm2.value * 1e-4,
    "m^2",
    "derived:tile_area_cm2",
    tileAreaCm2.proxy,
    "cm2_to_m2",
  );

  values.tile_count = makeValue(
    resolveNumber([
      { value: state.N_tiles, source: "pipeline.N_tiles" },
      { value: (state as any).tiles?.total, source: "pipeline.tiles.total", proxy: true },
    ]),
    "1",
  );

  const uStaticTotalResolved = resolveNumber([
    { value: (state as any).U_static_total, source: "pipeline.U_static_total" },
  ]);
  if (uStaticTotalResolved.value != null) {
    values.U_static_total_J = makeValue(uStaticTotalResolved, "J");
  } else {
    const uStaticTotal =
      typeof values.U_static_J.value === "number" &&
      typeof values.tile_count.value === "number"
        ? values.U_static_J.value * values.tile_count.value
        : null;
    values.U_static_total_J = makeDerivedNumber(
      uStaticTotal,
      "J",
      "derived:U_static_J*tile_count",
      Boolean(values.U_static_J.proxy || values.tile_count.proxy),
    );
  }

  const hullDims = resolveHullDims(state);
  values.hull_Lx_m = makeValue(hullDims.Lx, "m");
  values.hull_Ly_m = makeValue(hullDims.Ly, "m");
  values.hull_Lz_m = makeValue(hullDims.Lz, "m");
  values.hull_wall_m = makeValue(hullDims.wall, "m");

  const hullArea = resolveNumber([
    { value: state.hullArea_m2, source: "pipeline.hullArea_m2" },
    { value: (state as any).hullArea?.value, source: "pipeline.hullArea.value", proxy: true },
    { value: (state as any).tiles?.hullArea_m2, source: "pipeline.tiles.hullArea_m2", proxy: true },
  ]);
  values.hull_area_m2 = makeValue(hullArea, "m^2");

  const gapNm = resolveNumber([{ value: state.gap_nm, source: "pipeline.gap_nm" }]);
  values.gap_nm = makeValue(gapNm, "nm");
  values.gap_m = makeDerivedNumber(
    gapNm.value == null ? null : gapNm.value * 1e-9,
    "m",
    "derived:gap_nm",
    gapNm.proxy,
    "nm_to_m",
  );

  const gapGuardNm = resolveNumber([
    { value: (state as any).mechanical?.constrainedGap_nm, source: "pipeline.mechanical.constrainedGap_nm" },
    { value: (state as any).mechanical?.recommendedGap_nm, source: "pipeline.mechanical.recommendedGap_nm", proxy: true },
  ]);
  values.gap_guard_nm = makeValue(gapGuardNm, "nm");
  values.gap_guard_m = makeDerivedNumber(
    gapGuardNm.value == null ? null : gapGuardNm.value * 1e-9,
    "m",
    "derived:gap_guard_nm",
    gapGuardNm.proxy,
    "nm_to_m",
  );

  const tileAreaM2Value = values.tile_area_m2.value;
  const gapMValue = values.gap_m.value;
  const cavityVolume =
    typeof tileAreaM2Value === "number" && typeof gapMValue === "number"
      ? tileAreaM2Value * gapMValue
      : null;
  values.cavity_volume_m3 = makeDerivedNumber(
    cavityVolume,
    "m^3",
    "derived:tile_area_m2*gap_m",
    Boolean(values.tile_area_m2.proxy || values.gap_m.proxy),
  );
  const uStatic = values.U_static_J.value;
  const rhoTile =
    typeof uStatic === "number" && typeof cavityVolume === "number" && cavityVolume > 0
      ? uStatic / cavityVolume
      : null;
  values.rho_tile_J_m3 = makeDerivedNumber(
    rhoTile,
    "J/m^3",
    "derived:U_static_J/cavity_volume_m3",
    Boolean(values.U_static_J.proxy || values.cavity_volume_m3.proxy),
  );

  values.packing = {
    value: PAPER_GEO.PACKING,
    unit: "1",
    source: "pipeline.PAPER_GEO.PACKING",
    proxy: false,
  };
  values.radial_layers = {
    value: PAPER_GEO.RADIAL_LAYERS,
    unit: "1",
    source: "pipeline.PAPER_GEO.RADIAL_LAYERS",
    proxy: false,
  };

  const tileCountValue = values.tile_count.value;
  const hullAreaValue = values.hull_area_m2.value;
  const tileAreaValue = values.tile_area_m2.value;
  const coverageRaw =
    typeof tileCountValue === "number" &&
    typeof hullAreaValue === "number" &&
    typeof tileAreaValue === "number" &&
    hullAreaValue > 0
      ? (tileCountValue * tileAreaValue) / hullAreaValue
      : null;
  values.coverage_raw = makeDerivedNumber(
    coverageRaw,
    "1",
    "derived:tile_count*tile_area_m2/hull_area_m2",
    Boolean(values.tile_count.proxy || values.tile_area_m2.proxy || values.hull_area_m2.proxy),
  );
  const packingValue = values.packing.value;
  const radialValue = values.radial_layers.value;
  const coverage =
    typeof coverageRaw === "number" &&
    typeof packingValue === "number" &&
    typeof radialValue === "number" &&
    packingValue > 0 &&
    radialValue > 0
      ? coverageRaw / (packingValue * radialValue)
      : null;
  values.coverage = makeDerivedNumber(
    coverage,
    "1",
    "derived:coverage_raw/(packing*radial_layers)",
    Boolean(values.coverage_raw.proxy),
  );

  const R_geom =
    typeof hullDims.Lx.value === "number" &&
    typeof hullDims.Ly.value === "number" &&
    typeof hullDims.Lz.value === "number"
      ? Math.cbrt(hullDims.Lx.value * hullDims.Ly.value * hullDims.Lz.value)
      : null;
  values.R_geom_m = makeDerivedNumber(
    R_geom,
    "m",
    "derived:hull_dims",
    Boolean(hullDims.Lx.proxy || hullDims.Ly.proxy || hullDims.Lz.proxy),
  );

  const bubble = (state as any).bubble ?? {};
  values.bubble_R_m = makeValue(
    resolveNumber([
      { value: bubble.R, source: "pipeline.bubble.R" },
      { value: (state as any).R, source: "pipeline.R", proxy: true },
    ]),
    "m",
  );
  values.bubble_sigma = makeValue(
    resolveNumber([
      { value: bubble.sigma, source: "pipeline.bubble.sigma" },
      { value: (state as any).sigma, source: "pipeline.sigma", proxy: true },
    ]),
    "1",
  );
  values.bubble_beta = makeValue(
    resolveNumber([
      { value: bubble.beta, source: "pipeline.bubble.beta" },
      { value: (state as any).beta, source: "pipeline.beta", proxy: true },
    ]),
    "1",
  );

  values.vdb_limit = makeValue(
    resolveNumber([
      { value: state.gammaVanDenBroeckGuard?.limit, source: "pipeline.gammaVanDenBroeckGuard.limit" },
    ]),
    "1",
  );
  values.vdb_pocket_radius_m = makeValue(
    resolveNumber([
      { value: state.gammaVanDenBroeckGuard?.pocketRadius_m, source: "pipeline.gammaVanDenBroeckGuard.pocketRadius_m" },
    ]),
    "m",
  );
  values.vdb_pocket_thickness_m = makeValue(
    resolveNumber([
      { value: state.gammaVanDenBroeckGuard?.pocketThickness_m, source: "pipeline.gammaVanDenBroeckGuard.pocketThickness_m" },
    ]),
    "m",
  );
  values.vdb_planck_margin = makeValue(
    resolveNumber([
      { value: state.gammaVanDenBroeckGuard?.planckMargin, source: "pipeline.gammaVanDenBroeckGuard.planckMargin" },
    ]),
    "1",
  );
  values.vdb_admissible = resolveBoolean(
    state.gammaVanDenBroeckGuard?.admissible,
    "pipeline.gammaVanDenBroeckGuard.admissible",
  );
  if (state.gammaVanDenBroeckGuard?.reason) {
    values.vdb_reason = {
      value: state.gammaVanDenBroeckGuard.reason,
      source: "pipeline.gammaVanDenBroeckGuard.reason",
      proxy: false,
    };
  }

  const mech = (state as any).mechanical ?? {};
  values.mechanical_gap_req_nm = makeValue(
    resolveNumber([
      { value: mech.requestedGap_nm, source: "pipeline.mechanical.requestedGap_nm" },
    ]),
    "nm",
  );
  values.mechanical_gap_eff_nm = makeValue(
    resolveNumber([
      { value: mech.constrainedGap_nm, source: "pipeline.mechanical.constrainedGap_nm" },
      { value: mech.recommendedGap_nm, source: "pipeline.mechanical.recommendedGap_nm", proxy: true },
    ]),
    "nm",
  );
  values.mechanical_safety_factor = makeValue(
    resolveNumber([
      { value: mech.mechSafetyFactor, source: "pipeline.mechanical.mechSafetyFactor" },
    ]),
    "1",
  );
  values.mechanical_safety_min = makeValue(
    resolveNumber([
      { value: mech.safetyFactorMin, source: "pipeline.mechanical.safetyFactorMin", proxy: true },
    ]),
    "1",
  );
  values.mechanical_load_pressure_Pa = makeValue(
    resolveNumber([
      { value: mech.loadPressure_Pa, source: "pipeline.mechanical.loadPressure_Pa" },
    ]),
    "Pa",
  );
  values.mechanical_sigma_allow_Pa = makeValue(
    resolveNumber([
      { value: mech.sigmaAllow_Pa, source: "pipeline.mechanical.sigmaAllow_Pa" },
    ]),
    "Pa",
  );
  values.mechanical_casimir_pressure_Pa = makeValue(
    resolveNumber([
      { value: mech.casimirPressure_Pa, source: "pipeline.mechanical.casimirPressure_Pa" },
    ]),
    "Pa",
  );
  values.mechanical_electrostatic_pressure_Pa = makeValue(
    resolveNumber([
      { value: mech.electrostaticPressure_Pa, source: "pipeline.mechanical.electrostaticPressure_Pa" },
    ]),
    "Pa",
  );
  values.mechanical_restoring_pressure_Pa = makeValue(
    resolveNumber([
      { value: mech.restoringPressure_Pa, source: "pipeline.mechanical.restoringPressure_Pa" },
    ]),
    "Pa",
  );
  values.mechanical_margin_Pa = makeValue(
    resolveNumber([
      { value: mech.margin_Pa, source: "pipeline.mechanical.margin_Pa" },
    ]),
    "Pa",
  );
  values.mechanical_max_stroke_pm = makeValue(
    resolveNumber([
      { value: mech.maxStroke_pm, source: "pipeline.mechanical.maxStroke_pm" },
    ]),
    "pm",
  );
  values.mechanical_stroke_feasible = resolveBoolean(
    mech.strokeFeasible,
    "pipeline.mechanical.strokeFeasible",
  );
  values.mechanical_feasible = resolveBoolean(
    mech.feasible,
    "pipeline.mechanical.feasible",
  );
  values.mechanical_safety_feasible = resolveBoolean(
    mech.safetyFeasible,
    "pipeline.mechanical.safetyFeasible",
  );

  if (state.qiInterest) {
    values.qi_interest_neg_Jm3 = makeValue(
      resolveNumber([
        { value: state.qiInterest.neg_Jm3, source: "pipeline.qiInterest.neg_Jm3" },
      ]),
      "J/m^3",
    );
    values.qi_interest_pos_Jm3 = makeValue(
      resolveNumber([
        { value: state.qiInterest.pos_Jm3, source: "pipeline.qiInterest.pos_Jm3" },
      ]),
      "J/m^3",
    );
    values.qi_interest_debt_Jm3 = makeValue(
      resolveNumber([
        { value: state.qiInterest.debt_Jm3, source: "pipeline.qiInterest.debt_Jm3" },
      ]),
      "J/m^3",
    );
    values.qi_interest_credit_Jm3 = makeValue(
      resolveNumber([
        { value: state.qiInterest.credit_Jm3, source: "pipeline.qiInterest.credit_Jm3" },
      ]),
      "J/m^3",
    );
    values.qi_interest_margin_Jm3 = makeValue(
      resolveNumber([
        { value: state.qiInterest.margin_Jm3, source: "pipeline.qiInterest.margin_Jm3" },
      ]),
      "J/m^3",
    );
  }

  const gain = gammaGeo.value ?? null;
  const kappaDrive =
    power.value != null &&
    hullArea.value != null &&
    dutyEffective.value != null &&
    gain != null &&
    hullArea.value > 0
      ? kappa_drive_from_power(
          power.value,
          hullArea.value,
          dutyEffective.value,
          gain,
        )
      : null;
  values.kappa_drive = makeDerivedNumber(
    kappaDrive,
    "1/m^2",
    "derived:kappa_drive_from_power",
    true,
    "curvature_proxy",
  );
  values.kappa_drive_gain = makeDerivedNumber(
    gain,
    "1",
    "derived:gamma_geo",
    gammaGeo.proxy,
  );

  values.overall_status = {
    value: state.overallStatus ?? null,
    source: "pipeline.overallStatus",
    proxy: false,
  };

  const equations =
    (state as any).uniformsExplain?.equations &&
    typeof (state as any).uniformsExplain.equations === "object"
      ? ((state as any).uniformsExplain.equations as Record<string, string>)
      : undefined;
  const sources =
    (state as any).uniformsExplain?.sources &&
    typeof (state as any).uniformsExplain.sources === "object"
      ? ((state as any).uniformsExplain.sources as Record<string, string>)
      : undefined;

  const missingKeys = Object.entries(values)
    .filter(([, entry]) => entry.value == null)
    .map(([key]) => key);
  if (missingKeys.length) {
    notes.push(`missing_values=${missingKeys.join(",")}`);
  }

  return {
    kind: "proof-pack",
    version: 1,
    generatedAt: new Date().toISOString(),
    pipeline: {
      seq: (state as any).seq,
      ts: (state as any).__ts,
      mode: state.currentMode,
    },
    values,
    equations,
    sources,
    notes: notes.length ? notes : undefined,
  };
}
