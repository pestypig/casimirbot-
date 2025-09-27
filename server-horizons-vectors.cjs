// Horizons vectors proxy server for BCRS/GCRS integration with planetary context
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

// Planet mapping for extended requests
const PLANETS = [
  { name: 'Mercury', id: 199 },
  { name: 'Venus', id: 299 },
  { name: 'Mars', id: 499 },
  { name: 'Jupiter', id: 599 },
  { name: 'Saturn', id: 699 },
  { name: 'Uranus', id: 799 },
  { name: 'Neptune', id: 899 }
];

// Mock planetary position generator (rough heliocentric)
function generatePlanetPosition(planetId, ts) {
  const t = new Date(ts).getTime() / (1000 * 86400); // days since epoch
  const year = t / 365.25; // approximate years
  
  // Rough orbital elements for demonstration
  const orbits = {
    199: { a: 0.39, T: 0.24, phase: 0.0 },    // Mercury
    299: { a: 0.72, T: 0.62, phase: 1.5 },    // Venus  
    499: { a: 1.52, T: 1.88, phase: 3.1 },    // Mars
    599: { a: 5.20, T: 11.86, phase: 0.5 },   // Jupiter
    699: { a: 9.54, T: 29.46, phase: 2.0 },   // Saturn
    799: { a: 19.19, T: 84.01, phase: 4.2 },  // Uranus
    899: { a: 30.07, T: 164.8, phase: 1.8 }   // Neptune
  };
  
  const orbit = orbits[planetId];
  if (!orbit) return [0, 0, 0];
  
  const angle = 2 * Math.PI * (year / orbit.T + orbit.phase);
  return [
    orbit.a * Math.cos(angle),
    orbit.a * Math.sin(angle) * 0.8, // slight inclination
    orbit.a * Math.sin(angle) * 0.1
  ];
}

// Mock planetary velocity generator
function generatePlanetVelocity(planetId, ts) {
  const pos = generatePlanetPosition(planetId, ts);
  const dt = 0.1; // 0.1 days
  const pos2 = generatePlanetPosition(planetId, new Date(Date.parse(ts) + dt * 86400 * 1000).toISOString());
  
  return [
    (pos2[0] - pos[0]) / dt,
    (pos2[1] - pos[1]) / dt,
    (pos2[2] - pos[2]) / dt
  ];
}

// Simple CORS and static file server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // API endpoint for vectors
  if (pathname === '/api/horizons/vectors') {
    const ts = parsedUrl.query.ts || '';
    const targets = parsedUrl.query.targets || ''; // e.g., "199,299,499,599,699,799,899"
    
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(ts)) {
      res.writeHead(400, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ error: 'ts must be ISO UTC like 2025-09-24T12:34:56Z' }));
      return;
    }

    console.log(`🌍 Fetching BCRS vectors for ${ts}${targets ? ' + planets' : ''}...`);

    // Mock BCRS/GCRS data for development
    const result = {
      ts,
      frames: { geometry: 'BCRS/ICRF (Sun-centered)', site: 'GCRS (Earth-centered)' },
      earth: {
        ts,
        r_AU: [1.0, 0.0, 0.0],
        v_AUperD: [0.0, 0.017, 0.0],
        lt_s: 499.0 // ~8.3 minutes
      },
      moon: {
        ts,
        r_AU: [0.998, 0.002, 0.0],
        v_AUperD: [0.0, 0.016, 0.0],
        lt_s: 1.28 // ~1.28 seconds
      },
      sunObs: { 
        ra_deg: 180.0, 
        dec_deg: 0.0, 
        range_AU: 1.0, 
        lt_s: 499.0 
      },
      moonObs: { 
        ra_deg: 45.0, 
        dec_deg: 15.0, 
        range_AU: 0.00257, 
        lt_s: 1.28 
      }
    };

    // Add planetary vectors if requested
    if (targets) {
      const requestedIds = targets.split(',').map(id => parseInt(id.trim()));
      result.planets = PLANETS
        .filter(p => requestedIds.includes(p.id))
        .map(p => ({
          name: p.name,
          id: p.id,
          r_AU: generatePlanetPosition(p.id, ts),
          v_AUperD: generatePlanetVelocity(p.id, ts)
        }));
    }

    console.log(`✅ BCRS vectors for ${ts}${result.planets ? ` (${result.planets.length} planets)` : ''}`);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(result, null, 2));
    return;
  }

  // Static file serving
  let filePath = '.' + pathname;
  if (pathname === '/') {
    filePath = './halobank.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code === 'ENOENT') {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Sorry, check with the site admin for error: ${error.code}\n`);
      }
    } else {
      res.writeHead(200, {'Content-Type': contentType});
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Horizons BCRS server with planetary context running on http://localhost:${PORT}`);
  console.log(`📊 HaloBank: http://localhost:${PORT}/halobank.html`);
  console.log(`🧪 Basic vectors API: http://localhost:${PORT}/api/horizons/vectors?ts=2025-09-24T12:34:56Z`);
  console.log(`🪐 Extended with planets: http://localhost:${PORT}/api/horizons/vectors?ts=2025-09-24T12:34:56Z&targets=199,299,499,599,699,799,899`);
});