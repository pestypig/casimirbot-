// checkpoints.ts
export type Side = 'REAL'|'SHOW';
export type Stage = 'input'|'expect'|'uniforms'|'gpu'|'frame';

export type Check = {
  id: string; side: Side; stage: Stage; pass: boolean;
  msg: string; expect?: any; actual?: any; sev?: 'info'|'warn'|'error';
  at: number; meta?: Record<string, any>;
};

type Sink = (c: Check) => void;
let sinks: Sink[] = [];
export const onCheck = (fn: Sink) => { sinks.push(fn); };
export const checkpoint = (c: Omit<Check,'at'>) => {
  const rec = { ...c, at: Date.now() }; sinks.forEach(s => s(rec)); return rec;
};

export const within = (actual: number, expect: number, rel=0.05) =>
  Number.isFinite(actual) && Math.abs(actual-expect) <= Math.max(1e-20, Math.abs(expect)*rel);