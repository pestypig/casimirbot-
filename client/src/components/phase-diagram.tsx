import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InteractiveHeatMapProps {
  currentTileArea: number;
  currentShipRadius: number;
  viabilityParams: any;
  constraintConfig?: any;
  currentSimulation?: any;
  onParameterChange?: (newParams: any) => void;
  selectedMode?: string;
  onModeChange?: (mode: string) => void;
}

function InteractiveHeatMap({ 
  currentTileArea, 
  currentShipRadius, 
  viabilityParams, 
  constraintConfig, 
  currentSimulation,
  onParameterChange,
  selectedMode = "hover",
  onModeChange
}: InteractiveHeatMapProps) {
  const [gridData, setGridData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Operational mode configurations (matches Live Energy Pipeline exactly)
  const modes = {
    hover: {
      name: "Hover",
      duty: 0.14,          // 14% duty (station-hold)
      sectors: 1,          // No strobing
      qSpoiling: 1,        // No Q-spoiling (Q_idle/Q_on = 1)
      pocketGamma: 2.86e9, // Van-den-Broeck pocket amplification
      description: "Station-hold → 83.3 MW"
    },
    cruise: {
      name: "Cruise", 
      duty: 0.005,         // 0.5% duty (Ford-Roman compliant)
      sectors: 400,        // 400-sector strobing (1/S = 1/400)
      qSpoiling: 0.001,    // Q-spoiling (Q_idle/Q_cavity = 1 × 10⁻³)
      pocketGamma: 8.0e10, // Van-den-Broeck pocket amplification
      description: "Mass-budgeting → ~7.4 MW"
    },
    emergency: {
      name: "Emergency",
      duty: 0.50,          // 50% duty (fast-burn)
      sectors: 1,          // No strobing
      qSpoiling: 1,        // No Q-spoiling
      pocketGamma: 8.0e9,  // Van-den-Broeck pocket amplification
      description: "Fast-burn → 297 MW"
    },
    standby: {
      name: "Standby",
      duty: 0.0,           // 0% duty (bubble collapsed)
      sectors: 1,          // Irrelevant
      qSpoiling: 1,        // Irrelevant
      pocketGamma: 0,      // No pocket amplification (exotic mass = 0)
      description: "System-off → 0 MW"
    }
  };

  // Local parameter state for sliders
  const [localParams, setLocalParams] = useState({
    selectedMode: selectedMode,
    gammaGeo: viabilityParams?.gammaGeo || 26,
    qFactor: viabilityParams?.qFactor || 1.6e6,
    duty: viabilityParams?.duty || 0.14,
    sagDepth: viabilityParams?.sagDepth || 16,
    maxPower: 120, // MW (hover mode default)
    massTolerance: 5, // % (tight Needle Hull tolerance)
    maxZeta: 1.0,
    minTimescale: 0.01
  });
  
  // Get current mode configuration (use passed selectedMode instead of local state)
  const currentMode = modes[selectedMode as keyof typeof modes] || modes.hover;
  
  // Update parent when local parameters change
  const updateParameter = (key: string, value: number | string) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);
    
    // If mode changed, update duty and other mode-specific parameters
    if (key === 'selectedMode' && typeof value === 'string') {
      if (onModeChange) {
        onModeChange(value); // Notify parent component
      }
      const mode = modes[value as keyof typeof modes];
      if (mode) {
        newParams.duty = mode.duty;
        // Update constraint defaults based on mode
        switch(value) {
          case "hover":
            newParams.maxPower = 120; newParams.maxZeta = 0.1; break;
          case "cruise":
            newParams.maxPower = 20; newParams.maxZeta = 1.5; break;
          case "emergency":
            newParams.maxPower = 400; newParams.maxZeta = 0.05; break;
          case "standby":
            newParams.maxPower = 10; newParams.maxZeta = 10; break;
        }
        setLocalParams(newParams);
      }
    }
    
    if (onParameterChange) {
      onParameterChange({
        ...viabilityParams,
        [key]: value
      });
    }
  };
  
  React.useEffect(() => {
    const loadGrid = async () => {
      setIsLoading(true);
      console.log(`🔄 Building realistic viability grid using 8-step recipe...`);
      console.log(`🔧 Mode: ${viabilityParams?.duty === 0.14 ? 'Hover' : viabilityParams?.duty === 0.005 ? 'Cruise' : 'Custom'}`);
      
      try {
        // Use the recipe-based viability grid computation with mode-aware parameters
        const { computeViabilityGrid } = await import('./viability-grid');
        const enhancedParams = {
          ...viabilityParams,
          ...localParams, // Include local constraint parameters
          // Include current mode configuration for exact Live Energy Pipeline matching
          currentMode: currentMode,
          modeConfig: {
            duty: currentMode.duty,
            sectors: currentMode.sectors,
            qSpoiling: currentMode.qSpoiling,
            pocketGamma: currentMode.pocketGamma
          }
        };
        const gridResult = computeViabilityGrid(enhancedParams, 25);
        const { A_vals, R_vals, Z } = gridResult;
        
        console.log(`🎯 Recipe Results: ${gridResult.viableCount}/${gridResult.totalCount} viable points (${(gridResult.viableCount/gridResult.totalCount*100).toFixed(1)}%)`);
        console.log(`✅ Realistic constraints applied - no more 100% viable zones!`);
        
        // Create hover text
        const hoverText = R_vals.map((R: number) => 
          A_vals.map((A: number) => {
            const viable = Z[R_vals.indexOf(R)][A_vals.indexOf(A)] === 1;
            return `Tile: ${A.toFixed(1)} cm²\nRadius: ${R.toFixed(1)} m\n${viable ? '✅ Viable' : '❌ Failed'}`;
          })
        );
        
        setGridData({ A_vals, R_vals, Z, hoverText });
        
      } catch (error) {
        console.error('Recipe grid computation failed:', error);
        setGridData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGrid();
  }, [currentTileArea, currentShipRadius, viabilityParams, constraintConfig, currentSimulation?.status, localParams]);
  
  if (!gridData || isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-teal-500 rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Computing realistic viability grid...</p>
          <p className="text-xs text-muted-foreground mt-2">Using 8-step recipe for authentic constraints</p>
        </div>
      </div>
    );
  }

  const { A_vals, R_vals, Z } = gridData;
  
  // Calculate grid dimensions
  const cellWidth = 400 / A_vals.length;
  const cellHeight = 300 / R_vals.length;
  
  return (
    <div className="space-y-4">
      {/* Physics Parameter Controls */}
      <Card className="bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg">Physics Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Operational Mode Selector */}
          <div className="space-y-2">
            <Label>Operational Mode</Label>
            <Select 
              value={selectedMode} 
              onValueChange={(value) => updateParameter('selectedMode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(modes).map(([key, mode]) => (
                  <SelectItem key={key} value={key}>
                    {mode.name} - {mode.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current: {currentMode.duty * 100}% duty, {currentMode.sectors === 1 ? 'no' : `${currentMode.sectors}-sector`} strobing, 
              {currentMode.qSpoiling === 1 ? 'no' : `${(currentMode.qSpoiling * 1000).toFixed(0)}×10⁻³`} Q-spoiling
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Geometric Amplification */}
            <div className="space-y-2">
              <Label>γ_geo: {localParams.gammaGeo}</Label>
              <Slider
                value={[localParams.gammaGeo]}
                onValueChange={([value]) => updateParameter('gammaGeo', value)}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Geometric amplification factor</p>
            </div>
            
            {/* Q-Factor */}
            <div className="space-y-2">
              <Label>Q-Factor: {(localParams.qFactor / 1e6).toFixed(1)}×10⁶</Label>
              <Slider
                value={[Math.log10(localParams.qFactor)]}
                onValueChange={([value]) => updateParameter('qFactor', Math.pow(10, value))}
                min={6}
                max={10}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Cavity quality factor</p>
            </div>
            
            {/* Duty Cycle - Mode-controlled but still adjustable */}
            <div className="space-y-2">
              <Label>Duty Cycle: {(currentMode.duty * 100).toFixed(1)}% (Mode: {currentMode.name})</Label>
              <Slider
                value={[currentMode.duty * 100]}
                onValueChange={([value]) => updateParameter('duty', value / 100)}
                min={0.1}
                max={50}
                step={0.1}
                className="w-full"
                disabled={localParams.selectedMode !== 'custom'}
              />
              <p className="text-xs text-muted-foreground">
                Set by operational mode ({currentMode.name})
              </p>
            </div>
            
            {/* Sag Depth */}
            <div className="space-y-2">
              <Label>Sag Depth: {localParams.sagDepth} nm</Label>
              <Slider
                value={[localParams.sagDepth]}
                onValueChange={([value]) => updateParameter('sagDepth', value)}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Bowl curvature depth</p>
            </div>
          </div>
          
          <Separator />
          
          {/* Constraint Controls */}
          <div>
            <h4 className="font-medium mb-4">Viability Constraints</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Power */}
              <div className="space-y-2">
                <Label>Max Power: {localParams.maxPower} MW</Label>
                <Slider
                  value={[localParams.maxPower]}
                  onValueChange={([value]) => updateParameter('maxPower', value)}
                  min={50}
                  max={2000}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Maximum allowable power</p>
              </div>
              
              {/* Mass Tolerance */}
              <div className="space-y-2">
                <Label>Mass Tolerance: ±{localParams.massTolerance}%</Label>
                <Slider
                  value={[localParams.massTolerance]}
                  onValueChange={([value]) => updateParameter('massTolerance', value)}
                  min={5}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Exotic mass target tolerance</p>
              </div>
              
              {/* Quantum Safety */}
              <div className="space-y-2">
                <Label>Max ζ: {localParams.maxZeta.toFixed(1)}</Label>
                <Slider
                  value={[localParams.maxZeta]}
                  onValueChange={([value]) => updateParameter('maxZeta', value)}
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Quantum inequality limit</p>
              </div>
              
              {/* Time-scale Separation */}
              <div className="space-y-2">
                <Label>Min Time-scale: {localParams.minTimescale.toFixed(3)}</Label>
                <Slider
                  value={[Math.log10(localParams.minTimescale)]}
                  onValueChange={([value]) => updateParameter('minTimescale', Math.pow(10, value))}
                  min={-4}
                  max={-1}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Minimum time-scale separation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Heat-map Visualization */}
      <Card className="bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg">Interactive Phase Diagram</CardTitle>
          <p className="text-sm text-muted-foreground">
            Realistic viability boundaries based on mass, power, quantum safety, and time-scale constraints
          </p>
        </CardHeader>
        <CardContent>
        
        <svg width="450" height="350" className="border rounded">
          {/* Grid cells */}
          {R_vals.map((R: number, i: number) => 
            A_vals.map((A: number, j: number) => {
              const viable = Z[i][j] === 1;
              const isCurrentPoint = Math.abs(A - currentTileArea) < 3 && Math.abs(R - currentShipRadius) < 3;
              
              return (
                <g key={`${i}-${j}`}>
                  <rect
                    x={j * cellWidth + 50}
                    y={(R_vals.length - 1 - i) * cellHeight + 25}
                    width={cellWidth}
                    height={cellHeight}
                    fill={viable ? "#10b981" : "#ef4444"}
                    opacity={isCurrentPoint ? 1.0 : 0.7}
                    stroke={isCurrentPoint ? "#1f2937" : "none"}
                    strokeWidth={isCurrentPoint ? 2 : 0}
                  />
                  {isCurrentPoint && (
                    <circle
                      cx={j * cellWidth + 50 + cellWidth/2}
                      cy={(R_vals.length - 1 - i) * cellHeight + 25 + cellHeight/2}
                      r="4"
                      fill="white"
                      stroke="#1f2937"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })
          )}
          
          {/* Axes */}
          <text x="225" y="345" textAnchor="middle" className="text-xs fill-current">
            Tile Area (cm²)
          </text>
          <text x="15" y="175" textAnchor="middle" className="text-xs fill-current" transform="rotate(-90, 15, 175)">
            Ship Radius (m)
          </text>
          
          {/* Axis labels */}
          <text x="50" y="345" className="text-xs fill-current">1</text>
          <text x="430" y="345" className="text-xs fill-current">100</text>
          <text x="35" y="325" className="text-xs fill-current">1</text>
          <text x="35" y="30" className="text-xs fill-current">100</text>
        </svg>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Viable (passes all constraints)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Failed (violates constraints)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-800 rounded-full"></div>
            <span className="text-sm">Current Parameters</span>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PhaseDiagram(props: any) {
  return (
    <div className="space-y-4">
      <InteractiveHeatMap {...props} />
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Recipe-Based Viability</h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          This heat-map uses the exact 8-step pipeline from your recipe file to evaluate each point:
          hull surface area → tile count → energy pipeline → mass calculation → power analysis → 
          time-scale validation → quantum safety → constraint checking. 
          <strong>Adjust the physics parameters above to see how viability boundaries change in real-time!</strong>
        </p>
      </div>
    </div>
  );
}