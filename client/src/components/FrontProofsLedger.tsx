import * as React from "react";
import type { ProofPack } from "@shared/schema";
import { useProofPack } from "@/hooks/useProofPack";
import { useMathStageGate } from "@/hooks/useMathStageGate";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROOF_PACK_STAGE_REQUIREMENTS,
  getProofValue,
  readProofBoolean,
  readProofNumber,
  readProofString,
} from "@/lib/proof-pack";
import { STAGE_BADGE, STAGE_LABELS } from "@/lib/math-stage-gate";

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
  proxy?: boolean;
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

function proxyBadge(proxy?: boolean) {
  if (!proxy) return null;
  return (
    <Badge className="ml-2 px-2 py-0.5 text-[10px] leading-tight bg-slate-800 text-slate-300">
      PROXY
    </Badge>
  );
}

function buildLedgerRows(
  pack?: ProofPack | null,
  stageProxy = false,
): LedgerRow[] {
  if (!pack) return [];

  const eq = pack.equations ?? {};
  const isProxy = (key: string) =>
    Boolean(getProofValue(pack, key)?.proxy) || stageProxy;
  const readNum = (key: string) => readProofNumber(pack, key);
  const readBool = (key: string) => readProofBoolean(pack, key);
  const readStr = (key: string) => readProofString(pack, key);
  const proxyFrom = (keys: string[]) => keys.some(isProxy);

  // Hull / geometry
  const Lx = readNum("hull_Lx_m");
  const Ly = readNum("hull_Ly_m");
  const Lz = readNum("hull_Lz_m");
  const a = Lx;
  const b = Ly;
  const c = Lz;
  const R_geom = readNum("R_geom_m");

  // Amplification chain
  const qGain = readNum("q_gain");
  const gammaGeoCubed = readNum("gamma_geo_cubed");
  const gammaVdb = readNum("gamma_vdb");
  const dutyEff = readNum("duty_effective");
  const dutyBurst = readNum("duty_burst");
  const thetaRaw = readNum("theta_raw");
  const thetaCal = readNum("theta_cal");

  // Guards
  const vdb = {
    requested: readNum("gamma_vdb_requested"),
    limit: readNum("vdb_limit"),
    pocketRadius_m: readNum("vdb_pocket_radius_m"),
    pocketThickness_m: readNum("vdb_pocket_thickness_m"),
    planckMargin: readNum("vdb_planck_margin"),
    reason: readStr("vdb_reason") ?? null,
    admissible: readBool("vdb_admissible"),
  };
  const mech = {
    requestedGap_nm: readNum("mechanical_gap_req_nm"),
    constrainedGap_nm: readNum("mechanical_gap_eff_nm"),
    mechSafetyFactor: readNum("mechanical_safety_factor"),
    safetyFactorMin: readNum("mechanical_safety_min"),
    loadPressure_Pa: readNum("mechanical_load_pressure_Pa"),
    sigmaAllow_Pa: readNum("mechanical_sigma_allow_Pa"),
    casimirPressure_Pa: readNum("mechanical_casimir_pressure_Pa"),
    electrostaticPressure_Pa: readNum("mechanical_electrostatic_pressure_Pa"),
    maxStroke_pm: readNum("mechanical_max_stroke_pm"),
    strokeFeasible: readBool("mechanical_stroke_feasible"),
    feasible: readBool("mechanical_feasible"),
    safetyFeasible: readBool("mechanical_safety_feasible"),
    margin_Pa: readNum("mechanical_margin_Pa"),
  };
  const qiGuard = readNum("qi_interest_margin_Jm3") != null;
  const zeta = readNum("zeta");
  const TS = readNum("ts_ratio");
  const fordOk = readBool("ford_roman_ok");

  const rows: LedgerRow[] = [];

  // Geometry row
  rows.push({
    id: "geom-R",
    label: "Bubble radius R",
    equation: eq.R ?? "R = (Lx * Ly * Lz)^(1/3)",
    value: `R = ${fmtFixed(R_geom, 3)} m  (Lx=${fmtFixed(a, 1)}, Ly=${fmtFixed(b, 1)}, Lz=${fmtFixed(c, 1)})`,
    guard: "na",
    proxy: proxyFrom(["R_geom_m", "hull_Lx_m", "hull_Ly_m", "hull_Lz_m"]),
  });

  // Effective duty
  const S_live = readNum("sectors_live");
  const S_total = readNum("sectors_total");
  const dutyGuard = typeof TS === "number" ? (TS > 1 ? "pass" : "fail") : "na";
  rows.push({
    id: "d_eff",
    label: "FR duty d_eff",
    equation: eq.d_eff ?? "d_eff = d_burst * S_live / S_total",
    value: `d_eff = ${fmtExp(dutyEff, 3)}  (d_burst=${fmtExp(dutyBurst, 3)}, S_live=${fmtExp(S_live, 0)}, S_total=${fmtExp(S_total, 0)})`,
    guard: dutyGuard,
    guardLabel:
      dutyGuard === "pass" ? "TS>1" : dutyGuard === "fail" ? "TS<=1" : undefined,
    proxy: proxyFrom([
      "duty_effective",
      "duty_burst",
      "sectors_live",
      "sectors_total",
    ]),
  });

  // Amplification ladder (theta)
  rows.push({
    id: "theta",
    label: "Amplification theta",
    equation:
      eq.theta_expected ??
      "theta_expected = gamma_geo^3 * q_spoil * gamma_vdb * d_eff",
    value: [
      `gamma_geo^3 = ${fmtExp(gammaGeoCubed, 3)}`,
      `sqrt(Q/1e9) = ${fmtFixed(qGain, 3)}`,
      `gamma_VdB = ${fmtExp(gammaVdb, 3)}`,
      `d_eff = ${fmtExp(dutyEff, 3)}`,
      `=> theta_raw = ${fmtExp(thetaRaw, 3)}, theta_cal = ${fmtExp(thetaCal, 3)}`,
    ].join(" * "),
    guard: fordOk === true ? "pass" : fordOk === false ? "fail" : "na",
    guardLabel:
      fordOk === true ? "FR OK" : fordOk === false ? "FR FAIL" : undefined,
    proxy: proxyFrom(
      [
        "gamma_geo",
        "gamma_geo_cubed",
        "q_gain",
        "q_cavity",
        "q_spoil",
        "gamma_vdb",
        "duty_effective",
        "theta_raw",
        "theta_cal",
      ],
    ),
  });

  // Static -> geo -> Q -> duty chain
  rows.push({
    id: "U_chain",
    label: "Casimir energy ladder",
    equation:
      (eq.U_static ?? "U_static = chi * [-pi^2 hbar c/(720 a^3)] * A_tile") +
      ", " +
      (eq.U_geo ?? "U_geo = gamma_geo^3 * U_static") +
      ", " +
      (eq.U_Q ?? "U_Q = q_mech * U_geo") +
      ", " +
      (eq.P_avg ?? "P_avg = |U_Q| * omega/Q * N_tiles * d_eff"),
    value: [
      `U_static = ${fmtExp(readNum("U_static_J"), 3)} J`,
      `U_geo = ${fmtExp(readNum("U_geo_J"), 3)} J`,
      `U_Q = ${fmtExp(readNum("U_Q_J"), 3)} J`,
      `U_cycle = ${fmtExp(readNum("U_cycle_J"), 3)} J`,
      `P_avg = ${fmtExp(readNum("power_avg_MW"), 3)} MW`,
    ].join("  *  "),
    guard: "na",
    proxy: proxyFrom(
      ["U_static_J", "U_geo_J", "U_Q_J", "U_cycle_J", "power_avg_MW"],
    ),
  });

  // Exotic mass
  rows.push({
    id: "M_exotic",
    label: "Exotic mass",
    equation:
      eq.M_exotic ??
      "M = |U_static| * gamma_geo^3 * Q_burst * gamma_vdb * d_eff * N_tiles / c^2",
    value: `M_exotic = ${fmtExp(readNum("M_exotic_kg"), 3)} kg  (raw=${fmtExp(readNum("M_exotic_raw_kg"), 3)}, cal=${fmtExp(readNum("mass_calibration"), 3)})`,
    guard: "na",
    proxy: proxyFrom(["M_exotic_kg", "M_exotic_raw_kg", "mass_calibration"]),
  });

  // Time-scale separation
  rows.push({
    id: "TS_ratio",
    label: "Time-scale separation",
    equation: eq.TS_long ?? "TS_ratio = (L_long / c) / (1/f_m)",
    value: `TS_ratio = ${fmtExp(TS, 3)}`,
    guard:
      typeof TS === "number"
        ? TS > 1
          ? TS > 1e3
            ? "pass"
            : "warn"
          : "fail"
        : "na",
    guardLabel:
      typeof TS === "number"
        ? TS > 1e3
          ? "homog."
          : TS > 1
            ? "borderline"
            : "bad"
        : undefined,
    proxy: proxyFrom(["ts_ratio"]),
  });

  // Ford-Roman / QI zeta
  rows.push({
    id: "zeta",
    label: "Ford-Roman (QI) scalar",
    equation: "zeta = sampledIntegral / bound  (require zeta <= 1)",
    value: `zeta = ${fmtFixed(zeta, 3)} (${fordOk === true ? "<= 1" : fordOk === false ? "> 1" : "n/a"})`,
    guard: fordOk === true ? "pass" : fordOk === false ? "fail" : "na",
    guardLabel:
      fordOk === true ? "FR OK" : fordOk === false ? "FR FAIL" : undefined,
    proxy: proxyFrom(["zeta", "ford_roman_ok"]),
  });

  // Quantum Interest book (debt / credit)
  if (qiGuard) {
    const qiNeg = readNum("qi_interest_neg_Jm3");
    const qiPos = readNum("qi_interest_pos_Jm3");
    const qiDebt = readNum("qi_interest_debt_Jm3");
    const qiCredit = readNum("qi_interest_credit_Jm3");
    const qiMargin = readNum("qi_interest_margin_Jm3");
    rows.push({
      id: "qi_interest",
      label: "Quantum interest",
      equation:
        "margin_Jm3 = credit_Jm3 - debt_Jm3  (require margin >= 0 over window)",
      value: `neg=${fmtExp(qiNeg, 3)}  pos=${fmtExp(qiPos, 3)}  debt=${fmtExp(qiDebt, 3)}  credit=${fmtExp(qiCredit, 3)}  => margin=${fmtExp(qiMargin, 3)} J/m^3`,
      guard:
        typeof qiMargin === "number"
          ? qiMargin >= 0
            ? "pass"
            : "fail"
          : "na",
      guardLabel:
        typeof qiMargin === "number"
          ? qiMargin >= 0
            ? "paid"
            : "unpaid"
          : undefined,
      proxy: proxyFrom(
        [
          "qi_interest_neg_Jm3",
          "qi_interest_pos_Jm3",
          "qi_interest_debt_Jm3",
          "qi_interest_credit_Jm3",
          "qi_interest_margin_Jm3",
        ],
      ),
    });
  }

  // Van den Broeck guard
  rows.push({
    id: "vdb_guard",
    label: "Van den Broeck pocket",
    equation:
      "gamma_VdB <= limit, pocketRadius = a_min / gamma_VdB, pocketThickness = pocketRadius - floor, planckMargin >= 1",
    value: [
      `gamma_VdB(requested) = ${fmtExp(vdb.requested, 3)}`,
      `limit = ${fmtExp(vdb.limit, 3)}`,
      `pocketRadius = ${fmtExp(vdb.pocketRadius_m, 3)} m`,
      `pocketThickness = ${fmtExp(vdb.pocketThickness_m, 3)} m`,
      `planckMargin = ${fmtExp(vdb.planckMargin, 3)}`,
      `reason = ${vdb.reason ?? "n/a"}`,
    ].join("  *  "),
    guard:
      vdb.admissible === true
        ? "pass"
        : vdb.admissible === false
          ? "fail"
          : "na",
    guardLabel:
      vdb.admissible === true
        ? "admissible"
        : vdb.admissible === false
          ? "clamped"
          : undefined,
    proxy: proxyFrom(
      [
        "gamma_vdb_requested",
        "vdb_limit",
        "vdb_pocket_radius_m",
        "vdb_pocket_thickness_m",
        "vdb_planck_margin",
        "vdb_reason",
        "vdb_admissible",
      ],
    ),
  });

  // Mechanical feasibility (single tile)
  const hasMarginDeficit =
    Number.isFinite(mech.margin_Pa) && (mech.margin_Pa as number) < 0;
  let guardStatus: "pass" | "fail" | "warn" | "na";
  let guardLabel: string | undefined;
  if (
    mech.feasible == null &&
    mech.strokeFeasible == null &&
    mech.safetyFeasible == null &&
    mech.margin_Pa == null
  ) {
    guardStatus = "na";
    guardLabel = "missing";
  } else if (mech.feasible && mech.strokeFeasible) {
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
    equation:
      "S_mech = sigma_allow / P_load, require S_mech >= S_min and stroke <= maxStroke",
    value: [
      `gap_req = ${fmtFixed(mech.requestedGap_nm, 1)} nm`,
      `gap_eff = ${fmtFixed(mech.constrainedGap_nm ?? mech.requestedGap_nm, 1)} nm`,
      `S_mech = ${fmtExp(mech.mechSafetyFactor ?? NaN, 3)}${Number.isFinite(mech.safetyFactorMin) ? ` (min ${fmtFixed(mech.safetyFactorMin as number, 2)})` : ""}`,
      `P_load = ${fmtExp(mech.loadPressure_Pa ?? NaN, 3)} Pa`,
      `sigma_allow = ${fmtExp(mech.sigmaAllow_Pa ?? NaN, 3)} Pa`,
      `P_Casimir = ${fmtExp(mech.casimirPressure_Pa, 3)} Pa`,
      `P_ES = ${fmtExp(mech.electrostaticPressure_Pa, 3)} Pa`,
      `maxStroke = ${fmtFixed(mech.maxStroke_pm, 1)} pm`,
      `strokeFeasible = ${
        mech.strokeFeasible == null
          ? "n/a"
          : mech.strokeFeasible
            ? "yes"
            : "no"
      }`,
    ].join("  |  "),
    guard: guardStatus === "na" ? "na" : guardStatus,
    guardLabel,
    proxy: proxyFrom(
      [
        "mechanical_gap_req_nm",
        "mechanical_gap_eff_nm",
        "mechanical_safety_factor",
        "mechanical_safety_min",
        "mechanical_load_pressure_Pa",
        "mechanical_sigma_allow_Pa",
        "mechanical_casimir_pressure_Pa",
        "mechanical_electrostatic_pressure_Pa",
        "mechanical_max_stroke_pm",
        "mechanical_stroke_feasible",
        "mechanical_feasible",
        "mechanical_safety_feasible",
        "mechanical_margin_Pa",
      ],
    ),
  });

  return rows;
}

export function FrontProofsLedger() {
  const { data: pack, isLoading, error } = useProofPack({
    refetchInterval: 5000,
  });
  const stageGate = useMathStageGate(PROOF_PACK_STAGE_REQUIREMENTS, {
    staleTime: 30_000,
  });
  const stageLabel = stageGate.pending
    ? "STAGE..."
    : STAGE_LABELS[stageGate.stage];
  const rows = buildLedgerRows(pack, !stageGate.ok);

  return (
    <Card className="bg-slate-950/80 border-cyan-500/40">
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between gap-3">
          <span className="text-sm uppercase tracking-[0.2em] text-cyan-300">
            FRONT PROOFS
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <Badge
              variant="outline"
              className={cn(
                "border px-2 py-0.5 text-[10px]",
                STAGE_BADGE[stageGate.stage],
              )}
            >
              {stageLabel}
            </Badge>
            {proxyBadge(!stageGate.ok)}
            <span>Math Ledger (proof pack)</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {isLoading && <div className="text-slate-400">Loading proof pack...</div>}
        {error && (
          <div className="text-rose-400">
            Failed to load proof pack. Check /api/helix/pipeline/proofs.
          </div>
        )}
        {!isLoading && !error && rows.length === 0 && (
          <div className="text-slate-400">
            No ledger rows available (proof pack empty).
          </div>
        )}
        {rows.length > 0 && (
          <div className="divide-y divide-slate-800">
            {rows.map((row) => (
              <div key={row.id} className="py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="font-semibold text-slate-100">
                    {row.label}
                    {guardBadge(row.guard, row.guardLabel)}
                    {proxyBadge(row.proxy)}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    {row.equation}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-slate-200 break-words">
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FrontProofsLedger;
