import React from "react";
import { Geographies, Geography, Marker } from "react-simple-maps";
import {
  CIVILIZATION_NATION_PARAMETER_SCOPES,
  CIVILIZATION_NATION_STATE_VECTORS,
  type CivilizationNationParameterScope,
  type CivilizationNationStateVector,
} from "@/data/civilizationNationStateVectors";
import { CIVILIZATION_MAP_PALETTE } from "./civilizationMapPalette";

const SCOPE_RISK_ORIENTED = new Set<CivilizationNationParameterScope>([
  "security_exposure",
  "social_cohesion_pressure",
  "information_legitimacy_pressure",
  "environmental_pressure",
]);

export function civilizationBalanceScore(vector: CivilizationNationStateVector): number {
  const scores = CIVILIZATION_NATION_PARAMETER_SCOPES.map((scope) => {
    const value = vector.parameters[scope];
    if (value === null) return null;
    return SCOPE_RISK_ORIENTED.has(scope) ? 1 - value : value;
  }).filter((value): value is number => value !== null);

  if (scores.length === 0) return 0;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function parameterColor(scope: CivilizationNationParameterScope, value: number | null): string {
  if (value === null) return "#64748b";
  const riskOriented = SCOPE_RISK_ORIENTED.has(scope);
  if (riskOriented) {
    if (value >= 0.7) return "#ef4444";
    if (value >= 0.45) return "#f97316";
    if (value >= 0.25) return "#eab308";
    return "#22c55e";
  }
  if (value >= 0.7) return "#22c55e";
  if (value >= 0.45) return "#eab308";
  if (value >= 0.25) return "#f97316";
  return "#ef4444";
}

function balanceColor(score: number): string {
  if (score >= 0.68) return "#22c55e";
  if (score >= 0.52) return "#eab308";
  if (score >= 0.36) return "#f97316";
  return "#ef4444";
}

function eventPulseScore(vector: CivilizationNationStateVector): number {
  return Math.max(
    vector.eventPulse.politicalViolence30d,
    vector.eventPulse.demonstrations30d,
    vector.eventPulse.strategicDevelopments30d,
    vector.eventPulse.activeConflict ? 0.8 : 0,
  );
}

function markerRadius(vector: CivilizationNationStateVector): number {
  return 6 + Math.max(vector.confidence, eventPulseScore(vector) * 0.75) * 8;
}

export function CivilizationCountryLayer({
  geographyUrl,
  selectedIso3s,
  onToggleCountry,
}: {
  geographyUrl: string;
  selectedIso3s: string[];
  onToggleCountry: (iso3: string) => void;
}) {
  return (
    <>
      <Geographies geography={geographyUrl}>
        {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              style={{
                default: {
                  fill: CIVILIZATION_MAP_PALETTE.country.fill,
                  stroke: CIVILIZATION_MAP_PALETTE.country.stroke,
                  strokeWidth: 0.35,
                  outline: "none",
                  transition: "fill 140ms ease, stroke 140ms ease, filter 140ms ease",
                },
                hover: {
                  fill: CIVILIZATION_MAP_PALETTE.country.hoverFill,
                  stroke: CIVILIZATION_MAP_PALETTE.country.hoverStroke,
                  strokeWidth: 1.05,
                  outline: "none",
                  filter: CIVILIZATION_MAP_PALETTE.country.hoverGlow,
                  cursor: "pointer",
                },
                pressed: {
                  fill: "#10231e",
                  stroke: CIVILIZATION_MAP_PALETTE.country.hoverStroke,
                  strokeWidth: 1.05,
                  outline: "none",
                  filter: CIVILIZATION_MAP_PALETTE.country.hoverGlow,
                },
              }}
            />
          ))
        }
      </Geographies>

      {CIVILIZATION_NATION_STATE_VECTORS.map((vector) => {
        const selected = selectedIso3s.includes(vector.countryIso3);
        const pulse = eventPulseScore(vector);
        const missing = vector.missingObservations.length > 0;
        const radius = markerRadius(vector);
        const score = civilizationBalanceScore(vector);
        const fill = balanceColor(score);
        return (
          <Marker
            key={vector.countryIso3}
            data-testid="civilization-bounds-badge"
            data-country-iso={vector.countryIso3}
            aria-label={`${vector.label} civilization vector`}
            coordinates={[vector.coordinates.lon, vector.coordinates.lat]}
            onClick={() => onToggleCountry(vector.countryIso3)}
            style={{
              default: { cursor: "pointer" },
              hover: { cursor: "pointer" },
              pressed: { cursor: "pointer" },
            }}
          >
            <circle
              r={radius + (selected ? 4 : 0)}
              fill="none"
              stroke={selected ? "#f8fafc" : fill}
              strokeWidth={selected ? 2.2 : 1.2}
              strokeDasharray={missing ? "3 2" : undefined}
              strokeOpacity={selected ? 0.95 : 0.62}
            />
            {pulse > 0.55 && (
              <circle
                r={radius + 7}
                fill="none"
                stroke={CIVILIZATION_MAP_PALETTE.civilization.security}
                strokeWidth={1.2}
                strokeOpacity={0.5}
              />
            )}
            <circle
              r={radius}
              fill={fill}
              fillOpacity={selected ? 0.96 : 0.78}
              stroke="#03120f"
              strokeWidth={1}
            />
            {selected && (
              <g transform={`translate(${radius - 1}, ${-radius - 1})`}>
                <circle r={5} fill="#f8fafc" stroke="#06110f" strokeWidth={1} />
                <text
                  y={0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 7,
                    fontWeight: 800,
                    fill: "#06110f",
                    pointerEvents: "none",
                  }}
                >
                  i
                </text>
              </g>
            )}
            <text
              y={1}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 7,
                fontWeight: 700,
                fill: "#06110f",
                pointerEvents: "none",
              }}
            >
              {vector.countryIso3}
            </text>
          </Marker>
        );
      })}
    </>
  );
}
