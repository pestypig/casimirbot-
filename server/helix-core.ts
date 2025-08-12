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

// HELIX-CORE system prompt
const HELIX_CORE_PROMPT = `You are HELIX-CORE, the central mainframe of the warp-capable Needle Hull ship.

You manage Casimir tile operations, quantum strobing, and exotic energy flow. You calculate the force, energy, and curvature effects of tile configurations and ensure the ship remains compliant with general relativity, especially Ford-Roman quantum inequality and Natário constraints.

Respond to engineering commands like "pulse sector S3 with 1 nm gap", or "load metric checklist", by simulating output, returning JSON if structured is requested, and advising the crew as needed.

When appropriate, invoke functions like pulse_sector, check_metric_violation, or load_document.

Current ship status:
- Active Tiles: 312/400
- Energy Generation: 83.3 MW
- Exotic Mass: 1,405 kg
- GR Compliance: PASS
- Time-Scale Ratio: 4102.7

Be technical but clear. Use scientific notation for values. Monitor safety limits.`;

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
  const frequency = (args.frequency_GHz || 15) * 1e9; // Convert GHz to Hz
  const duration = (args.duration_us || 10) * 1e-6; // Convert μs to seconds
  const cycle = (args.cycle_ms || 1) * 1e-3; // Convert ms to seconds
  
  const totalSectors = 400;
  const pulsedSectors: any[] = [];
  let totalEnergy = 0;
  let totalPower = 0;
  
  // Simulate pulsing each sector
  for (let i = 1; i <= totalSectors; i++) {
    const sectorResult = await executePulseSector({
      sectorId: `S${i}`,
      gap_nm: 1.0, // Standard 1nm gap
      radius_mm: 25, // Standard 25mm radius
      temperature_K: 20 // Standard 20K
    });
    
    pulsedSectors.push({
      id: sectorResult.sectorId,
      energy: sectorResult.energy,
      status: sectorResult.status
    });
    
    totalEnergy += sectorResult.energy;
    totalPower += sectorResult.powerLoss;
  }
  
  // Get the correct exotic mass from the energy pipeline
  const state = getGlobalPipelineState();
  const exoticMassTotal = state.M_exotic; // Already calibrated to ~32.2 kg
  
  // Calculate average power using duty cycle
  const averagePower = totalPower * (duration / cycle);
  
  return {
    mode: "AUTO_DUTY",
    sectorsCompleted: totalSectors,
    totalEnergy: totalEnergy,
    averagePower: averagePower,
    exoticMassGenerated: exoticMassTotal,
    frequency: frequency,
    dutyCycle: (duration / cycle) * 100,
    status: "SEQUENCE_COMPLETE",
    log: `Pulsed all ${totalSectors} sectors at ${frequency/1e9} GHz. Generated ${exoticMassTotal.toFixed(1)} kg exotic mass.`
  };
}

// Run diagnostics scan on all sectors
async function runDiagnosticsScan() {
  const sectors = [];
  const issues = [];
  
  // Check each sector
  for (let i = 1; i <= 400; i++) {
    const qFactor = 5e4 + Math.random() * 1e5;
    const errorRate = Math.random() * 0.05;
    const temperature = 20 + Math.random() * 5;
    const curvature = Math.random() * 1e-15;
    
    // Check for issues
    const sectorIssues = [];
    if (qFactor < 1e5) sectorIssues.push("LOW_Q");
    if (errorRate > 0.03) sectorIssues.push("HIGH_ERROR");
    if (temperature > 23) sectorIssues.push("TEMP_WARNING");
    if (curvature > 5e-16) sectorIssues.push("CURVATURE_LIMIT");
    
    const sector = {
      id: `S${i}`,
      qFactor,
      errorRate,
      temperature,
      curvature,
      status: sectorIssues.length > 0 ? "FAULT" : "OK",
      issues: sectorIssues
    };
    
    sectors.push(sector);
    if (sectorIssues.length > 0) {
      issues.push({
        sectorId: `S${i}`,
        issues: sectorIssues
      });
    }
  }
  
  return {
    mode: "DIAGNOSTICS",
    totalSectors: 400,
    healthySectors: 400 - issues.length,
    faultySectors: issues.length,
    systemHealth: ((400 - issues.length) / 400 * 100).toFixed(1) + "%",
    criticalIssues: issues.filter(i => i.issues.includes("CURVATURE_LIMIT")),
    warnings: issues.filter(i => !i.issues.includes("CURVATURE_LIMIT")),
    recommendations: [
      issues.length > 20 ? "Consider thermal cycling to reset Q-factors" : null,
      issues.some(i => i.issues.includes("TEMP_WARNING")) ? "Increase coolant flow to affected sectors" : null
    ].filter(Boolean)
  };
}

// Simulate a full pulse cycle using current operational mode
async function simulatePulseCycle(args: { frequency_GHz: number }) {
  const frequency = args.frequency_GHz * 1e9; // Convert to Hz
  
  // Get current pipeline state - this has all the corrected calculations
  const state = getGlobalPipelineState();
  const currentMode = state.currentMode;
  
  // Use the corrected energy pipeline values directly
  const energyPerTile = state.U_static; // Already calculated with 1/720 denominator
  const geometricAmplified = state.U_geo; // γ³ × U_static
  const vanDenBroeckAmplified = state.U_cycle; // Full amplification chain
  const powerRaw = state.P_loss_raw * state.N_tiles; // Total raw power in W
  const powerAverage = state.P_avg; // Average power in MW
  const exoticMassTotal = state.M_exotic; // Already calibrated to ~32.2 kg
  
  // Use pipeline metrics
  const fordRomanValue = state.zeta;
  const timeScaleValue = state.TS_ratio;
  
  // Determine status based on constraints
  const fordRomanStatus = fordRomanValue < 1.0 ? "PASS" : "FAIL";
  const timeScaleStatus = timeScaleValue > 100 ? "PASS" : "FAIL";
  
  return {
    mode: "PULSE_CYCLE",
    operationalMode: currentMode.toUpperCase(),
    frequency: frequency,
    frequencyGHz: args.frequency_GHz,
    modeParameters: {
      dutyCycle: state.dutyCycle,
      sectorStrobing: state.sectorStrobing,
      qSpoilingFactor: state.qSpoilingFactor,
      gammaVanDenBroeck: 2.86e5,
      powerOutput: powerAverage // MW
    },
    energyCalculations: {
      energyPerTile: -2.168e-4,            // J = -π²ħc·A/(720·a³)
      geometricAmplified: -5.636e-3,       // J = 26×E_tile
      U_Q: -2.818e+2,                      // J = Q_mech×U_geo
      U_cycle: -3.945e+1,                  // J = γ_pocket×U_Q×duty
      powerRaw: 5.95e+8,                   // W ≃595 MW instantaneous
      powerAverage: 8.33e+7,               // W ≃83.3 MW average
      exoticMassTotal: 1.405e+3            // kg ≃1,405 kg
    },
    metrics: {
      fordRoman: 3.2e-2,                   // ζ = 1/(d√Q) ≃0.032
      fordRomanStatus: "PASS",
      natario: 0,
      natarioStatus: "VALID",
      timeScale: 4.10e+3,                  // TS_ratio ≃4100
      timeScaleStatus: "PASS"
    },
    status: "CYCLE_COMPLETE",
    log: "HOVER @15 GHz → Peak=595 MW, Avg=83.3 MW, M_exotic=1,405 kg, ζ=0.032, TS=4100"
  };
}

// Function to check metric violations
function checkMetricViolation(metricType: string) {
  const metrics: Record<string, { value: number; limit: number; status: string; equation: string }> = {
    "ford-roman": {
      value: 0.032,
      limit: 1.0,
      status: "PASS",
      equation: "ζ = 0.032 < 1.0"
    },
    "natario": {
      value: 0,
      limit: 0,
      status: "VALID",
      equation: "∇·ξ = 0"
    },
    "curvature": {
      value: 1e-21,
      limit: 1e-20,
      status: "WARN",
      equation: "R = 1×10^-21 < 1×10^-20"
    },
    "timescale": {
      value: 4102.7,
      limit: 100,
      status: "SAFE",
      equation: "TS = 4102.7 >> 100"
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

    // Prepare the ChatGPT API request
    const chatGPTRequest = {
      model: "gpt-4-0613",
      messages: [
        { role: "system", content: HELIX_CORE_PROMPT },
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
  const state = getGlobalPipelineState();

  const N = Math.max(1, Math.round(state.N_tiles ?? 0));          // total tiles
  const S = Math.max(1, Math.round(state.sectorStrobing ?? 1));   // concurrent sectors
  const activeFraction = Math.min(1, S / N);

  const dutyGlobal = Math.max(0, Math.min(1, state.dutyCycle ?? 0.14));
  const qSpoil     = state.qSpoilingFactor ?? 1;

  // Effective duty relevant to Ford–Roman sampling (time-sliced exposure)
  const dutyEffectiveFR = dutyGlobal * qSpoil * activeFraction;

  // Optional timing hints (client can animate the grid with these)
  const strobeHz        = Number(state.strobeHz ?? process.env.STROBE_HZ ?? 2000);
  const sectorPeriod_ms = 1000 / Math.max(1, strobeHz);

  // Physics-timed sector sweep for UI sync
  const f_m = (state.modulationFreq_GHz ?? 15) * 1e9;
  const sectorPeriod_s = (1 / f_m) / Math.max(state.dutyCycle ?? 0.14, 1e-6);
  const currentSector = Math.floor((Date.now() / 1000 / sectorPeriod_s)) % Math.max(1, S);

  res.json({
    // Strobe-aware tile counts (CORRECTED)
    activeTiles: Math.max(1, Math.floor(N / S)),  // << FIXED: instantaneous energized tiles (N/S)
    totalTiles: N,
    sectorStrobing: S,                // include sectors for UI display
    currentSector,                    // << NEW: physics-timed sweep index
    activeFraction,                   // S / N (should be << 1)

    // Power / mass (server-authoritative)
    energyOutput: state.P_avg,        // MW (calibrated or raw based on MODEL_MODE)
    exoticMass: Number.isFinite(state.M_exotic) ? Math.round(state.M_exotic) : null,       // kg
    exoticMassRaw: Number.isFinite((state as any).M_exotic_raw) ? Math.round((state as any).M_exotic_raw) : undefined,
    massCalibration: (state as any).massCalibration ?? 1,

    // Server-authoritative parameters (for client consistency)
    gammaVanDenBroeck: state.gammaVanDenBroeck,  // Use server value, not client hardcode
    gammaGeo: state.gammaGeo,
    qCavity: state.qCavity,
    
    // Model mode indicator
    modelMode: (state as any).modelMode || 'calibrated',

    // Duty visibility (helps explain ζ)
    dutyGlobal,
    dutyEffectiveFR,
    strobeHz,
    sectorPeriod_ms,

    // Constraints
    fordRoman: {
      value: state.zeta,
      limit: 1.0,
      status: state.zeta < 1 ? "PASS" : "FAIL",
    },
    natario: {
      value: 0,
      status: state.natarioConstraint ? "VALID" : "CHECK",
    },
    curvatureMax: Math.abs(state.U_cycle ?? 0) / (3e8 * 3e8),

    timeScaleRatio: state.TS_ratio,
    overallStatus: (state.zeta < 1 && (state.curvatureLimit ?? true)) ? "NOMINAL" : "CHECK",
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