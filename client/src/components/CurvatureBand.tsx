import React, { useEffect, useMemo, useRef } from "react";

type V3 = [number,number,number];

export default function CurvatureBand({
  hullAxes,             // [a,b,c] meters (semi-axes); equator is y=0
  wallWidth_m = 6.0,
  gammaGeo = 26,
  qSpoilingFactor = 1,
  sigmaRange = 6,
  exposure = 8,
  showContours = true,
  width = 520,
  height = 220,
  className
}: {
  hullAxes: [number,number,number];
  wallWidth_m?: number;
  gammaGeo?: number;
  qSpoilingFactor?: number;
  sigmaRange?: number;
  exposure?: number;
  showContours?: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);

  const pre = useMemo(() => {
    const [a,b,c] = hullAxes;
    const aEff = Math.cbrt(a*b*c);               // geometric mean → ρ scale
    const w_rho = Math.max(1e-9, wallWidth_m/aEff);

    function normalXZ(theta:number): V3 {
      // ∇(x^2/a^2 + z^2/c^2) normalized at y=0 shell
      const x = a*Math.cos(theta), z = c*Math.sin(theta);
      let nx = x/(a*a), nz = z/(c*c);
      const L = Math.hypot(nx, nz) || 1;
      nx/=L; nz/=L;
      return [nx,0,nz];
    }
    function rhoToMeters(theta:number){
      const n = normalXZ(theta);
      const invR = Math.hypot(n[0]/a, n[2]/c);
      return 1/Math.max(invR,1e-9);              // meters per Δρ
    }
    function point(theta:number, sigma:number): V3 {
      const δρ = sigma * w_rho;
      const Δm = δρ * rhoToMeters(theta);
      const n = normalXZ(theta);
      return [a*Math.cos(theta)+n[0]*Δm, 0, c*Math.sin(theta)+n[2]*Δm];
    }
    function rhoAt(x:number,z:number){ return Math.hypot(x/a, z/c); }

    return { a, b, c, aEff, w_rho, point, rhoAt };
  }, [hullAxes, wallWidth_m]);

  function diverge(t:number){ // t∈[-1,1] → RGB
    const clamp = (x:number)=>Math.max(0,Math.min(1,x));
    const x = clamp((t+1)*0.5);
    const lerp = (a:number,b:number,u:number)=>a+(b-a)*u;
    let r:number,g:number,b:number;
    if (x<0.5){ const u=x/0.5; r=lerp(0.15,1,u); g=lerp(0.45,1,u); b=lerp(1,1,u); }
    else      { const u=(x-0.5)/0.5; r=lerp(1,1,u); g=lerp(1,0.45,u); b=lerp(1,0,u); }
    return [r*255|0,g*255|0,b*255|0] as [number,number,number];
  }

  useEffect(()=>{
    const canvas = canvasRef.current; if(!canvas) return;
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d"); if(!ctx) return;

    const img = ctx.createImageData(width, height);
    const d = img.data;
    const geoAmp = Math.pow(gammaGeo,3);

    for (let y=0; y<height; y++){
      const sigma = (y/(height-1))*(2*sigmaRange) - sigmaRange; // −σ…+σ
      for (let x=0; x<width; x++){
        const u = x/(width-1);
        const theta = u*(Math.PI*2);
        const p = pre.point(theta, sigma);
        const rho = pre.rhoAt(p[0], p[2]);

        const sd = rho-1;
        const bell = Math.exp(- (sd/pre.w_rho)*(sd/pre.w_rho));
        const front = Math.tanh(Math.cos(theta)/0.15); // drive +x
        let val = geoAmp * qSpoilingFactor * bell * front;

        // compress + exposure
        const maxV = 0.10;
        val = maxV * Math.tanh((val * exposure) / (0.6*maxV));
        val = Math.max(-1, Math.min(1, val));

        const [R,G,B] = diverge(val);
        const idx = (y*width+x)*4;
        d[idx]=R; d[idx+1]=G; d[idx+2]=B; d[idx+3]=255;
      }
    }
    ctx.putImageData(img,0,0);

    // grid/contours & annotations
    ctx.save();

    // border
    ctx.strokeStyle = "rgba(30,41,59,0.85)"; // slate-800
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5,0.5,width-1,height-1);

    // σ contours
    if (showContours){
      ctx.strokeStyle = "rgba(51,65,85,0.35)"; // slate-700
      for (let s = -Math.floor(sigmaRange); s<=Math.floor(sigmaRange); s++){
        const yPx = Math.round(((s+sigmaRange)/(2*sigmaRange))*(height-1));
        ctx.beginPath(); ctx.moveTo(0, yPx+0.5); ctx.lineTo(width, yPx+0.5); ctx.stroke();
      }
    }

    // axis labels (non-white)
    ctx.fillStyle = "rgba(100,116,139,0.95)"; // slate-400
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";

    // x ticks
    const ticks = [
      {x:0,    txt:"0 (fore)"},
      {x:0.25, txt:"π/2 (port)"},
      {x:0.50, txt:"π (aft)"},
      {x:0.75, txt:"3π/2 (starboard)"},
      {x:1.00, txt:"2π"}
    ];
    ticks.forEach(t=>{
      const px = Math.round(t.x*(width-1));
      ctx.beginPath(); ctx.moveTo(px+0.5,height-18); ctx.lineTo(px+0.5,height-14); ctx.stroke();
      ctx.fillText(t.txt, Math.min(width-70, Math.max(6, px-26)), height-4);
    });
    ctx.fillText("θ (equatorial angle)", 8, 14);

    // y ticks
    ctx.textAlign="right";
    for (let s=-Math.floor(sigmaRange); s<=Math.floor(sigmaRange); s+=2){
      const yPx = Math.round(((s+sigmaRange)/(2*sigmaRange))*(height-1));
      ctx.fillText(`${s}σ`, width-6, yPx+4);
    }
    ctx.save(); ctx.translate(12, height/2); ctx.rotate(-Math.PI/2);
    ctx.textAlign="center"; ctx.fillText("δρ / wρ  (σ units)", 0, 0); ctx.restore();

    // legend with scale (wρ in ρ-units + approximate meters)
    ctx.fillStyle = "rgba(2,6,23,0.65)"; // slate-950
    ctx.strokeStyle = "rgba(30,41,59,0.7)";
    const Lw=230,Lh=44; const Lx=width-Lw-8,Ly=8;
    ctx.fillRect(Lx,Ly,Lw,Lh); ctx.strokeRect(Lx+0.5,Ly+0.5,Lw-1,Lh-1);
    ctx.fillStyle = "rgba(203,213,225,0.95)"; // slate-200
    const aEffMeters = Math.cbrt(pre.a*pre.b*pre.c);
    ctx.fillText(`Band: ρ=1 ± ${sigmaRange}σ`, Lx+8, Ly+18);
    ctx.fillText(`wρ=${pre.w_rho.toExponential(2)}  ⇒ wall≈${(pre.w_rho*aEffMeters).toFixed(3)} m`, Lx+8, Ly+34);

    ctx.restore();
  }, [width,height,pre,gammaGeo,qSpoilingFactor,sigmaRange,exposure,showContours]);

  return (
    <div className={className} style={{position:"relative"}}>
      <canvas ref={canvasRef} width={width} height={height} style={{display:"block", background:"#fff", borderRadius:8}} />
      <div style={{position:"absolute", left:8, top:8, fontSize:12, color:"rgba(100,116,139,0.95)"}}>
        Equatorial Curvature Band (ρ≈1)
      </div>
    </div>
  );
}