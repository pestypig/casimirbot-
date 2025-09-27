import { Request, Response } from "express";
import { z } from "zod";
// Use built-in fetch when available (Node ≥18), fallback to node-fetch
import { 
  initializePipelineState, 
  calculateEnergyPipeline, 
  switchMode,
  updateParameters,
  computeEnergySnapshot,
  getGlobalPipelineState,
  setGlobalPipelineState,
  sampleDisplacementField,
  MODE_CONFIGS
} from "./energy-pipeline";
// Import the type on a separate line to avoid esbuild/tsx parse grief
import type { EnergyPipelineState } from "./energy-pipeline";
import { writePhaseCalibration } from "./utils/phase-calibration.js";
// ROBUST speed of light import: handle named/default or missing module gracefully
import { C } from './utils/physics-const-safe';

/**
 * Monotonic sequence for pipeline snapshots served via GET /api/helix/pipeline.
 * Survives hot-reloads within the node process; resets on process restart.
 */
let __PIPE_SEQ = 0;

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

// Simple server-side event publisher (placeholder for future WebSocket integration)
function publish(event: string, payload: any) {
  // TODO: Integrate with WebSocket broadcaster when available
  console.log(`[SERVER-EVENT] ${event}:`, payload);
}

// Schema for pipeline parameter updates
const UpdateSchema = z.object({
  tileArea_cm2: z.number().min(0.01).max(10_000).optional(),
  gap_nm: z.number().min(0.1).max(1000).optional(),
  sag_nm: z.number().min(0).max(1000).optional(),
  temperature_K: z.number().min(0).max(400).optional(),
  modulationFreq_GHz: z.number().min(0.001).max(1000).optional(),
/* BEGIN STRAY_DUPLICATED_BLOCK - commented out to fix top-level parse errors
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const s = getGlobalPipelineState();

    const totalSectors = Math.max(1, s.sectorCount);
    const concurrent = Math.max(1, s.concurrentSectors || 1); // must be ≥1 to allocate buffers
    const activeFraction = concurrent / totalSectors;

    const strobeHz = Number(s.strobeHz ?? 1000);
    const sectorPeriod_ms = Number(s.sectorPeriod_ms ?? (1000 / Math.max(1, strobeHz)));

    const now = Date.now() / 1000;
    const sweepIdx = Math.floor(now * strobeHz) % totalSectors;

    const tilesPerSector = Math.floor(s.N_tiles / totalSectors);
    const activeTiles = tilesPerSector * concurrent;

    const hull = s.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };

    // Canonical geometry fields for visualizer
    let a: number, b: number, c: number;
    if (hull) {

    const strobeHz = Number(s.strobeHz ?? 1000);
    const sectorPeriod_ms = Number(s.sectorPeriod_ms ?? (1000 / Math.max(1, strobeHz)));

    const now = Date.now() / 1000;
    const sweepIdx = Math.floor(now * strobeHz) % totalSectors;

    const tilesPerSector = Math.floor(s.N_tiles / totalSectors);
    const activeTiles = tilesPerSector * concurrent;

    const hull = s.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };

    // Canonical geometry fields for visualizer
    let a: number, b: number, c: number;
    if (hull) {
      a = hull.Lx_m / 2;
      b = hull.Ly_m / 2;
      c = hull.Lz_m / 2;
    } else {
      // Default values if hull is undefined
      a = 1007 / 2;
      b = 264 / 2;
      c = 173 / 2;
    }

    const aEff_geo  = Math.cbrt(a*b*c);                 // geometric mean (legacy)
    const aEff_harm = 3 / (1/a + 1/b + 1/c);            // ✅ harmonic mean — matches viewer
    const w_m       = (s.sag_nm ?? 16) * 1e-9;
    const w_rho_harm = w_m / aEff_harm;
    const w_rho_geo  = w_m / aEff_geo;

    // Optional scene scale helper (if your viewer wants precomputed clip axes):
    const sceneScale = 1 / Math.max(a, 1e-9);           // long semi-axis → 1.0
    const axesScene = [a*sceneScale, b*sceneScale, c*sceneScale];

    const R_geom = Math.cbrt((hull.Lx_m/2) * (hull.Ly_m/2) * (hull.Lz_m/2));

    // --- Duty & θ chain (canonical) ---
    const dutyLocal    = Number.isFinite((s as any).localBurstFrac)
      ? Math.max(1e-12, (s as any).localBurstFrac as number)
      : Math.max(1e-12, s.dutyCycle ?? 0.01); // ✅ default 1%

    // UI duty (per-sector knob, averaged by UI over all sectors)
    const dutyUI = Math.max(1e-12, s.dutyCycle ?? dutyLocal);

    // Ford–Roman ship-wide duty (used for REAL)
    const dutyFR = Math.max(1e-12, (s as any).dutyEffectiveFR ??
                                       (s as any).dutyEffective_FR ??
                                       (dutyLocal * (concurrent / totalSectors)));

    const γg   = s.gammaGeo ?? 26;
    const qsp  = s.qSpoilingFactor ?? 1;
    const γvdb = s.gammaVanDenBroeck ?? 0;             // ← use calibrated value from pipeline
    const γ3 = Math.pow(γg, 3);

    // ✅ physics-true, FR-averaged — NO sqrt
    const theta_FR = γ3 * qsp * γvdb * dutyFR;
    // keep a UI-only label if you want, but don't use it in engines
    const theta_UI = γ3 * qsp * γvdb * dutyUI;

    // Canonical, engine-facing bundle
    const warpUniforms = {
      // geometry (semi-axes in meters)
      hull: { a, b, c },
      axesScene,
      wallWidth_m: w_m,
      wallWidth_rho: w_rho_harm,

      // sectors & duties
      sectorCount: totalSectors,    // total
      sectors: concurrent,          // concurrent
      dutyCycle: dutyUI,            // UI knob
      dutyEffectiveFR: dutyFR,      // REAL θ uses this

      // physics chain
      gammaGeo: γg,
      gammaVdB: γvdb,               // ✅ canonical short key
      deltaAOverA: qsp,             // ✅ canonical for qSpoilingFactor
      currentMode: s.currentMode ?? 'hover'
    };
    const tauLC = Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m) / C;
    const f_m_Hz = (s.modulationFreq_GHz ?? 15) * 1e9;
    const T_m = 1 / f_m_Hz;

    const G = 9.80665;
    const gTargets: Record<string, number> = { hover:0.10*G, cruise:0.05*G, emergency:0.30*G, standby:0.00*G };
    const mode = (s.currentMode ?? 'hover').toLowerCase();
    const gTarget = gTargets[mode] ?? 0;
    const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (C*C)));
    const betaTiltVec: [number, number, number] = [0, -1, 0]; // "down" direction
    const gEff_check = (epsilonTilt * (C*C)) / R_geom;

  const C2 = C * C;
  const massPerTile_kg = Math.abs(s.U_cycle) / C2;

    // Canonical warpUniforms packet for consistent engine data
    const canonicalWarpUniforms = {
      // authoritative amps & duty for engines
      gammaGeo: s.gammaGeo,
      qSpoilingFactor: s.qSpoilingFactor,
      gammaVanDenBroeck: s.gammaVanDenBroeck,
      dutyEffectiveFR: dutyFR,
      sectorCount: totalSectors,
      sectors: concurrent,
      colorMode: "theta" as const,
      physicsParityMode: false,   // REAL should flip to true at callsite
      ridgeMode: 1,
      // expected θ from pipeline (linear duty)
  // CANONICAL: authoritative ship-wide theta used by engines
  // θ = γ_geo^3 · q · γ_VdB · duty_FR
  thetaScale: theta_FR,
    };

    // lightweight server-side audit (optional but handy)
    const thetaExpected = canonicalWarpUniforms.thetaScale;
    const thetaUsedByServer = thetaExpected; // server isn't forcing; used for compare in clients
    const thetaAudit = {
      expected: thetaExpected,
      used: thetaUsedByServer,
      ratio: thetaExpected > 0 ? (thetaUsedByServer / thetaExpected) : 1
    };

    // 🔁 add time-loop info needed by the viewer & charts
    const burst_ms = dutyLocal * sectorPeriod_ms;
    const cyclesPerBurst = (burst_ms / 1000) * f_m_Hz; // ✅ tell client exactly how many carrier cycles fit

    res.json({
      totalTiles: Math.floor(s.N_tiles),
      activeTiles, tilesPerSector,
      totalSectors,
      activeSectors: concurrent,
      activeFraction,
      sectorStrobing: concurrent,   // concurrent (live) sectors
      currentSector: sweepIdx,

      // make mode & inputs visible to UI
      currentMode: s.currentMode,
      dutyCycle: s.dutyCycle,
      sectorCount: totalSectors,

      strobeHz, sectorPeriod_ms,

      hull,

      shiftVector: { epsilonTilt, betaTiltVec, gTarget, R_geom, gEff_check },

      energyOutput_MW: s.P_avg,
      energyOutput_W:  s.P_avg * 1e6,
      energyOutput:    s.P_avg,
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
      dutyEffectiveFR: (s as any).dutyEffectiveFR ?? (s as any).dutyEffective_FR,

      gammaVanDenBroeck: s.gammaVanDenBroeck,
      gammaGeo: s.gammaGeo,
      qCavity: s.qCavity,

      fordRoman: { value: s.zeta, limit: 1.0, status: s.fordRomanCompliance ? "PASS" : "FAIL" },
      natario:   { value: 0, status: s.natarioConstraint ? "PASS" : "WARN" },

      massPerTile_kg,
      overallStatus: s.overallStatus ?? (s.fordRomanCompliance ? "NOMINAL" : "CRITICAL"),

      tiles: { tileArea_cm2: s.tileArea_cm2, hullArea_m2: s.hullArea_m2 ?? null, N_tiles: s.N_tiles },
    });
  } catch (err:any) {
    console.error('[getSystemMetrics] handler error:', err?.message ?? err);
    res.status(500).json({ error: 'metrics_failed', message: err?.message ?? String(err) });
  }
/* BEGIN STRAY_ORPHAN_SUMMARY - commented out to fix top-level parse errors
    energyPerSector_J,
    totalEnergy_J,
    averagePower_W: s.P_avg * 1e6,
    exoticMassGenerated_kg: s.M_exotic,
    frequency_Hz,
    dutyCycle_ship_pct: Math.max(0, (s.dutyEffective_FR ?? 0)) * 100,
    dutyCycle_requested_pct: dutyReq != null ? dutyReq*100 : null,
    status: "SEQUENCE_COMPLETE",
    log: `Pulsed ${totalSectors} sectors (${totalTiles} tiles) @ ${frequency_Hz/1e9} GHz. M_exotic=${s.M_exotic.toFixed(1)} kg.`
  };
*/

});
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
    operationalMode: s.currentMode?.toUpperCase?.() ?? "HOVER",
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
    log: `${s.currentMode?.toUpperCase?.() ?? "HOVER"} @${args.frequency_GHz} GHz → Peak=${(powerRaw_W/1e6).toFixed(1)} MW, Avg=${s.P_avg.toFixed(1)} MW, M_exotic=${Math.round(s.M_exotic)} kg, ζ=${s.zeta.toFixed(3)}, TS=${Math.round(s.TS_ratio)}`
  };
}

// Function to check metric violations
function checkMetricViolation(metricType: string) {
  const s = getGlobalPipelineState();
  const C2 = C * C;
  const massPerTile_kg = Math.abs(s.U_cycle) / C2;

  const map = {
    "ford-roman": {
      value: s.zeta, limit: 1.0,
      status: s.fordRomanCompliance ? "PASS" : "FAIL",
      equation: `ζ = ${s.zeta.toPrecision(3)} ${s.zeta < 1 ? "<" : "≥"} 1.0`
    },
    "natario": {
      value: 0, limit: 0,
      status: s.natarioConstraint ? "PASS" : "WARN",
      equation: "∇·ξ = 0"
    },
    "curvature": {
      value: massPerTile_kg, limit: massPerTile_kg * 1.2,
      status: "PASS",
      equation: `m_tile ≈ ${massPerTile_kg.toExponential(2)} kg`
    },
    "timescale": {
      value: s.TS_ratio, limit: 100,
      status: s.TS_ratio > 100 ? "PASS" : "FAIL",
      equation: `TS = ${s.TS_ratio.toFixed(1)}`
    }
  } as const;

  return (map as any)[metricType] || { status: "UNKNOWN", equation: "Metric not found" };
}

// Rate limiting for OpenAI API calls
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function clientKey(req: Request) {
  const h = req.headers;
  return (h['cf-connecting-ip'] as string)
      || (h['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || (req.socket as any).remoteAddress
      || 'unknown';
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(clientId);

  if (rec && now > rec.resetTime) {
    rateLimitMap.delete(clientId); // drop stale record
  }

  const record = rateLimitMap.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + RATE_LIMIT_WINDOW;
  }
  if (record.count >= RATE_LIMIT_PER_MINUTE) return false;

  record.count++;
  rateLimitMap.set(clientId, record);
  return true;
}

// --- Minimal ChatGPT helper stubs (compatibility placeholders) -----------------
// These are lightweight implementations so the server can build requests and
// validate function call arguments during development. Replace with richer
// implementations as needed when wiring to production OpenAI function schemas.

export function buildHelixCorePrompt(state: EnergyPipelineState): string {
  // Minimal system prompt describing the pipeline state for ChatGPT
  return `You are Helix pipeline assistant. Mode=${state.currentMode ?? 'unknown'}, P_avg=${state.P_avg ?? 0} MW, N_tiles=${state.N_tiles ?? 0}`;
}

export const AVAILABLE_FUNCTIONS: any[] = [
  // Keep empty or list simple metadata; real function signatures are driven by FN_SCHEMAS
];

export const FN_SCHEMAS: Record<string, z.ZodSchema<any>> = {
  pulse_sector: z.object({ sectorIdx: z.number().optional(), frequency_GHz: z.number().optional() }),
  execute_auto_pulse_sequence: z.object({ steps: z.number().optional(), interval_ms: z.number().optional() }),
  run_diagnostics_scan: z.object({}),
  simulate_pulse_cycle: z.object({ frequency_GHz: z.number() }),
  check_metric_violation: z.object({ metricType: z.string() }),
  load_document: z.object({ docId: z.string() })
};

// Lightweight function implementations used when GPT asks to invoke server-side tasks
export async function executePulseSector(args: any) {
  // placeholder: simulate executing a single sector pulse
  return { ok: true, sector: args?.sectorIdx ?? 0, note: 'pulse scheduled (stub)'};
}

export async function executeAutoPulseSequence(args: any) {
  // placeholder: simulate auto-pulse sequence
  return { ok: true, steps: args?.steps ?? 1, note: 'auto sequence started (stub)'};
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
    const clientId = clientKey(req);
    if (!checkRateLimit(clientId)) {
      res.setHeader('X-RateLimit-Limit', RATE_LIMIT_PER_MINUTE.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', (RATE_LIMIT_WINDOW / 1000).toString());
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

  const _fetch = globalThis.fetch ?? (await import('node-fetch')).default as unknown as typeof fetch;
    const response = await _fetch("https://api.openai.com/v1/chat/completions", {
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
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
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
(async () => {
  const pipelineState = await calculateEnergyPipeline(initializePipelineState());
  setGlobalPipelineState(pipelineState);
})();

// Generate sample tiles with positions and T00 values for Green's Potential computation
function generateSampleTiles(count: number): Array<{ pos: [number, number, number]; t00: number }> {
  const tiles = [];
  const hullA = 503.5, hullB = 132, hullC = 86.5; // Half-dimensions in meters

  for (let i = 0; i < count; i++) {
    // Generate random positions on ellipsoid surface
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = hullA * Math.sin(phi) * Math.cos(theta);
    const y = hullB * Math.sin(phi) * Math.sin(theta);
    const z = hullC * Math.cos(phi);

    // Generate T00 values with realistic stress-energy distribution
    const r = Math.hypot(x / hullA, y / hullB, z / hullC);
    const t00 = -2.568e13 * (1 + 0.1 * Math.sin(5 * theta) * Math.cos(3 * phi)) * (1 - 0.5 * r);

    tiles.push({ pos: [x, y, z] as [number, number, number], t00 });
  }

  return tiles;
}

// System metrics endpoint (physics-first, strobe-aware)
export function getSystemMetrics(req: Request, res: Response) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const s = getGlobalPipelineState();

  const totalSectors = Math.max(1, s.sectorCount);
  const concurrent = Math.max(1, s.concurrentSectors || 1); // must be ≥1 to allocate buffers
  const activeFraction = concurrent / totalSectors;

  const strobeHz = Number(s.strobeHz ?? 1000);
  const sectorPeriod_ms = Number(s.sectorPeriod_ms ?? (1000 / Math.max(1, strobeHz)));

  const now = Date.now() / 1000;
  const sweepIdx = Math.floor(now * strobeHz) % totalSectors;

  const tilesPerSector = Math.floor(s.N_tiles / totalSectors);
  const activeTiles = tilesPerSector * concurrent;

  const hull = s.hull ?? { Lx_m: 1007, Ly_m: 264, Lz_m: 173 };

  // Canonical geometry fields for visualizer
  let a: number, b: number, c: number;
  if (hull) {
    a = hull.Lx_m / 2;
    b = hull.Ly_m / 2;
    c = hull.Lz_m / 2;
  } else {
    // Default values if hull is undefined
    a = 1007 / 2;
    b = 264 / 2;
    c = 173 / 2;
  }

  const aEff_geo  = Math.cbrt(a*b*c);                 // geometric mean (legacy)
  const aEff_harm = 3 / (1/a + 1/b + 1/c);            // ✅ harmonic mean — matches viewer
  const w_m       = (s.sag_nm ?? 16) * 1e-9;
  const w_rho_harm = w_m / aEff_harm;
  const w_rho_geo  = w_m / aEff_geo;

  // Optional scene scale helper (if your viewer wants precomputed clip axes):
  const sceneScale = 1 / Math.max(a, 1e-9);           // long semi-axis → 1.0
  const axesScene = [a*sceneScale, b*sceneScale, c*sceneScale];

  const R_geom = Math.cbrt((hull.Lx_m/2) * (hull.Ly_m/2) * (hull.Lz_m/2));

  // --- Duty & θ chain (canonical) ---
  const dutyLocal    = Number.isFinite((s as any).localBurstFrac)
    ? Math.max(1e-12, (s as any).localBurstFrac as number)
    : Math.max(1e-12, s.dutyCycle ?? 0.01); // ✅ default 1%

  // UI duty (per-sector knob, averaged by UI over all sectors)
  const dutyUI = Math.max(1e-12, s.dutyCycle ?? dutyLocal);

  // Ford–Roman ship-wide duty (used for REAL)
  const dutyFR = Math.max(1e-12, (s as any).dutyEffectiveFR ??
                                     (s as any).dutyEffective_FR ??
                                     (dutyLocal * (concurrent / totalSectors)));

  const γg   = s.gammaGeo ?? 26;
  const qsp  = s.qSpoilingFactor ?? 1;
  const γvdb = s.gammaVanDenBroeck ?? 0;             // ← use calibrated value from pipeline
  const γ3 = Math.pow(γg, 3);

  // ✅ physics-true, FR-averaged — NO sqrt
  const theta_FR = γ3 * qsp * γvdb * dutyFR;
  // keep a UI-only label if you want, but don't use it in engines
  const theta_UI = γ3 * qsp * γvdb * dutyUI;

  // Canonical, engine-facing bundle
  const warpUniforms = {
    // geometry (semi-axes in meters)
    hull: { a, b, c },
    axesScene,
    wallWidth_m: w_m,
    wallWidth_rho: w_rho_harm,

    // sectors & duties
    sectorCount: totalSectors,    // total
    sectors: concurrent,          // concurrent
    dutyCycle: dutyUI,            // UI knob
    dutyEffectiveFR: dutyFR,      // REAL θ uses this

    // physics chain
    gammaGeo: γg,
    gammaVdB: γvdb,               // ✅ canonical short key
    deltaAOverA: qsp,             // ✅ canonical for qSpoilingFactor
    currentMode: s.currentMode ?? 'hover'
  };
  // Use canonical C imported from utils/physics-const-safe
  const tauLC = Math.max(hull.Lx_m, hull.Ly_m, hull.Lz_m) / C;
  const f_m_Hz = (s.modulationFreq_GHz ?? 15) * 1e9;
  const T_m = 1 / f_m_Hz;

  const G = 9.80665;
  const gTargets: Record<string, number> = { hover:0.10*G, cruise:0.05*G, emergency:0.30*G, standby:0.00*G };
  const mode = (s.currentMode ?? 'hover').toLowerCase();
  const gTarget = gTargets[mode] ?? 0;
  const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (C*C)));
  const betaTiltVec: [number, number, number] = [0, -1, 0]; // "down" direction
  const gEff_check = (epsilonTilt * (C*C)) / R_geom;

  const C2 = C * C;
  const massPerTile_kg = Math.abs(s.U_cycle) / C2;

  // Canonical warpUniforms packet for consistent engine data
  const canonicalWarpUniforms = {
    // authoritative amps & duty for engines
    gammaGeo: s.gammaGeo,
    qSpoilingFactor: s.qSpoilingFactor,
    gammaVanDenBroeck: s.gammaVanDenBroeck,
    dutyEffectiveFR: dutyFR,
    sectorCount: totalSectors,
    sectors: concurrent,
    colorMode: "theta" as const,
    physicsParityMode: false,   // REAL should flip to true at callsite
    ridgeMode: 1,
    // expected θ from pipeline (linear duty)
    thetaScale: theta_FR,
  };

  // lightweight server-side audit (optional but handy)
  const thetaExpected = canonicalWarpUniforms.thetaScale;
  const thetaUsedByServer = thetaExpected; // server isn't forcing; used for compare in clients
  const thetaAudit = {
    expected: thetaExpected,
    used: thetaUsedByServer,
    ratio: thetaExpected > 0 ? (thetaUsedByServer / thetaExpected) : 1
  };

  // 🔁 add time-loop info needed by the viewer & charts
  const burst_ms = dutyLocal * sectorPeriod_ms;
  const cyclesPerBurst = (burst_ms / 1000) * f_m_Hz; // ✅ tell client exactly how many carrier cycles fit
  res.json({
    totalTiles: Math.floor(s.N_tiles),
    activeTiles, tilesPerSector,
    totalSectors,
    activeSectors: concurrent,
    activeFraction,
    sectorStrobing: concurrent,   // concurrent (live) sectors
    currentSector: sweepIdx,

    // make mode & inputs visible to UI
    currentMode: s.currentMode,
    dutyCycle: s.dutyCycle,
    sectorCount: totalSectors,    // total for averaging

    strobeHz, sectorPeriod_ms,

    hull,

    shiftVector: { epsilonTilt, betaTiltVec, gTarget, R_geom, gEff_check },

    energyOutput_MW: s.P_avg,        // MW (canonical)
    energyOutput_W:  s.P_avg * 1e6,  // W (for fmtPowerUnitFromW callers)
    energyOutput:    s.P_avg,        // MW (legacy alias)
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
    dutyEffectiveFR: (s as any).dutyEffectiveFR ?? (s as any).dutyEffective_FR,

    gammaVanDenBroeck: s.gammaVanDenBroeck,
    gammaGeo: s.gammaGeo,
    qCavity: s.qCavity,

    fordRoman: { value: s.zeta, limit: 1.0, status: s.fordRomanCompliance ? "PASS" : "FAIL" },
    natario:   { value: 0, status: s.natarioConstraint ? "PASS" : "WARN" },

    massPerTile_kg,
    overallStatus: s.overallStatus ?? (s.fordRomanCompliance ? "NOMINAL" : "CRITICAL"),

    tiles: { tileArea_cm2: s.tileArea_cm2, hullArea_m2: s.hullArea_m2 ?? null, N_tiles: s.N_tiles },

    // Add tile data with positions and T00 values for Green's Potential computation
    tileData: generateSampleTiles(Math.min(100, activeTiles)), // Generate sample tiles for φ computation

    geometry: { Lx_m: hull.Lx_m, Ly_m: hull.Ly_m, Lz_m: hull.Lz_m, TS_ratio: s.TS_ratio, TS_long: s.TS_long, TS_geom: s.TS_geom },

    axes_m: [a, b, c],
    axesScene,                         // for immediate camera fit
    cameraZ_hint: Math.max(1.2, 1.8 * Math.max(...axesScene)), // camera positioning hint
    wallWidth_m: w_m,
    wallWidth_rho: w_rho_harm,         // ✅ unified with renderer (harmonic-mean ρ)
    wallWidth_rho_geo: w_rho_geo,      // legacy (do not use for viewer)
    aEff_geo_m: aEff_geo,
    aEff_harm_m: aEff_harm,

    // ✅ canonical packet the renderer consumes
    warpUniforms: canonicalWarpUniforms,
    thetaAudit,

    // ✅ hint-only values (never applied as uniforms)
    viewerHints: {
      theta_FR_like: theta_FR,
      theta_UI_like: theta_UI,
      ridgeMode: 1,
      colorMode: 'theta'
    },

    // ✅ strobe/time window (for dutyLocal provenance)
    lightCrossing: {
      tauLC_ms: tauLC * 1000,
      dwell_ms: sectorPeriod_ms,
      burst_ms,
      sectorIdx: sweepIdx,
      sectorCount: totalSectors,
      onWindowDisplay: true,
      // 👇 additions for the viewer/plots
      onWindow: true,
      freqGHz: f_m_Hz / 1e9,
      cyclesPerBurst
    },

    modelMode: "calibrated-single-pass"
  });
}

// Get full pipeline state
export function getPipelineState(req: Request, res: Response) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  const s = getGlobalPipelineState();

  // Include mode-specific configuration fields for client consumption
  const currentMode = s.currentMode || 'hover';
  const modeConfig = MODE_CONFIGS[currentMode as keyof typeof MODE_CONFIGS];

  const stampedTs = Date.now();
  const stampedSeq = ++__PIPE_SEQ;

  res.json({
    ...s,
    // monotonic server-side stamps for clients to order snapshots
    seq: stampedSeq,
    __ts: stampedTs,
    dutyEffectiveFR: (s as any).dutyEffectiveFR ?? (s as any).dutyEffective_FR,
    // canonical viewer fields
    sectorCount: s.sectorCount,                 // total
    sectors: s.concurrentSectors ?? 1,          // concurrent
    hull: { a: (s.hull?.Lx_m || 1007)/2, b: (s.hull?.Ly_m || 264)/2, c: (s.hull?.Lz_m || 173)/2 }, // ✅
    gammaVdB: s.gammaVanDenBroeck,
    deltaAOverA: s.qSpoilingFactor,
    // helpful defaults
    localBurstFrac: (s as any).localBurstFrac ?? 0.01
  });
}

// Update pipeline parameters
export async function updatePipelineParams(req: Request, res: Response) {
  try {
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid parameters", issues: parsed.error.issues });
    }
    const newState = await pipeMutex.lock(async () => {
      const curr = getGlobalPipelineState();
      const next = await updateParameters(curr, parsed.data);
      setGlobalPipelineState(next);
      return next;
    });

    // Write calibration for phase diagram integration
    await writePhaseCalibration({
      tile_area_cm2: newState.tileArea_cm2,
      ship_radius_m: newState.shipRadius_m || 86.5,
      P_target_W: (newState as any).P_avg_W || 100e6, 
      M_target_kg: newState.exoticMassTarget_kg || 1400,
      zeta_target: 0.5
    }, 'pipeline_update');

    publish("warp:reload", { reason: "pipeline-update", keys: Object.keys(parsed.data), ts: Date.now() });

    res.json(newState);
  } catch (error) {
    res.status(400).json({ error: "Failed to update parameters", details: error instanceof Error ? error.message : "Unknown error" });
  }
}

// Switch operational mode
export async function switchOperationalMode(req: Request, res: Response) {
  try {
    const { mode } = req.body;
    if (!['hover','taxi','cruise','emergency','standby'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    const newState = await pipeMutex.lock(async () => {
      const curr = getGlobalPipelineState();
      const next = await switchMode(curr, mode as EnergyPipelineState['currentMode']);
      setGlobalPipelineState(next);
      return next;
    });

    // Write calibration for phase diagram integration  
    await writePhaseCalibration({
      tile_area_cm2: newState.tileArea_cm2,
      ship_radius_m: newState.shipRadius_m || 86.5,
      P_target_W: 100e6, // Use fixed target power for now
      M_target_kg: newState.exoticMassTarget_kg || 1400,
      zeta_target: 0.5
    }, 'mode_change');

    publish("warp:reload", { reason: "mode-change", mode, ts: Date.now() });

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
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
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
      rhoMetric: "harmonic",   // ✅ matches viewer/shader conversion
      physics: {
        gammaGeo: s.gammaGeo,
        qSpoiling: s.qSpoilingFactor,
        // ✅ provide the exact field name the client type expects
        sectorStrobing: sectors,
        // (keep extra fields for debugging/compat)
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

// NEW: expose exact computeEnergySnapshot result for client verification
export async function getEnergySnapshot(req: Request, res: Response) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(200).end(); }
  setCors(res);
  try {
    const isPost = req.method === 'POST';
    const body = (isPost && req.body && typeof req.body === 'object') ? req.body : {};
    const sim = (body.sim && typeof body.sim === 'object') ? body.sim : {};

    // allow ?mode=REAL|SHOW to override
    const modeQ = (typeof req.query?.mode === 'string') ? req.query.mode : undefined;
    if (modeQ && !sim.mode) (sim as any).mode = modeQ;

    const snapshot = await computeEnergySnapshot(sim);
    res.status(200).json(snapshot);
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error("[getEnergySnapshot] error:", msg);
    res.status(500).json({ error: "computeEnergySnapshot failed", message: msg });
  }
}

export const VERSION = "helix-core-debug-0";
export function noop() { /* noop for debug */ }
export default { VERSION, noop };
