import React, { useEffect, useMemo, useState } from "react";
import {
  selectActiveLiveAnswerEnvironment,
  selectLiveAnswerEnvironmentDeltas,
  useLiveAnswerEnvironmentStore,
  type LiveAnswerEnvironmentState,
} from "@/store/useLiveAnswerEnvironmentStore";
import type { WorkstationLiveSource, WorkstationLiveSourceEvent, LiveSourceWindowSummary } from "@shared/helix-workstation-live-source";
import type { LiveAnswerEnvironmentDelta, LiveAnswerLineState } from "@shared/helix-live-answer-environment";
import type {
  LiveCommentaryCadence,
  LiveCommentaryCandidate,
  LiveCommentaryDeliveryReceipt,
  LiveCommentaryProposal,
  LiveCommentarySession,
  LiveCommentaryTraceStep,
} from "@shared/helix-live-commentary";
import type { HelixInterpretedEvent } from "@shared/helix-interpreted-event-log";
import type { HelixPresentStateCard } from "@shared/helix-present-state-card";
import type {
  HelixClarificationNeed,
  HelixClarificationQuestionProposal,
} from "@shared/helix-clarification-dialogue";
import type { HelixUserSteeringEvidence } from "@shared/helix-user-steering-evidence";
import type { HelixLiveLineToolEvaluation } from "@shared/helix-live-line-tool-evaluation";
import type { HelixLiveLineToolRequest } from "@shared/helix-live-line-tool-request";
import type { HelixLiveCardLineSourceCoverage, HelixLiveCardLineState } from "@shared/helix-live-card-line-state";
import type { HelixSituationSourceCapability, HelixSituationSourceModality, HelixSituationSourceStatus } from "@shared/helix-situation-source-capability";

type LiveEnvironmentTab = "present_state" | "line_checks" | "interpreted_log" | "clarification" | "overview" | "sources" | "line_schema" | "deltas" | "windows" | "commentary" | "reviews" | "debug";
type LiveAgenticReviewReadEntry = {
  review_id: string;
  question?: string;
  trigger?: string;
  decision?: string;
  summary?: string;
  model_invoked?: boolean;
};

type WorldEventSourceSeen = {
  room_id: string;
  source_id: string;
  world_id: string;
  latest_event_type: string;
  latest_ts: string;
  event_count: number;
  latest_actor_label?: string | null;
  latest_actor_id?: string | null;
};

type SourceSignalStatus = "unchecked" | "live" | "stale" | "missing" | "error";

type SourceSignalCheck = {
  status: SourceSignalStatus;
  summary: string;
  checkedAt?: string | null;
  source?: WorldEventSourceSeen | null;
};

type VisualSourceRead = {
  source_id: string;
  thread_id: string;
  status: "permission_required" | "active" | "paused" | "stopped" | "error";
  source_surface?: string | null;
  capture_mode?: string | null;
  updated_at?: string | null;
};

type VisualLatestRead = {
  source?: VisualSourceRead | null;
  active_source?: VisualSourceRead | null;
  frame?: { frame_id: string; ts?: string | null } | null;
  evidence?: { evidence_id: string; summary?: string | null; ts?: string | null } | null;
  alignment?: { alignment_id: string; summary?: string | null; confidence?: number | null } | null;
};

const tabs: Array<{ id: LiveEnvironmentTab; label: string }> = [
  { id: "present_state", label: "Present State" },
  { id: "line_checks", label: "Line Checks" },
  { id: "interpreted_log", label: "Interpreted Log" },
  { id: "clarification", label: "Clarification Queue" },
  { id: "overview", label: "Overview" },
  { id: "sources", label: "Sources" },
  { id: "line_schema", label: "Line Schema" },
  { id: "deltas", label: "Deltas" },
  { id: "windows", label: "Windows" },
  { id: "commentary", label: "Commentary" },
  { id: "reviews", label: "Reviews" },
  { id: "debug", label: "Debug" },
];

const commentaryCadences: LiveCommentaryCadence[] = [
  "off",
  "milestones_only",
  "anomalies_and_milestones",
  "windowed_companion",
  "active_dialogue",
  "continuous_debug",
];

const postJson = async (path: string, body?: Record<string, unknown>) => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `${path} failed with ${response.status}`);
  }
  return response.json().catch(() => null);
};

const formatTime = (value?: string | null): string => {
  if (!value) return "never";
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? new Date(ts).toLocaleTimeString() : value;
};

const defaultWorldEventEndpoint = (): string => {
  if (typeof window === "undefined") return "/api/agi/situation/world-event";
  return `${window.location.origin}/api/agi/situation/world-event`;
};

const signalAgeMs = (source?: WorldEventSourceSeen | null): number | null => {
  if (!source?.latest_ts) return null;
  const parsed = Date.parse(source.latest_ts);
  return Number.isFinite(parsed) ? Date.now() - parsed : null;
};

const isMinecraftWorldSource = (source: WorldEventSourceSeen): boolean =>
  /\bminecraft|minehut|world_event/i.test([source.room_id, source.source_id, source.world_id, source.latest_event_type].join(" "));

const modalityLabel = (modality: HelixSituationSourceModality): string => {
  if (modality === "world_event") return "World events";
  if (modality === "visual_frame") return "Visual";
  if (modality === "audio_transcript") return "Audio transcript";
  if (modality === "voice_identity") return "Voice identity";
  if (modality === "text_chat") return "Text chat";
  if (modality === "calculator_stream") return "Calculator";
  if (modality === "simulation_stream") return "Simulation";
  if (modality === "document_context") return "Documents";
  return "Notes";
};

const sourceStatusClass = (status: HelixSituationSourceStatus): string => {
  if (status === "active") return "border-emerald-300/30 text-emerald-100";
  if (status === "permission_required" || status === "stale" || status === "paused") return "border-amber-300/30 text-amber-100";
  if (status === "error" || status === "configured_missing") return "border-rose-300/30 text-rose-100";
  return "border-white/10 text-slate-400";
};

const sourceCoverageSummary = (coverage?: HelixLiveCardLineSourceCoverage): string[] => {
  if (!coverage) return [];
  const entries: string[] = [];
  if (coverage.world_event !== "not_applicable") entries.push(`world ${coverage.world_event}`);
  if (coverage.visual_frame !== "not_applicable") entries.push(`visual ${coverage.visual_frame}`);
  if (coverage.audio_transcript !== "not_applicable") entries.push(`transcript ${coverage.audio_transcript}`);
  if (coverage.text_chat !== "not_applicable") entries.push(`chat ${coverage.text_chat}`);
  return entries;
};

export function LiveAnswerEnvironmentPanel({ threadId = "helix-ask:desktop" }: { threadId?: string }) {
  const [activeTab, setActiveTab] = useState<LiveEnvironmentTab>("present_state");
  const [sources, setSources] = useState<WorkstationLiveSource[]>([]);
  const [events, setEvents] = useState<WorkstationLiveSourceEvent[]>([]);
  const [windows, setWindows] = useState<LiveSourceWindowSummary[]>([]);
  const [commentarySession, setCommentarySession] = useState<LiveCommentarySession | null>(null);
  const [commentaryCandidates, setCommentaryCandidates] = useState<LiveCommentaryCandidate[]>([]);
  const [commentaryProposals, setCommentaryProposals] = useState<LiveCommentaryProposal[]>([]);
  const [commentaryDeliveries, setCommentaryDeliveries] = useState<LiveCommentaryDeliveryReceipt[]>([]);
  const [reviewRequests, setReviewRequests] = useState<LiveAgenticReviewReadEntry[]>([]);
  const [reviewResults, setReviewResults] = useState<LiveAgenticReviewReadEntry[]>([]);
  const [presentStateCard, setPresentStateCard] = useState<HelixPresentStateCard | null>(null);
  const [interpretedEvents, setInterpretedEvents] = useState<HelixInterpretedEvent[]>([]);
  const [clarificationNeeds, setClarificationNeeds] = useState<HelixClarificationNeed[]>([]);
  const [clarificationProposals, setClarificationProposals] = useState<HelixClarificationQuestionProposal[]>([]);
  const [steeringEvidence, setSteeringEvidence] = useState<HelixUserSteeringEvidence[]>([]);
  const [lineToolRequests, setLineToolRequests] = useState<HelixLiveLineToolRequest[]>([]);
  const [lineToolEvaluations, setLineToolEvaluations] = useState<HelixLiveLineToolEvaluation[]>([]);
  const [visualLatest, setVisualLatest] = useState<VisualLatestRead | null>(null);
  const [sourceSignal, setSourceSignal] = useState<SourceSignalCheck>({
    status: "unchecked",
    summary: "No source signal has been checked in this panel.",
    source: null,
  });
  const [sourceEndpoint, setSourceEndpoint] = useState<string>(() => {
    if (typeof window === "undefined") return defaultWorldEventEndpoint();
    return window.localStorage.getItem("helix.worldEventSourceEndpoint") ?? defaultWorldEventEndpoint();
  });
  const [sourceLabel, setSourceLabel] = useState<string>(() => {
    if (typeof window === "undefined") return "World-event source";
    return window.localStorage.getItem("helix.worldEventSourceLabel") ?? "World-event source";
  });
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const environment = useLiveAnswerEnvironmentStore((state: LiveAnswerEnvironmentState) =>
    selectActiveLiveAnswerEnvironment(state, threadId),
  );
  const deltas = useLiveAnswerEnvironmentStore((state: LiveAnswerEnvironmentState) =>
    selectLiveAnswerEnvironmentDeltas(state, environment?.environment_id),
  );
  const diagnostics = useLiveAnswerEnvironmentStore(
    (state: LiveAnswerEnvironmentState) => state.diagnosticsByThread[threadId] ?? null,
  );
  const loadEnvironment = useLiveAnswerEnvironmentStore((state: LiveAnswerEnvironmentState) => state.loadLiveAnswerEnvironment);
  const sourceIds = useMemo(() => new Set(environment?.source_ids ?? []), [environment?.source_ids]);
  const relevantSources = useMemo(
    () => sources.filter((source: WorkstationLiveSource) => sourceIds.size === 0 || sourceIds.has(source.source_id) || source.environment_id === environment?.environment_id),
    [environment?.environment_id, sourceIds, sources],
  );
  const relevantEvents = useMemo(
    () => events.filter((event: WorkstationLiveSourceEvent) => sourceIds.size === 0 || sourceIds.has(event.source_id) || event.environment_id === environment?.environment_id),
    [environment?.environment_id, events, sourceIds],
  );
  const relevantWindows = useMemo(
    () => windows.filter((window: LiveSourceWindowSummary) => sourceIds.size === 0 || sourceIds.has(window.source_id) || window.environment_id === environment?.environment_id),
    [environment?.environment_id, sourceIds, windows],
  );
  const canStartSourceMonitor = sourceSignal.status === "live" && Boolean(sourceSignal.source);
  const liveCardLineStateByKey = useMemo(() => {
    const entries = presentStateCard?.line_states ?? [];
    return new Map(entries.map((entry: HelixLiveCardLineState) => [entry.line_key, entry]));
  }, [presentStateCard?.line_states]);
  const sourceHealthEntries = useMemo<HelixSituationSourceCapability[]>(() => {
    const capabilities = presentStateCard?.fidelity_profile?.capabilities ?? [];
    const bestByModality = new Map<HelixSituationSourceModality, HelixSituationSourceCapability>();
    const rank = (status: HelixSituationSourceStatus): number =>
      status === "active" ? 0 : status === "stale" ? 1 : status === "permission_required" ? 2 : status === "paused" ? 3 : 4;
    for (const capability of capabilities) {
      const current = bestByModality.get(capability.modality);
      if (!current || rank(capability.status) < rank(current.status)) {
        bestByModality.set(capability.modality, capability);
      }
    }
    return Array.from(bestByModality.values()).slice(0, 8);
  }, [presentStateCard?.fidelity_profile?.capabilities]);

  const refresh = async () => {
    try {
      await loadEnvironment(threadId, 50);
      const loadedEnvironment = selectActiveLiveAnswerEnvironment(useLiveAnswerEnvironmentStore.getState(), threadId);
      const activeEnvironmentId = loadedEnvironment?.environment_id ?? environment?.environment_id ?? null;
      const commentaryPath = activeEnvironmentId
        ? `/api/agi/situation/live-commentary?thread_id=${encodeURIComponent(threadId)}&environment_id=${encodeURIComponent(activeEnvironmentId)}`
        : `/api/agi/situation/live-commentary?thread_id=${encodeURIComponent(threadId)}`;
      const reviewPath = activeEnvironmentId
        ? `/api/agi/situation/live-agentic-review?thread_id=${encodeURIComponent(threadId)}&environment_id=${encodeURIComponent(activeEnvironmentId)}`
        : `/api/agi/situation/live-agentic-review?thread_id=${encodeURIComponent(threadId)}`;
      const roomQuery = loadedEnvironment?.room_id ? `&room_id=${encodeURIComponent(loadedEnvironment.room_id)}` : "";
      const [sourceRes, eventRes, windowRes, commentaryRes, reviewRes, presentStateRes, interpretedLogRes, clarificationRes, lineToolRes, visualLatestRes] = await Promise.all([
        fetch("/api/agi/situation/live-source/list"),
        fetch("/api/agi/situation/live-source/events"),
        fetch("/api/agi/situation/live-source/windows"),
        fetch(commentaryPath),
        fetch(reviewPath),
        fetch(`/api/agi/situation/present-state-card?thread_id=${encodeURIComponent(threadId)}${roomQuery}`),
        fetch(`/api/agi/situation/interpreted-log?thread_id=${encodeURIComponent(threadId)}${roomQuery}&limit=80`),
        fetch(`/api/agi/situation/clarification-dialogue?thread_id=${encodeURIComponent(threadId)}${roomQuery}`),
        fetch(`/api/agi/situation/live-line-tool-requests?thread_id=${encodeURIComponent(threadId)}&limit=80`),
        fetch(`/api/agi/situation/visual-frame/latest?thread_id=${encodeURIComponent(threadId)}`),
      ]);
      const [sourceBody, eventBody, windowBody, commentaryBody, reviewBody, presentStateBody, interpretedLogBody, clarificationBody, lineToolBody, visualLatestBody] = await Promise.all([
        sourceRes.json(),
        eventRes.json(),
        windowRes.json(),
        commentaryRes.json(),
        reviewRes.json(),
        presentStateRes.json(),
        interpretedLogRes.json(),
        clarificationRes.json(),
        lineToolRes.json(),
        visualLatestRes.json(),
      ]);
      setSources(Array.isArray(sourceBody.sources) ? sourceBody.sources : []);
      setEvents(Array.isArray(eventBody.events) ? eventBody.events : []);
      setWindows(Array.isArray(windowBody.windows) ? windowBody.windows : []);
      setCommentarySession(commentaryBody.session ?? null);
      setCommentaryCandidates(Array.isArray(commentaryBody.candidates) ? commentaryBody.candidates : []);
      setCommentaryProposals(Array.isArray(commentaryBody.proposals) ? commentaryBody.proposals : []);
      setCommentaryDeliveries(Array.isArray(commentaryBody.deliveries) ? commentaryBody.deliveries : []);
      setReviewRequests(Array.isArray(reviewBody.requests) ? reviewBody.requests : []);
      setReviewResults(Array.isArray(reviewBody.results) ? reviewBody.results : []);
      setPresentStateCard(presentStateBody.card ?? null);
      setInterpretedEvents(Array.isArray(interpretedLogBody.events) ? interpretedLogBody.events : []);
      setClarificationNeeds(Array.isArray(clarificationBody.needs) ? clarificationBody.needs : []);
      setClarificationProposals(Array.isArray(clarificationBody.proposals) ? clarificationBody.proposals : []);
      setSteeringEvidence(Array.isArray(clarificationBody.steering_evidence) ? clarificationBody.steering_evidence : []);
      setLineToolRequests(Array.isArray(lineToolBody.requests) ? lineToolBody.requests : []);
      setLineToolEvaluations(Array.isArray(lineToolBody.evaluations) ? lineToolBody.evaluations : []);
      setVisualLatest(visualLatestBody ?? null);
      setLastFetchError(null);
    } catch (error) {
      setLastFetchError(error instanceof Error ? error.message : "live_environment_refresh_failed");
    }
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(interval);
  }, [threadId]);

  const setEnvironmentStatus = async (action: "pause" | "resume" | "stop") => {
    if (!environment) return;
    await postJson(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environment.environment_id)}/${action}`);
    await refresh();
  };

  const setSourceStatus = async (sourceId: string, action: "pause" | "resume" | "stop" | "reset-counters") => {
    await postJson(`/api/agi/situation/live-source/${encodeURIComponent(sourceId)}/${action}`);
    await refresh();
  };

  const setCommentaryCadence = async (cadence: LiveCommentaryCadence) => {
    if (!environment) return;
    await postJson("/api/agi/situation/live-commentary/session", {
      environment_id: environment.environment_id,
      cadence,
      status: cadence === "off" ? "paused" : "active",
    });
    await refresh();
  };

  const requestAgenticReview = async () => {
    if (!environment) return;
    await postJson("/api/agi/situation/live-agentic-review/request", {
      thread_id: threadId,
      environment_id: environment.environment_id,
      question: "Review the latest compact live environment state.",
      trigger: "manual_button",
    });
    await refresh();
  };

  const checkSourceSignal = async () => {
    try {
      const response = await fetch("/api/agi/situation/world-event/sources");
      if (!response.ok) throw new Error(`source_signal_check_failed:${response.status}`);
      const body = await response.json();
      const sources = Array.isArray(body.sources)
        ? body.sources.filter((source: unknown): source is WorldEventSourceSeen => {
            if (!source || typeof source !== "object") return false;
            const record = source as Record<string, unknown>;
            return (
              typeof record.room_id === "string" &&
              typeof record.source_id === "string" &&
              typeof record.world_id === "string" &&
              typeof record.latest_ts === "string"
            );
          })
        : [];
      const minecraftSources = sources.filter(isMinecraftWorldSource);
      const source = minecraftSources[0] ?? null;
      const age = signalAgeMs(source);
      const checkedAt = new Date().toISOString();
      if (!source) {
        setSourceSignal({
          status: "missing",
          checkedAt,
          source: null,
          summary: "No matching world-event source has reached Helix since this server started.",
        });
        setLastActionStatus("No source signal detected. Check the configured endpoint or paste a regenerated tunnel URL.");
        return;
      }
      if (age !== null && age <= 120_000) {
        setSourceSignal({
          status: "live",
          checkedAt,
          source,
          summary: `Live signal from ${source.source_id}; latest ${source.latest_event_type} ${formatTime(source.latest_ts)}.`,
        });
        setLastActionStatus(`Source signal live: ${source.source_id}`);
        return;
      }
      setSourceSignal({
        status: "stale",
        checkedAt,
        source,
        summary: `Last signal from ${source.source_id} is stale; latest ${source.latest_event_type} ${formatTime(source.latest_ts)}.`,
      });
      setLastActionStatus("Source signal is stale. If your tunnel changed, paste the new endpoint into the source adapter config.");
    } catch (error) {
      setSourceSignal({
        status: "error",
        checkedAt: new Date().toISOString(),
        source: null,
        summary: error instanceof Error ? error.message : "plugin_signal_check_failed",
      });
      setLastActionStatus(error instanceof Error ? error.message : "plugin_signal_check_failed");
    }
  };

  const saveSourceConnection = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("helix.worldEventSourceEndpoint", sourceEndpoint.trim());
      window.localStorage.setItem("helix.worldEventSourceLabel", sourceLabel.trim() || "World-event source");
    }
    setSourceLabel(sourceLabel.trim() || "World-event source");
    setLastActionStatus("Saved source label and endpoint reminder locally. Update the source adapter config with this URL.");
  };

  const startMinecraftSourceMonitor = async () => {
    try {
      const source = sourceSignal.source;
      const response = await postJson("/api/agi/situation/live-answer-environment/start", {
        thread_id: threadId,
        objective: `Monitor ${sourceLabel.trim() || "an attached world-event source"}, build present-state hypotheses, and expose executable line checks.`,
        room_id: source?.room_id ?? "room:minecraft-minehut",
        source_ids: [source?.source_id ?? "source:minecraft-server"],
        world_id: source?.world_id ?? "minecraft:world",
        preset: "minecraft_run_monitor",
        mode: "active_companion",
        created_turn_id: `turn:minecraft-cortana-ui:${Date.now()}`,
      });
      const environmentId = response?.live_answer_environment?.environment_id ?? "environment";
      setLastActionStatus(`Started Minecraft source monitor: ${environmentId}`);
      await refresh();
    } catch (error) {
      setLastActionStatus(error instanceof Error ? error.message : "start_minecraft_source_monitor_failed");
    }
  };

  const requestDisplayStream = async (): Promise<MediaStream> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("screen_capture_not_available_in_this_browser");
    }
    return navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
  };

  const grantVisualCapture = async () => {
    const sourceId = visualLatest?.source?.source_id;
    if (!sourceId) {
      setLastActionStatus("No visual source is registered yet. Start Minecraft Cortana mode first.");
      return;
    }
    let stream: MediaStream | null = null;
    try {
      stream = await requestDisplayStream();
      stream.getTracks().forEach((track) => track.stop());
      await postJson("/api/agi/situation/visual-source/permission-granted", {
        source_id: sourceId,
      });
      setLastActionStatus("Visual capture permission confirmed for this source.");
      await refresh();
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      setLastActionStatus(error instanceof Error ? error.message : "visual_capture_permission_failed");
    }
  };

  const captureVisualFrameNow = async () => {
    const sourceId = visualLatest?.active_source?.source_id ?? visualLatest?.source?.source_id;
    if (!sourceId) {
      setLastActionStatus("No visual source is registered yet. Start Minecraft Cortana mode first.");
      return;
    }
    let stream: MediaStream | null = null;
    try {
      stream = await requestDisplayStream();
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      await new Promise<void>((resolve) => {
        if (video.videoWidth > 0 && video.videoHeight > 0) resolve();
        else video.onloadedmetadata = () => resolve();
      });
      const maxWidth = 1280;
      const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("screen_capture_canvas_unavailable");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.82);
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      if (visualLatest?.source?.status === "permission_required") {
        await postJson("/api/agi/situation/visual-source/permission-granted", {
          source_id: sourceId,
        });
      }
      await postJson("/api/agi/situation/visual-frame/analyze", {
        thread_id: threadId,
        room_id: environment?.room_id ?? undefined,
        source_id: sourceId,
        image_base64: imageBase64,
        mime_type: "image/jpeg",
        prompt: "Summarize this permission-bound live frame as compact evidence for the current live environment. Focus on visible place, activity, entities, UI/game context, and uncertainty.",
      });
      await postJson("/api/agi/situation/visual-frame/align-with-events", {
        thread_id: threadId,
        room_id: environment?.room_id ?? undefined,
        limit: 40,
      });
      setLastActionStatus("Captured, analyzed, and aligned one visual frame.");
      await refresh();
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      setLastActionStatus(error instanceof Error ? error.message : "visual_capture_failed");
    }
  };

  const planLineChecks = async () => {
    try {
      const response = await postJson("/api/agi/situation/live-line-tool-requests/plan", {
        thread_id: threadId,
        environment_id: environment?.environment_id,
      });
      setLastActionStatus(`Planned ${response?.request_count ?? 0} line checks.`);
      setActiveTab("line_checks");
      await refresh();
    } catch (error) {
      setLastActionStatus(error instanceof Error ? error.message : "plan_line_checks_failed");
    }
  };

  const runLineCheck = async (request: HelixLiveLineToolRequest) => {
    await postJson("/api/agi/situation/live-line-tool-request/run", {
      thread_id: request.thread_id,
      request_id: request.request_id,
      room_id: environment?.room_id ?? undefined,
      source_id: environment?.source_ids?.[0] ?? undefined,
    });
    await refresh();
  };

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-cyan-950/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-cyan-200">Live Environments</p>
          <p className="mt-1 text-xs text-slate-400">
            Source ticks update compact line artifacts. Raw logs stay in Debug, not Helix Ask context.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => void checkSourceSignal()}
            className="rounded border border-amber-300/30 px-2 py-1 text-[11px] text-amber-100 hover:bg-amber-400/10"
          >
            Check source signal
          </button>
          <button
            type="button"
            onClick={() => void startMinecraftSourceMonitor()}
            disabled={!canStartSourceMonitor}
            title={canStartSourceMonitor ? "Start the monitor from the live source signal." : "Check the source signal first; a live source is required."}
            className="rounded border border-emerald-300/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Start source monitor
          </button>
          <button
            type="button"
            onClick={() => void planLineChecks()}
            disabled={!environment}
            className="rounded border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Plan checks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("interpreted_log")}
            className="rounded border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10"
          >
            Go to log
          </button>
          {environment ? (
            <>
              <button type="button" onClick={() => void setEnvironmentStatus("pause")} className="rounded border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10">Pause</button>
              <button type="button" onClick={() => void setEnvironmentStatus("resume")} className="rounded border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10">Resume</button>
              <button type="button" onClick={() => void setEnvironmentStatus("stop")} className="rounded border border-rose-300/25 px-2 py-1 text-[11px] text-rose-100 hover:bg-rose-400/10">Stop</button>
            </>
          ) : null}
          <button type="button" onClick={() => void refresh()} className="rounded border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-400/10">Refresh</button>
        </div>
      </div>
      {lastActionStatus ? (
        <p className="mt-2 rounded border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-300">
          {lastActionStatus}
        </p>
      ) : null}
      <div className="mt-3 rounded border border-white/10 bg-slate-950/60 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-100">Source Health</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Live environments can run with partial senses. Missing sources become next actions, not failures.
            </p>
          </div>
          <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-400">
            fidelity {Math.round((presentStateCard?.fidelity_profile?.fidelity_score ?? 0) * 100)}%
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sourceHealthEntries.length === 0 ? (
            <span className="rounded border border-white/10 px-2 py-1 text-[10px] text-slate-400">No source capability profile yet</span>
          ) : null}
          {sourceHealthEntries.map((capability) => (
            <span
              key={capability.source_id}
              title={capability.missing_reason ?? capability.source_id}
              className={`rounded border px-2 py-1 text-[10px] ${sourceStatusClass(capability.status)}`}
            >
              {modalityLabel(capability.modality)}: {capability.status}
            </span>
          ))}
        </div>
        {presentStateCard?.fidelity_profile?.next_actions?.length ? (
          <p className="mt-2 text-[11px] text-amber-100">
            Next: {presentStateCard.fidelity_profile.next_actions.slice(0, 3).join(", ")}
          </p>
        ) : null}
      </div>
      <div className="mt-3 rounded border border-white/10 bg-slate-950/60 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-100">{sourceLabel}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              This checks whether a saved or attached world-event adapter is reaching Helix. The source can be a Minecraft plugin, another game adapter, a browser source, or a future profile-saved live environment.
            </p>
          </div>
          <span className={`rounded border px-2 py-0.5 text-[10px] uppercase ${
            sourceSignal.status === "live"
              ? "border-emerald-300/30 text-emerald-100"
              : sourceSignal.status === "stale"
                ? "border-amber-300/30 text-amber-100"
                : sourceSignal.status === "missing" || sourceSignal.status === "error"
                  ? "border-rose-300/30 text-rose-100"
                  : "border-white/10 text-slate-400"
          }`}>
            {sourceSignal.status}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-slate-300">{sourceSignal.summary}</p>
        {sourceSignal.source ? (
          <p className="mt-1 truncate text-[10px] text-slate-500">
            source {sourceSignal.source.source_id} / room {sourceSignal.source.room_id} / world {sourceSignal.source.world_id} / events {sourceSignal.source.event_count}
          </p>
        ) : null}
        {sourceSignal.status === "missing" || sourceSignal.status === "stale" || sourceSignal.status === "error" ? (
          <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,0.6fr)_1fr_auto]">
            <label className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
              Source label
              <input
                value={sourceLabel}
                onChange={(event) => setSourceLabel(event.target.value)}
                className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-xs normal-case tracking-normal text-slate-100 outline-none focus:border-cyan-300/40"
                placeholder="My Minecraft world source"
              />
            </label>
            <label className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
              Source endpoint
              <input
                value={sourceEndpoint}
                onChange={(event) => setSourceEndpoint(event.target.value)}
                className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-xs normal-case tracking-normal text-slate-100 outline-none focus:border-cyan-300/40"
                placeholder="https://your-cloudflare-tunnel.trycloudflare.com/api/agi/situation/world-event"
              />
            </label>
            <button
              type="button"
              onClick={saveSourceConnection}
              className="self-end rounded border border-cyan-300/30 px-3 py-1.5 text-[11px] text-cyan-100 hover:bg-cyan-400/10"
            >
              Save source
            </button>
          </div>
        ) : null}
      </div>
      <div className="mt-3 rounded border border-sky-300/15 bg-sky-950/10 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-sky-100">Visual capture source</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              Screen/window frames are evidence only. The panel requests browser permission, records compact visual evidence, and aligns it with recent source events.
            </p>
          </div>
          <span className={`rounded border px-2 py-0.5 text-[10px] uppercase ${
            visualLatest?.source?.status === "active"
              ? "border-emerald-300/30 text-emerald-100"
              : visualLatest?.source?.status === "permission_required"
                ? "border-amber-300/30 text-amber-100"
                : "border-white/10 text-slate-400"
          }`}>
            {visualLatest?.source?.status ?? "not registered"}
          </span>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <div className="rounded border border-white/10 bg-black/20 p-2">
            <p className="text-[10px] uppercase text-slate-500">Source</p>
            <p className="mt-1 truncate text-xs text-slate-200">{visualLatest?.source?.source_id ?? "none"}</p>
          </div>
          <div className="rounded border border-white/10 bg-black/20 p-2">
            <p className="text-[10px] uppercase text-slate-500">Latest frame</p>
            <p className="mt-1 truncate text-xs text-slate-200">{visualLatest?.frame?.frame_id ?? "none"}</p>
          </div>
          <div className="rounded border border-white/10 bg-black/20 p-2">
            <p className="text-[10px] uppercase text-slate-500">Latest alignment</p>
            <p className="mt-1 truncate text-xs text-slate-200">{visualLatest?.alignment?.summary ?? "none"}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => void grantVisualCapture()}
            disabled={!visualLatest?.source || visualLatest.source.status === "active"}
            className="rounded border border-sky-300/30 px-2 py-1 text-[11px] text-sky-100 hover:bg-sky-400/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Grant visual capture
          </button>
          <button
            type="button"
            onClick={() => void captureVisualFrameNow()}
            disabled={!visualLatest?.source}
            className="rounded border border-emerald-300/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Capture now
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("interpreted_log")}
            className="rounded border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10"
          >
            Go to log
          </button>
        </div>
        {visualLatest?.evidence?.summary ? (
          <p className="mt-2 rounded border border-white/10 bg-black/20 px-2 py-1.5 text-[11px] text-slate-300">
            {visualLatest.evidence.summary}
          </p>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tabs.map((tab: { id: LiveEnvironmentTab; label: string }) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded border px-2 py-1 text-[11px] ${activeTab === tab.id ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {!environment && activeTab !== "present_state" && activeTab !== "interpreted_log" ? (
        <p className="mt-3 text-xs text-slate-500">No active live answer environment for {threadId}. Start one from Helix Ask.</p>
      ) : (
        <div className="mt-3">
          {activeTab === "present_state" ? (
            <div className="space-y-3">
              {!environment ? (
                <div className="rounded border border-amber-300/20 bg-amber-950/10 p-3">
                  <p className="text-sm font-semibold text-amber-100">No active live answer environment is bound to {threadId}.</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    Check a saved or attached source signal first. If a world-event source is live, start the source monitor to cycle present state, interpreted log, and executable line checks.
                  </p>
                  <button
                    type="button"
                    onClick={() => void checkSourceSignal()}
                    className="mt-3 rounded border border-amber-300/30 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/10"
                  >
                    Check source signal
                  </button>
                  <button
                    type="button"
                    onClick={() => void startMinecraftSourceMonitor()}
                    disabled={!canStartSourceMonitor}
                    title={canStartSourceMonitor ? "Start the monitor from the live source signal." : "Check the source signal first; a live source is required."}
                    className="mt-3 rounded border border-emerald-300/30 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Start source monitor
                  </button>
                </div>
              ) : null}
              {!presentStateCard ? (
                <p className="text-xs text-slate-500">No present-state card is available yet.</p>
              ) : (
                <div className="rounded border border-emerald-300/20 bg-emerald-950/15 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-200">{presentStateCard.status}</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-50">{presentStateCard.title}</p>
                    </div>
                    <span className="rounded border border-emerald-300/30 px-2 py-0.5 text-[10px] text-emerald-100">
                      {formatTime(presentStateCard.updated_at)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {presentStateCard.lines.map((entry: HelixPresentStateCard["lines"][number]) => {
                      const lineState = liveCardLineStateByKey.get(entry.key);
                      const matchingRequest = lineToolRequests.find((request) => request.line_key === entry.key && request.status !== "evaluated");
                      return (
                      <div key={entry.key} className="rounded border border-white/10 bg-black/20 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] uppercase text-emerald-200/80">{entry.label}</p>
                          <div className="flex flex-wrap items-center gap-1">
                            {lineState?.evidence_status ? (
                              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] uppercase text-slate-400">
                                {lineState.evidence_status}
                              </span>
                            ) : null}
                            {typeof entry.confidence === "number" ? (
                              <span className="text-[10px] text-slate-500">{Math.round(entry.confidence * 100)}%</span>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-slate-100">{entry.value}</p>
                        {lineState?.missing_evidence?.length ? (
                          <p className="mt-1 text-[10px] text-amber-200">
                            Missing: {lineState.missing_evidence.slice(0, 2).join("; ")}
                          </p>
                        ) : null}
                        {lineState?.next_best_tool || lineState?.last_check_result ? (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                            {lineState.next_best_tool ? <span>next tool {lineState.next_best_tool}</span> : null}
                            {lineState.last_check_result ? <span>last check {lineState.last_check_result}</span> : null}
                          </div>
                        ) : null}
                        {sourceCoverageSummary(lineState?.source_coverage).length ? (
                          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                            {sourceCoverageSummary(lineState?.source_coverage).map((entry) => (
                              <span key={entry} className="rounded border border-white/10 px-1.5 py-0.5 text-slate-400">
                                {entry}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-1 truncate text-[10px] text-slate-500">
                          evidence {entry.evidence_refs.slice(0, 2).join(", ") || "none"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => matchingRequest ? void runLineCheck(matchingRequest) : void planLineChecks()}
                            className="rounded border border-cyan-300/25 px-1.5 py-0.5 text-[10px] text-cyan-100 hover:bg-cyan-400/10"
                          >
                            Run check
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("interpreted_log")}
                            className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-slate-200 hover:bg-white/10"
                          >
                            Go to log
                          </button>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                    <span>log target {presentStateCard.go_to_log_target ?? "none"}</span>
                    <span>raw logs included false</span>
                    <span>projection only</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => void planLineChecks()}
                      className="rounded border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-400/10"
                    >
                      Plan checks
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("line_checks")}
                      className="rounded border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10"
                    >
                      Open checks
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("interpreted_log")}
                      className="rounded border border-white/15 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10"
                    >
                      Go to log
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          {activeTab === "line_checks" ? (
            <div className="space-y-3">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <p className="text-xs font-semibold text-slate-100">Executable Line Checks</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Live lines can request workstation checks. Running one creates a receipt and evaluation; it does not create an assistant answer.
                </p>
              </div>
              {lineToolRequests.length === 0 ? (
                <div className="rounded border border-amber-300/20 bg-amber-950/10 p-3">
                  <p className="text-xs font-semibold text-amber-100">No line tool requests have been proposed yet.</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Use Plan checks to turn the current live card lines into receipt-backed workstation checks without creating an assistant answer.
                  </p>
                  <button
                    type="button"
                    onClick={() => void planLineChecks()}
                    disabled={!environment}
                    className="mt-2 rounded border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Plan checks
                  </button>
                </div>
              ) : null}
              {lineToolRequests.slice(-30).reverse().map((request: HelixLiveLineToolRequest) => {
                const evaluation = lineToolEvaluations.find((entry: HelixLiveLineToolEvaluation) => entry.request_id === request.request_id);
                return (
                  <div key={request.request_id} className="rounded border border-cyan-300/15 bg-slate-950/70 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-cyan-100">{request.line_label}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{request.requested_tool}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">{request.status}</span>
                        {request.status !== "evaluated" ? (
                          <button
                            type="button"
                            onClick={() => void runLineCheck(request)}
                            className="rounded border border-cyan-300/30 px-2 py-1 text-[10px] text-cyan-100 hover:bg-cyan-400/10"
                          >
                            Run check
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setActiveTab("interpreted_log")}
                          className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200 hover:bg-white/10"
                        >
                          Go to log
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-300">{request.reason_summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                      <span>{request.reason}</span>
                      <span>{request.expected_evidence_kind}</span>
                      <span>priority {request.priority}</span>
                      <span>assistant answer {String(request.assistant_answer)}</span>
                      <span>raw content {String(request.raw_content_included)}</span>
                    </div>
                    {evaluation ? (
                      <div className="mt-3 rounded border border-emerald-300/15 bg-emerald-950/10 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase text-emerald-200">Evaluation</p>
                          <span className="text-[10px] text-slate-500">
                            {evaluation.supports_line} / delta {evaluation.confidence_delta.toFixed(2)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-200">{evaluation.summary}</p>
                        {evaluation.missing_evidence.length > 0 ? (
                          <p className="mt-1 text-[10px] text-amber-200">
                            Missing: {evaluation.missing_evidence.slice(0, 3).join("; ")}
                          </p>
                        ) : null}
                        <p className="mt-1 truncate text-[10px] text-slate-500">
                          receipts {evaluation.tool_receipt_refs.slice(0, 3).join(", ") || "none"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          {activeTab === "interpreted_log" ? (
            <div className="space-y-2">
              {interpretedEvents.length === 0 ? (
                <p className="text-xs text-slate-500">No interpreted events have been recorded yet.</p>
              ) : null}
              {interpretedEvents.slice(-30).reverse().map((event: HelixInterpretedEvent) => (
                <div key={event.event_id} className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{event.title}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">{event.kind}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{formatTime(event.created_at)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">{event.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                    {typeof event.confidence === "number" ? <span>confidence {Math.round(event.confidence * 100)}%</span> : null}
                    <span>model {String(event.model_invoked)}</span>
                    <span>deterministic {String(event.deterministic)}</span>
                    <span>raw logs {String(event.raw_logs_included)}</span>
                    <span>assistant answer {String(event.assistant_answer)}</span>
                  </div>
                  <p className="mt-2 truncate text-[10px] text-slate-600">
                    evidence {event.evidence_refs.slice(0, 4).join(", ") || "none"}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "clarification" ? (
            <div className="space-y-3">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <p className="text-xs font-semibold text-slate-100">Clarification Queue</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Questions are proposed only when user input would materially improve the situation model. They are validation artifacts, not assistant answers.
                </p>
              </div>
              {clarificationNeeds.length === 0 && clarificationProposals.length === 0 ? (
                <p className="text-xs text-slate-500">No clarification needs are pending.</p>
              ) : null}
              {clarificationProposals.slice(-12).reverse().map((proposal: HelixClarificationQuestionProposal) => {
                const need = clarificationNeeds.find((entry: HelixClarificationNeed) => entry.need_id === proposal.need_id);
                return (
                  <div key={proposal.proposal_id} className="rounded border border-amber-300/20 bg-amber-950/10 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-amber-100">{proposal.question}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {proposal.expected_effect} / {proposal.surface_policy} / importance {need?.importance ?? "unknown"}
                        </p>
                      </div>
                      <span className="rounded border border-amber-300/20 px-1.5 py-0.5 text-[10px] text-amber-100">
                        budget {need?.question_budget ?? 0}
                      </span>
                    </div>
                    {need?.missing_evidence?.length ? (
                      <p className="mt-2 text-[11px] text-slate-400">
                        Missing: {need.missing_evidence.slice(0, 3).join("; ")}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-500">
                      <span>assistant answer {String(proposal.assistant_answer)}</span>
                      <span>raw content {String(proposal.raw_content_included)}</span>
                      <span>{formatTime(proposal.created_at)}</span>
                    </div>
                  </div>
                );
              })}
              {steeringEvidence.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Recent Steering Evidence</p>
                  {steeringEvidence.slice(-8).reverse().map((entry: HelixUserSteeringEvidence) => (
                    <div key={entry.steering_id} className="rounded border border-white/10 bg-slate-950/70 p-2">
                      <p className="text-xs text-slate-200">{entry.user_claim}</p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {entry.effect} / delta {entry.confidence_delta ?? "n/a"} / raw content {String(entry.raw_content_included)}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-slate-600">
                        next checks {entry.next_checks.join(", ") || "none"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {activeTab === "overview" && environment ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {([
                ["Environment", environment.environment_id],
                ["Objective", environment.objective],
                ["Thread", environment.thread_id],
                ["Status", `${environment.status} / ${environment.mode}`],
                ["Sources", String(environment.source_ids.length)],
                ["Lines", String(environment.lines.length)],
                ["Last update", formatTime(environment.updated_at)],
                ["Last evaluation", environment.latest_evaluation?.summary ?? environment.latest_summary],
              ] as Array<[string, string]>).map(([label, value]: [string, string]) => (
                <div key={label} className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <p className="text-[10px] uppercase text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-xs text-slate-200">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "sources" ? (
            <div className="space-y-2">
              {relevantSources.length === 0 ? <p className="text-xs text-slate-500">No attached live sources.</p> : null}
              {relevantSources.map((source: WorkstationLiveSource) => (
                <div key={source.source_id} className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{source.source_id}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{source.kind} / {source.status} / events {source.event_count ?? 0}</p>
                      <p className="mt-1 text-[11px] text-slate-500">last tick {source.last_tick_index ?? "none"} / {formatTime(source.last_event_ts)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => void setSourceStatus(source.source_id, "pause")} className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200">Pause</button>
                      <button type="button" onClick={() => void setSourceStatus(source.source_id, "resume")} className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200">Resume</button>
                      <button type="button" onClick={() => void setSourceStatus(source.source_id, "stop")} className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200">Stop</button>
                      <button type="button" onClick={() => void setSourceStatus(source.source_id, "reset-counters")} className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-200">Reset</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "line_schema" && environment ? (
            <div className="grid gap-2 md:grid-cols-2">
              {environment.lines.map((line: LiveAnswerLineState) => (
                <div key={line.key} className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-100">{line.label}</p>
                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-400">{line.update_policy} / {line.visibility}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{line.key} / changed {formatTime(line.updated_at)}</p>
                  <p className="mt-1 text-xs text-slate-200">{line.value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "deltas" ? (
            <div className="space-y-2">
              {deltas.slice(-12).reverse().map((delta: LiveAnswerEnvironmentDelta) => (
                <div key={delta.delta_id} className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <p className="text-xs text-slate-200">{delta.reason} / {formatTime(delta.ts)}</p>
                  <p className="mt-1 text-[11px] text-slate-500">changed {delta.changed_line_keys.join(", ") || "status"} / window {delta.window_id ?? "none"} / events {delta.source_event_count ?? "n/a"}</p>
                  <p className="mt-1 break-all text-[10px] text-slate-600">{delta.previous_hash ?? "no previous"} -&gt; {delta.next_hash}</p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "windows" ? (
            <div className="space-y-2">
              {relevantWindows.length === 0 ? <p className="text-xs text-slate-500">No source windows yet.</p> : null}
              {relevantWindows.slice(-12).reverse().map((window: LiveSourceWindowSummary) => (
                <div key={window.window_id} className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <p className="text-xs text-slate-200">{window.window_id}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{window.source_id} / events {window.event_count} / policy {window.policy.emit_line_delta_on}</p>
                  <p className="mt-1 text-[11px] text-slate-600">{formatTime(window.from_ts)} -&gt; {formatTime(window.to_ts)}</p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "commentary" ? (
            <div className="space-y-3">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-100">Live commentary policy</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Commentary is generated from compact deltas and written as validation/tool observations, not answer text.
                    </p>
                  </div>
                  <select
                    value={commentarySession?.cadence ?? "milestones_only"}
                    onChange={(event) => void setCommentaryCadence(event.target.value as LiveCommentaryCadence)}
                    className="rounded border border-cyan-300/20 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
                  >
                    {commentaryCadences.map((cadence: LiveCommentaryCadence) => (
                      <option key={cadence} value={cadence}>{cadence}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Status</p>
                    <p className="mt-1 text-xs text-slate-200">{commentarySession?.status ?? "not configured"}</p>
                  </div>
                  <div className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Voice mode</p>
                    <p className="mt-1 text-xs text-slate-200">{commentarySession?.voice_mode ?? environment?.mode ?? "n/a"}</p>
                  </div>
                  <div className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Last trace</p>
                    <p className="mt-1 break-words text-xs text-slate-200">{commentarySession?.last_commentary_turn_id ?? "none"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {commentaryProposals.length === 0 ? <p className="text-xs text-slate-500">No commentary proposals yet.</p> : null}
                {commentaryCandidates.length > 0 ? (
                  <div className="rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Latest bounded commentary candidate</p>
                    <p className="mt-1 text-xs text-slate-200">{commentaryCandidates[commentaryCandidates.length - 1]?.text}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      decision {commentaryCandidates[commentaryCandidates.length - 1]?.decision} / model_invoked=false / deterministic=true
                    </p>
                  </div>
                ) : null}
                {commentaryProposals.slice(-12).reverse().map((proposal: LiveCommentaryProposal) => {
                  const delivery = commentaryDeliveries.find((entry: LiveCommentaryDeliveryReceipt) => entry.proposal_id === proposal.proposal_id);
                  return (
                    <div key={proposal.proposal_id} className="rounded border border-white/10 bg-slate-950/70 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-100">{proposal.reason} / {proposal.decision}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {proposal.priority} / {proposal.cadence} / model_invoked={String(proposal.model_invoked)}
                          </p>
                        </div>
                        <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">
                          {delivery?.channel ?? "none"} / {delivery?.reason ?? "pending"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-200">{proposal.text}</p>
                      <p className="mt-2 break-words text-[10px] text-slate-600">
                        evidence {proposal.evidence_refs.slice(0, 3).join(", ") || "none"} / raw logs included false
                      </p>
                      {proposal.trace_steps?.length ? (
                        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2">
                          {proposal.trace_steps.map((step: LiveCommentaryTraceStep) => (
                            <div key={step.step_id} className="grid gap-1 rounded border border-white/5 bg-black/20 p-2 md:grid-cols-[120px_1fr]">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${step.status === "completed" ? "bg-cyan-300" : "bg-slate-600"}`} />
                                <span className="text-[10px] uppercase text-slate-500">{step.label}</span>
                              </div>
                              <p className="text-[11px] text-slate-300">{step.summary}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {activeTab === "reviews" ? (
            <div className="space-y-3">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-100">Agentic reviews</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Reviews are explicit compact-context requests. Background results are validation items unless a direct user turn asks for an answer.
                    </p>
                  </div>
                  <button type="button" onClick={() => void requestAgenticReview()} className="rounded border border-cyan-300/30 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-400/10">Run review</button>
                </div>
              </div>
              {reviewRequests.length === 0 && reviewResults.length === 0 ? <p className="text-xs text-slate-500">No review requests yet.</p> : null}
              {reviewRequests.slice(-10).reverse().map((request: LiveAgenticReviewReadEntry) => (
                <div key={request.review_id} className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-xs font-semibold text-slate-100">{request.trigger ?? "review"} / request</p>
                  <p className="mt-1 text-xs text-slate-300">{request.question ?? "Review the latest live environment state."}</p>
                  <p className="mt-2 text-[10px] text-slate-500">compact_context_pack_only / raw logs included false</p>
                </div>
              ))}
              {reviewResults.slice(-10).reverse().map((result: LiveAgenticReviewReadEntry) => (
                <div key={result.review_id} className="rounded border border-cyan-300/20 bg-cyan-950/20 p-3">
                  <p className="text-xs font-semibold text-cyan-100">{result.decision ?? "review_result"}</p>
                  <p className="mt-1 text-xs text-slate-200">{result.summary ?? "Review completed."}</p>
                  <p className="mt-2 text-[10px] text-slate-500">model_invoked={String(result.model_invoked ?? true)} / item role validation unless user-facing</p>
                </div>
              ))}
            </div>
          ) : null}
          {activeTab === "debug" ? (
            <div className="grid gap-2 lg:grid-cols-2">
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <p className="text-[10px] uppercase text-slate-500">Diagnostics</p>
                <p className="mt-2 text-xs text-slate-300">last load: {diagnostics?.last_loaded_at ?? "never"}</p>
                <p className="mt-1 text-xs text-slate-300">fetch error: {diagnostics?.last_fetch_error ?? lastFetchError ?? "none"}</p>
                <p className="mt-1 text-xs text-slate-300">raw logs included: false</p>
                <p className="mt-1 text-xs text-slate-300">context policy: compact_context_pack_only</p>
              </div>
              <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                <p className="text-[10px] uppercase text-slate-500">Recent source events</p>
                <div className="mt-2 space-y-1">
                  {relevantEvents.slice(-8).reverse().map((event: WorkstationLiveSourceEvent) => (
                    <p key={event.event_id} className="break-words text-[11px] text-slate-400">
                      {event.tick_index ?? event.seq} / {event.source_family ?? event.kind} / {event.event_type}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
