import { SimulationResult } from "@shared/schema";

interface DynamicValuesTableProps {
  results: SimulationResult['results'];
  parameters: any;
}

export function DynamicValuesTable({ results, parameters }: DynamicValuesTableProps) {
  if (!results || !parameters.dynamicConfig) return null;

  const { dynamicConfig } = parameters;

  const formatScientific = (value: number | undefined, precision = 3) => {
    if (value === undefined) return 'N/A';
    return value.toExponential(precision);
  };

  const formatNumber = (value: number | undefined, precision = 2) => {
    if (value === undefined) return 'N/A';
    return value.toFixed(precision);
  };

  const valueRows = [
    // Input Parameters
    { 
      category: "Input Parameters",
      rows: [
        { variable: "fₘ", description: "Modulation Frequency", value: `${dynamicConfig.modulationFreqGHz} GHz`, formula: "User input" },
        { variable: "δa", description: "Stroke Amplitude", value: `±${dynamicConfig.strokeAmplitudePm} pm`, formula: "User input" },
        { variable: "t_burst", description: "Burst Length", value: `${dynamicConfig.burstLengthUs} μs`, formula: "User input" },
        { variable: "t_cycle", description: "Cycle Time", value: `${dynamicConfig.cycleLengthUs} μs`, formula: "User input" },
        { variable: "Q", description: "Cavity Q Factor", value: formatScientific(dynamicConfig.cavityQ, 1), formula: "User input" },
      ]
    },
    // Derived Time Variables
    {
      category: "Time Domain Variables",
      rows: [
        { variable: "Tₘ", description: "Stroke Period", value: `${formatNumber(results.strokePeriodPs)} ps`, formula: "Tₘ = 1/fₘ" },
        { variable: "d", description: "Duty Factor", value: `${formatNumber((results.dutyFactor || 0) * 100)}%`, formula: "d = t_burst/t_cycle" },
        { variable: "f_rep", description: "Repetition Rate", value: `${formatNumber(1000 / dynamicConfig.cycleLengthUs)} kHz`, formula: "f_rep = 1/t_cycle" },
      ]
    },
    // Energy Variables
    {
      category: "Energy Variables",
      rows: [
        { variable: "ΔE_static", description: "Static Baseline Energy", value: `${formatScientific(results.totalEnergy)} J`, formula: "SCUFF-EM calculation" },
        { variable: "ΔE_boost", description: "Q-Enhanced Energy", value: `${formatScientific(results.boostedEnergy)} J`, formula: "ΔE_boost = |ΔE_static| × Q" },
        { variable: "⟨ΔE⟩", description: "Cycle-Average Energy", value: `${formatScientific(results.cycleAverageEnergy)} J`, formula: "⟨ΔE⟩ = ΔE_boost × d" },
      ]
    },
    // Exotic Matter Variables
    {
      category: "Exotic Matter Variables",
      rows: [
        { variable: "ρ_eff", description: "Effective Energy Density", value: `${formatScientific(results.exoticEnergyDensity)} J/m³`, formula: "ρ_eff = ⟨ΔE⟩/V_tile" },
        { variable: "M_exotic", description: "Total Exotic Mass", value: `${formatScientific(results.totalExoticMass)} kg`, formula: "M = ⟨ΔE⟩/c²" },
        { variable: "M_target", description: "Target Exotic Mass", value: "1.400 × 10³ kg", formula: "Warp bubble requirement" },
      ]
    },
    // Power Variables
    {
      category: "Power Variables",
      rows: [
        { variable: "P_instant", description: "Instantaneous Power", value: `${formatNumber((results.instantaneousPower || 0) / 1e12)} TW`, formula: "P = ΔE_boost/t_burst" },
        { variable: "P_average", description: "Average Power", value: `${formatNumber((results.averagePower || 0) / 1e6)} MW`, formula: "P_avg = P_instant × d" },
        { variable: "P_target", description: "Target Average Power", value: "~83 MW", formula: "Engineering constraint" },
      ]
    },
    // Quantum Constraint Variables
    {
      category: "Quantum Constraints",
      rows: [
        { variable: "ζ", description: "Quantum Inequality Margin", value: formatScientific(results.quantumInequalityMargin), formula: "ζ = ρ_eff × τ_pulse / QI_bound" },
        { variable: "QI_status", description: "Quantum Safety", value: results.quantumSafetyStatus || 'Unknown', formula: "Safe if ζ < 1" },
        { variable: "QI_bound", description: "Ford-Roman Bound", value: "~10¹⁶ J⋅s/m³", formula: "Quantum field theory limit" },
      ]
    },
    // GR Validity Variables
    {
      category: "General Relativity Checks",
      rows: [
        { variable: "Isaacson", description: "High-Frequency Limit", value: results.isaacsonLimit ? "PASS" : "FAIL", formula: "d < 0.1 for spacetime stability" },
        { variable: "Green-Wald", description: "Averaged NEC", value: results.greenWaldCompliance ? "PASS" : "FAIL", formula: "⟨T_μν⟩ ≥ 0 constraint" },
        { variable: "WEC", description: "Weak Energy Condition", value: "Monitoring", formula: "Local energy density bounds" },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Complete Variable Analysis
      </h3>
      
      {valueRows.map((category, categoryIndex) => (
        <div key={categoryIndex} className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-t-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{category.category}</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Variable</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Value</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Formula/Source</th>
                </tr>
              </thead>
              <tbody>
                {category.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-2 px-4 font-mono text-sm text-blue-600 dark:text-blue-400">{row.variable}</td>
                    <td className="py-2 px-4 text-sm text-gray-700 dark:text-gray-300">{row.description}</td>
                    <td className="py-2 px-4 font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{row.value}</td>
                    <td className="py-2 px-4 text-xs text-gray-500 dark:text-gray-400 font-mono">{row.formula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      
      {/* Summary Status Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">System Status Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatNumber((results.dutyFactor || 0) * 100)}%
            </div>
            <div className="text-gray-600 dark:text-gray-400">Duty Cycle</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${results.quantumSafetyStatus === 'safe' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {results.quantumSafetyStatus?.toUpperCase() || 'UNKNOWN'}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Quantum Safety</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${results.isaacsonLimit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {results.isaacsonLimit ? 'VALID' : 'INVALID'}
            </div>
            <div className="text-gray-600 dark:text-gray-400">GR Compliance</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {formatNumber((results.averagePower || 0) / 1e6)} MW
            </div>
            <div className="text-gray-600 dark:text-gray-400">Avg Power</div>
          </div>
        </div>
      </div>
    </div>
  );
}