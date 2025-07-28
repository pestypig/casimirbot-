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
  } else if (results.stressEnergyTensor || results.powerDraw) {
    // Create pipeline calculations from warp module data with corrected theory values
    const c = 299_792_458; // m/s
    const f_m = 15e9; // Hz - 15 GHz modulation frequency
    const ω = 2 * Math.PI * f_m; // angular frequency [rad/s]
    
    // 1) Corrected U_static - use proper SCUFF-EM interaction energy
    const U_static = -2.55e-3; // J - per cavity interaction energy (negative)
    
    // 2) Q-factor from simulation or default
    const Q = results.qEnhancementFactor || 1e9;
    
    // 3) Geometric amplification factor
    const γ_geo = results.geometricBlueshiftFactor || 25;
    
    // 4) Duty cycle (1% for burst operation)
    const d = 0.01; // 1% duty cycle
    
    // Corrected pipeline calculations following theory exactly
    const U_Q = Q * U_static; // U_Q = Q·U_static = 1e9 × (-2.55e-3) = -2.55e6 J
    const U_geo = γ_geo * U_Q; // U_geo = γ·U_Q = 25 × (-2.55e6) = -6.375e7 J 
    const U_cycle = U_geo * d; // U_cycle = U_geo·d = (-6.375e7) × 0.01 = -6.375e5 J
    const P_loss = Math.abs(U_geo * ω / Q); // P_loss = |U_geo·ω/Q| = |(-6.375e7) × (2π×15e9) / 1e9| = 6e9 W
    
    // 6) Corrected time-scale separation - use mechanical period T_m, not burst time
    const T_m = 1 / f_m; // mechanical period = 1/15GHz = 6.67×10⁻¹¹ s
    const R_hull = 20e-6; // m - hull radius (20 μm from paper)
    const T_LC = 2 * R_hull / c; // light crossing time = 2×20e-6/3e8 ≃ 1.33×10⁻¹³ s
    const TS_ratio = T_m / T_LC; // Should be ≪ 1, actual ≃ 6.67e-11/1.33e-13 ≃ 500 (corrected)
    
    // Calculate total system scaling
    const N_tiles = results.totalExoticMass ? results.totalExoticMass / (results.exoticMassPerTile || 1e-6) : 1;
    const E_total = Math.abs(U_cycle) * N_tiles; // Total exotic energy
    const m_exotic = E_total / (c * c); // Total exotic mass via E=mc²
    
    pipeline = {
      U_static,
      U_Q,
      U_geo,
      U_cycle,
      P_loss,
      TS_ratio,
      E_tile: U_cycle,
      E_total,
      m_exotic,
      γ_geo,
      ω,
      d,
      N_tiles,
      τ_pulse: T_m, // Use mechanical period, not burst time
      T_LC,
      powerPerTileComputed: P_loss,
      powerTotalComputed: P_loss * N_tiles,
      massPerTileComputed: Math.abs(U_cycle) / (c * c)
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

  // Target validation
  const targets = {
    U_cycle: 4e6,        // 4×10⁶ J per tile
    m_exotic: 1.4e3,     // 1.4×10³ kg total
    P_total: 8.3e7,      // 83 MW ± 10%
    TS_ratio: 0.1        // ≪ 1 for time-scale separation
  };

  const validation = {
    U_cycle: pipeline.U_cycle && Math.abs(pipeline.U_cycle - targets.U_cycle) / targets.U_cycle < 0.1,
    m_exotic: pipeline.m_exotic && Math.abs(pipeline.m_exotic - targets.m_exotic) / targets.m_exotic < 0.05,
    P_total: pipeline.powerTotalComputed && Math.abs(pipeline.powerTotalComputed - targets.P_total) / targets.P_total < 0.1,
    TS_ratio: pipeline.TS_ratio && pipeline.TS_ratio < targets.TS_ratio
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

            {/* Step 2: Q-Factor Amplification */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                2. Q-Factor Amplification
              </h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_Q = Q·U_static</div>
                <div className="font-mono text-lg">{pipeline.U_Q ? formatScientific(pipeline.U_Q) : "—"} J</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Q ≈ {results.qEnhancementFactor ? formatScientific(results.qEnhancementFactor) : "10⁹"}
                </div>
              </div>
            </div>

            {/* Step 3: Geometric Amplification */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                3. Geometric Amplification (Van den Broeck)
              </h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_geo = γ·U_Q</div>
                <div className="font-mono text-lg">{pipeline.U_geo ? formatScientific(pipeline.U_geo) : "—"} J</div>
                <div className="text-xs text-muted-foreground mt-1">
                  γ_geo ≈ {pipeline.γ_geo ? pipeline.γ_geo.toFixed(2) : "2.92"}
                </div>
              </div>
            </div>

            {/* Step 4: Duty Cycle Averaging */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">4. Duty Cycle Averaging</h4>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">U_cycle = U_geo·d</div>
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