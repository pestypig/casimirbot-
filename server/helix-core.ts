import { Request, Response } from "express";
import { z } from "zod";
import fetch from "node-fetch";

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
  // Import the static Casimir calculation function
  const { calculateCasimirEnergy } = await import('../modules/sim_core/static-casimir.js');
  
  // Create simulation parameters matching expected interface
  const params = {
    geometry: 'parallel_plate' as const,
    gap: args.gap_nm, // in nm
    radius: args.radius_mm * 1000, // Convert mm to μm
    temperature: args.temperature_K - 273.15, // Convert K to °C
    sagDepth: 0
  };

  // Calculate Casimir effect
  const result = await calculateCasimirEnergy(params as any);
  
  // Calculate additional metrics
  const qFactor = 1.6e6; // Needle Hull Q-factor
  const frequency = 15e9; // 15 GHz modulation
  const omega = 2 * Math.PI * frequency;
  const powerLoss = Math.abs(result.totalEnergy * omega / qFactor);
  
  return {
    sectorId: args.sectorId,
    energy: result.totalEnergy,
    force: result.force,
    powerLoss: powerLoss,
    curvatureContribution: result.totalEnergy / (3e8 * 3e8), // Rough approximation
    status: "PULSED"
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
    const { messages, functions, function_call } = req.body;
    
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
        ...messages
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

// System metrics endpoint
export function getSystemMetrics(req: Request, res: Response) {
  res.json({
    activeTiles: 312,
    totalTiles: 400,
    energyOutput: 83.3, // MW
    exoticMass: 1405, // kg
    fordRoman: {
      value: 0.032,
      limit: 1.0,
      status: "PASS"
    },
    natario: {
      value: 0,
      status: "VALID"
    },
    curvatureMax: 1e-21,
    timeScaleRatio: 4102.7,
    overallStatus: "NOMINAL"
  });
}