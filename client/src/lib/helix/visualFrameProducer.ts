import { useVisualSourceCaptureStore } from "@/store/useVisualSourceCaptureStore";
import { postVisualLiveSourceDescriptor } from "@/lib/helix/liveSourceDescriptorClient";

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
  preserveExistingStream?: boolean;
};

const activeIntervals = new Map<string, number>();
const activeStreams = new Map<string, MediaStream>();
const activeCaptureLocks = new Set<string>();

type ServerVisualProducer = {
  producer_id?: string;
  source_id?: string;
  thread_id?: string;
  modality?: string;
  environment_id?: string | null;
  pipeline_id?: string | null;
  capture_mode?: string;
  cadence_ms?: number | null;
  status?: string;
  action_request_id?: string | null;
};

const clampVisualCadenceMs = (value?: number | null): number =>
  Math.max(5_000, Math.min(120_000, Math.round(value ?? 15_000)));

const getLiveTrack = (stream?: MediaStream | null): MediaStreamTrack | null => {
  const track = stream?.getVideoTracks()[0] ?? stream?.getTracks()[0] ?? null;
  return track && track.readyState !== "ended" ? track : null;
};

export function getActiveVisualFrameStream(sourceId?: string | null): MediaStream | null {
  if (!sourceId) return null;
  const stream = activeStreams.get(sourceId) ?? null;
  return getLiveTrack(stream) ? stream : null;
}

export function getLatestActiveVisualFrameStream(threadId?: string | null): { sourceId: string; stream: MediaStream } | null {
  const states = useVisualSourceCaptureStore.getState().producers;
  const candidates = Object.values(states)
    .filter((state: { thread_id: string; stream_active: boolean; track_ready_state: string }) =>
      (!threadId || state.thread_id === threadId) && state.stream_active && state.track_ready_state !== "ended")
    .sort((a: { last_heartbeat_at?: string | null; last_frame_at?: string | null }, b: { last_heartbeat_at?: string | null; last_frame_at?: string | null }) =>
      Date.parse(b.last_heartbeat_at ?? b.last_frame_at ?? "0") - Date.parse(a.last_heartbeat_at ?? a.last_frame_at ?? "0"));
  for (const candidate of candidates) {
    const stream = getActiveVisualFrameStream(candidate.source_id);
    if (stream) return { sourceId: candidate.source_id, stream };
  }
  for (const [sourceId, stream] of activeStreams.entries()) {
    if (getLiveTrack(stream)) return { sourceId, stream };
  }
  return null;
}

const hashFramePreview = async (dataUrl: string): Promise<string> => {
  const bytes = new TextEncoder().encode(dataUrl.slice(0, 4096));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).slice(0, 8).map((byte: number) => byte.toString(16).padStart(2, "0")).join("");
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
  activeStreams.set(input.sourceId, input.stream);
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
    activeStreams.delete(input.sourceId);
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
  await postVisualLiveSourceDescriptor({
    postJson: input.postJson,
    sourceId: input.sourceId,
    threadId: input.threadId,
    environmentId: input.environmentId ?? null,
    pipelineId: input.pipelineId ?? null,
    currentState: captureMode === "interval" ? "active_interval" : "active",
    cadenceMs: captureMode === "interval" ? input.cadenceMs ?? null : null,
    stream: input.stream,
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
    await input.postJson("/api/agi/situation/live-schema/repair", {
      environment_id: input.environmentId,
      thread_id: input.threadId,
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
  const track = stream?.getVideoTracks()[0] ?? stream?.getTracks()[0] ?? null;
  if (stream && options.stopStream !== false) {
    stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
  }
  if (options.stopStream !== false) activeStreams.delete(sourceId);
  useVisualSourceCaptureStore.getState().patchProducer(sourceId, {
    interval_active: false,
    stream_active: options.stopStream === false,
    track_ready_state: options.stopStream === false && track?.readyState !== "ended" ? "live" : "ended",
    scheduler_adoption_status: options.stopStream === false ? "paused" : "stopped",
    last_heartbeat_at: new Date().toISOString(),
  });
}

const postSchedulerAdoption = async (input: {
  postJson: PostJson;
  producerId?: string | null;
  sourceId: string;
  threadId: string;
  environmentId?: string | null;
  pipelineId?: string | null;
  cadenceMs?: number | null;
  captureMode?: VisualCaptureMode;
  clientStreamConfirmed: boolean;
  intervalActive: boolean;
  status?: "adopted" | "waiting_for_stream" | "waiting_for_environment" | "paused" | "stopped" | "error";
  lastCaptureAt?: string | null;
  lastChunkId?: string | null;
}): Promise<void> => {
  const nextCaptureDueAt = input.intervalActive && input.cadenceMs
    ? new Date(Date.now() + clampVisualCadenceMs(input.cadenceMs)).toISOString()
    : null;
  const response = await input.postJson("/api/agi/situation/live-source/producer/adopt", {
    producer_id: input.producerId ?? undefined,
    source_id: input.sourceId,
    thread_id: input.threadId,
    environment_id: input.environmentId ?? null,
    pipeline_id: input.pipelineId ?? null,
    cadence_ms: input.cadenceMs ?? null,
    capture_mode: input.captureMode ?? "interval",
    client_stream_confirmed: input.clientStreamConfirmed,
    interval_active: input.intervalActive,
    next_capture_due_at: nextCaptureDueAt,
    last_capture_at: input.lastCaptureAt ?? null,
    last_chunk_id: input.lastChunkId ?? null,
    status: input.status ?? (input.clientStreamConfirmed && input.intervalActive ? "adopted" : "waiting_for_stream"),
  }).catch(() => null);
  const adoption = response?.adoption && typeof response.adoption === "object" ? response.adoption : null;
  useVisualSourceCaptureStore.getState().patchProducer(input.sourceId, {
    scheduler_adoption_id: typeof adoption?.adoption_id === "string" ? adoption.adoption_id : null,
    scheduler_adoption_status: typeof adoption?.status === "string" ? adoption.status : input.status ?? null,
  });
};

const postClientCapabilityAdoption = async (input: {
  postJson: PostJson;
  actionRequestId?: string | null;
  threadId: string;
  sourceId?: string | null;
  producerId?: string | null;
  ok: boolean;
  observedState: Record<string, unknown>;
  nextRequiredAction?: string | null;
  error?: string | null;
}): Promise<void> => {
  if (!input.actionRequestId) return;
  await input.postJson(`/api/agi/client-action/${encodeURIComponent(input.actionRequestId)}/adopt`, {
    thread_id: input.threadId,
    source_id: input.sourceId ?? null,
    producer_id: input.producerId ?? null,
    client_id: "current_browser",
    ok: input.ok,
    observed_state: input.observedState,
    next_required_action: input.nextRequiredAction ?? null,
    error: input.error ?? null,
  }).catch(() => null);
};

export async function startVisualFrameProducerInterval(input: VisualProducerIntervalOptions): Promise<VisualFrameProducerResult> {
  const cadenceMs = clampVisualCadenceMs(input.cadenceMs);
  stopVisualFrameProducerInterval(input.sourceId, { stopStream: input.preserveExistingStream ? false : true });
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
  await postSchedulerAdoption({
    postJson: input.postJson,
    producerId,
    sourceId: input.sourceId,
    threadId: input.threadId,
    environmentId: input.environmentId ?? null,
    pipelineId: input.pipelineId ?? null,
    cadenceMs,
    captureMode: "interval",
    clientStreamConfirmed: true,
    intervalActive: true,
    status: "adopted",
  });
  await postVisualLiveSourceDescriptor({
    postJson: input.postJson,
    sourceId: input.sourceId,
    threadId: input.threadId,
    environmentId: input.environmentId ?? null,
    pipelineId: input.pipelineId ?? null,
    currentState: "active_interval",
    cadenceMs,
    stream: input.stream,
  });

  const capture = async (force: boolean): Promise<VisualFrameProducerResult | null> => {
    if (activeCaptureLocks.has(input.sourceId)) return null;
    const stream = activeStreams.get(input.sourceId);
    const track = stream?.getVideoTracks()[0] ?? stream?.getTracks()[0] ?? null;
    if (!stream || !track) {
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
      const latestState = useVisualSourceCaptureStore.getState().producers[input.sourceId];
      await postSchedulerAdoption({
        postJson: input.postJson,
        producerId,
        sourceId: input.sourceId,
        threadId: input.threadId,
        environmentId: input.environmentId ?? null,
        pipelineId: input.pipelineId ?? null,
        cadenceMs,
        captureMode: "interval",
        clientStreamConfirmed: true,
        intervalActive: true,
        status: "adopted",
        lastCaptureAt: latestState?.last_frame_at ?? null,
        lastChunkId: latestState?.last_chunk_id ?? null,
      });
      await postVisualLiveSourceDescriptor({
        postJson: input.postJson,
        sourceId: input.sourceId,
        threadId: input.threadId,
        environmentId: input.environmentId ?? null,
        pipelineId: input.pipelineId ?? null,
        currentState: "active_interval",
        cadenceMs,
        stream,
      });
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

export async function adoptServerVisualProducerPolicies(input: {
  threadId: string;
  postJson: PostJson;
  fetchJson?: (path: string) => Promise<any>;
  roomId?: string | null;
  environmentId?: string | null;
}): Promise<number> {
  const fetchJson = input.fetchJson ?? (async (path: string) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path} failed with ${response.status}`);
    return response.json();
  });
  const body = await fetchJson(`/api/agi/situation/live-source/producers?thread_id=${encodeURIComponent(input.threadId)}`);
  const pendingBody = await fetchJson(`/api/agi/client-action/pending?thread_id=${encodeURIComponent(input.threadId)}`).catch(() => null);
  const producers: ServerVisualProducer[] = Array.isArray(body?.producers) ? body.producers : [];
  const pendingProducers: ServerVisualProducer[] = Array.isArray(pendingBody?.actions)
    ? pendingBody.actions
        .filter((action: any) =>
          action?.capability === "visual_capture" &&
          ["adopt_producer", "set_rate", "start_interval"].includes(action?.action) &&
          action?.args &&
          typeof action.args === "object"
        )
        .map((action: any) => ({
          producer_id: typeof action.args.producer_id === "string" ? action.args.producer_id : undefined,
          source_id: typeof action.args.source_id === "string" ? action.args.source_id : undefined,
          thread_id: typeof action.thread_id === "string" ? action.thread_id : input.threadId,
          modality: "visual_frame",
          environment_id: typeof action.environment_id === "string" ? action.environment_id : null,
          pipeline_id: typeof action.pipeline_id === "string" ? action.pipeline_id : null,
          capture_mode: typeof action.args.capture_mode === "string" ? action.args.capture_mode : "interval",
          cadence_ms: typeof action.args.cadence_ms === "number" ? action.args.cadence_ms : null,
          action_request_id: typeof action.action_request_id === "string" ? action.action_request_id : null,
        }))
    : [];
  const producerByKey = new Map<string, ServerVisualProducer>();
  for (const producer of [...producers, ...pendingProducers]) {
    const key = producer.producer_id ?? producer.source_id ?? `${producer.action_request_id}`;
    if (key) producerByKey.set(key, { ...producerByKey.get(key), ...producer });
  }
  let adopted = 0;
  for (const producer of producerByKey.values()) {
    if (producer.modality && producer.modality !== "visual_frame") continue;
    if (producer.capture_mode !== "interval" || typeof producer.cadence_ms !== "number") continue;
    const sourceId = typeof producer.source_id === "string" ? producer.source_id : null;
    if (!sourceId) continue;
    let stream = activeStreams.get(sourceId);
    let track = getLiveTrack(stream);
    if (!stream || !track) {
      const fallback = getLatestActiveVisualFrameStream(input.threadId);
      if (fallback?.stream) {
        stream = fallback.stream;
        track = getLiveTrack(stream);
        activeStreams.set(sourceId, stream);
        const fallbackState = useVisualSourceCaptureStore.getState().producers[fallback.sourceId];
        useVisualSourceCaptureStore.getState().upsertProducer({
          source_id: sourceId,
          thread_id: input.threadId,
          producer_id: producer.producer_id ?? null,
          environment_id: producer.environment_id ?? input.environmentId ?? fallbackState?.environment_id ?? null,
          pipeline_id: producer.pipeline_id ?? fallbackState?.pipeline_id ?? null,
          stream_active: true,
          interval_active: false,
          track_ready_state: "live",
          capture_mode: "interval",
          cadence_ms: producer.cadence_ms,
          last_frame_at: fallbackState?.last_frame_at ?? null,
          last_heartbeat_at: new Date().toISOString(),
          last_chunk_id: fallbackState?.last_chunk_id ?? null,
          capture_count: fallbackState?.capture_count ?? 0,
          post_count: fallbackState?.post_count ?? 0,
          last_frame_hash: fallbackState?.last_frame_hash ?? null,
          last_error: null,
        });
      }
    }
    if (!stream || track?.readyState === "ended") {
      await postSchedulerAdoption({
        postJson: input.postJson,
        producerId: producer.producer_id ?? null,
        sourceId,
        threadId: input.threadId,
        environmentId: producer.environment_id ?? input.environmentId ?? null,
        pipelineId: producer.pipeline_id ?? null,
        cadenceMs: producer.cadence_ms,
        captureMode: "interval",
        clientStreamConfirmed: false,
        intervalActive: false,
        status: "waiting_for_stream",
      });
      await postClientCapabilityAdoption({
        postJson: input.postJson,
        actionRequestId: producer.action_request_id ?? null,
        threadId: input.threadId,
        sourceId,
        producerId: producer.producer_id ?? null,
        ok: false,
        observedState: {
          source_id: sourceId,
          producer_id: producer.producer_id ?? null,
          client_stream_confirmed: false,
          interval_active: false,
          track_ready_state: track?.readyState ?? "ended",
          status: "waiting_for_stream",
        },
        nextRequiredAction: "grant_visual_capture_permission",
      });
      continue;
    }
    const liveTrack = getLiveTrack(stream);
    if (!liveTrack) continue;
    const current = useVisualSourceCaptureStore.getState().producers[sourceId];
    if (
      current?.interval_active &&
      current.cadence_ms === producer.cadence_ms &&
      current.producer_id === producer.producer_id
    ) {
      const trackReadyState = liveTrack.readyState;
      await postSchedulerAdoption({
        postJson: input.postJson,
        producerId: producer.producer_id ?? null,
        sourceId,
        threadId: input.threadId,
        environmentId: producer.environment_id ?? input.environmentId ?? null,
        pipelineId: producer.pipeline_id ?? null,
        cadenceMs: producer.cadence_ms,
        captureMode: "interval",
        clientStreamConfirmed: true,
        intervalActive: true,
        status: "adopted",
        lastCaptureAt: current.last_frame_at ?? null,
        lastChunkId: current.last_chunk_id ?? null,
      });
      await postVisualLiveSourceDescriptor({
        postJson: input.postJson,
        sourceId,
        threadId: input.threadId,
        environmentId: producer.environment_id ?? input.environmentId ?? null,
        pipelineId: producer.pipeline_id ?? null,
        currentState: "active_interval",
        cadenceMs: producer.cadence_ms,
        stream,
      });
      await postClientCapabilityAdoption({
        postJson: input.postJson,
        actionRequestId: producer.action_request_id ?? null,
        threadId: input.threadId,
        sourceId,
        producerId: producer.producer_id ?? null,
        ok: true,
        observedState: {
          source_id: sourceId,
          producer_id: producer.producer_id ?? null,
          client_stream_confirmed: true,
          interval_active: true,
          cadence_ms: producer.cadence_ms,
          track_ready_state: trackReadyState,
          latest_chunk_id: current.last_chunk_id ?? null,
          scheduler_adoption_status: "adopted",
        },
      });
      adopted += 1;
      continue;
    }
    const trackReadyState = liveTrack.readyState;
    await startVisualFrameProducerInterval({
      sourceId,
      threadId: input.threadId,
      roomId: input.roomId ?? null,
      environmentId: producer.environment_id ?? input.environmentId ?? null,
      pipelineId: producer.pipeline_id ?? null,
      cadenceMs: producer.cadence_ms,
      stream,
      postJson: input.postJson,
      preserveExistingStream: true,
    });
    const updated = useVisualSourceCaptureStore.getState().producers[sourceId];
    await postClientCapabilityAdoption({
      postJson: input.postJson,
      actionRequestId: producer.action_request_id ?? null,
      threadId: input.threadId,
      sourceId,
      producerId: producer.producer_id ?? updated?.producer_id ?? null,
      ok: true,
      observedState: {
        source_id: sourceId,
        producer_id: producer.producer_id ?? updated?.producer_id ?? null,
        client_stream_confirmed: true,
        interval_active: true,
        cadence_ms: producer.cadence_ms,
        track_ready_state: trackReadyState,
        latest_chunk_id: updated?.last_chunk_id ?? null,
        scheduler_adoption_status: "adopted",
      },
    });
    adopted += 1;
  }
  return adopted;
}
