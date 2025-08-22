import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WarpVisualizer } from "./WarpVisualizer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Side-by-side viewer that mounts TWO WarpVisualizer instances:
 *  - LEFT:  Real (parity) view — unity scaling, low-contrast log, σ coloring by default
 *  - RIGHT: Show (hero) view — boosted, θ diverging colors, high-contrast log
 *
 * Drop this component where you currently render a single <WarpVisualizer/>.
 * Example:
 *   <WarpBubbleCompare hero={heroParams} real={realParams} />
 */
export default function WarpBubbleCompare({
  hero,
  real,
}: {
  hero: any;
  real: any;
}) {
  // Allow quick toggles for the demo without touching globals
  const [realColorIsShear, setRealColorIsShear] = useState(true);
  const [showBoost, setShowBoost] = useState(0.5); // 0..1 blend (decades slider)

  // LEFT — REAL (parity): force unity scale + low-contrast + honest mapping
  const leftReal = useMemo(() => ({
    ...real,
    physicsParityMode: true,            // ← hard ON for real
    // No decades boost to REAL:
    curvatureBoostMax: 1,
    curvatureGainDec: 0,
    viz: {
      colorMode: realColorIsShear ? 'shear' : 'theta',  // σ-coloring (shear) by default on REAL
      exposure: 3.0,
      zeroStop: 1e-5
    }
  }), [real, realColorIsShear]);

  // RIGHT — SHOW (hero): boosted, easy to read differences
  const rightShow = useMemo(() => ({
    ...hero,
    physicsParityMode: false,           // ← OFF for show
    curvatureBoostMax: 40,
    curvatureGainDec: Math.floor(showBoost * 8),  // 0..8 range (pick your default exaggeration)
    viz: {
      colorMode: 'theta',               // θ coloring on SHOW
      exposure: 6.0,
      zeroStop: 1e-7
    }
  }), [hero, showBoost]);

  // Helpful label for the exaggeration factor we send to the SHOW view
  const showExaggeration = useMemo(() => {
    const decadeLevel = Math.floor(showBoost * 8); // 0..8 range
    return Math.pow(10, decadeLevel / 4); // exponential scaling
  }, [showBoost]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Real vs Show — Natário Bubble</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="real-shear" checked={realColorIsShear} onCheckedChange={setRealColorIsShear} />
              <Label htmlFor="real-shear" className="text-xs">REAL coloring: {realColorIsShear ? "σ (shear)" : "θ (front/back)"}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">SHOW exaggeration</Label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={showBoost}
                onChange={(e) => setShowBoost(parseFloat(e.target.value))}
                className="w-36"
                aria-label="Show exaggeration"
              />
              <span className="text-xs tabular-nums">×{showExaggeration.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* REAL (Parity) */}
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-3 py-2 text-xs font-mono bg-slate-900/80 text-sky-300 flex items-center justify-between">
              <span>REAL (Parity) • {realColorIsShear ? "σ coloring" : "θ coloring"} • honest scale</span>
              <div className="opacity-70">exp 3.0 · z₀ 1e-5 · ×1.00</div>
            </div>
            <div style={{ height: "min(56vh, 520px)" }}>
              {/* key ensures separate engines */}
              <WarpVisualizer key="real" parameters={structuredClone(leftReal)} />
            </div>
          </div>

          {/* SHOW (Hero) */}
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-3 py-2 text-xs font-mono bg-slate-900/80 text-amber-300 flex items-center justify-between">
              <span>SHOW (Hero) • θ coloring • boosted</span>
              <div className="opacity-70">exp {rightShow?.viz?.exposure?.toFixed(1) ?? '6.0'} · z₀ {(rightShow?.viz?.zeroStop ?? 1e-7).toExponential(1)} · dec{rightShow.curvatureGainDec ?? 0} · ×{showExaggeration.toFixed(1)}</div>
            </div>
            <div style={{ height: "min(56vh, 520px)" }}>
              <WarpVisualizer key="hero" parameters={structuredClone(rightShow)} />
            </div>
          </div>
        </div>

        {/* Optional footnote */}
        <div className="text-[11px] text-slate-400 mt-2">
          Parity mode disables boosts/cosmetics in-engine; SHOW uses decades slider mapping for instant legibility across modes.
        </div>
      </CardContent>
    </Card>
  );
}