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
  const [constraints, setConstraints] = useState<MetricConstraints>({
    P_max: 1000,        // 1000 MW max raw power
    f_min: 0.001,       // 0.1% minimum throttling
    P_avg_max: 200,     // 200 MW max average power
    U_min: 1e-12,       // Minimum energy magnitude
    TS_min: 0.01,       // Minimum time-scale (universal)
    zeta_max: 1.0,      // Ford-Roman bound
    M_target: 1405,     // Target mass (kg)
    M_tolerance: 5      // ±5% tolerance
  });

  // Compute all metrics from current parameters
  const computeMetrics = React.useCallback((params: any): ComputedMetrics => {
    if (!params) return {
      P_raw: 0, f_throttle: 0, P_avg: 0, U_cycle: 0, 
      TS_ratio: 0, zeta: 0, M_exotic: 0
    };

    // Physics constants
    const hbar = 1.055e-34;
    const c = 2.998e8;
    const pi = Math.PI;
    
    // Parameters from sliders
    const A_tile = (params.tileArea || 5) * 1e-4; // m²
    const a = 1e-9; // gap distance (m)
    const gamma_geo = params.gammaGeo || 26;
    const Q_mechanical = 50000;
    const Q_cavity = params.qFactor || 1e9;
    const duty = params.duty || 0.14;
    const A_hull = 5.6e5; // Needle Hull surface area
    
    // Energy pipeline calculations
    const U_static = -(pi*pi * hbar * c * A_tile) / (720 * Math.pow(a, 3));
    const U_geo = Math.pow(gamma_geo, 3) * U_static;
    const U_Q = Q_mechanical * U_geo;
    const U_cycle = duty * U_Q;
    
    // Power calculations
    const omega = 2 * pi * 15e9; // 15 GHz
    const P_loss_per_tile = Math.abs(U_geo * omega / Q_cavity);
    const N_tiles = A_hull / A_tile;
    const P_raw = (P_loss_per_tile * N_tiles) / 1e6; // MW
    const P_avg = P_raw * duty;
    
    // Other metrics
    const f_throttle = duty; // Primary throttling factor
    const M_exotic = Math.abs(U_cycle * N_tiles) / (c * c); // E=mc²
    
    // Time-scale separation (example calculation)
    const tau_pulse = 1 / (15e9); // Pulse period
    const tau_LC = Math.sqrt(1e-6 / c); // LC time scale (approximate)
    const TS_ratio = tau_LC / tau_pulse;
    
    // Quantum safety parameter (simplified)
    const zeta = 1 / (duty * Q_cavity / 1e6); // Simplified Ford-Roman parameter
    
    return {
      P_raw: P_raw,
      f_throttle: f_throttle,
      P_avg: P_avg,
      U_cycle: Math.abs(U_cycle),
      TS_ratio: TS_ratio,
      zeta: zeta,
      M_exotic: M_exotic
    };
  }, []);

  // Update metrics when parameters change
  useEffect(() => {
    const newMetrics = computeMetrics(viabilityParams);
    setMetrics(newMetrics);
    
    // Update constraints based on mode
    if (viabilityParams?.maxPower) {
      setConstraints(prev => ({
        ...prev,
        P_avg_max: viabilityParams.maxPower,
        zeta_max: viabilityParams.maxZeta || 1.0,
        M_tolerance: viabilityParams.massTolerance || 5
      }));
    }
  }, [viabilityParams, computeMetrics]);

  // Prepare radar chart data
  const getRadarData = () => {
    if (!metrics) return null;

    const normalizedData = [
      Math.min(metrics.P_avg / constraints.P_avg_max, 2), // Cap at 2 for visualization
      Math.min(metrics.f_throttle / 0.5, 2), // Normalized to 50% max duty
      Math.min(Math.abs(metrics.M_exotic - constraints.M_target) / (constraints.M_target * constraints.M_tolerance / 100), 2),
      Math.min(metrics.zeta / constraints.zeta_max, 2),
      Math.min(constraints.TS_min / metrics.TS_ratio, 2), // Inverted (want high TS_ratio)
      Math.min(metrics.P_raw / constraints.P_max, 2),
      Math.min(metrics.U_cycle / 1e6, 2) // Normalized energy
    ];

    return [{
      type: 'scatterpolar',
      r: normalizedData,
      theta: ['Avg Power', 'Duty Cycle', 'Mass Error', 'Quantum ζ', 'Time-Scale', 'Raw Power', 'Energy'],
      fill: 'toself',
      name: 'Current Values',
      line: { color: '#3b82f6' },
      fillcolor: 'rgba(59, 130, 246, 0.1)'
    }, {
      type: 'scatterpolar',
      r: [1, 1, 1, 1, 1, 1, 1], // Constraint boundary
      theta: ['Avg Power', 'Duty Cycle', 'Mass Error', 'Quantum ζ', 'Time-Scale', 'Raw Power', 'Energy'],
      fill: 'toself',
      name: 'Safe Zone',
      line: { color: '#22c55e', dash: 'dash' },
      fillcolor: 'rgba(34, 197, 94, 0.1)'
    }];
  };

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
          <div className="w-full">
            {metrics && (
              <Plot
                data={getRadarData() || []}
                layout={radarLayout}
                config={{ responsive: true }}
                style={{ width: '100%', height: '400px' }}
              />
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
                <p className="text-sm font-medium">Average Power</p>
                <p className="text-2xl font-bold">{metrics.P_avg.toFixed(1)} MW</p>
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