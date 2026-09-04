import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import {
  HELIX_VISUAL_SEQUENCE_MANIFEST_SCHEMA,
  HELIX_VISUAL_SEQUENCE_RECEIPT_SCHEMA,
  HELIX_VISUAL_SEQUENCE_CAPTURE_SCHEMA,
  VISUAL_SEQUENCE_LIMITS,
  type VisualSequenceCaptureMetadata,
  type VisualSequenceErrorCode,
  type VisualSequenceFrame,
  type VisualSequenceIngestResponse,
  type VisualSequenceManifest,
  type VisualSequenceReceipt,
} from "@shared/helix-visual-sequence";

type ProbeFrame = {
  best_effort_timestamp_time?: string;
  pkt_duration_time?: string;
  width?: number;
  height?: number;
};

type ProbeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
  time_base?: string;
  duration?: string;
  tags?: { rotate?: string };
  side_data_list?: Array<{ rotation?: number; side_data_type?: string }>;
};

type ProbeOutput = {
  streams?: ProbeStream[];
  frames?: ProbeFrame[];
  format?: {
    duration?: string;
    format_name?: string;
    tags?: Record<string, string>;
  };
};

type CommandResult = { stdout: Buffer; stderr: string };

export class VisualSequenceServiceError extends Error {
  constructor(
    public readonly code: VisualSequenceErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export type VisualSequenceServiceOptions = {
  rootDir?: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  now?: () => Date;
  retentionMs?: number;
  runCommand?: (command: string, args: string[], timeoutMs: number) => Promise<CommandResult>;
};

export type VisualSequenceIngestInput = {
  ownerProfileId: string;
  threadId: string;
  originalName: string;
  mimeType: string;
  bytes: Buffer;
  requestedCadenceMs?: number;
  capture?: VisualSequenceCaptureMetadata;
};

const DEFAULT_ROOT = path.join(os.tmpdir(), "casimirbot-visual-sequences-v1");
const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
]);
const CAPTURE_SURFACES = new Set([
  "hud_clean_feed",
  "hud_composed_feed",
  "minecraft_client_window",
  "program_window",
]);

const invalidCapture = (message: string, code: VisualSequenceErrorCode = "invalid_capture_metadata"): never => {
  throw new VisualSequenceServiceError(code, message);
};

const validateCaptureMetadata = (
  capture: VisualSequenceCaptureMetadata | undefined,
  input: Pick<VisualSequenceIngestInput, "ownerProfileId" | "threadId">,
): VisualSequenceCaptureMetadata | undefined => {
  if (!capture) return undefined;
  if (capture.schema !== HELIX_VISUAL_SEQUENCE_CAPTURE_SCHEMA) invalidCapture("The bounded-capture schema is invalid.");
  if (!CAPTURE_SURFACES.has(capture.source_surface)) invalidCapture("The selected capture surface is not admitted.", "capture_source_forbidden");
  for (const value of [capture.capture_session_id, capture.source_id, capture.producer_epoch, capture.profile_id, capture.run_id, capture.thread_id]) {
    if (typeof value !== "string" || !value.trim() || value.length > 200) invalidCapture("Bounded-capture identity fields are missing or invalid.");
  }
  if (capture.profile_id !== input.ownerProfileId || capture.thread_id !== input.threadId) {
    invalidCapture("The bounded capture is not bound to this developer profile and thread.", "capture_identity_mismatch");
  }
  if (capture.requested_duration_ms < 1_000 || capture.requested_duration_ms > VISUAL_SEQUENCE_LIMITS.boundedCaptureMaxDurationMs
    || capture.recorded_duration_ms < 1 || capture.recorded_duration_ms > VISUAL_SEQUENCE_LIMITS.boundedCaptureMaxDurationMs) {
    invalidCapture("The bounded capture exceeds the 15-second capture envelope.", "capture_duration_limit_exceeded");
  }
  if (capture.protected_content !== false || capture.sensitive_content !== false || capture.audio_captured !== false) {
    invalidCapture("Protected content, sensitive content, and audio are not admitted to bounded visual capture.", "capture_source_forbidden");
  }
  if (capture.stop_reason !== "completed" && capture.stop_reason !== "manual_stop") invalidCapture("The bounded-capture stop reason is invalid.");
  for (const dateValue of [capture.consented_at, capture.content_cleared_at, capture.started_at, capture.ended_at]) {
    if (!Number.isFinite(Date.parse(dateValue))) invalidCapture("Bounded-capture timestamps are invalid.");
  }
  if (!Array.isArray(capture.surface_receipts) || capture.surface_receipts.length > 64) {
    invalidCapture("The bounded-capture surface receipt set is invalid.");
  }
  for (const receipt of capture.surface_receipts) {
    if (!receipt || typeof receipt !== "object"
      || !Number.isFinite(receipt.at_ms) || receipt.at_ms < 0
      || typeof receipt.receipt_id !== "string" || !receipt.receipt_id
      || typeof receipt.causal_hash !== "string" || !receipt.causal_hash
      || typeof receipt.hud_scene_hash !== "string" || !receipt.hud_scene_hash
      || typeof receipt.viewport_hash !== "string" || !receipt.viewport_hash
      || !["hud_only_alpha", "hud_on_black", "hud_over_source", "source_only"].includes(receipt.mode)
      || !["rendered", "degraded", "blanked"].includes(receipt.status)) {
      invalidCapture("A synchronized HUD surface receipt is invalid.");
    }
  }
  if (capture.source_surface === "hud_composed_feed"
    && (!capture.surface_receipts.length || capture.surface_receipts.some((receipt) => receipt.mode !== "hud_over_source"))) {
    invalidCapture("Composed HUD capture requires synchronized HUD-over-source render receipts.", "capture_identity_mismatch");
  }
  if (capture.source_surface === "hud_clean_feed"
    && (!capture.surface_receipts.length || capture.surface_receipts.some((receipt) => receipt.mode !== "hud_only_alpha" && receipt.mode !== "hud_on_black"))) {
    invalidCapture("Clean HUD capture requires synchronized alpha or projector-black render receipts.", "capture_identity_mismatch");
  }
  return capture;
};

const sha256 = (value: Buffer | string): string =>
  createHash("sha256").update(value).digest("hex");

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
};

const canonicalHash = (value: unknown): string =>
  sha256(JSON.stringify(canonicalize(value)));

const parseFinite = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeRotation = (value: number): number => {
  const normalized = ((Math.round(value) % 360) + 360) % 360;
  return normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0;
};

const runProcess = (
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<CommandResult> => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  let outputBytes = 0;
  let settled = false;
  const finish = (error?: Error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (error) reject(error);
    else resolve({ stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr).toString("utf8") });
  };
  const timer = setTimeout(() => {
    child.kill();
    finish(new Error("decoder_timeout"));
  }, timeoutMs);
  child.stdout.on("data", (chunk: Buffer) => {
    outputBytes += chunk.length;
    if (outputBytes > 16 * 1024 * 1024) {
      child.kill();
      finish(new Error("decoder_output_limit"));
      return;
    }
    stdout.push(chunk);
  });
  child.stderr.on("data", (chunk: Buffer) => {
    if (Buffer.concat(stderr).length < 256 * 1024) stderr.push(chunk);
  });
  child.once("error", (error) => finish(error));
  child.once("close", (code) => {
    if (code === 0) finish();
    else finish(new Error(`decoder_exit_${code}`));
  });
});

const ensureWithinRoot = (rootDir: string, target: string): void => {
  const relative = path.relative(path.resolve(rootDir), path.resolve(target));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("unsafe_visual_sequence_path");
  }
};

const safeRemove = async (rootDir: string, target: string): Promise<void> => {
  ensureWithinRoot(rootDir, target);
  await fs.rm(target, { recursive: true, force: true });
};

const escapeXml = (value: string): string => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const parseProbe = (buffer: Buffer): ProbeOutput => {
  try {
    return JSON.parse(buffer.toString("utf8")) as ProbeOutput;
  } catch {
    throw new VisualSequenceServiceError("corrupt_media", "The clip metadata could not be decoded.");
  }
};

const probeArguments = (inputPath: string): string[] => [
  "-v", "error",
  "-select_streams", "v:0",
  "-show_streams",
  "-show_frames",
  "-show_format",
  "-show_entries",
  "stream=codec_type,codec_name,width,height,avg_frame_rate,r_frame_rate,time_base,duration:stream_tags=rotate:stream_side_data=rotation,side_data_type:format=duration,format_name:format_tags:frame=best_effort_timestamp_time,pkt_duration_time,width,height",
  "-print_format", "json",
  inputPath,
];

const decoderVersionArguments = ["-version"];

const decodeError = (error: unknown, phase: "probe" | "decode"): VisualSequenceServiceError => {
  const message = error instanceof Error ? error.message : String(error);
  if (/ENOENT|not recognized|not found/i.test(message)) {
    return new VisualSequenceServiceError("decoder_unavailable", "The local video decoder is unavailable.", 503);
  }
  return phase === "probe"
    ? new VisualSequenceServiceError("corrupt_media", "The clip is corrupt or has no readable video stream.")
    : new VisualSequenceServiceError("decode_failed", "The selected video frames could not be decoded.");
};

const actualFrameRateIsVariable = (frames: Array<{ ptsMs: number }>): boolean => {
  if (frames.length < 4) return false;
  const intervals = frames.slice(1).map((frame, index) => frame.ptsMs - frames[index].ptsMs);
  const positive = intervals.filter((value) => value > 0);
  if (positive.length < 2) return false;
  return Math.max(...positive) - Math.min(...positive) > 1;
};

const buildContactSheet = async (
  frames: VisualSequenceFrame[],
  frameBytes: Buffer[],
): Promise<{ width: number; height: number; sha256: string; bytes: Buffer }> => {
  const columns = 4;
  const tileWidth = 240;
  const tileHeight = 160;
  const rows = Math.max(1, Math.ceil(frames.length / columns));
  const width = columns * tileWidth;
  const height = rows * tileHeight;
  const composites: sharp.OverlayOptions[] = [];

  for (let index = 0; index < frames.length; index += 1) {
    const left = (index % columns) * tileWidth;
    const top = Math.floor(index / columns) * tileHeight;
    const image = await sharp(frameBytes[index])
      .resize({ width: tileWidth, height: 132, fit: "contain", background: "#05080d" })
      .png()
      .toBuffer();
    composites.push({ input: image, left, top });
    const label = `${index + 1}  ${(frames[index].pts_ms / 1_000).toFixed(3)}s  #${frames[index].decoded_index}`;
    const svg = Buffer.from(
      `<svg width="${tileWidth}" height="28" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#07111d"/><text x="9" y="19" fill="#9ee7ff" font-family="monospace" font-size="12">${escapeXml(label)}</text></svg>`,
    );
    composites.push({ input: svg, left, top: top + 132 });
  }

  const bytes = await sharp({ create: { width, height, channels: 4, background: "#03070d" } })
    .composite(composites)
    .webp({ lossless: true })
    .toBuffer();
  return { width, height, sha256: sha256(bytes), bytes };
};

export class VisualSequenceService {
  private readonly rootDir: string;
  private readonly ffmpegPath: string;
  private readonly ffprobePath: string;
  private readonly now: () => Date;
  private readonly retentionMs: number;
  private readonly command: NonNullable<VisualSequenceServiceOptions["runCommand"]>;
  private readonly activeThreads = new Set<string>();

  constructor(options: VisualSequenceServiceOptions = {}) {
    this.rootDir = path.resolve(options.rootDir ?? DEFAULT_ROOT);
    this.ffmpegPath = options.ffmpegPath ?? process.env.FFMPEG_PATH ?? "ffmpeg";
    this.ffprobePath = options.ffprobePath ?? process.env.FFPROBE_PATH ?? "ffprobe";
    this.now = options.now ?? (() => new Date());
    this.retentionMs = options.retentionMs ?? VISUAL_SEQUENCE_LIMITS.retentionMs;
    this.command = options.runCommand ?? runProcess;
  }

  async ingest(input: VisualSequenceIngestInput): Promise<VisualSequenceIngestResponse> {
    const threadId = input.threadId.trim();
    if (!threadId) throw new VisualSequenceServiceError("video_required", "A developer thread identity is required.");
    if (this.activeThreads.has(threadId)) {
      throw new VisualSequenceServiceError("decode_failed", "This developer thread already has an active visual-sequence decode.", 409);
    }
    this.activeThreads.add(threadId);
    try {
      return await this.ingestExclusive({ ...input, threadId });
    } finally {
      this.activeThreads.delete(threadId);
    }
  }

  private async ingestExclusive(input: VisualSequenceIngestInput): Promise<VisualSequenceIngestResponse> {
    const capture = validateCaptureMetadata(input.capture, input);
    const normalizedMimeType = input.mimeType.toLowerCase().split(";", 1)[0].trim();
    if (!input.bytes.length) throw new VisualSequenceServiceError("video_required", "Choose a local video clip.");
    if (input.bytes.length > VISUAL_SEQUENCE_LIMITS.maxUploadBytes) {
      throw new VisualSequenceServiceError("upload_too_large", "The clip exceeds the 64 MiB VSE-0A upload limit.", 413);
    }
    if (!ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
      throw new VisualSequenceServiceError("unsupported_media_type", "VSE-0A accepts MP4, WebM, MOV, MKV, or AVI video.");
    }

    await fs.mkdir(this.rootDir, { recursive: true });
    await this.cleanupExpired();
    const clipSha = sha256(input.bytes);
    const cadenceInput = Number.isFinite(input.requestedCadenceMs)
      ? input.requestedCadenceMs as number
      : VISUAL_SEQUENCE_LIMITS.defaultCadenceMs;
    const requestedCadenceMs = Math.min(10_000, Math.max(100, Math.round(cadenceInput)));
    const safeOriginalName = path.basename(input.originalName).slice(0, 180) || "clip";
    const sequenceId = `vse_${sha256([
      input.ownerProfileId,
      input.threadId,
      clipSha,
      normalizedMimeType,
      safeOriginalName,
      "uniform_time",
      String(requestedCadenceMs),
      capture ? canonicalHash(capture) : "offline",
      "v1",
    ].join("\n")).slice(0, 32)}`;
    const finalDir = path.join(this.rootDir, sequenceId);
    const stagingDir = path.join(this.rootDir, `${sequenceId}.staging-${randomUUID()}`);
    ensureWithinRoot(this.rootDir, finalDir);
    ensureWithinRoot(this.rootDir, stagingDir);
    try {
      const [manifest, receipt] = await Promise.all([
        this.getManifest(sequenceId),
        this.getReceipt(sequenceId),
      ]);
      return { ok: true, manifest, receipt };
    } catch (error) {
      if (!(error instanceof VisualSequenceServiceError) || error.code !== "sequence_not_found") throw error;
      await safeRemove(this.rootDir, finalDir);
    }
    await fs.mkdir(path.join(stagingDir, "frames"), { recursive: true });
    const inputPath = path.join(stagingDir, "source-upload.bin");
    await fs.writeFile(inputPath, input.bytes, { flag: "wx" });

    try {
      let versionResult: CommandResult;
      let probeResult: CommandResult;
      try {
        [versionResult, probeResult] = await Promise.all([
          this.command(this.ffmpegPath, decoderVersionArguments, 10_000),
          this.command(this.ffprobePath, probeArguments(inputPath), 30_000),
        ]);
      } catch (error) {
        throw decodeError(error, "probe");
      }
      const probe = parseProbe(probeResult.stdout);
      const stream = probe.streams?.find((candidate) => candidate.codec_type === "video") ?? probe.streams?.[0];
      const rawFrames = probe.frames ?? [];
      if (!stream || !stream.codec_name || !rawFrames.length) {
        throw new VisualSequenceServiceError("corrupt_media", "The clip has no readable video frames.");
      }
      const protectedMarker = JSON.stringify(probe).match(/(?:encryption|encrypted|cenc|drm)/i);
      if (protectedMarker) {
        throw new VisualSequenceServiceError("protected_or_unsupported_media", "Protected or encrypted video is not admitted.");
      }
      const codedWidth = Math.round(parseFinite(stream.width) ?? 0);
      const codedHeight = Math.round(parseFinite(stream.height) ?? 0);
      if (codedWidth < 1 || codedHeight < 1) {
        throw new VisualSequenceServiceError("corrupt_media", "The video dimensions are invalid.");
      }
      if (codedWidth > VISUAL_SEQUENCE_LIMITS.maxSourceWidth || codedHeight > VISUAL_SEQUENCE_LIMITS.maxSourceHeight) {
        throw new VisualSequenceServiceError("dimension_limit_exceeded", "The clip exceeds the 3840×2160 decoded-dimension limit.");
      }
      if (rawFrames.length > VISUAL_SEQUENCE_LIMITS.maxSourceFrames) {
        throw new VisualSequenceServiceError("frame_limit_exceeded", "The clip exceeds the bounded decoded-frame metadata limit.");
      }
      const durationSeconds = parseFinite(probe.format?.duration) ?? parseFinite(stream.duration);
      if (durationSeconds === null || durationSeconds <= 0) {
        throw new VisualSequenceServiceError("invalid_timestamps", "The clip duration is missing or invalid.");
      }
      const durationMs = Math.round(durationSeconds * 1_000);
      const durationLimitMs = capture
        ? VISUAL_SEQUENCE_LIMITS.boundedCaptureMaxDurationMs
        : VISUAL_SEQUENCE_LIMITS.maxDurationMs;
      if (durationMs > durationLimitMs + 10) {
        throw new VisualSequenceServiceError(
          capture ? "capture_duration_limit_exceeded" : "duration_limit_exceeded",
          capture ? "The recording exceeds the 15-second VSE-0B capture limit." : "The clip exceeds the 30-second VSE-0A duration limit.",
        );
      }
      if (capture && Math.abs(durationMs - capture.recorded_duration_ms) > 1_500) {
        throw new VisualSequenceServiceError("invalid_capture_metadata", "The declared and decoded capture durations do not agree.");
      }

      const decodedFrames = rawFrames.map((frame, decodedIndex) => ({
        decodedIndex,
        absolutePtsMs: Math.round((parseFinite(frame.best_effort_timestamp_time) ?? Number.NaN) * 1_000),
        durationMs: parseFinite(frame.pkt_duration_time) === null
          ? null
          : Math.round((parseFinite(frame.pkt_duration_time) as number) * 1_000),
      })).filter((frame) => Number.isFinite(frame.absolutePtsMs));
      if (!decodedFrames.length) {
        throw new VisualSequenceServiceError("invalid_timestamps", "No valid presentation timestamps were decoded.");
      }
      const firstPts = decodedFrames[0].absolutePtsMs;
      const normalizedFrames = decodedFrames.map((frame) => ({ ...frame, ptsMs: frame.absolutePtsMs - firstPts }));
      if (normalizedFrames.some((frame, index) => index > 0 && frame.ptsMs < normalizedFrames[index - 1].ptsMs)) {
        throw new VisualSequenceServiceError("invalid_timestamps", "Video presentation timestamps are not monotonic.");
      }

      const candidateCount = Math.max(1, Math.ceil(durationMs / requestedCadenceMs));
      const cadenceMultiplier = Math.max(1, Math.ceil(candidateCount / VISUAL_SEQUENCE_LIMITS.maxSelectedFrames));
      const appliedCadenceMs = requestedCadenceMs * cadenceMultiplier;
      const targetTimes: number[] = [];
      for (let atMs = 0; atMs < durationMs && targetTimes.length < VISUAL_SEQUENCE_LIMITS.maxSelectedFrames; atMs += appliedCadenceMs) {
        targetTimes.push(atMs);
      }
      const selected = targetTimes.map((targetMs) =>
        normalizedFrames.find((frame) => frame.ptsMs >= targetMs) ?? normalizedFrames.at(-1)!,
      ).filter((frame, index, frames) => index === 0 || frame.decodedIndex !== frames[index - 1].decodedIndex);
      if (!selected.length) throw new VisualSequenceServiceError("invalid_timestamps", "The sampling policy selected no frames.");

      const selectionExpression = selected.map((frame) => `eq(n\\,${frame.decodedIndex})`).join("+");
      const pngPattern = path.join(stagingDir, "decoded-%03d.png");
      const decodeArgs = [
        "-v", "error", "-i", inputPath, "-map", "0:v:0", "-an",
        "-vf", `select=${selectionExpression},scale=${VISUAL_SEQUENCE_LIMITS.maxOutputWidth}:${VISUAL_SEQUENCE_LIMITS.maxOutputHeight}:force_original_aspect_ratio=decrease,setsar=1`,
        "-vsync", "vfr", "-start_number", "0", pngPattern,
      ];
      try {
        await this.command(this.ffmpegPath, decodeArgs, 60_000);
      } catch (error) {
        throw decodeError(error, "decode");
      }

      const frames: VisualSequenceFrame[] = [];
      const frameBytes: Buffer[] = [];
      for (let index = 0; index < selected.length; index += 1) {
        const decodedPath = path.join(stagingDir, `decoded-${String(index).padStart(3, "0")}.png`);
        try {
          await fs.access(decodedPath);
        } catch {
          throw new VisualSequenceServiceError("decode_failed", "The decoder returned an incomplete sampled frame set.");
        }
        const decodedBytes = await fs.readFile(decodedPath);
        const normalizedBytes = await sharp(decodedBytes).webp({ lossless: true }).toBuffer();
        const metadata = await sharp(normalizedBytes).metadata();
        const frameSha = sha256(normalizedBytes);
        const selectedFrame = selected[index];
        const frameId = `frame_${sha256(`${sequenceId}\n${selectedFrame.decodedIndex}\n${selectedFrame.ptsMs}\n${frameSha}`).slice(0, 24)}`;
        const finalFramePath = path.join(stagingDir, "frames", `${frameId}.webp`);
        await fs.writeFile(finalFramePath, normalizedBytes, { flag: "wx" });
        frames.push({
          frame_id: frameId,
          decoded_index: selectedFrame.decodedIndex,
          pts_ms: selectedFrame.ptsMs,
          duration_ms: selectedFrame.durationMs,
          width: metadata.width ?? 0,
          height: metadata.height ?? 0,
          sha256: frameSha,
          image_ref: `/api/visual-sequences/${sequenceId}/artifacts/frames/${frameId}.webp`,
          mime_type: "image/webp",
          source_classification: capture ? "consented_bounded_capture" : "owner_supplied_clip",
          retention_state: "ephemeral",
          related_event_refs: [],
        });
        frameBytes.push(normalizedBytes);
        await fs.unlink(decodedPath);
      }

      const contactPath = path.join(stagingDir, "contact-sheet.webp");
      const contact = await buildContactSheet(frames, frameBytes);
      await fs.writeFile(contactPath, contact.bytes, { flag: "wx" });
      const rotation = normalizeRotation(
        parseFinite(stream.side_data_list?.find((entry) => entry.rotation !== undefined)?.rotation)
          ?? parseFinite(stream.tags?.rotate)
          ?? 0,
      );
      const displayWidth = rotation === 90 || rotation === 270 ? codedHeight : codedWidth;
      const displayHeight = rotation === 90 || rotation === 270 ? codedWidth : codedHeight;
      const createdAt = this.now();
      const expiresAt = new Date(createdAt.getTime() + this.retentionMs);
      const decoderVersion = versionResult.stdout.toString("utf8").split(/\r?\n/, 1)[0]?.trim() || "ffmpeg version unavailable";
      const manifestDraft: VisualSequenceManifest = {
        schema: HELIX_VISUAL_SEQUENCE_MANIFEST_SCHEMA,
        sequence_id: sequenceId,
        owner_profile_id: input.ownerProfileId,
        thread_id: input.threadId,
        source_id: capture?.source_id ?? `manual-upload:${clipSha.slice(0, 24)}`,
        capture_session_id: capture?.capture_session_id ?? null,
        producer_epoch: capture?.producer_epoch ?? `offline:${clipSha.slice(0, 24)}`,
        environment_id: null,
        capture: capture ?? null,
        created_at: createdAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "complete",
        source: {
          original_name: safeOriginalName,
          mime_type: input.mimeType,
          clip_sha256: clipSha,
          size_bytes: input.bytes.length,
          duration_ms: durationMs,
          coded_width: codedWidth,
          coded_height: codedHeight,
          display_width: displayWidth,
          display_height: displayHeight,
          codec: stream.codec_name,
          container: probe.format?.format_name ?? "unknown",
          nominal_frame_rate: stream.r_frame_rate ?? "0/0",
          average_frame_rate: stream.avg_frame_rate ?? "0/0",
          time_base: stream.time_base ?? "unknown",
          rotation_deg: rotation,
          variable_frame_rate: actualFrameRateIsVariable(normalizedFrames),
          decoded_frame_count: rawFrames.length,
        },
        decoder: {
          name: "ffmpeg",
          version: decoderVersion,
          argument_manifest: {
            probe: ["first video stream", "stream metadata", "frame PTS/duration metadata", "JSON output"],
            frame_selection: ["decoded indexes from manifest", "video only", "variable-rate output", "no audio"],
            image_normalization: [`fit within ${VISUAL_SEQUENCE_LIMITS.maxOutputWidth}x${VISUAL_SEQUENCE_LIMITS.maxOutputHeight}`, "square pixels", "lossless WebP"],
          },
        },
        sampling: {
          requested_policy: "uniform_time",
          applied_policy: "uniform_time",
          requested_cadence_ms: requestedCadenceMs,
          applied_cadence_ms: appliedCadenceMs,
          candidate_count: candidateCount,
          selected_count: frames.length,
          rejected_count: Math.max(0, candidateCount - frames.length),
          rejection_reasons: candidateCount > frames.length ? ["selected_frame_cap"] : [],
        },
        frames,
        contact_sheet: {
          image_ref: `/api/visual-sequences/${sequenceId}/artifacts/contact-sheet.webp`,
          mime_type: "image/webp",
          sha256: contact.sha256,
          width: contact.width,
          height: contact.height,
        },
        alignments_ref: `/api/visual-sequences/${sequenceId}/artifacts/alignments.jsonl`,
        receipts_ref: `/api/visual-sequences/${sequenceId}/artifacts/receipts.jsonl`,
        retention: {
          policy: "ephemeral",
          source_clip_retained: false,
          redaction_policy: capture ? "selected_surface_no_audio" : "none_owner_supplied_local_clip",
        },
        authority: {
          model_invoked: false,
          assistant_answer: false,
          live_capture: Boolean(capture),
          environment_action: false,
          hud_or_controller_mutated: false,
        },
        manifest_sha256: "",
      };
      manifestDraft.manifest_sha256 = canonicalHash({ ...manifestDraft, manifest_sha256: "" });
      const receipt: VisualSequenceReceipt = {
        schema: HELIX_VISUAL_SEQUENCE_RECEIPT_SCHEMA,
        receipt_id: `vse_receipt_${canonicalHash({
          sequenceId,
          clipSha,
          frames: frames.map((frame) => frame.sha256),
          contact: contact.sha256,
          manifest: manifestDraft.manifest_sha256,
        }).slice(0, 24)}`,
        sequence_id: sequenceId,
        operation: capture ? "bounded_capture_decode" : "offline_decode",
        source_clip_sha256: clipSha,
        selected_frame_hashes: frames.map((frame) => frame.sha256),
        contact_sheet_sha256: contact.sha256,
        manifest_sha256: manifestDraft.manifest_sha256,
        completed_at: createdAt.toISOString(),
        model_invoked: false,
        assistant_answer: false,
        live_capture: Boolean(capture),
        environment_action: false,
        hud_or_controller_mutated: false,
      };

      await fs.writeFile(path.join(stagingDir, "manifest.json"), `${JSON.stringify(manifestDraft, null, 2)}\n`, "utf8");
      await fs.writeFile(path.join(stagingDir, "alignments.jsonl"), `${JSON.stringify({
        schema: "helix.visual_sequence_alignment_set.v1",
        sequence_id: sequenceId,
        alignments: capture?.surface_receipts.map((surfaceReceipt) => ({
          kind: "client_surface_render_receipt",
          capture_session_id: capture.capture_session_id,
          ...surfaceReceipt,
          client_declared: true,
          program_input_authority: false,
        })) ?? [],
        assistant_answer: false,
      })}\n`, "utf8");
      await fs.writeFile(path.join(stagingDir, "receipts.jsonl"), `${JSON.stringify(receipt)}\n`, "utf8");
      await fs.unlink(inputPath);
      await fs.rename(stagingDir, finalDir);
      return { ok: true, manifest: manifestDraft, receipt };
    } catch (error) {
      await safeRemove(this.rootDir, stagingDir).catch(() => undefined);
      throw error;
    }
  }

  async getManifest(sequenceId: string): Promise<VisualSequenceManifest> {
    const safeId = this.validateSequenceId(sequenceId);
    try {
      const manifest = JSON.parse(await fs.readFile(path.join(this.rootDir, safeId, "manifest.json"), "utf8")) as VisualSequenceManifest;
      if (Date.parse(manifest.expires_at) <= this.now().getTime()) {
        await safeRemove(this.rootDir, path.join(this.rootDir, safeId));
        throw new VisualSequenceServiceError("sequence_not_found", "The visual sequence is unavailable or expired.", 404);
      }
      return manifest;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new VisualSequenceServiceError("sequence_not_found", "The visual sequence is unavailable or expired.", 404);
      }
      throw error;
    }
  }

  async getReceipt(sequenceId: string): Promise<VisualSequenceReceipt> {
    const safeId = this.validateSequenceId(sequenceId);
    try {
      const firstLine = (await fs.readFile(path.join(this.rootDir, safeId, "receipts.jsonl"), "utf8")).trim().split(/\r?\n/, 1)[0];
      return JSON.parse(firstLine) as VisualSequenceReceipt;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new VisualSequenceServiceError("sequence_not_found", "The visual sequence is unavailable or expired.", 404);
      }
      throw error;
    }
  }

  async resolveArtifact(sequenceId: string, artifactPath: string): Promise<{ path: string; mimeType: string }> {
    const safeId = this.validateSequenceId(sequenceId);
    const normalized = artifactPath.replaceAll("\\", "/");
    if (!/^(?:contact-sheet\.webp|manifest\.json|alignments\.jsonl|receipts\.jsonl|frames\/frame_[a-f0-9]{24}\.webp)$/.test(normalized)) {
      throw new VisualSequenceServiceError("artifact_not_found", "The requested visual-sequence artifact is not addressable.", 404);
    }
    const target = path.join(this.rootDir, safeId, ...normalized.split("/"));
    ensureWithinRoot(this.rootDir, target);
    try {
      await fs.access(target);
    } catch {
      throw new VisualSequenceServiceError("artifact_not_found", "The requested visual-sequence artifact is unavailable.", 404);
    }
    return {
      path: target,
      mimeType: normalized.endsWith(".webp") ? "image/webp" : normalized.endsWith(".json") ? "application/json" : "application/x-ndjson",
    };
  }

  async cleanupExpired(): Promise<number> {
    await fs.mkdir(this.rootDir, { recursive: true });
    const nowMs = this.now().getTime();
    let removed = 0;
    for (const entry of await fs.readdir(this.rootDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const target = path.join(this.rootDir, entry.name);
      let expired = false;
      if (entry.name.includes(".staging-")) {
        const stat = await fs.stat(target);
        expired = nowMs - stat.mtimeMs > 5 * 60_000;
      }
      if (!expired) {
        if (entry.name.includes(".staging-")) continue;
        try {
          const manifest = JSON.parse(await fs.readFile(path.join(target, "manifest.json"), "utf8")) as VisualSequenceManifest;
          expired = Date.parse(manifest.expires_at) <= nowMs;
        } catch {
          expired = true;
        }
      }
      if (expired) {
        await safeRemove(this.rootDir, target);
        removed += 1;
      }
    }
    return removed;
  }

  private validateSequenceId(sequenceId: string): string {
    if (!/^vse_[a-f0-9]{32}$/.test(sequenceId)) {
      throw new VisualSequenceServiceError("sequence_not_found", "The visual sequence identifier is invalid.", 404);
    }
    return sequenceId;
  }
}

export const visualSequenceService = new VisualSequenceService();
