// client/src/components/SolarMap.tsx
import * as React from "react";
import { computeSolarXY, SolarPoint } from "@/lib/solar-adapter";

type Props = {
  width?: number;
  height?: number;
  routeIds?: string[];
  onPickBody?: (id: string) => void;
  centerOnId?: string;
  centerBetweenIds?: [string, string];
  /** Optional: fit the camera so all these bodies are fully visible */
  fitToIds?: string[];
  /** Optional padding (px) when fitting */
  fitMarginPx?: number;
};

export function SolarMap({
  width = 800,
  height = 400,
  routeIds = [],
  onPickBody,
  centerOnId = "EARTH",
  centerBetweenIds,
  fitToIds,
  fitMarginPx
}: Props) {
  const [zoom, setZoom] = React.useState(80); // pixels per AU
  const [offset, setOffset] = React.useState({ x: width / 2, y: height / 2 });
  const [points, setPoints] = React.useState<SolarPoint[]>([]);
  const [dragging, setDragging] = React.useState<{ x: number; y: number } | null>(null);
  // keep the initial fit so we can reset, and derive a minZoom below it
  const [baseFit, setBaseFit] = React.useState<{ zoom:number; offset:{x:number;y:number} } | null>(null);
  // once the user changes zoom/pan, we stop auto-fit from running again
  const userInteractedRef = React.useRef(false);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const didPriorityFit = React.useRef(false);

  // Helper: compute a fit transform so a bbox fits in width x height
  const fitToBBox = React.useCallback((
    bbox: {minX:number; minY:number; maxX:number; maxY:number},
    viewW: number, viewH: number, margin: number
  ) => {
    const w = Math.max(1e-9, bbox.maxX - bbox.minX);
    const h = Math.max(1e-9, bbox.maxY - bbox.minY);
    const zx = (viewW - 2*margin) / w;
    const zy = (viewH - 2*margin) / h;
    const newZoom = Math.max(0.0001, Math.min(zx, zy));
    const cx = (bbox.minX + bbox.maxX) * 0.5;
    const cy = (bbox.minY + bbox.maxY) * 0.5;
    // screen center after transform: (cx*newZoom + off.x, cy*newZoom + off.y) = (viewW/2, viewH/2)
    const offX = viewW*0.5 - cx*newZoom;
    const offY = viewH*0.5 - cy*newZoom;
    return { zoom: newZoom, offset: { x: offX, y: offY } };
  }, []);

  // Update planetary positions every 30 seconds
  React.useEffect(() => {
    const updatePositions = () => setPoints(computeSolarXY());
    updatePositions(); // Initial load
    const id = setInterval(updatePositions, 30000);
    return () => clearInterval(id);
  }, []);

  // DEFAULT FIT - Skip when fitToIds is provided
  React.useEffect(() => {
    // If caller wants an explicit fit to bodies, skip the default-fit.
    if (fitToIds && fitToIds.length > 0) return;
    if (points.length === 0) return;
    
    let centerPoint = { x_au: 0, y_au: 0 };
    
    // If a midpoint is requested and both bodies exist, use midpoint:
    if (centerBetweenIds && centerBetweenIds.length === 2) {
      const [aId, bId] = centerBetweenIds;
      const bodyA = points.find(p => p.id === aId);
      const bodyB = points.find(p => p.id === bId);
      if (bodyA && bodyB) {
        centerPoint = { 
          x_au: (bodyA.x_au + bodyB.x_au) * 0.5, 
          y_au: (bodyA.y_au + bodyB.y_au) * 0.5 
        };
      } else {
        // Fallback to single body if midpoint fails
        const targetBody = points.find(p => p.id === centerOnId);
        if (targetBody) {
          centerPoint = { x_au: targetBody.x_au, y_au: targetBody.y_au };
        }
      }
    } else {
      // Standard single body centering
      const targetBody = points.find(p => p.id === centerOnId);
      if (targetBody) {
        centerPoint = { x_au: targetBody.x_au, y_au: targetBody.y_au };
      }
    }
    
    setOffset({ 
      x: width / 2 - centerPoint.x_au * zoom, 
      y: height / 2 + centerPoint.y_au * zoom 
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToIds?.length, centerOnId, centerBetweenIds, points, zoom, width, height]);

  // PRIORITY FIT-TO-IDS (runs after layout so it wins over defaults)
  React.useLayoutEffect(() => {
    if (!fitToIds || fitToIds.length === 0) return;
    if (points.length === 0) return;
    
    // Gather target points from bodies
    const pts = fitToIds
      .map(id => points.find(p => p.id === id))
      .filter(Boolean)
      .map(p => ({ x: p!.x_au, y: p!.y_au }));
    
    if (pts.length === 0) return;
    
    // Defer to next frame to ensure any default sizing has applied
    const raf = requestAnimationFrame(() => {
      const minX = Math.min(...pts.map(p => p.x));
      const maxX = Math.max(...pts.map(p => p.x));
      const minY = Math.min(...pts.map(p => p.y));
      const maxY = Math.max(...pts.map(p => p.y));
      const margin = Number.isFinite(fitMarginPx) ? (fitMarginPx as number) : 24;
      
      const next = fitToBBox({minX, minY, maxX, maxY}, width, height, margin);
      setZoom(next.zoom);
      setOffset(next.offset);
      setBaseFit(next);
      didPriorityFit.current = true;
      userInteractedRef.current = false; // fresh fit; allow reset/zoom range from here
    });
    
    return () => cancelAnimationFrame(raf);
    // include bodies + dimensions so we refit on resize/ephemeris tick
  }, [width, height, fitToIds?.join(','), points, fitMarginPx, fitToBBox]);

  // derive a friendly minZoom (≈ 35% of base fit) so you can zoom OUT
  const minZoom = React.useMemo(() => {
    return baseFit ? Math.max(0.00005, baseFit.zoom * 0.35) : 10;
  }, [baseFit]);
  const maxZoom = 500; // keep a reasonable upper bound

  // Drawing
  React.useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);

    // Grid lines (faint)
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical lines
    for (let au = -20; au <= 20; au += 5) {
      const x = offset.x + au * zoom;
      if (x >= 0 && x <= width) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
    }
    // Horizontal lines
    for (let au = -20; au <= 20; au += 5) {
      const y = offset.y - au * zoom;
      if (y >= 0 && y <= height) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
    }
    ctx.stroke();

    // Orbital paths (faint circles)
    ctx.strokeStyle = "rgba(125,211,252,0.1)";
    for (const p of points) {
      if (p.name === "Sun") continue;
      const r = Math.hypot(p.x_au, p.y_au) * zoom;
      if (r > 0 && r < Math.max(width, height)) {
        ctx.beginPath();
        ctx.arc(offset.x, offset.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Route lines (if multiple waypoints selected)
    if (routeIds.length >= 2) {
      const routePoints = routeIds.map(id => points.find(p => p.id === id)).filter(Boolean) as SolarPoint[];
      if (routePoints.length >= 2) {
        // Glow effect
        for (const pass of [8, 4, 2]) {
          ctx.beginPath();
          routePoints.forEach((p, i) => {
            const x = offset.x + p.x_au * zoom;
            const y = offset.y - p.y_au * zoom;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = `rgba(120, 90, 255, ${pass === 8 ? 0.08 : pass === 4 ? 0.18 : 0.9})`;
          ctx.lineWidth = pass;
          ctx.stroke();
        }
      }
    }

    // Bodies
    for (const p of points) {
      const x = offset.x + p.x_au * zoom;
      const y = offset.y - p.y_au * zoom;
      
      // Only draw if within canvas bounds (with some margin)
      if (x > -20 && x < width + 20 && y > -20 && y < height + 20) {
        ctx.beginPath();
        const radius = p.name === "Sun" ? 6 : 
                      p.name === "Jupiter" ? 4 :
                      p.name === "Saturn" ? 4 : 3;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        const isSelected = routeIds.includes(p.id);
        ctx.fillStyle = p.name === "Sun" ? "#ffd166" : 
                       isSelected ? "#ffd166" : 
                       "#7dd3fc";
        ctx.fill();

        // Label
        if (zoom > 40) { // Only show labels when zoomed in enough
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = "10px ui-sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(p.name, x, y - radius - 5);
        }
      }
    }
  }, [points, zoom, offset, width, height, routeIds]);

  // Mouse interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    userInteractedRef.current = true;
    setDragging({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragging.x, y: e.clientY - dragging.y });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    userInteractedRef.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dz = Math.exp(-e.deltaY * 0.001);
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * dz));
    
    // Keep point under mouse stable
    const sx = (mx - offset.x) / zoom;
    const sy = (my - offset.y) / zoom;
    setOffset({ x: mx - sx * newZoom, y: my - sy * newZoom });
    setZoom(newZoom);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!onPickBody || dragging) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Find closest body
    let minDist = Infinity;
    let closestBody: SolarPoint | null = null;
    
    for (const p of points) {
      const x = offset.x + p.x_au * zoom;
      const y = offset.y - p.y_au * zoom;
      const dist = Math.hypot(mx - x, my - y);
      if (dist < 15 && dist < minDist) {
        minDist = dist;
        closestBody = p;
      }
    }
    
    if (closestBody) {
      onPickBody(closestBody.id);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg border bg-black cursor-grab active:cursor-grabbing"
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
      />
      
      {/* Info overlay */}
      <div className="absolute left-3 top-3 text-xs bg-black/60 rounded px-2 py-1 text-white">
        Scale: {Math.round(zoom)} px/AU
      </div>
      
      {/* keep controls pinned safely inside the visible area */}
      <div className="absolute top-3 right-3 z-20 pointer-events-auto flex gap-1">
        <button 
          className="px-2 py-1 bg-white/10 rounded text-white hover:bg-white/20"
          onClick={() => {
            userInteractedRef.current = true;
            setZoom(z => Math.max(minZoom, z / 1.2));
          }}
        >
          −
        </button>
        <button 
          className="px-2 py-1 bg-white/10 rounded text-white hover:bg-white/20"
          onClick={() => {
            userInteractedRef.current = true;
            setZoom(z => Math.min(maxZoom, z * 1.2));
          }}
        >
          +
        </button>
        <button 
          className="px-2 py-1 bg-white/10 rounded text-white hover:bg-white/20"
          onClick={() => {
            if (!baseFit) return;
            userInteractedRef.current = false;
            setZoom(baseFit.zoom);
            setOffset(baseFit.offset);
          }}
        >
          ⟲
        </button>
      </div>
      
      {/* Date/time info */}
      <div className="absolute left-3 bottom-3 text-xs bg-black/60 rounded px-2 py-1 text-white">
        {new Date().toLocaleString()}
      </div>
    </div>
  );
}