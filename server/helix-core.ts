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
    description: "Execute automated pulse sequence across all 400 sectors",
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

// Function to execute pulse_sector
async function executePulseSector(args: z.infer<typeof pulseSectorSchema>) {
  // Get the current energy pipeline state for accurate values
  const state = getGlobalPipelineState();
  
  // Use the corrected energy values from the pipeline
  // Energy per tile is already calculated with correct 1/720 denominator
  const energyPerTile = state.U_static; // -8.305e-11 J
  
  // Power loss per tile from the pipeline
  const powerLossPerTile = state.P_loss_raw; // W per tile
  
  // Calculate curvature contribution
  const c = 3e8; // Speed of light
  const curvatureContribution = Math.abs(energyPerTile) / (c * c);
  
  // Force calculation (approximate from energy gradient)
  const gap = args.gap_nm * 1e-9; // Convert to meters
  const force = -Math.abs(energyPerTile) / gap; // Approximate force
  
  return {
    sectorId: args.sectorId,
    energy: energyPerTile,
    force: force,
    powerLoss: powerLossPerTile,
    curvatureContribution: curvatureContribution,
    status: "PULSED"
  };
}

// Execute automated pulse sequence across all sectors
async function executeAutoPulseSequence(args: { frequency_GHz?: number; duration_us?: number; cycle_ms?: number }) {
  const s = getGlobalPipelineState();
  const totalSectors = Math.max(1, s.sectorCount || 400);

  const frequency = (args.frequency_GHz ?? s.modulationFreq_GHz ?? 15) * 1e9;
  const duration  = (args.duration_us ?? 10) * 1e-6;
  const cycle     = (args.cycle_ms   ?? 1)  * 1e-3;

  // Pulse one canonical sector (identical parameters shipwide)
  const base = await executePulseSector({
    sectorId: `S1`,
    gap_nm: s.gap_nm ?? 1.0,
    radius_mm: 25,
    temperature_K: s.temperature_K ?? 20
  });

  const pulsedSectors = Array.from({length: totalSectors}, (_,i)=>({
    id: `S${i+1}`, energy: base.energy, status: "PULSED"
  }));

  const totalEnergy = base.energy * totalSectors;
  const averagePower = s.P_avg * 1e6; // W
  const exoticMassTotal = s.M_exotic;

  return {
    mode: "AUTO_DUTY",
    sectorsCompleted: totalSectors,
    totalEnergy,
    averagePower,
    exoticMassGenerated: exoticMassTotal,
    frequency,
    dutyCycle: (duration / cycle) * 100,
    status: "SEQUENCE_COMPLETE",
    log: `Pulsed ${totalSectors} sectors @ ${frequency/1e9} GHz. M_exotic=${exoticMassTotal.toFixed(1)} kg.`
  };
}

// Run diagnostics scan on all sectors
async function runDiagnosticsScan() {
  const s = getGlobalPipelineState();
  const totalSectors = Math.max(1, s.sectorCount || 400);
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
  const state = getGlobalPipelineState();
  const frequency = args.frequency_GHz * 1e9;

  const powerRaw_W = state.P_loss_raw * state.N_tiles; // on-window
  const powerAvg_W = state.P_avg * 1e6;               // pipeline is MW
  const fordRomanStatus = state.fordRomanCompliance ? "PASS" : "FAIL";
  const timeScaleStatus = (state.TS_ratio > 100) ? "PASS" : "FAIL";

  return {
    mode: "PULSE_CYCLE",
    operationalMode: state.currentMode.toUpperCase(),
    frequency,
    frequencyGHz: args.frequency_GHz,
    modeParameters: {
      dutyCycle: state.dutyCycle,
      sectorCount: state.sectorCount,
      concurrentSectors: state.concurrentSectors,
      qSpoilingFactor: state.qSpoilingFactor,
      gammaVanDenBroeck: state.gammaVanDenBroeck,
      powerOutputMW: state.P_avg
    },
    energyCalculations: {
      energyPerTile: state.U_static,
      geometricAmplified: state.U_geo,
      U_Q: state.U_Q,
      U_cycle: state.U_cycle,
      powerRaw_W,
      powerAverage_W: powerAvg_W,
      exoticMassTotal_kg: state.M_exotic
    },
    metrics: {
      fordRoman: state.zeta,
      fordRomanStatus,
      natario: 0,
      natarioStatus: state.natarioConstraint ? "VALID" : "WARN",
      timeScale: state.TS_ratio,
      timeScaleStatus
    },
    status: "CYCLE_COMPLETE",
    log: `${state.currentMode.toUpperCase()} @${args.frequency_GHz} GHz → Peak=${(powerRaw_W/1e6).toFixed(1)} MW, Avg=${state.P_avg.toFixed(1)} MW, M_exotic=${Math.round(state.M_exotic)} kg, ζ=${state.zeta.toFixed(3)}, TS=${Math.round(state.TS_ratio)}`
  };
}

// Function to check metric violations
function checkMetricViolation(metricType: string) {
  const s = getGlobalPipelineState();
  const C2 = 9e16;
  const massPerTile = Math.abs(s.U_cycle) / C2;

  const metrics: Record<string, { value: number; limit: number; status: string; equation: string }> = {
    "ford-roman": {
      value: s.zeta,
      limit: 1.0,
      status: s.fordRomanCompliance ? "PASS" : "FAIL",
      equation: `ζ = ${s.zeta.toPrecision(3)} ${s.zeta<1?'<' : '>='} 1.0`
    },
    "natario": {
      value: 0,
      limit: 0,
      status: s.natarioConstraint ? "VALID" : "WARN",
      equation: "∇·ξ = 0"
    },
    "curvature": {
      value: massPerTile,
      limit: massPerTile * 1.2, // placeholder policy: 20% headroom per tile
      status: "PASS",
      equation: `m_tile ≈ ${massPerTile.toExponential(2)} kg`
    },
    "timescale": {
      value: s.TS_ratio,
      limit: 100,
      status: s.TS_ratio > 100 ? "SAFE" : "WARN",
      equation: `TS = ${s.TS_ratio.toFixed(1)} ${s.TS_ratio>100?'>>' : '<'} 100`
    }
  };
  return metrics[metricType] || { status: "UNKNOWN", equation: "Metric not found" };
}

// Main ChatGPT interaction handler
export async function handleHelixCommand(req: Request, res: Response) {
  try {
    const { message: userMessage, messages, functions, function_call } = req.body;
    
    // Handle both single message and messages array formats
    const chatMessages = messages || (userMessage ? [{ role: "user", content: userMessage }] : []);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "OPENAI_API_KEY not configured. Please set the API key in environment variables." 
      });
    }

    // BEFORE sending to the API:
    const liveState = getGlobalPipelineState();
    const chatGPTRequest = {
      model: "gpt-4-0613",
      messages: [
        { role: "system", content: buildHelixCorePrompt(liveState) },
        ...chatMessages
      ],
      functions: AVAILABLE_FUNCTIONS,
      function_call: function_call || "auto",
      temperature: 0.7
    };

    // Call ChatGPT API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chatGPTRequest)
    });

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
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments);

      let functionResult;
      switch (functionName) {
        case "pulse_sector":
          functionResult = await executePulseSector(functionArgs);
          break;
        case "execute_auto_pulse_sequence":
          functionResult = await executeAutoPulseSequence(functionArgs);
          break;
        case "run_diagnostics_scan":
          functionResult = await runDiagnosticsScan();
          break;
        case "simulate_pulse_cycle":
          functionResult = await simulatePulseCycle(functionArgs);
          break;
        case "check_metric_violation":
          functionResult = checkMetricViolation(functionArgs.metricType);
          break;
        case "load_document":
          functionResult = { 
            docId: functionArgs.docId, 
            status: "LOADED",
            message: "Document overlay ready for display" 
          };
          break;
        default:
          functionResult = { error: "Unknown function" };
      }

      // Return both the function call and result
      return res.json({
        message: message,
        functionResult: functionResult
      });
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

// Tile status endpoint
export function getTileStatus(req: Request, res: Response) {
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
  const s = getGlobalPipelineState();

  const totalSectors = Math.max(1, s.sectorCount || 400);
  const concurrent   = Math.max(0, s.concurrentSectors || 0);
  const activeFraction = totalSectors ? (concurrent / totalSectors) : 0;

  const strobeHz        = Number(s.strobeHz ?? 1000);
  const sectorPeriod_ms = Number(s.sectorPeriod_ms ?? (1000 / Math.max(1, strobeHz)));

  // current sector index for UI sweep: wrap over totalSectors at strobe rate
  const now = Date.now() / 1000;
  const sweepIdx = Math.floor(now * strobeHz) % totalSectors;

  const tilesPerSector = Math.floor(s.N_tiles / totalSectors);
  const activeTiles    = tilesPerSector * concurrent;

  const hull = s.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };
  const R_geom = Math.cbrt((hull.Lx_m/2) * (hull.Ly_m/2) * (hull.Lz_m/2));

  const C = 299_792_458;
  const tauLC = (Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m)) / C;
  const f_m_Hz = (s.modulationFreq_GHz ?? 15) * 1e9;
  const T_m = 1 / f_m_Hz;

  // interior tilt target (same as visualizer)
  const G = 9.80665;
  const gTargets: Record<string, number> = { hover:0.10*G, cruise:0.05*G, emergency:0.30*G, standby:0.00*G };
  const mode = (s.currentMode ?? 'hover').toLowerCase();
  const gTarget = gTargets[mode] ?? 0;
  const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (C*C)));
  const betaTiltVec: [number, number, number] = [0, -1, 0];

  const C2 = 9e16;
  const massPerTile_kg = Math.abs(s.U_cycle) / C2; // proxy that aligns with visual layer

  res.json({
    // sectors/tiles
    totalSectors, activeSectors: concurrent, activeFraction,
    tilesPerSector, totalTiles: Math.floor(s.N_tiles), activeTiles,
    sectorStrobing: concurrent, // legacy alias
    currentSector: sweepIdx,

    // timing
    strobeHz, sectorPeriod_ms,

    // hull
    hull,

    // shift vector (interior gravity)
    shiftVector: {
      epsilonTilt, betaTiltVec, gTarget, R_geom,
      gEff_check: epsilonTilt * (C*C) / R_geom
    },

    // power/mass
    energyOutput: s.P_avg,                 // MW
    exoticMass: Math.round(s.M_exotic),    // kg
    exoticMassRaw: Math.round(s.M_exotic_raw ?? s.M_exotic),

    // time-scale components
    timeScaleRatio: s.TS_ratio,
    tauLC, T_m,
    timescales: {
      f_m_Hz, T_m_s: T_m,
      L_long_m: Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m),
      T_long_s: tauLC,
      TS_long: s.TS_long ?? s.TS_ratio,
      TS_geom: s.TS_geom ?? s.TS_ratio
    },

    // GR / safety
    dutyGlobal: s.dutyCycle,                // UI duty
    dutyInstant: s.dutyEffective_FR,        // ship-wide FR duty (same as pipeline)
    dutyEffectiveFR: s.dutyEffective_FR,
    gammaVanDenBroeck: s.gammaVanDenBroeck,
    gammaGeo: s.gammaGeo,
    qCavity: s.qCavity,
    fordRoman: { value: s.zeta, limit: 1.0, status: s.fordRomanCompliance ? "PASS" : "FAIL" },
    natario:   { value: 0, status: s.natarioConstraint ? "VALID" : "WARN" },

    // proxies used by UI
    massPerTile_kg,
    overallStatus: s.overallStatus ?? (s.fordRomanCompliance ? "NOMINAL" : "CRITICAL"),

    // tiles meta
    tiles: {
      tileArea_cm2: s.tileArea_cm2,
      hullArea_m2: s.hullArea_m2 ?? null,
      N_tiles: s.N_tiles
    },

    // legacy
    geometry: {
      Lx_m: hull.Lx_m, Ly_m: hull.Ly_m, Lz_m: hull.Lz_m,
      TS_ratio: s.TS_ratio, TS_long: s.TS_long, TS_geom: s.TS_geom
    },

    modelMode: s.modelMode ?? "calibrated"
  });
}

// Get full pipeline state
export function getPipelineState(req: Request, res: Response) {
  const state = getGlobalPipelineState();
  res.json(state);
}

// Update pipeline parameters
export function updatePipelineParams(req: Request, res: Response) {
  try {
    const params = req.body;
    const currentState = getGlobalPipelineState();
    const newState = updateParameters(currentState, params);
    setGlobalPipelineState(newState);
    res.json(newState);
  } catch (error) {
    res.status(400).json({ 
      error: "Failed to update parameters",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Switch operational mode
export function switchOperationalMode(req: Request, res: Response) {
  try {
    const { mode } = req.body;
    if (!['hover', 'cruise', 'emergency', 'standby'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    
    const currentState = getGlobalPipelineState();
    const newState = switchMode(currentState, mode as EnergyPipelineState['currentMode']);
    setGlobalPipelineState(newState);
    
    res.json({
      success: true,
      mode,
      state: newState,
      config: MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS]
    });
  } catch (error) {
    res.status(400).json({ 
      error: "Failed to switch mode",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get HELIX metrics (alias for compatibility)
export function getHelixMetrics(req: Request, res: Response) {
  return getSystemMetrics(req, res);
}

// Get displacement field samples for physics validation
export function getDisplacementField(req: Request, res: Response) {
  try {
    const state = getGlobalPipelineState();
    const q = req.query;
    const data = sampleDisplacementField(state, {
      nTheta: q.nTheta ? Number(q.nTheta) : undefined,
      nPhi: q.nPhi ? Number(q.nPhi) : undefined,
      sectors: q.sectors ? Number(q.sectors) : undefined,
      split: q.split ? Number(q.split) : undefined,
      wallWidth_m: q.wallWidth_m ? Number(q.wallWidth_m) : undefined,
      shellOffset: q.shellOffset ? Number(q.shellOffset) : undefined,
    });
    res.json({ 
      count: data.length, 
      axes: state.hull, 
      w_m: (state.sag_nm ?? 16) * 1e-9, 
      physics: {
        gammaGeo: state.gammaGeo,
        qSpoiling: state.qSpoilingFactor,
        sectorStrobing: state.sectorStrobing
      },
      data 
    });
  } catch (e) {
    console.error("field endpoint error:", e);
    res.status(500).json({ error: "field sampling failed" });
  }
}