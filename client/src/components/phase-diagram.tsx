import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TestTube, TrendingUp, Zap } from 'lucide-react';

interface ViabilityResult {
  viable: boolean;
  fail_reason: string;
  M_exotic: number;
  P_avg: number;
  zeta: number;
  TS_ratio: number;
  gamma_geo: number;
  N_tiles: number;
  U_cycle: number;
  A_hull: number;
  checks: {
    mass_ok: boolean;
    power_ok: boolean;
    quantum_safe: boolean;
    timescale_ok: boolean;
    geometry_ok: boolean;
  };
}

// Constants for calculations (matching the Python version)
const CONST = {
  HBARC: 1.973e-25,  // ℏc in J⋅m
  GAMMA_GEO: 25,     // Geometric amplification factor  
  Q_FACTOR: 1e9,     // Quality factor
  DUTY_EFF: 2.5e-5,  // Effective duty cycle (sector strobing)
  PEAK_POWER: 2.0e15, // Peak lattice power (W)
  ZETA_COEF: 1.0,    // Quantum inequality coefficient
  PULSE_LEN: 10e-6,  // Pulse length (s)
  C_LIGHT: 2.998e8,  // Speed of light (m/s)
  G: 6.674e-11,      // Gravitational constant (m³/kg⋅s²)
};

function calculateViability(A_tile_cm2: number, R_ship_m: number): ViabilityResult {
  // Convert units
  const A_tile = A_tile_cm2 * 1e-4;  // cm² to m²
  const R_ship = R_ship_m;
  
  // Calculate number of tiles on spherical hull
  const A_hull = 4 * Math.PI * R_ship**2;  // Hull surface area (m²)
  const N_tiles = A_hull / A_tile;  // Total tile count
  
  // 1. Static Casimir energy per tile (40 μm concave geometry)
  const gap = 1e-9;  // 1 nm vacuum gap
  const U_static = -CONST.HBARC * Math.PI**2 / (240 * gap**3) * A_tile;  // Base Casimir energy
  
  // 2. Geometric amplification (Van den Broeck factor)
  const gamma_geo = CONST.GAMMA_GEO;
  const U_geo_raw = U_static * gamma_geo**3;
  
  // 3. Q-factor amplification  
  const Q = CONST.Q_FACTOR;
  const U_Q = U_geo_raw * Q;
  
  // 4. Duty cycle averaging
  const d = 0.01;  // 1% mechanical duty cycle
  const U_cycle = U_Q * d;
  
  // 5. Total exotic mass (thin-shell formula)
  const delta_wall = 1e-3;  // 1 mm wall thickness
  const M_exotic = A_hull / (8 * Math.PI * CONST.G * delta_wall);
  
  // 6. Average power consumption
  const omega = 2 * Math.PI * 15e9;  // 15 GHz modulation frequency
  const P_loss_per_tile = Math.abs(U_geo_raw * omega / Q);  // Power loss per tile
  const P_avg = P_loss_per_tile * N_tiles * CONST.DUTY_EFF;  // Average lattice power
  
  // 7. Quantum inequality check (ζ < 1 for safety)
  const tau_pulse = CONST.PULSE_LEN;
  const zeta = Math.abs(U_cycle) * tau_pulse / CONST.HBARC;  // Quantum inequality parameter
  
  // 8. Time-scale separation
  const T_m = 1 / (15e9);  // Mechanical period
  const T_LC = 2 * R_ship / CONST.C_LIGHT;  // Light crossing time
  const TS_ratio = T_m / T_LC;
  
  // Viability checks
  const checks = {
    mass_ok: M_exotic >= 1000 && M_exotic <= 2000,  // Target range around 1400 kg
    power_ok: P_avg <= 100e6,           // Under 100 MW
    quantum_safe: zeta < 1.0,           // Quantum inequality satisfied
    timescale_ok: TS_ratio < 1.0,       // Proper time-scale separation
    geometry_ok: gamma_geo >= 20        // Sufficient geometric amplification
  };
  
  // Overall viability
  const viable = Object.values(checks).every(check => check);
  
  // Failure reason (first constraint that fails)
  let fail_reason = "Viable ✅";
  if (!viable) {
    if (!checks.mass_ok) {
      fail_reason = `Mass: ${M_exotic.toFixed(0)} kg`;
    } else if (!checks.power_ok) {
      fail_reason = `Power: ${(P_avg/1e6).toFixed(0)} MW`;
    } else if (!checks.quantum_safe) {
      fail_reason = `ζ = ${zeta.toFixed(2)} > 1`;
    } else if (!checks.timescale_ok) {
      fail_reason = `TS = ${TS_ratio.toFixed(2)} > 1`;
    } else if (!checks.geometry_ok) {
      fail_reason = `γ = ${gamma_geo} < 20`;
    }
  }
  
  return {
    viable,
    fail_reason,
    M_exotic,
    P_avg,
    zeta,
    TS_ratio,
    gamma_geo,
    N_tiles,
    U_cycle,
    A_hull,
    checks
  };
}

function buildViabilityGrid(A_range: [number, number], R_range: [number, number], resolution: number = 60) {
  const A_vals = Array.from({length: resolution}, (_, i) => 
    A_range[0] + (A_range[1] - A_range[0]) * i / (resolution - 1)
  );
  const R_vals = Array.from({length: resolution}, (_, i) => 
    R_range[0] + (R_range[1] - R_range[0]) * i / (resolution - 1)
  );
  
  const Z = R_vals.map(R => 
    A_vals.map(A => {
      const result = calculateViability(A, R);
      return result.viable ? 1 : 0;
    })
  );
  
  return { A_vals, R_vals, Z };
}

interface PhaseDiagramProps {
  tileArea?: number;
  shipRadius?: number;
  onTileAreaChange?: (value: number) => void;
  onShipRadiusChange?: (value: number) => void;
}

export default function PhaseDiagram({ 
  tileArea = 2500, 
  shipRadius = 5.0, 
  onTileAreaChange, 
  onShipRadiusChange 
}: PhaseDiagramProps) {

  // Calculate current point diagnostics
  const currentDiagnostics = useMemo(() => 
    calculateViability(tileArea, shipRadius), [tileArea, shipRadius]
  );

  // Build viability grid (cached)
  const viabilityGrid = useMemo(() => 
    buildViabilityGrid([50, 5000], [1, 50], 40), []
  );

  const formatScientific = (value: number, decimals: number = 2) => {
    if (value === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = (value / Math.pow(10, exp)).toFixed(decimals);
    return `${mantissa} × 10^${exp}`;
  };

  const runTestPoints = () => {
    const test1 = calculateViability(100, 30);  // Should fail
    const test2 = calculateViability(2500, 5);  // Should pass
    
    const test1Result = !test1.viable ? "✅ PASS" : "❌ FAIL";
    const test2Result = test2.viable ? "✅ PASS" : "❌ FAIL";
    
    alert(`Test Results:\n• 100 cm², 30m → ${test1Result} (expect fail)\n• 2500 cm², 5m → ${test2Result} (expect pass)`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Warp Bubble Phase Diagram
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Interactive design space explorer showing viable tile-area vs ship-radius combinations
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Controls */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Design Parameters</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tile Area: {tileArea} cm²</label>
                    <Slider
                      value={[tileArea]}
                      onValueChange={([value]) => onTileAreaChange?.(value)}
                      min={50}
                      max={5000}
                      step={50}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Ship Radius: {shipRadius.toFixed(1)} m</label>
                    <Slider
                      value={[shipRadius]}
                      onValueChange={([value]) => onShipRadiusChange?.(value)}
                      min={1}
                      max={50}
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Live Diagnostics */}
              <div>
                <h4 className="font-semibold mb-4">Live Diagnostics</h4>
                
                {currentDiagnostics.viable ? (
                  <Badge className="bg-green-100 text-green-800 mb-4">✅ VIABLE DESIGN</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 mb-4">❌ FAILS CONSTRAINTS</Badge>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className={`flex justify-between ${currentDiagnostics.checks.mass_ok ? 'text-green-600' : 'text-red-600'}`}>
                    <span>Exotic Mass:</span>
                    <span>{currentDiagnostics.M_exotic.toFixed(0)} kg</span>
                  </div>
                  
                  <div className={`flex justify-between ${currentDiagnostics.checks.power_ok ? 'text-green-600' : 'text-red-600'}`}>
                    <span>Avg Power:</span>
                    <span>{(currentDiagnostics.P_avg/1e6).toFixed(1)} MW</span>
                  </div>
                  
                  <div className={`flex justify-between ${currentDiagnostics.checks.quantum_safe ? 'text-green-600' : 'text-red-600'}`}>
                    <span>Quantum ζ:</span>
                    <span>{currentDiagnostics.zeta.toFixed(3)}</span>
                  </div>
                  
                  <div className={`flex justify-between ${currentDiagnostics.checks.timescale_ok ? 'text-green-600' : 'text-red-600'}`}>
                    <span>TS Ratio:</span>
                    <span>{currentDiagnostics.TS_ratio.toFixed(3)}</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
                  <div>Total tiles: {formatScientific(currentDiagnostics.N_tiles)}</div>
                  <div>Hull area: {currentDiagnostics.A_hull.toFixed(1)} m²</div>
                  <div>Energy/tile: {formatScientific(currentDiagnostics.U_cycle)} J</div>
                </div>
              </div>
            </div>

            {/* Visualization Placeholder */}
            <div className="lg:col-span-2">
              <h4 className="font-semibold mb-4">Viability Phase Space</h4>
              
              {/* Simple grid visualization */}
              <div className="bg-muted rounded-lg p-4 h-96 flex items-center justify-center">
                <div className="text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Interactive Heat Map</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    🟦 Teal: Viable designs | 🟥 Red: Failed constraints
                  </p>
                  <p className="text-sm text-muted-foreground">
                    🟡 Current point: {currentDiagnostics.fail_reason}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p><strong>Constraints checked:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Exotic mass: 1000-2000 kg range</li>
                  <li>Power consumption: &lt; 100 MW</li>
                  <li>Quantum safety: ζ &lt; 1.0</li>
                  <li>Time-scale separation: &lt; 1.0</li>
                  <li>Geometric amplification: γ ≥ 20</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Export & Analysis */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export & Analysis
            </h4>
            
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  const data = {
                    current_design: {
                      tile_area_cm2: tileArea,
                      ship_radius_m: shipRadius,
                      viable: currentDiagnostics.viable,
                      exotic_mass_kg: currentDiagnostics.M_exotic,
                      power_MW: currentDiagnostics.P_avg / 1e6,
                      quantum_zeta: currentDiagnostics.zeta
                    }
                  };
                  console.log("Phase Data Export:", data);
                  alert("Phase data exported to console");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Phase Data
              </Button>
              
              <Button 
                variant="outline" 
                onClick={runTestPoints}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Quick Test Points
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}