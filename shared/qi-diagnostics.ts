export type TileDatum = {
  pos: [number, number, number];
  t00: number;
  phase01?: number;
  pumpPhase_deg?: number;
};

export interface QiDiagnosticsGrid {
  nx: number;
  ny: number;
  nz: number;
  spacing: [number, number, number];
  origin?: [number, number, number];
}

export interface QiDiagnosticsMeta {
  ts: number;
  tau_ms?: number | null;
  fr_bound?: number | null;
  zeta?: number | null;
  weights: [number, number, number];
  radius_m: number;
  dutyEffectiveFR?: number | null;
  tileCount: number;
  meanT00?: number | null;
}

export interface QiDiagnosticsPayload {
  grid: QiDiagnosticsGrid;
  tiles: TileDatum[];
  tphi: number[];
  var_rho: number[];
  pi_fr: number[];
  csi: number[];
  meta: QiDiagnosticsMeta;
}

export interface QiDiagnosticsRequest {
  radius_m?: number;
  weights?: [number, number, number];
}
