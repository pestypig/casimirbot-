import path from "node:path";
import { promises as fs } from "node:fs";
import { createReadStream, existsSync } from "node:fs";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

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
  waveformPeaks?: number[];
  waveformDurationMs?: number;
  loudnessDb?: number;
  sampleRate?: number;
  channels?: number;
  analysisPath?: string;
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
  waveformPeaks?: number[];
  waveformDurationMs?: number;
  loudnessDb?: number;
  sampleRate?: number;
  channels?: number;
  analysisPath?: string;
};

export type NoisegenPlaybackAsset = {
  id: string;
  label: string;
  codec: "aac" | "opus" | "mp3" | "wav";
  fileName: string;
  path: string;
  mime: string;
  bytes: number;
  uploadedAt: number;
};

export type NoisegenStemGroupAsset = {
  id: string;
  groupId: string;
  label: string;
  category: string;
  codec: "aac" | "opus" | "mp3" | "wav";
  fileName: string;
  path: string;
  mime: string;
  bytes: number;
  uploadedAt: number;
  durationMs?: number;
  sampleRate?: number;
  channels?: number;
};

export type NoisegenProcessingState = {
  status: JobStatus;
  detail?: string;
  updatedAt: number;
};

export type NoisegenTimeSkyMeta = {
  publishedAt?: number;
  composedStart?: number;
  composedEnd?: number;
  place?: string;
  skySignature?: string;
};

type BundledOriginalManifest = {
  id: string;
  title: string;
  artist: string;
  folder?: string;
  listens?: number;
  duration?: number;
  tempo?: TempoMeta;
  notes?: string;
  offsetMs?: number;
  timeSky?: NoisegenTimeSkyMeta;
  uploadedAt?: number;
  assets?: {
    instrumental?: string;
    vocal?: string;
  };
  stems?: Array<{
    file: string;
    id?: string;
    name?: string;
    category?: string;
  }>;
};

type BundledManifestFile = {
  originals?: BundledOriginalManifest[];
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
  processing?: NoisegenProcessingState;
  assets: {
    instrumental?: NoisegenOriginalAsset;
    vocal?: NoisegenOriginalAsset;
    stems?: NoisegenStemAsset[];
    playback?: NoisegenPlaybackAsset[];
    stemGroups?: NoisegenStemGroupAsset[];
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

type NoisegenStorageBackend = "fs" | "replit";

const resolveNoisegenStorageBackend = (): NoisegenStorageBackend => {
  const raw = process.env.NOISEGEN_STORAGE_BACKEND?.trim().toLowerCase();
  return raw === "replit" ? "replit" : "fs";
};

import type { Client as ReplitStorageClient } from "@replit/object-storage";

let replitClientInstance: ReplitStorageClient | null = null;

const getReplitClient = async (): Promise<ReplitStorageClient> => {
  if (!replitClientInstance) {
    const { Client } = await import("@replit/object-storage");
    replitClientInstance = new Client();
  }
  return replitClientInstance;
};

const NOISEGEN_STORAGE_PREFIX = "noisegen/originals";

const buildNoisegenStorageKey = (originalId: string, relativePath: string) =>
  path.posix.join(
    NOISEGEN_STORAGE_PREFIX,
    originalId,
    relativePath.replace(/\\/g, "/"),
  );

export const isReplitStoragePath = (value: string): boolean =>
  value.startsWith("replit://");

const buildReplitLocator = (key: string): string => `replit://${key}`;

export const resolveReplitStorageKey = (locator: string): string =>
  locator.replace(/^replit:\/\//, "");

const uploadReplitObject = async (
  key: string,
  buffer: Buffer,
): Promise<void> => {
  const client = await getReplitClient();
  await client.uploadFromBytes(key, buffer);
};

const uploadReplitFile = async (key: string, filePath: string): Promise<void> => {
  const client = await getReplitClient();
  const stream = createReadStream(filePath);
  await client.uploadFromStream(key, stream);
};

export const downloadReplitObjectStream = async (
  key: string,
): Promise<Readable> => {
  const client = await getReplitClient();
  return client.downloadAsStream(key);
};

export const resolveBundledOriginalsRoots = (): string[] => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const candidates = [
    path.resolve(process.cwd(), "client", "public", "originals"),
    path.resolve(process.cwd(), "dist", "public", "originals"),
    path.resolve(__dirname, "..", "..", "client", "public", "originals"),
    path.resolve(__dirname, "..", "..", "dist", "public", "originals"),
  ];
  return candidates.filter(
    (candidate, index) =>
      candidates.indexOf(candidate) === index && existsSync(candidate),
  );
};

export const resolveBundledOriginalsRoot = (): string =>
  resolveBundledOriginalsRoots()[0] ??
  path.resolve(process.cwd(), "client", "public", "originals");

const resolveBundledManifestPath = (): string => {
  const roots = resolveBundledOriginalsRoots();
  for (const root of roots) {
    const candidate = path.join(root, "manifest.json");
    if (existsSync(candidate)) return candidate;
  }
  return path.join(resolveBundledOriginalsRoot(), "manifest.json");
};

let bundledOriginalsCache:
  | { mtimeMs: number; originals: NoisegenOriginal[] }
  | null = null;

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
    const playbackReady =
      (original.processing?.status === "ready" &&
        (original.assets.playback?.length ?? 0) > 0) ||
      (original.assets.playback?.length ?? 0) > 0;
    if (ageMs >= PENDING_RANK_DELAY_MS && playbackReady) {
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

const readBundledManifest = async (): Promise<BundledOriginalManifest[]> => {
  try {
    const raw = await fs.readFile(resolveBundledManifestPath(), "utf8");
    const parsed = JSON.parse(raw) as
      | BundledManifestFile
      | BundledOriginalManifest[];
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.originals)) return parsed.originals;
    return [];
  } catch {
    return [];
  }
};

const listBundledStemFiles = async (
  rootDir: string,
): Promise<Array<{ file: string }>> => {
  const stemsDir = path.join(rootDir, "stems");
  try {
    const entries = await fs.readdir(stemsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && isAudioExtension(entry.name))
      .map((entry) => ({ file: path.join("stems", entry.name) }))
      .sort((a, b) => a.file.localeCompare(b.file));
  } catch {
    return [];
  }
};

const resolveBundledOriginal = async (
  manifest: BundledOriginalManifest,
): Promise<NoisegenOriginal | null> => {
  const id = manifest.id?.trim();
  if (!id) return null;
  const folder = manifest.folder?.trim() || id;
  const roots = resolveBundledOriginalsRoots();
  const rootDir =
    roots.map((root) => path.join(root, folder)).find((dir) => existsSync(dir)) ??
    path.join(resolveBundledOriginalsRoot(), folder);
  if (!existsSync(rootDir)) return null;

  const assets: NoisegenOriginal["assets"] = {};
  const uploadedAtCandidates: number[] = [];
  const recordUploadedAt = (value?: number) => {
    if (!Number.isFinite(value)) return;
    uploadedAtCandidates.push(Number(value));
  };

  const resolveOriginalFile = async (
    kind: "instrumental" | "vocal",
    fileName?: string,
  ) => {
    if (!fileName) return;
    const filePath = path.isAbsolute(fileName)
      ? fileName
      : path.join(rootDir, fileName);
    if (!existsSync(filePath)) return;
    const stats = await fs.stat(filePath);
    const asset: NoisegenOriginalAsset = {
      kind,
      fileName: path.basename(filePath),
      path: filePath,
      mime: mimeFromPath(filePath),
      bytes: stats.size,
      uploadedAt: Math.round(stats.mtimeMs),
    };
    assets[kind] = asset;
    recordUploadedAt(asset.uploadedAt);
  };

  const fallbackInstrumental = path.join(rootDir, "instrumental.wav");
  const fallbackVocal = path.join(rootDir, "vocal.wav");
  await resolveOriginalFile(
    "instrumental",
    manifest.assets?.instrumental ??
      (existsSync(fallbackInstrumental) ? "instrumental.wav" : undefined),
  );
  await resolveOriginalFile(
    "vocal",
    manifest.assets?.vocal ??
      (existsSync(fallbackVocal) ? "vocal.wav" : undefined),
  );

  if (!assets.playback && assets.instrumental) {
    assets.playback = [buildPlaybackFromAsset(assets.instrumental)];
  }

  const stemEntries =
    manifest.stems && manifest.stems.length > 0
      ? manifest.stems
      : await listBundledStemFiles(rootDir);
  if (stemEntries.length > 0) {
    const usedStemIds = new Set<string>();
    const stems: NoisegenStemAsset[] = [];
    for (const entry of stemEntries) {
      const filePath = path.isAbsolute(entry.file)
        ? entry.file
        : path.join(rootDir, entry.file);
      if (!existsSync(filePath)) continue;
      const stats = await fs.stat(filePath);
      const name = entry.name?.trim() || normalizeStemName(entry.file);
      const idValue = entry.id?.trim() || buildStemId(name, usedStemIds);
      const category =
        normalizeStemCategory(entry.category) ?? inferStemCategory(name);
      const stem: NoisegenStemAsset = {
        id: idValue,
        name,
        category,
        fileName: path.basename(filePath),
        path: filePath,
        mime: mimeFromPath(filePath),
        bytes: stats.size,
        uploadedAt: Math.round(stats.mtimeMs),
      };
      stems.push(stem);
      recordUploadedAt(stem.uploadedAt);
    }
    if (stems.length > 0) {
      assets.stems = stems;
    }
  }

  const durationSource =
    assets.instrumental?.path ??
    assets.vocal?.path ??
    assets.stems?.[0]?.path;
  const durationSeconds = Number.isFinite(manifest.duration)
    ? Number(manifest.duration)
    : durationSource
      ? (await estimateWavDurationSeconds(durationSource)).seconds
      : 0;

  const uploadedAt = Number.isFinite(manifest.uploadedAt)
    ? Number(manifest.uploadedAt)
    : uploadedAtCandidates.length > 0
      ? Math.max(...uploadedAtCandidates)
      : Date.now();
  const notes = manifest.notes?.trim();

  return {
    id,
    title: manifest.title,
    artist: manifest.artist,
    listens: manifest.listens ?? 0,
    duration: Math.max(1, Math.round(durationSeconds)),
    tempo: manifest.tempo ?? undefined,
    notes: notes || undefined,
    offsetMs: manifest.offsetMs,
    uploadedAt,
    timeSky: manifest.timeSky,
    assets,
  };
};

const resolveBundledOriginals = async (): Promise<NoisegenOriginal[]> => {
  try {
    const stats = await fs.stat(resolveBundledManifestPath());
    const mtimeMs = Math.round(stats.mtimeMs);
    if (bundledOriginalsCache?.mtimeMs === mtimeMs) {
      return bundledOriginalsCache.originals;
    }
    const manifest = await readBundledManifest();
    const originals = (
      await Promise.all(manifest.map((entry) => resolveBundledOriginal(entry)))
    ).filter(Boolean) as NoisegenOriginal[];
    bundledOriginalsCache = { mtimeMs, originals };
    return originals;
  } catch {
    bundledOriginalsCache = { mtimeMs: 0, originals: [] };
    return [];
  }
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
  const playback = buildPlaybackFromAsset(asset);
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
    assets: { instrumental: asset, playback: [playback] },
  };
};

const isBlank = (value?: string): boolean => !value || value.trim().length === 0;

const shouldReplaceAsset = (asset?: NoisegenOriginalAsset): boolean => {
  if (!asset) return true;
  if (isReplitStoragePath(asset.path)) return false;
  try {
    return !existsSync(resolveOriginalAssetPath(asset));
  } catch {
    return true;
  }
};

const shouldReplaceStems = (stems?: NoisegenStemAsset[]): boolean => {
  if (!stems || stems.length === 0) return true;
  if (stems.some((stem) => isReplitStoragePath(stem.path))) return false;
  return stems.every((stem) => {
    try {
      return !existsSync(resolveStemAssetPath(stem));
    } catch {
      return true;
    }
  });
};

const shouldReplacePlayback = (playback?: NoisegenPlaybackAsset[]): boolean => {
  if (!playback || playback.length === 0) return true;
  if (playback.some((asset) => isReplitStoragePath(asset.path))) return false;
  return playback.every((asset) => {
    try {
      return !existsSync(resolvePlaybackAssetPath(asset));
    } catch {
      return true;
    }
  });
};

const mergeBundledOriginal = (
  existing: NoisegenOriginal,
  bundled: NoisegenOriginal,
): { merged: NoisegenOriginal; changed: boolean } => {
  let changed = false;
  const mergedAssets = { ...existing.assets };
  if (shouldReplaceAsset(mergedAssets.instrumental) && bundled.assets.instrumental) {
    mergedAssets.instrumental = bundled.assets.instrumental;
    changed = true;
  }
  if (shouldReplaceAsset(mergedAssets.vocal) && bundled.assets.vocal) {
    mergedAssets.vocal = bundled.assets.vocal;
    changed = true;
  }
  if (
    shouldReplaceStems(mergedAssets.stems) &&
    bundled.assets.stems &&
    bundled.assets.stems.length > 0
  ) {
    mergedAssets.stems = bundled.assets.stems;
    changed = true;
  }
  if (
    shouldReplacePlayback(mergedAssets.playback) &&
    bundled.assets.playback &&
    bundled.assets.playback.length > 0
  ) {
    mergedAssets.playback = bundled.assets.playback;
    changed = true;
  }

  const merged: NoisegenOriginal = {
    ...existing,
    assets: mergedAssets,
  };

  if (isBlank(merged.title) && !isBlank(bundled.title)) {
    merged.title = bundled.title;
    changed = true;
  }
  if (isBlank(merged.artist) && !isBlank(bundled.artist)) {
    merged.artist = bundled.artist;
    changed = true;
  }
  if (!Number.isFinite(merged.duration) || merged.duration <= 0) {
    if (Number.isFinite(bundled.duration) && bundled.duration > 0) {
      merged.duration = bundled.duration;
      changed = true;
    }
  }
  if (!merged.tempo && bundled.tempo) {
    merged.tempo = bundled.tempo;
    changed = true;
  }
  if (!merged.notes && bundled.notes) {
    merged.notes = bundled.notes;
    changed = true;
  }
  if (merged.offsetMs == null && bundled.offsetMs != null) {
    merged.offsetMs = bundled.offsetMs;
    changed = true;
  }
  if (!merged.timeSky && bundled.timeSky) {
    merged.timeSky = bundled.timeSky;
    changed = true;
  }
  if (!Number.isFinite(merged.uploadedAt) && Number.isFinite(bundled.uploadedAt)) {
    merged.uploadedAt = bundled.uploadedAt;
    changed = true;
  }

  return { merged, changed };
};

const mergeBundledIntoList = (
  list: NoisegenOriginal[],
  bundled: NoisegenOriginal,
): { found: boolean; changed: boolean } => {
  const index = list.findIndex(
    (entry) => entry.id.toLowerCase() === bundled.id.toLowerCase(),
  );
  if (index < 0) return { found: false, changed: false };
  const { merged, changed } = mergeBundledOriginal(list[index], bundled);
  if (changed) {
    list[index] = merged;
  }
  return { found: true, changed };
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
  const bundled = await resolveBundledOriginals();
  if (bundled.length > 0) {
    for (const original of bundled) {
      const mergedOriginals = mergeBundledIntoList(next.originals, original);
      const mergedPending = mergedOriginals.found
        ? { found: true, changed: false }
        : mergeBundledIntoList(next.pendingOriginals, original);

      if (!mergedOriginals.found && !mergedPending.found) {
        next.originals.push(original);
        updated = true;
        continue;
      }
      if (mergedOriginals.changed || mergedPending.changed) {
        updated = true;
      }
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

export const resolvePlaybackAsset = (
  original: NoisegenOriginal,
  playbackId: string,
): NoisegenPlaybackAsset | undefined => {
  const needle = playbackId.trim().toLowerCase();
  return original.assets.playback?.find(
    (asset) => asset.id.trim().toLowerCase() === needle,
  );
};

export const resolveStemGroupAsset = (
  original: NoisegenOriginal,
  assetId: string,
): NoisegenStemGroupAsset | undefined => {
  const needle = assetId.trim().toLowerCase();
  return original.assets.stemGroups?.find(
    (asset) => asset.id.trim().toLowerCase() === needle,
  );
};

export const resolveOriginalAssetPath = (
  asset: NoisegenOriginalAsset,
): string => {
  if (isReplitStoragePath(asset.path)) return asset.path;
  const { baseDir } = getNoisegenPaths();
  
  if (path.isAbsolute(asset.path)) {
    if (existsSync(asset.path)) return asset.path;
    const roots = resolveBundledOriginalsRoots();
    for (const root of roots) {
      const candidate = path.join(root, path.basename(path.dirname(asset.path)), asset.fileName);
      if (existsSync(candidate)) return candidate;
    }
    return asset.path;
  }
  return path.join(baseDir, asset.path);
};

export const resolveStemAssetPath = (asset: NoisegenStemAsset): string => {
  if (isReplitStoragePath(asset.path)) return asset.path;
  const { baseDir } = getNoisegenPaths();
  
  if (path.isAbsolute(asset.path)) {
    if (existsSync(asset.path)) return asset.path;
    const roots = resolveBundledOriginalsRoots();
    for (const root of roots) {
      const originalId = path.basename(path.dirname(path.dirname(asset.path)));
      const candidate = path.join(root, originalId, "stems", asset.fileName);
      if (existsSync(candidate)) return candidate;
    }
    return asset.path;
  }
  return path.join(baseDir, asset.path);
};

export const resolvePlaybackAssetPath = (
  asset: NoisegenPlaybackAsset,
): string => {
  if (isReplitStoragePath(asset.path)) return asset.path;
  const { baseDir } = getNoisegenPaths();

  if (path.isAbsolute(asset.path)) {
    if (existsSync(asset.path)) return asset.path;
    const roots = resolveBundledOriginalsRoots();
    const originalId = path.basename(path.dirname(path.dirname(asset.path)));
    for (const root of roots) {
      const candidate = path.join(root, originalId, "playback", asset.fileName);
      if (existsSync(candidate)) return candidate;
    }
    return asset.path;
  }
  return path.join(baseDir, asset.path);
};

export const resolveStemGroupAssetPath = (
  asset: NoisegenStemGroupAsset,
): string => {
  if (isReplitStoragePath(asset.path)) return asset.path;
  const { baseDir } = getNoisegenPaths();

  if (path.isAbsolute(asset.path)) {
    if (existsSync(asset.path)) return asset.path;
    const roots = resolveBundledOriginalsRoots();
    const originalId = path.basename(path.dirname(path.dirname(asset.path)));
    for (const root of roots) {
      const candidate = path.join(
        root,
        originalId,
        "stem-groups",
        asset.fileName,
      );
      if (existsSync(candidate)) return candidate;
    }
    return asset.path;
  }
  return path.join(baseDir, asset.path);
};

export const saveOriginalAsset = async (params: {
  originalId: string;
  kind: "instrumental" | "vocal";
  buffer: Buffer;
  mime: string;
  originalName?: string;
}): Promise<NoisegenOriginalAsset> => {
  const ext = safeExtension(params.originalName);
  const fileName = `${params.kind}${ext}`;
  const backend = resolveNoisegenStorageBackend();
  if (backend === "replit") {
    const key = buildNoisegenStorageKey(params.originalId, fileName);
    await uploadReplitObject(key, params.buffer);
    return {
      kind: params.kind,
      fileName,
      path: buildReplitLocator(key),
      mime: params.mime,
      bytes: params.buffer.byteLength,
      uploadedAt: Date.now(),
    };
  }

  const { originalsDir, baseDir } = getNoisegenPaths();
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

export const savePlaybackAsset = async (params: {
  originalId: string;
  playbackId: string;
  label: string;
  codec: NoisegenPlaybackAsset["codec"];
  buffer: Buffer;
  mime: string;
  originalName?: string;
}): Promise<NoisegenPlaybackAsset> => {
  const ext = safeExtension(params.originalName);
  const fileName = `${params.playbackId}${ext}`;
  const backend = resolveNoisegenStorageBackend();
  if (backend === "replit") {
    const key = buildNoisegenStorageKey(
      params.originalId,
      path.posix.join("playback", fileName),
    );
    await uploadReplitObject(key, params.buffer);
    return {
      id: params.playbackId,
      label: params.label,
      codec: params.codec,
      fileName,
      path: buildReplitLocator(key),
      mime: params.mime,
      bytes: params.buffer.byteLength,
      uploadedAt: Date.now(),
    };
  }

  const { originalsDir, baseDir } = getNoisegenPaths();
  const targetDir = path.join(originalsDir, params.originalId, "playback");
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);
  await fs.writeFile(filePath, params.buffer);
  return {
    id: params.playbackId,
    label: params.label,
    codec: params.codec,
    fileName,
    path: path.relative(baseDir, filePath),
    mime: params.mime,
    bytes: params.buffer.byteLength,
    uploadedAt: Date.now(),
  };
};

export const saveStemGroupAsset = async (params: {
  originalId: string;
  assetId: string;
  groupId: string;
  label: string;
  category: string;
  codec: NoisegenStemGroupAsset["codec"];
  buffer: Buffer;
  mime: string;
  durationMs?: number;
  sampleRate?: number;
  channels?: number;
  originalName?: string;
}): Promise<NoisegenStemGroupAsset> => {
  const ext = safeExtension(params.originalName);
  const fileName = `${params.assetId}${ext}`;
  const backend = resolveNoisegenStorageBackend();
  if (backend === "replit") {
    const key = buildNoisegenStorageKey(
      params.originalId,
      path.posix.join("stem-groups", fileName),
    );
    await uploadReplitObject(key, params.buffer);
    return {
      id: params.assetId,
      groupId: params.groupId,
      label: params.label,
      category: params.category,
      codec: params.codec,
      fileName,
      path: buildReplitLocator(key),
      mime: params.mime,
      bytes: params.buffer.byteLength,
      uploadedAt: Date.now(),
      durationMs: params.durationMs,
      sampleRate: params.sampleRate,
      channels: params.channels,
    };
  }

  const { originalsDir, baseDir } = getNoisegenPaths();
  const targetDir = path.join(originalsDir, params.originalId, "stem-groups");
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);
  await fs.writeFile(filePath, params.buffer);
  return {
    id: params.assetId,
    groupId: params.groupId,
    label: params.label,
    category: params.category,
    codec: params.codec,
    fileName,
    path: path.relative(baseDir, filePath),
    mime: params.mime,
    bytes: params.buffer.byteLength,
    uploadedAt: Date.now(),
    durationMs: params.durationMs,
    sampleRate: params.sampleRate,
    channels: params.channels,
  };
};

export const savePlaybackAssetFromFile = async (params: {
  originalId: string;
  playbackId: string;
  label: string;
  codec: NoisegenPlaybackAsset["codec"];
  filePath: string;
  mime: string;
  originalName?: string;
}): Promise<NoisegenPlaybackAsset> => {
  const ext = safeExtension(params.originalName ?? params.filePath);
  const fileName = `${params.playbackId}${ext}`;
  const stats = await fs.stat(params.filePath);
  const backend = resolveNoisegenStorageBackend();
  if (backend === "replit") {
    const key = buildNoisegenStorageKey(
      params.originalId,
      path.posix.join("playback", fileName),
    );
    await uploadReplitFile(key, params.filePath);
    return {
      id: params.playbackId,
      label: params.label,
      codec: params.codec,
      fileName,
      path: buildReplitLocator(key),
      mime: params.mime,
      bytes: stats.size,
      uploadedAt: Date.now(),
    };
  }

  const { originalsDir, baseDir } = getNoisegenPaths();
  const targetDir = path.join(originalsDir, params.originalId, "playback");
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);
  await fs.copyFile(params.filePath, filePath);
  return {
    id: params.playbackId,
    label: params.label,
    codec: params.codec,
    fileName,
    path: path.relative(baseDir, filePath),
    mime: params.mime,
    bytes: stats.size,
    uploadedAt: Date.now(),
  };
};

export const saveOriginalAssetFromFile = async (params: {
  originalId: string;
  kind: "instrumental" | "vocal";
  filePath: string;
  mime: string;
  originalName?: string;
}): Promise<NoisegenOriginalAsset> => {
  const ext = safeExtension(params.originalName ?? params.filePath);
  const fileName = `${params.kind}${ext}`;
  const stats = await fs.stat(params.filePath);
  const backend = resolveNoisegenStorageBackend();
  if (backend === "replit") {
    const key = buildNoisegenStorageKey(params.originalId, fileName);
    await uploadReplitFile(key, params.filePath);
    return {
      kind: params.kind,
      fileName,
      path: buildReplitLocator(key),
      mime: params.mime,
      bytes: stats.size,
      uploadedAt: Date.now(),
    };
  }

  const { originalsDir, baseDir } = getNoisegenPaths();
  const targetDir = path.join(originalsDir, params.originalId);
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);
  try {
    await fs.rename(params.filePath, filePath);
  } catch {
    await fs.copyFile(params.filePath, filePath);
    await fs.unlink(params.filePath);
  }
  return {
    kind: params.kind,
    fileName,
    path: path.relative(baseDir, filePath),
    mime: params.mime,
    bytes: stats.size,
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
  const ext = safeExtension(params.originalName);
  const fileName = `${params.stemId}${ext}`;
  const backend = resolveNoisegenStorageBackend();
  if (backend === "replit") {
    const key = buildNoisegenStorageKey(
      params.originalId,
      path.posix.join("stems", fileName),
    );
    await uploadReplitObject(key, params.buffer);
    return {
      id: params.stemId,
      name: params.stemName,
      category: params.category,
      fileName,
      path: buildReplitLocator(key),
      mime: params.mime,
      bytes: params.buffer.byteLength,
      uploadedAt: Date.now(),
    };
  }

  const { originalsDir, baseDir } = getNoisegenPaths();
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

export const saveStemAssetFromFile = async (params: {
  originalId: string;
  stemId: string;
  stemName: string;
  category?: string;
  filePath: string;
  mime: string;
  originalName?: string;
}): Promise<NoisegenStemAsset> => {
  const ext = safeExtension(params.originalName ?? params.filePath);
  const fileName = `${params.stemId}${ext}`;
  const stats = await fs.stat(params.filePath);
  const backend = resolveNoisegenStorageBackend();
  if (backend === "replit") {
    const key = buildNoisegenStorageKey(
      params.originalId,
      path.posix.join("stems", fileName),
    );
    await uploadReplitFile(key, params.filePath);
    return {
      id: params.stemId,
      name: params.stemName,
      category: params.category,
      fileName,
      path: buildReplitLocator(key),
      mime: params.mime,
      bytes: stats.size,
      uploadedAt: Date.now(),
    };
  }

  const { originalsDir, baseDir } = getNoisegenPaths();
  const targetDir = path.join(originalsDir, params.originalId, "stems");
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);
  try {
    await fs.rename(params.filePath, filePath);
  } catch {
    await fs.copyFile(params.filePath, filePath);
    await fs.unlink(params.filePath);
  }
  return {
    id: params.stemId,
    name: params.stemName,
    category: params.category,
    fileName,
    path: path.relative(baseDir, filePath),
    mime: params.mime,
    bytes: stats.size,
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

export const saveAnalysisArtifact = async (params: {
  originalId: string;
  fileName: string;
  buffer: Buffer;
}): Promise<string> => {
  const backend = resolveNoisegenStorageBackend();
  if (backend === "replit") {
    const key = buildNoisegenStorageKey(
      params.originalId,
      path.posix.join("analysis", params.fileName),
    );
    await uploadReplitObject(key, params.buffer);
    return buildReplitLocator(key);
  }

  const { originalsDir, baseDir } = getNoisegenPaths();
  const targetDir = path.join(originalsDir, params.originalId, "analysis");
  await fs.mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, params.fileName);
  await fs.writeFile(filePath, params.buffer);
  return path.relative(baseDir, filePath);
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

const STEM_CATEGORY_ALLOWLIST = new Set([
  "drums",
  "bass",
  "music",
  "fx",
  "other",
]);

const isAudioExtension = (fileName: string): boolean => {
  const ext = path.extname(fileName).toLowerCase();
  return [
    ".wav",
    ".wave",
    ".mp3",
    ".flac",
    ".ogg",
    ".oga",
    ".aiff",
    ".aif",
  ].includes(ext);
};

const mimeFromPath = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".wav" || ext === ".wave") return "audio/wav";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".flac") return "audio/flac";
  if (ext === ".ogg" || ext === ".oga") return "audio/ogg";
  if (ext === ".aiff" || ext === ".aif") return "audio/aiff";
  return "application/octet-stream";
};

const normalizeStemName = (value?: string): string => {
  if (!value) return "stem";
  const base = path.basename(value, path.extname(value));
  const cleaned = base.replace(/[_-]+/g, " ").trim();
  return cleaned || "stem";
};

const slugifyStem = (value: string): string => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "stem";
};

const buildStemId = (name: string, used: Set<string>): string => {
  const base = slugifyStem(name);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let index = 2;
  while (used.has(`${base}-${index}`)) {
    index += 1;
  }
  const next = `${base}-${index}`;
  used.add(next);
  return next;
};

const normalizeStemCategory = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return STEM_CATEGORY_ALLOWLIST.has(normalized) ? normalized : undefined;
};

const inferStemCategory = (name: string): string | undefined => {
  const lower = name.toLowerCase();
  if (
    lower.includes("drum") ||
    lower.includes("kick") ||
    lower.includes("snare") ||
    lower.includes("hat") ||
    lower.includes("perc")
  ) {
    return "drums";
  }
  if (lower.includes("bass")) return "bass";
  if (lower.includes("fx") || lower.includes("sfx") || lower.includes("noise")) {
    return "fx";
  }
  return "music";
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

const codecFromMime = (mime: string): NoisegenPlaybackAsset["codec"] => {
  const lower = mime.toLowerCase();
  if (lower.includes("mpeg") || lower.includes("mp3")) return "mp3";
  if (lower.includes("ogg") || lower.includes("opus")) return "opus";
  if (lower.includes("aac") || lower.includes("mp4")) return "aac";
  return "wav";
};

const buildPlaybackFromAsset = (
  asset: NoisegenOriginalAsset,
  id = "mix",
  label = "Mix",
): NoisegenPlaybackAsset => ({
  id,
  label,
  codec: codecFromMime(asset.mime),
  fileName: asset.fileName,
  path: asset.path,
  mime: asset.mime,
  bytes: asset.bytes,
  uploadedAt: asset.uploadedAt,
});

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
