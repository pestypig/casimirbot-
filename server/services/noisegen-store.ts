import path from "node:path";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";

export type JobStatus = "queued" | "processing" | "ready" | "error";
export type NoisegenJobType = "cover" | "legacy";

export type TempoMeta = {
  bpm: number;
  timeSig: string;
  offsetMs: number;
  barsInLoop?: number;
  quantized?: boolean;
};

export type NoisegenMood = {
  id: string;
  label: string;
  style: number;
  sample: number;
  weird: number;
  description?: string;
};

export type NoisegenOriginalAsset = {
  kind: "instrumental" | "vocal";
  fileName: string;
  path: string;
  mime: string;
  bytes: number;
  uploadedAt: number;
};

export type NoisegenStemAsset = {
  id: string;
  name: string;
  category?: string;
  fileName: string;
  path: string;
  mime: string;
  bytes: number;
  uploadedAt: number;
};

export type NoisegenTimeSkyMeta = {
  publishedAt?: number;
  composedStart?: number;
  composedEnd?: number;
  place?: string;
  skySignature?: string;
};

export type NoisegenOriginal = {
  id: string;
  title: string;
  artist: string;
  listens: number;
  duration: number;
  tempo?: TempoMeta;
  notes?: string;
  offsetMs?: number;
  uploadedAt: number;
  timeSky?: NoisegenTimeSkyMeta;
  assets: {
    instrumental?: NoisegenOriginalAsset;
    vocal?: NoisegenOriginalAsset;
    stems?: NoisegenStemAsset[];
  };
};

export type NoisegenGeneration = {
  id: string;
  originalId: string;
  title: string;
  mood: string;
  listens: number;
  createdAt: number;
  previewUrl?: string;
};

export type NoisegenRecipe = {
  id: string;
  name: string;
  originalId: string;
  createdAt: number;
  updatedAt: number;
  seed?: string | number;
  coverRequest: unknown;
  notes?: string;
};

export type NoisegenJob = {
  id: string;
  type: NoisegenJobType;
  status: JobStatus;
  request?: unknown;
  createdAt: number;
  updatedAt: number;
  previewUrl?: string;
  error?: string;
  evidence?: unknown;
  detail?: string;
};

export type NoisegenStore = {
  version: 1;
  originals: NoisegenOriginal[];
  pendingOriginals: NoisegenOriginal[];
  generations: NoisegenGeneration[];
  moods: NoisegenMood[];
  recipes: NoisegenRecipe[];
  jobs: NoisegenJob[];
};

const DEFAULT_MOODS: NoisegenMood[] = [
  {
    id: "neon-drift",
    label: "Neon Drift",
    style: 68,
    sample: 42,
    weird: 18,
    description: "Soft haze with steady motion.",
  },
  {
    id: "ember-fog",
    label: "Ember Fog",
    style: 55,
    sample: 35,
    weird: 30,
    description: "Warm mids, slow pulses.",
  },
  {
    id: "ion-rush",
    label: "Ion Rush",
    style: 80,
    sample: 60,
    weird: 25,
    description: "Bright energy with crisp transients.",
  },
  {
    id: "lunar-static",
    label: "Lunar Static",
    style: 30,
    sample: 70,
    weird: 45,
    description: "Texture-forward, airy noise.",
  },
  {
    id: "deep-void",
    label: "Deep Void",
    style: 20,
    sample: 25,
    weird: 65,
    description: "Sparse, distant, slow gravity.",
  },
  {
    id: "glass-tide",
    label: "Glass Tide",
    style: 65,
    sample: 50,
    weird: 12,
    description: "Clean pads with light shimmer.",
  },
];

const emptyStore = (): NoisegenStore => ({
  version: 1,
  originals: [],
  pendingOriginals: [],
  generations: [],
  moods: [...DEFAULT_MOODS],
  recipes: [],
  jobs: [],
});

const cloneStore = (store: NoisegenStore): NoisegenStore => {
  if (typeof structuredClone === "function") {
    return structuredClone(store) as NoisegenStore;
  }
  return JSON.parse(JSON.stringify(store)) as NoisegenStore;
};

export const getNoisegenPaths = () => {
  const baseDir =
    process.env.NOISEGEN_DATA_DIR?.trim() ||
    path.join(process.cwd(), "data", "noisegen");
  return {
    baseDir,
    storePath: path.join(baseDir, "store.json"),
    originalsDir: path.join(baseDir, "originals"),
    previewsDir: path.join(baseDir, "previews"),
  };
};

const ensureDirectories = async () => {
  const { baseDir, originalsDir, previewsDir } = getNoisegenPaths();
  await fs.mkdir(baseDir, { recursive: true });
  await fs.mkdir(originalsDir, { recursive: true });
  await fs.mkdir(previewsDir, { recursive: true });
};

const normalizeStore = (payload: unknown): NoisegenStore => {
  const data = payload && typeof payload === "object" ? (payload as any) : {};
  const moods =
    Array.isArray(data.moods) && data.moods.length > 0
      ? data.moods
      : [...DEFAULT_MOODS];
  return {
    version: 1,
    originals: Array.isArray(data.originals) ? data.originals : [],
    pendingOriginals: Array.isArray(data.pendingOriginals) ? data.pendingOriginals : [],
    generations: Array.isArray(data.generations) ? data.generations : [],
    moods,
    recipes: Array.isArray(data.recipes) ? data.recipes : [],
    jobs: Array.isArray(data.jobs) ? data.jobs : [],
  };
};

const DEFAULT_RANK_DELAY_MS = 60_000;
const PENDING_RANK_DELAY_MS = (() => {
  const raw = Number(process.env.NOISEGEN_RANK_DELAY_MS ?? DEFAULT_RANK_DELAY_MS);
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_RANK_DELAY_MS;
  return raw;
})();

const promotePendingOriginals = (store: NoisegenStore): NoisegenStore => {
  if (!Array.isArray(store.pendingOriginals) || store.pendingOriginals.length === 0) {
    return store;
  }
  const now = Date.now();
  const ready: NoisegenOriginal[] = [];
  const pending: NoisegenOriginal[] = [];
  const knownIds = new Set(store.originals.map((original) => original.id));

  for (const original of store.pendingOriginals) {
    if (!original?.id) continue;
    if (knownIds.has(original.id)) continue;
    const ageMs = now - (original.uploadedAt ?? now);
    if (ageMs >= PENDING_RANK_DELAY_MS) {
      ready.push(original);
      knownIds.add(original.id);
    } else {
      pending.push(original);
    }
  }

  if (ready.length === 0 && pending.length === store.pendingOriginals.length) {
    return store;
  }
  const next = cloneStore(store);
  next.pendingOriginals = pending;
  next.originals = [...next.originals, ...ready];
  return next;
};

const readStore = async (): Promise<NoisegenStore> => {
  await ensureDirectories();
  const { storePath } = getNoisegenPaths();
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
};

const writeStore = async (store: NoisegenStore): Promise<void> => {
  await ensureDirectories();
  const { storePath } = getNoisegenPaths();
  const tmpPath = `${storePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmpPath, storePath);
};

const resolveDefaultOriginal = async (): Promise<NoisegenOriginal | null> => {
  const defaultsRoot = path.join(
    process.cwd(),
    "client",
    "public",
    "originals",
    "default",
  );
  const defaultInstrumental = path.join(defaultsRoot, "instrumental.wav");
  if (!existsSync(defaultInstrumental)) return null;
  const duration = await estimateWavDurationSeconds(defaultInstrumental);
  const asset: NoisegenOriginalAsset = {
    kind: "instrumental",
    fileName: "instrumental.wav",
    path: defaultInstrumental,
    mime: "audio/wav",
    bytes: duration.bytes,
    uploadedAt: Date.now(),
  };
  return {
    id: "default",
    title: "Default Signal",
    artist: "Helix",
    listens: 120,
    duration: duration.seconds,
    tempo: {
      bpm: 120,
      timeSig: "4/4",
      offsetMs: 0,
      barsInLoop: 8,
      quantized: true,
    },
    uploadedAt: Date.now(),
    assets: { instrumental: asset },
  };
};

const ensureDefaults = async (store: NoisegenStore): Promise<NoisegenStore> => {
  let updated = false;
  const next = cloneStore(store);
  if (!Array.isArray(next.moods) || next.moods.length === 0) {
    next.moods = [...DEFAULT_MOODS];
    updated = true;
  }
  if (!next.originals.some((original) => original.id === "default")) {
    const fallback = await resolveDefaultOriginal();
    if (fallback) {
      next.originals.unshift(fallback);
      updated = true;
    }
  }
  return updated ? next : store;
};

let writeQueue: Promise<NoisegenStore> = Promise.resolve(emptyStore());

export const getNoisegenStore = async (): Promise<NoisegenStore> => {
  const store = await readStore();
  const withDefaults = await ensureDefaults(store);
  const withPromotions = promotePendingOriginals(withDefaults);
  if (withPromotions !== store) {
    await writeStore(withPromotions);
  }
  return withPromotions;
};

export const updateNoisegenStore = async (
  updater: (store: NoisegenStore) => NoisegenStore | void,
): Promise<NoisegenStore> => {
  let updated: NoisegenStore = emptyStore();
  writeQueue = writeQueue.then(async () => {
    const store = await readStore();
    const working = cloneStore(store);
    const next = updater(working) ?? working;
    const normalized = normalizeStore(next);
    const withDefaults = await ensureDefaults(normalized);
    updated = promotePendingOriginals(withDefaults);
    await writeStore(updated);
    return updated;
  });
  await writeQueue;
  return updated;
};

export const resolveOriginalAsset = (
  original: NoisegenOriginal,
  assetName: string,
): NoisegenOriginalAsset | undefined => {
  const key = assetName.replace(/\.[^.]+$/, "").toLowerCase();
  if (key === "instrumental") return original.assets.instrumental;
  if (key === "vocal") return original.assets.vocal;
  return undefined;
};

export const resolveStemAsset = (
  original: NoisegenOriginal,
  stemId: string,
): NoisegenStemAsset | undefined => {
  const needle = stemId.trim().toLowerCase();
  return original.assets.stems?.find(
    (stem) => stem.id.trim().toLowerCase() === needle,
  );
};

export const resolveOriginalAssetPath = (
  asset: NoisegenOriginalAsset,
): string => {
  const { baseDir } = getNoisegenPaths();
  return path.isAbsolute(asset.path) ? asset.path : path.join(baseDir, asset.path);
};

export const resolveStemAssetPath = (asset: NoisegenStemAsset): string => {
  const { baseDir } = getNoisegenPaths();
  return path.isAbsolute(asset.path) ? asset.path : path.join(baseDir, asset.path);
};

export const saveOriginalAsset = async (params: {
  originalId: string;
  kind: "instrumental" | "vocal";
  buffer: Buffer;
  mime: string;
  originalName?: string;
}): Promise<NoisegenOriginalAsset> => {
  const { originalsDir, baseDir } = getNoisegenPaths();
  const ext = safeExtension(params.originalName);
  const fileName = `${params.kind}${ext}`;
  const targetDir = path.join(originalsDir, params.originalId);
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);
  await fs.writeFile(filePath, params.buffer);
  return {
    kind: params.kind,
    fileName,
    path: path.relative(baseDir, filePath),
    mime: params.mime,
    bytes: params.buffer.byteLength,
    uploadedAt: Date.now(),
  };
};

export const saveStemAsset = async (params: {
  originalId: string;
  stemId: string;
  stemName: string;
  category?: string;
  buffer: Buffer;
  mime: string;
  originalName?: string;
}): Promise<NoisegenStemAsset> => {
  const { originalsDir, baseDir } = getNoisegenPaths();
  const ext = safeExtension(params.originalName);
  const fileName = `${params.stemId}${ext}`;
  const targetDir = path.join(originalsDir, params.originalId, "stems");
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);
  await fs.writeFile(filePath, params.buffer);
  return {
    id: params.stemId,
    name: params.stemName,
    category: params.category,
    fileName,
    path: path.relative(baseDir, filePath),
    mime: params.mime,
    bytes: params.buffer.byteLength,
    uploadedAt: Date.now(),
  };
};

export const savePreviewBuffer = async (params: {
  jobId: string;
  buffer: Buffer;
  mime?: string;
}): Promise<{ url: string; fileName: string; bytes: number; mime: string }> => {
  const { previewsDir } = getNoisegenPaths();
  const mime = params.mime?.trim() || "audio/wav";
  const ext = extensionForMime(mime);
  const fileName = `${params.jobId}${ext}`;
  await fs.mkdir(previewsDir, { recursive: true });
  await fs.writeFile(path.join(previewsDir, fileName), params.buffer);
  return {
    url: `/noisegen/previews/${encodeURIComponent(fileName)}`,
    fileName,
    bytes: params.buffer.byteLength,
    mime,
  };
};

export const findOriginalById = (
  store: NoisegenStore,
  originalId: string,
): NoisegenOriginal | undefined => {
  const needle = originalId.trim().toLowerCase();
  return (
    store.originals.find((original) => original.id.toLowerCase() === needle) ??
    store.pendingOriginals.find((original) => original.id.toLowerCase() === needle)
  );
};

const safeExtension = (value?: string): string => {
  if (!value) return ".wav";
  const ext = path.extname(value).toLowerCase();
  if (!ext || ext.length > 8) return ".wav";
  return ext;
};

const extensionForMime = (mime: string): string => {
  const lower = mime.toLowerCase();
  if (lower.includes("wav")) return ".wav";
  if (lower.includes("mpeg") || lower.includes("mp3")) return ".mp3";
  if (lower.includes("flac")) return ".flac";
  if (lower.includes("ogg")) return ".ogg";
  if (lower.includes("aiff")) return ".aiff";
  return ".bin";
};

const estimateWavDurationSeconds = async (
  filePath: string,
): Promise<{ seconds: number; bytes: number }> => {
  try {
    const buffer = await fs.readFile(filePath);
    const parsed = parseWavDuration(buffer);
    if (parsed) {
      return { seconds: parsed, bytes: buffer.byteLength };
    }
    return { seconds: fallbackDurationSeconds(buffer.byteLength), bytes: buffer.byteLength };
  } catch {
    return { seconds: fallbackDurationSeconds(0), bytes: 0 };
  }
};

const parseWavDuration = (buffer: Buffer): number | null => {
  if (buffer.byteLength < 44) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WAVE") return null;
  let offset = 12;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataSize = 0;
  while (offset + 8 <= buffer.byteLength) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkData = offset + 8;
    if (chunkId === "fmt " && chunkSize >= 16) {
      channels = buffer.readUInt16LE(chunkData + 2);
      sampleRate = buffer.readUInt32LE(chunkData + 4);
      bitsPerSample = buffer.readUInt16LE(chunkData + 14);
    } else if (chunkId === "data") {
      dataSize = chunkSize;
      break;
    }
    const nextOffset = chunkData + chunkSize + (chunkSize % 2);
    offset = nextOffset;
  }
  if (!sampleRate || !channels || !bitsPerSample || !dataSize) return null;
  const bytesPerSample = bitsPerSample / 8;
  if (!bytesPerSample) return null;
  const frameSize = bytesPerSample * channels;
  return dataSize / (sampleRate * frameSize);
};

const fallbackDurationSeconds = (bytes: number): number => {
  if (!Number.isFinite(bytes) || bytes <= 0) return 180;
  return Math.max(45, Math.min(600, Math.round(bytes / 16_000)));
};
