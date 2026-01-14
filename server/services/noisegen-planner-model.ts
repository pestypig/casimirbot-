import path from "node:path";
import { promises as fs } from "node:fs";

const SECTION_ORDER = ["intro", "verse", "build", "drop", "bridge", "outro"];
const DEFAULT_MODEL_PATH = path.join(
  process.cwd(),
  "datasets",
  "renderplan",
  "plan_model.json",
);
const EXPECTED_TARGETS = [
  "sampleInfluence",
  "styleInfluence",
  "weirdness",
  "fx.chorus",
  "fx.sat",
  "fx.reverbSend",
  "fx.comp",
];

type RenderPlanModelTarget = {
  weights: number[];
  bias: number;
  count?: number;
};

export type RenderPlanModel = {
  version: number;
  featureNames: string[];
  targets: Record<string, RenderPlanModelTarget>;
  examples?: number;
};

export type PlanWindowInput = {
  startBar: number;
  endBar: number;
};

export type PlanAnalysisWindow = {
  startBar: number;
  bars: number;
  energy?: number;
  density?: number;
  brightness?: number;
};

export type PlanAnalysis = {
  windows?: PlanAnalysisWindow[];
  energyByBar?: number[];
  densityByBar?: number[];
  onsetDensityByBar?: number[];
  brightnessByBar?: number[];
  centroidByBar?: number[];
  rolloffByBar?: number[];
  dynamicRangeByBar?: number[];
  crestFactorByBar?: number[];
  tempoByBar?: number[];
  silenceByBar?: number[];
  chromaByBar?: number[][];
  keyConfidence?: number;
  sections?: Array<{ name: string; startBar: number; bars: number }>;
};

export type ModelPlanWindow = {
  startBar: number;
  bars: number;
  texture: {
    kbTexture?: string | { weights: Record<string, number> };
    sampleInfluence?: number;
    styleInfluence?: number;
    weirdness?: number;
    fx?: {
      chorus?: number;
      sat?: number;
      reverbSend?: number;
      comp?: number;
    };
  };
};

export type ModelPlannerResult = {
  windows: ModelPlanWindow[];
  confidence: number;
  featureSourcesUsed: string[];
  modelVersion: number;
  modelTargetsUsed: string[];
};

type ModelCache = {
  model: RenderPlanModel;
  path: string;
  mtimeMs: number;
};

let cachedModel: ModelCache | null = null;

const clamp01 = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

const planWindowKey = (startBar: number, bars: number) => `${startBar}:${bars}`;

const resolveSectionName = (
  startBar: number,
  sections?: PlanAnalysis["sections"],
) => {
  if (!sections?.length) return null;
  for (const section of sections) {
    const sectionStart = Math.max(1, Math.floor(section.startBar));
    const sectionBars = Math.max(1, Math.floor(section.bars));
    if (startBar >= sectionStart && startBar < sectionStart + sectionBars) {
      const name = section.name?.trim().toLowerCase();
      return name || null;
    }
  }
  return null;
};

const averageSeries = (
  series: number[] | undefined,
  startBar: number,
  bars: number,
) => {
  if (!series?.length) return null;
  const startIndex = Math.max(0, startBar - 1);
  const endIndex = Math.min(series.length, startIndex + bars);
  if (endIndex <= startIndex) return null;
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

const buildFeatures = (params: {
  analysis: PlanAnalysis | undefined;
  tempoBpm: number;
  window: PlanWindowInput;
  maxBar: number;
}) => {
  const { analysis, tempoBpm, window, maxBar } = params;
  const startBar = Math.max(1, Math.floor(window.startBar));
  const bars = Math.max(1, Math.floor(window.endBar - window.startBar));
  const windowMap = new Map<string, PlanAnalysisWindow>();
  analysis?.windows?.forEach((entry) => {
    const key = planWindowKey(
      Math.max(1, Math.floor(entry.startBar)),
      Math.max(1, Math.floor(entry.bars)),
    );
    windowMap.set(key, entry);
  });
  const analysisWindow = windowMap.get(planWindowKey(startBar, bars));
  const energy =
    typeof analysisWindow?.energy === "number"
      ? analysisWindow.energy
      : averageSeries(analysis?.energyByBar, startBar, bars) ?? 0.5;
  const density =
    typeof analysisWindow?.density === "number"
      ? analysisWindow.density
      : averageSeries(analysis?.densityByBar, startBar, bars) ??
        clamp01(0.35 + energy * 0.45);
  const brightness =
    typeof analysisWindow?.brightness === "number"
      ? analysisWindow.brightness
      : averageSeries(analysis?.brightnessByBar, startBar, bars) ??
        clamp01(0.4 + energy * 0.35);
  const startNorm = startBar / Math.max(1, maxBar);
  const barsNorm = bars / Math.max(1, maxBar);
  const bpmNorm = tempoBpm / 240;
  const sectionName = resolveSectionName(startBar, analysis?.sections);
  const sectionFeatures = SECTION_ORDER.map((name) =>
    sectionName === name ? 1 : 0,
  );
  return [
    clamp01(energy),
    clamp01(density),
    clamp01(brightness),
    startNorm,
    barsNorm,
    bpmNorm,
    ...sectionFeatures,
  ];
};

const predictTarget = (
  target: RenderPlanModelTarget | undefined,
  features: number[],
) => {
  if (!target || !Array.isArray(target.weights)) return null;
  if (target.weights.length !== features.length) return null;
  let sum = target.bias ?? 0;
  for (let idx = 0; idx < target.weights.length; idx += 1) {
    sum += target.weights[idx] * features[idx];
  }
  return clamp01(sum);
};

const resolveModelPath = (explicit?: string) => {
  const raw =
    explicit?.trim() ||
    process.env.NOISEGEN_PLANNER_MODEL_PATH?.trim() ||
    DEFAULT_MODEL_PATH;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
};

export const loadRenderPlanModel = async (
  modelPath?: string,
): Promise<RenderPlanModel | null> => {
  const resolved = resolveModelPath(modelPath);
  try {
    const stat = await fs.stat(resolved);
    if (
      cachedModel &&
      cachedModel.path === resolved &&
      cachedModel.mtimeMs === stat.mtimeMs
    ) {
      return cachedModel.model;
    }
    const raw = await fs.readFile(resolved, "utf8");
    const parsed = JSON.parse(raw) as RenderPlanModel;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.featureNames) || !parsed.targets) return null;
    if (!Number.isFinite(parsed.version)) return null;
    cachedModel = { model: parsed, path: resolved, mtimeMs: stat.mtimeMs };
    return parsed;
  } catch {
    return null;
  }
};

export const buildPlanFromModel = async (params: {
  analysis?: PlanAnalysis;
  tempoBpm?: number;
  windows: PlanWindowInput[];
  kbTexture?: string | { weights: Record<string, number> } | null;
}): Promise<ModelPlannerResult | null> => {
  const model = await loadRenderPlanModel();
  if (!model) return null;
  const modelTargetsUsed = EXPECTED_TARGETS.filter(
    (name) => model.targets?.[name],
  );
  if (modelTargetsUsed.length === 0) return null;
  const tempoBpm = Math.max(1, params.tempoBpm ?? 120);
  const maxBar = Math.max(
    1,
    ...params.windows.map((window) =>
      Math.max(1, Math.floor(window.endBar)),
    ),
  );
  const analysis = params.analysis;
  const sources = [];
  if (analysis?.windows?.length) sources.push("analysis.windows");
  if (analysis?.energyByBar?.length) sources.push("analysis.energyByBar");
  if (analysis?.densityByBar?.length) sources.push("analysis.densityByBar");
  if (analysis?.brightnessByBar?.length) {
    sources.push("analysis.brightnessByBar");
  }
  if (analysis?.sections?.length) sources.push("analysis.sections");
  sources.push("model");

  const sourceScore =
    (analysis?.windows?.length ? 1 : 0) +
    (analysis?.energyByBar?.length ? 1 : 0) +
    (analysis?.densityByBar?.length ? 1 : 0) +
    (analysis?.brightnessByBar?.length ? 1 : 0) +
    (analysis?.sections?.length ? 1 : 0);
  const normalizedSource = sourceScore / 5;
  const targetScore = modelTargetsUsed.length / EXPECTED_TARGETS.length;
  const confidence = clamp01(0.25 + normalizedSource * 0.45 + targetScore * 0.3);

  const windows = params.windows.map((window) => {
    const bars = Math.max(1, Math.floor(window.endBar - window.startBar));
    const features = buildFeatures({
      analysis,
      tempoBpm,
      window,
      maxBar,
    });
    const sampleInfluence = predictTarget(
      model.targets["sampleInfluence"],
      features,
    );
    const styleInfluence = predictTarget(
      model.targets["styleInfluence"],
      features,
    );
    const weirdness = predictTarget(model.targets["weirdness"], features);
    const fxChorus = predictTarget(model.targets["fx.chorus"], features);
    const fxSat = predictTarget(model.targets["fx.sat"], features);
    const fxReverbSend = predictTarget(
      model.targets["fx.reverbSend"],
      features,
    );
    const fxComp = predictTarget(model.targets["fx.comp"], features);
    const fx =
      fxChorus != null || fxSat != null || fxReverbSend != null || fxComp != null
        ? {
            ...(fxChorus != null ? { chorus: fxChorus } : {}),
            ...(fxSat != null ? { sat: fxSat } : {}),
            ...(fxReverbSend != null ? { reverbSend: fxReverbSend } : {}),
            ...(fxComp != null ? { comp: fxComp } : {}),
          }
        : undefined;
    return {
      startBar: Math.max(1, Math.floor(window.startBar)),
      bars,
      texture: {
        ...(params.kbTexture ? { kbTexture: params.kbTexture } : {}),
        ...(sampleInfluence != null ? { sampleInfluence } : {}),
        ...(styleInfluence != null ? { styleInfluence } : {}),
        ...(weirdness != null ? { weirdness } : {}),
        ...(fx ? { fx } : {}),
      },
    } satisfies ModelPlanWindow;
  });

  return {
    windows,
    confidence,
    featureSourcesUsed: sources,
    modelVersion: model.version,
    modelTargetsUsed,
  };
};
