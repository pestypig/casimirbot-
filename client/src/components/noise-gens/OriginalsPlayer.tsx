import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIdeology } from "@/hooks/use-ideology";
import { fetchOriginalDetails, fetchStemPack } from "@/lib/api/noiseGens";
import type {
  MoodPreset,
  Original,
  OriginalDetails,
  StemGroup,
  StemGroupSource,
  StemPack,
} from "@/types/noise-gens";
import { cn } from "@/lib/utils";
import { releaseAudioFocus, requestAudioFocus } from "@/lib/audio-focus";

type PlayerSource = {
  id: string;
  url: string;
  label: string;
  bytes?: number;
  mime?: string;
};

type SourceMode = "playback" | "fallback" | null;

type SourceHandle = {
  id: string;
  source: AudioBufferSourceNode;
};

type RemixStatus = "idle" | "loading" | "ready" | "active" | "error";

type StemGroupPlayback = StemGroup & {
  gain: number;
  source?: StemGroupSource | null;
};

type MeaningCard = {
  nodeId: string;
  nodeTitle: string;
  nodePath: string;
  confidence: "High" | "Medium" | "Low";
  lyricQuote: string;
  parallel: string;
};

const formatTime = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatDateValue = (value?: number): string | null => {
  if (!value || !Number.isFinite(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDate = (value?: number): string =>
  formatDateValue(value) ?? "Unknown";

const formatDateRange = (start?: number, end?: number): string | null => {
  const startLabel = formatDateValue(start);
  const endLabel = formatDateValue(end);
  if (startLabel && endLabel) {
    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
  }
  return startLabel ?? endLabel ?? null;
};

const buildInitials = (title?: string, artist?: string): string => {
  const base = `${title ?? ""} ${artist ?? ""}`.trim();
  if (!base) return "NG";
  const parts = base.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return letters.join("") || "NG";
};

const STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "all",
  "also",
  "and",
  "any",
  "are",
  "but",
  "can",
  "could",
  "day",
  "did",
  "does",
  "for",
  "from",
  "had",
  "has",
  "have",
  "her",
  "here",
  "him",
  "his",
  "into",
  "its",
  "just",
  "like",
  "more",
  "not",
  "now",
  "our",
  "out",
  "over",
  "she",
  "some",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "too",
  "very",
  "was",
  "were",
  "what",
  "when",
  "where",
  "will",
  "with",
  "you",
  "your",
]);

const normalizeToken = (token: string) =>
  token.endsWith("s") && token.length > 3 ? token.slice(0, -1) : token;

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9]+/)
    .map((token) => normalizeToken(token.trim()))
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));

const buildNodeTokens = (node: {
  title: string;
  slug?: string;
  excerpt?: string;
  tags?: string[];
}) => {
  const tokens = new Set<string>();
  const fields = [node.title, node.slug, node.excerpt, ...(node.tags ?? [])].filter(
    Boolean,
  );
  fields.forEach((field) => {
    tokenize(String(field)).forEach((token) => tokens.add(token));
  });
  return tokens;
};

const IDEOLOGY_HINTS: Record<
  string,
  { tokens: string[]; phrases: string[]; focus: string }
> = {
  "devotion-course": {
    tokens: ["saved", "save", "purpose", "vow", "intent", "devotion", "protect", "course", "called"],
    phrases: ["saved for something", "called to", "set the course"],
    focus: "vow / intent",
  },
  "struggle-testament": {
    tokens: ["struggle", "earned", "purpose", "testament", "sweat", "tear", "proof", "weight", "world"],
    phrases: ["purpose earned", "weight of the world"],
    focus: "purpose earned",
  },
  "civic-memory-continuity": {
    tokens: ["memory", "remember", "record", "archive", "carry", "carried", "sleeve", "wear", "history"],
    phrases: ["collecting on our sleeves", "wear that day", "carry the record"],
    focus: "carried record",
  },
  "promise-trials": {
    tokens: ["promise", "trial", "pressure", "return", "proof", "separation", "test"],
    phrases: ["promise tested", "trial by"],
    focus: "promises tested",
  },
  "lifetime-trust-ledger": {
    tokens: ["trust", "ledger", "evidence", "time", "record", "archive", "prove"],
    phrases: ["evidence over time", "time tested"],
    focus: "evidence over time",
  },
  "phoenix-averaging": {
    tokens: ["window", "signal", "average", "tuned", "tune", "settle", "measure", "steady"],
    phrases: ["stayed tuned", "right window", "step back"],
    focus: "right window for signal",
  },
  "liveness-or-it-didnt-happen": {
    tokens: ["liveness", "live", "stale", "update", "fresh", "alive", "age"],
    phrases: ["stayed tuned", "still alive"],
    focus: "liveness over stale memory",
  },
  "capability-ambition-gradient": {
    tokens: ["frontier", "reach", "ambition", "capability", "drive", "outdo"],
    phrases: ["make the frontier", "outdo it"],
    focus: "reach + responsibility",
  },
  "worldview-integrity": {
    tokens: ["worldview", "map", "reality", "truth", "idea", "face", "integrity", "test"],
    phrases: ["idea faced", "faced us now"],
    focus: "testing the map against reality",
  },
  "three-tenets-loop": {
    tokens: ["knowing", "witness", "action", "wait", "see", "listen", "bearing"],
    phrases: ["wait and see", "best to wait"],
    focus: "not-knowing → witness → action",
  },
  "impermanence-by-design": {
    tokens: ["change", "shift", "impermanence", "adapt", "review", "cycle", "path"],
    phrases: ["paths will constantly change", "wait and see"],
    focus: "adaptation over time",
  },
  "values-over-images": {
    tokens: ["value", "image", "status", "shame", "skill", "core", "performance"],
    phrases: ["skill outwits shame"],
    focus: "values over status/performance",
  },
  "interbeing-systems": {
    tokens: ["interbeing", "depend", "together", "connected", "system", "path"],
    phrases: ["paths will constantly change"],
    focus: "interdependence",
  },
  "solitude-to-signal": {
    tokens: ["solitude", "signal", "tuned", "quiet", "distance"],
    phrases: ["stayed tuned"],
    focus: "signal through distance",
  },
};

const PLAYBACK_PRIORITY: Record<string, number> = {
  aac: 0,
  opus: 1,
  mp3: 2,
  wav: 3,
};

const buildPlaybackSources = (
  assets?: OriginalDetails["playback"],
): PlayerSource[] => {
  if (!assets || assets.length === 0) return [];
  const sorted = [...assets].sort(
    (a, b) =>
      (PLAYBACK_PRIORITY[a.codec] ?? 99) -
      (PLAYBACK_PRIORITY[b.codec] ?? 99),
  );
  return sorted.map((asset) => ({
    id: asset.id,
    url: asset.url,
    label: asset.label,
    bytes: asset.size,
    mime: asset.mime,
  }));
};

const pickStemGroupSource = (
  sources: StemGroupSource[] = [],
): StemGroupSource | null => {
  if (sources.length === 0) return null;
  const sorted = [...sources].sort(
    (a, b) =>
      (PLAYBACK_PRIORITY[a.codec] ?? 99) -
      (PLAYBACK_PRIORITY[b.codec] ?? 99),
  );
  return sorted[0] ?? null;
};

const checkOriginalAsset = async (
  originalId: string,
  kind: "instrumental" | "vocal",
  label: string,
): Promise<PlayerSource | null> => {
  const url = `/originals/${encodeURIComponent(originalId)}/${kind}`;
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return null;
    const lengthHeader = res.headers.get("content-length");
    const lengthValue = lengthHeader ? Number(lengthHeader) : Number.NaN;
    return {
      id: kind,
      url,
      label,
      bytes: Number.isFinite(lengthValue) ? lengthValue : undefined,
    };
  } catch {
    return null;
  }
};

type OriginalsPlayerProps = {
  original: Original | null;
  playlist?: Original[];
  onSelectOriginal?: (original: Original) => void;
  moodPresets?: MoodPreset[];
  onVary?: (preset?: MoodPreset) => void;
  isVarying?: boolean;
  autoPlayToken?: number;
};

export function OriginalsPlayer({
  original,
  playlist = [],
  onSelectOriginal,
  moodPresets = [],
  onVary,
  isVarying = false,
  autoPlayToken,
}: OriginalsPlayerProps) {
  const { data: ideologyDoc } = useIdeology();
  const [sources, setSources] = useState<PlayerSource[]>([]);
  const [sourceMode, setSourceMode] = useState<SourceMode>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [details, setDetails] = useState<OriginalDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const detailsCacheRef = useRef<Map<string, OriginalDetails | null>>(new Map());
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const buffersRef = useRef<Record<string, AudioBuffer | null>>({});
  const activeSourcesRef = useRef<SourceHandle[]>([]);
  const startAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const playerIdRef = useRef(
    `noisegen-player-${Math.random().toString(36).slice(2, 10)}`,
  );
  const [playableCount, setPlayableCount] = useState(0);
  const [autoPlayPending, setAutoPlayPending] = useState(false);
  const lastAutoPlayRef = useRef<number | null>(null);
  const [remixStatus, setRemixStatus] = useState<RemixStatus>("idle");
  const [remixError, setRemixError] = useState<string | null>(null);
  const [remixGroups, setRemixGroups] = useState<StemGroupPlayback[]>([]);
  const remixBuffersRef = useRef<Record<string, AudioBuffer | null>>({});
  const remixGainsRef = useRef<Map<string, GainNode>>(new Map());
  const remixDurationRef = useRef<number>(0);
  const remixRequestedRef = useRef(false);
  const remixControllerRef = useRef<AbortController | null>(null);
  // Stream playback via media elements to avoid heavy decoding in Listener.    
  const useElementPlayback =
    sourceMode === "playback" ||
    sourceMode === "fallback" ||
    sources.length === 1 ||
    (sourceMode === null && sources.length > 1);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setSources([]);
    setSourceMode(null);
    setLoadError(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    remixControllerRef.current?.abort();
    remixControllerRef.current = null;
    remixRequestedRef.current = false;
    remixBuffersRef.current = {};
    remixGainsRef.current = new Map();
    remixDurationRef.current = 0;
    setRemixGroups([]);
    setRemixStatus("idle");
    setRemixError(null);

    if (!original) {
      setDetails(null);
      setDetailsError(null);
      setDetailsLoading(false);
      setIsLoading(false);
      return undefined;
    }

    const load = async () => {
      setIsLoading(true);
      setDetailsLoading(true);
      try {
        const cached = detailsCacheRef.current.get(original.id);
        const payload =
          cached ??
          (await fetchOriginalDetails(original.id, controller.signal));
        if (cancelled) return;
        if (cached == null) {
          detailsCacheRef.current.set(original.id, payload);
        }
        setDetails(payload);
        setDetailsError(null);

        const playbackSources = buildPlaybackSources(payload.playback);
        if (playbackSources.length > 0) {
          setSources(playbackSources);
          setSourceMode("playback");
          return;
        }

        if (payload.processing && payload.processing.status !== "ready") {
          const detail = payload.processing.detail?.trim();
          const statusLabel =
            payload.processing.status === "error"
              ? "Playback failed."
              : "Playback is still processing.";
          setLoadError(detail || statusLabel);
          setIsLoading(false);
          return;
        }

        const fallback = await checkOriginalAsset(
          original.id,
          "instrumental",
          "Mix",
        );
        if (cancelled) return;
        if (fallback) {
          setSources([fallback]);
          setSourceMode("fallback");
          return;
        }

        setLoadError("Playback assets are not ready yet.");
        setIsLoading(false);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load track details.";
        setDetailsError(message);
        setLoadError(message);
        setIsLoading(false);
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      controller.abort();
      stopPlayback();
    };
  }, [original?.id, stopPlayback]);

  useEffect(
    () => () => {
      releaseAudioFocus(playerIdRef.current);
    },
    [releaseAudioFocus],
  );

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === "undefined") return null;
    let ctx = audioContextRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      audioContextRef.current = ctx;
    }
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (!masterGainRef.current) {
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      masterGainRef.current = gain;
    }
    return ctx;
  }, []);

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopWebAudioSources = useCallback(() => {
    activeSourcesRef.current.forEach(({ source }) => {
      try {
        source.stop();
      } catch {
        /* ignore */
      }
    });
    activeSourcesRef.current = [];
    startAtRef.current = null;
    stopRaf();
  }, [stopRaf]);

  const stopPlayback = useCallback(() => {
    if (audioElementsRef.current.size) {
      audioElementsRef.current.forEach((audio) => audio.pause());
    } else if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    stopWebAudioSources();
    setIsPlaying(false);
  }, [stopWebAudioSources]);

  const pausePlayback = useCallback(() => {
    if (
      remixStatus !== "active" &&
      (audioElementsRef.current.size || audioElementRef.current)
    ) {
      audioElementsRef.current.forEach((audio) => audio.pause());
      const leader =
        audioElementRef.current ??
        audioElementsRef.current.values().next().value ??
        null;
      if (leader) {
        setCurrentTime(leader.currentTime);
      }
      setIsPlaying(false);
      return;
    }
    const ctx = audioContextRef.current;
    const startedAt = startAtRef.current;
    const elapsed =
      ctx && startedAt != null
        ? Math.max(0, ctx.currentTime - startedAt)
        : currentTime;
    const clamped = duration > 0 ? Math.min(elapsed, duration) : elapsed;
    stopPlayback();
    setCurrentTime(clamped);
  }, [currentTime, duration, remixStatus, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      audioContextRef.current?.close().catch(() => null);
    };
  }, [stopPlayback]);

  useEffect(() => {
    if (sources.length === 0) {
      stopPlayback();
      buffersRef.current = {};
      setDuration(0);
      setCurrentTime(0);
      setPlayableCount(0);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    if (useElementPlayback) {
      stopPlayback();
      buffersRef.current = {};
      setDuration(0);
      setCurrentTime(0);
      setPlayableCount(0);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      const ctx = await ensureAudioContext();
      if (!ctx || cancelled) return;
      const loaded: Record<string, AudioBuffer | null> = {};
      let longest = 0;
      let playable = 0;
      for (const source of sources) {
        if (!source.url) {
          loaded[source.id] = null;
          continue;
        }
        try {
          const response = await fetch(source.url, {
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(
              `Failed to load ${source.label} (${response.status})`,
            );
          }
          const data = await response.arrayBuffer();
          const buffer = await ctx.decodeAudioData(data);
          loaded[source.id] = buffer;
          playable += 1;
          longest = Math.max(longest, buffer.duration);
        } catch (error) {
          if (controller.signal.aborted || cancelled) return;
          loaded[source.id] = null;
          const message =
            error instanceof Error
              ? error.message
              : `Could not decode ${source.label}`;
          setLoadError((prev) => prev ?? message);
        }
      }
      if (cancelled) return;
      buffersRef.current = loaded;
      setPlayableCount(playable);
      setDuration(longest);
      setCurrentTime(0);
      setIsLoading(false);
    };

    stopPlayback();
    buffersRef.current = {};
    setDuration(0);
    setCurrentTime(0);
    setPlayableCount(0);

    load().catch((error) => {
      if (cancelled) return;
      setLoadError(error instanceof Error ? error.message : "Failed to load audio.");
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      controller.abort();
      stopPlayback();
    };
  }, [ensureAudioContext, sources, stopPlayback, useElementPlayback]);

  useEffect(() => {
    if (!useElementPlayback || sources.length === 0) {
      audioElementsRef.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioElementsRef.current.clear();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = "";
        audioElementRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const elements = new Map<string, HTMLAudioElement>();
    const handlers = new Map<
      string,
      {
        loaded: () => void;
        time: () => void;
        ended: () => void;
        error: () => void;
      }
    >();
    const loadedIds = new Set<string>();
    let longest = 0;

    setIsLoading(true);
    setLoadError(null);
    setPlayableCount(0);
    setDuration(0);
    setCurrentTime(0);

    if (sourceMode === "playback") {
      const playbackKey = "playback";
      const audio = new Audio();
      audio.preload = "metadata";
      audio.volume = volume;
      let currentIndex = 0;

      const setPlaybackSource = (index: number) => {
        const source = sources[index];
        if (!source) return;
        audio.src = source.url;
        audio.load();
      };

      const handleLoaded = () => {
        if (cancelled) return;
        const durationValue = Number.isFinite(audio.duration)
          ? audio.duration
          : 0;
        if (durationValue > longest) {
          longest = durationValue;
        }
        setPlayableCount(1);
        setDuration(longest);
        setIsLoading(false);
      };
      const handleError = () => {
        if (cancelled) return;
        const nextIndex = currentIndex + 1;
        if (nextIndex < sources.length) {
          currentIndex = nextIndex;
          setPlaybackSource(currentIndex);
          return;
        }
        setLoadError(
          (prev) =>
            prev ?? `Could not decode ${sources[currentIndex]?.label ?? "audio"}`,
        );
        setIsLoading(false);
      };
      const handleTime = () => {
        if (cancelled) return;
        setCurrentTime(audio.currentTime);
      };
      const handleEnded = () => {
        if (cancelled) return;
        setIsPlaying(false);
        setCurrentTime(audio.duration || 0);
      };

      audio.addEventListener("loadedmetadata", handleLoaded);
      audio.addEventListener("timeupdate", handleTime);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      setPlaybackSource(currentIndex);

      handlers.set(playbackKey, {
        loaded: handleLoaded,
        time: handleTime,
        ended: handleEnded,
        error: handleError,
      });
      elements.set(playbackKey, audio);
    } else {
      sources.forEach((source, index) => {
        const audio = new Audio();
        audio.preload = "metadata";
        audio.src = source.url;
        audio.volume = volume;

        const handleLoaded = () => {
          if (cancelled) return;
          loadedIds.add(source.id);
          const durationValue = Number.isFinite(audio.duration)
            ? audio.duration
            : 0;
          if (durationValue > longest) {
            longest = durationValue;
          }
          setPlayableCount(loadedIds.size);
          setDuration(longest);
          if (loadedIds.size >= sources.length) {
            setIsLoading(false);
          }
        };
        const handleError = () => {
          if (cancelled) return;
          setLoadError((prev) => prev ?? `Could not decode ${source.label}`);
          setIsLoading(false);
        };
        const handleTime = () => {
          if (cancelled) return;
          if (index === 0) {
            setCurrentTime(audio.currentTime);
          }
        };
        const handleEnded = () => {
          if (cancelled) return;
          if (index === 0) {
            setIsPlaying(false);
            setCurrentTime(audio.duration || 0);
          }
        };

        audio.addEventListener("loadedmetadata", handleLoaded);
        audio.addEventListener("timeupdate", handleTime);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);
        audio.load();

        handlers.set(source.id, {
          loaded: handleLoaded,
          time: handleTime,
          ended: handleEnded,
          error: handleError,
        });
        elements.set(source.id, audio);
      });
    }

    audioElementsRef.current = elements;
    audioElementRef.current =
      sourceMode === "playback"
        ? elements.get("playback") ?? null
        : sources[0]?.id
          ? elements.get(sources[0].id) ?? null
          : null;

    return () => {
      cancelled = true;
      elements.forEach((audio, id) => {
        const entry = handlers.get(id);
        if (entry) {
          audio.removeEventListener("loadedmetadata", entry.loaded);
          audio.removeEventListener("timeupdate", entry.time);
          audio.removeEventListener("ended", entry.ended);
          audio.removeEventListener("error", entry.error);
        }
        audio.pause();
        audio.src = "";
      });
      if (
        audioElementRef.current &&
        audioElementRef.current === elements.get(sources[0]?.id ?? "")
      ) {
        audioElementRef.current = null;
      }
      audioElementsRef.current.clear();
    };
  }, [sources, sourceMode, useElementPlayback]);

  useEffect(() => {
    if (audioElementsRef.current.size) {
      audioElementsRef.current.forEach((audio) => {
        audio.volume = volume;
      });
      return;
    }
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume;
      return;
    }
    const ctx = audioContextRef.current;
    const gain = masterGainRef.current;
    if (!ctx || !gain) return;
    gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.01);
  }, [volume]);

  const startRaf = useCallback(() => {
    stopRaf();
    const tick = () => {
      const ctx = audioContextRef.current;
      const startedAt = startAtRef.current;
      if (!ctx || startedAt == null) return;
      const elapsed = Math.max(0, ctx.currentTime - startedAt);
      const clamped = duration > 0 ? Math.min(elapsed, duration) : elapsed;
      setCurrentTime(clamped);
      if (duration > 0 && clamped >= duration) {
        stopPlayback();
        setCurrentTime(duration);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, stopPlayback, stopRaf]);

  const fadeElementVolume = useCallback(
    (audio: HTMLAudioElement, target: number, durationMs: number) =>
      new Promise<void>((resolve) => {
        if (durationMs <= 0 || typeof window === "undefined") {
          audio.volume = target;
          resolve();
          return;
        }
        const start = audio.volume;
        const delta = target - start;
        const startTime = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - startTime) / durationMs);
          audio.volume = start + delta * progress;
          if (progress >= 1) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    [],
  );

  const startPlayback = useCallback(
    async (offsetSec = 0) => {
      if (sources.length === 0) return;
      stopPlayback();

      if (audioElementsRef.current.size || audioElementRef.current) {
        const elements = audioElementsRef.current.size
          ? Array.from(audioElementsRef.current.values())
          : audioElementRef.current
            ? [audioElementRef.current]
            : [];
        elements.forEach((audio) => {
          try {
            audio.currentTime = Math.max(0, offsetSec);
          } catch {
            /* ignore */
          }
        });
        const results = await Promise.allSettled(
          elements.map((audio) => audio.play()),
        );
        if (results.some((result) => result.status === "fulfilled")) {
          setIsPlaying(true);
        } else {
          setLoadError("Unable to start playback.");
        }
        return;
      }

      const ctx = await ensureAudioContext();
      if (!ctx) return;
      let gain = masterGainRef.current;
      if (!gain) {
        gain = ctx.createGain();
        gain.connect(ctx.destination);
        masterGainRef.current = gain;
      }
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      const startAt = ctx.currentTime + 0.05;
      const handles: SourceHandle[] = [];
      let longest = duration;

      for (const source of sources) {
        const buffer = buffersRef.current[source.id];
        if (!buffer) continue;
        const startOffset = Math.max(
          0,
          Math.min(offsetSec, Math.max(0, buffer.duration - 0.01)),
        );
        if (buffer.duration === 0 || startOffset >= buffer.duration) continue;
        const node = ctx.createBufferSource();
        node.buffer = buffer;
        node.connect(gain);
        node.start(startAt, startOffset);
        handles.push({ id: source.id, source: node });
        longest = Math.max(longest, buffer.duration);
      }

      if (!handles.length) return;
      activeSourcesRef.current = handles;
      const effectiveOffset = longest > 0 ? Math.min(offsetSec, longest) : offsetSec;
      startAtRef.current = startAt - effectiveOffset;
      setDuration(longest);
      setCurrentTime(effectiveOffset);
      setIsPlaying(true);
      startRaf();
    },
    [duration, ensureAudioContext, sources, startRaf, stopPlayback, volume],    
  );

  const startStemPlayback = useCallback(
    async (offsetSec = 0, fadeInMs = 0) => {
      if (remixGroups.length === 0) return;
      const ctx = await ensureAudioContext();
      if (!ctx) return;
      stopWebAudioSources();
      let master = masterGainRef.current;
      if (!master) {
        master = ctx.createGain();
        master.connect(ctx.destination);
        masterGainRef.current = master;
      }
      master.gain.setValueAtTime(volume, ctx.currentTime);
      const startAt = ctx.currentTime + 0.02;
      const handles: SourceHandle[] = [];
      const gains = new Map<string, GainNode>();
      let longest = 0;

      remixGroups.forEach((group) => {
        const buffer = remixBuffersRef.current[group.id];
        if (!buffer) return;
        const groupGain = ctx.createGain();
        const targetGain = Math.max(0, Math.min(1, group.gain));
        if (fadeInMs > 0) {
          groupGain.gain.setValueAtTime(0, ctx.currentTime);
          groupGain.gain.linearRampToValueAtTime(
            targetGain,
            ctx.currentTime + fadeInMs / 1000,
          );
        } else {
          groupGain.gain.setValueAtTime(targetGain, ctx.currentTime);
        }
        groupGain.connect(master);
        const node = ctx.createBufferSource();
        node.buffer = buffer;
        node.connect(groupGain);
        const maxStart = Math.max(0, buffer.duration - 0.01);
        const startOffset = Math.max(0, Math.min(offsetSec, maxStart));
        node.start(startAt, startOffset);
        handles.push({ id: group.id, source: node });
        gains.set(group.id, groupGain);
        longest = Math.max(longest, buffer.duration);
      });

      if (!handles.length) return;
      activeSourcesRef.current = handles;
      remixGainsRef.current = gains;
      const effectiveOffset = longest > 0 ? Math.min(offsetSec, longest) : offsetSec;
      startAtRef.current = startAt - effectiveOffset;
      setDuration(longest);
      setCurrentTime(effectiveOffset);
      setIsPlaying(true);
      setRemixStatus("active");
      startRaf();
    },
    [ensureAudioContext, remixGroups, startRaf, stopWebAudioSources, volume],
  );

  const activateRemix = useCallback(async () => {
    const mixElement =
      audioElementRef.current ??
      audioElementsRef.current.values().next().value ??
      null;
    const mixTime = mixElement ? mixElement.currentTime : currentTime;
    const fadeMs = 450;
    await startStemPlayback(mixTime, fadeMs);
    if (mixElement) {
      await fadeElementVolume(mixElement, 0, fadeMs);
      mixElement.pause();
      mixElement.currentTime = mixTime;
      mixElement.volume = volume;
    }
  }, [currentTime, fadeElementVolume, startStemPlayback, volume]);

  const loadStemPack = useCallback(async () => {
    if (!original) return;
    if (remixStatus === "loading") return;
    remixRequestedRef.current = true;
    setRemixStatus("loading");
    setRemixError(null);
    const controller = new AbortController();
    remixControllerRef.current?.abort();
    remixControllerRef.current = controller;
    try {
      const pack: StemPack = await fetchStemPack(original.id, controller.signal);
      if (controller.signal.aborted) return;
      if (pack.processing && pack.processing.status !== "ready") {
        const detail = pack.processing.detail?.trim();
        throw new Error(detail || "Stem pack is still processing.");
      }
      const baseGroups = (pack.groups ?? [])
        .map((group) => {
          const source = pickStemGroupSource(group.sources);
          if (!source) return null;
          const gain = Number.isFinite(group.defaultGain)
            ? Math.max(0, Math.min(1, group.defaultGain))
            : 1;
          return {
            ...group,
            gain,
            source,
          };
        })
        .filter((group): group is StemGroupPlayback => Boolean(group));

      if (baseGroups.length === 0) {
        throw new Error("No stem groups are available yet.");
      }

      const ctx = await ensureAudioContext();
      if (!ctx) {
        throw new Error("Audio engine unavailable.");
      }

      const buffers: Record<string, AudioBuffer | null> = {};
      let playable = 0;
      let longest = 0;
      let decodeIssue: string | null = null;
      for (const group of baseGroups) {
        if (!group.source?.url) {
          buffers[group.id] = null;
          continue;
        }
        try {
          const response = await fetch(group.source.url, {
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(
              `Failed to load ${group.label} (${response.status})`,
            );
          }
          const data = await response.arrayBuffer();
          const buffer = await ctx.decodeAudioData(data);
          buffers[group.id] = buffer;
          playable += 1;
          longest = Math.max(longest, buffer.duration);
        } catch (error) {
          if (controller.signal.aborted) return;
          buffers[group.id] = null;
          const message =
            error instanceof Error
              ? error.message
              : `Could not decode ${group.label}`;
          decodeIssue = decodeIssue ?? message;
          setRemixError((prev) => prev ?? message);
        }
      }

      if (playable === 0) {
        throw new Error(decodeIssue ?? "Stem groups are not ready.");
      }

      remixBuffersRef.current = buffers;
      remixDurationRef.current = longest;
      const readyGroups = baseGroups.filter((group) => buffers[group.id]);
      setRemixGroups(readyGroups);
      setRemixStatus("ready");
      if (remixRequestedRef.current && isPlaying) {
        await activateRemix();
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        error instanceof Error ? error.message : "Unable to load stem pack.";
      setRemixError(message);
      setRemixStatus("error");
    }
  }, [
    activateRemix,
    ensureAudioContext,
    isPlaying,
    original,
    remixStatus,
  ]);

  const handlePause = useCallback(() => {
    pausePlayback();
  }, [pausePlayback]);

  const handleRemix = useCallback(() => {
    if (!original) return;
    remixRequestedRef.current = true;
    if (remixStatus === "active") return;
    if (remixStatus === "ready") {
      if (isPlaying) {
        void activateRemix();
      }
      return;
    }
    if (remixStatus === "loading") return;
    void loadStemPack();
  }, [activateRemix, isPlaying, loadStemPack, original, remixStatus]);

  const requiresAllSources = false;
  const hasPlayable =
    sources.length > 0 &&
    (requiresAllSources ? playableCount >= sources.length : playableCount > 0);
  const remixPlayable = remixStatus === "ready" || remixStatus === "active";

  const handlePlay = useCallback(() => {
    const shouldUseRemix =
      remixStatus === "active" ||
      (remixStatus === "ready" && remixRequestedRef.current);
    if (shouldUseRemix) {
      requestAudioFocus({ id: playerIdRef.current, stop: handlePause });
      const resumeFrom =
        duration > 0 && currentTime >= duration ? 0 : currentTime;
      void startStemPlayback(resumeFrom);
      return;
    }
    if (!hasPlayable || isLoading) return;
    requestAudioFocus({ id: playerIdRef.current, stop: handlePause });
    const resumeFrom = duration > 0 && currentTime >= duration ? 0 : currentTime;
    void startPlayback(resumeFrom);
  }, [
    currentTime,
    duration,
    handlePause,
    hasPlayable,
    isLoading,
    remixStatus,
    startPlayback,
    startStemPlayback,
  ]);

  const handleSeek = useCallback(
    (value: number) => {
      const safe = Math.max(0, Math.min(duration || 0, value));
      setCurrentTime(safe);
      if (remixStatus === "active") {
        if (isPlaying) {
          void startStemPlayback(safe);
        }
        return;
      }
      if (audioElementsRef.current.size) {
        audioElementsRef.current.forEach((audio) => {
          audio.currentTime = safe;
          if (isPlaying) {
            void audio.play().catch(() => null);
          }
        });
        return;
      }
      if (audioElementRef.current) {
        audioElementRef.current.currentTime = safe;
        return;
      }
      if (isPlaying) {
        void startPlayback(safe);
      }
    },
    [duration, isPlaying, remixStatus, startPlayback, startStemPlayback],
  );

  const handleGroupGainChange = useCallback((groupId: string, gain: number) => {
    const clamped = Math.max(0, Math.min(1, gain));
    setRemixGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, gain: clamped } : group,
      ),
    );
    const ctx = audioContextRef.current;
    const node = remixGainsRef.current.get(groupId);
    if (ctx && node) {
      node.gain.setTargetAtTime(clamped, ctx.currentTime, 0.01);
    }
  }, []);

  const sourceLabel = useMemo(() => {
    if (sourceMode === "playback") return sources[0]?.label ?? "Song";
    if (sourceMode === "fallback") return sources[0]?.label ?? "Song";
    return "";
  }, [sourceMode, sources]);

  const lyricText = details?.lyrics?.trim() ?? "";
  const lyricLines = useMemo(
    () =>
      lyricText
        ? lyricText.split(/\r?\n/).map((line) => line.trimEnd())
        : [],
    [lyricText],
  );

  const meaningCards = useMemo<MeaningCard[]>(() => {
    if (!ideologyDoc || lyricLines.length === 0) return [];
    const nodeById = new Map(ideologyDoc.nodes.map((node) => [node.id, node]));
    const parentById = new Map<string, string>();
    ideologyDoc.nodes.forEach((node) => {
      node.children?.forEach((childId) => {
        if (!parentById.has(childId)) parentById.set(childId, node.id);
      });
    });
    const tokenCache = new Map<string, Set<string>>();
    const cards: MeaningCard[] = [];
    const usedNodes = new Set<string>();
    const segments: { text: string }[] = [];

    const getTokens = (nodeId: string) => {
      const cached = tokenCache.get(nodeId);
      if (cached) return cached;
      const node = nodeById.get(nodeId);
      if (!node) return new Set<string>();
      const tokens = buildNodeTokens(node);
      const hint = IDEOLOGY_HINTS[node.id];
      if (hint) {
        hint.tokens.forEach((token) => tokens.add(normalizeToken(token)));
        hint.phrases.forEach((phrase) =>
          tokenize(phrase).forEach((token) => tokens.add(token)),
        );
      }
      tokenCache.set(nodeId, tokens);
      return tokens;
    };

    const buildPath = (nodeId: string) => {
      const titles: string[] = [];
      let current: string | undefined = nodeId;
      for (let i = 0; i < 6 && current; i += 1) {
        const node = nodeById.get(current);
        if (!node) break;
        titles.unshift(node.title);
        current = parentById.get(current);
      }
      return titles.join(" → ");
    };

    for (let i = 0; i < lyricLines.length; i += 1) {
      const line = lyricLines[i]?.trim();
      if (!line) continue;
      const next = lyricLines[i + 1]?.trim();
      if (next) {
        segments.push({ text: `${line} / ${next}` });
        i += 1;
      } else {
        segments.push({ text: line });
      }
    }

    const maxCards = 6;
    const maxPerSegment = 2;
    const minScore = 2;

    for (const segment of segments) {
      if (cards.length >= maxCards) break;
      const lineTokens = new Set(tokenize(segment.text));
      if (lineTokens.size === 0) continue;
      const lineText = segment.text.toLowerCase();
      const scored: Array<{
        nodeId: string;
        score: number;
        matches: string[];
        phraseHits: number;
      }> = [];

      for (const node of ideologyDoc.nodes) {
        if (node.id === ideologyDoc.rootId) continue;
        if (usedNodes.has(node.id)) continue;
        const tokens = getTokens(node.id);
        if (tokens.size === 0) continue;
        const matches: string[] = [];
        lineTokens.forEach((token) => {
          if (tokens.has(token)) matches.push(token);
        });
        const hint = IDEOLOGY_HINTS[node.id];
        const phraseHits = hint
          ? hint.phrases.filter((phrase) => lineText.includes(phrase)).length
          : 0;
        const score = matches.length + phraseHits * 3;
        if (score < minScore) continue;
        scored.push({ nodeId: node.id, score, matches, phraseHits });
      }

      scored.sort((a, b) => b.score - a.score);
      for (const entry of scored.slice(0, maxPerSegment)) {
        if (cards.length >= maxCards) break;
        if (usedNodes.has(entry.nodeId)) continue;
        const node = nodeById.get(entry.nodeId);
        if (!node) continue;
        const hint = IDEOLOGY_HINTS[entry.nodeId];
        const focusLabel = hint?.focus ? ` (${hint.focus})` : "";
        const confidence =
          entry.score >= 5 ? "High" : entry.score >= 3 ? "Medium" : "Low";
        const matchLabel = entry.matches.slice(0, 2).join(", ");
        const parallel =
          hint?.focus
            ? `This line aligns with ${node.title}${focusLabel}.`
            : matchLabel
              ? `This line aligns with ${node.title} through ${matchLabel}.`
              : `This line aligns with ${node.title}.`;
        usedNodes.add(entry.nodeId);
        cards.push({
          nodeId: entry.nodeId,
          nodeTitle: node.title,
          nodePath: buildPath(entry.nodeId),
          confidence,
          lyricQuote: segment.text,
          parallel,
        });
      }
    }

    return cards;
  }, [ideologyDoc, lyricLines]);

  const currentIndex = useMemo(
    () => playlist.findIndex((entry) => entry.id === original?.id),
    [original?.id, playlist],
  );
  const canSelectPrev =
    typeof onSelectOriginal === "function" && currentIndex > 0;
  const canSelectNext =
    typeof onSelectOriginal === "function" &&
    currentIndex >= 0 &&
    currentIndex < playlist.length - 1;

  const handlePrev = useCallback(() => {
    if (!canSelectPrev || !onSelectOriginal) return;
    onSelectOriginal(playlist[currentIndex - 1]);
  }, [canSelectPrev, currentIndex, onSelectOriginal, playlist]);

  const handleNext = useCallback(() => {
    if (!canSelectNext || !onSelectOriginal) return;
    onSelectOriginal(playlist[currentIndex + 1]);
  }, [canSelectNext, currentIndex, onSelectOriginal, playlist]);

  const handleVary = useCallback(
    (preset?: MoodPreset) => {
      if (!onVary || isVarying) return;
      onVary(preset);
    },
    [isVarying, onVary],
  );

  const previewMoods = moodPresets.slice(0, 5);
  const showVaryControls = Boolean(onVary) && previewMoods.length > 0;
  const initials = buildInitials(original?.title, original?.artist);
  const stemCount = details?.stemCount ?? original?.stemCount ?? 0;
  const canRemix = stemCount > 0;
  const remixLoading = remixStatus === "loading";
  const remixReady = remixPlayable;
  const isReady = (hasPlayable && !isLoading) || remixReady;
  const remixLabel = remixLoading
    ? "Loading stems"
    : remixStatus === "active"
      ? "Remix live"
      : remixReady
        ? "Remix ready"
        : "Remix";
  const timeSky = details?.timeSky;
  const publishedLabel = formatDate(
    timeSky?.publishedAt ?? details?.uploadedAt ?? original?.uploadedAt,
  );
  const madeLabel = formatDateRange(
    timeSky?.composedStart,
    timeSky?.composedEnd,
  );
  const placeLabel = timeSky?.place?.trim() || "Not provided";
  const skyLabel = timeSky?.skySignature?.trim() || "Unavailable";

  useEffect(() => {
    if (!original) {
      setAutoPlayPending(false);
      return;
    }
    if (typeof autoPlayToken !== "number") return;
    if (lastAutoPlayRef.current === autoPlayToken) return;
    lastAutoPlayRef.current = autoPlayToken;
    setAutoPlayPending(true);
  }, [autoPlayToken, original]);

  useEffect(() => {
    if (!autoPlayPending) return;
    if (!isReady || isPlaying) return;
    void handlePlay();
    setAutoPlayPending(false);
  }, [autoPlayPending, handlePlay, isPlaying, isReady]);

  return (
    <div className="rounded-3xl border border-border bg-background/70 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-900 to-slate-950 text-2xl font-semibold text-slate-100 shadow-inner">
              {initials}
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Now Playing
              </div>
              <div className="text-xl font-semibold text-slate-100">
                {original?.title ?? "Select a song"}
              </div>
              <div className="text-sm text-muted-foreground">
                {original?.artist ?? "-"}
              </div>
              {sourceLabel ? (
                <div className="text-xs text-muted-foreground">{sourceLabel}</div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={lyricsOpen ? "secondary" : "ghost"}
              onClick={() => setLyricsOpen((prev) => !prev)}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Lyrics
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              disabled={!canSelectPrev}
              onClick={handlePrev}
              aria-label="Previous song"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              disabled={!isReady}
              onClick={isPlaying ? handlePause : handlePlay}
              aria-label={isPlaying ? "Pause song" : "Play song"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={!canSelectNext}
              onClick={handleNext}
              aria-label="Next song"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-w-[200px] flex-1">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 1}
              step={0.25}
              disabled={!isReady}
              onValueChange={(value) => handleSeek(value[0] ?? 0)}
              className={cn(!isReady && "opacity-50")}
            />
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div className="flex min-w-[120px] items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value) => setVolume(value[0] ?? 0)}
            />
          </div>
        </div>

        {showVaryControls ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              disabled={!isReady || isVarying}
              onClick={() => handleVary(previewMoods[0])}
            >
              <Sparkles className="h-4 w-4" />
              Vary
            </Button>
            {previewMoods.map((preset) => (
              <Button
                key={preset.id}
                size="sm"
                variant="outline"
                className="rounded-full text-xs"
                disabled={!isReady || isVarying}
                onClick={() => handleVary(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        ) : null}

        {canRemix ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant={remixReady ? "secondary" : "outline"}
              className="gap-2"
              disabled={remixLoading || remixStatus === "active"}
              onClick={handleRemix}
            >
              {remixLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {remixLabel}
            </Button>
            {remixStatus === "error" && remixError ? (
              <span className="text-xs text-amber-200">{remixError}</span>
            ) : null}
            {remixReady && remixGroups.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                Grouped stems ready.
              </span>
            ) : null}
          </div>
        ) : null}

        {remixReady && remixGroups.length > 0 ? (
          <div className="rounded-xl border border-border/60 bg-slate-950/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Remix Groups
            </div>
            <div className="mt-3 grid gap-3">
              {remixGroups.map((group) => (
                <div key={group.id} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium text-slate-200">
                    {group.label}
                  </div>
                  <Slider
                    value={[group.gain]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(value) =>
                      handleGroupGainChange(group.id, value[0] ?? 0)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {loadError ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            {loadError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading audio
          </div>
        ) : null}
      </div>

      {lyricsOpen ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Lyrics &amp; Meaning</h3>
              <p className="text-xs text-slate-400">
                Explore words, meaning, and context without leaving playback.
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setLyricsOpen(false)}>
              Close
            </Button>
          </div>

          <Tabs defaultValue="lyrics" className="mt-4">
            <TabsList className="bg-white/5">
              <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
              <TabsTrigger value="meaning">Meaning</TabsTrigger>
            </TabsList>

            <TabsContent value="lyrics">
              {detailsLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading lyrics
                </div>
              ) : detailsError ? (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {detailsError}
                </div>
              ) : lyricLines.length ? (
                <div className="mt-3 space-y-2 text-sm leading-relaxed">
                  {lyricLines.map((line, index) => (
                    <p key={`${line}-${index}`} className={cn(!line && "h-3")}>
                      {line || "\u00A0"}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                  Lyrics not available for this song.
                </div>
              )}
            </TabsContent>

            <TabsContent value="meaning">
              <div className="mt-3 space-y-4">
                {meaningCards.length ? (
                  <div className="space-y-3">
                    {meaningCards.map((card) => (
                      <div
                        key={`${card.nodeId}-${card.lyricQuote}`}
                        className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200"
                      >
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
                          <span>{card.nodeTitle}</span>
                          <span>{card.confidence}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {card.nodePath}
                        </div>
                        <p className="mt-2 text-sm">{card.parallel}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          &ldquo;{card.lyricQuote}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                    Add lyrics to generate ideology parallels.
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Interpretation, not author intent.
                </div>

                <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      Time &amp; Sky
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Published</span>
                        <span>{publishedLabel}</span>
                      </div>
                      {madeLabel ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Made</span>
                          <span>{madeLabel}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Place</span>
                        <span>{placeLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Sky signature</span>
                        <span>{skyLabel}</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </div>
  );
}

export default OriginalsPlayer;
