import { Router } from "express";
import { z } from "zod";
import {
  NeuroFeaturePayloadSchema,
  ingestNeuroFeatures,
} from "../neuro/feature-bridge";
import {
  autoStartNeuroLoopFromEnv,
  neuroLoopController,
  type NeuroLoopStartOptions,
} from "../neuro/loop-controller";

const neuroRouter = Router();
const NeuroStreamKindSchema = z.enum([
  "eeg",
  "meg",
  "emg",
  "eog",
  "eye",
  "aux",
]);
const GammaBandSchema = z
  .object({
    lowHz: z.number().positive().optional(),
    highHz: z.number().positive().optional(),
  })
  .partial();
const NeuroKernelConfigSchema = z
  .object({
    windowSeconds: z.number().positive().optional(),
    minSamples: z.number().int().positive().optional(),
    minSignalRms: z.number().nonnegative().optional(),
    maxArtifactRatio: z.number().min(0).max(1).optional(),
    artifactAbsMax: z.number().positive().optional(),
    lockStreakRequired: z.number().int().positive().optional(),
    gammaBandHz: GammaBandSchema.optional(),
    gammaAnchorHz: z.number().positive().optional(),
    gammaAnchorBandwidthHz: z.number().positive().optional(),
    gammaSurrogateCount: z.number().int().nonnegative().optional(),
    gammaSurrogateSeed: z.number().int().optional(),
    gammaMinSamples: z.number().int().nonnegative().optional(),
    gammaBaselineAlpha: z.number().min(0).max(1).optional(),
    gammaBaselineMinCount: z.number().int().nonnegative().optional(),
    gammaArtifactRequireEmg: z.boolean().optional(),
    gammaArtifactEmgPlvMax: z.number().min(0).max(1).optional(),
    gammaArtifactEmgBurstRatioMax: z.number().min(0).max(1).optional(),
    gammaArtifactEmgBurstBandHz: GammaBandSchema.optional(),
  })
  .partial();
const NeuroBaselineConfigSchema = z
  .object({
    persist: z.boolean().optional(),
    storePath: z.string().min(1).optional(),
    minCount: z.number().int().nonnegative().optional(),
    persistIntervalMs: z.number().int().positive().optional(),
    key: z.string().min(3).optional(),
  })
  .partial();
const NeuroSimulatorOptionsSchema = z
  .object({
    sampleRateHz: z.number().positive().optional(),
    frameSize: z.number().int().positive().optional(),
    channelCount: z.number().int().positive().optional(),
    signalHz: z.number().positive().optional(),
    amplitude: z.number().nonnegative().optional(),
    noiseStd: z.number().nonnegative().optional(),
    markerEveryMs: z.number().int().nonnegative().optional(),
    artifactEveryMs: z.number().int().nonnegative().optional(),
    artifactDurationMs: z.number().int().nonnegative().optional(),
    artifactAmplitude: z.number().nonnegative().optional(),
  })
  .partial();
const NeuroDriverSelectSchema = z
  .object({
    sessionId: z.string().min(3).optional(),
    sessionType: z.string().optional(),
    hostMode: z.string().optional(),
    hostId: z.string().optional(),
    hostMassNorm: z.number().min(0).max(1).optional(),
    hostRadiusNorm: z.number().min(0).max(1).optional(),
    stream: NeuroStreamKindSchema.optional(),
    deviceId: z.string().optional(),
    postIntervalMs: z.number().int().nonnegative().optional(),
    ringBufferSeconds: z.number().positive().optional(),
    kernel: NeuroKernelConfigSchema.optional(),
    driver: z
      .object({
        kind: z.enum(["sim"]),
        options: NeuroSimulatorOptionsSchema.optional(),
      })
      .optional(),
    baseline: NeuroBaselineConfigSchema.optional(),
  })
  .partial();
const NeuroCalibrationStartSchema = z
  .object({
    label: z.string().optional(),
  })
  .partial();
const NeuroCalibrationStopSchema = z
  .object({
    save: z.boolean().optional(),
    path: z.string().optional(),
  })
  .partial();

void autoStartNeuroLoopFromEnv().catch((error) => {
  console.warn("[neuro] auto-start failed", error);
});

neuroRouter.get("/status", (_req, res) => {
  res.json(neuroLoopController.getStatus());
});

neuroRouter.post("/features", (req, res) => {
  const parsed = NeuroFeaturePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  try {
    const snapshot = ingestNeuroFeatures(parsed.data);
    res.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "star_error", message });
  }
});

neuroRouter.post("/driver/select", async (req, res) => {
  const parsed = NeuroDriverSelectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  try {
    const status = await neuroLoopController.start(
      parsed.data as NeuroLoopStartOptions,
    );
    res.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "neuro_start_failed", message });
  }
});

neuroRouter.post("/driver/stop", async (_req, res) => {
  try {
    const status = await neuroLoopController.stop();
    res.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);     
    res.status(500).json({ error: "neuro_stop_failed", message });
  }
});

neuroRouter.post("/calibrate/start", (req, res) => {
  const parsed = NeuroCalibrationStartSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  try {
    const status = neuroLoopController.startCalibration(parsed.data);
    res.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "calibration_start_failed", message });
  }
});

neuroRouter.post("/calibrate/stop", async (req, res) => {
  const parsed = NeuroCalibrationStopSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  try {
    const result = await neuroLoopController.stopCalibration(parsed.data);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "calibration_stop_failed", message });
  }
});

export { neuroRouter };
