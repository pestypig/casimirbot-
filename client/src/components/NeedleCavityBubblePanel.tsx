import { Badge } from "@/components/ui/badge";
import { useMathStageGate } from "@/hooks/useMathStageGate";
import { useProofPack } from "@/hooks/useProofPack";
import { STAGE_BADGE, STAGE_LABELS } from "@/lib/math-stage-gate";
import {
  PROOF_PACK_STAGE_REQUIREMENTS,
  getProofValue,
  readProofBoolean,
  readProofNumber,
  readProofString,
} from "@/lib/proof-pack";
import { cn } from "@/lib/utils";

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

const renderProxyBadge = (proxy: boolean) =>
  proxy ? (
    <Badge className="ml-2 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-200">
      PROXY
    </Badge>
  ) : null;

export function NeedleCavityBubblePanel() {
  const { data: pack, isLoading, error } = useProofPack({
    refetchInterval: 1000,
  });
  const stageGate = useMathStageGate(PROOF_PACK_STAGE_REQUIREMENTS, {
    staleTime: 30_000,
  });
  const stageLabel = stageGate.pending
    ? "STAGE..."
    : STAGE_LABELS[stageGate.stage];
  const stageProxy = !stageGate.ok || !pack;

  const proofNum = (key: string) => readProofNumber(pack, key);
  const proofBool = (key: string) => readProofBoolean(pack, key);
  const proofStr = (key: string) => readProofString(pack, key);
  const proxyFrom = (keys: string[]) =>
    stageProxy || keys.some((key) => Boolean(getProofValue(pack, key)?.proxy));

  const tileArea_m2 = proofNum("tile_area_m2");
  const gap_m = proofNum("gap_m");
  const gap_guard_m = proofNum("gap_guard_m");
  const cavityVolume_m3 = proofNum("cavity_volume_m3");
  const U_static_J = proofNum("U_static_J");
  const rho_tile_J_m3 = proofNum("rho_tile_J_m3");
  const casimir_Pa = proofNum("mechanical_casimir_pressure_Pa");
  const electrostatic_Pa = proofNum("mechanical_electrostatic_pressure_Pa");
  const restoring_Pa = proofNum("mechanical_restoring_pressure_Pa");
  const margin_Pa = proofNum("mechanical_margin_Pa");
  const maxStroke_pm = proofNum("mechanical_max_stroke_pm");

  const Lx_m = proofNum("hull_Lx_m");
  const Ly_m = proofNum("hull_Ly_m");
  const Lz_m = proofNum("hull_Lz_m");
  const R_geom_m = proofNum("R_geom_m");
  const R_metric_m = proofNum("bubble_R_m");
  const sigma = proofNum("bubble_sigma");
  const beta = proofNum("bubble_beta");
  const hullArea_m2 = proofNum("hull_area_m2");
  const N_tiles = proofNum("tile_count");
  const coverage = proofNum("coverage");
  const U_static_total_J = proofNum("U_static_total_J");
  const M_exotic_kg = proofNum("M_exotic_kg");
  const massCalibration = proofNum("mass_calibration");
  const rho_static_J_m3 = proofNum("rho_static_J_m3");
  const rho_inst_J_m3 = proofNum("rho_inst_J_m3");
  const rho_avg_J_m3 = proofNum("rho_avg_J_m3");
  const TS_ratio = proofNum("ts_ratio");
  const zeta = proofNum("zeta");
  const fordRomanOK = proofBool("ford_roman_ok");
  const natarioOK = proofBool("natario_ok");
  const thetaRaw = proofNum("theta_raw");
  const thetaCal = proofNum("theta_cal");
  const gammaVdB = proofNum("gamma_vdb");
  const gammaVdB_requested = proofNum("gamma_vdb_requested");
  const vdbLimit = proofNum("vdb_limit");
  const pocketRadius_m = proofNum("vdb_pocket_radius_m");
  const pocketThickness_m = proofNum("vdb_pocket_thickness_m");
  const planckMargin = proofNum("vdb_planck_margin");
  const vdbReason = proofStr("vdb_reason");

  const hullDimsValue =
    Lx_m != null && Ly_m != null && Lz_m != null
      ? `${fmtDim(Lx_m)} x ${fmtDim(Ly_m)} x ${fmtDim(Lz_m)}`
      : "n/a";

  const rhoValue =
    rho_static_J_m3 != null || rho_inst_J_m3 != null || rho_avg_J_m3 != null
      ? `${fmtSci(rho_static_J_m3)} | ${fmtSci(rho_inst_J_m3)} | ${fmtSci(rho_avg_J_m3)}`
      : "n/a";

  const thetaValue =
    thetaRaw != null || thetaCal != null
      ? `${fmtSci(thetaRaw)} raw / ${fmtSci(thetaCal)} cal`
      : "n/a";

  const vdbValue =
    gammaVdB != null && vdbLimit != null
      ? `${fmtSci(gammaVdB_requested ?? gammaVdB)} req / ${fmtSci(gammaVdB)} cal (limit ${fmtSci(vdbLimit)})`
      : "n/a";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#050915] text-slate-100">
      <header className="border-b border-white/10 bg-black/40 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">
              Needle Hull - Cavity vs. Bubble Ledger
            </div>
            <div className="mt-1 text-[11px] text-slate-300/80">
              Single Casimir cavity (tile) on the left, full needle-hull Casimir cloak and warp-bubble aggregates on the right. Values are sourced from the proof pack; PROXY flags indicate fallbacks or stage gating.
            </div>
            {isLoading ? (
              <div className="mt-2 text-[11px] text-slate-400">
                Loading proof pack...
              </div>
            ) : null}
            {error ? (
              <div className="mt-2 text-[11px] text-rose-300">
                Failed to load proof pack. Check /api/helix/pipeline/proofs.
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-400">
            <Badge
              variant="outline"
              className={cn("border px-2 py-0.5 text-[10px]", STAGE_BADGE[stageGate.stage])}
            >
              {stageLabel}
            </Badge>
            {stageProxy ? (
              <Badge className="border px-2 py-0.5 text-[10px] bg-slate-800 text-slate-200">
                PROXY
              </Badge>
            ) : null}
            <span>Proof pack</span>
          </div>
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
              Tile cavity is the atomic negative-energy source; everything else is scaled from this.
            </div>
          </div>
          <div className="flex-1 space-y-2 px-3 py-3 text-[11px]">
            <LedgerRow
              label="Tile area A_tile"
              formula="A_tile = tileArea_cm2 * 1e-4"
              value={fmtSci(tileArea_m2)}
              unit="m^2"
              proxy={proxyFrom(["tile_area_m2"])}
            />
            <LedgerRow
              label="Gap g"
              formula="g = gap_nm * 1e-9"
              value={fmtSci(gap_m)}
              unit="m"
              proxy={proxyFrom(["gap_m"])}
            />
            {gap_guard_m != null ? (
              <LedgerRow
                label="Guard gap g_guard"
                formula="g_guard = constrainedGap_nm * 1e-9 (mechanical guard)"
                value={fmtSci(gap_guard_m)}
                unit="m"
                proxy={proxyFrom(["gap_guard_m"])}
              />
            ) : null}
            <LedgerRow
              label="Cavity volume V_cav"
              formula="V_cav = A_tile * g"
              value={fmtSci(cavityVolume_m3)}
              unit="m^3"
              proxy={proxyFrom(["cavity_volume_m3"])}
            />
            <LedgerRow
              label="Static Casimir energy U_static"
              formula="U_static = -pi^2 hbar c A_tile / (720 g^3)"
              value={fmtSci(U_static_J)}
              unit="J"
              proxy={proxyFrom(["U_static_J"])}
            />
            <LedgerRow
              label="Tile energy density rho_tile"
              formula="rho_tile = U_static / V_cav"
              value={fmtSci(rho_tile_J_m3)}
              unit="J/m^3"
              proxy={proxyFrom(["rho_tile_J_m3"])}
            />
            <Divider label="Mechanical guard (per tile)" />
            <LedgerRow
              label="Casimir pressure P_C"
              formula="P_C = pi^2 hbar c / (240 g_guard^4)"
              value={fmtSci(casimir_Pa)}
              unit="Pa"
              proxy={proxyFrom(["mechanical_casimir_pressure_Pa"])}
            />
            <LedgerRow
              label="Electrostatic pressure P_ES"
              formula="P_ES = 1/2 eps0 (V_patch / g_guard)^2"
              value={fmtSci(electrostatic_Pa)}
              unit="Pa"
              proxy={proxyFrom(["mechanical_electrostatic_pressure_Pa"])}
            />
            <LedgerRow
              label="Restoring pressure P_rest"
              formula="P_rest = D * clearance / (k L^4)"
              value={fmtSci(restoring_Pa)}
              unit="Pa"
              proxy={proxyFrom(["mechanical_restoring_pressure_Pa"])}
            />
            <LedgerRow
              label="Margin (P_rest - P_load)"
              formula="P_margin = P_rest - (P_C + P_ES)"
              value={fmtSci(margin_Pa)}
              unit="Pa"
              highlight={margin_Pa != null && margin_Pa < 0}
              proxy={proxyFrom(["mechanical_margin_Pa"])}
            />
            <LedgerRow
              label="Max stroke s_max"
              formula="s_max = g_guard - roughness - delta_load"
              value={fmtSci(maxStroke_pm)}
              unit="pm"
              proxy={proxyFrom(["mechanical_max_stroke_pm"])}
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
              Ellipsoidal needle hull with a high-coverage Casimir cloak and Natario/Alcubierre wall profile. The bubble behaves more like a boat, displacing a volume of spacetime, rather than generating lift like a plane.
            </div>
          </div>
          <div className="flex-1 space-y-2 px-3 py-3 text-[11px]">
            <LedgerRow
              label="Hull dims Lx, Ly, Lz"
              formula="Needle hull box dimensions"
              value={hullDimsValue}
              unit="m"
              proxy={proxyFrom(["hull_Lx_m", "hull_Ly_m", "hull_Lz_m"])}
            />
            <LedgerRow
              label="Hull radius R_hull (geom)"
              formula="R_hull = (Lx * Ly * Lz)^(1/3) - display-only, not used by solver"
              value={fmtSci(R_geom_m)}
              unit="m"
              proxy={proxyFrom(["R_geom_m"])}
            />
            <LedgerRow
              label="Metric bubble radius R_metric"
              formula="R_metric = bubble.R or (a * b * c)^(1/3) (semi-axes) - used by solver"
              value={fmtSci(R_metric_m)}
              unit="m"
              proxy={proxyFrom(["bubble_R_m"])}
            />
            <LedgerRow
              label="Wall sharpness sigma"
              formula="f(r) = top-hat(sigma, R); df/dr from LUT"
              value={sigma != null ? sigma.toFixed(2) : "n/a"}
              proxy={proxyFrom(["bubble_sigma"])}
            />
            <LedgerRow
              label="Drive beta"
              formula="beta = v_ship / c (effective)"
              value={beta != null ? beta.toPrecision(3) : "n/a"}
              proxy={proxyFrom(["bubble_beta"])}
            />
            <Divider label="Cloak coverage & energy" />
            <LedgerRow
              label="Hull area A_hull"
              formula="A_hull from ellipsoid surface metric"
              value={fmtSci(hullArea_m2)}
              unit="m^2"
              proxy={proxyFrom(["hull_area_m2"])}
            />
            <LedgerRow
              label="Tile census N_tiles"
              formula="N_tiles from A_hull, A_tile, PACKING, RADIAL_LAYERS"
              value={N_tiles != null ? fmtSci(N_tiles, 4) : "n/a"}
              unit="-"
              proxy={proxyFrom(["tile_count"])}
            />
            <LedgerRow
              label="Coverage fraction f_cov"
              formula="f_cov = N_tiles * A_tile / (A_hull * packing * radialLayers)"
              value={coverage != null ? `${fmtPct(coverage)} (norm)` : "n/a"}
              unit="of hull"
              proxy={proxyFrom(["coverage"])}
            />
            <LedgerRow
              label="Total Casimir energy U_static,total"
              formula="U_static,total = N_tiles * U_static"
              value={fmtSci(U_static_total_J)}
              unit="J"
              proxy={proxyFrom(["U_static_total_J"])}
            />
            <LedgerRow
              label="Exotic mass M_exotic"
              formula="M_exotic = |U_static,total| * gamma_chain / c^2 (massCalibration applied)"
              value={
                M_exotic_kg != null
                  ? `${fmtSci(M_exotic_kg)}${massCalibration != null ? ` (cal factor ${fmtSci(massCalibration)})` : ""}`
                  : "n/a"
              }
              unit="kg"
              proxy={proxyFrom(["M_exotic_kg", "mass_calibration"])}
            />
            <LedgerRow
              label="rho_static / rho_inst / rho_avg"
              formula="Pipeline energy densities in shell"
              value={rhoValue}
              unit="J/m^3"
              proxy={proxyFrom(["rho_static_J_m3", "rho_inst_J_m3", "rho_avg_J_m3"])}
            />
            <Divider label="GR proxy & guardrails" />
            <LedgerRow
              label="TS ratio"
              formula="TS_ratio = (L_long / c) / (1 / f_mod)"
              value={fmtSci(TS_ratio)}
              unit="-"
              proxy={proxyFrom(["ts_ratio"])}
            />
            <LedgerRow
              label="Ford-Roman QI zeta"
              formula="zeta = sampledIntegral / bound (zeta <= 1)"
              value={fmtSci(zeta)}
              unit={fordRomanOK == null ? "n/a" : fordRomanOK ? "ok" : "violation"}
              highlight={fordRomanOK === false}
              proxy={proxyFrom(["zeta", "ford_roman_ok"])}
            />
            <LedgerRow
              label="Natario constraint"
              formula="Enforced in warp module / sampler"
              value={
                natarioOK == null
                  ? "n/a"
                  : natarioOK
                    ? "satisfied"
                    : "violated"
              }
              unit="-"
              highlight={natarioOK === false}
              proxy={proxyFrom(["natario_ok"])}
            />
            <LedgerRow
              label="FR amplification theta_chain"
              formula="theta_raw = gamma_geo^3 * qSpoil * gamma_VdB(raw) * d_eff; theta_cal uses clamped gamma_VdB"
              value={thetaValue}
              unit="-"
              proxy={proxyFrom(["theta_raw", "theta_cal"])}
            />
            <LedgerRow
              label="Van den Broeck limit"
              formula="gamma_VdB <= limit = r_min / pocketFloor"
              value={vdbValue}
              unit="-"
              proxy={proxyFrom(["gamma_vdb_requested", "gamma_vdb", "vdb_limit"])}
            />
            <LedgerRow
              label="Pocket radius / thickness"
              formula="r_pocket = r_min / gamma_VdB, t_pocket = wall / gamma_VdB"
              value={
                pocketRadius_m != null && pocketThickness_m != null
                  ? `${fmtSci(pocketRadius_m)} / ${fmtSci(pocketThickness_m)}`
                  : "n/a"
              }
              unit="m"
              proxy={proxyFrom(["vdb_pocket_radius_m", "vdb_pocket_thickness_m"])}
            />
            <LedgerRow
              label="Planck margin"
              formula="margin = r_pocket / l_P"
              value={fmtSci(planckMargin)}
              unit="x l_P"
              proxy={proxyFrom(["vdb_planck_margin"])}
            />
            {vdbReason ? (
              <div className="mt-1 rounded border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[10px] text-sky-100">
                VdB guard reason: {vdbReason}
                {renderProxyBadge(proxyFrom(["vdb_reason"]))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <footer className="border-t border-white/10 bg-black/40 px-4 py-2 text-[11px] text-slate-300/80">
        <div>
          GR proxy uses theta_GR and rho_GR = (K^2 - K_ij K_ij)/(16 pi) from the warp renderer; theta_drive is theta_GR weighted by the amplification chain and sector gating. This panel reads proof-pack scalars; full field plots still live in the Hull 3D and Phoenix panels.
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
  proxy,
}: {
  label: string;
  formula: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  proxy?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white">
          {label}
          {renderProxyBadge(Boolean(proxy))}
        </div>
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
