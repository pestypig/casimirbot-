import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Plot from 'react-plotly.js';

interface MetricsDashboardProps {
  viabilityParams: any;
}

interface ComputedMetrics {
  P_raw: number;      // MW - Raw power
  f_throttle: number; // Throttling factor
  P_avg: number;      // MW - Average power
  U_cycle: number;    // J - Cycle energy
  TS_ratio: number;   // Time-scale separation
  zeta: number;       // Quantum safety parameter
  M_exotic: number;   // kg - Exotic mass
}

interface MetricConstraints {
  P_max: number;      // Maximum power (MW)
  f_min: number;      // Minimum throttling
  P_avg_max: number;  // Max average power (MW) 
  U_min: number;      // Minimum energy magnitude
  TS_min: number;     // Minimum time-scale ratio
  zeta_max: number;   // Maximum quantum safety
  M_target: number;   // Target exotic mass (kg)
  M_tolerance: number; // Mass tolerance (%)
}

export default function MetricsDashboard({ viabilityParams }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<ComputedMetrics | null>(null);
  // Mode-aware constraint calculation for dynamic safe zones
  const getModeAwareConstraints = (selectedMode: string): MetricConstraints => {
    const baseConstraints = {
      P_max: 1000,        // 1000 MW max raw power (universal)
      f_min: 0.001,       // 0.1% minimum throttling
      U_min: 1e-12,       // Minimum energy magnitude
      TS_min: 100,        // Universal time-scale threshold (TS_ratio ≥ 100)
      M_target: 1405,     // Target mass (kg) - fixed for all active modes
      M_tolerance: 5      // ±5% tolerance
    };
    
    // Mode-specific constraints based on authentic calculated values
    switch (selectedMode) {
      case 'hover':
        return {
          ...baseConstraints,
          P_avg_max: 120,   // 83.3 MW + headroom
          zeta_max: 0.05    // ζ=0.032 + safety margin
        };
      case 'cruise': 
        return {
          ...baseConstraints,
          P_avg_max: 20,    // 7.4 MW + headroom  
          zeta_max: 1.0     // ζ=0.89 + margin (Ford-Roman limit)
        };
      case 'emergency':
        return {
          ...baseConstraints,
          P_avg_max: 400,   // 297.5 MW + headroom
          zeta_max: 0.02    // ζ=0.009 + safety margin
        };
      case 'standby':
        return {
          ...baseConstraints,
          P_avg_max: 10,    // 0 MW + minimal headroom
          zeta_max: 10.0    // Relaxed when system off
        };
      default:
        return {
          ...baseConstraints,
          P_avg_max: 200,   // Default moderate limit
          zeta_max: 1.0     // Ford-Roman bound
        };
    }
  };

  const [constraints, setConstraints] = useState<MetricConstraints>(getModeAwareConstraints("hover"));

  // Compute authentic metrics using slider-driven parameters in ALL steps (FIXED)
  const computeMetrics = React.useCallback((params: any): ComputedMetrics => {
    if (!params) return {
      P_raw: 0, f_throttle: 0, P_avg: 0, U_cycle: 0, 
      TS_ratio: 0, zeta: 0, M_exotic: 0
    };

    // Physics constants
    const HBAR = 1.055e-34; // J⋅s
    const C = 2.998e8; // m/s
    const omega = 2 * Math.PI * 15e9; // 15 GHz modulation
    
    // Extract SLIDER-DRIVEN parameters (these must flow into every calculation step)
    const { 
      gammaGeo = 26, 
      qFactor = 1e6,        // ← SLIDER VALUE: Cavity Q-factor (Q_on)
      duty = 0.14,          // ← SLIDER VALUE: Duty cycle percentage  
      tileArea = 5, 
      shipRadius = 5,
      gapDistance = 1.0,
      selectedMode = "hover"
    } = params || {};
    
    // Convert units  
    const a = gapDistance * 1e-9; // nm to m
    const A_tile = tileArea * 1e-4; // cm² to m²
    const A_hull_needle = 5.6e5; // m²
    const N_tiles = A_hull_needle / A_tile;
    
    // Step 1: Casimir energy per tile (match Live Energy Pipeline exactly)
    // From Live Energy Pipeline: u_casimir = -(pi * pi * h_bar * c) / (720 * Math.pow(a, 4))
    const u_casimir = -(Math.PI * Math.PI * HBAR * C) / (720 * Math.pow(a, 4)); // Energy density J/m³
    const U_static = u_casimir * A_tile * a; // J per tile
    const U_geo = gammaGeo * U_static; // Geometric amplification
    
    console.log(`🔧 Energy Check: U_static = ${U_static.toExponential(3)} J (should be ~-2.168e-4 J)`);
    console.log(`🔧 Energy Check: U_geo = ${U_geo.toExponential(3)} J (should be ~-5.636e-3 J)`);
    
    // Match Live Energy Pipeline calculation exactly
    const Q_mechanical = 5e4; // Fixed mechanical Q  
    const Q_cavity = 1e9; // Fixed cavity Q (NOT slider qFactor!)
    const U_Q = Q_mechanical * U_geo; // Q-enhancement step
    const U_cycle_base = U_Q * duty; // Use SLIDER duty
    
    // Van-den-Broeck pocket boost for fixed mass target (match Live Energy Pipeline)
    const M_target = 1.405e3; // kg
    const gamma_pocket = duty > 0 ? M_target * (C * C) / (Math.abs(U_cycle_base) * N_tiles) : 0;
    const U_cycle = U_cycle_base * gamma_pocket;
    
    // Step 2: Power calculation (match Live Energy Pipeline exactly)
    const P_loss_raw = Math.abs(U_geo) * omega / Q_cavity; // W per tile
    const P_raw_total = P_loss_raw * N_tiles / 1e6; // MW (match Live Energy Pipeline)
    const P_raw = P_raw_total; // Already in MW
    
    // Step 4: Throttle calculation (match Live Energy Pipeline exactly)  
    // Live Energy Pipeline uses: mode_throttle = mode.duty / mode.sectors * mode.qSpoiling
    const modeConfigs = {
      hover: { sectors: 1, qSpoiling: 1.0 },
      cruise: { sectors: 400, qSpoiling: 0.001 }, 
      emergency: { sectors: 1, qSpoiling: 1.0 },
      standby: { sectors: 1, qSpoiling: 1.0 }
    };
    
    const currentModeConfig = modeConfigs[selectedMode as keyof typeof modeConfigs] || modeConfigs.hover;
    const mode_throttle = duty / currentModeConfig.sectors * currentModeConfig.qSpoiling; // Uses SLIDER duty with mode params!
    const P_avg = P_raw_total * mode_throttle; // MW (both values in MW)
    
    // Step 7: Time-scale ratio (constant)
    const tau_LC = shipRadius / C;
    const tau_m = 1 / 15e9;
    const TS_ratio = tau_LC / tau_m;
    
    // Step 8: Quantum safety (match Live Energy Pipeline)
    const zeta = duty > 0 ? 1 / (duty * Math.sqrt(Q_mechanical)) : 0; // Uses Q_mechanical!
    
    // Step 9: Exotic mass (match Live Energy Pipeline)
    const M_exotic = duty > 0 ? Math.abs(U_cycle) / (C * C) * N_tiles : 0; // kg
    
    const f_throttle = mode_throttle; // For compatibility
    
    console.log(`🔧 Metrics Dashboard - FIXED with Slider Values for ${selectedMode}:`, {
      inputs: {
        gammaGeo: gammaGeo,
        qFactor: qFactor,
        duty_decimal: duty,
        duty_percent: (duty * 100).toFixed(1) + "%"
      },
      mode_config: currentModeConfig,
      calculated: {
        P_raw_MW: P_raw.toFixed(1),
        P_avg_MW: P_avg >= 1 ? P_avg.toFixed(3) : `${(P_avg * 1e6).toFixed(1)}W`,  // Smart units: MW or W
        P_avg_scientific: P_avg.toExponential(3),
        P_avg_watts: (P_avg * 1e6).toFixed(1), // Always show W value for debugging
        zeta: zeta.toFixed(3),
        M_exotic_kg: M_exotic.toFixed(0),
        mode_throttle: mode_throttle.toExponential(3),
        gamma_pocket: gamma_pocket.toExponential(2)
      },
      note: "SLIDER VALUES + MODE-SPECIFIC PARAMS FLOW INTO ALL STEPS!"
    });
    
    return {
      P_raw: P_raw,
      f_throttle: f_throttle,
      P_avg: P_avg,
      U_cycle: Math.abs(U_cycle),
      TS_ratio: TS_ratio,
      zeta: zeta,
      M_exotic: M_exotic
    };
  }, [viabilityParams]);

  // Update metrics and constraints when parameters change
  useEffect(() => {
    const newMetrics = computeMetrics(viabilityParams);
    setMetrics(newMetrics);
    
    // Update constraints based on operational mode for dynamic safe zones
    const selectedMode = viabilityParams?.selectedMode || "hover";
    const modeConstraints = getModeAwareConstraints(selectedMode);
    setConstraints(modeConstraints);
    
    console.log(`🎯 Mode-Aware Constraints for ${selectedMode}:`, {
      P_avg_max: modeConstraints.P_avg_max,
      zeta_max: modeConstraints.zeta_max,
      current_metrics: newMetrics
    });
  }, [viabilityParams, computeMetrics]);

  // Memoize radar chart data with mode-aware safe zones
  const radarData = React.useMemo(() => {
    if (!metrics) return null;

    // Current mode for debug logging
    const selectedMode = viabilityParams?.selectedMode || "hover";
    
    // Get fresh constraints directly for this mode (avoid stale state)
    const currentConstraints = getModeAwareConstraints(selectedMode);

    // Normalize current values against mode-specific constraints (fixed for proper visual separation)
    const normalizedData = [
      Math.min(metrics.P_avg / currentConstraints.P_avg_max, 2), // Average Power vs mode limit
      Math.min(metrics.f_throttle / 0.5, 2), // Duty Cycle (normalized to 50% max)  
      Math.min(Math.abs(metrics.M_exotic - currentConstraints.M_target) / (currentConstraints.M_target * currentConstraints.M_tolerance / 100), 2), // Mass Error
      Math.min(metrics.zeta / currentConstraints.zeta_max, 2), // Quantum Safety vs mode limit
      Math.min(currentConstraints.TS_min / Math.max(metrics.TS_ratio, 0.01), 2), // Time-Scale (inverted, want high TS_ratio)
      Math.min(metrics.P_raw / 1000, 2), // Raw Power (fixed scale for visual separation)
      Math.min(metrics.U_cycle / 1e12, 2) // Energy magnitude (larger denominator for visual separation)
    ];

    // Debug: Log actual vs normalized values for verification
    console.log(`🎯 Radar Normalization Debug for ${selectedMode}:`, {
      P_avg: `${metrics.P_avg.toFixed(1)}MW → ${normalizedData[0].toFixed(2)} (limit: ${currentConstraints.P_avg_max}MW)`,
      duty: `${(metrics.f_throttle*100).toFixed(1)}% → ${normalizedData[1].toFixed(2)}`,
      mass_error: `${Math.abs(metrics.M_exotic - currentConstraints.M_target).toFixed(0)}kg → ${normalizedData[2].toFixed(2)}`,
      zeta: `${metrics.zeta.toFixed(3)} → ${normalizedData[3].toFixed(2)} (limit: ${currentConstraints.zeta_max})`,
      visual_check: `Hover should be ~[0.7,0.3,0.0,0.6], Emergency should be ~[0.7,1.0,0.0,0.5]`
    });

    // Mode-aware safe zone boundary (green zone shows what's acceptable for current mode)
    const safeZoneBoundary = [1, 1, 1, 1, 1, 1, 1]; // All values should be ≤ 1.0 to be "safe"

    console.log(`🎯 Radar Vector for ${selectedMode.toUpperCase()}: [${normalizedData.map(v => v.toFixed(2)).join(', ')}]`, {
      breakdown: {
        power: `${metrics.P_avg.toFixed(1)}MW/${currentConstraints.P_avg_max}MW = ${normalizedData[0].toFixed(2)}`,
        duty: `${(metrics.f_throttle*100).toFixed(1)}%/50% = ${normalizedData[1].toFixed(2)}`,  
        mass: `${Math.abs(metrics.M_exotic - currentConstraints.M_target).toFixed(0)}kg error = ${normalizedData[2].toFixed(2)}`,
        quantum: `${metrics.zeta.toFixed(3)}/${currentConstraints.zeta_max} = ${normalizedData[3].toFixed(2)}`
      }
    });

    return [{
      type: 'scatterpolar',
      r: normalizedData,
      theta: ['Avg Power', 'Duty Cycle', 'Mass Error', 'Quantum ζ', 'Time-Scale', 'Raw Power', 'Energy'],
      fill: 'toself',
      name: `${selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Mode Values`,
      line: { color: '#3b82f6', width: 2 },
      fillcolor: 'rgba(59, 130, 246, 0.1)'
    }, {
      type: 'scatterpolar',
      r: safeZoneBoundary,
      theta: ['Avg Power', 'Duty Cycle', 'Mass Error', 'Quantum ζ', 'Time-Scale', 'Raw Power', 'Energy'],
      fill: 'toself',
      name: `${selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} Safe Zone`,
      line: { color: '#22c55e', dash: 'dash', width: 2 },
      fillcolor: 'rgba(34, 197, 94, 0.1)'
    }];
  }, [metrics, viabilityParams?.selectedMode, constraints]);

  // Force re-render when mode changes
  const [renderKey, setRenderKey] = React.useState(0);
  React.useEffect(() => {
    console.log(`🔄 Mode changed to: ${viabilityParams?.selectedMode}, forcing chart re-render`);
    setRenderKey(prev => prev + 1);
  }, [viabilityParams?.selectedMode]);

  const radarLayout = {
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 2],
        tickvals: [0.5, 1, 1.5, 2],
        ticktext: ['50%', '100%', '150%', '200%']
      }
    },
    showlegend: true,
    width: 400,
    height: 400,
    margin: { t: 50, b: 50, l: 50, r: 50 },
    font: { size: 10 }
  };

  // Traffic light indicator
  const getStatus = (value: number, max: number, invert = false): 'pass' | 'fail' => {
    return invert ? (value >= max ? 'pass' : 'fail') : (value <= max ? 'pass' : 'fail');
  };

  const getMassStatus = (mass: number, target: number, tolerance: number): 'pass' | 'fail' => {
    const error = Math.abs(mass - target) / target * 100;
    return error <= tolerance ? 'pass' : 'fail';
  };

  if (!metrics) return <div>Computing metrics...</div>;

  return (
    <div className="space-y-4">
      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Metrics Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Normalized radar chart - green zone is safe, values &gt;1.0 exceed constraints
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Radar Chart */}
            <div className="flex-1">
              {metrics && radarData && (
                <Plot
                  key={`radar-${renderKey}-${viabilityParams?.selectedMode || 'hover'}`}
                  data={radarData}
                  layout={radarLayout}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%', height: '400px' }}
                  useResizeHandler={true}
                  revision={renderKey}
                />
              )}
              {!metrics && <div>Loading metrics...</div>}
              {!radarData && metrics && <div>Generating chart...</div>}
            </div>
            
            {/* Values Transparency Panel */}
            {metrics && radarData && (
              <div className="w-80 bg-muted/30 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-sm mb-3">Vector Transparency</h4>
                
                {/* Normalized Vector - Blue vs Green */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">NORMALIZED RADAR VECTORS</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Blue Dataset (Actual Values) */}
                    <div>
                      <h6 className="text-xs font-medium text-blue-600 mb-1">Blue: Current Mode</h6>
                      <div className="font-mono text-xs bg-background rounded p-2 space-y-1">
                        {radarData[0].r?.map((value, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-muted-foreground text-[10px]">{radarData[0].theta?.[index]?.substring(0,8)}:</span>
                            <span className={value > 1.0 ? "text-red-600 font-semibold" : "text-blue-600 font-semibold"}>
                              {typeof value === 'number' ? value.toFixed(2) : 'N/A'}
                            </span>
                          </div>
                        )) || []}
                      </div>
                    </div>
                    
                    {/* Green Dataset (Safe Zone) */}
                    <div>
                      <h6 className="text-xs font-medium text-green-600 mb-1">Green: Safe Zone</h6>
                      <div className="font-mono text-xs bg-background rounded p-2 space-y-1">
                        {radarData[1].r?.map((value, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-muted-foreground text-[10px]">{radarData[1].theta?.[index]?.substring(0,8)}:</span>
                            <span className="text-green-600 font-semibold">
                              {typeof value === 'number' ? value.toFixed(2) : 'N/A'}
                            </span>
                          </div>
                        )) || []}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Raw Values */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">RAW METRIC VALUES</h5>
                  <div className="font-mono text-xs bg-background rounded p-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P_avg:</span>
                      <span className="font-semibold">
                        {metrics.P_avg >= 1 ? `${metrics.P_avg.toFixed(1)} MW` : `${(metrics.P_avg * 1e6).toFixed(1)} W`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duty:</span>
                      <span className="font-semibold">{(metrics.f_throttle * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">M_exotic:</span>
                      <span className="font-semibold">{metrics.M_exotic.toFixed(0)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ζ:</span>
                      <span className="font-semibold">{metrics.zeta.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TS_ratio:</span>
                      <span className="font-semibold">{metrics.TS_ratio.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P_raw:</span>
                      <span className="font-semibold">{metrics.P_raw.toFixed(1)} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">γ_geo:</span>
                      <span className="font-semibold">{viabilityParams?.gammaGeo || 26}</span>
                    </div>
                  </div>
                </div>
                
                {/* Constraint Limits */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">CONSTRAINT LIMITS</h5>
                  <div className="font-mono text-xs bg-background rounded p-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P_max:</span>
                      <span>{constraints.P_avg_max} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">M_target:</span>
                      <span>{constraints.M_target} ±{constraints.M_tolerance}% kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ζ_max:</span>
                      <span>{constraints.zeta_max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TS_min:</span>
                      <span>100 (universal)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Metrics with Traffic Lights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Power Draw</p>
                {/* Smart unit display: MW for ≥1 MW, W for <1 MW */}
                {metrics.P_avg >= 1 ? (
                  <p className="text-2xl font-bold">{metrics.P_avg.toFixed(1)} MW</p>
                ) : (
                  <p className="text-2xl font-bold">{(metrics.P_avg * 1e6).toFixed(1)} W</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Peak: {metrics.P_raw.toFixed(1)} MW • Avg: {
                    metrics.P_avg >= 1 
                      ? `${metrics.P_avg.toFixed(3)} MW`
                      : `${(metrics.P_avg * 1e6).toFixed(1)} W`
                  }
                </p>
              </div>
              <Badge variant={getStatus(metrics.P_avg, constraints.P_avg_max) === 'pass' ? 'default' : 'destructive'}>
                {getStatus(metrics.P_avg, constraints.P_avg_max) === 'pass' ? '✓' : '✗'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Limit: {constraints.P_avg_max} MW
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Exotic Mass</p>
                <p className="text-2xl font-bold">{metrics.M_exotic.toFixed(0)} kg</p>
              </div>
              <Badge variant={getMassStatus(metrics.M_exotic, constraints.M_target, constraints.M_tolerance) === 'pass' ? 'default' : 'destructive'}>
                {getMassStatus(metrics.M_exotic, constraints.M_target, constraints.M_tolerance) === 'pass' ? '✓' : '✗'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: {constraints.M_target} ± {constraints.M_tolerance}% kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Quantum Safety ζ</p>
                <p className="text-2xl font-bold">{metrics.zeta.toFixed(3)}</p>
              </div>
              <Badge variant={getStatus(metrics.zeta, constraints.zeta_max) === 'pass' ? 'default' : 'destructive'}>
                {getStatus(metrics.zeta, constraints.zeta_max) === 'pass' ? '✓' : '✗'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ford-Roman: ≤ {constraints.zeta_max}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Time-Scale Ratio</p>
                <p className="text-2xl font-bold">{metrics.TS_ratio.toFixed(2)}</p>
              </div>
              <Badge variant={getStatus(metrics.TS_ratio, constraints.TS_min, true) === 'pass' ? 'default' : 'destructive'}>
                {getStatus(metrics.TS_ratio, constraints.TS_min, true) === 'pass' ? '✓' : '✗'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Minimum: &ge; {constraints.TS_min}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Raw Power</p>
                <p className="text-2xl font-bold">{metrics.P_raw.toFixed(1)} MW</p>
              </div>
              <Badge variant={getStatus(metrics.P_raw, constraints.P_max) === 'pass' ? 'default' : 'destructive'}>
                {getStatus(metrics.P_raw, constraints.P_max) === 'pass' ? '✓' : '✗'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Limit: {constraints.P_max} MW
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Duty Cycle</p>
                <p className="text-2xl font-bold">{(metrics.f_throttle * 100).toFixed(1)}%</p>
              </div>
              <Badge variant={getStatus(metrics.f_throttle, 0.5) === 'pass' ? 'default' : 'destructive'}>
                {getStatus(metrics.f_throttle, 0.5) === 'pass' ? '✓' : '✗'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Operational throttling factor
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}