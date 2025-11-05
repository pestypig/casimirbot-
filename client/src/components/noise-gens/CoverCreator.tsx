import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  createCoverJob,
  fetchCoverJob,
  fetchJobStatus,
  requestGeneration,
} from "@/lib/api/noiseGens";
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
} from "@/types/noise-gens";
import { cn } from "@/lib/utils";
import { fulfillCoverJob, canFulfillLocally } from "@/lib/noise/cover-runner";
import { autoMatchTexture, resolveTextureById } from "@/lib/noise/kb-autoselect";

export const COVER_DROPPABLE_ID = "noise-cover-creator";

type CoverCreatorProps = {
  selectedOriginal: Original | null;
  onClearSelection: () => void;
  moodPresets: MoodPreset[];
  includeHelixPacket: boolean;
  helixPacket: HelixPacket | null;
  sessionTempo?: TempoMeta | null;
};

type JobTracker = {
  id: string;
  status: JobStatus;
  mode: "legacy" | "cover";
  snapshot?: CoverJob;
};

const STATUS_ORDER: JobStatus[] = ["queued", "processing", "ready", "error"];

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const TEMPO_STORAGE_KEY = "noisegen:tempo";

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

const KB_TEXTURE_MANIFEST = "/kb-textures/index.json";

type KBTextureOption = KBTexture["id"] | "auto";

export function CoverCreator({
  selectedOriginal,
  onClearSelection,
  moodPresets,
  includeHelixPacket,
  helixPacket,
  sessionTempo,
}: CoverCreatorProps) {
  const { toast } = useToast();
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
  const [job, setJob] = useState<JobTracker | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<{ pct: number; stage: string } | null>(null);
  const [fulfillingJobId, setFulfillingJobId] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const lastPlanTriggerRef = useRef<string | null>(null);
  const lastPreviewUrlRef = useRef<string | null>(null);
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
          return prev ?? { id, status: response.status, mode: "legacy" };
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
          return { id, status: response.status, mode: "cover", snapshot: response };
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
  }, [job, toast]);

  useEffect(() => {
    if (!job || job.mode !== "cover") return undefined;
    if (job.status !== "processing") return undefined;
    if (!job.snapshot) return undefined;
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
    }
  }, [selectedOriginal]);

  useEffect(() => {
    if (includeHelixPacket && typeof helixPacket?.weirdness === "number") {
      setWeirdness(clamp01(helixPacket.weirdness));
    }
  }, [includeHelixPacket, helixPacket?.weirdness]);

  const formattedDuration = useMemo(() => {
    if (!selectedOriginal) return null;
    const totalSeconds = Math.round(selectedOriginal.duration ?? 0);
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [selectedOriginal]);

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

  const weirdnessLocked = includeHelixPacket && Boolean(helixPacket);

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
    const resolvedTexture = kbTexture === "auto" ? autoTextureId : kbTexture;
    const tempoMeta = sessionTempo ?? selectedOriginal.tempo ?? readStoredTempo();
    const kbConfidence =
      kbTexture === "auto" && typeof autoMatch?.confidence === "number"
        ? autoMatch.confidence
        : undefined;

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
    };
    if (typeof kbConfidence === "number") {
      coverRequest.kbConfidence = kbConfidence;
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
  ]);

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
        setJob({ id: response.id, status: "processing", mode: "cover", snapshot });
        setJobMessage("Queued for local rendering");
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
          setJob({ id: legacyJob.jobId, status: "queued", mode: "legacy" });
          setJobMessage("Falling back to legacy generator");
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
