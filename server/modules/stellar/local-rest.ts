import fs from "node:fs/promises";
import path from "node:path";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { parse } from "csv-parse";
import crypto from "node:crypto";
import type { HRCategoryLiteral } from "@shared/physics";
import type {
  LocalRestStar,
  LocalRestSnapshot,
  LocalRestSnapshotMeta,
  LocalRestQuery,
  Vec3,
} from "@shared/stellar";
import { resolveStellarRestorationProvenance, type StellarRestorationProvenance } from "./evolution";



export type LocalRestSnapshotWithProvenance = LocalRestSnapshot & StellarRestorationProvenance & {
  gate?: {
    status: "pass" | "fail";
    fail_reason?: string;
  };
};
// ---------- constants & utilities ----------
const DEG = Math.PI / 180;
const KM_S_TO_M_S = 1000;
const PC_M = 3.085677581e16; // meters in 1 parsec
const KAPPA = 4.74047; // km/s = KAPPA * (mas/yr) * distance_pc

const DEFAULT_CATALOG = path.resolve(process.cwd(), "server/data/nearby-stars.csv");
const OUT_DIR = path.resolve(process.cwd(), "server/_generated/lsr");

type RawRow = {
  id?: string;
  HIP?: string;
  hip?: string;
  GaiaDR3?: string;
  gaia?: string;
  ra_deg: string;
  dec_deg: string;
  plx_mas?: string;
  parallax_mas?: string;
  pmra_masyr?: string;
  pmdec_masyr?: string;
  rv_kms?: string;
  absMag?: string;
  abs_mag?: string;
  hr?: string;
  hr_category?: string;
  feh?: string;
  epoch_mjd?: string;
  epoch_jyr?: string;
  source?: string;
};

// ICRS -> Galactic rotation matrix (J2000) (rows = ĝx, ĝy, ĝz in ICRS basis)
const R_EQ_TO_GAL: number[][] = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.4448296300, 0.7469822445],
  [-0.8676661490, -0.1980763734, 0.4559837762],
];

// Choose Sun’s peculiar motion (U⊙ toward GC, V⊙ direction of rotation, W⊙ toward NGP)
const SOLAR_PECULIAR_SETS: Record<string, Vec3> = {
  // Schönrich, Binney & Dehnen (2010)
  schonrich2010: [11.1, 12.24, 7.25],
  // Huang et al. (2015)
  huang2015: [7.01, 10.13, 4.95],
};

function solarPeculiar(): Vec3 {
  const key = (process.env.LSR_SOLAR_PECULIAR || "schonrich2010").toLowerCase();
  return SOLAR_PECULIAR_SETS[key] ?? SOLAR_PECULIAR_SETS.schonrich2010;
}

// Optional Oort constants A, B (km s^-1 kpc^-1)
const OORT_A = Number(process.env.LSR_OORT_A ?? 15.3);
const OORT_B = Number(process.env.LSR_OORT_B ?? -11.9);

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function matMulVec(M: number[][], v: Vec3): Vec3 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

function hashKey(s: string): string {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
}

// ---------- CSV loading ----------
function normalizeRow(rec: any): RawRow {
  const row: RawRow = { ...rec };
  if (!row.plx_mas && (rec as any).parallax_mas) row.plx_mas = String((rec as any).parallax_mas);
  if (!row.pmra_masyr && (rec as any).pmra) row.pmra_masyr = String((rec as any).pmra);
  if (!row.pmdec_masyr && (rec as any).pmdec) row.pmdec_masyr = String((rec as any).pmdec);
  if (!row.hr && (rec as any).hr_category) row.hr = String((rec as any).hr_category);
  if (!row.absMag && (rec as any).abs_mag) row.absMag = String((rec as any).abs_mag);
  if (!row.HIP && (rec as any).hip) row.HIP = String((rec as any).hip);
  if (!row.GaiaDR3 && (rec as any).gaia) row.GaiaDR3 = String((rec as any).gaia);
  if (!row.epoch_mjd && row.epoch_jyr) {
    const jyr = Number(row.epoch_jyr);
    if (Number.isFinite(jyr)) {
      row.epoch_mjd = String(51544 + (jyr - 2000) * 365.25); // rough Jyr -> MJD conversion
    }
  }
  return row;
}

async function loadCatalog(file = process.env.LSR_CATALOG_PATH || DEFAULT_CATALOG): Promise<RawRow[]> {
  const resolved = path.resolve(file);
  const rows: RawRow[] = [];

  // Simple JSON support for alternate catalogs
  if (resolved.endsWith(".json")) {
    const txt = await fs.readFile(resolved, "utf8");
    const data = JSON.parse(txt);
    if (Array.isArray(data)) return data.map((r) => normalizeRow(r));
    throw new Error("Invalid JSON catalog: expected array");
  }

  await pipeline(
    createReadStream(resolved),
    parse({ columns: true, relax_column_count: true, skip_empty_lines: true }),
    async function* (src) {
      for await (const rec of src) {
        rows.push(normalizeRow(rec));
      }
      yield;
    },
  );
  return rows;
}

// ---------- astro helpers ----------

// RA/Dec -> ICRS unit vector
function icrsUnit(raDeg: number, decDeg: number): Vec3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const c = Math.cos(dec);
  return [Math.cos(ra) * c, Math.sin(ra) * c, Math.sin(dec)];
}

// Proper motion + RV -> velocity vector in ICRS (km/s)
function velocityICRS(
  ra_deg: number,
  dec_deg: number,
  dist_pc: number,
  pmra_masyr?: number,
  pmdec_masyr?: number,
  rv_kms?: number,
): Vec3 {
  const u = icrsUnit(ra_deg, dec_deg);
  const ra = ra_deg * DEG;
  const dec = dec_deg * DEG;
  const e_ra: Vec3 = [-Math.sin(ra), Math.cos(ra), 0];
  const e_dec: Vec3 = [-Math.cos(ra) * Math.sin(dec), -Math.sin(ra) * Math.sin(dec), Math.cos(dec)];

  const pmra = pmra_masyr ?? 0;
  const pmdec = pmdec_masyr ?? 0;
  const vt_ra = KAPPA * pmra * dist_pc;
  const vt_dec = KAPPA * pmdec * dist_pc;
  const vr = rv_kms ?? 0;

  return [
    vt_ra * e_ra[0] + vt_dec * e_dec[0] + vr * u[0],
    vt_ra * e_ra[1] + vt_dec * e_dec[1] + vr * u[1],
    vt_ra * e_ra[2] + vt_dec * e_dec[2] + vr * u[2],
  ];
}

// ICRS -> Galactic velocity (km/s); Galactic U positive toward Galactic center, V toward rotation (l=90°), W toward NGP.
function velocityGalacticFromICRS(v_icrs: Vec3): Vec3 {
  return matMulVec(R_EQ_TO_GAL as number[][], v_icrs);
}

// Apply Sun’s peculiar motion: LSR velocity = v_gal - v_sun
function toLSR(v_gal: Vec3, sun: Vec3): Vec3 {
  return [v_gal[0] - sun[0], v_gal[1] - sun[1], v_gal[2] - sun[2]];
}

// Optional mean streaming correction via Oort A, B for nearby stars (first-order, small distances)
// v_stream ≈ [ -A d sin(2l) cos(b), d (A cos(2l) + B) cos(b), 0 ] with d in kpc
function applyOortShear(l_deg: number, b_deg: number, dist_pc: number, v_lsr: Vec3): Vec3 {
  const l = l_deg * DEG;
  const b = b_deg * DEG;
  const d_kpc = dist_pc / 1000;
  const cosb = Math.cos(b);
  const vU = -OORT_A * d_kpc * Math.sin(2 * l) * cosb;
  const vV = (OORT_A * Math.cos(2 * l) + OORT_B) * d_kpc * cosb;
  return [v_lsr[0] - vU, v_lsr[1] - vV, v_lsr[2]];
}

// Convert ICRS unit vector to Galactic coordinates (l,b) in degrees using same rotation
function galacticLonLatFromICRSUnit(u_icrs: Vec3): { l_deg: number; b_deg: number } {
  const g = matMulVec(R_EQ_TO_GAL, u_icrs);
  const b = Math.asin(g[2]);
  const l = Math.atan2(g[1], g[0]);
  let l_deg = l / DEG;
  if (l_deg < 0) l_deg += 360;
  return { l_deg, b_deg: b / DEG };
}

// Propagate a star position in ICRS (meters) assuming constant velocity over Δt
function propagateICRSPos(pos0_m_icrs: Vec3, v_icrs_kms: Vec3, delta_sec: number): Vec3 {
  const vx = v_icrs_kms[0] * KM_S_TO_M_S;
  const vy = v_icrs_kms[1] * KM_S_TO_M_S;
  const vz = v_icrs_kms[2] * KM_S_TO_M_S;
  return [pos0_m_icrs[0] + vx * delta_sec, pos0_m_icrs[1] + vy * delta_sec, pos0_m_icrs[2] + vz * delta_sec];
}

// ---------- HR category helper ----------
export function resolveCategory(input?: string): HRCategoryLiteral {
  const s = (input || "").toUpperCase();
  if (s.startsWith("O")) return "O";
  if (s.startsWith("B")) return "B";
  if (s.startsWith("A")) return "A";
  if (s.startsWith("F")) return "F";
  if (s.startsWith("G")) return "G";
  if (s.startsWith("K")) return "K";
  if (s.startsWith("M")) return "M";
  return "M"; // default to M if unknown (most local stars)
}

// ---------- public API ----------

export async function buildLocalRestSnapshot(
  q: LocalRestQuery,
  options?: {
    strictProvenance?: boolean;
    provenance?: Partial<StellarRestorationProvenance> | null;
    hasExplicitProvenance?: boolean;
    failReason?: string;
  },
): Promise<LocalRestSnapshotWithProvenance> {
  const epochMs = q.epoch ? new Date(q.epoch).getTime() : Date.now();
  const radiusPc = Math.max(0.1, q.radius_pc ?? 50);
  const withOort = !!q.with_oort;
  const page = Math.max(1, q.page ?? 1);
  const perPage = Math.min(5000, Math.max(100, q.per_page ?? 5000));
  const strictProvenance = options?.strictProvenance === true;
  const provenance = resolveStellarRestorationProvenance(options?.provenance);
  const provenanceMissing = options?.hasExplicitProvenance === false;
  const gate = strictProvenance && provenanceMissing
    ? { status: "fail" as const, fail_reason: options?.failReason }
    : { status: "pass" as const };

  const catalogPath = process.env.LSR_CATALOG_PATH || DEFAULT_CATALOG;
  const cacheKey = hashKey(
    JSON.stringify({ epochMs, radiusPc, cat: q.category || "ALL", withOort, src: path.basename(catalogPath) }),
  );
  const cacheFile = path.join(OUT_DIR, `snapshot-${cacheKey}.json`);

  await fs.mkdir(OUT_DIR, { recursive: true });

  try {
    const stat = await fs.stat(cacheFile);
    const fresh = Date.now() - stat.mtimeMs < Number(process.env.LSR_CACHE_TTL_MS ?? 6 * 3600 * 1000);
    if (fresh) {
      const txt = await fs.readFile(cacheFile, "utf8");
      const snap = JSON.parse(txt) as LocalRestSnapshot;
      const start = (page - 1) * perPage;
      return { ...snap, stars: snap.stars.slice(start, start + perPage), page, perPage, ...provenance, gate };
    }
  } catch {
    /* cache miss */
  }

  const rows = await loadCatalog(catalogPath);
  const sunUVW = solarPeculiar();

  const stars: LocalRestStar[] = [];
  let min: Vec3 = [Infinity, Infinity, Infinity];
  let max: Vec3 = [-Infinity, -Infinity, -Infinity];
  let vAcc: Vec3 = [0, 0, 0];
  let count = 0;
  const epochSecTarget = epochMs / 1000;

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const ra = Number(r.ra_deg);
    const dec = Number(r.dec_deg);
    const plx = Number(r.plx_mas ?? r.parallax_mas);
    if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Number.isFinite(plx) || plx <= 0) continue;
    const d_pc = 1000 / plx;
    const pmra = r.pmra_masyr ? Number(r.pmra_masyr) : undefined;
    const pmdec = r.pmdec_masyr ? Number(r.pmdec_masyr) : undefined;
    const rv = r.rv_kms ? Number(r.rv_kms) : undefined;

    const u = icrsUnit(ra, dec);
    const pos0_m: Vec3 = [u[0] * d_pc * PC_M, u[1] * d_pc * PC_M, u[2] * d_pc * PC_M];

    const v_icrs = velocityICRS(ra, dec, d_pc, pmra, pmdec, rv);

    const epoch_mjd_raw = r.epoch_mjd ? Number(r.epoch_mjd) : undefined;
    const epoch_mjd = Number.isFinite(epoch_mjd_raw) ? (epoch_mjd_raw as number) : 57388; // Gaia DR2/EDR3 ~2016.0 default
    const t0_sec = (epoch_mjd - 40587) * 86400; // MJD->Unix seconds
    const dt_sec = epochSecTarget - t0_sec;

    const pos_m = propagateICRSPos(pos0_m, v_icrs, dt_sec);

    const r_m = Math.hypot(pos_m[0], pos_m[1], pos_m[2]);
    const r_pc = r_m / PC_M;
    if (r_pc > radiusPc) continue;

    const v_gal = velocityGalacticFromICRS(v_icrs);
    let v_lsr = toLSR(v_gal, sunUVW);

    if (withOort) {
      const { l_deg, b_deg } = galacticLonLatFromICRSUnit(u);
      v_lsr = applyOortShear(l_deg, b_deg, d_pc, v_lsr);
    }

    const hr = resolveCategory(r.hr);
    if (q.category && hr !== q.category) continue;

    const id =
      r.id ??
      (r.HIP ? `HIP:${r.HIP}` : r.hip ? `HIP:${r.hip}` : r.GaiaDR3 ? `GaiaDR3:${r.GaiaDR3}` : `row:${idx}`);

    const star: LocalRestStar = {
      id,
      hip: r.HIP ? Number(r.HIP) : r.hip ? Number(r.hip) : undefined,
      gaia: r.GaiaDR3 ?? r.gaia,
      ra_deg: ra,
      dec_deg: dec,
      plx_mas: plx,
      pmra_masyr: pmra,
      pmdec_masyr: pmdec,
      rv_kms: rv,
      epoch_mjd,
      source: path.basename(catalogPath),
      hr,
      absMag: r.absMag ? Number(r.absMag) : r.abs_mag ? Number(r.abs_mag) : undefined,
      feh: r.feh ? Number(r.feh) : undefined,
      pos_m,
      vel_kms: v_lsr,
    };

    stars.push(star);

    min = [Math.min(min[0], pos_m[0]), Math.min(min[1], pos_m[1]), Math.min(min[2], pos_m[2])];
    max = [Math.max(max[0], pos_m[0]), Math.max(max[1], pos_m[1]), Math.max(max[2], pos_m[2])];
    vAcc = [vAcc[0] + v_lsr[0], vAcc[1] + v_lsr[1], vAcc[2] + v_lsr[2]];
    count++;
  }

  const bounds_m = { min, max };
  const volume_pc3 = (4 / 3) * Math.PI * Math.pow(radiusPc, 3);
  const velocityAvg_kms: Vec3 = count ? [vAcc[0] / count, vAcc[1] / count, vAcc[2] / count] : [0, 0, 0];

  let varU = 0;
  let varV = 0;
  let varW = 0;
  for (const s of stars) {
    varU += Math.pow(s.vel_kms[0] - velocityAvg_kms[0], 2);
    varV += Math.pow(s.vel_kms[1] - velocityAvg_kms[1], 2);
    varW += Math.pow(s.vel_kms[2] - velocityAvg_kms[2], 2);
  }
  const velocityDisp_kms: Vec3 = count ? [Math.sqrt(varU / count), Math.sqrt(varV / count), Math.sqrt(varW / count)] : [0, 0, 0];

  const meta: LocalRestSnapshotMeta = {
    epochMs,
    radiusPc,
    bounds_m,
    density_per_pc3: count ? count / volume_pc3 : 0,
    velocityAvg_kms,
    velocityDisp_kms,
    total: count,
    solarPeculiar_kms: solarPeculiar(),
    oort: withOort ? { A: OORT_A, B: OORT_B } : undefined,
    source: path.basename(catalogPath),
  };

  const snap: LocalRestSnapshot = { stars, meta, page: 1, perPage: stars.length };

  await fs.writeFile(cacheFile, JSON.stringify(snap), "utf8");

  const start = (page - 1) * perPage;
  return { ...snap, stars: stars.slice(start, start + perPage), page, perPage, ...provenance, gate };
}

export function propagateStarPosition(star: LocalRestStar, epochMs: number): LocalRestStar {
  const d_pc = 1000 / star.plx_mas;
  const v_icrs = velocityICRS(star.ra_deg, star.dec_deg, d_pc, star.pmra_masyr, star.pmdec_masyr, star.rv_kms);
  const u = icrsUnit(star.ra_deg, star.dec_deg);
  const pos0_m: Vec3 = [u[0] * d_pc * PC_M, u[1] * d_pc * PC_M, u[2] * d_pc * PC_M];
  const t0_sec = ((star.epoch_mjd ?? 57388) - 40587) * 86400;
  const dt_sec = epochMs / 1000 - t0_sec;
  const pos_m = propagateICRSPos(pos0_m, v_icrs, dt_sec);
  return { ...star, pos_m };
}
