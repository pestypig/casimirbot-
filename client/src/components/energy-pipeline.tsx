/**
 * Energy Pipeline Display Component
 * Shows complete T_μν → metric calculations following theory checklist
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Zap, Target, Calculator, TrendingUp } from "lucide-react";

interface EnergyPipelineProps {
  results: any;
}

export function EnergyPipeline({ results }: EnergyPipelineProps) {
  console.log("EnergyPipeline results:", results); // Debug log
  
  if (!results) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No simulation results available</p>
        <p className="text-sm">Complete a simulation to see energy pipeline calculations</p>
      </div>
    );
  }
  
  // Handle both direct energyPipeline object and computed pipeline from warp/dynamic data
  let pipeline;
  
  if (results.energyPipeline) {
    pipeline = results.energyPipeline;
  } else if (results.stressEnergyTensor || results.powerDraw || true) {
    // Build a pipeline-shaped view from the unified snapshot (computeEnergySnapshot)
    const fGHz = Number(results.modulationFreq_GHz ?? results.modulationFreq_GHz ?? 15);
    const f_m = fGHz * 1e9;                 // Hz
    const ω = 2 * Math.PI * f_m;            // rad/s

    // First-class pipeline fields (authoritative)
    const dutyFR = Number(
      results.dutyEffectiveFR ?? results.dutyShip ?? results.dutyEff ?? 2.5e-5
    );                                       // Ford–Roman ship-wide duty
    const dutyUI = Number(results.dutyCycle ?? 0.14);   // UI duty (for display only)
    const γ_geo  = Number(results.gammaGeo ?? 26);
    const Q      = Number(results.qCavity ?? 1e9);
    const N      = Math.max(1, Number(results.N_tiles ?? results.N_tilesTotal ?? 1));

    // Per-tile static energy comes directly from the pipeline
    const U_static = Number(results.U_static ?? 0);      // J per tile

    // Follow the same order as the pipeline: geometry → Q → duty(FR)
    const γ3        = Math.pow(γ_geo, 3);
    const U_geo_raw = U_static * γ3;                     // J per tile (on-window stored)
    const U_Q       = U_geo_raw * Q;                     // J per tile (on-window)
    const U_cycle   = U_Q * dutyFR;                      // J per tile, ship-averaged (FR)

    // Per-tile dissipation during ON-window (pipeline's P_tile_on)
    const P_tile_on = Math.abs(U_Q) * ω / Math.max(1, Q); // W per tile (ON)
    // Average total electrical power (matches pipeline's P_avg when inputs match)
    const P_total   = P_tile_on * N * dutyFR;             // W ship-averaged

    // Prefer pipeline's own calibrated totals if present (authoritative)
    const P_avg_W   = Number.isFinite(results.P_avg) ? Number(results.P_avg) * 1e6 : P_total;
    const m_exotic  = Number.isFinite(results.M_exotic) ? Number(results.M_exotic) : (Number(results.M_exotic_raw) || 0);

    // Time-scale separation: use pipeline's TS_long / TS_geom if available
    const TS_long = results.TS_long ?? results.TS_ratio ?? undefined;  // pipeline's conservative metric
    const TS_geom = results.TS_geom ?? undefined;

    pipeline = {
      U_static,
      U_geo_raw,
      U_Q,
      U_cycle,
      P_loss: P_tile_on,        // per-cavity ON-window loss (W)
      powerTotalComputed: P_avg_W, // ship-avg W (prefer pipeline P_avg)
      E_tile: U_cycle,          // what your UI shows as per-tile energy
      N_tiles: N,
      γ_geo,
      ω,
      d: dutyFR,                // show FR duty as the physics duty
      dutyUI,                   // also show UI duty for comparison
      TS_ratio: TS_long,        // keep existing prop name but fill with TS_long
      TS_long,
      TS_geom,
      m_exotic,
    };
  } else {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Energy pipeline data not available</p>
        <p className="text-sm">This simulation doesn't include compatible energy calculations</p>
        <p className="text-xs mt-2">Switch to Dynamic module for full energy pipeline analysis</p>
      </div>
    );
  }

  const formatScientific = (value: number) => {
    if (Math.abs(value) === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = (value / Math.pow(10, exp)).toFixed(3);
    return `${mantissa} × 10^${exp}`;
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (condition: boolean) => {
    return condition ? 
      <Badge className="bg-green-100 text-green-800">PASS</Badge> : 
      <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
  };

  // Target validation using absolute values for negative energies
  const targets = {
    U_cycle: 3.99e6,     // |3.99×10⁶| J per tile (absolute value)
    m_exotic: 1.4e3,     // 1.4×10³ kg total
    P_total: 8.3e7,      // 83 MW ± 10%
    TS_ratio: 1.0        // < 1 for time-scale separation
  };

  const validation = {
    U_cycle: pipeline.U_cycle && Math.abs(Math.abs(pipeline.U_cycle) - targets.U_cycle) / targets.U_cycle < 0.1,
    m_exotic: pipeline.m_exotic && Math.abs(pipeline.m_exotic - targets.m_exotic) / targets.m_exotic < 0.05,
    P_total: pipeline.powerTotalComputed && Math.abs(pipeline.powerTotalComputed - targets.P_total) / targets.P_total < 0.1,
    TS_ratio: pipeline.TS_ratio && pipeline.TS_ratio < targets.TS_ratio // Should be < 1
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Complete Energy Pipeline (T_μν → Metric)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Step 1: Static Casimir Energy */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                1. Stress-Energy Tensor (Static Casimir)
              </h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_static (per cavity)</div>
                <div className="font-mono text-lg">{pipeline.U_static ? formatScientific(pipeline.U_static) : "—"} J</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Base Casimir energy between plates
                </div>
              </div>
            </div>

            {/* Step 2: Geometric Amplification (BEFORE Q-boost) */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                2. Geometric Amplification (Van den Broeck)
              </h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_geo_raw = U_static × γ³</div>
                <div className="font-mono text-lg">{pipeline.U_geo_raw ? formatScientific(pipeline.U_geo_raw) : "—"} J</div>
                <div className="text-xs text-muted-foreground mt-1">
                  γ_geo³ = {pipeline.γ_geo ? Math.pow(pipeline.γ_geo, 3).toExponential(1) : "15,625"}
                </div>
              </div>
            </div>

            {/* Step 3: Q-Factor Amplification */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                3. Q-Factor Amplification
              </h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_Q = U_geo_raw × Q</div>
                <div className="font-mono text-lg">{pipeline.U_Q ? formatScientific(pipeline.U_Q) : "—"} J</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Q ≈ {results.qEnhancementFactor ? formatScientific(results.qEnhancementFactor) : "10⁹"}
                </div>
              </div>
            </div>

            {/* Step 4: Duty Cycle Averaging */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">4. Duty Cycle Averaging</h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_cycle = U_Q × d</div>
                <div className="font-mono text-lg">{pipeline.U_cycle ? formatScientific(pipeline.U_cycle) : "—"} J</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  d = {pipeline.d ? (pipeline.d * 100).toFixed(1) : "1.0"}%
                  {getStatusIcon(validation.U_cycle)}
                </div>
              </div>
            </div>

            {/* Step 5: Power Loss */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">5. Power Loss per Cavity</h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">P_loss = U_geo·ω/Q</div>
                <div className="font-mono text-lg">{pipeline.P_loss ? formatScientific(pipeline.P_loss) : "—"} W</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ω = {pipeline.ω ? formatScientific(pipeline.ω) : "9.42×10¹⁰"} rad/s
                </div>
              </div>
            </div>

            {/* Step 6: Time-Scale Separation */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">6. Time-Scale Separation</h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">τ_pulse / T_LC</div>
                <div className="font-mono text-lg">{pipeline.TS_ratio ? pipeline.TS_ratio.toExponential(2) : "—"}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  Should be ≪ 1
                  {getStatusIcon(validation.TS_ratio)}
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Final Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Final Exotic Matter Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Per-Tile Energy */}
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">E_tile (per tile)</div>
              <div className="font-mono text-xl">{pipeline.E_tile ? formatScientific(pipeline.E_tile) : "—"} J</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                Target: {formatScientific(targets.U_cycle)} J
                {getStatusBadge(validation.U_cycle)}
              </div>
            </div>

            {/* Total Exotic Mass */}
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">m_exotic (total)</div>
              <div className="font-mono text-xl">{pipeline.m_exotic ? formatScientific(pipeline.m_exotic) : "—"} kg</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                Target: {formatScientific(targets.m_exotic)} kg
                {getStatusBadge(validation.m_exotic)}
              </div>
            </div>

            {/* Total Power */}
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">P_total (lattice)</div>
              <div className="font-mono text-xl">{pipeline.powerTotalComputed ? formatScientific(pipeline.powerTotalComputed) : "—"} W</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                Target: {formatScientific(targets.P_total)} W
                {getStatusBadge(validation.P_total)}
              </div>
            </div>

          </div>

          {/* Additional Parameters */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-semibold text-sm mb-3">Pipeline Parameters</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">N_tiles</div>
                <div className="font-mono">{pipeline.N_tiles ? formatScientific(pipeline.N_tiles) : "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">τ_pulse</div>
                <div className="font-mono">{pipeline.τ_pulse ? (pipeline.τ_pulse * 1e6).toFixed(1) : "—"} μs</div>
              </div>
              <div>
                <div className="text-muted-foreground">T_LC</div>
                <div className="font-mono">{pipeline.T_LC ? (pipeline.T_LC * 1e15).toFixed(1) : "—"} fs</div>
              </div>
              <div>
                <div className="text-muted-foreground">f_m</div>
                <div className="font-mono">15 GHz</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}