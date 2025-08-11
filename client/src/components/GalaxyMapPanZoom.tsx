// components/GalaxyMapPanZoom.tsx
import * as React from "react";
import { Body } from "@/lib/galaxy-schema";

type Props = {
  imageUrl: string;
  bodies: Body[];
  routeIds?: string[];
  width?: number; height?: number;
  originPx: {x:number;y:number};     // image pixel coords of Sol
  scalePxPerPc: number;              // pixels per parsec
  onPickBody?: (id:string)=>void;
  debug?: boolean;                   // draws crosshair + pc rings
};

// Clamping helper to prevent image from being dragged completely off-screen
function clampOffset(off: { x: number; y: number }, zoom: number, nat: { w: number; h: number }, view: { w: number; h: number }) {
  const imgW = nat.w * zoom, imgH = nat.h * zoom;
  const margin = 80; // allow a little breathing room
  const minX = Math.min(margin, view.w - imgW - margin);
  const maxX = Math.max(view.w - imgW - margin, margin);
  const minY = Math.min(margin, view.h - imgH - margin);
  const maxY = Math.max(view.h - imgH - margin, margin);
  return {
    x: Math.max(minX, Math.min(maxX, off.x)),
    y: Math.max(minY, Math.min(maxY, off.y)),
  };
}

export function GalaxyMapPanZoom({
  imageUrl, bodies, routeIds = [],
  width=900, height=420,
  originPx, scalePxPerPc,
  onPickBody, debug=false
}: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom]   = React.useState(1);
  const [offset, setOff]  = React.useState({x:0, y:0});
  const [nat, setNat]     = React.useState<{w:number;h:number}|null>(null);
  const [imgError, setImgError] = React.useState<string | null>(null);
  const dragging = React.useRef<null | {dx:number;dy:number}>(null);

  // load image to get natural size
  React.useEffect(()=>{
    setImgError(null);
    const im = new Image();
    im.onload = () => setNat({ w: im.naturalWidth, h: im.naturalHeight });
    im.onerror = () => setImgError(`Could not load ${imageUrl}. Check the path in /public.`);
    im.src = imageUrl;
  }, [imageUrl]);

  // Center on Sol (originPx) when image loads
  React.useEffect(() => {
    if (!nat) return;
    const zx = width / nat.w;
    const zy = height / nat.h;
    const fit = Math.min(zx, zy) * 1.1; // Show a bit more around Sol
    setZoom(fit);
    // Put Sol at the middle of the viewport
    const ox = width / 2 - originPx.x * fit;
    const oy = height / 2 - originPx.y * fit;
    setOff(clampOffset({ x: ox, y: oy }, fit, nat, { w: width, h: height }));
  }, [nat, width, height, originPx.x, originPx.y]);

  // drawing
  React.useEffect(()=>{
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0,0,width,height);

    // helper transforms
    const pcToImg = (xpc:number, ypc:number) => ({
      x: originPx.x + xpc*scalePxPerPc,
      y: originPx.y - ypc*scalePxPerPc
    });
    const imgToScreen = (p:{x:number;y:number}) => ({ x: p.x*zoom + offset.x, y: p.y*zoom + offset.y });

    // route glow
    const routeBodies = routeIds.map(id=>bodies.find(b=>b.id===id)).filter(Boolean) as Body[];
    if (routeBodies.length >= 2) {
      for (const pass of [10,6,3]) {
        ctx.beginPath();
        routeBodies.forEach((b,i)=>{
          const p = imgToScreen(pcToImg(b.x_pc, b.y_pc));
          if (i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y);
        });
        ctx.strokeStyle = `rgba(120,90,255,${pass===10?0.08:pass===6?0.18:0.9})`;
        ctx.lineWidth = pass;
        ctx.stroke();
      }
    }

    // bodies
    for (const b of bodies) {
      const p = imgToScreen(pcToImg(b.x_pc,b.y_pc));
      ctx.beginPath();
      ctx.arc(p.x,p.y,3.5,0,Math.PI*2);
      ctx.fillStyle = routeIds.includes(b.id) ? "#ffd166" : "#7dd3fc";
      ctx.fill();
    }

    // debug: origin + rings
    if (debug) {
      const o = imgToScreen(originPx);
      ctx.strokeStyle = "rgba(255,120,120,0.4)";
      ctx.fillStyle = "rgba(255,180,180,0.8)";
      // crosshair
      ctx.beginPath(); ctx.moveTo(o.x-10,o.y); ctx.lineTo(o.x+10,o.y); ctx.moveTo(o.x,o.y-10); ctx.lineTo(o.x,o.y+10); ctx.stroke();
      // rings (500/1000/2000 pc)
      [500,1000,2000].forEach(rpc=>{
        ctx.beginPath();
        ctx.arc(o.x, o.y, rpc*scalePxPerPc*zoom, 0, Math.PI*2);
        ctx.stroke();
      });
      ctx.font = "12px ui-sans-serif"; ctx.textBaseline = "top";
      ctx.fillText("Sol (0,0)", o.x+8, o.y+8);
    }
  }, [bodies, routeIds, originPx, scalePxPerPc, zoom, offset, width, height, debug]);

  // interactions
  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    dragging.current = { dx: e.clientX - offset.x, dy: e.clientY - offset.y };
  };
  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!dragging.current || !nat) return;
    const newOff = { x: e.clientX - dragging.current.dx, y: e.clientY - dragging.current.dy };
    setOff(clampOffset(newOff, zoom, nat, { w: width, h: height }));
  };
  const onMouseUp = () => (dragging.current = null);

  // IMPORTANT: prevent page scroll & zoom around cursor
  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault(); // stop page from scrolling
    if (!nat) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const dz = Math.exp(-e.deltaY * 0.001);
    const newZoom = Math.max(0.2, Math.min(6, zoom * dz));
    const sx = (mx - offset.x) / zoom;
    const sy = (my - offset.y) / zoom;
    const newOff = { x: mx - sx * newZoom, y: my - sy * newZoom };
    setOff(clampOffset(newOff, newZoom, nat, { w: width, h: height }));
    setZoom(newZoom);
  };

  // click picking
  const onClickCanvas: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    if (!onPickBody) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    // screen->img px
    const ix = (x - offset.x) / zoom;
    const iy = (y - offset.y) / zoom;
    // nearest body
    let min = Infinity, hit: Body | null = null;
    for (const b of bodies) {
      const p = { x: originPx.x + b.x_pc*scalePxPerPc, y: originPx.y - b.y_pc*scalePxPerPc };
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
      className="relative rounded-lg border bg-black overflow-hidden"
      style={{
        width, height,
        cursor: dragging.current ? "grabbing" : "grab",
        // prevent parent/page scrolling and gestures
        touchAction: "none",
        overscrollBehavior: "contain"
      }}
    >
      {/* IMAGE (below) */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Galaxy Map"
        className="absolute top-0 left-0 select-none"
        style={{
          transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          display: imgError ? "none" : "block",
          zIndex: 0
        }}
        draggable={false}
        onError={() => setImgError(`Could not load ${imageUrl}`)}
      />
      {/* ROUTES + DEBUG overlay */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ zIndex: 1 }}
        onClick={onClickCanvas}
      />

      {/* UI bits */}
      {imgError && (
        <div className="absolute inset-0 grid place-items-center text-xs text-red-300 bg-black/60 z-10">
          {imgError}
        </div>
      )}
      <div className="absolute right-3 top-3 z-20 flex gap-1">
        <button className="px-2 py-1 bg-white/10 rounded" onClick={()=>setZoom(z=>Math.min(6, z*1.2))}>+</button>
        <button className="px-2 py-1 bg-white/10 rounded" onClick={()=>setZoom(z=>Math.max(0.2, z/1.2))}>−</button>
      </div>
    </div>
  );
}