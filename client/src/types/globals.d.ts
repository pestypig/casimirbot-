export {};

declare global {
  const __APP_BUILD__: string;
  const __HELIX_ASK_JOB_TIMEOUT_MS__: string | number | undefined;
  interface Window {
    WarpEngine?: any;
    setStrobingState?: (opts: { sectorCount: number; currentSector: number; split?: number }) => void;
    sceneScale?: number;
    __warp_setGainDec?: (dec: number, max?: number) => void;
    __warp_setCosmetic?: (level: number) => void;
  }
}
