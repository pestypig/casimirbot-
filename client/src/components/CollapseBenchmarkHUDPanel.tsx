import React from "react";
import CollapseBenchmarkHUD from "./CollapseBenchmarkHUD";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

/**
 * Desktop-friendly wrapper for the Collapse Benchmark HUD.
 * Registers as a Helix panel so it shows up in Helix Start (/desktop) instead of only inline overlays.
 */
export default function CollapseBenchmarkHUDPanel() {
  const { data: pipeline, isFetching, refetch } = useEnergyPipeline({
    refetchInterval: 2500,
  });

  return (
    <div className="h-full w-full overflow-auto bg-slate-950/80 p-4 text-slate-100">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-cyan-300">Collapse Benchmark</div>
          <div className="text-sm text-slate-300">Relativity-safe collapse diagnostics (tau, L_present, kappa) bound to the live lattice.</div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="w-full rounded-md border border-cyan-500/40 px-2 py-1 text-[11px] font-semibold text-cyan-200 transition hover:border-cyan-400 hover:text-cyan-100 sm:w-auto"
        >
          {isFetching ? "Refreshingƒ?İ" : "Refresh"}
        </button>
      </div>
      <CollapseBenchmarkHUD pipeline={pipeline ?? null} className="w-full max-w-full sm:max-w-xl" />
    </div>
  );
}
