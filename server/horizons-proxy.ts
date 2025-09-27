// JPL Horizons API proxy for precise Earth orbital elements
import fetch from 'node-fetch';

interface HorizonsElements {
  a_AU: number;
  e: number;
  i_deg: number;
  Omega_deg: number;
  omega_deg: number;
  M_deg: number;
  epochISO: string;
  perihelionISO: string | null;
}

export async function getHorizonsElements(year: number | string): Promise<HorizonsElements> {
  const yearStr = String(year || '').trim();
  if (!/^\d{4}$/.test(yearStr)) {
    throw new Error('Invalid year format');
  }

  const startTime = `${yearStr}-01-01T00:00`;
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: "'399'",          // Earth
    CENTER: "'Sun'",           // Heliocentric
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'ELEMENTS'",
    OUT_UNITS: "'AU-D'",
    TLIST: `'${startTime}'`,
    OBJ_DATA: "'NO'"
  });

  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json() as any;
    
    // Parse the elements from Horizons response
    const result = data?.result;
    if (!result) {
      throw new Error('No result from Horizons API');
    }

    // Extract elements (field names may vary)
    let elements: any;
    if (result.elements && result.elements.length > 0) {
      elements = result.elements[0];
    } else if (Array.isArray(result) && result.length > 0) {
      elements = result[0];
    } else {
      elements = result;
    }

    // Map the fields (adjust based on actual Horizons response format)
    const a_AU = parseFloat(elements.a || elements.A || 0);
    const e = parseFloat(elements.e || elements.EC || 0);
    const i_deg = parseFloat(elements.i || elements.IN || 0);
    const Omega_deg = parseFloat(elements.OM || elements.om || 0); // Ω
    const omega_deg = parseFloat(elements.W || elements.w || 0);   // ω
    const M_deg = parseFloat(elements.M || elements.MA || 0);
    const epochISO = elements.epoch || startTime;

    // Attempt to get perihelion time (may not always be available)
    const perihelionISO = elements.peri_time || elements.perihelion_time || null;

    // Validate we got reasonable values
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
      perihelionISO
    };

  } catch (error) {
    console.error('Horizons API error:', error);
    throw error;
  }
}