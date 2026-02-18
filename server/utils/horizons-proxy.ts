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
      START_TIME: startDate,
      STOP_TIME: endDate,
      STEP_SIZE: '1d',
    });

    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Horizons API error: ${response.status}`);
    }

    const data = await response.text();
    const elements = parseHorizonsElements(data, yearStr);

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

function parseHorizonsElements(horizonsOutput: string, year: string): Omit<HorizonsElements, 'provenance'> {
  const lines = horizonsOutput.split('\n');
  let a_AU = 1.0;
  let e = 0.0167;
  let i_deg = 0.0;
  let Omega_deg = 0.0;
  let omega_deg = 0.0;
  let M_deg = 0.0;

  for (const line of lines) {
    if (line.includes('A=')) {
      const match = line.match(/(?:^|\s)A=\s*([0-9.E+-]+)/);
      if (match) a_AU = parseFloat(match[1]);
    }
    if (line.includes('EC=')) {
      const match = line.match(/(?:^|\s)EC=\s*([0-9.E+-]+)/);
      if (match) e = parseFloat(match[1]);
    }
    if (line.includes('IN=')) {
      const match = line.match(/(?:^|\s)IN=\s*([0-9.E+-]+)/);
      if (match) i_deg = parseFloat(match[1]);
    }
    if (line.includes('OM=')) {
      const match = line.match(/(?:^|\s)OM=\s*([0-9.E+-]+)/);
      if (match) Omega_deg = parseFloat(match[1]);
    }
    if (line.includes('W=')) {
      const match = line.match(/(?:^|\s)W=\s*([0-9.E+-]+)/);
      if (match) omega_deg = parseFloat(match[1]);
    }
    if (line.includes('MA=')) {
      const match = line.match(/(?:^|\s)MA=\s*([0-9.E+-]+)/);
      if (match) M_deg = parseFloat(match[1]);
    }
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
