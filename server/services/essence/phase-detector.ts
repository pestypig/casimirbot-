import type { TPhaseProfile } from "@shared/essence-activity";
import { persistPhaseProfiles } from "../../db/essence-activity";
import type { PersistedActivitySample } from "../../db/essence-activity";
import { getActivityWindow } from "./activity-log";

type DetectOptions = {
  ownerId: string;
  hours?: number;
  minScore?: number;
  persist?: boolean;
};

type PhaseAccumulator = {
  score: number;
  panels: Map<string, number>;
  files: Map<string, number>;
  envHints: Record<string, string | number | boolean>;
};

export async function detectPhaseProfiles(opts: DetectOptions): Promise<TPhaseProfile[]> {
  const { ownerId, hours, minScore = 0.25, persist = true } = opts;
  const now = new Date();
  const samples = await getActivityWindow(ownerId, hours, now);
  if (!samples.length) {
    return [];
  }
  const since = samples.reduce((min, sample) => {
    const ts = new Date(sample.ts).getTime();
    return Math.min(min, Number.isFinite(ts) ? ts : min);
  }, now.getTime());
  const windowMs = Math.max(1, now.getTime() - since);
  const accumulators = new Map<string, PhaseAccumulator>();

  for (const sample of samples) {
    const phaseId = derivePhaseId(sample);
    if (!phaseId) continue;
    const acc = ensureAccumulator(accumulators, phaseId);
    const ageMs = Math.max(0, now.getTime() - new Date(sample.ts).getTime());
    const recencyBoost = clamp01(1 - ageMs / windowMs);
    const durationScore = clamp((sample.durationSec ?? 0) / 900, 0, 4);
    const updateScore = clamp((sample.updates ?? 0) * 0.5, 0, 4);
    const weight = 0.2 + recencyBoost * 0.5 + durationScore * 0.2 + updateScore * 0.1;
    acc.score += weight;
    if (sample.panelId) {
      acc.panels.set(sample.panelId, (acc.panels.get(sample.panelId) ?? 0) + weight);
    }
    if (sample.file) {
      acc.files.set(sample.file, (acc.files.get(sample.file) ?? 0) + weight);
    }
    const hints = extractEnvHints(sample);
    if (Object.keys(hints).length) {
      Object.assign(acc.envHints, hints);
    }
  }
  const total = Array.from(accumulators.values()).reduce((sum, entry) => sum + entry.score, 0);
  if (total <= 0) {
    return [];
  }
  const profiles = Array.from(accumulators.entries())
    .map(([phaseId, acc]): TPhaseProfile & { phaseId: string } => ({
      id: phaseId,
      phaseId,
      score: clamp01(acc.score / total),
      topPanels: rankEntries(acc.panels),
      topFiles: rankEntries(acc.files),
      envHints: acc.envHints,
      sampleStart: new Date(since).toISOString(),
      sampleEnd: now.toISOString(),
      rationale: buildRationale(phaseId, acc),
    }))
    .filter((profile) => profile.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (persist && profiles.length) {
    await persistPhaseProfiles(
      profiles.map((profile) => ({
        ...profile,
        ownerId,
      })),
    );
  }

  return profiles;
}

const KNOWN_PHASE_PREFIXES: Record<string, string> = {
  casimir: "physics",
  hull: "physics",
  music: "music",
  audio: "music",
  ip: "ip",
  contract: "ip",
};

function derivePhaseId(sample: PersistedActivitySample): string {
  if (sample.tag?.trim()) {
    return sample.tag.trim().toLowerCase();
  }
  if (sample.panelId) {
    const normalized = sample.panelId.trim().toLowerCase();
    for (const [prefix, mapped] of Object.entries(KNOWN_PHASE_PREFIXES)) {
      if (normalized.includes(prefix)) {
        return mapped;
      }
    }
    return normalized;
  }
  if (sample.repo) {
    return sample.repo.trim().toLowerCase();
  }
  if (sample.file) {
    return sample.file.split(/[\\/]/)[0]?.toLowerCase() || "general";
  }
  return "general";
}

function ensureAccumulator(map: Map<string, PhaseAccumulator>, phaseId: string): PhaseAccumulator {
  const existing = map.get(phaseId);
  if (existing) {
    return existing;
  }
  const acc: PhaseAccumulator = {
    score: 0,
    panels: new Map(),
    files: new Map(),
    envHints: {},
  };
  map.set(phaseId, acc);
  return acc;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return clamp(value, 0, 1);
}

function rankEntries(entries: Map<string, number>, limit = 6): string[] {
  return Array.from(entries.entries())
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, limit)
    .map(([key]) => key);
}

function extractEnvHints(sample: PersistedActivitySample): Record<string, string | number | boolean> {
  const payload = sample.meta?.envHints;
  if (!payload || typeof payload !== "object") {
    return {};
  }
  const hints: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    const coerced = coerceHintValue(value);
    if (coerced !== undefined) {
      hints[key] = coerced;
    }
  }
  return hints;
}

function coerceHintValue(value: unknown): string | number | boolean | undefined {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "object") {
    if ("value" in (value as Record<string, unknown>)) {
      return coerceHintValue((value as Record<string, unknown>).value);
    }
  }
  if (Array.isArray(value)) {
    return value.length ? coerceHintValue(value[value.length - 1]) : undefined;
  }
  return undefined;
}

function buildRationale(phaseId: string, acc: PhaseAccumulator): string {
  const panels = rankEntries(acc.panels, 3);
  const topPanel = panels.length ? panels.join(", ") : "no dominant panels";
  return `${phaseId} focus via ${topPanel}`;
}
