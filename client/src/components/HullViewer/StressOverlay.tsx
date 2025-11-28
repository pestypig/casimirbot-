import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { QiDiagnosticsPayload } from "@shared/qi-diagnostics";

type Props = {
  enabled: boolean;
  className?: string;
  defaultRadius?: number;
  defaultWeights?: [number, number, number];
  floating?: boolean;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const fmtPct = (v: number | null | undefined) =>
  Number.isFinite(v as number) ? `${Math.max(0, Math.min(100, (v as number) * 100)).toFixed(1)}%` : "--";

const hueScale = (v: number) => {
  const t = clamp01(v);
  const h = (1 - t) * 220; // blue -> red
  const s = 70;
  const l = 35 + 25 * t;
  return `hsl(${h.toFixed(1)}deg ${s}% ${l}%)`;
};

export function StressOverlay({
  enabled,
  className,
  defaultRadius = 0.5,
  defaultWeights = [0.4, 0.3, 0.3],
  floating = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [radius, setRadius] = useState(defaultRadius);
  const [weightsDial, setWeightsDial] = useState<[number, number, number]>(defaultWeights);

  const weights = useMemo<[number, number, number]>(() => {
    const w1 = clamp01(weightsDial[0]);
    const w2 = clamp01(weightsDial[1]);
    const w3 = clamp01(weightsDial[2]);
    const sum = w1 + w2 + w3;
    if (sum <= 0) return [0.4, 0.3, 0.3];
    return [w1 / sum, w2 / sum, w3 / sum];
  }, [weightsDial]);

  const { data, isFetching } = useQuery({
    queryKey: ["/api/helix/qi/diagnostics", radius, ...weights],
    enabled,
    refetchInterval: enabled ? 1000 : false,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        radius: radius.toString(),
        weights: weights.join(","),
      });
      const res = await apiRequest("GET", `/api/helix/qi/diagnostics?${params.toString()}`, undefined, signal);
      return (await res.json()) as QiDiagnosticsPayload;
    },
  });

  const summary = useMemo(() => {
    if (!data?.csi?.length) {
      return { mean: 0, max: 0, high: 0, tiles: 0 };
    }
    const arr = data.csi;
    const tiles = Math.max(arr.length, 1);
    const mean = arr.reduce((a, b) => a + b, 0) / tiles;
    const max = arr.reduce((a, b) => (b > a ? b : a), -Infinity);
    const high = data.pi_fr?.filter((v) => v >= 0.8).length ?? 0;
    return { mean, max, high, tiles };
  }, [data]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const W = 260;
    const H = 180;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    cvs.width = Math.floor(W * dpr);
    cvs.height = Math.floor(H * dpr);
    cvs.style.width = `${W}px`;
    cvs.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(6,12,24,0.75)";
    ctx.fillRect(0, 0, W, H);

    if (!enabled || !data?.tiles?.length) {
      ctx.fillStyle = "rgba(200,220,255,0.5)";
      ctx.font = "11px ui-sans-serif, system-ui";
      ctx.fillText(enabled ? "Waiting for diagnostics..." : "Enable CSI overlay", 12, 20);
      return;
    }

    const tiles = data.tiles;
    const vals = data.csi || [];
    const pi = data.pi_fr || [];
    const xs = tiles.map((t) => t.pos[0]);
    const zs = tiles.map((t) => t.pos[2]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const spanX = Math.max(1e-3, maxX - minX);
    const spanZ = Math.max(1e-3, maxZ - minZ);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    for (let i = 0; i < tiles.length; i++) {
      const [x, , z] = tiles[i].pos;
      const u = (x - minX) / spanX;
      const v = (z - minZ) / spanZ;
      const px = 12 + u * (W - 24);
      const py = 12 + v * (H - 24);
      const csi = clamp01(vals[i] ?? 0);
      const rad = 3 + 4 * csi;
      ctx.fillStyle = hueScale(csi);
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
      const p = pi[i] ?? 0;
      if (p >= 0.8) {
        ctx.strokeStyle = "rgba(255,120,120,0.9)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    const grad = ctx.createLinearGradient(12, H - 14, W - 12, H - 14);
    grad.addColorStop(0, hueScale(0));
    grad.addColorStop(1, hueScale(1));
    ctx.fillStyle = grad;
    ctx.fillRect(12, H - 16, W - 24, 6);
    ctx.fillStyle = "rgba(220,230,255,0.8)";
    ctx.font = "10px ui-sans-serif, system-ui";
    ctx.fillText("CSI low", 12, H - 20);
    const txt = "CSI high / pi_FR >= 0.8 highlighted";
    ctx.fillText(txt, W - ctx.measureText(txt).width - 12, H - 20);
  }, [data, enabled]);

  const wDisplay = weights.map((w) => `${Math.round(w * 100)}%`);

  const containerClass = floating
    ? "pointer-events-auto absolute right-3 top-3 flex w-[300px] flex-col gap-2 rounded-lg border border-emerald-700/40 bg-slate-950/75 p-3 shadow-lg backdrop-blur"
    : "pointer-events-auto relative flex w-full max-w-md flex-col gap-2 rounded-lg border border-emerald-700/40 bg-slate-950/75 p-3 shadow-lg";

  return (
    <div className={cn(containerClass, !enabled && "opacity-70", className)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-emerald-200">Stress Map (CSI)</div>
          <div className="text-[11px] text-slate-400">
            zeta {fmtPct(data?.meta?.zeta)} / d_eff {fmtPct(data?.meta?.dutyEffectiveFR)} / tau{" "}
            {data?.meta?.tau_ms ? `${data.meta.tau_ms.toFixed(2)} ms` : "--"}
          </div>
        </div>
        <span className="rounded bg-emerald-900/40 px-2 py-1 text-[10px] text-emerald-100">
          {isFetching ? "updating..." : `${summary.tiles} tiles`}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-300">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">Neighbor radius (m)</span>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={radius}
            onChange={(event) => setRadius(parseFloat(event.target.value))}
            className="accent-emerald-500"
          />
          <span className="font-mono text-[10px] text-slate-300">{radius.toFixed(2)} m</span>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-200">
        {["grad_phi", "Var[rho_C]", "pi_FR"].map((label, idx) => (
          <div key={label} className="flex flex-col gap-1 rounded bg-slate-900/70 px-2 py-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-100">{label}</span>
              <span className="text-[10px] text-slate-400">{wDisplay[idx]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={weightsDial[idx]}
              onChange={(event) => {
                const next = clamp01(parseFloat(event.target.value));
                setWeightsDial((prev) => {
                  const copy = [...prev] as [number, number, number];
                  copy[idx] = next;
                  return copy;
                });
              }}
              className="accent-emerald-500"
            />
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className="mt-1 rounded bg-black/40" />

      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-200">
        <div className="rounded bg-slate-900/70 px-2 py-1">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Mean CSI</div>
          <div className="font-mono text-emerald-100">{summary.mean.toFixed(3)}</div>
        </div>
        <div className="rounded bg-slate-900/70 px-2 py-1">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Peak CSI</div>
          <div className="font-mono text-amber-100">{summary.max.toFixed(3)}</div>
        </div>
        <div className="rounded bg-slate-900/70 px-2 py-1">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">pi_FR &gt;= 0.8</div>
          <div className="font-mono text-red-100">{summary.high}</div>
        </div>
      </div>
    </div>
  );
}

export default StressOverlay;
