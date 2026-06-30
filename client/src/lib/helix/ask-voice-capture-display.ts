export const VOICE_LEVEL_ATTACK_ALPHA = 0.55;
export const VOICE_LEVEL_RELEASE_ALPHA = 0.18;
export const VOICE_FLAT_SIGNAL_WINDOW_MS = 3000;
export const VOICE_FLAT_SIGNAL_VARIANCE_THRESHOLD = 0.0016;
export const VOICE_RECORDER_STALL_MS = 1200;

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const clamp01 = (value: number): number => clampNumber(value, 0, 1);

export function smoothVoiceLevel(
  previous: number,
  nextRaw: number,
  attack = VOICE_LEVEL_ATTACK_ALPHA,
  release = VOICE_LEVEL_RELEASE_ALPHA,
): number {
  const prev = clamp01(previous);
  const next = clamp01(nextRaw);
  const alpha = clampNumber(next >= prev ? attack : release, 0, 1);
  return clamp01(prev + (next - prev) * alpha);
}

export function isFlatVoiceSignal(
  variance: number,
  elapsedMs: number,
  threshold = VOICE_FLAT_SIGNAL_VARIANCE_THRESHOLD,
  windowMs = VOICE_FLAT_SIGNAL_WINDOW_MS,
): boolean {
  return variance <= threshold && elapsedMs >= windowMs;
}

export function isRecorderStalled(params: {
  recorderActive: boolean;
  nowMs: number;
  recorderStartedAtMs: number | null;
  lastChunkAtMs: number | null;
  stallMs?: number;
}): boolean {
  const stallMs = params.stallMs ?? VOICE_RECORDER_STALL_MS;
  if (!params.recorderActive) return false;
  const referenceMs = params.lastChunkAtMs ?? params.recorderStartedAtMs;
  if (referenceMs === null) return false;
  return params.nowMs - referenceMs >= stallMs;
}

export function isLikelyLoopbackDeviceLabel(label: string): boolean {
  return /\b(output|loopback|stereo mix|vb-audio|voicemeeter|what u hear)\b/i.test(label.trim());
}

export function shouldPrimeSegmentWithContainerHeader(params: {
  segmentStartIndex: number;
  mimeType?: string | null;
  hasHeaderChunk: boolean;
}): boolean {
  if (!params.hasHeaderChunk) return false;
  if (params.segmentStartIndex <= 0) return false;
  const normalized = (params.mimeType ?? "").trim().toLowerCase();
  // WebM/Ogg slices can lose container init data and benefit from header priming.
  // MP4-family slices are more fragile when concatenated with a primed header.
  return normalized.includes("webm") || normalized.includes("ogg");
}
