import { Card, CardContent } from "@/components/ui/card";
import type { EnergyPipelineState } from "@/hooks/use-energy-pipeline";
import { fmtPowerUnitFromW } from "@/hooks/use-energy-pipeline";
import React from "react";

type Props = {
  pipeline?: EnergyPipelineState | null;
  className?: string;
};

const fmt = (value: unknown, digits = 3) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "n/a";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e4)) return n.toExponential(Math.max(0, digits - 1));
  return n.toFixed(digits).replace(/\.?0+$/, "");
};

const fmtPct = (value: unknown, digits = 2) => {
  const n = Number(value);
  return Number.isFinite(n) ? `${(n * 100).toFixed(digits)}%` : "n/a";
};

function ProofStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded border border-white/5 bg-white/5 px-2 py-1 text-[11px] font-mono text-slate-100">
      <span className="text-slate-300">{label}</span>
      <span className="text-right text-slate-100">{value}</span>
    </div>
  );
}

export default function CardProofOverlay({ pipeline, className }: Props) {
  const powerW = Number.isFinite((pipeline as any)?.P_avg_W)
    ? Number((pipeline as any).P_avg_W)
    : Number.isFinite((pipeline as any)?.P_avg)
      ? Number((pipeline as any).P_avg) * 1e6
      : undefined;
  const dutyEffective = Number.isFinite((pipeline as any)?.dutyEffectiveFR)
    ? Number((pipeline as any).dutyEffectiveFR)
    : Number.isFinite((pipeline as any)?.dutyEffective_FR)
      ? Number((pipeline as any).dutyEffective_FR)
      : undefined;
  const tsRatio = Number.isFinite((pipeline as any)?.TS_ratio) ? Number((pipeline as any).TS_ratio) : undefined;
  const gammaChain = (pipeline as any)?.gammaChain ?? (pipeline as any)?.gamma_chain;
  const gammaParts: string[] = [];
  if (Number.isFinite(gammaChain?.geo_cubed)) gammaParts.push(`geo^3=${fmt(gammaChain.geo_cubed, 2)}`);
  if (Number.isFinite(gammaChain?.qGain)) gammaParts.push(`q=${fmt(gammaChain.qGain, 2)}`);
  if (Number.isFinite(gammaChain?.pocketCompression)) gammaParts.push(`pocket=${fmt(gammaChain.pocketCompression, 2)}`);
  if (Number.isFinite(gammaChain?.dutyEffective)) gammaParts.push(`duty=${fmt(gammaChain.dutyEffective, 3)}`);
  if (Number.isFinite(gammaChain?.qSpoiling)) gammaParts.push(`qSpoil=${fmt(gammaChain.qSpoiling, 2)}`);
  const gammaChainLabel = gammaParts.length ? gammaParts.join(" · ") : "n/a";
  const gammaNote = typeof gammaChain?.note === "string" ? gammaChain.note : "";

  return (
    <Card
      className={`w-full max-w-md rounded-xl border border-cyan-500/40 bg-slate-950/85 shadow-lg shadow-cyan-900/30 backdrop-blur-sm ${className ?? ""}`}
    >
      <CardContent className="space-y-2 p-3 text-slate-100">
        <div className="text-[11px] uppercase tracking-wide text-cyan-300">Math proofs involved</div>
        <div className="text-sm font-semibold text-white">Wireframe + theta sign map</div>
        <p className="text-[12px] leading-snug text-slate-200">
          Expansion scalar theta from extrinsic curvature: negative in front (squeezing) and positive aft (expanding).
        </p>
        <pre className="rounded-md border border-white/10 bg-slate-900/80 p-2 text-[11px] leading-tight text-emerald-100">
float dfdr = d_topHat_dr(rs, u_sigma, u_R);
vec3  dir  = pMetric / rs;
float dfx  = dfdr * dir.x;
float theta_gr = u_beta * dfx; // sign flips front vs aft
        </pre>
        <p className="text-[12px] leading-snug text-slate-200">
          Apply the drive ladder: scale theta_GR with ampChain, duty, and sector gating (theta_drive = theta_GR * (gamma_geo^3 * Q * gamma_VdB) * duty/gate; hull shader multiplies thetaGR by ampChain * gate * gateWF).
        </p>
        <div className="grid gap-1 pt-1">
          <ProofStat label="P_avg" value={powerW ? fmtPowerUnitFromW(powerW) : "n/a"} />
          <ProofStat label="dutyEffective_FR" value={fmtPct(dutyEffective)} />
          <ProofStat label="TS_ratio" value={fmt(tsRatio, 2)} />
          <ProofStat
            label="gammaChain"
            value={
              <span className="flex flex-col items-end text-right">
                <span>{gammaChainLabel}</span>
                {gammaNote ? <span className="text-[10px] text-slate-400">{gammaNote}</span> : null}
              </span>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
