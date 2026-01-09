import React from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const fmtMassFitResiduals = (res?: { rms_N?: number; rms_rel?: number; sampleCount?: number }) => {
  if (!res) return "n/a";
  const parts: string[] = [];
  if (isFiniteNumber(res.rms_N)) parts.push(`rms=${res.rms_N.toExponential(2)} N`);
  if (isFiniteNumber(res.rms_rel)) parts.push(`rms_rel=${res.rms_rel.toExponential(2)}`);
  if (isFiniteNumber(res.sampleCount)) parts.push(`n=${Math.round(res.sampleCount)}`);
  return parts.length ? parts.join(" ") : "n/a";
};

export default function MassProvenancePanel() {
  const { data, isLoading } = useEnergyPipeline({ refetchInterval: 2000 });
  const warpResult = (data as any)?.warp ?? (data as any)?.natario;
  const massModePipeline = data?.massMode;
  const massModeApplied =
    typeof (warpResult as any)?.massModeApplied === "string"
      ? (warpResult as any).massModeApplied
      : massModePipeline;
  const massSource = data?.massSource;
  const warpMassSource =
    typeof (warpResult as any)?.massSource === "string"
      ? (warpResult as any).massSource
      : undefined;
  const massDatasetId = data?.massDatasetId;
  const massFitSummary = fmtMassFitResiduals(data?.massFitResiduals);
  const massSigmaRaw = data?.massSigma_kg;
  const massSigmaLabel = isFiniteNumber(massSigmaRaw)
    ? `+/-${massSigmaRaw.toExponential(2)} kg`
    : "n/a";
  const massSourceNoteRaw = (data as any)?.massSourceNote;
  const massSourceNote =
    typeof massSourceNoteRaw === "string" ? massSourceNoteRaw : undefined;
  const massDatasetMissing = massSource === "measured" && !massDatasetId;
  const massDatasetLabel =
    massDatasetId ?? (massSource === "measured" ? "missing" : "n/a");
  const overrideApplied = Boolean((warpResult as any)?.massOverrideApplied);
  const overrideWarning =
    typeof (warpResult as any)?.massOverrideWarning === "string"
      ? (warpResult as any).massOverrideWarning
      : undefined;
  const invariantMassRaw = (data?.gr as any)?.matter?.stressEnergy?.invariantMass_kg;
  const invariantMassLabel = isFiniteNumber(invariantMassRaw)
    ? `${invariantMassRaw.toExponential(3)} kg`
    : "n/a";
  const invariantMassSigmaRaw = data?.invariantMassSigma_kg;
  const invariantMassSigmaLabel = isFiniteNumber(invariantMassSigmaRaw)
    ? `+/-${invariantMassSigmaRaw.toExponential(2)} kg`
    : "n/a";
  const massModeDetail =
    massModePipeline && massModeApplied && massModePipeline !== massModeApplied
      ? ` (pipeline=${massModePipeline})`
      : "";
  const massSourceDetail =
    warpMassSource && warpMassSource !== massSource
      ? ` (warp=${warpMassSource})`
      : "";
  const massSourceNoteText =
    massSourceNote === "measured_missing_datasetId"
      ? "Measured mass missing datasetId; downgraded to model."
      : massSourceNote;

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">Mass Provenance</CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide w-fit">
            {isLoading ? "Syncing" : "Live"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Receipt for how the current mass number was produced (mode/source/dataset/override).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {massSource === "measured" && (
            <Badge className="bg-emerald-500/20 text-emerald-200">MEASURED</Badge>
          )}
          {massSource === "target" && (
            <Badge className="bg-amber-500/20 text-amber-200">TARGET</Badge>
          )}
          {overrideApplied && (
            <Badge className="bg-rose-500/20 text-rose-200">OVERRIDE</Badge>
          )}
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-slate-950/70 p-3 text-xs">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">mode</span>
              <span className="font-mono text-slate-100">
                {massModeApplied ?? "unknown"}
                {massModeDetail ? <span className="text-slate-500">{massModeDetail}</span> : null}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">source</span>
              <span className="font-mono text-slate-100">
                {massSource ?? "unknown"}
                {massSourceDetail ? <span className="text-slate-500">{massSourceDetail}</span> : null}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">dataset</span>
              <span className={`font-mono ${massDatasetMissing ? "text-amber-300" : "text-slate-100"}`}>
                {massDatasetLabel}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">fit residuals</span>
              <span className="font-mono text-slate-100">{massFitSummary}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">mass sigma</span>
              <span className="font-mono text-slate-100">{massSigmaLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">invariant mass</span>
              <span className="font-mono text-slate-100">{invariantMassLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">invariant sigma</span>
              <span className="font-mono text-slate-100">{invariantMassSigmaLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">override</span>
              <span className={`font-mono ${overrideApplied ? "text-rose-300" : "text-slate-100"}`}>
                {overrideApplied ? "applied" : "none"}
              </span>
            </div>
          </div>
        </div>

        {(massDatasetMissing || massSourceNoteText || overrideWarning) && (
          <div className="space-y-1 text-xs">
            {massDatasetMissing && (
              <div className="flex items-start gap-2 text-amber-300">
                <AlertTriangle className="mt-0.5 h-3 w-3" />
                <span>Measured mass missing datasetId.</span>
              </div>
            )}
            {massSourceNoteText && (
              <div className="flex items-start gap-2 text-amber-300">
                <AlertTriangle className="mt-0.5 h-3 w-3" />
                <span>{massSourceNoteText}</span>
              </div>
            )}
            {overrideWarning && (
              <div className="flex items-start gap-2 text-rose-300">
                <AlertTriangle className="mt-0.5 h-3 w-3" />
                <span>{overrideWarning}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
