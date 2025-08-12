// pipeline-bus.ts
export type PipelineSnapshot = {
  currentMode: string;
  dutyCycle: number;
  P_avg: number;      // MW
  zeta: number;
  TS_ratio: number;
  M_exotic: number;   // kg
  updatedAt: number;
};

const EVT = 'helix:pipeline:update';

export function pushPipelineSnapshot(s: PipelineSnapshot) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: s }));
}

export function onPipelineSnapshot(cb: (s: PipelineSnapshot) => void) {
  const h = (e: Event) => cb((e as CustomEvent).detail as PipelineSnapshot);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}