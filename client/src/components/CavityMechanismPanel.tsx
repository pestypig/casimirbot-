'use client';

import * as React from 'react';
import { Waves, Activity, Radio } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEnergyPipeline } from '@/hooks/use-energy-pipeline';
import type { VacuumGapSweepRow } from '@shared/schema';
import { cn } from '@/lib/utils';
import { getSweepGuardReasons } from '@/lib/sweep-guards';

const FALLBACK = '-';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatNumber(value?: number | null, digits = 2, suffix = ''): string {
  if (!isFiniteNumber(value)) return FALLBACK;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: digits })}${suffix}`;
}

function formatSci(value?: number | null, digits = 2, suffix = ''): string {
  if (!isFiniteNumber(value)) return FALLBACK;
  return `${value.toExponential(digits)}${suffix}`;
}

function formatPercent(value?: number | null, digits = 2): string {
  if (!isFiniteNumber(value)) return FALLBACK;
  return `${(value * 100).toFixed(digits)}%`;
}

function formatDegrees(value?: number | null, digits = 2): string {
  if (!isFiniteNumber(value)) return FALLBACK;
  return `${value.toFixed(digits)}°`;
}

function formatMHz(value?: number | null, digits = 3): string {
  if (!isFiniteNumber(value)) return FALLBACK;
  return `${value.toFixed(digits)} MHz`;
}

function formatTauUnitsFirst(ms?: number | null): string {
  if (!isFiniteNumber(ms)) return FALLBACK;
  if (ms < 1) {
    const us = ms * 1000;
    return `${us.toFixed(3)} µs`;
  }
  return `${ms.toFixed(3)} ms`;
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

function Gauge({
  label,
  value,
  min = 0,
  max = 1,
  format = (v: number) => v.toFixed(2),
  dangerThreshold,
}: {
  label: string;
  value?: number | null;
  min?: number;
  max?: number;
  format?: (value: number) => string;
  dangerThreshold?: number;
}) {
  const pct = React.useMemo(() => {
    if (!isFiniteNumber(value)) return 0;
    if (max === min) return 0;
    const clamped = Math.max(min, Math.min(max, value));
    return (clamped - min) / (max - min);
  }, [value, min, max]);

  const labelValue = isFiniteNumber(value) ? format(value) : FALLBACK;
  const isDanger = isFiniteNumber(dangerThreshold) && isFiniteNumber(value) && value >= dangerThreshold;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span className={cn('font-medium text-slate-200', isDanger && 'text-amber-300')}>{labelValue}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-white/5">
        <div
          className={cn(
            'h-full bg-gradient-to-r from-sky-500/70 via-cyan-400/70 to-emerald-400/80 transition-[width]',
            isDanger && 'from-amber-500/80 via-orange-500/80 to-red-500/80',
          )}
          style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%` }}
        />
      </div>
    </div>
  );
}

function deriveLatestSweep(
  sweepResults: VacuumGapSweepRow[],
  sweepState: any,
): VacuumGapSweepRow | null {
  if (sweepState?.last) {
    const last = sweepState.last as VacuumGapSweepRow;
    if (last && typeof last.d_nm === 'number') {
      return last;
    }
  }
  if (sweepResults.length > 0) {
    return sweepResults[sweepResults.length - 1];
  }
  return null;
}

function collectInstabilityReasons(row: VacuumGapSweepRow | null | undefined): string[] {
  return getSweepGuardReasons(row);
}

function describeSweepInstability(row: VacuumGapSweepRow | null | undefined): string | null {
  if (!row || row.status !== 'UNSTABLE') {
    return null;
  }

  if (Array.isArray(row.notes) && row.notes.length) {
    return row.notes.join('; ');
  }

  const reasons = collectInstabilityReasons(row);

  if (!reasons.length) {
    return 'Sweep guard flagged instability';
  }

  return reasons.join('; ');
}

function evaluateSweepBadge(
  row: VacuumGapSweepRow | null | undefined,
): { status?: VacuumGapSweepRow['status']; reason: string | null } {
  if (!row) {
    return { status: undefined, reason: null };
  }

  const guardReasons = collectInstabilityReasons(row);
  if (guardReasons.length) {
    return { status: 'UNSTABLE', reason: guardReasons.join('; ') };
  }

  const status: VacuumGapSweepRow['status'] | undefined =
    row.status ?? (row.stable === true ? 'PASS' : row.stable === false ? 'WARN' : undefined);

  if (status === 'UNSTABLE') {
    return { status, reason: describeSweepInstability(row) };
  }

  const reason =
    status === 'WARN' && Array.isArray(row.notes) && row.notes.length
      ? row.notes.join('; ')
      : null;

  return { status, reason };
}

export function CavityMechanismPanel({ className }: { className?: string }) {
  const { data: pipeline, sweepResults } = useEnergyPipeline({ refetchInterval: 1000 });

  if (!pipeline && (!sweepResults || sweepResults.length === 0)) {
    return null;
  }

  const isMock =
    Boolean((pipeline as any)?.__mockData) ||
    Boolean((pipeline as any)?.mock) ||
    Boolean((pipeline as any)?.mocked);

  const tileArea_cm2 = isFiniteNumber(pipeline?.tileArea_cm2)
    ? (pipeline!.tileArea_cm2 as number)
    : isFiniteNumber((pipeline as any)?.tiles?.tileArea_cm2)
    ? ((pipeline as any).tiles.tileArea_cm2 as number)
    : undefined;
  const tileArea_m2 = isFiniteNumber(tileArea_cm2) ? tileArea_cm2 * 1e-4 : undefined;
  const gap_nm = isFiniteNumber(pipeline?.gap_nm) ? (pipeline!.gap_nm as number) : undefined;
  const gap_m = isFiniteNumber(gap_nm) ? gap_nm! * 1e-9 : undefined;
  const tileVolume_m3 = isFiniteNumber(tileArea_m2) && isFiniteNumber(gap_m) ? tileArea_m2! * gap_m! : undefined;
  const tileCount = isFiniteNumber(pipeline?.N_tiles) ? (pipeline!.N_tiles as number) : undefined;

  const gammaGeo = isFiniteNumber(pipeline?.gammaGeo) ? (pipeline!.gammaGeo as number) : undefined;
  const gammaVdB = isFiniteNumber((pipeline as any)?.gammaVanDenBroeck)
    ? ((pipeline as any).gammaVanDenBroeck as number)
    : isFiniteNumber((pipeline as any)?.gammaVdB)
    ? ((pipeline as any).gammaVdB as number)
    : undefined;
  const qSpoil = isFiniteNumber(pipeline?.qSpoilingFactor)
    ? (pipeline!.qSpoilingFactor as number)
    : isFiniteNumber((pipeline as any)?.deltaAOverA)
    ? ((pipeline as any).deltaAOverA as number)
    : undefined;

  const staticEnergy_J = isFiniteNumber(pipeline?.U_static) ? (pipeline!.U_static as number) : undefined;
  const staticEnergyNominal_J = isFiniteNumber((pipeline as any)?.U_static_nominal)
    ? ((pipeline as any).U_static_nominal as number)
    : staticEnergy_J;
  const staticEnergyRealistic_J = isFiniteNumber((pipeline as any)?.U_static_realistic)
    ? ((pipeline as any).U_static_realistic as number)
    : staticEnergy_J;
  const staticEnergyUncoupled_J = isFiniteNumber((pipeline as any)?.U_static_uncoupled)
    ? ((pipeline as any).U_static_uncoupled as number)
    : undefined;
  const bandMin_J = isFiniteNumber((pipeline as any)?.U_static_band?.min)
    ? ((pipeline as any).U_static_band.min as number)
    : undefined;
  const bandMax_J = isFiniteNumber((pipeline as any)?.U_static_band?.max)
    ? ((pipeline as any).U_static_band.max as number)
    : undefined;
  const casimirModel = (pipeline as any)?.casimirModel ?? 'ideal_retarded';
  const casimirRatio = isFiniteNumber((pipeline as any)?.casimirRatio)
    ? ((pipeline as any).casimirRatio as number)
    : isFiniteNumber(staticEnergyNominal_J) && staticEnergyNominal_J !== 0 && isFiniteNumber(staticEnergyRealistic_J)
    ? (staticEnergyRealistic_J as number) / (staticEnergyNominal_J as number)
    : undefined;
  const perAreaIdeal_J_m2 =
    isFiniteNumber(staticEnergyNominal_J) && isFiniteNumber(tileArea_m2) && tileArea_m2 !== 0
      ? (staticEnergyNominal_J as number) / (tileArea_m2 as number)
      : undefined;
  const perAreaRealistic_J_m2 =
    isFiniteNumber(staticEnergyRealistic_J) && isFiniteNumber(tileArea_m2) && tileArea_m2 !== 0
      ? (staticEnergyRealistic_J as number) / (tileArea_m2 as number)
      : undefined;
  const perTileIdeal_mJ = isFiniteNumber(staticEnergyNominal_J) ? staticEnergyNominal_J * 1e3 : undefined;
  const perTileRealistic_mJ = isFiniteNumber(staticEnergyRealistic_J)
    ? staticEnergyRealistic_J * 1e3
    : undefined;
  const modulationFreq_GHz = isFiniteNumber(pipeline?.modulationFreq_GHz)
    ? (pipeline!.modulationFreq_GHz as number)
    : isFiniteNumber((pipeline as any)?.dynamicConfig?.modulationFreqGHz)
    ? ((pipeline as any).dynamicConfig.modulationFreqGHz as number)
    : undefined;
  const cavityQ = isFiniteNumber((pipeline as any)?.qCavity)
    ? ((pipeline as any).qCavity as number)
    : isFiniteNumber((pipeline as any)?.cavityQ)
    ? ((pipeline as any).cavityQ as number)
    : undefined;
  const dutyCycle = isFiniteNumber(pipeline?.dutyCycle) ? (pipeline!.dutyCycle as number) : undefined;
  const dutyFR = isFiniteNumber(pipeline?.dutyEffectiveFR)
    ? (pipeline!.dutyEffectiveFR as number)
    : isFiniteNumber((pipeline as any)?.dutyEff)
    ? ((pipeline as any).dutyEff as number)
    : undefined;
  const sectorStrobing = isFiniteNumber(pipeline?.sectorStrobing)
    ? (pipeline!.sectorStrobing as number)
    : isFiniteNumber((pipeline as any)?.sectorCount)
    ? ((pipeline as any).sectorCount as number)
    : undefined;

  const tauLC_ms = isFiniteNumber((pipeline as any)?.tau_LC_ms)
    ? ((pipeline as any).tau_LC_ms as number)
    : isFiniteNumber((pipeline as any)?.lightCrossing?.tauLC_ms)
    ? ((pipeline as any).lightCrossing.tauLC_ms as number)
    : undefined;
  const burst_ms = isFiniteNumber((pipeline as any)?.burst_ms)
    ? ((pipeline as any).burst_ms as number)
    : isFiniteNumber((pipeline as any)?.lightCrossing?.burst_ms)
    ? ((pipeline as any).lightCrossing.burst_ms as number)
    : undefined;
  const dwell_ms = isFiniteNumber((pipeline as any)?.dwell_ms)
    ? ((pipeline as any).dwell_ms as number)
    : isFiniteNumber((pipeline as any)?.lightCrossing?.dwell_ms)
    ? ((pipeline as any).lightCrossing.dwell_ms as number)
    : undefined;

  const sweepRuntime = (pipeline as any)?.sweep ?? null;
  const latestSweep = deriveLatestSweep(sweepResults ?? [], sweepRuntime);
  const isHardwareSlewActive =
    Boolean(sweepRuntime?.activeSlew || sweepRuntime?.nextJobActiveSlew) ||
    Boolean((pipeline as any)?.dynamicConfig?.sweep?.activeSlew);

  const guardReasons = latestSweep ? collectInstabilityReasons(latestSweep) : [];
  const guardSummary = guardReasons.length ? guardReasons.join('; ') : null;
  const { status: evaluatedStatus, reason: evaluatedReason } = evaluateSweepBadge(latestSweep);
  let sweepStatus =
    evaluatedStatus ?? (latestSweep?.stable === true ? 'PASS' : latestSweep ? 'WARN' : undefined);
  let sweepReason = evaluatedReason;

  if (isHardwareSlewActive && guardSummary) {
    if (sweepStatus === 'UNSTABLE' && sweepReason === guardSummary) {
      sweepStatus = 'WARN';
      sweepReason = `HW slew guard: ${guardSummary}`;
    } else if (!sweepReason) {
      sweepReason = `HW slew guard: ${guardSummary}`;
    }
  }

  const rho = isFiniteNumber(latestSweep?.pumpRatio) ? (latestSweep!.pumpRatio as number) : undefined;
  const gain_dB = isFiniteNumber(latestSweep?.G) ? (latestSweep!.G as number) : undefined;
  const kappa_MHz = isFiniteNumber(latestSweep?.kappa_MHz) ? (latestSweep!.kappa_MHz as number) : undefined;
  const kappaEff_MHz = isFiniteNumber(latestSweep?.kappaEff_MHz) ? (latestSweep!.kappaEff_MHz as number) : undefined;
  const sweepDepth = isFiniteNumber(latestSweep?.m) ? (latestSweep!.m as number) : undefined;
  const sweepDepth_pct = isFiniteNumber(sweepDepth) ? sweepDepth * 100 : undefined;

  return (
    <Card className={cn('border-slate-800 bg-slate-950/75 text-slate-100', className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <Waves className="h-5 w-5 text-cyan-300" />
            Casimir Tile Cavity
          </CardTitle>
          <Badge
            className={cn(
              'ring-1 text-[11px] font-semibold',
              isMock
                ? 'bg-amber-500/15 text-amber-100 ring-amber-400/50'
                : 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/40 animate-pulse',
            )}
            title={isMock ? 'DEV mock fixture active — deterministic output' : 'Live endpoint values'}
          >
            {isMock ? 'DEV MOCK' : 'LIVE'}
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-400">
          Geometry, drive, and sweep baseline pulled from the active HELIX pipeline snapshot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Activity className="h-4 w-4 text-sky-300" />
            Static cavity baseline
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Metric
              label="Plate gap a"
              value={formatNumber(gap_nm, 2, ' nm')}
              hint="Defines u = -pi^2*hbar*c/(720*a^3)"
            />
            <Metric
              label="Tile area"
              value={formatNumber(tileArea_m2, 4, ' m^2')}
              hint={isFiniteNumber(tileArea_cm2) ? `${formatNumber(tileArea_cm2, 1, ' cm^2')}` : undefined}
            />
            <Metric
              label="Tile volume"
              value={formatSci(tileVolume_m3, 2, ' m^3')}
              hint="Area x gap"
            />
            <Metric
              label="Static energy U0"
              value={formatSci(staticEnergy_J, 2, ' J')}
              hint={
                isFiniteNumber(staticEnergyNominal_J) && staticEnergyNominal_J !== staticEnergy_J
                  ? `PEC (retarded): ${formatSci(staticEnergyNominal_J, 2, ' J')}`
                  : 'Per tile baseline'
              }
            />
            <Metric
              label="Material model"
              value={String(casimirModel)}
              hint={isFiniteNumber(casimirRatio) ? `lifshitz/ret = ${casimirRatio.toFixed(2)}x` : undefined}
            />
            <Metric
              label="Realistic U band"
              value={
                isFiniteNumber(bandMin_J) && isFiniteNumber(bandMax_J)
                  ? `${formatSci(bandMin_J, 2, ' J')} ... ${formatSci(bandMax_J, 2, ' J')}`
                  : formatSci(staticEnergyRealistic_J, 2, ' J')
              }
              hint="Non-retarded + finite-sigma estimate"
            />
            <Metric
              label="Tiles engaged"
              value={formatNumber(tileCount, 0)}
              hint="Active lattice population"
            />
            <Metric
              label="Amplification chain"
              value={
                isFiniteNumber(gammaGeo) && isFiniteNumber(gammaVdB) && isFiniteNumber(qSpoil)
                  ? `gamma_geo=${formatNumber(gammaGeo, 1)} * gamma_VdB=${formatSci(gammaVdB, 1)} * q_spoil=${formatSci(qSpoil, 1)}`
                  : FALLBACK
              }
              hint="Instantaneous scaling"
            />
          </div>
          <div className="mt-4 rounded-lg border border-slate-800/60 bg-slate-900/50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-slate-400">
              <span>Physics anchor (per area & per tile)</span>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'border-slate-700 bg-slate-900/60 text-[11px] text-slate-200',
                    casimirModel?.includes('drude') && 'border-cyan-500/50 text-cyan-100',
                    casimirModel?.includes('plasma') && 'border-fuchsia-500/50 text-fuchsia-100',
                    casimirModel?.includes('ideal') && 'border-emerald-500/60 text-emerald-100',
                  )}
                >
                  {casimirModel ?? 'uniform'}
                </Badge>
                {isFiniteNumber(casimirRatio) ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      'border-slate-700 bg-slate-900/60 text-[11px] font-semibold',
                      casimirRatio > 1 ? 'border-rose-400/60 text-rose-100' : 'border-emerald-400/50 text-emerald-100',
                    )}
                    title="Realistic / ideal energy ratio (chi=1 path)"
                  >
                    ratio {casimirRatio.toFixed(3)}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-3 text-[11px] text-slate-200">
              <div className="space-y-1">
                <div className="text-slate-400">Ideal per-area</div>
                <div className="font-mono text-sm">{formatSci(perAreaIdeal_J_m2, 3, ' J·m^-2')}</div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-400">Realistic per-area</div>
                <div className="font-mono text-sm">
                  {isFiniteNumber(perAreaRealistic_J_m2) ? formatSci(perAreaRealistic_J_m2, 3, ' J·m^-2') : FALLBACK}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-slate-400">Per-tile (mJ)</div>
                <div className="font-mono text-sm">
                  {isFiniteNumber(perTileRealistic_mJ)
                    ? perTileRealistic_mJ.toFixed(3)
                    : isFiniteNumber(perTileIdeal_mJ)
                    ? perTileIdeal_mJ.toFixed(3)
                    : FALLBACK}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {`Ratios use the uncoupled chi=1 path${
                isFiniteNumber(staticEnergyUncoupled_J) ? " (uncoupled band available)" : ""
              }; check nm->m and cm^2->m^2 unit guards if values drift.`}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Radio className="h-4 w-4 text-fuchsia-300" />
            Dynamic drive
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Metric
              label="Modulation fₘ"
              value={formatNumber(modulationFreq_GHz, 3, ' GHz')}
              hint="Pipeline modulation frequency"
            />
            <Metric
              label="Cavity Q"
              value={formatSci(cavityQ, 2)}
              hint="Loaded Q for Natário chain"
            />
            <Metric
              label="Duty cycle"
              value={formatPercent(dutyCycle, 3)}
              hint={isFiniteNumber(sectorStrobing) ? `Sector strobing ×${sectorStrobing}` : undefined}
            />
            <Metric
              label="FR duty"
              value={formatPercent(dutyFR, 3)}
              hint="Effective lattice average"
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Metric label="τ_LC" value={formatTauUnitsFirst(tauLC_ms)} hint="Light-crossing (units-first)" />
            <Metric label="Burst" value={formatNumber(burst_ms, 3, ' ms')} hint="ON window" />
            <Metric label="Dwell" value={formatNumber(dwell_ms, 3, ' ms')} hint="OFF window" />
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-3 text-[11px] text-slate-400">
            <div>{`Units sourcing: tauLC_ms -> formatted as microseconds when < 1 ms.`}</div>
            <div>
              HF proxy: {Number.isFinite((pipeline as any)?.epsilon) ? `I_eps=${(pipeline as any).epsilon}` : "awaiting I_eps"}
            </div>
            <div className="text-slate-500">
              {isFiniteNumber(staticEnergyUncoupled_J)
                ? `Uncoupled static band: ${formatSci(staticEnergyUncoupled_J, 2, " J")}`
                : "Uncoupled static band uses chi=1 baseline"}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
            <span className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-cyan-300" />
              Sweep baseline snapshot
            </span>
            {sweepStatus ? (
              <Badge
                className={cn(
                  'text-[11px] font-semibold',
                  sweepStatus === 'PASS' && 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40',
                  sweepStatus === 'WARN' && 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40',
                  sweepStatus === 'UNSTABLE' && 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40',
                )}
              >
                {sweepStatus}
              </Badge>
            ) : null}
          </div>
          {sweepReason ? (
            <div className="mt-1 text-[11px] text-rose-200">
              {sweepReason}
            </div>
          ) : null}
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Metric label="Gap sample" value={formatNumber(latestSweep?.d_nm, 2, ' nm')} hint="Working point" />
            <Metric
              label="Pump frequency"
              value={formatNumber(latestSweep?.Omega_GHz, 3, ' GHz')}
              hint={formatMHz(latestSweep?.detune_MHz)}
            />
            <Metric
              label="Phase"
              value={formatDegrees(latestSweep?.phi_deg)}
              hint={isFiniteNumber(latestSweep?.pumpPhase_deg) ? `bias ${formatDegrees(latestSweep!.pumpPhase_deg)}` : undefined}
            />
            <Metric
              label="Mod depth"
              value={formatPercent(sweepDepth, 3)}
              hint={sweepDepth_pct != null ? `m = ${sweepDepth_pct.toFixed(2)}%` : 'm'}
            />
          </div>
          <div className="mt-4 space-y-3">
            <Gauge
              label="ρ = g/g_th"
              value={rho}
              max={1.2}
              dangerThreshold={0.95}
              format={(v) => v.toFixed(2)}
            />
            <Gauge
              label="Gain"
              value={isFiniteNumber(gain_dB) ? (gain_dB as number) : undefined}
              min={-10}
              max={20}
              format={(v) => `${v.toFixed(2)} dB`}
            />
            <Gauge
              label="κ baseline"
              value={kappa_MHz}
              min={0}
              max={50}
              format={(v) => `${v.toFixed(2)} MHz`}
            />
            <Gauge
              label="κ_eff"
              value={kappaEff_MHz}
              min={0}
              max={50}
              format={(v) => `${v.toFixed(2)} MHz`}
            />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

export default CavityMechanismPanel;
