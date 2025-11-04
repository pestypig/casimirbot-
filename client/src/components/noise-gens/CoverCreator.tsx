import { useEffect, useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchJobStatus, requestGeneration } from "@/lib/api/noiseGens";
import type { JobStatus, MoodPreset, Original, HelixPacket } from "@/types/noise-gens";
import { cn } from "@/lib/utils";

export const COVER_DROPPABLE_ID = "noise-cover-creator";

type CoverCreatorProps = {
  selectedOriginal: Original | null;
  onClearSelection: () => void;
  moodPresets: MoodPreset[];
  includeHelixPacket: boolean;
  helixPacket: HelixPacket | null;
};

type JobTracker = {
  id: string;
  status: JobStatus;
};

const STATUS_ORDER: JobStatus[] = ["queued", "processing", "ready", "error"];

export function CoverCreator({
  selectedOriginal,
  onClearSelection,
  moodPresets,
  includeHelixPacket,
  helixPacket,
}: CoverCreatorProps) {
  const { toast } = useToast();
  const [seed, setSeed] = useState<string>("");
  const [job, setJob] = useState<JobTracker | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const { isOver, setNodeRef } = useDroppable({ id: COVER_DROPPABLE_ID });

  const { mutateAsync: queueGeneration, isPending: isRequesting } = useMutation({
    mutationFn: requestGeneration,
  });

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

    const poll = async () => {
      try {
        const response = await fetchJobStatus(job.id, controller.signal);
        if (cancelled) return;
        setJob({ id: job.id, status: response.status });
        if (response.detail) {
          setJobMessage(response.detail);
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

    poll();
    const timer = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [job, toast]);

  useEffect(() => {
    if (!selectedOriginal) {
      setJob(null);
      setJobMessage(null);
    }
  }, [selectedOriginal]);

  const formattedDuration = useMemo(() => {
    if (!selectedOriginal) return null;
    const totalSeconds = Math.round(selectedOriginal.duration ?? 0);
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [selectedOriginal]);

  const handleQueueGeneration = async (preset: MoodPreset) => {
    if (!selectedOriginal || isRequesting) return;
    if (includeHelixPacket && !helixPacket) {
      toast({
        title: "Helix packet unavailable",
        description: "Open Helix Observables and start a run to capture the packet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        originalId: selectedOriginal.id,
        moodId: preset.id,
        seed: seed.trim() ? Number(seed.trim()) : undefined,
        helixPacket: includeHelixPacket ? helixPacket ?? undefined : undefined,
      };
      const response = await queueGeneration(payload);
      setJob({ id: response.jobId, status: "queued" });
      setJobMessage(null);
      toast({
        title: "Generation queued",
        description: `We are rendering ${selectedOriginal.title} with ${preset.label} mood.`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unable to queue generation.",
        variant: "destructive",
      });
    }
  };

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
                {formattedDuration ? ` • ${formattedDuration}` : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-primary/40 text-primary">
                  {selectedOriginal.listens.toLocaleString()} listens
                </Badge>
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
              disabled={!selectedOriginal || isRequesting}
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
                  disabled={!selectedOriginal || isRequesting}
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
