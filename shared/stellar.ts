import type { HRCategoryLiteral } from "@shared/physics";

export type Vec3 = [number, number, number];

export interface LocalRestStar {
  // Identities
  id: string; // stable id: e.g., "HIP:<num>" | "GaiaDR3:<id>" | fallback row hash
  hip?: number;
  gaia?: string;

  // Observables / provenance
  ra_deg: number;
  dec_deg: number;
  plx_mas: number;
  pmra_masyr?: number;
  pmdec_masyr?: number;
  rv_kms?: number;
  epoch_mjd?: number;
  source?: string;

  // Physical
  hr: HRCategoryLiteral;
  absMag?: number;
  feh?: number;

  // Derived / frame dependent
  pos_m: Vec3; // heliocentric XYZ (ICRS basis) at requested epoch, meters
  vel_kms: Vec3; // 3D space velocity in km/s, in LSR frame (U,V,W)

  // Uncertainties (optional, pass-through)
  err?: {
    plx_mas?: number;
    pmra_masyr?: number;
    pmdec_masyr?: number;
    rv_kms?: number;
  };
}

export interface LocalRestSnapshotMeta {
  epochMs: number;
  radiusPc: number;
  bounds_m: { min: Vec3; max: Vec3 };
  density_per_pc3: number;
  velocityAvg_kms: Vec3;
  velocityDisp_kms: Vec3;
  total: number;
  solarPeculiar_kms: Vec3;
  oort?: { A: number; B: number };
  source: string;
}

export interface LocalRestSnapshot {
  stars: LocalRestStar[];
  meta: LocalRestSnapshotMeta;
  page: number;
  perPage: number;
}

export interface LocalRestQuery {
  epoch?: string;
  radius_pc?: number;
  category?: HRCategoryLiteral;
  page?: number;
  per_page?: number;
  with_oort?: boolean;
}
