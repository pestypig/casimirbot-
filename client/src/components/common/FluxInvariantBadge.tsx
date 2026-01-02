import React from "react";
import type { StressEnergyBrickStats } from "@/lib/stress-energy-brick";
import { openDocPanel } from "@/lib/docs/openDocPanel";
import { TheoryBadge } from "./TheoryBadge";

const DEFAULT_DOCS_HREF = "/docs/alcubierre-alignment.md#symmetry-boundary-conservation-principle";

type FluxInvariantBadgeProps = {
  /** Stress-energy stats backing the invariant readout */
  stats?: StressEnergyBrickStats | null;
  /** Absolute net-flux magnitude that still counts as "closed" */
  netFluxLimit?: number;
  /** Absolute divergence that still counts as acceptable */
  divergenceLimit?: number;
  /** Optional className passthrough */
  className?: string;
  /** Optional docs href override */
  docsHref?: string;
};

const formatScientific = (value?: number | null) => {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e3 || abs <= 1e-2) {
    return value.toExponential(2);
  }
  return value.toFixed(2);
};

/**
 * Small, reusable badge that surfaces the Symmetry–Boundary Conservation
 * principle by showing flux and divergence stats alongside the theory digest.
 */
export function FluxInvariantBadge({
  stats,
  netFluxLimit,
  divergenceLimit,
  className,
  docsHref = DEFAULT_DOCS_HREF,
}: FluxInvariantBadgeProps) {
  const avgFlux = stats?.avgFluxMagnitude ?? null;
  const netFlux = stats?.netFlux ?? null;
  const netFluxMag =
    stats?.conservation?.netFluxMagnitude ??
    (netFlux ? Math.hypot(netFlux[0], netFlux[1], netFlux[2]) : null);
  const divPeak =
    stats?.conservation?.divMaxAbs ??
    (stats ? Math.max(Math.abs(stats.divMin ?? 0), Math.abs(stats.divMax ?? 0)) : null);

  const dynamicNetLimit = netFluxLimit ?? (avgFlux ? Math.max(avgFlux * 0.02, 1e-6) : 1e-3);
  const dynamicDivLimit = divergenceLimit ?? (avgFlux ? Math.max(avgFlux * 0.05, 1e-6) : 5e-3);

  const netClosed = netFluxMag == null || netFluxMag <= dynamicNetLimit;
  const divClosed = divPeak == null || divPeak <= dynamicDivLimit;

  const status = !netClosed || !divClosed ? "Open boundary detected" : "Closed boundary verified";
  const statusColor = !netClosed || !divClosed ? "text-amber-300" : "text-emerald-300";

  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-slate-200",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400">SBCP</div>
          <div className={`text-sm font-semibold ${statusColor}`}>{status}</div>
          <p className="text-xs text-slate-400">Conservation = symmetry + closed boundary.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TheoryBadge
            refs={["ford-roman-qi-1995", "vanden-broeck-1999"]}
            categoryAnchor="noether"
            docsBaseHref="/docs"
            ariaLabel="Open Noether digests"
          />
          <button
            type="button"
            onClick={() => openDocPanel(docsHref)}
            className="text-[11px] uppercase tracking-wide text-slate-400 underline-offset-2 hover:text-slate-200"
          >
            SBCP notes
          </button>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <dt className="text-slate-400">Avg |S|</dt>
          <dd className="text-base text-slate-100">{formatScientific(avgFlux)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">|∮S·dA|</dt>
          <dd className={`text-base ${netClosed ? "text-slate-100" : "text-amber-300"}`}>
            {formatScientific(netFluxMag)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">max |∇·S|</dt>
          <dd className={`text-base ${divClosed ? "text-slate-100" : "text-amber-300"}`}>
            {formatScientific(divPeak)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
