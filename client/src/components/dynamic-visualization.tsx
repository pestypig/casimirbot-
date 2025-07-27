import { useMemo } from "react";
import { SimulationResult } from "@shared/schema";

interface DynamicVisualizationProps {
  results: SimulationResult['results'];
  parameters: any;
}

export function DynamicVisualization({ results, parameters }: DynamicVisualizationProps) {
  if (!results || !parameters.dynamicConfig) return null;

  const { modulationFreqGHz, strokeAmplitudePm, burstLengthUs, cycleLengthUs, cavityQ } = parameters.dynamicConfig;

  // Generate time-domain visualization data
  const timeSeriesData = useMemo(() => {
    const totalCycles = 3;
    const pointsPerCycle = 100;
    const data = [];
    
    for (let cycle = 0; cycle < totalCycles; cycle++) {
      for (let i = 0; i < pointsPerCycle; i++) {
        const t = (cycle * cycleLengthUs + (i / pointsPerCycle) * cycleLengthUs);
        const cyclePhase = (i / pointsPerCycle) * 2 * Math.PI;
        
        // Determine if we're in burst period
        const burstFraction = burstLengthUs / cycleLengthUs;
        const inBurst = (i / pointsPerCycle) < burstFraction;
        
        // Modulation envelope
        const amplitude = inBurst ? strokeAmplitudePm : 0;
        const displacement = amplitude * Math.sin(cyclePhase * modulationFreqGHz * cycleLengthUs / 1000);
        
        // Energy enhancement during burst
        const staticEnergy = Math.abs(results.totalEnergy || 0) / (results.boostedEnergy || 1);
        const energy = inBurst ? staticEnergy * cavityQ * Math.abs(Math.sin(cyclePhase)) : staticEnergy;
        
        data.push({
          time: t,
          displacement,
          energy: energy / 1e12, // Scale for visualization
          inBurst,
          cycle
        });
      }
    }
    return data;
  }, [modulationFreqGHz, strokeAmplitudePm, burstLengthUs, cycleLengthUs, cavityQ, results]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Dynamic Casimir Visualization
      </h3>
      
      {/* Time Domain Animation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h4 className="font-medium mb-4">Modulation Time Series</h4>
        <div className="h-64 w-full">
          <svg viewBox="0 0 800 200" className="w-full h-full">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="800" height="200" fill="url(#grid)" />
            
            {/* Burst regions */}
            {timeSeriesData.map((point, i) => {
              if (point.inBurst && timeSeriesData[i + 1]?.inBurst) {
                const x1 = (point.time / (cycleLengthUs * 3)) * 800;
                const x2 = (timeSeriesData[i + 1].time / (cycleLengthUs * 3)) * 800;
                return (
                  <rect 
                    key={`burst-${i}`}
                    x={x1} 
                    y={0} 
                    width={x2 - x1} 
                    height={200} 
                    fill="rgba(59, 130, 246, 0.1)"
                  />
                );
              }
              return null;
            })}
            
            {/* Displacement curve */}
            <path
              d={`M ${timeSeriesData.map((point, i) => {
                const x = (point.time / (cycleLengthUs * 3)) * 800;
                const y = 100 + point.displacement * 2; // Scale displacement
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            
            {/* Energy curve */}
            <path
              d={`M ${timeSeriesData.map((point, i) => {
                const x = (point.time / (cycleLengthUs * 3)) * 800;
                const y = 150 - point.energy * 20; // Scale energy
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}`}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            
            {/* Axis labels */}
            <text x="10" y="20" fontSize="12" fill="#6b7280">Energy (scaled)</text>
            <text x="10" y="110" fontSize="12" fill="#6b7280">Zero</text>
            <text x="10" y="190" fontSize="12" fill="#6b7280">Displacement</text>
            
            {/* Legend */}
            <g transform="translate(600, 20)">
              <rect x="0" y="0" width="15" height="3" fill="#3b82f6"/>
              <text x="20" y="12" fontSize="11" fill="#6b7280">Boundary Motion</text>
              <rect x="0" y="20" width="15" height="3" fill="#ef4444" strokeDasharray="2,2"/>
              <text x="20" y="32" fontSize="11" fill="#6b7280">Energy Enhancement</text>
              <rect x="0" y="40" width="15" height="15" fill="rgba(59, 130, 246, 0.1)"/>
              <text x="20" y="52" fontSize="11" fill="#6b7280">Burst Periods</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Frequency Domain Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h4 className="font-medium mb-4">Frequency Spectrum</h4>
        <div className="h-32 w-full">
          <svg viewBox="0 0 400 100" className="w-full h-full">
            {/* Fundamental frequency peak */}
            <rect x="50" y="20" width="8" height="60" fill="#3b82f6"/>
            <text x="54" y="90" fontSize="8" textAnchor="middle" fill="#6b7280">f₀</text>
            
            {/* Harmonics */}
            {[2, 3, 4, 5].map((harmonic, i) => (
              <g key={harmonic}>
                <rect 
                  x={50 + harmonic * 60} 
                  y={20 + i * 10} 
                  width="6" 
                  height={60 - i * 10} 
                  fill="#60a5fa"
                />
                <text 
                  x={53 + harmonic * 60} 
                  y="90" 
                  fontSize="8" 
                  textAnchor="middle" 
                  fill="#6b7280"
                >
                  {harmonic}f₀
                </text>
              </g>
            ))}
            
            {/* Axis */}
            <line x1="20" y1="80" x2="380" y2="80" stroke="#6b7280" strokeWidth="1"/>
            <text x="200" y="98" fontSize="10" textAnchor="middle" fill="#6b7280">
              Frequency (GHz)
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}