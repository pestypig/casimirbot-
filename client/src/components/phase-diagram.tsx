import React, { useState } from 'react';

interface InteractiveHeatMapProps {
  currentTileArea: number;
  currentShipRadius: number;
  viabilityParams: any;
  constraintConfig?: any;
  currentSimulation?: any;
}

function InteractiveHeatMap({ 
  currentTileArea, 
  currentShipRadius, 
  viabilityParams, 
  constraintConfig, 
  currentSimulation 
}: InteractiveHeatMapProps) {
  const [gridData, setGridData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  React.useEffect(() => {
    const loadGrid = async () => {
      setIsLoading(true);
      console.log(`🔄 Building realistic viability grid using 8-step recipe...`);
      console.log(`🔧 Mode: ${viabilityParams?.duty === 0.14 ? 'Hover' : viabilityParams?.duty === 0.005 ? 'Cruise' : 'Custom'}`);
      
      try {
        // Use the recipe-based viability grid computation
        const { computeViabilityGrid } = await import('./viability-grid');
        const gridResult = computeViabilityGrid(viabilityParams, 25);
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
  }, [currentTileArea, currentShipRadius, viabilityParams, constraintConfig, currentSimulation?.status]);
  
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
    <div className="bg-white dark:bg-gray-900 rounded-lg border">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Interactive Phase Diagram</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Realistic viability boundaries based on mass, power, quantum safety, and time-scale constraints
        </p>
        
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
      </div>
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
          <strong>No more unrealistic 100% viable zones!</strong>
        </p>
      </div>
    </div>
  );
}