// client/src/lib/galaxy-schema.ts
export type Body = {
  id: string;
  name: string;
  x_pc: number;   // parsecs in your 2-D plane
  y_pc: number;
  kind?: "snr" | "ob-assoc" | "star" | "nebula" | "station";
  notes?: string;
};

export type RoutePlan = {
  waypoints: string[];    // ids in order (e.g., ["SOL","ORI_OB1","VEL_OB2","SOL"])
};

export type HelixPerf = {
  mode: string; 
  powerMW: number; 
  duty: number; 
  gammaGeo: number; 
  qFactor: number;
  zeta: number; 
  tsRatio: number; 
  freqGHz?: number;
  energyPerLyMWh: number;         // from FuelGauge
  energyPerCycleJ?: number;       // from FuelGauge (P_avg / f)
  vEffLyPerHour: (mode:string, duty:number)=>number; // same func you use in FuelGauge
};