import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter } from "bad-words";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { uploadOriginal } from "@/lib/api/noiseGens";
import { MiniPlayer } from "./MiniPlayer";
import type { TempoMeta } from "@/types/noise-gens";

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
const clampBpm = (value: number) => Math.max(40, Math.min(250, value));
const sanitizeBpmInput = (value: string): number | null => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return clampBpm(numeric);
};

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

const ACCEPTED_TYPES = [
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/x-mpeg",
  "audio/flac",
  "audio/ogg",
  "audio/x-aiff",
  "audio/aiff",
].join(",");

type FieldState = {
  value: string;
  error: string | null;
};

export type UploadOriginalPrefill = {
  title?: string;
  creator?: string;
  notes?: string;
  instrumental?: File | null;
  vocal?: File | null;
  bpm?: number;
  timeSig?: "4/4" | "3/4" | "6/8";
  barsInLoop?: number;
  quantized?: boolean;
  offsetMs?: number;
  sourceHint?: string;
  knowledgeProjectId?: string;
  knowledgeProjectName?: string;
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
  const filter = useMemo(() => new Filter({ placeHolder: "*" }), []);
  const [title, setTitle] = useState<FieldState>({ value: "", error: null });
  const [creator, setCreator] = useState<FieldState>({ value: "", error: null });
  const [notes, setNotes] = useState("");
  const [instrumentalFile, setInstrumentalFile] = useState<File | null>(null);
  const [vocalFile, setVocalFile] = useState<File | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [bpm, setBpm] = useState<string>("");
  const [timeSig, setTimeSig] = useState<"4/4" | "3/4" | "6/8">("4/4");
  const [barsInLoop, setBarsInLoop] = useState<number>(8);
  const [quantized, setQuantized] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle({ value: "", error: null });
      setCreator({ value: "", error: null });
      setNotes("");
      setInstrumentalFile(null);
      setVocalFile(null);
      setOffsetMs(0);
      setBpm("");
      setTimeSig("4/4");
      setBarsInLoop(8);
      setQuantized(true);
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !prefill) return;
    const metadata = prefill.instrumental ? extractFileMetadata(prefill.instrumental) : undefined;
    const derivedTitle = prefill.title ?? metadata?.title ?? "";
    const derivedCreator = prefill.creator ?? "";
    setTitle({ value: derivedTitle, error: null });
    setCreator({ value: derivedCreator, error: null });
    setNotes(prefill.notes ?? "");
    setInstrumentalFile(prefill.instrumental ?? null);
    setVocalFile(prefill.vocal ?? null);
    if (typeof prefill.offsetMs === "number" && Number.isFinite(prefill.offsetMs)) {
      setOffsetMs(Math.round(prefill.offsetMs));
    } else {
      setOffsetMs(0);
    }
    const resolvedBpm =
      typeof prefill.bpm === "number" && Number.isFinite(prefill.bpm) ? clampBpm(prefill.bpm) : metadata?.bpm;
    setBpm(resolvedBpm ? resolvedBpm.toFixed(2) : "");
    const allowedTimeSig = prefill.timeSig === "3/4" || prefill.timeSig === "6/8" ? prefill.timeSig : "4/4";
    setTimeSig(allowedTimeSig);
    if (typeof prefill.barsInLoop === "number" && Number.isFinite(prefill.barsInLoop)) {
      const clamped = Math.max(1, Math.min(256, Math.round(prefill.barsInLoop)));
      setBarsInLoop(clamped);
    } else {
      setBarsInLoop(8);
    }
    setQuantized(prefill.quantized ?? true);
  }, [open, prefill]);

  const validateField = (label: string, value: string, maxLength: number) => {
    const trimmed = value.trim();
    if (!trimmed) return `${label} is required`;
    if (trimmed.length > maxLength) return `${label} must be under ${maxLength} characters`;
    if (filter.isProfane(trimmed)) return `Please remove profanity from the ${label.toLowerCase()}.`;
    return null;
  };

  const hasRequiredFields =
    instrumentalFile != null &&
    !title.error &&
    !creator.error &&
    title.value.trim().length > 0 &&
    creator.value.trim().length > 0;

  const canSubmit = !isSubmitting && hasRequiredFields;
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
      timeSig,
      quantized,
    };
  }, [bpmNumeric, timeSig, quantized]);

  const autoFillFromFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      const metadata = extractFileMetadata(file);
      if (metadata.title && !title.value.trim()) {
        const clipped = metadata.title.slice(0, MAX_TITLE);
        setTitle({ value: clipped, error: null });
      }
      if (metadata.bpm && !bpm) {
        setBpm(metadata.bpm.toFixed(2));
      }
    },
    [bpm, title.value],
  );

  const handleInstrumentalSelect = useCallback(
    (file: File | null) => {
      setInstrumentalFile(file);
      autoFillFromFile(file);
    },
    [autoFillFromFile],
  );

  const handleVocalSelect = useCallback(
    (file: File | null) => {
      setVocalFile(file);
      autoFillFromFile(file);
    },
    [autoFillFromFile],
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append("title", title.value.trim());
      payload.append("creator", creator.value.trim());
      payload.append("instrumental", instrumentalFile as File);
      if (vocalFile) {
        payload.append("vocal", vocalFile);
      }
      payload.append("offsetMs", String(offsetMs));
      if (notes.trim()) {
        payload.append("notes", notes.trim());
      }
      let tempoMeta: TempoMeta | undefined;
      if (bpmNumeric != null) {
        tempoMeta = {
          bpm: Number(bpmNumeric.toFixed(2)),
          timeSig,
          offsetMs,
          barsInLoop,
          quantized,
        };
        payload.append("tempo", JSON.stringify(tempoMeta));
      }
      const result = await uploadOriginal(payload);
      toast({
        title: "Upload queued",
        description: "We will notify you when mastering finishes.",
      });
      onUploaded?.({
        trackId: result.trackId,
        title: title.value.trim(),
        creator: creator.value.trim(),
        knowledgeProjectId: prefill?.knowledgeProjectId,
        knowledgeProjectName: prefill?.knowledgeProjectName,
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
            Provide your instrumental stem and optionally a vocal. We will align them exactly as
            uploaded, so please double-check the sync using the preview when both stems are present.
          </DialogDescription>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="noise-upload-instrumental">Instrumental stem</Label>
              <Input
                id="noise-upload-instrumental"
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={(event) => handleInstrumentalSelect(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                {instrumentalFile ? instrumentalFile.name : "WAV, AIFF, FLAC, MP3, or OGG"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noise-upload-vocal">Vocal stem (optional)</Label>
              <Input
                id="noise-upload-vocal"
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={(event) => handleVocalSelect(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                {vocalFile
                  ? vocalFile.name
                  : "Upload a dry vocal or stacked harmonies when available."}
              </p>
            </div>
          </div>

          <div>
            <Label>Tempo (optional)</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                BPM
                <Input
                  type="text"
                  inputMode="decimal"
                  pattern="\\d*(\\.\\d{0,2})?"
                  value={bpm}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw === "" || /^\\d*(\\.\\d{0,2})?$/.test(raw)) {
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
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Time signature
                <select
                  value={timeSig}
                  onChange={(event) => setTimeSig(event.target.value as "4/4" | "3/4" | "6/8")}
                  className="h-9 rounded border border-border bg-slate-900 px-2 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="4/4">4/4</option>
                  <option value="3/4">3/4</option>
                  <option value="6/8">6/8</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Bars in loop
                <Input
                  type="number"
                  min={1}
                  max={256}
                  inputMode="numeric"
                  value={String(barsInLoop)}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isNaN(value)) {
                      setBarsInLoop(1);
                      return;
                    }
                    const clamped = Math.max(1, Math.min(256, Math.round(value)));
                    setBarsInLoop(clamped);
                  }}
                  className="rounded bg-slate-900 px-2 py-1 text-slate-100"
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
          </div>

          <div>
            <Label htmlFor="noise-upload-notes">Mix notes (optional)</Label>
            <Textarea
              id="noise-upload-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Call out anything about timing, dynamics, or mood we should preserve."
              className="min-h-[80px]"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Notes go straight to the Helix mix engineers reviewing the upload.
            </p>
          </div>

          <MiniPlayer
            instrumental={instrumentalFile}
            vocal={vocalFile}
            offsetMs={offsetMs}
            onOffsetChange={setOffsetMs}
            disabled={!instrumentalFile || !vocalFile}
            tempo={tempoPreview ?? undefined}
          />
        </div>

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
