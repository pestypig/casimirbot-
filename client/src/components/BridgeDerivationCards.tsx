import React from "react";
import { Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMetrics } from "@/hooks/use-metrics";
import type { HelixMetrics } from "@/hooks/use-metrics";
import { computeGreensStats, fmtExp, greensKindLabel } from "@/lib/greens";

/* ---------- tiny helpers ---------- */
const Eq = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-slate-900/50 px-2 py-1 text-[12px] font-mono">{children}</code>
);

// Accept numbers *and* numeric strings
const num = (x: unknown) => {
  const v =
    typeof x === "number" ? x :
    typeof x === "string" ? Number(x.trim()) :
    NaN;
  return Number.isFinite(v) ? v : undefined;
};

const fmt = (x: unknown, digits = 3) => (num(x) !== undefined ? num(x)!.toFixed(digits) : "—");
const fexp = (x: unknown, digits = 2) => (num(x) !== undefined ? num(x)!.toExponential(digits) : "—");
const fint = (x: unknown) => (num(x) !== undefined ? Math.round(num(x)!).toLocaleString() : "—");
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Reusable formula block: Base → Substitute → Result (+provenance) */
function FormulaBlock({
  title,
  base,
  sub,
  result,
  notes,
}: {
  title: string;
  base: string;
  sub?: string;
  result?: string;
  notes?: React.ReactNode;
}) {
  return (
    <div className="space-y-1 text-xs">
      <div className="font-medium">{title}</div>
      <div>Base: <Eq>{base}</Eq></div>
      {sub && <div>Substitute: <Eq>{sub}</Eq></div>}
      {result && <div>Result: <Eq>{result}</Eq></div>}
      {notes && <div className="text-[11px] text-slate-400">{notes}</div>}
    </div>
  );
}

/** Server→Client mapping + FR duty + θ note */
export type UniformsExplain = {
  sources: Record<string, string>;
  fordRomanDuty: {
    formula: string;
    burstLocal: number;
    S_total: number;
    S_live: number;
    computed_d_eff: number;
  };
  thetaAudit: {
    note: string;
    thetaScaleExpected: number;
    inputs?: {
      gammaGeo?: number;
      q?: number;
      gammaVdB_vis?: number;
      d_eff?: number;
    };
  };
  // NEW: live values injected by backend for cards
  live?: {
    S_total?: number | string;
    S_live?: number | string;
    dutyCycle?: number | string;
    dutyEffectiveFR?: number | string;

    gammaGeo?: number | string;
    qSpoilingFactor?: number | string;
    qCavity?: number | string;
    gammaVanDenBroeck_vis?: number | string;
    gammaVanDenBroeck_mass?: number | string;

    N_tiles?: number | string;
    tilesPerSector?: number | string;
    activeTiles?: number | string;

    P_avg_W?: number | string;
    P_avg_MW?: number | string;

    zeta?: number | string;
    TS_ratio?: number | string;
  };
  equations?: {
    d_eff?: string;
    theta_expected?: string;
    U_static?: string;
    U_geo?: string;
    U_Q?: string;
    P_avg?: string;
    M_exotic?: string;
    TS_long?: string;
  };
};

function UniformsExplainCard({ data, m, className = "" }: { data?: UniformsExplain; m?: HelixMetrics; className?: string }) {
  if (!data && !m) return null;
  const entries = Object.entries(data?.sources || {});
  const fr = data?.fordRomanDuty || ({} as NonNullable<UniformsExplain["fordRomanDuty"]>);
  const th = data?.thetaAudit || ({} as NonNullable<UniformsExplain["thetaAudit"]>);
  const live = data?.live || {};
  const eqn = data?.equations || {};

  // --- FR numbers (with robust fallbacks from metrics) ---
  const S_total =
    num(fr.S_total) ??
    num(live.S_total) ??
    num((m as any)?.totalSectors) ??
    num((m as any)?.tiles?.sectorsTotal) ??
    400;

  const S_live =
    num(fr.S_live) ??
    num(live.S_live) ??
    num((m as any)?.sectorStrobing) ??
    num((m as any)?.activeSectors);

  const dEff =
    num(fr.computed_d_eff) ??
    num(live.dutyEffectiveFR) ??
    num((m as any)?.dutyEffectiveFR) ??
    num((m as any)?.pipeline?.dutyEffectiveFR) ??
    num((m as any)?.pipeline?.dutyEff);

  const burstLocal = num(fr.burstLocal);

  const baseFR = eqn.d_eff || "d_eff = burstLocal × S_live / S_total";
  const subFR =
    burstLocal !== undefined && S_live !== undefined && S_total !== undefined
      ? `d_eff = ${fmt(burstLocal)} × ${fmt(S_live, 0)} / ${fmt(S_total, 0)}`
      : undefined;
  const resFR = dEff !== undefined ? `d_eff = ${fmt(dEff, 6)} (unitless)` : undefined;

  // --- θ numbers (broader fallbacks) ---
  const gammaGeo =
    num(live.gammaGeo) ??
    num(th.inputs?.gammaGeo) ??
    num((m as any)?.pipeline?.gammaGeo) ??
    num((m as any)?.gammaGeo);

  const q =
    num(live.qSpoilingFactor) ??
    num(th.inputs?.q) ??
    num((m as any)?.pipeline?.qSpoilingFactor) ??
    num((m as any)?.qSpoilingFactor) ??
    num((m as any)?.q);

  const gammaVdB_vis =
    num(live.gammaVanDenBroeck_vis) ??
    num(th.inputs?.gammaVdB_vis) ??
    num((m as any)?.pipeline?.gammaVanDenBroeck_vis) ??
    num((m as any)?.gammaVanDenBroeck_vis) ??
    num((m as any)?.pipeline?.gammaVanDenBroeck) ??
    num((m as any)?.gammaVanDenBroeck) ??
    num((m as any)?.gammaVdB);

  const thetaExpected =
    gammaGeo !== undefined && q !== undefined && gammaVdB_vis !== undefined && dEff !== undefined
      ? Math.pow(gammaGeo, 3) * q * gammaVdB_vis * Math.sqrt(clamp01(dEff))
      : undefined;

  // --- P_avg substitution pieces (best-effort) ---
  const N_tiles =
    num(live.N_tiles) ??
    num((m as any)?.tiles?.N_tiles) ??
    num((m as any)?.N_tiles);

  const Q_cav =
    num(live.qCavity) ??
    num((m as any)?.pipeline?.qCavity) ??
    num((m as any)?.qCavity);

  const f_m_Hz = num((m as any)?.timescales?.f_m_Hz);
  const omega = f_m_Hz !== undefined ? 2 * Math.PI * f_m_Hz : undefined;

  // Normalize P_avg to W whether it arrives as W or MW
  const P_avg_W = (() => {
    const fromLiveW = num(live.P_avg_W);
    if (fromLiveW !== undefined) return fromLiveW;
    const fromLiveMW = num(live.P_avg_MW);
    if (fromLiveMW !== undefined) return fromLiveMW * 1e6;

    const pMW = num((m as any)?.pipeline?.P_avg) ?? num((m as any)?.P_avg);
    if (pMW !== undefined) return pMW * 1e6;

    const pMaybeW = num((m as any)?.energyOutput);
    if (pMaybeW !== undefined) {
      // Heuristic: treat > 1e4 as W, else assume MW and convert
      return pMaybeW > 1e4 ? pMaybeW : pMaybeW * 1e6;
    }
    return undefined;
  })();

  const subP =
    (N_tiles !== undefined || Q_cav !== undefined || omega !== undefined || dEff !== undefined)
      ? `P_avg = |U_Q| · ${omega ? `(${fexp(omega, 2)} rad·s⁻¹)` : "ω"} / ${Q_cav ? fmt(Q_cav, 0) : "Q"} · ${N_tiles ? fint(N_tiles) : "N_tiles"} · ${dEff !== undefined ? fmt(dEff, 6) : "d_eff"}`
      : undefined;

  // --- Mass substitution pieces ---
  const A_tile_cm2 = num((m as any)?.tiles?.tileArea_cm2) ?? num((m as any)?.tileArea_cm2);
  const A_tile_m2 = A_tile_cm2 !== undefined ? A_tile_cm2 * 1e-4 : undefined;
  const gap_nm = num((m as any)?.pipeline?.gap_nm ?? (m as any)?.gap_nm);
  const gammaVdB_mass =
    num(live.gammaVanDenBroeck_mass) ??
    num((m as any)?.pipeline?.gammaVanDenBroeck_mass);
  const Q_burst = 1e9; // paper constant used in backend
  const M_exotic_kg =
    num((m as any)?.pipeline?.M_exotic) ??
    num((m as any)?.M_exotic) ??
    num((m as any)?.exoticMass_kg) ??
    num((m as any)?.exoticMass);

  // --- Correct/sanitize Casimir eqn ---
  const fixUStaticEqn = (s?: string) =>
    s ? s.replace(/a⁴|a\^4/g, "a³").replace(/a\^4/g, "a^3") : s;

  const baseUstatic = fixUStaticEqn(eqn.U_static) || "U_static = [-π²·ℏ·c/(720·a³)] · A_tile";
  const subUstatic =
    gap_nm !== undefined && A_tile_m2 !== undefined
      ? `U_static = [-π²·ℏ·c/(720·(${(gap_nm * 1e-9).toExponential(2)})³)] · ${fexp(A_tile_m2, 2)} m²`
      : undefined;

  const baseTheta = eqn.theta_expected || "θ_expected = γ_geo^3 · q · γ_VdB(vis) · √d_eff";
  const subTheta =
    gammaGeo !== undefined && q !== undefined && gammaVdB_vis !== undefined && dEff !== undefined
      ? `θ = (${fmt(gammaGeo, 0)})^3 · ${fmt(q, 3)} · ${fexp(gammaVdB_vis, 2)} · √${fmt(dEff, 6)}`
      : undefined;

  const baseMass = eqn.M_exotic || "M = [U_static · γ_geo^3 · Q_burst · γ_VdB · d_eff] · N_tiles / c²";
  const subMass =
    A_tile_m2 !== undefined &&
    gammaGeo !== undefined &&
    dEff !== undefined &&
    N_tiles !== undefined &&
    gammaVdB_mass !== undefined
      ? `M = [U_static · (${fmt(gammaGeo, 0)})^3 · ${Q_burst.toExponential(0)} · ${fexp(gammaVdB_mass, 2)} · ${fmt(dEff, 6)}] · ${fint(N_tiles)} / c²`
      : undefined;

  const basePow = eqn.P_avg || "P_avg = |U_Q| · ω / Q · N_tiles · d_eff";

  return (
    <section className={`bg-card/60 border rounded-lg p-4 space-y-3 ${className}`}>
      <h3 className="font-semibold text-sm">Uniforms Explain (server → client)</h3>

      {!!entries.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <span className="text-muted-foreground w-40 shrink-0">{k}</span>
              <span className="text-foreground/90">{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Live parameters row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">Sectors</div>
          <div><Eq>{S_live !== undefined && S_total !== undefined ? `${fint(S_live)}/${fint(S_total)}` : "—"}</Eq></div>
        </div>
        <div>
          <div className="text-muted-foreground">d_eff</div>
          <div><Eq>{dEff !== undefined ? fmt(dEff, 6) : "—"}</Eq></div>
        </div>
        <div>
          <div className="text-muted-foreground">γ_VdB (vis)</div>
          <div><Eq>{gammaVdB_vis !== undefined ? fexp(gammaVdB_vis, 2) : "—"}</Eq></div>
        </div>
        <div>
          <div className="text-muted-foreground">γ_VdB (mass)</div>
          <div><Eq>{gammaVdB_mass !== undefined ? fexp(gammaVdB_mass, 2) : "—"}</Eq></div>
        </div>
        <div>
          <div className="text-muted-foreground">q (spoiling)</div>
          <div><Eq>{q !== undefined ? fmt(q, 3) : "—"}</Eq></div>
        </div>
        <div>
          <div className="text-muted-foreground">Q (cavity)</div>
          <div><Eq>{Q_cav !== undefined ? fint(Q_cav) : "—"}</Eq></div>
        </div>
        <div>
          <div className="text-muted-foreground">Tiles</div>
          <div><Eq>{N_tiles !== undefined ? fint(N_tiles) : "—"}</Eq></div>
        </div>
        <div>
          <div className="text-muted-foreground">P_avg</div>
          <div><Eq>{P_avg_W !== undefined ? `${(P_avg_W / 1e6).toFixed(1)} MW` : "—"}</Eq></div>
        </div>
      </div>

      <FormulaBlock
        title="Ford–Roman duty aggregation"
        base={baseFR}
        sub={subFR}
        result={resFR}
        notes="S_live is concurrently strobed sectors; S_total is total tiling. burstLocal is the local ON fraction."
      />

      <FormulaBlock
        title="Expected θ (mode-aware)"
        base={baseTheta}
        sub={subTheta}
        result={thetaExpected !== undefined ? `θ_expected = ${fexp(thetaExpected, 2)}` : undefined}
        notes={<>
          <div>Server audit θ: <Eq>{fexp(th?.thetaScaleExpected, 2)}</Eq></div>
        </>}
      />

      <FormulaBlock
        title="Static Casimir energy (per tile)"
        base={baseUstatic}
        sub={subUstatic}
        notes="a = gap; E/A ∝ 1/a³; A_tile from tile census"
      />

      <FormulaBlock
        title="Average power (ship)"
        base={basePow}
        sub={subP}
        result={P_avg_W !== undefined ? `P_avg = ${(P_avg_W/1e6).toFixed(2)} MW` : undefined}
        notes="U_Q includes geometry + mechanical Q calibration; ω = 2π f_m; Q is dynamic cavity Q"
      />

      <FormulaBlock
        title="Exotic mass budget (ship)"
        base={baseMass}
        sub={subMass}
        result={M_exotic_kg !== undefined ? `M = ${fint(M_exotic_kg)} kg` : undefined}
        notes="γ_VdB(mass) is the calibrated pocket factor used solely for mass matching"
      />
    </section>
  );
}

/** Hull Surface & Tile Count */
function TilesCard({ m }: { m: HelixMetrics }) {
  if (!m?.hull || !(m as any).tiles) return null;

  const Lx = num(m.hull.Lx_m);
  const Ly = num(m.hull.Ly_m);
  const Lz = num(m.hull.Lz_m);
  const A_tile_cm2 = num((m as any).tiles?.tileArea_cm2);
  const A_tile_m2 = A_tile_cm2 !== undefined ? A_tile_cm2 * 1e-4 : undefined;

  const A_hull = num((m as any).tiles?.hullArea_m2);
  const N_tiles = num((m as any).tiles?.N_tiles);

  // Include census factors when available (fallbacks are backend defaults)
  const PACKING =
    num((m as any).tiles?.packing ?? (m as any)?.pipeline?.__packing) ?? 0.88;
  const RADIAL_LAYERS =
    num((m as any).tiles?.radialLayers ?? (m as any)?.tiles?.RADIAL_LAYERS ?? (m as any)?.RADIAL_LAYERS) ?? 10;

  return (
    <section className="bg-card/60 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Hull Surface & Tile Count</h3>

      <div className="space-y-3">
        <FormulaBlock
          title="Tile area conversion"
          base="A_tile[m²] = A_tile[cm²] × 1e-4"
          sub={A_tile_cm2 !== undefined ? `A_tile = ${fmt(A_tile_cm2, 2)} × 1e-4` : undefined}
          result={A_tile_m2 !== undefined ? `A_tile = ${fexp(A_tile_m2, 2)} m²` : undefined}
          notes="1 cm² = 1e-4 m²"
        />

        <FormulaBlock
          title="Ellipsoidal hull area (Knud–Thomsen)"
          base="A_hull ≈ 4π · ((a^p b^p + a^p c^p + b^p c^p)/3)^(1/p)  (p≈1.6075)"
          sub={
            Lx !== undefined && Ly !== undefined && Lz !== undefined
              ? `a=${fmt(Lx / 2, 3)} m, b=${fmt(Ly / 2, 3)} m, c=${fmt(Lz / 2, 3)} m`
              : undefined
          }
          result={A_hull !== undefined ? `A_hull ≈ ${A_hull.toLocaleString()} m²` : undefined}
          notes="Good accuracy for prolate (needle-like) shapes."
        />

        <FormulaBlock
          title="Tile count (paper-authentic)"
          base="N_tiles = ⌊ (A_hull / A_tile) × PACKING × RADIAL_LAYERS ⌋"
          sub={
            A_hull !== undefined && A_tile_m2 !== undefined
              ? `N_tiles = ⌊ ${A_hull.toLocaleString()} / ${fexp(A_tile_m2, 2)} × ${fmt(PACKING, 2)} × ${fmt(RADIAL_LAYERS, 0)} ⌋`
              : undefined
          }
          result={N_tiles !== undefined ? `N_tiles = ${fint(N_tiles)}` : undefined}
          notes="PACKING ≈ 0.88 (surface efficiency), RADIAL_LAYERS ≈ 10 (surface × radial lattice)."
        />
      </div>
    </section>
  );
}

/** Time-Scale Separation */
function TimeScaleCard({ m }: { m: HelixMetrics }) {
  const ts = (m as any).timescales;
  if (!ts) return null;

  const L_long = num(ts.L_long_m);
  const c = 299_792_458; // m/s
  const T_long = L_long !== undefined ? L_long / c : undefined;

  const f_m = num(ts.f_m_Hz); // Hz
  const T_m = f_m !== undefined && f_m > 0 ? 1 / f_m : undefined;

  const TS_long = T_long !== undefined && T_m !== undefined && T_m > 0 ? T_long / T_m : undefined;

  return (
    <section className="bg-card/60 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Time-Scale Separation</h3>

      <FormulaBlock
        title="Light-crossing time"
        base="T_LC = L_long / c"
        sub={L_long !== undefined ? `T_LC = ${fmt(L_long, 3)} m / ${c.toLocaleString()} m·s⁻¹` : undefined}
        result={T_long !== undefined ? `T_LC = ${fexp(T_long, 2)} s` : undefined}
      />

      <FormulaBlock
        title="Modulation period"
        base="T_m = 1 / f_m"
        sub={f_m !== undefined ? `T_m = 1 / ${f_m.toLocaleString()} Hz` : undefined}
        result={T_m !== undefined ? `T_m = ${fexp(T_m, 2)} s` : undefined}
      />

      <FormulaBlock
        title="Time-scale separation ratio"
        base="TS_ratio = T_LC / T_m"
        sub={T_long !== undefined && T_m !== undefined ? `TS = ${fexp(T_long, 2)} / ${fexp(T_m, 2)}` : undefined}
        result={TS_long !== undefined ? `TS_ratio = ${fmt(TS_long, 1)}` : undefined}
        notes="We require TS_ratio ≫ 1 so the field evolves slowly relative to light-crossing time."
      />
    </section>
  );
}

/** θ-scale derivation */
function ThetaScaleCard({ m }: { m: HelixMetrics }) {
  const uexp: UniformsExplain | undefined = (m as any)?.uniformsExplain;
  const dEff =
    num(uexp?.fordRomanDuty?.computed_d_eff) ??
    num(uexp?.live?.dutyEffectiveFR) ??
    num((m as any)?.dutyEffectiveFR) ??
    num((m as any)?.pipeline?.dutyEffectiveFR) ??
    num((m as any)?.pipeline?.dutyEff);

  const gammaGeo =
    num(uexp?.live?.gammaGeo) ??
    num((m as any)?.pipeline?.gammaGeo) ??
    num((m as any)?.gammaGeo);

  const q =
    num(uexp?.live?.qSpoilingFactor) ??
    num((m as any)?.pipeline?.qSpoilingFactor) ??
    num((m as any)?.qSpoilingFactor) ??
    num((m as any)?.q);

  const gammaVdB =
    num(uexp?.live?.gammaVanDenBroeck_vis) ??
    num((m as any)?.pipeline?.gammaVanDenBroeck_vis) ??
    num((m as any)?.gammaVanDenBroeck_vis) ??
    num((m as any)?.pipeline?.gammaVanDenBroeck) ??
    num((m as any)?.gammaVanDenBroeck) ??
    num((m as any)?.gammaVdB);

  // Server audit theta with broader fallback search
  const serverAuditTheta =
    num(uexp?.thetaAudit?.thetaScaleExpected) ??
    num((m as any)?.thetaScaleExpected) ??
    num((m as any)?.pipeline?.thetaScaleExpected) ??
    num((m as any)?.uniformsExplain?.thetaAudit?.thetaScaleExpected);

  const thetaExpected =
    gammaGeo !== undefined && q !== undefined && gammaVdB !== undefined && dEff !== undefined
      ? Math.pow(gammaGeo, 3) * q * gammaVdB * Math.sqrt(clamp01(dEff))
      : undefined;

  const baseEq = uexp?.equations?.theta_expected || "θ_expected = γ_geo^3 · q · γ_VdB · √d_eff";

  return (
    <section className="bg-card/60 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">θ-Scale Derivation</h3>

      <FormulaBlock
        title="Expected θ (mode-aware)"
        base={baseEq}
        sub={
          gammaGeo !== undefined && q !== undefined && gammaVdB !== undefined && dEff !== undefined
            ? `θ = (${fmt(gammaGeo, 0)})^3 · ${fmt(q, 3)} · ${fexp(gammaVdB, 2)} · √${fmt(dEff, 6)}`
            : undefined
        }
        result={thetaExpected !== undefined ? `θ_expected = ${fexp(thetaExpected, 2)}` : undefined}
        notes={
          <>
            <div>Inputs from live pipeline snapshot:</div>
            <ul className="list-disc ml-5">
              <li>γ_geo — geometric amplification</li>
              <li>q — net Q-spoiling factor</li>
              <li>γ_VdB — Van den Broeck pocket amplification (visual)</li>
              <li>d_eff — Ford–Roman averaged duty</li>
            </ul>
            {serverAuditTheta !== undefined && (
              <div className="mt-1">Server θ (audit): <Eq>{fexp(serverAuditTheta, 2)}</Eq></div>
            )}
          </>
        }
      />
    </section>
  );
}

/** Energy per cycle and mass bookkeeping */
function EnergyAndMassCard({ m }: { m: HelixMetrics }) {
  const f_m = num((m as any)?.timescales?.f_m_Hz); // Hz
  const P_MW = num((m as any)?.pipeline?.P_avg) ?? num((m as any)?.P_avg);
  const P_W_fromMW = P_MW !== undefined ? P_MW * 1e6 : undefined;
  const energyOutput = num((m as any)?.energyOutput);
  const P_W = P_W_fromMW ?? (energyOutput !== undefined ? (energyOutput > 1e4 ? energyOutput : energyOutput * 1e6) : undefined);
  const E_cycle = f_m && P_W ? P_W / f_m : undefined; // J

  const M_exotic =
    num((m as any)?.pipeline?.M_exotic) ??
    num((m as any)?.M_exotic) ??
    num((m as any)?.exoticMass_kg) ??
    num((m as any)?.exoticMass);

  return (
    <section className="bg-card/60 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Energy & Mass Ledger</h3>

      <FormulaBlock
        title="Energy per modulation cycle"
        base="E_cycle = P_avg / f_m"
        sub={P_W !== undefined && f_m !== undefined ? `E = ${P_W.toLocaleString()} W / ${f_m.toLocaleString()} Hz` : undefined}
        result={E_cycle !== undefined ? `E_cycle = ${fexp(E_cycle, 2)} J` : undefined}
        notes="Average electrical power divided by modulation frequency (one cycle's energy)."
      />

      <div className="text-xs">
        <div className="font-medium">Exotic mass target</div>
        <div>M_exotic (live): <Eq>{M_exotic !== undefined ? `${fmt(M_exotic, 0)} kg` : "—"}</Eq></div>
      </div>
    </section>
  );
}

/** Constraint summary */
function ConstraintCard({ m }: { m: HelixMetrics }) {
  const ford = (m as any)?.fordRoman;
  const nat = (m as any)?.natario;

  const zeta = num(ford?.value ?? (m as any)?.pipeline?.zeta);
  const zetaLim = num(ford?.limit) ?? 1.0;

  const natVal = num(nat?.value);
  const natStatus = String(nat?.status || (m as any)?.pipeline?.natarioConstraint || "");

  const R_est =
    num((m as any)?.curvatureMax) ??
    num((m as any)?.pipeline?.curvatureMax) ??
    num((m as any)?.R_max) ??
    num((m as any)?.Rmax);

  const statusOverall = String((m as any)?.overallStatus || (m as any)?.pipeline?.overallStatus || "NOMINAL");

  return (
    <section className="bg-card/60 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Constraint Compliance</h3>

      <FormulaBlock
        title="Ford–Roman window (summary)"
        base="ζ ≤ 1 (ship-averaged)"
        sub={zeta !== undefined ? `ζ = ${fmt(zeta, 3)}, limit = ${fmt(zetaLim, 3)}` : undefined}
        result={zeta !== undefined ? (zeta <= zetaLim ? "PASS" : "FAIL") : undefined}
        notes="ζ is reported by the server’s averaging window; integral omitted here."
      />

      <FormulaBlock
        title="Natário zero-expansion"
        base="∇·ξ = 0"
        sub={natVal !== undefined ? `∇·ξ ≈ ${fmt(natVal, 3)}` : undefined}
        result={natStatus ? `Status: ${natStatus}` : undefined}
      />

      <div className="text-xs">
        <div className="font-medium">Curvature threshold (informal)</div>
        <div>R_max (live): <Eq>{R_est !== undefined ? fexp(R_est, 1) : "—"}</Eq></div>
        <div>System status: <Eq>{statusOverall}</Eq></div>
      </div>
    </section>
  );
}

/* ----------------------- Green's Potential (φ = G * ρ) ---------------------- */
function GreensCard({ m }: { m: HelixMetrics }) {
  const qc = useQueryClient();
  const [greens, setGreens] = React.useState<{
    kind?: "poisson" | "helmholtz";
    m?: number;
    normalize?: boolean;
    phi?: Float32Array | number[];
    size?: number;
    source?: "server" | "client" | "none";
  }>(() => {
    // 1) try cache (EnergyPipeline publishes here)
    const cached = qc.getQueryData(["helix:pipeline:greens"]) as any;
    if (cached) return cached;
    // 2) fall back to whatever the metrics snapshot might carry
    const snap = (m as any)?.pipeline?.greens as any;
    return snap || { source: "none" };
  });

  React.useEffect(() => {
    // live updates from EnergyPipeline "Publish to renderer"
    const onEvt = (e: any) => {
      const detail = e?.detail;
      if (detail) {
        setGreens(detail);
      }
    };
    window.addEventListener("helix:greens" as any, onEvt);
    return () => window.removeEventListener("helix:greens" as any, onEvt);
  }, []);

  // Periodically check cache for updates
  React.useEffect(() => {
    const checkCache = () => {
      const cached = qc.getQueryData(["helix:pipeline:greens"]) as any;
      if (cached && cached !== greens) {
        setGreens(cached);
      }
    };
    
    const interval = setInterval(checkCache, 1000);
    return () => clearInterval(interval);
  }, [qc, greens]);

  const gstats = computeGreensStats(greens?.phi as any);

  // local helpers from this file
  const kindLabel = greensKindLabel(greens);

  return (
    <section className="bg-card/60 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Green's Potential (φ = G · ρ)
        {greens?.source ? (
          <span className="ml-2 rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px]">
            {String(greens.source).toUpperCase()} · LIVE
          </span>
        ) : null}
      </h3>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="text-muted-foreground">Kernel</div>
        <div className="font-mono">
          {kindLabel}
          {greens?.normalize === false ? "" : " · norm"}
        </div>

        <div className="text-muted-foreground">N (tiles)</div>
        <div className="font-mono">{gstats.N ? gstats.N.toLocaleString() : "—"}</div>

        <div className="text-muted-foreground">φ_min</div>
        <div className="font-mono">{fmtExp(gstats.min)}</div>

        <div className="text-muted-foreground">φ_max</div>
        <div className="font-mono">{fmtExp(gstats.max)}</div>

        <div className="text-muted-foreground">φ_mean</div>
        <div className="font-mono">{fmtExp(gstats.mean)}</div>
      </div>

      <div className="text-[11px] text-slate-400 space-y-1">
        <div><span className="font-medium">How it updates:</span> Energy Pipeline computes/publishes φ to the cache key <code>["helix:pipeline:greens"]</code> and broadcasts a <code>helix:greens</code> window event. This card listens to both.</div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] hover:bg-slate-700"
            onClick={() => {
              const cached = qc.getQueryData(["helix:pipeline:greens"]) as any;
              if (cached) {
                setGreens(cached);
              } else {
                // Try to trigger a manual computation if we have metrics
                const tiles = (m as any)?.tiles as { pos: [number, number, number]; t00: number }[] | undefined;
                if (Array.isArray(tiles) && tiles.length > 0) {
                  const positions = tiles.map(t => t.pos);
                  const rho = tiles.map(t => t.t00);
                  const poissonG = (r: number) => 1 / (4 * Math.PI * Math.max(r, 1e-6));
                  const computePhi = (positions: [number, number, number][], rho: number[]) => {
                    const N = positions.length;
                    const out = new Float32Array(N);
                    for (let i = 0; i < N; i++) {
                      const [xi, yi, zi] = positions[i];
                      let sum = 0;
                      for (let j = 0; j < N; j++) {
                        const [xj, yj, zj] = positions[j];
                        const r = Math.hypot(xi - xj, yi - yj, zi - zj) + 1e-6;
                        sum += poissonG(r) * rho[j];
                      }
                      out[i] = sum;
                    }
                    return out;
                  };
                  const phi = computePhi(positions, rho);
                  const payload = { 
                    kind: "poisson" as const, 
                    m: 0, 
                    normalize: true, 
                    phi, 
                    size: phi.length, 
                    source: "client" as const 
                  };
                  qc.setQueryData(["helix:pipeline:greens"], payload);
                  setGreens(payload);
                  window.dispatchEvent(new CustomEvent("helix:greens", { detail: payload }));
                }
              }
            }}
          >
            Refresh
          </button>
          <span className="text-[10px]">
            Status: {greens?.source || "none"} | Size: {greens?.size || 0}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ===================== Main Component ===================== */

export default function BridgeDerivationCards() {
  const metricsResult = useMetrics();
  const m = metricsResult?.data;

  const uexp: UniformsExplain | undefined = (m as any)?.uniformsExplain;

  const currentMode =
    (m as any)?.pipeline?.currentMode ??
    (m as any)?.currentMode ??
    "hover";

  const S_total =
    num(uexp?.live?.S_total) ??
    num(uexp?.fordRomanDuty?.S_total) ??
    num((m as any)?.totalSectors) ??
    num((m as any)?.tiles?.sectorsTotal);

  const S_live =
    num(uexp?.live?.S_live) ??
    num(uexp?.fordRomanDuty?.S_live) ??
    num((m as any)?.sectorStrobing) ??
    num((m as any)?.activeSectors);

  const dEff =
    num(uexp?.live?.dutyEffectiveFR) ??
    num(uexp?.fordRomanDuty?.computed_d_eff) ??
    num((m as any)?.dutyEffectiveFR) ??
    num((m as any)?.pipeline?.dutyEffectiveFR) ??
    num((m as any)?.pipeline?.dutyEff);

  const gammaGeo =
    num(uexp?.live?.gammaGeo) ??
    num((m as any)?.pipeline?.gammaGeo) ??
    num((m as any)?.gammaGeo);

  const gammaVdB =
    num(uexp?.live?.gammaVanDenBroeck_vis) ??
    num((m as any)?.pipeline?.gammaVanDenBroeck_vis) ??
    num((m as any)?.gammaVanDenBroeck_vis) ??
    num((m as any)?.pipeline?.gammaVanDenBroeck) ??
    num((m as any)?.gammaVanDenBroeck) ??
    num((m as any)?.gammaVdB);

  const q =
    num(uexp?.live?.qSpoilingFactor) ??
    num((m as any)?.pipeline?.qSpoilingFactor) ??
    num((m as any)?.qSpoilingFactor) ??
    num((m as any)?.q);

  if (!m) {
    return (
      <div className="bg-card/60 border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Physics Derivation Cards</h2>
        <div className="mb-3 p-3 rounded bg-slate-900/40 border border-slate-800 text-xs">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <div>Mode: <Eq>—</Eq></div>
            <div>Sectors: <Eq>—</Eq></div>
            <div>d_eff: <Eq>—</Eq></div>
            <div>γ_geo: <Eq>—</Eq></div>
            <div>γ_VdB: <Eq>—</Eq></div>
            <div>q: <Eq>—</Eq></div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Loading physics derivation…</p>
      </div>
    );
  }

  const summary = {
    mode: String(currentMode).toUpperCase(),
    S_total,
    S_live,
    dEff,
    gammaGeo,
    gammaVdB,
    q,
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Physics Derivation Cards</h2>

        {/* Mode snapshot */}
        <div className="mb-4 p-3 rounded bg-slate-900/40 border border-slate-800 text-xs">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <div>Mode: <Eq>{summary.mode}</Eq></div>
            <div>Sectors: <Eq>{summary.S_live !== undefined && summary.S_total !== undefined ? `${fint(summary.S_live)}/${fint(summary.S_total)}` : "—"}</Eq></div>
            <div>d_eff: <Eq>{summary.dEff !== undefined ? fmt(summary.dEff, 6) : "—"}</Eq></div>
            <div>γ_geo: <Eq>{summary.gammaGeo !== undefined ? fmt(summary.gammaGeo, 0) : "—"}</Eq></div>
            <div>γ_VdB: <Eq>{summary.gammaVdB !== undefined ? fexp(summary.gammaVdB, 2) : "—"}</Eq></div>
            <div>q: <Eq>{summary.q !== undefined ? fmt(summary.q, 3) : "—"}</Eq></div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <UniformsExplainCard data={uexp} m={m} />
          <ThetaScaleCard m={m} />
          <EnergyAndMassCard m={m} />
          <TimeScaleCard m={m} />
          <TilesCard m={m} />
          <ConstraintCard m={m} />
          {/* NEW: Green's function live view (matches Energy Pipeline section 7) */}
          <GreensCard m={m} />
        </div>

        <div className="mt-6 text-xs text-slate-400 space-y-1">
          <div className="font-medium text-slate-300">Review Checklist (for researchers)</div>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Unit audit:</strong> ensure all inputs are SI before substitution (m, s, Hz, J, W, kg).</li>
            <li><strong>Snapshot export:</strong> log the full live substitution tuple alongside results for reproducibility.</li>
            <li><strong>Uncertainty:</strong> attach ± bounds where applicable (hull dims, Q factors, scheduling jitter).</li>
            <li><strong>Mode parity:</strong> repeat the same ledger for each mode (Standby / Hover / Cruise / Emergency).</li>
            <li><strong>Assumptions page:</strong> separate doc stating geometry model, boundary conditions, and visual vs. enforced physics.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
