import { Request, Response } from "express";
import { z } from "zod";
import fetch from "node-fetch";
import { 
  initializePipelineState, 
  calculateEnergyPipeline, 
  switchMode,
  updateParameters,
  getGlobalPipelineState,
  setGlobalPipelineState,
  sampleDisplacementField,
  MODE_CONFIGS,
  type EnergyPipelineState 
} from "./energy-pipeline.js";

// ── simple async mutex ───────────────────────────────────────────────────────
class Mutex {
  private p = Promise.resolve();
  lock<T>(fn: () => Promise<T> | T): Promise<T> {
    const run = this.p.then(fn, fn);
    this.p = run.then(() => void 0, () => void 0);
    return run;
  }
}
const pipeMutex = new Mutex();

// Schema for pipeline parameter updates
const UpdateSchema = z.object({
  tileArea_cm2: z.number().min(0.01).max(10_000).optional(),
  gap_nm: z.number().min(0.1).max(1000).optional(),
  sag_nm: z.number().min(0).max(1000).optional(),
  temperature_K: z.number().min(0).max(400).optional(),
  modulationFreq_GHz: z.number().min(0.001).max(1000).optional(),
  gammaGeo: z.number().min(1).max(1e3).optional(),
  qMechanical: z.number().min(0).max(1e6).optional(),
  qCavity: z.number().min(1).max(1e12).optional(),
  gammaVanDenBroeck: z.number().min(0).max(1e16).optional(),
  exoticMassTarget_kg: z.number().min(0).max(1e9).optional(),
  currentMode: z.enum(['hover','cruise','emergency','standby']).optional()
}).strict();

// Schema for ChatGPT function calls
const pulseSectorSchema = z.object({
  sectorId: z.string(),
  gap_nm: z.number(),
  radius_mm: z.number(),
  temperature_K: z.number()
});

const loadDocumentSchema = z.object({
  docId: z.string()
});

const checkMetricViolationSchema = z.object({
  metricType: z.enum(["ford-roman", "natario", "curvature", "timescale"])
});

// map name → schema
const FN_SCHEMAS = {
  pulse_sector: pulseSectorSchema,
  execute_auto_pulse_sequence: z.object({
    frequency_GHz: z.number().optional(),
    duration_us: z.number().optional(),
    cycle_ms: z.number().optional()
  }),
  run_diagnostics_scan: z.object({}),
  simulate_pulse_cycle: z.object({ frequency_GHz: z.number() }),
  load_document: loadDocumentSchema,
  check_metric_violation: checkMetricViolationSchema
} as const;

// Build system prompt from live state
function buildHelixCorePrompt(s: EnergyPipelineState) {
  return `You are HELIX-CORE, the central mainframe of the warp-capable Needle Hull ship.

You manage Casimir tile operations, quantum strobing, and exotic energy flow. You calculate the force, energy, and curvature effects of tile configurations and ensure the ship remains compliant with general relativity, especially Ford-Roman quantum inequality and Natário constraints.

Respond to engineering commands like "pulse sector S3 with 1 nm gap", or "load metric checklist", by simulating output, returning JSON if structured is requested, and advising the crew as needed.

When appropriate, invoke functions like pulse_sector, check_metric_violation, or load_document.

Current ship status:
- Active Sectors: ${s.concurrentSectors}/${s.sectorCount}
- Energy Generation: ${s.P_avg.toFixed(1)} MW
- Exotic Mass: ${Math.round(s.M_exotic)} kg
- GR Compliance: ${s.fordRomanCompliance ? 'PASS' : 'FAIL'}
- Time-Scale Ratio: ${s.TS_ratio?.toFixed(1) ?? '—'}

Be technical but clear. Use scientific notation for values. Monitor safety limits.`;
}

// Function definitions for ChatGPT
const AVAILABLE_FUNCTIONS = [
  {
    name: "pulse_sector",
    description: "Simulate a Casimir pulse on a tile sector",
    parameters: {
      type: "object",
      properties: {
        sectorId: { type: "string", description: "Sector identifier (e.g., S1, S2, etc.)" },
        gap_nm: { type: "number", description: "Gap distance in nanometers" },
        radius_mm: { type: "number", description: "Tile radius in millimeters" },
        temperature_K: { type: "number", description: "Temperature in Kelvin" }
      },
      required: ["sectorId", "gap_nm", "radius_mm", "temperature_K"]
    }
  },
  {
    name: "execute_auto_pulse_sequence",
    description: "Execute automated pulse sequence across all sectors",
    parameters: {
      type: "object",
      properties: {
        frequency_GHz: { type: "number", description: "Modulation frequency in GHz", default: 15 },
        duration_us: { type: "number", description: "Pulse duration in microseconds", default: 10 },
        cycle_ms: { type: "number", description: "Cycle time in milliseconds", default: 1 }
      }
    }
  },
  {
    name: "run_diagnostics_scan",
    description: "Run comprehensive diagnostics on all tile sectors",
    parameters: {
      type: "object", 
      properties: {}
    }
  },
  {
    name: "simulate_pulse_cycle",
    description: "Simulate a full strobing cycle at specified frequency",
    parameters: {
      type: "object",
      properties: {
        frequency_GHz: { type: "number", description: "Modulation frequency in GHz" }
      },
      required: ["frequency_GHz"]
    }
  },
  {
    name: "load_document",
    description: "Overlay a ship theory document for review",
    parameters: {
      type: "object",
      properties: {
        docId: { type: "string", description: "Document identifier" }
      },
      required: ["docId"]
    }
  },
  {
    name: "check_metric_violation",
    description: "Check if a specific GR metric is violated",
    parameters: {
      type: "object",
      properties: {
        metricType: { 
          type: "string", 
          enum: ["ford-roman", "natario", "curvature", "timescale"],
          description: "Type of metric to check"
        }
      },
      required: ["metricType"]
    }
  }
];

// ── Local Casimir helpers (plates) ───────────────────────────────────────────
import { HBAR, C, PI } from "./physics-const.js";

// Energy per area:  E/A = −π² ℏ c / (720 a³)
function casimirEnergyPerTile(gap_m: number, area_m2: number): number {
  const E_over_A = -(PI*PI*HBAR*C) / (720 * Math.pow(gap_m, 3)); // J/m²
  return E_over_A * area_m2;                                      // J
}

// Pressure: P = −π² ℏ c /(240 a⁴),  Force = P·A
function casimirForce(area_m2: number, gap_m: number): number {
  const P = -(PI*PI*HBAR*C) / (240 * Math.pow(gap_m, 4)); // N/m²
  return P * area_m2;                                     // N
}

// Function to execute pulse_sector
async function executePulseSector(args: z.infer<typeof pulseSectorSchema>) {
  const s = getGlobalPipelineState();

  const area_m2 =
    Number.isFinite(args.radius_mm) && args.radius_mm > 0
      ? PI * Math.pow(args.radius_mm * 1e-3, 2)  // use imported PI
      : (s.tileArea_cm2 ?? 25) * 1e-4;                 // pipeline default

  const gap_m = args.gap_nm * 1e-9;
  const energy_J = casimirEnergyPerTile(gap_m, area_m2);
  const force_N  = casimirForce(area_m2, gap_m);

  const powerLoss_W_per_tile = s.P_loss_raw;
  const curvatureMass_kg = Math.abs(energy_J) / (C*C);

  return { sectorId: args.sectorId, gap_m, area_m2, energy_J, force_N,
           powerLoss_W_per_tile, curvatureMass_kg, status: "PULSED" };
}

// Execute automated pulse sequence across all sectors
async function executeAutoPulseSequence(args: { frequency_GHz?: number; duration_us?: number; cycle_ms?: number }) {
  const s = getGlobalPipelineState();
  const totalSectors = Math.max(1, s.sectorCount);
  const tilesPerSector = Math.floor(s.N_tiles / totalSectors);
  const totalTiles = tilesPerSector * totalSectors;

  const frequency_Hz = (args.frequency_GHz ?? s.modulationFreq_GHz ?? 15) * 1e9;

  const base = await executePulseSector({
    sectorId: "S1",
    gap_nm: s.gap_nm ?? 1.0,
    radius_mm: 25,
    temperature_K: s.temperature_K ?? 20
  });

  const energyPerTile_J    = base.energy_J;
  const energyPerSector_J  = energyPerTile_J * tilesPerSector;
  const totalEnergy_J      = energyPerSector_J * totalSectors;

  return {
    mode: "AUTO_DUTY",
    sectorsCompleted: totalSectors,
    tilesPerSector,
    totalTiles,
    energyPerTile_J,
    energyPerSector_J,
    totalEnergy_J,
    averagePower_W: s.P_avg * 1e6,
    exoticMassGenerated_kg: s.M_exotic,
    frequency_Hz,
    dutyCycle_ship_pct: Math.max(0, (s.dutyEffective_FR ?? 0)) * 100,
    status: "SEQUENCE_COMPLETE",
    log: `Pulsed ${totalSectors} sectors (${totalTiles} tiles) @ ${frequency_Hz/1e9} GHz. M_exotic=${s.M_exotic.toFixed(1)} kg.`
  };
}

// Run diagnostics scan on all sectors
async function runDiagnosticsScan() {
  const s = getGlobalPipelineState();
  const totalSectors = Math.max(1, s.sectorCount);
  const baseQ   = s.qCavity || 1e9;
  const baseT_K = s.temperature_K ?? 20;
  const massPerTile = (s.N_tiles > 0) ? (s.M_exotic / s.N_tiles) : 0; // proxy

  const sectors = [];
  const issues  = [];

  const jitter = (k:number, span:number) => 1 + span * Math.sin(0.7*k + 0.13); // deterministic

  for (let i = 1; i <= totalSectors; i++) {
    const jQ  = jitter(i, 0.08);
    const jT  = jitter(i, 0.04);
    const jEr = jitter(i, 0.10);

    const qFactor    = baseQ * jQ;
    const temperature= baseT_K * jT;
    const errorRate  = Math.max(0, 0.02 * (1/Math.max(1e-3, s.qSpoilingFactor ?? 1)) * jEr);
    const curvatureP = Math.abs(s.U_cycle) / (9e16); // J→kg proxy per tile

    const sectorIssues:string[] = [];
    if (qFactor < baseQ * 0.9) sectorIssues.push("LOW_Q");
    if (errorRate > 0.03)      sectorIssues.push("HIGH_ERROR");
    if (temperature > baseT_K + 2.5) sectorIssues.push("TEMP_WARNING");
    if (curvatureP > massPerTile * 1.2) sectorIssues.push("CURVATURE_LIMIT");

    const status = sectorIssues.length ? "FAULT" : "OK";
    const sector = { id:`S${i}`, qFactor, errorRate, temperature, curvature:curvatureP, status, issues:sectorIssues };
    sectors.push(sector);
    if (sectorIssues.length) issues.push({ sectorId: sector.id, issues: sectorIssues });
  }

  return {
    mode: "DIAGNOSTICS",
    totalSectors,
    healthySectors: totalSectors - issues.length,
    faultySectors: issues.length,
    systemHealth: ((totalSectors - issues.length) / totalSectors * 100).toFixed(1) + "%",
    criticalIssues: issues.filter(i => i.issues.includes("CURVATURE_LIMIT")),
    warnings: issues.filter(i => !i.issues.includes("CURVATURE_LIMIT")),
    recommendations: [
      issues.length > totalSectors * 0.05 ? "Consider thermal cycling to nudge Q-factors upward" : null,
      issues.some(i => i.issues.includes("TEMP_WARNING")) ? "Increase coolant flow to affected sectors" : null
    ].filter(Boolean)
  };
}

// Simulate a full pulse cycle using current operational mode
async function simulatePulseCycle(args: { frequency_GHz: number }) {
  const s = getGlobalPipelineState();
  const frequency_Hz = args.frequency_GHz * 1e9;

  const powerRaw_W  = s.P_loss_raw * s.N_tiles; // on-window
  const powerAvg_W  = s.P_avg * 1e6;            // pipeline stores MW

  return {
    mode: "PULSE_CYCLE",
    operationalMode: s.currentMode.toUpperCase(),
    frequency_Hz,
    frequency_GHz: args.frequency_GHz,
    modeParameters: {
      dutyCycle_UI: s.dutyCycle,
      sectorCount: s.sectorCount,
      concurrentSectors: s.concurrentSectors,
      qSpoilingFactor: s.qSpoilingFactor,
      gammaVanDenBroeck: s.gammaVanDenBroeck,
      powerOutput_MW: s.P_avg
    },
    energyCalculations: {
      energyPerTile_J: s.U_static,
      geometricAmplified_J: s.U_geo,
      U_Q_J: s.U_Q,
      U_cycle_J: s.U_cycle,
      powerRaw_W,
      powerAverage_W: powerAvg_W,
      exoticMassTotal_kg: s.M_exotic
    },
    metrics: {
      fordRoman: s.zeta,
      fordRomanStatus: s.fordRomanCompliance ? "PASS" : "FAIL",
      natario: 0,
      natarioStatus: s.natarioConstraint ? "VALID" : "WARN",
      timeScale: s.TS_ratio,
      timeScaleStatus: s.TS_ratio > 100 ? "PASS" : "FAIL"
    },
    status: "CYCLE_COMPLETE",
    log: `${s.currentMode.toUpperCase()} @${args.frequency_GHz} GHz → Peak=${(powerRaw_W/1e6).toFixed(1)} MW, Avg=${s.P_avg.toFixed(1)} MW, M_exotic=${Math.round(s.M_exotic)} kg, ζ=${s.zeta.toFixed(3)}, TS=${Math.round(s.TS_ratio)}`
  };
}

// Function to check metric violations
function checkMetricViolation(metricType: string) {
  const s = getGlobalPipelineState();
  const C2 = 9e16;
  const massPerTile_kg = Math.abs(s.U_cycle) / C2;

  const map = {
    "ford-roman": {
      value: s.zeta, limit: 1.0,
      status: s.fordRomanCompliance ? "PASS" : "FAIL",
      equation: `ζ = ${s.zeta.toPrecision(3)} ${s.zeta < 1 ? "<" : "≥"} 1.0`
    },
    "natario": {
      value: 0, limit: 0,
      status: s.natarioConstraint ? "VALID" : "WARN",
      equation: "∇·ξ = 0"
    },
    "curvature": {
      value: massPerTile_kg, limit: massPerTile_kg * 1.2,
      status: "PASS",
      equation: `m_tile ≈ ${massPerTile_kg.toExponential(2)} kg`
    },
    "timescale": {
      value: s.TS_ratio, limit: 100,
      status: s.TS_ratio > 100 ? "SAFE" : "WARN",
      equation: `TS = ${s.TS_ratio.toFixed(1)}`
    }
  } as const;

  return (map as any)[metricType] || { status: "UNKNOWN", equation: "Metric not found" };
}

// Rate limiting for OpenAI API calls
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  if (record.count >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }
  
  record.count++;
  rateLimitMap.set(clientId, record);
  return true;
}

// Main ChatGPT interaction handler
export async function handleHelixCommand(req: Request, res: Response) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Rate limiting
    const clientId = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientId)) {
      return res.status(429).json({ 
        error: `Rate limit exceeded. Maximum ${RATE_LIMIT_PER_MINUTE} requests per minute.` 
      });
    }
    const { message: userMessage, messages, function_call } = req.body;
    
    // Handle both single message and messages array formats
    const chatMessages = messages || (userMessage ? [{ role: "user", content: userMessage }] : []);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "OPENAI_API_KEY not configured. Please set the API key in environment variables." 
      });
    }

    // BEFORE sending to the API:
    const live = getGlobalPipelineState();
    const chatGPTRequest = {
      model: process.env.HELIX_OPENAI_MODEL || "gpt-4-0613",
      messages: [{ role: "system", content: buildHelixCorePrompt(live) }, ...chatMessages],
      functions: AVAILABLE_FUNCTIONS,
      function_call: function_call || "auto",
      temperature: 0.7
    };

    // Call ChatGPT API with timeout protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.HELIX_OPENAI_TIMEOUT_MS || 30000));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY!}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chatGPTRequest),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ 
        error: `ChatGPT API error: ${error}` 
      });
    }

    const gptResponse = await response.json() as any;
    const message = gptResponse.choices[0].message;

    // Check if GPT wants to call a function
    if (message.function_call) {
      const functionName = message.function_call.name as keyof typeof FN_SCHEMAS;
      const raw = (() => { try { return JSON.parse(message.function_call.arguments || "{}"); } catch { return {}; } })();
      const schema = FN_SCHEMAS[functionName];

      if (!schema) {
        return res.json({ message, functionResult: { error: "Unknown function" } });
      }
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return res.json({ message, functionResult: { error: "Invalid arguments", issues: parsed.error.issues } });
      }

      const args = parsed.data;
      let functionResult;
      switch (functionName) {
        case "pulse_sector": functionResult = await executePulseSector(args); break;
        case "execute_auto_pulse_sequence": functionResult = await executeAutoPulseSequence(args); break;
        case "run_diagnostics_scan": functionResult = await runDiagnosticsScan(); break;
        case "simulate_pulse_cycle": functionResult = await simulatePulseCycle(args); break;
        case "check_metric_violation": functionResult = checkMetricViolation(args.metricType); break;
        case "load_document": functionResult = { docId: args.docId, status: "LOADED", message: "Document overlay ready for display" }; break;
      }
      return res.json({ message, functionResult });
    }

    // Return the regular message
    res.json({ message: message });

  } catch (error) {
    console.error("HELIX-CORE error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    });
  }
}

function setCors(res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Tile status endpoint
export function getTileStatus(req: Request, res: Response) {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const { sectorId } = req.params;
  
  // Mock tile data for demo
  const tileData = {
    id: sectorId,
    qFactor: 5e4 + Math.random() * 1e5,
    errorRate: Math.random() * 0.05,
    temperature: 20 + Math.random() * 5,
    active: Math.random() > 0.3,
    strobing: Math.random() > 0.8,
    curvatureContribution: Math.random() * 1e-15,
    lastPulse: new Date().toISOString()
  };
  
  res.json(tileData);
}

// Initialize the global pipeline state
const pipelineState = calculateEnergyPipeline(initializePipelineState());
setGlobalPipelineState(pipelineState);

// System metrics endpoint (physics-first, strobe-aware)
export function getSystemMetrics(req: Request, res: Response) {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const s = getGlobalPipelineState();

  const totalSectors = Math.max(1, s.sectorCount);
  const concurrent = Math.max(0, s.concurrentSectors || 0);
  const activeFraction = concurrent / totalSectors;

  const strobeHz = Number(s.strobeHz ?? 1000);
  const sectorPeriod_ms = Number(s.sectorPeriod_ms ?? (1000 / Math.max(1, strobeHz)));

  const now = Date.now() / 1000;
  const sweepIdx = Math.floor(now * strobeHz) % totalSectors;

  const tilesPerSector = Math.floor(s.N_tiles / totalSectors);
  const activeTiles = tilesPerSector * concurrent;

  const hull = s.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };
  
  // Canonical geometry fields for visualizer
  const a = hull.Lx_m/2, b = hull.Ly_m/2, c = hull.Lz_m/2;
  const aEff_geo = Math.cbrt(a*b*c);                  // geometric mean (matches sampler)
  const w_m = (s.sag_nm ?? 16) * 1e-9;
  const w_rho = w_m / aEff_geo;
  
  // Optional scene scale helper (if your viewer wants precomputed clip axes):
  const sceneScale = 1 / a;                           // long semi-axis → 1.0
  const axesScene = [a*sceneScale, b*sceneScale, c*sceneScale];
  
  const R_geom = Math.cbrt((hull.Lx_m/2) * (hull.Ly_m/2) * (hull.Lz_m/2));
  const tauLC = Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m) / C;
  const f_m_Hz = (s.modulationFreq_GHz ?? 15) * 1e9;
  const T_m = 1 / f_m_Hz;

  const G = 9.80665;
  const gTargets: Record<string, number> = { hover:0.10*G, cruise:0.05*G, emergency:0.30*G, standby:0.00*G };
  const mode = (s.currentMode ?? 'hover').toLowerCase();
  const gTarget = gTargets[mode] ?? 0;
  const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (C*C)));
  const betaTiltVec: [number, number, number] = [0, -1, 0];

  const C2 = 9e16;
  const massPerTile_kg = Math.abs(s.U_cycle) / C2;

  res.json({
    totalTiles: Math.floor(s.N_tiles),
    activeTiles, tilesPerSector,
    totalSectors, activeSectors: concurrent, activeFraction,
    sectorStrobing: concurrent, currentSector: sweepIdx,

    strobeHz, sectorPeriod_ms,

    hull,

    shiftVector: { epsilonTilt, betaTiltVec, gTarget, R_geom, gEff_check: epsilonTilt * (C*C) / R_geom },

    energyOutput_MW: s.P_avg,
    exoticMass_kg: Math.round(s.M_exotic),
    exoticMassRaw_kg: Math.round(s.M_exotic_raw ?? s.M_exotic),

    timeScaleRatio: s.TS_ratio,
    tauLC_s: tauLC, T_m_s: T_m,
    timescales: {
      f_m_Hz, T_m_s: T_m,
      L_long_m: Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m),
      T_long_s: tauLC,
      TS_long: s.TS_long ?? s.TS_ratio,
      TS_geom: s.TS_geom ?? s.TS_ratio
    },

    dutyGlobal_UI: s.dutyCycle,
    dutyEffectiveFR: s.dutyEffective_FR,

    gammaVanDenBroeck: s.gammaVanDenBroeck,
    gammaGeo: s.gammaGeo,
    qCavity: s.qCavity,

    fordRoman: { value: s.zeta, limit: 1.0, status: s.fordRomanCompliance ? "PASS" : "FAIL" },
    natario:   { value: 0, status: s.natarioConstraint ? "VALID" : "WARN" },

    massPerTile_kg,
    overallStatus: s.overallStatus ?? (s.fordRomanCompliance ? "NOMINAL" : "CRITICAL"),

    tiles: { tileArea_cm2: s.tileArea_cm2, hullArea_m2: s.hullArea_m2 ?? null, N_tiles: s.N_tiles },

    geometry: { Lx_m: hull.Lx_m, Ly_m: hull.Ly_m, Lz_m: hull.Lz_m, TS_ratio: s.TS_ratio, TS_long: s.TS_long, TS_geom: s.TS_geom },

    axes_m: [a, b, c],
    axesScene,                // for immediate camera fit
    wallWidth_m: w_m,
    wallWidth_rho: w_rho,     // use this in shaders & geometry
    aEff_geo_m: aEff_geo,

    viz: (() => {
      const gammaGeo = s.gammaGeo ?? 26;
      const dAa      = s.qSpoilingFactor ?? 1;
      const gammaVdB = s.gammaVanDenBroeck ?? 1;
      const sectors  = Math.max(1, s.concurrentSectors || 1);

      // "UI-like" (what your current shader expects if it divides by sectors)
      const dutyUI   = Math.max(1e-12, s.dutyCycle ?? 0.14);
      const thetaScale_UI_like =
        Math.pow(gammaGeo,3) * dAa * gammaVdB * Math.sqrt(dutyUI / sectors);

      // "FR-like" (ship-wide exposure already averaged)
      const dutyFR   = Math.max(1e-12, s.dutyEffective_FR ?? dutyUI / sectors);
      const thetaScale_FR_like =
        Math.pow(gammaGeo,3) * dAa * gammaVdB * Math.sqrt(dutyFR);

      return {
        thetaScale_UI_like,
        thetaScale_FR_like,
        dutyUI, dutyFR, sectors
      };
    })(),

    modelMode: s.modelMode ?? "calibrated"
  });
}

// Get full pipeline state
export function getPipelineState(req: Request, res: Response) {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const state = getGlobalPipelineState();
  res.json(state);
}

// Update pipeline parameters
export async function updatePipelineParams(req: Request, res: Response) {
  try {
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid parameters", issues: parsed.error.issues });
    }
    const newState = await pipeMutex.lock(() => {
      const curr = getGlobalPipelineState();
      const next = updateParameters(curr, parsed.data);
      setGlobalPipelineState(next);
      return next;
    });
    res.json(newState);
  } catch (error) {
    res.status(400).json({ error: "Failed to update parameters", details: error instanceof Error ? error.message : "Unknown error" });
  }
}

// Switch operational mode
export async function switchOperationalMode(req: Request, res: Response) {
  try {
    const { mode } = req.body;
    if (!['hover','cruise','emergency','standby'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    const newState = await pipeMutex.lock(() => {
      const curr = getGlobalPipelineState();
      const next = switchMode(curr, mode as EnergyPipelineState['currentMode']);
      setGlobalPipelineState(next);
      return next;
    });
    res.json({ success: true, mode, state: newState, config: MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS] });
  } catch (error) {
    res.status(400).json({ error: "Failed to switch mode", details: error instanceof Error ? error.message : "Unknown error" });
  }
}

// Get HELIX metrics (alias for compatibility)
export function getHelixMetrics(req: Request, res: Response) {
  return getSystemMetrics(req, res);
}

// Get displacement field samples for physics validation
export function getDisplacementField(req: Request, res: Response) {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const s = getGlobalPipelineState();
    const q = req.query;
    const sectors = q.sectors ? Number(q.sectors) : s.sectorCount;
    const split = q.split ? Number(q.split) : Math.floor(s.sectorCount/2);
    const data = sampleDisplacementField(s, {
      nTheta: q.nTheta ? Number(q.nTheta) : undefined,
      nPhi: q.nPhi ? Number(q.nPhi) : undefined,
      sectors, split,
      wallWidth_m: q.wallWidth_m ? Number(q.wallWidth_m) : undefined,
      shellOffset: q.shellOffset ? Number(q.shellOffset) : undefined,
    });
    res.json({
      count: data.length,
      axes: s.hull,
      w_m: (s.sag_nm ?? 16) * 1e-9,
      physics: {
        gammaGeo: s.gammaGeo,
        qSpoiling: s.qSpoilingFactor,
        sectorCount: s.sectorCount,
        concurrentSectors: s.concurrentSectors
      },
      data
    });
  } catch (e) {
    console.error("field endpoint error:", e);
    res.status(500).json({ error: "field sampling failed" });
  }
}