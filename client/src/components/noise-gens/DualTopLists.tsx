import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useDraggable } from "@dnd-kit/core";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fetchMoodPresets, fetchTopGenerations, fetchTopOriginals } from "@/lib/api/noiseGens";
import type { Generation, MoodPreset, Original } from "@/types/noise-gens";
import { cn } from "@/lib/utils";

type DualTopListsProps = {
  selectedOriginalId?: string | null;
  onOriginalSelected: (original: Original) => void;
  onGenerationsPresenceChange?: (hasGenerations: boolean) => void;
  onMoodPresetsLoaded?: (presets: MoodPreset[]) => void;
};

type RankedOriginal = Original & { rank: number };
type RankedGeneration = Generation & { rank: number };

type ConnectorPath = {
  id: string;
  path: string;
};

const SEARCH_DEBOUNCE_MS = 250;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => {
      window.clearTimeout(handle);
    };
  }, [value, delay]);
  return debounced;
}

function scoreMatch(haystack: string, needle: string) {
  if (!needle) return -Infinity;
  const normalizedHaystack = haystack.toLowerCase();
  const normalizedNeedle = needle.toLowerCase();
  if (normalizedHaystack === normalizedNeedle) return 4;
  if (normalizedHaystack.startsWith(normalizedNeedle)) return 3;
  if (normalizedHaystack.includes(normalizedNeedle)) return 2;
  return -Infinity;
}

function buildRankedList<T extends { id: string; listens: number }>(
  items: T[],
  search: string,
  accessor: (item: T) => string[],
): Array<T & { rank: number }> {
  if (!items.length) return [];
  const rankedByListens = [...items].sort((a, b) => b.listens - a.listens);
  const rankLookup = new Map(rankedByListens.map((item, index) => [item.id, index + 1]));
  if (!search.trim()) {
    return rankedByListens.map((item) => ({ ...item, rank: rankLookup.get(item.id) ?? 0 }));
  }
  let bestMatch: T | null = null;
  let bestScore = -Infinity;
  for (const item of rankedByListens) {
    const fields = accessor(item);
    const itemScore = Math.max(...fields.map((field) => scoreMatch(field, search)));
    if (itemScore > bestScore) {
      bestScore = itemScore;
      bestMatch = item;
    }
  }
  const ordered = bestMatch
    ? [bestMatch, ...rankedByListens.filter((item) => item.id !== bestMatch?.id)]
    : rankedByListens;
  return ordered.map((item) => ({ ...item, rank: rankLookup.get(item.id) ?? 0 }));
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);
  return prefersReducedMotion;
}

function useIsLargeScreen() {
  const [isLarge, setIsLarge] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(min-width: 1024px)");
    const handler = (event: MediaQueryListEvent) => setIsLarge(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);
  return isLarge;
}

type OriginalRowProps = {
  original: RankedOriginal;
  selected: boolean;
  onSelect: (value: Original) => void;
  setRef: (node: HTMLDivElement | null) => void;
};

const OriginalRow = memo(({ original, selected, onSelect, setRef }: OriginalRowProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `original-${original.id}`,
    data: { type: "original", original },
  });
  const { role: _dragRole, tabIndex: _dragTabIndex, ...draggableAttributes } = attributes;
  const composedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      setRef(node);
    },
    [setNodeRef, setRef],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(original);
      }
    },
    [onSelect, original],
  );
  return (
    <div
      ref={composedRef}
      {...draggableAttributes}
      {...listeners}
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onClick={() => onSelect(original)}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected
          ? "border-primary/80 bg-primary/10 text-primary-foreground"
          : "bg-background/40 hover:bg-primary/5",
        isDragging && "z-20 border-primary bg-primary/20",
      )}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        #{original.rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{original.title}</div>
        <div className="text-xs text-muted-foreground">{original.artist}</div>
      </div>
      <div className="text-xs font-medium text-muted-foreground tabular-nums">
        {original.listens.toLocaleString()} plays
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-2 hidden whitespace-nowrap text-xs group-focus-visible:inline-flex group-hover:inline-flex lg:hidden"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(original);
        }}
      >
        Use in Cover Creator
      </Button>
    </div>
  );
});
OriginalRow.displayName = "OriginalRow";

type GenerationRowProps = {
  generation: RankedGeneration;
  setRef?: (node: HTMLDivElement | null) => void;
};

const GenerationRow = memo(({ generation, setRef }: GenerationRowProps) => (
  <div
    ref={setRef}
    className="flex items-center gap-3 rounded-2xl bg-background/40 px-3 py-2"
  >
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      #{generation.rank}
    </div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-semibold">{generation.title}</div>
      <div className="text-xs text-muted-foreground">Mood: {generation.mood}</div>
    </div>
    <div className="text-xs font-medium text-muted-foreground tabular-nums">
      {generation.listens.toLocaleString()} plays
    </div>
  </div>
));
GenerationRow.displayName = "GenerationRow";

export function DualTopLists({
  selectedOriginalId,
  onOriginalSelected,
  onGenerationsPresenceChange,
  onMoodPresetsLoaded,
}: DualTopListsProps) {
  const [searchOriginals, setSearchOriginals] = useState("");
  const [searchGenerations, setSearchGenerations] = useState("");
  const debouncedOriginals = useDebouncedValue(searchOriginals, SEARCH_DEBOUNCE_MS);
  const debouncedGenerations = useDebouncedValue(searchGenerations, SEARCH_DEBOUNCE_MS);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isLargeScreen = useIsLargeScreen();
  const showConnectors = isLargeScreen && !prefersReducedMotion;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const originalRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const generationRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<ConnectorPath[]>([]);
  const [svgHeight, setSvgHeight] = useState(0);
  const updateQueuedRef = useRef(false);

  const setOriginalRef = useCallback((id: string) => {
    return (node: HTMLDivElement | null) => {
      if (node) {
        originalRefs.current[id] = node;
      } else {
        delete originalRefs.current[id];
      }
    };
  }, []);

  const setGenerationRef = useCallback((id: string) => {
    return (node: HTMLDivElement | null) => {
      if (node) {
        generationRefs.current[id] = node;
      } else {
        delete generationRefs.current[id];
      }
    };
  }, []);

  const { data: originalsData, isLoading: originalsLoading, isError: originalsError } = useQuery({
    queryKey: ["noise-gens", "originals", debouncedOriginals],
    queryFn: ({ signal }) => fetchTopOriginals(debouncedOriginals, signal),
    staleTime: 60_000,
  });

  const { data: generationsData, isLoading: generationsLoading, isError: generationsError } =
    useQuery({
      queryKey: ["noise-gens", "generations", debouncedGenerations],
      queryFn: ({ signal }) => fetchTopGenerations(debouncedGenerations, signal),
      staleTime: 60_000,
    });

  const { data: moodPresets } = useQuery({
    queryKey: ["noise-gens", "moods"],
    queryFn: ({ signal }) => fetchMoodPresets(signal),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (moodPresets && onMoodPresetsLoaded) {
      onMoodPresetsLoaded(moodPresets);
    }
  }, [moodPresets, onMoodPresetsLoaded]);

  useEffect(() => {
    onGenerationsPresenceChange?.((generationsData ?? []).length > 0);
  }, [generationsData, onGenerationsPresenceChange]);

  const originals = useMemo<RankedOriginal[]>(() => {
    return buildRankedList(
      originalsData ?? [],
      debouncedOriginals,
      (item) => [item.title, item.artist],
    );
  }, [originalsData, debouncedOriginals]);

  const generations = useMemo<RankedGeneration[]>(() => {
    return buildRankedList(
      generationsData ?? [],
      debouncedGenerations,
      (item) => [item.title, item.mood],
    );
  }, [generationsData, debouncedGenerations]);

  const generationByOriginal = useMemo(() => {
    const lookup = new Map<string, RankedGeneration>();
    for (const generation of generations) {
      if (!lookup.has(generation.originalId)) {
        lookup.set(generation.originalId, generation);
      }
    }
    return lookup;
  }, [generations]);

  const scheduleUpdate = useCallback(() => {
    if (updateQueuedRef.current) return;
    updateQueuedRef.current = true;
    requestAnimationFrame(() => {
      updateQueuedRef.current = false;
      const container = containerRef.current;
      if (!container || !showConnectors) {
        setPaths([]);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const scrollLeft = container.scrollLeft;
      const nextPaths: ConnectorPath[] = [];
      const visibleTop = scrollTop;
      const visibleBottom = scrollTop + container.clientHeight;
      setSvgHeight(container.scrollHeight);

      for (const [originalId, originalNode] of Object.entries(originalRefs.current)) {
        if (!generationByOriginal.has(originalId)) continue;
        const generationNode = generationRefs.current[originalId];
        if (!originalNode || !generationNode) continue;
        const originalRect = originalNode.getBoundingClientRect();
        const generationRect = generationNode.getBoundingClientRect();
        const originalTop = originalRect.top - containerRect.top + scrollTop;
        const originalBottom = originalTop + originalRect.height;
        const generationTop = generationRect.top - containerRect.top + scrollTop;
        const generationBottom = generationTop + generationRect.height;
        const isVisible =
          (originalTop >= visibleTop && originalTop <= visibleBottom) ||
          (originalBottom >= visibleTop && originalBottom <= visibleBottom) ||
          (generationTop >= visibleTop && generationTop <= visibleBottom) ||
          (generationBottom >= visibleTop && generationBottom <= visibleBottom);
        if (!isVisible) continue;

        const startX =
          originalRect.right - containerRect.left + scrollLeft + 16; // 16px gutter
        const startY = originalTop + originalRect.height / 2;
        const endX = generationRect.left - containerRect.left + scrollLeft - 16;
        const endY = generationTop + generationRect.height / 2;
        const controlOffset = Math.max(60, Math.abs(endX - startX) / 2);
        const path = [
          `M ${startX} ${startY}`,
          `C ${startX + controlOffset} ${startY} ${endX - controlOffset} ${endY} ${endX} ${endY}`,
        ].join(" ");
        nextPaths.push({ id: originalId, path });
      }
      setPaths(nextPaths);
    });
  }, [generationByOriginal, showConnectors]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const handleScroll = () => scheduleUpdate();
    container.addEventListener("scroll", handleScroll, { passive: true });
    const resizeObserver = new ResizeObserver(() => scheduleUpdate());
    resizeObserver.observe(container);
    scheduleUpdate();
    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [scheduleUpdate]);

  useEffect(() => {
    scheduleUpdate();
  }, [scheduleUpdate, originals, generations, showConnectors]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-y-auto rounded-3xl border border-border bg-secondary/10 p-4 lg:p-6"
      role="group"
      aria-label="Top originals and top generations"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),140px,minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="noise-originals-heading" className="space-y-3">
          <header className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Search className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h2 id="noise-originals-heading" className="text-lg font-semibold">
                Top Originals
              </h2>
              <p className="text-xs text-muted-foreground">
                Drag an original into the Cover Creator to start a mood blend.
              </p>
            </div>
          </header>
          <div className="space-y-3">
            <Input
              placeholder="Search originals"
              value={searchOriginals}
              role="searchbox"
              onChange={(event) => setSearchOriginals(event.target.value)}
            />
            <div className="space-y-2" role="listbox" aria-label="Top originals list">
              {originalsLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-2xl" />
                ))
              ) : originalsError ? (
                <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
                  We couldn&rsquo;t load originals. Try again in a moment.
                </div>
              ) : originals.length ? (
                originals.map((original) => (
                  <OriginalRow
                    key={original.id}
                    original={original}
                    selected={selectedOriginalId === original.id}
                    onSelect={onOriginalSelected}
                    setRef={setOriginalRef(original.id)}
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                  No originals match that search yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="relative hidden justify-center lg:flex">
          {showConnectors && paths.length > 0 ? (
            <svg
              className="pointer-events-none"
              width="140"
              height={svgHeight || 400}
              viewBox={`0 0 140 ${svgHeight || 400}`}
            >
              <defs>
                <linearGradient id="noise-connector" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(148, 163, 184, 0.2)" />
                  <stop offset="100%" stopColor="rgba(59, 130, 246, 0.5)" />
                </linearGradient>
              </defs>
              {paths.map((connector) => (
                <path
                  key={connector.id}
                  d={connector.path}
                  fill="none"
                  stroke="url(#noise-connector)"
                  strokeWidth={1.5}
                />
              ))}
            </svg>
          ) : null}
        </div>

        <section aria-labelledby="noise-generations-heading" className="space-y-3">
          <header className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Search className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h2 id="noise-generations-heading" className="text-lg font-semibold">
                Top Generations
              </h2>
              <p className="text-xs text-muted-foreground">
                Each generation inherits its original&rsquo;s energy with a Helix mood imprint.
              </p>
            </div>
          </header>
          <div className="space-y-3">
            <Input
              placeholder="Search generations"
              value={searchGenerations}
              role="searchbox"
              onChange={(event) => setSearchGenerations(event.target.value)}
            />
            <div className="space-y-2" role="listbox" aria-label="Top generations list">
              {generationsLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 rounded-2xl" />
                ))
              ) : generationsError ? (
                <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
                  We couldn&rsquo;t load generations. Try again soon.
                </div>
              ) : generations.length ? (
                generations.map((generation) => {
                  const isPrimary =
                    generationByOriginal.get(generation.originalId)?.id === generation.id;
                  return (
                    <GenerationRow
                      key={generation.id}
                      generation={generation}
                      setRef={isPrimary ? setGenerationRef(generation.originalId) : undefined}
                    />
                  );
                })
              ) : (
                <div className="rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
                  No generations match that search yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DualTopLists;
