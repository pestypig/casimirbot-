import * as React from "react";

type Hull = { a:number; b:number; c:number; Lx_m:number; Ly_m:number; Lz_m:number; };
type Params = {
  hull?: Hull;
  wallWidth_m?: number;
  showInner?: boolean;
  showCenter?: boolean;
  showOuter?: boolean;
  showShiftArrow?: boolean;
};

declare global {
  interface Window { OutlineEngine?: any; }
}

export function ShellOutlineVisualizer({ params }: { params: Params }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const engineRef = React.useRef<any>(null);

  React.useEffect(() => {
    // load engine script once if needed
    const ensure = async () => {
      if (!window.OutlineEngine) {
        await new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = "/warp-engine-outline.js?v=1";
          s.onload = () => resolve();
          document.body.appendChild(s);
        });
      }
      if (canvasRef.current && !engineRef.current) {
        engineRef.current = new window.OutlineEngine(canvasRef.current);
      }
    };
    ensure();
    return () => {};
  }, []);

  React.useEffect(() => {
    if (!engineRef.current) return;
    const hull = params.hull || { a:503.5, b:132, c:86.5, Lx_m:1007, Ly_m:264, Lz_m:173 };
    const wall_m = params.wallWidth_m ?? 6.0; // default ~6 m wall
    const maxAxis = Math.max(hull.a*2, hull.b*2, hull.c*2) || 1;
    const w_rho = Math.max(1e-4, wall_m / maxAxis); // quick normalization (scene scale)

    engineRef.current.updateUniforms({
      hullAxesMeters: [hull.a, hull.b, hull.c],
      wallWidth: w_rho,
      showInner: params.showInner ?? true,
      showCenter: params.showCenter ?? true,
      showOuter: params.showOuter ?? true,
      showShiftArrow: params.showShiftArrow ?? true,
      lineAlpha: 0.95
    });
  }, [params]);

  return (
    <div className="relative w-full h-[420px] bg-black rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-2 left-2 text-xs bg-black/50 text-slate-200 px-2 py-1 rounded">
        Shell Outline • ρ-surfaces (inner/center/outer) • shift vector (violet)
      </div>
    </div>
  );
}