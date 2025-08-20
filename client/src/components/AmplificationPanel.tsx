import * as React from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

const fmtSci = (v: number) =>
  (v >= 1e6 || v < 1e-3) ? v.toExponential(1) : v.toLocaleString();

export default function AmplificationPanel() {
  const { data } = useEnergyPipeline();
  if (!data) return null;

  const gammaGeo = (data as any).gammaGeo ?? 26;
  const qSpoil   = (data as any).qSpoilingFactor ?? 1.0;
  const gammaVdB = (data as any).gammaVanDenBroeck ?? 2.86e5;

  // Display model: A_total = (γ_geo)^3 × q_spoil × γ_VdB
  const A_geo   = Math.pow(gammaGeo, 3);
  const A_total = A_geo * qSpoil * gammaVdB;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/60 p-4 text-slate-100">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Amplification Chain</h3>
        <span className="text-xs opacity-70">live</span>
      </div>

      {/* Equation line */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Tooltip
          label={
            <div className="space-y-1">
              <div className="font-semibold">γ<sub>geo</sub> (geometric amplification)</div>
              <p>
                Comes from the Natário/needle-hull geometry. In your hover mode the
                working value is typically ~26. In 3D cavities the energy scaling is
                cubic in γ<sub>geo</sub>.
              </p>
            </div>
          }
        >
          <span className="px-2 py-0.5 rounded bg-sky-500/15 ring-1 ring-sky-400/30 cursor-help">
            γ<sub>geo</sub> = {fmtSci(gammaGeo)}
          </span>
        </Tooltip>

        <span className="opacity-60">^3 ×</span>

        <Tooltip
          label={
            <div className="space-y-1">
              <div className="font-semibold">q<sub>spoil</sub> (Q-spoiling factor)</div>
              <p>
                Operational quality adjustment for the cavity. Increases or reduces
                effective amplification to reflect realistic losses.
              </p>
            </div>
          }
        >
          <span className="px-2 py-0.5 rounded bg-amber-500/15 ring-1 ring-amber-400/30 cursor-help">
            q<sub>spoil</sub> = {fmtSci(qSpoil)}
          </span>
        </Tooltip>

        <span className="opacity-60">×</span>

        <Tooltip
          label={
            <div className="space-y-1">
              <div className="font-semibold">γ<sub>VdB</sub> (Van den Broeck pocket)</div>
              <p>
                Geometry "pocket" factor from Van den Broeck's modification — allows
                a small interior with a large effective warp radius. Chosen by design,
                not by mode, so it's constant across hover/cruise/etc.
              </p>
            </div>
          }
        >
          <span className="px-2 py-0.5 rounded bg-fuchsia-500/15 ring-1 ring-fuchsia-400/30 cursor-help">
            γ<sub>VdB</sub> = {fmtSci(gammaVdB)}
          </span>
        </Tooltip>

        <span className="opacity-60">=</span>

        <span className="px-2 py-0.5 rounded bg-emerald-500/15 ring-1 ring-emerald-400/30">
          A<sub>total</sub> = {fmtSci(A_total)}
        </span>
      </div>

      {/* Tiny log bars so scale "reads" at a glance */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Bar label="γ_geo^3" value={A_geo} />
        <Bar label="q_spoil" value={qSpoil} />
        <Bar label="γ_VdB" value={gammaVdB} />
      </div>

      <div className="mt-3 text-[11px] opacity-70">
        Display model only: A<sub>total</sub> is the multiplier applied to the
        per-tile Casimir energy in the physics pipeline. Q<sub>cavity</sub> still
        participates separately in ζ (Ford-Roman) and loss terms.
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  // simple log scale 0..1 for rendering
  const v = Math.log10(Math.max(value, 1e-12));
  const norm = Math.min(1, Math.max(0, (v + 12) / 18)); // maps ~1e-12..1e6 into 0..1 nicely
  return (
    <div>
      <div className="mb-1 text-[11px] opacity-80">{label}</div>
      <div className="h-2 rounded bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-400/70 to-emerald-400/70"
          style={{ width: `${norm * 100}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] opacity-70">{fmtSci(value)}</div>
    </div>
  );
}