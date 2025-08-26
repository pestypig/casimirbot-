import * as React from "react";
import OpenSeadragon from "openseadragon";

type Label = { text: string; x: number; y: number; kind?: string; fontSize?: number; fill?: string };
type Body = { id: string; name: string; x_pc: number; y_pc: number };

const PC_TO_IMAGE = (originPx: {x: number; y: number}, pxPerPc: number) =>
  (xpc: number, ypc: number) => ({ 
    x: originPx.x + xpc * pxPerPc, 
    y: originPx.y - ypc * pxPerPc 
  });

export function GalaxyOverlays({
  viewer, 
  labels, 
  bodies, 
  routeIds, 
  originPx, 
  pxPerPc,
  onBodyClick
}: {
  viewer: OpenSeadragon.Viewer | null;
  labels: Label[];
  bodies: Body[];
  routeIds: string[];
  originPx: {x: number; y: number};
  pxPerPc: number;
  onBodyClick?: (id: string) => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!viewer || !canvasRef.current) return;
    
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    if (!ctx || typeof ctx.clearRect !== 'function') return;
    
    function draw() {
      const tiled = viewer.world.getItemAt(0);
      if (!tiled) return;
      
      const containerSize = viewer.viewport.getContainerSize();
      const { x: vw, y: vh } = containerSize;
      
      cvs.width = vw; 
      cvs.height = vh;
      ctx!.clearRect(0, 0, vw, vh);

      const imageToViewport = (pt: {x: number; y: number}) => {
        const vp = tiled.imageToViewportCoordinates(pt.x, pt.y);
        const px = viewer.viewport.pixelFromPoint(vp, true);
        return { x: px.x, y: px.y };
      };
      
      const pcToImage = PC_TO_IMAGE(originPx, pxPerPc);

      // Draw route glow
      const routeBodies = routeIds.map(id => bodies.find(b => b.id === id)).filter(Boolean) as Body[];
      if (routeBodies.length >= 2) {
        for (const pass of [10, 6, 3]) {
          ctx!.beginPath();
          routeBodies.forEach((b, i) => {
            const img = pcToImage(b.x_pc, b.y_pc);
            const p = imageToViewport(img);
            if (i === 0) ctx!.moveTo(p.x, p.y); 
            else ctx!.lineTo(p.x, p.y);
          });
          ctx!.strokeStyle = `rgba(120, 90, 255, ${pass === 10 ? 0.08 : pass === 6 ? 0.18 : 0.9})`;
          ctx!.lineWidth = pass;
          ctx!.stroke();
        }
      }

      // Draw body markers
      bodies.forEach(b => {
        const img = pcToImage(b.x_pc, b.y_pc);
        const p = imageToViewport(img);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx!.fillStyle = routeIds.includes(b.id) ? "#ffd166" : "#7dd3fc";
        ctx!.fill();
      });

      // Draw labels with view culling
      const bounds = viewer.viewport.getBounds(true);
      const zoom = viewer.viewport.getZoom(true);
      
      ctx!.textBaseline = "top";
      labels.forEach(L => {
        const p = imageToViewport({ x: L.x, y: L.y });
        
        // Simple culling - only draw if roughly on screen
        if (p.x < -100 || p.x > vw + 100 || p.y < -50 || p.y > vh + 50) return;
        
        const size = Math.max(10, Math.min(22, (L.fontSize ?? 12) * zoom * 0.5));
        ctx!.font = `${size}px ui-sans-serif, system-ui`;
        
        // Drop shadow for readability
        ctx!.fillStyle = "rgba(0,0,0,0.6)";
        ctx!.fillText(L.text, p.x + 1, p.y + 1);
        
        // Main text
        ctx!.fillStyle = L.fill ?? "#f5e1ff";
        ctx!.fillText(L.text, p.x, p.y);
      });
    }

    const update = () => requestAnimationFrame(draw);
    
    viewer.addHandler("animation", update);
    viewer.addHandler("open", update);
    viewer.addHandler("zoom", update);
    viewer.addHandler("pan", update);
    
    // Handle clicks for body selection
    const handleClick = (event: any) => {
      if (!onBodyClick) return;
      
      const webPoint = event.position;
      const viewportPoint = viewer.viewport.pointFromPixel(webPoint);
      const tiled = viewer.world.getItemAt(0);
      if (!tiled) return;
      
      const imagePoint = tiled.viewportToImageCoordinates(viewportPoint);
      const pcToImage = PC_TO_IMAGE(originPx, pxPerPc);
      
      // Find nearest body
      let minDist = Infinity;
      let hitBody: Body | null = null;
      
      bodies.forEach(b => {
        const img = pcToImage(b.x_pc, b.y_pc);
        const dist = Math.hypot(imagePoint.x - img.x, imagePoint.y - img.y);
        if (dist < minDist && dist < 50) { // Hit radius in image pixels
          minDist = dist;
          hitBody = b;
        }
      });
      
      if (hitBody) {
        onBodyClick((hitBody as Body).id);
      }
    };
    
    viewer.addHandler("canvas-click", handleClick);
    
    return () => {
      viewer.removeAllHandlers("animation");
      viewer.removeAllHandlers("open");
      viewer.removeAllHandlers("zoom");
      viewer.removeAllHandlers("pan");
      viewer.removeAllHandlers("canvas-click");
    };
  }, [viewer, labels, bodies, routeIds, originPx, pxPerPc, onBodyClick]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}