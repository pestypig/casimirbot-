import React, { useEffect, useRef } from "react";

type Props = {
  // From pipeline (meters unless noted)
  pocketDiameter_um: number;  // e.g. 40
  sag_nm: number;             // e.g. 16
  gap_nm: number;             // e.g. 1
  topMirror_thick_um: number; // e.g. 1.5
  botMirror_thick_um: number; // e.g. 1.5
  alnRim_width_um: number;    // e.g. 20
  tileWidth_mm: number;       // for scale text (optional)
  physicsParity?: boolean;    // if true, force γ=1, stroke=0
  onWindow?: boolean;         // light-crossing ON window
  stroke_pm?: number;         // ±50 pm
  width?: number;
  height?: number;
};

export default function CavitySideView({
  pocketDiameter_um,
  sag_nm,
  gap_nm,
  topMirror_thick_um,
  botMirror_thick_um,
  alnRim_width_um,
  tileWidth_mm,
  physicsParity = false,
  onWindow = false,
  stroke_pm = 50,
  width = 820,
  height = 260,
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  // --- units -> meters
  const D = pocketDiameter_um * 1e-6;
  const t = (physicsParity ? 0 : sag_nm * 1e-9);
  const a = gap_nm * 1e-9;
  const a_eff = Math.max(1e-12, a - t);
  const gamma_geo = physicsParity ? 1 : a / a_eff;

  const topT = topMirror_thick_um * 1e-6;
  const botT = botMirror_thick_um * 1e-6;
  const rimW = alnRim_width_um * 1e-6;

  // ± stroke (meters) only during ON window
  const zStroke = (physicsParity || !onWindow) ? 0 : (stroke_pm * 1e-12);

  // choose scale to fit vertical stack with padding
  const pad = 20;
  const Hphys = topT + a + botT + Math.max(0, t); // vertical extent we'll draw
  const pxPerM = (height - 2 * pad) / (Hphys * 1.2);
  const Wpocket = Math.max(300, Math.min(width - 2 * pad, D * pxPerM * 3)); // wide enough to show labels

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, width, height);

    const x0 = (width - Wpocket) / 2;
    let y = pad;

    // helper
    const toPx = (m: number) => m * pxPerM;

    // Top mirror (graphene+Nb3Sn)
    ctx.fillStyle = "#777c86";
    ctx.fillRect(x0, y - toPx(zStroke), Wpocket, toPx(topT));
    // label
    label(ctx, x0 + 6, y + toPx(topT/2) - toPx(zStroke), "Graphene + Nb₃Sn (moving)", "#e5e7eb");

    // Vacuum gap
    y += toPx(topT);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x0, y - toPx(zStroke), Wpocket, toPx(a));
    
    // bowl (spherical cap) carved into lower mirror: draw orange pocket
    const pocketHeight = toPx(t);
    if (pocketHeight > 0) {
      const pocketWidth = toPx(D);
      const pxR = (D*D + 4*t*t) / (8*t) * pxPerM; // spherical-cap radius (approx)
      const cx = x0 + Wpocket/2;
      const cy = y - toPx(zStroke) + toPx(a) + pocketHeight - pxR; // circle center
      ctx.fillStyle = "rgba(255,153,51,0.85)";
      ctx.beginPath();
      ctx.arc(cx, cy, pxR, Math.PI - Math.asin((pocketWidth/2)/pxR), Math.PI + Math.asin((pocketWidth/2)/pxR));
      ctx.lineTo(cx + pocketWidth/2, y - toPx(zStroke) + toPx(a));
      ctx.lineTo(cx - pocketWidth/2, y - toPx(zStroke) + toPx(a));
      ctx.closePath();
      ctx.fill();
      label(ctx, cx + pocketWidth/2 + 8, y + toPx(a/2) - toPx(zStroke), `Pocket: D=${(pocketDiameter_um).toFixed(0)} µm, sag=${sag_nm} nm`, "#fbbf24");
    }

    // Gap ruler line and labels
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 1;
    const gapY = y - toPx(zStroke);
    ctx.beginPath();
    ctx.moveTo(x0 - 30, gapY);
    ctx.lineTo(x0 - 10, gapY);
    ctx.moveTo(x0 - 30, gapY + toPx(a));
    ctx.lineTo(x0 - 10, gapY + toPx(a));
    ctx.moveTo(x0 - 20, gapY);
    ctx.lineTo(x0 - 20, gapY + toPx(a));
    ctx.stroke();
    
    // fixed mirror substrate (Nb3Sn on SiC)
    y += toPx(a);
    ctx.fillStyle = "#666c78";
    ctx.fillRect(x0, y, Wpocket, toPx(botT));
    label(ctx, x0 + 6, y + toPx(botT/2), "Nb₃Sn (fixed) on SiC", "#e5e7eb");

    // AlN rim actuator band (schematic top view tick)
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.strokeRect(x0 + 8, pad + 4, Wpocket - 16, 10);
    label(ctx, x0 + Wpocket - 160, pad + 18, `AlN rim (≈ ${alnRim_width_um} µm)`, "#93c5fd");

    // Gap rulers + γgeo
    ctx.fillStyle = "#e2e8f0";
    label(ctx, x0 + 6, height - 28, `gap a=${gap_nm} nm, a_eff=${(a_eff*1e9).toFixed(2)} nm, γ_geo=${gamma_geo.toFixed(2)}`, "#a3e635");

    // Blue-shift region indicator
    if (pocketHeight > 0) {
      label(ctx, x0 + Wpocket/2 - 60, y - toPx(a) - 8, "Blue-shift region", "#fbbf24");
    }

    // Nano-pillars hint (tick marks)
    const nPillars = 10;
    const step = (Wpocket - 40)/nPillars;
    ctx.fillStyle = "rgba(100,180,255,0.8)";
    for (let i=0;i<nPillars;i++){
      const px = x0 + 20 + i*step;
      ctx.fillRect(px, y - toPx(a) + 2, 2, 6);
    }

    // ON/OFF indicator
    ctx.fillStyle = onWindow ? "#22d3ee" : "#475569";
    ctx.beginPath();
    ctx.arc(width - 24, 24, 6, 0, 2*Math.PI);
    ctx.fill();
    label(ctx, width - 60, 30, onWindow ? "ON" : "OFF", onWindow ? "#22d3ee" : "#475569");

    // Scale reference
    label(ctx, x0 + 6, height - 12, `Scale: ${(pxPerM/1e6).toFixed(1)} px/µm | Tile: ${tileWidth_mm}×${tileWidth_mm} mm`, "#64748b");

  }, [width, height, Wpocket, pxPerM, D, t, a, a_eff, gamma_geo, topT, botT, rimW, zStroke, onWindow, pocketDiameter_um, sag_nm, gap_nm, alnRim_width_um, tileWidth_mm]);

  return (
    <canvas 
      ref={ref} 
      width={width} 
      height={height} 
      className="w-full h-auto rounded-lg ring-1 ring-slate-800" 
    />
  );
}

function label(ctx:CanvasRenderingContext2D, x:number, y:number, text:string, color="#e5e7eb"){
  ctx.fillStyle = color;
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}