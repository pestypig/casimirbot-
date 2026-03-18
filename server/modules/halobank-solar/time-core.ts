import type { SolarTimeScales } from "./types";

const J2000_JD = 2451545.0;
const UNIX_EPOCH_JD = 2440587.5;
const DAY_MS = 86_400_000;
const TAI_MINUS_TT = -32.184;
const L_G = 6.969290134e-10;
const L_B = 1.550519768e-8;
const TDB0 = -6.55e-5;
const T0_TCB = 2443144.5003725;

type LeapSecond = {
  effectiveIso: string;
  taiMinusUtc: number;
};

const LEAP_SECONDS: LeapSecond[] = [
  { effectiveIso: "1972-01-01T00:00:00.000Z", taiMinusUtc: 10 },
  { effectiveIso: "1972-07-01T00:00:00.000Z", taiMinusUtc: 11 },
  { effectiveIso: "1973-01-01T00:00:00.000Z", taiMinusUtc: 12 },
  { effectiveIso: "1974-01-01T00:00:00.000Z", taiMinusUtc: 13 },
  { effectiveIso: "1975-01-01T00:00:00.000Z", taiMinusUtc: 14 },
  { effectiveIso: "1976-01-01T00:00:00.000Z", taiMinusUtc: 15 },
  { effectiveIso: "1977-01-01T00:00:00.000Z", taiMinusUtc: 16 },
  { effectiveIso: "1978-01-01T00:00:00.000Z", taiMinusUtc: 17 },
  { effectiveIso: "1979-01-01T00:00:00.000Z", taiMinusUtc: 18 },
  { effectiveIso: "1980-01-01T00:00:00.000Z", taiMinusUtc: 19 },
  { effectiveIso: "1981-07-01T00:00:00.000Z", taiMinusUtc: 20 },
  { effectiveIso: "1982-07-01T00:00:00.000Z", taiMinusUtc: 21 },
  { effectiveIso: "1983-07-01T00:00:00.000Z", taiMinusUtc: 22 },
  { effectiveIso: "1985-07-01T00:00:00.000Z", taiMinusUtc: 23 },
  { effectiveIso: "1988-01-01T00:00:00.000Z", taiMinusUtc: 24 },
  { effectiveIso: "1990-01-01T00:00:00.000Z", taiMinusUtc: 25 },
  { effectiveIso: "1991-01-01T00:00:00.000Z", taiMinusUtc: 26 },
  { effectiveIso: "1992-07-01T00:00:00.000Z", taiMinusUtc: 27 },
  { effectiveIso: "1993-07-01T00:00:00.000Z", taiMinusUtc: 28 },
  { effectiveIso: "1994-07-01T00:00:00.000Z", taiMinusUtc: 29 },
  { effectiveIso: "1996-01-01T00:00:00.000Z", taiMinusUtc: 30 },
  { effectiveIso: "1997-07-01T00:00:00.000Z", taiMinusUtc: 31 },
  { effectiveIso: "1999-01-01T00:00:00.000Z", taiMinusUtc: 32 },
  { effectiveIso: "2006-01-01T00:00:00.000Z", taiMinusUtc: 33 },
  { effectiveIso: "2009-01-01T00:00:00.000Z", taiMinusUtc: 34 },
  { effectiveIso: "2012-07-01T00:00:00.000Z", taiMinusUtc: 35 },
  { effectiveIso: "2015-07-01T00:00:00.000Z", taiMinusUtc: 36 },
  { effectiveIso: "2017-01-01T00:00:00.000Z", taiMinusUtc: 37 },
];

function taiMinusUtcForEpochMs(epochMs: number): number {
  let current = 10;
  for (const leap of LEAP_SECONDS) {
    if (epochMs >= Date.parse(leap.effectiveIso)) {
      current = leap.taiMinusUtc;
    } else {
      break;
    }
  }
  return current;
}

function msToJd(epochMs: number): number {
  return epochMs / DAY_MS + 2440587.5;
}

function normalizeDegrees(value: number): number {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function toIsoFromEpochSeconds(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString();
}

export function computeSolarTimeScales(utcIso: string): SolarTimeScales {
  const utcMs = Date.parse(utcIso);
  if (!Number.isFinite(utcMs)) {
    throw new Error("Invalid UTC timestamp");
  }

  const taiMinusUtc = taiMinusUtcForEpochMs(utcMs);
  const utcSeconds = utcMs / 1000;
  const taiSeconds = utcSeconds + taiMinusUtc;
  const ttSeconds = taiSeconds - TAI_MINUS_TT;
  const ttMs = ttSeconds * 1000;
  const jdTt = msToJd(ttMs);
  const daysFromJ2000 = jdTt - J2000_JD;

  // IAU-style short periodic approximation for TDB-TT.
  const meanAnomalyDeg = normalizeDegrees(357.5277233 + 0.9856002831 * daysFromJ2000);
  const meanAnomalyRad = (meanAnomalyDeg * Math.PI) / 180;
  const tdbMinusTt = 0.001657 * Math.sin(meanAnomalyRad) + 0.00001385 * Math.sin(2 * meanAnomalyRad);
  const tdbSeconds = ttSeconds + tdbMinusTt;
  const jdTdb = tdbSeconds / 86400 + UNIX_EPOCH_JD;

  const tcgMinusTt = L_G * (jdTt - 2443144.5) * 86400;
  const tcgSeconds = ttSeconds + tcgMinusTt;
  const tcbMinusTdb = L_B * (jdTdb - T0_TCB) * 86400 - TDB0;
  const tcbSeconds = tdbSeconds + tcbMinusTdb;

  return {
    utc: new Date(utcMs).toISOString(),
    tai: toIsoFromEpochSeconds(taiSeconds),
    tt: toIsoFromEpochSeconds(ttSeconds),
    tcg: toIsoFromEpochSeconds(tcgSeconds),
    tdb: toIsoFromEpochSeconds(tdbSeconds),
    tcb: toIsoFromEpochSeconds(tcbSeconds),
    offsets_s: {
      tai_minus_utc: taiMinusUtc,
      tt_minus_utc: taiMinusUtc - TAI_MINUS_TT,
      tdb_minus_tt: tdbMinusTt,
      tcb_minus_tdb: tcbMinusTdb,
      tcg_minus_tt: tcgMinusTt,
    },
  };
}
