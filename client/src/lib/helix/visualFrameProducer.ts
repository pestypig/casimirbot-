import { useVisualSourceCaptureStore } from "@/store/useVisualSourceCaptureStore";

type PostJson = (path: string, body?: Record<string, unknown>) => Promise<any>;

export type VisualFrameProducerResult = {
  source_id: string;
  frame_id: string | null;
  evidence_id: string | null;
  summary: string;
  evidence: Record<string, unknown> | null;
};

const waitForVideoReady = async (video: HTMLVideoElement): Promise<void> => {
  if (video.videoWidth > 0 && video.videoHeight > 0) return;
  await new Promise<void>((resolve) => {
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
  alignWithEvents?: boolean;
}): Promise<VisualFrameProducerResult> {
  const now = new Date().toISOString();
  const firstTrack = input.stream.getVideoTracks()[0] ?? input.stream.getTracks()[0] ?? null;
  useVisualSourceCaptureStore.getState().upsertProducer({
    source_id: input.sourceId,
    thread_id: input.threadId,
    stream_active: true,
    track_ready_state: firstTrack?.readyState === "ended" ? "ended" : "live",
    capture_mode: "manual",
    cadence_ms: null,
    last_frame_at: null,
    last_heartbeat_at: now,
  });
  firstTrack?.addEventListener("ended", () => {
    useVisualSourceCaptureStore.getState().patchProducer(input.sourceId, {
      stream_active: false,
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
  const analysis = await input.postJson("/api/agi/situation/visual-frame/analyze", {
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    source_id: input.sourceId,
    environment_id: input.environmentId ?? null,
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
  const summary = typeof analysis?.evidence?.summary === "string" && analysis.evidence.summary.trim()
    ? analysis.evidence.summary.trim()
    : "Visual frame captured and recorded as compact evidence.";
  const frameAt = new Date().toISOString();
  useVisualSourceCaptureStore.getState().patchProducer(input.sourceId, {
    last_frame_at: frameAt,
    last_heartbeat_at: frameAt,
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
