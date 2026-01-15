import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter } from "bad-words";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useKnowledgeProjectsStore } from "@/store/useKnowledgeProjectsStore";
import {
  finalizeOriginalUpload,
  fetchNoisegenCapabilities,
  uploadOriginal,
  uploadOriginalChunk,
} from "@/lib/api/noiseGens";
import type { KnowledgeFileRecord } from "@/lib/agi/knowledge-store";
import type {
  NoisegenCapabilities,
  TempoMeta,
  TimeSkyMeta,
} from "@/types/noise-gens";

type UploadOriginalsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated: boolean;
  onRequestSignIn?: () => void;
  onUploaded?: (payload: UploadCompletePayload) => void;
  prefill?: UploadOriginalPrefill | null;
};

const MAX_TITLE = 120;
const MAX_CREATOR = 60;
const DEFAULT_TIME_SIG: TempoMeta["timeSig"] = "4/4";
const DIRECT_UPLOAD_LIMIT_BYTES = 20 * 1024 * 1024;
const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;
const clampBpm = (value: number) => Math.max(40, Math.min(250, value));
const sanitizeBpmInput = (value: string): number | null => {
  const normalized = value.trim().replace(",", ".");
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return clampBpm(numeric);
};
const isBpmInputValue = (value: string): boolean => /^[0-9.,\s]*$/.test(value);

const extractFileMetadata = (file: File): { title?: string; bpm?: number } => {
  const base = file.name.replace(/\.[^/.]+$/, "");
  const normalizedTitle = base.replace(/[_-]+/g, " ").trim();
  const bpmMatches = Array.from(base.matchAll(/(\d{2,3}(?:\.\d{1,2})?)\s*(?:bpm|bp|tempo)?/gi));
  let bpm: number | undefined;
  if (bpmMatches.length > 0) {
    const lastMatch = bpmMatches[bpmMatches.length - 1];
    const candidate = Number(lastMatch[1]);
    if (Number.isFinite(candidate)) {
      bpm = clampBpm(candidate);
    }
  }
  return {
    title: normalizedTitle || undefined,
    bpm,
  };
};

type FieldState = {
  value: string;
  error: string | null;
};

type StemCategory =
  | "mix"
  | "vocal"
  | "drums"
  | "bass"
  | "music"
  | "fx"
  | "other"
  | "ignore";

type StemEntry = {
  id: string;
  name: string;
  file: File;
  category: StemCategory;
  inferred: StemCategory;
};

type UploadFileProgress = {
  id: string;
  name: string;
  bytes: number;
  loaded: number;
  pct: number;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  error?: string;
};

const STEM_CATEGORY_LABELS: Record<StemCategory, string> = {
  mix: "Mix",
  vocal: "Vocal",
  drums: "Drums",
  bass: "Bass",
  music: "Music",
  fx: "FX",
  other: "Other",
  ignore: "Ignore",
};

const STEM_CATEGORY_ORDER: StemCategory[] = [
  "mix",
  "vocal",
  "drums",
  "bass",
  "music",
  "fx",
  "other",
  "ignore",
];

const STEM_CATEGORY_STYLES: Record<StemCategory, string> = {
  mix: "border-sky-500/50 bg-sky-500/10 text-sky-100",
  vocal: "border-rose-500/50 bg-rose-500/10 text-rose-100",
  drums: "border-amber-500/50 bg-amber-500/10 text-amber-100",
  bass: "border-emerald-500/50 bg-emerald-500/10 text-emerald-100",
  music: "border-cyan-500/50 bg-cyan-500/10 text-cyan-100",
  fx: "border-slate-400/40 bg-slate-500/10 text-slate-200",
  other: "border-slate-400/40 bg-slate-500/10 text-slate-200",
  ignore: "border-slate-600/30 bg-slate-800/20 text-slate-400",
};

const STEM_CATEGORY_RULES: Array<{
  category: StemCategory;
  tokens: string[];
}> = [
  { category: "mix", tokens: ["mix", "instrumental", "mixdown", "master"] },
  { category: "vocal", tokens: ["vocal", "vox", "acap", "chorus"] },
  {
    category: "drums",
    tokens: ["drum", "drums", "kick", "snare", "hat", "perc", "percussion", "clap"],
  },
  { category: "bass", tokens: ["bass", "sub"] },
  {
    category: "fx",
    tokens: ["fx", "sfx", "riser", "impact", "sweep", "whoosh", "noise"],
  },
  {
    category: "music",
    tokens: ["synth", "pad", "keys", "piano", "guitar", "string", "strings", "brass", "lead", "arp", "chord"],
  },
];

const inferStemCategory = (name: string): StemCategory => {
  const normalized = name.toLowerCase();
  for (const rule of STEM_CATEGORY_RULES) {
    if (rule.tokens.some((token) => normalized.includes(token))) {
      return rule.category;
    }
  }
  return "music";
};

const normalizeTimestamp = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const normalizeTimeSkyMeta = (value: unknown): TimeSkyMeta | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const next: TimeSkyMeta = {};
  const publishedAt = normalizeTimestamp(record.publishedAt);
  if (publishedAt != null) next.publishedAt = publishedAt;
  const composedStart = normalizeTimestamp(record.composedStart);
  if (composedStart != null) next.composedStart = composedStart;
  const composedEnd = normalizeTimestamp(record.composedEnd);
  if (composedEnd != null) next.composedEnd = composedEnd;
  if (typeof record.place === "string" && record.place.trim().length > 0) {
    next.place = record.place.trim();
  }
  if (typeof record.skySignature === "string" && record.skySignature.trim().length > 0) {
    next.skySignature = record.skySignature.trim();
  }
  return Object.keys(next).length > 0 ? next : undefined;
};

const readTimeSkyMeta = (meta?: Record<string, unknown>): TimeSkyMeta | undefined => {
  if (!meta || typeof meta !== "object") return undefined;
  const candidate = (meta as { timeSky?: unknown }).timeSky;
  return normalizeTimeSkyMeta(candidate);
};

const buildStemEntry = (file: File, category?: StemCategory): StemEntry => {
  const inferred = inferStemCategory(file.name);
  const resolvedCategory = category ?? inferred;
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    file,
    category: resolvedCategory,
    inferred,
  };
};

const createUploadId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `noise-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const isAudioFile = (record: KnowledgeFileRecord): boolean =>
  record.kind === "audio" || record.mime?.toLowerCase().startsWith("audio/");

const buildFileFromKnowledge = (record: KnowledgeFileRecord): File => {
  const mime = record.mime || record.type || "audio/wav";
  const name = record.name || "stem.wav";
  return new File([record.data], name, { type: mime });
};

export type UploadOriginalPrefill = {
  title?: string;
  creator?: string;
  notes?: string;
  bpm?: number;
  quantized?: boolean;
  offsetMs?: number;
  sourceHint?: string;
  knowledgeProjectId?: string;
  knowledgeProjectName?: string;
  existingOriginalId?: string;
};

export type UploadCompletePayload = {
  trackId: string;
  title: string;
  creator: string;
  knowledgeProjectId?: string;
  knowledgeProjectName?: string;
  tempo?: TempoMeta;
  durationSeconds?: number | null;
};

const DEFAULT_BARS_IN_LOOP = 8;

const estimateLoopDurationSeconds = (tempo?: TempoMeta): number | null => {
  if (!tempo) return null;
  if (!Number.isFinite(tempo.bpm) || tempo.bpm <= 0) return null;
  const [numerator] = tempo.timeSig.split("/").map((value) => Number(value));
  const beatsPerBar = Number.isFinite(numerator) && numerator > 0 ? numerator : 4;
  const bars = tempo.barsInLoop ?? DEFAULT_BARS_IN_LOOP;
  const seconds = (bars * beatsPerBar * 60) / tempo.bpm;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

export function UploadOriginalsModal({
  open,
  onOpenChange,
  isAuthenticated,
  onRequestSignIn,
  onUploaded,
  prefill,
}: UploadOriginalsModalProps) {
  const { toast } = useToast();
  const { projects, projectFiles, refresh, refreshFiles, updateProject } = useKnowledgeProjectsStore(
    (state) => ({
      projects: state.projects,
      projectFiles: state.projectFiles,
      refresh: state.refresh,
      refreshFiles: state.refreshFiles,
      updateProject: state.updateProject,
    }),
  );
  const filter = useMemo(() => new Filter({ placeHolder: "*" }), []);
  const validateField = useCallback(
    (label: string, value: string, maxLength: number) => {
      const trimmed = value.trim();
      if (!trimmed) return `${label} is required`;
      if (trimmed.length > maxLength) {
        return `${label} must be under ${maxLength} characters`;
      }
      if (filter.isProfane(trimmed)) {
        return `Please remove profanity from the ${label.toLowerCase()}.`;
      }
      return null;
    },
    [filter],
  );
  const [title, setTitle] = useState<FieldState>({ value: "", error: null });
  const [creator, setCreator] = useState<FieldState>({ value: "", error: null });
  const [lyrics, setLyrics] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    undefined,
  );
  const [stemEntries, setStemEntries] = useState<StemEntry[]>([]);
  const stemSourceRef = useRef<string>("");
  const [offsetMs, setOffsetMs] = useState(0);
  const [bpm, setBpm] = useState<string>("");
  const [quantized, setQuantized] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadFileProgress[] | null>(
    null,
  );
  const [uploadTotalProgress, setUploadTotalProgress] = useState<{
    loaded: number;
    total?: number;
    pct?: number;
  } | null>(null);
  const uploadFilesRef = useRef<UploadFileProgress[]>([]);
  const [capabilities, setCapabilities] = useState<NoisegenCapabilities | null>(
    null,
  );
  const [capabilitiesError, setCapabilitiesError] = useState<string | null>(null);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle({ value: "", error: null });
      setCreator({ value: "", error: null });
      setLyrics("");
      setSelectedProjectId(undefined);
      setStemEntries([]);
      stemSourceRef.current = "";
      setOffsetMs(0);
      setBpm("");
      setQuantized(true);
      setIsSubmitting(false);
      setUploadProgress(null);
      setUploadTotalProgress(null);
      uploadFilesRef.current = [];
      setCapabilities(null);
      setCapabilitiesError(null);
      setCapabilitiesLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !prefill) return;
    const derivedTitle = prefill.title ?? prefill.knowledgeProjectName ?? "";
    const derivedCreator = prefill.creator ?? "";
    setTitle({
      value: derivedTitle,
      error: derivedTitle ? validateField("Title", derivedTitle, MAX_TITLE) : null,
    });
    setCreator({
      value: derivedCreator,
      error: derivedCreator
        ? validateField("Creator", derivedCreator, MAX_CREATOR)
        : null,
    });
    setLyrics(prefill.notes ?? "");
    if (prefill.knowledgeProjectId) {
      setSelectedProjectId(prefill.knowledgeProjectId);
    }
    if (typeof prefill.offsetMs === "number" && Number.isFinite(prefill.offsetMs)) {
      setOffsetMs(Math.round(prefill.offsetMs));
    } else {
      setOffsetMs(0);
    }
    const resolvedBpm =
      typeof prefill.bpm === "number" && Number.isFinite(prefill.bpm)
        ? clampBpm(prefill.bpm)
        : undefined;
    setBpm(resolvedBpm ? resolvedBpm.toFixed(2) : "");
    setQuantized(prefill.quantized ?? true);
  }, [open, prefill, validateField]);

  const noiseProjects = useMemo(
    () => projects.filter((project) => project.type === "noise-album"),
    [projects],
  );
  const selectedProject = useMemo(
    () => noiseProjects.find((project) => project.id === selectedProjectId),
    [noiseProjects, selectedProjectId],
  );
  useEffect(() => {
    if (!open || !selectedProject) return;
    const projectName = selectedProject.name?.trim();
    if (!projectName) return;
    if (!title.value.trim()) {
      setTitle({
        value: projectName,
        error: validateField("Title", projectName, MAX_TITLE),
      });
    }
    if (!creator.value.trim()) {
      setCreator({
        value: projectName,
        error: validateField("Creator", projectName, MAX_CREATOR),
      });
    }
  }, [creator.value, open, selectedProject, title.value, validateField]);
  const projectFilesList = useMemo<KnowledgeFileRecord[]>(() => {
    if (!selectedProjectId) return [];
    return projectFiles[selectedProjectId] ?? [];
  }, [projectFiles, selectedProjectId]);
  const audioProjectFiles = useMemo(
    () => projectFilesList.filter(isAudioFile),
    [projectFilesList],
  );

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setCapabilitiesLoading(true);
    setCapabilitiesError(null);
    fetchNoisegenCapabilities(controller.signal)
      .then((payload) => {
        setCapabilities(payload);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "Unable to read codec status.";
        setCapabilitiesError(message);
        setCapabilities(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCapabilitiesLoading(false);
        }
      });
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!selectedProjectId) return;
    void refreshFiles(selectedProjectId);
  }, [open, refreshFiles, selectedProjectId]);

  useEffect(() => {
    if (!open) return;
    if (selectedProjectId) return;
    if (prefill?.knowledgeProjectId) {
      setSelectedProjectId(prefill.knowledgeProjectId);
      return;
    }
    if (noiseProjects.length > 0) {
      setSelectedProjectId(noiseProjects[0]?.id);
    }
  }, [noiseProjects, open, prefill?.knowledgeProjectId, selectedProjectId]);

  useEffect(() => {
    if (!open || !selectedProjectId) return;
    if (audioProjectFiles.length === 0) {
      if (stemEntries.length) {
        setStemEntries([]);
      }
      stemSourceRef.current = "";
      return;
    }
    const sourceKey = `project:${selectedProjectId}:${audioProjectFiles
      .map((file) => file.id)
      .join(",")}`;
    if (stemSourceRef.current === sourceKey) return;
    setStemEntries(
      audioProjectFiles.map((record) =>
        buildStemEntry(buildFileFromKnowledge(record)),
      ),
    );
    stemSourceRef.current = sourceKey;
  }, [audioProjectFiles, open, selectedProjectId, stemEntries.length]);

  useEffect(() => {
    if (!open || stemEntries.length === 0) return;
    const metadata = extractFileMetadata(stemEntries[0].file);
    if (metadata?.title && !title.value.trim()) {
      const clipped = metadata.title.slice(0, MAX_TITLE);
      setTitle({
        value: clipped,
        error: validateField("Title", clipped, MAX_TITLE),
      });
    }
    if (metadata?.bpm && !bpm) {
      setBpm(metadata.bpm.toFixed(2));
    }
  }, [bpm, open, stemEntries, title.value, validateField]);

  const stemSummary = useMemo(() => {
    const mixEntries = stemEntries.filter((entry) => entry.category === "mix");
    const vocalEntries = stemEntries.filter((entry) => entry.category === "vocal");
    const stemUploads = stemEntries.filter(
      (entry) =>
        entry.category !== "mix" &&
        entry.category !== "vocal" &&
        entry.category !== "ignore",
    );
    const ignoredCount = stemEntries.filter((entry) => entry.category === "ignore").length;
    const errors: string[] = [];
    if (mixEntries.length > 1) {
      errors.push("Only one mix/instrumental stem can be selected.");
    }
    if (vocalEntries.length > 1) {
      errors.push("Only one vocal stem can be selected.");
    }
    if (stemEntries.length > 0 && mixEntries.length === 0 && stemUploads.length === 0) {
      errors.push("Select a mix or at least one stem.");
    }
    return {
      mixEntry: mixEntries[0],
      vocalEntry: vocalEntries[0],
      stemUploads,
      ignoredCount,
      errors,
    };
  }, [stemEntries]);

  const hasAudio =
    Boolean(stemSummary.mixEntry) || stemSummary.stemUploads.length > 0;
  const hasRequiredFields =
    hasAudio &&
    !title.error &&
    !creator.error &&
    title.value.trim().length > 0 &&
    creator.value.trim().length > 0;

  const canSubmit =
    !isSubmitting && hasRequiredFields && stemSummary.errors.length === 0;
  const requiresAuth = !isAuthenticated;
  const submitButtonLabel = requiresAuth
    ? "Sign in to upload"
    : isSubmitting
      ? "Uploading..."
      : "Upload";
  const submitButtonDisabled = requiresAuth ? false : !canSubmit;

  const bpmNumeric = useMemo(() => sanitizeBpmInput(bpm), [bpm]);

  const tempoPreview = useMemo(() => {
    if (bpmNumeric == null) return null;
    return {
      bpm: Number(bpmNumeric.toFixed(2)),
      timeSig: DEFAULT_TIME_SIG,
      quantized,
    };
  }, [bpmNumeric, quantized]);

  const handleProjectChange = useCallback((value: string) => {
    const nextId = value || undefined;
    setSelectedProjectId(nextId);
    setStemEntries([]);
    stemSourceRef.current = "";
  }, []);

  const handleStemCategoryChange = useCallback(
    (stemId: string, category: StemCategory) => {
      setStemEntries((previous) =>
        previous.map((entry) =>
          entry.id === stemId ? { ...entry, category } : entry,
        ),
      );
    },
    [],
  );

  const persistProjectMeta = useCallback(
    async (tempoMeta?: TempoMeta, lyricsText?: string) => {
      if (!selectedProject) return;
      try {
        const currentMeta = (selectedProject.meta ?? {}) as Record<string, unknown>;
        const existingTempo =
          (currentMeta as { tempo?: Partial<TempoMeta> }).tempo ?? undefined;
        let nextTempo: Partial<TempoMeta> | undefined;
        let tempoChanged = false;
        if (tempoMeta) {
          nextTempo = {
            ...(typeof existingTempo === "object" && existingTempo ? existingTempo : {}),
            bpm: tempoMeta.bpm,
            timeSig: tempoMeta.timeSig,
            offsetMs: tempoMeta.offsetMs,
            quantized: tempoMeta.quantized,
          };
          const isSame =
            existingTempo &&
            existingTempo.bpm === nextTempo.bpm &&
            existingTempo.timeSig === nextTempo.timeSig &&
            (existingTempo.offsetMs ?? 0) === (nextTempo.offsetMs ?? 0) &&
            (existingTempo.quantized ?? true) === (nextTempo.quantized ?? true);
          tempoChanged = !isSame;
        }

        const existingLyrics =
          typeof (currentMeta as { lyrics?: unknown }).lyrics === "string"
            ? String((currentMeta as { lyrics?: unknown }).lyrics)
            : "";
        const nextLyrics = lyricsText?.trim() ?? "";
        const lyricsChanged =
          (nextLyrics || existingLyrics) && nextLyrics !== existingLyrics;

        if (!tempoChanged && !lyricsChanged) return;

        const nextMeta = { ...currentMeta };
        if (tempoChanged && nextTempo) {
          nextMeta.tempo = nextTempo;
        }
        if (lyricsChanged) {
          if (nextLyrics) {
            nextMeta.lyrics = nextLyrics;
          } else {
            delete (nextMeta as { lyrics?: unknown }).lyrics;
          }
        }

        const { fileCount: _fileCount, ...projectRecord } = selectedProject;
        await updateProject({
          ...projectRecord,
          meta: nextMeta,
        });
      } catch {
        toast({
          title: "Metadata not saved",
          description:
            "We could not store the BPM or lyrics on this noise album. You can set the BPM in the DAW.",
        });
      }
    },
    [selectedProject, toast, updateProject],
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      const uploadQueue: Array<{
        entry: StemEntry;
        field: "instrumental" | "vocal" | "stems";
        category?: StemCategory;
      }> = [
        ...(stemSummary.mixEntry
          ? [{ entry: stemSummary.mixEntry, field: "instrumental" }]
          : []),
        ...(stemSummary.vocalEntry
          ? [{ entry: stemSummary.vocalEntry, field: "vocal" }]
          : []),
        ...stemSummary.stemUploads.map((entry) => ({
          entry,
          field: "stems",
          category: entry.category,
        })),
      ];
      if (uploadQueue.length === 0) {
        throw new Error("No audio files selected for upload.");
      }
      const uploadFiles: UploadFileProgress[] = uploadQueue.map((item) => ({
        id: item.entry.id,
        name: item.entry.name,
        bytes: item.entry.file.size,
        loaded: 0,
        pct: 0,
        status: "queued",
      }));
      uploadFilesRef.current = uploadFiles;
      const totalBytes = uploadFiles.reduce((sum, file) => sum + file.bytes, 0);
      if (uploadFiles.length) {
        setUploadProgress(uploadFiles);
        setUploadTotalProgress({
          loaded: 0,
          total: totalBytes > 0 ? totalBytes : undefined,
          pct: totalBytes > 0 ? 0 : undefined,
        });
      } else {
        setUploadProgress(null);
        setUploadTotalProgress(null);
      }

      const updateProgress = (
        fileId: string,
        loaded: number,
        status?: UploadFileProgress["status"],
        error?: string,
      ) => {
        const files = uploadFilesRef.current;
        if (!files.length) return;
        const next = files.map((file) => {
          if (file.id !== fileId) return file;
          const safeLoaded = Math.max(0, Math.min(file.bytes, loaded));
          const pct = file.bytes > 0 ? safeLoaded / file.bytes : 1;
          const resolvedStatus = status ?? file.status;
          const nextStatus =
            pct >= 1 && resolvedStatus === "uploading"
              ? "processing"
              : resolvedStatus;
          return {
            ...file,
            loaded: safeLoaded,
            pct,
            status: nextStatus,
            error,
          };
        });
        uploadFilesRef.current = next;
        setUploadProgress(next);
        const loadedTotal = next.reduce((sum, file) => sum + file.loaded, 0);
        setUploadTotalProgress({
          loaded: loadedTotal,
          total: totalBytes > 0 ? totalBytes : undefined,
          pct: totalBytes > 0 ? Math.min(1, loadedTotal / totalBytes) : undefined,
        });
      };
      const existingOriginalId = prefill?.existingOriginalId?.trim();
      const trackIdForUpload = existingOriginalId || createUploadId();
      const timeSkyMeta = readTimeSkyMeta(
        (selectedProject?.meta ?? {}) as Record<string, unknown>,
      );
      let tempoMeta: TempoMeta | undefined;
      if (bpmNumeric != null) {
        tempoMeta = {
          bpm: Number(bpmNumeric.toFixed(2)),
          timeSig: DEFAULT_TIME_SIG,
          offsetMs,
          quantized,
        };
      }
      const appendSharedFields = (payload: FormData, trackId?: string) => {
        payload.append("title", title.value.trim());
        payload.append("creator", creator.value.trim());
        if (trackId) {
          payload.append("existingOriginalId", trackId);
        }
        payload.append("offsetMs", String(offsetMs));
        if (lyrics.trim()) {
          payload.append("notes", lyrics.trim());
        }
        if (timeSkyMeta) {
          payload.append("timeSky", JSON.stringify(timeSkyMeta));
        }
        if (tempoMeta) {
          payload.append("tempo", JSON.stringify(tempoMeta));
        }
      };
      const abortControllers = new Map<string, AbortController>();
      let abortAll = false;
      const runUpload = async (item: (typeof uploadQueue)[number]) => {
        if (abortAll) return;
        const controller = new AbortController();
        abortControllers.set(item.entry.id, controller);
        updateProgress(item.entry.id, 0, "uploading");
        const totalSize = item.entry.file.size;
        const shouldChunk = totalSize > DIRECT_UPLOAD_LIMIT_BYTES;
        try {
          if (!shouldChunk) {
            const payload = new FormData();
            appendSharedFields(payload, trackIdForUpload);
            if (item.field === "stems") {
              payload.append("stems", item.entry.file);
              payload.append("stemCategories", JSON.stringify([item.category]));
            } else {
              payload.append(item.field, item.entry.file);
            }
            const result = await uploadOriginal(payload, {
              signal: controller.signal,
              onProgress: (progress) => {
                updateProgress(item.entry.id, progress.loaded, "uploading");
              },
            });
            if (result.trackId && result.trackId !== trackIdForUpload) {
              throw new Error("Upload returned a mismatched track ID.");
            }
            updateProgress(item.entry.id, totalSize, "done");
          } else {
            const totalChunks = Math.ceil(totalSize / CHUNK_SIZE_BYTES);
            for (let index = 0; index < totalChunks; index += 1) {
              if (abortAll) return;
              const start = index * CHUNK_SIZE_BYTES;
              const end = Math.min(totalSize, start + CHUNK_SIZE_BYTES);
              const chunk = item.entry.file.slice(start, end);
              const payload = new FormData();
              appendSharedFields(payload, trackIdForUpload);
              payload.append("fileId", item.entry.id);
              payload.append("fileName", item.entry.name);
              payload.append(
                "kind",
                item.field === "stems" ? "stem" : item.field,
              );
              if (item.field === "stems" && item.category) {
                payload.append("stemCategory", item.category);
              }
              payload.append("chunkIndex", String(index));
              payload.append("chunkCount", String(totalChunks));
              payload.append("chunk", chunk, item.entry.name);
              const base = index * CHUNK_SIZE_BYTES;
              const result = await uploadOriginalChunk(payload, {
                signal: controller.signal,
                onProgress: (progress) => {
                  const loaded = Math.min(totalSize, base + progress.loaded);
                  updateProgress(item.entry.id, loaded, "uploading");
                },
              });
              if (result.trackId && result.trackId !== trackIdForUpload) {
                throw new Error("Upload returned a mismatched track ID.");
              }
              if (index === totalChunks - 1) {
                updateProgress(item.entry.id, totalSize, "done");
              }
            }
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Upload failed";
          updateProgress(item.entry.id, 0, "error", message);
          abortAll = true;
          abortControllers.forEach((ctrl) => ctrl.abort());
          throw new Error(`"${item.entry.name}" failed to upload. ${message}`);
        } finally {
          abortControllers.delete(item.entry.id);
        }
      };
      const hasChunkedUploads = uploadQueue.some(
        (item) => item.entry.file.size > DIRECT_UPLOAD_LIMIT_BYTES,
      );
      const concurrency = hasChunkedUploads
        ? 1
        : Math.min(2, uploadQueue.length);
      let cursor = 0;
      const workers = Array.from({ length: concurrency }, () =>
        (async () => {
          while (!abortAll) {
            const next = uploadQueue[cursor++];
            if (!next) return;
            await runUpload(next);
          }
        })(),
      );
      await Promise.all(workers);
      const shouldAutoMixdown =
        !stemSummary.mixEntry && stemSummary.stemUploads.length > 0;
      if (shouldAutoMixdown) {
        try {
          await finalizeOriginalUpload({
            trackId: trackIdForUpload,
            autoMixdown: true,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Auto mixdown failed.";
          toast({
            title: "Mixdown error",
            description: message,
            variant: "destructive",
          });
        }
      } else {
        await finalizeOriginalUpload({ trackId: trackIdForUpload });
      }
      toast({
        title: "Upload queued",
        description: "We will notify you when mastering finishes.",
      });
      void persistProjectMeta(tempoMeta, lyrics);
      const selectedProjectName =
        selectedProject?.name?.trim() ?? prefill?.knowledgeProjectName;
      onUploaded?.({
        trackId: trackIdForUpload,
        title: title.value.trim(),
        creator: creator.value.trim(),
        knowledgeProjectId: selectedProjectId,
        knowledgeProjectName: selectedProjectName,
        tempo: tempoMeta,
        durationSeconds: estimateLoopDurationSeconds(tempoMeta ?? undefined),
      });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" aria-modal="true">
        <DialogHeader>
          <DialogTitle>Upload Originals</DialogTitle>
          <DialogDescription>
            Choose a Noise Album project and tag each stem. Mark one mix if you have it, or keep
            stems-only to auto-build a playback mixdown from your stems.
          </DialogDescription>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            {capabilitiesLoading ? (
              <Badge variant="outline" className="border-slate-500/40 text-slate-300">
                Checking codecs...
              </Badge>
            ) : capabilities ? (
              capabilities.ffmpeg ? (
                <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
                  Codec pack ready
                </Badge>
              ) : (
                <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-100">
                  WAV-only playback (ffmpeg missing)
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="border-slate-500/40 text-slate-300">
                Codec status unavailable
              </Badge>
            )}
            {capabilitiesError ? (
              <span className="text-muted-foreground">{capabilitiesError}</span>
            ) : null}
          </div>
        </DialogHeader>

        {prefill?.sourceHint ? (
          <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
            {prefill.sourceHint}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="noise-upload-title">Song title</Label>
              <Input
                id="noise-upload-title"
                placeholder="Orbiting Signals"
                maxLength={MAX_TITLE}
                value={title.value}
                onChange={(event) =>
                  setTitle({
                    value: event.target.value,
                    error: validateField("Title", event.target.value, MAX_TITLE),
                  })
                }
              />
              {title.error ? (
                <p className="text-xs text-destructive">{title.error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {title.value.length}/{MAX_TITLE} characters
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="noise-upload-creator">Creator</Label>
              <Input
                id="noise-upload-creator"
                placeholder="Helix Lab"
                maxLength={MAX_CREATOR}
                value={creator.value}
                onChange={(event) =>
                  setCreator({
                    value: event.target.value,
                    error: validateField("Creator", event.target.value, MAX_CREATOR),
                  })
                }
              />
              {creator.error ? (
                <p className="text-xs text-destructive">{creator.error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {creator.value.length}/{MAX_CREATOR} characters
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="noise-upload-project">Noise project</Label>
            {noiseProjects.length ? (
              <>
                <select
                  id="noise-upload-project"
                  value={selectedProjectId ?? ""}
                  onChange={(event) => handleProjectChange(event.target.value)}
                  className="h-10 w-full rounded border border-white/10 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  {noiseProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                      {project.fileCount ? ` (${project.fileCount})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Noise Album projects live in My Knowledge. Drop stems there to make them
                  available here.
                </p>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 bg-white/5 p-4 text-center text-xs text-muted-foreground">
                No Noise Album projects found yet. Create one in My Knowledge to load stems
                here.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Project stems</Label>
              <span className="text-xs text-muted-foreground">
                {stemEntries.length} file{stemEntries.length === 1 ? "" : "s"}
              </span>
            </div>
            {stemEntries.length ? (
              <div className="space-y-2">
                {stemEntries.map((entry) => {
                  const isManual = entry.category !== entry.inferred;
                  return (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2"
                    >
                      <div className="min-w-[160px] flex-1">
                        <p className="truncate text-sm text-slate-100">{entry.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge className={`border ${STEM_CATEGORY_STYLES[entry.category]}`}>
                            {STEM_CATEGORY_LABELS[entry.category]}
                          </Badge>
                          <span>{isManual ? "Manual" : "Auto"}</span>
                        </div>
                      </div>
                      <label className="flex min-w-[140px] flex-col text-xs font-medium text-muted-foreground">
                        Category
                        <select
                          value={entry.category}
                          onChange={(event) =>
                            handleStemCategoryChange(
                              entry.id,
                              event.target.value as StemCategory,
                            )
                          }
                          className="mt-1 h-9 rounded border border-white/10 bg-slate-900 px-2 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                        >
                          {STEM_CATEGORY_ORDER.map((category) => (
                            <option key={category} value={category}>
                              {STEM_CATEGORY_LABELS[category]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/15 bg-white/5 p-4 text-center text-xs text-muted-foreground">
                {selectedProjectId
                  ? "No audio stems found in this project."
                  : "Select a Noise Album project to load stems."}
              </div>
            )}
            {stemSummary.errors.length ? (
              <p className="text-xs text-destructive">{stemSummary.errors[0]}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {stemSummary.mixEntry ? "Mix selected" : "No mix"}{" | "}
                {stemSummary.vocalEntry ? "Vocal attached" : "No vocal"}{" | "}
                {stemSummary.stemUploads.length} stem
                {stemSummary.stemUploads.length === 1 ? "" : "s"}
                {stemSummary.ignoredCount
                  ? ` | ${stemSummary.ignoredCount} ignored`
                  : ""}
              </p>
            )}
          </div>

          <div>
            <Label>Tempo (optional)</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                BPM
                <Input
                  type="text"
                  inputMode="decimal"
                  value={bpm}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw === "" || isBpmInputValue(raw)) {
                      setBpm(raw);
                    }
                  }}
                  onBlur={() => {
                    if (!bpm) return;
                    const numeric = sanitizeBpmInput(bpm);
                    if (numeric == null) {
                      setBpm("");
                      return;
                    }
                    setBpm(numeric.toFixed(2));
                  }}
                  className="rounded bg-slate-900 px-2 py-1 text-slate-100"
                  placeholder="120.00"
                />
              </label>
              <label className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={quantized}
                  onChange={(event) => setQuantized(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                Quantize selections to bar grid
              </label>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Time signature is locked to 4/4 for Noise Gens.
            </p>
          </div>

          <div>
            <Label htmlFor="noise-upload-lyrics">Lyrics (optional)</Label>
            <Textarea
              id="noise-upload-lyrics"
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              placeholder="Paste lyrics for the listener panels and ideology parallels."
              className="min-h-[80px]"
            />
          </div>
        </div>

        {uploadProgress && uploadProgress.length ? (
          <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Uploading {uploadProgress.length} file(s)</span>
              {uploadTotalProgress?.pct != null ? (
                <span>{Math.round(uploadTotalProgress.pct * 100)}%</span>
              ) : null}
            </div>
            <Progress
              value={
                uploadTotalProgress?.pct != null
                  ? Math.round(uploadTotalProgress.pct * 100)
                  : 0
              }
              className="mt-2 h-2"
            />
            <div className="mt-3 space-y-2">
              {uploadProgress.map((file) => (
                <div key={file.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{file.name}</span>
                    <span>
                      {file.status === "processing"
                        ? "Processing"
                        : file.status === "done"
                          ? "Done"
                          : file.status === "error"
                            ? "Error"
                            : file.status === "queued"
                              ? "Queued"
                              : `${Math.round(file.pct * 100)}%`}
                    </span>
                  </div>
                  <Progress value={Math.round(file.pct * 100)} className="h-1.5" />
                  {file.error ? (
                    <p className="text-[11px] text-destructive">{file.error}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (requiresAuth) {
                onRequestSignIn?.();
                return;
              }
              void handleSubmit();
            }}
            disabled={submitButtonDisabled}
            className="min-w-[120px]"
          >
            {submitButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UploadOriginalsModal;
