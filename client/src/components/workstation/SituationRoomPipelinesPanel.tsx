import React from "react";
import {
  FileText,
  Link2,
  ListChecks,
  PauseCircle,
  Play,
  Plus,
  Save,
  ScrollText,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSituationRoomStore } from "@/store/useSituationRoomStore";
import {
  selectSituationRoomMasterScroll,
  useSituationRoomJobStore,
  type SituationRoomJob,
  type SituationRoomJobInputTextPolicy,
  type SituationRoomJobKind,
  type SituationRoomJobOutputRenderPolicy,
} from "@/store/useSituationRoomJobStore";

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
  const createJobFromRoom = useSituationRoomJobStore((state) => state.createJobFromRoom);
  const createJobFromSource = useSituationRoomJobStore((state) => state.createJobFromSource);
  const processJobNowAsync = useSituationRoomJobStore((state) => state.processJobNowAsync);
  const stopJob = useSituationRoomJobStore((state) => state.stopJob);
  const saveJobAsNote = useSituationRoomJobStore((state) => state.saveJobAsNote);
  const attachJobToHelixAsk = useSituationRoomJobStore((state) => state.attachJobToHelixAsk);
  const [selectedSourceId, setSelectedSourceId] = React.useState<string>("__room__");
  const [selectedJobId, setSelectedJobId] = React.useState<string | undefined>();
  const [jobKind, setJobKind] = React.useState<SituationRoomJobKind>("translate");
  const [targetLanguage, setTargetLanguage] = React.useState("es");
  const [nativeLanguage, setNativeLanguage] = React.useState("en");
  const [inputTextPolicy, setInputTextPolicy] =
    React.useState<SituationRoomJobInputTextPolicy>("source_text_preferred");
  const [outputRenderPolicy, setOutputRenderPolicy] =
    React.useState<SituationRoomJobOutputRenderPolicy>("target_language");
  const masterScrollRef = React.useRef<HTMLDivElement | null>(null);
  const masterScrollPinnedRef = React.useRef(true);

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

  React.useEffect(() => {
    if (!activeJobs.length || (selectedJobId && jobs[selectedJobId])) return;
    setSelectedJobId(activeJobs[0]?.job_id);
  }, [activeJobs, jobs, selectedJobId]);

  React.useEffect(() => {
    const node = masterScrollRef.current;
    if (!node || !masterScrollPinnedRef.current) return;
    node.scrollTop = node.scrollHeight;
  }, [masterScroll.length]);

  const handleMasterScroll = React.useCallback(() => {
    const node = masterScrollRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    masterScrollPinnedRef.current = distanceFromBottom < 48;
  }, []);

  const handleCreateJob = React.useCallback(() => {
    if (!activeRoom) return;
    const input = {
      target_language: jobKind === "translate" ? targetLanguage : undefined,
      native_language: nativeLanguage,
      input_text_policy: inputTextPolicy,
      output_render_policy: outputRenderPolicy,
      status: "queued" as const,
    };
    const job =
      selectedSourceId === "__room__"
        ? createJobFromRoom(activeRoom.room_id, jobKind, input)
        : createJobFromSource(activeRoom.room_id, selectedSourceId, jobKind, input);
    setSelectedJobId(job.job_id);
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

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1 overflow-hidden bg-slate-950/95 text-slate-100 lg:grid-cols-[250px_minmax(330px,1fr)_390px]">
      <section className="flex min-h-0 flex-col border-b border-white/10 bg-slate-950/70 lg:border-b-0 lg:border-r">
        <div className="border-b border-white/10 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Workflow className="h-4 w-4 text-cyan-300" />
            Pipeline Inputs
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Rooms</p>
          <div className="space-y-1.5">
            {roomList.length === 0 ? (
              <p className="text-xs text-slate-500">No situation rooms yet.</p>
            ) : (
              roomList.map((room) => (
                <button
                  key={room.room_id}
                  type="button"
                  onClick={() => setActiveRoom(room.room_id)}
                  className={cn(
                    "w-full rounded-lg px-2 py-2 text-left text-xs transition-colors",
                    room.room_id === activeRoomId
                      ? "bg-cyan-500/20 text-white ring-1 ring-cyan-500/50"
                      : "text-slate-200 hover:bg-white/5",
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
          <p className="mb-2 mt-4 text-[11px] font-semibold text-slate-400">Sources</p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setSelectedSourceId("__room__")}
              className={cn(
                "w-full rounded-lg px-2 py-2 text-left text-xs transition-colors",
                selectedSourceId === "__room__"
                  ? "bg-emerald-500/20 text-white ring-1 ring-emerald-500/50"
                  : "text-slate-200 hover:bg-white/5",
              )}
            >
              Whole room
            </button>
            {activeSources.map((source) => (
              <button
                key={source.source_id}
                type="button"
                onClick={() => setSelectedSourceId(source.source_id)}
                className={cn(
                  "w-full rounded-lg px-2 py-2 text-left text-xs transition-colors",
                  selectedSourceId === source.source_id
                    ? "bg-emerald-500/20 text-white ring-1 ring-emerald-500/50"
                    : "text-slate-200 hover:bg-white/5",
                )}
              >
                <p className="truncate text-sm font-medium">{source.label}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {source.status} / chunks {source.chunk_index}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
        <div className="border-b border-white/10 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ListChecks className="h-4 w-4 text-cyan-300" />
            Live Source Jobs
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_110px_110px_auto]">
            <select
              value={jobKind}
              onChange={(event) => setJobKind(event.target.value as SituationRoomJobKind)}
              className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none"
            >
              {JOB_KIND_OPTIONS.map((option) => (
                <option key={option.kind} value={option.kind}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
              disabled={jobKind !== "translate"}
              className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none disabled:opacity-45"
              aria-label="Target language"
            />
            <input
              value={nativeLanguage}
              onChange={(event) => setNativeLanguage(event.target.value)}
              className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none"
              aria-label="Native language"
            />
            <button
              type="button"
              onClick={handleCreateJob}
              disabled={!activeRoom}
              className="inline-flex items-center justify-center gap-1 rounded border border-cyan-400/40 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="h-3.5 w-3.5" />
              Create
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <select
              value={inputTextPolicy}
              onChange={(event) => setInputTextPolicy(event.target.value as SituationRoomJobInputTextPolicy)}
              disabled={jobKind !== "translate"}
              className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none disabled:opacity-45"
              aria-label="Translation input text policy"
            >
              {INPUT_TEXT_POLICY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Input: {option.label}
                </option>
              ))}
            </select>
            <select
              value={outputRenderPolicy}
              onChange={(event) => setOutputRenderPolicy(event.target.value as SituationRoomJobOutputRenderPolicy)}
              disabled={jobKind !== "translate"}
              className="rounded border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none disabled:opacity-45"
              aria-label="Translation output render policy"
            >
              {OUTPUT_RENDER_POLICY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Output: {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {activeJobs.length === 0 ? (
            <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/20 px-6 text-center text-sm text-slate-400">
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
                    void processJobNowAsync(job.job_id);
                  }}
                  onStop={() => stopJob(job.job_id)}
                  onSave={() => saveJobAsNote(job.job_id)}
                  onAttach={() => attachJobToHelixAsk(job.job_id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="flex min-h-0 flex-col bg-slate-950/70">
        <div className="border-b border-white/10 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ScrollText className="h-4 w-4 text-cyan-300" />
            Master Scroll
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Raw transcript events and derived job outputs, sorted by timestamp and provenance.
          </p>
        </div>
        <div
          ref={masterScrollRef}
          onScroll={handleMasterScroll}
          className="min-h-0 flex-1 overflow-y-auto p-3"
        >
          {masterScroll.length === 0 ? (
            <p className="text-xs text-slate-500">No raw or derived room events yet.</p>
          ) : (
            <div className="space-y-2">
              {masterScroll.map((row) => (
                <div key={row.id} className="rounded border border-white/10 bg-black/20 px-2 py-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>
                      {row.kind === "derived" ? "derived" : "raw"} / {row.event_type}
                    </span>
                    <span>{formatClock(row.ts)}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-100">{row.label}</p>
                  {row.text ? <p className="mt-1 text-xs leading-5 text-slate-300">{row.text}</p> : null}
                  {row.kind === "derived" ? (
                    <>
                      <p className="mt-1 text-[10px] text-slate-500">
                        language {String(row.output.meta.output_language ?? row.output.meta.target_language ?? "n/a")} /{" "}
                        {String(row.output.meta.output_render_policy ?? "target_language")}
                      </p>
                      <p className="mt-1 break-all text-[10px] text-slate-500">
                        from {row.output.derived_from_event_ids.join(", ")}
                      </p>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-white/10 p-3 text-[11px] text-slate-500">
          <FileText className="mr-1 inline h-3.5 w-3.5" />
          Job output is visible here but only reaches Helix Ask when explicitly attached.
        </div>
      </section>
    </div>
  );
}
