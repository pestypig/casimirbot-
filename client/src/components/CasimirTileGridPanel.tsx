// client/src/components/CasimirTileGridPanel.tsx
import * as React from "react";

type Metrics = {
  totalTiles: number;
  sectorStrobing: number;     // how many sectors are on at an instant (1 for hover/cruise in your model)
  totalSectors: number;       // e.g., 400 in cruise
  tilesPerSector: number;     // totalTiles / totalSectors
  currentSector: number;      // physics-timed index
  strobeHz: number;           // e.g., 2000
  sectorPeriod_ms: number;    // e.g., 0.5
  overallStatus?: "NOMINAL" | "WARNING" | "CRITICAL" | "CHECK";
};

export function CasimirTileGridPanel({
  metrics,
  width = 320,
  height = 170,
  dark = true,
}: {
  metrics: Metrics;
  width?: number;
  height?: number;
  dark?: boolean;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  // fade trail store
  const trail = React.useRef<number[]>([]);
  const lastStamp = React.useRef<number>(0);

  // compute a nice grid that fits totalSectors (<= 20x20)
  const { rows, cols } = React.useMemo(() => {
    const n = Math.max(1, Math.min(400, metrics.totalSectors));
    // prefer a near-square grid, favor more columns
    let best = { rows: 1, cols: n, score: Infinity };
    for (let r = 1; r <= Math.min(20, n); r++) {
      const c = Math.ceil(n / r);
      if (c > 20) continue;
      const score = Math.abs(c - r); // squareness
      if (score < best.score) best = { rows: r, cols: c, score };
    }
    return { rows: best.rows, cols: best.cols };
  }, [metrics.totalSectors]);

  // normalize current sector into [0, totalSectors)
  const sectorIndex = ((metrics.currentSector % metrics.totalSectors) + metrics.totalSectors) % metrics.totalSectors;

  // draw
  React.useEffect(() => {
    const cvs = ref.current; if (!cvs) return;
    const ctx = cvs.getContext("2d")!;

    const dpr = window.devicePixelRatio || 1;
    cvs.width = Math.floor(width * dpr);
    cvs.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pad = 10;
    const legendH = 30;
    const w = width - pad*2;
    const h = height - pad*2 - legendH;
    const x0 = pad, y0 = pad;

    // cell geometry
    const cellW = w / cols;
    const cellH = h / rows;
    const gap = Math.max(0, Math.min(2, Math.floor(Math.min(cellW, cellH) * 0.08)));
    const innerW = cellW - gap, innerH = cellH - gap;

    // clear
    ctx.fillStyle = dark ? "#0a0f1a" : "#0b1220";
    ctx.fillRect(0, 0, width, height);

    // frame
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.strokeRect(x0 - 2, y0 - 2, w + 4, h + 4);

    const N = metrics.totalSectors;

    // lazy-init trail
    if (!trail.current.length || trail.current.length !== N) {
      trail.current = new Array(N).fill(0);
    }

    // trail decay based on elapsed time
    const now = performance.now();
    const dt = lastStamp.current ? (now - lastStamp.current) / 1000 : 0;
    lastStamp.current = now;
    const decay = Math.exp(-dt * 6); // faster decay → shorter trail
    for (let i = 0; i < N; i++) trail.current[i] *= decay;
    // mark current active sectors (could be >1 if sectorStrobing>1)
    for (let k = 0; k < metrics.sectorStrobing; k++) {
      const idx = (sectorIndex + k) % N;
      trail.current[idx] = 1;
    }

    // compute per-sector instantaneous fill (how many tiles of that sector are energized *now*)
    // In your physics, at any instant only `sectorStrobing` sectors are on:
    // fractionOn = sectorStrobing / totalSectors
    const fracOn = Math.min(1, Math.max(0, metrics.sectorStrobing / metrics.totalSectors));

    for (let r = 0, s = 0; r < rows; r++) {
      for (let c = 0; c < cols && s < N; c++, s++) {
        const x = x0 + c * cellW + gap/2;
        const y = y0 + r * cellH + gap/2;

        // base tile background
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(x, y, innerW, innerH);

        // fill proportional to fracOn (vertical fill from bottom)
        const fillH = innerH * fracOn;
        ctx.fillStyle = "rgba(100, 220, 255, 0.18)";
        ctx.fillRect(x, y + (innerH - fillH), innerW, fillH);

        // active/trail overlay
        const t = trail.current[s]; // [0..1]
        if (t > 0.01) {
          // active
          const g = Math.floor(180 + 60 * t);
          ctx.fillStyle = `rgba(80, ${g}, 120, ${0.30 + 0.5 * t})`;
          ctx.fillRect(x, y, innerW, innerH);
          // rim
          ctx.strokeStyle = `rgba(120, 240, 255, ${0.4 + 0.5 * t})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, innerW - 1, innerH - 1);
        }
      }
    }

    // legend
    const Lx = x0, Ly = y0 + h + 10;
    ctx.font = "11px ui-sans-serif, system-ui, Segoe UI, Roboto";
    ctx.textBaseline = "top";

    const txt = [
      `Sectors: ${metrics.sectorStrobing}/${metrics.totalSectors}`,
      `Tiles/sector: ${metrics.tilesPerSector.toLocaleString()}`,
      `Active fraction: ${(fracOn*100).toFixed(5)}%`,
      `Sweep: ${(metrics.strobeHz).toLocaleString()} Hz`,
    ];

    let cx = Lx;
    const chips = (label: string, color: string) => {
      const w = ctx.measureText(label).width + 14;
      ctx.fillStyle = `rgba(255,255,255,0.06)`;
      ctx.fillRect(cx, Ly, w, 18);
      ctx.fillStyle = color;
      ctx.fillRect(cx + 6, Ly + 6, 6, 6);
      ctx.fillStyle = "rgba(240,240,255,0.9)";
      ctx.fillText(label, cx + 16, Ly + 3);
      cx += w + 6;
    };

    chips(txt[0], "rgba(120,220,255,1)");
    chips(txt[1], "rgba(220,180,255,1)");
    chips(txt[2], "rgba(180,255,200,1)");
    chips(txt[3], "rgba(255,220,160,1)");
  }, [metrics, width, height, rows, cols, dark]);

  // lightweight animation loop – we only redraw when sector changes.
  React.useEffect(() => {
    let raf = 0;
    let lastSector = -1;

    const tick = () => {
      // if backend increments currentSector at strobeHz, this will trigger effect above via prop change.
      // If not, uncomment below to synthesize client-side:
      // const t = performance.now() * 0.001;
      // const idx = Math.floor((t * metrics.strobeHz) % metrics.totalSectors);
      // if (idx !== lastSector) setLocalSector(idx);

      if (metrics.currentSector !== lastSector) {
        lastSector = metrics.currentSector;
        // force effect to run by nudging state? Not needed: parent should pass updated metrics.
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [metrics.currentSector, metrics.strobeHz, metrics.totalSectors]);

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-2">
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="text-[12px] font-medium text-white/90">Casimir Tile Grid</div>
        <div className="text-[11px] text-white/60">
          {metrics.sectorStrobing}/{metrics.totalSectors} sectors • {metrics.strobeHz.toLocaleString()} Hz
        </div>
      </div>
      <canvas ref={ref} style={{ width, height, display: "block" }} />
    </div>
  );
}