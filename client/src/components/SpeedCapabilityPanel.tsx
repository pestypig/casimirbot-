import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { C as SPEED_OF_LIGHT } from "@/lib/physics-const";
import { useEnergyPipeline, useUpdatePipeline, MODE_CONFIGS, fmtPowerUnitFromW, type ModeKey } from "@/hooks/use-energy-pipeline";
import { cn } from "@/lib/utils";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

// Mode power fallback (mirrors MODE_POLICY on the server)
const MODE_POWER_TARGET_FALLBACK_W: Record<ModeKey, number> = {
  hover: 83.3e6,
  taxi: 83.3e6,
  nearzero: 5e6,
  cruise: 40e6,
  emergency: 297.5e6,
  standby: 0,
};

// Mirrors AlcubierrePanel.resolveBeta() mode bases
const BETA_POLICY: Record<ModeKey, number> = {
  standby: 0.0,
  taxi: 0.0,
  nearzero: 0.02,
  hover: 0.1,
  cruise: 0.6,
  emergency: 0.95,
};

function fmtBeta(b?: number) {
  return isNum(b) ? b.toFixed(3) : "--";
}

function fmtSpeed(v_mps?: number) {
  if (!isNum(v_mps)) return "--";
  const abs = Math.abs(v_mps);
  const units = [
    { label: "m/s", factor: 1 },
    { label: "km/s", factor: 1e3 },
    { label: "Mm/s", factor: 1e6 },
    { label: "Gm/s", factor: 1e9 },
  ];
  for (const u of units) {
    const scaled = abs / u.factor;
    if (scaled < 1000) {
      const val = v_mps / u.factor;
      return `${val.toFixed(2)} ${u.label}`;
    }
  }
  // If we’re beyond gigameters/sec, show as a fraction of c.
  const fracC = v_mps / SPEED_OF_LIGHT;
  return `${fracC.toFixed(2)} c`;
}

function modePowerTargetW(mode: ModeKey): number {
  const cfg: any = (MODE_CONFIGS as any)?.[mode];
  const cand = Number(cfg?.powerTarget_W ?? cfg?.P_target_W ?? cfg?.powerTargetW);
  return Number.isFinite(cand) ? cand : MODE_POWER_TARGET_FALLBACK_W[mode];
}

function modeLabel(mode: ModeKey): { name: string; color?: string; desc?: string } {
  const cfg: any = (MODE_CONFIGS as any)?.[mode] ?? {};
  return {
    name: String(cfg?.name ?? mode).replace(/^./, (c) => c.toUpperCase()),
    color: typeof cfg?.color === "string" ? cfg.color : undefined,
    desc: typeof cfg?.description === "string" ? cfg.description : undefined,
  };
}

function gammaFromBeta(beta?: number) {
  if (!isNum(beta)) return undefined;
  const b = clamp(beta, 0, 0.999999);
  return 1 / Math.sqrt(1 - b * b);
}

function vCmdFromThrottle(u01: number, vFine: number, vCap: number, uFine = 0.75, gamma = 3.2) {
  const u = clamp01(u01);
  const cap = Math.max(0, vCap);
  if (cap <= 0) return 0;

  const fine = Math.max(1e-6, Math.min(vFine, cap));
  const uf = Math.max(1e-3, Math.min(0.95, uFine));

  if (u <= uf) {
    const x = u / uf;
    return fine * Math.pow(x, gamma);
  }

  const t = (u - uf) / (1 - uf);
  return fine * Math.pow(cap / fine, t);
}

function betaTransFromThrottle(u01: number, betaCap: number, vFine: number, uFine = 0.75, gamma = 3.2) {
  const bCap = clamp(betaCap ?? 0, 0, 0.99);
  const vCap = bCap * SPEED_OF_LIGHT;
  const vCmd = vCmdFromThrottle(u01, vFine, vCap, uFine, gamma);
  return vCap > 0 ? clamp01(vCmd / vCap) : 0;
}

function throttleFromBetaTrans(betaTrans: number, betaCap: number, vFine: number, uFine = 0.75, gamma = 3.2) {
  const bCap = clamp(betaCap ?? 0, 0, 0.99);
  const vCap = bCap * SPEED_OF_LIGHT;
  if (vCap <= 0) return 0;
  const fine = Math.max(1e-6, Math.min(vFine, vCap));
  const uf = Math.max(1e-3, Math.min(0.95, uFine));

  const vTarget = clamp(betaTrans ?? 0, 0, 1) * vCap;
  if (vTarget <= fine) {
    const x = vTarget / fine;
    return uf * Math.pow(Math.max(0, x), 1 / Math.max(1e-3, gamma));
  }

  const span = Math.max(1e-6, vCap / fine);
  if (span <= 1 + 1e-6) return 1;
  const t = Math.log(Math.max(vTarget, fine) / fine) / Math.log(span);
  return clamp01(uf + t * (1 - uf));
}

type EquationRowProps = {
  label: string;
  formula: string;
  value?: string;
  source?: string;
  note?: string;
  accent?: boolean;
};

function EquationRow({ label, formula, value, source, note, accent }: EquationRowProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        accent ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-800 bg-slate-950/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
        {source ? (
          <div className="max-w-[50%] truncate text-right text-[10px] font-mono text-slate-500">{source}</div>
        ) : null}
      </div>
      <div className="mt-1 font-mono text-sm text-slate-100">{formula}</div>
      {value ? <div className="mt-1 text-sm font-semibold text-cyan-200">{value}</div> : null}
      {note ? <div className="mt-1 text-[11px] text-slate-400">{note}</div> : null}
    </div>
  );
}

type SpeedCapabilityPanelProps = {
  refetchInterval?: number;
  panelHash?: string;
  className?: string;
};

export default function SpeedCapabilityPanel({ refetchInterval = 1000, panelHash, className }: SpeedCapabilityPanelProps) {
  const { data: live } = useEnergyPipeline({ refetchInterval });

  const derived = useMemo(() => {
    const mode: ModeKey = (live?.currentMode as ModeKey) || "hover";
    const beta_trans = isNum((live as any)?.beta_trans) ? clamp(Number((live as any).beta_trans), 0, 1) : 1;
    const beta_base = BETA_POLICY[mode] ?? 0.3;

    const P_target_W = isNum((live as any)?.P_target_W) ? Number((live as any).P_target_W) : modePowerTargetW(mode);
    const P_cap_W = isNum((live as any)?.P_cap_W) ? Number((live as any).P_cap_W) : undefined;

    const P_applied_W =
      (isNum((live as any)?.P_applied_W) ? Number((live as any).P_applied_W) : undefined) ??
      (isNum((live as any)?.mechGuard?.pApplied_W) ? Number((live as any).mechGuard.pApplied_W) : undefined) ??
      (isNum((live as any)?.P_avg_W) ? Number((live as any).P_avg_W) : undefined) ??
      (isNum((live as any)?.P_avg) ? Number((live as any).P_avg) * 1e6 : undefined);

    const fill_ratio =
      isNum(P_applied_W) && isNum(P_target_W) && P_target_W > 0 ? clamp(P_applied_W / P_target_W, 0, 1) : undefined;

    const beta_trans_power = isNum((live as any)?.beta_trans_power)
      ? clamp(Number((live as any).beta_trans_power), 0, 1)
      : (fill_ratio ?? 1);

    const beta_policy_server = isNum((live as any)?.beta_policy)
      ? clamp(Number((live as any).beta_policy), 0, 0.99)
      : undefined;
    const beta_policy = beta_policy_server ?? clamp(beta_base * beta_trans_power, 0, 0.99);

    const shipBetaServer = isNum((live as any)?.shipBeta) ? clamp(Number((live as any).shipBeta), 0, 0.99) : undefined;
    const shipBetaRaw = isNum((live as any)?.shipBeta_raw)
      ? clamp(Number((live as any).shipBeta_raw), 0, 0.99)
      : (shipBetaServer ?? beta_policy);
    const shipBetaFallback = clamp(shipBetaRaw * beta_trans, 0, 0.99);
    const shipBeta = shipBetaServer ?? shipBetaFallback;

    const vShip_mps =
      (isNum((live as any)?.vShip_mps) ? Number((live as any).vShip_mps) : undefined) ??
      shipBeta * SPEED_OF_LIGHT;

    const speedClosureRaw = (live as any)?.speedClosure;
    const speedClosure = typeof speedClosureRaw === "string"
      ? speedClosureRaw
      : shipBetaServer
        ? "policyA"
        : "client:fallback";
    const taxi_target_mps = isNum((live as any)?.taxi_target_mps)
      ? Number((live as any).taxi_target_mps)
      : undefined;

    const beta_policy_source = beta_policy_server ? "server:beta_policy" : "client:beta_base*power_fill";
    const shipBetaSource = shipBetaServer ? "server:shipBeta" : "client:shipBeta_raw*beta_trans";

    return {
      mode,
      beta_base,
      beta_trans,
      beta_trans_power,
      beta_policy,
      beta_policy_source,
      shipBetaRaw,
      shipBeta,
      shipBetaSource,
      vShip_mps,
      gamma: gammaFromBeta(shipBeta),
      speedClosure,
      P_target_W,
      P_applied_W,
      P_cap_W,
      fill_ratio,
      taxi_target_mps,
    };
  }, [live]);

  const throttleProfile = useMemo(() => {
    const modeCfg = MODE_CONFIGS[derived.mode] ?? MODE_CONFIGS.hover;
    const betaCap = clamp(derived.shipBetaRaw ?? 0, 0, 0.99);
    const vCap = betaCap * SPEED_OF_LIGHT;

    const taxiTarget = isNum(derived.taxi_target_mps) ? Math.max(derived.taxi_target_mps, 0.1) : 1.4;
    const nearZeroFine = Math.max(0.1, Number((modeCfg as any)?.envCaps?.v_pad ?? 30));
    const defaultFine =
      derived.mode === "taxi"
        ? taxiTarget
        : derived.mode === "nearzero"
          ? nearZeroFine
          : Math.max(0.1, Number((modeCfg as any)?.envCaps?.v_strat ?? 100));

    const vFine = vCap > 0 ? clamp(defaultFine, 0.1, vCap) : defaultFine;

    return {
      betaCap,
      vCap,
      vFine,
      uFine: 0.75,
      gamma: 3.2,
    };
  }, [derived.mode, derived.shipBetaRaw, derived.taxi_target_mps]);

  const updatePipeline = useUpdatePipeline();
  const [throttle, setThrottle] = useState<number>(() =>
    throttleFromBetaTrans(derived.beta_trans, throttleProfile.betaCap, throttleProfile.vFine, throttleProfile.uFine, throttleProfile.gamma)
  );
  const [betaTransCmd, setBetaTransCmd] = useState<number>(() => derived.beta_trans);
  const [targetSpeedInput, setTargetSpeedInput] = useState("");
  const betaUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const betaFromThrottle = useCallback(
    (u: number) => betaTransFromThrottle(u, throttleProfile.betaCap, throttleProfile.vFine, throttleProfile.uFine, throttleProfile.gamma),
    [throttleProfile]
  );

  const throttleFromBeta = useCallback(
    (beta: number) => throttleFromBetaTrans(beta, throttleProfile.betaCap, throttleProfile.vFine, throttleProfile.uFine, throttleProfile.gamma),
    [throttleProfile]
  );

  useEffect(() => {
    const liveBeta = derived.beta_trans;
    if (!Number.isFinite(liveBeta)) return;
    setBetaTransCmd((prev) => (Math.abs(prev - liveBeta) > 1e-3 ? liveBeta : prev));
    const targetThrottle = throttleFromBeta(liveBeta);
    setThrottle((prev) => (Math.abs(prev - targetThrottle) > 1e-3 ? targetThrottle : prev));
  }, [derived.beta_trans, throttleFromBeta]);

  useEffect(() => {
    return () => {
      if (betaUpdateTimer.current) {
        clearTimeout(betaUpdateTimer.current);
      }
    };
  }, []);

  const pushBetaTrans = useCallback((value: number) => {
    const clamped = clamp(value ?? 0, 0, 1);
    setBetaTransCmd(clamped);
    if (betaUpdateTimer.current) {
      clearTimeout(betaUpdateTimer.current);
    }
    betaUpdateTimer.current = setTimeout(() => {
      updatePipeline.mutate({ beta_trans: clamped });
    }, 120);
  }, [updatePipeline]);

  const applyThrottle = useCallback((u: number) => {
    const clamped = clamp01(u ?? 0);
    setThrottle(clamped);
    const betaCmd = betaFromThrottle(clamped);
    pushBetaTrans(betaCmd);
  }, [betaFromThrottle, pushBetaTrans]);

  const handleBetaSliderChange = useCallback((values: number[]) => {
    applyThrottle(values?.[0] ?? 0);
  }, [applyThrottle]);

  const handleTargetSpeedApply = useCallback(() => {
    const v_kmps = parseFloat(targetSpeedInput);
    if (!Number.isFinite(v_kmps)) return;
    const vTarget_mps = v_kmps * 1000;
    const vCap = throttleProfile.vCap;
    const betaCmd = vCap > 0 ? clamp01(vTarget_mps / vCap) : 0;
    const nextThrottle = throttleFromBeta(betaCmd);
    setThrottle(nextThrottle);
    pushBetaTrans(betaCmd);
  }, [pushBetaTrans, targetSpeedInput, throttleFromBeta, throttleProfile.vCap]);

  const modes: ModeKey[] = ["standby", "taxi", "nearzero", "hover", "cruise", "emergency"];
  const policyBetaCap = throttleProfile.betaCap;
  const policySpeedCap_mps = throttleProfile.vCap;
  const predictedPolicySpeed_mps = throttleProfile.betaCap * betaTransCmd * SPEED_OF_LIGHT;
  const vPlaceholder = isNum(derived.vShip_mps) ? (derived.vShip_mps / 1000).toFixed(2) : "";
  const fineZonePct = Math.round(throttleProfile.uFine * 100);
  const fineSpeedEffective = Math.max(1e-6, Math.min(throttleProfile.vFine, throttleProfile.vCap));
  const fineZoneSpeedLabel = fmtSpeed(fineSpeedEffective);

  const capSummary = useMemo(() => {
    const maxBeta = Math.max(...modes.map((m) => BETA_POLICY[m] ?? 0));
    const maxV = maxBeta * SPEED_OF_LIGHT;
    return { maxBeta, maxV };
  }, [modes]);

  const fillPct = isNum(derived.fill_ratio) ? `${(derived.fill_ratio * 100).toFixed(1)}%` : "--";

  return (
    <Card
      id={panelHash}
      data-panel-hash={panelHash}
      className={cn("border-slate-800 bg-slate-900/40", className)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          Speed Capability
          <TooltipProvider delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help text-slate-400 hover:text-cyan-300" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm">
                <div className="text-sm font-medium text-cyan-200 mb-1">What this panel is doing</div>
                <p className="text-xs text-slate-200/90">
                  In this codebase, translation speed is represented as beta = v/c (shift/translation proxy). The ship frame
                  stays comoving; the displayed v is the outside/rest-frame coordinate translation derived from beta.
                </p>
                <div className="mt-2 text-xs text-slate-300/90">
                  Chain: shipBeta_raw = proxy? beta_proxy : beta_policy(mode) * beta_trans_power; shipBeta = shipBeta_raw * beta_trans; v = shipBeta * c.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Live mode -&gt; power -&gt; beta closure + per-mode policy ceilings (envelope up to beta~{capSummary.maxBeta.toFixed(2)}).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
            <div className="text-xs uppercase tracking-wide text-slate-400">Live Mode</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-base font-semibold">
                {modeLabel(derived.mode).name}
              </div>
              <Badge className="bg-emerald-600/20 text-emerald-200">LIVE</Badge>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              closure: <span className="font-mono text-slate-200">{derived.speedClosure}</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
            <div className="text-xs uppercase tracking-wide text-slate-400">Power</div>
            <div className="mt-1 grid grid-cols-1 gap-x-3 gap-y-1 text-sm sm:grid-cols-2">
              <div className="text-slate-400">P_target</div>
              <div className="font-mono">{fmtPowerUnitFromW(derived.P_target_W)}</div>

              <div className="text-slate-400">P_applied</div>
              <div className="font-mono">{fmtPowerUnitFromW(derived.P_applied_W)}</div>

              <div className="text-slate-400">fill</div>
              <div className="font-mono">
                {isNum(derived.fill_ratio) ? `${(derived.fill_ratio * 100).toFixed(1)}%` : "--"}
              </div>

              <div className="text-slate-400">P_cap</div>
              <div className="font-mono">{fmtPowerUnitFromW(derived.P_cap_W)}</div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
            <div className="text-xs uppercase tracking-wide text-slate-400">beta -&gt; v (outside frame)</div>
            <div className="mt-1 grid grid-cols-1 gap-x-3 gap-y-1 text-sm sm:grid-cols-2">
              <div className="text-slate-400">beta_base(mode)</div>
              <div className="font-mono">{fmtBeta(derived.beta_base)}</div>

              <div className="text-slate-400">beta_trans_power</div>
              <div className="font-mono">{fmtBeta(derived.beta_trans_power)}</div>

              <div className="text-slate-400">beta_policy</div>
              <div className="font-mono">{fmtBeta(derived.beta_policy)}</div>

              <div className="text-slate-400">beta_ship_raw</div>
              <div className="font-mono">{fmtBeta(derived.shipBetaRaw)}</div>

              <div className="text-slate-400">beta_trans</div>
              <div className="font-mono">{fmtBeta(derived.beta_trans)}</div>

              <div className="text-slate-400">beta_ship</div>
              <div className="font-mono text-cyan-200">{fmtBeta(derived.shipBeta)}</div>

              <div className="text-slate-400">v</div>
              <div className="font-mono text-cyan-200">{fmtSpeed(derived.vShip_mps)}</div>

              <div className="text-slate-400">gamma</div>
              <div className="font-mono">{isNum(derived.gamma) ? derived.gamma.toFixed(3) : "--"}</div>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Ship frame: v_local ~ 0 (comoving). beta_policy already carries the mode cap x power fill; beta_trans is the UI knob if the server has not sent shipBeta.
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Segmented translation throttle (β_trans)</div>
              <div className="text-[11px] text-slate-400">
                Slider works in speed space: precision ramp then geometric climb to the live envelope, mapped back to β_trans.
              </div>
            </div>
            <Badge className="bg-sky-500/20 text-sky-100">CONTROL</Badge>
          </div>
          <Slider
            value={[throttle]}
            min={0}
            max={1}
            step={0.001}
            onValueChange={handleBetaSliderChange}
            aria-label="Speed-first translation throttle"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>
              throttle u <span className="font-mono text-slate-200">{throttle.toFixed(2)}</span>
            </span>
            <span>
              β_trans cmd <span className="font-mono text-slate-200">{betaTransCmd.toFixed(2)}</span>
            </span>
            <span>
              precision {fineZonePct}% → <span className="font-mono text-slate-200">{fineZoneSpeedLabel}</span>
            </span>
            <span>
              cap <span className="font-mono text-slate-200">β_raw={fmtBeta(policyBetaCap)}</span>{" "}
              (<span className="font-mono text-slate-200">{fmtSpeed(policySpeedCap_mps)}</span>)
            </span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1.1fr_minmax(0,1fr)]">
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Target speed (km/s)</div>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  inputMode="decimal"
                  value={targetSpeedInput}
                  placeholder={vPlaceholder || "e.g. 0.10"}
                  onChange={(e) => setTargetSpeedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTargetSpeedApply();
                  }}
                  className="bg-slate-950"
                />
                <Button size="sm" onClick={handleTargetSpeedApply}>
                  Set β_trans
                </Button>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Uses live β_raw cap -&gt; segmented throttle (fine + log ramp) -&gt; β_trans command.
              </div>
            </div>
            <div className="rounded border border-slate-800/70 bg-slate-900/50 p-2 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span>Live ship β</span>
                <span className="font-mono text-cyan-200">{fmtBeta(derived.shipBeta)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Policy-path v (β_raw * β_trans)</span>
                <span className="font-mono text-slate-200">{fmtSpeed(predictedPolicySpeed_mps)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Closure</span>
                <span className="font-mono text-slate-200">{derived.speedClosure}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Live equation chain (no kinetic-energy detour)</div>
              <div className="text-[11px] text-slate-400">
                Power -&gt; beta (warp shift amplitude) -&gt; v = beta * c (outside/rest frame proxy).
              </div>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-100">LIVE</Badge>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <EquationRow
              label="Mode budgets"
              formula="mode => (P_target_W, P_cap_W)"
              value={`target=${fmtPowerUnitFromW(derived.P_target_W)} cap=${fmtPowerUnitFromW(derived.P_cap_W)}`}
              source="server/energy-pipeline.ts: MODE_POLICY"
            />
            <EquationRow
              label="Casimir applied power"
              formula="P_applied = perTilePower(q_mech) * N_tiles * d_eff"
              value={`P_applied=${fmtPowerUnitFromW(derived.P_applied_W)}`}
              source="server/energy-pipeline.ts: perTilePower / P_total_W"
              note="This is exactly what the panel shows as P_applied."
            />
            <EquationRow
              label="Power fill clamp"
              formula="beta_trans_power = clamp01(P_applied / P_target)"
              value={`fill=${fillPct} -> beta_trans_power=${fmtBeta(derived.beta_trans_power)}`}
              source="server/energy-pipeline.ts: clamp01(P_total_W / P_target_W)"
            />
            <EquationRow
              label="Mode ceiling"
              formula="beta_policy = clampBeta(beta_base(mode) * beta_trans_power)"
              value={`beta_base=${fmtBeta(derived.beta_base)} -> beta_policy=${fmtBeta(derived.beta_policy)}`}
              source="server/energy-pipeline.ts: beta_policy"
              note={derived.beta_policy_source}
            />
            <EquationRow
              label="Ship beta closure"
              formula="shipBeta = clampBeta(shipBeta_raw * beta_trans); shipBeta_raw = proxy? beta_proxy : beta_policy"
              value={`raw=${fmtBeta(derived.shipBetaRaw)} shipBeta=${fmtBeta(derived.shipBeta)} (closure=${derived.speedClosure})`}
              source="server/energy-pipeline.ts: speedClosure"
              note={`source=${derived.shipBetaSource}`}
              accent
            />
            <EquationRow
              label="Rest-frame proxy speed"
              formula="v = shipBeta * c; gamma = 1/sqrt(1 - beta^2)"
              value={`v=${fmtSpeed(derived.vShip_mps)} gamma=${isNum(derived.gamma) ? derived.gamma.toFixed(3) : "--"}`}
              source="server/energy-pipeline.ts: vShip_mps"
              note="Ship frame stays comoving; this v is the outside/rest-frame proxy."
              accent
            />
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            Beta is the warp shift amplitude used by the Natario/Alcubierre renderer (sets shell curvature/shift magnitude), so the same beta driving v/c also scales the GR proxy fields.
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-slate-400">Capability Envelope (by mode)</div>
            <div className="text-xs text-slate-400">
              global max: <span className="font-mono text-slate-200">beta={capSummary.maxBeta.toFixed(2)}</span>{" "}
              (<span className="font-mono text-slate-200">{fmtSpeed(capSummary.maxV)}</span>)
            </div>
          </div>

          <div className="space-y-2">
            {modes.map((m) => {
              const isCurrent = m === derived.mode;
              const { name, color, desc } = modeLabel(m);

              const betaCap = clamp(BETA_POLICY[m] ?? 0, 0, 0.99);
              const betaCmd = clamp(betaCap * derived.beta_trans, 0, 0.99);
              const vCap = betaCap * SPEED_OF_LIGHT;

              const Pm = modePowerTargetW(m);

              const markerBeta = isCurrent ? derived.shipBeta : undefined;
              const markerLeftPct = isNum(markerBeta) ? clamp(markerBeta, 0, 0.99) * 100 : 0;

              return (
                <div
                  key={m}
                  className={`rounded-lg p-3 border ${
                    isCurrent ? "border-cyan-500/40 bg-slate-900/70" : "border-slate-800 bg-slate-900/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${color ?? "text-slate-200"}`}>{name}</span>
                        {isCurrent && <Badge className="bg-cyan-500/20 text-cyan-200">CURRENT</Badge>}
                      </div>
                      {desc && <div className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{desc}</div>}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-[11px] text-slate-400">P_target</div>
                      <div className="font-mono text-xs text-slate-200">{fmtPowerUnitFromW(Pm)}</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                      <div
                        className="absolute inset-y-0 left-0 bg-slate-300/20"
                        style={{ width: `${betaCap * 100}%` }}
                        title={`beta_cap=${betaCap.toFixed(3)}`}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-sky-500/60"
                        style={{ width: `${betaCmd * 100}%` }}
                        title={`beta_cmd=${betaCmd.toFixed(3)} (using current beta_trans)`}
                      />
                      {isCurrent && isNum(markerBeta) && (
                        <div
                          className="absolute -top-1 h-4 w-[2px] bg-amber-300 shadow-[0_0_0_2px] shadow-amber-300/20"
                          style={{ left: `calc(${markerLeftPct}% - 1px)` }}
                          title={`beta_now=${markerBeta.toFixed(3)}`}
                        />
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-400">
                      <span>
                        cap: <span className="font-mono text-slate-200">beta={betaCap.toFixed(2)}</span>{" "}
                        (<span className="font-mono text-slate-200">{fmtSpeed(vCap)}</span>)
                      </span>
                      <span>
                        cmd: <span className="font-mono text-slate-200">beta={betaCmd.toFixed(2)}</span>
                      </span>
                      <span>
                        now:{" "}
                        <span className={`font-mono ${isCurrent ? "text-amber-200" : "text-slate-500"}`}>
                          {isCurrent ? `beta=${fmtBeta(markerBeta)}` : "--"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[11px] text-slate-400">
            Interpretation: beta_policy is the mode ceiling (with power fill), beta_trans is the post-closure translation knob, and beta_trans_power is the
            power-fill clamp (about P_applied / P_target when not provided by the server).
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
