import { Router } from "express";
import { z } from "zod";

const aiPlanRouter = Router();

const barWindowSchema = z
  .object({
    startBar: z.number().int().min(1),
    endBar: z.number().int().min(1),
  })
  .refine(({ startBar, endBar }) => endBar > startBar, {
    message: "endBar must be greater than startBar",
  });

const tempoMetaSchema = z
  .object({
    bpm: z.number().min(40).max(250),
    timeSig: z.string().regex(/^\d+\/\d+$/),
    offsetMs: z.number().min(-2000).max(2000),
    barsInLoop: z.number().int().min(1).max(256).optional(),
    quantized: z.boolean().optional(),
  })
  .strict();

const planMaterialSchema = z
  .object({
    audioAtomIds: z.array(z.string().min(1)).optional(),
    midiMotifIds: z.array(z.string().min(1)).optional(),
    grooveTemplateIds: z.array(z.string().min(1)).optional(),
    macroCurveIds: z.array(z.string().min(1)).optional(),
    transposeSemitones: z.number().finite().optional(),
    timeStretch: z.number().finite().optional(),
  })
  .passthrough();

const planTextureBlendSchema = z
  .object({
    weights: z.record(z.number().finite()),
  })
  .passthrough();

const planTextureSchema = z
  .object({
    kbTexture: z.union([z.string().min(1), planTextureBlendSchema]).optional(),
    sampleInfluence: z.number().min(0).max(1).optional(),
    styleInfluence: z.number().min(0).max(1).optional(),
    weirdness: z.number().min(0).max(1).optional(),
    eqPeaks: z
      .array(
        z
          .object({
            freq: z.number().finite(),
            q: z.number().finite(),
            gainDb: z.number().finite(),
          })
          .passthrough(),
      )
      .optional(),
    fx: z
      .object({
        chorus: z.number().finite().optional(),
        sat: z.number().finite().optional(),
        reverbSend: z.number().finite().optional(),
        comp: z.number().finite().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const planSectionSchema = z
  .object({
    name: z.string().min(1),
    startBar: z.number().int().min(1),
    bars: z.number().int().min(1),
  })
  .passthrough();

const planEnergySchema = z
  .object({
    bar: z.number().int().min(1),
    energy: z.number().min(0).max(1),
  })
  .passthrough();

const planWindowAnalysisSchema = z
  .object({
    startBar: z.number().int().min(1),
    bars: z.number().int().min(1),
    energy: z.number().min(0).max(1).optional(),
    density: z.number().min(0).max(1).optional(),
    brightness: z.number().min(0).max(1).optional(),
    material: planMaterialSchema.optional(),
    texture: planTextureSchema.optional(),
  })
  .passthrough();

const planAnalysisSchema = z
  .object({
    windows: z.array(planWindowAnalysisSchema).optional(),
    energyByBar: z.array(z.number().min(0).max(1)).optional(),
    sections: z.array(planSectionSchema).optional(),
    energyCurve: z.array(planEnergySchema).optional(),
  })
  .passthrough();

const planBaseSchema = z
  .object({
    sampleInfluence: z.number().min(0).max(1).optional(),
    styleInfluence: z.number().min(0).max(1).optional(),
    weirdness: z.number().min(0).max(1).optional(),
  })
  .strict()
  .optional();

const planRequestSchema = z
  .object({
    originalId: z.string().min(1).optional(),
    barWindows: z.array(barWindowSchema).min(1),
    tempo: tempoMetaSchema.optional(),
    kbTexture: z.string().min(1).nullable().optional(),
    base: planBaseSchema,
    analysis: planAnalysisSchema.optional(),
    seed: z.union([z.string().min(1), z.number().finite()]).optional(),
    key: z.string().min(1).optional(),
  })
  .strict();

type PlanWindowInput = z.infer<typeof barWindowSchema>;
type PlanWindowAnalysis = z.infer<typeof planWindowAnalysisSchema>;
type PlanAnalysis = z.infer<typeof planAnalysisSchema>;

const clamp01 = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash >>> 0;
};

const makeRng = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

const planWindowKey = (startBar: number, bars: number) => `${startBar}:${bars}`;

const normalizeWindows = (windows: PlanWindowInput[]) => {
  const seen = new Set<string>();
  const cleaned = windows
    .map((window) => {
      const startBar = Math.max(1, Math.floor(window.startBar));
      const endBar = Math.max(startBar + 1, Math.floor(window.endBar));
      return { startBar, endBar };
    })
    .filter((window) => {
      const key = `${window.startBar}:${window.endBar}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.startBar - b.startBar || a.endBar - b.endBar);
  return cleaned;
};

const buildAnalysisWindowMap = (analysis?: PlanAnalysis) => {
  const map = new Map<string, PlanWindowAnalysis>();
  if (!analysis?.windows?.length) return map;
  for (const window of analysis.windows) {
    const startBar = Math.max(1, Math.floor(window.startBar));
    const bars = Math.max(1, Math.floor(window.bars));
    map.set(planWindowKey(startBar, bars), { ...window, startBar, bars });
  }
  return map;
};

const averageBarSeries = (
  series: number[] | undefined,
  startBar: number,
  bars: number,
) => {
  if (!series?.length) return null;
  const startIndex = Math.max(0, startBar - 1);
  const endIndex = Math.min(series.length, startIndex + bars);
  if (startIndex >= endIndex) return null;
  let sum = 0;
  let count = 0;
  for (let idx = startIndex; idx < endIndex; idx += 1) {
    const value = series[idx];
    if (!Number.isFinite(value)) continue;
    sum += clamp01(value);
    count += 1;
  }
  if (!count) return null;
  return sum / count;
};

const resolveFallbackEnergy = (t: number, rng: () => number, phase: number) => {
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return clamp01(
    0.25 + 0.65 * eased + (rng() - 0.5) * 0.1 + Math.sin(phase) * 0.02,
  );
};

const resolveWindowEnergy = (
  analysisWindow: PlanWindowAnalysis | undefined,
  energyByBar: number[] | undefined,
  startBar: number,
  bars: number,
  t: number,
  rng: () => number,
  phase: number,
) => {
  if (typeof analysisWindow?.energy === "number") {
    return clamp01(analysisWindow.energy);
  }
  const seriesAvg = averageBarSeries(energyByBar, startBar, bars);
  if (typeof seriesAvg === "number") {
    return clamp01(seriesAvg);
  }
  return resolveFallbackEnergy(t, rng, phase);
};

const resolveWindowDensity = (
  analysisWindow: PlanWindowAnalysis | undefined,
  energy: number,
  rng: () => number,
) => {
  if (typeof analysisWindow?.density === "number") {
    return clamp01(analysisWindow.density);
  }
  return clamp01(0.35 + energy * 0.45 + (rng() - 0.5) * 0.2);
};

const resolveWindowBrightness = (
  analysisWindow: PlanWindowAnalysis | undefined,
  energy: number,
  rng: () => number,
) => {
  if (typeof analysisWindow?.brightness === "number") {
    return clamp01(analysisWindow.brightness);
  }
  return clamp01(0.4 + energy * 0.35 + (rng() - 0.5) * 0.18);
};

const mergeFx = (
  baseFx: NonNullable<PlanWindowAnalysis["texture"]>["fx"],
  overrides: PlanWindowAnalysis["texture"] | undefined,
) => {
  if (!overrides?.fx) return baseFx;
  return {
    chorus: overrides.fx.chorus ?? baseFx?.chorus,
    sat: overrides.fx.sat ?? baseFx?.sat,
    reverbSend: overrides.fx.reverbSend ?? baseFx?.reverbSend,
    comp: overrides.fx.comp ?? baseFx?.comp,
  };
};

const buildFxFromFeatures = (
  energy: number,
  density: number,
  brightness: number,
  rng: () => number,
) => ({
  chorus: clamp01(
    0.18 + (1 - energy) * 0.35 + (1 - brightness) * 0.2 + (rng() - 0.5) * 0.08,
  ),
  sat: clamp01(0.2 + energy * 0.6 + density * 0.2 + (rng() - 0.5) * 0.06),
  reverbSend: clamp01(
    0.45 + (1 - energy) * 0.35 + (1 - density) * 0.15 + (rng() - 0.5) * 0.08,
  ),
  comp: clamp01(0.2 + energy * 0.55 + density * 0.2 + (rng() - 0.5) * 0.06),
});

const buildTexturePlan = ({
  analysisWindow,
  baseSample,
  baseStyle,
  baseWeird,
  energy,
  density,
  brightness,
  kbTexture,
  rng,
  includeFx,
}: {
  analysisWindow?: PlanWindowAnalysis;
  baseSample: number;
  baseStyle: number;
  baseWeird: number;
  energy: number;
  density: number;
  brightness: number;
  kbTexture: string | null | undefined;
  rng: () => number;
  includeFx: boolean;
}) => {
  const textureOverrides = analysisWindow?.texture;
  const wobble = (rng() - 0.5) * 0.12;
  const sampleInfluence =
    typeof textureOverrides?.sampleInfluence === "number"
      ? clamp01(textureOverrides.sampleInfluence)
      : clamp01(
          baseSample + (density - 0.5) * 0.18 + (energy - 0.5) * 0.12 + wobble * 0.5,
        );
  const styleInfluence =
    typeof textureOverrides?.styleInfluence === "number"
      ? clamp01(textureOverrides.styleInfluence)
      : clamp01(
          baseStyle + (brightness - 0.5) * 0.2 + (1 - energy) * 0.1 + wobble * 0.35,
        );
  const weirdness =
    typeof textureOverrides?.weirdness === "number"
      ? clamp01(textureOverrides.weirdness)
      : clamp01(
          baseWeird + (density - 0.5) * 0.18 + (0.5 - brightness) * 0.2 + wobble * 0.45,
        );
  const fxBase = includeFx
    ? buildFxFromFeatures(energy, density, brightness, rng)
    : undefined;
  const fx = textureOverrides?.fx ? mergeFx(fxBase, textureOverrides) : fxBase;
  const texturePlan: Record<string, unknown> = {
    ...(textureOverrides?.kbTexture
      ? { kbTexture: textureOverrides.kbTexture }
      : typeof kbTexture === "string"
        ? { kbTexture }
        : {}),
    sampleInfluence,
    styleInfluence,
    weirdness,
  };

  if (textureOverrides?.eqPeaks?.length) {
    texturePlan.eqPeaks = textureOverrides.eqPeaks;
  }
  if (fx) {
    texturePlan.fx = fx;
  }
  return texturePlan;
};

const buildEnergyCurve = (
  windows: Array<{ startBar: number; endBar: number }>,
  energyByWindow: Map<string, number>,
  energyByBar: number[] | undefined,
) => {
  if (energyByBar?.length) {
    const curve: Array<{ bar: number; energy: number }> = [];
    for (const window of windows) {
      const bars = Math.max(1, window.endBar - window.startBar);
      for (let offset = 0; offset < bars; offset += 1) {
        const bar = window.startBar + offset;
        const value = energyByBar[bar - 1];
        if (Number.isFinite(value)) {
          curve.push({ bar, energy: clamp01(value) });
        }
      }
    }
    if (curve.length) return curve;
  }
  return windows.map((window) => {
    const bars = Math.max(1, window.endBar - window.startBar);
    const energy = energyByWindow.get(planWindowKey(window.startBar, bars)) ?? 0.5;
    return { bar: window.startBar, energy: clamp01(energy) };
  });
};

const resolveSections = (windows: Array<{ startBar: number; endBar: number }>) => {
  const count = windows.length;
  if (count === 0) return [];
  const names =
    count <= 2
      ? ["intro", "outro"]
      : count === 3
        ? ["intro", "verse", "outro"]
        : count === 4
          ? ["intro", "verse", "build", "outro"]
          : count === 5
            ? ["intro", "verse", "build", "drop", "outro"]
            : ["intro", "verse", "build", "drop", "bridge", "outro"];
  const segmentCount = Math.min(names.length, count);
  const base = Math.floor(count / segmentCount);
  const remainder = count % segmentCount;
  const segments = names.slice(0, segmentCount).map((name, index) => ({
    name,
    count: base + (index < remainder ? 1 : 0),
  }));
  const result = [];
  let cursor = 0;
  for (const segment of segments) {
    if (segment.count <= 0) continue;
    const slice = windows.slice(cursor, cursor + segment.count);
    if (!slice.length) continue;
    const startBar = slice[0].startBar;
    const endBar = slice[slice.length - 1].endBar;
    result.push({ name: segment.name, startBar, bars: Math.max(1, endBar - startBar) });
    cursor += segment.count;
  }
  return result;
};

aiPlanRouter.post("/plan", (req, res) => {
  const parsed = planRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
  }

  const { barWindows, tempo, kbTexture, base, seed, originalId, key, analysis } =
    parsed.data;
  const windows = normalizeWindows(barWindows);
  const total = windows.length;
  if (!total) {
    return res.status(400).json({ error: "empty_windows" });
  }

  const seedInput =
    seed ??
    (typeof originalId === "string" && originalId.trim().length > 0 ? originalId : "noisegen-plan");
  const seedValue = typeof seedInput === "number" ? Math.trunc(seedInput) : hashString(String(seedInput));
  const rng = makeRng(seedValue);
  const phase = rng() * Math.PI * 2;

  const baseSample = clamp01(base?.sampleInfluence ?? 0.7);
  const baseStyle = clamp01(base?.styleInfluence ?? 0.3);
  const baseWeird = clamp01(base?.weirdness ?? 0.2);
  const analysisWindowMap = buildAnalysisWindowMap(analysis);
  const includeFx = Boolean(
    analysis?.windows?.length || analysis?.energyByBar?.length,
  );
  const energyByWindow = new Map<string, number>();

  const windowPlans = windows.map((window, index) => {
    const t = total <= 1 ? 0 : index / (total - 1);
    const bars = Math.max(1, window.endBar - window.startBar);
    const windowKey = planWindowKey(window.startBar, bars);
    const analysisWindow = analysisWindowMap.get(windowKey);
    const energy = resolveWindowEnergy(
      analysisWindow,
      analysis?.energyByBar,
      window.startBar,
      bars,
      t,
      rng,
      phase,
    );
    const density = resolveWindowDensity(analysisWindow, energy, rng);
    const brightness = resolveWindowBrightness(analysisWindow, energy, rng);
    energyByWindow.set(windowKey, energy);
    const texture = buildTexturePlan({
      analysisWindow,
      baseSample,
      baseStyle,
      baseWeird,
      energy,
      density,
      brightness,
      kbTexture,
      rng,
      includeFx,
    });
    return {
      startBar: window.startBar,
      bars,
      ...(analysisWindow?.material ? { material: analysisWindow.material } : {}),
      texture,
    };
  });

  const energyCurve =
    analysis?.energyCurve?.length
      ? analysis.energyCurve
      : buildEnergyCurve(windows, energyByWindow, analysis?.energyByBar);

  const sections =
    analysis?.sections?.length ? analysis.sections : resolveSections(windows);

  return res.json({
    renderPlan: {
      global: {
        bpm: tempo?.bpm,
        key,
        sections,
        energyCurve,
      },
      windows: windowPlans,
    },
    meta: {
      seed: seedValue,
      generatedAt: Date.now(),
      sources: {
        analysis: Boolean(analysis),
        energyByBar: Boolean(analysis?.energyByBar?.length),
        windows: Boolean(analysis?.windows?.length),
      },
    },
  });
});

export { aiPlanRouter };
