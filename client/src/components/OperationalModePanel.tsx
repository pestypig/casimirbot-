import React from "react";
import { Loader2, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MODE_CONFIGS,
  type ModeKey,
  useEnergyPipeline,
  useSwitchMode,
} from "@/hooks/use-energy-pipeline";

const QUICK_MODE_KEYS: ModeKey[] = ["standby", "hover", "nearzero", "cruise", "emergency"];

const descriptionFor = (mode: ModeKey) => {
  const cfg = MODE_CONFIGS[mode];
  return cfg?.hint ?? cfg?.description ?? "Switch instantly";
};

const formatPercent = (value?: number) =>
  Number.isFinite(value) ? `${((value as number) * 100).toFixed(2)}%` : "—";

export default function OperationalModePanel() {
  const { data, isLoading } = useEnergyPipeline({ refetchInterval: 2000 });
  const switchMode = useSwitchMode();

  const currentMode = (data?.currentMode ?? "hover") as ModeKey;
  const dutyFR = data?.dutyEffectiveFR ?? data?.dutyCycle;

  const handleSwitch = (mode: ModeKey) => {
    if (mode === currentMode || switchMode.isPending) return;
    switchMode.mutate(mode);
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-semibold">Operational Modes</CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide w-fit">
            <Zap className="mr-1 h-3 w-3 text-cyan-300" />
            Live
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Switch HELIX drive posture from any workspace. Buttons call the same server hooks as
          /helix-core.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_MODE_KEYS.map((mode) => {
            const cfg = MODE_CONFIGS[mode];
            if (!cfg) return null;
            const active = currentMode === mode;
            return (
              <Button
                key={mode}
                variant={active ? "default" : "outline"}
                className="h-16 w-full flex flex-col items-start justify-between text-left"
                disabled={switchMode.isPending}
                onClick={() => handleSwitch(mode)}
              >
                <span className="font-mono text-sm">{cfg.name}</span>
                <span className="text-[11px] leading-tight opacity-80">{descriptionFor(mode)}</span>
              </Button>
            );
          })}
        </div>
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-3 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <span>Active:</span>
            <span className="text-slate-100">{MODE_CONFIGS[currentMode]?.name ?? currentMode}</span>
            {(isLoading || switchMode.isPending) && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3">
            <span>Duty (FR): {formatPercent(dutyFR)}</span>
            <span>Sectors live: {MODE_CONFIGS[currentMode]?.sectorsConcurrent ?? "—"}</span>
            <span>Local burst: {formatPercent(MODE_CONFIGS[currentMode]?.localBurstFrac)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

