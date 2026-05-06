import type { BrickFieldBundle } from "./extract-brick-fields.js";
import { sampleCenterline } from "./extract-brick-fields.js";

export interface ObserverQeiData {
  worldline: Array<{ s: number; alpha: number; qeiSampling: number }>;
  dossierStatus: string;
}

export function extractObserverQei(bundle: BrickFieldBundle, ledger: any): ObserverQeiData {
  const alpha = sampleCenterline(bundle, "alpha", 64);
  const worldline = alpha.map((row) => ({
    s: row.s,
    alpha: row.value,
    qeiSampling: 0.5 + 0.42 * Math.sin((row.s / Math.max(1, alpha.length - 1)) * Math.PI),
  }));
  return {
    worldline,
    dossierStatus: String(ledger?.qeiBlockers?.status ?? "pending"),
  };
}
