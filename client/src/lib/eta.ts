// lib/eta.ts
export const LY_PER_PC = 3.26156;
export const HOURS_PER_YEAR = 365.25 * 24;

export function formatETA(hours: number) {
  if (!isFinite(hours) || hours <= 0) return "—";
  if (hours >= HOURS_PER_YEAR) return `${(hours / HOURS_PER_YEAR).toFixed(1)} yr`;
  if (hours >= 24)              return `${(hours / 24).toFixed(1)} d`;
  return `${hours.toFixed(1)} h`;
}

// constant-speed baseline (High Noon @ 0.01 c)
export function hoursAtHighNoon(distanceLy: number, speedC = 0.01) {
  // c = 1 ly/yr → 0.01c = 0.01 ly/yr
  const years = distanceLy / speedC;
  return years * HOURS_PER_YEAR;
}