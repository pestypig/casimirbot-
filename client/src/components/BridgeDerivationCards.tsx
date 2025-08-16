import React from "react";
import { useMetrics } from "@/hooks/use-metrics";
import type { HelixMetrics } from "@/hooks/use-metrics";

// Helper components for clean display
const Eq = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-slate-900/50 px-2 py-1 text-sm font-mono">{children}</code>
);

// Hull Surface & Tile Count Card
function TilesCard({ m }: { m: HelixMetrics }) {
  if (!m.hull || !m.tiles) return null;
  
  const A_tile_m2 = m.tiles.tileArea_cm2 * 1e-4;
  
  return (
    <section className="bg-card/60 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Hull Surface & Tile Count</h3>
      <div className="space-y-2 text-xs">
        <p>
          Hull (needle) dimensions: <Eq>{m.hull.Lx_m} × {m.hull.Ly_m} × {m.hull.Lz_m} m</Eq><br/>
          Tile area: <Eq>{m.tiles.tileArea_cm2} cm²</Eq> = <Eq>{A_tile_m2.toExponential(2)} m²</Eq>
        </p>
        <p>
          Surface area (ellipsoid approx.): <Eq>A_hull ≈ {m.tiles.hullArea_m2 ? m.tiles.hullArea_m2.toLocaleString() : '—'} m²</Eq><br/>
          <strong><Eq>N_tiles = ⌊A_hull / A_tile⌋ = {m.tiles.N_tiles.toLocaleString()}</Eq></strong>
        </p>
        <p className="text-muted-foreground text-xs">
          Area via Knud–Thomsen; good accuracy for prolate (needle-like) shapes.
        </p>
      </div>
    </section>
  );
}

// Time-Scale Separation Card
function TimeScaleCard({ m }: { m: HelixMetrics }) {
  if (!m.timescales) return null;
  
  const fGHz = m.timescales.f_m_Hz / 1e9;
  
  return (
    <section className="bg-card/60 border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm">Time-Scale Separation</h3>
      <div className="space-y-2 text-xs">
        <p>
          Longest hull dimension: <Eq>L_long = {m.timescales.L_long_m.toLocaleString()} m</Eq><br/>
          Modulation period: <Eq>T_m = {m.timescales.T_m_s.toExponential(2)} s</Eq><br/>
          Light-crossing time: <Eq>T_LC = L_long / c = {m.timescales.T_long_s.toExponential(2)} s</Eq>
        </p>
        <p>
          <strong><Eq>TS_ratio = T_LC / T_m = {m.timescales.TS_long.toLocaleString(undefined, {maximumFractionDigits: 1})}</Eq></strong>
        </p>
        <p className="text-muted-foreground text-xs">
          Using f_m = {fGHz.toFixed(2)} GHz · conservative (longest-edge) TS shown; geometric TS also available.
        </p>
      </div>
    </section>
  );
}

// Main Bridge Derivation Cards Component
export default function BridgeDerivationCards() {
  const metricsResult = useMetrics();
  const m = metricsResult?.data;
  
  if (!m) {
    return (
      <div className="bg-card/60 border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Loading physics derivation...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Physics Derivation Cards
        </h2>
        <div className="grid gap-4">
          <TilesCard m={m} />
          <TimeScaleCard m={m} />
        </div>
      </div>
    </div>
  );
}