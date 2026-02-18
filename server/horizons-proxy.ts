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

  const startTime = `${yearStr}-01-01T00:00`;
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: "'399'",
    CENTER: "'Sun'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'ELEMENTS'",
    OUT_UNITS: "'AU-D'",
    TLIST: `'${startTime}'`,
    OBJ_DATA: "'NO'",
  });

  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as any;
    const result = data?.result;
    if (!result) {
      throw new Error('No result from Horizons API');
    }

    const elements = Array.isArray(result)
      ? result[0]
      : result.elements?.[0] ?? result;

    const a_AU = parseFloat(elements.a || elements.A || 0);
    const e = parseFloat(elements.e || elements.EC || 0);
    const i_deg = parseFloat(elements.i || elements.IN || 0);
    const Omega_deg = parseFloat(elements.OM || elements.om || 0);
    const omega_deg = parseFloat(elements.W || elements.w || 0);
    const M_deg = parseFloat(elements.M || elements.MA || 0);
    const epochISO = elements.epoch || `${yearStr}-01-01T12:00:00.000Z`;
    const perihelionISO = elements.peri_time || elements.perihelion_time || null;

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
      epochISO,
      perihelionISO,
      provenance: {
        sourceClass: 'live',
        diagnostic: false,
        certifying: true,
        note: 'Live JPL Horizons orbital elements.',
      },
    };
  } catch (error) {
    console.error('Horizons API error:', error);
    return fallbackElements(yearStr);
  }
}
