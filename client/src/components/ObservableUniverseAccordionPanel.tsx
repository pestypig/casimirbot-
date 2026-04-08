import React from "react";
import type { ObservableUniverseAccordionEtaSurfaceResult } from "@shared/observable-universe-accordion-surfaces";

type ObservableUniverseAccordionPanelProps = {
  surface: ObservableUniverseAccordionEtaSurfaceResult | null | undefined;
};

const formatNumber = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "deferred";
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

const renderRow = (label: string, value: string) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-800/70 py-2 last:border-b-0">
    <dt className="text-slate-400">{label}</dt>
    <dd className="text-right text-slate-100">{value}</dd>
  </div>
);

export function ObservableUniverseAccordionPanel({
  surface,
}: ObservableUniverseAccordionPanelProps) {
  const statusLabel =
    surface?.status === "computed"
      ? "contract-backed"
      : surface?.status === "unavailable"
        ? "fail-closed / deferred"
        : "deferred";
  const firstEntry = surface?.status === "computed" ? surface.entries[0] : null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            NHM2 bounded trip-estimate provenance
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Target-coupled ETA semantics only. This panel does not promote speed,
            viability, or unconstrained route-map claims.
          </p>
        </div>
        <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
          {statusLabel}
        </span>
      </header>

      <dl className="space-y-0">
        {renderRow(
          "Default operating profile",
          surface?.defaultOperatingProfileId ?? "deferred",
        )}
        {renderRow(
          "Supported band floor",
          surface?.supportedBandFloorProfileId ?? "deferred",
        )}
        {renderRow(
          "Supported band ceiling",
          surface?.supportedBandCeilingProfileId ?? "deferred",
        )}
        {renderRow(
          "Evidence floor",
          surface?.evidenceFloorProfileId ?? "deferred",
        )}
        {renderRow(
          "Evidence floor alpha",
          formatNumber(surface?.evidenceFloorCenterlineAlpha),
        )}
        {renderRow(
          "Support buffer",
          formatNumber(surface?.supportBufferDeltaCenterlineAlpha),
        )}
        {renderRow(
          "Contract status",
          surface?.supportedBandStatus ?? "deferred",
        )}
        {renderRow(
          "Radius meaning",
          surface?.radiusMeaning ?? "Deferred until the explicit NHM2 contract is available.",
        )}
      </dl>

      {firstEntry ? (
        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-900/70 p-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Active projection
          </div>
          <div className="mt-2 grid gap-2 text-sm text-slate-200">
            <div>
              {firstEntry.label ?? firstEntry.id}: {firstEntry.estimateYears.toFixed(3)} yr
            </div>
            <div>Mode: {firstEntry.estimateKind}</div>
            <div>Driving profile: {firstEntry.drivingProfileId}</div>
            <div>
              Supported band membership:{" "}
              {firstEntry.withinSupportedBand ? "within supported band" : "outside supported band"}
            </div>
            <div>Source artifact: {firstEntry.sourceArtifactPath}</div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
          {surface?.status === "unavailable"
            ? `${surface.reason} The panel stays fail-closed instead of substituting SR output.`
            : "No explicit NHM2 trip-estimate contract has been resolved yet."}
        </div>
      )}
    </section>
  );
}

export default ObservableUniverseAccordionPanel;
