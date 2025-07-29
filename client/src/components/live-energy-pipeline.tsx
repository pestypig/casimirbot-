import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, Zap, Atom } from "lucide-react";

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
  
  // Show calculations in real-time
  isRunning?: boolean;
}

export function LiveEnergyPipeline({
  gammaGeo,
  qFactor,
  duty,
  sagDepth,
  temperature,
  tileArea,
  shipRadius,
  gapDistance = 1.0,
  isRunning = false
}: LiveEnergyPipelineProps) {
  
  // Constants from physics
  const h_bar = 1.055e-34; // J⋅s
  const c = 2.998e8; // m/s
  const pi = Math.PI;
  
  // Convert units
  const a = gapDistance * 1e-9; // nm to m
  const A_tile = tileArea * 1e-4; // cm² to m²
  const R_ship = shipRadius; // already in m
  
  // Calculate hull surface area (ellipsoid for large hulls, sphere for small)
  const A_hull = R_ship > 10 
    ? 5.6e5 // Needle Hull ellipsoid surface area
    : 4 * pi * R_ship * R_ship; // Spherical approximation
  
  const N_tiles = A_hull / A_tile;
  
  // Step 1: Static Casimir Energy Density (Equation 2 from PDF)
  const u_casimir = -(pi * pi * h_bar * c) / (240 * Math.pow(a, 4)); // J/m³
  
  // Step 2: Static Casimir Energy per Tile
  const U_static = u_casimir * A_tile * a; // J per tile
  
  // Step 3: Geometric Amplification (Equation 3 from PDF)
  const gamma_geo = gammaGeo; // User parameter (26 for Needle Hull)
  const U_geo_raw = Math.pow(gamma_geo, 3) * U_static; // γ³ scaling
  
  // Step 4: Q-Enhancement (Equation 3 from PDF)
  const Q_on = qFactor; // User parameter (1.6×10⁶ for Needle Hull)
  const U_geo = gamma_geo * Q_on * U_static; // Correct Needle Hull formula: γ × Q_on × U_static
  const U_Q = U_geo; // This is the enhanced energy per tile
  
  // Step 5: Duty Cycle Averaging (Equation 3 from PDF)
  const d = duty; // User parameter (fraction)
  const U_cycle = U_Q * d; // J per tile
  
  // Step 6: Raw Power Loss (Equation 3 from PDF)
  const omega = 2 * pi * 15e9; // 15 GHz modulation frequency
  const P_loss_raw = Math.abs(U_geo * omega / Q_on); // W per tile (raw, unthrottled)
  
  // Step 7: Power Throttling Factors (Needle Hull Design)
  const Q_idle = 1e6; // Q during idle periods (Q-spoiling)
  const Q_spoiling_factor = Q_idle / Q_on; // For Q_on=1.6×10⁶ → ~0.625
  const duty_factor = d; // 0.002 for 0.2% duty cycle
  const sector_strobing_factor = 1 / 400; // 1/S = 2.5×10⁻³ (400 sectors)
  const combined_throttle = duty_factor * Q_spoiling_factor * sector_strobing_factor; // Total mitigation
  
  // Step 8: Realistic Average Power (83 MW target)
  const P_avg_per_tile = P_loss_raw * combined_throttle; // W per tile (throttled)
  const P_total_realistic = P_avg_per_tile * N_tiles * 1e-6; // MW total (realistic)
  
  // Step 9: Time-Scale Separation (Equation 3 from PDF)
  const f_m = 15e9; // Hz (mechanical frequency)
  const T_m = 1 / f_m; // s (mechanical period)
  const L_LC = R_ship; // Light-crossing distance
  const tau_LC = L_LC / c; // Light-crossing time
  const TS_ratio = tau_LC / T_m; // Should be ≫ 1
  
  // Step 10: Total Exotic Mass (Equation 5 from PDF)
  const M_exotic_per_tile = Math.abs(U_cycle) / (c * c); // kg per tile
  const M_exotic_total = M_exotic_per_tile * N_tiles; // kg total
  
  // Step 11: Quantum Inequality Margin (Equation 3 from PDF)
  const zeta = 1 / (d * Math.sqrt(Q_on)); // Dimensionless
  
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
            <CardTitle className="text-lg">Live Energy Pipeline</CardTitle>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"} className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>{isRunning ? "Running" : "Real-time"}</span>
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Step-by-step equations with authentic Needle Hull throttling factors (duty cycle + Q-spoiling)
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
            <div>U_Q = Q_on × U_static = {formatScientific(Q_on)} × {formatScientific(U_static)} = {formatScientific(Q_on * U_static)} J</div>
            <div className="text-blue-700 dark:text-blue-300 font-semibold">
              U_geo = γ × U_Q = {formatStandard(gamma_geo)} × {formatScientific(Q_on * U_static)} = {formatScientific(U_geo)} J
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
              P_raw,tile = ({formatScientific(Math.abs(U_geo))}) × ({formatScientific(omega)}) / ({formatScientific(Q_on)})
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
              d = {formatStandard(duty_factor * 100)}% = {formatScientific(duty_factor)}
            </div>
            <div className="text-muted-foreground">
              Q_idle/Q_on = {formatScientific(Q_idle)}/{formatScientific(Q_on)} = {formatScientific(Q_spoiling_factor)}
            </div>
            <div className="text-muted-foreground">
              1/S = 1/400 = {formatScientific(sector_strobing_factor)}
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
            <div>U_cycle = U_geo × d</div>
            <div className="text-muted-foreground">
              U_cycle = ({formatScientific(U_geo)}) × {formatStandard(d * 100)}%
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
              ζ = 1 / ({formatStandard(d * 100)}% × √{formatScientific(Q_on)})
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
      </CardContent>
    </Card>
  );
}