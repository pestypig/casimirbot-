import React, { useMemo, useState } from "react";
import {
  OBSERVABLE_UNIVERSE_SUPPORTED_ETA_MODES,
  type ObservableUniverseSupportedEtaMode,
} from "@shared/observable-universe-accordion-projections-constants";
import type {
  ObservableUniverseAccordionEtaSurfaceEntry,
  ObservableUniverseAccordionEtaSurfaceResult,
} from "@shared/observable-universe-accordion-surfaces";
import { useObservableUniverseAccordion } from "@/hooks/useObservableUniverseAccordion";
import {
  OBSERVABLE_UNIVERSE_ACTIVE_TARGET,
  OBSERVABLE_UNIVERSE_NEARBY_VISIBLE_TARGETS,
} from "@/lib/observable-universe-accordion";
import { Button } from "@/components/ui/button";

type ObservableUniverseAccordionPanelProps = {
  surface: ObservableUniverseAccordionEtaSurfaceResult | null | undefined;
  isLoading?: boolean;
  isFetching?: boolean;
  errorMessage?: string | null;
  estimateKind?: ObservableUniverseSupportedEtaMode;
  onEstimateKindChange?: (value: ObservableUniverseSupportedEtaMode) => void;
  onRefresh?: () => void;
  targetLabel?: string;
};

type Vec3 = [number, number, number];

const SVG_SIZE = 420;
const SVG_PADDING = 34;

const formatNumber = (value: number | null | undefined, digits = 2): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "deferred";
  return Number.isInteger(value) ? value.toString() : value.toFixed(digits);
};

const formatMaybeDateEpoch = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "deferred";

const formatVector = (value: Vec3): string =>
  `${value[0].toFixed(2)}, ${value[1].toFixed(2)}, ${value[2].toFixed(2)}`;

const norm2d = (value: [number, number]): number =>
  Math.hypot(value[0], value[1]);

const project3dTo2d = (value: Vec3): [number, number] => {
  const yaw = Math.PI / 4;
  const pitch = Math.PI / 6;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);

  const x1 = value[0] * cosYaw - value[1] * sinYaw;
  const y1 = value[0] * sinYaw + value[1] * cosYaw;
  const z1 = value[2];
  const y2 = y1 * cosPitch - z1 * sinPitch;
  return [x1, y2];
};

const pixelPoint = (
  value: [number, number],
  scale: number,
): [number, number] => {
  const center = SVG_SIZE / 2;
  return [center + value[0] * scale, center - value[1] * scale];
};

const renderRow = (label: string, value: string) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-800/70 py-2 last:border-b-0">
    <dt className="text-slate-400">{label}</dt>
    <dd className="text-right text-slate-100">{value}</dd>
  </div>
);

const buildMapGeometry = (entries: ObservableUniverseAccordionEtaSurfaceEntry[]) => {
  const rawPoints = entries.flatMap((entry) => [
    project3dTo2d(entry.outputPosition_m),
    project3dTo2d(entry.canonicalPosition_m),
  ]);
  const maxProjectedRadius =
    rawPoints.reduce((best, point) => Math.max(best, norm2d(point)), 0) || 1;
  const scale = (SVG_SIZE / 2 - SVG_PADDING) / maxProjectedRadius;

  return entries.map((entry) => ({
    entry,
    canonicalPoint: pixelPoint(project3dTo2d(entry.canonicalPosition_m), scale),
    outputPoint: pixelPoint(project3dTo2d(entry.outputPosition_m), scale),
  }));
};

const modeLabel = (value: ObservableUniverseSupportedEtaMode | undefined): string =>
  value === "coordinate_time" ? "coordinate_time" : "proper_time";

const supportLabelFor = (entry: ObservableUniverseAccordionEtaSurfaceEntry): string =>
  entry.etaSupport === "contract_backed" ? "contract-backed ETA" : "render-only";

const AccordionMap = ({
  entries,
}: {
  entries: ObservableUniverseAccordionEtaSurfaceEntry[];
}) => {
  const geometry = useMemo(() => buildMapGeometry(entries), [entries]);
  const center = SVG_SIZE / 2;
  const ringRadius = center - SVG_PADDING;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">
            Sol-Centered Render
          </div>
          <div className="text-xs text-slate-400">
            Canonical ray preserved, only radius remapped.
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          hidden anchors excluded
        </div>
      </div>
      <svg
        data-testid="observable-universe-accordion-map"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="h-[340px] w-full rounded-xl border border-slate-900 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_rgba(2,6,23,0.92)_60%)]"
        role="img"
        aria-label="Observable universe accordion map"
      >
        <rect width={SVG_SIZE} height={SVG_SIZE} fill="transparent" />
        {[0.25, 0.5, 0.75, 1].map((factor) => (
          <circle
            key={factor}
            cx={center}
            cy={center}
            r={ringRadius * factor}
            fill="none"
            stroke="rgba(100,116,139,0.35)"
            strokeWidth={factor === 1 ? 1.4 : 1}
            strokeDasharray={factor === 1 ? undefined : "4 6"}
          />
        ))}
        <line
          x1={SVG_PADDING}
          y1={center}
          x2={SVG_SIZE - SVG_PADDING}
          y2={center}
          stroke="rgba(100,116,139,0.28)"
          strokeWidth={1}
        />
        <line
          x1={center}
          y1={SVG_PADDING}
          x2={center}
          y2={SVG_SIZE - SVG_PADDING}
          stroke="rgba(100,116,139,0.28)"
          strokeWidth={1}
        />
        {geometry.map(({ entry, canonicalPoint, outputPoint }) => (
          <g key={entry.id}>
            <line
              x1={center}
              y1={center}
              x2={canonicalPoint[0]}
              y2={canonicalPoint[1]}
              stroke="rgba(148,163,184,0.8)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
            <circle
              cx={canonicalPoint[0]}
              cy={canonicalPoint[1]}
              r={entry.etaSupport === "contract_backed" ? 4 : 5}
              fill={
                entry.etaSupport === "contract_backed"
                  ? "rgba(148,163,184,0.95)"
                  : "rgba(251,191,36,0.95)"
              }
            />
            {entry.etaSupport === "contract_backed" ? (
              <>
                <line
                  x1={center}
                  y1={center}
                  x2={outputPoint[0]}
                  y2={outputPoint[1]}
                  stroke="rgba(34,211,238,0.95)"
                  strokeWidth={2.5}
                />
                <circle
                  cx={outputPoint[0]}
                  cy={outputPoint[1]}
                  r={6}
                  fill="rgba(34,211,238,1)"
                />
              </>
            ) : null}
            <text
              x={
                (entry.etaSupport === "contract_backed" ? outputPoint[0] : canonicalPoint[0]) +
                10
              }
              y={
                (entry.etaSupport === "contract_backed" ? outputPoint[1] : canonicalPoint[1]) -
                10
              }
              fill="rgba(226,232,240,1)"
              fontSize="12"
            >
              {entry.label ?? entry.id}
            </text>
            <text
              x={canonicalPoint[0] + 8}
              y={canonicalPoint[1] + 16}
              fill={
                entry.etaSupport === "contract_backed"
                  ? "rgba(148,163,184,0.95)"
                  : "rgba(251,191,36,0.95)"
              }
              fontSize="11"
            >
              {entry.etaSupport === "contract_backed" ? "canonical" : "render-only"}
            </text>
          </g>
        ))}
        <circle cx={center} cy={center} r={7} fill="rgba(250,204,21,0.95)" />
        <text
          x={center + 10}
          y={center - 12}
          fill="rgba(250,250,249,1)"
          fontSize="12"
        >
          Sol
        </text>
      </svg>
    </div>
  );
};

export function ObservableUniverseAccordionPanel({
  surface,
  isLoading = false,
  isFetching = false,
  errorMessage,
  estimateKind = "proper_time",
  onEstimateKindChange,
  onRefresh,
  targetLabel = OBSERVABLE_UNIVERSE_ACTIVE_TARGET.label,
}: ObservableUniverseAccordionPanelProps) {
  const computedEntries = surface?.status === "computed" ? surface.entries : [];
  const activeEntry =
    surface?.status === "computed"
      ? computedEntries.find((entry) => entry.etaSupport === "contract_backed") ?? null
      : null;
  const renderOnlyEntries =
    surface?.status === "computed"
      ? computedEntries.filter((entry) => entry.etaSupport === "render_only")
      : [];
  const statusLabel =
    surface?.status === "computed"
      ? "contract-backed"
      : surface?.status === "unavailable"
        ? "fail-closed / deferred"
        : isLoading
          ? "loading"
          : "deferred";

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">
            Observable Universe Accordion
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Small nearby-star catalog with one explicit NHM2 ETA lane. Sol stays
            fixed, the sky direction stays canonical, and only contract-backed
            targets receive radius remaps.
          </p>
        </div>
        <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
          {statusLabel}
        </span>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
        <span className="uppercase tracking-[0.18em] text-slate-500">
          ETA-backed target
        </span>
        <span className="rounded border border-slate-700 px-2 py-1 text-slate-100">
          {activeEntry?.label ?? targetLabel}
        </span>
        <span className="uppercase tracking-[0.18em] text-slate-500">
          Visible nearby catalog
        </span>
        <span className="rounded border border-slate-700 px-2 py-1 text-slate-100">
          {surface?.status === "computed"
            ? `${computedEntries.length} stars`
            : `${OBSERVABLE_UNIVERSE_NEARBY_VISIBLE_TARGETS.length} stars`}
        </span>
        <label className="ml-auto flex items-center gap-2">
          <span className="uppercase tracking-[0.18em] text-slate-500">Mode</span>
          <select
            aria-label="ETA mode"
            value={estimateKind}
            onChange={(event) =>
              onEstimateKindChange?.(
                event.target.value as ObservableUniverseSupportedEtaMode,
              )
            }
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
          >
            {OBSERVABLE_UNIVERSE_SUPPORTED_ETA_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onRefresh}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {isLoading && !surface && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-slate-300">
          Resolving the nearby-star accordion surface...
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          {errorMessage}
        </div>
      )}

      {surface?.status === "computed" && computedEntries.length > 0 ? (
        <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <AccordionMap entries={computedEntries} />

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Active projection
              </div>
              {activeEntry ? (
                <div className="mt-3 space-y-2 text-sm text-slate-200">
                  <div>
                    {activeEntry.label ?? activeEntry.id}:{" "}
                    {activeEntry.estimateYears?.toFixed(3)} yr
                  </div>
                  <div>Mode: {modeLabel(activeEntry.estimateKind ?? undefined)}</div>
                  <div>Driving profile: {activeEntry.drivingProfileId}</div>
                  <div>
                    Supported band membership:{" "}
                    {activeEntry.withinSupportedBand
                      ? "within supported band"
                      : "outside supported band"}
                  </div>
                  <div>Frame: {activeEntry.frame_id}</div>
                  <div>Frame realization: {activeEntry.frame_realization ?? "Gaia_CRF3"}</div>
                  <div>Render epoch: {formatMaybeDateEpoch(activeEntry.render_epoch_tcb_jy)}</div>
                  <div>Provenance: {activeEntry.provenance_class}</div>
                  <div>Source artifact: {activeEntry.sourceArtifactPath}</div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-amber-100">
                  No contract-backed ETA target is active. The panel stays honest
                  and does not substitute a fallback estimate.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Map diagnostics
              </div>
              <dl className="mt-3 space-y-0">
                {renderRow("Radius meaning", surface.radiusMeaning)}
                {renderRow("Default operating profile", surface.defaultOperatingProfileId ?? "deferred")}
                {renderRow("Supported band floor", surface.supportedBandFloorProfileId ?? "deferred")}
                {renderRow("Supported band ceiling", surface.supportedBandCeilingProfileId ?? "deferred")}
                {renderRow("Evidence floor", surface.evidenceFloorProfileId ?? "deferred")}
                {renderRow("Evidence floor alpha", formatNumber(surface.evidenceFloorCenterlineAlpha))}
                {renderRow("Support buffer", formatNumber(surface.supportBufferDeltaCenterlineAlpha))}
                {renderRow("Contract status", surface.supportedBandStatus ?? "deferred")}
                {renderRow("Hidden anchors", String(surface.hiddenAnchorCount))}
                {renderRow(
                  "Render-only nearby stars",
                  String(renderOnlyEntries.length),
                )}
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Visible nearby catalog
              </div>
              <div className="mt-3 space-y-3 text-xs text-slate-300">
                {computedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-800 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-100">
                        {entry.label ?? entry.id}
                      </span>
                      <span
                        className={
                          entry.etaSupport === "contract_backed"
                            ? "rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-cyan-200"
                            : "rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-200"
                        }
                      >
                        {supportLabelFor(entry)}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-400">
                      Frame {entry.frame_id} · provenance {entry.provenance_class}
                    </div>
                    {entry.etaSupport === "render_only" ? (
                      <div className="mt-2 text-amber-100">{entry.renderOnlyReason}</div>
                    ) : (
                      <div className="mt-2 text-slate-300">
                        {entry.estimateYears?.toFixed(3)} yr via {entry.drivingProfileId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {activeEntry && (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Entry vectors
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <div>Input direction unit: {formatVector(activeEntry.inputDirectionUnit)}</div>
                  <div>Canonical position: {formatVector(activeEntry.canonicalPosition_m)}</div>
                  <div>Rendered position: {formatVector(activeEntry.outputPosition_m)}</div>
                  <div>Mapped radius (m): {activeEntry.mappedRadius_m?.toExponential(3)}</div>
                  <div>
                    Propagation limitations:{" "}
                    {activeEntry.propagation_limitations.length > 0
                      ? activeEntry.propagation_limitations.join(", ")
                      : "none surfaced"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          {surface?.status === "unavailable"
            ? `${surface.reason} The panel stays fail-closed instead of substituting SR output.`
            : "No explicit NHM2 trip-estimate contract has been resolved yet."}
        </div>
      )}
    </section>
  );
}

export default function ObservableUniverseAccordionConnectedPanel() {
  const [estimateKind, setEstimateKind] =
    useState<ObservableUniverseSupportedEtaMode>("proper_time");
  const { data, isLoading, isFetching, error, refetch } =
    useObservableUniverseAccordion({
      estimateKind,
    });

  return (
    <ObservableUniverseAccordionPanel
      surface={data}
      isLoading={isLoading}
      isFetching={isFetching}
      errorMessage={error instanceof Error ? error.message : null}
      estimateKind={estimateKind}
      onEstimateKindChange={setEstimateKind}
      onRefresh={() => {
        void refetch();
      }}
      targetLabel={OBSERVABLE_UNIVERSE_ACTIVE_TARGET.label}
    />
  );
}
