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

// Match server visual seed unless pipeline provides one
const DEFAULT_GAMMA_VDB = 1e11;

const pick = <T,>(v: T | undefined, d: T) =>
  (typeof v === "number" ? (isFinite(v as any) ? (v as any) : d) : (v ?? d));

function resolveModeNumbers(mode: string, pipeline?: any) {
  const m = (mode || "hover").toLowerCase() as keyof typeof MODE_CONFIGS;

  // Prefer live pipeline; otherwise MODE_CONFIGS; otherwise sane fallbacks
  const dutyCycle       = pick(pipeline?.dutyCycle,       MODE_CONFIGS[m]?.dutyCycle ?? 0.14);
  const sectorStrobing  = pick(pipeline?.sectorStrobing,  MODE_CONFIGS[m]?.sectorStrobing ?? 1);
  const qSpoilingFactor = pick(pipeline?.qSpoilingFactor, MODE_CONFIGS[m]?.qSpoilingFactor ?? 1);
  const qCavity         = pick(pipeline?.qCavity,         1e9);
  const P_avg           = Number.isFinite(pipeline?.P_avg)
    ? pipeline.P_avg
    : (MODE_CONFIGS[m]?.powerTarget_W != null
        ? MODE_CONFIGS[m].powerTarget_W / 1e6
        : 83.3); // MW fallback

  // Prefer visual gamma from server if available
  const gammaVanDenBroeck = pick(
    (pipeline as any)?.gammaVanDenBroeck_vis ?? (pipeline as any)?.gammaVanDenBroeck,
    DEFAULT_GAMMA_VDB
  );

  return { dutyCycle, sectorStrobing, qSpoilingFactor, qCavity, P_avg, gammaVanDenBroeck };
}

// Build a lightweight preset for a mode using live values / MODE_CONFIGS
function buildModePreset(modeKey: string, pipeline?: any) {
  const resolved = resolveModeNumbers(modeKey, pipeline);
  const name = modeKey.charAt(0).toUpperCase() + modeKey.slice(1);
  return {
    key: modeKey,
    name,
    qCavity: resolved.qCavity,
    mechQ: 5e4, // fixed diagram knob
    dutyCycle: resolved.dutyCycle,
    sectorStrobing: resolved.sectorStrobing,
    qSpoilingFactor: resolved.qSpoilingFactor,
    gammaVanDenBroeck: resolved.gammaVanDenBroeck,
    powerMW: resolved.P_avg,
    description:
      Number.isFinite(resolved.P_avg)
        ? `${resolved.P_avg.toFixed(1)} MW target`
        : ''
  };
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

  // Live values from the energy pipeline (authoritative)
  const { data: pipeline } = useEnergyPipeline();
  const resolved = resolveModeNumbers(selectedMode, pipeline);

  // Derived preset for the currently selected mode
  const currentModePreset = buildModePreset(selectedMode, pipeline);

  // For convenience when passing to computeViabilityGrid & toasts
  const modePreset = {
    name: currentModePreset.name,
    qCavity: currentModePreset.qCavity,
    mechQ: currentModePreset.mechQ,
    dutyCycle: currentModePreset.dutyCycle,
    sectorStrobing: currentModePreset.sectorStrobing,
    qSpoilingFactor: currentModePreset.qSpoilingFactor,
    gammaVanDenBroeck: currentModePreset.gammaVanDenBroeck,
    powerMW: currentModePreset.powerMW
  };

  // Safe parser for numeric values with fallbacks
  const safeParse = <T extends number>(v: any, d: T): T => {
    const n = Number(v);
    return (Number.isFinite(n) ? (n as T) : d);
  };

  // Mode constraint defaults (Ford–Roman & homogenization)
  const getModeConstraintDefaults = (mode: string) => {
    const universalMinTimescale = 100; // TS_ratio ≥ 100
    switch (mode) {
      case 'hover':     return { maxPower: 120, massTolerance: 5,  maxZeta: 0.05, minTimescale: universalMinTimescale };
      case 'cruise':    return { maxPower: 20,  massTolerance: 10, maxZeta: 0.05, minTimescale: universalMinTimescale };
      case 'emergency': return { maxPower: 400, massTolerance: 15, maxZeta: 0.02, minTimescale: universalMinTimescale };
      case 'standby':   return { maxPower: 10,  massTolerance: 50, maxZeta: 10.0, minTimescale: universalMinTimescale };
      default:          return { maxPower: 120, massTolerance: 5,  maxZeta: 1.0,  minTimescale: universalMinTimescale };
    }
  };

  const initialConstraints = getModeConstraintDefaults(selectedMode);

  // Local parameter state for sliders - initialized with safe numeric fallbacks
  const [localParams, setLocalParams] = useState({
    selectedMode,
    gammaGeo: Number.isFinite(viabilityParams?.gammaGeo) ? viabilityParams.gammaGeo : 26,
    qCavity: Number.isFinite(viabilityParams?.qCavity) && viabilityParams.qCavity > 0
      ? viabilityParams.qCavity
      : currentModePreset.qCavity,
    dutyCycle: Number.isFinite(viabilityParams?.dutyCycle) ? viabilityParams.dutyCycle : currentModePreset.dutyCycle,
    sagDepth: Number.isFinite(viabilityParams?.sagDepth) ? viabilityParams.sagDepth : 16,
    maxPower: Number.isFinite(viabilityParams?.maxPower) ? viabilityParams.maxPower : initialConstraints.maxPower,
    massTolerance: Number.isFinite(viabilityParams?.massTolerance) ? viabilityParams.massTolerance : initialConstraints.massTolerance,
    maxZeta: Number.isFinite(viabilityParams?.maxZeta) ? viabilityParams.maxZeta : initialConstraints.maxZeta,
    minTimescale: Number.isFinite(viabilityParams?.minTimescale) ? viabilityParams.minTimescale : initialConstraints.minTimescale
  });

  // Format Q-Factor for better readability
  const formatQFactor = (q: unknown) => {
    const n = Number(q);
    if (!Number.isFinite(n) || n <= 0) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}×10⁹`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}×10⁶`;
    return n.toExponential(1);
  };

  // Apply a mode preset
  const applyModePreset = (mode: string) => {
    const preset = buildModePreset(mode, pipeline);
    const constraints = getModeConstraintDefaults(mode);

    const newParams = {
      ...localParams,
      selectedMode: mode,
      qCavity: preset.qCavity,
      dutyCycle: preset.dutyCycle,
      ...constraints
    };

    setLocalParams(newParams);

    if (onParameterChange) {
      onParameterChange(newParams);
    }

    console.log(`🎯 Applied ${mode} mode preset: Q=${preset.qCavity}, duty=${preset.dutyCycle}`);
  };

  // React to mode changes from parent component
  React.useEffect(() => {
    if (selectedMode && selectedMode !== localParams.selectedMode) {
      applyModePreset(selectedMode);
    }
  }, [selectedMode]);

  // Mode-specific defaults for double-click reset
  const getModeSpecificValue = (parameter: string, mode: string) => {
    const r = resolveModeNumbers(mode, pipeline);
    switch (parameter) {
      case 'gammaGeo':     return 26;
      case 'qCavity':      return r.qCavity;
      case 'dutyCycle':    return r.dutyCycle;
      case 'sagDepth':     return 16;
      case 'maxPower':     return getModeConstraintDefaults(mode).maxPower;
      case 'massTolerance':return getModeConstraintDefaults(mode).massTolerance;
      case 'maxZeta':      return getModeConstraintDefaults(mode).maxZeta;
      case 'minTimescale': return 100;
      default:             return null;
    }
  };

  const handleSliderDoubleClick = (parameter: string) => {
    const modeValue = getModeSpecificValue(parameter, selectedMode);
    if (modeValue !== null) {
      setLocalParams(prev => ({ ...prev, [parameter]: modeValue }));
      setTimeout(() => updateParameter(parameter, modeValue), 10);
    }
  };

  // Update parent when local parameters change
  const updateParameter = (key: string, value: number | string) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);

    if (key === 'selectedMode' && typeof value === 'string') {
      if (onModeChange) onModeChange(value);
      const preset = buildModePreset(value, pipeline);
      const constraints = getModeConstraintDefaults(value);
      newParams.dutyCycle = preset.dutyCycle;
      newParams.qCavity = preset.qCavity;
      Object.assign(newParams, constraints);
      setLocalParams(newParams);
    }

    if (onParameterChange) {
      onParameterChange({ ...viabilityParams, [key]: value });
    }
  };

  React.useEffect(() => {
    const loadGrid = async () => {
      setIsLoading(true);
      try {
        const { computeViabilityGrid } = await import('./viability-grid');
        const enhancedParams = {
          ...viabilityParams,
          ...localParams, // include local constraint parameters
          currentMode: currentModePreset,
          modeConfig: {
            dutyCycle: resolved.dutyCycle,
            sectorStrobing: resolved.sectorStrobing,
            qSpoilingFactor: resolved.qSpoilingFactor,
            gammaVanDenBroeck: resolved.gammaVanDenBroeck
          }
        };
        const gridResult = computeViabilityGrid(enhancedParams, 25);
        const { A_vals, R_vals, Z } = gridResult;

        const hoverText = R_vals.map((R: number, rIdx: number) =>
          A_vals.map((A: number, aIdx: number) => {
            const viable = Z[rIdx][aIdx] === 1;
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

  // Build options list from MODE_CONFIGS (fallback to canonical list)
  const MODE_KEYS = (MODE_CONFIGS && Object.keys(MODE_CONFIGS).length
    ? Object.keys(MODE_CONFIGS)
    : ['hover', 'cruise', 'emergency', 'standby']) as string[];

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
                const r = resolveModeNumbers(value, pipeline);
                zenLongToast("mode:switch", {
                  mode: value.charAt(0).toUpperCase() + value.slice(1),
                  duty: r.dutyCycle,
                  powerMW: r.P_avg,
                  exoticKg: (pipeline as any)?.M_exotic ?? 1405,
                  zeta: (pipeline as any)?.zeta ?? 0.032
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {MODE_KEYS.map((key) => {
                  const p = buildModePreset(key, pipeline);
                  return (
                    <SelectItem key={key} value={key}>
                      {p.name} {p.description ? `- ${p.description}` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current: {(currentModePreset.dutyCycle * 100).toFixed(1)}% duty, {currentModePreset.sectorStrobing === 1 ? 'no' : `${currentModePreset.sectorStrobing}-sector`} strobing,
              Q-spoiling ×{currentModePreset.qSpoilingFactor}
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
                      gapNm: 1.0
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
                <Label>
                  Cavity Q-Factor: {formatQFactor(localParams.qCavity)} <span className="text-xs text-blue-600">(User Control)</span>
                </Label>
                <div onDoubleClick={() => handleSliderDoubleClick('qCavity')}>
                  <Slider
                    value={[(() => {
                      const n = Number(localParams.qCavity);
                      return Number.isFinite(n) && n > 0 ? Math.log10(n) : 6;
                    })()]}
                    onValueChange={([value]) => {
                      const qFactor = Math.min(1e10, Math.max(1e6, Math.pow(10, value)));
                      updateParameter('qCavity', qFactor);
                      zenLongToast("geom:qfactor", {
                        qFactor,
                        powerMW: 83.3,
                        zeta: 0.032
                      });
                    }}
                    min={6}
                    max={10}
                    step={0.1}
                    className="w-full cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Electromagnetic cavity Q for power loss P = U_geo×ω/Q_cavity • Double-click to apply {selectedMode} mode value ({formatQFactor(currentModePreset.qCavity)})
                </p>
              </div>

              <div className="bg-muted/30 rounded p-2">
                <Label className="text-sm">
                  Mechanical Q-Factor: {formatQFactor(currentModePreset.mechQ)} <span className="text-xs text-gray-600">(Fixed)</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Parametric resonator Q for energy boost U_Q = Q_mech × U_geo (mode-invariant)
                </p>
              </div>
            </div>

            {/* Duty Cycle */}
            <div className="space-y-2">
              <Label>Duty Cycle: {(localParams.dutyCycle * 100).toFixed(1)}% (Mode: {currentModePreset.name})</Label>
              <div onDoubleClick={() => handleSliderDoubleClick('dutyCycle')}>
                <Slider
                  value={[localParams.dutyCycle * 100]}
                  onValueChange={([value]) => updateParameter('dutyCycle', value / 100)}
                  min={0}
                  max={50}
                  step={0.1}
                  className="w-full cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set by operational mode ({currentModePreset.name}) • Double-click to reset to mode default ({(currentModePreset.dutyCycle * 100).toFixed(1)}%)
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
                <Label>Max ζ: {localParams.maxZeta.toFixed(2)}</Label>
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
                <Label>Min TS Ratio: {localParams.minTimescale.toFixed(0)}</Label>
                <div onDoubleClick={() => handleSliderDoubleClick('minTimescale')}>
                  <Slider
                    value={[Math.log10(localParams.minTimescale)]}
                    onValueChange={([value]) => updateParameter('minTimescale', Math.pow(10, value))}
                    min={2}
                    max={5}
                    step={0.1}
                    className="w-full cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Universal homogenization threshold (TS_ratio ≥ 100) • Double-click to apply research value (100)
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
          <MetricsDashboard
            viabilityParams={{
              ...viabilityParams,
              selectedMode: selectedMode,
              dutyCycle: localParams.dutyCycle
            }}
          />
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