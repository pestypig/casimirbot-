import * as React from "react";

export type HelixMetrics = {
  energyOutput: number;          // MW
  exoticMass: number;            // kg
  timeScaleRatio: number;        // TS
  curvatureMax: number;          // proxy
  fordRoman: { value:number; limit:number; status:"PASS"|"FAIL" };
  sectorStrobing?: number;       // sectors active
  activeTiles?: number;
  totalTiles?: number;
  gammaVanDenBroeck?: number;
  modelMode?: string;
};

export function useMetrics(pollMs = 2000) {
  const [data, setData] = React.useState<HelixMetrics | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch("/api/helix/metrics");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (alive) setData(j);
      } catch (e:any) {
        if (alive) setErr(e.message ?? "network error");
      }
    };
    tick();
    const id = setInterval(tick, pollMs);
    return () => { alive = false; clearInterval(id); };
  }, [pollMs]);

  return { data, err };
}