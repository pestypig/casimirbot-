// client/src/components/SolarMap.tsx
import * as React from "react";
import { computeSolarXY, SolarPoint } from "@/lib/solar-adapter";

type Props = {
  width?: number;
  height?: number;
  routeIds?: string[];
  onPickBody?: (id: string) => void;
};

export function SolarMap({
  width = 800,
  height = 400,
  routeIds = [],
  onPickBody
}: Props) {
  const [zoom, setZoom] = React.useState(80); // pixels per AU
  const [offset, setOffset] = React.useState({ x: width / 2, y: height / 2 });
  const [points, setPoints] = React.useState<SolarPoint[]>([]);
  const [dragging, setDragging] = React.useState<{ x: number; y: number } | null>(null);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Update planetary positions every 30 seconds
  React.useEffect(() => {
    const updatePositions = () => setPoints(computeSolarXY());
    updatePositions(); // Initial load
    const id = setInterval(updatePositions, 30000);
    return () => clearInterval(id);
  }, []);

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
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dz = Math.exp(-e.deltaY * 0.001);
    const newZoom = Math.max(10, Math.min(500, zoom * dz));
    
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
      className="relative rounded-lg border bg-black cursor-grab active:cursor-grabbing"
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
      
      {/* Zoom controls */}
      <div className="absolute right-3 top-3 flex gap-1">
        <button 
          className="px-2 py-1 bg-white/10 rounded text-white hover:bg-white/20"
          onClick={() => setZoom(z => Math.min(500, z * 1.2))}
        >
          +
        </button>
        <button 
          className="px-2 py-1 bg-white/10 rounded text-white hover:bg-white/20"
          onClick={() => setZoom(z => Math.max(10, z / 1.2))}
        >
          −
        </button>
      </div>
      
      {/* Date/time info */}
      <div className="absolute left-3 bottom-3 text-xs bg-black/60 rounded px-2 py-1 text-white">
        {new Date().toLocaleString()}
      </div>
    </div>
  );
}