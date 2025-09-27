// Simple test server for Horizons proxy
import express from 'express';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static(__dirname));

// Horizons proxy endpoint
app.get('/api/horizons', async (req, res) => {
  try {
    const year = req.query.year;
    if (!year || typeof year !== 'string') {
      return res.status(400).json({ error: 'Year parameter required' });
    }
    
    console.log(`🌍 Fetching Horizons data for year ${year}...`);
    
    // For testing, return mock data first
    const mockData = {
      a_AU: 1.000001018,
      e: 0.0167086,
      i_deg: -0.00001531,
      Omega_deg: 0.0,
      omega_deg: 102.93735,
      M_deg: 357.529,
      epochISO: `${year}-01-01T00:00`,
      perihelionISO: `${year}-01-04T16:17`
    };
    
    console.log(`✅ Returning mock data for ${year}:`, mockData);
    res.json(mockData);
    
    /*
    // Real Horizons API call (uncomment when ready to test)
    const startTime = `${year}-01-01T00:00`;
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
    const response = await fetch(url);
    const data = await response.json();
    
    // Parse and return elements
    const result = data?.result;
    if (!result) throw new Error('No result from Horizons API');
    
    // Map fields from Horizons response
    const elements = result.elements?.[0] || result[0] || result;
    const responseData = {
      a_AU: parseFloat(elements.a || elements.A || 0),
      e: parseFloat(elements.e || elements.EC || 0),
      i_deg: parseFloat(elements.i || elements.IN || 0),
      Omega_deg: parseFloat(elements.OM || elements.om || 0),
      omega_deg: parseFloat(elements.W || elements.w || 0),
      M_deg: parseFloat(elements.M || elements.MA || 0),
      epochISO: elements.epoch || startTime,
      perihelionISO: elements.peri_time || elements.perihelion_time || null
    };
    
    res.json(responseData);
    */
    
  } catch (error) {
    console.error('❌ Horizons API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch orbital elements',
      details: error.message
    });
  }
});

// Serve HaloBank
app.get('/halobank', (req, res) => {
  res.sendFile(join(__dirname, 'halobank.html'));
});

// Serve test page
app.get('/test', (req, res) => {
  res.sendFile(join(__dirname, 'test-horizons.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 HaloBank: http://localhost:${PORT}/halobank`);
  console.log(`🧪 Test page: http://localhost:${PORT}/test`);
});