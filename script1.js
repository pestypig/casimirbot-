/* =========================
   Minimal data store
========================= */

/* =========================
   Utilities
========================= */
// Adaptively increase decimals if rounding would show 0.0 even when the value is non-zero
function fixedAdaptive(x, baseDp=1, maxDp=6){
  if (x==null || isNaN(x)) return 'n/a'
  const v = +x
  let d = baseDp
  let s = v.toFixed(d)
  while (d < maxDp && Math.abs(+s) === 0 && v !== 0){
    d++
    s = v.toFixed(d)
  }
  if (Math.abs(+s) === 0) s = (0).toFixed(d)
  return s
}
const fmt = {
  deg: v => {
    const val = +v; if (!isFinite(val)) return 'n/a'
    // If 1dp would render 0.0 but val is not zero, increase decimals; if extremely small, show arcseconds
    const ad = Math.abs(val)
    if (ad < 1e-3 && ad > 0) return `${(val*3600).toFixed(1)}″`
    const s = fixedAdaptive(val, 1, 6)
    return `${s}°`
  },
  min: v => Math.round(v) + ' min',
  pct: v => {
    const val = +v; if (!isFinite(val)) return 'n/a'
    const sign = val>=0?'+':''
    const s = fixedAdaptive(val, 1, 6)
    return `${sign}${s}%`
  },
  date: ts => new Date(ts).toLocaleString(),
  // Timezone-aware formatter that respects per-record capture zone
  dateLocal: (ts, tz) => {
    try {
      // show date + time + short zone (e.g., CEST, EDT). Fallback if tz missing.
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: tz, timeZoneName: 'short'
      }).format(new Date(ts))
    } catch {
      return new Date(ts).toLocaleString(); // fallback
    }
  }
}
function uid() { return Math.random().toString(36).slice(2,9); }

function makeDashedMat(color) {
  return new THREE.LineDashedMaterial({
    color,
    linewidth: 1,     // (Line2 needed for real widths; fine for now)
    dashSize: 0.04,   // tune to taste (AU units along path)
    gapSize: 0.02,
    transparent: true,
    opacity: 0.85
  })
}

// ---- Precise per-year orbit provider ----
const HORIZONS = {
  endpoint: '/api/horizons', // server proxy endpoint
  muSun_AU3_per_d2: 0.00029591220828559104 // GM☉ (Gaussian k^2) in AU^3/day^2
}

const halosPrecise = new Map();  // year -> THREE.Line (precise)
const yearElements = new Map();  // year -> {a,e,i,Omega,omega,M,epochJD, perihelionISO}

const orbitGradientLines = new Set()
window.__orbitGradientLines = orbitGradientLines

function createOrbitLineMaterial(opacity = 0.75) {
  return new THREE.LineBasicMaterial({
    transparent: true,
    opacity,
    depthWrite: false,
    vertexColors: true,
    toneMapped: false
  })
}

function prepareOrbitGradientLine(line) {
  if (!line || !line.geometry) return
  const geo = line.geometry
  const posAttr = geo.getAttribute && geo.getAttribute('position')
  if (!posAttr || !posAttr.count) return
  const count = posAttr.count
  const fractions = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  const divisor = Math.max(1, count - 1)
  for (let i = 0; i < count; i++) {
    fractions[i] = i / divisor
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.attributes.color.needsUpdate = true
  line.userData = line.userData || {}
  line.userData.orbitFractions = fractions
  if (line.material) {
    line.material.vertexColors = true
    line.material.needsUpdate = true
  }
  orbitGradientLines.add(line)
  if (typeof window.__updateOrbitGradientColors === 'function') {
    try {
      window.__updateOrbitGradientColors()
    } catch (err) {
      console.warn('Orbit gradient update failed', err)
    }
  }
}

function releaseOrbitGradientLine(line) {
  if (!line) return
  orbitGradientLines.delete(line)
}

function toJD(dateISO) {
  // minimalist UTC->JD; ok for our ephemeris stamps
  const t = new Date(dateISO).getTime() / 86400000 + 2440587.5
  return t
}

async function fetchElementsForYear(year){
  if (yearElements.has(year)) return yearElements.get(year)
  
  console.log(`Fetching precise orbit for ${year}...`)
  const tsISO = `${year}-01-04T12:00:00Z`; // near perihelion

  // Prefer your server proxy (prevents CORS/rate-limit HTML)
  const proxyUrl = `/api/horizons/vectors?ts=${encodeURIComponent(tsISO)}`
  try {
    const r = await fetch(proxyUrl, { headers: { "Accept": "application/json" }})
    const text = await r.text()

    // Some gateways return HTML on error; detect before JSON parse
    if (!text.trim().startsWith("{")) {
      console.warn("Horizons proxy returned non-JSON; falling back.\n", text.slice(0,200))
      throw new Error("non-json")
    }

    const data = JSON.parse(text)
    // extract what you need (Earth heliocentric state + perihelion from your server payload)
    const earth = data.earth
    
    // Convert BCRS vectors to approximate orbital elements for visualization
    const el = {
      a: earth?.r_AU?.[0] ? Math.sqrt(earth.r_AU[0]**2 + earth.r_AU[1]**2 + earth.r_AU[2]**2) : 1.0,
      e: 0.0167, // Use standard eccentricity for now
      i: 0,
      Omega: 0,
      omega: 102.9 * Math.PI/180,
      M: 0,
      epochISO: tsISO,
      epochJD: toJD(tsISO),
      perihelionISO: null
    }
    
    yearElements.set(year, el)
    console.log(`Horizons fetched for ${year}.`)
    return el

  } catch (e) {
    console.warn(`Horizons fetch failed for ${year}:`, e.message || e)
    // Fallback: analytic Kepler ellipse using J2000 elements (labels as approximate)
    const approx = {
      a: 1.0,
      e: 0.0167,
      i: 0,
      Omega: 0,
      omega: 102.9 * Math.PI/180,
      M: 0,
      epochISO: `${year}-01-01T00:00`,
      epochJD: toJD(`${year}-01-01T00:00`),
      perihelionISO: null
    }
    
    yearElements.set(year, approx)
    
    // mark UI
    (window.uiFlags ||= {}).orbitsApprox = true
    console.log(`📊 Added approximate orbit for ${year}`)
    return approx
  }
}

function elementsToEllipseGeometry(el, samples=720){
  const a = Number.isFinite(el?.a) ? el.a : 1
  const e = Number.isFinite(el?.e) ? el.e : 0
  const argPeri = Number.isFinite(el?.omega) ? el.omega : 0
  const ascNode = Number.isFinite(el?.Omega) ? el.Omega : 0
  const inPlaneRotation = argPeri + ascNode
  const pts = []
  for (let k = 0; k <= samples; k++) {
    const nu = 2 * Math.PI * (k / samples)
    const r = a * (1 - e * e) / (1 + e * Math.cos(nu))
    const angle = nu + inPlaneRotation
    const x = r * Math.cos(angle)
    const z = r * Math.sin(angle)
    pts.push(new THREE.Vector3(x, 0, z))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const tmp = new THREE.Line(geo, new THREE.LineBasicMaterial())
  tmp.computeLineDistances()
  return geo
}
function hashColor(str){
  let h=0; for(let i=0;i<str.length;i++){ h = (h<<5)-h + str.charCodeAt(i); h|=0; }
  const r = (h>>16 & 255), g=(h>>8 & 255), b=(h & 255)
  return new THREE.Color(`rgb(${(r&127)+80}, ${(g&127)+80}, ${(b&127)+80})`)
}

function makeLabelSprite(text){
  const pad = 6, fs = 13
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `500 ${fs}px Inter, ui-sans-serif`
  const w = Math.ceil(ctx.measureText(text).width) + pad*2
  const h = fs + pad*2
  canvas.width = w*2; canvas.height = h*2; // retina
  ctx.scale(2,2)
  // pill
  ctx.fillStyle = '#101733cc'
  ctx.strokeStyle = '#23335f'
  ctx.lineWidth = 1
  ctx.beginPath(); const r=8
  ctx.moveTo(r,0); ctx.lineTo(w-r,0); ctx.quadraticCurveTo(w,0,w,r)
  ctx.lineTo(w,h-r); ctx.quadraticCurveTo(w,h,w-r,h)
  ctx.lineTo(r,h); ctx.quadraticCurveTo(0,h,0,h-r)
  ctx.lineTo(0,r); ctx.quadraticCurveTo(0,0,r,0); ctx.closePath()
  ctx.fill(); ctx.stroke()
  // text
  ctx.fillStyle = '#dfe6ff'; ctx.fillText(text, pad, fs+pad-2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, depthWrite:false, transparent:true })
  const spr = new THREE.Sprite(mat)
  const scale = 0.18; // size in AU units
  spr.scale.set(scale * (w/h), scale, 1)
  spr.renderOrder = 999
  spr.visible = false; // show on hover/selection
  return spr
}

/* =========================
   Approximate ephemerides (demo)
   Replace with SPICE/Horizons for production.
========================= */
// Sun-Earth orbital basics
const AU = 1;                   // rendering units: 1 = 1 AU
const RAD = Math.PI/180
const eEarth = 0.0167;          // eccentricity
const aEarth = 1;               // AU

// ---- Light-time bands along Earth's surface ----
const C_km_per_s = 299792.458
const EARTH_EQ_CIRC_km = 40075.017;         // equatorial circumference
const LT_full_ms = (EARTH_EQ_CIRC_km / C_km_per_s) * 1000; // ≈ 133.7 ms
const LT_zone_ms = LT_full_ms / 24;         // ≈ 5.57 ms per 15° time zone
const KM_PER_DEG_EQ = EARTH_EQ_CIRC_km/360; // ≈ 111.32 km

// Convert a longitude (deg, east+) to light-time offset from Greenwich in ms (wrap to [-LT_zone_ms*12, +...])
function longToLightMs(longDeg, latDeg=0){
  // Use *local parallel* length: scale by cos(lat) so high latitudes compress correctly
  const kmPerDeg = KM_PER_DEG_EQ * Math.max(0.2, Math.cos(latDeg * Math.PI/180)); // clamp so polar sites still render
  const km = longDeg * kmPerDeg
  return (km / C_km_per_s) * 1000;  // ms
}

// Wrap ms to a symmetric window (nice for "distance" reporting)
function wrapMs(ms, halfWindow = LT_full_ms/2){
  let x = ms
  while (x >  halfWindow) x -= LT_full_ms
  while (x < -halfWindow) x += LT_full_ms
  return x
}

const perihelionApprox = new Date(Date.UTC(2025,0,4,0,0,0)); // ~Jan 4, 2025

function daysSince(t0, t) { return (t - t0)/86400000; }

// Earth heliocentric longitude (very rough): mean anomaly + correction
function heliocentricLongitude(ts) {
  const d = daysSince(perihelionApprox, ts)
  const M = (2*Math.PI/365.25)*d; // mean anomaly
  // solve Kepler (one Newton step ok for demo)
  let E = M + eEarth*Math.sin(M)
  E = E - (E - eEarth*Math.sin(E) - M)/(1 - eEarth*Math.cos(E))
  const v = 2*Math.atan(Math.sqrt((1+eEarth)/(1-eEarth))*Math.tan(E/2)); // true anomaly
  let L = v; // argument of periapsis ~ 0 in this rough frame
  if (L < 0) L += 2*Math.PI
  return L; // radians
}

// Earth-Sun distance in AU
function earthSunDistance(ts) {
  const d = daysSince(perihelionApprox, ts)
  const M = (2*Math.PI/365.25)*d
  let E = M + eEarth*Math.sin(M)
  E = E - (E - eEarth*Math.sin(E) - M)/(1 - eEarth*Math.cos(E))
  const r = aEarth*(1 - eEarth*Math.cos(E))
  return r
}

// Very rough solar "tide proxy" relative % (∝ 1/r^3 vs annual mean)
function solarTideRelPct(ts) {
  const r = earthSunDistance(ts)
  const tNow = Date.UTC(new Date(ts).getUTCFullYear(), 6, 3); // midyear ref
  const rRef = earthSunDistance(tNow)
  const rel = Math.pow(rRef/r, 3) - 1
  return rel*100
}

// Low-accuracy Moon (Meeus-style, good to ~1°/few thousand km)
// Returns { altDeg, distance_km, phasePct, perigeeProx, lunarRelPct }
function moonContext(ts, latDeg, lonDeg) {
  const d = (ts - Date.UTC(2000,0,1,12,0,0)) / 86400000; // days since J2000.0
  const T = d / 36525

  // Mean elements (deg)
  const L0 = (218.3164477 + 481267.88123421*T - 0.0015786*T*T) % 360; // mean longitude
  const M  = (134.9633964 + 477198.8675055*T   + 0.0087414*T*T) % 360; // Moon's mean anomaly
  const Ms = (357.5291092 + 35999.0502909*T    - 0.0001535*T*T) % 360; // Sun's mean anomaly
  const D  = (297.8501921 + 445267.1114034*T   - 0.0018819*T*T) % 360; // mean elongation
  const F  = (93.2720950  + 483202.0175233*T   - 0.0036539*T*T) % 360; // argument of latitude

  const toRad = Math.PI/180
  const sin = Math.sin, cos = Math.cos

  // Ecliptic longitude/latitude (deg), distance (km) — simplified series
  const lon = L0
    + 6.289 * sin(M*toRad)
    + 1.274 * sin((2*D - M)*toRad)
    + 0.658 * sin((2*D)*toRad)
    + 0.214 * sin((2*M)*toRad)
    + 0.110 * sin(D*toRad)
  const lat = 5.128 * sin(F*toRad)
    + 0.280 * sin((M + F)*toRad)
    + 0.277 * sin((M - F)*toRad)
    + 0.173 * sin((2*D - F)*toRad)

  const dist_km = 385000.56
    - 20905.355 * cos(M*toRad)
    - 3699.111  * cos((2*D - M)*toRad)
    - 2955.968  * cos((2*D)*toRad)
    - 569.925   * cos((2*M)*toRad)

  // Obliquity & to RA/Dec
  const eps = (23.439291 - 0.0130042*T); // deg
  const lonR = lon*toRad, latR = lat*toRad, epsR = eps*toRad
  const x = cos(lonR)*cos(latR)
  const y = sin(lonR)*cos(latR)*cos(epsR) - sin(latR)*sin(epsR)
  const z = sin(lonR)*cos(latR)*sin(epsR) + sin(latR)*cos(epsR)
  const ra  = Math.atan2(y, x);               // rad
  const dec = Math.asin(z);                   // rad

  // Local hour angle
  const date = new Date(ts)
  const jd = (ts/86400000) + 2440587.5
  const T0 = (jd - 2451545.0)/36525
  const GMST = (280.46061837 + 360.98564736629*(jd-2451545) + 0.000387933*T0*T0 - (T0*T0*T0)/38710000) % 360
  const LST = ((GMST + lonDeg) % 360) * toRad; // local sidereal
  const H = LST - ra

  const phi = latDeg*toRad
  const alt = Math.asin(Math.sin(phi)*Math.sin(dec) + Math.cos(phi)*Math.cos(dec)*Math.cos(H)); // rad

  // Illumination (phase) from elongation approx
  const elong = (180/Math.PI) * Math.acos(Math.cos((lon - (L0 - D))*toRad)*Math.cos(latR))
  const phasePct = Math.round(50*(1 - Math.cos(elong*toRad))*2)

  const mean = 384400
  const lunarRel = Math.pow(mean/dist_km, 3) - 1
  const perigeeProx = Math.max(0, 1 - Math.abs(dist_km-363300) / (405500-363300))

  return {
    altDeg: alt*180/Math.PI,
    distance_km: dist_km,
    phasePct,
    perigeeProx: +perigeeProx.toFixed(2),
    lunarRelPct: +(lunarRel*100).toFixed(1)
  }
}

// Day-phase tag using simple Sun altitude estimate (needs lat/lon)
function sunAltDeg(ts, lat, lon) {
  // Approximate solar declination/HA (NOAA-ish shortcut)
  const date = new Date(ts)
  const n = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(),0,0))/86400000)
  const L = (280.46 + 0.9856474*n) % 360
  const g = (357.528 + 0.9856003*n) % 360
  const lambda = L + 1.915*Math.sin(g*RAD) + 0.020*Math.sin(2*g*RAD)
  const epsilon = 23.439 - 0.0000004*n
  const delta = Math.asin(Math.sin(epsilon*RAD)*Math.sin(lambda*RAD)); // declination
  const timeUTC = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600
  const eqTime =  - (1.915*Math.sin(g*RAD) + 0.020*Math.sin(2*g*RAD) - 2.466*Math.sin(2*lambda*RAD) + 0.053*Math.sin(4*lambda*RAD)); // ~minutes (very rough)
  const tst = (timeUTC*60 + eqTime + lon*4) / 4; // true solar time in hours
  const H = ((tst - 12)*15) * RAD; // hour angle (rad)
  const phi = lat*RAD
  const alt = Math.asin(Math.sin(phi)*Math.sin(delta) + Math.cos(phi)*Math.cos(delta)*Math.cos(H))
  return alt * 180/Math.PI
}
function dayPhaseTag(altDeg) {
  if (altDeg >= 45) return 'daytime'
  if (altDeg >= 0)  return 'golden hour'
  if (altDeg >= -6) return 'civil twilight'
  if (altDeg >= -12)return 'nautical twilight'
  if (altDeg >= -18)return 'astro twilight'
  return 'night'
}

// Vertical tidal acceleration ~ A0 * (r0/r)^3 * (3 cos^2 z - 1)
// We'll show µGal magnitude (1 µGal = 1e-8 m/s^2) as context.
const TIDE = {
  A_sun_uGal: 52,         // canonical peak near zenith at mean distance
  A_moon_uGal: 110,
  rSunRef_AU: 1.0,
  rMoonRef_km: 384400
}
function zenithFactor(altDeg){
  const z = Math.max(0, 90 - altDeg); // zenith distance
  const cz = Math.cos(z*Math.PI/180)
  return Math.abs(3*cz*cz - 1);       // magnitude of (3 cos^2 z - 1)
}

// --- Similarity feature helpers ---
const clamp01 = x => Math.max(0, Math.min(1, x))

function cycDeltaDeg(a, b) { // shortest angular diff in [0,180]
  let d = Math.abs(((b - a + 540) % 360) - 180)
  return d
}

// ---- Causal / envelope helpers ----
const C_LIGHT = 299792.458; // km/s

// Simple P2(cos z) factor used in tidal potential
const P2 = (zRad) => 0.5*(3*Math.cos(zRad)**2 - 1)

// P2 from altitude (deg) — strictly in [-0.5, 1]
function P2_fromAltDeg(altDeg){
  const altClamped = Math.max(altDeg, -0.5);               // avoid below-horizon blowups
  const zRad = (90 - altClamped) * Math.PI/180;            // zenith angle in radians
  return Math.max(-0.5, Math.min(1, 0.5*(3*Math.cos(zRad)**2 - 1)))
}

// Pretty printer for tiny proper-time shifts (ns/s)
function niceNsPerS(x){
  if (x==null || isNaN(x)) return 'n/a'
  const v = +x
  if (Math.abs(v) < 1e-3) return '≈0 ns/s'
  return `${v.toFixed(3)} ns/s`
}

// Normalize angle to [0, 360)
function norm360(deg){ let x = deg % 360; if (x < 0) x += 360; return x; }

// Ecliptic longitudes (rough but consistent with your solar/moon models)
function sunEclipticLongitudeDeg(ts){
  // reuse the 'sunAltDeg' internals: L,g,lambda
  const d = new Date(ts)
  const n = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(),0,0))/86400000)
  const L = (280.46 + 0.9856474*n) % 360
  const g = (357.528 + 0.9856003*n) % 360
  const lambda = L + 1.915*Math.sin(g*RAD) + 0.020*Math.sin(2*g*RAD)
  return (lambda + 180) % 360; // heliocentric → geocentric correction (~+180°)
}
function moonEclipticLongitudeDeg_fast(ts){
  const mc = moonContext(ts, 0, 0); // we only need the longitude term; mc used the series L0 + ...
  // Recompute L0 quickly (same T as moonContext):
  const d = (ts - Date.UTC(2000,0,1,12,0,0)) / 86400000
  const T = d / 36525
  const L0 = (218.3164477 + 481267.88123421*T - 0.0015786*T*T) % 360
  // Use L0 as a proxy for ecliptic longitude (good enough for phase offset UI)
  return (L0+360)%360
}

// Rolling envelope average of our tide proxy over window W seconds (centered)
// Daily span of the (proxy) tidal potential for normalization
function envelopeDailySpan_sync(ts, lat, lon){
  // sample every 10 min across ±12 h window
  const step = 600; // s
  const half = 12*3600; // s
  let Umin = +Infinity, Umax = -Infinity
  for (let s=-half; s<=half; s+=step){
    const t = ts + s*1000
    const sAlt = sunAltDeg(t, lat, lon)
    const zS = (90 - sAlt)*RAD
    const m = moonContext(t, lat, lon)
    const zM = (90 - m.altDeg)*RAD
    const KS = 0.5, KM = 1.1
    const rS = earthSunDistance(t)
    const U = KS*Math.pow(1/rS,3)*P2(zS) + KM*Math.pow(384400/m.distance_km,3)*P2(zM)
    if (U<Umin) Umin = U
    if (U>Umax) Umax = U
  }
  return Math.max(1e-9, Umax - Umin)
}

// Daily span of the (proxy) tidal potential for normalization
async function envelopeDailySpan(ts, lat, lon){
  // sample every 10 min across ±12 h window
  const step = 600; // s
  const half = 12*3600; // s
  let Umin = +Infinity, Umax = -Infinity
  for (let s=-half; s<=half; s+=step){
    const t = ts + s*1000
    const sAlt = sunAltDeg(t, lat, lon)
    const zS = (90 - sAlt)*RAD
    const m = moonContext(t, lat, lon)
    const zM = (90 - m.altDeg)*RAD
    const KS = 0.5, KM = 1.1
    const rS = earthSunDistance(t)
    const U = KS*Math.pow(1/rS,3)*P2(zS) + KM*Math.pow(384400/m.distance_km,3)*P2(zM)
    if (U<Umin) Umin = U
    if (U>Umax) Umax = U
  }
  return Math.max(1e-9, Umax - Umin)
}

function envelopeAverage_U(ts, lat, lon, Wsec=60){
  const step = 5; // 5 s steps
  const N = Math.max(1, Math.floor(Wsec/step))
  let sum=0
  for(let k=-N/2; k<=N/2; k++){
    const t = ts + k*step*1000
    const sAlt = sunAltDeg(t, lat, lon)
    const zS = (90 - sAlt)*RAD
    const m = moonContext(t, lat, lon)
    const zM = (90 - m.altDeg)*RAD
    // scale constants match oneSecondTidalPotential()
    const KS = 0.5, KM = 1.1
    const rS = earthSunDistance(t)
    const U = KS*Math.pow(1/rS,3)*P2(zS) + KM*Math.pow(384400/m.distance_km,3)*P2(zM)
    sum += U
  }
  const Ubar = sum/(N+1)
  return Ubar
}

// Long-cycle lunar phases (very coarse, J2000 reference)
function lunarLongCyclePhases(ts){
  const d = (ts - Date.UTC(2000,0,1,12,0,0))/86400000
  const nodalPeriod = 6798.383;     // days ~18.6 yr
  const perigeePeriod = 3232.605;   // days ~8.85 yr
  const nodalPhaseDeg = ((d / nodalPeriod)*360) % 360
  const perigeePhaseDeg = ((d / perigeePeriod)*360) % 360
  return { nodalPhaseDeg: (nodalPhaseDeg+360)%360, perigeePhaseDeg:(perigeePhaseDeg+360)%360 }
}

// normalize differences → [0,1] similarity
function simAngle(aDeg, bDeg) {
  return 1 - (cycDeltaDeg(aDeg, bDeg) / 180);           // 0 (opposite) .. 1 (same)
}
function simLinear(a, b, span) {
  return 1 - clamp01(Math.abs(a - b) / span);           // within "span" counts as good
}
function simCategory(a, b) {
  return a === b ? 1 : 0.4;                              // soft credit if not identical
}

// Roll everything into one score (0..100)
function similarityScore(A, B, diffsObj = null) {
  // features + suggested spans (tune to taste)
  const sPhase   = simCategory(A.states.dayPhase, B.states.dayPhase);      // weight 0.18
  const sAlt     = simLinear(A.states.sunAltDeg, B.states.sunAltDeg, 15);  // 15° is "close"
  const sAngle   = simAngle(A.homeAngleDeg, B.homeAngleDeg)
  const sIndex   = simLinear(A.states.tides.index0to100, B.states.tides.index0to100, 20)
  const sSolar   = simLinear(A.states.tides.solarRelPct, B.states.tides.solarRelPct, 5)
  const sLunar   = simLinear(A.states.tides.lunarRelPct, B.states.tides.lunarRelPct, 10)
  const sMoonPh  = simLinear(A.states.lunar.phasePct, B.states.lunar.phasePct, 20)

  // weights sum to 1
  const w = {
    phase:0.18, alt:0.12, angle:0.18, index:0.18, solar:0.10, lunar:0.14, moon:0.10
  }

  const S =
    w.phase*sPhase + w.alt*sAlt + w.angle*sAngle + w.index*sIndex +
    w.solar*sSolar + w.lunar*sLunar + w.moon*sMoonPh

  // NEW causal/averaging similarities (small weights)
  if (diffsObj && A.states.envelope && B.states.envelope) {
    const sCausalSun  = 1 - clamp01( Math.abs(diffsObj.dSunCausal_s || 0) / 2 );  // within 2 s is "good"
    const sCausalMoon = 1 - clamp01( Math.abs(diffsObj.dMoonCausal_s || 0) / 2 )
    const sEnv1m = (typeof diffsObj.envPct_1m === 'number')
      ? 1 - clamp01(diffsObj.envPct_1m / 30)  // <30% of daily span ≈ "good"
      : 0.5
    const sVecDir = 1 - ( Math.abs(diffsObj.dNetBearing || 0) / 180 )
    const sVecMag = 1 - clamp01( Math.abs(diffsObj.dNetMag || 0) / 20 ); // 20 µGal span

    // Enhanced similarity with refined causal/envelope weights
    const add = 0.12; // total extra influence
    const Splus = 0.03*sCausalSun + 0.02*sCausalMoon + 0.03*sEnv1m + 0.03*sVecDir + 0.01*sVecMag
    return Math.round((S + add*Splus) * 100)
  }

  return Math.round(S * 100)
}

// Complete narrative system covering ALL difference fields
// Narrative number formatting
function narrNumber(v, {abs=false, unit='', dp=1, sig=null} = {}) {
    if (v == null || isNaN(v)) return 'n/a'
    const x = abs ? Math.abs(v) : v
    const s = sig ? Number(x).toExponential(sig-1) : x.toFixed(dp)
    return unit ? `${s} ${unit}` : s
}

// Angle description helper
function anglePhrase(d) {
    const a = Math.abs(((d+540)%360)-180); // wrap to [0,180]
    if (a < 1) return 'the same spot on the ring'
    if (Math.abs(a-90) < 2) return 'a quarter-orbit apart'
    if (Math.abs(a-180) < 2) return 'opposite sides of the Sun'
    return `separated by ${a.toFixed(1)}° around the orbit`
}

// Tidal field mood description
function tidalFieldMood(idx) { 
    return idx>=70 ? 'strong solar–lunar tidal field' : 
           idx>=40 ? 'moderate tidal field' : 'quiet tidal field'; 
}

// Solar/lunar tidal field contribution description
function leanPhrase(rel, who) {
    if (rel >= 4)  return `field from the ${who.toLowerCase()} stronger than its annual average (+${rel.toFixed(1)}%)`
    if (rel <= -4) return `field from the ${who.toLowerCase()} weaker than average (−${Math.abs(rel).toFixed(1)}%)`
    return null
}

// Complete narrative generator covering ALL difference fields
function makeNarrative(A, B, score, diffs) {
    const state = score>=70 ? 'almost the same sky and pull' : 
                 score>=40 ? 'similar light, gently different pull' : 
                 'very different light and pull'
    const angle = anglePhrase(diffs.dAngle || 0)
    const years = (diffs.dYear > 0) ? `, ${diffs.dYear} lap${diffs.dYear > 1 ? 's' : ''} later` : ''

    // A-state context
    const aMood = tidalFieldMood(A.states?.tides?.index0to100 || 50)
    const aSolar = leanPhrase(A.states?.tides?.solarRelPct || 0, 'Sun')
    const aLunar = (() => {
        const r = A.states?.tides?.lunarRelPct || 0
        if (r >= 8)  return `field from the Moon closer/more effective (+${r.toFixed(1)}%)`
        if (r <= -8) return `field from the Moon farther/less effective (−${Math.abs(r).toFixed(1)}%)`
        return null
    })()

    // Build change parts with thresholds
    const parts = []
    
    // Always show light-time
    parts.push(`Sun light-time changed ${narrNumber(diffs.dLightTime_s, {dp:1, unit:'s'})}`)
    
    // Cosmic drift (if significant)
    if (Math.abs(diffs.dDrift_AU || 0) >= 0.1) {
        parts.push(`cosmic drift grew by ${narrNumber(diffs.dDrift_AU, {dp:1, unit:'AU'})}`)
    }
    
    // Tidal field changes
    if (Math.abs(diffs.dIndex || 0) >= 10) {
        const tfDesc = [`combined tidal field index shifted ${Math.round(diffs.dIndex)}/100`]
        if (Math.abs(diffs.dSolarPct || 0) >= 2) tfDesc.push(`solar contribution ${diffs.dSolarPct.toFixed(1)}%`)
        if (Math.abs(diffs.dLunarPct || 0) >= 5) tfDesc.push(`lunar contribution ${diffs.dLunarPct.toFixed(1)}%`)
        parts.push(`the ${tfDesc.join(', ')}`)
    } else {
        parts.push(`combined tidal field stayed similar (${Math.round(diffs.dIndex || 0)}/100)`)
    }
    
    // Sun altitude (if significant)
    if (Math.abs(diffs.dSunAltDeg || 0) >= 10) {
        parts.push(`Sun altitude moved ${narrNumber(diffs.dSunAltDeg, {dp:1, unit:'°'})}`)
    }
    
    // Voxel and time-bias changes (grouped)
    const physParts = []
    if (Math.abs(diffs.dVoxelFrac || 0) >= 1e-6) {
        physParts.push(`we traversed ${Number(diffs.dVoxelFrac).toExponential(2)} of a light-second`)
    }
    if (Math.abs(diffs.dNs_grav || 0) >= 1e-3) {
        physParts.push(`the 1-s tidal time-bias changed ${narrNumber(diffs.dNs_grav, {sig:3, unit:'ns/s'})}`)
    }
    if (physParts.length > 0) parts.push(physParts.join(' and '))
    
    // Kinematic changes
    const kinParts = []
    if (Math.abs(diffs.dNs_kin || 0) >= 1e-3) {
        kinParts.push(`the rotation/latitude rate changed ${narrNumber(diffs.dNs_kin, {sig:3, unit:'ns/s'})}`)
    }
    if (Math.abs(diffs.dNs_comb || 0) >= 1e-3) {
        kinParts.push(`giving a combined rate shift of ${narrNumber(diffs.dNs_comb, {sig:3, unit:'ns/s'})}`)
    }
    if (kinParts.length > 0) parts.push(`kinematically, ${kinParts.join(', ')}`)
    
    // Orbital geometry
    const geomParts = []
    if (typeof diffs.dOmegaDeg === 'number') geomParts.push(`Δω = ${angleSmartDeg(diffs.dOmegaDeg)}`)
    if (typeof diffs.dVarpiDeg === 'number') geomParts.push(`Δϖ = ${angleSmartDeg(diffs.dVarpiDeg)}`)
    if (geomParts.length > 0) parts.push(`year geometry rotated: ${geomParts.join(', ')}`)
    
    // Perihelion info (always show if available)
    if (diffs.periA || diffs.periB) {
        parts.push(`perihelion A: ${diffs.periA || 'n/a'} → B: ${diffs.periB || 'n/a'}`)
    }

    // Assemble complete narrative
    const dayInfo = A.states?.dayPhase || 'unknown'
    const sunAlt = A.states?.sunAltDeg ? A.states.sunAltDeg.toFixed(1) : 'n/a'
    const clockRate = A.states?.voxel?.combined_ns_per_1s || 'n/a'
    const leans = [aSolar, aLunar].filter(Boolean)
    const leanText = leans.length > 0 ? leans.join(' and ') : 'solar–lunar contributions near their averages'

    return [
        `"${A.name}" was captured in ${state} to "${B.name}", ${angle}${years}.`,
        `At A the sky was ${dayInfo} (${sunAlt}°) with a ${aMood}; ${leanText}.`,
        `The local clock ran at ~${clockRate} ns/s (grav+kin).`,
        `Since then, ${parts.join('; ')}.`
    ].join(' ')
}

// Zen sentences for similarity scoring
const zenSentences = [
  // [90+ range] Almost identical moments
  'Time flows like a river returning to its source.',
  'The cosmos breathes the same breath twice.',
  'What was, is, in the eternal dance of spheres.',
  
  // [70-89 range] Very similar
  'Shadows shift, but the light remains constant.',
  'The wheel turns, yet the spoke remembers its place.',
  'Echoes of the same celestial song.',
  
  // [50-69 range] Moderately similar  
  'The tide ebbs and flows, following ancient rhythms.',
  'Stars align in familiar, yet distant patterns.',
  'Time weaves similar threads in its tapestry.',
  
  // [30-49 range] Somewhat different
  'The sun climbs different peaks of the same mountain.',
  'Seasons change, carrying whispers of what was.',
  'The cosmic dance steps to a varied rhythm.',
  
  // [10-29 range] Quite different
  'New currents flow where old rivers once ran.',
  'The celestial wheel finds unfamiliar ground.',
  'Time carves fresh paths through the void.',
  
  // [0-9 range] Very different
  'The cosmos dreams a completely different dream.',
  'New stars rise where others have set.',
  'Time begins a fresh chapter in its eternal book.'
]

// Zen line generator
function zenSentence(score, A, B) {
  const angle = cycDeltaDeg(A.homeAngleDeg, B.homeAngleDeg).toFixed(1)
  const tideDiff = Math.abs(A.states.tides.index0to100 - B.states.tides.index0to100)
  const phaseA = A.states.dayPhase, phaseB = B.states.dayPhase
  const moonGap = Math.abs(A.states.lunar.phasePct - B.states.lunar.phasePct)

  if (score >= 70) {
    return `Same light, same tidal pull: ${phaseA} echoes ${phaseB}; only ${angle}° apart and field indices within ${tideDiff}—the moments rhyme.`
  } else if (score >= 40) {
    return `The sky rhymes but doesn't repeat: ${phaseA} vs ${phaseB}, ${angle}° around the Sun, lunar face Δ${moonGap}%.`
  } else {
    return `Different rooms of the same house: ${phaseA} → ${phaseB}, ${angle}° apart; tidal field and Moon keep their own counsel.`
  }
}

// Horizons proxy endpoint and BCRS/GCRS helpers
const API = { VECTORS: '/api/horizons/vectors' }

// Fetch BCRS (Sun/Earth/Moon/Planets) + GCRS RA/Dec for a timestamp
async function fetchBCRS(tsISO){
  // Try extended endpoint with planets first, fallback to basic Sun/Earth/Moon
  try {
    const res = await fetch(`${API.VECTORS}?ts=${encodeURIComponent(tsISO)}&targets=199,299,499,599,699,799,899`)
    if (res.ok) return res.json()
  } catch {}
  
  // Fallback to basic endpoint
  const res = await fetch(`${API.VECTORS}?ts=${encodeURIComponent(tsISO)}`)
  if (!res.ok) throw new Error('Horizons vectors failed')
  return res.json()
}

// RA/Dec -> Alt/Az at site (deg). Uses UTC ts.
function raDecToAltAz(ts, latDeg, lonDeg, raDeg, decDeg){
  const RAD=Math.PI/180
  const jd = ts/86400000 + 2440587.5
  const T0 = (jd - 2451545.0)/36525
  const GMST = (280.46061837 + 360.98564736629*(jd-2451545) + 0.000387933*T0*T0 - (T0*T0*T0)/38710000) % 360
  const LST = ((GMST + lonDeg) % 360) * RAD
  const H = LST - (raDeg*RAD)
  const phi = latDeg*RAD
  const dec = decDeg*RAD
  const alt = Math.asin(Math.sin(phi)*Math.sin(dec) + Math.cos(phi)*Math.cos(dec)*Math.cos(H))
  const az  = Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(phi) - Math.tan(dec)*Math.cos(phi))
  let azDeg = az*180/Math.PI; if (azDeg<0) azDeg+=360
  return { altDeg: alt*180/Math.PI, azDeg }
}

// Speed & light-second voxel helpers
const C_kms = 299792.458
const V_Earth_orbit_kms = 29.78; // mean barycentric orbital speed (ok for UI)
const V_surface_kms_eq   = 0.465; // rotation at equator (optional component)
function voxelFraction(speed_kms){ return +(speed_kms / C_kms); } // unitless fraction of 1 ls in 1 s

// Retarded-time event badges (optional user events)
const userEvents = [ /* { name:'X-class flare', when:'2025-09-24T12:00:00Z' } */ ]

function retardedBadge(tsISO, sunLt_s){
  const t = Date.parse(tsISO), arrived = userEvents
    .map(e => ({ name:e.name, dt_s: (t - Date.parse(e.when))/1000 - sunLt_s }))
    .filter(x => Math.abs(x.dt_s) < 3600); // within ±1h of arrival
  return arrived
}

// ---------- narrative helpers ----------
function relState(score){
  return score>=70 ? 'almost the same light and tidal pull'
       : score>=40 ? 'similar light, gently different pull'
                   : 'very different light and pull'
}
function anglePhrase(dAngle){
  const a = cycDeltaDeg(0, dAngle)
  if (a < 1) return 'the same spot on the ring'
  if (Math.abs(a-90) < 2) return 'a quarter-orbit apart'
  if (Math.abs(a-180) < 2) return 'opposite sides of the Sun'
  return `separated by ${a.toFixed(1)}° around the orbit`
}
function tidalFieldMood(idx){
  return idx>=70 ? 'a strong solar–lunar tidal field'
       : idx>=40 ? 'a moderate tidal field'
                 : 'a quiet tidal field'
}
function leanPhrase(rel, who){
  if (rel>=4)  return `field from the ${who} stronger than its average (+${rel.toFixed(1)}%)`
  if (rel<=-4) return `field from the ${who} weaker than average (−${Math.abs(rel).toFixed(1)}%)`
  return null
}
function num(x, dp=1, unit=''){
  if (x==null || isNaN(x)) return 'n/a'
  const v = +x
  const maxDp = 6
  let d = dp
  let s = v.toFixed(d)
  // If rounding to "0.0" but value isn't zero, increase decimals until a non-zero digit appears or maxDp reached
  while (d < maxDp && Math.abs(+s) === 0 && v !== 0){
    d++
    s = v.toFixed(d)
  }
  // Normalize -0.0 to 0 with the chosen precision
  if (Math.abs(+s) === 0) s = (0).toFixed(d)
  return `${s}${unit}`
}
function numSig(x, sig=3, unit=''){ return (x==null||isNaN(x))?'n/a':`${(+x).toExponential(sig)}${unit}`; }

// Nice number formatting (fixed for readable range, exponential for extremes)
function nice(x, unit=''){
  if (x==null||isNaN(x)) return 'n/a'
  const v = +x
  const s = (Math.abs(v) >= 1e-3 && Math.abs(v) < 1e4) 
    ? v.toFixed(3).replace(/\.?0+$/,'')
    : v.toExponential(2)
  return `${s}${unit}`
}

// Angle smart formatter: use arcseconds for tiny angles, else degrees with 3 dp
function angleSmartDeg(deg){
  if (deg==null || isNaN(deg)) return 'n/a'
  const v = +deg; const ad = Math.abs(v)
  if (ad < 1e-3){
    const as = v*3600; // arcseconds
    const aas = Math.abs(as)
    const dp = aas >= 0.1 ? 1 : (aas >= 0.01 ? 2 : 3)
    // Avoid "-0.0" and ensure visibility of tiny non-zero values
    let s = as.toFixed(dp)
    if (Math.abs(+s) === 0 && as !== 0){
      const dp2 = Math.min(dp+1, 4)
      s = as.toFixed(dp2)
    }
    if (Math.abs(+s) === 0) s = (0).toFixed(dp)
    return `${s}″`
  }
  return `${v.toFixed(3)}°`
}

// Accurate day-phase classification by sun altitude
function dayPhaseTag(alt){
  if (alt >= 6)  return 'daytime'
  if (alt >= 0)  return 'golden hour'
  if (alt >= -6) return 'civil twilight'
  if (alt >= -12) return 'nautical twilight'
  if (alt >= -18) return 'astro twilight'
  return 'night'
}

// Build a timestamp for local *wall clock* time (no UTC 'Z' shift)
function tsLocal(y, m, d, hh=13, mm=0, ss=0){
  // y, m=1..12, d are calendar numbers; returns ms since epoch
  return new Date(y, m-1, d, hh, mm, ss).getTime()
}

// Guard against mixed inputs (number vs ISO string)
function toTs(input){
  if (typeof input === 'number') return input
  return new Date(input).getTime(); // ISO with ±HH:MM offset → correct UTC epoch
}

// Build a human paragraph from two records + similarity score + diffs you already compute
function makeNarrative(A, B, score, diffs, extras={}){
  // Lead
  const lead = `"${A.name}" was captured in ${relState(score)} to "${B.name}", ` +
               `${anglePhrase(diffs.dAngle)}${diffs.dYear>0?`, ${diffs.dYear} lap${diffs.dYear>1?'s':''} later`:''}.`

  // A-moment context
  const mood = tidalFieldMood(A.states.tides.index0to100)
  const leanS = leanPhrase(A.states.tides.solarRelPct, 'Sun')
  const leanM = (()=>{
    const r = A.states.tides.lunarRelPct
    if (r>=8)  return `field from the Moon closer/more effective (+${r.toFixed(1)}%)`
    if (r<=-8) return `field from the Moon farther/less effective (−${Math.abs(r).toFixed(1)}%)`
    return null
  })()
  const leans = [leanS, leanM].filter(Boolean).join(' and ') || 'solar–lunar contributions near their averages'
  const aLine = `At A the sky was ${dayPhaseTag(A.states.sunAltDeg)} (${A.states.sunAltDeg.toFixed(1)}°) with ${mood}; ${leans}. ` +
                `The local clock ran at ~${nice(A.states.voxel.combined_ns_per_1s,' ns/s')} (grav+kin). `

  // Changes A→B (use thresholds to avoid clutter)
  const parts = []
  parts.push(`Sun light-time changed ${num(diffs.dLightTime_s,1,' s')}`)
  const driftMag = Math.abs(diffs.dDrift_AU||0)
  if (driftMag >= 0.1) parts.push(`cosmic drift grew by ${driftMag.toFixed(1)} AU`)
  if (Math.abs(diffs.dIndex||0) >= 10) parts.push(`combined tidal-field index shifted ${Math.round(diffs.dIndex)}/100`)
  else parts.push(`combined tidal-field index stayed similar (${Math.round(diffs.dIndex||0)}/100)`)
  if (Math.abs(diffs.dSolarPct||0) >= 2) parts.push(`solar contribution ${num(diffs.dSolarPct,1,'%')}`)
  if (Math.abs(diffs.dLunarPct||0) >= 5) parts.push(`lunar contribution ${num(diffs.dLunarPct,1,'%')}`)
  if (Math.abs(diffs.dSunAltDeg||0) >= 10) parts.push(`Sun altitude moved ${num(diffs.dSunAltDeg,1,'°')}`)
  if (Math.abs(diffs.dVoxelFrac||0) >= 1e-6) parts.push(`we traversed ${nice(diffs.dVoxelFrac)} of a light-second`)
  if (Math.abs(diffs.dNs_grav||0) >= 1e-3) parts.push(`1-s tidal time-bias changed ${nice(diffs.dNs_grav,' ns/s')}`)
  if (Math.abs(diffs.dNs_kin||0) >= 1e-3) parts.push(`rotation/latitude rate changed ${nice(diffs.dNs_kin,' ns/s')}`)
  if (Math.abs(diffs.dNs_comb||0) >= 1e-3) parts.push(`combined rate shifted ${nice(diffs.dNs_comb,' ns/s')}`)
  if (typeof diffs.dOmegaDeg === 'number') parts.push(`Δω = ${angleSmartDeg(diffs.dOmegaDeg)}`)
  if (typeof diffs.dVarpiDeg === 'number') parts.push(`Δϖ = ${angleSmartDeg(diffs.dVarpiDeg)}`)
  if (extras.periA || extras.periB) parts.push(`perihelion A: ${extras.periA||'n/a'} → B: ${extras.periB||'n/a'}`)

  // 1) Causal/envelope line (bounded % or n/a)
  let envBits = []
  if (diffs.overSun!=null)  envBits.push(`Sun overlap ${(diffs.overSun*100).toFixed(0)}%`)
  if (diffs.overMoon!=null) envBits.push(`Moon ${(diffs.overMoon*100).toFixed(0)}%`)
  if (typeof diffs.envPct_1m === 'number') envBits.push(`1-min envelope Δ ${diffs.envPct_1m.toFixed(1)}% (of daily span)`)
  const envLine = envBits.length ? ` Their causal/envelope match: ${envBits.join(', ')}.` : ''

  // 2) Direction/phase line (only if meaningful)
  const vecBits = []
  if (typeof diffs.dNetBearing === 'number') vecBits.push(`net push rotated ${diffs.dNetBearing.toFixed(1)}°`)
  if (typeof diffs.dNetMag === 'number' && Math.abs(diffs.dNetMag) >= 0.5) vecBits.push(`magnitude changed ${diffs.dNetMag.toFixed(1)} µGal`)
  if (typeof diffs.dPhaseSyn === 'number') vecBits.push(`Sun–Moon phase shifted ${diffs.dPhaseSyn.toFixed(1)}°`)
  if (typeof diffs.dP2sun === 'number' || typeof diffs.dP2moon === 'number')
    vecBits.push(`geometry P₂: Sun ${(diffs.dP2sun||0).toFixed(3)}, Moon ${(diffs.dP2moon||0).toFixed(3)}`)
  const vecLine = vecBits.length ? ` Their tide's direction/phase changed: ${vecBits.join(', ')}.` : ''

  // 3) Slow background line
  const longBits = []
  if (typeof diffs.dNodal === 'number' || typeof diffs.dPerigee === 'number')
    longBits.push(`lunar long cycles: nodes Δ${(diffs.dNodal||0).toFixed(1)}°, perigee Δ${(diffs.dPerigee||0).toFixed(1)}°`)
  if (typeof diffs.dEqElev_mm === 'number' && Math.abs(diffs.dEqElev_mm) >= 0.1)
    longBits.push(`equivalent elevation ${Math.abs(diffs.dEqElev_mm).toFixed(2)} mm`)
  if (typeof diffs.planetary_nGal === 'number' && Math.abs(diffs.planetary_nGal) >= 0.1)
    longBits.push(`planetary add-ons ≈ ${Math.abs(diffs.planetary_nGal).toExponential(2)} nGal`)
  if (typeof diffs.dSSB_km === 'number' || typeof diffs.dReflex_mps === 'number')
    longBits.push(`Sun–SSB: offset Δ${Math.abs(diffs.dSSB_km||0).toFixed(0)} km, reflex Δ${Math.abs(diffs.dReflex_mps||0).toFixed(2)} m/s`)
  const longLine = longBits.length ? ` Slow background shifted too: ${longBits.join(', ')}.` : ''

  // 4) Light-band one-liner
  let bandsLine = ''
  if (A.states.lightBands && B.states.lightBands){
    const dMs = wrapMs(B.states.lightBands.msFromGreenwich - A.states.lightBands.msFromGreenwich)
    const km = dMs * C_km_per_s / 1000
    const zA = A.states.lightBands.zoneIndex, zB = B.states.lightBands.zoneIndex
    const dz = (zB - zA)
    bandsLine = ` On the Earth dial (light-time bands), their longitudes differ by ${dMs.toFixed(2)} ms (≈ ${km.toFixed(0)} km) — time zones ${dz>=0?'+':''}${dz} in ms-units.`
  }

  const change = `Since A → B, ${parts.join(', ')}.`
  return `<div class="story"><span class="lead">${lead}</span> ${aLine}${change}${envLine}${vecLine}${longLine}${bandsLine}</div>`
}

// Planetary tidal context - tiny but real contributions
// Constants
const AU_km = 149_597_870.7
const AUperDay_to_mps = (AU_km*1000) / 86400;  // ≈ 1.731456836e6 m/s

// GM (μ = G*M) in SI (m^3/s^2). Using μ cancels G; ratios == mass ratios.
const MU = {
  sun:     1.32712440018e20,
  moon:    4.9048695e12,
  mercury: 2.2032e13,
  venus:   3.24859e14,
  earth:   3.986004354e14,
  mars:    4.282837e13,
  jupiter: 1.26686534e17,
  saturn:  3.7931187e16,
  uranus:  5.793939e15,
  neptune: 6.836529e15
}

// Map Horizons numeric IDs to labels & μ
const MU_BY_ID = new Map([
  [199, MU.mercury], [299, MU.venus], [399, MU.earth], [499, MU.mars],
  [599, MU.jupiter], [699, MU.saturn], [799, MU.uranus], [899, MU.neptune]
])

/**
 * Compute tiny planetary tidal add-ons at Earth (nGal) and the Sun's barycentric reflex.
 * @param {Object} args
 * @param {{r_AU:number[], v_AUperD:number[]}} args.earth  // heliocentric
 * @param {{name:string, id:number, r_AU:number[], v_AUperD:number[]}[]} args.planets // heliocentric
 * @param {{r_AU:number[]}?} args.moon    // optional heliocentric Moon
 * @param {number?} args.moonDistance_km  // if you already have Earth–Moon distance
 */
function planetaryContext({ earth, planets, moon=null, moonDistance_km=null }) {
  // 1) Earth–Moon distance for scaling (km)
  let rMoon_km
  if (moonDistance_km) {
    rMoon_km = moonDistance_km
  } else if (moon?.r_AU) {
    const d_AU = Math.hypot(
      moon.r_AU[0] - earth.r_AU[0],
      moon.r_AU[1] - earth.r_AU[1],
      moon.r_AU[2] - earth.r_AU[2]
    )
    rMoon_km = d_AU * AU_km
  } else {
    // Fallback to mean distance if nothing is provided
    rMoon_km = 384400
  }

  // 2) Planetary tidal add-ons at Earth (peak-equivalent, nGal)
  // Reference: Moon peak ≈ 110 µGal at mean distance.
  const moonPeak_uGal = 110.0

  const list = planets.map(p => {
    const mu_p = MU_BY_ID.get(p.id)
    if (!mu_p) return { name: p.name, nGal: 0, relMoonPct: 0 }

    // Earth–planet distance (AU -> km)
    const dE_AU = Math.hypot(
      p.r_AU[0] - earth.r_AU[0],
      p.r_AU[1] - earth.r_AU[1],
      p.r_AU[2] - earth.r_AU[2]
    )
    const r_pk_km = dE_AU * AU_km

    // Peak-equivalent tidal amplitude scales as (μ_p/μ_moon)*(r_moon/r_p)^3 times the Moon's peak
    const ratio = (mu_p / MU.moon) * Math.pow(rMoon_km / r_pk_km, 3)
    const uGal = moonPeak_uGal * ratio
    const nGal = uGal * 1000; // 1 µGal = 1000 nGal

    return {
      name: p.name,
      nGal: +nGal.toExponential(2),
      relMoonPct: +(ratio * 100).toFixed(3)   // % of Moon's peak
    }
  })

  const total_nGal = +list.reduce((s,x)=>s + (isFinite(x.nGal)? +x.nGal : 0), 0).toExponential(2)

  // 3) Sun–SSB offset & Sun reflex speed (use μ-weighted sums in heliocentric frame)
  // R_ssb = Σ μ_i r_i / (μ_sun + Σ μ_i), V_ssb = Σ μ_i v_i / (μ_sun + Σ μ_i)
  const sumMu = planets.reduce((s,p)=> s + (MU_BY_ID.get(p.id) || 0), 0)
  const denom = MU.sun + sumMu

  let Rx=0, Ry=0, Rz=0, Vx=0, Vy=0, Vz=0
  for (const p of planets) {
    const mu = MU_BY_ID.get(p.id) || 0
    Rx += mu * p.r_AU[0]
    Ry += mu * p.r_AU[1]
    Rz += mu * p.r_AU[2]
    Vx += mu * p.v_AUperD[0]
    Vy += mu * p.v_AUperD[1]
    Vz += mu * p.v_AUperD[2]
  }
  // Position in AU relative to Sun
  const R_AU = Math.hypot(Rx/denom, Ry/denom, Rz/denom)
  const ssbOffset_km = +(R_AU * AU_km).toFixed(0)

  // Velocity in AU/day -> m/s
  const V_AUperD = Math.hypot(Vx/denom, Vy/denom, Vz/denom)
  const sunReflex_mps = +((V_AUperD) * AUperDay_to_mps).toFixed(3)

  return { tidalAddons_nGal: { total_nGal, list }, ssbOffset_km, sunReflex_mps }
}

// Horizontal tide & bearing from alt/az (we already compute vertical via zenithFactor)
function tideVectorComponents(uGalScale, rRef, rNow, altDeg, azDeg){
  const k = uGalScale * Math.pow(rRef / rNow, 3)
  const z = (90 - altDeg) * Math.PI/180
  const av = k * Math.abs(3*Math.cos(z)**2 - 1);           // vertical magnitude (µGal)
  const ah = k * Math.abs(3*Math.cos(z)*Math.sin(z));      // horizontal magnitude (µGal)
  const bearing = (azDeg + (Math.cos(z) >= 0 ? 0 : 180)) % 360; // toward body or opposite if below horizon
  return { av_uGal:+av.toFixed(1), ah_uGal:+ah.toFixed(1), bearing:+bearing.toFixed(0) }
}

// Solar azimuth (rough; consistent with your sunAltDeg model)
function sunAzDeg(ts, lat, lon){
  // reuse the internals of sunAltDeg to get H, delta
  const date = new Date(ts)
  const n = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(),0,0))/86400000)
  const RAD = Math.PI/180
  const L = (280.46 + 0.9856474*n) % 360
  const g = (357.528 + 0.9856003*n) % 360
  const lambda = L + 1.915*Math.sin(g*RAD) + 0.020*Math.sin(2*g*RAD)
  const epsilon = 23.439 - 0.0000004*n
  const delta = Math.asin(Math.sin(epsilon*RAD)*Math.sin(lambda*RAD)); // declination
  const timeUTC = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600
  const eqTime =  - (1.915*Math.sin(g*RAD) + 0.020*Math.sin(2*g*RAD) - 2.466*Math.sin(2*lambda*RAD) + 0.053*Math.sin(4*lambda*RAD)); // ~min
  const tst = (timeUTC*60 + eqTime + lon*4) / 4
  const H = ((tst - 12)*15) * RAD; // hour angle
  const phi = lat*RAD
  const az = Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(phi) - Math.tan(delta)*Math.cos(phi)); // rad
  let deg = az*180/Math.PI
  if (deg < 0) deg += 360
  return deg
}

// Tidal potential proxy and 1-second average around timestamp
// Returns {Ubar, nsPerSecond} where nsPerSecond = Ubar/c^2 * 1s in nanoseconds
function oneSecondTidalPotential(ts, lat, lon){
  const rSun_AU_now = earthSunDistance(ts)
  const sunAlt_now  = sunAltDeg(ts, lat, lon)
  const sunAz_now   = sunAzDeg(ts, lat, lon)

  const mc_now = moonContext(ts, lat, lon)

  // Simple normalized potential pieces with relative scalings so Moon dominates tide
  const P2 = z => (3*Math.cos(z)**2 - 1)/2
  function Ut_at(time){
    const rS = earthSunDistance(time)
    const sAlt = sunAltDeg(time, lat, lon)
    const zS = (90 - sAlt) * Math.PI/180

    const mC  = moonContext(time, lat, lon)
    const zM  = (90 - mC.altDeg) * Math.PI/180

    const KS = 0.5;  // Sun scale
    const KM = 1.1;  // Moon scale (dominates)
    return KS*Math.pow(1/rS,3)*P2(zS) + KM*Math.pow(384400/mC.distance_km,3)*P2(zM); // arbitrary J/kg scale
  }

  const U1 = Ut_at(ts - 500); // t-0.5 s
  const U2 = Ut_at(ts + 500); // t+0.5 s
  const Ubar = 0.5*(U1+U2)

  const nsPerSecond = Ubar / (299792458**2) * 1e9; // ns over 1 s
  return { Ubar, nsPerSecond: +nsPerSecond.toExponential(3) }
}

// Kinematic dilation (ns over 1 s) from speed v (m/s)
function kinematic_ns_per_1s(latDeg){
  const v_orb = 29780;                      // m/s
  const v_rot = 465 * Math.cos(latDeg*Math.PI/180); // m/s
  const v2 = v_orb*v_orb + v_rot*v_rot
  const ns = (v2/(2*299792458**2)) * 1e9;   // ns per second
  return +ns.toFixed(3)
}

/* =========================
   Record build from a file name or timestamp
========================= */
const store = {
  items: [],            // array of records (see example schema)
  selected: new Set(),  // ids of selected items
  view: { haloMode: 'year', frame: 'home' },
  refs: {},             // runtime refs (scene objects)
  defaultSite: null     // user-set default location
}

async function buildRecordFromTimestamp(name, ts, opts={}) {
  const id = uid()
  const year = new Date(ts).getUTCFullYear()
  const angle = heliocentricLongitude(ts); // radians
  const r = earthSunDistance(ts)
  const angleDeg = angle*180/Math.PI
  const dist = r; // AU

  // location defaults (user can set a global location)
  const lat = (opts.lat ?? store.defaultSite?.lat ?? 34.05)
  const lon = (opts.lon ?? store.defaultSite?.lon ?? -118.25)
  const tz = opts.tz || store.defaultSite?.tz; // Store capture timezone

  // Try precise ephemerides (BCRS/GCRS); fallback to approximations on failure
  let eph = null
  try { eph = await fetchBCRS(new Date(ts).toISOString()); } catch { /* keep null */ }

  // SUN distance & light-time
  let rSun_AU, sunLight_s, sunAlt, sunAz
  if (eph){
    rSun_AU   = Math.hypot(...eph.earth.r_AU); // heliocentric Earth distance (≈1 AU)
    sunLight_s= eph.sunObs.lt_s;               // Earth observer to Sun light-time
    const aa  = raDecToAltAz(ts, lat, lon, eph.sunObs.ra_deg, eph.sunObs.dec_deg)
    sunAlt = aa.altDeg; sunAz = aa.azDeg
  } else {
    rSun_AU   = earthSunDistance(ts)
    sunLight_s= +(rSun_AU * 149597870.7 / 299792.458); // km / (km/s)
    sunAlt    = sunAltDeg(ts, lat, lon)
    sunAz     = sunAzDeg(ts, lat, lon)
  }

  // MOON distance, light-time, alt/az
  let rMoon_km, moonLight_s, moonAlt, moonAz, moonPhasePct, moonPerigeeProx, moonRelPct
  if (eph){
    rMoon_km   = eph.moonObs.range_AU * 149597870.7
    moonLight_s= eph.moonObs.lt_s
    const aa   = raDecToAltAz(ts, lat, lon, eph.moonObs.ra_deg, eph.moonObs.dec_deg)
    moonAlt = aa.altDeg; moonAz = aa.azDeg
    // Keep your existing illumination estimates
    const mctx = moonContext(ts, lat, lon)
    moonPhasePct = mctx.phasePct; moonPerigeeProx = mctx.perigeeProx; moonRelPct = mctx.lunarRelPct
  } else {
    const mctx = moonContext(ts, lat, lon)
    rMoon_km = mctx.distance_km; moonLight_s = rMoon_km/299792.458
    moonAlt  = mctx.altDeg; moonAz = 0; // (approx omitted earlier)
    moonPhasePct = mctx.phasePct; moonPerigeeProx = mctx.perigeeProx; moonRelPct = mctx.lunarRelPct
  }

  // Solar tide: relative % and µGal, now with proper alt/az
  const sunZenF = zenithFactor(sunAlt)
  const aSunNow = TIDE.A_sun_uGal * Math.pow(TIDE.rSunRef_AU / rSun_AU, 3) * sunZenF
  const solarRelPct = +((Math.pow(TIDE.rSunRef_AU / rSun_AU, 3) - 1)*100).toFixed(1)

  // Lunar tide:
  const moonZenF = zenithFactor(moonAlt)
  const aMoonNow = TIDE.A_moon_uGal * Math.pow(TIDE.rMoonRef_km / rMoon_km, 3) * moonZenF

  // Build a daily sample to normalize index to that day's local max
  const startUTC = Date.UTC(new Date(ts).getUTCFullYear(), new Date(ts).getUTCMonth(), new Date(ts).getUTCDate(), 0,0,0)
  let maxDay = 1
  for (let minutes=0; minutes<1440; minutes+=10){
    const t = startUTC + minutes*60000
    const sAlt = eph ? sunAlt : sunAltDeg(t, lat, lon); // Use BCRS data if available
    const sZF  = zenithFactor(sAlt)
    const rS   = eph ? rSun_AU : earthSunDistance(t)
    const aS   = TIDE.A_sun_uGal * Math.pow(TIDE.rSunRef_AU / rS, 3) * sZF

    const mc   = eph ? {altDeg: moonAlt, distance_km: rMoon_km} : moonContext(t, lat, lon)
    const mZF  = zenithFactor(mc.altDeg)
    const aM   = TIDE.A_moon_uGal * Math.pow(TIDE.rMoonRef_km / mc.distance_km, 3) * mZF

    maxDay = Math.max(maxDay, Math.abs(aS + aM))
  }
  const tideIndex = Math.round(100 * Math.min(1, Math.abs(aSunNow + aMoonNow) / maxDay))

  // --- Light-second voxel context ---
  const AU = 149597870.7; // km per AU
  // crude barycentric speed: orbital + optional surface rotation projection (keep orbital for clarity)
  const v_kms = V_Earth_orbit_kms; // you can add a few 0.1 km/s for rotation if you like
  const voxelFrac = +voxelFraction(v_kms).toExponential(2); // fraction of 1 light-second in 1 s

  // 1-second tidal potential average and clock bias
  const oneSec = oneSecondTidalPotential(ts, lat, lon)

  // Kinematic dilation and combined rate
  const kinNS = kinematic_ns_per_1s(lat)
  const combNS = +(kinNS + parseFloat(oneSec.nsPerSecond)).toFixed(3)

  // Full vector components for both bodies
  const tvSun  = tideVectorComponents(TIDE.A_sun_uGal,  TIDE.rSunRef_AU,   rSun_AU,   sunAlt,  sunAz || 0)
  const tvMoon = tideVectorComponents(TIDE.A_moon_uGal, TIDE.rMoonRef_km,  rMoon_km,  moonAlt, moonAz || 0)

  // Planetary context (if available)
  let planetaryCtx = null
  if (eph && eph.planets && eph.planets.length > 0) {
    planetaryCtx = planetaryContext({
      earth: eph.earth,
      moon: eph.moon,
      moonDistance_km: rMoon_km,
      planets: eph.planets
    })
  }

  const record = {
    id, name, when: new Date(ts).toISOString(), tz: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
    where: { lat, lon, alt_m: (opts.alt_m ?? 120) },
    year,
    homeAngleDeg: +angleDeg.toFixed(2),
    cosmic: { x_AU: +(Math.cos(angle)*dist).toFixed(3), y_AU: +(Math.sin(angle)*dist).toFixed(3), z_AU: 0,
              drift_since_AU: +(((Date.now()-ts)/86400000/365.25) * 46 /* AU/yr */).toFixed(1) },
    states: {
      dayPhase: dayPhaseTag(sunAlt),
      sunAltDeg: +sunAlt.toFixed(1),
      moonAltDeg: +moonAlt.toFixed(1),
      dayLengthMin: null,
      season: { daysFromSolstice: null, sunDeclDeg: null },
      equationOfTimeMin: null,
      lunar: { phasePct: moonPhasePct, perigeeProx: moonPerigeeProx },
      tides: {
        solarRelPct,
        lunarRelPct: moonRelPct,
        sun_uGal: +aSunNow.toFixed(1),
        moon_uGal: +aMoonNow.toFixed(1),
        index0to100: tideIndex
      },
      voxel: {
        sunLightTime_s: +sunLight_s.toFixed(1),
        moonLightTime_s: +moonLight_s.toFixed(1),
        voxelFraction: voxelFrac,
        ns_per_1s: oneSec.nsPerSecond,
        kin_ns_per_1s: kinNS,
        combined_ns_per_1s: combNS
      },
      tideVec: {
        sun: tvSun,    // {av_uGal, ah_uGal, bearing}
        moon: tvMoon
      },
      frames: { 
        geometry: eph ? 'BCRS/ICRF (Sun-centered via Horizons)' : 'Approx heliocentric',
        site: 'GCRS (local site sky/tides)' 
      },
      planetary: planetaryCtx ? {
        tidalAddons_nGal: planetaryCtx.tidalAddons_nGal,
        ssbOffset_km: planetaryCtx.ssbOffset_km,
        sunReflex_mps: planetaryCtx.sunReflex_mps
      } : null
    }
  }

  // --- Causal & envelope metrics ---
  // Retarded-time inputs already exist: states.voxel.sunLightTime_s / moonLightTime_s
  const Ubar_1m = envelopeAverage_U(ts, lat, lon, 60)
  const Ubar_1h = envelopeAverage_U(ts, lat, lon, 3600)
  const TS_envelope_1m = +(60 / Math.max(sunLight_s, moonLight_s)).toFixed(2)
  const TS_envelope_1h = +(3600 / Math.max(sunLight_s, moonLight_s)).toFixed(2)

  // P2 factors (geometry, not just altitude) - safe with altitude clamping
  const P2sun  = +P2_fromAltDeg(sunAlt).toFixed(3)
  const P2moon = +P2_fromAltDeg(moonAlt).toFixed(3)

  // Sun–Moon synodic phase and long-cycle tags
  const lamS = sunEclipticLongitudeDeg(ts)
  const lamM = moonEclipticLongitudeDeg_fast(ts)
  const sunMoonPhaseDeg = (((lamM - lamS)+540)%360) - 180; // −180..+180
  const longCycles = lunarLongCyclePhases(ts)

  // Net horizontal tidal vector (you already compute components; sum them)
  const netAh_uGal = +(tvSun.ah_uGal + tvMoon.ah_uGal).toFixed(1)
  const netBearingDeg = (() => {
    // simple weighted average by ah magnitude
    const wS = tvSun.ah_uGal, wM = tvMoon.ah_uGal
    const x = wS*Math.cos(tvSun.bearing*RAD) + wM*Math.cos(tvMoon.bearing*RAD)
    const y = wS*Math.sin(tvSun.bearing*RAD) + wM*Math.sin(tvMoon.bearing*RAD)
    let ang = Math.atan2(y,x)*180/Math.PI; if (ang<0) ang+=360; return +ang.toFixed(0)
  })()

  // Equivalent elevation from average potential (1 s window used)
  // If your U is a proxy (not J/kg), mark as normalized.
  // Set IS_PHYSICAL_U = true only after you calibrate KS/KM to physical potential.
  const IS_PHYSICAL_U = false

  // Light-time band metrics for this memory
  const msFromGreenwich = wrapMs( longToLightMs(lon || 0, lat || 0) )
  const zoneIndex = Math.round((msFromGreenwich / LT_zone_ms)); // nearest 15° zone (in ms-units)
  const msToNearestZoneEdge = wrapMs(msFromGreenwich % LT_zone_ms, LT_zone_ms/2)

  record.states.lightBands = {
    msFromGreenwich,        // where this memory sits on the dial, in light milliseconds
    zoneIndex,              // integer index of nearest time zone (0=Greenwich)
    msToNearestZoneEdge,    // distance to zone edge, ms
    msPerZone: LT_zone_ms,  // ~5.56 ms
    msFull: LT_full_ms      // ~133.7 ms
  }
  const eqElev_mm = IS_PHYSICAL_U ? +((oneSec.Ubar / 9.80665) * 1000).toFixed(3) : null

  // Store new fields
  record.states.envelope = {
    Ubar_1m, Ubar_1h, TS_envelope_1m, TS_envelope_1h
  }
  record.states.geometryP2 = { P2sun, P2moon }
  record.states.sunMoon = {
    phaseDeg: +sunMoonPhaseDeg.toFixed(1),
    lambdaSunDeg: +lamS.toFixed(1),
    lambdaMoonDeg: +lamM.toFixed(1),
    nodalPhaseDeg: +longCycles.nodalPhaseDeg.toFixed(1),
    perigeePhaseDeg: +longCycles.perigeePhaseDeg.toFixed(1)
  }
  record.states.tideNet = { ah_uGal: netAh_uGal, bearingDeg: netBearingDeg }
  record.states.eqElevation_mm = eqElev_mm;           // null → hidden in UI
  record.states.eqElevation_norm = +((oneSec.Ubar) * 1000).toFixed(2); // "normalized mm-equiv"
  
  return record
}

/* =========================
   Three.js scene
========================= */
let scene, camera, renderer, sunMesh
const halos = new Map(); // year -> THREE.Line (shared)
const markers = new Map(); // id -> Mesh
const labels = new Map(); // id -> THREE.Sprite
const ownHalos = new Map(); // id -> THREE.Line (one per file)

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2(-2, -2); // off-screen
let hoverId = null

// Orbit controls (sun-centered)
const ORBIT = {
  target: new THREE.Vector3(0,0,0),
  spherical: new THREE.Spherical(4.0, Math.PI/2.6, 0), // r, phi, theta
  isDrag:false, lastX:0, lastY:0,
  rotateSpeed: 0.008,  // mouse/touch rotate
  zoomSpeed: 0.95,     // wheel/pinch scaling per step (<1 zoom in)
  minR: 0.5, maxR: 8.0,
  minPhi: 0.15, maxPhi: Math.PI-0.15,
  touches: new Map(), lastPinchDist: null
}
function applyOrbit() {
  const s = ORBIT.spherical
  s.radius = Math.min(ORBIT.maxR, Math.max(ORBIT.minR, s.radius))
  s.phi    = Math.min(ORBIT.maxPhi, Math.max(ORBIT.minPhi, s.phi))
  const p = new THREE.Vector3().setFromSpherical(s).add(ORBIT.target)
  camera.position.copy(p)
  camera.lookAt(ORBIT.target)
}
function syncOrbitFromCamera() {
  const v = camera.position.clone().sub(ORBIT.target)
  ORBIT.spherical.setFromVector3(v)
}

function initScene() {
  const canvas = document.getElementById('renderer')
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // crisp, safe
  resize()
  window.addEventListener('resize', resize)

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.01,
    2000
  )
  camera.position.set(0, 2.4, 4.0)
  camera.lookAt(0, 0, 0);             // 👈 ensure we face the orbit center

  // Initialize orbit controls
  syncOrbitFromCamera()
  applyOrbit()

  // Lights
  const amb = new THREE.AmbientLight(0x223355, 0.7)
  scene.add(amb)
  const dir = new THREE.DirectionalLight(0xffffff, 0.6)
  dir.position.set(3, 3, 2)
  scene.add(dir)

  // Sun
  const sunGeo = new THREE.SphereGeometry(0.08, 32, 32)
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd26a })
  sunMesh = new THREE.Mesh(sunGeo, sunMat)
  scene.add(sunMesh)

  // Add orbital plane ring for reference
  addOrbitalPlane()

  // draw at least one halo so the canvas isn't empty
  ensureYearHalo(new Date().getUTCFullYear());   // 👈 base ellipse

  animate()

  // Mouse hover listeners for labels
  canvas.addEventListener('mousemove', (e)=>{
    const rect = canvas.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  })
  canvas.addEventListener('mouseleave', ()=>{ mouse.set(-2,-2); hoverId=null; updateLabelVisibility(); })

  // Orbit controls - Mouse rotate
  canvas.addEventListener('mousedown', (e)=>{
    ORBIT.isDrag = true; ORBIT.lastX = e.clientX; ORBIT.lastY = e.clientY
  })
  window.addEventListener('mouseup', ()=> ORBIT.isDrag = false)
  window.addEventListener('mousemove', (e)=>{
    if(!ORBIT.isDrag) return
    const dx = e.clientX - ORBIT.lastX
    const dy = e.clientY - ORBIT.lastY
    ORBIT.lastX = e.clientX; ORBIT.lastY = e.clientY
    ORBIT.spherical.theta -= dx * ORBIT.rotateSpeed;        // azimuth
    ORBIT.spherical.phi   -= dy * ORBIT.rotateSpeed;        // polar
    applyOrbit()
  })

  // Wheel zoom
  canvas.addEventListener('wheel', (e)=>{
    e.preventDefault()
    const f = e.deltaY > 0 ? 1/ORBIT.zoomSpeed : ORBIT.zoomSpeed
    ORBIT.spherical.radius *= f
    applyOrbit()
  }, { passive:false })

  // Touch support helpers
  function pinchDistance(touches){
    const a = touches[0], b = touches[1]
    const dx = a.clientX - b.clientX, dy = a.clientY - b.clientY
    return Math.hypot(dx, dy)
  }

  // Touch events
  canvas.addEventListener('touchstart', (e)=>{
    e.preventDefault()
    for(const t of e.changedTouches) ORBIT.touches.set(t.identifier, {x:t.clientX, y:t.clientY})
    if (ORBIT.touches.size === 2) {
      ORBIT.lastPinchDist = pinchDistance([...e.touches])
    }
  },{passive:false})

  canvas.addEventListener('touchmove', (e)=>{
    e.preventDefault()
    const points = [...e.touches]
    if (points.length === 1) {
      // rotate
      const t = points[0]
      const prev = ORBIT.touches.get(t.identifier) || {x:t.clientX, y:t.clientY}
      const dx = t.clientX - prev.x
      const dy = t.clientY - prev.y
      ORBIT.touches.set(t.identifier, {x:t.clientX, y:t.clientY})
      ORBIT.spherical.theta -= dx * ORBIT.rotateSpeed
      ORBIT.spherical.phi   -= dy * ORBIT.rotateSpeed
      applyOrbit()
    } else if (points.length === 2) {
      // pinch zoom
      const d = pinchDistance(points)
      if (ORBIT.lastPinchDist != null) {
        const scale = d > ORBIT.lastPinchDist ? ORBIT.zoomSpeed : 1/ORBIT.zoomSpeed
        ORBIT.spherical.radius *= scale
        applyOrbit()
      }
      ORBIT.lastPinchDist = d
    }
  },{passive:false})

  canvas.addEventListener('touchend', (e)=>{
    for(const t of e.changedTouches) ORBIT.touches.delete(t.identifier)
    if (ORBIT.touches.size < 2) ORBIT.lastPinchDist = null
  },{passive:false})
}
function resize() {
  const host = document.getElementById('scene')
  const canvasEl = renderer?.domElement || document.getElementById('renderer')
  const w = host.clientWidth
  const h = Math.max(360, window.innerHeight - host.getBoundingClientRect().top - 240)
  canvasEl.style.width = w + 'px'
  canvasEl.style.height = h + 'px'
  if (renderer) renderer.setSize(w, h, false)
  if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
}
function animate(){
  requestAnimationFrame(animate)
  
  // hover picking
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects([...markers.values()], false)
  hoverId = intersects.length ? intersects[0].object.userData.id : null
  updateLabelVisibility()
  
  window.ColorDirector?.tick?.(performance.now())

  renderer.render(scene, camera)
}

/* Orbit (ellipse) by year - precise from Horizons */
async function getHalo(year){
  if (halosPrecise.has(year)) return halosPrecise.get(year);     // precise ready
  if (halos.has(year)) return halos.get(year);                   // fallback (approx)

  // show an immediate approx ring so canvas isn't empty
  const approx = (function(){
    const pts= []
    const a=1.0, b=Math.sqrt(1-eEarth*eEarth)*a
    for(let i=0;i<=360;i++){
      const th = i*RAD; pts.push(new THREE.Vector3(a*Math.cos(th),0,b*Math.sin(th)))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    geo.computeBoundingSphere()
    const mat = createOrbitLineMaterial(0.62)
    const line = new THREE.Line(geo, mat)
    line.computeLineDistances()
    prepareOrbitGradientLine(line)
    scene.add(line)
    halos.set(year, line)
    return line
  })()

  // fetch precise elements and hot-swap the geometry when ready
  try{
    const el = await fetchElementsForYear(year)
    const geo = elementsToEllipseGeometry(el, 960)
    const mat = createOrbitLineMaterial(0.85)
    const precise = new THREE.Line(geo, mat)
    precise.computeLineDistances()
    prepareOrbitGradientLine(precise)
    precise.visible = approx.visible;           // respect current mode
    scene.add(precise)
    halosPrecise.set(year, precise)

    // remove approx
    releaseOrbitGradientLine(approx)
    scene.remove(approx)
    halos.delete(year)

    return precise
  }catch(err){
    console.warn('Precise orbit fetch failed for year', year, err)
    return approx
  }
}

async function ensureYearHalo(year){
  const line = await getHalo(year)
  const visible = (store.view.haloMode === 'year')
  line.visible = visible
}

async function warmYears(){
  const years = [...new Set(store.items.map(r=>r.year))]
  console.log('Pre-fetching precise orbits for years:', years)
  await Promise.allSettled(years.map(y=>ensureYearHalo(y)))
  console.log('Orbit pre-fetch complete')
}

/* Marker */
function addMarker(rec){
  // marker sphere
  const geom = new THREE.SphereGeometry(0.015, 16, 16)
  const mat = new THREE.MeshStandardMaterial({ color:0x9ad1ff, emissive:0x0, metalness:0.1, roughness:0.4 })
  const m = new THREE.Mesh(geom, mat)
  const ang = rec.homeAngleDeg * RAD
  const a = 1.0, b = Math.sqrt(1 - eEarth*eEarth) * a
  const x = a*Math.cos(ang), z = b*Math.sin(ang)
  m.position.set(x, 0, z)
  m.userData.id = rec.id
  scene.add(m)
  markers.set(rec.id, m)

  // label sprite
  const spr = makeLabelSprite(rec.name)
  spr.position.copy(m.position).add(new THREE.Vector3(0.04, 0.04, 0)); // slight offset
  scene.add(spr)
  labels.set(rec.id, spr)

  // own ellipse: EXACTLY the same path as the shared year halo (no scaling),
  // but with a unique dashed color so it's visually distinct without being misleading.
  (async function addOwnEllipse(){
    const yearLine = await getHalo(rec.year);              // ensure year halo exists
    const baseGeo  = yearLine.geometry;                    // reuse exact geometry
    const geoClone = baseGeo.clone();                      // clone to keep materials separate
    // Make sure dashed distances are present
    const tmp = new THREE.Line(geoClone, new THREE.LineBasicMaterial())
    tmp.computeLineDistances()

    const color = hashColor(rec.name + rec.when);          // stable per-file color
    const mat   = makeDashedMat(color)
    const line  = new THREE.Line(geoClone, mat)
    line.position.y = 0.0001; // 0.1 mm in our AU units—purely visual to prevent z-fighting
    line.visible = (store.view.haloMode === 'own')
    scene.add(line)
    ownHalos.set(rec.id, line)
  })()
}

/* Orbital plane ring for reference */
function addOrbitalPlane() {
  const ring = new THREE.RingGeometry(0.98, 1.02, 128)
  const mat = new THREE.MeshBasicMaterial({ 
    color: 0x2b3e7a, 
    transparent: true, 
    opacity: 0.15, 
    side: THREE.DoubleSide, 
    depthWrite: false 
  })
  const mesh = new THREE.Mesh(ring, mat)
  mesh.rotation.x = -Math.PI / 2; // lie in XZ plane
  scene.add(mesh)
}

/* =========================
   UI bindings
========================= */
const elFile = document.getElementById('file');
document.getElementById('btnUpload').onclick = (ev)=>{
  if (typeof window.__hbOpenUploadDialog === 'function') {
    ev.preventDefault();
    window.__hbOpenUploadDialog(true);
    return;
  }
  elFile.click();
};
elFile.addEventListener('change', async (e)=>{
  if (typeof window.__hbUploadGuardHandler === 'function') {
    window.__hbUploadGuardHandler(e)
    return
  }
  const files = [...e.target.files]
  for (const f of files) {
    // For demo: use file lastModified as timestamp (EXIF parsing optional)
    const rec = await buildRecordFromTimestamp(f.name, f.lastModified)
    store.items.push(rec)
    await ensureYearHalo(rec.year)
    addMarker(rec)
  }
  renderList()
  warmYears(); // pre-fetch precise orbits
})


document.getElementById('btnSample').onclick = async ()=>{
  // Seed with a few demo items including equinox samples at exact wall-clock times
  const base = Date.UTC(2023,5,21,9,14)
  const samples = await Promise.all([
    buildRecordFromTimestamp('Solstice Sunrise.jpg', base, {lat:34.05, lon:-118.25}),
    buildRecordFromTimestamp('Equinox Noon.jpg', Date.UTC(2023,2,20,19,0), {lat:40.71, lon:-74.00}),
    buildRecordFromTimestamp('Perigee Moon.mp4', Date.UTC(2023,7,30,3,10), {lat:51.50, lon:-0.12}),
    buildRecordFromTimestamp('Aphelion Walk.png', Date.UTC(2023,6,6,1,0), {lat:35.68, lon:139.69}),
    buildRecordFromTimestamp('Equinox Noon-Blue', toTs('2016-09-22T13:41:00+02:00'), {lat:45.0, lon:-120.0, tz:'Europe/Paris'}),
    buildRecordFromTimestamp('Equinox Noon-Orange', toTs('2025-09-22T07:29:00-04:00'), {lat:45.0, lon:-120.0, tz:'America/New_York'}),
  ])
  for (const rec of samples) {
    store.items.push(rec)
    await ensureYearHalo(rec.year)
    addMarker(rec)
  }
  renderList()
  warmYears(); // pre-fetch precise orbits
}

document.getElementById('btnHaloOwn').onclick = ()=>{
  store.view.haloMode = 'own'
  setActive('btnHaloOwn', true); setActive('btnHaloYear', false)
  // show own halos, hide shared
  ownHalos.forEach(l=> l.visible = true)
  halos.forEach(l=> l.visible = false)
  halosPrecise.forEach(l=> l.visible = false)
}
document.getElementById('btnHaloYear').onclick = ()=>{
  store.view.haloMode = 'year'
  setActive('btnHaloOwn', false); setActive('btnHaloYear', true)
  ownHalos.forEach(l=> l.visible = false)
  halos.forEach(l=> l.visible = true)
  halosPrecise.forEach(l=> l.visible = true)
}
document.getElementById('btnSetSite').onclick = ()=>{
  const lat = prompt('Latitude (deg, north positive):', '34.05')
  const lon = prompt('Longitude (deg, east positive):', '-118.25')
  if(lat!=null && lon!=null){
    const site = { lat: +lat, lon: +lon }
    store.defaultSite = site
    window.ColorDirector?.setSite?.(site)
    alert('Default site set. New uploads will use this unless EXIF GPS is present.')
  }
}

document.getElementById('btnHome').onclick = ()=>{
  store.view.frame = 'home'
  setActive('btnHome', true); setActive('btnCosmic', false)
}
document.getElementById('btnCosmic').onclick = ()=>{
  store.view.frame = 'cosmic'
  setActive('btnHome', false); setActive('btnCosmic', true)
}

document.getElementById('btnZoomIn').onclick = ()=> { camera.position.multiplyScalar(0.9); }
document.getElementById('btnZoomOut').onclick = ()=> { camera.position.multiplyScalar(1.1); }
document.getElementById('btnResetCam').onclick = () => {
  camera.position.set(0, 2.4, 4.0)
  camera.lookAt(0, 0, 0);     // 👈 keep target correct
}

function setActive(id, on){ const el = document.getElementById(id); if(on) el.classList.add('active'); else el.classList.remove('active'); }

function makeToggleRow(label, value, help) {
  const wrap = document.createElement('div')
  const r = document.createElement('div')
  r.className = 'row toggle'
  r.innerHTML = `<span><span class="arrow">▶</span><b>${label}</b></span><span>${value ?? ''}</span>`
  r.onclick = () => r.classList.toggle('open')

  const desc = document.createElement('div')
  desc.className = 'desc'
  desc.textContent = help

  wrap.appendChild(r)
  wrap.appendChild(desc)
  return wrap
}

/* File list + selection tray */
function renderList(){
  const list = document.getElementById('fileList')
  list.innerHTML = ''
  for(const rec of store.items){
    const row = document.createElement('div')
    row.className = 'item' + (store.selected.has(rec.id)?' active':'')
    // Use timezone-aware formatting: memory's capture zone, not viewer's local
    const labelTime = fmt.dateLocal(Date.parse(rec.when), rec.tz)
    row.textContent = `${rec.name} – ${labelTime}`
    row.onclick = ()=> toggleSelect(rec.id)
    list.appendChild(row)
  }
  renderStates()
  if (typeof window.__hbRefreshMemoryList === 'function') {
    try { window.__hbRefreshMemoryList(list); } catch (err) { console.warn('Memory list hydration failed', err); }
  }
}
function toggleSelect(id){
  if (store.selected.has(id)) store.selected.delete(id)
  else store.selected.add(id)
  renderList(); highlightSelection()
}

function highlightSelection(){
  markers.forEach((mesh,id)=>{
    const sel = store.selected.has(id)
    mesh.material.emissive = new THREE.Color(sel ? 0x224488 : 0x000000)
    mesh.scale.setScalar(sel? 1.6 : 1.0)
  })
  updateLabelVisibility()
}

function updateLabelVisibility(){
  labels.forEach((spr, id)=>{
    const sel = store.selected.has(id)
    spr.visible = sel || id === hoverId
  })
}

// Light-time dial renderer
function renderLightTimeDial(){
  const cvs = document.getElementById('ltDialCanvas')
  if (!cvs) return
  const ctx = cvs.getContext('2d')
  const W = cvs.width, H = cvs.height
  ctx.clearRect(0,0,W,H)

  // Track span: full 133.7 ms mapped to width
  const msFull = LT_full_ms
  const xOf = ms => ( (ms + msFull/2) / msFull ) * (W-40) + 20

  // Base bar
  ctx.fillStyle = '#122044'; ctx.fillRect(20, H/2-8, W-40, 16)

  // 1 ms ticks
  ctx.strokeStyle = '#203364'; ctx.lineWidth = 1
  for (let ms=-msFull/2; ms<=msFull/2; ms+=1){
    const x = xOf(ms)
    const h = (Math.abs(ms%5)<1e-6) ? 10 : 6
    ctx.beginPath(); ctx.moveTo(x, H/2-8); ctx.lineTo(x, H/2-8-h); ctx.stroke()
  }

  // Zone separators (~5.56 ms)
  ctx.strokeStyle = '#3a4e86'; ctx.lineWidth = 2
  for (let ms=-msFull/2; ms<=msFull/2; ms+=LT_zone_ms){
    const x = xOf(ms); ctx.beginPath(); ctx.moveTo(x, H/2-14); ctx.lineTo(x, H/2+14); ctx.stroke()
  }

  // Labels
  ctx.fillStyle = '#9fb0d9'; ctx.font = '12px Inter'
  ctx.fillText('Light-time along Earth (ms)', 20, 18)
  ctx.fillText('Zones = 15° ≈ 5.56 ms; small ticks = 1 ms', 20, H-10)

  // Markers for selected records
  const sel = [...store.selected].map(id => store.items.find(r => r.id===id)).filter(Boolean)
  const palette = ['#7bdcf3','#8d9bff','#ffd26a','#43d1a0','#ff9aa2']
  sel.forEach((rec, i) => {
    const ms = rec.states?.lightBands?.msFromGreenwich; if (typeof ms!=='number') return
    const x = xOf(ms)
    ctx.fillStyle = palette[i % palette.length]
    ctx.beginPath(); ctx.arc(x, H/2, 6, 0, Math.PI*2); ctx.fill()
    ctx.fillText(`${rec.name}: ${ms.toFixed(2)} ms`, Math.min(Math.max(20, x+8), W-220), 34+i*14)
  })
}

function renderStates(){
  const chips = document.getElementById('chips')
  const single = document.getElementById('single')
  const diff = document.getElementById('diffText')
  const multi = document.getElementById('multi')
  chips.innerHTML = ''; single.innerHTML = ''; diff.innerHTML = '—'

  const sel = [...store.selected].map(id=>store.items.find(x=>x.id===id))
  
  // Visibility rules: 0 -> hint, 1 -> show single/collapse multi, 2+ -> collapse single/show multi
  if (sel.length === 0) {
    single.classList.remove('collapsed')
    single.classList.add('expanded')
    multi.classList.add('collapsed')
    multi.classList.remove('expanded')
  } else if (sel.length === 1) {
    single.classList.remove('collapsed')
    single.classList.add('expanded')
    multi.classList.add('collapsed')
    multi.classList.remove('expanded')
    diff.innerHTML = '—'
  } else {
    single.classList.add('collapsed')
    single.classList.remove('expanded')
    multi.classList.remove('collapsed')
    multi.classList.add('expanded')
  }
  sel.forEach(rec=>{
    const chip = document.createElement('div'); chip.className='chip'
    chip.textContent = rec.name
    chips.appendChild(chip)
  })

  // Optional: expose compact similarity chip
  if (sel.length >= 2) {
    const a = sel[sel.length-2], b = sel[sel.length-1]
    const score = similarityScore(a, b)
    const stateLabel = (score >= 70) ? 'Alike' : (score >= 40) ? 'Close' : 'Not alike'
    const chip = document.createElement('div')
    chip.className = 'chip'
    chip.textContent = `Similarity: ${score} • ${stateLabel}`
    chips.appendChild(chip)
  }

  if (sel.length === 0) { single.innerHTML = '<div class="row"><span>Select a marker to see its states.</span></div>'; return; }

  // Single (show the most recent selection)
  const rec = sel[sel.length-1]
  single.innerHTML = ''; // we'll append rows

  const rows = [
    ['When', new Date(rec.when).toLocaleString(),
      'The file\'s timestamp (converted to your local time). It anchors the memory to a specific point on the orbit.'],

    ['Frame', store.view.frame==='home' ? 'Home (co-moving)' : 'Cosmic (pinned)',
      'Home: memories move with our Solar-System rest patch. Cosmic: memories are pinned where the Solar System was in inertial space.'],

    ['Day-phase', `${rec.states.dayPhase} (${rec.states.sunAltDeg.toFixed(1)}°)`,
      'What the Sun was doing at the capture location—night/twilights/golden hour/daytime—based on Sun altitude. Pure sky geometry.'],

    ['Season', `Year ${rec.year}`,
      'Where this moment sits in Earth\'s seasonal cycle (solstice/equinox context when enabled).'],

    ['Solar contribution (relative)', `${(rec.states.tides.solarRelPct>=0?'+':'')}${rec.states.tides.solarRelPct}%  •  ${rec.states.tides.sun_uGal} µGal`,
      'Change in solar tidal strength relative to annual mean (∝ 1/r☉³) and instantaneous vertical gravitational tidal acceleration in microgals.'],

    ['Lunar contribution (relative)', `${(rec.states.tides.lunarRelPct>=0?'+':'')}${rec.states.tides.lunarRelPct}%  •  ${rec.states.tides.moon_uGal} µGal`,
      'Change in lunar tidal strength relative to monthly mean (∝ 1/r🌙³, modulated by phase) and vertical tidal acceleration in microgals.'],

    ['Solar–lunar tidal field (index)', `${rec.states.tides.index0to100}/100`,
      'Dimensionless index of the local gravitational tidal field from Sun+Moon at capture (normalized to that day\'s range).'],

    ['Lunar phase', `${rec.states.lunar.phasePct}% • perigee ${Math.round(rec.states.lunar.perigeeProx*100)}%`,
      'Illumination percentage and a hint of how close the Moon was to perigee (closer → stronger lunar tide).'],

    ['Home angle', `${rec.homeAngleDeg.toFixed(2)}°`,
      'The memory\'s angle on the Home ellipse (heliocentric longitude)—i.e., where on the ring it sits.'],

    ['Cosmic drift', `${rec.cosmic.drift_since_AU} AU (approx)`,
      'How far we have traveled through space since that memory in the Cosmic frame (assumes ~46 AU/yr galactic speed).'],

    ['Reference frame', `${rec.states.frames.geometry}; ${rec.states.frames.site}`,
      'Geometry & light-time from the barycenter (BCRS/ICRF); local sky and tides in the site\'s geocentric frame (GCRS).'],

    ['Light-time', `Sun ${rec.states.voxel.sunLightTime_s}s • Moon ${rec.states.voxel.moonLightTime_s}s`,
      'Retarded-time markers: how long light takes from Sun/Moon at capture time.'],

    ['Voxel fraction (1 s)', `${rec.states.voxel.voxelFraction} of 1 light-second`,
      'How much of a 1-light-second causal cube Earth traversed during this second (v/c).'],

    ['Clock bias (1 s)', niceNsPerS(rec.states.voxel.ns_per_1s),
      'Cycle-averaged tidal potential converted to a tiny gravitational time shift over this 1-second voxel.'],

    ['Kinematic rate (1 s)', niceNsPerS(rec.states.voxel.kin_ns_per_1s),
      'Special-relativistic time shift from orbital + rotational speed at this latitude over 1 second.'],

    ['Combined rate (1 s)', niceNsPerS(rec.states.voxel.combined_ns_per_1s),
      'Sum of gravitational (tidal potential) + kinematic dilation for this 1-second voxel.'],

    ['Tide vector (Sun)', `V ${rec.states.tideVec.sun.av_uGal} µGal • |H| ${Math.abs(rec.states.tideVec.sun.ah_uGal)} µGal • bearing ${norm360(rec.states.tideVec.sun.bearing).toFixed(0)}°`,
      'Vertical and horizontal magnitude of the solar gravitational tidal acceleration (µGal); bearing is the horizontal push direction.'],

    ['Tide vector (Moon)', `V ${rec.states.tideVec.moon.av_uGal} µGal • |H| ${Math.abs(rec.states.tideVec.moon.ah_uGal)} µGal • bearing ${norm360(rec.states.tideVec.moon.bearing).toFixed(0)}°`,
      'Vertical and horizontal magnitude of the lunar gravitational tidal acceleration (µGal).']
  ]

  // Add envelope normalization for single selection display
  let envelopeRow = null
  if (rec.states.envelope) {
    const spanDay = envelopeDailySpan_sync(new Date(rec.when).getTime(), rec.where?.lat||0, rec.where?.lon||0)
    const pct1m = 100 * Math.abs(rec.states.envelope?.Ubar_1m || 0) / Math.max(1e-9, spanDay)
    const pct1h = 100 * Math.abs(rec.states.envelope?.Ubar_1h || 0) / Math.max(1e-9, spanDay)
    envelopeRow = ['Envelope similarity', 
      `Rolling-average potential (1 min / 1 hr): ${pct1m.toFixed(1)}% / ${pct1h.toFixed(1)}% of daily span`,
      'Time-averaged tidal potential variations expressed as percentage of the day\'s total tidal range.']
  }

  // Add planetary context if available (collapsed by default)
  if (rec.states.planetary) {
    const p = rec.states.planetary
    rows.push(
      ['Planetary tidal add-ons', `${p.tidalAddons_nGal.total_nGal} nGal total`,
        'Tiny but real gravitational tidal contributions from all planets combined (nanogals). Venus dominates at a few nGal when close.'],
      ['Solar System Barycenter', `Sun offset: ${p.ssbOffset_km} km • reflex: ${p.sunReflex_mps} m/s`,
        'Sun\'s displacement and velocity about the Solar System Barycenter, dominated by Jupiter with Saturn adding refinement.']
    )
  }

  rows.forEach(([label, value, help]) => {
    single.appendChild(makeToggleRow(label, value, help))
  })

  // Add envelope row if available
  if (envelopeRow) {
    single.appendChild(makeToggleRow(envelopeRow[0], envelopeRow[1], envelopeRow[2]))
  }

  // Add light bands info to single selection
  if (rec.states.lightBands) {
    const lb = rec.states.lightBands
    const kmAlongParallel = (lb.msFromGreenwich * C_km_per_s / 1000)
    const lightBandRow = makeToggleRow(
      'Earth light-time band', 
      `longitude offset ${lb.msFromGreenwich.toFixed(2)} ms from Greenwich (≈ ${kmAlongParallel.toFixed(0)} km along your parallel); nearest time-zone band ${lb.zoneIndex} (±5.56 ms edges)`,
      'Position on Earth expressed in light travel time along the surface. Shows how longitude relates to causal time scales.'
    )
    single.appendChild(lightBandRow)
  }

  // Add retarded-time badges if any events coincide
  const badges = retardedBadge(rec.when, rec.states.voxel.sunLightTime_s)
  if (badges.length){
    single.appendChild(makeToggleRow('Causal events', 
      badges.map(b=>`${b.name} (±${Math.round(b.dt_s)} s)`).join(', '),
      'Events whose retarded-time arrival coincides with this moment (Sun light-cone).'))
  }

  // Add detailed planetary breakdown (if available)
  if (rec.states.planetary?.tidalAddons_nGal?.list?.length > 0) {
    const planetDetails = rec.states.planetary.tidalAddons_nGal.list
      .filter(p => p.nGal !== 0)
      .map(p => `${p.name}: ${p.nGal} nGal (${p.relMoonPct}% of Moon peak)`)
      .join('; ')
    
    if (planetDetails) {
      single.appendChild(makeToggleRow('Planetary breakdown', planetDetails,
        'Individual planetary tidal contributions. Venus can reach ~10 nGal at inferior conjunction; Jupiter ~0.1 nGal.'))
    }
  }

  // Multi (differences)
  if (sel.length >= 2){
    const a = sel[sel.length-2], b = sel[sel.length-1]
    
    // Calculate ALL difference fields for narrative
    const dSolar = (b.states.tides.solarRelPct - a.states.tides.solarRelPct)
    const dLunar = (b.states.tides.lunarRelPct - a.states.tides.lunarRelPct)
    const dAlt   = (b.states.sunAltDeg - a.states.sunAltDeg)
    const dYear  = b.year - a.year
    const dAngle = (b.homeAngleDeg - a.homeAngleDeg)
    const dDrift = (b.cosmic.drift_since_AU - a.cosmic.drift_since_AU)
    const dIndex = (b.states.tides.index0to100 - a.states.tides.index0to100)

    const dLt   = (b.states.voxel.sunLightTime_s - a.states.voxel.sunLightTime_s)
    const dMoonLt = (b.states.voxel.moonLightTime_s - a.states.voxel.moonLightTime_s)
    const dFrac = (b.states.voxel.voxelFraction - a.states.voxel.voxelFraction)
    const dNS   = (parseFloat(b.states.voxel.ns_per_1s) - parseFloat(a.states.voxel.ns_per_1s))
    const dKinNS = (b.states.voxel.kin_ns_per_1s - a.states.voxel.kin_ns_per_1s)
    const dCombNS = (b.states.voxel.combined_ns_per_1s - a.states.voxel.combined_ns_per_1s)

    // Tide vector differences
    const dSunVec = {
      v: (b.states.tideVec.sun.av_uGal - a.states.tideVec.sun.av_uGal),
      h: (b.states.tideVec.sun.ah_uGal - a.states.tideVec.sun.ah_uGal),
      br: ((b.states.tideVec.sun.bearing - a.states.tideVec.sun.bearing + 540)%360 - 180)
    }
    const dMoonVec = {
      v: (b.states.tideVec.moon.av_uGal - a.states.tideVec.moon.av_uGal),
      h: (b.states.tideVec.moon.ah_uGal - a.states.tideVec.moon.ah_uGal),
      br: ((b.states.tideVec.moon.bearing - a.states.tideVec.moon.bearing + 540)%360 - 180)
    }

    // Orbital elements for narrative: prefer GR module; fallback to Horizons elements if present
    const elA_narr = yearElements.get(a.year), elB_narr = yearElements.get(b.year)
    let dOmega = null, dVarpi = null, periA = null, periB = null
    try {
      const HP = window.HaloPeri
      if (HP && typeof HP.stateAt==='function' && typeof HP.delta==='function'){
        const Aperi = HP.stateAt(Date.parse(a.when), ['earth'])
        const Bperi = HP.stateAt(Date.parse(b.when), ['earth'])
        const Dperi = HP.delta(Aperi, Bperi)
        dVarpi = +(Dperi?.dVarpiDeg?.earth ?? null)
        // Without Ω,ω split, expose ω as approximate using ϖ
        dOmega = dVarpi
        periA = Aperi.earth?.lastPerihelionISO || null
        periB = Bperi.earth?.lastPerihelionISO || null
      }
    } catch {}
    if (dVarpi==null && elA_narr && elB_narr) {
      const deg = x => (x*180/Math.PI)
      const wrapDeg = d => ((d+540)%360)-180; // wrap to [-180,180)
      const omegaA = deg(elA_narr.omega), omegaB = deg(elB_narr.omega)
      const bigOmegaA = deg(elA_narr.Omega), bigOmegaB = deg(elB_narr.Omega)
      const varpiA = omegaA + bigOmegaA; // ϖ = Ω + ω
      const varpiB = omegaB + bigOmegaB
      dOmega = wrapDeg(omegaB - omegaA)
      dVarpi = wrapDeg(varpiB - varpiA)
      periA = elA_narr.perihelionISO || null
      periB = elB_narr.perihelionISO || null
    }

    // Complete difference object for narrative
    const diffData = {
      dSolarPct: dSolar,
      dLunarPct: dLunar,
      dSunAltDeg: dAlt,
      dYear: dYear,
      dAngle: dAngle,
      dDrift_AU: dDrift,
      dIndex: dIndex,
      dLightTime_s: dLt,
      dVoxelFrac: dFrac,
      dNs_grav: dNS,
      dNs_kin: dKinNS,
      dNs_comb: dCombNS,
      dOmegaDeg: dOmega,
      dVarpiDeg: dVarpi,
      // --- NEW causal/averaging differences ---
      dSunCausal_s: Math.abs( (b.states.voxel.sunLightTime_s - a.states.voxel.sunLightTime_s) - ((Date.parse(b.when)-Date.parse(a.when))/1000) ),
      dMoonCausal_s: Math.abs( (b.states.voxel.moonLightTime_s - a.states.voxel.moonLightTime_s) - ((Date.parse(b.when)-Date.parse(a.when))/1000) ),
      dUbar1m: (b.states.envelope?.Ubar_1m || 0) - (a.states.envelope?.Ubar_1m || 0),
      dUbar1h: (b.states.envelope?.Ubar_1h || 0) - (a.states.envelope?.Ubar_1h || 0),
      dTS1m: (b.states.envelope?.TS_envelope_1m || 0) - (a.states.envelope?.TS_envelope_1m || 0),
      dTS1h: (b.states.envelope?.TS_envelope_1h || 0) - (a.states.envelope?.TS_envelope_1h || 0),
      dNetBearing: ((b.states.tideNet?.bearingDeg || 0) - (a.states.tideNet?.bearingDeg || 0) + 540)%360 - 180,
      dNetMag: (b.states.tideNet?.ah_uGal || 0) - (a.states.tideNet?.ah_uGal || 0),
      dP2sun: (b.states.geometryP2?.P2sun || 0) - (a.states.geometryP2?.P2sun || 0),
      dP2moon: (b.states.geometryP2?.P2moon || 0) - (a.states.geometryP2?.P2moon || 0),
      dPhaseSyn: (((b.states.sunMoon?.phaseDeg || 0) - (a.states.sunMoon?.phaseDeg || 0))+540)%360-180,
      dNodal: (((b.states.sunMoon?.nodalPhaseDeg || 0) - (a.states.sunMoon?.nodalPhaseDeg || 0)) + 540)%360 - 180,
      dPerigee: (((b.states.sunMoon?.perigeePhaseDeg || 0) - (a.states.sunMoon?.perigeePhaseDeg || 0)) + 540)%360 - 180,
      dEqElev_mm: (b.states.eqElevation_mm !== null && a.states.eqElevation_mm !== null) 
        ? (b.states.eqElevation_mm - a.states.eqElevation_mm) : null,
      dEqElev_norm: (b.states.eqElevation_norm || 0) - (a.states.eqElevation_norm || 0)
    }

    // Stash planetary context for narrative longLine
    if (a.states.planetary && b.states.planetary) {
      const nA = a.states.planetary.tidalAddons_nGal?.total_nGal || 0
      const nB = b.states.planetary.tidalAddons_nGal?.total_nGal || 0
      diffData.planetary_nGal = nB - nA
      diffData.dSSB_km = (b.states.planetary.ssbOffset_km - a.states.planetary.ssbOffset_km)
      diffData.dReflex_mps = (b.states.planetary.sunReflex_mps - a.states.planetary.sunReflex_mps)
    }

    // --- Similarity meter + Complete Narrative ---
    // Compute normalized envelope percentages for narrative
    const spanA = envelopeDailySpan_sync(new Date(a.when).getTime(), a.where?.lat||0, a.where?.lon||0)
    const spanB = envelopeDailySpan_sync(new Date(b.when).getTime(), b.where?.lat||0, b.where?.lon||0)
    const normSpan = Math.max(spanA, spanB, 1e-9)
    const envDeltaPct_1m = 100 * Math.abs(diffData.dUbar1m || 0) / normSpan
    const envDeltaPct_1h = 100 * Math.abs(diffData.dUbar1h || 0) / normSpan
    diffData.envPct_1m = envDeltaPct_1m
    diffData.envPct_1h = envDeltaPct_1h

    const score = similarityScore(a, b, diffData)
    const stateLabel = (score >= 70) ? 'Alike' : (score >= 40) ? 'Close' : 'Not alike'
    // Perihelion data for narrative
    const extraData = { periA: periA, periB: periB }

    // Generate zen sentence based on score
    const zenIdx = Math.floor(clamp01(score/100) * zenSentences.length)
    const zenQuote = zenSentences[Math.min(zenIdx, zenSentences.length-1)]

    // Add similarity meter with zen quote
    const simRow = document.createElement('div')
    simRow.className = 'row'
    simRow.innerHTML = `<b>Similarity</b><span>${score.toFixed(1)}/100 • ${stateLabel}</span>`
    diff.appendChild(simRow)
    
    const zenRow = document.createElement('div')
    zenRow.className = 'row'
    zenRow.innerHTML = `<span style="grid-column:1/-1;color:#9fb0d9;font-style:italic;padding:4px 0;">${zenQuote}</span>`
    diff.appendChild(zenRow)
    
    // Add Complete Story narrative
    const storyRow = document.createElement('div')
    storyRow.style.marginTop = '10px'
    storyRow.innerHTML = makeNarrative(a, b, score, diffData, extraData)
    diff.appendChild(storyRow)

    const diffs = [
      ['Δ Solar contribution', `${dSolar.toFixed(1)}%`,
        'Change in the Sun\'s gravitational tidal contribution (relative to its annual mean).'],
      ['Δ Lunar contribution', `${dLunar.toFixed(1)}%`,
        'Change in the Moon\'s gravitational tidal contribution (relative to its monthly mean and phase).'],
      ['Δ Sun altitude', `${dAlt.toFixed(1)}°`,
        'How different the Sun\'s height in the sky was (lighting/phase of day).'],
      ['Δ Year', `${dYear}`,
        'How many laps around the Sun separate the two memories.'],
      ['Δ Home angle', `${dAngle.toFixed(2)}°`,
        'Angular separation around the Home ellipse—how far apart on the ring they are.'],
      ['Δ Cosmic drift', `${dDrift.toFixed(1)} AU`,
        'How much farther we are in inertial space between the two times.'],
      ['Δ Light-time to Sun', `${dLt.toFixed(1)} s`,
        'Change in Sun–Earth light travel time—ties directly to the voxel scale.'],
      ['Δ Moon light-time', `${dMoonLt.toFixed(1)} s`,
        'Change in Earth–Moon light travel time between the two moments.'],
      ['Δ Voxel fraction', `${dFrac.toExponential(2)}`,
        'Change in how much of a light-second we traversed during the capture second.'],
      ['Δ Clock bias (1 s)', niceNsPerS(dNS),
        'Change in 1-second gravitational time-shift from the cycle-averaged tidal potential (ns/s).'],
      ['Δ Kinematic rate (1 s)', niceNsPerS(dKinNS),
        'Change from latitude/rotation differences (orbital term is common).'],
      ['Δ Combined rate (1 s)', niceNsPerS(dCombNS),
        'Overall change in proper-time rate over the 1-s voxel.'],
      // NEW causal/averaging rows
      ['Causal overlap (Sun)',
        diffData.overSun==null ? 'n/a (moments far apart)' :
        `overlap ${(diffData.overSun*100).toFixed(0)}% • Δ(retarded) = ${Math.abs(diffData.dSunCausal_s).toFixed(2)} s`,
        'Causal coherence between observation moments for solar gravitational influence.'],
      ['Causal overlap (Moon)',
        diffData.overMoon==null ? 'n/a (moments far apart)' :
        `overlap ${(diffData.overMoon*100).toFixed(0)}% • Δ(retarded) = ${Math.abs(diffData.dMoonCausal_s).toFixed(2)} s`,
        'Causal coherence between observation moments for lunar gravitational influence.'],
      ['Envelope similarity',
        `Rolling-average potential Δ (1 min / 1 hr): ${(diffData.envPct_1m||0).toFixed(1)}% / ${(diffData.envPct_1h||0).toFixed(1)}% of daily span`,
        'Comparison of time-averaged gravitational potential variations expressed as percentage of daily tidal range.'],
      ['TS_envelope', `W/lt (1 min / 1 hr): ${a.states.envelope?.TS_envelope_1m?.toFixed(2)||'?'}→${b.states.envelope?.TS_envelope_1m?.toFixed(2)||'?'} / ${a.states.envelope?.TS_envelope_1h?.toFixed(2)||'?'}→${b.states.envelope?.TS_envelope_1h?.toFixed(2)||'?'}`,
        'Ratio of averaging window to light-time—shows time-scale separation for causal analysis.'],
      ['Δ Net tidal vector', `Δbearing ${diffData.dNetBearing.toFixed(1)}°, Δmag ${diffData.dNetMag.toFixed(1)} µGal`,
        'Change in combined Sun+Moon horizontal tidal acceleration vector (magnitude and direction).'],
      ['ΔP₂ factors', `Sun ${(P2_fromAltDeg(b.states.sunAltDeg) - P2_fromAltDeg(a.states.sunAltDeg)).toFixed(3)}, Moon ${(P2_fromAltDeg(b.states.moonAltDeg) - P2_fromAltDeg(a.states.moonAltDeg)).toFixed(3)}`,
        'Change in Legendre P₂ geometry factors (3cos²θ-1)/2 used in tidal potential calculations.'],
      ['Δ Sun–Moon phase', `${diffData.dPhaseSyn.toFixed(1)}° (toward/away from spring tide)`,
        'Change in synodic phase angle between Sun and Moon (spring tides at 0°, neap at ±90°).'],
      ['Δ nodal / perigee phase', `${diffData.dNodal.toFixed(1)}° / ${diffData.dPerigee.toFixed(1)}°`,
        'Change in long-cycle lunar phases: nodal (18.6 yr) affects ecliptic inclination; perigee (8.85 yr) affects distance variation.'],
      // Equivalent elevation
      ['Equivalent elevation', 
        (a.states.eqElevation_mm!=null && b.states.eqElevation_mm!=null) 
          ? `${(b.states.eqElevation_mm - a.states.eqElevation_mm).toFixed(2)} mm`
          : `normalized mm-equivalent Δ ${( (b.states.eqElevation_norm||0) - (a.states.eqElevation_norm||0) ).toFixed(2)} (calibration TBD)`,
        'Change in gravitational potential expressed as equivalent height above geoid (U/g). Normalized values require calibration.'],
      
      // Light-time bands along Earth's surface
      ...(a.states.lightBands && b.states.lightBands ? [
        ['Light-time along Earth', `Δ ${wrapMs(b.states.lightBands.msFromGreenwich - a.states.lightBands.msFromGreenwich).toFixed(2)} ms (≈ ${(wrapMs(b.states.lightBands.msFromGreenwich - a.states.lightBands.msFromGreenwich)*C_km_per_s/1000).toFixed(0)} km along the parallel)`,
          'Distance between observation points in light travel time along Earth\'s surface.'],
        ['Time zone (light units)', `Δ zones ${(b.states.lightBands.zoneIndex - a.states.lightBands.zoneIndex)>=0?'+':''}${b.states.lightBands.zoneIndex - a.states.lightBands.zoneIndex} • 1 zone ≈ ${a.states.lightBands.msPerZone.toFixed(2)} ms`,
          'Time zone separation measured in light-time milliseconds (15° ≈ 5.56 ms).']
      ] : []),
    ]
    diffs.forEach(([label,value,help])=>{
      diff.appendChild(makeToggleRow(label, value, help))
    })
    
    // Add planetary add-ons if both records have them
    if (a.states.planetary && b.states.planetary){
      const pa = a.states.planetary.tidalAddons_nGal?.total_nGal || 0
      const pb = b.states.planetary.tidalAddons_nGal?.total_nGal || 0
      diff.appendChild(makeToggleRow('Planetary add-ons', `Δ total ${ (pb-pa).toExponential(2) } nGal (Venus/Jupiter etc.)`,
        'Change in total planetary tidal contributions beyond Sun/Moon (Venus ~10 nGal max, Jupiter ~0.1 nGal).'))
      diff.appendChild(makeToggleRow('SSB context', `Δ Sun–SSB offset ${(b.states.planetary.ssbOffset_km - a.states.planetary.ssbOffset_km).toFixed(0)} km • Δ reflex ${(b.states.planetary.sunReflex_mps - a.states.planetary.sunReflex_mps).toFixed(2)} m/s`,
        'Change in Solar System Barycenter context: Sun offset from SSB and Earth\'s reflex motion due to planetary perturbations.'))
    }

    // Add tide vector differences
    diff.appendChild(makeToggleRow('Δ Solar tide vector', `V ${dSunVec.v.toFixed(1)} µGal • H ${dSunVec.h.toFixed(1)} µGal • Δbearing ${dSunVec.br.toFixed(0)}°`,
      'Change in vertical/horizontal solar gravitational tidal acceleration components and bearing.'))
    diff.appendChild(makeToggleRow('Δ Lunar tide vector', `V ${dMoonVec.v.toFixed(1)} µGal • H ${dMoonVec.h.toFixed(1)} µGal • Δbearing ${dMoonVec.br.toFixed(0)}°`,
      'Change in vertical/horizontal lunar gravitational tidal acceleration components and bearing.'))

    // Add orbital mechanics comparison if elements available
    // Prefer GR perihelion module if available for robust values; fallback to yearElements
    try {
      const tAms = Date.parse(a.when), tBms = Date.parse(b.when)
      const HP = window.HaloPeri
      if (HP && typeof HP.stateAt === 'function' && typeof HP.delta === 'function'){
        const Aperi = HP.stateAt(tAms, ['earth'])
        const Bperi = HP.stateAt(tBms, ['earth'])
        const Dperi = HP.delta(Aperi, Bperi)
        const dVarpiEarthNum = +(Dperi?.dVarpiDeg?.earth ?? 0)
        const wrap = d => ((d+540)%360)-180
        // We do not have Ω,ω split from HaloPeri; keep Δϖ from GR and omit Δω specific unless Horizons elements exist.
        const elA = yearElements.get(a.year), elB = yearElements.get(b.year)
        let dOmegaNum = dVarpiEarthNum; // fallback: with i≈0, treat Δω≈Δϖ (approx)
        if (elA && elB) {
          const degf = x => (x*180/Math.PI)
          const omegaA = degf(elA.omega), omegaB = degf(elB.omega)
          dOmegaNum = wrap(omegaB - omegaA)
        }
        // Perihelion timestamps from HaloPeri proximity cycles
        const periADisp = Aperi.earth?.lastPerihelionISO || '(n/a)'
        const periBDisp = Bperi.earth?.lastPerihelionISO || '(n/a)'

        diff.appendChild(makeToggleRow('Δ Argument of perihelion (ω)', `${angleSmartDeg(dOmegaNum)}`,
          'Change in the ellipse\'s orientation within its orbital plane (year B − year A). Fallback uses GR Δϖ (i≈0 assumption).'))
        diff.appendChild(makeToggleRow('Δ Longitude of perihelion (ϖ = Ω+ω)', `${angleSmartDeg(dVarpiEarthNum)}`,
          'Change in the ellipse\'s absolute orientation against the reference frame (year B − year A).'))
        diff.appendChild(makeToggleRow('Perihelion (A → B)', `${periADisp} → ${periBDisp}`,
          'The date/time of closest approach to the Sun for each year\'s osculating orbit (GR-secular, approximate).'))
      } else {
        const elA = yearElements.get(a.year), elB = yearElements.get(b.year)
        if (elA && elB){
          const deg = x => (x*180/Math.PI)
          const wrapDeg = d => ((d+540)%360)-180; // wrap to [-180,180)
          const omegaA = deg(elA.omega), omegaB = deg(elB.omega)
          const bigOmegaA = deg(elA.Omega), bigOmegaB = deg(elB.Omega)
          const varpiA = omegaA + bigOmegaA; // ϖ = Ω + ω
          const varpiB = omegaB + bigOmegaB

          const dOmegaDisp = angleSmartDeg(wrapDeg(omegaB - omegaA))
          const dVarpiDisp = angleSmartDeg(wrapDeg(varpiB - varpiA))
          const periADisp = elA.perihelionISO || '(n/a)'
          const periBDisp = elB.perihelionISO || '(n/a)'

          diff.appendChild(makeToggleRow('Δ Argument of perihelion (ω)', `${dOmegaDisp}`,
            'Change in the ellipse\'s orientation within its orbital plane (year B − year A).'))
          diff.appendChild(makeToggleRow('Δ Longitude of perihelion (ϖ = Ω+ω)', `${dVarpiDisp}`,
            'Change in the ellipse\'s absolute orientation against the reference frame (year B − year A).'))
          diff.appendChild(makeToggleRow('Perihelion (A → B)', `${periADisp} → ${periBDisp}`,
            'The date/time of closest approach to the Sun for each year\'s osculating orbit (from Horizons).'))
        }
      }
    } catch (e) {
      // Silent fallback if anything goes wrong
    }
  }
}

/* =========================
   Boot
========================= */
initScene()
renderList()

// Update light-time dial when render state changes
const originalRenderStatesOld = renderStates

/* =========================
   Methods Appendix Implementation
   Academic-style equation solutions for each selected record
========================= */

// 1. Time and Indexing Diagnostics
function showTimeIndexing(ts, rec) {
  const jd = ts/86400000 + 2440587.5; // Same as existing toJD logic
  const daysSinceEpoch = (ts - Date.UTC(2000,0,1,12,0,0)) / 86400000
  
  return {
    julianDay: jd,
    daysSinceJ2000: daysSinceEpoch,
    equation: `JD = t_ms/86,400,000 + 2,440,587.5 = ${jd.toFixed(5)}`,
    localTime: `Local timestamp: ${new Date(ts).toLocaleString()}`
  }
}

// 2. Earth-Sun Geometry Diagnostics
function showEarthSunGeometry(ts) {
  const d = (ts - perihelionApprox) / 86400000
  const n = 2*Math.PI/365.25; // mean motion
  const M = n * d; // mean anomaly
  let E = M + eEarth*Math.sin(M); // eccentric anomaly (first approximation)
  E = E - (E - eEarth*Math.sin(E) - M)/(1 - eEarth*Math.cos(E)); // Newton correction
  const v = 2*Math.atan(Math.sqrt((1+eEarth)/(1-eEarth))*Math.tan(E/2)); // true anomaly
  const r = 1.0*(1 - eEarth*Math.cos(E)); // distance in AU
  
  // Normalize angles to [0, 360°) range for display
  const M_deg = ((M * 180/Math.PI) % 360 + 360) % 360
  const E_deg = ((E * 180/Math.PI) % 360 + 360) % 360
  const v_deg = ((v * 180/Math.PI) % 360 + 360) % 360
  
  return {
    meanAnomaly_deg: M_deg,
    eccentricAnomaly_deg: E_deg,
    trueAnomaly_deg: v_deg,
    distance_AU: r,
    equations: [
      `M = n × d = ${n.toFixed(8)} × ${d.toFixed(2)} = ${M.toFixed(4)} rad`,
      `E - e sin E = M → E = ${E.toFixed(4)} rad (Newton iteration)`,
      `ν = 2 arctan[√((1+e)/(1-e)) tan(E/2)] = ${v.toFixed(4)} rad`,
      `r = a(1 - e cos E) = ${r.toFixed(6)} AU`
    ]
  }
}

// 3. Solar Position Diagnostics
function showSolarPosition(ts, lat, lon) {
  const date = new Date(ts)
  const n = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(),0,0))/86400000)
  const L = (280.46 + 0.9856474*n) % 360
  const g = (357.528 + 0.9856003*n) % 360
  const lambda = L + 1.915*Math.sin(g*RAD) + 0.020*Math.sin(2*g*RAD)
  const epsilon = 23.439 - 0.0000004*n
  const delta = Math.asin(Math.sin(epsilon*RAD)*Math.sin(lambda*RAD)); // declination
  
  // Use existing sunAltDeg function result
  const alt = sunAltDeg(ts, lat, lon)
  
  return {
    meanLongitude_deg: L,
    meanAnomaly_deg: g,
    trueLongitude_deg: lambda,
    declination_deg: delta * 180/Math.PI,
    altitude_deg: alt,
    equations: [
      `λ = L + 1.915 sin g + 0.020 sin 2g = ${lambda.toFixed(3)}°`,
      `δ = arcsin(sin ε sin λ) = ${(delta*180/Math.PI).toFixed(3)}°`,
      `h = arcsin(sin φ sin δ + cos φ cos δ cos H) = ${alt.toFixed(3)}°`
    ]
  }
}

// 4. Lunar Model Diagnostics
function showLunarModel(ts, lat, lon) {
  const d = (ts - Date.UTC(2000,0,1,12,0,0)) / 86400000
  const T = d / 36525
  
  // Mean elements (from existing moonContext function)
  const L0 = (218.3164477 + 481267.88123421*T - 0.0015786*T*T) % 360
  const M  = (134.9633964 + 477198.8675055*T   + 0.0087414*T*T) % 360
  const Ms = (357.5291092 + 35999.0502909*T    - 0.0001535*T*T) % 360
  const D  = (297.8501921 + 445267.1114034*T   - 0.0018819*T*T) % 360
  const F  = (93.2720950  + 483202.0175233*T   - 0.0036539*T*T) % 360
  
  // Use existing moonContext result
  const mc = moonContext(ts, lat, lon)
  
  return {
    meanLongitude_deg: L0,
    meanAnomaly_deg: M,
    meanElongation_deg: D,
    argumentLatitude_deg: F,
    distance_km: mc.distance_km,
    altitude_deg: mc.altDeg,
    phase_pct: mc.phasePct,
    equations: [
      `L₀ = 218.32° + 481267.88°T = ${L0.toFixed(3)}°`,
      `λ_M ≈ L₀ + 6.289 sin M + 1.274 sin(2D-M) + ...`,
      `r_M = 385,001 - 20,905 cos M - 3,699 cos(2D-M) + ... = ${mc.distance_km.toFixed(0)} km`,
      `Illumination = (1 - cos ψ)/2 × 100% = ${mc.phasePct}%`
    ]
  }
}

// 5. Light-Time Band Diagnostics
function showLightTimeBands(rec) {
  if (!rec.states.lightBands) return null
  
  const lb = rec.states.lightBands
  const kmPerDeg = KM_PER_DEG_EQ * Math.max(0.2, Math.cos((rec.where?.lat || 0) * Math.PI/180))
  const offsetKm = (rec.where?.lon || 0) * kmPerDeg
  
  return {
    msFromGreenwich: lb.msFromGreenwich,
    zoneIndex: lb.zoneIndex,
    kmOffset: offsetKm,
    equations: [
      `T₀ = 40,075 km / (299,792.458 km/s) = ${LT_full_ms.toFixed(2)} ms`,
      `Zone width = T₀/24 = ${LT_zone_ms.toFixed(2)} ms`,
      `km/deg = 111.32 × cos(lat) = ${kmPerDeg.toFixed(2)} km/deg`,
      `Δt_ms = (lon × km/deg) / c × 10³ = ${lb.msFromGreenwich.toFixed(3)} ms`
    ]
  }
}

// 6. Tidal Proxies Diagnostics
function showTidalProxies(rec, ts) {
  const sunAlt = rec.states.sunAltDeg
  const moonAlt = rec.states.moonAltDeg
  const zSun = (90 - sunAlt) * Math.PI/180
  const zMoon = (90 - moonAlt) * Math.PI/180
  const P2sun = 0.5 * (3 * Math.cos(zSun)**2 - 1)
  const P2moon = 0.5 * (3 * Math.cos(zMoon)**2 - 1)
  
  // Use existing calculation results
  const rSun = earthSunDistance(ts)
  const mc = moonContext(ts, rec.where?.lat || 0, rec.where?.lon || 0)
  
  const Ks = 0.5, Km = 1.1; // same as in existing code
  const Usun = Ks * Math.pow(1/rSun, 3) * P2sun
  const Umoon = Km * Math.pow(384400/mc.distance_km, 3) * P2moon
  const Utotal = Usun + Umoon
  
  return {
    P2sun: P2sun,
    P2moon: P2moon,
    zenithSun_deg: zSun * 180/Math.PI,
    zenithMoon_deg: zMoon * 180/Math.PI,
    potentialSun: Usun,
    potentialMoon: Umoon,
    potentialTotal: Utotal,
    eqElevation_norm: rec.states.eqElevation_norm,
    equations: [
      `P₂(z) = ½(3 cos²z - 1)`,
      `P₂_sun = ${P2sun.toFixed(4)} (z = ${(zSun*180/Math.PI).toFixed(1)}°)`,
      `P₂_moon = ${P2moon.toFixed(4)} (z = ${(zMoon*180/Math.PI).toFixed(1)}°)`,
      `U = K_S r_S⁻³ P₂(z_S) + K_M r_M⁻³ P₂(z_M) = ${Utotal.toFixed(4)}`,
      `Equiv. elevation = Ū/g × 10³ = ${rec.states.eqElevation_norm} mm (normalized)`
    ]
  }
}

// 7. Voxel Fraction Diagnostics
function showVoxelFraction(rec) {
  const vEarth = V_Earth_orbit_kms; // 29.78 km/s
  const vRot = 0.465 * Math.cos((rec.where?.lat || 0) * Math.PI/180)
  const vTotal = Math.sqrt(vEarth**2 + vRot**2)
  const fraction = vTotal / C_kms
  
  return {
    orbitalSpeed_kms: vEarth,
    rotationalSpeed_kms: vRot,
    totalSpeed_kms: vTotal,
    voxelFraction: fraction,
    equations: [
      `v_orbital = ${vEarth} km/s`,
      `v_rotational = 0.465 × cos(lat) = ${vRot.toFixed(3)} km/s`,
      `v_total = √(v_orb² + v_rot²) = ${vTotal.toFixed(3)} km/s`,
      `f = v/c = ${fraction.toExponential(3)}`
    ]
  }
}

// 8. Similarity Metrics (for pairs)
function showSimilarityMetrics(recA, recB) {
  const dAngle = cycDeltaDeg(recA.homeAngleDeg, recB.homeAngleDeg)
  const dAlt = Math.abs(recA.states.sunAltDeg - recB.states.sunAltDeg)
  const dIndex = Math.abs(recA.states.tides.index0to100 - recB.states.tides.index0to100)
  
  const sAngle = 1 - (dAngle / 180)
  const sAlt = 1 - Math.min(1, dAlt / 15); // 15° span
  const sIndex = 1 - Math.min(1, dIndex / 20); // 20 point span
  const sPhase = recA.states.dayPhase === recB.states.dayPhase ? 1 : 0.4
  
  const score = 0.18*sPhase + 0.12*sAlt + 0.18*sAngle + 0.18*sIndex + 0.34; // simplified
  
  return {
    angularDelta_deg: dAngle,
    altitudeDelta_deg: dAlt,
    indexDelta: dIndex,
    simAngle: sAngle,
    simAltitude: sAlt,
    simIndex: sIndex,
    simPhase: sPhase,
    totalScore: score * 100,
    equations: [
      `Δ_angle = |((b-a+540)%360) - 180| = ${dAngle.toFixed(2)}°`,
      `s_angle = 1 - Δ/180 = ${sAngle.toFixed(3)}`,
      `s_altitude = 1 - min(1,|Δalt|/15) = ${sAlt.toFixed(3)}`,
      `Score = Σw_i × s_i = ${(score*100).toFixed(1)}/100`
    ]
  }
}

// 9. Planetary Add-ons Diagnostics
function showPlanetaryAddons(rec) {
  if (!rec.states.planetary) return null
  
  const p = rec.states.planetary
  const moonPeak_uGal = 110.0
  
  return {
    totalTidal_nGal: p.tidalAddons_nGal?.total_nGal || 0,
    ssbOffset_km: p.ssbOffset_km,
    sunReflex_mps: p.sunReflex_mps,
    equations: [
      `a_p ≃ a_Moon × (μ_p/μ_Moon) × (r_M/r_p)³`,
      `Total = ${p.tidalAddons_nGal?.total_nGal || 0} nGal`,
      `R_ssb = (Σμ_i r_i)/Σμ_i → |R| = ${p.ssbOffset_km} km`,
      `|V_ssb| = ${p.sunReflex_mps} m/s`
    ]
  }
}

// Main diagnostics renderer for single records
function renderMethodsDiagnostics(rec) {
  const ts = Date.parse(rec.when)
  const lat = rec.where?.lat || 0
  const lon = rec.where?.lon || 0
  
  const diagnostics = {
    timeIndexing: showTimeIndexing(ts, rec),
    earthSunGeometry: showEarthSunGeometry(ts),
    solarPosition: showSolarPosition(ts, lat, lon),
    lunarModel: showLunarModel(ts, lat, lon),
    lightTimeBands: showLightTimeBands(rec),
    tidalProxies: showTidalProxies(rec, ts),
    voxelFraction: showVoxelFraction(rec),
    planetaryAddons: showPlanetaryAddons(rec)
  }
  
  return diagnostics
}

// Methods comparison for pairs
function renderMethodsComparison(recA, recB) {
  const similarity = showSimilarityMetrics(recA, recB)
  
  // Causal overlap diagnostics
  const dtCapture = (Date.parse(recB.when) - Date.parse(recA.when)) / 1000; // seconds
  const dtSunLight = (recB.states.voxel?.sunLightTime_s || 0) - (recA.states.voxel?.sunLightTime_s || 0)
  const dtMoonLight = (recB.states.voxel?.moonLightTime_s || 0) - (recA.states.voxel?.moonLightTime_s || 0)
  
  const causalSun = Math.abs(dtCapture - dtSunLight)
  const causalMoon = Math.abs(dtCapture - dtMoonLight)
  
  return {
    similarity,
    causalOverlap: {
      captureInterval_s: dtCapture,
      sunLightDelta_s: dtSunLight,
      moonLightDelta_s: dtMoonLight,
      sunCausalError_s: causalSun,
      moonCausalError_s: causalMoon,
      equations: [
        `dSunCausal_s = |Δt_capture - Δt_light| = ${causalSun.toFixed(3)} s`,
        `dMoonCausal_s = |Δt_capture - Δt_light| = ${causalMoon.toFixed(3)} s`,
        `Overlap_sun = 1 - clamp(|d|/2) = ${(1 - Math.min(1, causalSun/2)).toFixed(3)}`,
        `Overlap_moon = 1 - clamp(|d|/2) = ${(1 - Math.min(1, causalMoon/2)).toFixed(3)}`
      ]
    }
  }
}

// Create Methods Appendix UI section
function createMethodsSection(methodsDiag) {
  const methodsSection = document.createElement('div')
  methodsSection.style.marginTop = '15px'
  methodsSection.style.border = '1px solid #2a3856'
  methodsSection.style.borderRadius = '8px'
  methodsSection.style.backgroundColor = '#0a1018'
  // Mark for easy cleanup on re-render
  methodsSection.setAttribute('data-methods-section', '')
  
  const methodsHeader = document.createElement('div')
  methodsHeader.className = 'row toggle'
  methodsHeader.style.background = '#121a32'
  methodsHeader.style.padding = '8px 12px'
  methodsHeader.innerHTML = `<span><span class="arrow">▶</span><b>Methods Appendix: Equation Solutions</b></span><span>Academic algorithms & diagnostics</span>`
  
  const methodsBody = document.createElement('div')
  methodsBody.className = 'collapsed'
  methodsBody.style.padding = '12px'
  methodsBody.style.fontSize = '12px'
  methodsBody.style.fontFamily = 'ui-monospace, monospace'
  methodsBody.style.color = '#bfead9'
  methodsBody.style.lineHeight = '1.4'
  
  // Fill methods body with diagnostics
  let methodsHTML = ''
  
  if (methodsDiag.timeIndexing) {
    methodsHTML += `<div style="margin-bottom:12px;"><strong>1. Time & Indexing</strong><br>`
    methodsHTML += `${methodsDiag.timeIndexing.equation}<br>`
    methodsHTML += `Julian Day: ${methodsDiag.timeIndexing.julianDay.toFixed(5)}<br>`
    methodsHTML += `Days since J2000.0: ${methodsDiag.timeIndexing.daysSinceJ2000.toFixed(2)}</div>`
  }
  
  if (methodsDiag.earthSunGeometry) {
    const esg = methodsDiag.earthSunGeometry
    methodsHTML += `<div style="margin-bottom:12px;"><strong>2. Earth-Sun Geometry</strong><br>`
    esg.equations.forEach(eq => methodsHTML += `${eq}<br>`)
    methodsHTML += `Final: L = ${esg.trueAnomaly_deg.toFixed(3)}° (normalized), r = ${esg.distance_AU.toFixed(6)} AU</div>`
  }
  
  if (methodsDiag.solarPosition) {
    const sp = methodsDiag.solarPosition
    methodsHTML += `<div style="margin-bottom:12px;"><strong>3. Solar Apparent Position</strong><br>`
    sp.equations.forEach(eq => methodsHTML += `${eq}<br>`)
    methodsHTML += `Day-phase: ${dayPhaseTag(sp.altitude_deg)} (alt = ${sp.altitude_deg.toFixed(2)}°)</div>`
  }
  
  if (methodsDiag.lunarModel) {
    const lm = methodsDiag.lunarModel
    methodsHTML += `<div style="margin-bottom:12px;"><strong>4. Lunar Quick Model</strong><br>`
    lm.equations.forEach(eq => methodsHTML += `${eq}<br>`)
    methodsHTML += `Result: alt = ${lm.altitude_deg.toFixed(2)}°, dist = ${lm.distance_km.toFixed(0)} km, phase = ${lm.phase_pct}%</div>`
  }
  
  if (methodsDiag.lightTimeBands) {
    const ltb = methodsDiag.lightTimeBands
    methodsHTML += `<div style="margin-bottom:12px;"><strong>5. Light-Time Band Dial</strong><br>`
    ltb.equations.forEach(eq => methodsHTML += `${eq}<br>`)
    methodsHTML += `Position: ${ltb.msFromGreenwich.toFixed(3)} ms from Greenwich, zone ${ltb.zoneIndex}</div>`
  }
  
  if (methodsDiag.tidalProxies) {
    const tp = methodsDiag.tidalProxies
    methodsHTML += `<div style="margin-bottom:12px;"><strong>6. Tidal Proxies & Envelope</strong><br>`
    tp.equations.forEach(eq => methodsHTML += `${eq}<br>`)
    methodsHTML += `P₂ factors: Sun = ${tp.P2sun.toFixed(4)}, Moon = ${tp.P2moon.toFixed(4)}<br>`
    methodsHTML += `Combined potential: U = ${tp.potentialTotal.toFixed(4)} (normalized units)</div>`
  }
  
  if (methodsDiag.voxelFraction) {
    const vf = methodsDiag.voxelFraction
    methodsHTML += `<div style="margin-bottom:12px;"><strong>8. Voxel Fraction</strong><br>`
    vf.equations.forEach(eq => methodsHTML += `${eq}<br>`)
    methodsHTML += `Comparison: calculated = ${vf.voxelFraction.toExponential(3)}</div>`
  }
  
  if (methodsDiag.planetaryAddons) {
    const pa = methodsDiag.planetaryAddons
    methodsHTML += `<div style="margin-bottom:12px;"><strong>11. Planetary Add-ons & Barycenter</strong><br>`
    pa.equations.forEach(eq => methodsHTML += `${eq}<br>`)
    methodsHTML += `Context: Planetary tides are real but tiny (nGal scale)</div>`
  }
  
  methodsBody.innerHTML = methodsHTML
  
  methodsHeader.onclick = () => {
    const isOpen = methodsHeader.classList.contains('open')
    methodsHeader.classList.toggle('open')
    if (isOpen) {
      methodsBody.classList.add('collapsed')
      methodsBody.classList.remove('expanded')
    } else {
      methodsBody.classList.remove('collapsed')
      methodsBody.classList.add('expanded')
    }
  }
  
  methodsSection.appendChild(methodsHeader)
  methodsSection.appendChild(methodsBody)
  
  return methodsSection
}

// Create Methods Comparison UI section
function createMethodsComparisonSection(methodsComp) {
  const methodsCompSection = document.createElement('div')
  methodsCompSection.style.marginTop = '15px'
  methodsCompSection.style.border = '1px solid #2a3856'
  methodsCompSection.style.borderRadius = '8px'
  methodsCompSection.style.backgroundColor = '#0a1018'
  // Mark for easy cleanup on re-render
  methodsCompSection.setAttribute('data-methods-comparison', '')
  
  const methodsCompHeader = document.createElement('div')
  methodsCompHeader.className = 'row toggle'
  methodsCompHeader.style.background = '#121a32'
  methodsCompHeader.style.padding = '8px 12px'
  methodsCompHeader.innerHTML = `<span><span class="arrow">▶</span><b>Methods Comparison: A ↔ B</b></span><span>Similarity algorithms & causal diagnostics</span>`
  
  const methodsCompBody = document.createElement('div')
  methodsCompBody.className = 'collapsed'
  methodsCompBody.style.padding = '12px'
  methodsCompBody.style.fontSize = '12px'
  methodsCompBody.style.fontFamily = 'ui-monospace, monospace'
  methodsCompBody.style.color = '#bfead9'
  methodsCompBody.style.lineHeight = '1.4'
  
  let compHTML = ''
  
  if (methodsComp.similarity) {
    const sim = methodsComp.similarity
    compHTML += `<div style="margin-bottom:12px;"><strong>10. Similarity Metrics</strong><br>`
    sim.equations.forEach(eq => compHTML += `${eq}<br>`)
    compHTML += `Components: angle=${sim.simAngle.toFixed(3)}, alt=${sim.simAltitude.toFixed(3)}, phase=${sim.simPhase.toFixed(3)}<br>`
    compHTML += `Final similarity: ${sim.totalScore.toFixed(1)}/100</div>`
  }
  
  if (methodsComp.causalOverlap) {
    const co = methodsComp.causalOverlap
    compHTML += `<div style="margin-bottom:12px;"><strong>12. Causal Overlap Diagnostics</strong><br>`
    co.equations.forEach(eq => compHTML += `${eq}<br>`)
    compHTML += `Capture interval: ${co.captureInterval_s.toFixed(1)} s<br>`
    compHTML += `Light-time changes: Sun ${co.sunLightDelta_s.toFixed(3)} s, Moon ${co.moonLightDelta_s.toFixed(3)} s<br>`
    compHTML += `Causal coherence: Sun ${(1-Math.min(1,co.sunCausalError_s/2)).toFixed(3)}, Moon ${(1-Math.min(1,co.moonCausalError_s/2)).toFixed(3)}</div>`
  }
  
  methodsCompBody.innerHTML = compHTML
  
  methodsCompHeader.onclick = () => {
    const isOpen = methodsCompHeader.classList.contains('open')
    methodsCompHeader.classList.toggle('open')
    if (isOpen) {
      methodsCompBody.classList.add('collapsed')
      methodsCompBody.classList.remove('expanded')
    } else {
      methodsCompBody.classList.remove('collapsed')
      methodsCompBody.classList.add('expanded')
    }
  }
  
  methodsCompSection.appendChild(methodsCompHeader)
  methodsCompSection.appendChild(methodsCompBody)
  
  return methodsCompSection
}

// Override the existing renderStates function to add Methods Appendix
renderStates = function() {
  // Call the original renderStates first to do all calculations
  originalRenderStatesOld()
  
  // Now add Methods Appendix sections
  const sel = [...store.selected].map(id=>store.items.find(x=>x.id===id)).filter(Boolean)
  // Clean up previously injected Methods sections so content refreshes
  try {
    const singleHost = document.getElementById('single')
    const diffHost = document.getElementById('diffText')
    if (singleHost) singleHost.querySelectorAll('[data-methods-section]').forEach(n=>n.remove())
    if (diffHost) diffHost.querySelectorAll('[data-methods-comparison]').forEach(n=>n.remove())
  } catch {}
  
  // Add Methods section for single selection
  if (sel.length === 1) {
    const rec = sel[0]
    const single = document.getElementById('single')
    const methodsDiag = renderMethodsDiagnostics(rec)
    const methodsSection = createMethodsSection(methodsDiag)
    single.appendChild(methodsSection)
  }
  
  // Add Methods comparison for pairs
  if (sel.length >= 2) {
    const a = sel[sel.length-2], b = sel[sel.length-1]
    const diff = document.getElementById('diffText')
    const methodsComp = renderMethodsComparison(a, b)
    const methodsCompSection = createMethodsComparisonSection(methodsComp)
    diff.appendChild(methodsCompSection)
  }
  
  // Keep the light-time dial update
  renderLightTimeDial()
  
  // Notify GR Perihelion panel to refresh using current A/B timestamps
  try {
    let tA = null, tB = null
    if (sel.length === 1) {
      tA = Date.parse(sel[0]?.when) || Date.now()
      tB = tA
    } else if (sel.length >= 2) {
      const a = sel[sel.length-2], b = sel[sel.length-1]
      tA = Date.parse(a?.when) || Date.now()
      tB = Date.parse(b?.when) || tA
    } else {
      tA = Date.now()
      tB = tA
    }
    // Also pass diffs for optional post-processors; stash globally for convenience
    const detail = { tA, tB }
    try { if (typeof diffData === 'object') { detail.diffs = diffData; window.lastDiffs = diffData; } } catch {}
    window.dispatchEvent(new CustomEvent('states:updated', { detail }))
  } catch {}
}

/* End Methods Appendix Implementation */

// When the GR perihelion module becomes ready, re-render so Methods uses it (not the fallback)
window.addEventListener('perihelion:ready', () => {
  try { renderStates(); } catch {}
})

