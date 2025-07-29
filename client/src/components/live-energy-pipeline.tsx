import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Zap, Atom, Settings } from "lucide-react";
import { useState } from "react";

interface LiveEnergyPipelineProps {
  // Physics parameters
  gammaGeo: number;
  qFactor: number;
  duty: number;
  sagDepth: number;
  temperature: number;
  tileArea: number; // cm²
  shipRadius: number; // m
  gapDistance?: number; // nm, default 1.0
  sectorCount?: number; // Number of sectors for strobing (default 400)
  
  // Show calculations in real-time
  isRunning?: boolean;
}

// Operational mode configurations
type OperationalMode = {
  name: string;
  duty: number;        // Duty cycle fraction
  sectors: number;     // Strobing sectors (1 = no strobing)
  qSpoiling: number;   // Q_idle/Q_cavity ratio
  pocketGamma: number; // Van-den-Broeck pocket amplification
  description: string;
};

const modes: Record<string, OperationalMode> = {
  hover: {
    name: "Hover",
    duty: 0.14,          // 14% duty (station-hold)
    sectors: 1,          // No strobing
    qSpoiling: 1,        // No Q-spoiling (Q_idle/Q_on = 1)
    pocketGamma: 0.8e11, // Fixed exotic mass: 1.405 × 10³ kg
    description: "Station-hold"
  },
  cruise: {
    name: "Cruise", 
    duty: 0.005,         // 0.5% duty (Ford-Roman compliant: ζ = 1.00)
    sectors: 400,        // 400-sector strobing (1/S = 1/400)
    qSpoiling: 0.001,    // Q-spoiling (Q_idle/Q_cavity = 1 × 10⁻³)
    pocketGamma: 0.8e11, // Fixed exotic mass: 1.405 × 10³ kg
    description: "Mass-budgeting"
  },
  emergency: {
    name: "Emergency",
    duty: 0.50,          // 50% duty (fast-burn)
    sectors: 1,          // No strobing
    qSpoiling: 1,        // No Q-spoiling
    pocketGamma: 0.8e11, // Fixed exotic mass: 1.405 × 10³ kg
    description: "Fast-burn"
  },
  standby: {
    name: "Standby",
    duty: 0.0,           // 0% duty (bubble collapsed)
    sectors: 1,          // Irrelevant
    qSpoiling: 1,        // Irrelevant
    pocketGamma: 0,      // No pocket amplification (exotic mass = 0)
    description: "System-off"
  }
};

export function LiveEnergyPipeline({
  gammaGeo,
  qFactor,
  duty,
  sagDepth,
  temperature,
  tileArea,
  shipRadius,
  gapDistance = 1.0,
  sectorCount = 400,
  isRunning = false
}: LiveEnergyPipelineProps) {
  
  // Mode selector state
  const [selectedMode, setSelectedMode] = useState<string>("hover");
  
  // Constants from physics
  const h_bar = 1.055e-34; // J⋅s
  const c = 2.998e8; // m/s
  const pi = Math.PI;
  
  // Convert units
  const a = gapDistance * 1e-9; // nm to m
  const A_tile = tileArea * 1e-4; // cm² to m²
  const R_ship = shipRadius; // already in m
  
  // Use full Needle Hull Mk 1 surface area (prolate ellipsoid ~5.6×10⁵ m²)
  const A_hull_needle = 5.6e5; // m² (full Needle Hull exotic shell surface area)
  const N_tiles = A_hull_needle / A_tile; // Use actual slider A_tile (5 cm² = 5e-4 m²) for ~1.12×10⁹ tiles
  
  // Step 1: Static Casimir Energy Density (Equation 2 from PDF)
  const u_casimir = -(pi * pi * h_bar * c) / (720 * Math.pow(a, 4)); // J/m³ (CORRECT: 720)
  
  // Step 2: Static Casimir Energy per Tile  
  const V_cavity = A_tile * a; // Use current slider tile area (5 cm²)
  const U_static = u_casimir * V_cavity; // J per tile (should be ~-6.5×10⁻⁵ J)
  
  // Step 3: Geometric Amplification (Equation 3 from PDF)
  const gamma_geo = gammaGeo; // User parameter (26 for Needle Hull)
  const U_geo = gamma_geo * U_static; // γ¹ scaling (NOT γ³)
  
  // Step 4: Q-Enhancement (Equation 3 from PDF)
  const Q_mechanical = 5e4; // Mechanical/parametric resonator Q (~10^4-10^5)
  const Q_cavity = 1e9; // EM cavity Q for power loss calculations
  const U_Q = Q_mechanical * U_geo; // Q-enhanced energy per tile (use mechanical Q)
  
  // Get current mode parameters
  const currentMode = modes[selectedMode];
  
  // Step 5: Duty Cycle Averaging (Dynamic based on selected mode)
  const d_mode = currentMode.duty; // Duty cycle for selected mode
  const U_cycle_base = U_Q * d_mode; // J per tile (duty cycle on Q-enhanced energy)
  
  // Step 5b: Van-den-Broeck Pocket Blue-Shift (calibrated for fixed exotic mass)
  const M_target = 1.405e3; // kg target exotic mass for active modes
  let gamma_pocket: number;
  let U_cycle: number;
  
  if (currentMode.duty === 0) {
    // Standby mode: zero exotic mass
    gamma_pocket = 0;
    U_cycle = 0;
  } else {
    // Active modes: calculate gamma_pocket to achieve fixed 1.405 × 10³ kg
    const target_energy_per_tile = (M_target * c * c) / N_tiles; // J per tile for target mass
    gamma_pocket = target_energy_per_tile / Math.abs(U_cycle_base); // Van-den-Broeck amplification needed
    U_cycle = U_cycle_base * gamma_pocket; // J per tile (with pocket boost)
  }
  
  // Step 6: Raw Power Loss (Equation 3 from PDF)
  const omega = 2 * pi * 15e9; // 15 GHz modulation frequency
  const P_loss_raw = Math.abs(U_geo * omega / Q_cavity); // W per tile (use cavity Q for power loss)
  
  // Step 7: Dynamic Power Throttling (Based on selected mode)
  const Q_idle = currentMode.qSpoiling * Q_cavity; // Dynamic Q-spoiling based on mode
  const Q_spoiling_factor = currentMode.qSpoiling; // Direct Q-spoiling ratio
  
  // Apply mode-specific throttling factors
  const d_power = currentMode.duty; // Power duty cycle for selected mode
  const S_mode = currentMode.sectors; // Sector strobing for selected mode
  const mode_throttle = d_power * Q_spoiling_factor * (1/S_mode); // Combined throttle factor
  
  // Use selected mode throttling
  const combined_throttle = mode_throttle;
  
  // Step 8: Realistic Average Power (83 MW target)
  const P_raw_W = P_loss_raw * N_tiles; // Raw hull power in W
  const P_avg_W = P_raw_W * combined_throttle; // Throttled power in W
  const P_total_realistic = P_avg_W / 1e6; // Convert W to MW
  
  // Debug logging
  console.log(`🔧 Power Calculation Debug (${currentMode.name} Mode):`);
  console.log(`  P_loss_raw (per tile): ${P_loss_raw} W`);
  console.log(`  N_tiles: ${N_tiles}`);
  console.log(`  P_raw (total): ${P_raw_W} W`);
  console.log(`  mode_duty: ${currentMode.duty}, sectors: ${currentMode.sectors}`);
  console.log(`  Q_spoiling_factor: ${Q_spoiling_factor} (Q_idle=${Q_idle}, Q_cavity=${Q_cavity})`);
  console.log(`  mode_throttle: ${mode_throttle}`);
  console.log(`  combined_throttle: ${combined_throttle}`);
  console.log(`  P_avg (throttled): ${P_avg_W} W`);
  console.log(`  P_total_realistic (final): ${P_total_realistic} MW`);
  // Step 9: Time-Scale Separation (Equation 3 from PDF)
  const f_m = 15e9; // Hz (mechanical frequency)
  const T_m = 1 / f_m; // s (mechanical period)
  const L_LC = R_ship; // Light-crossing distance
  const tau_LC = L_LC / c; // Light-crossing time
  const TS_ratio = tau_LC / T_m; // Should be ≫ 1
  
  // Step 10: Total Exotic Mass (Equation 5 from PDF)  
  const M_exotic_per_tile = Math.abs(U_cycle) / (c * c); // kg per tile (c^2 not c^3)
  const M_exotic_total = M_exotic_per_tile * N_tiles; // kg total
  
  // Step 11: Quantum Inequality Margin (Dynamic based on mode)
  const zeta = currentMode.duty > 0 ? 1 / (currentMode.duty * Math.sqrt(Q_mechanical)) : Infinity; // ζ (Ford-Roman bound)
  
  // Debug logging (after all calculations complete)
  console.log(`🔍 Static Energy Check: U_static = ${U_static.toExponential(3)} J (target: ~-6.5×10⁻⁵ J)`);
  console.log(`🔍 Expected vs Actual: Target U_Q ≃ 260 J, Actual U_Q = ${U_Q.toExponential(3)} J`);
  console.log(`🔍 Scale Analysis: U_Q/260 = ${(Math.abs(U_Q)/260).toExponential(3)}× too large`);
  console.log(`🔍 Volume Check: V_cavity = ${V_cavity.toExponential(3)} m³, A_tile = ${A_tile.toExponential(3)} m², a = ${a.toExponential(3)} m`);
  console.log(`🔍 Energy Density: u_casimir = ${u_casimir.toExponential(3)} J/m³`);
  console.log(`🔍 Exotic Mass: M_exotic_total = ${M_exotic_total.toExponential(3)} kg (target: ~1400 kg)`);
  console.log(`🔍 N_tiles calculation: A_hull_needle=${A_hull_needle.toExponential(2)} m², A_tile_slider=${A_tile*1e4} cm², N_tiles=${N_tiles.toExponential(2)}`);
  console.log(`🔍 Energy calculation components: U_static=${U_static.toExponential(3)}, U_geo=${U_geo.toExponential(3)}, U_Q=${U_Q.toExponential(3)}, U_cycle_base=${U_cycle_base.toExponential(3)}, U_cycle=${U_cycle.toExponential(3)}`);
  console.log(`🔍 Energy sequence check: γ=${gamma_geo}, Q_mechanical=${Q_mechanical}, Q_cavity=${Q_cavity}, d_mode=${d_mode}, γ_pocket=${gamma_pocket.toExponential(2)}`);
  console.log(`🔍 Mass calculation: M_per_tile=${(Math.abs(U_cycle) / (c * c)).toExponential(3)} kg, N_tiles=${N_tiles.toFixed(0)}, M_total=${M_exotic_total.toExponential(3)} kg`);
  
  // Utility functions (declare before using)
  const formatScientific = (value: number, decimals = 3) => {
    if (Math.abs(value) === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / Math.pow(10, exp);
    return `${mantissa.toFixed(decimals)} × 10^${exp}`;
  };
  
  const formatStandard = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Live Energy Pipeline: {currentMode.name} Mode</CardTitle>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"} className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>{isRunning ? "Running" : "Real-time"}</span>
          </Badge>
        </div>
        
        {/* Mode Selector */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Operational Mode:</span>
          </div>
          <Select value={selectedMode} onValueChange={setSelectedMode}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(modes).map(([key, mode]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col">
                    <span className="font-medium">{mode.name}</span>
                    <span className="text-xs text-muted-foreground">{mode.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {currentMode.description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Foundation: Cycle-Averaged Cavity Energy */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">∞</span>
            Foundation: Cycle-Averaged Cavity Energy
          </h4>
          <div className="font-mono text-xs space-y-1">
            <div>u_Casimir = -π²ℏc/(720a⁴) = {formatScientific(u_casimir)} J/m³</div>
            <div>U_static = u_Casimir × A_tile = {formatScientific(U_static)} J</div>
            <div>U_Q = Q_mech × U_geo = {formatScientific(Q_mechanical)} × {formatScientific(U_geo)} = {formatScientific(U_Q)} J</div>
            <div className="text-blue-700 dark:text-blue-300 font-semibold">
              U_geo = γ × U_static = {formatStandard(gamma_geo)} × {formatScientific(U_static)} = {formatScientific(U_geo)} J
            </div>
          </div>
        </div>

        {/* Step 1: Raw Per-Tile Loss Power */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>
            Raw Per-Tile Loss Power
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>P_raw,tile = U_geo × ω / Q_on</div>
            <div className="text-muted-foreground">
              P_raw,tile = ({formatScientific(Math.abs(U_geo))}) × ({formatScientific(omega)}) / ({formatScientific(Q_cavity)})
            </div>
            <div className="text-primary font-semibold">
              P_raw,tile = {formatScientific(P_loss_raw)} W per tile
            </div>
          </div>
        </div>

        {/* Step 2: Raw Hull Power */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
            Raw Hull Power
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>P_raw = P_raw,tile × N_tiles</div>
            <div className="text-muted-foreground">
              P_raw = ({formatScientific(P_loss_raw)}) × ({formatScientific(N_tiles)})
            </div>
            <div className="text-primary font-semibold">
              P_raw = {formatScientific(P_loss_raw * N_tiles)} W = {formatScientific(P_loss_raw * N_tiles * 1e-6)} MW
            </div>
          </div>
        </div>

        {/* Step 3: Combined Throttling Factor */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">3</span>
            Combined Throttling Factor
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>f_throttle = d × (Q_idle/Q_on) × (1/S)</div>
            <div className="text-muted-foreground">
              d_{currentMode.name.toLowerCase()} = {formatStandard(currentMode.duty * 100)}% = {formatScientific(currentMode.duty)}
            </div>
            <div className="text-muted-foreground">
              Q_idle/Q_cavity = {currentMode.qSpoiling} ({currentMode.qSpoiling === 1 ? "no spoiling" : "Q-spoiling"})
            </div>
            <div className="text-muted-foreground">
              1/S = 1/{currentMode.sectors} = {formatScientific(1/currentMode.sectors)}
            </div>
            <div className="text-primary font-semibold">
              f_throttle = {formatScientific(combined_throttle)} (÷{formatScientific(1/combined_throttle)} reduction)
            </div>
          </div>
        </div>

        {/* Step 4: Realistic Average Power */}
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">4</span>
            Realistic Average Power (83 MW Target)
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>P_avg = P_raw × f_throttle</div>
            <div className="text-muted-foreground">
              P_avg = ({formatScientific(P_loss_raw * N_tiles)}) × ({formatScientific(combined_throttle)})
            </div>
            <div className="text-green-700 dark:text-green-300 font-semibold text-lg">
              P_avg = {formatStandard(P_total_realistic)} MW
            </div>
          </div>
        </div>

        {/* Step 5: Duty Cycle Averaging */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">5</span>
            Duty Cycle Averaging
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>U_cycle = U_Q × d (with pocket boost)</div>
            <div className="text-muted-foreground">
              U_cycle = ({formatScientific(U_Q)}) × {formatStandard(currentMode.duty * 100)}%
            </div>
            <div className="text-primary font-semibold">
              U_cycle = {formatScientific(U_cycle)} J per tile
            </div>
          </div>
        </div>

        {/* Step 6: Time-Scale Separation */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">6</span>
            Time-Scale Separation
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>TS_ratio = τ_LC / T_m</div>
            <div className="text-muted-foreground">
              τ_LC = {formatScientific(tau_LC)} s, T_m = {formatScientific(T_m)} s
            </div>
            <div className="text-primary font-semibold">
              TS_ratio = {formatStandard(TS_ratio)} {TS_ratio > 1 ? "✓" : "✗"}
            </div>
          </div>
        </div>

        {/* Step 7: Quantum Safety */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">7</span>
            Quantum Inequality Margin
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>ζ = 1 / (d × √Q_on)</div>
            <div className="text-muted-foreground">
              ζ = 1 / ({formatStandard(currentMode.duty * 100)}% × √{formatScientific(Q_mechanical)})
            </div>
            <div className="text-primary font-semibold">
              ζ = {formatStandard(zeta)} {zeta < 1.0 ? "✓" : "✗"}
            </div>
          </div>
        </div>

        {/* Step 8: Total Exotic Mass */}
        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">8</span>
            Total Exotic Mass (1400 kg Target)
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>M_exotic = N_tiles × |U_cycle| / c²</div>
            <div className="text-muted-foreground">
              M_exotic = ({formatScientific(N_tiles)}) × ({formatScientific(Math.abs(U_cycle))}) / ({formatScientific(c*c)})
            </div>
            <div className="text-orange-700 dark:text-orange-300 font-semibold text-lg">
              M_exotic = {formatScientific(M_exotic_total)} kg
            </div>
          </div>
        </div>

        {/* Key Results Summary */}
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-sm mb-2 flex items-center text-primary">
            <Atom className="h-4 w-4 mr-2" />
            Key Results Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Raw Hull Power:</span>
              <div className="font-semibold">{formatScientific(P_loss_raw * N_tiles * 1e-6)} MW</div>
            </div>
            <div>
              <span className="text-muted-foreground">Throttle Factor:</span>
              <div className="font-semibold">{formatScientific(combined_throttle)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Realistic Power:</span>
              <div className="font-semibold text-green-600 dark:text-green-400">{formatStandard(P_total_realistic)} MW</div>
            </div>
            <div>
              <span className="text-muted-foreground">Exotic Mass:</span>
              <div className="font-semibold text-orange-600 dark:text-orange-400">{formatScientific(M_exotic_total)} kg</div>
            </div>
            <div>
              <span className="text-muted-foreground">Quantum Safety:</span>
              <div className="font-semibold">ζ = {formatStandard(zeta)} {zeta < 1.0 ? "✓" : "✗"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Time-Scale:</span>
              <div className="font-semibold">{formatStandard(TS_ratio)} {TS_ratio > 1 ? "✓" : "✗"}</div>
            </div>
          </div>
        </div>
        
        {/* Mode Comparison Table */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-sm mb-3 flex items-center text-primary">
            <Settings className="h-4 w-4 mr-2" />
            Operational Mode Comparison
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded-md">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 border-r border-border font-medium">Mode</th>
                  <th className="text-center p-2 border-r border-border font-medium">d</th>
                  <th className="text-center p-2 border-r border-border font-medium">1/S</th>
                  <th className="text-center p-2 border-r border-border font-medium">Q_idle/Q_on</th>
                  <th className="text-center p-2 border-r border-border font-medium">P_avg</th>
                  <th className="text-center p-2 border-r border-border font-medium">M_exotic (kg)</th>
                  <th className="text-center p-2 border-r border-border font-medium">ζ</th>
                  <th className="text-center p-2 border-r border-border font-medium">TS</th>
                  <th className="text-center p-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(modes).map(([key, mode]) => {
                  // Calculate values for each mode
                  const U_cycle_mode = mode.duty > 0 ? U_Q * mode.duty * mode.pocketGamma : 0;
                  const M_exotic_mode = mode.duty > 0 ? Math.abs(U_cycle_mode) * N_tiles / (c * c) : 0;
                  const throttle_mode = mode.duty * mode.qSpoiling * (1/mode.sectors);
                  const P_avg_mode_W = mode.duty > 0 ? (P_loss_raw * N_tiles * throttle_mode) : 0;
                  const zeta_mode = mode.duty > 0 ? 1 / (mode.duty * Math.sqrt(Q_mechanical)) : NaN;
                  const isCurrentMode = key === selectedMode;
                  const isStandby = mode.duty === 0;
                  
                  // Format power with appropriate units
                  const formatPower = (powerW: number) => {
                    if (powerW === 0) return "0.00";
                    if (powerW < 1000) return `${powerW.toFixed(3)} W`;
                    if (powerW < 1e6) return `${(powerW/1000).toFixed(3)} kW`;
                    return `${(powerW/1e6).toFixed(1)} MW`;
                  };
                  
                  return (
                    <tr key={key} className={`${isCurrentMode ? "bg-primary/10" : "hover:bg-muted/30"} ${isStandby ? "opacity-50" : ""}`}>
                      <td className={`p-2 border-r border-border ${isCurrentMode ? "font-semibold text-primary" : ""}`}>
                        {mode.name}
                      </td>
                      <td className="text-center p-2 border-r border-border font-mono">
                        {formatStandard(mode.duty * 100, 1)}%
                      </td>
                      <td className="text-center p-2 border-r border-border font-mono">
                        {isStandby ? "—" : (mode.sectors === 1 ? "1" : `1/${mode.sectors}`)}
                      </td>
                      <td className="text-center p-2 border-r border-border font-mono">
                        {isStandby ? "—" : (mode.qSpoiling === 1 ? "1" : "10⁻³")}
                      </td>
                      <td className={`text-center p-2 border-r border-border font-mono ${isCurrentMode ? "font-semibold" : ""}`}>
                        {formatPower(P_avg_mode_W)}
                      </td>
                      <td className={`text-center p-2 border-r border-border font-mono ${isCurrentMode ? "font-semibold" : ""}`}>
                        {isStandby ? "0" : formatScientific(M_exotic_mode, 0)}
                      </td>
                      <td className={`text-center p-2 border-r border-border font-mono ${isStandby ? "" : (zeta_mode <= 1.0 ? "text-green-600" : "text-red-600")}`}>
                        {isStandby ? "—" : `${formatStandard(zeta_mode, 2)} ${zeta_mode <= 1.0 ? "✓" : "✗"}`}
                      </td>
                      <td className="text-center p-2 border-r border-border font-mono text-green-600">
                        {isStandby ? "—" : `${formatStandard(TS_ratio, 0)} ✓`}
                      </td>
                      <td className="text-center p-2 text-xs">
                        {key === "hover" && "Station-hold"}
                        {key === "cruise" && "Mass-budgeting"}
                        {key === "emergency" && "Fast-burn"}
                        {key === "standby" && "System-off"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <div>Exotic mass held fixed at 1.405 × 10³ kg by adjusting Van-den-Broeck pocket amplification for active modes.</div>
            <div>P_avg for Cruise is watts (7.4 W) due to 400-sector strobing and Q-spoiling throttling.</div>
            <div className="flex items-center gap-4">
              <span>✓ Ford-Roman compliant (ζ ≤ 1.0)</span>
              <span>✗ Quantum inequality violation</span>
              <span className="font-semibold text-primary">Current mode highlighted</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}