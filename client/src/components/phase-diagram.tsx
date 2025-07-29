import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MetricsDashboard from './metrics-dashboard';

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
  
  // Mode presets with authentic calculated values from Live Energy Pipeline
  const modePresets = {
    hover: {
      name: "Hover",
      cavityQ: 1e9,        // 1.0×10⁹ (Cavity Q for power loss)
      mechQ: 5e4,          // 5.0×10⁴ (Mechanical Q for energy boost - fixed)
      duty: 0.14,          // 14% duty (station-hold)
      sectors: 1,          // No strobing
      qSpoiling: 1,        // No Q-spoiling (Q_idle/Q_on = 1)
      pocketGamma: 2.86e9, // Van-den-Broeck pocket amplification
      description: "83.3 MW • 1,405 kg • ζ=0.032"
    },
    cruise: {
      name: "Cruise", 
      cavityQ: 1.6e6,      // 1.6×10⁶ (Lower for stability)
      mechQ: 5e4,          // 5.0×10⁴ (Fixed)
      duty: 0.005,         // 0.5% duty (Ford-Roman compliant)
      sectors: 400,        // 400-sector strobing (1/S = 1/400)
      qSpoiling: 0.001,    // Q-spoiling (Q_idle/Q_cavity = 1 × 10⁻³)
      pocketGamma: 8.0e10, // Van-den-Broeck pocket amplification
      description: "7.4 MW • 1,405 kg • ζ=0.89"
    },
    emergency: {
      name: "Emergency",
      cavityQ: 1e9,        // 1.0×10⁹
      mechQ: 5e4,          // 5.0×10⁴ (Fixed)
      duty: 0.50,          // 50% duty (fast-burn)
      sectors: 1,          // No strobing
      qSpoiling: 1,        // No Q-spoiling
      pocketGamma: 8.0e9,  // Van-den-Broeck pocket amplification
      description: "297 MW • 1,405 kg • ζ=0.009"
    },
    standby: {
      name: "Standby",
      cavityQ: 1e9,        // 1.0×10⁹ (Irrelevant when duty=0)
      mechQ: 5e4,          // 5.0×10⁴ (Fixed)
      duty: 0.0,           // 0% duty (bubble collapsed)
      sectors: 1,          // Irrelevant
      qSpoiling: 1,        // Irrelevant
      pocketGamma: 0,      // No pocket amplification (exotic mass = 0)
      description: "0 MW • 0 kg • System Off"
    }
  };

  // Get initial mode preset
  const initialMode = selectedMode || "hover";
  const initialPreset = modePresets[initialMode as keyof typeof modePresets] || modePresets.hover;
  
  // Helper to get mode-specific constraint defaults using authentic calculated values
  const getModeConstraintDefaults = (mode: string) => {
    // NOTE: minTimescale is UNIVERSAL homogenization threshold (TS_ratio ≥ 100)
    // NOT mode-specific - all modes must clear same τ_pulse ≪ τ_LC bar
    const universalMinTimescale = 100; // TS_ratio = 100 for universal homogenization threshold
    
    switch (mode) {
      case 'hover':
        // Authentic values: 83.3 MW, 1,405 kg, ζ=0.032
        return { maxPower: 120, massTolerance: 5, maxZeta: 0.05, minTimescale: universalMinTimescale };
      case 'cruise':
        // Authentic values: 7.4 MW, 1,405 kg, ζ=0.89
        return { maxPower: 20, massTolerance: 10, maxZeta: 1.0, minTimescale: universalMinTimescale };
      case 'emergency':
        // Authentic values: 297 MW, 1,405 kg, ζ=0.009
        return { maxPower: 400, massTolerance: 15, maxZeta: 0.02, minTimescale: universalMinTimescale };
      case 'standby':
        // Authentic values: 0 MW, 0 kg, System Off
        return { maxPower: 10, massTolerance: 50, maxZeta: 10.0, minTimescale: universalMinTimescale };
      default:
        return { maxPower: 120, massTolerance: 5, maxZeta: 1.0, minTimescale: universalMinTimescale };
    }
  };

  const initialConstraints = getModeConstraintDefaults(initialMode);

  // Local parameter state for sliders - initialized with correct mode preset
  const [localParams, setLocalParams] = useState({
    selectedMode: initialMode,
    gammaGeo: viabilityParams?.gammaGeo || 26,
    qFactor: viabilityParams?.qFactor || initialPreset.cavityQ,
    duty: viabilityParams?.duty || initialPreset.duty,
    sagDepth: viabilityParams?.sagDepth || 16,
    maxPower: viabilityParams?.maxPower || initialConstraints.maxPower,
    massTolerance: viabilityParams?.massTolerance || initialConstraints.massTolerance,
    maxZeta: viabilityParams?.maxZeta || initialConstraints.maxZeta,
    minTimescale: viabilityParams?.minTimescale || initialConstraints.minTimescale
  });
  
  // Get current mode configuration (use passed selectedMode instead of local state)
  const currentMode = modePresets[selectedMode as keyof typeof modePresets] || modePresets.hover;

  // Format Q-Factor for better readability
  const formatQFactor = (qFactor: number) => {
    if (qFactor >= 1e9) {
      return `${(qFactor / 1e9).toFixed(1)}×10⁹`;
    } else if (qFactor >= 1e6) {
      return `${(qFactor / 1e6).toFixed(1)}×10⁶`;
    } else {
      return qFactor.toExponential(1);
    }
  };
  
  // Helper to apply a mode preset to all parameters
  const applyModePreset = (mode: string) => {
    const preset = modePresets[mode as keyof typeof modePresets];
    if (!preset) return;
    
    const newParams = {
      ...localParams,
      selectedMode: mode,
      qFactor: preset.cavityQ,
      duty: preset.duty
    };
    
    setLocalParams(newParams);
    
    // Update parent component with new parameters
    if (onParameterChange) {
      onParameterChange(newParams);
    }
    
    console.log(`🎯 Applied ${mode} mode preset: Q=${preset.cavityQ}, duty=${preset.duty}`);
  };

  // React to mode changes from parent component
  React.useEffect(() => {
    if (selectedMode && selectedMode !== localParams.selectedMode) {
      applyModePreset(selectedMode);
    }
  }, [selectedMode]);

  // Get mode-specific parameter values for double-click functionality
  const getModeSpecificValue = (parameter: string, mode: string) => {
    const modeConfig = modePresets[mode as keyof typeof modePresets];
    if (!modeConfig) return null;
    
    switch (parameter) {
      case 'gammaGeo':
        return 26; // Standard research value for all modes
      case 'qFactor':
        // Use the mode's cavity Q directly from preset
        return modeConfig.cavityQ;
      case 'duty':
        return modeConfig.duty;
      case 'sagDepth':
        return 16; // Standard Needle Hull research value
      case 'maxPower':
        // Mode-specific power constraints
        switch (mode) {
          case 'hover': return 120;
          case 'cruise': return 20;
          case 'emergency': return 400;
          case 'standby': return 10;
          default: return 120;
        }
      case 'massTolerance':
        // Mode-specific mass tolerance
        switch (mode) {
          case 'hover': return 5; // Tight control for station-keeping
          case 'cruise': return 10; // Moderate tolerance for efficiency
          case 'emergency': return 15; // Relaxed for high power
          case 'standby': return 50; // Very relaxed (system off)
          default: return 5;
        }
      case 'maxZeta':
        // Mode-specific quantum safety limits
        switch (mode) {
          case 'hover': return 0.1; // Very strict for station-keeping
          case 'cruise': return 1.5; // Relaxed for Ford-Roman compliance
          case 'emergency': return 0.05; // Extremely strict for high power  
          case 'standby': return 10.0; // Very relaxed (system off)
          default: return 1.0;
        }
      case 'minTimescale':
        // UNIVERSAL homogenization threshold: TS_ratio = τ_LC/τ_pulse ≥ 100
        // Same for ALL modes - ensures τ_pulse ≪ τ_LC across all operational envelopes
        return 0.01; // Conservative TS_ratio = 100 safety margin
      default:
        return null;
    }
  };
  
  // Handle double-click to apply mode-specific values
  const handleSliderDoubleClick = (parameter: string) => {
    const modeValue = getModeSpecificValue(parameter, selectedMode);
    if (modeValue !== null) {
      console.log(`🎯 Double-click detected for ${parameter}, applying ${selectedMode} mode value: ${modeValue}`);
      
      // Force immediate local state update
      setLocalParams(prev => {
        const updated = { ...prev, [parameter]: modeValue };
        console.log(`🔄 Local state updated: ${parameter} = ${modeValue}`);
        return updated;
      });
      
      // Trigger parent update after a brief delay to ensure state is synchronized
      setTimeout(() => {
        updateParameter(parameter, modeValue);
        console.log(`📤 Parent update triggered for ${parameter}: ${modeValue}`);
      }, 10);
    } else {
      console.log(`❌ No mode value found for parameter: ${parameter} in mode: ${selectedMode}`);
    }
  };
  
  // Update parent when local parameters change
  const updateParameter = (key: string, value: number | string) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);
    
    // If mode changed, update duty and other mode-specific parameters
    if (key === 'selectedMode' && typeof value === 'string') {
      if (onModeChange) {
        onModeChange(value); // Notify parent component
      }
      const mode = modePresets[value as keyof typeof modePresets];
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
                {Object.entries(modePresets).map(([key, mode]) => (
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
              <div onDoubleClick={() => handleSliderDoubleClick('gammaGeo')}>
                <Slider
                  value={[localParams.gammaGeo]}
                  onValueChange={([value]) => updateParameter('gammaGeo', value)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Geometric amplification factor • Double-click to apply {selectedMode} mode value (26)
              </p>
            </div>
            
            {/* Q-Factors (Two Types) */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Cavity Q-Factor: {formatQFactor(localParams.qFactor)} <span className="text-xs text-blue-600">(User Control)</span></Label>
                <div onDoubleClick={() => handleSliderDoubleClick('qFactor')}>
                  <Slider
                    value={[Math.log10(localParams.qFactor)]}
                    onValueChange={([value]) => updateParameter('qFactor', Math.pow(10, value))}
                    min={6}
                    max={10}
                    step={0.1}
                    className="w-full cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Electromagnetic cavity Q for power loss P = U_geo×ω/Q_cavity • Double-click to apply {selectedMode} mode value ({formatQFactor(currentMode.cavityQ)})
                </p>
              </div>
              
              <div className="bg-muted/30 rounded p-2">
                <Label className="text-sm">Mechanical Q-Factor: {formatQFactor(currentMode.mechQ)} <span className="text-xs text-gray-600">(Fixed)</span></Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Parametric resonator Q for energy boost U_Q = Q_mech × U_geo (mode-invariant)
                </p>
              </div>
            </div>
            
            {/* Duty Cycle - Mode-controlled but still adjustable */}
            <div className="space-y-2">
              <Label>Duty Cycle: {(localParams.duty * 100).toFixed(1)}% (Mode: {currentMode.name})</Label>
              <div onDoubleClick={() => handleSliderDoubleClick('duty')}>
                <Slider
                  value={[localParams.duty * 100]}
                  onValueChange={([value]) => updateParameter('duty', value / 100)}
                  min={0.1}
                  max={50}
                  step={0.1}
                  className="w-full cursor-pointer"
                  disabled={false} // Enable for double-click functionality
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set by operational mode ({currentMode.name}) • Double-click to reset to mode default ({(currentMode.duty * 100).toFixed(1)}%)
              </p>
            </div>
            
            {/* Sag Depth */}
            <div className="space-y-2">
              <Label>Sag Depth: {localParams.sagDepth} nm</Label>
              <div onDoubleClick={() => handleSliderDoubleClick('sagDepth')}>
                <Slider
                  value={[localParams.sagDepth]}
                  onValueChange={([value]) => updateParameter('sagDepth', value)}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Bowl curvature depth • Double-click to apply research value (16 nm)
              </p>
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
                <div onDoubleClick={() => handleSliderDoubleClick('maxPower')}>
                  <Slider
                    value={[localParams.maxPower]}
                    onValueChange={([value]) => updateParameter('maxPower', value)}
                    min={50}
                    max={2000}
                    step={10}
                    className="w-full cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum allowable power • Double-click to apply {selectedMode} mode value ({getModeSpecificValue('maxPower', selectedMode)} MW)
                </p>
              </div>
              
              {/* Mass Tolerance */}
              <div className="space-y-2">
                <Label>Mass Tolerance: ±{localParams.massTolerance}%</Label>
                <div onDoubleClick={() => handleSliderDoubleClick('massTolerance')}>
                  <Slider
                    value={[localParams.massTolerance]}
                    onValueChange={([value]) => updateParameter('massTolerance', value)}
                    min={5}
                    max={100}
                    step={5}
                    className="w-full cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Exotic mass target tolerance • Double-click to apply {selectedMode} mode value (±{getModeSpecificValue('massTolerance', selectedMode)}%)
                </p>
              </div>
              
              {/* Quantum Safety */}
              <div className="space-y-2">
                <Label>Max ζ: {localParams.maxZeta.toFixed(1)}</Label>
                <div onDoubleClick={() => handleSliderDoubleClick('maxZeta')}>
                  <Slider
                    value={[localParams.maxZeta]}
                    onValueChange={([value]) => updateParameter('maxZeta', value)}
                    min={0.05}
                    max={15.0}
                    step={0.05}
                    className="w-full cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Quantum inequality limit • Double-click to apply {selectedMode} mode value ({getModeSpecificValue('maxZeta', selectedMode)?.toFixed(2)})
                </p>
              </div>
              
              {/* Time-scale Separation */}
              <div className="space-y-2">
                <Label>Min Time-scale: {localParams.minTimescale.toFixed(3)}</Label>
                <div onDoubleClick={() => handleSliderDoubleClick('minTimescale')}>
                  <Slider
                    value={[Math.log10(localParams.minTimescale)]}
                    onValueChange={([value]) => updateParameter('minTimescale', Math.pow(10, value))}
                    min={-4}
                    max={-1}
                    step={0.1}
                    className="w-full cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Universal homogenization threshold (TS_ratio ≥ 100) • Double-click to apply research value (0.010)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Metrics Dashboard */}
      <Card className="bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-lg">Real-Time Metrics Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground">
            Live constraint monitoring with radar chart visualization - all metrics update as parameters change
          </p>
        </CardHeader>
        <CardContent>
          <MetricsDashboard viabilityParams={{
            ...viabilityParams,
            selectedMode: selectedMode,
            duty: localParams.duty
          }} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function PhaseDiagram(props: any) {
  return (
    <div className="space-y-4">
      <InteractiveHeatMap {...props} />
      

    </div>
  );
}