import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emitHelixAskLiveEvent } from "@/lib/helix/liveEventsBus";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import {
  selectSituationRoomEvents,
  useSituationRoomStore,
  type SituationRoomStoredEvent,
} from "@/store/useSituationRoomStore";
import {
  useWorkstationNotesStore,
  type WorkstationNote,
  type WorkstationNoteCitation,
  type WorkstationNoteSnippet,
} from "@/store/useWorkstationNotesStore";

const SITUATION_ROOM_JOBS_STORAGE_KEY = "situation-room-jobs:v1";

export type SituationRoomJobKind =
  | "translate"
  | "rolling_summary"
  | "action_items"
  | "prompt_composer";

export type SituationRoomJobStatus =
  | "draft"
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "error";

export type SituationRoomJobArtifactKind =
  | "translation_chunk"
  | "summary"
  | "action_item"
  | "prompt_draft";

export type SituationRoomJobChunkRange = {
  source_id: string;
  from_chunk: number;
  to_chunk: number;
};

export type SituationRoomJob = {
  job_id: string;
  room_id: string;
  kind: SituationRoomJobKind;
  title: string;
  status: SituationRoomJobStatus;
  source_ids: string[];
  input_event_ids?: string[];
  chunk_ranges?: SituationRoomJobChunkRange[];
  target_language?: string;
  job_spec_hash: string;
  output_ids: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  last_error?: string;
};

export type SituationRoomDerivedOutput = {
  output_id: string;
  room_id: string;
  job_id: string;
  source_id?: string;
  source_event_id?: string;
  artifact_kind: SituationRoomJobArtifactKind;
  text: string;
  derived: true;
  derived_from_event_ids: string[];
  job_spec_hash: string;
  chunk_index?: number;
  seq: number;
  ts: string;
  meta: {
    model?: string;
    target_language?: string;
    prompt_hash?: string;
    confidence?: number;
    command_lane?: {
      decision: "none";
      suppression_reason: "non_user_audio_source";
    };
    [key: string]: unknown;
  };
};

export type SituationRoomMasterScrollRow =
  | {
      kind: "raw";
      id: string;
      room_id: string;
      source_id?: string;
      label: string;
      text?: string;
      event_type: string;
      ts: string;
      chunk_index?: number;
      raw: SituationRoomStoredEvent;
    }
  | {
      kind: "derived";
      id: string;
      room_id: string;
      source_id?: string;
      job_id: string;
      label: string;
      text: string;
      event_type: SituationRoomJobArtifactKind;
      ts: string;
      chunk_index?: number;
      output: SituationRoomDerivedOutput;
    };

export type HelixTurnContextSnapshot = {
  snapshot_id: string;
  created_at: string;
  room_id: string;
  source_ranges: SituationRoomJobChunkRange[];
  job_outputs: Array<{ job_id: string; from_seq: number; to_seq: number; output_ids: string[] }>;
};

type CreateJobInput = {
  room_id: string;
  kind: SituationRoomJobKind;
  title?: string;
  source_ids?: string[];
  input_event_ids?: string[];
  chunk_ranges?: SituationRoomJobChunkRange[];
  target_language?: string;
  status?: SituationRoomJobStatus;
};

type SituationRoomJobStoreState = {
  jobs: Record<string, SituationRoomJob>;
  job_order: string[];
  outputs: Record<string, SituationRoomDerivedOutput>;
  createJob: (input: CreateJobInput) => SituationRoomJob;
  createJobFromRoom: (roomId: string, kind: SituationRoomJobKind, input?: Partial<CreateJobInput>) => SituationRoomJob;
  createJobFromSource: (
    roomId: string,
    sourceId: string,
    kind: SituationRoomJobKind,
    input?: Partial<CreateJobInput>,
  ) => SituationRoomJob;
  processJobNow: (jobId: string) => SituationRoomDerivedOutput[];
  appendDerivedOutput: (output: SituationRoomDerivedOutput) => SituationRoomDerivedOutput;
  stopJob: (jobId: string) => void;
  saveJobAsNote: (jobId: string) => WorkstationNote | null;
  attachJobToHelixAsk: (jobId: string) => void;
  createTurnContextSnapshot: (input: {
    room_id: string;
    source_ranges?: SituationRoomJobChunkRange[];
    job_ids?: string[];
  }) => HelixTurnContextSnapshot;
  reset: () => void;
};

const nowIso = (): string => new Date().toISOString();

const createId = (prefix: string): string => {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}:${Date.now()}:${random}`;
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!value || typeof value !== "object") return JSON.stringify(value);
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildJobSpecHash(input: Omit<CreateJobInput, "status" | "title">): string {
  return `job-spec:${hashText(stableStringify(input))}`;
}

function normalizeTitle(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function defaultJobTitle(kind: SituationRoomJobKind, targetLanguage?: string): string {
  switch (kind) {
    case "translate":
      return `Translate${targetLanguage ? ` to ${targetLanguage}` : ""}`;
    case "rolling_summary":
      return "Rolling summary";
    case "action_items":
      return "Action items";
    case "prompt_composer":
      return "Prompt composer";
    default:
      return "Situation room job";
  }
}

function artifactKindForJob(kind: SituationRoomJobKind): SituationRoomJobArtifactKind {
  switch (kind) {
    case "translate":
      return "translation_chunk";
    case "rolling_summary":
      return "summary";
    case "action_items":
      return "action_item";
    case "prompt_composer":
      return "prompt_draft";
    default:
      return "summary";
  }
}

function transcriptEventsForJob(job: SituationRoomJob): SituationRoomStoredEvent[] {
  const roomState = useSituationRoomStore.getState();
  const allowedInputEventIds = new Set(job.input_event_ids ?? []);
  const sourceIds = new Set(job.source_ids);
  return selectSituationRoomEvents(roomState, job.room_id).filter((event) => {
    if (event.event_type !== "voice_transcript" || !event.text?.trim()) return false;
    if (allowedInputEventIds.size > 0 && !allowedInputEventIds.has(event.event_id)) return false;
    if (sourceIds.size > 0 && (!event.source_id || !sourceIds.has(event.source_id))) return false;
    if (job.chunk_ranges?.length) {
      return job.chunk_ranges.some((range) => {
        if (event.source_id !== range.source_id) return false;
        if (typeof event.chunk_index !== "number") return false;
        return event.chunk_index >= range.from_chunk && event.chunk_index <= range.to_chunk;
      });
    }
    return true;
  });
}

function sourcePathForEvent(event: SituationRoomStoredEvent): string {
  const chunk = typeof event.chunk_index === "number" ? event.chunk_index.toString().padStart(4, "0") : "event";
  return `situation-room://${encodeURIComponent(event.room_id)}/source/${encodeURIComponent(
    event.source_id ?? event.capture_session_id ?? event.source,
  )}/chunk/${chunk}`;
}

function outputPath(output: SituationRoomDerivedOutput): string {
  return `situation-room://${encodeURIComponent(output.room_id)}/job/${encodeURIComponent(
    output.job_id,
  )}/output/${output.seq.toString().padStart(4, "0")}`;
}

function makeOutput(args: {
  job: SituationRoomJob;
  artifactKind: SituationRoomJobArtifactKind;
  text: string;
  seq: number;
  derivedFrom: SituationRoomStoredEvent[];
  sourceEvent?: SituationRoomStoredEvent;
  outputId: string;
  meta?: Record<string, unknown>;
}): SituationRoomDerivedOutput {
  return {
    output_id: args.outputId,
    room_id: args.job.room_id,
    job_id: args.job.job_id,
    source_id: args.sourceEvent?.source_id,
    source_event_id: args.sourceEvent?.event_id,
    artifact_kind: args.artifactKind,
    text: args.text,
    derived: true,
    derived_from_event_ids: args.derivedFrom.map((event) => event.event_id),
    job_spec_hash: args.job.job_spec_hash,
    chunk_index: args.sourceEvent?.chunk_index,
    seq: args.seq,
    ts: nowIso(),
    meta: {
      model: "situation-room-local-v1",
      target_language: args.job.target_language,
      command_lane: {
        decision: "none",
        suppression_reason: "non_user_audio_source",
      },
      ...args.meta,
    },
  };
}

function buildTranslationOutput(job: SituationRoomJob, event: SituationRoomStoredEvent, seq: number) {
  const sourceId = event.source_id ?? event.capture_session_id ?? event.source;
  const chunk = typeof event.chunk_index === "number" ? event.chunk_index : seq;
  return makeOutput({
    job,
    artifactKind: "translation_chunk",
    text: `[${job.target_language ?? "target"}] ${event.text?.trim() ?? ""}`,
    seq,
    sourceEvent: event,
    derivedFrom: [event],
    outputId: `room:${job.room_id}:job:${job.job_id}:source:${sourceId}:chunk:${chunk}`,
  });
}

function buildSummaryOutput(job: SituationRoomJob, events: SituationRoomStoredEvent[], seq: number) {
  const text = events
    .map((event) => event.text?.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 1200);
  const eventHash = hashText(events.map((event) => event.event_id).join("|"));
  return makeOutput({
    job,
    artifactKind: "summary",
    text: text ? `Summary draft: ${text}` : "Summary draft: no transcript events selected.",
    seq,
    derivedFrom: events,
    outputId: `room:${job.room_id}:job:${job.job_id}:summary:${eventHash}`,
    meta: { summary_event_count: events.length },
  });
}

function buildActionItemOutputs(job: SituationRoomJob, events: SituationRoomStoredEvent[], startSeq: number) {
  const pattern = /\b(need|needs|should|must|todo|bring|wait|assign|follow up|remember)\b/i;
  const candidates = events.filter((event) => pattern.test(event.text ?? ""));
  const selected = candidates.length > 0 ? candidates : events.slice(0, 1);
  return selected.map((event, index) => {
    const sourceId = event.source_id ?? event.capture_session_id ?? event.source;
    const chunk = typeof event.chunk_index === "number" ? event.chunk_index : startSeq + index;
    return makeOutput({
      job,
      artifactKind: "action_item",
      text: `Action item draft: ${event.text?.trim() ?? ""}`,
      seq: startSeq + index,
      sourceEvent: event,
      derivedFrom: [event],
      outputId: `room:${job.room_id}:job:${job.job_id}:action:${sourceId}:chunk:${chunk}`,
      meta: { confidence: candidates.includes(event) ? 0.72 : 0.42 },
    });
  });
}

function buildPromptOutput(job: SituationRoomJob, events: SituationRoomStoredEvent[], seq: number) {
  const eventHash = hashText(events.map((event) => event.event_id).join("|"));
  const evidence = events
    .map((event) => `- ${event.source_id ?? event.source} chunk ${event.chunk_index ?? "?"}: ${event.text?.trim()}`)
    .join("\n");
  const prompt = `Use the following live room evidence.\n\nSources:\n${evidence || "- No selected transcript chunks."}\n\nTask:\nCompare the evidence, identify risks, and propose the next useful step.`;
  return makeOutput({
    job,
    artifactKind: "prompt_draft",
    text: prompt,
    seq,
    derivedFrom: events,
    outputId: `room:${job.room_id}:job:${job.job_id}:prompt:${eventHash}`,
    meta: { prompt_hash: `prompt:${hashText(prompt)}` },
  });
}

function compareMasterRows(a: SituationRoomMasterScrollRow, b: SituationRoomMasterScrollRow): number {
  const aTs = Date.parse(a.ts);
  const bTs = Date.parse(b.ts);
  const timeDelta = (Number.isFinite(aTs) ? aTs : 0) - (Number.isFinite(bTs) ? bTs : 0);
  if (timeDelta !== 0) return timeDelta;
  const sourceDelta = (a.source_id ?? "").localeCompare(b.source_id ?? "");
  if (sourceDelta !== 0) return sourceDelta;
  const chunkDelta = (a.chunk_index ?? 0) - (b.chunk_index ?? 0);
  if (chunkDelta !== 0) return chunkDelta;
  return a.id.localeCompare(b.id);
}

export function selectSituationRoomMasterScroll(
  roomState: Pick<ReturnType<typeof useSituationRoomStore.getState>, "rooms" | "events" | "sources">,
  jobState: Pick<SituationRoomJobStoreState, "outputs" | "jobs">,
  roomId: string,
): SituationRoomMasterScrollRow[] {
  const rawRows: SituationRoomMasterScrollRow[] = selectSituationRoomEvents(roomState, roomId).map((event) => ({
    kind: "raw",
    id: event.event_id,
    room_id: event.room_id,
    source_id: event.source_id,
    label: event.source_id ? roomState.sources[event.source_id]?.label ?? event.source_id : event.source,
    text: event.text,
    event_type: event.event_type,
    ts: event.ts,
    chunk_index: event.chunk_index,
    raw: event,
  }));
  const derivedRows: SituationRoomMasterScrollRow[] = Object.values(jobState.outputs)
    .filter((output) => output.room_id === roomId)
    .map((output) => ({
      kind: "derived",
      id: output.output_id,
      room_id: output.room_id,
      source_id: output.source_id,
      job_id: output.job_id,
      label: jobState.jobs[output.job_id]?.title ?? output.job_id,
      text: output.text,
      event_type: output.artifact_kind,
      ts: output.ts,
      chunk_index: output.chunk_index,
      output,
    }));
  return [...rawRows, ...derivedRows].sort(compareMasterRows);
}

export const useSituationRoomJobStore = create<SituationRoomJobStoreState>()(
  persist(
    (set, get) => ({
      jobs: {},
      job_order: [],
      outputs: {},
      createJob: (input) => {
        const timestamp = nowIso();
        const jobId = createId("job");
        const specHash = buildJobSpecHash({
          room_id: input.room_id,
          kind: input.kind,
          source_ids: input.source_ids ?? [],
          input_event_ids: input.input_event_ids,
          chunk_ranges: input.chunk_ranges,
          target_language: input.target_language,
        });
        const job: SituationRoomJob = {
          job_id: jobId,
          room_id: input.room_id,
          kind: input.kind,
          title: normalizeTitle(input.title, defaultJobTitle(input.kind, input.target_language)),
          status: input.status ?? "draft",
          source_ids: input.source_ids ?? [],
          input_event_ids: input.input_event_ids,
          chunk_ranges: input.chunk_ranges,
          target_language: input.target_language,
          job_spec_hash: specHash,
          output_ids: [],
          created_at: timestamp,
          updated_at: timestamp,
        };
        set((state) => ({
          jobs: { ...state.jobs, [jobId]: job },
          job_order: [jobId, ...state.job_order.filter((entry) => entry !== jobId)],
        }));
        return job;
      },
      createJobFromRoom: (roomId, kind, input) =>
        get().createJob({
          room_id: roomId,
          kind,
          ...input,
          source_ids: input?.source_ids ?? [],
        }),
      createJobFromSource: (roomId, sourceId, kind, input) =>
        get().createJob({
          room_id: roomId,
          kind,
          ...input,
          source_ids: [sourceId],
        }),
      processJobNow: (jobId) => {
        const job = get().jobs[jobId];
        if (!job || job.status === "cancelled") return [];
        const events = transcriptEventsForJob(job);
        const existingSeq = job.output_ids.length;
        let outputs: SituationRoomDerivedOutput[] = [];
        if (job.kind === "translate") {
          outputs = events.map((event, index) => buildTranslationOutput(job, event, existingSeq + index));
        } else if (job.kind === "rolling_summary") {
          outputs = [buildSummaryOutput(job, events, existingSeq)];
        } else if (job.kind === "action_items") {
          outputs = buildActionItemOutputs(job, events, existingSeq);
        } else if (job.kind === "prompt_composer") {
          outputs = [buildPromptOutput(job, events, existingSeq)];
        }
        const appended = outputs.map((output) => get().appendDerivedOutput(output));
        const completedAt = nowIso();
        set((state) => {
          const current = state.jobs[jobId];
          if (!current) return state;
          return {
            jobs: {
              ...state.jobs,
              [jobId]: {
                ...current,
                status: "completed",
                completed_at: completedAt,
                updated_at: completedAt,
              },
            },
          };
        });
        return appended;
      },
      appendDerivedOutput: (output) => {
        set((state) => {
          const currentJob = state.jobs[output.job_id];
          if (!currentJob) return state;
          const alreadyPresent = Boolean(state.outputs[output.output_id]);
          return {
            outputs: {
              ...state.outputs,
              [output.output_id]: state.outputs[output.output_id] ?? output,
            },
            jobs: {
              ...state.jobs,
              [output.job_id]: {
                ...currentJob,
                output_ids: alreadyPresent
                  ? currentJob.output_ids
                  : [...currentJob.output_ids, output.output_id],
                status: currentJob.status === "draft" ? "running" : currentJob.status,
                updated_at: nowIso(),
              },
            },
          };
        });
        return get().outputs[output.output_id] ?? output;
      },
      stopJob: (jobId) => {
        set((state) => {
          const job = state.jobs[jobId];
          if (!job) return state;
          return {
            jobs: {
              ...state.jobs,
              [jobId]: {
                ...job,
                status: "cancelled",
                updated_at: nowIso(),
              },
            },
          };
        });
      },
      saveJobAsNote: (jobId) => {
        const state = get();
        const job = state.jobs[jobId];
        if (!job) return null;
        const outputs = job.output_ids.map((outputId) => state.outputs[outputId]).filter(Boolean);
        const roomState = useSituationRoomStore.getState();
        const rawEvents = selectSituationRoomEvents(roomState, job.room_id);
        const rawById = new Map(rawEvents.map((event) => [event.event_id, event]));
        const lines: string[] = [];
        const citations: WorkstationNoteCitation[] = [];
        const snippets: WorkstationNoteSnippet[] = [];
        let offset = 0;
        const appendLine = (line = "") => {
          const start = offset;
          lines.push(line);
          offset += line.length + 1;
          return { start, end: start + line.length };
        };
        appendLine(`# ${job.title}`);
        appendLine();
        appendLine(`Job: ${job.kind}`);
        appendLine(`Room: ${job.room_id}`);
        appendLine(`Spec: ${job.job_spec_hash}`);
        appendLine();
        appendLine("## Outputs");
        for (const output of outputs) {
          const position = appendLine(`[${output.artifact_kind}] ${output.text}`);
          const outputCitationId = `cite_${output.output_id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
          citations.push({
            id: outputCitationId,
            path: outputPath(output),
            heading: `${job.title} output ${output.seq}`,
            start_offset: position.start,
            end_offset: position.end,
          });
          snippets.push({
            id: `snippet_${outputCitationId}`,
            citation_id: outputCitationId,
            excerpt: output.text,
          });
          for (const rawEventId of output.derived_from_event_ids) {
            const raw = rawById.get(rawEventId);
            if (!raw) continue;
            citations.push({
              id: `cite_raw_${rawEventId.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
              path: sourcePathForEvent(raw),
              heading: `Raw source for ${job.title}`,
              start_offset: position.start,
              end_offset: position.end,
            });
          }
        }
        const note = useWorkstationNotesStore.getState().upsertWorkflowNote({
          id: `note:situation-room-job:${jobId}`,
          title: job.title,
          topic: "situation-room-job",
          body: lines.join("\n"),
          citations,
          snippets,
          trace_id: job.room_id,
        });
        return note;
      },
      attachJobToHelixAsk: (jobId) => {
        const job = get().jobs[jobId];
        if (!job) return;
        const outputs = job.output_ids.map((outputId) => get().outputs[outputId]).filter(Boolean);
        emitHelixAskLiveEvent({
          contextId: HELIX_ASK_CONTEXT_ID.desktop,
          traceId: job.room_id,
          entry: {
            id: `situation-room-job-attached:${jobId}:${Date.now()}`,
            text: `attached situation room job "${job.title}" with ${outputs.length} output(s)`,
            tool: "situation-room.jobs",
            ts: nowIso(),
            meta: {
              kind: "situation_room_job_attachment",
              job_id: jobId,
              room_id: job.room_id,
              job_kind: job.kind,
              job_spec_hash: job.job_spec_hash,
              output_ids: outputs.map((output) => output.output_id),
              latest_outputs: outputs.slice(-5).map((output) => ({
                output_id: output.output_id,
                artifact_kind: output.artifact_kind,
                derived_from_event_ids: output.derived_from_event_ids,
                text: output.text,
              })),
            },
          },
        });
      },
      createTurnContextSnapshot: (input) => {
        const state = get();
        const jobOutputs = (input.job_ids ?? [])
          .map((jobId) => {
            const job = state.jobs[jobId];
            if (!job || job.room_id !== input.room_id) return null;
            const outputs = job.output_ids.map((outputId) => state.outputs[outputId]).filter(Boolean);
            if (outputs.length === 0) {
              return { job_id: jobId, from_seq: 0, to_seq: -1, output_ids: [] };
            }
            return {
              job_id: jobId,
              from_seq: Math.min(...outputs.map((output) => output.seq)),
              to_seq: Math.max(...outputs.map((output) => output.seq)),
              output_ids: outputs.map((output) => output.output_id),
            };
          })
          .filter(Boolean) as HelixTurnContextSnapshot["job_outputs"];
        return {
          snapshot_id: createId("snapshot"),
          created_at: nowIso(),
          room_id: input.room_id,
          source_ranges: input.source_ranges ?? [],
          job_outputs: jobOutputs,
        };
      },
      reset: () =>
        set({
          jobs: {},
          job_order: [],
          outputs: {},
        }),
    }),
    {
      name: SITUATION_ROOM_JOBS_STORAGE_KEY,
      partialize: (state) => ({
        jobs: state.jobs,
        job_order: state.job_order,
        outputs: state.outputs,
      }),
    },
  ),
);

