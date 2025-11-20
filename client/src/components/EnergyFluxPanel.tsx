import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Loader2, Zap, Waves } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useStressEnergyBrick } from "@/hooks/useStressEnergyBrick";
import { publish, subscribe, unsubscribe } from "@/lib/luma-bus";
import type { StressEnergyBrickDecoded } from "@/lib/stress-energy-brick";
import HardwareConnectButton from "@/components/HardwareConnectButton";
import { useHardwareFeeds, type HardwareConnectHelp } from "@/hooks/useHardwareFeeds";
import { DEFAULT_T00_CHANNEL, DEFAULT_FLUX_CHANNEL } from "@/components/CurvatureVoxProvider";
import { FluxInvariantBadge } from "@/components/common/FluxInvariantBadge";
import LRLDocsTooltip from "@/components/common/LRLDocsTooltip";
import { computeLaplaceRungeLenz, type Vec3 } from "@/physics/alcubierre";

const EPS = 1e-9;
const HIST_BINS = 36;

const arraysEqual = (a?: [number, number, number], b?: [number, number, number]) =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

const vecMagnitude = (v?: [number, number, number]) =>
  v ? Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0) : null;

const safeNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const positiveNumber = (value: unknown, fallback = 1, clamp = { min: 1e-6, max: 1e6 }) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  if (n < clamp.min) return clamp.min;
  if (n > clamp.max) return clamp.max;
  return n;
};

const normalizeHeading = (deg: number) => {
  if (!Number.isFinite(deg)) return NaN;
  const wrapped = ((deg % 360) + 360) % 360;
  return wrapped;
};

const ENERGY_FLUX_HELP: HardwareConnectHelp = {
  instruments: ["Flux probe array", "Casimir gap sensors", "DAQ / LabBridge"],
  feeds: [
    "GET /api/helix/stress-energy-brick (t00, S, div S) - canonical stress-energy volume feed",
    "Bus overlays: hull3d:t00-volume, hull3d:flux (publish Float32 textures directly to renderer)",
  ],
  notes: [
    "Panel now renders slices from the server-built stress-energy brick. Lab tools can push overrides over the same endpoint.",
    "When hardware feed is live, badges flip to 'Live' and overlays use your instrument or simulation data.",
  ],
  fileTypes: [".json"],
};

type StressBusBase = {
  dims: [number, number, number];
  stats?: StressEnergyBrickDecoded["stats"];
};

type StressBusT00Payload = StressBusBase & {
  t00: StressEnergyBrickDecoded["t00"];
};

type StressBusFluxPayload = StressBusBase & {
  flux: StressEnergyBrickDecoded["flux"];
};

type SliceStats = {
  dims: { nx: number; ny: number };
  density: { data: Float32Array; min: number; max: number };
  divergence: { data: Float32Array; min: number; max: number };
  ratio: {
    hist: number[];
    stableFraction: number;
    rms: number;
    maxAbs: number;
    total: number;
  };
};

export default function EnergyFluxPanel() {
  const { data: pipeline } = useEnergyPipeline();
  const stressQuery = useStressEnergyBrick({ quality: "low", refetchMs: 1500 });
  const { isLoading, isFetching, error: brickError } = stressQuery;
  const hardwareController = useHardwareFeeds({
    panelId: "energy-flux",
    panelTitle: "Energy Flux Stability",
    help: ENERGY_FLUX_HELP,
  });
  const [busT00, setBusT00] = useState<StressBusT00Payload | null>(null);
  const [busFlux, setBusFlux] = useState<StressBusFluxPayload | null>(null);
  const lastMirrorStampRef = useRef<number>(0);
  const lastLrlSample = useRef<{ position: Vec3; timestamp: number } | null>(null);
  const [lrlTelemetry, setLrlTelemetry] = useState<{
    eccentricity: number;
    periapsisDeg: number;
    magnitude: number;
  } | null>(null);
  const [natarioDiag, setNatarioDiag] = useState<{
    t: number;
    divMax?: number;
    kTol?: number;
    gNatario?: number;
    gK?: number;
    gateLabel?: string;
    divRms?: number;
    source?: string;
  } | null>(null);

  useEffect(() => {
    const id = subscribe(DEFAULT_T00_CHANNEL, (payload: any) => {
      if (!payload || typeof payload !== "object") return;
      if (!payload.dims || !payload.t00) return;
      setBusT00(payload as StressBusT00Payload);
    });
    return () => {
      unsubscribe(id);
    };
  }, []);

  useEffect(() => {
    const id = subscribe("natario:diagnostics", (payload: any) => {
      if (!payload || typeof payload !== "object") return;
      setNatarioDiag({
        t: Date.now(),
        divMax: Number(payload.divMax),
        kTol: Number(payload.K_tol ?? payload.kTol),
        gNatario: Number(payload.gNatario),
        gK: Number(payload.gK),
        gateLabel: typeof payload.gateLabel === "string" ? payload.gateLabel : undefined,
        divRms: Number(payload.divRms),
        source: typeof payload.source === "string" ? payload.source : "bus",
      });
    });
    return () => {
      unsubscribe(id);
    };
  }, []);

  useEffect(() => {
    const id = subscribe(DEFAULT_FLUX_CHANNEL, (payload: any) => {
      if (!payload || typeof payload !== "object") return;
      if (!payload.dims || !payload.flux) return;
      setBusFlux(payload as StressBusFluxPayload);
    });
    return () => {
      unsubscribe(id);
    };
  }, []);

  useEffect(() => {
    if (!pipeline?.qi) {
      setLrlTelemetry(null);
      return;
    }
    const position: Vec3 = [
      safeNumber(pipeline.qi.avg),
      safeNumber(pipeline.qi.bound),
      safeNumber(pipeline.qi.margin),
    ];
    const now = Date.now();
    const last = lastLrlSample.current;
    let velocity: Vec3 = [0, 0, 0];
    if (last) {
      const dt = Math.max((now - last.timestamp) / 1000, 1e-3);
      velocity = [
        (position[0] - last.position[0]) / dt,
        (position[1] - last.position[1]) / dt,
        (position[2] - last.position[2]) / dt,
      ];
    }
    lastLrlSample.current = { position, timestamp: now };
    const mass = positiveNumber(pipeline.M_exotic ?? pipeline.exoticMassTarget_kg ?? 1);
    const centralMass = positiveNumber(pipeline.exoticMassTarget_kg ?? mass, mass, { min: 1e-6, max: 1e9 });
    const result = computeLaplaceRungeLenz({ position, velocity, mass, centralMass });
    if (Number.isFinite(result.eccentricity) && Number.isFinite(result.periapsisAngle)) {
      setLrlTelemetry({
        eccentricity: result.eccentricity,
        periapsisDeg: normalizeHeading((result.periapsisAngle * 180) / Math.PI),
        magnitude: result.magnitude,
      });
    }
  }, [
    pipeline?.qi?.avg,
    pipeline?.qi?.bound,
    pipeline?.qi?.margin,
    pipeline?.M_exotic,
    pipeline?.exoticMassTarget_kg,
    pipeline?.qi,
  ]);

  const busSample = useMemo<StressEnergyBrickDecoded | null>(() => {
    if (!busT00 || !busFlux) return null;
    if (busT00.dims[0] !== busFlux.dims[0] || busT00.dims[1] !== busFlux.dims[1] || busT00.dims[2] !== busFlux.dims[2]) {
      return null;
    }
    const stats = busFlux.stats ?? busT00.stats ?? stressQuery.data?.stats;
    if (!stats) return null;
    return {
      dims: busT00.dims,
      t00: busT00.t00,
      flux: busFlux.flux,
      stats,
    };
  }, [busT00, busFlux, stressQuery.data]);

  const activeSample = busSample ?? stressQuery.data ?? null;
  const feedSource = busSample
    ? "bus"
    : stressQuery.data
      ? "query"
      : null;
  const slice = useMemo(() => computeSlice(activeSample), [activeSample]);

  const densityMagnitude = activeSample?.stats?.avgT00 ?? null;
  const fluxProxy = activeSample?.stats?.avgFluxMagnitude ?? null;
  const tsRatio = pipeline?.TS_ratio ?? null;
  const mode = pipeline?.currentMode ?? "unknown";
  const duty = pipeline?.dutyEffectiveFR ?? pipeline?.dutyCycle ?? 0;

  const panelStatus = useMemo(() => {
    const stablePct = slice ? Math.round((slice.ratio.stableFraction || 0) * 100) : null;
    return {
      stablePct,
      rms: slice ? slice.ratio.rms : null,
      maxAbs: slice ? slice.ratio.maxAbs : null,
      divergencePeak: slice ? Math.max(Math.abs(slice.divergence.min), Math.abs(slice.divergence.max)) : null,
    };
  }, [slice]);

  const sbcpTrace = useMemo(() => {
    const stats = activeSample?.stats;
    if (!stats) return null;
    const avgFlux = Number.isFinite(stats.avgFluxMagnitude) ? stats.avgFluxMagnitude : null;
    const netFlux = stats.netFlux;
    const netFluxMag =
      netFlux && Array.isArray(netFlux) ? Math.hypot(netFlux[0] ?? 0, netFlux[1] ?? 0, netFlux[2] ?? 0) : null;
    const divPeak = Math.max(Math.abs(stats.divMin ?? 0), Math.abs(stats.divMax ?? 0));
    const netLimit = avgFlux != null ? Math.max(avgFlux * 0.02, 1e-6) : 1e-3;
    const divLimit = avgFlux != null ? Math.max(avgFlux * 0.05, 1e-6) : 5e-3;
    const netExceeded = netFluxMag != null && netFluxMag > netLimit;
    const divExceeded = Number.isFinite(divPeak) && divPeak > divLimit;
    if (!netExceeded && !divExceeded) return null;
    return {
      avgFlux,
      netFluxMag,
      netLimit,
      netExceeded,
      divPeak,
      divLimit,
      divExceeded,
    };
  }, [activeSample?.stats]);

  const natarioStatsFromBrick = useMemo(() => {
    const nat = activeSample?.stats?.natario;
    if (!nat) return null;
    return {
      t: stressQuery.dataUpdatedAt ?? Date.now(),
      divMax: nat.divBetaMax,
      divRms: nat.divBetaRms,
      kTol: nat.gateLimit,
      gNatario: nat.gNatario,
      gateLabel: "solver",
      source: "solver",
    };
  }, [activeSample?.stats?.natario, stressQuery.dataUpdatedAt]);

  const natarioTrace = useMemo(() => {
    if (natarioDiag) {
      const hasLiveValues =
        Number.isFinite(natarioDiag.divMax) && Number.isFinite(natarioDiag.kTol ?? NaN);
      if (hasLiveValues) return natarioDiag;
    }
    if (natarioStatsFromBrick) return natarioStatsFromBrick;
    return natarioDiag ?? null;
  }, [natarioDiag, natarioStatsFromBrick]);

  const leastActionStrip = useMemo(() => {
    const stats = activeSample?.stats;
    if (!stats) return null;
    const avgFlux = Number.isFinite(stats.avgFluxMagnitude) ? Math.abs(stats.avgFluxMagnitude) : null;
    const avgT00 = Number.isFinite(stats.avgT00) ? Math.abs(stats.avgT00) : null;
    const actionCost =
      avgFlux != null && avgT00 != null && avgT00 > 0 ? avgFlux / Math.max(avgT00, EPS) : null;
    if (actionCost == null) return null;
    return {
      actionCost,
      avgFlux,
      avgT00,
      natario: natarioTrace
        ? {
            divMax: natarioTrace.divMax,
            divRms: natarioTrace.divRms,
            gateLabel: natarioTrace.gateLabel,
            kTol: natarioTrace.kTol,
          }
        : null,
    };
  }, [activeSample?.stats, natarioTrace]);

  const mirrorApiToBus = useCallback((sample: StressEnergyBrickDecoded) => {
    const payloadBase = {
      dims: sample.dims,
      stats: sample.stats,
    };
    publish(DEFAULT_T00_CHANNEL, { ...payloadBase, t00: sample.t00 });
    publish(DEFAULT_FLUX_CHANNEL, { ...payloadBase, flux: sample.flux });
  }, []);

  useEffect(() => {
    if (!stressQuery.data) return;
    const updatedAt = stressQuery.dataUpdatedAt;
    if (typeof updatedAt !== "number") return;
    if (updatedAt <= lastMirrorStampRef.current) return;
    lastMirrorStampRef.current = updatedAt;
    mirrorApiToBus(stressQuery.data);
  }, [stressQuery.data, stressQuery.dataUpdatedAt, mirrorApiToBus]);

  const overlaySync = useMemo(() => {
    const apiSample = stressQuery.data ?? null;
    if (!busSample && !apiSample) {
      return null;
    }
    if (!busSample || !apiSample) {
      return {
        mode: "missing" as const,
        busAvailable: !!busSample,
        apiAvailable: !!apiSample,
      };
    }
    const dimsMatch = arraysEqual(busSample.dims, apiSample.dims);
    const busFluxAvg = busSample.stats.avgFluxMagnitude;
    const apiFluxAvg = apiSample.stats.avgFluxMagnitude;
    const fluxDeltaPct =
      Number.isFinite(busFluxAvg) && Number.isFinite(apiFluxAvg) && apiFluxAvg
        ? Math.abs(busFluxAvg - apiFluxAvg) / Math.max(Math.abs(apiFluxAvg), EPS)
        : null;
    const busNetMag = vecMagnitude(busSample.stats.netFlux);
    const apiNetMag = vecMagnitude(apiSample.stats.netFlux);
    const netDelta =
      Number.isFinite(busNetMag) && Number.isFinite(apiNetMag)
        ? Math.abs((busNetMag ?? 0) - (apiNetMag ?? 0))
        : null;
    const strobeDelta = Math.abs((busSample.stats.strobePhase ?? 0) - (apiSample.stats.strobePhase ?? 0));
    const healthy =
      dimsMatch &&
      (fluxDeltaPct == null || fluxDeltaPct < 0.05) &&
      (netDelta == null || netDelta <= Math.max(apiNetMag ? apiNetMag * 0.05 : 0, 1e-3)) &&
      strobeDelta < 0.05;
    return {
      mode: "compare" as const,
      dimsMatch,
      fluxDeltaPct,
      netDelta,
      strobeDelta,
      healthy,
    };
  }, [busSample, stressQuery.data]);

  return (
    <Card className="h-full border-slate-800 bg-slate-950/70 text-slate-100">
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5 text-cyan-300" />
              <span className="flex items-center gap-2">
                Energy Flux Stability
                <LRLDocsTooltip />
              </span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Equatorial |T00| vs div S slices and the ratio R = (div S)/(epsilon + |T00|). Currently driven by the
              stress-energy brick feed.
            </CardDescription>
          </div>
          <HardwareConnectButton
            controller={hardwareController}
            buttonClassName="pointer-events-auto bg-emerald-500/20 text-emerald-100 border border-emerald-400/50 hover:bg-emerald-500/30"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <MetricTile
            icon={<Zap className="h-4 w-4 text-amber-400" />}
            label="|T00| (avg)"
            value={formatScientific(densityMagnitude)}
            hint="Cycle-averaged energy density from stress-energy tensor."
          />
          <MetricTile
            icon={<Waves className="h-4 w-4 text-sky-400" />}
            label="div S proxy"
            value={formatScientific(fluxProxy)}
            hint="Momentum-flux divergence derived from Natario stress proxy."
          />
          <MetricTile
            icon={<Activity className="h-4 w-4 text-emerald-400" />}
            label="TS ratio"
            value={tsRatio ? tsRatio.toFixed(2) : "-"}
            hint="Time-scale separation (TS) guardrail."
          />
        </section>

        {leastActionStrip && (
          <section className="rounded-xl border border-cyan-400/30 bg-slate-900/70 p-4 text-sm text-slate-200">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Least-action strip</div>
                <div className="text-base font-semibold text-cyan-200">δS trend monitor</div>
              </div>
              <Badge variant="outline" className="border-cyan-400/50 text-cyan-200">
                docs/needle-hull-mainframe.md
              </Badge>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Normalized action cost = avg |S| / |avg T00|. When it drops, the Natario + Alcubierre blend is
              sitting on the stationary-action ridge described in the Action-Principle Telemetry notes.
            </p>
            <dl className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-slate-400">Action cost</dt>
                <dd className="text-slate-100">{formatScientific(leastActionStrip.actionCost)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">avg |S|</dt>
                <dd>{formatScientific(leastActionStrip.avgFlux)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">|avg T00|</dt>
                <dd>{formatScientific(leastActionStrip.avgT00)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">
                  Natario gate
                  {leastActionStrip.natario?.gateLabel ? ` (${leastActionStrip.natario.gateLabel})` : ""}
                </dt>
                <dd>
                  {leastActionStrip.natario?.kTol != null
                    ? formatScientific(leastActionStrip.natario.kTol)
                    : "-"}
                </dd>
              </div>
            </dl>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <FluxInvariantBadge stats={activeSample?.stats} />
          <LRLInvariantBadge telemetry={lrlTelemetry} />
        </div>

        {sbcpTrace && (
          <section className="rounded-xl border border-white/5 bg-slate-900/70 p-4 text-sm text-slate-200">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">SBCP trace</div>
                <div className="text-sm font-semibold text-amber-300">Open boundary diagnostics</div>
              </div>
              <Badge
                variant="outline"
                className="border-amber-400/60 bg-amber-400/10 text-amber-200"
              >
                limits from avg |S|
              </Badge>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Net flux and divergence are compared against dynamic gates derived from the canonical Natario brick.
              Anything above the limit trips the Symmetry-Boundary Conservation guard.
            </p>
            <dl className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-slate-400">|∮S·dA|</dt>
                <dd className={sbcpTrace.netExceeded ? "text-amber-200" : ""}>
                  {formatScientific(sbcpTrace.netFluxMag)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Net limit</dt>
                <dd>{formatScientific(sbcpTrace.netLimit)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">max |∇·S|</dt>
                <dd className={sbcpTrace.divExceeded ? "text-amber-200" : ""}>
                  {formatScientific(sbcpTrace.divPeak)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Div limit</dt>
                <dd>{formatScientific(sbcpTrace.divLimit)}</dd>
              </div>
            </dl>
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-300">
              <div className="mb-1 flex items-center justify-between">
                <span className="uppercase tracking-wide text-[11px] text-slate-400">Natario clamps</span>
                <span className="text-[11px] text-slate-400">
                  gNatario {natarioTrace?.gNatario == null ? "-" : natarioTrace.gNatario.toFixed(3)}
                </span>
              </div>
              {natarioTrace ? (
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-slate-400">max |∇·β|</dt>
                    <dd
                      className={
                        natarioTrace.divMax != null &&
                        sbcpTrace.divLimit != null &&
                        natarioTrace.divMax > sbcpTrace.divLimit
                          ? "text-amber-200"
                          : ""
                      }
                    >
                      {formatScientific(natarioTrace.divMax)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">K tol</dt>
                    <dd>{formatScientific(natarioTrace.kTol)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Gate</dt>
                    <dd>{natarioTrace.gateLabel ?? natarioTrace.source ?? "auto"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">rms |∇·β|</dt>
                    <dd>{formatScientific(natarioTrace.divRms)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Source</dt>
                    <dd>{natarioTrace.source ?? "bus"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-slate-400">
                  No Natario diagnostics available yet. Open Drive Guards or wait for the solver to publish clamp data.
                </p>
              )}
            </div>
          </section>
        )}

        {overlaySync && (
          <section className="rounded-xl border border-white/5 bg-slate-950/60 p-4 text-sm text-slate-200">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Overlay sync</div>
                {overlaySync.mode === "compare" ? (
                  <div className={`text-sm font-semibold ${overlaySync.healthy ? "text-emerald-300" : "text-amber-300"}`}>
                    {overlaySync.healthy ? "Bus matches API stress brick" : "Bus payload diverges from API brick"}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-amber-300">
                    {overlaySync.busAvailable
                      ? "Awaiting API stress brick sample"
                      : "No bus overlay detected"}
                  </div>
                )}
              </div>
              {overlaySync.mode === "compare" ? (
                <Badge
                  variant="outline"
                  className={
                    overlaySync.healthy
                      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
                      : "border-amber-400/60 bg-amber-400/10 text-amber-200"
                  }
                >
                  {overlaySync.dimsMatch ? "Dims aligned" : "Dims mismatch"}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-400/50 bg-amber-400/10 text-amber-200">
                  {overlaySync.busAvailable ? "Bus active" : "Bus idle"}
                </Badge>
              )}
            </div>
            {overlaySync.mode === "compare" ? (
              <dl className="grid gap-3 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-slate-400">Flux drift</dt>
                  <dd className={overlaySync.fluxDeltaPct != null && overlaySync.fluxDeltaPct > 0.05 ? "text-amber-200" : ""}>
                    {overlaySync.fluxDeltaPct == null ? "n/a" : `${(overlaySync.fluxDeltaPct * 100).toFixed(2)}%`}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">|Δ net flux|</dt>
                  <dd className={overlaySync.netDelta != null && overlaySync.netDelta > 1e-3 ? "text-amber-200" : ""}>
                    {overlaySync.netDelta == null ? "n/a" : formatScientific(overlaySync.netDelta)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Δ strobe phase</dt>
                  <dd className={overlaySync.strobeDelta > 0.05 ? "text-amber-200" : ""}>
                    {overlaySync.strobeDelta.toFixed(3)}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="space-y-2 text-xs text-slate-400">
                <p>
                  {overlaySync.busAvailable
                    ? "Waiting for /api/helix/stress-energy-brick to return; sync metrics will populate automatically."
                    : "Feed the hull3d:t00-volume + hull3d:flux bus to compare overlays with the API stress brick."}
                </p>
                {!overlaySync.busAvailable && stressQuery.data && (
                  <button
                    type="button"
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-400/60 hover:text-emerald-200"
                    onClick={() => mirrorApiToBus(stressQuery.data!)}
                  >
                    Mirror latest API brick to bus
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-xs">
          <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            Mode: {mode}
          </Badge>
          <Badge variant="outline" className="border-slate-400/40 bg-slate-400/10 text-slate-100">
            Duty: {(duty * 100).toFixed(3)}%
          </Badge>
          <Badge
            variant="outline"
            className={
              hardwareController.isLive
                ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                : "border-slate-500/40 bg-slate-500/10 text-slate-200"
            }
          >
            {hardwareController.isLive ? "Live hardware feed" : "Simulated stress-energy feed"}
          </Badge>
          {feedSource && (
            <Badge
              variant="outline"
              className={
                feedSource === "bus"
                  ? "border-sky-400/60 bg-sky-400/10 text-sky-100"
                  : "border-slate-400/50 bg-slate-400/15 text-slate-100"
              }
            >
              Stress-energy source: {feedSource === "bus" ? "Hull3D bus" : "local query"}
            </Badge>
          )}
          {panelStatus.stablePct != null && (
            <Badge variant="outline" className="border-emerald-400/50 bg-emerald-400/10 text-emerald-200">
              Stable voxels: {panelStatus.stablePct}%
            </Badge>
          )}
          {panelStatus.rms != null && (
            <span className="text-slate-300/80">
              RMS(R): {panelStatus.rms.toFixed(3)} - |R|max: {panelStatus.maxAbs?.toFixed(2) ?? "-"}
            </span>
          )}
          {brickError && (
            <span className="text-rose-300">
              Slice unavailable: {brickError instanceof Error ? brickError.message : String(brickError)}
            </span>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <SliceCanvas
            label="Equatorial |T00| slice"
            subtitle="Heat compresses automatically"
            payload={slice?.density}
            dims={slice?.dims}
            palette="heat"
            loading={!slice && (isLoading || isFetching)}
          />
          <SliceCanvas
            label="Proxy div S slice"
            subtitle="Blue = inflow, Red = outflow"
            payload={slice?.divergence}
            dims={slice?.dims}
            palette="diverge"
            loading={!slice && (isLoading || isFetching)}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span>R histogram (div S / (epsilon + |T00|))</span>
              <span>
                Stable window &lt; 0.1 =&gt;{" "}
                {panelStatus.stablePct != null ? `${panelStatus.stablePct}%` : "-"}
              </span>
            </div>
            <RatioHistogram hist={slice?.ratio.hist} />
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">Why watch R?</p>
            <p className="mt-1 leading-relaxed">
              R measures how quickly energy accumulates relative to |T00|. Near-zero regions indicate
              steady curvature pockets; sustained |R| &gt;&gt; 0.1 highlights pumping or bleeding sectors that
              deserve strobe or duty adjustments.
            </p>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function logMagnitude(value: number) {
  return Math.log10(EPS + Math.abs(value));
}

function signedLogMagnitude(value: number) {
  if (value === 0) return 0;
  const magnitude = logMagnitude(value);
  return Math.sign(value) * magnitude;
}

function computeSlice(sample?: StressEnergyBrickDecoded | null): SliceStats | null {
  if (!sample?.t00?.data?.length) return null;
  const [nx, ny, nz] = sample.dims;
  if (!nx || !ny || !nz) return null;
  const sliceK = Math.floor(nz / 2);
  const planeSize = nx * ny;
  const baseOffset = sliceK * ny * nx;
  const densityData = new Float32Array(planeSize);
  const divergenceData = new Float32Array(planeSize);
  const ratioHist = new Array(HIST_BINS).fill(0);

  let densityMin = Number.POSITIVE_INFINITY;
  let densityMax = Number.NEGATIVE_INFINITY;
  let divMin = Number.POSITIVE_INFINITY;
  let divMax = Number.NEGATIVE_INFINITY;
  let stableCount = 0;
  let sampleCount = 0;
  let sumRatioSq = 0;
  let maxAbs = 0;

  const sampleValue = (x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(nx - 1, x));
    const clampedY = Math.max(0, Math.min(ny - 1, y));
    const idx = baseOffset + clampedY * nx + clampedX;
    return sample.t00.data[idx] ?? 0;
  };

  const divergenceValue = (x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(nx - 1, x));
    const clampedY = Math.max(0, Math.min(ny - 1, y));
    const idx = baseOffset + clampedY * nx + clampedX;
    return sample.flux.divS.data[idx] ?? 0;
  };

  let idx2d = 0;
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      const value = sampleValue(x, y);
      const absValue = Math.abs(value);
      const logDensity = logMagnitude(absValue);
      densityData[idx2d] = logDensity;
      densityMin = Math.min(densityMin, logDensity);
      densityMax = Math.max(densityMax, logDensity);

      const divergence = divergenceValue(x, y);
      const logDivergence = signedLogMagnitude(divergence);
      divergenceData[idx2d] = logDivergence;
      divMin = Math.min(divMin, logDivergence);
      divMax = Math.max(divMax, logDivergence);

      const ratio = divergence / (absValue + EPS);
      const ratioClamped = Math.max(-1, Math.min(1, ratio));
      const bin = Math.min(
        HIST_BINS - 1,
        Math.max(0, Math.floor(((ratioClamped + 1) / 2) * HIST_BINS))
      );
      ratioHist[bin] += 1;
      if (Math.abs(ratio) < 0.1) stableCount += 1;
      sampleCount += 1;
      sumRatioSq += ratio * ratio;
      maxAbs = Math.max(maxAbs, Math.abs(ratio));

      idx2d += 1;
    }
  }

  if (!Number.isFinite(densityMin)) densityMin = 0;
  if (!Number.isFinite(densityMax)) densityMax = 0;
  if (!Number.isFinite(divMin)) divMin = 0;
  if (!Number.isFinite(divMax)) divMax = 0;

  return {
    dims: { nx, ny },
    density: { data: densityData, min: densityMin, max: densityMax },
    divergence: { data: divergenceData, min: divMin, max: divMax },
    ratio: {
      hist: ratioHist,
      stableFraction: sampleCount ? stableCount / sampleCount : 0,
      rms: sampleCount ? Math.sqrt(sumRatioSq / sampleCount) : 0,
      maxAbs,
      total: sampleCount,
    },
  };
}

type MetricTileProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
};

function MetricTile({ icon, label, value, hint }: MetricTileProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
    </div>
  );
}

type SliceCanvasProps = {
  label: string;
  subtitle: string;
  payload?: { data: Float32Array; min: number; max: number } | null;
  dims?: { nx: number; ny: number };
  palette: "heat" | "diverge";
  loading?: boolean;
};

function SliceCanvas({ label, subtitle, payload, dims, palette, loading }: SliceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const width = dims?.nx ?? 128;
  const height = dims?.ny ?? 128;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload?.data?.length || !dims) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const image = ctx.createImageData(width, height);
    const [min, max] = [payload.min, payload.max];
    const span = Math.max(EPS, max - min);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx2d = y * width + x;
        const raw = payload.data[idx2d] ?? 0;
        const norm = Math.max(0, Math.min(1, (raw - min) / span));
        const [r, g, b] = palette === "heat" ? heatPalette(norm) : divergePalette(norm);
        const px = idx2d * 4;
        image.data[px] = r;
        image.data[px + 1] = g;
        image.data[px + 2] = b;
        image.data[px + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [payload, dims, palette, width, height]);

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-4">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span>{subtitle}</span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="h-64 w-full rounded-lg border border-white/10 bg-slate-950"
        />
        {loading && (
          <div className="absolute inset-0 grid place-items-center rounded-lg bg-slate-950/70">
            <Loader2 className="h-6 w-6 animate-spin text-slate-200" />
          </div>
        )}
      </div>
    </div>
  );
}

type RatioHistogramProps = {
  hist?: number[] | null;
};

function RatioHistogram({ hist }: RatioHistogramProps) {
  if (!hist || !hist.length) {
    return (
      <div className="grid h-32 place-items-center text-slate-400">
        Histogram unavailable
      </div>
    );
  }
  const maxCount = hist.reduce((m, v) => Math.max(m, v), 0) || 1;
  return (
    <svg viewBox={`0 0 ${hist.length * 4} 100`} className="h-32 w-full">
      {hist.map((count, idx) => {
        const height = (count / maxCount) * 95;
        const x = idx * 4;
        const y = 100 - height;
        const ratio = (idx / hist.length) * 2 - 1;
        const color = Math.abs(ratio) < 0.1 ? "#34d399" : ratio > 0 ? "#f87171" : "#60a5fa";
        return <rect key={idx} x={x} y={y} width={3} height={height} fill={color} rx={0.4} />;
      })}
      <line
        x1={(hist.length / 2) * 4}
        x2={(hist.length / 2) * 4}
        y1={0}
        y2={100}
        stroke="rgba(255,255,255,0.2)"
        strokeDasharray="4 2"
      />
    </svg>
  );
}

function formatScientific(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "-";
  const abs = Math.abs(value);
  if (abs >= 1e3 || abs <= 1e-2) {
    return value.toExponential(2);
  }
  return value.toFixed(2);
}

function heatPalette(t: number): [number, number, number] {
  const clamp = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * clamp);
  const g = Math.round(255 * Math.pow(clamp, 0.5));
  const b = Math.round(255 * Math.pow(clamp, 0.2) * 0.2);
  return [r, g, b];
}

function divergePalette(t: number): [number, number, number] {
  const clamp = Math.max(0, Math.min(1, t));
  const cold: [number, number, number] = [33, 82, 214];
  const mid: [number, number, number] = [250, 250, 250];
  const hot: [number, number, number] = [255, 92, 52];
  if (clamp < 0.5) {
    const u = clamp / 0.5;
    return [
      Math.round(cold[0] * (1 - u) + mid[0] * u),
      Math.round(cold[1] * (1 - u) + mid[1] * u),
      Math.round(cold[2] * (1 - u) + mid[2] * u),
    ];
  }
  const u = (clamp - 0.5) / 0.5;
  return [
    Math.round(mid[0] * (1 - u) + hot[0] * u),
    Math.round(mid[1] * (1 - u) + hot[1] * u),
    Math.round(mid[2] * (1 - u) + hot[2] * u),
  ];
}

type LRLInvariantBadgeProps = {
  telemetry?: {
    eccentricity: number;
    periapsisDeg: number;
    magnitude: number;
  } | null;
};

function formatHeading(deg?: number) {
  if (deg == null || !Number.isFinite(deg)) return "-";
  return `${deg.toFixed(1)}°`;
}

function formatEccentricity(value?: number) {
  if (value == null || !Number.isFinite(value)) return "-";
  return value < 1e-3 ? value.toExponential(2) : value.toFixed(3);
}

function LRLInvariantBadge({ telemetry }: LRLInvariantBadgeProps) {
  const ecc = telemetry?.eccentricity;
  const heading = telemetry?.periapsisDeg;
  const locked = typeof ecc === "number" && ecc < 0.15;
  const drift = typeof ecc === "number" && ecc >= 0.35;
  const status = !telemetry
    ? "Calibrating LRL vector…"
    : locked
      ? "Orbital focus lock"
      : drift
        ? "LRL drift detected"
        : "Tracking periapsis heading";
  const statusColor = !telemetry
    ? "text-slate-300"
    : locked
      ? "text-emerald-300"
      : drift
        ? "text-amber-300"
        : "text-cyan-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-slate-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400">LRL invariant</div>
          <div className={`text-sm font-semibold ${statusColor}`}>{status}</div>
          <p className="text-xs text-slate-400">
            Least-action lock derived from Maupertuis ↔ Runge–Lenz diagnostics.
          </p>
        </div>
        <LRLDocsTooltip />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-slate-400">Eccentricity</dt>
          <dd className="text-base text-slate-100">{formatEccentricity(ecc)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Periapsis heading</dt>
          <dd className="text-base text-slate-100">{formatHeading(heading)}</dd>
        </div>
      </dl>
    </div>
  );
}
