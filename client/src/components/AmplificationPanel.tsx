import * as React from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

const fmtSci = (v: number) =>
  (Math.abs(v) >= 1e6 || (Math.abs(v) > 0 && Math.abs(v) < 1e-3))
    ? v.toExponential(2)
    : v.toLocaleString();

/** Small bar with log or linear scaling */
function Bar({
  label,
  value,
  mode = "log",
  min = 1e-12,
  max = 1e6,
}: {
  label: string;
  value: number;
  mode?: "log" | "linear";
  min?: number;
  max?: number;
}) {
  let pct = 0;
  if (mode === "log") {
    const v = Math.log10(Math.max(value, 1e-12));
    const lo = Math.log10(Math.max(min, 1e-12));
    const hi = Math.log10(Math.max(max, min * 10));
    pct = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
  } else {
    const v = Math.max(min, Math.min(max, value));
    pct = (v - min) / (max - min);
  }

  return (
    <div>
      <div className="mb-1 text-[11px] opacity-80">{label}</div>
      <div className="h-2 rounded bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-400/70 to-emerald-400/70"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-1 text-[11px] opacity-70">{fmtSci(value)}</div>
    </div>
  );
}

export default function AmplificationPanel() {
  const { data } = useEnergyPipeline();
  if (!data) return null;

  // ---- normalize pipeline fields (single source of truth) ----
  const gammaGeo =
    (data as any).gammaGeo ??
    (data as any).gamma_geometry ??
    26;

  const qSpoil =
    (data as any).qSpoilingFactor ??
    (data as any).deltaAOverA ??
    1.0;

  const gammaVdB =
    (data as any).gammaVdB ??
    (data as any).gammaVanDenBroeck ??
    2.86e5;

  const duty =
    (data as any).dutyCycle ??
    0.14;

  const sectors = Math.max(
    1,
    (data as any).sectorCount ??
      (data as any).sectorStrobing ??
      (data as any).sectors ??
      1
  );

  const viewAvg =
    (data as any).viewAvg ??
    true;

  // ---- chain terms ----
  const A_geo = Math.pow(Math.max(1, Number(gammaGeo) || 1), 3);
  const A_total = A_geo * Math.max(1e-12, Number(qSpoil) || 1e-12) * Math.max(1, Number(gammaVdB) || 1);

  // effective duty factor used in the renderer (averaged if viewAvg=true)
  const effDuty = viewAvg ? Math.max(1e-12, (Number(duty) || 0) / sectors) : 1.0;
  const dutyTerm = Math.sqrt(effDuty);

  // final θ-scale used by the grid shader / CPU geometry
  const thetaScale = A_total * dutyTerm;

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
              <div className="font-semibold">
                γ<sub>geo</sub> (geometric amplification)
              </div>
              <p>
                From needle-hull/Natário geometry. Energy scaling is cubic in γ<sub>geo</sub>.
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
              <div className="font-semibold">q<sub>spoil</sub> (Q-spoiling / ΔA/A)</div>
              <p>Operational quality adjustment; accounts for realistic losses.</p>
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
              <p>Geometry pocket factor; design choice, mode-independent.</p>
            </div>
          }
        >
          <span className="px-2 py-0.5 rounded bg-fuchsia-500/15 ring-1 ring-fuchsia-400/30 cursor-help">
            γ<sub>VdB</sub> = {fmtSci(gammaVdB)}
          </span>
        </Tooltip>

        <span className="opacity-60">×</span>

        <Tooltip
          label={
            <div className="space-y-1">
              <div className="font-semibold">
                √(duty/sectors) (strobing average)
              </div>
              <p>
                Averaging factor when view-averaging is enabled. With {sectors} sector
                {sectors > 1 ? "s" : ""} at duty {fmtSci(duty)}, effective term is{" "}
                {fmtSci(dutyTerm)}.
              </p>
            </div>
          }
        >
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 ring-1 ring-emerald-400/30 cursor-help">
            √(duty/sectors) = {fmtSci(dutyTerm)}
          </span>
        </Tooltip>

        <span className="opacity-60">=</span>

        <span className="px-2 py-0.5 rounded bg-emerald-500/20 ring-1 ring-emerald-400/30">
          θ-scale = {fmtSci(thetaScale)}
        </span>
      </div>

      {/* Tiny bars */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <Bar label="γ_geo^3" value={A_geo} mode="log" min={1e-6} max={1e9} />
        <Bar label="q_spoil" value={qSpoil} mode="log" min={1e-6} max={1e3} />
        <Bar label="γ_VdB" value={gammaVdB} mode="log" min={1} max={1e7} />
        <Bar label="√(duty/sectors)" value={dutyTerm} mode="linear" min={0} max={1} />
      </div>

      <div className="mt-3 text-[11px] opacity-70">
        Display model only. θ-scale is the multiplier forwarded by the pipeline to the
        renderers (<code>u_thetaScale</code> / <code>thetaScale</code>).{" "}
        Q<sub>cavity</sub> appears separately in ζ (Ford-Roman) and loss terms.
      </div>
    </div>
  );
}