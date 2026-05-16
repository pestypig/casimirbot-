import { useVisualSourceCaptureStore } from "@/store/useVisualSourceCaptureStore";

type PostJson = (path: string, body?: Record<string, unknown>) => Promise<any>;

export type VisualFrameProducerResult = {
  source_id: string;
  frame_id: string | null;
  evidence_id: string | null;
  summary: string;
  evidence: Record<string, unknown> | null;
};

type VisualCaptureMode = "manual" | "interval" | "salience_triggered";

type VisualProducerIntervalOptions = {
  sourceId: string;
  threadId: string;
  roomId?: string | null;
  stream: MediaStream;
  postJson: PostJson;
  prompt?: string;
  environmentId?: string | null;
  pipelineId?: string | null;
  cadenceMs?: number | null;
};

const activeIntervals = new Map<string, number>();
const activeStreams = new Map<string, MediaStream>();
const activeCaptureLocks = new Set<string>();

const clampVisualCadenceMs = (value?: number | null): number =>
  Math.max(5_000, Math.min(120_000, Math.round(value ?? 15_000)));

const hashFramePreview = async (dataUrl: string): Promise<string> => {
  const bytes = new TextEncoder().encode(dataUrl.slice(0, 4096));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).slice(0, 8).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const waitForVideoReady = async (video: HTMLVideoElement): Promise<void> => {
  if (video.videoWidth > 0 && video.videoHeight > 0) return;
  await new Promise<void>((resolve: () => void) => {
    video.onloadedmetadata = () => resolve();
  });
};

export async function captureFrameDataUrlFromStream(stream: MediaStream): Promise<string> {
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  await waitForVideoReady(video);
  const maxWidth = 1280;
  const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("screen_capture_canvas_unavailable");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function runVisualFrameProducerOnce(input: {
  sourceId: string;
  threadId: string;
  roomId?: string | null;
  stream: MediaStream;
  postJson: PostJson;
  prompt?: string;
  environmentId?: string | null;
  pipelineId?: string | null;
  producerId?: string | null;
  captureMode?: VisualCaptureMode;
  cadenceMs?: number | null;
  alignWithEvents?: boolean;
}): Promise<VisualFrameProducerResult> {
  const now = new Date().toISOString();
  const firstTrack = input.stream.getVideoTracks()[0] ?? input.stream.getTracks()[0] ?? null;
  const captureMode = input.captureMode ?? "manual";
  useVisualSourceCaptureStore.getState().upsertProducer({
    source_id: input.sourceId,
    thread_id: input.threadId,
    producer_id: input.producerId ?? undefined,
    environment_id: input.environmentId ?? null,
    pipeline_id: input.pipelineId ?? null,
    stream_active: true,
    interval_active: captureMode === "interval",
    track_ready_state: firstTrack?.readyState === "ended" ? "ended" : "live",
    capture_mode: captureMode,
    cadence_ms: captureMode === "manual" ? null : clampVisualCadenceMs(input.cadenceMs),
    last_frame_at: null,
    last_heartbeat_at: now,
    last_error: null,
  });
  firstTrack?.addEventListener("ended", () => {
    useVisualSourceCaptureStore.getState().patchProducer(input.sourceId, {
      stream_active: false,
      interval_active: false,
      track_ready_state: "ended",
    });
  }, { once: true });

  await input.postJson("/api/agi/situation/visual-source/permission-granted", {
    source_id: input.sourceId,
    client_stream_confirmed: true,
  });
  await input.postJson("/api/agi/situation/source/heartbeat", {
    source_id: input.sourceId,
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    modality: "visual_frame",
    status: "active",
    ts: now,
  });

  const imageBase64 = await captureFrameDataUrlFromStream(input.stream);
  const frameHash = await hashFramePreview(imageBase64);
  const existingState = useVisualSourceCaptureStore.getState().producers[input.sourceId];
  useVisualSourceCaptureStore.getState().patchProducer(input.sourceId, {
    capture_count: (existingState?.capture_count ?? 0) + 1,
    last_frame_hash: frameHash,
  });
  const analysis = await input.postJson("/api/agi/situation/visual-frame/analyze", {
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    source_id: input.sourceId,
    environment_id: input.environmentId ?? null,
    capture_mode: captureMode,
    image_base64: imageBase64,
    mime_type: "image/jpeg",
    prompt: input.prompt ??
      "Summarize this permission-bound live frame as compact evidence for the current live environment. Focus on visible scene, activity, objects, UI/game context, and uncertainty.",
  });
  if (input.alignWithEvents !== false) {
    await input.postJson("/api/agi/situation/visual-frame/align-with-events", {
      thread_id: input.threadId,
      room_id: input.roomId ?? null,
      limit: 40,
    });
  }
  if (input.environmentId && analysis?.evidence?.evidence_id) {
    await input.postJson(`/api/agi/situation/live-answer-environment/${encodeURIComponent(input.environmentId)}/derive-line-schema`, {
      visual_evidence_id: analysis.evidence.evidence_id,
    }).catch(() => null);
  }

  const frameId = typeof analysis?.evidence?.frame_id === "string" ? analysis.evidence.frame_id : null;
  const evidenceId = typeof analysis?.evidence?.evidence_id === "string" ? analysis.evidence.evidence_id : null;
  const chunkId = typeof analysis?.live_source_chunk?.chunk_id === "string" ? analysis.live_source_chunk.chunk_id : null;
  const summary = typeof analysis?.evidence?.summary === "string" && analysis.evidence.summary.trim()
    ? analysis.evidence.summary.trim()
    : "Visual frame captured and recorded as compact evidence.";
  const frameAt = new Date().toISOString();
  useVisualSourceCaptureStore.getState().patchProducer(input.sourceId, {
    last_frame_at: frameAt,
    last_heartbeat_at: frameAt,
    post_count: (useVisualSourceCaptureStore.getState().producers[input.sourceId]?.post_count ?? 0) + 1,
    last_chunk_id: chunkId,
    pending_analysis_job_id: Array.isArray(analysis?.live_source_analysis_jobs) && typeof analysis.live_source_analysis_jobs.at(-1)?.job_id === "string"
      ? analysis.live_source_analysis_jobs.at(-1).job_id
      : null,
    last_error: null,
    next_capture_due_at: captureMode === "interval" && input.cadenceMs
      ? new Date(Date.parse(frameAt) + clampVisualCadenceMs(input.cadenceMs)).toISOString()
      : null,
  });

  return {
    source_id: input.sourceId,
    frame_id: frameId,
    evidence_id: evidenceId,
    summary,
    evidence: analysis?.evidence && typeof analysis.evidence === "object"
      ? analysis.evidence as Record<string, unknown>
      : null,
  };
}

export function stopVisualFrameProducerInterval(sourceId: string, options: { stopStream?: boolean } = {}): void {
  const interval = activeIntervals.get(sourceId);
  if (interval) window.clearInterval(interval);
  activeIntervals.delete(sourceId);
  activeCaptureLocks.delete(sourceId);
  const stream = activeStreams.get(sourceId);
  if (stream && options.stopStream !== false) {
    stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
  }
  if (options.stopStream !== false) activeStreams.delete(sourceId);
  useVisualSourceCaptureStore.getState().patchProducer(sourceId, {
    interval_active: false,
    stream_active: options.stopStream === false,
  });
}

export async function startVisualFrameProducerInterval(input: VisualProducerIntervalOptions): Promise<VisualFrameProducerResult> {
  const cadenceMs = clampVisualCadenceMs(input.cadenceMs);
  stopVisualFrameProducerInterval(input.sourceId, { stopStream: true });
  activeStreams.set(input.sourceId, input.stream);

  const firstTrack = input.stream.getVideoTracks()[0] ?? input.stream.getTracks()[0] ?? null;
  firstTrack?.addEventListener("ended", () => {
    stopVisualFrameProducerInterval(input.sourceId, { stopStream: false });
    void input.postJson("/api/agi/situation/live-source/producer/heartbeat", {
      source_id: input.sourceId,
      thread_id: input.threadId,
      environment_id: input.environmentId ?? null,
      pipeline_id: input.pipelineId ?? null,
      client_stream_confirmed: false,
      status: "stopped",
      ts: new Date().toISOString(),
    }).catch(() => null);
  }, { once: true });

  const cadenceResponse = await input.postJson("/api/agi/situation/live-source/producer/set-cadence", {
    source_id: input.sourceId,
    thread_id: input.threadId,
    environment_id: input.environmentId ?? null,
    pipeline_id: input.pipelineId ?? null,
    capture_mode: "interval",
    cadence_ms: cadenceMs,
    client_stream_confirmed: true,
  });
  const producerId = typeof cadenceResponse?.producer?.producer_id === "string"
    ? cadenceResponse.producer.producer_id
    : typeof cadenceResponse?.receipt?.cadence?.producer_id === "string"
      ? cadenceResponse.receipt.cadence.producer_id
      : null;

  useVisualSourceCaptureStore.getState().upsertProducer({
    source_id: input.sourceId,
    thread_id: input.threadId,
    producer_id: producerId,
    environment_id: input.environmentId ?? null,
    pipeline_id: input.pipelineId ?? null,
    stream_active: true,
    interval_active: true,
    track_ready_state: firstTrack?.readyState === "ended" ? "ended" : "live",
    capture_mode: "interval",
    cadence_ms: cadenceMs,
    last_frame_at: null,
    last_heartbeat_at: new Date().toISOString(),
    next_capture_due_at: new Date(Date.now() + cadenceMs).toISOString(),
  });

  const capture = async (force: boolean): Promise<VisualFrameProducerResult | null> => {
    if (activeCaptureLocks.has(input.sourceId)) return null;
    const stream = activeStreams.get(input.sourceId);
    const track = stream?.getVideoTracks()[0] ?? stream?.getTracks()[0] ?? null;
    if (!stream || track?.readyState === "ended") {
      stopVisualFrameProducerInterval(input.sourceId, { stopStream: false });
      return null;
    }
    activeCaptureLocks.add(input.sourceId);
    try {
      await input.postJson("/api/agi/situation/live-source/producer/heartbeat", {
        source_id: input.sourceId,
        thread_id: input.threadId,
        environment_id: input.environmentId ?? null,
        pipeline_id: input.pipelineId ?? null,
        client_stream_confirmed: true,
        status: "active",
        ts: new Date().toISOString(),
      }).catch(() => null);
      if (!force) {
        const due = await input.postJson("/api/agi/situation/live-source/producer/tick-due", {
          source_id: input.sourceId,
          thread_id: input.threadId,
          now: new Date().toISOString(),
        }).catch(() => null);
        if (due?.due === false) return null;
      }
      const result = await runVisualFrameProducerOnce({
        ...input,
        stream,
        producerId,
        captureMode: "interval",
        cadenceMs,
      });
      await input.postJson("/api/agi/situation/live-source/analysis-jobs/run-due", {
        thread_id: input.threadId,
        source_id: input.sourceId,
      }).catch(() => null);
      return result;
    } catch (error) {
      useVisualSourceCaptureStore.getState().patchProducer(input.sourceId, {
        last_error: error instanceof Error ? error.message : "visual_interval_capture_failed",
      });
      throw error;
    } finally {
      activeCaptureLocks.delete(input.sourceId);
    }
  };

  const firstResult = await capture(true);
  const interval = window.setInterval(() => {
    void capture(false).catch(() => null);
  }, cadenceMs);
  activeIntervals.set(input.sourceId, interval);
  return firstResult ?? {
    source_id: input.sourceId,
    frame_id: null,
    evidence_id: null,
    summary: "Visual producer interval started; first frame capture is pending.",
    evidence: null,
  };
}
