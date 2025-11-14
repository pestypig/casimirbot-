import { useState, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AlertTriangle, FolderOpen, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DualTopLists } from "@/components/noise-gens/DualTopLists";
import {
  CoverCreator,
  COVER_DROPPABLE_ID,
  type RenderJobResult,
  type RenderJobUpdate,
} from "@/components/noise-gens/CoverCreator";
import {
  UploadOriginalsModal,
  type UploadCompletePayload,
  type UploadOriginalPrefill,
} from "@/components/noise-gens/UploadOriginalsModal";
import {
  OriginalsLibraryModal,
  type KnowledgeAudioSelection,
} from "@/components/noise-gens/OriginalsLibraryModal";
import {
  RecentUploadsRail,
  type RecentUploadEntry,
} from "@/components/noise-gens/RecentUploadsRail";
import { MoodLegend } from "@/components/noise-gens/MoodLegend";
import HelixMarkIcon from "@/components/icons/HelixMarkIcon";
import ProjectAlbumPanel from "@/components/noise-gen/ProjectAlbumPanel";
import { decodeLayout } from "@/lib/desktop/shareState";
import type { JobStatus, MoodPreset, Original, HelixPacket, TempoMeta } from "@/types/noise-gens";
import { useToast } from "@/hooks/use-toast";
import { useLocalSession } from "@/hooks/useLocalSession";
import type { SessionUser } from "@/lib/auth/session";
import {
  DEMO_PASSWORD,
  DEMO_USERNAME,
  validateDemoCredentials,
} from "@/lib/auth/demoCredentials";

const HELIX_PACKET_STORAGE_KEY = "helix:lastPacket";

const readHelixPacket = (): HelixPacket | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HELIX_PACKET_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const valid =
      typeof parsed?.seed === "string" &&
      typeof parsed?.rc === "number" &&
      typeof parsed?.tau === "number" &&
      typeof parsed?.K === "number" &&
      Array.isArray(parsed?.peaks);
    if (valid) {
      return parsed as HelixPacket;
    }
  } catch {
    return null;
  }
  return null;
};

const RECENT_UPLOADS_STORAGE_KEY = "helix:recentUploads.v1";
const MAX_RECENT_UPLOADS = 5;
const MAX_RENDER_HISTORY = 5;
const FALLBACK_DURATION_SECONDS = 180;
const DEFAULT_BARS_IN_LOOP = 8;

const sanitizeTempoMeta = (value: unknown): TempoMeta | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const bpm = record.bpm;
  const timeSig = record.timeSig;
  const offsetMs = record.offsetMs;
  if (typeof bpm !== "number" || !Number.isFinite(bpm) || bpm <= 0) return undefined;
  if (typeof timeSig !== "string" || !timeSig.includes("/")) return undefined;
  if (typeof offsetMs !== "number" || !Number.isFinite(offsetMs)) return undefined;
  const [numStr, denStr] = timeSig.split("/");
  const numerator = Number(numStr);
  const denominator = Number(denStr);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || numerator <= 0 || denominator <= 0) {
    return undefined;
  }
  const normalizedTimeSig = `${numerator}/${denominator}` as `${number}/${number}`;
  const tempo: TempoMeta = {
    bpm,
    timeSig: normalizedTimeSig,
    offsetMs,
  };
  if (typeof record.barsInLoop === "number" && Number.isFinite(record.barsInLoop)) {
    tempo.barsInLoop = record.barsInLoop;
  }
  if (typeof record.quantized === "boolean") {
    tempo.quantized = record.quantized;
  }
  return tempo;
};

const estimateDurationFromTempo = (tempo?: TempoMeta | null): number | null => {
  if (!tempo) return null;
  if (!Number.isFinite(tempo.bpm) || tempo.bpm <= 0) return null;
  const [numerator] = tempo.timeSig.split("/").map((value) => Number(value));
  const beatsPerBar = Number.isFinite(numerator) && numerator > 0 ? numerator : 4;
  const bars = tempo.barsInLoop ?? DEFAULT_BARS_IN_LOOP;
  const seconds = (bars * beatsPerBar * 60) / tempo.bpm;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

const buildPlaceholderOriginal = (entry: RecentUploadEntry): Original => {
  const duration =
    entry.durationSeconds ??
    estimateDurationFromTempo(entry.tempo) ??
    FALLBACK_DURATION_SECONDS;
  return {
    id: entry.trackId,
    title: entry.title,
    artist: entry.creator || "My Upload",
    listens: 0,
    duration,
    tempo: entry.tempo ?? undefined,
  };
};

const formatRelativeTime = (timestamp: number): string => {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const isShareablePreview = (url?: string | null): boolean => {
  if (!url) return false;
  return !url.startsWith("blob:");
};

type RenderHistoryEntry = {
  jobId: string;
  title: string;
  sourceLabel?: string;
  startedAt: number;
  completedAt?: number;
  status: JobStatus | null;
  previewUrl?: string | null;
};

const sanitizeRecentUploads = (value: unknown): RecentUploadEntry[] => {
  if (!Array.isArray(value)) return [];
  const cleaned: RecentUploadEntry[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    const trackId = typeof record.trackId === "string" ? record.trackId.trim() : "";
    const title = typeof record.title === "string" ? record.title.trim() : "";
    const creator = typeof record.creator === "string" ? record.creator.trim() : "";
    const uploadedAtValue = record.uploadedAt;
    const uploadedAt =
      typeof uploadedAtValue === "number" && Number.isFinite(uploadedAtValue)
        ? uploadedAtValue
        : null;
    if (!trackId || !title || !creator || uploadedAt == null) continue;
    const knowledgeProjectId =
      typeof record.knowledgeProjectId === "string" ? record.knowledgeProjectId : undefined;
    const knowledgeProjectName =
      typeof record.knowledgeProjectName === "string" ? record.knowledgeProjectName : undefined;
    const tempo = sanitizeTempoMeta(record.tempo);
    const durationSeconds =
      typeof record.durationSeconds === "number" && Number.isFinite(record.durationSeconds)
        ? record.durationSeconds
        : tempo
          ? estimateDurationFromTempo(tempo)
          : null;
    cleaned.push({
      trackId,
      title,
      creator,
      uploadedAt,
      knowledgeProjectId,
      knowledgeProjectName,
      tempo,
      durationSeconds: durationSeconds ?? undefined,
    });
    if (cleaned.length >= MAX_RECENT_UPLOADS) break;
  }
  return cleaned;
};

const readRecentUploads = (): RecentUploadEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_UPLOADS_STORAGE_KEY);
    if (!raw) return [];
    return sanitizeRecentUploads(JSON.parse(raw));
  } catch {
    return [];
  }
};

export default function HelixNoiseGensPage() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const { toast } = useToast();
  const [selectedOriginal, setSelectedOriginal] = useState<Original | null>(null);
  const [moodPresets, setMoodPresets] = useState<MoodPreset[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploadPrefill, setUploadPrefill] = useState<UploadOriginalPrefill | null>(null);
  const [recentUploads, setRecentUploads] = useState<RecentUploadEntry[]>(() => readRecentUploads());
  const recentUploadsRef = useRef<RecentUploadEntry[]>(recentUploads);
  const [activeRenderJob, setActiveRenderJob] = useState<RenderHistoryEntry | null>(null);
  const [renderHistory, setRenderHistory] = useState<RenderHistoryEntry[]>([]);
  const [hasGenerations, setHasGenerations] = useState(false);
  const [includeHelixPacket, setIncludeHelixPacket] = useState(Boolean(readHelixPacket()));
  const [helixPacket, setHelixPacket] = useState<HelixPacket | null>(() => readHelixPacket());
  const [sessionTempo, setSessionTempo] = useState<TempoMeta | null>(null);
  const [externalProjectSlug, setExternalProjectSlug] = useState<string | undefined>(undefined);
  const [inlineSignInOpen, setInlineSignInOpen] = useState(false);
  const [libraryInitialProjectId, setLibraryInitialProjectId] = useState<string | undefined>(undefined);
  const [originalAvailabilityVersion, bumpOriginalAvailabilityVersion] = useReducer(
    (value) => value + 1,
    0,
  );
  const { user, signOut, signIn } = useLocalSession();
  const [currentLocation, setLocation] = useLocation();
  const isDesktopContext = currentLocation?.startsWith("/desktop");
  const originalsByIdRef = useRef<Map<string, Original>>(new Map());
  const pendingOriginalsRef = useRef<Map<string, Original>>(new Map());

  const selectOriginal = useCallback(
    (original: Original) => {
      setSelectedOriginal(original);
      setSessionTempo((prev) => original.tempo ?? prev);
      toast({
        title: "Track selected",
        description: `${original.title} is ready for mood blending.`,
      });
    },
    [toast],
  );

  const handleKnowledgeSelection = useCallback(
    ({ project, file }: KnowledgeAudioSelection) => {
      const projectLabel = project.name?.trim() || "My Knowledge";
      const fileType = file.mime || file.type || "audio/wav";
      const instrumental = new File([file.data], file.name, { type: fileType });
      setUploadPrefill({
        instrumental,
        creator: projectLabel,
        sourceHint: `Loaded from ${projectLabel} - ${file.name}`,
        knowledgeProjectId: project.id,
        knowledgeProjectName: projectLabel,
      });
      setUploadOpen(true);
    },
    [setUploadPrefill, setUploadOpen],
  );

  const recordRecentUpload = useCallback((payload: UploadCompletePayload) => {
    setRecentUploads((previous) => {
      const trimmedTitle = payload.title.trim() || payload.title;
      const trimmedCreator = payload.creator.trim() || payload.creator;
      const inferredDuration =
        payload.durationSeconds ??
        estimateDurationFromTempo(payload.tempo) ??
        FALLBACK_DURATION_SECONDS;
      const next: RecentUploadEntry[] = [
        {
          trackId: payload.trackId,
          title: trimmedTitle,
          creator: trimmedCreator,
          uploadedAt: Date.now(),
          knowledgeProjectId: payload.knowledgeProjectId,
          knowledgeProjectName: payload.knowledgeProjectName,
          tempo: payload.tempo,
          durationSeconds: inferredDuration,
        },
        ...previous.filter((entry) => entry.trackId !== payload.trackId),
      ];
      return next.slice(0, MAX_RECENT_UPLOADS);
    });
  }, []);

  const decoratedRecentUploads = useMemo(
    () =>
      recentUploads.map((upload) => {
        const isRanked = originalsByIdRef.current.has(upload.trackId);
        const hasPending = pendingOriginalsRef.current.has(upload.trackId);
        return {
          ...upload,
          isRanked,
          isReady: isRanked || hasPending,
        };
      }),
    [recentUploads, originalAvailabilityVersion],
  );

  const handleOriginalsHydrated = useCallback(
    (originals: Original[]) => {
      const nextMap = new Map<string, Original>();
      for (const original of originals) {
        nextMap.set(original.id, original);
      }
      const previousMap = originalsByIdRef.current;
      originalsByIdRef.current = nextMap;
      const tracked = recentUploadsRef.current;
      const availabilityChanged = tracked.some(
        (entry) => previousMap.has(entry.trackId) !== nextMap.has(entry.trackId),
      );
      let pendingChanged = false;
      for (const original of originals) {
        if (pendingOriginalsRef.current.has(original.id)) {
          pendingOriginalsRef.current.delete(original.id);
          pendingChanged = true;
        }
      }
      if (availabilityChanged || pendingChanged) {
        bumpOriginalAvailabilityVersion();
      }
    },
    [bumpOriginalAvailabilityVersion],
  );

  const handleRecentSelect = useCallback(
    (upload: RecentUploadEntry) => {
      const original =
        originalsByIdRef.current.get(upload.trackId) ??
        pendingOriginalsRef.current.get(upload.trackId);
      if (original) {
        selectOriginal(original);
        return;
      }
      toast({
        title: "Still syncing",
        description: "We will enable selection once this original lands in the ranked list.",
      });
    },
    [selectOriginal, toast],
  );

  const handleRecentReveal = useCallback(
    (upload: RecentUploadEntry) => {
      if (!upload.knowledgeProjectId) {
        toast({
          title: "No linked project",
          description: "This upload was not tied to a My Knowledge project.",
        });
        return;
      }
      setLibraryInitialProjectId(upload.knowledgeProjectId);
      setLibraryOpen(true);
    },
    [setLibraryInitialProjectId, setLibraryOpen, toast],
  );

  const handleRenderJobUpdate = useCallback(
    (update: RenderJobUpdate | null) => {
      if (!update || !update.jobId || !update.status) {
        setActiveRenderJob(null);
        return;
      }
      if (update.status === "ready") {
        setActiveRenderJob(null);
        return;
      }
      setActiveRenderJob({
        jobId: update.jobId,
        title: update.original?.title ?? "Helix render",
        sourceLabel: update.sourceLabel,
        startedAt: update.startedAt ?? Date.now(),
        status: update.status,
        previewUrl: update.previewUrl ?? null,
      });
    },
    [],
  );

  const handleRenderJobComplete = useCallback(
    (result: RenderJobResult) => {
      setActiveRenderJob(null);
      setRenderHistory((previous) => {
        const entry: RenderHistoryEntry = {
          jobId: result.jobId,
          title: result.original?.title ?? "Helix render",
          sourceLabel: result.sourceLabel,
          startedAt: result.startedAt ?? Date.now(),
          completedAt: result.completedAt,
          status: result.status ?? "ready",
          previewUrl: result.previewUrl ?? null,
        };
        const filtered = previous.filter((item) => item.jobId !== result.jobId);
        return [entry, ...filtered].slice(0, MAX_RENDER_HISTORY);
      });
    },
    [],
  );

  const handleUploadComplete = useCallback(
    (payload: UploadCompletePayload) => {
      const trimmedTitle = payload.title.trim() || payload.title;
      const trimmedCreator = payload.creator.trim() || payload.creator;
      const placeholderEntry: RecentUploadEntry = {
        trackId: payload.trackId,
        title: trimmedTitle,
        creator: trimmedCreator,
        uploadedAt: Date.now(),
        knowledgeProjectId: payload.knowledgeProjectId,
        knowledgeProjectName: payload.knowledgeProjectName,
        tempo: payload.tempo,
        durationSeconds:
          payload.durationSeconds ??
          estimateDurationFromTempo(payload.tempo) ??
          FALLBACK_DURATION_SECONDS,
      };
      pendingOriginalsRef.current.set(
        payload.trackId,
        buildPlaceholderOriginal(placeholderEntry),
      );
      bumpOriginalAvailabilityVersion();
      recordRecentUpload(payload);
      toast({
        title: "Upload received",
        description: "We will surface the new original once it is ranked.",
      });
    },
    [recordRecentUpload, toast],
  );

  const handleOpenLibraryRequest = useCallback(() => {
    setLibraryInitialProjectId(undefined);
    setLibraryOpen(true);
  }, [setLibraryInitialProjectId, setLibraryOpen]);

  const handleLibraryOpenChange = useCallback(
    (open: boolean) => {
      setLibraryOpen(open);
      if (!open) {
        setLibraryInitialProjectId(undefined);
      }
    },
    [setLibraryInitialProjectId, setLibraryOpen],
  );

  useEffect(() => {
    const refresh = () => setHelixPacket(readHelixPacket());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === HELIX_PACKET_STORAGE_KEY) {
        setHelixPacket(readHelixPacket());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    recentUploadsRef.current = recentUploads;
  }, [recentUploads]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(RECENT_UPLOADS_STORAGE_KEY, JSON.stringify(recentUploads));
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.warn("[HelixNoiseGens] Failed to persist recent uploads", error);
      }
    }
  }, [recentUploads]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleRecentUploadsStorage = (event: StorageEvent) => {
      if (event.key === RECENT_UPLOADS_STORAGE_KEY) {
        setRecentUploads(readRecentUploads());
      }
    };
    window.addEventListener("storage", handleRecentUploadsStorage);
    return () => window.removeEventListener("storage", handleRecentUploadsStorage);
  }, []);

  useEffect(() => {
    const keepIds = new Set(recentUploads.map((entry) => entry.trackId));
    let changed = false;
    for (const existingId of Array.from(pendingOriginalsRef.current.keys())) {
      if (!keepIds.has(existingId)) {
        pendingOriginalsRef.current.delete(existingId);
        changed = true;
      }
    }
    for (const entry of recentUploads) {
      const placeholder = buildPlaceholderOriginal(entry);
      const existing = pendingOriginalsRef.current.get(entry.trackId);
      if (!existing) {
        pendingOriginalsRef.current.set(entry.trackId, placeholder);
        changed = true;
        continue;
      }
      if (
        existing.title !== placeholder.title ||
        existing.artist !== placeholder.artist ||
        existing.duration !== placeholder.duration
      ) {
        pendingOriginalsRef.current.set(entry.trackId, placeholder);
        changed = true;
      }
    }
    if (changed) {
      bumpOriginalAvailabilityVersion();
    }
  }, [recentUploads, bumpOriginalAvailabilityVersion]);

  useEffect(() => {
    if (!selectedOriginal) return;
    const actual = originalsByIdRef.current.get(selectedOriginal.id);
    if (actual && actual !== selectedOriginal) {
      setSelectedOriginal(actual);
      return;
    }
    if (!actual && !pendingOriginalsRef.current.has(selectedOriginal.id)) {
      setSelectedOriginal(null);
    }
  }, [originalAvailabilityVersion, selectedOriginal]);

  useEffect(() => {
    if (includeHelixPacket) {
      setHelixPacket(readHelixPacket());
    }
  }, [includeHelixPacket]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateFromHash = () => {
      const layout = decodeLayout(window.location.hash ?? "");
      setExternalProjectSlug(layout.projectSlug ?? undefined);
    };
    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    return () => window.removeEventListener("hashchange", updateFromHash);
  }, []);

  useEffect(() => {
    if (!isDesktopContext && inlineSignInOpen) {
      setInlineSignInOpen(false);
    }
  }, [inlineSignInOpen, isDesktopContext]);

  useEffect(() => {
    if (user && inlineSignInOpen) {
      setInlineSignInOpen(false);
    }
  }, [inlineSignInOpen, user]);

  const handleHelixToggle = useCallback((value: boolean) => {
    setIncludeHelixPacket(value);
    if (value) {
      setHelixPacket(readHelixPacket());
    }
  }, []);


  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { over, active } = event;
      if (!over || over.id !== COVER_DROPPABLE_ID) return;
      const original = active.data.current?.original as Original | undefined;
      if (original) {
        selectOriginal(original);
      }
    },
    [selectOriginal],
  );

  const handleOriginalSelect = useCallback(
    (original: Original) => {
      selectOriginal(original);
    },
    [selectOriginal],
  );

  const handleRequestSignIn = useCallback(() => {
    toast({
      title: "Sign in required",
      description: "Please sign in through Helix Bridge to upload originals.",
    });
    if (isDesktopContext) {
      setInlineSignInOpen(true);
      return;
    }
    setLocation("/sign-in?redirect=/helix-noise-gens");
  }, [isDesktopContext, setInlineSignInOpen, setLocation, toast]);

  const handleSignOut = useCallback(() => {
    signOut();
    toast({
      title: "Signed out",
      description: "Demo session cleared.",
    });
  }, [signOut, toast]);

  const handleInlineSignInComplete = useCallback(
    (session: SessionUser) => {
      signIn(session);
      setInlineSignInOpen(false);
    },
    [signIn],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 text-slate-100">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/50 to-blue-500/30">
                <HelixMarkIcon className="h-7 w-7 text-sky-200" strokeWidth={32} aria-label="Helix mark" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-sky-300/80">
                  Helix Core
                </div>
                <h1 className="text-lg font-semibold leading-tight text-slate-50">
                  Noise Gens
                </h1>
                <p className="text-xs text-slate-400">
                  Originals + Helix generations, side by side.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
                <Switch
                  id="helix-packet-toggle"
                  checked={includeHelixPacket}
                  onCheckedChange={handleHelixToggle}
                />
                <label
                  htmlFor="helix-packet-toggle"
                  className="text-xs font-medium text-slate-200"
                >
                  Link Helix
                </label>
                {includeHelixPacket ? (
                  <span
                    className={
                      helixPacket
                        ? "text-[11px] text-emerald-300"
                        : "text-[11px] text-amber-300"
                    }
                  >
                    {helixPacket ? "Ready" : "Load in Helix"}
                  </span>
                ) : null}
              </div>
              <Button variant="secondary" className="gap-2" onClick={handleOpenLibraryRequest}>
                <FolderOpen className="h-4 w-4" aria-hidden />
                View Originals
              </Button>
              {user ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-9 w-9 border border-white/10">
                      <AvatarFallback className="bg-slate-800 text-slate-100">
                        {user.initials ?? (user.name ? user.name.slice(0, 2).toUpperCase() : "ME")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium text-slate-200 sm:inline">
                      {user.name}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-xs text-slate-100 hover:bg-white/10"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </Button>
                </div>
              ) : isDesktopContext ? (
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 text-slate-100 hover:bg-white/10"
                  onClick={() => setInlineSignInOpen(true)}
                >
                  <User className="h-4 w-4" aria-hidden />
                  Sign in
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="gap-2 border-white/20 text-slate-100 hover:bg-white/10"
                >
                  <Link href="/sign-in?redirect=/helix-noise-gens">
                    <User className="h-4 w-4" aria-hidden />
                    Sign in
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:px-6">
            <ProjectAlbumPanel projectSlug={externalProjectSlug} />
            {decoratedRecentUploads.length ? (
              <RecentUploadsRail
                uploads={decoratedRecentUploads}
                onSelect={handleRecentSelect}
                onReveal={handleRecentReveal}
              />
            ) : null}
            <div className="flex flex-col gap-6">
              {activeRenderJob ? <RenderInProgressCard job={activeRenderJob} /> : null}
              <CoverCreator
                includeHelixPacket={includeHelixPacket}
                helixPacket={helixPacket}
                selectedOriginal={selectedOriginal}
                onClearSelection={() => setSelectedOriginal(null)}
                moodPresets={moodPresets}
                sessionTempo={sessionTempo}
                onRenderJobUpdate={handleRenderJobUpdate}
                onRenderJobComplete={handleRenderJobComplete}
              />
              <DualTopLists
                selectedOriginalId={selectedOriginal?.id}
                onOriginalSelected={handleOriginalSelect}
                onGenerationsPresenceChange={setHasGenerations}
                onMoodPresetsLoaded={setMoodPresets}
                onOriginalsHydrated={handleOriginalsHydrated}
                sessionTempo={sessionTempo}
              />
            </div>
            {renderHistory.length ? <RenderHistoryPanel entries={renderHistory} /> : null}
            <MoodLegend presets={moodPresets} />
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-xs text-slate-300 shadow-[0_20px_60px_-40px_rgba(15,118,220,0.45)]">
              <div className="font-semibold uppercase tracking-widest text-slate-100">
                Page Checklist
              </div>
              <ul className="mt-3 space-y-1">
                <li>- Lists scroll independently with pinned search results.</li>
                <li>- Connectors follow viewport updates and respect motion preferences.</li>
                <li>- Drag any original into Cover Creator or select via keyboard controls.</li>
                <li>- Mood presets trigger Helix renders{hasGenerations ? " with live generations streaming in." : "."}</li>
              </ul>
            </div>
          </div>
        </main>

        {isDesktopContext && inlineSignInOpen ? (
          <InlineSignInOverlay
            onClose={() => setInlineSignInOpen(false)}
            onSignIn={handleInlineSignInComplete}
          />
        ) : null}
      </div>

      <OriginalsLibraryModal
        open={libraryOpen}
        onOpenChange={handleLibraryOpenChange}
        onSelect={handleKnowledgeSelection}
        initialProjectId={libraryInitialProjectId}
      />

      <UploadOriginalsModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        isAuthenticated={Boolean(user)}
        onRequestSignIn={handleRequestSignIn}
        onUploaded={handleUploadComplete}
        prefill={uploadPrefill}
      />
    </DndContext>
  );
}

type InlineSignInOverlayProps = {
  onClose: () => void;
  onSignIn: (session: SessionUser) => void;
};

function RenderInProgressCard({ job }: { job: RenderHistoryEntry }) {
  const isError = job.status === "error";
  const toneClasses = isError
    ? "border-amber-500/50 bg-amber-500/10"
    : "border-sky-500/50 bg-sky-500/10";
  const label =
    job.status === "processing"
      ? "Rendering in progress"
      : job.status === "queued"
        ? "Queued for rendering"
        : job.status === "error"
          ? "Render failed"
          : "Render update";

  return (
    <div className={`rounded-2xl ${toneClasses} p-4`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        {isError ? (
          <AlertTriangle className="h-4 w-4 text-amber-300" aria-hidden />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-sky-200" aria-hidden />
        )}
        {label}
      </div>
      <p className="mt-1 text-xs text-slate-300">
        {job.title} {job.sourceLabel ? `• ${job.sourceLabel}` : ""} • Started {formatRelativeTime(job.startedAt)}
      </p>
    </div>
  );
}

function RenderHistoryPanel({ entries }: { entries: RenderHistoryEntry[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200 shadow-[0_30px_80px_-60px_rgba(14,165,233,0.6)]">
      <header className="mb-3">
        <p className="text-sm font-semibold text-slate-100">Recent renders</p>
        <p className="text-xs text-slate-400">Latest Helix covers you queued from this session.</p>
      </header>
      <div className="space-y-2">
        {entries.map((entry) => {
          const previewReady = isShareablePreview(entry.previewUrl);
          return (
            <div
              key={entry.jobId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-slate-950/60 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-100">{entry.title}</div>
                <div className="text-xs text-slate-400">
                  {entry.sourceLabel ?? "Helix render"} •{" "}
                  {formatRelativeTime(entry.completedAt ?? entry.startedAt)}
                </div>
              </div>
              {previewReady ? (
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  <a href={entry.previewUrl ?? "#"} target="_blank" rel="noreferrer">
                    Open preview
                  </a>
                </Button>
              ) : (
                <span className="text-[11px] text-slate-500">Awaiting preview</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InlineSignInOverlay({ onClose, onSignIn }: InlineSignInOverlayProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const session = validateDemoCredentials(username, password);
    if (session) {
      onSignIn(session);
      toast({
        title: "Signed in",
        description: "Demo access granted. You can now upload originals.",
      });
      return;
    }
    const message = `Invalid credentials. Use ${DEMO_USERNAME}/${DEMO_PASSWORD} for the demo account.`;
    setError(message);
    toast({
      title: "Sign in failed",
      description: message,
      variant: "destructive",
    });
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/95 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/85 p-8 text-slate-100 shadow-[0_25px_80px_-40px_rgba(56,189,248,0.7)]">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-sky-300">Helix Bridge</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Sign in to continue</h2>
          <p className="mt-1 text-sm text-slate-400">
            Use the demo credentials{" "}
            <span className="font-semibold text-slate-200">
              {DEMO_USERNAME}/{DEMO_PASSWORD}
            </span>{" "}
            to enable uploads without leaving the desktop shell.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="inline-demo-username">Username</Label>
            <Input
              id="inline-demo-username"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError(null);
              }}
              placeholder={DEMO_USERNAME}
              className="mt-1 bg-slate-900/60"
              required
            />
          </div>
          <div>
            <Label htmlFor="inline-demo-password">Password</Label>
            <Input
              id="inline-demo-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              placeholder={DEMO_PASSWORD}
              className="mt-1 bg-slate-900/60"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="w-28" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Enter Helix
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
