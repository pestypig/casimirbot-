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
  const gamma_geo = gammaGeo; // User parameter
  const U_geo_raw = Math.pow(gamma_geo, 3) * U_static; // γ³ scaling
  
  // Step 4: Q-Enhancement (Equation 3 from PDF)
  const Q = qFactor; // User parameter
  const U_Q = Q * U_geo_raw; // J per tile
  
  // Step 5: Duty Cycle Averaging (Equation 3 from PDF)
  const d = duty; // User parameter (fraction)
  const U_cycle = U_Q * d; // J per tile
  
  // Step 6: Raw Power Loss (Equation 3 from PDF)
  const omega = 2 * pi * 15e9; // 15 GHz modulation frequency
  const P_loss_raw = Math.abs(U_Q * omega / Q); // W per tile (raw, unthrottled)
  
  // Step 7: Power Throttling Factors (Needle Hull Design)
  const Q_idle = 1e6; // Q during idle periods (Q-spoiling)
  const Q_spoiling_factor = Q_idle / Q; // ~10⁻³ for Q=10⁹ → Q=10⁶
  const duty_factor = d; // 0.002 for 0.2% duty cycle
  const combined_throttle = duty_factor * Q_spoiling_factor; // Total mitigation
  
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
  const zeta = 1 / (d * Math.sqrt(Q)); // Dimensionless
  
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
        {/* Step 1: Static Casimir Energy Density */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>
            Static Casimir Energy Density
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>u = -π²ℏc / (240a⁴)</div>
            <div className="text-muted-foreground">
              u = -π²({formatScientific(h_bar)})({formatScientific(c)}) / (240×({formatScientific(a)})⁴)
            </div>
            <div className="text-primary font-semibold">
              u = {formatScientific(u_casimir)} J/m³
            </div>
          </div>
        </div>

        {/* Step 2: Static Energy per Tile */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
            Static Energy per Tile
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>U_static = u × A_tile × a</div>
            <div className="text-muted-foreground">
              U_static = ({formatScientific(u_casimir)}) × ({formatScientific(A_tile)}) × ({formatScientific(a)})
            </div>
            <div className="text-primary font-semibold">
              U_static = {formatScientific(U_static)} J
            </div>
          </div>
        </div>

        {/* Step 3: Geometric Amplification */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">3</span>
            Geometric Amplification (γ³ scaling)
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>U_geo = γ³ × U_static</div>
            <div className="text-muted-foreground">
              U_geo = ({formatStandard(gamma_geo)})³ × ({formatScientific(U_static)})
            </div>
            <div className="text-primary font-semibold">
              U_geo = {formatScientific(U_geo_raw)} J
            </div>
          </div>
        </div>

        {/* Step 4: Q-Enhancement */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">4</span>
            Q-Factor Enhancement
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>U_Q = Q × U_geo</div>
            <div className="text-muted-foreground">
              U_Q = ({formatScientific(Q)}) × ({formatScientific(U_geo_raw)})
            </div>
            <div className="text-primary font-semibold">
              U_Q = {formatScientific(U_Q)} J
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
            <div>U_cycle = U_Q × d</div>
            <div className="text-muted-foreground">
              U_cycle = ({formatScientific(U_Q)}) × {formatStandard(d * 100)}%
            </div>
            <div className="text-primary font-semibold">
              U_cycle = {formatScientific(U_cycle)} J
            </div>
          </div>
        </div>

        {/* Step 6: Raw Power Loss */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">6</span>
            Raw Power Loss (Unthrottled)
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>P_raw = |U_Q| × ω / Q</div>
            <div className="text-muted-foreground">
              P_raw = ({formatScientific(Math.abs(U_Q))}) × ({formatScientific(omega)}) / ({formatScientific(Q)})
            </div>
            <div className="text-primary font-semibold">
              P_raw = {formatScientific(P_loss_raw)} W per tile
            </div>
          </div>
        </div>

        {/* Step 7: Power Throttling Factors */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">7</span>
            Power Throttling (Needle Hull Design)
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>Duty Factor: d = {formatStandard(duty_factor * 100)}%</div>
            <div>Q-Spoiling: Q_idle/Q_on = {formatScientific(Q_spoiling_factor)}</div>
            <div>Combined Throttle: {formatScientific(combined_throttle)}</div>
            <div className="text-primary font-semibold">
              Total Mitigation: {formatScientific(combined_throttle)} (×{formatStandard(1/combined_throttle)} reduction)
            </div>
          </div>
        </div>

        {/* Step 8: Realistic Average Power */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">8</span>
            Realistic Average Power (83 MW Target)
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>P_avg = P_raw × throttle × N_tiles</div>
            <div className="text-muted-foreground">
              P_avg = ({formatScientific(P_loss_raw)}) × ({formatScientific(combined_throttle)}) × ({formatScientific(N_tiles)})
            </div>
            <div className="text-primary font-semibold">
              P_avg = {formatStandard(P_total_realistic)} MW
            </div>
          </div>
        </div>

        {/* Step 9: Time-Scale Separation */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">9</span>
            Time-Scale Separation
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>TS_ratio = τ_LC / T_m</div>
            <div className="text-muted-foreground">
              TS_ratio = ({formatScientific(tau_LC)}) / ({formatScientific(T_m)})
            </div>
            <div className="text-primary font-semibold">
              TS_ratio = {formatStandard(TS_ratio)} {TS_ratio > 1 ? "✓" : "✗"}
            </div>
          </div>
        </div>

        {/* Step 10: Total Exotic Mass */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">10</span>
            Total Exotic Mass
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>M_exotic = N_tiles × |U_cycle| / c²</div>
            <div className="text-muted-foreground">
              M_exotic = ({formatScientific(N_tiles)}) × ({formatScientific(Math.abs(U_cycle))}) / ({formatScientific(c*c)})
            </div>
            <div className="text-primary font-semibold">
              M_exotic = {formatScientific(M_exotic_total)} kg
            </div>
          </div>
        </div>

        {/* Step 11: Quantum Safety */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">11</span>
            Quantum Inequality Margin
          </h4>
          <div className="font-mono text-sm space-y-1">
            <div>ζ = 1 / (d × √Q)</div>
            <div className="text-muted-foreground">
              ζ = 1 / ({formatStandard(d * 100)}% × √{formatScientific(Q)})
            </div>
            <div className="text-primary font-semibold">
              ζ = {formatStandard(zeta)} {zeta < 1.0 ? "✓" : "✗"}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
          <h4 className="font-semibold text-sm mb-2 flex items-center text-primary">
            <Atom className="h-4 w-4 mr-2" />
            Pipeline Summary
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Exotic Mass:</span>
              <div className="font-semibold">{formatScientific(M_exotic_total)} kg</div>
            </div>
            <div>
              <span className="text-muted-foreground">Raw Power:</span>
              <div className="font-semibold">{formatScientific(P_loss_raw * N_tiles * 1e-6)} MW</div>
            </div>
            <div>
              <span className="text-muted-foreground">Realistic Power:</span>
              <div className="font-semibold">{formatStandard(P_total_realistic)} MW</div>
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