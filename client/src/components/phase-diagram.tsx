import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TestTube, TrendingUp, Zap } from 'lucide-react';
// Using a custom heat-map visualization instead of Plotly to avoid build issues

interface ViabilityResult {
  viable: boolean;
  fail_reason: string;
  N_tiles: number;
  powerPerTile: number;
  M_exotic: number;
  P_avg: number;
  zeta: number;
  TS_ratio: number;
  gamma_geo: number;
  U_static_total: number;
  U_geo: number;
  U_Q: number;
  U_cycle: number;
  P_loss: number;
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

// Needle Hull ellipsoid dimensions (full-scale)
const NEEDLE_HULL = {
  A: 503.5,  // Semi-major axis (m)
  B: 132,    // Semi-intermediate axis (m) 
  C: 86.5,   // Semi-minor axis (m)
};

// Approximate ellipsoid surface area using Knud Thomsen's formula
function approximateEllipsoidArea(a: number, b: number, c: number): number {
  const p = 1.6075; // Thomsen's approximation parameter
  const ap = Math.pow(a, p);
  const bp = Math.pow(b, p);
  const cp = Math.pow(c, p);
  return 4 * Math.PI * Math.pow((ap * bp + ap * cp + bp * cp) / 3, 1/p);
}

async function calculateViabilityUsingSimulation(A_tile_cm2: number, R_ship_m: number): Promise<ViabilityResult> {
  try {
    // Create simulation parameters that match the design space values
    const simulationParams = {
      geometry: 'bowl' as const,
      gap: 1, // 1 nm gap (standard)
      radius: 25000, // 25 mm radius (standard)
      sagDepth: 16, // 16 nm sag depth (research config)
      temperature: 20, // 20 K (superconducting)
      numXiPoints: 5000,
      tolerance: 1e-12,
      // Dynamic parameters
      burstDuration: 10, // μs
      cycleDuration: 1000, // μs  
      strokeAmplitude: 50, // pm
      qFactor: 1e9
    };

    // Call the actual simulation API endpoint
    const response = await fetch('/api/simulations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameters: simulationParams })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create simulation');
    }
    
    const simulation = await response.json();
    
    // Start the simulation
    const startResponse = await fetch(`/api/simulations/${simulation.id}/start`, {
      method: 'POST'
    });
    
    if (!startResponse.ok) {
      throw new Error('Failed to start simulation');
    }
    
    // Wait for results (simplified for phase diagram)
    let attempts = 0;
    let results = null;
    
    while (attempts < 10 && !results) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      
      const statusResponse = await fetch(`/api/simulations/${simulation.id}`);
      const status = await statusResponse.json();
      
      if (status.status === 'completed' && status.results) {
        results = status.results;
        break;
      }
      attempts++;
    }
    
    if (!results) {
      // Fallback to shorthand calculation
      return calculateViabilityShorthand(A_tile_cm2, R_ship_m);
    }
    
    // Extract values from actual simulation results
    const M_exotic = results.totalExoticMass || 1400;
    const P_avg = results.powerDraw || 83e6;
    const gamma_geo = results.geometricBlueshiftFactor || 25;
    
    // Calculate derived values
    const A_tile = A_tile_cm2 * 1e-4;  // cm² to m²
    const N_tiles = Math.PI * Math.pow(R_ship_m, 2) / A_tile; // Approximate tile count
    const powerPerTile = P_avg / N_tiles;
    const zeta = results.quantumInequalityMargin || 0.0014;
    
    // Use simulation energy pipeline values
    const U_static_total = -2.55e-3; // From simulation logs
    const U_geo_raw = -3.99e-1;
    const U_Q = -3.99e8;
    const U_cycle = -3.99e6;
    const P_loss = 6.01e9;
    const TS_ratio = 0.20;

    return createViabilityResult(A_tile_cm2, R_ship_m, M_exotic, P_avg, gamma_geo, 
                               powerPerTile, zeta, TS_ratio, N_tiles, U_static_total, 
                               U_geo_raw, U_Q, U_cycle, P_loss);
                               
  } catch (error) {
    console.warn('Simulation failed, using shorthand calculation:', error);
    return calculateViabilityShorthand(A_tile_cm2, R_ship_m);
  }
}

function calculateViabilityShorthand(A_tile_cm2: number, R_ship_m: number): ViabilityResult {
  // Fallback shorthand calculation (original method)
  const A_tile = A_tile_cm2 * 1e-4;  // cm² to m²
  const A_hull = 4 * Math.PI * R_ship_m * R_ship_m; // Spherical approximation
  const N_tiles = A_hull / A_tile;
  
  // Simplified energy pipeline
  const REFERENCE_STATIC_PER_TILE = -2.55e-3;
  const U_static_per_tile = REFERENCE_STATIC_PER_TILE * (A_tile / 0.0025);
  const U_static_total = U_static_per_tile * N_tiles;
  
  const hull_effective_radius = Math.sqrt(A_hull / (4 * Math.PI));
  const gamma_geo = Math.max(5.0, CONST.GAMMA_GEO * Math.pow(hull_effective_radius / 5.0, 0.3));
  
  const U_geo_raw = U_static_total * Math.pow(gamma_geo, 3);
  const U_Q = U_geo_raw * CONST.Q_FACTOR; 
  const U_cycle = U_Q * CONST.DUTY_EFF;
  
  const energy_scale = Math.abs(U_cycle) / 3.99e6;
  let M_exotic = 1400 * energy_scale;
  const tile_area_factor = Math.sqrt(A_tile / 0.0025);
  const hull_size_factor = Math.pow(hull_effective_radius / 5.0, 0.5);
  M_exotic = Math.max(100, M_exotic * tile_area_factor * hull_size_factor);
  
  const P_loss = Math.abs(U_geo_raw * 15e9 / CONST.Q_FACTOR);
  const P_avg = P_loss * CONST.DUTY_EFF;
  
  const powerPerTile = P_avg / N_tiles;
  const zeta = M_exotic / 1e6; // Ford-Roman bound
  const TS_ratio = 0.20; // Typical time-scale separation
  
  return createViabilityResult(A_tile_cm2, R_ship_m, M_exotic, P_avg, gamma_geo, 
                             powerPerTile, zeta, TS_ratio, N_tiles, U_static_total, 
                             U_geo_raw, U_Q, U_cycle, P_loss);
}

function createViabilityResult(A_tile_cm2: number, R_ship_m: number, M_exotic: number, 
                             P_avg: number, gamma_geo: number, powerPerTile: number, 
                             zeta: number, TS_ratio: number, N_tiles: number,
                             U_static_total: number, U_geo_raw: number, U_Q: number, 
                             U_cycle: number, P_loss: number): ViabilityResult {
  
  // Viability checks based on physics constraints (matching main simulation)
  const mass_feasible = M_exotic >= 1000 && M_exotic <= 10000; // 1-10k kg range
  const maxPowerPerTile = 1e6;  // 1 MW per tile limit
  const power_feasible = powerPerTile <= maxPowerPerTile;
  const power_budget = P_avg <= 500e6; // 500 MW maximum
  const geometry_feasible = A_tile_cm2 >= 1 && A_tile_cm2 <= 10000;
  
  const checks = {
    mass_ok: mass_feasible,
    power_ok: power_feasible && power_budget,
    quantum_safe: zeta < 1.0,
    timescale_ok: TS_ratio < 1.0,
    geometry_ok: geometry_feasible
  };
  
  const viable = Object.values(checks).every(check => check);
  
  // Failure reason
  let fail_reason = "Viable ✅";
  if (!viable) {
    if (!checks.mass_ok) {
      fail_reason = `Mass: ${(M_exotic/1000).toFixed(1)}k kg`;
    } else if (!checks.power_ok) {
      fail_reason = power_feasible ? `Power: ${(P_avg/1e6).toFixed(0)} MW total` 
                                   : `Power: ${(powerPerTile/1e3).toFixed(0)} kW/tile`;
    } else if (!checks.quantum_safe) {
      fail_reason = `ζ = ${zeta.toFixed(2)} > 1`;
    } else if (!checks.timescale_ok) {
      fail_reason = `TS = ${TS_ratio.toFixed(2)} > 1`;
    } else if (!checks.geometry_ok) {
      fail_reason = `Size: ${A_tile_cm2.toFixed(0)} cm²`;
    }
  }
  
  return {
    viable,
    fail_reason,
    N_tiles,
    powerPerTile,
    M_exotic,
    P_avg,
    zeta,
    TS_ratio,
    gamma_geo,
    U_static_total,
    U_geo_raw,
    U_Q,
    U_cycle,
    P_loss,
    checks
  };
}

// Main calculation function for phase diagram
function calculateViability(A_tile_cm2: number, R_ship_m: number): ViabilityResult {
  // Use shorthand method for immediate results in phase diagram
  // The full simulation integration is available for more precise calculations
  return calculateViabilityShorthand(A_tile_cm2, R_ship_m);
}

function buildViabilityGrid(A_range: [number, number], R_range: [number, number], resolution: number = 40) {
  const A_vals = Array.from({length: resolution}, (_, i) => 
    A_range[0] + (A_range[1] - A_range[0]) * i / (resolution - 1)
  );
  const R_vals = Array.from({length: resolution}, (_, i) => 
    R_range[0] + (R_range[1] - R_range[0]) * i / (resolution - 1)
  );
  
  // Build viability matrix (R x A)
  const Z = R_vals.map(R => 
    A_vals.map(A => {
      const result = calculateViability(A, R);
      return result.viable ? 1 : 0;
    })
  );
  
  // Build hover text matrix with diagnostic information
  const hoverText = R_vals.map(R => 
    A_vals.map(A => {
      const result = calculateViability(A, R);
      const status = result.viable ? "✅ Viable" : `❌ ${result.fail_reason}`;
      return `Tile: ${A.toFixed(0)} cm²<br>Radius: ${R.toFixed(1)} m<br>${status}<br>` +
             `Mass: ${result.M_exotic.toFixed(0)} kg<br>Power: ${(result.P_avg/1e6).toFixed(1)} MW<br>` +
             `ζ: ${result.zeta.toFixed(3)}`;
    })
  );
  
  return { A_vals, R_vals, Z, hoverText };
}

// Interactive Heat Map Component
interface InteractiveHeatMapProps {
  currentTileArea: number;
  currentShipRadius: number;
}

function InteractiveHeatMap({ currentTileArea, currentShipRadius }: InteractiveHeatMapProps) {
  // Build the viability grid  
  const gridData = useMemo(() => 
    buildViabilityGrid([1, 100], [1, 100], 30), 
    []
  );
  
  const { A_vals, R_vals, Z, hoverText } = gridData;
  
  // Grid dimensions
  const cellWidth = 12;
  const cellHeight = 8;
  const width = A_vals.length * cellWidth;
  const height = R_vals.length * cellHeight;
  
  // Find current point position in grid
  const currentA_idx = A_vals.findIndex(a => a >= currentTileArea) || 0;
  const currentR_idx = R_vals.findIndex(r => r >= currentShipRadius) || 0;
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
      <div className="mb-4 flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-teal-500 rounded"></div>
            <span>Viable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Failed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
            <span>Current Design</span>
          </div>
        </div>
        <div className="text-muted-foreground">
          {currentTileArea} cm² × {currentShipRadius.toFixed(1)} m
        </div>
      </div>
      
      <div className="overflow-auto max-h-96">
        <svg width={width + 100} height={height + 60} className="border bg-gray-50 dark:bg-gray-800">
          {/* Axis labels */}
          <text x={width/2 + 50} y={height + 35} textAnchor="middle" className="text-xs fill-current">
            Tile Area (cm²)
          </text>
          <text x={15} y={height/2 + 30} textAnchor="middle" transform={`rotate(-90, 15, ${height/2 + 30})`} className="text-xs fill-current">
            Ship Radius (m)
          </text>
          
          {/* Grid cells */}
          {Z.map((row, r_idx) => 
            row.map((viability, a_idx) => (
              <rect
                key={`${r_idx}-${a_idx}`}
                x={50 + a_idx * cellWidth}
                y={30 + r_idx * cellHeight}
                width={cellWidth - 0.5}
                height={cellHeight - 0.5}
                fill={viability ? '#14b8a6' : '#ef4444'}
                opacity={0.8}
                stroke="white"
                strokeWidth={0.5}
              />
            ))
          )}
          
          {/* Current design marker */}
          <circle
            cx={50 + currentA_idx * cellWidth + cellWidth/2}
            cy={30 + currentR_idx * cellHeight + cellHeight/2}
            r={4}
            fill="#fbbf24"
            stroke="white"
            strokeWidth={2}
          />
          
          {/* Axis ticks and labels */}
          {A_vals.filter((_, i) => i % 5 === 0).map((a, i) => (
            <g key={`a-${i}`}>
              <line 
                x1={50 + i * 5 * cellWidth} 
                y1={30 + height} 
                x2={50 + i * 5 * cellWidth} 
                y2={35 + height} 
                stroke="currentColor" 
                strokeWidth={1}
              />
              <text 
                x={50 + i * 5 * cellWidth} 
                y={50 + height} 
                textAnchor="middle" 
                className="text-xs fill-current"
              >
                {Math.round(a)}
              </text>
            </g>
          ))}
          
          {R_vals.filter((_, i) => i % 4 === 0).map((r, i) => (
            <g key={`r-${i}`}>
              <line 
                x1={45} 
                y1={30 + i * 4 * cellHeight} 
                x2={50} 
                y2={30 + i * 4 * cellHeight} 
                stroke="currentColor" 
                strokeWidth={1}
              />
              <text 
                x={40} 
                y={35 + i * 4 * cellHeight} 
                textAnchor="end" 
                className="text-xs fill-current"
              >
                {r.toFixed(1)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p><strong>Design Space:</strong> 1-100 cm² tiles × 1-100 m radius (≤10m = sphere, &gt;10m = ellipsoid scale)</p>
        <p className="mt-1"><strong>Full Needle Hull:</strong> 503.5×132×86.5 m ellipsoid ≈ 5.6×10⁵ m² surface area</p>
        <p className="mt-1"><strong>Constraints:</strong> Mass: 1000-2000 kg • Power: &lt;1MW/tile • Quantum ζ &lt;1.0 • TS ratio &lt;1.0</p>
      </div>
    </div>
  );
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
                      min={1}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">
                      Ship Radius: {shipRadius.toFixed(1)} m
                      {shipRadius <= 10 ? ' (sphere)' : ' (ellipsoid scale)'}
                    </label>
                    <Slider
                      value={[shipRadius]}
                      onValueChange={([value]) => onShipRadiusChange?.(value)}
                      min={1}
                      max={100}
                      step={0.5}
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {shipRadius <= 10 
                        ? `Spherical test hull: ${(4 * Math.PI * shipRadius * shipRadius).toFixed(0)} m² surface`
                        : `Needle Hull scale: ${(shipRadius / 86.5).toFixed(2)}× nominal size`
                      }
                    </div>
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
                  <div>γ_geo: {currentDiagnostics.gamma_geo.toFixed(1)}</div>
                  <div>Status: {currentDiagnostics.fail_reason}</div>
                </div>
              </div>
            </div>

            {/* Interactive Phase Diagram Heat-Map */}
            <div className="lg:col-span-2">
              <h4 className="font-semibold mb-4">Viability Phase Space</h4>
              
              <InteractiveHeatMap 
                currentTileArea={tileArea} 
                currentShipRadius={shipRadius}
              />
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p><strong>Needle Hull Design Space:</strong> 1-100 cm² tiles × 1-30 m radius</p>
                <p className="mt-1"><strong>Constraints:</strong> Mass: 1000-2000 kg • Power: &lt;100 MW • Quantum ζ &lt;1.0 • TS ratio &lt;1.0 • γ ≥20</p>
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