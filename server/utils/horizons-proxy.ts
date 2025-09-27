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

  try {
    console.log(`🌍 Fetching Horizons elements for Earth, year ${yearStr}...`);
    
    // JPL Horizons endpoint for Earth (399) orbital elements
    // Use vector format to get state vectors, then derive elements
    const startDate = `${yearStr}-01-01`;
    const endDate = `${yearStr}-01-02`;
    
    const params = new URLSearchParams({
      format: 'json',
      COMMAND: '399',  // Earth
      OBJ_DATA: 'YES',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'ELEMENTS',
      CENTER: '@sun',  // Heliocentric
      START_TIME: startDate,
      STOP_TIME: endDate,
      STEP_SIZE: '1d'
    });

    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Horizons API error: ${response.status}`);
    }

    const data = await response.text();
    
    // Parse the elements from Horizons output
    // This is a simplified parser - in production you'd want more robust parsing
    const elements = parseHorizonsElements(data, yearStr);
    
    console.log(`✅ Retrieved Earth elements for ${yearStr}: a=${elements.a_AU.toFixed(6)} AU`);
    return elements;

  } catch (error) {
    console.warn(`⚠️ Horizons API failed for ${yearStr}:`, error);
    
    // Fallback to standard Earth orbital elements (epoch J2000.0)
    return {
      a_AU: 1.00000018,
      e: 0.01673163,
      i_deg: 0.00005,
      Omega_deg: -11.26064,
      omega_deg: 102.94719,
      M_deg: 100.46435,
      epochISO: `${yearStr}-01-01T12:00:00.000Z`,
      perihelionISO: null
    };
  }
}

function parseHorizonsElements(horizonsOutput: string, year: string): HorizonsElements {
  // This is a simplified parser for Horizons orbital elements output
  // In production, you'd want more robust parsing of the actual format
  
  try {
    // Look for orbital elements in the output
    const lines = horizonsOutput.split('\n');
    let a_AU = 1.0, e = 0.0167, i_deg = 0.0, Omega_deg = 0.0, omega_deg = 0.0, M_deg = 0.0;
    
    for (const line of lines) {
      if (line.includes('A=')) {
        const match = line.match(/A=\s*([0-9.E+-]+)/);
        if (match) a_AU = parseFloat(match[1]);
      }
      if (line.includes('EC=')) {
        const match = line.match(/EC=\s*([0-9.E+-]+)/);
        if (match) e = parseFloat(match[1]);
      }
      if (line.includes('IN=')) {
        const match = line.match(/IN=\s*([0-9.E+-]+)/);
        if (match) i_deg = parseFloat(match[1]);
      }
      if (line.includes('OM=')) {
        const match = line.match(/OM=\s*([0-9.E+-]+)/);
        if (match) Omega_deg = parseFloat(match[1]);
      }
      if (line.includes('W=')) {
        const match = line.match(/W=\s*([0-9.E+-]+)/);
        if (match) omega_deg = parseFloat(match[1]);
      }
      if (line.includes('MA=')) {
        const match = line.match(/MA=\s*([0-9.E+-]+)/);
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
      perihelionISO: null
    };
    
  } catch (error) {
    console.warn('Failed to parse Horizons elements, using defaults:', error);
    
    // Fallback to standard Earth elements
    return {
      a_AU: 1.00000018,
      e: 0.01673163,
      i_deg: 0.00005,
      Omega_deg: -11.26064,
      omega_deg: 102.94719,
      M_deg: 100.46435,
      epochISO: `${year}-01-01T12:00:00.000Z`,
      perihelionISO: null
    };
  }
}