import { useMemo } from "react";
import { SimulationResult } from "@shared/schema";

interface DynamicVisualizationProps {
  results: SimulationResult["results"];
  parameters: any;
}

export function DynamicVisualization({ results, parameters }: DynamicVisualizationProps) {
  const cfg = parameters?.dynamicConfig;
  if (!results || !cfg) return null;

  const {
    modulationFreqGHz = 15,
    strokeAmplitudePm = 0, // boundary stroke amplitude in picometers
    burstLengthUs = 0,
    cycleLengthUs = 1_000, // sector dwell (µs)
    cavityQ = 1
  } = cfg;

  // Generate time-domain visualization data
  const timeSeriesData = useMemo(() => {
    const totalCycles = 3;
    const pointsPerCycle = 160;
    const fHz = Math.max(1e-9, Number(modulationFreqGHz) * 1e9); // Hz
    const omega = 2 * Math.PI * fHz;

    const Tcycle_us = Math.max(1e-9, Number(cycleLengthUs)); // µs
    const Tcycle_s  = Tcycle_us * 1e-6;

    const burst_us = Math.max(0, Number(burstLengthUs));
    const burstFrac = Math.min(1, burst_us / Tcycle_us); // clamp 0..1

  const A_pm = Number.isFinite(Number(strokeAmplitudePm)) ? Number(strokeAmplitudePm) : 0; // keep pm so it's visible on screen

  // energy baseline from results (J); fall back to 0 but preserve literal zeros
  const E_base = Math.abs(Number.isFinite(Number((results as any)?.totalEnergy)) ? Number((results as any).totalEnergy) : 0);
  const E_boostHint = Math.abs(Number.isFinite(Number((results as any)?.boostedEnergy)) ? Number((results as any).boostedEnergy) : 0);
  // Scale for plotting: prefer boostedEnergy as a denominator; otherwise E_base * Q
  const energyScale = Math.max(1, Number.isFinite(E_boostHint) && E_boostHint > 0 ? E_boostHint : (E_base * Math.max(1, Number(cavityQ) || 1)));

    const data: Array<{
      time: number;          // µs
      displacement: number;  // pm
      energy: number;        // normalized (0..~1)
      inBurst: boolean;
      cycle: number;
    }> = [];

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      for (let i = 0; i < pointsPerCycle; i++) {
        const t_us = cycle * Tcycle_us + (i / (pointsPerCycle - 1)) * Tcycle_us;
        const t_s = t_us * 1e-6;

        // time within current cycle (0..1)
        const u = (t_us % Tcycle_us) / Tcycle_us;
        const inBurst = u < burstFrac;

        // boundary displacement: A * sin(ωt)
        const disp_pm = A_pm * Math.sin(omega * t_s);

        // stored energy proxy: E_base outside; inside burst multiply by Q and sin^2(ωt)
        const E_inst = inBurst
          ? (E_base * Math.max(1, Number(cavityQ) || 1)) * Math.pow(Math.sin(omega * t_s), 2)
          : E_base;

        data.push({
          time: t_us,
          displacement: disp_pm,
          energy: E_inst / energyScale, // ~0..1 for plotting
          inBurst,
          cycle
        });
      }
    }
    return data;
  }, [modulationFreqGHz, strokeAmplitudePm, burstLengthUs, cycleLengthUs, cavityQ, results]);

  // helpers for SVG mapping
  const totalDurationUs = Math.max(1e-9, 3 * Math.max(1e-9, Number(parameters?.dynamicConfig?.cycleLengthUs) || 1000));
  const xOf = (tUs: number) => (tUs / totalDurationUs) * 800; // 0..800
  const yOfDisp = (pm: number) => 100 - pm * 0.8;             // scale pm to pixels
  const yOfEnergy = (e: number) => 150 - e * 120;             // 0..1 → up to 120 px span

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Dynamic Casimir Visualization
      </h3>

      {/* Time Domain */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h4 className="font-medium mb-4">Modulation Time Series</h4>
        <div className="h-64 w-full">
          <svg viewBox="0 0 800 200" className="w-full h-full">
            {/* Grid */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="800" height="200" fill="url(#grid)" />

            {/* Burst shading */}
            {timeSeriesData.map((p, i) => {
              const next = timeSeriesData[i + 1];
              if (p.inBurst && next?.inBurst) {
                const x1 = xOf(p.time);
                const x2 = xOf(next.time);
                return (
                  <rect
                    key={`burst-${i}`}
                    x={x1}
                    y={0}
                    width={Math.max(0, x2 - x1)}
                    height={200}
                    fill="rgba(59, 130, 246, 0.10)"
                  />
                );
              }
              return null;
            })}

            {/* Displacement */}
            <path
              d={timeSeriesData.map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.time)} ${yOfDisp(p.displacement)}`).join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* Energy */}
            <path
              d={timeSeriesData.map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.time)} ${yOfEnergy(p.energy)}`).join(" ")}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Axes labels */}
            <text x="10" y="20" fontSize="12" fill="#6b7280">Energy (normalized)</text>
            <text x="10" y="110" fontSize="12" fill="#6b7280">Displacement (pm)</text>
            <text x="10" y="190" fontSize="12" fill="#6b7280">Time (µs)</text>

            {/* Legend */}
            <g transform="translate(600, 20)">
              <rect x="0" y="0" width="15" height="3" fill="#3b82f6"/>
              <text x="20" y="12" fontSize="11" fill="#6b7280">Boundary Motion</text>
              <rect x="0" y="20" width="15" height="3" fill="#ef4444"/>
              <text x="20" y="32" fontSize="11" fill="#6b7280">Stored Energy (norm)</text>
              <rect x="0" y="40" width="15" height="15" fill="rgba(59, 130, 246, 0.10)"/>
              <text x="20" y="52" fontSize="11" fill="#6b7280">Burst Periods</text>
              <text x="0" y="72" fontSize="11" fill="#6b7280">fₘ ≈ {modulationFreqGHz.toFixed(2)} GHz</text>
            </g>
          </svg>
        </div>
      </div>

      {/* Frequency Domain (schematic) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h4 className="font-medium mb-4">Frequency Spectrum</h4>
        <div className="h-32 w-full">
          <svg viewBox="0 0 400 100" className="w-full h-full">
            {/* Fundamental */}
            <rect x="50" y="20" width="8" height="60" fill="#3b82f6" />
            <text x="54" y="90" fontSize="8" textAnchor="middle" fill="#6b7280">f₀ ≈ {modulationFreqGHz.toFixed(1)} GHz</text>

            {/* Harmonics (schematic heights) */}
            {[2,3,4,5].map((h, i) => (
              <g key={h}>
                <rect x={50 + h * 60} y={20 + i * 10} width="6" height={60 - i * 10} fill="#60a5fa" />
                <text x={53 + h * 60} y="90" fontSize="8" textAnchor="middle" fill="#6b7280">{h}f₀</text>
              </g>
            ))}

            <line x1="20" y1="80" x2="380" y2="80" stroke="#6b7280" strokeWidth="1" />
            <text x="200" y="98" fontSize="10" textAnchor="middle" fill="#6b7280">Frequency (relative)</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
