import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { computeHaloBankTimeModel } from "../services/halobank/time-model";

const PlaceSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  tz: z.string().optional(),
  label: z.string().optional(),
});

const Input = z.object({
  place: PlaceSchema.optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  durationMs: z.number().positive().optional(),
  compare: z
    .object({
      place: PlaceSchema.optional(),
      timestamp: z.union([z.string(), z.number()]).optional(),
      durationMs: z.number().positive().optional(),
    })
    .optional(),
  model: z
    .object({
      includeEnvelope: z.boolean().optional(),
      includeCausal: z.boolean().optional(),
      orbitalAlignment: z.boolean().optional(),
      ephemerisSource: z.enum(["live", "fallback"]).optional(),
      ephemerisEvidenceVerified: z.boolean().optional(),
      ephemerisEvidenceRef: z.string().optional(),
      residualPpm: z.number().optional(),
      residualSampleCount: z.number().nonnegative().optional(),
    })
    .optional(),
  question: z.string().optional(),
  prompt: z.string().optional(),
});

const Output = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  model: z.object({
    name: z.string(),
    version: z.string(),
    maturity: z.literal("diagnostic"),
    assumptions: z.array(z.string()),
  }),
  primary: z.any().optional(),
  comparison: z.any().optional(),
  ephemeris: z.any().optional(),
});

export const haloBankTimeComputeSpec: ToolSpecShape = {
  name: "halobank.time.compute",
  desc: "Compute diagnostic HaloBank time/place tidal-gravity deltas with duration-aware comparison.",
  inputSchema: Input,
  outputSchema: Output,
  deterministic: true,
  rateLimit: { rpm: 120 },
  safety: { risks: ["none"] },
  risk: { writesFiles: false, touchesNetwork: false, privileged: false },
};

export const haloBankTimeComputeHandler: ToolHandler = async (rawInput) => {
  const input = Input.parse(rawInput ?? {});
  return Output.parse(computeHaloBankTimeModel(input));
};
