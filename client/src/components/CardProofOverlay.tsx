import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EnergyPipelineState } from "@/hooks/use-energy-pipeline";
import { fmtPowerUnitFromW } from "@/hooks/use-energy-pipeline";
import { useProofPack } from "@/hooks/useProofPack";
import { useMathStageGate } from "@/hooks/useMathStageGate";
import {
  PROOF_PACK_STAGE_REQUIREMENTS,
  getProofValue,
  isStrictProofPack,
  readProofBooleanStrict,
  readProofNumberStrict,
  readProofStringStrict,
} from "@/lib/proof-pack";
import { STAGE_BADGE, STAGE_LABELS } from "@/lib/math-stage-gate";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  pipeline?: EnergyPipelineState | null;
  className?: string;
};

const fmt = (value: unknown, digits = 3) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "n/a";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e4)) {
    return n.toExponential(Math.max(0, digits - 1));
  }
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

const renderProxy = (proxy?: boolean, strict?: boolean) =>
  proxy ? (
    <Badge
      className={cn(
        "ml-2 px-1.5 py-0.5 text-[9px] leading-tight",
        strict ? "bg-rose-900/40 text-rose-200" : "bg-slate-800 text-slate-300",
      )}
    >
      {strict ? "NON-ADMISSIBLE" : "PROXY"}
    </Badge>
  ) : null;

export default function CardProofOverlay({ pipeline, className }: Props) {
  const { data: proofPack } = useProofPack({
    refetchInterval: 5000,
    staleTime: 10000,
  });
  const stageGate = useMathStageGate(PROOF_PACK_STAGE_REQUIREMENTS, {
    staleTime: 30000,
  });
  const stageLabel = stageGate.pending
    ? "STAGE..."
    : STAGE_LABELS[stageGate.stage];
  const stageProxy = !stageGate.ok || !proofPack;
  const strictMode = isStrictProofPack(proofPack);
  const proofNum = (key: string) =>
    readProofNumberStrict(proofPack, key, strictMode);
  const proofStr = (key: string) =>
    readProofStringStrict(proofPack, key, strictMode);
  const proofBool = (key: string) =>
    readProofBooleanStrict(proofPack, key, strictMode);
  const proofProxy = (key: string) =>
    stageProxy || Boolean(getProofValue(proofPack, key)?.proxy);
  const proofProxyFrom = (keys: string[]) =>
    stageProxy || keys.some((key) => Boolean(getProofValue(proofPack, key)?.proxy));
  const allowFallback = !strictMode;

  const powerW =
    proofNum("power_avg_W") ??
    (allowFallback && Number.isFinite((pipeline as any)?.P_avg_W)
      ? Number((pipeline as any).P_avg_W)
      : allowFallback && Number.isFinite((pipeline as any)?.P_avg)
        ? Number((pipeline as any).P_avg) * 1e6
        : undefined);
  const dutyEffective =
    proofNum("duty_effective") ??
    (allowFallback && Number.isFinite((pipeline as any)?.dutyEffectiveFR)
      ? Number((pipeline as any).dutyEffectiveFR)
      : allowFallback && Number.isFinite((pipeline as any)?.dutyEffective_FR)
        ? Number((pipeline as any).dutyEffective_FR)
        : undefined);
  const tsRatio =
    proofNum("ts_ratio") ??
    (allowFallback && Number.isFinite((pipeline as any)?.TS_ratio)
      ? Number((pipeline as any).TS_ratio)
      : undefined);

  const thetaGeom = proofNum("theta_geom");
  const kTraceMean = proofNum("metric_k_trace_mean");
  const kSqMean = proofNum("metric_k_sq_mean");
  const vdbTwoWallSupport = proofBool("vdb_two_wall_support");
  const vdbTwoWallDerivativeSupport = proofBool("vdb_two_wall_derivative_support");
  const vdbTwoWallLabel =
    vdbTwoWallSupport == null && vdbTwoWallDerivativeSupport == null
      ? "n/a"
      : `two_wall=${vdbTwoWallSupport === true ? "yes" : vdbTwoWallSupport === false ? "no" : "n/a"} deriv=${
          vdbTwoWallDerivativeSupport === true
            ? "yes"
            : vdbTwoWallDerivativeSupport === false
              ? "no"
              : "n/a"
        }`;

  const gammaChain = allowFallback
    ? (pipeline as any)?.gammaChain ?? (pipeline as any)?.gamma_chain
    : null;
  const gammaParts: string[] = [];
  const gammaGeoCubed = proofNum("gamma_geo_cubed");
  const qGain = proofNum("q_gain");
  const gammaVdb = proofNum("gamma_vdb");
  const dutyEff = proofNum("duty_effective");
  const qSpoil = proofNum("q_spoil");
  if (Number.isFinite(gammaGeoCubed)) gammaParts.push(`geo^3=${fmt(gammaGeoCubed, 2)}`);
  if (Number.isFinite(qGain)) gammaParts.push(`q=${fmt(qGain, 2)}`);
  if (Number.isFinite(gammaVdb)) gammaParts.push(`pocket=${fmt(gammaVdb, 2)}`);
  if (Number.isFinite(dutyEff)) gammaParts.push(`duty=${fmt(dutyEff, 3)}`);
  if (Number.isFinite(qSpoil)) gammaParts.push(`qSpoil=${fmt(qSpoil, 2)}`);
  if (!gammaParts.length && gammaChain) {
    if (Number.isFinite(gammaChain?.geo_cubed)) gammaParts.push(`geo^3=${fmt(gammaChain.geo_cubed, 2)}`);
    if (Number.isFinite(gammaChain?.qGain)) gammaParts.push(`q=${fmt(gammaChain.qGain, 2)}`);
    if (Number.isFinite(gammaChain?.pocketCompression)) gammaParts.push(`pocket=${fmt(gammaChain.pocketCompression, 2)}`);
    if (Number.isFinite(gammaChain?.dutyEffective)) gammaParts.push(`duty=${fmt(gammaChain.dutyEffective, 3)}`);
    if (Number.isFinite(gammaChain?.qSpoiling)) gammaParts.push(`qSpoil=${fmt(gammaChain.qSpoiling, 2)}`);
  }
  const gammaChainLabel = gammaParts.length ? gammaParts.join(" * ") : "n/a";
  const gammaNote =
    proofStr("gamma_chain_note") ??
    (typeof gammaChain?.note === "string" ? gammaChain.note : "");
  const gammaProxy = proofProxyFrom([
    "gamma_geo_cubed",
    "q_gain",
    "gamma_vdb",
    "duty_effective",
    "q_spoil",
    "gamma_chain_note",
  ]);

  return (
    <Card
      className={`w-full max-w-md rounded-xl border border-cyan-500/40 bg-slate-950/85 shadow-lg shadow-cyan-900/30 backdrop-blur-sm ${className ?? ""}`}
    >
      <CardContent className="space-y-2 p-3 text-slate-100">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-cyan-300">
          <span>Math proofs involved</span>
          <span className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("border px-2 py-0.5 text-[10px]", STAGE_BADGE[stageGate.stage])}
            >
              {stageLabel}
            </Badge>
            {renderProxy(stageProxy, strictMode)}
          </span>
        </div>
        <div className="text-sm font-semibold text-white">Wireframe + theta sign map</div>
        <p className="text-[12px] leading-snug text-slate-200">
          Expansion scalar theta from extrinsic curvature: negative in front (squeezing)
          and positive aft (expanding).
        </p>
        <pre className="rounded-md border border-white/10 bg-slate-900/80 p-2 text-[11px] leading-tight text-emerald-100">
float dfdr = d_topHat_dr(rs, u_sigma, u_R);
vec3  dir  = pMetric / rs;
float dfx  = dfdr * dir.x;
float theta_gr = u_beta * dfx; // sign flips front vs aft
        </pre>
        <p className="text-[12px] leading-snug text-slate-200">
          Apply the drive ladder: scale theta_gr with ampChain, duty, and sector gating
          (theta_drive = theta_gr * (gamma_geo^3 * Q * gamma_vdb) * duty/gate; hull shader
          multiplies theta_gr by ampChain * gate * gateWF).
        </p>
        <div className="grid gap-1 pt-1">
          <ProofStat
            label="P_avg"
            value={
              <span className="flex items-center justify-end">
                {powerW ? fmtPowerUnitFromW(powerW) : "n/a"}
                {renderProxy(proofProxy("power_avg_W"), strictMode)}
              </span>
            }
          />
          <ProofStat
            label="dutyEffective_FR"
            value={
              <span className="flex items-center justify-end">
                {fmtPct(dutyEffective)}
                {renderProxy(proofProxy("duty_effective"), strictMode)}
              </span>
            }
          />
          <ProofStat
            label="TS_ratio"
            value={
              <span className="flex items-center justify-end">
                {fmt(tsRatio, 2)}
                {renderProxy(proofProxy("ts_ratio"), strictMode)}
              </span>
            }
          />
          <ProofStat
            label="gammaChain"
            value={
              <span className="flex flex-col items-end text-right">
                <span>{gammaChainLabel}</span>
                {gammaNote ? <span className="text-[10px] text-slate-400">{gammaNote}</span> : null}
                {renderProxy(gammaProxy, strictMode)}
              </span>
            }
          />
          <ProofStat
            label="theta_geom"
            value={
              <span className="flex items-center justify-end">
                {fmt(thetaGeom, 2)}
                {renderProxy(proofProxy("theta_geom"), strictMode)}
              </span>
            }
          />
          <ProofStat
            label="K_trace_mean"
            value={
              <span className="flex items-center justify-end">
                {fmt(kTraceMean, 2)}
                {renderProxy(proofProxy("metric_k_trace_mean"), strictMode)}
              </span>
            }
          />
          <ProofStat
            label="K_sq_mean"
            value={
              <span className="flex items-center justify-end">
                {fmt(kSqMean, 2)}
                {renderProxy(proofProxy("metric_k_sq_mean"), strictMode)}
              </span>
            }
          />
          <ProofStat
            label="VdB two-wall derivative"
            value={
              <span className="flex items-center justify-end">
                {vdbTwoWallLabel}
                {renderProxy(
                  proofProxyFrom(["vdb_two_wall_support", "vdb_two_wall_derivative_support"]),
                  strictMode,
                )}
              </span>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
