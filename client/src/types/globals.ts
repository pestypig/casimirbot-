
export {};

declare global {
  interface Window {
    WarpEngine?: any;
    setStrobingState?: (opts: { sectorCount: number; currentSector: number; split?: number }) => void;
    sceneScale?: number;
    __warp_setGainDec?: (dec: number, max?: number) => void;
    __warp_setCosmetic?: (level: number) => void;
  }
}

export function getWarpEngineCtor() {
  const WE = (window as any).WarpEngine;
  if (!WE) {
    throw new Error('WarpEngine not present — check that /warp-engine.js is served and loaded before React.');
  }
  return WE;
}
