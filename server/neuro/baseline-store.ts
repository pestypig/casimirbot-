import fs from "node:fs/promises";
import path from "node:path";
import type { NeuroStreamKind } from "./schemas/neuro.schemas.js";
import type { GammaPlvBand, GammaPlvNullBaseline } from "./features/gamma-plv.js";

export type GammaBaselineRecord = {
  id: string;
  stream: NeuroStreamKind;
  deviceId: string;
  bandHz?: GammaPlvBand;
  anchorHz?: number;
  anchorBandwidthHz?: number;
  sampleRateHz?: number;
  windowSeconds?: number;
  baseline: GammaPlvNullBaseline;
  updatedAt: number;
};

export type GammaBaselineStore = {
  load: (id: string) => Promise<GammaBaselineRecord | null>;
  save: (record: GammaBaselineRecord) => Promise<void>;
  list: () => Promise<GammaBaselineRecord[]>;
};

type BaselineFile = {
  version: 1;
  updatedAt: string;
  baselines: Record<string, GammaBaselineRecord>;
};

const DEFAULT_STORE_PATH = path.resolve(
  process.cwd(),
  "data",
  "neuro",
  "gamma-baselines.json",
);

const formatHz = (value?: number): string => {
  if (!Number.isFinite(value ?? NaN)) return "na";
  return String(Math.round((value as number) * 100) / 100);
};

export const buildGammaBaselineKey = (input: {
  stream: NeuroStreamKind;
  deviceId: string;
  bandHz?: GammaPlvBand;
  anchorHz?: number;
  anchorBandwidthHz?: number;
}): string => {
  const band =
    input.bandHz && Number.isFinite(input.bandHz.lowHz) && Number.isFinite(input.bandHz.highHz)
      ? `band:${formatHz(input.bandHz.lowHz)}-${formatHz(input.bandHz.highHz)}`
      : "band:auto";
  const anchor =
    Number.isFinite(input.anchorHz ?? NaN)
      ? `anchor:${formatHz(input.anchorHz)}-${formatHz(input.anchorBandwidthHz)}`
      : "anchor:none";
  return `${input.stream}:${input.deviceId}:${band}:${anchor}`;
};

const readStoreFile = async (filePath: string): Promise<BaselineFile> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as BaselineFile;
    if (!parsed || parsed.version !== 1 || typeof parsed.baselines !== "object") {
      throw new Error("invalid-baseline-store");
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, updatedAt: new Date().toISOString(), baselines: {} };
    }
    return { version: 1, updatedAt: new Date().toISOString(), baselines: {} };
  }
};

const writeStoreFile = async (filePath: string, store: BaselineFile): Promise<void> => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const payload = JSON.stringify(store, null, 2);
  await fs.writeFile(filePath, payload, "utf8");
};

export const createFileBaselineStore = (filePath: string = DEFAULT_STORE_PATH): GammaBaselineStore => {
  return {
    async load(id: string) {
      const store = await readStoreFile(filePath);
      return store.baselines[id] ?? null;
    },
    async save(record: GammaBaselineRecord) {
      const store = await readStoreFile(filePath);
      store.baselines[record.id] = record;
      store.updatedAt = new Date().toISOString();
      await writeStoreFile(filePath, store);
    },
    async list() {
      const store = await readStoreFile(filePath);
      return Object.values(store.baselines);
    },
  };
};
