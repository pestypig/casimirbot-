import React, { useMemo } from "react";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";

type Role = "neg" | "pos" | "neutral";
type Sampler = "gaussian" | "lorentzian";

const ROLE_COLOR: Record<Role, string> = {
  neg: "#2979ff",
  pos: "#ff9800",
  neutral: "#9e9e9e",
};

const STROKE = "rgba(255,255,255,0.18)";
const HOVER_STROKE = "rgba(255,255,255,0.35)";

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function ringSectorPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
) {
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const p0 = polarToCartesian(cx, cy, rOuter, startDeg);
  const p1 = polarToCartesian(cx, cy, rOuter, endDeg);
  const p2 = polarToCartesian(cx, cy, rInner, endDeg);
  const p3 = polarToCartesian(cx, cy, rInner, startDeg);

  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

function gaussianKernel(t: number, tau: number) {
  return Math.exp(-(t * t) / (2 * tau * tau));
}

function lorentzianKernel(t: number, tau: number) {
  return 1 / (1 + (t * t) / (tau * tau));
}

export interface SectorRolesHudProps {
  size?: number;
  ringWidth?: number;
  showQiWindow?: boolean;
}

export const SectorRolesHud: React.FC<SectorRolesHudProps> = ({
  size = 360,
  ringWidth = 32,
  showQiWindow = true,
}) => {
  const pipeline = useEnergyPipeline();
  const state = pipeline.data;
  const telemetry = state?.phaseSchedule ?? null;
  const qi = state?.qi ?? null;

  const rawN = typeof telemetry?.N === "number" ? telemetry.N : undefined;
  const N =
    rawN && Number.isFinite(rawN) && rawN > 0 ? Math.max(1, Math.floor(rawN)) : 0;
  const sectorPeriod = telemetry?.sectorPeriod_ms ?? 1;
  const phase01 = telemetry?.phase01 ?? 0;
  const phiBySector = telemetry?.phi_deg_by_sector ?? [];
  const negSectors = telemetry?.negSectors ?? [];
  const posSectors = telemetry?.posSectors ?? [];
  const sampler = (telemetry?.sampler ?? qi?.sampler ?? "gaussian") as Sampler;
  const tauMs = telemetry?.tau_s_ms ?? qi?.tau_s_ms ?? 5;
  const weightsFromServer = telemetry?.weights ?? undefined;
  const sectorDeg = N > 0 ? 360 / Math.max(1, N) : 0;

  const sectors = useMemo(() => {
    if (N <= 0) return [];
    const negSet = new Set<number>(negSectors);
    const posSet = new Set<number>(posSectors);
    return Array.from({ length: N }, (_, k) => {
      const centerDeg = (k / N - phase01) * 360 - 90;
      const startDeg = centerDeg - sectorDeg / 2;
      const endDeg = centerDeg + sectorDeg / 2;
      const role: Role = negSet.has(k) ? "neg" : posSet.has(k) ? "pos" : "neutral";
      const phi = phiBySector[k] ?? 0;
      return { k, startDeg, endDeg, centerDeg, role, phi };
    });
  }, [N, phase01, sectorDeg, phiBySector, negSectors, posSectors]);

  const normalizedWeights = useMemo(() => {
    if (N <= 0) return [];
    if (Array.isArray(weightsFromServer) && weightsFromServer.length === N) {
      const maxW = weightsFromServer.reduce(
        (max: number, value: number) => (value > max ? value : max),
        0,
      );
      return weightsFromServer.map((value: number) => (maxW > 0 ? value / maxW : 0));
    }

    const tau = tauMs > 0 ? tauMs : 1;
    const arr: number[] = new Array(N).fill(0);
    let maxW = 0;
    for (const sector of sectors) {
      const tMs = ((sector.centerDeg + 90) / 360) * sectorPeriod;
      const weight = sampler === "gaussian" ? gaussianKernel(tMs, tau) : lorentzianKernel(tMs, tau);
      arr[sector.k] = weight;
      if (weight > maxW) maxW = weight;
    }
    return arr.map((value) => (maxW > 0 ? value / maxW : 0));
  }, [weightsFromServer, N, sampler, sectors, tauMs, sectorPeriod]);

  if (!telemetry || N <= 0) {
    return null;
  }

  const pad = 8;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - pad;
  const rInner = rOuter - ringWidth;
  const windowDeg =
    sectorPeriod > 0 ? Math.min(360, (8 * tauMs / sectorPeriod) * 360) : 360;
  const qiStart = -90 - windowDeg / 2;
  const qiEnd = -90 + windowDeg / 2;

  return (
    <div
      role="img"
      aria-label="Sector roles and QI window on ring"
      style={{
        display: "grid",
        gap: 10,
        justifyItems: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: 12 }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={(rOuter + rInner) / 2}
          fill="rgba(255,255,255,0.03)"
          stroke={STROKE}
          strokeWidth={1}
        />

        {showQiWindow && windowDeg > 2 && (
          <path
            d={ringSectorPath(cx, cy, rOuter + 1, rInner - 1, qiStart, qiEnd)}
            fill="rgba(255,255,255,0.25)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
          >
            <title>
              {`QI window ~ ${windowDeg.toFixed(1)} deg (approx ${(8 * tauMs).toFixed(1)} ms) | sampler=${sampler}`}
            </title>
          </path>
        )}

        {sectors.map((sector) => {
          const fill = sector.role === "neutral" ? "rgba(158,158,158,0.35)" : ROLE_COLOR[sector.role];
          const phiTarget = sector.centerDeg + sector.phi;
          const arrowPoint = polarToCartesian(cx, cy, rInner - 10, phiTarget);
          return (
            <g key={sector.k} tabIndex={0}>
              <path
                d={ringSectorPath(cx, cy, rOuter, rInner, sector.startDeg, sector.endDeg)}
                fill={fill}
                stroke={STROKE}
                strokeWidth={1}
                style={{ transition: "fill 120ms ease" }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.stroke = HOVER_STROKE;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.stroke = STROKE;
                }}
              >
                <title>
                  {[
                    `Sector ${sector.k}`,
                    `Role: ${sector.role.toUpperCase()}`,
                    `phi_k: ${Math.round(sector.phi)} deg`,
                    `Kernel weight: ${(normalizedWeights[sector.k] ?? 0).toFixed(3)}`,
                  ].join(" | ")}
                </title>
              </path>
              <line
                x1={cx}
                y1={cy}
                x2={arrowPoint.x}
                y2={arrowPoint.y}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={1}
                strokeLinecap="round"
              />
              <circle cx={arrowPoint.x} cy={arrowPoint.y} r={1.8} fill="rgba(255,255,255,0.8)" />
            </g>
          );
        })}

        <line
          x1={cx}
          y1={cy - (rOuter + 4)}
          x2={cx}
          y2={cy - (rInner - 4)}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>

      <div style={{ fontSize: 12, opacity: 0.8 }}>
        <span style={{ marginRight: 10 }}>Now (top)</span>
        <span style={{ marginRight: 10 }}>N={N}</span>
        <span style={{ marginRight: 10 }}>tau_s={tauMs.toFixed(2)} ms</span>
        <span>sampler={sampler}</span>
      </div>
    </div>
  );
};

export default SectorRolesHud;
