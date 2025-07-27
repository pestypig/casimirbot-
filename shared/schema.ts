import { z } from "zod";

// Simulation parameter schemas
export const simulationParametersSchema = z.object({
  geometry: z.enum(["sphere", "parallel_plate", "bowl"]),
  gap: z.number().positive().min(0.01).max(1000), // nm
  radius: z.number().positive().min(1).max(100000), // µm
  material: z.enum(["PEC", "custom"]).default("PEC"),
  temperature: z.number().positive().min(0.1).max(1000).default(20), // K
  advanced: z.object({
    xiMin: z.number().positive().default(0.001),
    maxXiPoints: z.number().int().positive().default(10000),
    intervals: z.number().int().positive().default(50),
    absTol: z.number().min(0).default(0),
    relTol: z.number().positive().default(0.01)
  }).optional()
});

export const simulationResultSchema = z.object({
  id: z.string(),
  parameters: simulationParametersSchema,
  status: z.enum(["pending", "generating", "meshing", "calculating", "processing", "completed", "failed"]),
  startTime: z.date(),
  endTime: z.date().optional(),
  results: z.object({
    totalEnergy: z.number().optional(),
    energyPerArea: z.number().optional(),
    force: z.number().optional(),
    convergence: z.string().optional(),
    xiPoints: z.number().int().optional(),
    computeTime: z.string().optional(),
    errorEstimate: z.string().optional()
  }).optional(),
  generatedFiles: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    size: z.string(),
    path: z.string(),
    type: z.enum(["scuffgeo", "mesh", "output", "log"])
  })).default([]),
  logs: z.array(z.string()).default([]),
  error: z.string().optional()
});

export type SimulationParameters = z.infer<typeof simulationParametersSchema>;
export type SimulationResult = z.infer<typeof simulationResultSchema>;
export type InsertSimulationResult = Omit<SimulationResult, 'id'>;
