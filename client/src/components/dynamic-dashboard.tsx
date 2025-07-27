import { SimulationResult } from "@shared/schema";
import { DynamicVisualization } from "./dynamic-visualization";
import { DynamicValuesTable } from "./dynamic-values-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DynamicDashboardProps {
  results: SimulationResult['results'];
  parameters: any;
  isVisible: boolean;
}

export function DynamicDashboard({ results, parameters, isVisible }: DynamicDashboardProps) {
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
    <div className="space-y-6 mb-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Dynamic Casimir Effects Analysis
      </h3>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="values">All Variables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
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

          {/* Power Analysis */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Power Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-orange-900 dark:text-orange-100">Per Tile</h5>
                <p className="text-xl font-bold text-orange-700 dark:text-orange-200">
                  {formatScientific(results.averagePowerPerTile)} MW
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">Single tile average</p>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-red-900 dark:text-red-100">Total Lattice</h5>
                <p className="text-xl font-bold text-red-700 dark:text-red-200">
                  {formatScientific(results.averagePowerTotalLattice)} MW
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">Full 1.96×10⁹ tiles</p>
              </div>
            </div>
          </div>

          {/* Exotic Mass Analysis */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Exotic Mass Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-green-900 dark:text-green-100">Per Tile</h5>
                <p className="text-xl font-bold text-green-700 dark:text-green-200">
                  {formatScientific(results.exoticMassPerTile)} kg
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">Single tile mass</p>
              </div>
              
              <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-cyan-900 dark:text-cyan-100">Total Lattice</h5>
                <p className="text-xl font-bold text-cyan-700 dark:text-cyan-200">
                  {formatScientific(results.exoticMassTotalLattice)} kg
                </p>
                <p className="text-sm text-cyan-600 dark:text-cyan-300">Target: 1.4×10³ kg</p>
              </div>
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
                <span className="text-sm text-amber-700 dark:text-amber-200">Green-Wald Averaged NEC:</span>
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
        </TabsContent>
        
        <TabsContent value="visualization" className="mt-6">
          <DynamicVisualization results={results} parameters={parameters} />
        </TabsContent>
        
        <TabsContent value="values" className="mt-6">
          <DynamicValuesTable results={results} parameters={parameters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}