import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { SliceViewer, type Vec3 } from "@/components/SliceViewer";
import { useEnergyPipeline, PIPE_CONST } from "@/hooks/use-energy-pipeline";
import { useMetrics } from "@/hooks/use-metrics";

const FALLBACK_DRIVE_DIR: Vec3 = [1, 0, 0];

const isVec3 = (value: unknown): value is Vec3 =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((component) => typeof component === "number" && Number.isFinite(component));

const normalizeVec3Safe = (vec: Vec3): Vec3 => {
  const mag = Math.hypot(vec[0], vec[1], vec[2]);
  if (!Number.isFinite(mag) || mag === 0) {
    return [...FALLBACK_DRIVE_DIR] as Vec3;
  }
  return [vec[0] / mag, vec[1] / mag, vec[2] / mag];
};

export default function CurvatureSlicePanel() {
  // Live pipeline (server authority)
  const { data: live } = useEnergyPipeline();

  // Hull geometry (slow polling is fine)
  const { data: hullMetrics } = useMetrics(20000);

  // Responsive canvas sizing
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 320 });
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const w = Math.max(320, Math.min(820, Math.floor(e.contentRect.width)));
      const h = Math.round(w / 1.8);
      setSize({ w, h });
    });
    if (hostRef.current) ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, []);

  // Hull → semi-axes [a,b,c] in meters
  const hull = useMemo(() => {
    const H = (hullMetrics && hullMetrics.hull) || null;
    return H
      ? [H.a ?? H.Lx_m/2, H.b ?? H.Ly_m/2, H.c ?? H.Lz_m/2]
      : [503.5, 132.0, 86.5];
  }, [hullMetrics]);
  const hullVec = hull as unknown as [number, number, number];

  // Concurrent/total sectors (for FR fallback). Total = paper 400.
  const totalSectors = 400;
  const concurrentSectors = useMemo(() => {
    // Prefer explicit "how many are ON right now?"
    const liveFromMetrics  = Number.isFinite(live?.activeSectors) ? Number(live?.activeSectors) : undefined;
    const liveFromPipeline = Number.isFinite(live?.sectorsConcurrent) ? Number(live?.sectorsConcurrent) : undefined;

    const S_total = Math.max(1, Number(totalSectors) || 400);
    // Our strobe energizes exactly ONE sector at a time
    const S_live = Math.max(1, Math.min(S_total, liveFromMetrics ?? liveFromPipeline ?? 1));
    return S_live; // ← will be 1 in Hover/Cruise; clamp prevents 400/400
  }, [live?.activeSectors, live?.sectorsConcurrent, totalSectors]);
  const concurrent = concurrentSectors;

  // REAL ship-wide FR duty (server > computed fallback)
  const mode = String(live?.currentMode || "hover").toLowerCase();
  const isStandby = mode === "standby";
  const dutyFR = useMemo(() => {
    if (isStandby) return 0;
    const frFromPipeline =
      live?.dutyEffectiveFR ??
      live?.dutyShip ??
      live?.dutyEff;

    if (Number.isFinite(frFromPipeline)) return Math.max(0, Math.min(1, Number(frFromPipeline)));

    const burst = Number(live?.burst_ms);
    const dwell = Number(live?.dwell_ms);
    const dutyLocal = (Number.isFinite(burst) && Number.isFinite(dwell) && dwell > 0)
      ? burst / dwell : 0.01;

    const S_total = Math.max(1, Math.floor(totalSectors || 400));
    const S_live  = Math.max(1, Math.min(S_total, Math.floor(concurrentSectors || 1)));

    return Math.max(0, Math.min(1, dutyLocal * (S_live / S_total))); // ← with S_live=1 this is 0.01/400
  }, [live, isStandby, concurrentSectors, totalSectors]);

  // Physics chain from pipeline (keep unity-safe minimums)
  const gammaGeo = Number.isFinite(live?.gammaGeo) ? Number(live!.gammaGeo) : 26;
  const qSpoil   = Number.isFinite(live?.qSpoilingFactor) ? Number(live!.qSpoilingFactor) : 1;
  const gammaVdB = Math.max(1, Number.isFinite(live?.gammaVanDenBroeck) ? Number(live!.gammaVanDenBroeck) : 1.4e5);
  const dutyUI   = Number.isFinite(live?.dutyCycle) ? Number(live!.dutyCycle) : 0.14;

  const driveDirVec = useMemo<Vec3>(() => {
    const metricsVecRaw = hullMetrics?.shiftVector?.betaTiltVec;
    const pipelineVecRaw = live?.driveDir;
    const candidate =
      (metricsVecRaw && isVec3(metricsVecRaw) ? metricsVecRaw : null) ??
      (pipelineVecRaw && isVec3(pipelineVecRaw) ? pipelineVecRaw : null) ??
      FALLBACK_DRIVE_DIR;
    return normalizeVec3Safe(candidate);
  }, [hullMetrics, live?.driveDir]);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="flex flex-col gap-1 text-sm font-semibold sm:flex-row sm:items-center sm:gap-2">
          Equatorial Curvature Slice (REAL, to-scale)
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm">
              <div className="font-medium text-yellow-300 mb-1">Physics</div>
              <p className="mb-2">
                True parity view: θ proxy scales as γ³ · (ΔA/A) · γ<sub>VdB</sub> · √(duty<sub>FR</sub>).
                No boosts. Averaging uses ship-wide Ford–Roman duty.
              </p>
              <div className="font-medium text-cyan-300 mb-1">Scale</div>
              <p className="text-xs">Wall thickness is converted to ρ-units from meter-scale hull axes.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardDescription>
          Uses live pipeline values; curvature goes to zero only in <span className="font-mono">standby</span>.
        </CardDescription>
      </CardHeader>
      <CardContent ref={hostRef}>
        <SliceViewer
          // canvas
          width={size.w}
          height={size.h}
          className="bg-slate-950/60"

          // geometry
          hullAxes={hullVec}
          wallWidth_m={6.0}

          // REAL parity chain (no boosts)
          physicsParityMode={true}
          viewAvg={true}
          dutyEffectiveFR={dutyFR}
          driveDir={driveDirVec}

          gammaGeo={gammaGeo}
          qSpoilingFactor={qSpoil}
          gammaVdB={gammaVdB}
          dutyCycle={dutyUI}
          sectors={totalSectors}
          // visual controls: conservative, readable parity defaults
          sigmaRange={6}
          exposure={5.0}
          zeroStop={1e-6}
          showContours={true}
          curvatureGain={0}
          curvatureBoostMax={1}
        />
        <div className="mt-2 break-words text-[10px] font-mono leading-4 text-slate-400">
          mode={mode} | FR-duty={Number.isFinite(dutyFR) ? dutyFR.toExponential(2) : "-"} | I3A3={Number.isFinite(gammaGeo) ? Math.pow(gammaGeo, 3).toExponential(2) : "-"} | qSpoil={Number.isFinite(qSpoil) ? qSpoil.toFixed(3) : "-"} | I3_VdB={Number.isFinite(gammaVdB) ? gammaVdB.toExponential(1) : "-"}
        </div>
      </CardContent>
    </Card>
  );
}



