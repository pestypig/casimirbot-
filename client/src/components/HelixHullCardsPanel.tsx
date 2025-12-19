import React from "react";
import { Ship, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useUpdatePipeline, type EnergyPipelineState } from "@/hooks/use-energy-pipeline";

type ShipHullCard = {
  id: string;
  name: string;
  icon: string;
  summary: string;
  hull: { Lx_m: number; Ly_m: number; Lz_m: number; wallThickness_m?: number };
  note?: string;
  hint?: string;
};

const SHIP_LIBRARY: ShipHullCard[] = [
  {
    id: "needle-mk1",
    name: "Needle Mk.1",
    icon: "⟁",
    summary: "Baseline Natário test article; matches the pipeline default hull.",
    hull: { Lx_m: 1007, Ly_m: 264, Lz_m: 173, wallThickness_m: 0.02 },
    hint: "Default GR dipole geometry (β along +x).",
  },
  {
    id: "clipper",
    name: "Clipper",
    icon: "✦",
    summary: "Mid-scale demonstrator tuned for coastal launch and rapid test resets.",
    hull: { Lx_m: 420, Ly_m: 128, Lz_m: 92, wallThickness_m: 0.016 },
    hint: "Good for fast turnaround and reduced P/A stress.",
  },
  {
    id: "courier",
    name: "Courier",
    icon: "➹",
    summary: "Long, slender courier frame emphasizing TS_ratio and clean gating.",
    hull: { Lx_m: 760, Ly_m: 180, Lz_m: 110, wallThickness_m: 0.018 },
    hint: "High TS_ratio / FR margin exercises the averaging story.",
  },
  {
    id: "heavy-lancer",
    name: "Heavy Lancer",
    icon: "✸",
    summary: "Cargo-capable hull with thicker walls and higher gamma_geo appetite.",
    hull: { Lx_m: 1450, Ly_m: 360, Lz_m: 230, wallThickness_m: 0.03 },
    note: "Use when testing high power densities; watch mechanical guardrails.",
  },
];

const fmtLength = (meters: number | undefined) => {
  if (!Number.isFinite(meters)) return "n/a";
  const m = meters as number;
  if (m >= 1_000) return `${(m / 1000).toFixed(3)} km`;
  if (m >= 1) return `${m.toFixed(0)} m`;
  if (m >= 0.01) return `${(m * 100).toFixed(1)} cm`;
  return `${(m * 1000).toFixed(1)} mm`;
};

const approxEqual = (a?: number, b?: number, tol = 1.5) =>
  Number.isFinite(a) && Number.isFinite(b) && Math.abs((a as number) - (b as number)) <= tol;

const hullMatchesShip = (hull?: EnergyPipelineState["hull"]): ShipHullCard | null => {
  if (!hull) return null;
  const { Lx_m, Ly_m, Lz_m } = hull as any;
  return (
    SHIP_LIBRARY.find((ship) =>
      approxEqual(ship.hull.Lx_m, Lx_m) &&
      approxEqual(ship.hull.Ly_m, Ly_m) &&
      approxEqual(ship.hull.Lz_m, Lz_m)
    ) ?? null
  );
};

function HullStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[11px] font-mono text-slate-100">
      <span className="text-slate-300">{label}</span>
      <span className="text-right text-slate-100">{value}</span>
    </div>
  );
}

export default function HelixHullCardsPanel({ pipeline }: { pipeline?: EnergyPipelineState | null }) {
  const updatePipeline = useUpdatePipeline();
  const currentMatch = React.useMemo(() => hullMatchesShip(pipeline?.hull), [pipeline?.hull]);
  const [selectedId, setSelectedId] = React.useState<string>(currentMatch?.id ?? SHIP_LIBRARY[0].id);

  React.useEffect(() => {
    if (currentMatch?.id) setSelectedId(currentMatch.id);
  }, [currentMatch?.id]);

  const selected = React.useMemo(
    () => SHIP_LIBRARY.find((ship) => ship.id === selectedId) ?? SHIP_LIBRARY[0],
    [selectedId],
  );

  const applyHull = async (ship: ShipHullCard) => {
    try {
      await updatePipeline.mutateAsync({
        hull: {
          Lx_m: ship.hull.Lx_m,
          Ly_m: ship.hull.Ly_m,
          Lz_m: ship.hull.Lz_m,
          wallThickness_m: ship.hull.wallThickness_m,
        },
      });
      toast({
        title: "Hull applied",
        description: `${ship.name} pushed to pipeline hull geometry.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update pipeline hull.";
      toast({
        title: "Hull update failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="h-full border border-slate-800 bg-slate-950/70 text-slate-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">Fleet Hull Cards</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Pick a ship to set the pipeline hull geometry; mirrors Helix Start card flow.
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1 border-cyan-500/50 text-[11px] text-cyan-200">
            <Ship className="h-3.5 w-3.5" />
            Hull library
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_minmax(0,1fr)]">
          <div className="grid gap-2 sm:grid-cols-2">
            {SHIP_LIBRARY.map((ship) => {
              const isCurrent = currentMatch?.id === ship.id;
              const isSelected = selected.id === ship.id;
              return (
                <button
                  key={ship.id}
                  type="button"
                  onClick={() => setSelectedId(ship.id)}
                  className={[
                    "group flex h-full flex-col justify-between rounded-xl border bg-white/5 p-3 text-left transition",
                    isSelected ? "border-cyan-400/60 shadow-[0_0_0_1px_rgba(34,211,238,0.4)]" : "border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/5",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-lg font-semibold text-white">{ship.name}</div>
                    <span className="text-xl">{ship.icon}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-slate-300">{ship.summary}</p>
                  {ship.hint ? <p className="mt-1 text-[11px] text-cyan-200/90">{ship.hint}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="bg-slate-900/70 text-[11px] font-semibold text-slate-200">
                      {fmtLength(ship.hull.Lx_m)} × {fmtLength(ship.hull.Ly_m)} × {fmtLength(ship.hull.Lz_m)}
                    </Badge>
                    {isCurrent ? (
                      <Badge className="bg-emerald-500/20 text-[11px] text-emerald-100">
                        <Check className="mr-1 h-3 w-3" />
                        In pipeline
                      </Badge>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Selected hull</p>
                <div className="text-lg font-semibold text-white">{selected.name}</div>
                <p className="text-[12px] leading-snug text-slate-300">{selected.summary}</p>
                {selected.note ? (
                  <p className="mt-1 text-[11px] text-amber-200/90">{selected.note}</p>
                ) : null}
              </div>
              <Badge variant="outline" className="border-white/20 text-[11px] text-white">
                {selected.icon}
              </Badge>
            </div>
            <div className="mt-3 grid gap-1.5">
              <HullStat label="Lx × Ly × Lz" value={`${fmtLength(selected.hull.Lx_m)} × ${fmtLength(selected.hull.Ly_m)} × ${fmtLength(selected.hull.Lz_m)}`} />
              <HullStat label="wallThickness" value={fmtLength(selected.hull.wallThickness_m)} />
              <HullStat
                label="Current pipeline hull"
                value={
                  currentMatch
                    ? `${currentMatch.name} (${fmtLength((pipeline as any)?.hull?.Lx_m)} × ${fmtLength((pipeline as any)?.hull?.Ly_m)} × ${fmtLength((pipeline as any)?.hull?.Lz_m)})`
                    : "n/a"
                }
              />
            </div>
            <Button
              className="mt-3 w-full"
              onClick={() => applyHull(selected)}
              disabled={updatePipeline.isPending}
            >
              {updatePipeline.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Apply hull to pipeline
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
