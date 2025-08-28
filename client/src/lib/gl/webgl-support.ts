
export type WebGLSupport = {
  ok: boolean;
  context?: 'webgl2' | 'webgl';
  reason?: string;
  inIframe: boolean;
  ua: string;
};

/** Strong WebGL detection with helpful reasons (esp. mobile + iframe). */
export function webglSupport(canvas?: HTMLCanvasElement): WebGLSupport {
  const inIframe =
    typeof window !== 'undefined' && window.self !== (window.top ?? window.self);
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  // Developer override: force-disable via ?no-gl for testing
  try {
    const qs = new URLSearchParams((typeof location !== 'undefined' ? location.search : '') || '');
    if (qs.has('no-gl')) {
      return { ok: false, reason: 'Disabled via ?no-gl', inIframe, ua };
    }
  } catch {}

  if (typeof window === 'undefined') {
    return { ok: false, reason: 'No window (SSR/headless)', inIframe, ua };
  }
  if (!(window as any).WebGLRenderingContext) {
    return { ok: false, reason: 'No WebGLRenderingContext in this runtime', inIframe, ua };
  }

  const cv = canvas || document.createElement('canvas');
  const attrs: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: true,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    desynchronized: true,
    failIfMajorPerformanceCaveat: false,
  };

  // Try WebGL2 first
  try {
    const gl2 = cv.getContext('webgl2', attrs) as WebGL2RenderingContext | null;
    if (gl2 && !gl2.isContextLost()) {
      return { ok: true, context: 'webgl2', inIframe, ua };
    }
  } catch {}

  // Then WebGL1 (including experimental)
  try {
    const gl1 =
      (cv.getContext('webgl', attrs) as WebGLRenderingContext | null) ||
      (cv.getContext('experimental-webgl', attrs) as WebGLRenderingContext | null);
    if (gl1 && !gl1.isContextLost()) {
      return { ok: true, context: 'webgl', inIframe, ua };
    }
  } catch {}

  let reason = 'Context creation failed';
  // Helpful hints for embedded previews on mobile
  if (/iPhone|iPad|iPod/i.test(ua) && inIframe) {
    reason = 'iOS embedded preview may block WebGL in iframes';
  } else if (/Android/i.test(ua) && inIframe) {
    reason = 'Android embedded preview may block WebGL in webviews';
  }
  return { ok: false, reason, inIframe, ua };
}
