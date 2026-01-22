import { Router } from "express";
import { z } from "zod";
import {
  buildPlanFromModel,
  type PlanAnalysis as ModelPlanAnalysis,
} from "../services/noisegen-planner-model";
import {
  findOriginalById,
  getNoisegenStore,
  type NoisegenTimeSkyMeta,
} from "../services/noisegen-store";
import {
  createIntentEnforcementState,
  enforceIntentContractOnRequest,
  enforceIntentContractOnRenderPlan,
  finalizeIntentMeta,
} from "../services/noisegen-intent";

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
        delay: z.number().finite().optional(),
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
    densityByBar: z.array(z.number().min(0).max(1)).optional(),
    onsetDensityByBar: z.array(z.number().min(0).max(1)).optional(),
    brightnessByBar: z.array(z.number().min(0).max(1)).optional(),
    centroidByBar: z.array(z.number().min(0).max(1)).optional(),
    rolloffByBar: z.array(z.number().min(0).max(1)).optional(),
    dynamicRangeByBar: z.array(z.number().min(0).max(1)).optional(),
    crestFactorByBar: z.array(z.number().min(0).max(1)).optional(),
    tempoByBar: z.array(z.number().finite()).optional(),
    silenceByBar: z.array(z.number().min(0).max(1)).optional(),
    chromaByBar: z.array(z.array(z.number().min(0).max(1))).optional(),
    keyConfidence: z.number().min(0).max(1).optional(),
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
type TempoMeta = z.infer<typeof tempoMetaSchema>;

const clamp01 = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash >>> 0;
};

const hashPulseSeed = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const hashPulseSalt = (value: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
};

const resolveTimeSkyContext = (timeSky?: NoisegenTimeSkyMeta) => {
  const context = timeSky?.context;
  return {
    publishedAt: context?.publishedAt ?? timeSky?.publishedAt,
    composedStart: context?.composedStart ?? timeSky?.composedStart,
    composedEnd: context?.composedEnd ?? timeSky?.composedEnd,
    timezone: context?.timezone,
    place: context?.place ?? timeSky?.place,
    placePrecision: context?.placePrecision ?? "approximate",
    halobankSpanId: context?.halobankSpanId,
    skySignature: context?.skySignature ?? timeSky?.skySignature,
  };
};

const resolveTimeSkyPulse = (timeSky?: NoisegenTimeSkyMeta) => {
  const pulse = timeSky?.pulse;
  const round = pulse?.round ?? timeSky?.pulseRound;
  const pulseTime = pulse?.pulseTime;
  const valueHash = pulse?.valueHash ?? timeSky?.pulseHash;
  const source =
    pulse?.source ??
    (round != null || pulseTime != null || valueHash ? "drand" : undefined);
  return {
    source,
    round,
    pulseTime,
    valueHash,
    seedSalt: pulse?.seedSalt,
  };
};

const buildPulseSeed = (options: {
  originalId?: string;
  timeSky?: NoisegenTimeSkyMeta;
}) => {
  const originalId = options.originalId;
  if (!originalId || !options.timeSky) {
    return null;
  }
  const context = resolveTimeSkyContext(options.timeSky);
  const pulse = resolveTimeSkyPulse(options.timeSky);
  const pulseKey = pulse.round ?? pulse.pulseTime;
  if (pulseKey == null || !pulse.valueHash) {
    return null;
  }
  const placeSeed =
    context.placePrecision === "hidden"
      ? "hidden"
      : (context.place ?? "").trim();
  const publishedAt =
    context.publishedAt != null ? String(context.publishedAt) : "";
  const seedMaterial = `${originalId}|${publishedAt}|${placeSeed}|${pulseKey}|${pulse.valueHash}`;
  return {
    seed: hashPulseSeed(seedMaterial),
    seedSalt: pulse.seedSalt ?? hashPulseSalt(seedMaterial),
    source: pulse.source,
    round: pulse.round,
    pulseTime: pulse.pulseTime,
    valueHash: pulse.valueHash,
  };
};

const resolveIntentTempo = (
  tempo: TempoMeta | undefined,
  globals: { bpm?: number; timeSig?: string } | undefined,
  apply: boolean,
): TempoMeta | undefined => {
  if (!apply || !globals) return tempo;
  const bpm =
    typeof globals.bpm === "number" && Number.isFinite(globals.bpm)
      ? globals.bpm
      : tempo?.bpm;
  const timeSig =
    typeof globals.timeSig === "string" && globals.timeSig.trim().length > 0
      ? globals.timeSig
      : tempo?.timeSig;
  if (bpm == null && !timeSig) return tempo;
  return {
    bpm: bpm ?? 120,
    timeSig: timeSig ?? "4/4",
    offsetMs: tempo?.offsetMs ?? 0,
    barsInLoop: tempo?.barsInLoop,
    quantized: tempo?.quantized ?? true,
  };
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
  densityByBar: number[] | undefined,
  startBar: number,
  bars: number,
  energy: number,
  rng: () => number,
) => {
  if (typeof analysisWindow?.density === "number") {
    return clamp01(analysisWindow.density);
  }
  const seriesAvg = averageBarSeries(densityByBar, startBar, bars);
  if (typeof seriesAvg === "number") {
    return clamp01(seriesAvg);
  }
  return clamp01(0.35 + energy * 0.45 + (rng() - 0.5) * 0.2);
};

const resolveWindowBrightness = (
  analysisWindow: PlanWindowAnalysis | undefined,
  brightnessByBar: number[] | undefined,
  startBar: number,
  bars: number,
  energy: number,
  rng: () => number,
) => {
  if (typeof analysisWindow?.brightness === "number") {
    return clamp01(analysisWindow.brightness);
  }
  const seriesAvg = averageBarSeries(brightnessByBar, startBar, bars);
  if (typeof seriesAvg === "number") {
    return clamp01(seriesAvg);
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
    delay: overrides.fx.delay ?? baseFx?.delay,
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
  delay: clamp01(0.12 + (1 - energy) * 0.2 + (1 - density) * 0.1 + (rng() - 0.5) * 0.06),
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

const mergeIntentEqPeaks = (
  base?: Array<{ freq: number; q: number; gainDb: number }>,
  intent?: Array<{ freq: number; q: number; gainDb: number }>,
) => {
  if (intent?.length) return intent;
  return base;
};

const mergeIntentFx = (
  base: NonNullable<PlanWindowAnalysis["texture"]>["fx"] | undefined,
  intent: NonNullable<PlanWindowAnalysis["texture"]>["fx"] | undefined,
) => {
  if (!intent) return base;
  const merged = { ...(base ?? {}) } as NonNullable<
    NonNullable<PlanWindowAnalysis["texture"]>["fx"]
  >;
  for (const [key, value] of Object.entries(intent)) {
    if (typeof value !== "number") continue;
    const current = merged[key as keyof typeof merged];
    merged[key as keyof typeof merged] =
      typeof current === "number" ? Math.max(current, value) : value;
  }
  return merged;
};

const clampIntentFxBounds = (
  fx: NonNullable<PlanWindowAnalysis["texture"]>["fx"] | undefined,
  bounds:
    | {
        [K in keyof NonNullable<PlanWindowAnalysis["texture"]>["fx"]]?:
          | { min: number; max: number }
          | undefined;
      }
    | undefined,
) => {
  if (!fx || !bounds) return fx;
  const next = { ...fx } as NonNullable<
    NonNullable<PlanWindowAnalysis["texture"]>["fx"]
  >;
  for (const [key, range] of Object.entries(bounds)) {
    const rangeSpec = range as { min: number; max: number } | undefined;
    if (!rangeSpec) continue;
    const value = next[key as keyof typeof next];
    if (typeof value !== "number") continue;
    const min = Number(rangeSpec.min);
    const max = Number(rangeSpec.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) continue;
    next[key as keyof typeof next] = clamp01(
      Math.min(Math.max(value, min), max),
    );
  }
  return next;
};

const mergeEnergyCurves = (
  base: Array<{ bar: number; energy: number }> | undefined,
  intent: Array<{ bar: number; energy: number }> | undefined,
) => {
  if (!intent?.length) return base;
  const byBar = new Map<number, { base?: number; intent?: number }>();
  for (const point of base ?? []) {
    const bar = Math.max(1, Math.floor(point.bar));
    const energy = clamp01(point.energy);
    byBar.set(bar, { ...(byBar.get(bar) ?? {}), base: energy });
  }
  for (const point of intent) {
    const bar = Math.max(1, Math.floor(point.bar));
    const energy = clamp01(point.energy);
    byBar.set(bar, { ...(byBar.get(bar) ?? {}), intent: energy });
  }
  return Array.from(byBar.entries())
    .sort(([a], [b]) => a - b)
    .map(([bar, entry]) => {
      const merged =
        typeof entry.base === "number" && typeof entry.intent === "number"
          ? (entry.base + entry.intent) / 2
          : entry.intent ?? entry.base ?? 0.5;
      return { bar, energy: clamp01(merged) };
    });
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

aiPlanRouter.post("/plan", async (req, res) => {
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

  const originalKey =
    typeof originalId === "string" && originalId.trim().length > 0
      ? originalId.trim()
      : "";
  let seedInput = seed ?? (originalKey ? originalKey : "noisegen-plan");
  let original: ReturnType<typeof findOriginalById> | undefined;
  if (originalKey) {
    try {
      const store = await getNoisegenStore();
      original = findOriginalById(store, originalKey);
      if (seed == null) {
        const pulseSeedMeta = buildPulseSeed({
          originalId: original?.id ?? originalKey,
          timeSky: original?.timeSky,
        });
        if (pulseSeedMeta?.seed != null) {
          seedInput = pulseSeedMeta.seed;
        }
      }
    } catch {
      // ignore pulse lookup failures
    }
  }
  const seedValue =
    typeof seedInput === "number"
      ? Math.trunc(seedInput)
      : hashString(String(seedInput));
  const rng = makeRng(seedValue);
  const phase = rng() * Math.PI * 2;

  const contract = original?.intentContract ?? null;
  const intentSnapshot = original?.intentSnapshot;
  const intentPrefs = original?.intentSnapshotPreferences;
  const hasIntentSnapshot = Boolean(intentSnapshot);
  const applyIntentTempo = hasIntentSnapshot && (intentPrefs?.applyTempo ?? true);
  const applyIntentMix = hasIntentSnapshot && (intentPrefs?.applyMix ?? true);
  const applyIntentAutomation =
    hasIntentSnapshot && (intentPrefs?.applyAutomation ?? false);
  const intentTempo = resolveIntentTempo(
    tempo,
    intentSnapshot?.globals,
    applyIntentTempo,
  );
  const intentDevice = applyIntentMix ? intentSnapshot?.deviceIntent : undefined;
  const intentEnergyCurve = applyIntentAutomation
    ? intentSnapshot?.automation?.energyCurve
    : undefined;
  const intentState = createIntentEnforcementState();
  const baseRequest = enforceIntentContractOnRequest(
    {
      sampleInfluence: base?.sampleInfluence,
      styleInfluence: base?.styleInfluence,
      weirdness: base?.weirdness,
      tempo: intentTempo ?? tempo,
      key,
    },
    contract,
    intentState,
  );
  const tempoMeta = baseRequest.tempo ?? intentTempo ?? tempo;
  const resolvedKey = baseRequest.key ?? key;
  const baseSample = clamp01(baseRequest.sampleInfluence ?? 0.7);
  const baseStyle = clamp01(baseRequest.styleInfluence ?? 0.3);
  const baseWeird = clamp01(baseRequest.weirdness ?? 0.2);
  const analysisWindowMap = buildAnalysisWindowMap(analysis);
  const densitySeries =
    analysis?.onsetDensityByBar?.length
      ? analysis.onsetDensityByBar
      : analysis?.densityByBar;
  const brightnessSeries =
    analysis?.brightnessByBar?.length
      ? analysis.brightnessByBar
      : analysis?.centroidByBar?.length
        ? analysis.centroidByBar
        : analysis?.rolloffByBar?.length
          ? analysis.rolloffByBar
          : undefined;
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
    const density = resolveWindowDensity(
      analysisWindow,
      densitySeries,
      window.startBar,
      bars,
      energy,
      rng,
    );
    const brightness = resolveWindowBrightness(
      analysisWindow,
      brightnessSeries,
      window.startBar,
      bars,
      energy,
      rng,
    );
    energyByWindow.set(windowKey, energy);
    const textureBase = buildTexturePlan({
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
    }) as PlanWindowAnalysis["texture"];
    const eqPeaks = mergeIntentEqPeaks(
      textureBase?.eqPeaks,
      intentDevice?.eqPeaks,
    );
    const fx = clampIntentFxBounds(
      mergeIntentFx(textureBase?.fx, intentDevice?.fx),
      intentDevice?.bounds,
    );
    const texture = {
      ...textureBase,
      ...(eqPeaks?.length ? { eqPeaks } : {}),
      ...(fx ? { fx } : {}),
    };
    return {
      startBar: window.startBar,
      bars,
      ...(analysisWindow?.material ? { material: analysisWindow.material } : {}),
      texture,
    };
  });

  const modelPlan = await buildPlanFromModel({
    analysis: (analysis ?? undefined) as ModelPlanAnalysis | undefined,
    tempoBpm: tempoMeta?.bpm,
    windows,
    kbTexture: kbTexture ?? undefined,
  });
  const modelThreshold = 0.45;
  const useModel = Boolean(modelPlan && modelPlan.confidence >= modelThreshold);
  const modelWindowMap = useModel
    ? new Map(
        modelPlan!.windows.map((window) => [
          planWindowKey(window.startBar, window.bars),
          window,
        ]),
      )
    : null;
  const mergedWindowPlans = useModel
    ? windowPlans.map((window) => {
        const modelWindow = modelWindowMap?.get(
          planWindowKey(window.startBar, window.bars),
        );
        if (!modelWindow) return window;
        const mergedFx = {
          ...(window.texture?.fx ?? {}),
          ...(modelWindow.texture.fx ?? {}),
        };
        const mergedTexture = {
          ...(window.texture ?? {}),
          ...(modelWindow.texture ?? {}),
          ...(Object.keys(mergedFx).length ? { fx: mergedFx } : {}),
        };
        return { ...window, texture: mergedTexture };
      })
    : windowPlans;

  const energyCurveBase =
    analysis?.energyCurve?.length
      ? analysis.energyCurve
      : buildEnergyCurve(windows, energyByWindow, analysis?.energyByBar);
  const energyCurve = mergeEnergyCurves(energyCurveBase, intentEnergyCurve);

  const sections =
    analysis?.sections?.length ? analysis.sections : resolveSections(windows);

  const rawPlan = {
    global: {
      bpm: tempoMeta?.bpm,
      key: resolvedKey,
      sections,
      energyCurve,
    },
    windows: mergedWindowPlans,
  };
  const enforcedPlan = enforceIntentContractOnRenderPlan(
    rawPlan,
    contract,
    intentState,
  );
  const intentMeta = finalizeIntentMeta(intentState, contract);
  if (intentMeta.violations.length) {
    console.warn(
      "[ai.plan] intent violations",
      original?.id ?? originalKey,
      intentMeta.violations,
    );
  }

  return res.json({
    renderPlan: enforcedPlan,
    meta: {
      seed: seedValue,
      generatedAt: Date.now(),
      sources: {
        analysis: Boolean(analysis),
        energyByBar: Boolean(analysis?.energyByBar?.length),
        densityByBar: Boolean(analysis?.densityByBar?.length),
        onsetDensityByBar: Boolean(analysis?.onsetDensityByBar?.length),
        brightnessByBar: Boolean(analysis?.brightnessByBar?.length),
        centroidByBar: Boolean(analysis?.centroidByBar?.length),
        rolloffByBar: Boolean(analysis?.rolloffByBar?.length),
        dynamicRangeByBar: Boolean(analysis?.dynamicRangeByBar?.length),
        crestFactorByBar: Boolean(analysis?.crestFactorByBar?.length),
        tempoByBar: Boolean(analysis?.tempoByBar?.length),
        silenceByBar: Boolean(analysis?.silenceByBar?.length),
        chromaByBar: Boolean(analysis?.chromaByBar?.length),
        windows: Boolean(analysis?.windows?.length),
      },
      plannerVersion: useModel
        ? `model:v${modelPlan?.modelVersion ?? "unknown"}`
        : "heuristic:v1",
      modelVersion: useModel ? modelPlan?.modelVersion : undefined,
      modelConfidence: modelPlan?.confidence ?? 0,
      featureSourcesUsed: modelPlan?.featureSourcesUsed ?? [],
      modelTargetsUsed: modelPlan?.modelTargetsUsed ?? [],
      intent: intentMeta,
    },
  });
});

export { aiPlanRouter };
