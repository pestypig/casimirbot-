export {};

declare const __APP_BUILD__: string;

declare global {
  interface Window {
    WarpEngine?: any;
    setStrobingState?: (opts: { sectorCount: number; currentSector: number; split?: number }) => void;
    sceneScale?: number;
    __warp_setGainDec?: (dec: number, max?: number) => void;
    __warp_setCosmetic?: (level: number) => void;
  }
}
