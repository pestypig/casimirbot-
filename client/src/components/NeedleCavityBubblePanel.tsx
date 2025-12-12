import React, { useMemo } from "react";
import { useEnergyPipeline, type EnergyPipelineState } from "@/hooks/use-energy-pipeline";

// Simple sci formatter to match Phoenix/FrontProofs style
const fmtSci = (v: number | undefined | null, digits = 3): string =>
  v == null || !Number.isFinite(v)
    ? "n/a"
    : Math.abs(v) >= 1e-2 && Math.abs(v) < 1e4
    ? v.toPrecision(digits)
    : v.toExponential(digits - 1);

const fmtPct = (v: number | undefined | null, digits = 1): string =>
  v == null || !Number.isFinite(v) ? "n/a" : `${(v * 100).toFixed(digits)}%`;

const fmtDim = (v: number | undefined | null, digits = 2): string => {
  if (v == null || !Number.isFinite(v)) return "n/a";
  const n = v as number;
  const abs = Math.abs(n);
  if (abs >= 1e5) return n.toExponential(digits);
  if (abs >= 1) return n.toFixed(digits).replace(/\.?0+$/, "");
  if (abs >= 1e-3) return n.toPrecision(digits).replace(/\.?0+e/, "e");
  return n.toExponential(digits);
};

const finiteNumber = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

type DerivedLedger = {
  // cavity (single tile)
  tileArea_m2: number | null;
  gap_m: number | null;
  gap_guard_m: number | null;
  cavityVolume_m3: number | null;
  U_static_J: number | null;
  rho_tile_J_m3: number | null;
  casimir_Pa: number | null;
  electrostatic_Pa: number | null;
  restoring_Pa: number | null;
  margin_Pa: number | null;
  maxStroke_pm: number | null;

  // hull / bubble (cloak)
  Lx_m: number | null;
  Ly_m: number | null;
  Lz_m: number | null;
  R_geom_m: number | null;
  R_metric_m: number | null;
  sigma: number | null;
  beta: number | null;

  hullArea_m2: number | null;
  N_tiles: number | null;
  coverage: number | null;
  coverageRaw: number | null;

  U_static_total_J: number | null;
  M_exotic_kg: number | null;
  massCalibration: number | null;
  rho_static_J_m3: number | null;
  rho_inst_J_m3: number | null;
  rho_avg_J_m3: number | null;

  TS_ratio: number | null;
  zeta: number | null;
  fordRomanOK: boolean | null;
  natarioOK: boolean | null;

  gammaGeo: number | null;
  gammaGeo3: number | null;
  gammaVdB: number | null;
  gammaVdB_requested: number | null;
  qSpoil: number | null;
  d_eff: number | null;
  thetaAmplification_raw: number | null;
  thetaAmplification_clamped: number | null;

  vdbLimit: number | null;
  pocketRadius_m: number | null;
  pocketThickness_m: number | null;
  planckMargin: number | null;
  vdbReason?: string;
};

function deriveLedger(p?: EnergyPipelineState | null): DerivedLedger {
  const tileArea_cm2 = Number(p?.tileArea_cm2);
  const tileArea_m2 =
    Number.isFinite(tileArea_cm2) && tileArea_cm2 > 0 ? tileArea_cm2 * 1e-4 : null;

  const gap_nm = Number(p?.gap_nm);
  const gap_m = Number.isFinite(gap_nm) && gap_nm > 0 ? gap_nm * 1e-9 : null;
  const gap_guard_nm = Number((p as any)?.mechanical?.constrainedGap_nm ?? (p as any)?.mechanical?.recommendedGap_nm);
  const gap_guard_m =
    Number.isFinite(gap_guard_nm) && gap_guard_nm > 0 ? gap_guard_nm * 1e-9 : null;

  const cavityVolume_m3 = tileArea_m2 && gap_m ? tileArea_m2 * gap_m : null;

  const U_static_J = Number.isFinite(p?.U_static) ? (p!.U_static as number) : null;
  const rho_tile_J_m3 =
    U_static_J != null && cavityVolume_m3 && cavityVolume_m3 > 0
      ? U_static_J / cavityVolume_m3
      : null;

  const mech = p?.mechanical;
  const casimir_Pa = mech?.casimirPressure_Pa ?? null;
  const electrostatic_Pa = mech?.electrostaticPressure_Pa ?? null;
  const restoring_Pa = mech?.restoringPressure_Pa ?? null;
  const margin_Pa = mech?.margin_Pa ?? null;
  const maxStroke_pm = mech?.maxStroke_pm ?? null;

  const hull = p?.hull as any | undefined;
  const Lx_raw = finiteNumber(hull?.Lx_m ?? hull?.a ?? (p as any)?.Lx_m);
  const Ly_raw = finiteNumber(hull?.Ly_m ?? hull?.b ?? (p as any)?.Ly_m);
  const Lz_raw = finiteNumber(hull?.Lz_m ?? hull?.c ?? (p as any)?.Lz_m);

  const Lx_m =
    Lx_raw != null
      ? hull?.Lx_m == null && hull?.a != null
        ? Lx_raw * 2
        : Lx_raw
      : null;
  const Ly_m =
    Ly_raw != null
      ? hull?.Ly_m == null && hull?.b != null
        ? Ly_raw * 2
        : Ly_raw
      : null;
  const Lz_m =
    Lz_raw != null
      ? hull?.Lz_m == null && hull?.c != null
        ? Lz_raw * 2
        : Lz_raw
      : null;

  const R_geom_m =
    Number.isFinite(Lx_m) && Number.isFinite(Ly_m) && Number.isFinite(Lz_m)
      ? Math.cbrt((Lx_m as number) * (Ly_m as number) * (Lz_m as number))
      : null;

  const massCalibration = finiteNumber((p as any)?.massCalibration);

  const a_m = finiteNumber(hull?.a ?? (p as any)?.a);
  const b_m = finiteNumber(hull?.b ?? (p as any)?.b);
  const c_m = finiteNumber(hull?.c ?? (p as any)?.c);

  const bubble = (p as any)?.bubble ?? {};
  const sigmaRaw = finiteNumber(
    bubble?.sigma ??
      (p as any)?.sigma ??
      (p as any)?.warp?.sigma ??
      (p as any)?.warp?.bubble?.sigma ??
      (p as any)?.warpParams?.sigma,
  );
  const R_metric_m =
    finiteNumber(
      bubble?.R ??
        bubble?.radius ??
        (p as any)?.R ??
        (p as any)?.radius ??
        (a_m != null && b_m != null && c_m != null ? Math.cbrt(a_m * b_m * c_m) : null),
    ) ?? R_geom_m;
  const sigma = sigmaRaw ?? 6; // default to a typical top-hat sharpness to avoid blanks
  const betaRaw = finiteNumber(
    bubble?.beta ??
      (p as any)?.beta_trans ??
      (p as any)?.beta ??
      (p as any)?.warp?.beta ??
      (p as any)?.warp?.bubble?.beta ??
      (p as any)?.warpParams?.beta,
  );
  const beta = betaRaw ?? 0;

  const hullArea_m2 =
    Number.isFinite(p?.hullArea_m2) && (p!.hullArea_m2 as number) > 0
      ? (p!.hullArea_m2 as number)
      : (p as any)?.hullArea?.value ??
        finiteNumber((p as any)?.tiles?.hullArea_m2) ??
        null;

  const N_tiles =
    Number.isFinite(p?.N_tiles) && (p!.N_tiles as number) > 0
      ? (p!.N_tiles as number)
      : finiteNumber((p as any)?.tiles?.total) ??
        finiteNumber((p as any)?.tiles?.active) ??
        null;

  const packing =
    finiteNumber((p as any)?.tiles?.packing ?? (p as any)?.PACKING ?? (p as any)?.paperGeo?.PACKING) ??
    0.88;
  const radialLayers =
    finiteNumber(
      (p as any)?.tiles?.radialLayers ??
        (p as any)?.RADIAL_LAYERS ??
        (p as any)?.paperGeo?.RADIAL_LAYERS,
    ) ?? 10;

  const coverageRaw =
    N_tiles && hullArea_m2 && tileArea_m2 ? (N_tiles * tileArea_m2) / hullArea_m2 : null;
  const coverage =
    N_tiles && hullArea_m2 && tileArea_m2
      ? Math.min(1, (N_tiles * tileArea_m2) / (hullArea_m2 * packing * radialLayers))
      : null;

  const U_static_total_J =
    (p as any)?.U_static_total ??
    (N_tiles && U_static_J != null ? N_tiles * U_static_J : null);

  const M_exotic_kg = Number.isFinite(p?.M_exotic) ? (p!.M_exotic as number) : null;

  const rho_static_J_m3 = (p as any)?.rho_static ?? null;
  const rho_inst_J_m3 = (p as any)?.rho_inst ?? null;
  const rho_avg_J_m3 = (p as any)?.rho_avg ?? null;

  const TS_ratio = (p as any)?.TS_ratio ?? null;
  const zeta = (p as any)?.zeta ?? (p as any)?.zetaRaw ?? null;

  const fordRomanOK =
    typeof (p as any)?.fordRomanCompliance === "boolean" ? (p as any)!.fordRomanCompliance : null;
  const natarioOK =
    typeof (p as any)?.natarioConstraint === "boolean" ? (p as any)!.natarioConstraint : null;

  const gammaGeo = Number.isFinite(p?.gammaGeo) ? (p!.gammaGeo as number) : null;
  const gammaGeo3 =
    (p as any)?.gammaChain?.geo_cubed ??
    (gammaGeo != null ? gammaGeo * gammaGeo * gammaGeo : null);

  const gammaVdB =
    Number.isFinite((p as any)?.gammaVanDenBroeck) || Number.isFinite((p as any)?.gammaVdB)
      ? Number((p as any)?.gammaVanDenBroeck ?? (p as any)?.gammaVdB)
      : null;
  const gammaVdB_requested = finiteNumber((p as any)?.gammaVanDenBroeckGuard?.requested);

  const qSpoil =
    (p as any)?.gammaChain?.qSpoiling ??
    (Number.isFinite((p as any)?.qSpoilingFactor) ? Number((p as any)?.qSpoilingFactor) : null);

  const d_eff =
    (p as any)?.gammaChain?.dutyEffective ??
    (Number.isFinite((p as any)?.dutyEffectiveFR)
      ? Number((p as any)?.dutyEffectiveFR)
      : Number.isFinite((p as any)?.dutyEff)
      ? Number((p as any)?.dutyEff)
      : null);

  const thetaAmplification_raw =
    gammaGeo3 && gammaVdB_requested && d_eff
      ? gammaGeo3 * (qSpoil ?? 1) * gammaVdB_requested * d_eff
      : null;
  const thetaAmplification_clamped =
    gammaGeo3 && gammaVdB && d_eff ? gammaGeo3 * (qSpoil ?? 1) * gammaVdB * d_eff : null;

  const vdbGuard = (p as any)?.gammaVanDenBroeckGuard;
  const vdbLimit = vdbGuard?.limit ?? null;
  const pocketRadius_m = vdbGuard?.pocketRadius_m ?? null;
  const pocketThickness_m = vdbGuard?.pocketThickness_m ?? null;
  const planckMargin = vdbGuard?.planckMargin ?? null;
  const vdbReason = vdbGuard?.reason;

  return {
    tileArea_m2,
    gap_m,
    gap_guard_m,
    cavityVolume_m3,
    U_static_J,
    rho_tile_J_m3,
    casimir_Pa,
    electrostatic_Pa,
    restoring_Pa,
    margin_Pa,
    maxStroke_pm,
    Lx_m,
    Ly_m,
    Lz_m,
    R_geom_m,
    R_metric_m,
    sigma,
    beta,
    hullArea_m2,
    N_tiles,
    coverage,
    coverageRaw,
    U_static_total_J,
    M_exotic_kg,
    massCalibration,
    rho_static_J_m3,
    rho_inst_J_m3,
    rho_avg_J_m3,
    TS_ratio,
    zeta,
    fordRomanOK,
    natarioOK,
    gammaGeo,
    gammaGeo3,
    gammaVdB,
    gammaVdB_requested,
    qSpoil,
    d_eff,
    thetaAmplification_raw,
    thetaAmplification_clamped,
    vdbLimit,
    pocketRadius_m,
    pocketThickness_m,
    planckMargin,
    vdbReason,
  };
}

export function NeedleCavityBubblePanel() {
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1000 });
  const ledger = useMemo(() => deriveLedger(pipeline), [pipeline]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#050915] text-slate-100">
      <header className="border-b border-white/10 bg-black/40 px-4 py-3">
        <div className="text-sm font-semibold text-white">
          Needle Hull - Cavity vs. Bubble Ledger
        </div>
        <div className="mt-1 text-[11px] text-slate-300/80">
          Single Casimir cavity (tile) on the left, full needle-hull Casimir cloak and warp-bubble
          aggregates on the right. All values are live from the energy pipeline snapshot.
        </div>
      </header>

      <div className="grid flex-1 gap-4 p-4 md:grid-cols-2">
        {/* Cavity / tile card */}
        <div className="flex flex-col rounded-xl border border-emerald-400/20 bg-emerald-500/5">
          <div className="border-b border-emerald-400/20 px-3 py-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
              Casimir cavity (single tile)
            </div>
            <div className="mt-0.5 text-[11px] text-emerald-100/80">
              Tile cavity is the atomic negative-energy source; everything else is scaled from
              this.
            </div>
          </div>
          <div className="flex-1 space-y-2 px-3 py-3 text-[11px]">
            <LedgerRow
              label="Tile area A_tile"
              formula="A_tile = tileArea_cm2 * 1e-4"
              value={fmtSci(ledger.tileArea_m2)}
              unit="m^2"
            />
            <LedgerRow
              label="Gap g"
              formula="g = gap_nm * 1e-9"
              value={fmtSci(ledger.gap_m)}
              unit="m"
            />
            {ledger.gap_guard_m ? (
              <LedgerRow
                label="Guard gap g_guard"
                formula="g_guard = constrainedGap_nm * 1e-9 (mechanical guard)"
                value={fmtSci(ledger.gap_guard_m)}
                unit="m"
              />
            ) : null}
            <LedgerRow
              label="Cavity volume V_cav"
              formula="V_cav = A_tile * g"
              value={fmtSci(ledger.cavityVolume_m3)}
              unit="m^3"
            />
            <LedgerRow
              label="Static Casimir energy U_static"
              formula="U_static = -pi^2 hbar c A_tile / (720 g^3)"
              value={fmtSci(ledger.U_static_J)}
              unit="J"
            />
            <LedgerRow
              label="Tile energy density rho_tile"
              formula="rho_tile = U_static / V_cav"
              value={fmtSci(ledger.rho_tile_J_m3)}
              unit="J/m^3"
            />
            <Divider label="Mechanical guard (per tile)" />
            <LedgerRow
              label="Casimir pressure P_C"
              formula="P_C = pi^2 hbar c / (240 g_guard^4)"
              value={fmtSci(ledger.casimir_Pa)}
              unit="Pa"
            />
            <LedgerRow
              label="Electrostatic pressure P_ES"
              formula="P_ES = 1/2 eps0 (V_patch / g_guard)^2"
              value={fmtSci(ledger.electrostatic_Pa)}
              unit="Pa"
            />
            <LedgerRow
              label="Restoring pressure P_rest"
              formula="P_rest = D * clearance / (k L^4)"
              value={fmtSci(ledger.restoring_Pa)}
              unit="Pa"
            />
            <LedgerRow
              label="Margin (P_rest - P_load)"
              formula="P_margin = P_rest - (P_C + P_ES)"
              value={fmtSci(ledger.margin_Pa)}
              unit="Pa"
              highlight={ledger.margin_Pa != null && ledger.margin_Pa < 0}
            />
            <LedgerRow
              label="Max stroke s_max"
              formula="s_max = g_guard - roughness - delta_load"
              value={fmtSci(ledger.maxStroke_pm)}
              unit="pm"
            />
          </div>
        </div>

        {/* Bubble / cloak card */}
        <div className="flex flex-col rounded-xl border border-sky-400/20 bg-sky-500/5">
          <div className="border-b border-sky-400/20 px-3 py-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-200">
              Warp bubble (needle hull cloak)
            </div>
            <div className="mt-0.5 text-[11px] text-sky-100/80">
              Ellipsoidal needle hull with a high-coverage Casimir cloak and Natario/Alcubierre
              wall profile.
            </div>
          </div>
          <div className="flex-1 space-y-2 px-3 py-3 text-[11px]">
            <LedgerRow
              label="Hull dims Lx, Ly, Lz"
              formula="Needle hull box dimensions"
              value={
                ledger.Lx_m && ledger.Ly_m && ledger.Lz_m
                  ? `${fmtDim(ledger.Lx_m)} x ${fmtDim(ledger.Ly_m)} x ${fmtDim(ledger.Lz_m)}`
                  : "n/a"
              }
              unit="m"
            />
            <LedgerRow
              label="Hull radius R_hull (geom)"
              formula="R_hull = (Lx * Ly * Lz)^(1/3) - display-only, not used by solver"
              value={fmtSci(ledger.R_geom_m)}
              unit="m"
            />
            <LedgerRow
              label="Metric bubble radius R_metric"
              formula="R_metric = bubble.R or (a * b * c)^(1/3) (semi-axes) - used by solver"
              value={fmtSci(ledger.R_metric_m)}
              unit="m"
            />
            <LedgerRow
              label="Wall sharpness sigma"
              formula="f(r) = top-hat(sigma, R); df/dr from LUT"
              value={ledger.sigma != null ? ledger.sigma.toFixed(2) : "n/a"}
            />
            <LedgerRow
              label="Drive beta"
              formula="beta = v_ship / c (effective)"
              value={ledger.beta != null ? ledger.beta.toPrecision(3) : "n/a"}
            />
            <Divider label="Cloak coverage & energy" />
            <LedgerRow
              label="Hull area A_hull"
              formula="A_hull from ellipsoid surface metric"
              value={fmtSci(ledger.hullArea_m2)}
              unit="m^2"
            />
            <LedgerRow
              label="Tile census N_tiles"
              formula="N_tiles from A_hull, A_tile, PACKING, RADIAL_LAYERS"
              value={ledger.N_tiles != null ? fmtSci(ledger.N_tiles, 4) : "n/a"}
              unit="-"
            />
            <LedgerRow
              label="Coverage fraction f_cov"
              formula="f_cov = N_tiles * A_tile / (A_hull * packing * radialLayers)"
              value={
                ledger.coverage != null
                  ? `${fmtPct(ledger.coverage)} (norm)`
                  : "n/a"
              }
              unit="of hull"
            />
            <LedgerRow
              label="Total Casimir energy U_static,total"
              formula="U_static,total = N_tiles * U_static"
              value={fmtSci(ledger.U_static_total_J)}
              unit="J"
            />
            <LedgerRow
              label="Exotic mass M_exotic"
              formula="M_exotic = |U_static,total| * gamma_chain / c^2 (massCalibration applied)"
              value={
                ledger.M_exotic_kg != null
                  ? `${fmtSci(ledger.M_exotic_kg)} (cal factor ${fmtSci(ledger.massCalibration)})`
                  : "n/a"
              }
              unit="kg"
            />
            <LedgerRow
              label="rho_static / rho_inst / rho_avg"
              formula="Pipeline energy densities in shell"
              value={
                ledger.rho_static_J_m3 != null
                  ? `${fmtSci(ledger.rho_static_J_m3)} | ${fmtSci(
                      ledger.rho_inst_J_m3,
                    )} | ${fmtSci(ledger.rho_avg_J_m3)}`
                  : "n/a"
              }
              unit="J/m^3"
            />
            <Divider label="GR proxy & guardrails" />
            <LedgerRow
              label="TS ratio"
              formula="TS_ratio = (L_long / c) / (1 / f_mod)"
              value={fmtSci(ledger.TS_ratio)}
              unit="-"
            />
            <LedgerRow
              label="Ford-Roman QI zeta"
              formula="zeta = sampledIntegral / bound (zeta <= 1)"
              value={fmtSci(ledger.zeta)}
              unit={ledger.fordRomanOK === false ? "violation" : "ok"}
              highlight={ledger.fordRomanOK === false}
            />
            <LedgerRow
              label="Natario constraint"
              formula="Enforced in warp module / sampler"
              value={
                ledger.natarioOK == null ? "n/a" : ledger.natarioOK ? "satisfied" : "violated"
              }
              unit="-"
              highlight={ledger.natarioOK === false}
            />
            <LedgerRow
              label="FR amplification theta_chain"
              formula="theta_raw = gamma_geo^3 * qSpoil * gamma_VdB(raw) * d_eff; theta_cal uses clamped gamma_VdB"
              value={
                ledger.thetaAmplification_raw != null || ledger.thetaAmplification_clamped != null
                  ? `${fmtSci(ledger.thetaAmplification_raw)} raw / ${fmtSci(
                      ledger.thetaAmplification_clamped,
                    )} cal`
                  : "n/a"
              }
              unit="-"
            />
            <LedgerRow
              label="Van den Broeck limit"
              formula="gamma_VdB <= limit = r_min / pocketFloor"
              value={
                ledger.gammaVdB != null && ledger.vdbLimit != null
                  ? `${fmtSci(ledger.gammaVdB_requested ?? ledger.gammaVdB)} req / ${fmtSci(
                      ledger.gammaVdB,
                    )} cal (limit ${fmtSci(ledger.vdbLimit)})`
                  : "n/a"
              }
              unit="-"
            />
            <LedgerRow
              label="Pocket radius / thickness"
              formula="r_pocket = r_min / gamma_VdB, t_pocket = wall / gamma_VdB"
              value={
                ledger.pocketRadius_m != null
                  ? `${fmtSci(ledger.pocketRadius_m)} / ${fmtSci(ledger.pocketThickness_m)}`
                  : "n/a"
              }
              unit="m"
            />
            <LedgerRow
              label="Planck margin"
              formula="margin = r_pocket / l_P"
              value={fmtSci(ledger.planckMargin)}
              unit="x l_P"
            />
            {ledger.vdbReason ? (
              <div className="mt-1 rounded border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[10px] text-sky-100">
                VdB guard reason: {ledger.vdbReason}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <footer className="border-t border-white/10 bg-black/40 px-4 py-2 text-[11px] text-slate-300/80">
        <div>
          GR proxy uses theta_GR and rho_GR = (K^2 - K_ij K_ij)/(16 pi) from the warp renderer;
          theta_drive is theta_GR weighted by the amplification chain and sector gating. This panel
          only reads the solved pipeline scalars; full field plots still live in the Hull 3D and
          Phoenix panels.
        </div>
      </footer>
    </div>
  );
}

function LedgerRow({
  label,
  formula,
  value,
  unit,
  highlight,
}: {
  label: string;
  formula: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[11px] font-semibold text-white">{label}</div>
        <div
          className={`text-[11px] font-mono ${
            highlight ? "text-amber-300" : "text-slate-100"
          }`}
        >
          {value}
          {unit ? <span className="ml-1 text-[10px] text-slate-400">{unit}</span> : null}
        </div>
      </div>
      <div className="text-[10px] text-slate-400">{formula}</div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 text-[10px] uppercase tracking-wide text-slate-400">
      <div className="h-px flex-1 bg-slate-600/40" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-slate-600/40" />
    </div>
  );
}
