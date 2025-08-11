import * as React from "react";
import { Body } from "@/lib/galaxy-schema";
import { GalaxyTextOverlay } from "./GalaxyTextOverlay";

type Props = {
  imageUrl: string;
  bodies: Body[];
  routeIds?: string[];
  // calibration
  originPx: {x:number,y:number};     // pixel of Sol in the image
  scalePxPerPc: number;              // pixels per parsec
  // viewport size
  width?: number; height?: number;
  onPickBody?: (id:string)=>void;
  // label overlay
  showLabels?: boolean;
  labelFilter?: (text: string) => boolean;
  // debug visualization
  showDebugOrigin?: boolean;
};

export function GalaxyMapPanZoom({
  imageUrl, bodies, routeIds = [],
  originPx, scalePxPerPc,
  width = 1024, height = 600,
  onPickBody,
  showLabels = true,
  labelFilter = (t) => /(OB|SNR|Orion|Vela|Cas|Perseus|Lupus|Local|region|Arm|Spur)/i.test(t),
  showDebugOrigin = false
}: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 }); // px in screen coords
  const dragging = React.useRef<null | {x:number;y:number}>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // pc -> image pixels (untransformed)
  const toImgPx = React.useCallback((xpc:number, ypc:number) => ({
    x: originPx.x + xpc * scalePxPerPc,
    y: originPx.y - ypc * scalePxPerPc,
  }), [originPx, scalePxPerPc]);

  // SVG coordinates to screen coordinates (for label overlay)
  const svgToScreen = React.useCallback((pt: {x:number;y:number}) => ({
    x: pt.x * zoom + offset.x,
    y: pt.y * zoom + offset.y
  }), [zoom, offset]);

  // Fit image to screen on initial load
  React.useEffect(() => {
    if (!imageLoaded || !imgRef.current) return;
    const img = imgRef.current;
    
    // Compute zoom to fit entire image into viewport
    const zx = width / img.naturalWidth;
    const zy = height / img.naturalHeight;
    const fitZoom = Math.min(zx, zy, 0.8); // Max 80% to leave some padding

    // Center image
    const ox = (width - img.naturalWidth * fitZoom) / 2;
    const oy = (height - img.naturalHeight * fitZoom) / 2;

    setZoom(fitZoom);
    setOffset({ x: ox, y: oy });
  }, [imageLoaded, width, height]);

  // draw route + markers on canvas (already positioned/scaled by CSS)
  React.useEffect(() => {
    const cvs = canvasRef.current; const img = imgRef.current;
    if (!cvs || !img) return;
    const ctx = cvs.getContext("2d"); if (!ctx) return;
    const { width:w, height:h } = cvs;
    ctx.clearRect(0,0,w,h);

    // transform image->screen: (imgPx * zoom) + offset
    const imgToScreen = (p:{x:number;y:number}) => ({ x: p.x*zoom + offset.x, y: p.y*zoom + offset.y });

    // Debug: Draw Sol origin crosshair and distance rings
    if (showDebugOrigin) {
      const solImgPx = toImgPx(0, 0); // Sol at (0,0) parsecs
      const solScreen = imgToScreen(solImgPx);
      
      // Draw crosshair at Sol
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(solScreen.x - 10, solScreen.y);
      ctx.lineTo(solScreen.x + 10, solScreen.y);
      ctx.moveTo(solScreen.x, solScreen.y - 10);
      ctx.lineTo(solScreen.x, solScreen.y + 10);
      ctx.stroke();

      // Draw distance rings (500, 1000, 2000 pc)
      ctx.strokeStyle = "rgba(255, 107, 107, 0.3)";
      ctx.lineWidth = 1;
      [500, 1000, 2000].forEach(radius_pc => {
        const radiusScreen = radius_pc * scalePxPerPc * zoom;
        ctx.beginPath();
        ctx.arc(solScreen.x, solScreen.y, radiusScreen, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Label the origin
      ctx.fillStyle = "#ff6b6b";
      ctx.font = "12px monospace";
      ctx.fillText("Sol (0,0)", solScreen.x + 15, solScreen.y - 10);
    }

    // route glow
    const routeBodies = routeIds.map(id => bodies.find(b=>b.id===id)).filter(Boolean) as Body[];
    if (routeBodies.length >= 2) {
      ctx.save();
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      for (const pass of [10,6,3]) {
        ctx.beginPath();
        routeBodies.forEach((b,i) => {
          const pImg = toImgPx(b.x_pc, b.y_pc);
          const p = imgToScreen(pImg);
          if (i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
        });
        ctx.strokeStyle = `rgba(120, 90, 255, ${pass===10?0.08: pass===6?0.18:0.9})`;
        ctx.lineWidth = pass;
        ctx.stroke();
      }
      ctx.restore();
    }

    // waypoints
    for (const b of bodies) {
      const pImg = toImgPx(b.x_pc, b.y_pc);
      const p = imgToScreen(pImg);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI*2);
      ctx.fillStyle = routeIds.includes(b.id) ? "#ffd166" : "#7dd3fc";
      ctx.fill();
    }
  }, [bodies, routeIds, zoom, offset, toImgPx]);

  // panning
  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    dragging.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!dragging.current) return;
    setOffset({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y });
  };
  const onMouseUp = () => (dragging.current = null);

  // zoom (center on mouse)
  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const dz = Math.exp(-e.deltaY * 0.001); // smooth zoom
    const newZoom = Math.max(0.2, Math.min(6, zoom * dz));
    // keep point under mouse stable: adjust offset
    const sx = (mx - offset.x) / zoom;
    const sy = (my - offset.y) / zoom;
    setOffset({ x: mx - sx*newZoom, y: my - sy*newZoom });
    setZoom(newZoom);
  };

  // click-picking of bodies
  const onClick: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    if (!onPickBody) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    // screen->image px
    const ix = (x - offset.x) / zoom;
    const iy = (y - offset.y) / zoom;
    // find nearest body (hit radius in img px)
    let min = Infinity, hit: Body | null = null;
    for (const b of bodies) {
      const p = toImgPx(b.x_pc, b.y_pc);
      const d2 = (ix - p.x)**2 + (iy - p.y)**2;
      if (d2 < min && d2 < 12**2) { min = d2; hit = b; }
    }
    if (hit) onPickBody(hit.id);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseUp}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      className="relative overflow-hidden rounded-lg border bg-black"
      style={{ width, height, cursor: dragging.current ? "grabbing" : "grab" }}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Galaxy Map"
        className="absolute top-0 left-0 select-none pointer-events-none"
        style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
        onLoad={() => setImageLoaded(true)}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={onClick}
        className="absolute inset-0"
        style={{ pointerEvents: "auto" }}
      />
      {showLabels && (
        <GalaxyTextOverlay
          width={width}
          height={height}
          zoom={zoom}
          offset={offset}
          svgToScreen={svgToScreen}
          filterText={labelFilter}
          alpha={0.85}
        />
      )}
    </div>
  );
}