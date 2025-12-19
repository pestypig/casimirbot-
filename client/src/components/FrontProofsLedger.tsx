import * as React from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import type { EnergyPipelineSnapshot } from "@/hooks/use-energy-pipeline";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FALLBACK_HULL = { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.019986 };

function fmtExp(v: number | null | undefined, digits = 3): string {
  if (!Number.isFinite(v as number)) return "--";
  return (v as number).toExponential(digits);
}

function fmtFixed(v: number | null | undefined, digits = 3): string {
  if (!Number.isFinite(v as number)) return "--";
  return (v as number).toFixed(digits);
}

type GuardStatus = "pass" | "warn" | "fail" | "na";

interface LedgerRow {
  id: string;
  label: string;
  equation: string;
  value: string;
  guard?: GuardStatus;
  guardLabel?: string;
}

function guardBadge(status: GuardStatus | undefined, label?: string) {
  if (!status || status === "na") return null;
  let klass =
    status === "pass"
      ? "bg-emerald-500/20 text-emerald-300"
      : status === "warn"
      ? "bg-amber-500/20 text-amber-300"
      : "bg-rose-500/20 text-rose-300";

  return (
    <Badge className={cn("ml-2 px-2 py-0.5 text-[10px] leading-tight", klass)}>
      {label ?? status.toUpperCase()}
    </Badge>
  );
}

function buildLedgerRows(snap?: EnergyPipelineSnapshot | null): LedgerRow[] {
  if (!snap) return [];

  const uExplain: any = (snap as any).uniformsExplain ?? {};
  const eq = uExplain.equations ?? {};

  // Hull / geometry
  const hullRaw = snap.hull ?? {};
  const Lx = Number.isFinite(hullRaw.Lx_m) ? Number(hullRaw.Lx_m) : FALLBACK_HULL.Lx_m;
  const Ly = Number.isFinite(hullRaw.Ly_m) ? Number(hullRaw.Ly_m) : FALLBACK_HULL.Ly_m;
  const Lz = Number.isFinite(hullRaw.Lz_m) ? Number(hullRaw.Lz_m) : FALLBACK_HULL.Lz_m;
  const a = Lx;
  const b = Ly;
  const c = Lz;
  const R_geom = Math.cbrt(a * b * c);

  // Amplification chain
  const gc = snap.gammaChain ?? {};
  const qGain = gc.qGain ?? Math.sqrt((snap.qCavity ?? 1e9) / 1e9);

  const thetaRaw = (snap as any).thetaRaw as number | undefined;
  const thetaCal = (snap as any).thetaCal as number | undefined;

  // Guards
  const vdb = snap.gammaVanDenBroeckGuard;
  const mech = snap.mechanical;
  const qiGuard = snap.qiGuardrail;
  const zeta = snap.zeta;
  const TS = snap.TS_ratio;
  const fordOk = !!snap.fordRomanCompliance;

  const rows: LedgerRow[] = [];

  // Geometry row
  rows.push({
    id: "geom-R",
    label: "Bubble radius R",
    equation: eq.R ?? "R = (Lx · Ly · Lz)^{1/3}",
    value: `R = ${fmtFixed(R_geom, 3)} m  (Lx=${fmtFixed(a, 1)}, Ly=${fmtFixed(b, 1)}, Lz=${fmtFixed(c, 1)})`,
    guard: "na",
  });

  // Effective duty
  const dutyEff =
    (snap as any).dutyEffectiveFR ??
    (snap as any).dutyEffective_FR ??
    snap.dutyCycle ??
    NaN;
  const S_live = (snap as any).concurrentSectors ?? snap.activeSectors ?? 1;
  const S_total = snap.sectorCount ?? 400;

  rows.push({
    id: "d_eff",
    label: "FR duty d_eff",
    equation: eq.d_eff ?? "d_eff = burstLocal × S_live / S_total",
    value: `d_eff = ${fmtExp(dutyEff, 3)}  (S_live=${S_live}, S_total=${S_total})`,
    guard: TS > 1 ? "pass" : "fail",
    guardLabel: TS > 1 ? "TS>1" : "TS<=1",
  });

  // Amplification ladder (theta)
  rows.push({
    id: "theta",
    label: "Amplification θ",
    equation: eq.theta_expected ?? "θ_expected = γ_geo^3 · qSpoil · γ_VdB · d_eff",
    value: [
      `γ_geo^3 = ${fmtExp(gc.geo_cubed ?? Math.pow(snap.gammaGeo ?? 1, 3), 3)}`,
      `√(Q/1e9) = ${fmtFixed(qGain, 3)}`,
      `γ_VdB = ${fmtExp(snap.gammaVanDenBroeck, 3)}`,
      `d_eff = ${fmtExp(dutyEff, 3)}`,
      `=> θ_raw = ${fmtExp(thetaRaw, 3)}, θ_cal = ${fmtExp(thetaCal, 3)}`,
    ].join(" · "),
    guard: fordOk ? "pass" : "fail",
    guardLabel: fordOk ? "FR OK" : "FR FAIL",
  });

  // Static -> geo -> Q -> duty chain
  rows.push({
    id: "U_chain",
    label: "Casimir energy ladder",
    equation:
      (eq.U_static ?? "U_static = χ · [−π^2ħc/(720a^3)] · A_tile") +
      ", " +
      (eq.U_geo ?? "U_geo = γ_geo^3 · U_static") +
      ", " +
      (eq.U_Q ?? "U_Q = q_mech · U_geo") +
      ", " +
      (eq.P_avg ?? "P_avg = |U_Q| · ω/Q · N_tiles · d_eff"),
    value: [
      `U_static = ${fmtExp(snap.U_static, 3)} J`,
      `U_geo = ${fmtExp(snap.U_geo, 3)} J`,
      `U_Q = ${fmtExp(snap.U_Q, 3)} J`,
      `U_cycle = ${fmtExp(snap.U_cycle, 3)} J`,
      `P_avg = ${fmtExp(snap.P_avg, 3)} MW`,
    ].join("  ·  "),
    guard: "na",
  });

  // Exotic mass
  rows.push({
    id: "M_exotic",
    label: "Exotic mass",
    equation: eq.M_exotic ?? "M = |U_static| · γ_geo^3 · Q_burst · γ_VdB · d_eff · N_tiles / c^2",
    value: `M_exotic = ${fmtExp(snap.M_exotic, 3)} kg  (raw=${fmtExp(snap.M_exotic_raw, 3)}, cal=${fmtExp(snap.massCalibration, 3)})`,
    guard: "na",
  });

  // Time-scale separation
  rows.push({
    id: "TS_ratio",
    label: "Time-scale separation",
    equation: eq.TS_long ?? "TS_long = (L_long / c) / (1/f_m), TS_ratio = TS_long",
    value: `TS_ratio = ${fmtExp(TS, 3)}  (TS_geom=${fmtExp(snap.TS_geom, 3)})`,
    guard: TS > 1 ? (TS > 1e3 ? "pass" : "warn") : "fail",
    guardLabel: TS > 1e3 ? "homog." : TS > 1 ? "borderline" : "bad",
  });

  // Ford–Roman / QI zeta
  rows.push({
    id: "zeta",
    label: "Ford–Roman (QI) scalar",
    equation: "zeta = sampledIntegral / bound  (require zeta <= 1)",
    value: `zeta = ${fmtFixed(zeta, 3)} (${snap.fordRomanCompliance ? "<= 1" : "> 1"})`,
    guard: snap.fordRomanCompliance ? "pass" : "fail",
    guardLabel: snap.fordRomanCompliance ? "FR OK" : "FR FAIL",
  });

  // Quantum Interest book (debt / credit)
  if (qiGuard && snap.qiInterest) {
    rows.push({
      id: "qi_interest",
      label: "Quantum interest",
      equation: "margin_Jm3 = credit_Jm3 - debt_Jm3  (require margin >= 0 over window)",
      value: `neg=${fmtExp(snap.qiInterest.neg_Jm3, 3)}  pos=${fmtExp(snap.qiInterest.pos_Jm3, 3)}  debt=${fmtExp(snap.qiInterest.debt_Jm3, 3)}  credit=${fmtExp(snap.qiInterest.credit_Jm3, 3)}  => margin=${fmtExp(snap.qiInterest.margin_Jm3, 3)} J/m^3`,
      guard: snap.qiInterest.margin_Jm3 >= 0 ? "pass" : "fail",
      guardLabel: snap.qiInterest.margin_Jm3 >= 0 ? "paid" : "unpaid",
    });
  }

  // Van den Broeck guard
  if (vdb) {
    rows.push({
      id: "vdb_guard",
      label: "Van den Broeck pocket",
      equation:
        "γ_VdB <= limit,  pocketRadius = a_min / γ_VdB,  pocketThickness = pocketRadius - floor,  planckMargin >= 1",
      value: [
        `γ_VdB(requested) = ${fmtExp(vdb.requested ?? snap.gammaVanDenBroeck, 3)}`,
        `limit = ${fmtExp(vdb.limit, 3)}`,
        `pocketRadius = ${fmtExp(vdb.pocketRadius_m, 3)} m`,
        `pocketThickness = ${fmtExp(vdb.pocketThickness_m, 3)} m`,
        `planckMargin = ${fmtExp(vdb.planckMargin, 3)}`,
        `reason = ${vdb.reason}`,
      ].join("  ·  "),
      guard: vdb.admissible ? "pass" : "fail",
      guardLabel: vdb.admissible ? "admissible" : "clamped",
    });
  }

  // Mechanical feasibility (single tile)
  if (mech) {
    const hasMarginDeficit = Number.isFinite(mech.margin_Pa) && (mech.margin_Pa as number) < 0;
    let guardStatus: "pass" | "fail" | "warn";
    let guardLabel: string;
    if (mech.feasible && mech.strokeFeasible) {
      guardStatus = "pass";
      guardLabel = "OK";
    } else if (mech.safetyFeasible === false) {
      guardStatus = "fail";
      guardLabel = "overload";
    } else if (hasMarginDeficit) {
      guardStatus = "fail";
      guardLabel = "stiffness";
    } else if (mech.strokeFeasible === false) {
      guardStatus = "warn";
      guardLabel = "stroke";
    } else {
      guardStatus = "warn";
      guardLabel = "clearance";
    }

    rows.push({
      id: "mech_guard",
      label: "Mechanical tile guard",
      equation: "S_mech = sigma_allow / P_load, require S_mech >= S_min and stroke <= maxStroke",
      value: [
        `gap_req = ${fmtFixed(mech.requestedGap_nm, 1)} nm`,
        `gap_eff = ${fmtFixed(mech.constrainedGap_nm ?? mech.requestedGap_nm, 1)} nm`,
        `S_mech = ${fmtExp(mech.mechSafetyFactor ?? NaN, 3)}${Number.isFinite(mech.safetyFactorMin) ? ` (min ${fmtFixed(mech.safetyFactorMin as number, 2)})` : ""}`,
        `P_load = ${fmtExp(mech.loadPressure_Pa ?? NaN, 3)} Pa`,
        `sigma_allow = ${fmtExp(mech.sigmaAllow_Pa ?? NaN, 3)} Pa`,
        `P_Casimir = ${fmtExp(mech.casimirPressure_Pa, 3)} Pa`,
        `P_ES = ${fmtExp(mech.electrostaticPressure_Pa, 3)} Pa`,
        `maxStroke = ${fmtFixed(mech.maxStroke_pm, 1)} pm`,
        `strokeFeasible = ${mech.strokeFeasible ? "yes" : "no"}`,
      ].join("  |  "),
      guard: guardStatus,
      guardLabel,
    });
  }

  return rows;
}

export function FrontProofsLedger() {
  const { data: snap, isLoading, error } = useEnergyPipeline({
    refetchInterval: 5000,
  });

  const rows = buildLedgerRows(snap);

  return (
    <Card className="bg-slate-950/80 border-cyan-500/40">
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between gap-3">
          <span className="text-sm uppercase tracking-[0.2em] text-cyan-300">FRONT PROOFS</span>
          <span className="text-xs text-slate-400">Math Ledger (live pipeline snapshot)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {isLoading && <div className="text-slate-400">Loading pipeline…</div>}
        {error && <div className="text-rose-400">Failed to load pipeline state. Check /api/helix/pipeline.</div>}
        {!isLoading && !error && rows.length === 0 && (
          <div className="text-slate-400">No ledger rows available (pipeline snapshot empty).</div>
        )}
        {rows.length > 0 && (
          <div className="divide-y divide-slate-800">
            {rows.map((row) => (
              <div key={row.id} className="py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="font-semibold text-slate-100">
                    {row.label}
                    {guardBadge(row.guard, row.guardLabel)}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">{row.equation}</div>
                </div>
                <div className="font-mono text-[11px] text-slate-200 break-words">{row.value}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FrontProofsLedger;
