// client/src/components/CasimirTileGridPanel.tsx

import * as React from "react";
import { useQuery } from "@tanstack/react-query";



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



const DEFAULT_METRICS: Metrics = {

  totalTiles: 0,

  sectorStrobing: 0,

  totalSectors: 1,

  tilesPerSector: 0,

  currentSector: 0,

  strobeHz: 0,

  sectorPeriod_ms: 0,

  overallStatus: "CHECK"

};



export function CasimirTileGridPanel({

  metrics: metricsProp,

  width: widthProp,

  height: heightProp,

  dark = true,

  onSectorFocus,

  pulseSector,

}: {

  metrics?: Metrics | null;

  width?: number;

  height?: number;

  dark?: boolean;

  onSectorFocus?: (sector: number | null) => void;

  pulseSector?: number | null;

}) {

  const { data: metricsFromQuery } = useQuery<Metrics | null>({

    queryKey: ["/api/helix/metrics"],

    refetchInterval: 1000,

    enabled: !metricsProp,

  });

  const liveMetrics = metricsProp ?? metricsFromQuery ?? null;

  const num = React.useCallback((value: unknown, fallback = 0) => {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
  }, []);

  const resolvedMetrics: Metrics = React.useMemo(() => {
    const merged = { ...DEFAULT_METRICS, ...(liveMetrics ?? {}) } as any;
    const totalSectorsRaw = merged.totalSectors ?? merged.sectorCount ?? merged.sectorsTotal;
    const totalSectors = Math.max(1, num(totalSectorsRaw, DEFAULT_METRICS.totalSectors));

    const sectorStrobing = Math.max(
      0,
      num(
        merged.sectorStrobing ??
          merged.activeSectors ??
          merged.sectorsConcurrent ??
          merged.sectors ??
          merged.S_live,
        DEFAULT_METRICS.sectorStrobing,
      ),
    );

    const strobeHz = Math.max(0, num(merged.strobeHz ?? merged.strobe_hz, DEFAULT_METRICS.strobeHz));

    const sectorPeriod_ms = num(
      merged.sectorPeriod_ms ?? merged.lightCrossing?.dwell_ms,
      strobeHz > 0 ? 1000 / strobeHz : DEFAULT_METRICS.sectorPeriod_ms,
    );

    const totalTiles = num(merged.totalTiles, DEFAULT_METRICS.totalTiles);

    const tilesPerSector = num(
      merged.tilesPerSector ?? (totalTiles > 0 ? totalTiles / totalSectors : undefined),
      DEFAULT_METRICS.tilesPerSector,
    );

    const currentSector = Math.max(
      0,
      Math.floor(
        ((num(merged.currentSector ?? merged.sectorIdx, DEFAULT_METRICS.currentSector) % totalSectors) +
          totalSectors) %
          totalSectors,
      ),
    );

    return {
      ...merged,
      totalSectors,
      sectorStrobing,
      strobeHz,
      sectorPeriod_ms,
      tilesPerSector,
      currentSector,
    };
  }, [liveMetrics, num]);

  const totalSectors = Math.max(1, resolvedMetrics.totalSectors || 1);

  const gridSectors = Math.max(1, Math.min(400, totalSectors));

  const hasRealMetrics = Boolean(liveMetrics);

  const { sectorStrobing, tilesPerSector, strobeHz, currentSector } = resolvedMetrics;

  const ref = React.useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const explicitWidth = typeof widthProp === "number" ? widthProp : undefined;
  const explicitHeight = typeof heightProp === "number" ? heightProp : undefined;
  const needsAutoWidth = explicitWidth === undefined;
  const needsAutoHeight = explicitHeight === undefined;
  const [autoSize, setAutoSize] = React.useState(() => ({
    width: explicitWidth ?? 320,
    height: explicitHeight ?? 170,
  }));
  const canvasWidth = explicitWidth ?? autoSize.width;
  const canvasHeight = explicitHeight ?? autoSize.height;

  React.useLayoutEffect(() => {
    if (!needsAutoWidth && !needsAutoHeight) return;
    const element = canvasContainerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const clampDimension = (value: number, fallback: number) => {
      const candidate = Number.isFinite(value) ? value : fallback;
      return Math.max(120, Math.floor(candidate || fallback || 120));
    };

    const updateFromRect = (rect: DOMRectReadOnly | DOMRect) => {
      setAutoSize((prev) => {
        const nextWidth = needsAutoWidth ? clampDimension(rect.width, prev.width) : prev.width;
        const nextHeight = needsAutoHeight ? clampDimension(rect.height, prev.height) : prev.height;
        if (nextWidth === prev.width && nextHeight === prev.height) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    updateFromRect(element.getBoundingClientRect());

    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((item) => item.target === element);
      if (!entry) return;
      updateFromRect(entry.contentRect);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [needsAutoWidth, needsAutoHeight]);



  // fade trail store

  const trail = React.useRef<number[]>([]);

  const lastStamp = React.useRef<number>(0);

  const layoutRef = React.useRef<{

    x0: number;

    y0: number;

    cellW: number;

    cellH: number;

    cols: number;

    rows: number;

    usableWidth: number;

    usableHeight: number;

  } | null>(null);

  const hoverIndexRef = React.useRef<number | null>(null);

  const pulseLevelsRef = React.useRef<number[]>([]);

  const [drawNonce, setDrawNonce] = React.useState(0);

  const schedulePulseRedraw = React.useCallback(() => {

    let frames = 0;

    const step = () => {

      frames += 1;

      setDrawNonce((value) => value + 1);

      if (frames < 6) {

        requestAnimationFrame(step);

      }

    };

    requestAnimationFrame(step);

  }, []);



  // compute a nice grid that fits totalSectors (<= 20x20)

  const { rows, cols } = React.useMemo(() => {

    const n = gridSectors;

    // prefer a near-square grid, favor more columns

    let best = { rows: 1, cols: n, score: Infinity };

    for (let r = 1; r <= Math.min(20, n); r++) {

      const c = Math.ceil(n / r);

      if (c > 20) continue;

      const score = Math.abs(c - r); // squareness

      if (score < best.score) best = { rows: r, cols: c, score };

    }

    return { rows: best.rows, cols: best.cols };

  }, [gridSectors]);



  // normalize current sector into [0, totalSectors)

  const sectorIndex = ((currentSector % totalSectors) + totalSectors) % totalSectors;

  React.useEffect(() => {
    if (!Number.isFinite(pulseSector as number) || pulseSector == null) return;
    const idx = ((Math.floor(pulseSector as number) % totalSectors) + totalSectors) % totalSectors;
    if (!pulseLevelsRef.current.length || pulseLevelsRef.current.length !== totalSectors) {
      pulseLevelsRef.current = new Array(totalSectors).fill(0);
    }
    pulseLevelsRef.current[idx] = 1;
    schedulePulseRedraw();
  }, [pulseSector, totalSectors, schedulePulseRedraw]);



  // draw

  React.useEffect(() => {

    const cvs = ref.current;

    if (!cvs) return;

    const ctx = cvs.getContext("2d");

    if (!ctx || typeof ctx.clearRect !== "function") return;



    const dpr = window.devicePixelRatio || 1;

    cvs.width = Math.floor(canvasWidth * dpr);

    cvs.height = Math.floor(canvasHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);



    const pad = 10;

    const legendH = 30;

    const w = canvasWidth - pad * 2;

    const h = canvasHeight - pad * 2 - legendH;

    const x0 = pad;

    const y0 = pad;



    // cell geometry

    const cellW = w / cols;

    const cellH = h / rows;

    const gap = Math.max(0, Math.min(2, Math.floor(Math.min(cellW, cellH) * 0.08)));

    const innerW = cellW - gap;

    const innerH = cellH - gap;



    layoutRef.current = {

      x0,

      y0,

      cellW,

      cellH,

      cols,

      rows,

      usableWidth: w,

      usableHeight: h,

    };



    // clear

    ctx.fillStyle = dark ? "#0a0f1a" : "#0b1220";

    ctx.fillRect(0, 0, canvasWidth, canvasHeight);



    // frame

    ctx.strokeStyle = "rgba(255,255,255,0.06)";

    ctx.strokeRect(x0 - 2, y0 - 2, w + 4, h + 4);



    const N = totalSectors;



    if (!trail.current.length || trail.current.length !== N) {

      trail.current = new Array(N).fill(0);

    }

    if (!pulseLevelsRef.current.length || pulseLevelsRef.current.length !== N) {

      pulseLevelsRef.current = new Array(N).fill(0);

    }



    const now = performance.now();

    const dt = lastStamp.current ? (now - lastStamp.current) / 1000 : 0;

    lastStamp.current = now;

    const decay = Math.exp(-dt * 6); // faster decay + shorter trail

    for (let i = 0; i < N; i++) trail.current[i] *= decay;

    const pulseDecay = Math.exp(-dt * 5);

    for (let i = 0; i < N; i++) pulseLevelsRef.current[i] *= pulseDecay;

    for (let k = 0; k < sectorStrobing; k++) {

      const idx = (sectorIndex + k) % N;

      trail.current[idx] = 1;

    }



    const fracOn = Math.min(1, Math.max(0, sectorStrobing / totalSectors));

    const hoverIdx = hoverIndexRef.current;



    for (let r = 0, s = 0; r < rows; r++) {

      for (let c = 0; c < cols && s < N; c++, s++) {

        const x = x0 + c * cellW + gap / 2;

        const y = y0 + r * cellH + gap / 2;



        ctx.fillStyle = "rgba(255,255,255,0.04)";

        ctx.fillRect(x, y, innerW, innerH);



        const fillH = innerH * fracOn;

        ctx.fillStyle = "rgba(100, 220, 255, 0.18)";

        ctx.fillRect(x, y + (innerH - fillH), innerW, fillH);



        const tTrail = trail.current[s];

        const tPulse = pulseLevelsRef.current[s] ?? 0;

        const t = Math.max(tTrail, tPulse);

        if (t > 0.01) {

          const g = Math.floor(180 + 60 * t);

          ctx.fillStyle = `rgba(80, ${g}, 120, ${0.3 + 0.5 * t})`;

          ctx.fillRect(x, y, innerW, innerH);

          ctx.strokeStyle = `rgba(120, 240, 255, ${0.4 + 0.5 * t})`;

          ctx.lineWidth = 1;

          ctx.strokeRect(x + 0.5, y + 0.5, innerW - 1, innerH - 1);

        }



        if (hoverIdx === s) {

          ctx.lineWidth = 1.5;

          ctx.strokeStyle = "rgba(245,245,255,0.7)";

          ctx.strokeRect(x + 0.5, y + 0.5, innerW - 1, innerH - 1);

        }

      }

    }



    const Lx = x0, Ly = y0 + h + 10;

    ctx.font = "11px ui-sans-serif, system-ui, Segoe UI, Roboto";

    ctx.textBaseline = "top";



    const txt = [

      `Sectors: ${sectorStrobing}/${totalSectors}`,

      `Tiles/sector: ${(tilesPerSector || 0).toLocaleString()}`,

      `Active fraction: ${(fracOn * 100).toFixed(5)}%`,

      `Sweep: ${(strobeHz || 0).toLocaleString()} Hz`,

    ];



    let cx = Lx;

    const chips = (label: string, color: string) => {

      const chipWidth = ctx.measureText(label).width + 14;

      ctx.fillStyle = `rgba(255,255,255,0.06)`;

      ctx.fillRect(cx, Ly, chipWidth, 18);

      ctx.fillStyle = color;

      ctx.fillRect(cx + 6, Ly + 6, 6, 6);

      ctx.fillStyle = "rgba(240,240,255,0.9)";

      ctx.fillText(label, cx + 16, Ly + 3);

      cx += chipWidth + 6;

    };



    chips(txt[0], "rgba(120,220,255,1)");

    chips(txt[1], "rgba(220,180,255,1)");

    chips(txt[2], "rgba(180,255,200,1)");

    chips(txt[3], "rgba(255,220,160,1)");

  }, [

    canvasWidth,

    canvasHeight,

    rows,

    cols,

    dark,

    drawNonce,

    totalSectors,

    sectorIndex,

    sectorStrobing,

    tilesPerSector,

    strobeHz

  ]);



  const clearHover = React.useCallback(() => {

    if (hoverIndexRef.current !== null) {

      hoverIndexRef.current = null;

      onSectorFocus?.(null);

      setDrawNonce((value) => value + 1);

    }

  }, [onSectorFocus]);



  const handlePointerMove = React.useCallback(

    (event: React.PointerEvent<HTMLCanvasElement>) => {

      const layout = layoutRef.current;

      const cvs = ref.current;

      if (!layout || !cvs) return;



      const rect = cvs.getBoundingClientRect();

      const x = event.clientX - rect.left - layout.x0;

      const y = event.clientY - rect.top - layout.y0;

      const outside = x < 0 || y < 0 || x > layout.usableWidth || y > layout.usableHeight;

      if (outside) {

        clearHover();

        return;

      }



      const col = Math.floor(x / layout.cellW);

      const row = Math.floor(y / layout.cellH);

      const idx = row * layout.cols + col;

      const nextHover = idx >= 0 && idx < totalSectors ? idx : null;



      if (hoverIndexRef.current !== nextHover) {

        hoverIndexRef.current = nextHover;

        onSectorFocus?.(nextHover);

        setDrawNonce((value) => value + 1);

      }

    },

    [clearHover, onSectorFocus, totalSectors],

  );



  // lightweight animation loop – we only redraw when sector changes.

  React.useEffect(() => {

    let raf = 0;

    let lastSector = -1;



    const tick = () => {

      // if backend increments currentSector at strobeHz, this will trigger effect above via prop change.

      // If not, uncomment below to synthesize client-side:

      // const t = performance.now() * 0.001;

      // const idx = Math.floor((t * strobeHz) % totalSectors);

      // if (idx !== lastSector) setLocalSector(idx);



      if (currentSector !== lastSector) {

        lastSector = currentSector;

        // force effect to run by nudging state? Not needed: parent should pass updated metrics.

      }

      raf = requestAnimationFrame(tick);

    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);

  }, [currentSector, strobeHz, totalSectors]);



  return (

    <div className="flex h-full flex-col rounded-lg border border-white/10 bg-black/40 p-2">

      <div className="flex items-center justify-between px-1 pb-1">

        <div className="text-[12px] font-medium text-white/90">Casimir Tile Grid</div>

        <div className="text-[11px] text-white/60">

          {hasRealMetrics

            ? `${sectorStrobing}/${totalSectors} sectors @ ${(strobeHz || 0).toLocaleString()} Hz`

            : "Awaiting telemetry..."}

        </div>

      </div>

      <div

        ref={canvasContainerRef}

        className={`relative overflow-hidden ${needsAutoHeight ? "flex-1 min-h-[170px]" : ""}`}

        style={{

          width: explicitWidth,

          height: explicitHeight,

        }}

      >

        <canvas

          ref={ref}

          onPointerMove={handlePointerMove}

          onPointerLeave={clearHover}

          style={{

            width: needsAutoWidth ? "100%" : canvasWidth,

            height: needsAutoHeight ? "100%" : canvasHeight,

            display: "block",

          }}

        />

      </div>

    </div>

  );

}

