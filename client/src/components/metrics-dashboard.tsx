import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEnergyPipeline, MODE_CONFIGS, PIPE_CONST } from '@/hooks/use-energy-pipeline';
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

// Smart power formatter (MW→kW→W)
const fmtPowerUnit = (mw?: number) => {
  const x = Number(mw);
  if (!Number.isFinite(x)) return "—";
  if (x >= 1) return `${x.toFixed(1)} MW`;
  if (x >= 1e-3) return `${(x * 1e3).toFixed(1)} kW`;
  return `${(x * 1e6).toFixed(1)} W`;
};

// derive instantaneous active tiles from pipeline/system state
const deriveActiveTiles = (
  totalTiles?: number,
  sectors?: number,
  duty?: number,
  mode?: 'standby'|'hover'|'cruise'|'emergency'
) => {
  if (!Number.isFinite(totalTiles) || !Number.isFinite(sectors) || (sectors as number) <= 0) return undefined;
  if (mode === 'standby' || !Number.isFinite(duty) || (duty as number) <= 0) return 0;

  const BURST = 0.01; // pipeline's BURST_DUTY_LOCAL
  if ((sectors as number) > 1) {
    // one sector at a time; only 1% of that sector is ON in the local window
    return Math.round(((totalTiles as number) / (sectors as number)) * BURST);
  } else {
    // no strobing; duty-eligible fraction, still burst-gated
    return Math.round((totalTiles as number) * (duty as number) * BURST);
  }
};

// Mode-aware fallback using pipeline targets
const MODE_TARGET = {
  hover:     { P_W: 83.3e6,   M_kg: 1000 },
  cruise:    { P_W: 7.437e3,  M_kg: 1000 }, // 7.437 kW
  emergency: { P_W: 297.5e6,  M_kg: 1000 },
  standby:   { P_W: 0,        M_kg: 0 }
} as const;

const getPhysicsDefaults = (mode: string, pipeline: any) => {
  const modeKey = mode as keyof typeof MODE_TARGET;
  const target = MODE_TARGET[modeKey] || MODE_TARGET.hover;
  
  return {
    powerAvg_MW: Number.isFinite(pipeline?.P_avg) ? pipeline.P_avg : (target.P_W / 1e6),
    exoticMass_kg: Number.isFinite(pipeline?.M_exotic) ? pipeline.M_exotic : target.M_kg,
    gammaVanDenBroeck: Number.isFinite(pipeline?.gammaVanDenBroeck) ? pipeline.gammaVanDenBroeck : 3.83e1,
    tsRatio: Number.isFinite(pipeline?.TS_ratio) ? pipeline.TS_ratio : 5.03e4, // L_long=1007m × f=15GHz / c
  };
};

export default function MetricsDashboard({ viabilityParams }: MetricsDashboardProps) {
  // Authoritative live pipeline snapshot (already kept fresh by your backend/hooks)
  const { data: pipeline } = useEnergyPipeline();
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

  const liveMode: string =
    ((pipeline as any)?.currentMode as string) ||
    (viabilityParams?.selectedMode as string) ||
    'hover';
  const [constraints, setConstraints] = useState<MetricConstraints>(getModeAwareConstraints(liveMode));

  // Live constraint/target pack from backend (if provided), with safe fallbacks.
  // If you later add a `constraints` object on the server, these will bind automatically.
  const serverConstraints = (pipeline as any)?.constraints ?? {};
  const liveTargets = {
    // Power caps
    P_max: Number.isFinite(serverConstraints.P_max) ? serverConstraints.P_max : 1000,
    P_avg_max: Number.isFinite(serverConstraints.P_avg_max)
      ? serverConstraints.P_avg_max
      : getModeAwareConstraints(liveMode).P_avg_max,

    // Time-scale minimum
    TS_min: Number.isFinite(serverConstraints.TS_min)
      ? serverConstraints.TS_min
      : 100,

    // Ford–Roman zeta bound
    zeta_max: Number.isFinite(serverConstraints.zeta_max)
      ? serverConstraints.zeta_max
      : getModeAwareConstraints(liveMode).zeta_max,

    // Mass target/tolerance (server wins)
    M_target: Number.isFinite((pipeline as any)?.exoticMassTarget_kg)
      ? (pipeline as any).exoticMassTarget_kg
      : getModeAwareConstraints(liveMode).M_target,
    M_tolerance: Number.isFinite(serverConstraints.M_tolerance)
      ? serverConstraints.M_tolerance
      : getModeAwareConstraints(liveMode).M_tolerance,
  };

  // Safe accessors mapped to pipeline interface field names
  const P_avg = Number.isFinite((pipeline as any)?.P_avg) ? (pipeline as any).P_avg : 0;          // MW
  // Duty priority: effective (server) → UI (server) → mode default (client)
  const dutyEff = Number.isFinite((pipeline as any)?.dutyEffective_FR)
    ? (pipeline as any).dutyEffective_FR as number
    : undefined;
  const dutyUi = Number.isFinite((pipeline as any)?.dutyCycle)
    ? (pipeline as any).dutyCycle as number
    : undefined;
  const dutyModeDefault = (() => {
    const m = ((pipeline as any)?.currentMode as keyof typeof MODE_CONFIGS) || 'hover';
    return MODE_CONFIGS[m]?.dutyCycle;
  })();
  const dutyFrac = (dutyEff ?? dutyUi ?? dutyModeDefault ?? 0);
  const M_exotic = Number.isFinite((pipeline as any)?.M_exotic) ? (pipeline as any).M_exotic : 0; // kg
  const TS_ratio = Number.isFinite((pipeline as any)?.TS_ratio) ? (pipeline as any).TS_ratio : 5.03e4; // Physics-accurate default: L_long×f/c
  // ζ computation: pipeline first, then computed from duty effective, no hard fallbacks
  const zeta = Number.isFinite((pipeline as any)?.zeta) ? (pipeline as any).zeta : 
    (Number.isFinite(dutyEff) ? (1 / ((dutyEff as number) * Math.sqrt(1e12))) : undefined);
  
  // Prefer a true raw (instant/peak) power from backend if available; keep units = MW
  const P_raw = Number.isFinite((pipeline as any)?.P_raw)
    ? (pipeline as any).P_raw
    : P_avg; // fallback

  // Keep per-tile loss (W/tile) separate so we don't mix units
  const P_loss_W_per_tile = Number.isFinite((pipeline as any)?.P_loss_raw)
    ? (pipeline as any).P_loss_raw
    : undefined;

  // Safe formatters that won't throw
  const f0 = (n?: number) => Number.isFinite(n as number) ? (n as number).toFixed(0) : "—";
  const f1 = (n?: number) => Number.isFinite(n as number) ? (n as number).toFixed(1) : "—";
  const f2 = (n?: number) => Number.isFinite(n as number) ? (n as number).toFixed(2) : "—";
  const f3 = (n?: number) => Number.isFinite(n as number) ? (n as number).toFixed(3) : "—";

  // Convert to dashboard format using safe accessors
  const dashboardMetrics = React.useMemo(() => {
    if (!pipeline) return null;
    
    return {
      P_raw,
      f_throttle: dutyFrac,
      P_avg,
      U_cycle: 0, // Not needed for this conversion
      TS_ratio,
      zeta,
      M_exotic
    };
  }, [pipeline, P_avg, dutyFrac, M_exotic, TS_ratio, zeta, P_raw]);

  // Update constraints when parameters change
  useEffect(() => {
    // Always derive constraints from the *live* mode, with prop fallback
    const selectedMode = liveMode || viabilityParams?.selectedMode || "hover";
    const modeConstraints = getModeAwareConstraints(selectedMode);
    setConstraints(modeConstraints);
    
    console.log(`🎯 Mode-Aware Constraints for ${selectedMode}:`, {
      P_avg_max: modeConstraints.P_avg_max,
      zeta_max: modeConstraints.zeta_max
    });
  }, [viabilityParams, liveMode]);

  // Memoize radar chart data with mode-aware safe zones
  const radarData = React.useMemo(() => {
    if (!dashboardMetrics) return null;

    // Current mode for debug logging (pipeline wins)
    const selectedMode = liveMode || viabilityParams?.selectedMode || "hover";
    
    // Prefer live targets from the backend; fall back to client mode-aware limits
    const currentConstraints = {
      P_avg_max: liveTargets.P_avg_max,
      zeta_max: liveTargets.zeta_max,
      TS_min: liveTargets.TS_min,
      P_max: liveTargets.P_max,
      M_target: liveTargets.M_target,
      M_tolerance: liveTargets.M_tolerance,
    };

    // Define constraint types for proper normalization (all values should be ≤ 1 when safe)
    const rawValues = {
      P_avg: dashboardMetrics.P_avg,
      duty: dashboardMetrics.f_throttle,
      mass_error:
        Math.abs(dashboardMetrics.M_exotic - currentConstraints.M_target) /
        (currentConstraints.M_target * currentConstraints.M_tolerance / 100),
      zeta: dashboardMetrics.zeta,
      TS_ratio: dashboardMetrics.TS_ratio,
      P_raw: dashboardMetrics.P_raw,
      U_cycle: Math.abs(dashboardMetrics.U_cycle)
    };

    const constraints = [
      { value: rawValues.P_avg, limit: currentConstraints.P_avg_max, type: 'max' }, // Average Power
      { value: rawValues.duty, limit: 0.5, type: 'max' }, // Duty Cycle (50% max)
      { value: rawValues.mass_error, limit: 1.0, type: 'max' }, // Mass Error (already normalized)
      { value: rawValues.zeta, limit: currentConstraints.zeta_max, type: 'max' }, // Quantum Safety
      { value: rawValues.TS_ratio, limit: currentConstraints.TS_min, type: 'min' }, // Time-Scale (MINIMUM requirement)
      { value: rawValues.P_raw, limit: currentConstraints.P_max, type: 'max' }, // Raw Power
      { value: rawValues.U_cycle, limit: 1e12, type: 'max' } // Energy magnitude
    ];

    // Normalize each constraint properly based on type
    const normalizedData = constraints.map(({ value, limit, type }) => {
      if (type === 'max') {
        // Safe if value ≤ limit, normalize as value/limit
        return Math.min(value / limit, 2);
      } else {
        // type === 'min', safe if value ≥ limit, normalize as limit/value  
        return Math.min(limit / Math.max(value, 0.01), 1); // Prevent division by zero
      }
    });



    // Mode-aware safe zone boundary (green zone shows what's acceptable for current mode)
    const safeZoneBoundary = [1, 1, 1, 1, 1, 1, 1]; // All values should be ≤ 1.0 to be "safe"

    // Debug: Log actual vs normalized values for verification (only if data is ready)
    if (pipeline && normalizedData?.length >= 5) {
      console.log(`🎯 Radar Normalization Debug for ${selectedMode}:`, {
        P_avg: `${f1(P_avg)}MW → ${f2(normalizedData[0])} (limit: ${currentConstraints.P_avg_max}MW)`,
        duty: `${f1(dutyFrac * 100)}% → ${f2(normalizedData[1])}`,
        mass_error: `${f0(Math.abs(M_exotic - currentConstraints.M_target))}kg → ${f2(normalizedData[2])}`,
        zeta: `${f2(zeta)} → ${f2(normalizedData[3])} (limit ≤ ${currentConstraints.zeta_max})`,
        TS_ratio: `${f1(TS_ratio)} → ${f2(normalizedData[4])} (min ≥ ${currentConstraints.TS_min})`,
      });
    }

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
  }, [dashboardMetrics, viabilityParams?.selectedMode, liveTargets, liveMode]);

  // Force re-render when mode changes
  const [renderKey, setRenderKey] = React.useState(0);
  React.useEffect(() => {
    console.log(`🔄 Mode changed to: ${liveMode || viabilityParams?.selectedMode}, forcing chart re-render`);
    setRenderKey(prev => prev + 1);
  }, [viabilityParams?.selectedMode, liveMode]);

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

  if (!pipeline) return <div>Computing metrics...</div>;

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
              {pipeline && radarData && (
                <Plot
                  key={`radar-${renderKey}-${liveMode || viabilityParams?.selectedMode || 'hover'}`}
                  data={radarData}
                  layout={radarLayout}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%', height: '400px' }}
                  useResizeHandler={true}
                  revision={renderKey}
                />
              )}
              {!dashboardMetrics && <div>Loading metrics...</div>}
              {!radarData && dashboardMetrics && <div>Generating chart...</div>}
            </div>
            
            {/* Values Transparency Panel */}
            {dashboardMetrics && radarData && (
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
                        {fmtPowerUnit(P_avg)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duty:</span>
                      <span className="font-semibold">
                        {f1(dutyFrac * 100)}%
                        {Number.isFinite(dutyEff) && Number.isFinite(dutyUi) && dutyEff !== dutyUi && (
                          <span className="text-muted-foreground"> (eff), UI {f1((dutyUi as number) * 100)}%</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">M_exotic:</span>
                      <span className="font-semibold">{f0(M_exotic)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ζ:</span>
                      <span className="font-semibold">{f3(zeta)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TS_ratio:</span>
                      <span className="font-semibold">{f1(TS_ratio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P_raw:</span>
                      <span className="font-semibold">{fmtPowerUnit(P_raw)}</span>
                    </div>
                    {Number.isFinite(P_loss_W_per_tile) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">P_loss:</span>
                        <span className="font-semibold">{f1(P_loss_W_per_tile)} W/tile</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">γ_geo:</span>
                      <span className="font-semibold">{viabilityParams?.gammaGeo || 26}</span>
                    </div>
                  </div>
                </div>
                
                {/* Constraint Limits */}
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">
                    CONSTRAINT LIMITS
                    <span className="text-[10px] ml-2 opacity-60">
                      ({Number.isFinite((pipeline as any)?.exoticMassTarget_kg) || Number.isFinite(serverConstraints.P_max) ? 'server' : 'defaults'})
                    </span>
                  </h5>
                  <div className="font-mono text-xs bg-background rounded p-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P_max:</span>
                      <span>{liveTargets.P_avg_max} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">M_target:</span>
                      <span>{liveTargets.M_target} ±{liveTargets.M_tolerance}% kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ζ_max:</span>
                      <span>{liveTargets.zeta_max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TS_min:</span>
                      <span>{liveTargets.TS_min}</span>
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
                <p className="text-2xl font-bold">{fmtPowerUnit(P_avg)}</p>
                <p className="text-xs text-muted-foreground">
                  Peak: {fmtPowerUnit(P_raw)} • Avg: {fmtPowerUnit(P_avg)}
                </p>
              </div>
              <Badge variant={getStatus(P_avg, constraints.P_avg_max) === 'pass' ? 'default' : 'destructive'}>
                {getStatus(P_avg, constraints.P_avg_max) === 'pass' ? '✓' : '✗'}
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
                <p className="text-2xl font-bold">{f0(M_exotic)} kg</p>
              </div>
              <Badge variant={getMassStatus(M_exotic, constraints.M_target, constraints.M_tolerance) === 'pass' ? 'default' : 'destructive'}>
                {getMassStatus(M_exotic, constraints.M_target, constraints.M_tolerance) === 'pass' ? '✓' : '✗'}
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
                <p className="text-2xl font-bold">{f3(zeta ?? 0)}</p>
              </div>
              <Badge variant={getStatus(zeta ?? 0, constraints.zeta_max) === 'pass' ? 'default' : 'destructive'}>
                {getStatus(zeta ?? 0, constraints.zeta_max) === 'pass' ? '✓' : '✗'}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-2xl font-bold cursor-help">
                      {f2(TS_ratio)}
                    </p>
                  </TooltipTrigger>
                  {pipeline && (
                    <TooltipContent className="text-xs">
                      <div>τ<sub>LC</sub>: {(pipeline as any).tauLC?.toExponential?.(2) ?? "—"} s</div>
                      <div>T<sub>m</sub>: {(pipeline as any).T_m?.toExponential?.(2) ?? "—"} s</div>
                      <div>TS = τ<sub>LC</sub> / T<sub>m</sub></div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
              <Badge variant={(TS_ratio ?? 0) > 1 ? 'default' : 'destructive'}>
                {(TS_ratio ?? 0) > 1 ? 'SAFE' : 'CHECK'}
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
                <p className="text-2xl font-bold">{fmtPowerUnit(P_raw)}</p>
              </div>
              <Badge variant={getStatus(P_raw, constraints.P_max) === 'pass' ? 'default' : 'destructive'}>
                {getStatus(P_raw, constraints.P_max) === 'pass' ? '✓' : '✗'}
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
                <p className="text-2xl font-bold">{f1(dutyFrac * 100)}%</p>
              </div>
              <Badge variant={getStatus(dutyFrac, 0.5) === 'pass' ? 'default' : 'destructive'}>
                {getStatus(dutyFrac, 0.5) === 'pass' ? '✓' : '✗'}
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