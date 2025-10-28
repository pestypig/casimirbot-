// checkpoints.ts
export type Side = 'REAL'|'SHOW';
export type Stage = 'input'|'expect'|'uniforms'|'gpu'|'frame';

export type Check = {
  id: string; side: Side; stage: Stage; pass: boolean;
  msg: string; expect?: any; actual?: any; sev?: 'info'|'warn'|'error';
  at: number; meta?: Record<string, any>;
};

type Sink = (c: Check) => void;
const sinks = new Set<Sink>();

type OnCheckOptions = {
  signal?: AbortSignal;
};

export const onCheck = (fn: Sink, opts?: OnCheckOptions): (() => void) => {
  if (!sinks.has(fn)) sinks.add(fn);

  const off = () => {
    sinks.delete(fn);
  };

  const { signal } = opts ?? {};
  if (signal) {
    if (signal.aborted) {
      off();
    } else {
      const abortHandler = () => off();
      signal.addEventListener("abort", abortHandler, { once: true });
    }
  }

  return off;
};

export const offCheck = (fn: Sink): void => {
  sinks.delete(fn);
};
export const checkpoint = (c: Omit<Check,'at'>) => {
  const rec = { ...c, at: Date.now() };
  const listeners = Array.from(sinks);
  // Dispatch sinks asynchronously to avoid synchronous setState calls during React render
  // (prevents "Cannot update a component while rendering a different component" warnings).
  try {
    for (const s of listeners) queueMicrotask(() => { try { s(rec); } catch(e){ console.warn('checkpoint sink error', e); } });
  } catch (e) {
    // fallback to setTimeout if queueMicrotask isn't available
    for (const s of listeners) setTimeout(() => { try { s(rec); } catch(e){ console.warn('checkpoint sink error', e); } }, 0);
  }
  return rec;
};

export const within = (actual: number, expect: number, rel=0.05) =>
  Number.isFinite(actual) && Math.abs(actual-expect) <= Math.max(1e-20, Math.abs(expect)*rel);

export const _listenerCount = (): number => sinks.size;
export const _clearAllListeners = (): void => { sinks.clear(); };

if (typeof import.meta !== "undefined" && (import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    sinks.clear();
  });
}
