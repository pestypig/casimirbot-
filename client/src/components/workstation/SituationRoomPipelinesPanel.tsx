import React from "react";
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Languages,
  Link2,
  ListChecks,
  PauseCircle,
  Play,
  Plus,
  Save,
  ScrollText,
  Sparkles,
  Square,
  Volume2,
  Workflow,
} from "lucide-react";
import { speakVoice } from "@/lib/agi/api";
import { SituationGraphCanvas } from "@/components/workstation/situation-graph/SituationGraphCanvas";
import {
  draftJobFromNaturalLanguage,
  draftJobFromRecipe,
  labelSituationRoomLanguage,
  type DraftSituationRoomJobSpec,
} from "@/lib/helix/situation-room-job-drafts";
import {
  SITUATION_ROOM_JOB_RECIPES,
  getSituationRoomJobRecipe,
  type SituationRoomJobRecipeId,
} from "@/lib/helix/situation-room-job-recipes";
import { cn } from "@/lib/utils";
import { useSituationRoomStore } from "@/store/useSituationRoomStore";
import {
  selectSituationRoomMasterScroll,
  useSituationRoomJobStore,
  type SituationRoomJob,
  type SituationRoomJobInputTextPolicy,
  type SituationRoomJobKind,
  type SituationRoomMasterScrollRow,
  type SituationRoomJobOutputRenderPolicy,
} from "@/store/useSituationRoomJobStore";
import { useSituationRoomGraphStore } from "@/store/useSituationRoomGraphStore";
import { buildSituationStandbyKey, useSituationStandbyStore } from "@/store/useSituationStandbyStore";
import { buildSituationEventSignal } from "@/lib/helix/situation-standby-signals";
import { HELIX_GRAPH_CAPABILITIES } from "@shared/helix-graph-capability";
import { HELIX_SITUATION_GRAPH_RECIPES } from "@shared/helix-situation-graph-recipes";
import type { SituationStandbyMode } from "@shared/helix-situation-standby";

const JOB_OUTPUT_READ_PROVIDER = "elevenlabs";
const JOB_OUTPUT_READ_PROFILE_ID = "vU0dJF9WOwsWEUfX1Aqw";
const JOB_OUTPUT_READ_CHUNK_MAX = 560;
const JOB_OUTPUT_READ_MAX_CHARS = 12_000;

const JOB_KIND_OPTIONS: Array<{ kind: SituationRoomJobKind; label: string }> = [
  { kind: "translate", label: "Translate" },
  { kind: "rolling_summary", label: "Rolling summary" },
  { kind: "action_items", label: "Action items" },
  { kind: "prompt_composer", label: "Prompt composer" },
];

const INPUT_TEXT_POLICY_OPTIONS: Array<{ value: SituationRoomJobInputTextPolicy; label: string }> = [
  { value: "source_text_preferred", label: "Source text first" },
  { value: "transcript_text", label: "Native transcript" },
  { value: "source_text_only", label: "Source text only" },
];

const OUTPUT_RENDER_POLICY_OPTIONS: Array<{ value: SituationRoomJobOutputRenderPolicy; label: string }> = [
  { value: "target_language", label: "Target" },
  { value: "native_language", label: "Native" },
  { value: "dual", label: "Dual" },
];

const LANGUAGE_CHIPS = [
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Japanese", value: "ja" },
  { label: "English", value: "en" },
];

const STANDBY_MODE_OPTIONS: Array<{ value: SituationStandbyMode; label: string }> = [
  { value: "off", label: "Off" },
  { value: "direct_address_only", label: "Direct address" },
  { value: "high_salience", label: "High salience" },
  { value: "translation_mediator", label: "Translation mediator" },
  { value: "game_master", label: "Game master" },
  { value: "research_assistant", label: "Research assistant" },
];

type PipelinePanelPage = "graph" | "recipes" | "capabilities" | "runtime" | "inputs" | "jobs" | "output";

let globalJobOutputReadController: AbortController | null = null;
let globalJobOutputReadAudio: HTMLAudioElement | null = null;
let globalJobOutputReadUrl: string | null = null;

function stopGlobalJobOutputRead() {
  if (globalJobOutputReadController) {
    globalJobOutputReadController.abort();
    globalJobOutputReadController = null;
  }
  if (globalJobOutputReadAudio) {
    globalJobOutputReadAudio.pause();
    globalJobOutputReadAudio.src = "";
    globalJobOutputReadAudio = null;
  }
  if (globalJobOutputReadUrl) {
    URL.revokeObjectURL(globalJobOutputReadUrl);
    globalJobOutputReadUrl = null;
  }
}

function splitSpeechChunks(source: string, maxChars: number): string[] {
  const normalized = source.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  let remaining = normalized;
  while (remaining.length > maxChars) {
    const boundary = Math.max(
      remaining.lastIndexOf(". ", maxChars),
      remaining.lastIndexOf("? ", maxChars),
      remaining.lastIndexOf("! ", maxChars),
      remaining.lastIndexOf("; ", maxChars),
      remaining.lastIndexOf(", ", maxChars),
      remaining.lastIndexOf(" ", maxChars),
    );
    const cut = boundary > Math.floor(maxChars * 0.5) ? boundary + 1 : maxChars;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function playJobOutputAudio(blob: Blob, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Read aloud cancelled.", "AbortError"));
      return;
    }
    const url = URL.createObjectURL(blob);
    globalJobOutputReadUrl = url;
    const audio = new Audio(url);
    globalJobOutputReadAudio = audio;
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      signal.removeEventListener("abort", abort);
      if (globalJobOutputReadAudio === audio) globalJobOutputReadAudio = null;
      if (globalJobOutputReadUrl === url) {
        URL.revokeObjectURL(url);
        globalJobOutputReadUrl = null;
      }
    };
    const abort = () => {
      audio.pause();
      cleanup();
      reject(new DOMException("Read aloud cancelled.", "AbortError"));
    };
    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("Job output audio playback failed."));
    };
    signal.addEventListener("abort", abort, { once: true });
    audio.play().catch((error) => {
      cleanup();
      reject(error);
    });
  });
}

function buildJobOutputSpeechText(job: SituationRoomJob | undefined, rows: SituationRoomMasterScrollRow[]): string {
  const lines = [
    job ? `Job output scroll for ${job.title}.` : "Situation Room job output scroll.",
    ...rows.flatMap((row) => {
      if (!row.text?.trim()) return [];
      const prefix =
        row.kind === "derived"
          ? `${row.event_type} output ${row.output.seq}`
          : `${row.label}${row.chunk_index != null ? ` transcript chunk ${row.chunk_index}` : " transcript"}`;
      return [`${prefix}. ${row.text.trim()}`];
    }),
  ];
  return lines.join("\n").slice(0, JOB_OUTPUT_READ_MAX_CHARS);
}

function formatClock(value?: string): string {
  if (!value) return "not started";
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return value;
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function jobTone(status: SituationRoomJob["status"]): string {
  switch (status) {
    case "completed":
      return "border-emerald-400/50 bg-emerald-500/10 text-emerald-100";
    case "running":
    case "queued":
      return "border-cyan-400/50 bg-cyan-500/10 text-cyan-100";
    case "cancelled":
    case "paused":
      return "border-slate-500/50 bg-slate-700/20 text-slate-300";
    case "error":
      return "border-rose-400/50 bg-rose-500/10 text-rose-100";
    default:
      return "border-amber-400/50 bg-amber-500/10 text-amber-100";
  }
}

function JobCard({
  job,
  selected,
  onSelect,
  onRun,
  onStop,
  onSave,
  onAttach,
}: {
  job: SituationRoomJob;
  selected: boolean;
  onSelect: () => void;
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onAttach: () => void;
}) {
  return (
    <article
      className={cn(
        "rounded-lg border bg-black/20 p-3 transition-colors",
        selected ? "border-cyan-400/70 ring-1 ring-cyan-400/30" : "border-white/10 hover:border-white/25",
      )}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{job.title}</p>
            <p className="mt-1 text-[11px] text-slate-400">
              {job.kind} / outputs {job.output_ids.length}
            </p>
            {job.kind === "translate" ? (
              <p className="mt-1 text-[11px] text-slate-500">
                target {job.target_language ?? "target"} / input {job.input_text_policy} / output{" "}
                {job.output_render_policy}
              </p>
            ) : null}
          </div>
          <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[10px]", jobTone(job.status))}>
            {job.status}
          </span>
        </div>
        <p className="mt-2 break-all text-[10px] text-slate-500">{job.job_spec_hash}</p>
      </button>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRun}
          className="inline-flex items-center gap-1 rounded border border-cyan-400/35 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20"
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
        <button
          type="button"
          onClick={onStop}
          className="inline-flex items-center gap-1 rounded border border-slate-400/35 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          <PauseCircle className="h-3.5 w-3.5" />
          Stop
        </button>
        <button
          type="button"
          onClick={onAttach}
          className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
        >
          <Link2 className="h-3.5 w-3.5" />
          Attach
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1 rounded border border-emerald-400/35 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100 hover:bg-emerald-500/20"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </div>
    </article>
  );
}

export default function SituationRoomPipelinesPanel() {
  const rooms = useSituationRoomStore((state) => state.rooms);
  const roomOrder = useSituationRoomStore((state) => state.room_order);
  const activeRoomId = useSituationRoomStore((state) => state.active_room_id);
  const sources = useSituationRoomStore((state) => state.sources);
  const roomEvents = useSituationRoomStore((state) => state.events);
  const setActiveRoom = useSituationRoomStore((state) => state.setActiveRoom);
  const jobs = useSituationRoomJobStore((state) => state.jobs);
  const jobOrder = useSituationRoomJobStore((state) => state.job_order);
  const outputs = useSituationRoomJobStore((state) => state.outputs);
  const createJob = useSituationRoomJobStore((state) => state.createJob);
  const createJobFromRoom = useSituationRoomJobStore((state) => state.createJobFromRoom);
  const createJobFromSource = useSituationRoomJobStore((state) => state.createJobFromSource);
  const processJobNowAsync = useSituationRoomJobStore((state) => state.processJobNowAsync);
  const stopJob = useSituationRoomJobStore((state) => state.stopJob);
  const saveJobAsNote = useSituationRoomJobStore((state) => state.saveJobAsNote);
  const attachJobToHelixAsk = useSituationRoomJobStore((state) => state.attachJobToHelixAsk);
  const graphs = useSituationRoomGraphStore((state) => state.graphs);
  const activeGraphIdByRoom = useSituationRoomGraphStore((state) => state.active_graph_id_by_room);
  const selectedNodeIdByGraph = useSituationRoomGraphStore((state) => state.selected_node_id_by_graph);
  const createGraph = useSituationRoomGraphStore((state) => state.createGraph);
  const createGraphFromRecipe = useSituationRoomGraphStore((state) => state.createGraphFromRecipe);
  const addGraphNode = useSituationRoomGraphStore((state) => state.addNode);
  const connectGraphNodes = useSituationRoomGraphStore((state) => state.connectNodes);
  const attachGraphToHelixAsk = useSituationRoomGraphStore((state) => state.attachGraphToHelixAsk);
  const setSelectedGraphNode = useSituationRoomGraphStore((state) => state.setSelectedNode);
  const standbyModes = useSituationStandbyStore((state) => state.mode_by_key);
  const standbyProjections = useSituationStandbyStore((state) => state.projection_by_key);
  const standbyGoals = useSituationStandbyStore((state) => state.goals_by_key);
  const standbySignals = useSituationStandbyStore((state) => state.signals_by_key);
  const standbyReceipts = useSituationStandbyStore((state) => state.salience_receipts_by_key);
  const standbyProposals = useSituationStandbyStore((state) => state.interjection_proposals_by_key);
  const setStandbyMode = useSituationStandbyStore((state) => state.setMode);
  const ingestStandbySignal = useSituationStandbyStore((state) => state.ingestSignal);
  const dismissStandbyProposal = useSituationStandbyStore((state) => state.dismissProposal);
  const [panelPage, setPanelPage] = React.useState<PipelinePanelPage>("graph");
  const [selectedSourceId, setSelectedSourceId] = React.useState<string>("__room__");
  const [selectedJobId, setSelectedJobId] = React.useState<string | undefined>();
  const [jobKind, setJobKind] = React.useState<SituationRoomJobKind>("translate");
  const [targetLanguage, setTargetLanguage] = React.useState("es");
  const [nativeLanguage, setNativeLanguage] = React.useState("en");
  const [inputTextPolicy, setInputTextPolicy] =
    React.useState<SituationRoomJobInputTextPolicy>("source_text_preferred");
  const [outputRenderPolicy, setOutputRenderPolicy] =
    React.useState<SituationRoomJobOutputRenderPolicy>("target_language");
  const [selectedRecipeId, setSelectedRecipeId] =
    React.useState<SituationRoomJobRecipeId>("translate_source");
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = React.useState("");
  const [draft, setDraft] = React.useState<DraftSituationRoomJobSpec | null>(null);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [customLanguage, setCustomLanguage] = React.useState("");
  const [isReadingOutput, setIsReadingOutput] = React.useState(false);
  const [readOutputError, setReadOutputError] = React.useState<string | null>(null);
  const [readOutputProgress, setReadOutputProgress] = React.useState<{
    chunkIndex: number;
    chunkCount: number;
  } | null>(null);
  const masterScrollRef = React.useRef<HTMLDivElement | null>(null);
  const masterScrollPinnedRef = React.useRef(true);
  const knownJobIdsRef = React.useRef<Set<string> | null>(null);

  const roomList = React.useMemo(
    () => roomOrder.map((roomId) => rooms[roomId]).filter(Boolean),
    [roomOrder, rooms],
  );
  const activeRoom = activeRoomId ? rooms[activeRoomId] : undefined;
  const activeSources = React.useMemo(
    () => (activeRoom ? activeRoom.source_ids.map((sourceId) => sources[sourceId]).filter(Boolean) : []),
    [activeRoom, sources],
  );
  const activeJobs = React.useMemo(
    () =>
      jobOrder
        .map((jobId) => jobs[jobId])
        .filter((job): job is SituationRoomJob => Boolean(job && job.room_id === activeRoom?.room_id)),
    [activeRoom?.room_id, jobOrder, jobs],
  );
  const masterScroll = React.useMemo(
    () =>
      activeRoom
        ? selectSituationRoomMasterScroll(
            { rooms, events: roomEvents, sources },
            { jobs, outputs },
            activeRoom.room_id,
          ).slice(-160)
        : [],
    [activeRoom, jobs, outputs, roomEvents, rooms, sources],
  );
  const selectedSource = selectedSourceId !== "__room__" ? sources[selectedSourceId] : undefined;
  const selectedJob = selectedJobId ? jobs[selectedJobId] : undefined;
  const activeGraphId = activeRoom?.room_id ? activeGraphIdByRoom[activeRoom.room_id] : undefined;
  const activeGraph = activeGraphId ? graphs[activeGraphId] : null;
  const selectedGraphNodeId = activeGraph ? selectedNodeIdByGraph[activeGraph.graph_id] : undefined;
  const standbyKey = activeRoom ? buildSituationStandbyKey(activeRoom.room_id, activeGraph?.graph_id) : null;
  const activeStandbyMode = standbyKey ? standbyModes[standbyKey] ?? "off" : "off";
  const activeStandbyProjection = standbyKey ? standbyProjections[standbyKey] : undefined;
  const activeStandbyGoals = standbyKey ? standbyGoals[standbyKey] ?? [] : [];
  const activeStandbySignals = standbyKey ? standbySignals[standbyKey] ?? [] : [];
  const activeWorldSignals = activeStandbySignals.filter((signal) => signal.source === "minecraft_event");
  const activeStandbyReceipts = standbyKey ? standbyReceipts[standbyKey] ?? [] : [];
  const activeStandbyProposals = standbyKey ? standbyProposals[standbyKey] ?? [] : [];
  const draftScope = React.useMemo(
    () => ({
      room_id: activeRoom?.room_id ?? "",
      selected_source_id: selectedSource?.source_id,
      source_ids: selectedSource ? [selectedSource.source_id] : [],
      source_label: selectedSource?.label ?? "whole room",
    }),
    [activeRoom?.room_id, selectedSource],
  );
  const focusedMasterScroll = React.useMemo((): SituationRoomMasterScrollRow[] => {
    if (!selectedJob) return masterScroll;
    const selectedOutputs = selectedJob.output_ids.map((outputId) => outputs[outputId]).filter(Boolean);
    const derivedEventIds = new Set(selectedOutputs.flatMap((output) => output.derived_from_event_ids));
    const sourceIds = new Set(selectedJob.source_ids);
    const hasDerivedRefs = derivedEventIds.size > 0;
    return masterScroll.filter((row) => {
      if (row.kind === "derived") return row.job_id === selectedJob.job_id;
      if (hasDerivedRefs) return derivedEventIds.has(row.id);
      if (sourceIds.size === 0) return row.room_id === selectedJob.room_id;
      return Boolean(row.source_id && sourceIds.has(row.source_id));
    });
  }, [masterScroll, outputs, selectedJob]);
  const focusedMasterScrollSignature = React.useMemo(
    () =>
      focusedMasterScroll
        .map((row) => {
          const textSize = row.text?.length ?? 0;
          const outputStatus =
            row.kind === "derived"
              ? `${row.output.meta.translation_status ?? ""}:${row.output.meta.output_language ?? ""}`
              : "";
          return `${row.id}:${row.ts}:${textSize}:${outputStatus}`;
        })
        .join("|"),
    [focusedMasterScroll],
  );

  React.useEffect(() => {
    if (!activeJobs.length || (selectedJobId && jobs[selectedJobId])) return;
    setSelectedJobId(activeJobs[0]?.job_id);
  }, [activeJobs, jobs, selectedJobId]);

  React.useEffect(() => {
    const currentIds = new Set(activeJobs.map((job) => job.job_id));
    if (!knownJobIdsRef.current) {
      knownJobIdsRef.current = currentIds;
      return;
    }
    const newJob = activeJobs.find((job) => !knownJobIdsRef.current?.has(job.job_id));
    knownJobIdsRef.current = currentIds;
    if (!newJob) return;
    setSelectedJobId(newJob.job_id);
    masterScrollPinnedRef.current = true;
    setPanelPage("output");
  }, [activeJobs]);

  React.useLayoutEffect(() => {
    const node = masterScrollRef.current;
    if (!node || !masterScrollPinnedRef.current) return;
    node.scrollTop = node.scrollHeight;
  }, [focusedMasterScrollSignature, panelPage, selectedJobId]);

  React.useEffect(() => () => stopGlobalJobOutputRead(), []);

  const handleMasterScroll = React.useCallback(() => {
    const node = masterScrollRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    masterScrollPinnedRef.current = distanceFromBottom <= 24;
  }, []);

  const stopReadingOutput = React.useCallback(() => {
    stopGlobalJobOutputRead();
    setIsReadingOutput(false);
    setReadOutputProgress(null);
  }, []);

  const handleReadOutput = React.useCallback(async () => {
    const speechText = buildJobOutputSpeechText(selectedJob, focusedMasterScroll);
    if (!speechText.trim()) {
      setReadOutputError("No readable job output is available yet.");
      return;
    }
    stopGlobalJobOutputRead();
    const controller = new AbortController();
    globalJobOutputReadController = controller;
    const chunks = splitSpeechChunks(speechText, JOB_OUTPUT_READ_CHUNK_MAX);
    setIsReadingOutput(true);
    setReadOutputError(null);
    setReadOutputProgress({ chunkIndex: 0, chunkCount: chunks.length });
    try {
      for (let index = 0; index < chunks.length; index += 1) {
        if (controller.signal.aborted) throw new DOMException("Read aloud cancelled.", "AbortError");
        setReadOutputProgress({ chunkIndex: index + 1, chunkCount: chunks.length });
        const response = await speakVoice(
          {
            text: chunks[index],
            mode: "briefing",
            priority: "info",
            provider: JOB_OUTPUT_READ_PROVIDER,
            voice_profile_id: JOB_OUTPUT_READ_PROFILE_ID,
            traceId: selectedJob?.room_id,
            eventId: selectedJob ? `situation-room-job-output-read:${selectedJob.job_id}:${index}` : undefined,
          },
          { signal: controller.signal },
        );
        if (response.kind !== "audio") {
          const message = response.payload.message ?? response.payload.error ?? "Voice provider returned no audio.";
          throw new Error(message);
        }
        await playJobOutputAudio(response.blob, controller.signal);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setReadOutputError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (globalJobOutputReadController === controller) globalJobOutputReadController = null;
      setIsReadingOutput(false);
      setReadOutputProgress(null);
    }
  }, [focusedMasterScroll, selectedJob]);

  const updateDraft = React.useCallback(
    (nextDraft: DraftSituationRoomJobSpec | null) => {
      setDraft(nextDraft);
      if (!nextDraft) return;
      setSelectedRecipeId(nextDraft.recipe_id);
      setJobKind(nextDraft.kind);
      setTargetLanguage(nextDraft.args.target_language ?? "");
      setNativeLanguage(nextDraft.args.native_language ?? "en");
      setInputTextPolicy(nextDraft.args.input_text_policy ?? "transcript_text");
      setOutputRenderPolicy(nextDraft.args.output_render_policy ?? "native_language");
    },
    [],
  );

  const createRecipeDraft = React.useCallback(
    (recipeId: SituationRoomJobRecipeId, overrides: Partial<DraftSituationRoomJobSpec["args"]> = {}) => {
      if (!activeRoom) return;
      const recipe = getSituationRoomJobRecipe(recipeId);
      updateDraft(draftJobFromRecipe(recipe, draftScope, overrides));
    },
    [activeRoom, draftScope, updateDraft],
  );

  const applyLanguageToDraft = React.useCallback(
    (language: string) => {
      setTargetLanguage(language);
      const recipe = getSituationRoomJobRecipe("translate_source");
      updateDraft(
        draftJobFromRecipe(recipe, draftScope, {
          target_language: language,
          native_language: nativeLanguage,
          input_text_policy: inputTextPolicy,
          output_render_policy: outputRenderPolicy,
        }),
      );
    },
    [draftScope, inputTextPolicy, nativeLanguage, outputRenderPolicy, updateDraft],
  );

  const handleNaturalLanguageDraft = React.useCallback(() => {
    if (!activeRoom) return;
    const nextDraft = draftJobFromNaturalLanguage(naturalLanguagePrompt, draftScope);
    updateDraft(nextDraft);
  }, [activeRoom, draftScope, naturalLanguagePrompt, updateDraft]);

  const handleCreateDraftJob = React.useCallback(() => {
    if (!activeRoom || !draft || draft.missing_slots.length > 0) return;
    const job = createJob({
      ...draft.args,
      room_id: activeRoom.room_id,
      source_ids: draft.source_ids,
      chunk_ranges: draft.chunk_ranges,
      status: "queued",
    });
    setSelectedJobId(job.job_id);
    masterScrollPinnedRef.current = true;
    setPanelPage("output");
    void processJobNowAsync(job.job_id);
  }, [activeRoom, createJob, draft, processJobNowAsync]);

  const handleCreateJob = React.useCallback(() => {
    if (!activeRoom) return;
    const input = {
      target_language: jobKind === "translate" ? targetLanguage : undefined,
      native_language: nativeLanguage,
      input_text_policy: inputTextPolicy,
      output_render_policy: outputRenderPolicy,
      attachment_policy: "manual_only" as const,
      context_injection: "explicit_attachment_only" as const,
      command_lane_enabled: false as const,
      status: "queued" as const,
    };
    const job =
      selectedSourceId === "__room__"
        ? createJobFromRoom(activeRoom.room_id, jobKind, input)
        : createJobFromSource(activeRoom.room_id, selectedSourceId, jobKind, input);
    setSelectedJobId(job.job_id);
    masterScrollPinnedRef.current = true;
    setPanelPage("output");
    void processJobNowAsync(job.job_id);
  }, [
    activeRoom,
    createJobFromRoom,
    createJobFromSource,
    jobKind,
    inputTextPolicy,
    nativeLanguage,
    outputRenderPolicy,
    processJobNowAsync,
    selectedSourceId,
    targetLanguage,
  ]);

  const handleCreateGraph = React.useCallback(() => {
    if (!activeRoom) return;
    const graph = createGraph({
      room_id: activeRoom.room_id,
      title: `${activeRoom.title} graph`,
    });
    const sourceNodes = activeSources
      .map((source) =>
        addGraphNode({
          graph_id: graph.graph_id,
          type: source.capture_source === "mic" ? "source.audio.mic" : "source.audio.display",
          title: source.label,
          column: "sources",
          status: source.status === "active" || source.status === "transcribing" ? "active" : "idle",
          subtitle: `${source.capture_source} / ${source.status}`,
          source_id: source.source_id,
          config: {
            capture_session_id: source.capture_session_id,
            chunk_index: source.chunk_index,
          },
        }),
      )
      .filter(Boolean);
    const jobNodes = activeJobs
      .map((job) =>
        addGraphNode({
          graph_id: graph.graph_id,
          type: job.kind === "translate" ? "translate" : "transcript.buffer",
          title: job.title,
          column: "jobs",
          status:
            job.status === "running" || job.status === "queued"
              ? "running"
              : job.status === "completed"
                ? "complete"
                : job.status === "error"
                  ? "error"
                  : "idle",
          subtitle: `${job.kind} / outputs ${job.output_ids.length}`,
          job_id: job.job_id,
          config: {
            attachment_policy: job.attachment_policy,
            context_injection: job.context_injection,
            command_lane_enabled: job.command_lane_enabled,
            target_language: job.target_language,
            native_language: job.native_language,
          },
        }),
      )
      .filter(Boolean);
    const outputNode = addGraphNode({
      graph_id: graph.graph_id,
      type: "output.panel",
      title: "Pipeline output",
      column: "outputs",
      status: activeJobs.some((job) => job.output_ids.length > 0) ? "active" : "idle",
      subtitle: `${activeJobs.reduce((sum, job) => sum + job.output_ids.length, 0)} derived outputs`,
      config: {
        attachment_policy: "manual_only",
      },
    });
    const helixNode = addGraphNode({
      graph_id: graph.graph_id,
      type: "helix.reason",
      title: "Helix Ask context",
      column: "helix",
      status: "idle",
      subtitle: "explicit attachment only",
      config: {
        context_injection: "explicit_attachment_only",
      },
    });
    for (const sourceNode of sourceNodes) {
      if (!sourceNode) continue;
      for (const jobNode of jobNodes) {
        if (!jobNode) continue;
        connectGraphNodes({
          graph_id: graph.graph_id,
          from_node_id: sourceNode.node_id,
          from_port: "transcript",
          to_node_id: jobNode.node_id,
          to_port: "input",
          lane: "transcript",
        });
      }
    }
    for (const jobNode of jobNodes) {
      if (!jobNode || !outputNode) continue;
      connectGraphNodes({
        graph_id: graph.graph_id,
        from_node_id: jobNode.node_id,
        from_port: "output",
        to_node_id: outputNode.node_id,
        to_port: "input",
        lane: jobNode.type === "translate" ? "translation" : "transcript",
      });
    }
    if (outputNode && helixNode) {
      connectGraphNodes({
        graph_id: graph.graph_id,
        from_node_id: outputNode.node_id,
        from_port: "manual_attach",
        to_node_id: helixNode.node_id,
        to_port: "context",
        lane: "context",
      });
    }
    setPanelPage("graph");
  }, [activeJobs, activeRoom, activeSources, addGraphNode, connectGraphNodes, createGraph]);

  const handleCreateGraphRecipe = React.useCallback(
    (recipeId: string) => {
      if (!activeRoom) return;
      const sourceIds = activeSources.map((source) => source.source_id);
      const receipt = createGraphFromRecipe({
        recipe_id: recipeId,
        room_id: activeRoom.room_id,
        source_ids: sourceIds,
        bindings: {
          room_id: activeRoom.room_id,
          source_ids: sourceIds,
          output_mode: "dual",
          monitor_mode: "activity",
          standby_mode: "high_salience",
        },
        title: HELIX_SITUATION_GRAPH_RECIPES.find((recipe) => recipe.recipe_id === recipeId)?.title,
      });
      if (receipt.ok) setPanelPage("graph");
      else setPanelPage("runtime");
    },
    [activeRoom, activeSources, createGraphFromRecipe],
  );

  const handleSeedStandbySignal = React.useCallback(
    (kind: "direct_address" | "risk" | "goal") => {
      if (!activeRoom) return;
      const sourceId = activeSources[0]?.source_id;
      const text =
        kind === "direct_address"
          ? "Helix, what now?"
          : kind === "risk"
            ? "Low health near blaze spawner."
            : "We need blaze rods and entered the fortress.";
      ingestStandbySignal(
        buildSituationEventSignal({
          room_id: activeRoom.room_id,
          graph_id: activeGraph?.graph_id ?? null,
          source_id: sourceId ?? null,
          source: kind === "risk" || kind === "goal" ? "minecraft_event" : "voice_transcript",
          event_type: kind === "risk" ? "damage_taken" : kind === "goal" ? "objective_marker" : "direct_address",
          text,
          evidence_refs: [`standby-demo:${kind}`],
          meta:
            kind === "risk"
              ? { health_delta: { current: 4 }, objective_delta: { status: "blocked" } }
              : kind === "goal"
                ? { objective_delta: { status: "active", label: "collect blaze rods" } }
                : null,
        }),
      );
      setPanelPage("runtime");
    },
    [activeGraph?.graph_id, activeRoom, activeSources, ingestStandbySignal],
  );

  const goBack = () => {
    if (panelPage === "output") setPanelPage("jobs");
    else if (panelPage === "jobs") setPanelPage("inputs");
    else if (panelPage === "inputs") setPanelPage("recipes");
    else if (panelPage === "runtime") setPanelPage("graph");
    else if (panelPage === "capabilities") setPanelPage("recipes");
    else if (panelPage === "recipes") setPanelPage("graph");
  };

  const pageTitle =
    panelPage === "graph"
      ? "Situation Graph"
      : panelPage === "recipes"
        ? "Graph Recipes"
        : panelPage === "capabilities"
          ? "Capabilities"
          : panelPage === "runtime"
            ? "Graph Runtime"
      : panelPage === "inputs"
        ? "Pipeline Inputs"
        : panelPage === "jobs"
          ? "Live Source Jobs"
          : "Job Output Scroll";
  const pageIcon =
    panelPage === "graph" || panelPage === "recipes" || panelPage === "capabilities" || panelPage === "runtime" || panelPage === "inputs" ? <Workflow className="h-4 w-4 text-cyan-300" /> : panelPage === "jobs" ? <ListChecks className="h-4 w-4 text-cyan-300" /> : <ScrollText className="h-4 w-4 text-cyan-300" />;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-950/95 text-slate-100">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {panelPage !== "graph" ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          {pageIcon}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{pageTitle}</p>
            <p className="truncate text-[11px] text-slate-500">
              {activeRoom?.title ?? "No room"} / {selectedSource?.label ?? "whole room"}
              {selectedJob ? ` / ${selectedJob.title}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded border border-white/10 bg-black/20 p-1 text-[11px]">
          {(["graph", "recipes", "capabilities", "runtime", "inputs", "jobs", "output"] as PipelinePanelPage[]).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => {
                if (page === "output" && !selectedJob) return;
                setPanelPage(page);
              }}
              disabled={page === "output" && !selectedJob}
              className={cn(
                "rounded px-2 py-1 capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                panelPage === page ? "bg-cyan-500/20 text-cyan-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              {page}
            </button>
          ))}
        </div>
      </header>

      {panelPage === "graph" ? (
        <SituationGraphCanvas
          graph={activeGraph}
          selectedNodeId={selectedGraphNodeId}
          onCreateGraph={handleCreateGraph}
          onSelectNode={(nodeId) => {
            if (activeGraph) setSelectedGraphNode(activeGraph.graph_id, nodeId);
          }}
          onAttachGraph={() => {
            if (activeGraph) attachGraphToHelixAsk(activeGraph.graph_id);
          }}
        />
      ) : null}

      {panelPage === "recipes" ? (
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-5xl space-y-4">
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Graph Recipes</p>
                  <p className="mt-1 text-xs text-slate-400">Recipes expand into visible nodes, manual-only jobs, and typed execution receipts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelPage("capabilities")}
                  className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                >
                  Capabilities
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {HELIX_SITUATION_GRAPH_RECIPES.map((recipe) => (
                  <button
                    key={recipe.recipe_id}
                    type="button"
                    onClick={() => handleCreateGraphRecipe(recipe.recipe_id)}
                    disabled={!activeRoom}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-cyan-300/50 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <p className="truncate text-sm font-semibold text-white">{recipe.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">{recipe.description}</p>
                    <p className="mt-2 text-[10px] text-slate-500">
                      {recipe.nodes.length} nodes / {recipe.required_bindings.length} required bindings
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </main>
      ) : null}

      {panelPage === "capabilities" ? (
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-5xl">
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Capability Registry</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {HELIX_GRAPH_CAPABILITIES.map((capability) => (
                  <div key={capability.capability_id} className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{capability.title}</p>
                        <p className="mt-1 truncate text-[10px] text-slate-500">{capability.capability_id}</p>
                      </div>
                      <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">
                        {capability.family}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-400">{capability.description}</p>
                    <p className="mt-2 text-[10px] text-slate-500">
                      {capability.execution_mode} / {capability.attachment_policy} / {capability.context_injection}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      ) : null}

      {panelPage === "runtime" ? (
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-5xl space-y-4">
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Runtime Receipts</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Graph</p>
                  <p className="mt-1 text-xl font-semibold text-white">{activeGraph ? 1 : 0}</p>
                </div>
                <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Nodes</p>
                  <p className="mt-1 text-xl font-semibold text-white">{activeGraph?.nodes.length ?? 0}</p>
                </div>
                <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Edges</p>
                  <p className="mt-1 text-xl font-semibold text-white">{activeGraph?.edges.length ?? 0}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Monitor and execution receipts are observations only. Graph runtime does not start capture, inject transcript context, or grant command authority.
              </p>
            </section>
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Standby Salience</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Standby reducers emit typed receipts and proposals; they do not run Helix Ask reasoning.
                  </p>
                </div>
                <select
                  value={activeStandbyMode}
                  disabled={!activeRoom}
                  onChange={(event) => {
                    if (!activeRoom) return;
                    setStandbyMode(activeRoom.room_id, activeGraph?.graph_id ?? null, event.target.value as SituationStandbyMode);
                  }}
                  className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none disabled:opacity-45"
                  aria-label="Standby mode"
                >
                  {STANDBY_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSeedStandbySignal("direct_address")}
                  disabled={!activeRoom}
                  className="rounded border border-cyan-400/35 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Test direct address
                </button>
                <button
                  type="button"
                  onClick={() => handleSeedStandbySignal("risk")}
                  disabled={!activeRoom}
                  className="rounded border border-amber-400/35 bg-amber-500/10 px-2 py-1 text-xs text-amber-100 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Test risk signal
                </button>
                <button
                  type="button"
                  onClick={() => handleSeedStandbySignal("goal")}
                  disabled={!activeRoom}
                  className="rounded border border-emerald-400/35 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Test goal cue
                </button>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">State projection</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {activeStandbyProjection
                      ? `${activeStandbyProjection.window.event_count} signal(s), ${activeStandbyProjection.recent_facts.length} fact(s)`
                      : "No standby signals yet."}
                  </p>
                  {activeStandbyProjection?.world_state ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      health risk: {String(Boolean(activeStandbyProjection.world_state.health_risk))}
                    </p>
                  ) : null}
                </div>
                <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Goal hypotheses</p>
                  {activeStandbyGoals.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">None yet.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {activeStandbyGoals.slice(-3).map((goal) => (
                        <div key={goal.hypothesis_id} className="rounded border border-emerald-400/20 bg-emerald-500/10 p-2">
                          <p className="text-xs font-semibold text-emerald-100">{goal.goal_label}</p>
                          <p className="text-[11px] text-emerald-100/75">
                            {goal.status} / confidence {goal.confidence.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Interjection proposals</p>
                  {activeStandbyProposals.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">None pending.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {activeStandbyProposals.slice(-3).map((proposal) => (
                        <div key={proposal.proposal_id} className="rounded border border-cyan-400/20 bg-cyan-500/10 p-2">
                          <p className="text-xs text-cyan-50">{proposal.text}</p>
                          <div className="mt-2 flex gap-2">
                            <button type="button" className="rounded border border-cyan-300/35 px-2 py-1 text-[11px] text-cyan-100">
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissStandbyProposal(proposal.proposal_id)}
                              className="rounded border border-white/15 px-2 py-1 text-[11px] text-slate-200"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Minecraft / World Events</p>
                  <p className="mt-1 text-xs text-slate-400">
                    World plugin signals are runtime observations; they do not start Helix turns or run game actions.
                  </p>
                </div>
                <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                  {activeWorldSignals.length} event(s)
                </span>
              </div>
              {activeWorldSignals.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">No Minecraft or world-event signals in this graph yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {activeWorldSignals.slice(-5).reverse().map((signal) => (
                    <div key={signal.signal_id} className="rounded border border-white/10 bg-slate-950/70 px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-white">{signal.event_type}</p>
                        <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-slate-300">
                          {signal.actor ?? signal.source_id ?? "world"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">{signal.text ?? "World event received."}</p>
                      <p className="mt-1 break-all text-[10px] text-slate-500">
                        {signal.evidence_refs.length > 0 ? signal.evidence_refs.join(", ") : signal.signal_id}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Salience Receipt Rail</p>
              {activeStandbyReceipts.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No salience decisions yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {activeStandbyReceipts.slice(-6).reverse().map((receipt) => (
                    <div key={receipt.receipt_id} className="rounded border border-white/10 bg-slate-950/70 px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-white">{receipt.reason}</p>
                        <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-slate-300">
                          {receipt.priority} / notify {String(receipt.should_notify_helix)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300">{receipt.summary}</p>
                      <p className="mt-1 break-all text-[10px] text-slate-500">{receipt.dedupe_key}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      ) : null}

      {panelPage === "inputs" ? (
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">Rooms</p>
              <div className="space-y-2">
                {roomList.length === 0 ? (
                  <p className="text-xs text-slate-500">No situation rooms yet.</p>
                ) : (
                  roomList.map((room) => (
                    <button
                      key={room.room_id}
                      type="button"
                      onClick={() => setActiveRoom(room.room_id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                        room.room_id === activeRoomId
                          ? "border-cyan-400/60 bg-cyan-500/15 text-white"
                          : "border-white/10 text-slate-200 hover:bg-white/5",
                      )}
                    >
                      <p className="truncate text-sm font-medium">{room.title}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {room.source_ids.length} source{room.source_ids.length === 1 ? "" : "s"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">Sources</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedSourceId("__room__")}
                  className={cn(
                    "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                    selectedSourceId === "__room__"
                      ? "border-emerald-400/60 bg-emerald-500/15 text-white"
                      : "border-white/10 text-slate-200 hover:bg-white/5",
                  )}
                >
                  <p className="text-sm font-medium">Whole room</p>
                  <p className="mt-1 text-[11px] text-slate-400">Route all selected room evidence into a job.</p>
                </button>
                {activeSources.map((source) => (
                  <button
                    key={source.source_id}
                    type="button"
                    onClick={() => setSelectedSourceId(source.source_id)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                      selectedSourceId === source.source_id
                        ? "border-emerald-400/60 bg-emerald-500/15 text-white"
                        : "border-white/10 text-slate-200 hover:bg-white/5",
                    )}
                  >
                    <p className="truncate text-sm font-medium">{source.label}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {source.status} / chunks {source.chunk_index}
                    </p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPanelPage("jobs")}
                disabled={!activeRoom}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Continue to jobs
              </button>
            </section>
          </div>
        </main>
      ) : null}

      {panelPage === "jobs" ? (
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-5xl space-y-4">
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Recipes</p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {SITUATION_ROOM_JOB_RECIPES.map((recipe) => (
                  <button
                    key={recipe.recipe_id}
                    type="button"
                    onClick={() => createRecipeDraft(recipe.recipe_id)}
                    disabled={!activeRoom}
                    className={cn(
                      "rounded border px-2 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                      selectedRecipeId === recipe.recipe_id
                        ? "border-cyan-400/60 bg-cyan-500/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/25",
                    )}
                  >
                    <p className="truncate text-xs font-semibold text-white">{recipe.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">{recipe.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                <input
                  value={naturalLanguagePrompt}
                  onChange={(event) => setNaturalLanguagePrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleNaturalLanguageDraft();
                  }}
                  placeholder="What should this source/job do?"
                  className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none"
                />
                <button
                  type="button"
                  onClick={handleNaturalLanguageDraft}
                  disabled={!activeRoom || !naturalLanguagePrompt.trim()}
                  className="inline-flex items-center justify-center gap-1 rounded border border-cyan-400/40 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Draft
                </button>
              </div>

              {draft ? (
                <div className="mt-3 rounded-lg border border-cyan-400/25 bg-cyan-500/10 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{draft.title}</p>
                      <p className="mt-1 text-[11px] text-cyan-100/80">
                        Scope: {draft.source_ids.length > 0 ? selectedSource?.label ?? draft.source_ids.join(", ") : "whole room"} / attachment manual only
                      </p>
                      {draft.kind === "translate" ? (
                        <p className="mt-1 text-[11px] text-slate-300">
                          Target: {labelSituationRoomLanguage(draft.args.target_language)} / output {draft.args.output_render_policy ?? "target_language"}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateDraftJob}
                      disabled={draft.missing_slots.length > 0}
                      className="inline-flex items-center justify-center gap-1 rounded border border-cyan-300/45 bg-cyan-400/15 px-2 py-1.5 text-xs text-cyan-50 hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create Job
                    </button>
                  </div>
                  {draft.missing_slots.includes("target_language") ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Languages className="h-3.5 w-3.5 text-cyan-200" />
                      {LANGUAGE_CHIPS.map((chip) => (
                        <button
                          key={chip.value}
                          type="button"
                          onClick={() => applyLanguageToDraft(chip.value)}
                          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-100 hover:bg-white/10"
                        >
                          {chip.label}
                        </button>
                      ))}
                      <input
                        value={customLanguage}
                        onChange={(event) => setCustomLanguage(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && customLanguage.trim()) applyLanguageToDraft(customLanguage.trim());
                        }}
                        placeholder="Custom"
                        className="w-24 rounded border border-white/15 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 outline-none"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <details
                className="mt-3 rounded-lg border border-white/10 bg-black/20"
                open={advancedOpen}
                onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-semibold text-slate-200">
                  Advanced
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen ? "rotate-180" : "")} />
                </summary>
                <div className="border-t border-white/10 p-3">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_110px_110px_auto]">
                    <select value={jobKind} onChange={(event) => setJobKind(event.target.value as SituationRoomJobKind)} className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none">
                      {JOB_KIND_OPTIONS.map((option) => (
                        <option key={option.kind} value={option.kind}>{option.label}</option>
                      ))}
                    </select>
                    <input value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} disabled={jobKind !== "translate"} className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none disabled:opacity-45" aria-label="Target language" />
                    <input value={nativeLanguage} onChange={(event) => setNativeLanguage(event.target.value)} className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none" aria-label="Native language" />
                    <button type="button" onClick={handleCreateJob} disabled={!activeRoom} className="inline-flex items-center justify-center gap-1 rounded border border-cyan-400/40 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45">
                      <Plus className="h-3.5 w-3.5" />
                      Create
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <select value={inputTextPolicy} onChange={(event) => setInputTextPolicy(event.target.value as SituationRoomJobInputTextPolicy)} disabled={jobKind !== "translate"} className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none disabled:opacity-45" aria-label="Translation input text policy">
                      {INPUT_TEXT_POLICY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>Input: {option.label}</option>
                      ))}
                    </select>
                    <select value={outputRenderPolicy} onChange={(event) => setOutputRenderPolicy(event.target.value as SituationRoomJobOutputRenderPolicy)} disabled={jobKind !== "translate"} className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none disabled:opacity-45" aria-label="Translation output render policy">
                      {OUTPUT_RENDER_POLICY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>Output: {option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </details>
            </section>

            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase text-slate-500">Jobs</p>
                {selectedJob ? (
                  <button type="button" onClick={() => { masterScrollPinnedRef.current = true; setPanelPage("output"); }} className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10">
                    <ScrollText className="h-3.5 w-3.5" />
                    View output
                  </button>
                ) : null}
              </div>
              {activeJobs.length === 0 ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-white/15 px-6 text-center text-sm text-slate-400">
                  Create a job to process selected room evidence. Job outputs stay separate until attached or saved.
                </div>
              ) : (
                <div className="grid gap-3 xl:grid-cols-2">
                  {activeJobs.map((job) => (
                    <JobCard
                      key={job.job_id}
                      job={job}
                      selected={job.job_id === selectedJobId}
                      onSelect={() => setSelectedJobId(job.job_id)}
                      onRun={() => {
                        setSelectedJobId(job.job_id);
                        masterScrollPinnedRef.current = true;
                        setPanelPage("output");
                        void processJobNowAsync(job.job_id);
                      }}
                      onStop={() => stopJob(job.job_id)}
                      onSave={() => saveJobAsNote(job.job_id)}
                      onAttach={() => attachJobToHelixAsk(job.job_id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      ) : null}

      {panelPage === "output" ? (
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-white/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ScrollText className="h-4 w-4 text-cyan-300" />
                  {selectedJob ? selectedJob.title : "Master Scroll"}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {selectedJob
                    ? "Job-relative raw evidence and derived outputs, sorted by timestamp and provenance."
                    : "Raw transcript events and derived job outputs, sorted by timestamp and provenance."}
                </p>
              </div>
              {selectedJob ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { masterScrollPinnedRef.current = true; void processJobNowAsync(selectedJob.job_id); }} className="inline-flex items-center gap-1 rounded border border-cyan-400/35 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20">
                    <Play className="h-3.5 w-3.5" />
                    Run
                  </button>
                  <button type="button" onClick={() => attachJobToHelixAsk(selectedJob.job_id)} className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10">
                    <Link2 className="h-3.5 w-3.5" />
                    Attach
                  </button>
                  <button
                    type="button"
                    onClick={isReadingOutput ? stopReadingOutput : handleReadOutput}
                    disabled={focusedMasterScroll.length === 0}
                    className="inline-flex items-center gap-1 rounded border border-violet-300/35 bg-violet-500/10 px-2 py-1 text-xs text-violet-100 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isReadingOutput ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    {isReadingOutput ? "Stop" : "Read aloud"}
                  </button>
                  <button type="button" onClick={() => saveJobAsNote(selectedJob.job_id)} className="inline-flex items-center gap-1 rounded border border-emerald-400/35 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100 hover:bg-emerald-500/20">
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </button>
                </div>
              ) : null}
            </div>
            {isReadingOutput || readOutputError ? (
              <p className={cn("mt-2 text-[11px]", readOutputError ? "text-rose-300" : "text-violet-200")}>
                {readOutputError ??
                  (readOutputProgress
                    ? `Reading job output ${readOutputProgress.chunkIndex}/${readOutputProgress.chunkCount}`
                    : "Reading job output...")}
              </p>
            ) : null}
          </div>
          <div ref={masterScrollRef} onScroll={handleMasterScroll} className="min-h-0 flex-1 overflow-y-auto p-3">
            {focusedMasterScroll.length === 0 ? (
              <p className="text-xs text-slate-500">No raw or derived events for this job yet.</p>
            ) : (
              <div className="mx-auto max-w-4xl space-y-2">
                {focusedMasterScroll.map((row) => (
                  <div key={row.id} className="rounded border border-white/10 bg-black/20 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>{row.kind === "derived" ? "derived" : "raw"} / {row.event_type}</span>
                      <span>{formatClock(row.ts)}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-100">{row.label}</p>
                    {row.text ? <p className="mt-1 text-xs leading-5 text-slate-300">{row.text}</p> : null}
                    {row.kind === "derived" ? (
                      <>
                        <p className="mt-1 text-[10px] text-slate-500">
                          language {String(row.output.meta.output_language ?? row.output.meta.target_language ?? "n/a")} / {String(row.output.meta.output_render_policy ?? "target_language")}
                        </p>
                        <p className="mt-1 break-all text-[10px] text-slate-500">from {row.output.derived_from_event_ids.join(", ")}</p>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-white/10 p-3 text-[11px] text-slate-500">
            <FileText className="mr-1 inline h-3.5 w-3.5" />
            Job output is visible here but only reaches Helix Ask when explicitly attached.
          </div>
        </main>
      ) : null}
    </div>
  );
}
