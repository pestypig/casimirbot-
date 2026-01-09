import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { listKnowledgeFiles } from "@/lib/agi/knowledge-store";
import {
  createCoverJob,
  fetchCoverJob,
  fetchJobStatus,
  requestGeneration,
} from "@/lib/api/noiseGens";
import { isAudioKnowledgeFile } from "@/lib/knowledge/audio";
import {
  applyAtomSelectionToPlan,
  buildAtomIndex,
} from "@/lib/knowledge/atom-curation";
import {
  analyzeOriginalForPlan,
  type PlanAnalysis,
} from "@/lib/noise/plan-analysis";
import { resolveAbletonPlanFeatures } from "@/lib/noise/ableton-analysis";
import type {
  JobStatus,
  MoodPreset,
  Original,
  HelixPacket,
  BarWindow,
  CoverJobRequest,
  CoverJob,
  TempoMeta,
  KBTexture,
  KBMatch,
  RenderPlan,
  CoverEvidence,
} from "@/types/noise-gens";
import { cn } from "@/lib/utils";
import {
  fulfillCoverJob,
  canFulfillLocally,
  scoreRenderPlan,
} from "@/lib/noise/cover-runner";
import { autoMatchTexture, resolveTextureById } from "@/lib/noise/kb-autoselect";
import {
  COVER_FLOW_EVENT,
  COVER_FLOW_STORAGE_KEY,
  readCoverFlowPayload,
  type CoverFlowPayload,
} from "@/lib/noise/cover-flow";

export const COVER_DROPPABLE_ID = "noise-cover-creator";

export type RenderJobUpdate = {
  jobId: string;
  status: JobStatus | null;
  original?: Original | null;
  previewUrl?: string | null;
  sourceLabel?: string;
  startedAt?: number;
  evidence?: CoverEvidence;
};

export type RenderJobResult = RenderJobUpdate & { completedAt: number };

type PlanRankCandidate = {
  id: string;
  seed: string;
  plan?: RenderPlan;
  status: "planning" | "scoring" | "scored" | "error";
  idi?: number;
  confidence?: number;
  score?: number;
  error?: string;
};

type PlanAnalysisBundle = {
  analysis: PlanAnalysis | null;
  key?: string;
};

type CoverCreatorProps = {
  selectedOriginal: Original | null;
  onClearSelection: () => void;
  moodPresets: MoodPreset[];
  includeHelixPacket: boolean;
  helixPacket: HelixPacket | null;
  sessionTempo?: TempoMeta | null;
  onRenderJobUpdate?: (event: RenderJobUpdate | null) => void;
  onRenderJobComplete?: (event: RenderJobResult) => void;
};

type JobTracker = {
  id: string;
  status: JobStatus;
  mode: "legacy" | "cover";
  snapshot?: CoverJob;
  sourceLabel?: string;
  original?: Original | null;
  startedAt?: number;
  forceRemote?: boolean;
};

const STATUS_ORDER: JobStatus[] = ["queued", "processing", "ready", "error"];

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

type PlanWindowAnalysis = NonNullable<PlanAnalysis["windows"]>[number];

const planWindowKey = (startBar: number, bars: number) => `${startBar}:${bars}`;

const mergePlanAnalyses = (
  primary: PlanAnalysis | null,
  fallback: PlanAnalysis | null,
): PlanAnalysis | null => {
  if (!primary && !fallback) return null;
  if (!primary) return fallback;
  if (!fallback) return primary;

  const windowMap = new Map<string, PlanWindowAnalysis>();
  const addWindow = (window: PlanWindowAnalysis) => {
    const key = planWindowKey(window.startBar, window.bars);
    windowMap.set(key, { ...window });
  };
  fallback.windows?.forEach(addWindow);
  primary.windows?.forEach((window) => {
    const key = planWindowKey(window.startBar, window.bars);
    const existing = windowMap.get(key);
    windowMap.set(key, {
      startBar: window.startBar,
      bars: window.bars,
      energy:
        typeof window.energy === "number" ? window.energy : existing?.energy,
      density:
        typeof window.density === "number" ? window.density : existing?.density,
      brightness:
        typeof window.brightness === "number"
          ? window.brightness
          : existing?.brightness,
    });
  });

  const windows = windowMap.size
    ? Array.from(windowMap.values()).sort(
        (a, b) => a.startBar - b.startBar || a.bars - b.bars,
      )
    : undefined;

  const energyByBar = primary.energyByBar?.length
    ? primary.energyByBar
    : fallback.energyByBar;
  const sections = primary.sections?.length ? primary.sections : fallback.sections;
  const energyCurve = primary.energyCurve?.length
    ? primary.energyCurve
    : fallback.energyCurve;

  return {
    ...(windows ? { windows } : {}),
    ...(energyByBar?.length ? { energyByBar } : {}),
    ...(sections?.length ? { sections } : {}),
    ...(energyCurve?.length ? { energyCurve } : {}),
  };
};

const TEMPO_STORAGE_KEY = "noisegen:tempo";
const RENDER_PLAN_STORAGE_KEY = "noisegen:renderPlanDraft";

const readStoredTempo = (): TempoMeta | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TEMPO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.bpm === "number" && typeof parsed?.timeSig === "string") {
      return parsed as TempoMeta;
    }
  } catch {
    return null;
  }
  return null;
};

const readStoredRenderPlan = (): string => {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(RENDER_PLAN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

type ParsedRenderPlan = { plan: RenderPlan | null; error?: string };

const parseRenderPlan = (value: string): ParsedRenderPlan => {
  const trimmed = value.trim();
  if (!trimmed) return { plan: null };
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object") {
      return { plan: null, error: "RenderPlan must be a JSON object." };
    }
    if (!Array.isArray((parsed as RenderPlan).windows)) {
      return { plan: null, error: "RenderPlan.windows must be an array." };
    }
    if ((parsed as RenderPlan).windows.length === 0) {
      return { plan: null, error: "RenderPlan.windows must include at least one entry." };
    }
    return { plan: parsed as RenderPlan };
  } catch (error) {
    return {
      plan: null,
      error: error instanceof Error ? error.message : "RenderPlan JSON is invalid.",
    };
  }
};

const KB_TEXTURE_MANIFEST = "/kb-textures/index.json";

type KBTextureOption = KBTexture["id"] | "auto";

export function CoverCreator({
  selectedOriginal,
  onClearSelection,
  moodPresets,
  includeHelixPacket,
  helixPacket,
  sessionTempo,
  onRenderJobUpdate,
  onRenderJobComplete,
}: CoverCreatorProps) {
  const { toast } = useToast();
  const initialRenderPlanDraft = useMemo(() => readStoredRenderPlan(), []);
  const [seed, setSeed] = useState<string>("");
  const [startBar, setStartBar] = useState<number>(1);
  const [endBar, setEndBar] = useState<number>(9);
  const [kbTexture, setKbTexture] = useState<KBTextureOption>("auto");
  const [kbTextures, setKbTextures] = useState<KBTexture[]>([]);
  const [kbTexturesReady, setKbTexturesReady] = useState(false);
  const [autoMatch, setAutoMatch] = useState<KBMatch | null>(null);
  const [sampleInfluence, setSampleInfluence] = useState<number>(0.7);
  const [styleInfluence, setStyleInfluence] = useState<number>(0.3);
  const [weirdness, setWeirdness] = useState<number>(0.2);
  const [renderPlanDraft, setRenderPlanDraft] = useState<string>(initialRenderPlanDraft);
  const [renderPlan, setRenderPlan] = useState<RenderPlan | null>(null);
  const [renderPlanEnabled, setRenderPlanEnabled] = useState(false);
  const [renderPlanError, setRenderPlanError] = useState<string | null>(null);
  const [renderPlanOpen, setRenderPlanOpen] = useState<boolean>(
    () => Boolean(initialRenderPlanDraft),
  );
  const [atomAutoFillRunning, setAtomAutoFillRunning] = useState(false);
  const [atomAutoFillStatus, setAtomAutoFillStatus] = useState<string | null>(
    null,
  );
  const [planRankCount, setPlanRankCount] = useState<number>(3);
  const [planRankCandidates, setPlanRankCandidates] = useState<PlanRankCandidate[]>([]);
  const [planRanking, setPlanRanking] = useState(false);
  const [planRankError, setPlanRankError] = useState<string | null>(null);
  const [planRankStatus, setPlanRankStatus] = useState<string | null>(null);
  const [job, setJob] = useState<JobTracker | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<{ pct: number; stage: string } | null>(null);
  const [fulfillingJobId, setFulfillingJobId] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [coverFlowPayload, setCoverFlowPayload] = useState<CoverFlowPayload | null>(() => readCoverFlowPayload());
  const lastPlanTriggerRef = useRef<string | null>(null);
  const lastPreviewUrlRef = useRef<string | null>(null);
  const lastCompletedJobRef = useRef<string | null>(null);
  const planAnalysisCacheRef = useRef<Map<string, PlanAnalysisBundle | null>>(
    new Map(),
  );
  const { isOver, setNodeRef } = useDroppable({ id: COVER_DROPPABLE_ID });

  const { mutateAsync: queueGeneration, isPending: isRequesting } = useMutation({
    mutationFn: requestGeneration,
  });

  const { mutateAsync: queueCoverJob, isPending: isCoverJobPending } = useMutation({
    mutationFn: (payload: CoverJobRequest) => createCoverJob(payload),
  });

  useEffect(() => {
    let cancelled = false;
    const loadTextures = async () => {
      try {
        const response = await fetch(KB_TEXTURE_MANIFEST, { cache: "no-cache" });
        if (!response.ok) throw new Error(`Failed to load KB textures (${response.status})`);
        const manifest = (await response.json()) as KBTexture[];
        if (!cancelled && Array.isArray(manifest)) {
          const sorted = [...manifest].sort((a, b) => a.name.localeCompare(b.name));
          setKbTextures(sorted);
        }
      } catch (error) {
        console.warn("[CoverCreator] Unable to load KB textures", error);
      } finally {
        if (!cancelled) {
          setKbTexturesReady(true);
        }
      }
    };
    void loadTextures();
    return () => {
      cancelled = true;
    };
  }, []);

  const barWindows = useMemo<BarWindow[]>(() => {
    const start = Math.max(1, Math.round(startBar));
    const end = Math.max(start + 1, Math.round(endBar));
    return [{ startBar: start, endBar: end }];
  }, [startBar, endBar]);

  useEffect(() => {
    if (!sessionTempo) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TEMPO_STORAGE_KEY, JSON.stringify(sessionTempo));
    } catch {
      // ignore persistence issues
    }
  }, [sessionTempo]);

  useEffect(() => {
    if (!initialRenderPlanDraft.trim()) return;
    const { plan, error } = parseRenderPlan(initialRenderPlanDraft);
    if (plan) {
      setRenderPlan(plan);
      setRenderPlanEnabled(true);
      setRenderPlanError(null);
    } else if (error) {
      setRenderPlanError(error);
    }
  }, [initialRenderPlanDraft]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (renderPlanDraft.trim()) {
        window.localStorage.setItem(RENDER_PLAN_STORAGE_KEY, renderPlanDraft);
      } else {
        window.localStorage.removeItem(RENDER_PLAN_STORAGE_KEY);
      }
    } catch {
      // ignore persistence issues
    }
  }, [renderPlanDraft]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleCoverFlow = (event: Event) => {
      const detail = (event as CustomEvent<CoverFlowPayload | null>).detail;
      setCoverFlowPayload(detail ?? null);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === COVER_FLOW_STORAGE_KEY) {
        setCoverFlowPayload(readCoverFlowPayload());
      }
    };
    window.addEventListener(COVER_FLOW_EVENT, handleCoverFlow as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(COVER_FLOW_EVENT, handleCoverFlow as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!selectedOriginal || !kbTextures.length) {
      setAutoMatch(null);
      return;
    }
    const primaryWindow = barWindows[0];
    const match = autoMatchTexture({
      original: selectedOriginal,
      textures: kbTextures,
      window: primaryWindow,
    });
    setAutoMatch(match);
  }, [selectedOriginal, kbTextures, barWindows]);

  const statusDisplay = useMemo(() => {
    if (!job) {
      return STATUS_ORDER.map((status) => ({ status, active: false, error: false }));
    }
    const currentIndex = STATUS_ORDER.indexOf(job.status);
    return STATUS_ORDER.map((status, index) => ({
      status,
      active: index <= currentIndex && job.status !== "error",
      error: job.status === "error" && index === currentIndex,
    }));
  }, [job]);

  useEffect(() => {
    if (!job || job.status === "ready" || job.status === "error") return undefined;
    let cancelled = false;
    const controller = new AbortController();
    const { id, mode } = job;

    const pollLegacy = async () => {
      try {
        const response = await fetchJobStatus(id, controller.signal);
        if (cancelled) return;
        setJob((prev) => {
          if (prev && prev.id === id) {
            return { ...prev, status: response.status };
          }
          const fallbackMeta = job && job.id === id ? job : undefined;
          return {
            id,
            status: response.status,
            mode: "legacy",
            sourceLabel: fallbackMeta?.sourceLabel,
            original: fallbackMeta?.original ?? selectedOriginal,
            startedAt: fallbackMeta?.startedAt ?? Date.now(),
            forceRemote: fallbackMeta?.forceRemote,
          };
        });
        if (response.detail) {
          setJobMessage(response.detail);
        } else {
          setJobMessage(null);
        }
        if (response.status === "ready") {
          toast({
            title: "Generation ready",
            description: "Your Helix cover is available in the Generations feed.",
          });
        } else if (response.status === "error") {
          toast({
            title: "Generation failed",
            description: response.detail ?? "Try another mood preset.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (cancelled) return;
        if ((error as Error).name === "AbortError") return;
        toast({
          title: "Status check failed",
          description: error instanceof Error ? error.message : "Could not refresh job status.",
          variant: "destructive",
        });
      }
    };

    const pollCover = async () => {
      try {
        const response = await fetchCoverJob(id, controller.signal);
        if (cancelled) return;
        setJob((prev) => {
          if (prev && prev.id === id) {
            return { ...prev, status: response.status, snapshot: response };
          }
          const fallbackMeta = job && job.id === id ? job : undefined;
          return {
            id,
            status: response.status,
            mode: "cover",
            snapshot: response,
            sourceLabel: fallbackMeta?.sourceLabel,
            original: fallbackMeta?.original ?? selectedOriginal,
            startedAt: fallbackMeta?.startedAt ?? Date.now(),
            forceRemote: fallbackMeta?.forceRemote ?? response.request?.forceRemote,
          };
        });
        const message =
          response.status === "error"
            ? response.error ?? null
            : response.previewUrl
              ? `Preview available: ${response.previewUrl}`
              : null;
        setJobMessage(message);
        if (response.previewUrl) {
          setLocalPreviewUrl((prev) => (prev === response.previewUrl ? prev : response.previewUrl ?? null));
        }
        if (response.status === "ready" || response.status === "error") {
          setRenderProgress(null);
          setFulfillingJobId((prev) => (prev === id ? null : prev));
        }
        if (response.status === "ready") {
          toast({
            title: "Cover ready",
            description: response.previewUrl
              ? "Preview is ready to play."
              : "Your Helix cover is ready.",
          });
        } else if (response.status === "error") {
          toast({
            title: "Cover job failed",
            description: response.error ?? "Unable to process cover job.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (cancelled) return;
        if ((error as Error).name === "AbortError") return;
        toast({
          title: "Cover status failed",
          description: error instanceof Error ? error.message : "Could not refresh cover job status.",
          variant: "destructive",
        });
      }
    };

    const poll = mode === "cover" ? pollCover : pollLegacy;

    poll();
    const timer = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [job, selectedOriginal, toast]);

  useEffect(() => {
    if (!job || job.mode !== "cover") return undefined;
    if (job.status !== "processing") return undefined;
    if (!job.snapshot) return undefined;
    if (job.forceRemote || job.snapshot.request?.forceRemote) return undefined;
    if (job.snapshot.previewUrl) return undefined;
    if (fulfillingJobId && fulfillingJobId !== job.id) return undefined;
    if (!canFulfillLocally()) return undefined;

    let cancelled = false;
    const controller = new AbortController();
    const jobId = job.id;
    setFulfillingJobId(job.id);
    setRenderProgress((prev) => prev ?? { pct: 0.05, stage: "Preparing offline renderer" });

    void fulfillCoverJob(job.snapshot, {
      signal: controller.signal,
      onProgress: (pct, stage) => {
        if (cancelled) return;
        setRenderProgress({ pct, stage });
        setJobMessage(stage);
      },
    })
      .then((result) => {
        if (cancelled) return;
        setLocalPreviewUrl(result.previewUrl);
        setRenderProgress(null);
        setJobMessage("Preview available");
        setJob((prev) => {
          if (!prev || prev.id !== jobId || !prev.snapshot) return prev;
          const updatedSnapshot: CoverJob = {
            ...prev.snapshot,
            previewUrl: result.previewUrl,
            updatedAt: Date.now(),
            evidence: result.evidence,
          };
          return { ...prev, snapshot: updatedSnapshot };
        });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRenderProgress(null);
        toast({
          title: "Cover renderer failed",
          description: error instanceof Error ? error.message : "Unable to render cover locally.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) {
          setFulfillingJobId((prev) => (prev === job.id ? null : prev));
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [job, fulfillingJobId, toast]);

  useEffect(() => {
    if (!selectedOriginal) {
      setJob(null);
      setJobMessage(null);
      setRenderProgress(null);
      setLocalPreviewUrl(null);
      setFulfillingJobId(null);
      setStartBar(1);
      setEndBar(9);
      setKbTexture("auto");
      setAutoMatch(null);
      setSampleInfluence(0.7);
      setStyleInfluence(0.3);
      setWeirdness(0.2);
      lastCompletedJobRef.current = null;
    }
  }, [selectedOriginal]);

  useEffect(() => {
    if (includeHelixPacket && typeof helixPacket?.weirdness === "number") {
      setWeirdness(clamp01(helixPacket.weirdness));
    }
  }, [includeHelixPacket, helixPacket?.weirdness]);

  useEffect(() => {
    if (!coverFlowPayload?.kbTexture) return;
    setKbTexture((current) =>
      current === coverFlowPayload.kbTexture ? current : (coverFlowPayload.kbTexture as KBTextureOption),
    );
  }, [coverFlowPayload?.kbTexture]);

  const formattedDuration = useMemo(() => {
    if (!selectedOriginal) return null;
    const totalSeconds = Math.round(selectedOriginal.duration ?? 0);
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [selectedOriginal]);

  const coverFlowAttachmentCount = coverFlowPayload?.knowledgeFileIds?.length ?? 0;

  const immersionEvidence = job?.snapshot?.evidence ?? null;

  const immersionCard = useMemo(() => {
    if (!immersionEvidence) return null;
    const { idi, idiConfidence, immersion } = immersionEvidence;
    const idiClamped = clamp01(idi);
    const confClamped = clamp01(idiConfidence);
    const idiPct = Math.round(idiClamped * 100);
    const confPct = Math.round(confClamped * 100);
    const gaugeColor =
      idiClamped >= 0.75 ? "bg-emerald-500" : idiClamped >= 0.6 ? "bg-amber-400" : "bg-slate-500";
    const chipTuples: Array<{ key: string; label: string }> = [
      { key: "resolve4_low", label: `4->4 L ${Math.round(clamp01(immersion.resolve4_low) * 100)}%` },
      { key: "resolve4_high", label: `4->4 H ${Math.round(clamp01(immersion.resolve4_high) * 100)}%` },
      { key: "resolve8_low", label: `8->8 L ${Math.round(clamp01(immersion.resolve8_low) * 100)}%` },
      { key: "resolve8_high", label: `8->8 H ${Math.round(clamp01(immersion.resolve8_high) * 100)}%` },
      { key: "bassline", label: `Bass div ${Math.round(clamp01(immersion.bassline_diversity) * 100)}%` },
      { key: "melody", label: `Mel div ${Math.round(clamp01(immersion.melody_division_rate) * 100)}%` },
      { key: "dyads", label: `Dyads ${Math.round(clamp01(immersion.dyadness) * 100)}%` },
      { key: "chords", label: `Chords ${Math.round(clamp01(immersion.chordness) * 100)}%` },
    ];
    return (
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-300">
        <div className="flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wide text-[11px] text-slate-400">
            Immersion
          </span>
          <span className="font-semibold text-slate-100">
            {idiPct}%
            <span className="ml-2 font-normal text-slate-500">conf {confPct}%</span>
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
          <div
            className={cn("h-full rounded-full transition-all", gaugeColor)}
            style={{ width: `${idiPct}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {chipTuples.map((chip) => (
            <Badge key={chip.key} variant="secondary" className="bg-slate-800/90 text-slate-100">
              {chip.label}
            </Badge>
          ))}
        </div>
      </div>
    );
  }, [immersionEvidence]);

  const barWindowRange = useMemo(() => {
    const start = barWindows[0]?.startBar ?? 1;
    const end = barWindows[0]?.endBar ?? start + 1;
    return { start, end };
  }, [barWindows]);

  const renderPlanSummary = useMemo(() => {
    if (!renderPlan) return null;
    const windows = renderPlan.windows ?? [];
    let minStart: number | null = null;
    let maxEnd: number | null = null;
    let materialCount = 0;
    let textureCount = 0;
    let eqCount = 0;
    let fxCount = 0;
    for (const window of windows) {
      if (window.material) materialCount += 1;
      if (window.texture) textureCount += 1;
      if (window.texture?.eqPeaks?.length) eqCount += 1;
      if (window.texture?.fx) fxCount += 1;
      const start = Number(window.startBar);
      const bars = Number(window.bars);
      if (Number.isFinite(start) && Number.isFinite(bars)) {
        const end = start + bars;
        minStart = minStart === null ? start : Math.min(minStart, start);
        maxEnd = maxEnd === null ? end : Math.max(maxEnd, end);
      }
    }
    return {
      windowCount: windows.length,
      minStart,
      maxEnd,
      materialCount,
      textureCount,
      eqCount,
      fxCount,
      bpm: renderPlan.global?.bpm,
      sectionCount: renderPlan.global?.sections?.length ?? 0,
      energyPoints: renderPlan.global?.energyCurve?.length ?? 0,
    };
  }, [renderPlan]);

  const applyRenderPlanDraft = useCallback(() => {
    const { plan, error } = parseRenderPlan(renderPlanDraft);
    if (plan) {
      setRenderPlan(plan);
      setRenderPlanEnabled(true);
      setRenderPlanError(null);
      return;
    }
    setRenderPlan(null);
    setRenderPlanEnabled(false);
    setRenderPlanError(error ?? "RenderPlan JSON is invalid.");
  }, [renderPlanDraft]);

  const formatRenderPlanDraft = useCallback(() => {
    const { plan, error } = parseRenderPlan(renderPlanDraft);
    if (!plan) {
      setRenderPlanError(error ?? "RenderPlan JSON is invalid.");
      return;
    }
    setRenderPlanDraft(JSON.stringify(plan, null, 2));
    setRenderPlanError(null);
  }, [renderPlanDraft]);

  const clearRenderPlanDraft = useCallback(() => {
    setRenderPlanDraft("");
    setRenderPlan(null);
    setRenderPlanEnabled(false);
    setRenderPlanError(null);
  }, []);

  const autoFillPlanAtoms = useCallback(async () => {
    setAtomAutoFillStatus(null);
    const { plan, error } = parseRenderPlan(renderPlanDraft);
    if (!plan) {
      setRenderPlanError(error ?? "RenderPlan JSON is invalid.");
      setAtomAutoFillStatus(
        "Paste a RenderPlan JSON before auto-filling atoms.",
      );
      return;
    }
    setAtomAutoFillRunning(true);
    try {
      const files = await listKnowledgeFiles();
      const audioFiles = files.filter(isAudioKnowledgeFile);
      if (!audioFiles.length) {
        setAtomAutoFillStatus(
          "No audio files found in the knowledge library.",
        );
        return;
      }
      const index = buildAtomIndex(audioFiles);
      const tempo =
        sessionTempo ??
        selectedOriginal?.tempo ??
        readStoredTempo() ??
        undefined;
      let result = applyAtomSelectionToPlan(plan, index, {
        tempo,
        requireAtomTag: true,
      });
      let fallbackNote = "";
      if (result.appliedCount === 0) {
        const fallback = applyAtomSelectionToPlan(plan, index, {
          tempo,
          requireAtomTag: false,
        });
        if (fallback.appliedCount > 0) {
          result = fallback;
          fallbackNote = " using untagged audio";
        }
      }
      if (result.appliedCount === 0) {
        setAtomAutoFillStatus(
          "No atom-tagged audio found. Tag atoms or run analysis first.",
        );
        return;
      }
      setRenderPlan(result.plan);
      setRenderPlanDraft(JSON.stringify(result.plan, null, 2));
      setRenderPlanEnabled(true);
      setRenderPlanError(null);
      setAtomAutoFillStatus(
        `Filled ${result.appliedCount} window(s)${fallbackNote}.`,
      );
    } catch (error) {
      setAtomAutoFillStatus(
        error instanceof Error ? error.message : "Auto-fill failed.",
      );
    } finally {
      setAtomAutoFillRunning(false);
    }
  }, [renderPlanDraft, selectedOriginal, sessionTempo]);

  const resolvePlanAnalysis = useCallback(
    async (coverRequest: CoverJobRequest): Promise<PlanAnalysisBundle | null> => {
      const tempoMeta =
        coverRequest.tempo ??
        sessionTempo ??
        selectedOriginal?.tempo ??
        readStoredTempo();
      const normalizedWindows = coverRequest.barWindows.map((window) => ({
        startBar: Math.max(1, Math.floor(window.startBar)),
        endBar: Math.max(Math.floor(window.endBar), Math.floor(window.startBar) + 1),
      }));
      const knowledgeFileIds = coverRequest.knowledgeFileIds ?? coverFlowPayload?.knowledgeFileIds;
      const normalizedKnowledgeIds = Array.isArray(knowledgeFileIds)
        ? Array.from(new Set(knowledgeFileIds)).sort()
        : [];
      const trackId = coverFlowPayload?.trackId;
      const trackName = coverFlowPayload?.trackName ?? selectedOriginal?.title;
      const key = JSON.stringify({
        originalId: coverRequest.originalId,
        tempo: tempoMeta
          ? {
              bpm: tempoMeta.bpm,
              timeSig: tempoMeta.timeSig,
              offsetMs: tempoMeta.offsetMs,
              barsInLoop: tempoMeta.barsInLoop,
              quantized: tempoMeta.quantized ?? true,
            }
          : null,
        barWindows: normalizedWindows,
        knowledgeFileIds: normalizedKnowledgeIds,
        trackId,
        trackName,
      });
      if (planAnalysisCacheRef.current.has(key)) {
        return planAnalysisCacheRef.current.get(key) ?? null;
      }
      const abletonFeatures = await resolveAbletonPlanFeatures({
        knowledgeFileIds: normalizedKnowledgeIds,
        trackId,
        trackName,
        barWindows: coverRequest.barWindows,
        tempo: tempoMeta ?? null,
      });
      const audioAnalysis = tempoMeta
        ? await analyzeOriginalForPlan({
            originalId: coverRequest.originalId,
            barWindows: coverRequest.barWindows,
            tempo: tempoMeta,
          })
        : null;
      const mergedAnalysis = mergePlanAnalyses(
        abletonFeatures?.analysis ?? null,
        audioAnalysis,
      );
      const bundle =
        mergedAnalysis || abletonFeatures?.key
          ? { analysis: mergedAnalysis, key: abletonFeatures?.key }
          : null;
      planAnalysisCacheRef.current.set(key, bundle);
      return bundle;
    },
    [coverFlowPayload, selectedOriginal, sessionTempo],
  );

  const applyPlanCandidate = useCallback((candidate: PlanRankCandidate) => {
    if (!candidate.plan) return;
    setRenderPlan(candidate.plan);
    setRenderPlanDraft(JSON.stringify(candidate.plan, null, 2));
    setRenderPlanEnabled(true);
    setRenderPlanOpen(true);
    setRenderPlanError(null);
  }, []);

  const requestPlanCandidate = useCallback(
    async (
      coverRequest: CoverJobRequest,
      seedValue: string,
      analysisBundle?: PlanAnalysisBundle | null,
    ): Promise<RenderPlan> => {
      const payload = {
        originalId: coverRequest.originalId,
        barWindows: coverRequest.barWindows,
        tempo: coverRequest.tempo ?? undefined,
        kbTexture: coverRequest.kbTexture ?? null,
        base: {
          sampleInfluence: coverRequest.sampleInfluence ?? 0.7,
          styleInfluence: coverRequest.styleInfluence ?? 0.3,
          weirdness: coverRequest.weirdness ?? 0.2,
        },
        analysis: analysisBundle?.analysis ?? undefined,
        key: analysisBundle?.key ?? undefined,
        seed: seedValue,
      };
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Plan request failed (${response.status})`);
      }
      const json = (await response.json()) as { renderPlan?: RenderPlan };
      if (!json?.renderPlan || !Array.isArray(json.renderPlan.windows)) {
        throw new Error("Plan response missing renderPlan windows.");
      }
      return json.renderPlan;
    },
    [],
  );

  const buildCoverRequest = useCallback(() => {
    if (!selectedOriginal) return null;
    const windows = barWindows;
    const linkHelix = includeHelixPacket && Boolean(helixPacket);
    const resolvedSampleInfluence = clamp01(sampleInfluence);
    const resolvedStyleInfluence = clamp01(styleInfluence);
    const resolvedWeirdness =
      linkHelix && typeof helixPacket?.weirdness === "number"
        ? clamp01(helixPacket.weirdness)
        : clamp01(weirdness);
    const autoTextureId = autoMatch?.kb.id ?? null;
    const coverFlowTextureId = coverFlowPayload?.kbTexture ?? null;
    const resolvedTexture =
      kbTexture === "auto" ? autoTextureId ?? coverFlowTextureId : kbTexture;
    const tempoMeta = sessionTempo ?? selectedOriginal.tempo ?? readStoredTempo();
    const kbConfidence =
      kbTexture === "auto" && typeof autoMatch?.confidence === "number"
        ? autoMatch.confidence
        : undefined;
    const knowledgeFileIds = coverFlowPayload?.knowledgeFileIds;
    const forceRemote = Boolean(coverFlowPayload?.forceRemote);
    const resolvedRenderPlan =
      renderPlanEnabled && renderPlan ? renderPlan : undefined;

    const coverRequest: CoverJobRequest = {
      originalId: selectedOriginal.id,
      barWindows: windows,
      linkHelix,
      helix: linkHelix && helixPacket ? helixPacket : undefined,
      kbTexture: resolvedTexture ?? null,
      sampleInfluence: resolvedSampleInfluence,
      styleInfluence: resolvedStyleInfluence,
      weirdness: resolvedWeirdness,
      tempo: tempoMeta ?? undefined,
      renderPlan: resolvedRenderPlan,
    };
    if (typeof kbConfidence === "number") {
      coverRequest.kbConfidence = kbConfidence;
    }
    if (Array.isArray(knowledgeFileIds) && knowledgeFileIds.length > 0) {
      coverRequest.knowledgeFileIds = knowledgeFileIds;
    }
    if (forceRemote) {
      coverRequest.forceRemote = true;
    }
    const startLabel = windows[0]?.startBar ?? 1;
    const endLabel = (windows[0]?.endBar ?? 2) - 1;
    return { coverRequest, startLabel, endLabel, linkHelix };
  }, [
    barWindows,
    autoMatch,
    helixPacket,
    includeHelixPacket,
    kbTexture,
    sampleInfluence,
    selectedOriginal,
    sessionTempo,
    styleInfluence,
    weirdness,
    coverFlowPayload,
    renderPlan,
    renderPlanEnabled,
  ]);

  const runPlanRanking = useCallback(async () => {
    setPlanRankError(null);
    setPlanRankStatus(null);
    setPlanRankCandidates([]);

    if (!selectedOriginal) {
      setPlanRankError("Select an original before ranking plans.");
      return;
    }
    if (!canFulfillLocally()) {
      setPlanRankError("Offline rendering is not supported in this browser.");
      return;
    }
    const bundle = buildCoverRequest();
    if (!bundle) {
      setPlanRankError("Configure bar windows before ranking plans.");
      return;
    }

    const count = Math.max(1, Math.min(6, Math.round(planRankCount)));
    const baseSeed = seed.trim() ? seed.trim() : selectedOriginal.id;
    const timestamp = Date.now().toString(36);
    const results: PlanRankCandidate[] = [];
    setPlanRanking(true);

    setPlanRankStatus("Analyzing source for plan...");
    const analysisBundle = await resolvePlanAnalysis(bundle.coverRequest);

    for (let index = 0; index < count; index += 1) {
      const candidateId = `candidate-${index + 1}`;
      const seedValue = `${baseSeed}-${timestamp}-${index + 1}`;
      let candidate: PlanRankCandidate = {
        id: candidateId,
        seed: seedValue,
        status: "planning",
      };
      results.push(candidate);
      setPlanRankCandidates([...results]);
      setPlanRankStatus(`Generating plan ${index + 1} of ${count}...`);

      try {
        const plan = await requestPlanCandidate(
          bundle.coverRequest,
          seedValue,
          analysisBundle,
        );
        candidate = { ...candidate, plan, status: "scoring" };
        results[index] = candidate;
        setPlanRankCandidates([...results]);
        setPlanRankStatus(`Scoring plan ${index + 1} of ${count}...`);

        const score = await scoreRenderPlan(
          { ...bundle.coverRequest, renderPlan: undefined },
          plan,
        );
        const idi = score.idi;
        const confidence = score.idiConfidence;
        const weightedScore = idi * confidence;
        candidate = {
          ...candidate,
          status: "scored",
          idi,
          confidence,
          score: weightedScore,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Plan ranking failed.";
        candidate = { ...candidate, status: "error", error: message };
      }

      results[index] = candidate;
      setPlanRankCandidates([...results]);
    }

    const best = results
      .filter((entry) => entry.status === "scored" && entry.plan)
      .sort((a, b) => (b.score ?? b.idi ?? 0) - (a.score ?? a.idi ?? 0))[0];
    if (best) {
      applyPlanCandidate(best);
    } else if (results.length > 0) {
      setPlanRankError("No plan scored successfully. Check the console or try fewer candidates.");
    }
    setPlanRanking(false);
    setPlanRankStatus(null);
  }, [
    applyPlanCandidate,
    buildCoverRequest,
    planRankCount,
    resolvePlanAnalysis,
    requestPlanCandidate,
    scoreRenderPlan,
    seed,
    selectedOriginal,
  ]);

  const weirdnessLocked = includeHelixPacket && Boolean(helixPacket);

  type SubmitCoverJobOptions = {
    coverRequest: CoverJobRequest;
    startLabel: number;
    endLabel: number;
    sourceLabel: string;
    allowLegacyFallback: boolean;
    fallbackPreset?: MoodPreset;
    numericSeed?: number;
  };

  const submitCoverJob = useCallback(
    async ({
      coverRequest,
      startLabel,
      endLabel,
      sourceLabel,
      allowLegacyFallback,
      fallbackPreset,
      numericSeed,
    }: SubmitCoverJobOptions) => {
      try {
        const response = await queueCoverJob(coverRequest);
        const now = Date.now();
        const snapshot: CoverJob = {
          id: response.id,
          status: "processing",
          request: coverRequest,
          createdAt: now,
          updatedAt: now,
        };
        const startedAt = Date.now();
        setJob({
          id: response.id,
          status: "processing",
          mode: "cover",
          snapshot,
          sourceLabel,
          original: selectedOriginal,
          startedAt,
          forceRemote: coverRequest.forceRemote,
        });
        onRenderJobUpdate?.({
          jobId: response.id,
          status: "processing",
          original: selectedOriginal,
          previewUrl: null,
          sourceLabel,
          startedAt,
          evidence: snapshot.evidence,
        });
        setJobMessage(coverRequest.forceRemote ? "Queued for remote rendering" : "Queued for local rendering");
        setRenderProgress({ pct: 0.05, stage: "Queued" });
        setLocalPreviewUrl(null);
        setFulfillingJobId(null);
        toast({
          title: `${sourceLabel} queued`,
          description: `Rendering ${selectedOriginal?.title ?? "track"} across bars ${startLabel}-${endLabel}.`,
        });
        return;
      } catch (error) {
        if (
          !allowLegacyFallback ||
          !fallbackPreset ||
          !selectedOriginal
        ) {
          throw error;
        }
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[CoverCreator] cover job request failed, falling back to legacy generate", error);
        }
        setRenderProgress(null);
        setLocalPreviewUrl(null);
        setFulfillingJobId(null);
        try {
          const payload = {
            originalId: selectedOriginal.id,
            moodId: fallbackPreset.id,
            seed: numericSeed,
            helixPacket: includeHelixPacket ? helixPacket ?? undefined : undefined,
          };
          const legacyJob = await queueGeneration(payload);
          const startedAt = Date.now();
          setJob({
            id: legacyJob.jobId,
            status: "queued",
            mode: "legacy",
            sourceLabel: fallbackPreset.label,
            original: selectedOriginal,
            startedAt,
          });
          setJobMessage("Falling back to legacy generator");
          onRenderJobUpdate?.({
            jobId: legacyJob.jobId,
            status: "queued",
            original: selectedOriginal,
            previewUrl: null,
            sourceLabel: fallbackPreset.label,
            startedAt,
            evidence: undefined,
          });
          toast({
            title: "Legacy render queued",
            description: `${sourceLabel} is rendering using the legacy pipeline.`,
          });
        } catch (legacyError) {
          toast({
            title: "Cover job failed",
            description:
              legacyError instanceof Error
                ? legacyError.message
                : "Unable to queue cover job.",
            variant: "destructive",
          });
        }
      }
    },
    [helixPacket, includeHelixPacket, queueCoverJob, queueGeneration, selectedOriginal, toast],
  );

  useEffect(() => {
    const previous = lastPreviewUrlRef.current;
    if (previous && previous.startsWith("blob:") && previous !== localPreviewUrl) {
      URL.revokeObjectURL(previous);
    }
    lastPreviewUrlRef.current = localPreviewUrl ?? null;
    return () => {
      const current = lastPreviewUrlRef.current;
      if (current && current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
        lastPreviewUrlRef.current = null;
      }
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    if (!onRenderJobUpdate) return;
    if (!job) {
      onRenderJobUpdate(null);
      return;
    }
    const previewUrl = job.snapshot?.previewUrl ?? localPreviewUrl ?? null;
    onRenderJobUpdate({
      jobId: job.id,
      status: job.status,
      original: job.original ?? selectedOriginal,
      previewUrl,
      sourceLabel: job.sourceLabel,
      startedAt: job.startedAt,
      evidence: job.snapshot?.evidence,
    });
  }, [job, localPreviewUrl, onRenderJobUpdate, selectedOriginal]);

  useEffect(() => {
    if (!onRenderJobComplete) return;
    if (!job || job.status !== "ready") return;
    if (lastCompletedJobRef.current === job.id) return;
    lastCompletedJobRef.current = job.id;
    const previewUrl = job.snapshot?.previewUrl ?? localPreviewUrl ?? null;
    onRenderJobComplete({
      jobId: job.id,
      status: job.status,
      original: job.original ?? selectedOriginal,
      previewUrl,
      sourceLabel: job.sourceLabel,
      startedAt: job.startedAt,
      completedAt: Date.now(),
      evidence: job.snapshot?.evidence,
    });
  }, [job, localPreviewUrl, onRenderJobComplete, selectedOriginal]);

  const handleQueueGeneration = async (preset: MoodPreset) => {
    if (!selectedOriginal || isRequesting || isCoverJobPending) return;
    if (includeHelixPacket && !helixPacket) {
      toast({
        title: "Helix packet unavailable",
        description: "Open Helix Observables and start a run to capture the packet.",
        variant: "destructive",
      });
      return;
    }

    const bundle = buildCoverRequest();
    if (!bundle) return;
    const numericSeed = seed.trim() ? Number(seed.trim()) : undefined;

    await submitCoverJob({
      coverRequest: bundle.coverRequest,
      startLabel: bundle.startLabel,
      endLabel: bundle.endLabel,
      sourceLabel: preset.label,
      allowLegacyFallback: true,
      fallbackPreset: preset,
      numericSeed,
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const triggerFromPlan = (token: string | null) => {
      if (!token || lastPlanTriggerRef.current === token) return;
      lastPlanTriggerRef.current = token;
      if (isCoverJobPending) {
        toast({
          title: "Renderer busy",
          description: "Please wait for the current cover job to finish queuing.",
        });
        return;
      }
      if (!selectedOriginal) {
        toast({
          title: "Plan render unavailable",
          description: "Select an original before executing render_cover.",
          variant: "destructive",
        });
        return;
      }
      const bundle = buildCoverRequest();
      if (!bundle) {
        toast({
          title: "Plan render unavailable",
          description: "Configure bar windows before executing render_cover.",
          variant: "destructive",
        });
        return;
      }
      void submitCoverJob({
        coverRequest: bundle.coverRequest,
        startLabel: bundle.startLabel,
        endLabel: bundle.endLabel,
        sourceLabel: "Helix plan",
        allowLegacyFallback: false,
      }).catch((error) => {
        toast({
          title: "Plan render failed",
          description: error instanceof Error ? error.message : "Unable to execute render_cover plan.",
          variant: "destructive",
        });
      });
    };

    const storageHandler = (event: StorageEvent) => {
      if (event.key === "noisegen:renderCover") {
        triggerFromPlan(typeof event.newValue === "string" ? event.newValue : null);
      }
    };

    window.addEventListener("storage", storageHandler);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("helix-exec");
      channel.addEventListener("message", (event) => {
        const record = event.data;
        if (!record || typeof record !== "object") return;
        const results = Array.isArray(record?.results) ? record.results : [];
        const triggered = results.some(
          (entry: { action?: { op?: string }; status?: string }) =>
            entry?.action?.op === "render_cover" && entry?.status === "applied",
        );
        if (triggered) {
          triggerFromPlan(typeof record?.planId === "string" ? record.planId : Date.now().toString(36));
        }
      });
    }

    return () => {
      window.removeEventListener("storage", storageHandler);
      channel?.close();
    };
  }, [buildCoverRequest, isCoverJobPending, selectedOriginal, submitCoverJob, toast]);

  return (
    <div className="rounded-3xl border border-border bg-background/60 p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/70 p-6 text-center",
            isOver ? "border-primary bg-primary/5" : undefined,
            selectedOriginal ? "ring-2 ring-primary/60" : undefined,
          )}
        >
          {selectedOriginal ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-100">{selectedOriginal.title}</h3>
                <Button variant="ghost" size="icon" onClick={onClearSelection} aria-label="Clear selection">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedOriginal.artist}
                {formattedDuration ? `  •  ${formattedDuration}` : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/40 text-primary">
                  {selectedOriginal.listens.toLocaleString()} listens
                </Badge>
                {sessionTempo ? (
                  <Badge variant="outline" className="border-sky-400/40 text-sky-200">
                    {`${Math.round(sessionTempo.bpm)} BPM · ${sessionTempo.timeSig ?? "4/4"}`}
                  </Badge>
                ) : null}
                {includeHelixPacket ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-emerald-400/40 text-emerald-300",
                      !helixPacket && "border-amber-400/40 text-amber-300",
                    )}
                  >
                    {helixPacket ? "Helix packet linked" : "Helix packet missing"}
                  </Badge>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Sparkles className="mx-auto h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">
                Drop an original to start a Helix cover
              </h3>
              <p className="text-xs text-muted-foreground">
                Drag a track from the Originals list or select one using the keyboard.
              </p>
            </div>
          )}
          {coverFlowAttachmentCount ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="border-primary/30 text-primary">
                {coverFlowAttachmentCount} knowledge stem{coverFlowAttachmentCount === 1 ? "" : "s"}
              </Badge>
              {coverFlowPayload?.trackName ? (
                <span className="text-slate-300">
                  From {coverFlowPayload.trackName}
                  {coverFlowPayload?.albumName ? ` · ${coverFlowPayload.albumName}` : ""}
                </span>
              ) : null}
              {coverFlowPayload?.kbTexture ? (
                <Badge variant="outline" className="border-sky-400/40 text-sky-200">
                  Texture {coverFlowPayload.kbTexture}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-4 lg:max-w-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              inputMode="numeric"
              pattern="\d*"
              placeholder="Seed (optional)"
              value={seed}
              onChange={(event) => setSeed(event.target.value.replace(/[^\d]/g, ""))}
              className="max-w-[140px]"
              aria-label="Generation seed"
            />
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (!selectedOriginal) return;
                const preset = moodPresets[0];
                if (preset) {
                  void handleQueueGeneration(preset);
                }
              }}
              disabled={!selectedOriginal || isRequesting || isCoverJobPending}
            >
              <Sparkles className="h-4 w-4" />
              Quick render
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {moodPresets.length ? (
              moodPresets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={!selectedOriginal || isRequesting || isCoverJobPending}
                  onClick={() => void handleQueueGeneration(preset)}
                >
                  {preset.label}
                  <Badge variant="secondary" className="ml-2 text-[10px] uppercase tracking-wider">
                    {preset.description ?? "Helix"}
                  </Badge>
                </Button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                Mood presets are loading. Once ready, choose one to generate a Helix cover.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Bar window
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <span>Start</span>
                  <Input
                    type="number"
                    min={1}
                    value={startBar}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isNaN(next)) return;
                      const safe = Math.max(1, Math.min(endBar - 1, Math.round(next)));
                      setStartBar(safe);
                    }}
                    className="h-9 w-20"
                  />
                  <span>End</span>
                  <Input
                    type="number"
                    min={startBar + 1}
                    value={endBar}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      if (Number.isNaN(next)) return;
                      const safe = Math.max(startBar + 1, Math.round(next));
                      setEndBar(safe);
                    }}
                    className="h-9 w-20"
                  />
                  <span className="text-xs text-muted-foreground">(exclusive)</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Texture
                </div>
                <select
                  value={kbTexture}
                  onChange={(event) => setKbTexture(event.target.value as KBTextureOption)}
                  className="mt-2 h-9 w-full rounded border border-border bg-background px-2 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  disabled={!kbTexturesReady && kbTextures.length === 0}
                >
                  <option value="auto">
                    {autoMatch
                      ? `Auto-match: ${autoMatch.kb.name} (${Math.round(autoMatch.confidence * 100)}%)`
                      : kbTexturesReady
                        ? "Auto-match"
                        : "Loading textures..."}
                  </option>
                  {kbTextures.map((texture) => (
                    <option key={texture.id} value={texture.id}>
                      {texture.name}
                    </option>
                  ))}
                </select>
                {kbTexture === "auto" && autoMatch ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Confidence {Math.round(autoMatch.confidence * 100)}% · {autoMatch.kb.id}
                  </p>
                ) : null}
                {kbTexture !== "auto" ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Using {resolveTextureById(kbTextures, kbTexture)?.name ?? kbTexture}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Sample influence</span>
                    <span>{Math.round(clamp01(sampleInfluence) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={sampleInfluence}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isNaN(value)) return;
                      setSampleInfluence(clamp01(value));
                    }}
                    className="mt-1 h-1.5 w-full accent-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Style influence</span>
                    <span>{Math.round(clamp01(styleInfluence) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={styleInfluence}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isNaN(value)) return;
                      setStyleInfluence(clamp01(value));
                    }}
                    className="mt-1 h-1.5 w-full accent-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Weirdness</span>
                    <span>
                      {Math.round(
                        clamp01(
                          weirdnessLocked && typeof helixPacket?.weirdness === "number"
                            ? helixPacket.weirdness
                            : weirdness,
                        ) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={weirdness}
                    onChange={(event) => {
                      if (weirdnessLocked) return;
                      const value = Number(event.target.value);
                      if (Number.isNaN(value)) return;
                      setWeirdness(clamp01(value));
                    }}
                    disabled={weirdnessLocked}
                    className="mt-1 h-1.5 w-full accent-primary disabled:opacity-60"
                  />
                  {weirdnessLocked ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Locked to Helix packet ({Math.round(clamp01(helixPacket?.weirdness ?? 0) * 100)}%).
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  RenderPlan
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Inspect or edit per-window plans before rendering.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-white/20 text-slate-200",
                    renderPlanEnabled ? "border-emerald-400/50 text-emerald-200" : "",
                  )}
                >
                  {renderPlanEnabled
                    ? "Plan enabled"
                    : renderPlan
                      ? "Plan loaded"
                      : "No plan"}
                </Badge>
                <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={renderPlanEnabled}
                    onChange={(event) => setRenderPlanEnabled(event.target.checked)}
                    disabled={!renderPlan}
                  />
                  Use plan
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRenderPlanOpen((current) => !current)}
                >
                  {renderPlanOpen ? "Hide" : "Edit"}
                </Button>
              </div>
            </div>
            {renderPlanSummary ? (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-slate-800/80 text-slate-200">
                    Windows {renderPlanSummary.windowCount}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-800/80 text-slate-200">
                    Texture {renderPlanSummary.textureCount}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-800/80 text-slate-200">
                    Material {renderPlanSummary.materialCount}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-800/80 text-slate-200">
                    EQ {renderPlanSummary.eqCount}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-800/80 text-slate-200">
                    FX {renderPlanSummary.fxCount}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Render bars {barWindowRange.start}-{Math.max(barWindowRange.start, barWindowRange.end - 1)} (end exclusive)
                  {renderPlanSummary.minStart != null && renderPlanSummary.maxEnd != null
                    ? ` · Plan bars ${renderPlanSummary.minStart}-${Math.max(
                        renderPlanSummary.minStart,
                        renderPlanSummary.maxEnd - 1,
                      )}`
                    : ""}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Global: bpm {renderPlanSummary.bpm ?? "--"} · sections {renderPlanSummary.sectionCount} · energy points {renderPlanSummary.energyPoints}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Paste a RenderPlan JSON to preview per-window routing.
              </p>
            )}
            {renderPlanError ? (
              <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                {renderPlanError}
              </div>
            ) : null}
            {renderPlanOpen ? (
              <div className="mt-3 space-y-2">
                <textarea
                  className="min-h-[160px] w-full rounded-md border border-white/10 bg-black/40 p-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                  placeholder='{"windows":[{"startBar":1,"bars":4,"texture":{"sampleInfluence":0.7}}]}'
                  value={renderPlanDraft}
                  onChange={(event) => setRenderPlanDraft(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={applyRenderPlanDraft}>
                    Apply plan
                  </Button>
                  <Button size="sm" variant="outline" onClick={formatRenderPlanDraft}>
                    Format JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void autoFillPlanAtoms()}
                    disabled={atomAutoFillRunning}
                  >
                    {atomAutoFillRunning ? "Filling atoms..." : "Auto-fill atoms"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearRenderPlanDraft}>
                    Clear
                  </Button>
                </div>
                {atomAutoFillStatus ? (
                  <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-slate-200">
                    {atomAutoFillStatus}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Plan ranking
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Generate candidates from /api/ai/plan, score with immersion, apply the best.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void runPlanRanking()}
                  disabled={planRanking}
                >
                  {planRanking ? "Ranking..." : "Generate + Rank"}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="text-[11px] text-slate-400">Candidates</label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={planRankCount}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isNaN(next)) return;
                    setPlanRankCount(Math.max(1, Math.min(6, Math.round(next))));
                  }}
                  className="h-8 w-20 bg-slate-950/60 text-xs"
                />
                {planRankStatus ? (
                  <span className="text-[11px] text-slate-500">{planRankStatus}</span>
                ) : null}
              </div>
              {planRankError ? (
                <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                  {planRankError}
                </div>
              ) : null}
              {planRankCandidates.length ? (
                <div className="mt-3 space-y-2">
                  {planRankCandidates.map((candidate) => {
                    const scoreLabel =
                      typeof candidate.score === "number"
                        ? `${Math.round(candidate.score * 100)}%`
                        : candidate.status === "scored"
                          ? "--"
                          : "";
                    return (
                      <div
                        key={candidate.id}
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-400">
                            Seed {candidate.seed}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="bg-slate-800/80 text-slate-200">
                              {candidate.status}
                            </Badge>
                            {candidate.status === "scored" ? (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-500/10 text-emerald-200"
                              >
                                {scoreLabel || "scored"}
                              </Badge>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!candidate.plan}
                              onClick={() => applyPlanCandidate(candidate)}
                            >
                              Use
                            </Button>
                          </div>
                        </div>
                        {candidate.status === "scored" ? (
                          <div className="mt-1 text-[11px] text-slate-400">
                            IDI {Math.round((candidate.idi ?? 0) * 100)}% / conf{" "}
                            {Math.round((candidate.confidence ?? 0) * 100)}%
                          </div>
                        ) : null}
                        {candidate.status === "error" ? (
                          <div className="mt-1 text-[11px] text-amber-200">
                            {candidate.error}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-slate-500">
                  No candidates yet. Generate a few to rank.
                </p>
              )}
            </div>
          </div>

          {job ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <div className="text-sm font-semibold text-primary">
                Generation {job.status === "error" ? "failed" : "status"}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {statusDisplay.map((item) => (
                  <div
                    key={item.status}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-wide",
                      item.error
                        ? "border-destructive text-destructive"
                        : item.active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
                    {item.status}
                  </div>
                ))}
              </div>
              {jobMessage ? (
                <div className="mt-3 text-xs text-muted-foreground">{jobMessage}</div>
              ) : null}
              {immersionCard}
              {renderProgress ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{renderProgress.stage}</span>
                    <span>{Math.round(clamp01(renderProgress.pct) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${Math.round(clamp01(renderProgress.pct) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
              {localPreviewUrl ? (
                <div className="mt-3 text-xs">
                  <a
                    href={localPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Open preview
                  </a>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              Pick a mood to send the track to the Helix render queue. Jobs update automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoverCreator;
