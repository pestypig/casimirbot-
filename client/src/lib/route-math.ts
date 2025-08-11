// client/src/lib/route-math.ts
import { Body, RoutePlan, HelixPerf } from "./galaxy-schema";

const PC_TO_LY = 3.26156;

export function lookup(map: Body[], id: string) { 
  const b = map.find(x => x.id === id); 
  if (!b) throw new Error("id not found: " + id); 
  return b; 
}

export function segmentMetrics(a: Body, b: Body, perf: HelixPerf) {
  const dx = b.x_pc - a.x_pc, dy = b.y_pc - a.y_pc;
  const d_pc = Math.hypot(dx, dy);
  const d_ly = d_pc * PC_TO_LY;

  const v = perf.vEffLyPerHour(perf.mode, perf.duty); // use current mode/duty
  const hours = v > 0 ? d_ly / v : Infinity;

  const E_MWh = isFinite(perf.energyPerLyMWh) ? perf.energyPerLyMWh * d_ly : Infinity;
  const E_J = isFinite(E_MWh) ? E_MWh * 3.6e9 : Infinity;
  const cycles = perf.energyPerCycleJ ? (isFinite(E_J) ? E_J / perf.energyPerCycleJ : Infinity) : undefined;

  return { d_pc, d_ly, hours, E_MWh, cycles };
}

export function routeSummary(bodies: Body[], plan: RoutePlan, perf: HelixPerf) {
  const legs = [];
  let totals = { d_ly: 0, hours: 0, E_MWh: 0, cycles: 0 };
  
  for (let i = 0; i < plan.waypoints.length - 1; i++) {
    const A = lookup(bodies, plan.waypoints[i]);
    const B = lookup(bodies, plan.waypoints[i + 1]);
    const m = segmentMetrics(A, B, perf);
    legs.push({ from: A, to: B, ...m });
    totals.d_ly += m.d_ly;
    totals.hours += (isFinite(m.hours) ? m.hours : 0);
    totals.E_MWh += (isFinite(m.E_MWh) ? m.E_MWh : 0);
    totals.cycles += (m.cycles && isFinite(m.cycles) ? m.cycles : 0);
  }
  
  return { legs, totals };
}