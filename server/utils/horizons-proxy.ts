// JPL Horizons API proxy for precise Earth orbital elements
import fetch from 'node-fetch';

export type HorizonsSourceClass = 'live' | 'fallback';

interface HorizonsProvenance {
  sourceClass: HorizonsSourceClass;
  diagnostic: boolean;
  certifying: boolean;
  note: string;
}

export interface HorizonsElements {
  a_AU: number;
  e: number;
  i_deg: number;
  Omega_deg: number;
  omega_deg: number;
  M_deg: number;
  epochISO: string;
  perihelionISO: string | null;
  provenance: HorizonsProvenance;
}

const fallbackElements = (year: string): HorizonsElements => ({
  a_AU: 1.00000018,
  e: 0.01673163,
  i_deg: 0.00005,
  Omega_deg: -11.26064,
  omega_deg: 102.94719,
  M_deg: 100.46435,
  epochISO: `${year}-01-01T12:00:00.000Z`,
  perihelionISO: null,
  provenance: {
    sourceClass: 'fallback',
    diagnostic: true,
    certifying: false,
    note: 'Fallback orbital elements are diagnostic only and non-certifying.',
  },
});

export async function getHorizonsElements(year: number | string): Promise<HorizonsElements> {
  const yearStr = String(year || '').trim();
  if (!/^\d{4}$/.test(yearStr)) {
    throw new Error('Invalid year format');
  }

  try {
    const startDate = `${yearStr}-01-01`;
    const endDate = `${yearStr}-01-02`;

    const params = new URLSearchParams({
      format: 'json',
      COMMAND: '399',
      OBJ_DATA: 'YES',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'ELEMENTS',
      CENTER: '@sun',
      OUT_UNITS: 'AU-D',
      START_TIME: startDate,
      STOP_TIME: endDate,
      STEP_SIZE: '1d',
    });

    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Horizons API error: ${response.status}`);
    }

    const rawPayload = await response.text();
    const horizonsOutput = extractHorizonsOutput(rawPayload);
    const elements = parseHorizonsElements(horizonsOutput, yearStr);

    return {
      ...elements,
      provenance: {
        sourceClass: 'live',
        diagnostic: false,
        certifying: true,
        note: 'Live JPL Horizons orbital elements.',
      },
    };
  } catch (error) {
    console.warn(`⚠️ Horizons API failed for ${yearStr}:`, error);
    return fallbackElements(yearStr);
  }
}

function extractHorizonsOutput(rawPayload: string): string {
  const trimmed = rawPayload.trim();
  if (!trimmed) {
    throw new Error('Empty Horizons payload');
  }

  try {
    const parsed = JSON.parse(trimmed) as { result?: unknown; error?: unknown };
    if (typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
      throw new Error(`Horizons API payload error: ${parsed.error}`);
    }
    if (typeof parsed.result === 'string' && parsed.result.trim().length > 0) {
      return parsed.result;
    }
    throw new Error('Horizons API JSON payload missing result text');
  } catch (error) {
    // If payload is plain text, keep legacy parser behavior.
    if (error instanceof SyntaxError) {
      return rawPayload;
    }
    throw error;
  }
}

function parseKeyValue(line: string, key: string): number | null {
  const match = line.match(new RegExp(`(?:^|\\s)${key}\\s*=\\s*([0-9.E+-]+)`));
  if (!match) return null;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseHorizonsElements(horizonsOutput: string, year: string): Omit<HorizonsElements, 'provenance'> {
  const lines = horizonsOutput.split('\n');
  let a_AU: number | null = null;
  let e: number | null = null;
  let i_deg: number | null = null;
  let Omega_deg: number | null = null;
  let omega_deg: number | null = null;
  let M_deg: number | null = null;

  for (const line of lines) {
    const maybeA = parseKeyValue(line, 'A');
    if (maybeA !== null && a_AU === null) a_AU = maybeA;

    const maybeEc = parseKeyValue(line, 'EC');
    if (maybeEc !== null && e === null) e = maybeEc;

    const maybeIn = parseKeyValue(line, 'IN');
    if (maybeIn !== null && i_deg === null) i_deg = maybeIn;

    const maybeOm = parseKeyValue(line, 'OM');
    if (maybeOm !== null && Omega_deg === null) Omega_deg = maybeOm;

    const maybeW = parseKeyValue(line, 'W');
    if (maybeW !== null && omega_deg === null) omega_deg = maybeW;

    const maybeMa = parseKeyValue(line, 'MA');
    if (maybeMa !== null && M_deg === null) M_deg = maybeMa;
  }

  const missing: string[] = [];
  if (a_AU === null) missing.push('A');
  if (e === null) missing.push('EC');
  if (i_deg === null) missing.push('IN');
  if (Omega_deg === null) missing.push('OM');
  if (omega_deg === null) missing.push('W');
  if (M_deg === null) missing.push('MA');
  if (missing.length > 0) {
    throw new Error(`Incomplete Horizons elements: missing ${missing.join(',')}`);
  }

  if (a_AU < 0.5 || a_AU > 2.0 || e < 0 || e > 0.5) {
    throw new Error('Invalid orbital elements received');
  }

  return {
    a_AU,
    e,
    i_deg,
    Omega_deg,
    omega_deg,
    M_deg,
    epochISO: `${year}-01-01T12:00:00.000Z`,
    perihelionISO: null,
  };
}
