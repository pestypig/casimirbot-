import React, { useEffect, useMemo, useRef, useState } from "react";

/** Lightweight throttle levels */
export type ThrottleLevel = "off" | "lite" | "ultra";

export type ThrottleState = {
  level: ThrottleLevel;   // off (desktop), lite (most phones), ultra (low RAM / background tabs)
  reason: string;         // why we chose that level
  dprClamp: number;       // 2 (off) · 1.25 (lite) · 1 (ultra)
  maxCanvasPx: number;    // 4096 (off) · 1536 (lite) · 1024 (ultra)
  lowFps: number;         // 0 (off) · 18 (lite) · 12 (ultra). 0 = keep RAF
  lazyMount: boolean;     // true = children only mount when visible
};

/** Public helper you can call inside your engine components */
export function sizeCanvasCapped(cv: HTMLCanvasElement, maxDim: number, dprClamp: number) {
  const dpr = Math.min(dprClamp, window.devicePixelRatio || 1);
  const rect = cv.getBoundingClientRect();
  let w = Math.max(1, Math.floor(rect.width  * dpr));
  let h = Math.max(1, Math.floor(rect.height * dpr));
  const scale = Math.min(1, maxDim / Math.max(w, h));
  w = Math.max(1, Math.floor(w * scale));
  h = Math.max(1, Math.floor(h * scale));
  if (cv.width !== w)  cv.width  = w;
  if (cv.height !== h) cv.height = h;
  const gl: WebGLRenderingContext | WebGL2RenderingContext | undefined = (cv as any)?.__warpEngine?.gl;
  gl?.viewport?.(0, 0, w, h);
  return { w, h };
}

/** Simple auto-detector (no permissions needed) */
function autoDetect(): { level: ThrottleLevel; reason: string } {
  try {
    const dm = (navigator as any).deviceMemory || 0; // in GB (Chrome)
    const heap = (performance as any).memory?.jsHeapSizeLimit || 0; // bytes (Chrome)
    const coarse = matchMedia?.("(pointer:coarse)")?.matches;

    if (heap && heap < 900_000_000) return { level: "ultra", reason: "heap<900MB" };
    if (dm && dm <= 4)              return { level: "ultra", reason: `deviceMemory≤${dm}GB` };
    if (coarse)                     return { level: "lite",  reason: "pointer:coarse" };
  } catch {}
  return { level: "off", reason: "default" };
}

function makeState(level: ThrottleLevel, reason: string): ThrottleState {
  return {
    level,
    reason,
    dprClamp:    level === "off" ? 2    : level === "lite" ? 1.25 : 1,
    maxCanvasPx: level === "off" ? 4096 : level === "lite" ? 1536 : 1024,
    lowFps:      level === "off" ? 0    : level === "lite" ? 18    : 12,
    lazyMount:   level !== "off",
  };
}

type Props = {
  /** Optional: force a specific throttle level (otherwise auto) */
  force?: ThrottleLevel;
  /** Optional: IntersectionObserver rootMargin (preload before visible) */
  rootMargin?: string;
  /** Optional: hide the little perf badge */
  hideBadge?: boolean;
  children:
    | React.ReactNode
    | ((ctx: { onScreen: boolean; throttle: ThrottleState }) => React.ReactNode);
};

/**
 * VisualThrottler
 * - Lazy-mounts its children when they come on-screen (mobile memory saver).
 * - Exposes a small throttle object you can feed into canvases/engines if you want deeper caps later.
 */
export function VisualThrottler({ force, rootMargin="256px", hideBadge, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState<boolean>(!true); // assume off-screen, flip when visible
  const det = useMemo(() => force ? { level: force, reason: "forced" } : autoDetect(), [force]);
  const throttle = useMemo(() => makeState(det.level, det.reason), [det.level, det.reason]);

  // Visibility gate
  useEffect(() => {
    if (!throttle.lazyMount) { setOnScreen(true); return; }
    if (!wrapRef.current)    { setOnScreen(false); return; }

    const io = new IntersectionObserver(([entry]) => {
      setOnScreen(!!entry.isIntersecting);
    }, { rootMargin });
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, [throttle.lazyMount, rootMargin]);

  // Cosmetic little badge
  const badge = hideBadge ? null : (
    <div className="absolute left-2 top-2 z-[2] text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white/90 border border-white/10">
      perf: <b>{throttle.level}</b> <span className="opacity-70">({throttle.reason})</span>
    </div>
  );

  const content =
    typeof children === "function"
      ? children({ onScreen, throttle })
      : // simple mode: just don't render until visible on mobile
        (onScreen || !throttle.lazyMount) ? children : (
          <div className="flex items-center justify-center h-48 text-xs text-neutral-500">
            warming up renderer…
          </div>
        );

  return (
    <div ref={wrapRef} className="relative">
      {badge}
      {content}
    </div>
  );
}