import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

type VoiceLaneBreadcrumbDetails = Record<string, unknown>;

const BREADCRUMB_SCHEMA = "helix.voice_lane_crash_breadcrumb.v1" as const;
const diagnosticsDir = path.resolve(process.cwd(), "artifacts", "diagnostics");
const jsonlPath = path.join(diagnosticsDir, "voice-lane-crash.jsonl");
const latestPath = path.join(diagnosticsDir, "voice-lane-crash-latest.json");
const configuredMaxJsonlBytes = Number.parseInt(process.env.VOICE_LANE_CRASH_BREADCRUMB_MAX_BYTES ?? "", 10);
const maxJsonlBytes = configuredMaxJsonlBytes > 0 ? configuredMaxJsonlBytes : 10 * 1024 * 1024;

const enabled = (): boolean => process.env.VOICE_LANE_CRASH_BREADCRUMBS !== "0";

const shortHash = (value: unknown): string => {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? null);
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
};

const sanitize = (value: unknown, key = ""): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack?.split(/\r?\n/).slice(0, 12).join("\n") ?? null,
    };
  }
  if (typeof value === "string") {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("text") ||
      lowerKey.includes("prompt") ||
      lowerKey.includes("transcript") ||
      lowerKey.includes("question") ||
      lowerKey.includes("answer")
    ) {
      return {
        length: value.length,
        hash: shortHash(value),
      };
    }
    if (value.length > 240) {
      return {
        length: value.length,
        hash: shortHash(value),
      };
    }
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
    return value ?? null;
  }
  if (Array.isArray(value)) return value.slice(0, 24).map((entry) => sanitize(entry, key));
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [entryKey, entry] of Object.entries(value as Record<string, unknown>)) {
      result[entryKey] = sanitize(entry, entryKey);
    }
    return result;
  }
  return String(value);
};

const sanitizeError = (value: unknown): unknown => {
  return sanitize(value);
};

const rotateJsonlIfNeeded = (): void => {
  try {
    const stats = fs.statSync(jsonlPath);
    if (stats.size < maxJsonlBytes) return;

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.renameSync(jsonlPath, path.join(diagnosticsDir, `voice-lane-crash.${stamp}.jsonl`));
  } catch {
    // Crash breadcrumbs must never become the crash source.
  }
};

export const createVoiceLaneBreadcrumbId = (prefix = "voice_lane"): string =>
  `${prefix}:${randomUUID()}`;

export const writeVoiceLaneBreadcrumb = (
  stage: string,
  details: VoiceLaneBreadcrumbDetails = {},
): void => {
  if (!enabled()) return;
  try {
    fs.mkdirSync(diagnosticsDir, { recursive: true });
    const entry = {
      schema: BREADCRUMB_SCHEMA,
      ts: new Date().toISOString(),
      pid: process.pid,
      stage,
      memory: process.memoryUsage(),
      details: sanitizeError(details),
    };
    const line = `${JSON.stringify(entry)}\n`;
    rotateJsonlIfNeeded();
    fs.appendFileSync(jsonlPath, line, "utf8");
    fs.writeFileSync(latestPath, JSON.stringify(entry, null, 2), "utf8");
  } catch {
    // Crash breadcrumbs must never become the crash source.
  }
};

export const readVoiceLaneRequestSummary = (body: unknown): VoiceLaneBreadcrumbDetails => {
  const record = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  return {
    traceId: record.traceId ?? null,
    missionId: record.missionId ?? null,
    eventId: record.eventId ?? null,
    threadId: record.threadId ?? record.thread_id ?? null,
    turnId: record.turnId ?? record.turn_id ?? null,
    mode: record.mode ?? null,
    priority: record.priority ?? null,
    provider: record.provider ?? null,
    voiceProfile: record.voiceProfile ?? record.voice_profile_id ?? null,
    chunkKind: record.chunkKind ?? null,
    chunkIndex: record.chunkIndex ?? null,
    voiceAuthorityState: record.voiceAuthorityState ?? null,
    text: record.text ?? null,
  };
};
