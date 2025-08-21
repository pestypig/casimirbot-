import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MetricsDashboard from './metrics-dashboard';
import { zenLongToast } from '@/lib/zen-long-toasts';
import { useEnergyPipeline, MODE_CONFIGS } from '@/hooks/use-energy-pipeline';

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

const DEFAULT_GAMMA_VDB = 2.86e5;

const pick = <T,>(v: T | undefined, d: T) => (typeof v === "number" ? (isFinite(v as any) ? v! : d) : (v ?? d));

function resolveModeNumbers(mode: string, pipeline?: any) {
  const m = (mode || "hover").toLowerCase() as keyof typeof MODE_CONFIGS;

  // Prefer live pipeline when present; else MODE_CONFIGS; else sane fallbacks
  const dutyCycle       = pick(pipeline?.dutyCycle,       MODE_CONFIGS[m]?.dutyCycle ?? 0.14);
  const sectorStrobing  = pick(pipeline?.sectorStrobing,  MODE_CONFIGS[m]?.sectorStrobing ?? 1);
  const qSpoilingFactor = pick(pipeline?.qSpoilingFactor, MODE_CONFIGS[m]?.qSpoilingFactor ?? 1);
  const qCavity         = pick(pipeline?.qCavity,         1e9);
  const P_avg           = pick(pipeline?.P_avg_MW,        MODE_CONFIGS[m]?.powerTarget ?? 83.3);
  const gammaVanDenBroeck = pick(pipeline?.gammaVanDenBroeck, DEFAULT_GAMMA_VDB);

  return { dutyCycle, sectorStrobing, qSpoilingFactor, qCavity, P_avg, gammaVanDenBroeck };
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
  
  // Get live pipeline data for authentic values
  const { data: pipeline } = useEnergyPipeline();
  const resolved = resolveModeNumbers(selectedMode, pipeline);

  const modePreset = {
    name: selectedMode[0].toUpperCase() + selectedMode.slice(1),
    qCavity: resolved.qCavity,
    mechQ: 5e4, // mechanical Q for the diagram
    dutyCycle: resolved.dutyCycle,
    sectorStrobing: resolved.sectorStrobing,
    qSpoilingFactor: resolved.qSpoilingFactor,
    gammaVanDenBroeck: resolved.gammaVanDenBroeck,
    powerMW: resolved.P_avg
  };
  
  // Legacy mode presets structure for compatibility (deprecated)
  const legacyModePresets = {
    hover: {
      name: "Hover",
      qCavity: 1e9,        // 1.0×10⁹ (Cavity Q for power loss)
      mechQ: 5e4,          // 5.0×10⁴ (Mechanical Q for energy boost - fixed)
      dutyCycle: 0.14,     // 14% duty (station-hold)
      sectorStrobing: 1,   // No strobing
      qSpoilingFactor: 1,  // No Q-spoiling (Q_idle/Q_on = 1)
      gammaVanDenBroeck: DEFAULT_GAMMA_VDB, // Van-den-Broeck pocket amplification
      description: "83.3 MW • 1,405 kg • ζ=0.032"
    },
    cruise: {
      name: "Cruise", 
      qCavity: 1.6e6,      // 1.6×10⁶ (Lower for stability)
      mechQ: 5e4,          // 5.0×10⁴ (Fixed)
      dutyCycle: 0.005,    // 0.5% duty (Ford-Roman compliant)
      sectorStrobing: 400, // 400-sector strobing (1/S = 1/400)
      qSpoilingFactor: 0.001, // Q-spoiling (Q_idle/Q_cavity = 1 × 10⁻³)
      gammaVanDenBroeck: DEFAULT_GAMMA_VDB, // Van-den-Broeck pocket amplification
      description: "7.4 MW • 1,405 kg • ζ=0.89"
    },
    emergency: {
      name: "Emergency",
      qCavity: 1e9,        // 1.0×10⁹
      mechQ: 5e4,          // 5.0×10⁴ (Fixed)
      dutyCycle: 0.50,     // 50% duty (fast-burn)
      sectorStrobing: 1,   // No strobing
      qSpoilingFactor: 1,  // No Q-spoiling
      gammaVanDenBroeck: DEFAULT_GAMMA_VDB, // Van-den-Broeck pocket amplification
      description: "297 MW • 1,405 kg • ζ=0.009"
    },
    standby: {
      name: "Standby",
      qCavity: 1e9,        // 1.0×10⁹ (Irrelevant when duty=0)
      mechQ: 5e4,          // 5.0×10⁴ (Fixed)
      dutyCycle: 0.0,      // 0% duty (bubble collapsed)
      sectorStrobing: 1,   // Irrelevant
      qSpoilingFactor: 1,  // Irrelevant
      gammaVanDenBroeck: 0, // No pocket amplification (exotic mass = 0)
      description: "0 MW • 0 kg • System Off"
    }
  };

  // Get initial mode preset
  const initialMode = selectedMode || "hover";
  const initialPreset = legacyModePresets[initialMode as keyof typeof legacyModePresets] || legacyModePresets.hover;
  
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
        return { maxPower: 20, massTolerance: 10, maxZeta: 0.05, minTimescale: universalMinTimescale };
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
    qCavity: viabilityParams?.qCavity || initialPreset.qCavity,
    dutyCycle: viabilityParams?.dutyCycle || initialPreset.dutyCycle,
    sagDepth: viabilityParams?.sagDepth || 16,
    maxPower: viabilityParams?.maxPower || initialConstraints.maxPower,
    massTolerance: viabilityParams?.massTolerance || initialConstraints.massTolerance,
    maxZeta: viabilityParams?.maxZeta || initialConstraints.maxZeta,
    minTimescale: viabilityParams?.minTimescale || initialConstraints.minTimescale
  });
  
  // Get current mode configuration (use passed selectedMode instead of local state)
  const currentMode = legacyModePresets[selectedMode as keyof typeof legacyModePresets] || legacyModePresets.hover;

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
    // Use live pipeline data for authentic values
    const resolved = resolveModeNumbers(mode, pipeline);
    const constraints = getModeConstraintDefaults(mode);
    
    const newParams = {
      ...localParams,
      selectedMode: mode,
      qCavity: resolved.qCavity,
      dutyCycle: resolved.dutyCycle,
      ...constraints
    };
    
    setLocalParams(newParams);
    
    // Update parent component with new parameters
    if (onParameterChange) {
      onParameterChange(newParams);
    }
    
    console.log(`🎯 Applied ${mode} mode preset: Q=${resolved.qCavity}, duty=${resolved.dutyCycle}`);
  };

  // React to mode changes from parent component
  React.useEffect(() => {
    if (selectedMode && selectedMode !== localParams.selectedMode) {
      applyModePreset(selectedMode);
    }
  }, [selectedMode]);

  // Get mode-specific parameter values for double-click functionality
  const getModeSpecificValue = (parameter: string, mode: string) => {
    const resolved = resolveModeNumbers(mode, pipeline);
    
    switch (parameter) {
      case 'gammaGeo':
        return 26; // Standard research value for all modes
      case 'qCavity':
        return resolved.qCavity;
      case 'dutyCycle':
        return resolved.dutyCycle;
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
        // Mode-specific quantum safety limits (Ford-Roman compliant)
        switch (mode) {
          case 'hover': return 0.05; // Ford-Roman compliant for station-keeping
          case 'cruise': return 0.05; // Ford-Roman compliant for sustained travel
          case 'emergency': return 0.05; // Ford-Roman compliant even for high power  
          case 'standby': return 10.0; // Very relaxed (system off)
          default: return 0.05;
        }
      case 'minTimescale':
        // UNIVERSAL homogenization threshold: TS_ratio = τ_LC/τ_pulse ≥ 100
        // Same for ALL modes - ensures τ_pulse ≪ τ_LC across all operational envelopes
        return 100; // TS_ratio = 100 safety margin
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
              onValueChange={(value) => {
                updateParameter('selectedMode', value);
                // Trigger zen toast with current metrics
                const preset = modePresets[value as keyof typeof modePresets];
                if (preset) {
                  zenLongToast("mode:switch", {
                    mode: preset.name,
                    duty: preset.duty,
                    powerMW: parseFloat(preset.description.split('MW')[0]) || 83.3,
                    exoticKg: parseInt(preset.description.split('kg')[0].split('• ')[1]) || 1405,
                    zeta: parseFloat(preset.description.split('ζ=')[1]) || 0.032
                  });
                }
              }}
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
                  onValueChange={([value]) => {
                    updateParameter('gammaGeo', value);
                    zenLongToast("geom:gamma", {
                      gammaGeo: value,
                      shipRadiusM: currentShipRadius,
                      gapNm: 1.0 // Typical gap
                    });
                  }}
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
                    onValueChange={([value]) => {
                      const qFactor = Math.pow(10, value);
                      updateParameter('qFactor', qFactor);
                      zenLongToast("geom:qfactor", {
                        qFactor: qFactor,
                        powerMW: 83.3, // Current power estimate
                        zeta: 0.032 // Current zeta
                      });
                    }}
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