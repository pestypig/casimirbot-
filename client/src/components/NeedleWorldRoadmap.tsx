import React, { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import {
  PHASE_DEFS,
  markersForPhase,
  type PhaseId,
} from "@/data/needleWorldRoles";

// Use a bundled topojson asset so the map renders even if remote fetches are blocked.
const GEO_URL = new URL("../assets/world-countries.json", import.meta.url).href;

const PHASE_ORDER: PhaseId[] = ["P0", "P1", "P2", "P3", "P4"];
const PHASE_COLORS: Record<PhaseId, string> = {
  P0: "#38bdf8",
  P1: "#a855f7",
  P2: "#22c55e",
  P3: "#eab308",
  P4: "#f97316",
};

const PHASES = PHASE_ORDER.map((id) => {
  const def = PHASE_DEFS[id];
  return {
    id,
    label: `${id} (${def.startYear}-${def.endYear}y)`,
    color: PHASE_COLORS[id],
    ...def,
  };
});

const CAPABILITY_COLORS: { capability: string; color: string }[] = [
  { capability: "casimir_tile_fab", color: "#a855f7" },
  { capability: "rf_q_devices", color: "#06b6d4" },
  { capability: "metrology_foundry", color: "#38bdf8" },
  { capability: "rare_earths", color: "#d946ef" },
  { capability: "materials_recycling", color: "#10b981" },
  { capability: "tungsten", color: "#f97316" },
  { capability: "space_launch", color: "#f97316" },
  { capability: "orbital_ops", color: "#fb923c" },
  { capability: "cryoplant", color: "#22c55e" },
  { capability: "power_grid", color: "#eab308" },
  { capability: "hvdc", color: "#facc15" },
  { capability: "test_range", color: "#ec4899" },
  { capability: "observatory", color: "#3b82f6" },
  { capability: "hpc", color: "#0ea5e9" },
  { capability: "gr_theory", color: "#22d3ee" },
  { capability: "open_source_dev", color: "#38bdf8" },
  { capability: "sensor_network", color: "#14b8a6" },
  { capability: "education", color: "#8b5cf6" },
  { capability: "ethics_governance", color: "#94a3b8" },
  { capability: "citizen_science", color: "#f472b6" },
];

function capabilityColor(capabilities: string[]): string {
  const found = CAPABILITY_COLORS.find((c) =>
    capabilities.includes(c.capability),
  );
  return found ? found.color : "#f97316";
}

function weightToRadius(weight: number) {
  // Scale relative weights (support ~0.12, major ~0.35, lead ~0.6) into a readable radius.
  const clamped = Math.max(0, Math.min(weight, 0.6));
  const minR = 6; // support ~small
  const maxR = 20; // lead ~large
  const span = maxR - minR;
  return minR + (clamped / 0.6) * span;
}

export function NeedleWorldRoadmap() {
  // Slider is 0..50 years; we snap to the phase that ends after this year.
  const [year, setYear] = useState(0);

  const activePhase = useMemo(() => {
    const byEnd = [...PHASES].sort((a, b) => a.endYear - b.endYear);
    return (
      byEnd.find((p) => year >= p.startYear && year < p.endYear) ??
      byEnd[byEnd.length - 1]
    );
  }, [year]);

  const markers = useMemo(
    () => markersForPhase(activePhase.id),
    [activePhase.id],
  );

  const [selectedIso2, setSelectedIso2] = useState<string | null>(null);
  const selected =
    markers.find((m) => m.iso2 === selectedIso2) ?? markers[0];

  return (
    <div className="flex h-full flex-col bg-[#050915] text-slate-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">
              Needle Hull Global Roadmap
            </div>
            <div className="text-[12px] text-slate-300/80">
              World map of partner sites, roles, and relative effort weights
              over a 50-year needle-hull program (assuming the physics holds
              up).
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200">
            Phase:{" "}
            <span
              className="font-semibold"
              style={{ color: activePhase.color }}
            >
              {activePhase.label}
            </span>
            <span className="ml-2 text-slate-400">
              (t = {year.toFixed(1)} years)
            </span>
          </div>
        </div>

        {/* Timeline slider */}
        <div className="mt-3 flex items-center gap-2">
          <span className="w-10 text-[11px] text-slate-400">0y</span>
          <input
            type="range"
            min={0}
            max={50}
            step={0.5}
            value={year}
            className="flex-1 accent-emerald-400"
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <span className="w-10 text-right text-[11px] text-slate-400">
            50y
          </span>
        </div>

        {/* Phase chips */}
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          {PHASES.map((phase) => {
            const active = phase.id === activePhase.id;
            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => setYear((phase.startYear + phase.endYear) / 2)}
                className={`rounded-full border px-2 py-[2px] ${
                  active
                    ? "border-white/80 bg-white/10 text-white"
                    : "border-white/20 bg-white/5 text-slate-300 hover:border-white/50"
                }`}
              >
                <span
                  className="mr-1 inline-block h-[6px] w-[6px] rounded-full"
                  style={{ backgroundColor: phase.color }}
                />
                {phase.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Body: map + side panel */}
      <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* Map */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#020617]">
          <div className="border-b border-white/10 px-4 py-2 text-[12px] text-slate-300/80">
            Projection map - bubble partners
          </div>
          <div className="h-[320px] w-full sm:h-full">
            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 165 }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: "#0b1223",
                          stroke: "#1f2937",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: "#0d152a",
                          stroke: "#334155",
                          strokeWidth: 0.7,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#0d152a",
                          stroke: "#334155",
                          strokeWidth: 0.7,
                          outline: "none",
                        },
                      }}
                    />
                  ))
                }
              </Geographies>

              {markers.map((p) => {
                const baseColor = capabilityColor(p.capabilities);
                const isSelected = p.iso2 === selected?.iso2;
                const radius = weightToRadius(p.costWeight);

                return (
                  <Marker
                    key={p.iso2}
                    coordinates={[p.lon, p.lat]}
                    onClick={() => setSelectedIso2(p.iso2)}
                    style={{
                      default: { cursor: "pointer" },
                      hover: { cursor: "pointer" },
                      pressed: { cursor: "pointer" },
                    }}
                  >
                    <circle
                      r={radius}
                      fill={baseColor}
                      stroke={isSelected ? "#e5e7eb" : "#020617"}
                      strokeWidth={isSelected ? 2 : 1}
                      fillOpacity={0.85}
                    />
                    {/* Phase ring */}
                    <circle
                      r={radius + 2.5}
                      fill="none"
                      stroke={activePhase.color}
                      strokeWidth={1.3}
                      strokeOpacity={0.9}
                    />
                    {/* Tiny vertical offset label */}
                    <text
                      textAnchor="middle"
                      y={radius + 10}
                      style={{
                        fontFamily: "system-ui, sans-serif",
                        fontSize: 8,
                        fill: "#e5e7eb",
                        pointerEvents: "none",
                      }}
                    >
                      {p.name}
                    </text>
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>
        </div>

        {/* Side panel with summary */}
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#020617]">
          <div className="border-b border-white/10 px-4 py-2">
            <div className="text-xs font-semibold text-white">
              Active partners @ t = {year.toFixed(1)} years
            </div>
            <div className="mt-1 text-[11px] text-slate-300/80">
              {activePhase.summary}
            </div>
          </div>

          <div className="max-h-[260px] divide-y divide-white/5 overflow-y-auto text-[12px]">
            {markers.map((p) => {
              const baseColor = capabilityColor(p.capabilities);
              const isSelected = p.iso2 === selected?.iso2;
              return (
                <button
                  key={p.iso2}
                  type="button"
                  onClick={() => setSelectedIso2(p.iso2)}
                  className={`flex w-full items-start gap-3 px-3 py-2 text-left transition ${
                    isSelected
                      ? "bg-white/10"
                      : "hover:bg-white/5 focus-visible:bg-white/10"
                  }`}
                >
                  <div className="mt-[4px] flex h-6 w-6 items-center justify-center rounded-full bg-black/60">
                    <span
                      className="inline-block h-[10px] w-[10px] rounded-full"
                      style={{ backgroundColor: baseColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Capabilities: {p.capabilities.slice(0, 3).join(", ")}
                          {p.capabilities.length > 3 ? "..." : ""}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-300">
                        <div className="font-mono">
                          wt: {p.costWeight.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-200">
                      {p.roleSummary}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                      <span
                        className="rounded-full px-1.5 py-[1px] text-[10px]"
                        style={{
                          backgroundColor: `${activePhase.color}22`,
                          color: activePhase.color,
                          border: `1px solid ${activePhase.color}55`,
                        }}
                      >
                        {activePhase.id}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-[1px] text-[10px] text-slate-300">
                        {p.capabilities[0]?.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {!markers.length && (
              <div className="px-3 py-4 text-[12px] text-slate-400">
                No partners active yet at this year. Move the slider forward to
                see when the first sites spin up.
              </div>
            )}
          </div>

          {selected && (
            <div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-200">
              <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                Focus site
              </div>
              <div className="text-sm font-semibold text-white">
                {selected.name}
              </div>
              <div className="mt-1 text-[11px] text-slate-300">
                {selected.roleSummary}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Assumes Casimir, Phoenix, and warp pipeline physics validated
                (Ford-Roman duty, TS_ratio, gamma_geo, gamma_VdB) and focuses on
                engineering and capacity, not basic feasibility.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NeedleWorldRoadmap;


