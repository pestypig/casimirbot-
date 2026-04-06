import * as React from "react";
import {
  OBSERVABLE_UNIVERSE_CATALOG_SURFACE,
  OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE,
  OBSERVABLE_UNIVERSE_OUTER_BOUNDARY,
  type ObservableUniverseVec3,
} from "@shared/observable-universe-accordion-surfaces";
import { SPEED_OF_LIGHT_MPS } from "@shared/observable-universe-accordion-projections-constants";

type AccordionMode = "raw_distance" | "sr_accessibility" | "nhm2_accessibility";

type ProjectionEntry = {
  id: string;
  label?: string;
  inputPosition_m: ObservableUniverseVec3;
  inputDistance_m: number;
  mappedRadius_s: number | null;
  mappedRadiusCt_m: number;
  outputPosition_m: ObservableUniverseVec3;
};

type ProjectionPayload =
  | {
      ok: true;
      projection: {
        status: "computed";
        accordionMode: AccordionMode;
        provenance_class: "proxy" | "inferred" | "solve_backed";
        contract_badge: string;
        metadata?: Record<string, any>;
        entries: ProjectionEntry[];
      };
    }
  | {
      ok: false;
      projection: {
        status: "unavailable";
        accordionMode: AccordionMode;
        provenance_class: "proxy" | "inferred" | "solve_backed" | "deferred";
        contract_badge: string;
        reason: string;
        metadata?: Record<string, any>;
      };
    };

const SR_CONTROL_MPS2 = 9.80665;
const VIEWBOX = { width: 980, height: 720 };
const CENTER = { x: 360, y: VIEWBOX.height / 2 };
const PLOT_RADIUS = 300;
const BASIS_X: ObservableUniverseVec3 = [0.88, -0.46, 0];
const BASIS_Y: ObservableUniverseVec3 = [0.24, 0.46, -0.85];

const modeCopy: Record<AccordionMode, { label: string; blurb: string }> = {
  raw_distance: {
    label: "raw_distance",
    blurb: "Radius is the catalog distance.",
  },
  sr_accessibility: {
    label: "sr_accessibility",
    blurb: "Radius is the flat-SR flip-burn proper-time reachability map.",
  },
  nhm2_accessibility: {
    label: "nhm2_accessibility",
    blurb: "Radius is admitted only from a certified catalog ETA projection contract.",
  },
};

const dot = (left: ObservableUniverseVec3, right: ObservableUniverseVec3): number =>
  left[0] * right[0] + left[1] * right[1] + left[2] * right[2];

const norm = (vec: ObservableUniverseVec3): number =>
  Math.hypot(vec[0], vec[1], vec[2]);

const unit = (vec: ObservableUniverseVec3): ObservableUniverseVec3 => {
  const magnitude = norm(vec);
  if (!(magnitude > 0)) return [0, 0, 0];
  return [vec[0] / magnitude, vec[1] / magnitude, vec[2] / magnitude];
};

const scaled = (vec: ObservableUniverseVec3, factor: number): ObservableUniverseVec3 => [
  vec[0] * factor,
  vec[1] * factor,
  vec[2] * factor,
];

const projectToPlane = (vec: ObservableUniverseVec3) => ({
  x: dot(vec, BASIS_X),
  y: dot(vec, BASIS_Y),
});

const projectToScreen = (
  position_m: ObservableUniverseVec3,
  maxProjectedRadius: number,
) => {
  const projected = projectToPlane(position_m);
  const planarMagnitude = Math.hypot(projected.x, projected.y);
  const radialFraction = norm(position_m) / Math.max(maxProjectedRadius, 1);
  if (!(radialFraction > 0) || !(planarMagnitude > 0)) {
    return {
      screenX: CENTER.x,
      screenY: CENTER.y,
      radialFraction,
    };
  }
  const planarScale = (radialFraction * PLOT_RADIUS) / planarMagnitude;
  return {
    screenX: CENTER.x + projected.x * planarScale,
    screenY: CENTER.y - projected.y * planarScale,
    radialFraction,
  };
};

const formatEpoch = (epochMs: number | null | undefined): string =>
  epochMs && Number.isFinite(epochMs) ? new Date(epochMs).toISOString().slice(0, 10) : "n/a";

const formatDistance = (meters: number): string => {
  const lightYears = meters / SPEED_OF_LIGHT_MPS / (365.25 * 86_400);
  if (lightYears >= 1e9) return `${(lightYears / 1e9).toFixed(2)} Gly`;
  if (lightYears >= 1e6) return `${(lightYears / 1e6).toFixed(2)} Mly`;
  if (lightYears >= 1e3) return `${(lightYears / 1e3).toFixed(2)} kly`;
  return `${lightYears.toFixed(2)} ly`;
};

const formatTime = (seconds: number | null): string => {
  if (seconds == null || !Number.isFinite(seconds)) return "n/a";
  const years = seconds / (365.25 * 86_400);
  if (years >= 1e9) return `${(years / 1e9).toFixed(2)} Gyr`;
  if (years >= 1e6) return `${(years / 1e6).toFixed(2)} Myr`;
  if (years >= 1e3) return `${(years / 1e3).toFixed(2)} kyr`;
  return `${years.toFixed(2)} yr`;
};

const computeRawEntry = (id: string, label: string, position_m: ObservableUniverseVec3) => {
  const distance = norm(position_m);
  return {
    id,
    label,
    inputPosition_m: position_m,
    inputDistance_m: distance,
    mappedRadius_s: distance / SPEED_OF_LIGHT_MPS,
    mappedRadiusCt_m: distance,
    outputPosition_m: position_m,
  } satisfies ProjectionEntry;
};

const computeSrRadius = (position_m: ObservableUniverseVec3): number => {
  const distance = norm(position_m);
  if (!(distance > 0)) return 0;
  const midpointGamma =
    1 + (SR_CONTROL_MPS2 * distance) / (2 * SPEED_OF_LIGHT_MPS * SPEED_OF_LIGHT_MPS);
  return (
    ((2 * SPEED_OF_LIGHT_MPS) / SR_CONTROL_MPS2) * Math.acosh(midpointGamma) * SPEED_OF_LIGHT_MPS
  );
};

const flowOverlayEntries = OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE.nodes.map((entry) => ({
  ...entry,
  rawRadius_m: norm(entry.position_m),
  srRadius_m: computeSrRadius(entry.position_m),
}));

function Badge({
  label,
  tone = "amber",
}: {
  label: string;
  tone?: "amber" | "teal" | "slate" | "rose";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-300/45 bg-amber-300/10 text-amber-100"
      : tone === "teal"
        ? "border-teal-300/45 bg-teal-300/10 text-teal-100"
        : tone === "rose"
          ? "border-rose-300/45 bg-rose-300/10 text-rose-100"
          : "border-white/15 bg-white/5 text-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ${toneClass}`}>
      {label}
    </span>
  );
}

export default function ObservableUniverseAccordionPanel() {
  const [mode, setMode] = React.useState<AccordionMode>("raw_distance");
  const deferredMode = React.useDeferredValue(mode);
  const [payload, setPayload] = React.useState<ProjectionPayload | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch("/api/helix/relativistic-map/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        projectionKind: "observable_universe_accordion",
        accordionMode: deferredMode,
        frame: "heliocentric-icrs",
        control:
          deferredMode === "sr_accessibility"
            ? { properAcceleration_m_s2: SR_CONTROL_MPS2 }
            : undefined,
        catalog: OBSERVABLE_UNIVERSE_CATALOG_SURFACE.entries.map((entry) => ({
          id: entry.id,
          label: entry.label,
          position_m: entry.position_m,
        })),
      }),
    })
      .then(async (response) => {
        const json = (await response.json()) as ProjectionPayload;
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        setPayload(json);
      })
      .catch((nextError) => {
        if ((nextError as Error).name === "AbortError") return;
        setPayload(null);
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [deferredMode]);

  const catalogEntries = React.useMemo<ProjectionEntry[]>(() => {
    if (payload?.projection.status === "computed") {
      return payload.projection.entries;
    }
    return OBSERVABLE_UNIVERSE_CATALOG_SURFACE.entries.map((entry) =>
      computeRawEntry(entry.id, entry.label, entry.position_m),
    );
  }, [payload]);

  const provenance =
    payload?.projection.provenance_class ??
    (mode === "nhm2_accessibility" ? "deferred" : "inferred");
  const contractBadge = payload?.projection.contract_badge ?? "loading";
  const deferredReason =
    payload?.projection.status === "unavailable" ? payload.projection.reason : null;
  const effectiveEpoch =
    payload?.projection.metadata?.targetDistanceBasis?.snapshotEpochMs ??
    OBSERVABLE_UNIVERSE_CATALOG_SURFACE.chart.epochMs;

  const overlayMode =
    payload?.projection.status === "computed"
      ? payload.projection.accordionMode
      : "raw_distance";
  const overlayRadiusFor = React.useCallback(
    (position_m: ObservableUniverseVec3): number => {
      if (overlayMode === "sr_accessibility") return computeSrRadius(position_m);
      return norm(position_m);
    },
    [overlayMode],
  );

  const maxProjectedRadius = React.useMemo(() => {
    const catalogMax = catalogEntries.reduce(
      (max, entry) => Math.max(max, norm(entry.outputPosition_m)),
      0,
    );
    const overlayMax = flowOverlayEntries.reduce(
      (max, entry) => Math.max(max, overlayRadiusFor(entry.position_m)),
      0,
    );
    return Math.max(catalogMax, overlayMax, 1);
  }, [catalogEntries, overlayRadiusFor]);

  const plottedCatalog = React.useMemo(
    () =>
      catalogEntries.map((entry) => {
        return {
          ...entry,
          ...projectToScreen(entry.outputPosition_m, maxProjectedRadius),
        };
      }),
    [catalogEntries, maxProjectedRadius],
  );

  const plottedFlow = React.useMemo(
    () =>
      flowOverlayEntries.map((entry) => {
        const radius_m = overlayRadiusFor(entry.position_m);
        return {
          ...entry,
          ...projectToScreen(scaled(unit(entry.position_m), radius_m), maxProjectedRadius),
        };
      }),
    [maxProjectedRadius, overlayRadiusFor],
  );

  const surfaceSummary = [
    `Containment: Sol -> Milky Way -> Local Group`,
    `Flow atlas: Virgo/Shapley basins and Dipole Repeller stay as DAG context nodes.`,
    `Outer ring: context-only reference shell.`,
  ];

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-sky-200/15 bg-[radial-gradient(circle_at_top,_rgba(78,151,193,0.16),_rgba(8,15,28,0.94)_48%),linear-gradient(135deg,_rgba(6,13,24,1),_rgba(11,20,34,1))] text-slate-100">
      <header className="border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.32em] text-sky-200/75">
              Observable Universe Accordion
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Sol-Fixed Radius Remap
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300/85">
              {modeCopy[mode].blurb} Catalog positions, flow atlas overlays, and the accordion projection stay separate so
              NHM2 remains fail-closed until a certified catalog ETA surface exists.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge label={mode} tone="amber" />
            <Badge label={provenance} tone={provenance === "solve_backed" ? "teal" : provenance === "deferred" ? "rose" : "slate"} />
            <Badge
              label={`${OBSERVABLE_UNIVERSE_CATALOG_SURFACE.chart.frame} ${formatEpoch(effectiveEpoch)}`}
              tone="slate"
            />
            <Badge label={contractBadge} tone={contractBadge === "deferred" ? "rose" : "slate"} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["raw_distance", "sr_accessibility", "nhm2_accessibility"] as const).map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setMode(candidate)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                mode === candidate
                  ? "border-sky-300/60 bg-sky-300/16 text-sky-100"
                  : "border-white/12 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white"
              }`}
            >
              {candidate}
            </button>
          ))}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1.15fr)_320px]">
        <div className="relative min-h-[420px] overflow-hidden">
          <svg
            viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
            className="h-full w-full"
            role="img"
            aria-label="Observable universe accordion map"
          >
            <defs>
              <linearGradient id="accordionGuide" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(162, 230, 255, 0.55)" />
                <stop offset="100%" stopColor="rgba(255, 214, 132, 0.3)" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width={VIEWBOX.width} height={VIEWBOX.height} fill="transparent" />

            {Array.from({ length: 5 }, (_, index) => {
              const radius = ((index + 1) / 5) * PLOT_RADIUS;
              return (
                <circle
                  key={radius}
                  cx={CENTER.x}
                  cy={CENTER.y}
                  r={radius}
                  fill="none"
                  stroke="url(#accordionGuide)"
                  strokeOpacity={index === 4 ? 0.45 : 0.18}
                  strokeDasharray={index === 4 ? "3 6" : "2 8"}
                />
              );
            })}

            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r={PLOT_RADIUS}
              fill="none"
              stroke="rgba(255,214,132,0.45)"
              strokeDasharray="6 8"
            />
            <text
              x={CENTER.x + PLOT_RADIUS - 10}
              y={CENTER.y - PLOT_RADIUS + 18}
              textAnchor="end"
              fill="rgba(255,214,132,0.82)"
              fontSize="11"
            >
              Observable universe boundary (context only)
            </text>

            {plottedFlow.map((entry) => (
              <g key={entry.id}>
                {entry.role === "repeller" ? (
                  <path
                    d={`M ${entry.screenX} ${entry.screenY - 7} L ${entry.screenX + 7} ${entry.screenY} L ${entry.screenX} ${entry.screenY + 7} L ${entry.screenX - 7} ${entry.screenY} Z`}
                    fill="rgba(251,146,60,0.72)"
                    stroke="rgba(255,224,176,0.8)"
                    strokeWidth="1"
                  />
                ) : (
                  <circle
                    cx={entry.screenX}
                    cy={entry.screenY}
                    r={6}
                    fill="rgba(45,212,191,0.72)"
                    stroke="rgba(204,251,241,0.82)"
                    strokeWidth="1"
                  />
                )}
                <text
                  x={entry.screenX + 10}
                  y={entry.screenY - 10}
                  fill="rgba(226,232,240,0.78)"
                  fontSize="11"
                >
                  {entry.label}
                </text>
              </g>
            ))}

            {plottedCatalog.map((entry) => {
              const source = OBSERVABLE_UNIVERSE_CATALOG_SURFACE.entries.find(
                (candidate) => candidate.id === entry.id,
              );
              const isOrigin = source?.role === "origin";
              const fill =
                source?.role === "tutorial_landmark"
                  ? "rgba(255,214,132,0.82)"
                  : "rgba(125,211,252,0.9)";
              const stroke =
                source?.role === "tutorial_landmark"
                  ? "rgba(255,244,214,0.85)"
                  : "rgba(224,242,254,0.92)";
              return (
                <g key={entry.id}>
                  <line
                    x1={CENTER.x}
                    y1={CENTER.y}
                    x2={entry.screenX}
                    y2={entry.screenY}
                    stroke="rgba(148,163,184,0.18)"
                    strokeDasharray={isOrigin ? undefined : "2 6"}
                  />
                  <circle
                    cx={entry.screenX}
                    cy={entry.screenY}
                    r={isOrigin ? 8 : source?.role === "tutorial_landmark" ? 5.5 : 4.5}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="1"
                  />
                  <text
                    x={entry.screenX + 10}
                    y={entry.screenY + (isOrigin ? -12 : -8)}
                    fill="rgba(241,245,249,0.95)"
                    fontSize={isOrigin ? "13" : "11"}
                  >
                    {entry.label}
                  </text>
                </g>
              );
            })}

            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r={10}
              fill="rgba(255,245,200,0.98)"
              stroke="rgba(255,214,132,0.95)"
              strokeWidth="1.2"
            />
          </svg>

          {loading && (
            <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-slate-950/75 px-3 py-1 text-xs text-slate-300">
              Updating projection…
            </div>
          )}

          {mode === "nhm2_accessibility" && payload?.projection.status === "unavailable" && (
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-rose-300/20 bg-rose-500/8 p-4 text-sm text-rose-100">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-200/85">
                Deferred
              </div>
              <p className="mt-2 leading-relaxed" data-testid="accordion-deferred-copy">
                {deferredReason}
              </p>
              <p className="mt-2 text-xs text-rose-100/75">
                The plot stays on the non-promoted catalog geometry until a certified
                <code className="mx-1 rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  warp_catalog_eta_projection/v1
                </code>
                surface exists.
              </p>
            </div>
          )}

          {error && (
            <div className="absolute bottom-4 left-4 rounded-2xl border border-rose-300/20 bg-slate-950/88 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}
        </div>

        <aside className="border-t border-white/10 bg-slate-950/18 px-5 py-4 lg:border-l lg:border-t-0">
          <div className="space-y-5">
            <section>
              <p className="text-[11px] uppercase tracking-[0.28em] text-sky-200/72">Surfaces</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300/85">
                <li>Catalog: {OBSERVABLE_UNIVERSE_CATALOG_SURFACE.surfaceId}</li>
                <li>Flow atlas: {OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE.surfaceId}</li>
                <li>Projection: {contractBadge}</li>
              </ul>
            </section>

            <section>
              <p className="text-[11px] uppercase tracking-[0.28em] text-sky-200/72">Structure</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300/85">
                {surfaceSummary.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </section>

            <section>
              <p className="text-[11px] uppercase tracking-[0.28em] text-sky-200/72">Selected Anchors</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200/92">
                {plottedCatalog
                  .filter((entry) =>
                    ["sol", "alpha-cen-a", "milky-way-core", "andromeda", "virgo-cluster", "shapley"].includes(
                      entry.id,
                    ),
                  )
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-white">{entry.label}</span>
                        <span className="text-xs text-slate-400">
                          {formatDistance(entry.inputDistance_m)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        mapped radius: {formatTime(entry.mappedRadius_s)}
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <section>
              <p className="text-[11px] uppercase tracking-[0.28em] text-sky-200/72">Policy</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300/82">
                <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                  nhm2_accessibility
                </code>{" "}
                never reads <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">warpFieldType</code>,
                shift-lapse lapse data, or time-dilation diagnostics for radius. Only a
                certified catalog ETA projection contract can promote that lane.
              </p>
            </section>
          </div>
        </aside>
      </div>
    </section>
  );
}
