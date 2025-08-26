import * as React from "react";

type Label = { text:string; x:number; y:number; fontSize?:number; fill?:string };
type LabelsFile = { meta:any; labels: Label[] };

export function GalaxyTextOverlay({
  width, height,
  zoom, offset,
  svgToScreen,
  labelUrl = "/galaxy_labels.json",
  filterText = (t:string)=> true,       // plug your own filter (e.g., /OB|SNR|Orion/i)
  alpha = 0.8
}: {
  width:number; height:number;
  zoom:number; offset:{x:number;y:number};
  svgToScreen: (pt:{x:number;y:number})=>{x:number;y:number};
  labelUrl?: string;
  filterText?: (t:string)=> boolean;
  alpha?: number;
}) {
  const cvsRef = React.useRef<HTMLCanvasElement>(null);
  const [labels, setLabels] = React.useState<Label[]|null>(null);

  React.useEffect(()=>{
    fetch(labelUrl).then(r=>r.json()).then((d:LabelsFile)=>{
      setLabels(d.labels);
    }).catch(()=>setLabels([]));
  }, [labelUrl]);

  React.useEffect(()=>{
    const cvs = cvsRef.current; if(!cvs || !labels) return;
    const ctx = cvs.getContext("2d");
    if (!ctx || typeof ctx.clearRect !== 'function') return;
    ctx.clearRect(0,0,width,height);
    ctx.save();
    ctx.globalAlpha = alpha;

    // draw selected labels
    ctx.font = `${12}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
    ctx.textBaseline = "top";
    for (const L of labels) {
      if (!filterText(L.text)) continue;
      const p = svgToScreen({x:L.x, y:L.y});
      const size = Math.min(22, Math.max(10, (L.fontSize ?? 12) * zoom * 0.5));
      ctx.font = `${size}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
      // shadow for readability
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(L.text, p.x+1, p.y+1);
      ctx.fillStyle = L.fill ?? "#f5e1ff";
      ctx.fillText(L.text, p.x, p.y);
    }
    ctx.restore();
  }, [labels, width, height, zoom, offset, svgToScreen, alpha]);

  return <canvas ref={cvsRef} width={width} height={height} className="absolute inset-0 pointer-events-none" />;
}