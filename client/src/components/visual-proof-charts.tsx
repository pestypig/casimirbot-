/**
 * Visual Proof Charts Component
 * Implements the three proof visualizations: Radar plot, Energy Pipeline, and Duty vs Power
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
         RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
         LineChart, Line, ComposedChart } from 'recharts';
import { TrendingUp, Activity, Target } from "lucide-react";

interface VisualProofChartsProps {
  results: {
    // Static Casimir results
    totalEnergy?: number;           // J
    
    // Warp bubble results  
    geometricBlueshiftFactor?: number;  // γ_geo
    qEnhancementFactor?: number;        // Q factor
    totalExoticMass?: number;           // kg
    powerDraw?: number;                 // W
    quantumInequalityMargin?: number;   // ζ
    
    // Duty cycle parameters
    dutyFactor?: number;            // d = 0.01
    effectiveDuty?: number;         // d_eff = 2.5×10⁻⁵
    
    // Energy progression
    baselineEnergyDensity?: number; // J/m³ baseline
    amplifiedEnergyDensity?: number; // J/m³ amplified
  };
  targets: {
    gammaGeo: number;      // 25
    cavityQ: number;       // 1e9
    dutyFactor: number;    // 0.01
    effectiveDuty: number; // 2.5e-5
    exoticMassTarget: number; // 1.4e3 kg
    powerTarget: number;   // 83e6 W
    zetaSafeLimit: number; // 1.0
  };
}

export function VisualProofCharts({ results, targets }: VisualProofChartsProps) {
  // A. Radar Plot Data - "Spec vs Achieved"
  const radarData = [
    {
      subject: 'γ_geo',
      target: targets.gammaGeo,
      achieved: results.geometricBlueshiftFactor || 0,
      fullMark: targets.gammaGeo * 1.2
    },
    {
      subject: 'Q (10⁹)',
      target: targets.cavityQ / 1e9,
      achieved: (results.qEnhancementFactor || 0) / 1e9,
      fullMark: targets.cavityQ / 1e9 * 1.2
    },
    {
      subject: 'duty d (%)',
      target: targets.dutyFactor * 100,
      achieved: (results.dutyFactor || 0) * 100,
      fullMark: targets.dutyFactor * 100 * 1.2
    },
    {
      subject: '1/ζ',
      target: 1 / targets.zetaSafeLimit,
      achieved: results.quantumInequalityMargin ? 1 / results.quantumInequalityMargin : 0,
      fullMark: 1 / targets.zetaSafeLimit * 1.2
    },
    {
      subject: 'Power (MW)',
      target: targets.powerTarget / 1e6,
      achieved: (results.powerDraw || 0) / 1e6,
      fullMark: targets.powerTarget / 1e6 * 1.2
    },
    {
      subject: 'Mass (10³kg)',
      target: targets.exoticMassTarget / 1e3,
      achieved: (results.totalExoticMass || 0) / 1e3,
      fullMark: targets.exoticMassTarget / 1e3 * 1.2
    }
  ];

  // B. Energy Boost Pipeline Data
  const E_flat = -2.55e-3; // J (baseline from paper)
  const E_bowl = results.totalEnergy || E_flat; // J (bowl geometry)
  const gamma_geo = results.geometricBlueshiftFactor || 1;
  const Q_enhancement = results.qEnhancementFactor || 1;
  const duty_factor = results.dutyFactor || 0.01;
  const duty_eff = results.effectiveDuty || 2.5e-5;
  
  const energyPipelineData = [
    { stage: 'E_flat', energy: Math.abs(E_flat) * 1e3, label: 'Flat Plates' }, // mJ
    { stage: 'E_bowl', energy: Math.abs(E_bowl) * 1e3, label: 'Bowl Geometry' }, // mJ
    { stage: 'E_Q', energy: Math.abs(E_bowl) * Q_enhancement * 1e3, label: '+Q Enhancement' }, // mJ
    { stage: 'E_duty', energy: Math.abs(E_bowl) * Q_enhancement * duty_factor * 1e3, label: '+Duty Factor' }, // mJ
    { stage: 'E_deff', energy: Math.abs(E_bowl) * Q_enhancement * duty_eff * 1e3, label: '+Sector Strobing' }, // mJ
  ];

  // C. Duty vs Power Analysis Data
  const dutyRange = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1]; // Range of duty factors
  const dutyAnalysisData = dutyRange.map(d => {
    const power = (results.powerDraw || 83e6) * (d / (results.dutyFactor || 0.01)); // Scale power
    const zeta = (results.quantumInequalityMargin || 0.5) * (d / (results.dutyFactor || 0.01)); // Scale zeta
    return {
      duty: d * 100, // Convert to percentage
      power: power / 1e6, // Convert to MW
      zeta: zeta,
      isOptimal: power < 83e6 && zeta < 1.0
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Visual Proof Analysis</h3>
        <Badge variant="outline">Real-time Validation</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* A. Radar Plot - Spec vs Achieved */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Spec vs Achieved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" className="text-xs" />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'dataMax']} 
                  className="text-xs"
                />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Achieved"
                  dataKey="achieved"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    typeof value === 'number' ? value.toFixed(2) : value, 
                    name
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="text-xs text-muted-foreground mt-2">
              Green: Target spec | Blue: Achieved values
            </div>
          </CardContent>
        </Card>

        {/* B. Energy Boost Pipeline */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Energy Boost Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={energyPipelineData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  scale="log" 
                  domain={['dataMin', 'dataMax']}
                  className="text-xs"
                />
                <YAxis 
                  type="category" 
                  dataKey="stage" 
                  className="text-xs"
                  width={60}
                />
                <Tooltip 
                  formatter={(value: number) => [
                    `${value.toExponential(2)} mJ`, 
                    'Energy'
                  ]}
                  labelFormatter={(label: string) => {
                    const item = energyPipelineData.find(d => d.stage === label);
                    return item?.label || label;
                  }}
                />
                <Bar 
                  dataKey="energy" 
                  fill="#8884d8"
                  name="Energy (mJ)"
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-muted-foreground mt-2">
              Energy amplification: Flat → Bowl → Q → Duty
            </div>
          </CardContent>
        </Card>

        {/* C. Duty vs Power Sweet Spot */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Duty vs Power/Safety
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={dutyAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="duty" 
                  className="text-xs"
                  label={{ value: 'Duty (%)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  yAxisId="left" 
                  className="text-xs"
                  label={{ value: 'Power (MW)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  className="text-xs"
                  label={{ value: 'ζ margin', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    typeof value === 'number' ? value.toFixed(2) : value,
                    name === 'power' ? 'Power (MW)' : 'ζ margin'
                  ]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="power" 
                  fill="#ef4444"
                  name="power"
                  opacity={0.7}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="zeta" 
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="zeta"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="text-xs text-muted-foreground mt-2">
              Sweet spot: Power &lt; 83 MW (red) & ζ &lt; 1.0 (green)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Status */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Proof Validation Status:</span>
            <div className="flex gap-2">
              <Badge variant={
                radarData.every(d => Math.abs(d.achieved - d.target) / d.target <= 0.1) 
                  ? "default" : "secondary"
              }>
                Spec Compliance
              </Badge>
              <Badge variant={
                (results.powerDraw || 0) < targets.powerTarget * 1.1 
                  ? "default" : "destructive"
              }>
                Power Target
              </Badge>
              <Badge variant={
                (results.quantumInequalityMargin || 0) < targets.zetaSafeLimit 
                  ? "default" : "destructive"
              }>
                Quantum Safety
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}