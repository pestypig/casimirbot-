/**
 * Design Ledger Component
 * Displays target values verification against research paper specifications
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface DesignLedgerProps {
  results: {
    // Geometry parameters
    gammaGeo?: number;
    cavityQ?: number;
    
    // Duty cycle values
    dutyFactor?: number;
    effectiveDuty?: number;
    
    // Energy calculations
    energyPerTileCycleAvg?: number;
    totalExoticMass?: number;
    
    // Safety margins
    quantumInequalityMargin?: number;
    zetaMargin?: number;
    
    // Power calculations
    averagePower?: number;
    
    // Target validation
    massTargetCheck?: boolean;
    powerTargetCheck?: boolean;
    
    // Natário warp bubble parameters
    geometricBlueshiftFactor?: number;
    effectivePathLength?: number;
    qEnhancementFactor?: number;
    totalAmplificationFactor?: number;
    exoticMassPerTile?: number;
    timeAveragedMass?: number;
    powerDraw?: number;
    quantumSafetyStatus?: 'safe' | 'warning' | 'violation';
    isZeroExpansion?: boolean;
    isCurlFree?: boolean;
    expansionScalar?: number;
    curlMagnitude?: number;
    momentumFlux?: number;
    stressEnergyTensor?: {
      isNullEnergyConditionSatisfied: boolean;
    };
  };
}

export function DesignLedger({ results }: DesignLedgerProps) {
  // Target values from research paper
  const targets = {
    gammaGeo: 25,
    cavityQ: 1e9,
    dutyFactor: 0.01, // 1%
    effectiveDuty: 2.5e-5, // d_eff = d/S
    exoticMassTarget: 1.4e3, // 1.4 × 10³ kg
    powerTarget: 83e6, // 83 MW
    zetaSafeLimit: 1.0 // Quantum inequality safety limit
  };

  // Calculate validation status
  const getZetaColor = (zeta: number | undefined) => {
    if (!zeta) return 'gray';
    if (zeta < 0.9) return 'green';
    if (zeta < 1.0) return 'amber';
    return 'red';
  };

  const getValidationStatus = (actual: number | undefined, target: number, tolerance = 0.05) => {
    if (!actual) return 'unknown';
    const ratio = actual / target;
    return Math.abs(1 - ratio) <= tolerance ? 'pass' : 'warn';
  };

  // LED Status Indicator Component
  const StatusLED = ({ status, size = 'w-3 h-3' }: { status: 'pass' | 'warn' | 'fail' | 'unknown', size?: string }) => {
    const colors = {
      pass: 'bg-green-500',
      warn: 'bg-amber-500', 
      fail: 'bg-red-500',
      unknown: 'bg-gray-400'
    };
    return <div className={`${size} rounded-full ${colors[status]} border border-gray-300`} />;
  };

  // Enhanced validation with traffic-light status
  const getGammaGeoStatus = () => {
    const actual = results.geometricBlueshiftFactor || results.gammaGeo;
    if (!actual) return 'unknown';
    if (Math.abs(actual - targets.gammaGeo) / targets.gammaGeo <= 0.1) return 'pass'; // ±10%
    if (Math.abs(actual - targets.gammaGeo) / targets.gammaGeo <= 0.2) return 'warn'; // ±20%
    return 'fail';
  };

  const getMassStatus = () => {
    const actual = results.totalExoticMass || results.exoticMassPerTile;
    if (!actual) return 'unknown';
    if (Math.abs(actual - targets.exoticMassTarget) / targets.exoticMassTarget <= 0.05) return 'pass'; // ±5%
    if (Math.abs(actual - targets.exoticMassTarget) / targets.exoticMassTarget <= 0.1) return 'warn'; // ±10%
    return 'fail';
  };

  const getPowerStatus = () => {
    const actual = results.powerDraw || results.averagePower;
    if (!actual) return 'unknown';
    if (Math.abs(actual - targets.powerTarget) / targets.powerTarget <= 0.1) return 'pass'; // ±10%
    if (Math.abs(actual - targets.powerTarget) / targets.powerTarget <= 0.2) return 'warn'; // ±20%
    return 'fail';
  };

  const getQuantumSafetyStatus = () => {
    const zeta = results.quantumInequalityMargin || results.zetaMargin;
    if (!zeta) return 'unknown';
    if (zeta < 0.9) return 'pass';
    if (zeta < 1.0) return 'warn';
    return 'fail';
  };

  const formatPower = (watts: number | undefined) => {
    if (!watts) return '—';
    if (watts >= 1e6) return `${(watts / 1e6).toFixed(1)} MW`;
    if (watts >= 1e3) return `${(watts / 1e3).toFixed(1)} kW`;
    return `${watts.toFixed(1)} W`;
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Design Ledger (Target Verification)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Geometry Parameters */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-blue-700">Geometry</h4>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">γ_geo:</span>
              <div className="flex items-center gap-2">
                <StatusLED status={getGammaGeoStatus()} />
                <span className="font-mono text-sm">
                  {(results.geometricBlueshiftFactor || results.gammaGeo)?.toFixed(1) || '—'}
                </span>
                <Badge variant={getGammaGeoStatus() === 'pass' ? 'default' : 'secondary'}>
                  Target: {targets.gammaGeo}
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Q↑:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{results.cavityQ?.toExponential(1) || '—'}</span>
                <Badge variant={getValidationStatus(results.cavityQ, targets.cavityQ) === 'pass' ? 'default' : 'secondary'}>
                  Target: {targets.cavityQ.toExponential(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Duty Cycle Parameters */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-purple-700">Duty Cycles</h4>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">d:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {results.dutyFactor ? `${(results.dutyFactor * 100).toFixed(2)}%` : '—'}
                </span>
                <Badge variant={getValidationStatus(results.dutyFactor, targets.dutyFactor) === 'pass' ? 'default' : 'secondary'}>
                  Target: {(targets.dutyFactor * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">d_eff:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {results.effectiveDuty ? `${(results.effectiveDuty * 1e6).toFixed(1)} ppm` : '—'}
                </span>
                <Badge variant={getValidationStatus(results.effectiveDuty, targets.effectiveDuty) === 'pass' ? 'default' : 'secondary'}>
                  Target: {(targets.effectiveDuty * 1e6).toFixed(1)} ppm
                </Badge>
              </div>
            </div>
          </div>

          {/* Energy & Mass */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-green-700">Energy & Mass</h4>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">ΔE per tile:</span>
              <span className="font-mono text-sm">
                {results.energyPerTileCycleAvg?.toExponential(2) || '—'} J
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Exotic mass:</span>
              <div className="flex items-center gap-2">
                <StatusLED status={getMassStatus()} />
                <span className="font-mono text-sm">
                  {(results.totalExoticMass || results.exoticMassPerTile) ? 
                    `${(results.totalExoticMass || results.exoticMassPerTile)!.toFixed(1)} kg` : '—'}
                </span>
                <Badge variant={getMassStatus() === 'pass' ? 'default' : 'destructive'}>
                  Target: 1.4×10³ kg
                </Badge>
              </div>
            </div>
          </div>

          {/* Safety & Power */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-amber-700">Safety & Power</h4>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">ζ margin:</span>
              <div className="flex items-center gap-2">
                <StatusLED status={getQuantumSafetyStatus()} />
                <span className={`font-mono text-sm font-bold text-${getZetaColor(results.zetaMargin || results.quantumInequalityMargin)}-600`}>
                  {(results.zetaMargin || results.quantumInequalityMargin)?.toFixed(3) || '—'}
                </span>
                <Badge variant={getQuantumSafetyStatus() === 'pass' ? 'default' : 'destructive'}>
                  Safe: &lt; 1.0
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Power:</span>
              <div className="flex items-center gap-2">
                <StatusLED status={getPowerStatus()} />
                <span className="font-mono text-sm">
                  {formatPower(results.powerDraw || results.averagePower)}
                </span>
                <Badge variant={getPowerStatus() === 'pass' ? 'default' : 'secondary'}>
                  Target: 83 MW
                </Badge>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Power draw:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{formatPower(results.averagePower)}</span>
                <Badge variant={getValidationStatus(results.averagePower, targets.powerTarget, 0.1) === 'pass' ? 'default' : 'secondary'}>
                  Target: {formatPower(targets.powerTarget)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Validation Summary */}
          <div className="space-y-3 md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold text-sm text-slate-700">Validation Status</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getValidationStatus(results.totalExoticMass, targets.exoticMassTarget) === 'pass' ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <span className="text-sm">Mass Target (1.4×10³ kg ±5%)</span>
              </div>
              
              <div className="flex items-center gap-2">
                {(results.zetaMargin || results.quantumInequalityMargin || 0) < 1.0 ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <span className="text-sm">Quantum Safety (zeta &lt; 1.0)</span>
              </div>
              
              <div className="flex items-center gap-2">
                {getValidationStatus(results.averagePower, targets.powerTarget, 0.1) === 'pass' ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                }
                <span className="text-sm">Power Target (83 MW ±10%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alert for out-of-range exotic mass */}
        {results.totalExoticMass && getValidationStatus(results.totalExoticMass, targets.exoticMassTarget) !== 'pass' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Warning: Exotic mass {results.totalExoticMass.toFixed(1)} kg is outside the target range of 1.4×10³ ±5% kg
              </span>
            </div>
          </div>
        )}
        
        {/* Natário Warp Bubble Section */}
        {(results.geometricBlueshiftFactor !== undefined || 
          results.isZeroExpansion !== undefined ||
          results.quantumSafetyStatus !== undefined) && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-sm mb-3 text-primary">
              Natário Zero-Expansion Warp Bubble
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Geometric Amplification */}
              {results.geometricBlueshiftFactor !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">γ_geo (Blue-shift Factor)</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {results.geometricBlueshiftFactor.toFixed(2)}
                    </span>
                    <Badge 
                      variant={getValidationStatus(results.geometricBlueshiftFactor, targets.gammaGeo) === 'pass' ? 'secondary' : 'destructive'}
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      Target: {targets.gammaGeo}
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* Effective Path Length */}
              {results.effectivePathLength !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">a_eff (Path Length)</div>
                  <div className="font-mono">
                    {results.effectivePathLength.toFixed(3)} nm
                  </div>
                </div>
              )}
              
              {/* Q Enhancement */}
              {results.qEnhancementFactor !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">√Q Enhancement</div>
                  <div className="font-mono">
                    {results.qEnhancementFactor.toExponential(2)}
                  </div>
                </div>
              )}
              
              {/* Total Amplification */}
              {results.totalAmplificationFactor !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Total Amplification</div>
                  <div className="font-mono">
                    {results.totalAmplificationFactor.toExponential(2)}
                  </div>
                </div>
              )}
              
              {/* Per-Tile Exotic Mass */}
              {results.exoticMassPerTile !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Mass per Tile</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {results.exoticMassPerTile.toFixed(2)} kg
                    </span>
                    <Badge 
                      variant={Math.abs(results.exoticMassPerTile - 1.5) / 1.5 < 0.1 ? 'secondary' : 'destructive'}
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      Target: 1.5 kg
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* Time-Averaged Mass */}
              {results.timeAveragedMass !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Time-Avg Mass</div>
                  <div className="font-mono">
                    {results.timeAveragedMass.toExponential(2)} kg
                  </div>
                </div>
              )}
              
              {/* Zero-Expansion Status */}
              {results.isZeroExpansion !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Zero Expansion</div>
                  <div className="flex items-center gap-2">
                    {results.isZeroExpansion ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={results.isZeroExpansion ? 'text-green-600' : 'text-red-600'}>
                      {results.isZeroExpansion ? 'Satisfied' : 'Violated'}
                    </span>
                    {results.expansionScalar !== undefined && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        (∇·β = {results.expansionScalar.toExponential(1)})
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Curl-Free Status */}
              {results.isCurlFree !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Curl-Free Field</div>
                  <div className="flex items-center gap-2">
                    {results.isCurlFree ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={results.isCurlFree ? 'text-green-600' : 'text-red-600'}>
                      {results.isCurlFree ? 'Satisfied' : 'Violated'}
                    </span>
                    {results.curlMagnitude !== undefined && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        (|∇×β| = {results.curlMagnitude.toExponential(1)})
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Quantum Safety Status */}
              {results.quantumSafetyStatus !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Quantum Safety</div>
                  <div className="flex items-center gap-2">
                    {results.quantumSafetyStatus === 'safe' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : results.quantumSafetyStatus === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={
                      results.quantumSafetyStatus === 'safe' ? 'text-green-600' :
                      results.quantumSafetyStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
                    }>
                      {results.quantumSafetyStatus.charAt(0).toUpperCase() + results.quantumSafetyStatus.slice(1)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Momentum Flux */}
              {results.momentumFlux !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Momentum Flux</div>
                  <div className="font-mono">
                    {results.momentumFlux.toExponential(2)} N
                  </div>
                </div>
              )}
              
              {/* Null Energy Condition */}
              {results.stressEnergyTensor?.isNullEnergyConditionSatisfied !== undefined && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Null Energy Condition</div>
                  <div className="flex items-center gap-2">
                    {results.stressEnergyTensor.isNullEnergyConditionSatisfied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={
                      results.stressEnergyTensor.isNullEnergyConditionSatisfied ? 'text-green-600' : 'text-red-600'
                    }>
                      {results.stressEnergyTensor.isNullEnergyConditionSatisfied ? 'Satisfied' : 'Violated'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}