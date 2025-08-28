/**
 * WebGL capabilities and canvas sizing utilities
 * Mobile-optimized canvas sizing with safe DPR handling
 */

/**
 * Safely size a canvas with mobile-optimized device pixel ratio handling
 * Prevents excessive resolution on mobile devices while maintaining crisp rendering
 */
export function sizeCanvasSafe(canvas: HTMLCanvasElement): { w: number; h: number } {
  // Mobile-optimized device pixel ratio (avoid excessive resolution on mobile)
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const dpr = isMobile 
    ? Math.min(1.5, window.devicePixelRatio || 1) 
    : Math.min(2, window.devicePixelRatio || 1);
  
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  
  canvas.width = w;
  canvas.height = h;
  
  return { w, h };
}

/**
 * Check if WebGL is available (soft detection)
 * Some mobile browsers/webviews return null for off-DOM test canvases even though
 * real canvases will create a context just fine.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hasAPI =
    !!(window as any).WebGL2RenderingContext ||
    !!(window as any).WebGLRenderingContext;
  
  if (!hasAPI) return false;
  
  // Try a context, but don't treat failure here as fatal.
  try {
    const canvas = document.createElement('canvas');
    const attrs: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false,
    };
    
    const gl =
      (canvas.getContext('webgl2', attrs) as any) ||
      (canvas.getContext('webgl', attrs) as any) ||
      (canvas.getContext('experimental-webgl' as any, attrs as any) as any);
    
    return !!gl || hasAPI;
  } catch {
    return hasAPI;
  }
}

/**
 * Get optimal WebGL context attributes for mobile compatibility
 */
export function getWebGLContextAttributes(isMobile = false): WebGLContextAttributes {
  return {
    alpha: false,
    antialias: !isMobile, // Disable antialiasing on mobile for better performance
    depth: true,
    stencil: false,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    powerPreference: isMobile ? 'default' : 'high-performance',
    desynchronized: !isMobile, // Disable on mobile for compatibility
  };
}