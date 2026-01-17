// client/src/components/WarpProofPanel.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FrontProofsLedger } from "@/components/FrontProofsLedger";
import { useProofPack } from "@/hooks/useProofPack";
import { useMathStageGate } from "@/hooks/useMathStageGate";
import {
  PROOF_PACK_STAGE_REQUIREMENTS,
  getProofValue,
  readProofBoolean,
  readProofNumber,
  readProofString,
} from "@/lib/proof-pack";
import { STAGE_BADGE, STAGE_LABELS } from "@/lib/math-stage-gate";
import { fmtSci } from "@/lib/warp-proof-math";

const proxyBadge = (proxy: boolean) =>
  proxy ? (
    <Badge className="ml-2 px-2 py-0.5 text-[10px] leading-tight bg-slate-800 text-slate-300">
      PROXY
    </Badge>
  ) : null;

export function WarpProofPanel() {
  const { data: pack, isLoading, error } = useProofPack({
    refetchInterval: 5_000,
    staleTime: 10_000,
  });
  const stageGate = useMathStageGate(PROOF_PACK_STAGE_REQUIREMENTS, {
    staleTime: 30_000,
  });
  const stageLabel = stageGate.pending
    ? "STAGE..."
    : STAGE_LABELS[stageGate.stage];
  const baseProxy = !stageGate.ok || !pack;
  const isProxy = (key: string) =>
    baseProxy || Boolean(getProofValue(pack, key)?.proxy);
  const proxyFrom = (keys: string[]) => baseProxy || keys.some(isProxy);

  const readNum = (key: string) => readProofNumber(pack, key);
  const readBool = (key: string) => readProofBoolean(pack, key);
  const readStr = (key: string) => readProofString(pack, key);

  const hull = {
    Lx_m: readNum("hull_Lx_m"),
    Ly_m: readNum("hull_Ly_m"),
    Lz_m: readNum("hull_Lz_m"),
    wallThickness_m: readNum("hull_wall_m"),
  };

  const gammaRequested = readNum("gamma_vdb_requested") ?? readNum("gamma_vdb");
  const vdb = {
    limit: readNum("vdb_limit"),
    pocketRadius_m: readNum("vdb_pocket_radius_m"),
    pocketThickness_m: readNum("vdb_pocket_thickness_m"),
    planckMargin: readNum("vdb_planck_margin"),
    admissible: readBool("vdb_admissible"),
    reason: readStr("vdb_reason"),
  };
  const vdbProxy = proxyFrom([
    "gamma_vdb_requested",
    "gamma_vdb",
    "vdb_limit",
    "vdb_pocket_radius_m",
    "vdb_pocket_thickness_m",
    "vdb_planck_margin",
    "vdb_admissible",
    "vdb_reason",
  ]);

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
  const mechProxy = proxyFrom([
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
  ]);

  const kappaDrive = readNum("kappa_drive");
  const kappaPower = readNum("power_avg_W");
  const kappaArea = readNum("hull_area_m2");
  const kappaDuty = readNum("duty_effective");
  const kappaGain = readNum("kappa_drive_gain") ?? readNum("gamma_geo");
  const kappaProxy = proxyFrom([
    "kappa_drive",
    "power_avg_W",
    "hull_area_m2",
    "duty_effective",
    "kappa_drive_gain",
    "gamma_geo",
  ]);

  const exoticStatus = readStr("overall_status") as
    | "NOMINAL"
    | "WARNING"
    | "CRITICAL"
    | undefined;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#050915] text-slate-100">
      <header className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">
              Warp Proof Panel - Needle Hull Guardrails
            </div>
            <div className="text-[11px] text-slate-300/80">
              Proof metrics are read from the pipeline proof pack, with stage and
              proxy markers for maturity.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border px-2 py-0.5 text-[10px]",
                STAGE_BADGE[stageGate.stage],
              )}
            >
              {stageLabel}
            </Badge>
            {proxyBadge(!stageGate.ok || !pack)}
            {exoticStatus && (
              <span
                className={
                  "rounded-full px-2 py-1 text-[11px] font-semibold " +
                  (exoticStatus === "NOMINAL"
                    ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/60"
                    : exoticStatus === "WARNING"
                      ? "bg-amber-500/20 text-amber-200 border border-amber-400/60"
                      : "bg-rose-500/20 text-rose-200 border border-rose-400/60")
                }
              >
                overallStatus = {exoticStatus}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <FrontProofsLedger />
          {isLoading && (
            <div className="mt-2 text-xs text-slate-400">Loading proof pack...</div>
          )}
          {error && (
            <div className="mt-2 text-xs text-rose-400">
              Failed to load proof pack data.
            </div>
          )}
        </div>

        {/* Hull + pocket guard */}
        <section className="rounded-xl border border-white/10 bg-black/40 p-3 text-[12px]">
          <h2 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Van den Broeck pocket guard
            {proxyBadge(vdbProxy)}
          </h2>
          <p className="mb-2 text-[11px] text-slate-300">
            Ensure the compressed pocket stays above the conservative Planck band
            and above a fraction of the wall thickness.
          </p>

          <div className="mb-2 rounded bg-slate-900/60 p-2">
            <div className="font-mono text-[11px] text-slate-200">
              gamma_limit = min(
              <br />
              &nbsp;&nbsp;L_min / pocketFloor,
              <br />
              &nbsp;&nbsp;L_min / (l_P * safetyMult),
              <br />
              &nbsp;&nbsp;1e16
              <br />)
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              pocketFloor = max( wall * 0.01, l_P * 1e6 )
            </div>
          </div>

          <dl className="space-y-1 text-[11px]">
            <Row label="Lx_m">{fmtSci(hull.Lx_m)} m</Row>
            <Row label="Ly_m">{fmtSci(hull.Ly_m)} m</Row>
            <Row label="Lz_m">{fmtSci(hull.Lz_m)} m</Row>
            <Row label="wallThickness_m">{fmtSci(hull.wallThickness_m)} m</Row>
            <Row label="gamma_requested">{fmtSci(gammaRequested)}</Row>
            <Row label="gamma_limit">{fmtSci(vdb.limit)}</Row>
            <Row label="pocketRadius_m">{fmtSci(vdb.pocketRadius_m)}</Row>
            <Row label="pocketThickness_m">{fmtSci(vdb.pocketThickness_m)}</Row>
            <Row label="Planck margin">{fmtSci(vdb.planckMargin)}</Row>
          </dl>
          {vdb.reason ? (
            <p className="mt-2 text-[11px] text-slate-400">Reason: {vdb.reason}</p>
          ) : null}

          <StatusBadge
            ok={vdb.admissible}
            okText="gamma_requested <= gamma_limit"
            badText="gamma_requested exceeds limit"
            pendingText="Awaiting VdB guard data"
          />
        </section>

        {/* Mechanical guard */}
        <section className="rounded-xl border border-white/10 bg-black/40 p-3 text-[12px]">
          <h2 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Casimir tile mechanical guard
            {proxyBadge(mechProxy)}
          </h2>
          <p className="mb-2 text-[11px] text-slate-300">
            Compare Casimir and patch-pressure load to the elastic restoring
            pressure at the requested gap and stroke.
          </p>

          <div className="mb-2 rounded bg-slate-900/60 p-2">
            <div className="font-mono text-[11px] text-slate-200">
              P_Casimir = (pi^2 hbar c) / (240 a^4)
              <br />
              P_electrostatic = 0.5 * eps0 * (V_patch / a)^2
              <br />
              P_restoring = D * clearance / (k * span^4)
              <br />
              margin = P_restoring - (P_Casimir + P_electrostatic)
            </div>
          </div>

          <dl className="space-y-1 text-[11px]">
            <Row label="gap_req">{fmtSci(mech.requestedGap_nm)} nm</Row>
            <Row label="gap_eff">{fmtSci(mech.constrainedGap_nm)} nm</Row>
            <Row label="S_mech">{fmtSci(mech.mechSafetyFactor)}</Row>
            <Row label="S_min">{fmtSci(mech.safetyFactorMin)}</Row>
          </dl>

          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
            <Row label="P_Casimir">{fmtSci(mech.casimirPressure_Pa)} Pa</Row>
            <Row label="P_electrostatic">{fmtSci(mech.electrostaticPressure_Pa)} Pa</Row>
            <Row label="P_load">{fmtSci(mech.loadPressure_Pa)} Pa</Row>
            <Row label="sigma_allow">{fmtSci(mech.sigmaAllow_Pa)} Pa</Row>
            <Row label="margin">{fmtSci(mech.margin_Pa)} Pa</Row>
            <Row label="maxStroke_pm">{fmtSci(mech.maxStroke_pm)} pm</Row>
          </div>

          <StatusBadge
            ok={mech.feasible}
            okText="margin > 0 and clearance > 0"
            badText="mechanical guard trip"
            pendingText="Awaiting mechanical guard data"
          />
        </section>

        {/* Phoenix/GR proxy */}
        <section className="rounded-xl border border-white/10 bg-black/40 p-3 text-[12px]">
          <h2 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Phoenix curvature proxy (kappa_drive)
            {proxyBadge(kappaProxy)}
          </h2>
          <p className="mb-2 text-[11px] text-slate-300">
            Coarse GR link used in the Phoenix panel:
            <br />
            kappa_drive = (8 pi G / c^5) * (P/A) * d_eff * gain.
          </p>
          <p className="mb-2 text-[11px] text-slate-300">
            Proxy mapping: (8 pi G / c^5) is inverse Planck power. Treat P as
            luminosity, A as 4 pi R^2, d_eff as duty, gain as geometry beaming.
          </p>

          <dl className="space-y-1 text-[11px]">
            <Row label="P_avg">{fmtSci(kappaPower)} W</Row>
            <Row label="A_hull">{fmtSci(kappaArea)} m^2</Row>
            <Row label="d_eff">{fmtSci(kappaDuty)}</Row>
            <Row label="gain">{fmtSci(kappaGain)}</Row>
            <Row label="kappa_drive">{fmtSci(kappaDrive, 4)} [1/m^2]</Row>
          </dl>

          <p className="mt-2 text-[11px] text-slate-400">
            Informational only; hard safety decisions come from the pocket and
            mechanical guards plus the QI checks in the pipeline.
          </p>
        </section>
      </div>
    </div>
  );
}

function Row(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{props.label}</span>
      <span className="font-mono text-[11px] text-slate-50">
        {props.children}
      </span>
    </div>
  );
}

function StatusBadge(props: {
  ok?: boolean | null;
  okText: string;
  badText: string;
  pendingText: string;
}) {
  const { ok, okText, badText, pendingText } = props;
  const status =
    ok === true ? "ok" : ok === false ? "fail" : "pending";
  const klass =
    status === "ok"
      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
      : status === "fail"
        ? "border-rose-500/60 bg-rose-500/10 text-rose-100"
        : "border-slate-600/60 bg-slate-800/40 text-slate-300";
  return (
    <div className={`mt-3 rounded-md border px-2 py-1 text-[11px] ${klass}`}>
      {status === "ok"
        ? `OK: ${okText}`
        : status === "fail"
          ? `GUARD TRIP: ${badText}`
          : pendingText}
    </div>
  );
}

export default WarpProofPanel;
