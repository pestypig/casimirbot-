import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { DualTopLists } from "@/components/noise-gens/DualTopLists";
import { CoverCreator, COVER_DROPPABLE_ID } from "@/components/noise-gens/CoverCreator";
import { UploadOriginalsModal } from "@/components/noise-gens/UploadOriginalsModal";
import { MoodLegend } from "@/components/noise-gens/MoodLegend";
import HelixMarkIcon from "@/components/icons/HelixMarkIcon";
import type { MoodPreset, Original, HelixPacket } from "@/types/noise-gens";
import { useToast } from "@/hooks/use-toast";

type SessionUser = {
  name: string;
  initials?: string;
};

function useMockSession(): { user: SessionUser | null } {
  if (typeof window === "undefined") return { user: null };
  const globalUser =
    (window as typeof window & { __HELIX_USER?: SessionUser | null }).__HELIX_USER ?? null;
  return { user: globalUser };
}

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
  const [hasGenerations, setHasGenerations] = useState(false);
  const [includeHelixPacket, setIncludeHelixPacket] = useState(Boolean(readHelixPacket()));
  const [helixPacket, setHelixPacket] = useState<HelixPacket | null>(() => readHelixPacket());
  const { user } = useMockSession();

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
    if (includeHelixPacket) {
      setHelixPacket(readHelixPacket());
    }
  }, [includeHelixPacket]);

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
        setSelectedOriginal(original);
        toast({
          title: "Track selected",
          description: `${original.title} is ready for mood blending.`,
        });
      }
    },
    [toast],
  );

  const handleOriginalSelect = useCallback(
    (original: Original) => {
      setSelectedOriginal(original);
      toast({
        title: "Track selected",
        description: `${original.title} is ready for mood blending.`,
      });
    },
    [toast],
  );

  const handleRequestSignIn = useCallback(() => {
    toast({
      title: "Sign in required",
      description: "Please sign in through Helix Bridge to upload originals.",
    });
  }, [toast]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 text-slate-100">
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
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="h-4 w-4" aria-hidden />
                Upload Originals
              </Button>
              {user ? (
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
              ) : (
                <Button
                  variant="outline"
                  className="gap-2 border-white/20 text-slate-100 hover:bg-white/10"
                  onClick={handleRequestSignIn}
                >
                  <User className="h-4 w-4" aria-hidden />
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 lg:px-6">
            <div className="grid gap-6 lg:grid-cols-[3fr,2fr] xl:grid-cols-[7fr,5fr]">
              <DualTopLists
                selectedOriginalId={selectedOriginal?.id}
                onOriginalSelected={handleOriginalSelect}
                onGenerationsPresenceChange={setHasGenerations}
                onMoodPresetsLoaded={setMoodPresets}
              />
              <CoverCreator
                includeHelixPacket={includeHelixPacket}
                helixPacket={helixPacket}
                selectedOriginal={selectedOriginal}
                onClearSelection={() => setSelectedOriginal(null)}
                moodPresets={moodPresets}
              />
            </div>
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
      </div>

      <UploadOriginalsModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        isAuthenticated={Boolean(user)}
        onRequestSignIn={handleRequestSignIn}
        onUploaded={() => {
          toast({
            title: "Upload received",
            description: "We will surface the new original once it is ranked.",
          });
        }}
      />
    </DndContext>
  );
}
