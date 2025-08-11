// client/src/lib/solar-adapter.ts
import * as Astronomy from "astronomy-engine";
import { Body } from "./galaxy-schema";

export type SolarBody = "Sun" | "Mercury" | "Venus" | "Earth" | "Mars" | "Jupiter" | "Saturn" | "Uranus" | "Neptune";
const NAMES: SolarBody[] = ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];

export type SolarPoint = { 
  id: string; 
  name: string; 
  x_au: number; 
  y_au: number; 
  kind: "star" | "planet" | "station" 
};

export function computeSolarXY(date = new Date()): SolarPoint[] {
  // heliocentric ecliptic XY (AU), flattened to 2D for the map
  return NAMES.map(name => {
    if (name === "Sun") {
      return { 
        id: "SUN", 
        name: "Sun", 
        x_au: 0, 
        y_au: 0, 
        kind: "star" as const 
      };
    }
    
    try {
      const vec = Astronomy.HelioVector(name as any, date); // x,y,z in AU
      return { 
        id: name.toUpperCase(), 
        name, 
        x_au: vec.x, 
        y_au: vec.y, 
        kind: "planet" as const 
      };
    } catch (error) {
      console.warn(`Failed to compute position for ${name}:`, error);
      return { 
        id: name.toUpperCase(), 
        name, 
        x_au: 0, 
        y_au: 0, 
        kind: "planet" as const 
      };
    }
  });
}

// Convert solar points to the unified Body schema for route calculations
export function solarToBodies(solarPoints: SolarPoint[]): Body[] {
  const AU_TO_PC = 1 / 206265; // 1 pc ≈ 206,265 AU
  
  return solarPoints.map(point => ({
    id: point.id,
    name: point.name,
    x_pc: point.x_au * AU_TO_PC,
    y_pc: point.y_au * AU_TO_PC,
    kind: point.kind === "star" ? "station" : point.kind,
    notes: `${point.x_au.toFixed(2)} AU, ${point.y_au.toFixed(2)} AU`
  }));
}

export function auToLightMinutes(au: number): number {
  return au * 8.317; // 1 AU ≈ 8.317 light-minutes
}

// Helper to get live solar system positions as unified Body objects for route planning
export function getSolarBodiesAsPc(): Body[] {
  const AU_PER_PC = 206265;
  const pts = computeSolarXY(new Date());
  
  return pts.map(p => ({
    id: p.id,                // "EARTH", "SATURN", "SUN", ...
    name: p.name,
    x_pc: p.x_au / AU_PER_PC,
    y_pc: p.y_au / AU_PER_PC,
    kind: p.kind,
    notes: `${p.x_au.toFixed(2)} AU, ${p.y_au.toFixed(2)} AU`
  }));
}