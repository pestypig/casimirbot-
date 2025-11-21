import type { NavFrame, NavigationPose } from "./schema";

/**
 * Matches client HR category literal names without forcing a shared union.
 * The client can narrow this to its stricter HRCategory type.
 */
export type HRCategoryLiteral = string;

/** Common uncertainty container (1σ). */
export interface Uncertainty1D {
  value?: number | null;
  sigma?: number | null;
}

/** Vector uncertainty values. */
export interface Vec3Uncertainty {
  x?: number | null;
  y?: number | null;
  z?: number | null;
}

/**
 * Position/velocity frames we return.
 * - heliocentric: ICRS axes (J2000), meters for position; velocities in km/s when present
 * - galactic: right-handed (x->Galactic center, y->rotation, z->north Galactic pole), meters for position
 * - lsr: velocity relative to the Local Standard of Rest (km/s)
 */
export interface FrameVectors {
  heliocentric: { x: number; y: number; z: number; unit: "m" };
  galactic?: { x: number; y: number; z: number; unit: "m" };
  lsrVelocity: { vx: number; vy: number; vz: number; unit: "km/s" };
  helioVelocity?: { vx: number; vy: number; vz: number; unit: "km/s" };
  uncertainties?: {
    positionM?: Vec3Uncertainty;
    helioVelocityKmS?: Vec3Uncertainty;
    lsrVelocityKmS?: Vec3Uncertainty;
  };
}

/** Raw astrometry (catalog space). */
export interface Astrometry {
  raDeg: number; // ICRS right ascension [deg]
  decDeg: number; // ICRS declination [deg]
  parallaxMas: number; // parallax [mas]
  pmRaMasYr?: number | null; // proper motion in alpha* [mas/yr] (includes cos(delta))
  pmDecMasYr?: number | null; // proper motion in delta [mas/yr]
  radialVelocityKmS?: number | null; // line-of-sight velocity [km/s]
  refEpochJyr?: number | null; // reference epoch in Julian years (e.g., 2016.0 for Gaia DR3)
  errors?: {
    parallaxMas?: number | null;
    pmRaMasYr?: number | null;
    pmDecMasYr?: number | null;
    radialVelocityKmS?: number | null;
  };
}

export interface Photometry {
  absMag?: number | null; // absolute magnitude (band documented separately)
  band?: "G" | "V" | "Hp" | string;
  colorIndex?: number | null; // optional (B-V, BP-RP, etc.)
  temperatureK?: number | null;
  metallicityFeH?: number | null; // [Fe/H]
  errors?: {
    absMag?: number | null;
    temperatureK?: number | null;
    metallicityFeH?: number | null;
  };
}

export interface StarIds {
  hip?: number | null;
  gaiaDr?: string | null; // e.g., "Gaia DR3 1234567890123456789"
  name?: string | null; // common/proper name if available
}

/**
 * LocalRestStar:
 * - Heliocentric ICRS position (meters)
 * - Velocity relative to LSR (km/s)
 * - Full raw astrometry, photometry, and HR category for coloring
 * - Pose/frame info so the nav stack can transform it with NavigationPose/NavFrame
 */
export interface LocalRestStar {
  id: string; // stable key (e.g., Gaia or HIP string)
  ids: StarIds;
  hrCategory: HRCategoryLiteral; // must match client HRCategory literal names
  astrometry: Astrometry;
  photometry: Photometry;

  /** 3D vectors (meters for position, km/s for velocity) in multiple frames. */
  vectors: FrameVectors;

  /** Epoch for which vectors are valid (ms since Unix epoch). */
  epochMs: number;

  /** Distance from Sun [pc] for convenience. */
  distancePc: number;

  /** Optional navigation frame hinting (for in-scene transforms and craft-relative overlays). */
  nav?: {
    frame: NavFrame;
    poseHint?: Partial<NavigationPose>;
  };

  /** Render metadata (client packs this to GPU buffers). */
  render?: {
    rgb?: [number, number, number]; // 0..1 range
    symbol?: "dot" | "circle" | "diamond" | "star" | "custom";
    sizePx?: number; // UI scale hint
    tooltip?: string; // pre-baked or client builds it
  };
}

/** REST page wrapper plus density/bounds metadata. */
export interface LocalRestPage {
  stars: LocalRestStar[];
  page: number;
  pageSize: number;
  total: number;
  radiusPc: number;
  epochMs: number;
  /** Axis-aligned bounds in AU in heliocentric frame (for quick camera fits). */
  boundsAu: { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
  /** Aggregate stats. */
  agg: {
    meanLsrVelocityKmS: { vx: number; vy: number; vz: number };
    numberDensityPerCubicPc: number;
  };
}
