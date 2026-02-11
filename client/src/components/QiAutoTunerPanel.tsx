import { useCallback, useEffect, useMemo, useRef, useState, type InputHTMLAttributes } from "react";
import { Shield, Activity } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEnergyPipeline, useUpdatePipeline } from "@/hooks/use-energy-pipeline";
import {
  DEFAULT_QI_AUTO_CONSTRAINTS,
  solveQiAutoSetpoint,
  type QiAutoTuneConstraints,
} from "@/lib/qi/qi-auto-tuner";
import { apiRequest } from "@/lib/queryClient";
import type {
  QiControllerSafetyState,
  QiControllerState,
  QiSetpointSuggestion,
} from "@shared/schema";
import { clamp, cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { QiTileGuardBands } from "./QiTileGuardBands";
import { useQiControllerState } from "@/hooks/useQiControllerState";
import { useGrConstraintContract } from "@/hooks/useGrConstraintContract";

const fmt = (value: unknown, digits = 3, fallback = "—") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return numeric.toFixed(digits);
};

const fmtPercent = (value: number) => `${(value * 100).toFixed(1)} %`;

type ContractGuardrailStatus = "ok" | "fail" | "proxy" | "missing";

const contractSummaryClass = (status: ContractGuardrailStatus | null) => {
  if (status === "ok") return "border-emerald-300/50 bg-emerald-500/15 text-emerald-200";
  if (status === "fail") return "border-rose-400/50 bg-rose-500/15 text-rose-200";
  if (status === "proxy") return "border-amber-400/50 bg-amber-500/15 text-amber-200";
  return "border-slate-400/40 bg-slate-500/10 text-slate-200";
};

const controllerBadgeMeta: Record<QiControllerSafetyState, { label: string; className: string }> = {
  OK: {
    label: "Server Guarded",
    className: "border-emerald-300/50 bg-emerald-500/15 text-emerald-200",
  },
  MARGIN_LOW: {
    label: "Server Margin Thin",
    className: "border-amber-400/50 bg-amber-500/15 text-amber-200",
  },
  QI_AT_RISK: {
    label: "Server Mitigating",
    className: "border-rose-500/50 bg-rose-500/15 text-rose-200",
  },
  HARD_STOP: {
    label: "Controller Offline",
    className: "border-slate-600/50 bg-slate-900/70 text-slate-200",
  },
};

const fallbackBadgeMeta = {
  ok: {
    label: "Guarded (legacy)",
    className: "border-emerald-300/50 bg-emerald-500/15 text-emerald-200",
  },
  thin: {
    label: "Thin Margin",
    className: "border-amber-400/50 bg-amber-500/15 text-amber-200",
  },
  violation: {
    label: "QI Violation",
    className: "border-rose-500/50 bg-rose-500/15 text-rose-200",
  },
  idle: {
    label: "No Telemetry",
    className: "border-slate-600/50 bg-slate-900/70 text-slate-200",
  },
} as const;

const constraintField = (
  label: string,
  value: number,
  onChange: (next: number) => void,
  props?: InputHTMLAttributes<HTMLInputElement>,
) => (
  <label className="text-xs text-slate-300 space-y-1" key={label}>
    <span className="block uppercase tracking-wide text-[10px] text-slate-400">{label}</span>
    <Input
      type="number"
      value={Number.isFinite(value) ? String(value) : ""}
      onChange={(event) => {
        const next = Number(event.currentTarget.value);
        if (Number.isFinite(next)) onChange(next);
      }}
      {...props}
    />
  </label>
);

export function QiAutoTunerPanel() {
  const { data } = useEnergyPipeline();
  const contractQuery = useGrConstraintContract({ enabled: true, refetchInterval: 2000 });
  const updateMutation = useUpdatePipeline();
  const queryClient = useQueryClient();

  const [constraints, setConstraints] = useState<QiAutoTuneConstraints>(DEFAULT_QI_AUTO_CONSTRAINTS);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [intentAggressiveness, setIntentAggressiveness] = useState(0.5);
  const [lastIssued, setLastIssued] = useState<number | null>(null);
  const autoTickRef = useRef(0);

  const controllerQuery = useQiControllerState();
  const controllerUnavailable =
    controllerQuery.isError || (controllerQuery.isFetched && !controllerQuery.data);

  const suggestionMutation = useMutation({
    mutationFn: async (payload: QiSetpointSuggestion) => {
      const res = await apiRequest("POST", "/api/qi/setpoint", payload);
      return (await res.json()) as QiControllerState;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(["qi-controller-state"], next);
      setLastIssued(Date.now());
    },
  });

  const controllerState = controllerQuery.data;

  const setpoint = useMemo(
    () => solveQiAutoSetpoint(data, constraints),
    [data, constraints],
  );
  const controllerMetrics = controllerState
    ? {
        marginTarget: controllerState.marginTarget_Jm3 ?? 0.5,
        marginHysteresis: controllerState.marginHysteresis_Jm3 ?? 0.5,
        marginProgress:
          controllerState.marginTarget_Jm3 && controllerState.marginTarget_Jm3 > 0
            ? clamp(controllerState.marginMin_Jm3 / controllerState.marginTarget_Jm3, 0, 1)
            : 0,
        marginModeLabel:
          controllerState.marginMode === "hold"
            ? "Hold (green)"
            : controllerState.marginMode === "increase_margin"
              ? "Increase margin"
              : "Idle",
        paybackAchieved: controllerState.payback?.achieved ?? 0,
        paybackRequired: controllerState.payback?.required ?? 0,
        paybackProgress:
          controllerState.payback && controllerState.payback.required > 0
            ? clamp(controllerState.payback.achieved / controllerState.payback.required, 0, 1)
            : 0,
      }
    : null;
  const dutyCycle = Number(data?.dutyCycle) || setpoint?.currentDuty || 0;
  const qiGuard = data?.qiGuardrail;
  const qiRhoSource = (qiGuard?.rhoSource ?? "unknown").toString();
  const qiMetricDerived = qiGuard?.metricDerived;
  const qiMetricSource = (qiGuard?.metricDerivedSource ?? "unknown").toString();
  const qiRhoMetric =
    qiRhoSource.startsWith("warp.metric") ||
    qiRhoSource.startsWith("gr.rho_constraint") ||
    qiRhoSource.startsWith("gr.metric");
  const qiCurvatureRatio = Number(qiGuard?.curvatureRatio);
  const qiCurvatureRatioDisplay = Number.isFinite(qiCurvatureRatio)
    ? fmt(qiCurvatureRatio, 3, "--")
    : null;
  const qiCurvatureOk = qiGuard?.curvatureOk;
  const qiCurvatureEnforced = qiGuard?.curvatureEnforced === true;
  const qiCurvatureBadgeClass =
    qiCurvatureOk === true
      ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-200"
      : qiCurvatureOk === false
        ? "border-rose-400/50 bg-rose-500/15 text-rose-200"
        : "border-amber-400/50 bg-amber-500/15 text-amber-200";
  const qiRhoBadgeClass = qiRhoMetric
    ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-200"
    : "border-amber-400/50 bg-amber-500/15 text-amber-200";
  const qiMetricBadgeClass =
    qiMetricDerived === true
      ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-200"
      : qiMetricDerived === false
        ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
        : "border-slate-400/40 bg-slate-500/10 text-slate-200";
  const contractGuardrails = contractQuery.data?.guardrails;
  const contractFordRoman = contractGuardrails?.fordRoman ?? null;
  const contractSummary = contractGuardrails
    ? `contract FR=${contractGuardrails.fordRoman} TH=${contractGuardrails.thetaAudit} TS=${contractGuardrails.tsRatio} VdB=${contractGuardrails.vdbBand}`
    : null;
  const contractSource = contractQuery.data?.sources?.grDiagnostics ?? "unknown";
  const contractBadgeClass = contractSummaryClass(contractFordRoman);

  const updateConstraint = useCallback(
    (key: keyof QiAutoTuneConstraints, next: number) => {
      setConstraints((prev) => ({ ...prev, [key]: next }));
    },
    [],
  );

  const resetConstraints = () => setConstraints(DEFAULT_QI_AUTO_CONSTRAINTS);

  const pushLegacySetpoint = useCallback(() => {
    if (!setpoint) return;
    const dutyScale =
      setpoint.currentDuty > 1e-9 ? setpoint.candidateDuty / setpoint.currentDuty : 1;
    const nextDutyCycle = clamp(
      dutyCycle * dutyScale,
      constraints.dutyMin,
      constraints.dutyMax,
    );
    updateMutation.mutate({
      gap_nm: setpoint.candidateGap_nm,
      localBurstFrac: setpoint.candidateDuty,
      dutyCycle: nextDutyCycle,
    });
    setLastIssued(Date.now());
  }, [setpoint, dutyCycle, constraints.dutyMin, constraints.dutyMax, updateMutation]);

  const sendSuggestion = useCallback(
    (intent: QiSetpointSuggestion["intent"], aggressiveness?: number) => {
      if (controllerState) {
        suggestionMutation.mutate({
          intent,
          aggressiveness: aggressiveness ?? intentAggressiveness,
        });
      } else if (intent !== "hold") {
        pushLegacySetpoint();
      }
    },
    [controllerState, suggestionMutation, intentAggressiveness, pushLegacySetpoint],
  );

  useEffect(() => {
    if (!autoEnabled) return;
    const now = Date.now();
    if (now - autoTickRef.current < 1500) return;

    if (controllerState) {
      if (suggestionMutation.isPending) return;
      if (controllerState.safetyState === "QI_AT_RISK") {
        sendSuggestion("increase_margin", 1);
        autoTickRef.current = now;
      } else if (controllerState.safetyState === "MARGIN_LOW") {
        sendSuggestion("increase_margin", 0.7);
        autoTickRef.current = now;
      }
      return;
    }

    if (setpoint?.needsAdjust && !updateMutation.isPending) {
      pushLegacySetpoint();
      autoTickRef.current = now;
    }
  }, [
    autoEnabled,
    controllerState,
    sendSuggestion,
    setpoint?.needsAdjust,
    updateMutation.isPending,
    suggestionMutation.isPending,
    pushLegacySetpoint,
  ]);

  const fallbackStatusKey = (() => {
    if (!setpoint) return "idle" as const;
    if (!Number.isFinite(setpoint.margin) || setpoint.margin < 0) return "violation" as const;
    if (setpoint.margin < setpoint.guardMargin) return "thin" as const;
    return "ok" as const;
  })();
  const badge = controllerState
    ? (() => {
        const base = controllerBadgeMeta[controllerState.safetyState];
        if (controllerState.safetyState === "OK" && controllerState.marginMode === "hold") {
          return { ...base, label: "FR Margin Green" };
        }
        return base;
      })()
    : fallbackBadgeMeta[fallbackStatusKey];

  const suggestionDisabled =
    suggestionMutation.isPending ||
    (!controllerState && (!setpoint || !setpoint.needsAdjust || updateMutation.isPending));

  const lastUpdateAge = controllerState ? Math.round((Date.now() - controllerState.updatedAt) / 1000) : null;

  return (
    <Card className="bg-slate-950/80 border-slate-800 text-slate-100 shadow-xl shadow-black/40">
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-sky-300" />
            Ford–Roman Controller
          </CardTitle>
          <CardDescription>Server authority with local heuristic preview</CardDescription>
        </div>
        <Badge variant="outline" className={cn("text-xs uppercase tracking-wide", badge.className)}>
          {badge.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5 text-sm">
        {qiGuard && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
            <Badge className={`border ${qiRhoBadgeClass}`}>
              {`QI rho source=${qiRhoSource}`}
            </Badge>
            <Badge className={`border ${qiMetricBadgeClass}`}>
              {`metric path=${
                qiMetricDerived === true
                  ? "geometry-derived"
                  : qiMetricDerived === false
                    ? "proxy-only"
                    : "unknown"
              } (${qiMetricSource})`}
            </Badge>
            <Badge className={`border ${qiCurvatureBadgeClass}`}>
              {qiCurvatureOk === true
                ? `curvature window ok${qiCurvatureRatioDisplay ? ` τ/R=${qiCurvatureRatioDisplay}` : ""}`
                : qiCurvatureOk === false
                  ? `curvature window fail${qiCurvatureEnforced ? " (enforced)" : ""}`
                  : "curvature window n/a"}
            </Badge>
            {contractSummary && (
              <Badge className={`border ${contractBadgeClass}`}>
                {`${contractSummary} (${contractSource})`}
              </Badge>
            )}
          </div>
        )}
        {controllerUnavailable && (
          <p className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
            Controller API unreachable; falling back to legacy client heuristics until the server recovers.
          </p>
        )}

        {controllerState ? (
          <>
            <section className="grid gap-3 text-xs text-slate-300 md:grid-cols-3">
              <div className="rounded border border-slate-800/80 bg-slate-950/60 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Safety state</div>
                <div className="text-lg font-semibold text-slate-100">{controllerState.safetyState.replace(/_/g, " ")}</div>
                <div className="text-slate-400">
                  Min {fmt(controllerState.marginMin_Jm3, 4)} / Target {fmt(controllerMetrics?.marginTarget ?? 0, 4)} J/m³
                </div>
                {controllerMetrics && (
                  <div className="mt-2 h-1.5 rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${Math.round(controllerMetrics.marginProgress * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="rounded border border-slate-800/80 bg-slate-950/60 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Optimizer</div>
                <div className="text-lg font-semibold text-slate-100">
                  {fmt(controllerState.optimizer?.achievedEnergy_Jm3 ?? 0, 2)} J/m³
                </div>
                <div className="text-slate-400">
                  Target {fmt(controllerState.optimizer?.targetEnergy_Jm3 ?? 0, 2)} J/m³
                </div>
              </div>
              <div className="rounded border border-slate-800/80 bg-slate-950/60 p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Cadence</div>
                <div className="text-lg font-semibold text-slate-100">
                  {controllerState.cycleTime_ms ? `${fmt(controllerState.cycleTime_ms, 1)} ms` : "—"}
                </div>
                <div className="text-slate-400">
                  Updated {lastUpdateAge != null ? `${lastUpdateAge}s ago` : "just now"}
                </div>
              </div>
            </section>
            {controllerMetrics && (
              <section className="grid gap-3 text-xs text-slate-300 md:grid-cols-3">
                <div className="rounded border border-slate-800/80 bg-slate-950/60 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Green buffer rule</div>
                  <div className="text-lg font-semibold text-slate-100">
                    {fmt(controllerMetrics.marginTarget, 3)} J/m³
                  </div>
                  <div className="text-slate-400">Δm hysteresis {fmt(controllerMetrics.marginHysteresis, 3)} J/m³</div>
                </div>
                <div className="rounded border border-slate-800/80 bg-slate-950/60 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Intent loop</div>
                  <div className="text-lg font-semibold text-slate-100">{controllerMetrics.marginModeLabel}</div>
                  <div className="text-slate-400">
                    Controller auto-switches when margin drops below target − Δm.
                  </div>
                </div>
                <div className="rounded border border-slate-800/80 bg-slate-950/60 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Payback coverage</div>
                  <div className="text-lg font-semibold text-slate-100">
                    {controllerMetrics.paybackAchieved}/{controllerMetrics.paybackRequired || "—"}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-sky-400 transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, Math.round(controllerMetrics.paybackProgress * 100)))}%` }}
                    />
                  </div>
                </div>
              </section>
            )}

            <QiTileGuardBands controllerState={controllerState} limit={10} />
          </>
        ) : (
          <p className="rounded border border-slate-800/80 bg-slate-950/60 p-3 text-xs text-slate-300">
            Server controller telemetry is not available yet. The legacy client-side heuristic below will remain ready as a
            fallback and can still drive the pipeline if needed.
          </p>
        )}

        {setpoint && (
          <section className="rounded border border-slate-800/80 bg-slate-950/70 p-4 text-xs text-slate-200 space-y-3">
            <header className="flex items-center gap-2 text-slate-400">
              <Activity className="h-4 w-4 text-sky-300" />
              Legacy heuristic preview
            </header>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Current gap (nm)</div>
                <div className="text-lg font-semibold text-slate-100">{fmt(setpoint.currentGap_nm, 2)}</div>
                <div className="text-slate-400">Target {fmt(setpoint.candidateGap_nm, 2)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Current duty</div>
                <div className="text-lg font-semibold text-slate-100">{fmt(setpoint.currentDuty, 5)}</div>
                <div className="text-slate-400">Target {fmt(setpoint.candidateDuty, 5)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Predicted avg ρ̄</div>
                <div className="text-lg font-semibold text-slate-100">{fmt(setpoint.predictedAvg, 4)}</div>
                <div className="text-slate-400">Bound {fmt(setpoint.bound, 4)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Margin guard</div>
                <div className="text-lg font-semibold text-slate-100">{fmt(setpoint.guardMargin, 4)}</div>
                <div className="text-slate-400">Predicted {fmt(setpoint.predictedMargin, 4)}</div>
              </div>
            </div>
            {setpoint.saturated && (
              <p className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-amber-200">
                Limits hit before the requested guard band could be restored. Consider widening actuator limits if the
                controller remains constrained.
              </p>
            )}
            <details className="rounded border border-slate-800/80 bg-slate-950/60 p-3" open={!controllerState}>
              <summary className="cursor-pointer text-xs font-semibold text-slate-300">
                Legacy fallback constraint tuning
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {constraintField("Gap min (nm)", constraints.gapMin_nm, (next) =>
                  updateConstraint("gapMin_nm", next),
                )}
                {constraintField("Gap max (nm)", constraints.gapMax_nm, (next) =>
                  updateConstraint("gapMax_nm", next),
                )}
                {constraintField("Duty min", constraints.dutyMin, (next) =>
                  updateConstraint("dutyMin", next),
                  { step: "0.001" },
                )}
                {constraintField("Duty max", constraints.dutyMax, (next) =>
                  updateConstraint("dutyMax", next),
                  { step: "0.01" },
                )}
                {constraintField("Guard band fraction", constraints.marginFrac, (next) =>
                  updateConstraint("marginFrac", next),
                  { step: "0.01" },
                )}
                {constraintField("Max gap step (nm)", constraints.maxGapStep_nm, (next) =>
                  updateConstraint("maxGapStep_nm", next),
                )}
                {constraintField("Max duty step", constraints.maxDutyStep, (next) =>
                  updateConstraint("maxDutyStep", next),
                  { step: "0.001" },
                )}
              </div>
              <Button variant="ghost" size="sm" className="mt-3 text-xs" onClick={resetConstraints}>
                Reset constraints
              </Button>
            </details>
          </section>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoEnabled} onCheckedChange={(checked) => setAutoEnabled(Boolean(checked))} />
            <div className="text-xs leading-tight">
              <div className="font-semibold text-slate-200">Auto-guard</div>
              <div className="text-slate-400">
                {autoEnabled
                  ? controllerState
                    ? "Server suggestions active"
                    : "Legacy fallback control"
                  : "Manual mode"}
              </div>
            </div>
          </div>
          <Separator orientation="vertical" className="hidden h-8 bg-slate-800/70 md:block" />
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-col gap-1 text-xs text-slate-400">
              <Label htmlFor="intentAggression" className="text-slate-300">
                Intent aggressiveness
              </Label>
              <input
                id="intentAggression"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={intentAggressiveness}
                onChange={(event) => setIntentAggressiveness(Number(event.currentTarget.value))}
                className="w-48 accent-sky-400"
              />
              <span className="font-mono text-slate-200">{fmtPercent(intentAggressiveness)}</span>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                onClick={() => sendSuggestion("increase_margin")}
                disabled={suggestionDisabled}
                variant="outline"
              >
                Request margin
              </Button>
              <Button
                onClick={() => sendSuggestion("increase_negative_energy")}
                disabled={suggestionDisabled}
                variant="secondary"
              >
                Push negative energy
              </Button>
              <Button variant="ghost" onClick={() => sendSuggestion("hold", 0)} disabled={!controllerState && !autoEnabled}>
                Hold / clear
              </Button>
            </div>
          </div>
        </div>

        {setpoint && (
          <div className="w-full rounded border border-slate-800/80 bg-slate-950/70 p-3 text-xs text-slate-300">
            <div className="flex flex-wrap items-center gap-3">
              <span>Target margin {fmt(setpoint.guardMargin, 4)} ({fmtPercent(constraints.marginFrac)})</span>
              <span>Δgap {fmt(setpoint.candidateGap_nm - setpoint.currentGap_nm, 3)} nm</span>
              <span>Δduty {fmt(setpoint.candidateDuty - setpoint.currentDuty, 5)}</span>
              <span>
                {lastIssued
                  ? `Last command ${Math.max(0, Math.round((Date.now() - lastIssued) / 1000))}s ago`
                  : "No commands issued"}
              </span>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {setpoint.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default QiAutoTunerPanel;
