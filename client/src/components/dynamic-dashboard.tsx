import { SimulationResult } from "@shared/schema";

interface DynamicDashboardProps {
  results: SimulationResult['results'];
  isVisible: boolean;
}

export function DynamicDashboard({ results, isVisible }: DynamicDashboardProps) {
  if (!isVisible || !results) {
    return null;
  }

  const formatScientific = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return value.toExponential(3);
  };

  const formatDuration = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(1)} ps`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const getQISafetyColor = (status: string | undefined) => {
    switch (status) {
      case 'safe': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'warning': return 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100';
      case 'violation': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Dynamic Casimir Analysis
      </h3>
      
      {/* Time-domain parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">Stroke Period</h4>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
            {formatDuration(results.strokePeriodPs)}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300">Tₘ = 1/fₘ</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-purple-900 dark:text-purple-100">Duty Factor</h4>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-200">
            {formatPercentage(results.dutyFactor)}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-300">d = t_burst/t_cycle</p>
        </div>
      </div>

      {/* Energy calculations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Cycle-Average Energy</h4>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">
            {formatScientific(results.cycleAverageEnergy)} J
          </p>
          <p className="text-sm text-indigo-600 dark:text-indigo-300">⟨ΔE⟩ per tile</p>
        </div>
        
        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-teal-900 dark:text-teal-100">Total Exotic Mass</h4>
          <p className="text-2xl font-bold text-teal-700 dark:text-teal-200">
            {formatScientific(results.totalExoticMass)} kg
          </p>
          <p className="text-sm text-teal-600 dark:text-teal-300">Target ≈ 1.4×10³ kg</p>
        </div>
      </div>

      {/* Quantum inequality and safety */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg ${getQISafetyColor(results.quantumSafetyStatus)}`}>
          <h4 className="font-medium">Quantum Inequality Margin</h4>
          <p className="text-2xl font-bold">
            ζ = {results.quantumInequalityMargin?.toFixed(3) || 'N/A'}
          </p>
          <p className="text-sm">
            Status: {results.quantumSafetyStatus || 'Unknown'} (Safe if ζ &lt; 1)
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Average Power</h4>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">
            {results.averagePower ? (results.averagePower / 1e6).toFixed(1) : 'N/A'} MW
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Duty-mitigated (~83 MW target)
          </p>
        </div>
      </div>

      {/* GR validity checks */}
      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">GR Validity Checks</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-200">Isaacson High-Frequency Limit:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              results.isaacsonLimit 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
            }`}>
              {results.isaacsonLimit ? 'PASS' : 'FAIL'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-200">Green-Wald Compliance:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              results.greenWaldCompliance 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
            }`}>
              {results.greenWaldCompliance ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}