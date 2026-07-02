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
  MinecraftWorldBindingPanel,
  type MinecraftWorldSourceView,
} from "@/components/workstation/MinecraftWorldBindingPanel";
import SituationRoomSourcesPanel from "@/components/workstation/SituationRoomSourcesPanel";
import { DiscordSessionPanel } from "@/components/workstation/DiscordSessionPanel";
import { LiveAnswerEnvironmentPanel } from "@/components/workstation/LiveAnswerEnvironmentPanel";
import { LiveWorkstationPipelinePanel } from "@/components/workstation/LiveWorkstationPipelinePanel";
import { WorkstationActionTrace } from "@/components/workstation/WorkstationActionTrace";
import {
  dispatchHelixWorkstationActions,
  type HelixWorkstationAction,
} from "@/lib/workstation/workstationActionContract";
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
import { useSituationRoomStore, type SituationRoomSource } from "@/store/useSituationRoomStore";
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
import { useWorkstationActionExecutionStore } from "@/store/useWorkstationActionExecutionStore";
import {
  selectActiveLiveAnswerEnvironment,
  useLiveAnswerEnvironmentStore,
} from "@/store/useLiveAnswerEnvironmentStore";
import { buildSituationEventSignal } from "@/lib/helix/situation-standby-signals";
import { HELIX_GRAPH_CAPABILITIES } from "@shared/helix-graph-capability";
import { HELIX_SITUATION_GRAPH_RECIPES } from "@shared/helix-situation-graph-recipes";
import {
  LIVE_ANSWER_ENVIRONMENT_RECIPES,
  type LiveAnswerEnvironmentRecipe,
} from "@shared/helix-live-answer-recipes";
import type { SituationStandbyMode } from "@shared/helix-situation-standby";
import type { SituationRoomConstructObservation } from "@shared/situation-room-construct-observation";
import type { SituationRoomLiveJobContract } from "@shared/situation-room-live-job-contract";

const JOB_OUTPUT_READ_PROVIDER = "elevenlabs";
const JOB_OUTPUT_READ_PROFILE_ID = "vU0dJF9WOwsWEUfX1Aqw";
const JOB_OUTPUT_READ_CHUNK_MAX = 560;
const JOB_OUTPUT_READ_MAX_CHARS = 12_000;
const ALL_OUTPUT_JOB_ID = "__all_output__";

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

type PipelinePanelPage = "setup" | "constructs" | "sources" | "graph" | "recipes" | "capabilities" | "runtime" | "inputs" | "jobs" | "output";
const PRIMARY_PIPELINE_PANEL_PAGES: PipelinePanelPage[] = ["setup", "constructs", "sources", "jobs", "output", "runtime"];
const PIPELINE_PANEL_PAGE_LABELS: Record<PipelinePanelPage, string> = {
  setup: "Build",
  constructs: "Live Jobs",
  sources: "Sources",
  output: "Outputs",
  runtime: "Debug",
  jobs: "Runs",
  graph: "Graph",
  recipes: "Graph Recipes",
  capabilities: "Capabilities",
  inputs: "Inputs",
};
const CONSTRUCT_PURPOSE_OPTIONS = [
  "Observe",
  "Transcribe",
  "Route-watch",
  "Summarize",
  "Translate",
  "Voice-witness",
] as const;
const CONSTRUCT_SOURCE_OPTIONS = [
  "Browser tab audio",
  "Display audio",
  "Mic",
  "Visual",
  "Minecraft",
  "Manual feed",
] as const;
const CONSTRUCT_RECIPE_OPTIONS = [
  { id: "auntie_dottie_witness", label: "Auntie Dottie witness", purpose: "Voice-witness" },
  { id: "browser_audio_transcriber", label: "Browser audio transcriber", purpose: "Transcribe" },
  { id: "minecraft_route_watcher", label: "Minecraft route watcher", purpose: "Route-watch" },
  { id: "translation_pair", label: "Translation pair", purpose: "Translate" },
  { id: "source_health_watch", label: "Source health watch", purpose: "Observe" },
] as const;
const CONSTRUCT_OUTPUT_OPTIONS = [
  "Live Answer",
  "Transcript stream",
  "Typed commentary",
  "Voice proposal",
  "Route evidence view",
  "Note",
] as const;
const CONSTRUCT_POLICY_OPTIONS = [
  "Witness-only",
  "Voice propose-only",
  "Require confirmation",
  "Bounded worker",
  "No assistant answer",
] as const;
const DOTTIE_DEFAULT_OPERATING_PROMPT =
  "Watch my Minecraft route while I play. Only interrupt for confirmed route drift, missing source data, or direct questions. Keep callouts short and tactical.";

type ConstructBuilderPurpose = (typeof CONSTRUCT_PURPOSE_OPTIONS)[number];
type ConstructBuilderSource = (typeof CONSTRUCT_SOURCE_OPTIONS)[number];
type ConstructBuilderRecipeId = (typeof CONSTRUCT_RECIPE_OPTIONS)[number]["id"];
type ConstructBuilderOutput = (typeof CONSTRUCT_OUTPUT_OPTIONS)[number];
type ConstructBuilderPolicy = (typeof CONSTRUCT_POLICY_OPTIONS)[number];
type LiveJobWorkbenchCard = {
  id: string;
  name: string;
  status: SituationRoomLiveJobContract["runtime_status"] | "receipt_only";
  operatingPrompt: string;
  sources: SituationRoomLiveJobContract["source_requirements"];
  outputs: SituationRoomLiveJobContract["output_bindings"];
  voicePolicy: SituationRoomLiveJobContract["voice_policy"];
  authority: SituationRoomLiveJobContract["authority_policy"]["construct_answer_authority"];
  lastObservation: string;
  diagnostics: SituationRoomLiveJobContract["diagnostics"];
  contract: SituationRoomLiveJobContract | null;
  observation: SituationRoomConstructObservation | null;
  constructIds: string[];
  receipt: Record<string, unknown> | null;
  updatedAt: string;
};
type PipelineSetupIntentKind = "live_answer_environment" | "live_workstation_pipeline" | "source_job" | "situation_graph";
type PipelineSetupIntent = {
  id: string;
  kind: PipelineSetupIntentKind;
  title: string;
  description: string;
  objective: string;
  sourceFamilies: string[];
  transformSummary: string;
  outputSummary: string;
  actionLabel: string;
  recipe?: LiveAnswerEnvironmentRecipe;
  jobKind?: SituationRoomJobKind;
  graphRecipeId?: string;
  custom?: boolean;
};

type PipelineSetupCustomRouteDraft = {
  title: string;
  objective: string;
  kind: PipelineSetupIntentKind;
  sourceFamily: string;
  transformSummary: string;
  outputSummary: string;
};

const PIPELINE_SETUP_CUSTOM_ROUTES_STORAGE_KEY = "situation-room-pipelines:custom-routes:v1";

const PIPELINE_SETUP_SOURCE_FAMILY_OPTIONS = [
  "minecraft_world_events",
  "calculator_series",
  "physics_simulation",
  "browser_audio_transcript",
  "screen_summary",
  "room_source",
  "manual_feed",
];

const PIPELINE_SETUP_SELF_STARTING_SOURCE_FAMILIES = new Set(["calculator_series"]);

const loadCustomSetupIntents = (): PipelineSetupIntent[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PIPELINE_SETUP_CUSTOM_ROUTES_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is PipelineSetupIntent =>
      Boolean(entry && typeof entry.id === "string" && typeof entry.title === "string" && typeof entry.objective === "string"),
    );
  } catch {
    return [];
  }
};

const PIPELINE_SETUP_PIPELINE_INTENTS: PipelineSetupIntent[] = [
  {
    id: "transcript_note",
    kind: "live_workstation_pipeline",
    title: "Transcript to note",
    description: "Summarize sentence/window chunks into a workstation note and compact live lines.",
    objective: "Summarize each sentence from this live browser tab into a note.",
    sourceFamilies: ["browser_audio_transcript"],
    transformSummary: "sentence_summary -> workstation_note",
    outputSummary: "Live answer card plus note sink",
    actionLabel: "Create live note pipeline",
  },
  {
    id: "moral_comparison",
    kind: "live_workstation_pipeline",
    title: "Moral comparison",
    description: "Compare live transcript windows to a philosophy framework without raw transcript injection.",
    objective: "Compare this live transcript to Moral philosophy.",
    sourceFamilies: ["browser_audio_transcript"],
    transformSummary: "sentence_summary -> philosophy_compare",
    outputSummary: "Live comparison lines, optional note sink",
    actionLabel: "Create comparison pipeline",
  },
  {
    id: "methods_note",
    kind: "live_workstation_pipeline",
    title: "Methods note from simulation",
    description: "Write a rolling methods note from simulation or residual windows.",
    objective: "Track this simulation and write a methods note every 20 samples.",
    sourceFamilies: ["physics_simulation"],
    transformSummary: "rolling_summary -> methods_note_writer",
    outputSummary: "Live method lines plus note sink",
    actionLabel: "Create methods pipeline",
  },
];

const PIPELINE_SETUP_SOURCE_JOB_INTENTS: PipelineSetupIntent[] = [
  {
    id: "job_translate",
    kind: "source_job",
    title: "Translate source",
    description: "Create a bounded translation job over selected room/source transcript evidence.",
    objective: "Translate the selected source.",
    sourceFamilies: ["room_source"],
    transformSummary: "translate",
    outputSummary: "Job output scroll, optional Helix Ask attachment",
    actionLabel: "Create translation job",
    jobKind: "translate",
  },
  {
    id: "job_rolling_summary",
    kind: "source_job",
    title: "Rolling summary job",
    description: "Create a supervised rolling summary over selected source chunks.",
    objective: "Create a rolling summary for the selected source.",
    sourceFamilies: ["room_source"],
    transformSummary: "rolling_summary",
    outputSummary: "Job output scroll, optional note",
    actionLabel: "Create summary job",
    jobKind: "rolling_summary",
  },
];

const PIPELINE_SETUP_GRAPH_INTENT: PipelineSetupIntent = {
  id: "graph_minecraft_monitor",
  kind: "situation_graph",
  title: "Minecraft monitor graph",
  description: "Create a visible source/monitor/Helix bridge graph for the Minehut world.",
  objective: "Create or reuse the Minecraft situation monitor graph.",
  sourceFamilies: ["minecraft_world_events"],
  transformSummary: "world events -> salience -> standby receipts",
  outputSummary: "Situation graph and Helix Ask binding",
  actionLabel: "Create monitor graph",
  graphRecipeId: "minecraft_world_monitor",
};

const PIPELINE_SETUP_INTENTS: PipelineSetupIntent[] = [
  ...LIVE_ANSWER_ENVIRONMENT_RECIPES.filter((recipe) => recipe.recipe_id !== "custom_live_answer").map((recipe) => ({
    id: `live:${recipe.recipe_id}`,
    kind: "live_answer_environment" as const,
    title: recipe.recipe_id
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    description: recipe.objective_template,
    objective: recipe.objective_template,
    sourceFamilies: recipe.source_requirements,
    transformSummary: recipe.default_line_schema.map((line) => line.label).slice(0, 4).join(", "),
    outputSummary: "Turn-owned live answer card and compact context pack",
    actionLabel: "Create live answer environment",
    recipe,
  })),
  ...PIPELINE_SETUP_PIPELINE_INTENTS,
  ...PIPELINE_SETUP_SOURCE_JOB_INTENTS,
  PIPELINE_SETUP_GRAPH_INTENT,
];

type SituationThreadBindingView = {
  binding_id: string;
  binding_kind: "room" | "source" | "graph" | "minecraft_world";
  room_id: string;
  source_id?: string | null;
  graph_id?: string | null;
  world_id?: string | null;
  thread_id: string;
  mode: "observe_only" | "standby_receipts";
  append_policy: "salient_only" | "all_receipts_debug";
  updated_at: string;
};

type SituationThreadBindingStatus = {
  ok: boolean;
  message: string;
  reason?: string | null;
};

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

function constructOutputArg(output: ConstructBuilderOutput): string {
  switch (output) {
    case "Live Answer":
      return "live_answer_environment";
    case "Transcript stream":
      return "transcript_stream";
    case "Typed commentary":
      return "typed_commentary";
    case "Voice proposal":
      return "voice_proposal";
    case "Route evidence view":
      return "route_evidence_view";
    case "Note":
      return "note";
    default:
      return "typed_commentary";
  }
}

function sourceLabelForConstruct(source: SituationRoomSource | undefined): string {
  if (!source) return "whole room";
  return `${source.label} / ${source.capture_source}`;
}

function constructTone(status: string): string {
  if (status === "active") return "border-emerald-400/45 bg-emerald-500/10 text-emerald-100";
  if (status === "receipt_only" || status === "planned") return "border-cyan-400/45 bg-cyan-500/10 text-cyan-100";
  if (status === "blocked" || status === "stale") return "border-amber-400/45 bg-amber-500/10 text-amber-100";
  return "border-slate-500/45 bg-slate-700/20 text-slate-300";
}

function asRecordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function isLiveJobContract(value: unknown): value is SituationRoomLiveJobContract {
  return asRecordValue(value)?.schema === "helix.situation_room_live_job_contract.v1";
}

function isConstructObservation(value: unknown): value is SituationRoomConstructObservation {
  return asRecordValue(value)?.schema === "helix.situation_room_construct_observation.v1";
}

function readArtifactFromReceipt(receipt: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  return asRecordValue(receipt?.artifact);
}

function readLiveJobContractFromReceipt(receipt: Record<string, unknown> | null | undefined): SituationRoomLiveJobContract | null {
  const artifact = readArtifactFromReceipt(receipt);
  if (!artifact) return null;
  if (isLiveJobContract(artifact.live_job_contract)) return artifact.live_job_contract;
  const recipeRun = asRecordValue(artifact.recipe_run);
  if (isLiveJobContract(recipeRun?.live_job_contract)) return recipeRun.live_job_contract;
  return null;
}

function readConstructObservationFromReceipt(
  receipt: Record<string, unknown> | null | undefined,
): SituationRoomConstructObservation | null {
  const artifact = readArtifactFromReceipt(receipt);
  if (!artifact) return null;
  if (isConstructObservation(artifact.construct_observation)) return artifact.construct_observation;
  const recipeRun = asRecordValue(artifact.recipe_run);
  if (isConstructObservation(recipeRun?.construct_observation)) return recipeRun.construct_observation;
  return null;
}

function liveJobStatusTone(status: string): string {
  if (status === "active") return "border-emerald-400/50 bg-emerald-500/10 text-emerald-100";
  if (status === "blocked" || status === "stale") return "border-amber-400/50 bg-amber-500/10 text-amber-100";
  if (status === "paused" || status === "stopped") return "border-slate-500/50 bg-slate-700/20 text-slate-300";
  return "border-cyan-400/50 bg-cyan-500/10 text-cyan-100";
}

function sourceRequirementTone(status: SituationRoomLiveJobContract["source_requirements"][number]["status"]): string {
  if (status === "connected") return "border-emerald-400/45 bg-emerald-500/10 text-emerald-100";
  if (status === "missing" || status === "blocked" || status === "stale") return "border-amber-400/45 bg-amber-500/10 text-amber-100";
  return "border-slate-500/45 bg-slate-700/20 text-slate-300";
}

function outputBindingTone(status: SituationRoomLiveJobContract["output_bindings"][number]["status"]): string {
  if (status === "bound") return "border-emerald-400/45 bg-emerald-500/10 text-emerald-100";
  if (status === "blocked" || status === "disabled") return "border-amber-400/45 bg-amber-500/10 text-amber-100";
  return "border-cyan-400/45 bg-cyan-500/10 text-cyan-100";
}

function voicePolicyLabel(policy: SituationRoomLiveJobContract["voice_policy"]): string {
  if (policy === "propose_only") return "proposal only";
  if (policy === "confirm_speak_required") return "confirm required";
  if (policy === "automatic_when_policy_allows") return "automatic by policy";
  return "muted";
}

function authorityPolicyLabel(authority: SituationRoomLiveJobContract["authority_policy"]["construct_answer_authority"]): string {
  if (authority === "witness_only") return "witness-only";
  if (authority === "evidence_only") return "evidence-only";
  return "none";
}

function liveJobLastObservation(observation: SituationRoomConstructObservation | null, contract: SituationRoomLiveJobContract): string {
  const diagnostic = observation?.diagnostics?.[0]?.message ?? contract.diagnostics[0]?.message;
  if (diagnostic) return diagnostic;
  const missing = observation?.missing_inputs?.[0];
  if (missing) return `Waiting for ${missing}.`;
  if (observation?.policy_state?.spoken === false && observation.policy_state.voice_policy !== "muted") {
    return "Voice proposal path is available; no audio has been spoken.";
  }
  return contract.runtime_status === "active" ? "Live job is active." : "Live job is ready for review.";
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
  const actionExecutions = useWorkstationActionExecutionStore((state) => state.executions);
  const actionExecutionOrder = useWorkstationActionExecutionStore((state) => state.order);
  const [panelPage, setPanelPage] = React.useState<PipelinePanelPage>("setup");
  const [setupIntentId, setSetupIntentId] = React.useState("");
  const [setupMode, setSetupMode] = React.useState<"text_only" | "voice_on_confirm" | "critical_voice" | "direct_address_only">("text_only");
  const [setupStatus, setSetupStatus] = React.useState<string | null>(null);
  const [customSetupIntents, setCustomSetupIntents] = React.useState<PipelineSetupIntent[]>(loadCustomSetupIntents);
  const [customRouteDraft, setCustomRouteDraft] = React.useState<PipelineSetupCustomRouteDraft>({
    title: "",
    objective: "",
    kind: "live_workstation_pipeline",
    sourceFamily: "room_source",
    transformSummary: "",
    outputSummary: "",
  });
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
  const [bindingThreadId, setBindingThreadId] = React.useState("helix-ask:desktop");
  const [bindingWorldId, setBindingWorldId] = React.useState("minecraft:minehut");
  const [bindingStatus, setBindingStatus] = React.useState<SituationThreadBindingStatus | null>(null);
  const [threadBindings, setThreadBindings] = React.useState<SituationThreadBindingView[]>([]);
  const [worldSourcesSeen, setWorldSourcesSeen] = React.useState<MinecraftWorldSourceView[]>([]);
  const [bindingBusy, setBindingBusy] = React.useState(false);
  const [constructPurpose, setConstructPurpose] = React.useState<ConstructBuilderPurpose>("Voice-witness");
  const [constructSource, setConstructSource] = React.useState<ConstructBuilderSource>("Browser tab audio");
  const [constructRecipeId, setConstructRecipeId] =
    React.useState<ConstructBuilderRecipeId>("auntie_dottie_witness");
  const [constructOutput, setConstructOutput] = React.useState<ConstructBuilderOutput>("Typed commentary");
  const [constructOperatingPrompt, setConstructOperatingPrompt] = React.useState(DOTTIE_DEFAULT_OPERATING_PROMPT);
  const [constructPolicies, setConstructPolicies] = React.useState<Record<ConstructBuilderPolicy, boolean>>({
    "Witness-only": true,
    "Voice propose-only": true,
    "Require confirmation": true,
    "Bounded worker": false,
    "No assistant answer": true,
  });
  const [constructBuilderStatus, setConstructBuilderStatus] = React.useState<string | null>(null);
  const [selectedLiveJobId, setSelectedLiveJobId] = React.useState<string | null>(null);
  const [liveJobPromptDraft, setLiveJobPromptDraft] = React.useState("");
  const [liveJobActionStatus, setLiveJobActionStatus] = React.useState<string | null>(null);
  const activeLiveAnswerEnvironment = useLiveAnswerEnvironmentStore((state) =>
    selectActiveLiveAnswerEnvironment(state, bindingThreadId.trim() || "helix-ask:desktop"),
  );
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
  const selectedJob = selectedJobId && selectedJobId !== ALL_OUTPUT_JOB_ID ? jobs[selectedJobId] : undefined;
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
  const minecraftSourceId = activeSources.find((source) => source.source_id === "source:minecraft-server")?.source_id
    ?? activeWorldSignals.at(-1)?.source_id
    ?? activeSources[0]?.source_id
    ?? "source:minecraft-server";
  const detectedMinecraftSource = React.useMemo(
    () =>
      worldSourcesSeen.find((source) => source.room_id === activeRoom?.room_id && source.world_id === bindingWorldId) ??
      worldSourcesSeen.find((source) => source.world_id === bindingWorldId) ??
      worldSourcesSeen.find((source) => source.source_id === "source:minecraft-server") ??
      worldSourcesSeen[0] ??
      null,
    [activeRoom?.room_id, bindingWorldId, worldSourcesSeen],
  );
  const activeThreadBinding = React.useMemo(() => {
    if (!activeRoom) return null;
    return (
      threadBindings.find((binding) => activeGraph?.graph_id && binding.graph_id === activeGraph.graph_id) ??
      threadBindings.find((binding) => binding.source_id === minecraftSourceId) ??
      threadBindings.find((binding) => binding.world_id === bindingWorldId) ??
      threadBindings.find((binding) => binding.room_id === activeRoom.room_id) ??
      null
    );
  }, [activeGraph?.graph_id, activeRoom, bindingWorldId, minecraftSourceId, threadBindings]);
  const setupIntents = React.useMemo(
    () => [...PIPELINE_SETUP_INTENTS, ...customSetupIntents],
    [customSetupIntents],
  );
  const setupIntent = React.useMemo(
    () => setupIntents.find((intent) => intent.id === setupIntentId) ?? null,
    [setupIntentId, setupIntents],
  );
  const setupObjective = setupIntent?.objective || "No active setup proposal. Ask Helix Ask to create a live workflow, or choose a saved template under Advanced.";
  const setupActualSourceIds = React.useMemo(() => {
    if (!setupIntent) return [];
    if (setupIntent.sourceFamilies.includes("minecraft_world_events")) {
      const detectedSourceId =
        detectedMinecraftSource?.source_id ??
        activeSources.find((source) => source.source_id === "source:minecraft-server")?.source_id ??
        activeWorldSignals.at(-1)?.source_id;
      return detectedSourceId ? [detectedSourceId] : [];
    }
    if (setupIntent.sourceFamilies.includes("room_source")) {
      return selectedSource ? [selectedSource.source_id] : activeSources.map((source) => source.source_id);
    }
    return selectedSource ? [selectedSource.source_id] : [];
  }, [activeSources, activeWorldSignals, detectedMinecraftSource?.source_id, selectedSource, setupIntent]);
  const setupNeedsExistingSource = React.useMemo(
    () =>
      Boolean(
        setupIntent?.sourceFamilies.some((family) => !PIPELINE_SETUP_SELF_STARTING_SOURCE_FAMILIES.has(family)),
      ),
    [setupIntent],
  );
  const setupMissingFields = React.useMemo(() => {
    if (!setupIntent) return [];
    const missing: string[] = [];
    if (!activeRoom?.room_id) missing.push("active room");
    if (setupNeedsExistingSource && setupActualSourceIds.length === 0) {
      missing.push(`${setupIntent?.sourceFamilies.join(" or ") || "required"} source`);
    }
    if (setupIntent?.kind === "situation_graph" && !setupIntent.graphRecipeId) missing.push("graph recipe");
    return missing;
  }, [activeRoom?.room_id, setupActualSourceIds.length, setupIntent, setupNeedsExistingSource]);
  const setupToolActions = React.useMemo((): HelixWorkstationAction[] => {
    if (!setupIntent) return [];
    const threadId = bindingThreadId.trim() || "helix-ask:desktop";
    const roomId = activeRoom?.room_id;
    if (setupIntent.kind === "live_answer_environment") {
      const args: Record<string, unknown> = {
        thread_id: threadId,
        objective: setupObjective,
        room_id: roomId,
        source_ids: setupActualSourceIds,
        graph_id: activeGraph?.graph_id,
        preset: setupIntent.recipe?.recipe_id ?? (setupIntent.custom ? "custom" : undefined),
        line_schema: setupIntent.recipe?.default_line_schema,
        mode: setupMode,
      };
      const actions: HelixWorkstationAction[] = [
        {
          action: "run_panel_action",
          panel_id: "situation-room-pipelines",
          action_id: "create_live_answer_environment",
          args,
        },
      ];
      if (setupIntent.recipe?.recipe_id === "calculator_prime_stream") {
        actions.push({
          action: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "start_prime_stream",
          args: {
            source_id: "source:calculator-prime-stream",
            tick_rate_ms: 1000,
            max_ticks: 100,
            start: 2,
          },
        });
      }
      if (setupIntent.recipe?.recipe_id === "minecraft_run_monitor") {
        actions.push({
          action: "run_panel_action",
          panel_id: "situation-room-pipelines",
          action_id: "attach_standby_to_helix_thread",
          args: {
            thread_id: threadId,
            room_id: detectedMinecraftSource?.room_id ?? roomId,
            source_id: detectedMinecraftSource?.source_id ?? minecraftSourceId,
            world_id: detectedMinecraftSource?.world_id ?? bindingWorldId,
            graph_id: activeGraph?.graph_id,
          },
        });
      }
      return actions;
    }
    if (setupIntent.kind === "live_workstation_pipeline") {
      return [
        {
          action: "run_panel_action",
          panel_id: "situation-room-pipelines",
          action_id: "create_live_workstation_pipeline",
          args: {
            thread_id: threadId,
            objective: setupObjective,
            source_ids: setupActualSourceIds,
            mode: setupMode,
          },
        },
      ];
    }
    if (setupIntent.kind === "source_job") {
      return [
        {
          action: "run_panel_action",
          panel_id: "situation-room-pipelines",
          action_id: "create_job",
          args: {
            room_id: roomId,
            source_ids: setupActualSourceIds,
            kind: setupIntent.jobKind ?? "rolling_summary",
            target_language: targetLanguage,
            native_language: nativeLanguage,
            input_text_policy: inputTextPolicy,
            output_render_policy: outputRenderPolicy,
            attachment_policy: "manual_only",
            context_injection: "explicit_attachment_only",
            command_lane_enabled: false,
          },
        },
      ];
    }
    if (setupIntent.kind === "situation_graph") {
      return [
        {
          action: "run_panel_action",
          panel_id: "situation-room-pipelines",
          action_id: "create_graph_from_recipe",
          args: {
            room_id: activeRoom?.room_id,
            recipe_id: setupIntent.graphRecipeId,
            source_ids: setupActualSourceIds,
            title: setupIntent.title,
          },
        },
      ];
    }
    return [];
  }, [
    activeGraph?.graph_id,
    activeRoom?.room_id,
    bindingThreadId,
    bindingWorldId,
    detectedMinecraftSource,
    inputTextPolicy,
    minecraftSourceId,
    nativeLanguage,
    outputRenderPolicy,
    selectedSource,
    setupActualSourceIds,
    setupIntent,
    setupObjective,
    setupMode,
    targetLanguage,
  ]);
  const setupCanStart = setupToolActions.length > 0 && setupMissingFields.length === 0;
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
  const constructSourceIds = React.useMemo(
    () => (selectedSource ? [selectedSource.source_id] : activeSources.map((source) => source.source_id)),
    [activeSources, selectedSource],
  );
  const activeLiveAnswerEnvironmentId = activeLiveAnswerEnvironment?.environment_id ?? null;
  const liveAnswerBindingLabel = activeLiveAnswerEnvironmentId
    ? `live_answer_environment:${activeLiveAnswerEnvironmentId}`
    : "live_answer_environment:planned";
  const constructCards = React.useMemo(() => {
    const cards: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
      source: string;
      output: string;
      detail: string;
      authority: string;
    }> = [
      {
        id: "construct:dottie",
        title: "Auntie Dottie",
        type: "observer",
        status: activeStandbyMode === "off" ? "receipt_only" : "active",
        source: activeThreadBinding?.thread_id ? `Helix Ask ${activeThreadBinding.thread_id}` : "Helix Ask public commentary",
        output: `typed_commentary + voice_proposal${activeLiveAnswerEnvironmentId ? " + live_answer_environment" : ""}`,
        detail: `voice ${constructPolicies["Voice propose-only"] ? "propose_only" : "off"}`,
        authority: "witness_only",
      },
    ];
    activeJobs.forEach((job) => {
      cards.push({
        id: `construct:job:${job.job_id}`,
        title: job.kind === "translate" ? "Translation Pair" : job.kind === "rolling_summary" ? "Live Source Summarizer" : job.title,
        type: job.kind === "translate" ? "translation_pair" : "transcription_job",
        status: job.status === "running" || job.status === "queued" ? "active" : job.status === "completed" ? "completed" : "planned",
        source: job.source_ids.length ? job.source_ids.join(", ") : "whole room",
        output: job.kind === "translate" ? "note + transcript_stream" : "transcript_stream",
        detail: job.title,
        authority: "evidence_only",
      });
    });
    if (activeGraph) {
      cards.push({
        id: `construct:graph:${activeGraph.graph_id}`,
        title: "Minecraft Route Watcher",
        type: "route_evidence_view",
        status: activeStandbyMode === "off" ? "planned" : "active",
        source: detectedMinecraftSource?.source_id ?? minecraftSourceId,
        output: `route_evidence_view + ${liveAnswerBindingLabel}`,
        detail: `${activeGraph.nodes.length} nodes / ${activeGraph.edges.length} edges`,
        authority: "evidence_only",
      });
    }
    return cards;
  }, [
    activeGraph,
    activeJobs,
    activeStandbyMode,
    activeThreadBinding?.thread_id,
    activeLiveAnswerEnvironmentId,
    constructPolicies,
    detectedMinecraftSource?.source_id,
    minecraftSourceId,
    liveAnswerBindingLabel,
  ]);
  const liveJobCards = React.useMemo((): LiveJobWorkbenchCard[] => {
    const latestByContract = new Map<string, LiveJobWorkbenchCard>();
    for (const executionId of actionExecutionOrder) {
      const execution = actionExecutions[executionId];
      if (!execution?.receipt) continue;
      const contract = readLiveJobContractFromReceipt(execution.receipt);
      if (!contract) continue;
      const observation = readConstructObservationFromReceipt(execution.receipt);
      const id = contract.contract_id;
      if (latestByContract.has(id)) continue;
      latestByContract.set(id, {
        id,
        name: contract.name,
        status: contract.runtime_status,
        operatingPrompt: contract.operating_prompt,
        sources: contract.source_requirements,
        outputs: contract.output_bindings,
        voicePolicy: contract.voice_policy,
        authority: contract.authority_policy.construct_answer_authority,
        lastObservation: liveJobLastObservation(observation, contract),
        diagnostics: contract.diagnostics,
        contract,
        observation,
        constructIds: observation?.construct_ids ?? [],
        receipt: execution.receipt,
        updatedAt: execution.updated_at,
      });
    }
    const cards = Array.from(latestByContract.values());
    const hasDottie = cards.some((card) => /dottie/i.test(card.name) || card.contract?.selected_recipe === "auntie_dottie_witness");
    if (!hasDottie) {
      const sourceStatus = detectedMinecraftSource ? "connected" : "unknown";
      cards.push({
        id: "draft:auntie_dottie_witness",
        name: "Auntie Dottie Minecraft Watch",
        status: "receipt_only",
        operatingPrompt: constructOperatingPrompt,
        sources: [
          {
            source_kind: "minecraft_world_events",
            required: true,
            status: sourceStatus,
            binding_id: detectedMinecraftSource?.source_id,
            missing_reason: detectedMinecraftSource ? undefined : "Connect the Minecraft plugin before route watching can become active.",
          },
          {
            source_kind: "mic_audio",
            required: false,
            status: activeSources.some((source) => /mic|audio/i.test(`${source.capture_source} ${source.label}`)) ? "connected" : "unknown",
          },
          {
            source_kind: "screen_capture",
            required: false,
            status: activeSources.some((source) => /screen|visual|display/i.test(`${source.capture_source} ${source.label}`)) ? "connected" : "unknown",
          },
        ],
        outputs: [
          { output_kind: "typed_commentary", status: "planned", policy: { authority: "evidence_only" } },
          { output_kind: "route_evidence", status: detectedMinecraftSource ? "planned" : "blocked", policy: { source_required: true } },
          { output_kind: "voice_proposal", status: "planned", policy: { voice_policy: "propose_only" } },
          { output_kind: "live_answers_card", status: activeLiveAnswerEnvironmentId ? "bound" : "planned", policy: { projection_only: true } },
        ],
        voicePolicy: "propose_only",
        authority: "witness_only",
        lastObservation: detectedMinecraftSource
          ? "Draft is ready to create as a receipt-backed live job."
          : "Minecraft source is not connected; route watching would start blocked.",
        diagnostics: detectedMinecraftSource
          ? []
          : [{
              code: "minecraft_source_missing",
              severity: "warning",
              message: "Minecraft world events are required before route watching can become active.",
              repair_action: "attach_source",
            }],
        contract: null,
        observation: null,
        constructIds: [],
        receipt: null,
        updatedAt: new Date(0).toISOString(),
      });
    }
    return cards;
  }, [
    actionExecutionOrder,
    actionExecutions,
    activeLiveAnswerEnvironmentId,
    activeSources,
    constructOperatingPrompt,
    detectedMinecraftSource,
  ]);
  const selectedLiveJob = React.useMemo(
    () => liveJobCards.find((card) => card.id === selectedLiveJobId) ?? liveJobCards[0] ?? null,
    [liveJobCards, selectedLiveJobId],
  );

  React.useEffect(() => {
    if (!selectedLiveJob) {
      setSelectedLiveJobId(null);
      return;
    }
    if (selectedLiveJobId !== selectedLiveJob.id) setSelectedLiveJobId(selectedLiveJob.id);
  }, [selectedLiveJob, selectedLiveJobId]);

  React.useEffect(() => {
    if (!selectedLiveJob) return;
    setLiveJobPromptDraft(selectedLiveJob.operatingPrompt);
  }, [selectedLiveJob?.id, selectedLiveJob?.operatingPrompt]);

  React.useEffect(() => {
    if (!activeJobs.length || selectedJobId === ALL_OUTPUT_JOB_ID || (selectedJobId && jobs[selectedJobId])) return;
    setSelectedJobId(activeJobs[0]?.job_id);
  }, [activeJobs, jobs, selectedJobId]);

  React.useEffect(() => {
    if (constructRecipeId === "auntie_dottie_witness" && !constructOperatingPrompt.trim()) {
      setConstructOperatingPrompt(DOTTIE_DEFAULT_OPERATING_PROMPT);
    }
    if (constructRecipeId === "browser_audio_transcriber" && !constructOperatingPrompt.trim()) {
      setConstructOperatingPrompt("Transcribe the selected browser or display audio into evidence. Do not answer for the user.");
    }
  }, [constructOperatingPrompt, constructRecipeId]);

  const loadThreadBindings = React.useCallback(async () => {
    try {
      const response = await fetch("/api/agi/situation/thread-binding/list");
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok || !Array.isArray(payload.bindings)) return;
      setThreadBindings(payload.bindings as SituationThreadBindingView[]);
    } catch {
      // Runtime diagnostics should never block the panel.
    }
  }, []);

  const loadWorldSourcesSeen = React.useCallback(async () => {
    try {
      const response = await fetch("/api/agi/situation/world-event/sources");
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok || !Array.isArray(payload.sources)) return;
      setWorldSourcesSeen(payload.sources as MinecraftWorldSourceView[]);
    } catch {
      // Runtime diagnostics should never block the panel.
    }
  }, []);

  React.useEffect(() => {
    if (panelPage !== "runtime") return;
    void loadThreadBindings();
    void loadWorldSourcesSeen();
  }, [loadThreadBindings, loadWorldSourcesSeen, panelPage]);

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

  const handleAttachThreadBinding = React.useCallback(
    async (target: "room" | "source" | "graph" | "detected_source") => {
      if (!activeRoom) return;
      const threadId = bindingThreadId.trim();
      if (!threadId) {
        setBindingStatus({ ok: false, message: "Thread id is required before attaching standby receipts." });
        return;
      }
      const useDetected = target === "detected_source" && detectedMinecraftSource;
      const roomId = useDetected ? detectedMinecraftSource.room_id : activeRoom.room_id;
      const sourceId = useDetected ? detectedMinecraftSource.source_id : minecraftSourceId;
      const worldId = useDetected ? detectedMinecraftSource.world_id : bindingWorldId.trim() || "minecraft:minehut";
      setBindingBusy(true);
      setBindingStatus(null);
      const body = {
        room_id: roomId,
        source_id: target === "source" || target === "detected_source" ? sourceId : undefined,
        graph_id: target === "graph" ? activeGraph?.graph_id : undefined,
        world_id: target === "source" || target === "detected_source" ? worldId : undefined,
        thread_id: threadId,
        mode: "standby_receipts",
        append_policy: "salient_only",
      };
      try {
        const response = await fetch("/api/agi/situation/thread-binding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          setBindingStatus({
            ok: false,
            message: payload?.message ?? payload?.error ?? "Could not attach standby receipts.",
            reason: payload?.error ?? null,
          });
        } else {
          setBindingStatus({ ok: true, message: payload.message ?? "Standby receipts attached to Helix Ask." });
          await loadThreadBindings();
        }
      } catch {
        setBindingStatus({ ok: false, message: "Could not reach the thread-binding endpoint." });
      } finally {
        setBindingBusy(false);
      }
    },
    [activeGraph?.graph_id, activeRoom, bindingThreadId, bindingWorldId, detectedMinecraftSource, loadThreadBindings, minecraftSourceId],
  );

  const handleDetachThreadBinding = React.useCallback(async () => {
    if (!activeThreadBinding) return;
    setBindingBusy(true);
    setBindingStatus(null);
    try {
      const response = await fetch(`/api/agi/situation/thread-binding/${encodeURIComponent(activeThreadBinding.binding_id)}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setBindingStatus({ ok: false, message: payload?.message ?? "Could not detach standby receipts." });
      } else {
        setBindingStatus({ ok: true, message: "Standby receipt binding detached." });
        await loadThreadBindings();
      }
    } catch {
      setBindingStatus({ ok: false, message: "Could not reach the thread-binding endpoint." });
    } finally {
      setBindingBusy(false);
    }
  }, [activeThreadBinding, loadThreadBindings]);

  const handleRunSetup = React.useCallback(() => {
    if (!setupIntent || setupToolActions.length === 0) {
      setSetupStatus("No setup action is available for the selected path.");
      return;
    }
    if (setupMissingFields.length > 0) {
      setSetupStatus(`Missing required field${setupMissingFields.length === 1 ? "" : "s"}: ${setupMissingFields.join(", ")}.`);
      return;
    }
    dispatchHelixWorkstationActions(setupToolActions);
    setSetupStatus(
      `Submitted ${setupToolActions.length} workstation action${setupToolActions.length === 1 ? "" : "s"} for ${setupIntent.title}.`,
    );
    setPanelPage(setupIntent.kind === "source_job" ? "jobs" : "output");
  }, [setupIntent, setupMissingFields, setupToolActions]);

  const handleCreateConstruct = React.useCallback(() => {
    if (!activeRoom) {
      setConstructBuilderStatus("Choose or create a Situation Room before building a construct.");
      return;
    }
    if (constructSourceIds.length === 0 && constructRecipeId !== "auntie_dottie_witness") {
      setConstructBuilderStatus("Attach a source before building this construct recipe.");
      return;
    }
    const action: HelixWorkstationAction = {
      action: "run_panel_action",
      panel_id: "situation-room-pipelines",
      action_id: "construct.create_from_recipe",
      args: {
        recipe_id: constructRecipeId,
        thread_id: bindingThreadId.trim() || "helix-ask:desktop",
        room_id: activeRoom.room_id,
        source_ids: constructSourceIds,
        target_run_id: "run:helix-ask:active",
        mode: constructPurpose.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        operating_prompt: constructOperatingPrompt.trim() || DOTTIE_DEFAULT_OPERATING_PROMPT,
        voice_mode: constructPolicies["Voice propose-only"] ? "propose_only" : "off",
        commentary_cadence: "milestones_only",
        output: constructOutputArg(constructOutput),
        environment_id: constructOutputArg(constructOutput) === "live_answer_environment"
          ? activeLiveAnswerEnvironmentId
          : null,
      },
    };
    dispatchHelixWorkstationActions([action]);
    setConstructBuilderStatus(`Submitted ${CONSTRUCT_RECIPE_OPTIONS.find((recipe) => recipe.id === constructRecipeId)?.label ?? constructRecipeId}.`);
    setPanelPage("constructs");
  }, [
    activeRoom,
    activeLiveAnswerEnvironmentId,
    bindingThreadId,
    constructOutput,
    constructOperatingPrompt,
    constructPolicies,
    constructPurpose,
    constructRecipeId,
    constructSourceIds,
  ]);

  const dispatchLiveJobConstructAction = React.useCallback(
    (actionId: string, constructId: string | undefined, extraArgs?: Record<string, unknown>) => {
      if (!constructId || !activeRoom) {
        setLiveJobActionStatus("This live job needs a receipt-backed construct before that action can run.");
        return;
      }
      dispatchHelixWorkstationActions([{
        action: "run_panel_action",
        panel_id: "situation-room-pipelines",
        action_id: actionId,
        args: {
          construct_id: constructId,
          room_id: activeRoom.room_id,
          thread_id: bindingThreadId.trim() || "helix-ask:desktop",
          ...extraArgs,
        },
      }]);
      setLiveJobActionStatus(`Submitted ${actionId} for ${constructId}.`);
    },
    [activeRoom, bindingThreadId],
  );

  const handleStartLiveJob = React.useCallback((job: LiveJobWorkbenchCard) => {
    dispatchLiveJobConstructAction("construct.activate", job.constructIds[0]);
  }, [dispatchLiveJobConstructAction]);

  const handleStopLiveJob = React.useCallback((job: LiveJobWorkbenchCard) => {
    dispatchLiveJobConstructAction("construct.detach", job.constructIds[0]);
  }, [dispatchLiveJobConstructAction]);

  const handleAttachSelectedSourceToLiveJob = React.useCallback((job: LiveJobWorkbenchCard) => {
    const sourceIds = selectedSource ? [selectedSource.source_id] : constructSourceIds;
    dispatchLiveJobConstructAction("construct.attach_source", job.constructIds[0], { source_ids: sourceIds });
  }, [constructSourceIds, dispatchLiveJobConstructAction, selectedSource]);

  const handleSaveLiveJobPrompt = React.useCallback((job: LiveJobWorkbenchCard) => {
    if (!job.contract) {
      setConstructOperatingPrompt(liveJobPromptDraft);
      setLiveJobActionStatus("Updated the builder prompt. Create the live job to record it as a receipt-backed contract.");
      return;
    }
    dispatchHelixWorkstationActions([{
      action: "run_panel_action",
      panel_id: "situation-room-pipelines",
      action_id: "construct.set_operating_prompt",
      args: {
        contract_id: job.contract.contract_id,
        operating_prompt: liveJobPromptDraft,
        thread_id: bindingThreadId.trim() || "helix-ask:desktop",
        room_id: activeRoom?.room_id,
        reason: "operator_edited_live_job_prompt",
      },
    }]);
    setLiveJobActionStatus("Submitted operating prompt update as an observation-only action.");
  }, [activeRoom?.room_id, bindingThreadId, liveJobPromptDraft]);

  const handleConfirmSpeakLiveJob = React.useCallback((job: LiveJobWorkbenchCard) => {
    dispatchHelixWorkstationActions([{
      action: "run_panel_action",
      panel_id: "situation-room-pipelines",
      action_id: "voice_delivery.confirm_speak",
      args: {
        thread_id: bindingThreadId.trim() || "helix-ask:desktop",
        contract_id: job.contract?.contract_id,
        spoken_text: job.lastObservation,
      },
    }]);
    setLiveJobActionStatus("Submitted confirm-speak receipt for the selected live job.");
  }, [bindingThreadId]);

  const persistCustomSetupIntents = React.useCallback((nextIntents: PipelineSetupIntent[]) => {
    setCustomSetupIntents(nextIntents);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PIPELINE_SETUP_CUSTOM_ROUTES_STORAGE_KEY, JSON.stringify(nextIntents));
    }
  }, []);

  const handleCreateCustomRoute = React.useCallback(() => {
    const title = customRouteDraft.title.trim();
    const objective = customRouteDraft.objective.trim();
    if (!title || !objective) {
      setSetupStatus("Custom route needs a title and objective.");
      return;
    }
    const route: PipelineSetupIntent = {
      id: `custom:${Date.now()}`,
      kind: customRouteDraft.kind,
      title,
      description: objective,
      objective,
      sourceFamilies: customRouteDraft.sourceFamily ? [customRouteDraft.sourceFamily] : [],
      transformSummary: customRouteDraft.transformSummary.trim() || "Prompt-selected transform",
      outputSummary: customRouteDraft.outputSummary.trim() || "Prompt-selected output",
      actionLabel:
        customRouteDraft.kind === "live_answer_environment"
          ? "Create live answer environment"
          : customRouteDraft.kind === "source_job"
            ? "Create source job"
            : customRouteDraft.kind === "situation_graph"
              ? "Create graph"
              : "Create live pipeline",
      jobKind: customRouteDraft.kind === "source_job" ? "rolling_summary" : undefined,
      graphRecipeId: customRouteDraft.kind === "situation_graph" ? "minecraft_world_monitor" : undefined,
      custom: true,
    };
    persistCustomSetupIntents([...customSetupIntents, route]);
    setSetupIntentId(route.id);
    setSetupStatus(`Saved custom route "${route.title}".`);
    setCustomRouteDraft({
      title: "",
      objective: "",
      kind: "live_workstation_pipeline",
      sourceFamily: "room_source",
      transformSummary: "",
      outputSummary: "",
    });
  }, [customRouteDraft, customSetupIntents, persistCustomSetupIntents]);

  const handleDeleteCustomRoute = React.useCallback(
    (routeId: string) => {
      const nextRoutes = customSetupIntents.filter((intent) => intent.id !== routeId);
      persistCustomSetupIntents(nextRoutes);
    if (setupIntentId === routeId) setSetupIntentId("");
      setSetupStatus("Deleted custom route.");
    },
    [customSetupIntents, persistCustomSetupIntents, setupIntentId],
  );

  const goBack = () => {
    if (panelPage === "output") setPanelPage("sources");
    else if (panelPage === "jobs") setPanelPage("sources");
    else if (panelPage === "constructs") setPanelPage("setup");
    else if (panelPage === "inputs") setPanelPage("recipes");
    else if (panelPage === "graph") setPanelPage("setup");
    else if (panelPage === "sources") setPanelPage("setup");
    else if (panelPage === "runtime") setPanelPage("setup");
    else if (panelPage === "capabilities") setPanelPage("recipes");
    else if (panelPage === "recipes") setPanelPage("graph");
  };

  const pageTitle =
    panelPage === "setup"
      ? "Build"
      : panelPage === "constructs"
        ? "Live Jobs"
      : panelPage === "sources"
        ? "Sources"
        : panelPage === "output"
          ? "Outputs"
      : panelPage === "graph"
      ? "Situation Graph"
      : panelPage === "recipes"
        ? "Graph Recipes"
        : panelPage === "capabilities"
          ? "Capabilities"
          : panelPage === "runtime"
            ? "Debug Trace"
      : panelPage === "inputs"
        ? "Pipeline Inputs"
      : panelPage === "jobs"
          ? "Runs"
          : "Output";
  const pageIcon =
    panelPage === "setup" || panelPage === "constructs" || panelPage === "sources" || panelPage === "graph" || panelPage === "recipes" || panelPage === "capabilities" || panelPage === "runtime" || panelPage === "inputs" ? <Workflow className="h-4 w-4 text-cyan-300" /> : panelPage === "jobs" ? <ListChecks className="h-4 w-4 text-cyan-300" /> : <ScrollText className="h-4 w-4 text-cyan-300" />;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-950/95 text-slate-100">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {panelPage !== "setup" ? (
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
          {PRIMARY_PIPELINE_PANEL_PAGES.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setPanelPage(page)}
              disabled={false}
              className={cn(
                "rounded px-2 py-1 capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                panelPage === page ? "bg-cyan-500/20 text-cyan-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              {PIPELINE_PANEL_PAGE_LABELS[page]}
            </button>
          ))}
          <details className="relative">
            <summary className="cursor-pointer list-none rounded px-2 py-1 text-slate-400 hover:bg-white/5 hover:text-slate-200">
              Advanced
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-44 rounded border border-white/10 bg-slate-950 p-1 shadow-xl">
              {(["jobs", "graph", "recipes", "capabilities", "inputs"] as PipelinePanelPage[]).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setPanelPage(page)}
                  className={cn(
                    "block w-full rounded px-2 py-1 text-left transition-colors",
                    panelPage === page ? "bg-cyan-500/20 text-cyan-100" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  )}
                >
                  {PIPELINE_PANEL_PAGE_LABELS[page]}
                </button>
              ))}
            </div>
          </details>
        </div>
      </header>

      {panelPage === "setup" ? (
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-5xl space-y-4">
            <section className="rounded-lg border border-cyan-300/25 bg-slate-950/80 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-cyan-200">Create Live Job</p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Assemble a Situation Room live job
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {activeRoom?.title ?? "No active room"} / {sourceLabelForConstruct(selectedSource)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateConstruct}
                  disabled={!activeRoom}
                  className="inline-flex items-center gap-2 rounded border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Plus className="h-4 w-4" />
                  Create Live Job
                </button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Purpose</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {CONSTRUCT_PURPOSE_OPTIONS.map((purpose) => (
                      <button
                        key={purpose}
                        type="button"
                        onClick={() => {
                          setConstructPurpose(purpose);
                          const matchedRecipe = CONSTRUCT_RECIPE_OPTIONS.find((recipe) => recipe.purpose === purpose);
                          if (matchedRecipe) setConstructRecipeId(matchedRecipe.id);
                        }}
                        className={cn(
                          "rounded border px-2 py-2 text-left text-xs transition-colors",
                          constructPurpose === purpose
                            ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-100"
                            : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10",
                        )}
                      >
                        {purpose}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase text-slate-500">Source class</span>
                      <select
                        value={constructSource}
                        onChange={(event) => setConstructSource(event.target.value as ConstructBuilderSource)}
                        className="mt-2 w-full rounded border border-white/15 bg-slate-900 px-2 py-2 text-sm text-slate-100 outline-none"
                      >
                        {CONSTRUCT_SOURCE_OPTIONS.map((source) => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-[10px] font-semibold uppercase text-slate-500">Operating Prompt</span>
                      <textarea
                        value={constructOperatingPrompt}
                        onChange={(event) => setConstructOperatingPrompt(event.target.value)}
                        rows={4}
                        className="mt-2 w-full resize-y rounded border border-cyan-300/25 bg-slate-900 px-3 py-2 text-sm leading-5 text-slate-100 outline-none focus:border-cyan-300/60"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        This is the visible job rule. It guides live outputs without changing Helix Ask final-answer authority.
                      </p>
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase text-slate-500">Recipe</span>
                      <select
                        value={constructRecipeId}
                        onChange={(event) => setConstructRecipeId(event.target.value as ConstructBuilderRecipeId)}
                        className="mt-2 w-full rounded border border-white/15 bg-slate-900 px-2 py-2 text-sm text-slate-100 outline-none"
                      >
                        {CONSTRUCT_RECIPE_OPTIONS.map((recipe) => (
                          <option key={recipe.id} value={recipe.id}>{recipe.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-semibold uppercase text-slate-500">Output</span>
                      <select
                        value={constructOutput}
                        onChange={(event) => setConstructOutput(event.target.value as ConstructBuilderOutput)}
                        className="mt-2 w-full rounded border border-white/15 bg-slate-900 px-2 py-2 text-sm text-slate-100 outline-none"
                      >
                        {CONSTRUCT_OUTPUT_OPTIONS.map((output) => (
                          <option key={output} value={output}>{output}</option>
                        ))}
                      </select>
                    </label>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Selected evidence</p>
                      <div className="mt-2 rounded border border-white/10 bg-slate-950/70 px-2 py-2">
                        <p className="truncate text-sm text-slate-100">{selectedSource?.label ?? "Whole room"}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {constructSourceIds.length} source{constructSourceIds.length === 1 ? "" : "s"} bound
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-500">Policies</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                      {CONSTRUCT_POLICY_OPTIONS.map((policy) => (
                        <label
                          key={policy}
                          className={cn(
                            "flex min-h-10 cursor-pointer items-center gap-2 rounded border px-2 py-2 text-xs",
                            constructPolicies[policy]
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                              : "border-white/10 bg-white/[0.03] text-slate-400",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={constructPolicies[policy]}
                            onChange={(event) =>
                              setConstructPolicies((current) => ({
                                ...current,
                                [policy]: event.target.checked,
                              }))
                            }
                            className="h-3.5 w-3.5 accent-cyan-400"
                          />
                          <span>{policy}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {constructBuilderStatus ? (
                <p className="mt-3 rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                  {constructBuilderStatus}
                </p>
              ) : null}
            </section>

            <section className="rounded-lg border border-cyan-300/20 bg-cyan-500/5 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-cyan-200">Route setup</p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">
                    Tell Helix Ask what you want. This panel shows the current route, missing setup fields, and delegated tool receipts; live products move to Output once setup is running.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPanelPage("sources")}
                    className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                  >
                    Sources
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelPage("output")}
                    className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                  >
                    Output
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelPage("runtime")}
                    className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                  >
                    Debug
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase text-slate-500">Setup proposal</p>
                      <p className="mt-1 text-base font-semibold text-white">{setupIntent?.title ?? "No route selected"}</p>
                      <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">{setupObjective}</p>
                    </div>
                    <span className="rounded border border-white/15 bg-black/20 px-2 py-1 text-[10px] uppercase text-slate-400">
                      {setupIntent ? "proposal loaded" : "waiting for Helix Ask"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <div
                      className={cn(
                        "rounded border p-2",
                        !setupIntent
                          ? "border-white/10 bg-black/20"
                          : setupMissingFields.length
                          ? "border-red-400/45 bg-red-500/10"
                          : "border-emerald-400/30 bg-emerald-500/10",
                      )}
                    >
                      <p className={cn("text-[10px] uppercase", !setupIntent ? "text-slate-500" : setupMissingFields.length ? "text-red-200" : "text-emerald-200")}>
                        Readiness
                      </p>
                      <p className={cn("mt-1 text-xs", !setupIntent ? "text-slate-300" : setupMissingFields.length ? "text-red-100" : "text-emerald-100")}>
                        {!setupIntent ? "No setup proposal" : setupMissingFields.length ? setupMissingFields.join(", ") : "Ready"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded border p-2",
                        setupNeedsExistingSource && setupActualSourceIds.length === 0
                          ? "border-red-400/45 bg-red-500/10"
                          : "border-white/10 bg-black/20",
                      )}
                    >
                      <p className="text-[10px] uppercase text-slate-500">Source</p>
                      <p
                        className={cn(
                          "mt-1 truncate text-xs",
                          setupIntent && setupNeedsExistingSource && setupActualSourceIds.length === 0 ? "text-red-100" : "text-slate-200",
                        )}
                      >
                        {!setupIntent ? "Pending proposal" : setupActualSourceIds.length ? setupActualSourceIds.join(", ") : "Missing"}
                      </p>
                    </div>
                    <div className="rounded border border-white/10 bg-black/20 p-2">
                      <p className="text-[10px] uppercase text-slate-500">Delegated tools</p>
                      <p className="mt-1 text-xs text-slate-200">{setupToolActions.length} action{setupToolActions.length === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunSetup}
                      disabled={!setupIntent || !setupCanStart}
                      className="rounded border border-cyan-300/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-50 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {!setupIntent ? "Waiting for setup proposal" : setupMissingFields.length ? "Missing required fields" : setupIntent?.actionLabel ?? "Start"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelPage("sources")}
                      className="rounded border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                    >
                      Sources
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelPage("output")}
                      className="rounded border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                    >
                      Output
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanelPage("runtime")}
                      className="rounded border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                    >
                      Debug
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Latest setup receipt</p>
                  <p className={cn("mt-2 text-xs leading-5", setupStatus ? "text-emerald-100" : "text-slate-400")}>
                    {setupStatus ?? (!setupIntent ? "No active proposal yet. Use Helix Ask to describe the workflow; saved templates live under Advanced." : setupMissingFields.length ? `Waiting for ${setupMissingFields.join(", ")}.` : "Ready to start this route.")}
                  </p>
                  <div className="mt-3 rounded border border-white/10 bg-black/20 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Policy</p>
                    <p className="mt-1 text-xs text-slate-200">{setupMode} / compact context only / command lane disabled</p>
                  </div>
                </div>
              </div>
            </section>

            <details className="rounded-lg border border-white/10 bg-black/20 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                Advanced setup
              </summary>
              <div className="mt-3 space-y-4">
                <section>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Route templates</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {setupIntents.map((intent) => (
                    <div
                      key={intent.id}
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        setupIntent?.id === intent.id
                          ? "border-cyan-300/60 bg-cyan-500/15 text-cyan-50"
                          : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-cyan-300/35 hover:bg-cyan-500/10",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSetupIntentId(intent.id);
                          if (intent.recipe?.default_mode) setSetupMode(intent.recipe.default_mode);
                          setSetupStatus(null);
                        }}
                        className="block w-full text-left"
                      >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{intent.title}</p>
                        <span className="rounded border border-white/15 bg-black/20 px-1.5 py-0.5 text-[9px] uppercase text-slate-400">
                          {intent.custom ? "custom" : "route"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">{intent.description}</p>
                      <p className="mt-2 text-[10px] text-slate-500">
                        Route preview: {intent.kind.replace(/_/g, " ")}
                      </p>
                      </button>
                      {intent.custom ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomRoute(intent.id)}
                          className="mt-2 rounded border border-red-400/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-100 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                </section>
                <details className="mt-3 rounded-lg border border-white/10 bg-slate-950/70 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                    Create a custom route card
                  </summary>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[10px] uppercase text-slate-500">Title</span>
                      <input
                        value={customRouteDraft.title}
                        onChange={(event) => setCustomRouteDraft((draft) => ({ ...draft, title: event.target.value }))}
                        className="mt-1 w-full rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none"
                        placeholder="My live review route"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase text-slate-500">Route kind</span>
                      <select
                        value={customRouteDraft.kind}
                        onChange={(event) => setCustomRouteDraft((draft) => ({ ...draft, kind: event.target.value as PipelineSetupIntentKind }))}
                        className="mt-1 w-full rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none"
                      >
                        <option value="live_workstation_pipeline">Live workstation pipeline</option>
                        <option value="live_answer_environment">Live answer environment</option>
                        <option value="source_job">Source job</option>
                        <option value="situation_graph">Situation graph</option>
                      </select>
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-[10px] uppercase text-slate-500">Objective used by the route</span>
                      <input
                        value={customRouteDraft.objective}
                        onChange={(event) => setCustomRouteDraft((draft) => ({ ...draft, objective: event.target.value }))}
                        className="mt-1 w-full rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none"
                        placeholder="Watch this source and keep a compact comparison live."
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase text-slate-500">Required source family</span>
                      <select
                        value={customRouteDraft.sourceFamily}
                        onChange={(event) => setCustomRouteDraft((draft) => ({ ...draft, sourceFamily: event.target.value }))}
                        className="mt-1 w-full rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none"
                      >
                        {PIPELINE_SETUP_SOURCE_FAMILY_OPTIONS.map((family) => (
                          <option key={family} value={family}>
                            {family}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase text-slate-500">Transform summary</span>
                      <input
                        value={customRouteDraft.transformSummary}
                        onChange={(event) => setCustomRouteDraft((draft) => ({ ...draft, transformSummary: event.target.value }))}
                        className="mt-1 w-full rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none"
                        placeholder="window summary -> comparison"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="text-[10px] uppercase text-slate-500">Output summary</span>
                      <input
                        value={customRouteDraft.outputSummary}
                        onChange={(event) => setCustomRouteDraft((draft) => ({ ...draft, outputSummary: event.target.value }))}
                        className="mt-1 w-full rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none"
                        placeholder="Live card plus Situation Room trace"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateCustomRoute}
                    className="mt-3 rounded border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20"
                  >
                    Save route card
                  </button>
                </details>
                <section className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Source requirements</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
                    <div
                      className={cn(
                        "rounded border p-3",
                        setupNeedsExistingSource && setupActualSourceIds.length === 0
                          ? "border-red-400/45 bg-red-500/10"
                          : "border-white/10 bg-black/20",
                      )}
                    >
                      <p className="text-xs font-semibold text-white">{setupIntent?.title ?? "Workflow"}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Required source family: {setupIntent?.sourceFamilies.join(", ") || "manual / custom"}
                      </p>
                      <p
                        className={cn(
                          "mt-2 text-[11px]",
                          setupNeedsExistingSource && setupActualSourceIds.length === 0 ? "text-red-100" : "text-slate-500",
                        )}
                      >
                        Current source ids: {setupActualSourceIds.length ? setupActualSourceIds.join(", ") : "missing"}
                      </p>
                    </div>
                    <label className="block rounded border border-white/10 bg-black/20 p-3">
                      <span className="text-[10px] uppercase text-slate-500">Room/source selection</span>
                      <select
                        value={selectedSourceId}
                        onChange={(event) => setSelectedSourceId(event.target.value)}
                        className="mt-2 w-full rounded border border-white/15 bg-slate-900 px-2 py-2 text-xs text-slate-100 outline-none"
                      >
                        <option value="__room__">Whole active room</option>
                        {activeSources.map((source) => (
                          <option key={source.source_id} value={source.source_id}>
                            {source.label} ({source.capture_source})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <section className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase text-slate-500">Transform</p>
                <div className="mt-3 rounded border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-semibold text-white">{setupIntent?.transformSummary ?? "No transform selected"}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Deterministic reducers and model-reviewed windows are recorded as validation/toolObservation artifacts. They do not become assistant answers unless the user starts a normal Ask turn.
                  </p>
                  {setupIntent?.recipe ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {setupIntent.recipe.default_line_schema.map((line) => (
                        <div key={line.key} className="rounded border border-white/10 bg-black/20 p-2">
                          <p className="text-xs font-semibold text-slate-100">{line.label}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {line.update_policy} / {line.visibility}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>

                <section className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase text-slate-500">Output</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded border border-cyan-300/20 bg-cyan-500/10 p-3">
                    <p className="text-xs font-semibold text-cyan-50">Primary product</p>
                    <p className="mt-1 text-[11px] text-cyan-100/80">{setupIntent?.outputSummary}</p>
                  </div>
                  <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                    <p className="text-xs font-semibold text-white">Helix Ask context</p>
                    <p className="mt-1 text-[11px] text-slate-400">Compact context pack only. Raw logs/audio/transcripts stay out by default.</p>
                  </div>
                  <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                    <p className="text-xs font-semibold text-white">Debug</p>
                    <p className="mt-1 text-[11px] text-slate-400">Deltas, receipts, source windows, and append decisions remain in Advanced/Runtime views.</p>
                  </div>
                </div>
              </section>

                <section className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase text-slate-500">Policy</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="block rounded border border-white/10 bg-slate-950/70 p-3">
                    <span className="text-[10px] uppercase text-slate-500">Delivery mode</span>
                    <select
                      value={setupMode}
                      onChange={(event) => setSetupMode(event.target.value as typeof setupMode)}
                      className="mt-2 w-full rounded border border-white/15 bg-slate-900 px-2 py-2 text-xs text-slate-100 outline-none"
                    >
                      <option value="text_only">Text only</option>
                      <option value="voice_on_confirm">Voice on confirm</option>
                      <option value="critical_voice">Critical voice</option>
                      <option value="direct_address_only">Direct address only</option>
                    </select>
                  </label>
                  <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                    <p className="text-[10px] uppercase text-slate-500">Context policy</p>
                    <p className="mt-2 text-xs text-slate-300">compact_context_pack_only</p>
                  </div>
                  <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                    <p className="text-[10px] uppercase text-slate-500">Command lane</p>
                    <p className="mt-2 text-xs text-slate-300">disabled</p>
                  </div>
                </div>
              </section>

                <section className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Tool plan preview</p>
                    <p className="mt-1 text-xs text-slate-400">
                      These are the same workstation actions Helix Ask can emit as dynamic tool calls.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunSetup}
                    disabled={!setupIntent || !setupCanStart}
                    className="rounded border border-cyan-300/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-50 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {setupIntent?.actionLabel ?? "Start"}
                  </button>
                </div>
                {setupMissingFields.length ? (
                  <div className="mt-3 rounded border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                    Missing required field{setupMissingFields.length === 1 ? "" : "s"}: {setupMissingFields.join(", ")}.
                  </div>
                ) : (
                  <div className="mt-3 rounded border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                    Required fields are ready. Start will dispatch the workstation actions below.
                  </div>
                )}
                <div className="mt-3 rounded border border-white/10 bg-slate-950/80 p-3">
                  <p className="text-sm font-semibold text-white">{setupIntent?.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{setupObjective}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    The prompt stays the source of intent. The route below is the current tool plan projection, not a final assistant answer.
                  </p>
                  <pre className="mt-3 max-h-72 overflow-auto rounded border border-white/10 bg-black/40 p-3 text-[10px] leading-5 text-slate-200">
                    {JSON.stringify(setupToolActions, null, 2)}
                  </pre>
                </div>
                {setupStatus ? (
                  <p className="mt-3 rounded border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                    {setupStatus}
                  </p>
                ) : null}
              </section>
              </div>
            </details>
          </div>
        </main>
      ) : null}

      {panelPage === "constructs" ? (
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-6xl space-y-4">
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Live Job Workbench</p>
                  <p className="mt-1 text-lg font-semibold text-white">Visible Situation Room live jobs</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {activeRoom?.title ?? "No active room"} / {liveJobCards.length} live job{liveJobCards.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelPage("setup")}
                  className="inline-flex items-center gap-2 rounded border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Build
                </button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-3">
                  {liveJobCards.map((job) => {
                    const spoken = job.observation?.policy_state.spoken === true;
                    const confirmPresent = job.observation?.policy_state.confirm_speak_receipt_present === true;
                    return (
                      <article
                        key={job.id}
                        className={cn(
                          "rounded-lg border bg-slate-950/70 p-3 transition-colors",
                          selectedLiveJob?.id === job.id ? "border-cyan-400/70 ring-1 ring-cyan-400/25" : "border-white/10 hover:border-white/25",
                        )}
                      >
                        <button type="button" onClick={() => setSelectedLiveJobId(job.id)} className="block w-full text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{job.name}</p>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">{job.operatingPrompt}</p>
                            </div>
                            <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[10px]", liveJobStatusTone(job.status))}>
                              {job.status}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                            <div className="rounded border border-white/10 bg-black/20 px-2 py-1.5">
                              <span className="text-slate-500">Voice</span>
                              <p className="mt-0.5 text-slate-200">
                                {voicePolicyLabel(job.voicePolicy)} / {spoken && confirmPresent ? "spoken yes" : "no audio spoken"}
                              </p>
                            </div>
                            <div className="rounded border border-white/10 bg-black/20 px-2 py-1.5">
                              <span className="text-slate-500">Authority</span>
                              <p className="mt-0.5 text-slate-200">
                                {authorityPolicyLabel(job.authority)} / Helix Ask final answers
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 rounded border border-white/10 bg-black/20 px-2 py-1.5 text-[11px] text-slate-300">
                            {job.lastObservation}
                          </p>
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLiveJobId(job.id);
                              setLiveJobPromptDraft(job.operatingPrompt);
                            }}
                            className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                          >
                            Edit Prompt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttachSelectedSourceToLiveJob(job)}
                            disabled={!job.constructIds.length || constructSourceIds.length === 0}
                            className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Attach Source
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartLiveJob(job)}
                            disabled={!job.constructIds.length || job.status === "blocked"}
                            className="inline-flex items-center gap-1 rounded border border-emerald-400/35 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Start
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStopLiveJob(job)}
                            disabled={!job.constructIds.length}
                            className="inline-flex items-center gap-1 rounded border border-slate-400/35 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Square className="h-3.5 w-3.5" />
                            Stop
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmSpeakLiveJob(job)}
                            disabled={job.voicePolicy === "muted"}
                            className="inline-flex items-center gap-1 rounded border border-cyan-400/35 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                            Confirm Speak
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <section className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                  {selectedLiveJob ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-white">{selectedLiveJob.name}</p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {selectedLiveJob.contract?.selected_recipe ?? "draft recipe"} / updated {formatClock(selectedLiveJob.updatedAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className={cn("rounded border px-2 py-0.5", liveJobStatusTone(selectedLiveJob.status))}>
                            {selectedLiveJob.status}
                          </span>
                          <span className="rounded border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-cyan-100">
                            voice {voicePolicyLabel(selectedLiveJob.voicePolicy)}
                          </span>
                          <span className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-slate-200">
                            {authorityPolicyLabel(selectedLiveJob.authority)}
                          </span>
                        </div>
                      </div>

                      <label className="block">
                        <span className="text-[10px] font-semibold uppercase text-slate-500">Operating Prompt</span>
                        <textarea
                          value={liveJobPromptDraft}
                          onChange={(event) => setLiveJobPromptDraft(event.target.value)}
                          rows={5}
                          className="mt-2 w-full resize-y rounded border border-cyan-300/25 bg-black/30 px-3 py-2 text-sm leading-5 text-slate-100 outline-none focus:border-cyan-300/60"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveLiveJobPrompt(selectedLiveJob)}
                          className="inline-flex items-center gap-1 rounded border border-emerald-400/35 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100 hover:bg-emerald-500/20"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save Prompt
                        </button>
                        <button
                          type="button"
                          onClick={() => setPanelPage("runtime")}
                          className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                        >
                          Diagnose
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Compiled Policy</p>
                          <dl className="mt-2 space-y-1 text-xs">
                            <div className="flex justify-between gap-3">
                              <dt className="text-slate-500">interruptions</dt>
                              <dd className="text-right text-slate-200">{selectedLiveJob.contract?.compiled_policy.interruption_policy ?? "policy_triggered"}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt className="text-slate-500">threshold</dt>
                              <dd className="text-right text-slate-200">{selectedLiveJob.contract?.compiled_policy.evidence_threshold ?? "observed"}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt className="text-slate-500">cadence</dt>
                              <dd className="text-right text-slate-200">{selectedLiveJob.contract?.compiled_policy.cadence ?? "event_driven"}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt className="text-slate-500">callouts</dt>
                              <dd className="text-right text-slate-200">{selectedLiveJob.contract?.compiled_policy.callout_style ?? "short"}</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="rounded border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Voice Boundary</p>
                          <p className="mt-2 text-xs text-slate-200">
                            {selectedLiveJob.observation?.policy_state.spoken === true &&
                            selectedLiveJob.observation.policy_state.confirm_speak_receipt_present === true
                              ? "Spoken audio is receipt-confirmed."
                              : "Voice proposal only. No audio has been spoken."}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Dottie callouts are witness outputs. Helix Ask remains the answer surface.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Sources</p>
                          <div className="mt-2 space-y-2">
                            {selectedLiveJob.sources.map((source) => (
                              <div key={`${source.source_kind}:${source.binding_id ?? "none"}`} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-slate-950/80 px-2 py-1.5 text-xs">
                                <div className="min-w-0">
                                  <p className="truncate text-slate-200">{source.source_kind}</p>
                                  <p className="truncate text-[10px] text-slate-500">{source.binding_id ?? source.missing_reason ?? "no binding"}</p>
                                </div>
                                <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[10px]", sourceRequirementTone(source.status))}>
                                  {source.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded border border-white/10 bg-black/20 p-3">
                          <p className="text-[10px] font-semibold uppercase text-slate-500">Outputs</p>
                          <div className="mt-2 space-y-2">
                            {selectedLiveJob.outputs.map((output) => (
                              <div key={output.output_kind} className="flex items-center justify-between gap-3 rounded border border-white/10 bg-slate-950/80 px-2 py-1.5 text-xs">
                                <span className="truncate text-slate-200">{output.output_kind}</span>
                                <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[10px]", outputBindingTone(output.status))}>
                                  {output.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="rounded border border-white/10 bg-black/20 p-3">
                        <p className="text-[10px] font-semibold uppercase text-slate-500">Diagnostics</p>
                        {selectedLiveJob.diagnostics.length === 0 ? (
                          <p className="mt-2 text-xs text-slate-400">No blocking diagnostics in the latest contract.</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {selectedLiveJob.diagnostics.map((diagnostic) => (
                              <div key={diagnostic.code} className="rounded border border-amber-400/25 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-100">
                                {diagnostic.message}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="mt-3 rounded border border-white/10 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-300">
                          Last observation: {selectedLiveJob.lastObservation}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No live job selected.</p>
                  )}
                </section>
              </div>
              {liveJobActionStatus ? (
                <p className="mt-3 rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">{liveJobActionStatus}</p>
              ) : null}
            </section>

            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Underlying constructs</p>
                  <p className="mt-1 text-sm font-semibold text-white">Receipt-backed parts</p>
                </div>
                <span className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                  {constructCards.length} construct{constructCards.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {constructCards.map((construct) => (
                  <article key={construct.id} className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{construct.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{construct.type}</p>
                      </div>
                      <span className={cn("shrink-0 rounded border px-2 py-0.5 text-[10px]", constructTone(construct.status))}>
                        {construct.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">source</span>
                        <span className="truncate text-slate-200">{construct.source}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">output</span>
                        <span className="truncate text-slate-200">{construct.output}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500">authority</span>
                        <span className="truncate text-slate-200">{construct.authority}</span>
                      </div>
                    </div>
                    <p className="mt-3 truncate rounded border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-400">
                      {construct.detail}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      ) : null}

      {panelPage === "sources" ? (
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <section className="shrink-0 border-b border-white/10 bg-slate-950/80 px-4 py-3">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase text-slate-500">Room and source selection</p>
                <p className="mt-1 truncate text-sm text-slate-200">
                  {activeRoom?.title ?? "No active room"} / {selectedSource?.label ?? "whole room"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Pick the room/source first. Room-scoped workflows and outputs are available from here.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPanelPage("jobs")}
                  disabled={!activeRoom}
                  className="rounded border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Room workflows
                </button>
                <button
                  type="button"
                  onClick={() => setPanelPage("output")}
                  className="rounded border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                >
                  View output
                </button>
                <button
                  type="button"
                  onClick={() => setPanelPage("runtime")}
                  className="rounded border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                >
                  Debug
                </button>
              </div>
            </div>
          </section>
          <div className="min-h-0 flex-1 overflow-y-scroll overscroll-contain">
            <SituationRoomSourcesPanel />
          </div>
        </main>
      ) : null}

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
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Workstation Action Trace</p>
                  <p className="mt-1 text-xs text-slate-400">
                    These are receipt-backed action executions from Helix Ask or panel controls. Completed means receipt or state proof was observed.
                  </p>
                </div>
                <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                  receipt-backed
                </span>
              </div>
              <div className="mt-3">
                <WorkstationActionTrace limit={8} />
              </div>
            </section>
            {selectedLiveJob ? (
              <section className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Live Job Contract Debug</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Raw contract and observation for the selected live job. These are observations, not terminal answers.
                    </p>
                  </div>
                  <span className={cn("rounded border px-2 py-0.5 text-[10px]", liveJobStatusTone(selectedLiveJob.status))}>
                    {selectedLiveJob.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <pre className="max-h-80 overflow-auto rounded border border-white/10 bg-slate-950/80 p-3 text-[10px] leading-5 text-slate-200">
                    {JSON.stringify(selectedLiveJob.contract ?? { draft: true, operating_prompt: selectedLiveJob.operatingPrompt }, null, 2)}
                  </pre>
                  <pre className="max-h-80 overflow-auto rounded border border-white/10 bg-slate-950/80 p-3 text-[10px] leading-5 text-slate-200">
                    {JSON.stringify(selectedLiveJob.observation ?? { draft: true, policy_state: { spoken: false, output_authority: "proposal" } }, null, 2)}
                  </pre>
                </div>
              </section>
            ) : null}
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
            <MinecraftWorldBindingPanel
              detectedSource={detectedMinecraftSource}
              binding={activeThreadBinding}
              busy={bindingBusy}
              status={bindingStatus}
              onAttachDetected={() => handleAttachThreadBinding("detected_source")}
            />
            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Helix Thread Binding</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Attach salient standby receipts to Helix Ask as tool observations. This does not start model turns or enable Minecraft actions.
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-[10px] uppercase",
                    activeThreadBinding
                      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                      : "border-white/15 text-slate-400",
                  )}
                >
                  {activeThreadBinding ? "attached to Helix Ask" : "observe-only"}
                </span>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <label className="block">
                  <span className="text-[10px] uppercase text-slate-500">Thread id</span>
                  <input
                    value={bindingThreadId}
                    onChange={(event) => setBindingThreadId(event.target.value)}
                    className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-300/60"
                    placeholder="helix-ask:desktop"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-slate-500">World id</span>
                  <input
                    value={bindingWorldId}
                    onChange={(event) => setBindingWorldId(event.target.value)}
                    className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-300/60"
                    placeholder="minecraft:minehut"
                  />
                </label>
                <div className="flex flex-wrap items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleAttachThreadBinding("room")}
                    disabled={!activeRoom || bindingBusy}
                    className="rounded border border-cyan-400/35 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Attach room
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAttachThreadBinding("source")}
                    disabled={!activeRoom || bindingBusy}
                    className="rounded border border-emerald-400/35 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-100 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Attach Minecraft source
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAttachThreadBinding("graph")}
                    disabled={!activeRoom || !activeGraph || bindingBusy}
                    className="rounded border border-violet-400/35 bg-violet-500/10 px-2 py-1.5 text-xs text-violet-100 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Attach graph
                  </button>
                  <button
                    type="button"
                    onClick={handleDetachThreadBinding}
                    disabled={!activeThreadBinding || bindingBusy}
                    className="rounded border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Detach
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <p className="text-[10px] uppercase text-slate-500">Source</p>
                  <p className="mt-1 break-all text-xs text-slate-300">{minecraftSourceId}</p>
                </div>
                <div className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <p className="text-[10px] uppercase text-slate-500">Append policy</p>
                  <p className="mt-1 text-xs text-slate-300">{activeThreadBinding?.append_policy ?? "salient_only"}</p>
                </div>
                <div className="rounded border border-white/10 bg-slate-950/70 p-2">
                  <p className="text-[10px] uppercase text-slate-500">Last append status</p>
                  <p className={cn("mt-1 text-xs", bindingStatus?.ok === false ? "text-rose-200" : "text-slate-300")}>
                    {bindingStatus?.message ?? (activeThreadBinding ? `thread ${activeThreadBinding.thread_id}` : "no_thread_context")}
                  </p>
                </div>
              </div>
              {activeThreadBinding ? (
                <p className="mt-2 break-all text-[10px] text-slate-500">
                  binding {activeThreadBinding.binding_id} / {activeThreadBinding.binding_kind} / mode {activeThreadBinding.mode}
                </p>
              ) : null}
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
            <details className="rounded-lg border border-white/10 bg-black/20 p-3">
              <summary className="cursor-pointer list-none text-xs font-semibold text-slate-200">
                Advanced workflow creation
                <span className="ml-2 text-[11px] font-normal text-slate-500">
                  recipes, prompt drafting, and manual job options
                </span>
              </summary>
              <div className="mt-3">
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
              </div>
            </details>

            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase text-slate-500">Active workflows</p>
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

      {panelPage === "output" ? selectedJob ? (
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
                  <button type="button" onClick={() => setSelectedJobId(ALL_OUTPUT_JOB_ID)} className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10">
                    All output
                  </button>
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
          <div className="max-h-[46vh] shrink-0 overflow-y-auto border-b border-white/10 p-3">
            <LiveAnswerEnvironmentPanel threadId="helix-ask:desktop" />
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
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-6xl space-y-4">
            <section className="rounded-lg border border-cyan-300/20 bg-cyan-500/5 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-cyan-200">Live output</p>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-300">
                    This is the product side of the Situation Room: Live Answers renders construct evidence through output bindings, alongside pipeline outputs and selected-room job results. Setup controls stay in Setup and source-specific workflow creation starts from Sources.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPanelPage("sources")}
                    className="rounded border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                  >
                    Sources
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelPage("jobs")}
                    disabled={!activeRoom}
                    className="rounded border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Room workflows
                  </button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Room</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{activeRoom?.title ?? "No active room"}</p>
                </div>
                <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Live Answer binding</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{activeLiveAnswerEnvironmentId ?? "planned"}</p>
                </div>
                <div className="rounded border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-[10px] uppercase text-slate-500">Selected source</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{selectedSource?.label ?? "whole room"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Construct outputs</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Live Answers is an output surface. Voice proposals are separate from spoken audio.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelPage("constructs")}
                  className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                >
                  Live Jobs
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(selectedLiveJob?.outputs ?? []).map((output) => (
                  <div key={output.output_kind} className="rounded border border-white/10 bg-slate-950/70 p-3">
                    <p className="truncate text-xs font-semibold text-slate-200">{output.output_kind}</p>
                    <span className={cn("mt-2 inline-flex rounded border px-2 py-0.5 text-[10px]", outputBindingTone(output.status))}>
                      {output.status}
                    </span>
                  </div>
                ))}
                <div className="rounded border border-cyan-400/25 bg-cyan-500/10 p-3">
                  <p className="text-xs font-semibold text-cyan-100">Voice proposal</p>
                  <p className="mt-1 text-[11px] text-cyan-100/80">
                    {selectedLiveJob?.observation?.policy_state.spoken === true &&
                    selectedLiveJob.observation.policy_state.confirm_speak_receipt_present === true
                      ? "Confirmed spoken receipt present."
                      : "No audio spoken. Confirmation required before speech."}
                  </p>
                </div>
              </div>
            </section>

            <DiscordSessionPanel />
            <LiveAnswerEnvironmentPanel threadId="helix-ask:desktop" />
            <LiveWorkstationPipelinePanel />

            <section className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Room job outputs</p>
                  <p className="mt-1 text-xs text-slate-400">
                    These are selected-room workflow outputs. Open a job for its evidence scroll, attach it to Helix Ask, or save it as a note.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelPage("jobs")}
                  disabled={!activeRoom}
                  className="rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Manage workflows
                </button>
              </div>
              {activeJobs.length === 0 ? (
                <div className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-white/15 px-6 text-center text-sm text-slate-400">
                  No room workflows have produced output yet. Pick a source, then create or run a room workflow.
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
    </div>
  );
}
