// client/src/components/WarpProofPanel.tsx

import React, { useMemo } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import {
  computeGammaVdBGuard,
  computeMechanicalGuard,
  kappaDriveProxy,
  fmtSci,
} from "@/lib/warp-proof-math";
import { FrontProofsLedger } from "@/components/FrontProofsLedger";

type MaybePipeline = any;

const FALLBACK_HULL = {
  Lx_m: 1007,
  Ly_m: 264,
  Lz_m: 173,
  wallThickness_m: 0.019986,
};

const FALLBACK_GAMMA_REQUESTED = 1e11;

// Snapshot mechanical inputs
const FALLBACK_MECH = {
  tileArea_cm2: 25,
  tileThickness_m: 0.001,
  gap_nm: 96,
  strokeAmplitude_pm: 0,
  roughnessGuard_nm: 1,
};

const FALLBACK_KAPPA = {
  power_W: 83.3e6, // hover P_target_W from MODE_POLICY.hover
  area_m2: 1, // replace with pipeline.hullArea_m2 when live
  d_eff: 2.5e-5,
  gammaGeo: 26, // example: gammaGeo ~ 26 → gammaGeo^3 ~ 17576
};

export function WarpProofPanel() {
  const { data: pipeline } = useEnergyPipeline({
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });

  const hull = useMemo(() => {
    const p = pipeline as MaybePipeline;
    const h = p?.hull;
    if (h?.Lx_m && h?.Ly_m && h?.Lz_m) {
      return {
        Lx_m: Number(h.Lx_m),
        Ly_m: Number(h.Ly_m),
        Lz_m: Number(h.Lz_m),
        wallThickness_m: Number(
          h.wallThickness_m ?? FALLBACK_HULL.wallThickness_m,
        ),
      };
    }
    return FALLBACK_HULL;
  }, [pipeline]);

  const gammaRequested = useMemo(() => {
    const p = pipeline as MaybePipeline;
    return Number(
      p?.gammaVanDenBroeck ??
        p?.gammaVdB ??
        p?.gamma_vdb ??
        FALLBACK_GAMMA_REQUESTED,
    );
  }, [pipeline]);

  const vdbGuard = useMemo(
    () =>
      computeGammaVdBGuard({
        Lx_m: hull.Lx_m,
        Ly_m: hull.Ly_m,
        Lz_m: hull.Lz_m,
        wallThickness_m: hull.wallThickness_m,
        gammaRequested,
      }),
    [hull, gammaRequested],
  );

  const mechGuard = useMemo(() => {
    const p = pipeline as MaybePipeline;
    return computeMechanicalGuard({
      tileArea_cm2: Number(p?.tileArea_cm2 ?? FALLBACK_MECH.tileArea_cm2),
      tileThickness_m: FALLBACK_MECH.tileThickness_m,
      gap_nm: Number(p?.gap_nm ?? FALLBACK_MECH.gap_nm),
      strokeAmplitude_pm: Number(
        (p as any)?.strokeAmplitude_pm ?? FALLBACK_MECH.strokeAmplitude_pm,
      ),
      roughnessGuard_nm: FALLBACK_MECH.roughnessGuard_nm,
    });
  }, [pipeline]);

  const kappaProxy = useMemo(() => {
    const p = pipeline as MaybePipeline;
    const power_W = Number(p?.P_avg_W ?? p?.P_avg ?? FALLBACK_KAPPA.power_W);
    const area_m2 = Number(p?.hullArea_m2 ?? FALLBACK_KAPPA.area_m2);
    const gammaGeo = Number(p?.gammaGeo ?? FALLBACK_KAPPA.gammaGeo);
    const d_eff = 2.5e-5;
    return kappaDriveProxy({ power_W, area_m2, d_eff, gammaGeo });
  }, [pipeline]);

  const exoticStatus = (pipeline as MaybePipeline)?.overallStatus as
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
              Warp Proof Panel – Needle Hull Guardrails
            </div>
            <div className="text-[11px] text-slate-300/80">
              All calculations are re-derived client-side from the same
              equations used in the energy pipeline, so you can inspect the
              numbers and compare with the live snapshot.
            </div>
          </div>
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
              pipeline.overallStatus = {exoticStatus}
            </span>
          )}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <FrontProofsLedger />
        </div>

        {/* Hull + pocket guard */}
        <section className="rounded-xl border border-white/10 bg-black/40 p-3 text-[12px]">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Van den Broeck pocket guard
          </h2>
          <p className="mb-2 text-[11px] text-slate-300">
            Ensure the compressed “pocket” never falls below a conservative
            Planck-length safety band and stays larger than a fixed fraction of
            the physical wall.
          </p>

          <div className="mb-2 rounded bg-slate-900/60 p-2">
            <div className="font-mono text-[11px] text-slate-200">
              γ_limit = min(
              <br />
              &nbsp;&nbsp;L_min / pocketFloor,
              <br />
              &nbsp;&nbsp;L_min / (ℓ_P · safetyMult),
              <br />
              &nbsp;&nbsp;1e16
              <br />)
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              pocketFloor = max( wall · 0.01, ℓ_P · 10⁶ )
            </div>
          </div>

          <dl className="space-y-1 text-[11px]">
            <Row label="L_min (min semi-axis)">
              {fmtSci(vdbGuard.minRadius_m)} m
            </Row>
            <Row label="wallThickness_m">
              {fmtSci(hull.wallThickness_m ?? FALLBACK_HULL.wallThickness_m)} m
            </Row>
            <Row label="pocketFloor_m">
              {fmtSci(vdbGuard.pocketFloor_m)} m
            </Row>
            <Row label="γ_requested">{fmtSci(gammaRequested)}</Row>
            <Row label="γ_limit">{fmtSci(vdbGuard.limit)}</Row>
            <Row label="γ_applied (clamped)">
              {fmtSci(vdbGuard.gammaClamped)}
            </Row>
            <Row label="pocketRadius_m">
              {fmtSci(vdbGuard.pocketRadius_m)}
            </Row>
            <Row label="pocketThickness_m">
              {fmtSci(vdbGuard.pocketThickness_m)}
            </Row>
            <Row label="Planck margin (pocketRadius / ℓ_P)">
              {fmtSci(vdbGuard.planckMargin)}
            </Row>
          </dl>

          <StatusBadge
            ok={vdbGuard.admissible}
            okText="γ_requested ≤ γ_limit ⇒ warp pocket above floor"
            badText="γ_requested exceeds γ_limit ⇒ clamp applied"
          />
        </section>

        {/* Mechanical guard */}
        <section className="rounded-xl border border-white/10 bg-black/40 p-3 text-[12px]">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Casimir tile mechanical guard
          </h2>
          <p className="mb-2 text-[11px] text-slate-300">
            Compare Casimir + patch-pressure load to the elastic restoring
            pressure of a 25&nbsp;cm², 1&nbsp;mm thick plate at the requested
            gap and stroke.
          </p>

          <div className="mb-2 rounded bg-slate-900/60 p-2">
            <div className="font-mono text-[11px] text-slate-200">
              p_Casimir = (π² ħc) / (240 a⁴)
              <br />
              p_electrostatic = ½ ε₀ (V_patch / a)²
              <br />
              p_restoring = D · clearance / (k · span⁴)
              <br />
              margin = p_restoring − (p_Casimir + p_electrostatic)
            </div>
          </div>

          <dl className="space-y-1 text-[11px]">
            <Row label="gap_nm">
              {fmtSci(FALLBACK_MECH.gap_nm)} nm
            </Row>
            <Row label="strokeAmplitude_pm">
              {fmtSci(FALLBACK_MECH.strokeAmplitude_pm)} pm
            </Row>
            <Row label="roughnessGuard_nm">
              {fmtSci(FALLBACK_MECH.roughnessGuard_nm)} nm
            </Row>
            <Row label="tileArea_cm²">
              {fmtSci(FALLBACK_MECH.tileArea_cm2)}
            </Row>
            <Row label="tileThickness_m">
              {fmtSci(FALLBACK_MECH.tileThickness_m)} m
            </Row>
          </dl>

          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
            <Row label="p_Casimir">
              {fmtSci(mechGuard.casimirPressure_Pa)} Pa
            </Row>
            <Row label="p_electrostatic">
              {fmtSci(mechGuard.electrostaticPressure_Pa)} Pa
            </Row>
            <Row label="total load">
              {fmtSci(mechGuard.totalLoad_Pa)} Pa
            </Row>
            <Row label="p_restoring">
              {fmtSci(mechGuard.restoringPressure_Pa)} Pa
            </Row>
            <Row label="margin">
              {fmtSci(mechGuard.margin_Pa)} Pa
            </Row>
            <Row label="maxStroke_pm">
              {fmtSci(mechGuard.maxStroke_pm)} pm
            </Row>
          </div>

          <StatusBadge
            ok={mechGuard.feasible}
            okText="margin > 0 and clearance > 0 ⇒ mechanically feasible"
            badText="margin ≤ 0 or clearance ≤ 0 ⇒ unattainable at this gap/stroke"
          />
        </section>

        {/* Phoenix/GR proxy */}
        <section className="rounded-xl border border-white/10 bg-black/40 p-3 text-[12px]">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Phoenix curvature proxy (κ_drive)
          </h2>
          <p className="mb-2 text-[11px] text-slate-300">
            Coarse GR link used in the Phoenix panel:
            <br />
            κ_drive ≈ (8πG / c⁵) · (P/A) · d_eff · γ_geo.
          </p>
          <p className="mb-2 text-[11px] text-slate-300">
            Proxy mapping: (8 pi G / c^5) = 8 pi / (c^5/G) so the prefactor reads as inverse Planck power. For
            astrophysics, treat P as luminosity, A as 4 pi R^2, d_eff as duty cycle, and G_geo as beaming/geometry gain.
          </p>

          <dl className="space-y-1 text-[11px]">
            <Row label="P (avg power)">
              {fmtSci(
                (pipeline as MaybePipeline)?.P_avg_W ??
                  (pipeline as MaybePipeline)?.P_avg ??
                  FALLBACK_KAPPA.power_W,
              )}{" "}
              W
            </Row>
            <Row label="A (hull area)">
              {fmtSci(
                (pipeline as MaybePipeline)?.hullArea_m2 ??
                  FALLBACK_KAPPA.area_m2,
              )}{" "}
              m²
            </Row>
            <Row label="d_eff">{fmtSci(2.5e-5)}</Row>
            <Row label="γ_geo">
              {fmtSci(
                (pipeline as MaybePipeline)?.gammaGeo ?? FALLBACK_KAPPA.gammaGeo,
              )}
            </Row>
            <Row label="κ_drive (proxy)">
              {fmtSci(kappaProxy, 4)} {" [1/m²] (units of curvature)"}
            </Row>
          </dl>

          <p className="mt-2 text-[11px] text-slate-400">
            This panel is informational only; the hard safety decisions come
            from the pocket guard and mechanical guard above, plus the
            Ford–Roman / quantum-interest checks enforced in the pipeline.
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

function StatusBadge(props: { ok: boolean; okText: string; badText: string }) {
  const { ok, okText, badText } = props;
  return (
    <div
      className={
        "mt-3 rounded-md border px-2 py-1 text-[11px] " +
        (ok
          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100"
          : "border-rose-500/60 bg-rose-500/10 text-rose-100")
      }
    >
      {ok ? "OK: " : "GUARD TRIP: "}
      {ok ? okText : badText}
    </div>
  );
}

export default WarpProofPanel;
