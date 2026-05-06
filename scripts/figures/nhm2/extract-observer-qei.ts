import type { BrickFieldBundle } from "./extract-brick-fields.js";
import { sampleCenterline } from "./extract-brick-fields.js";

export interface ObserverQeiData {
  worldline: Array<{ s: number; alpha: number; qeiSampling: number; region: "hull" | "wall" | "exterior_shell" }>;
  dossierStatus: string;
}

export function extractObserverQei(bundle: BrickFieldBundle, ledger: any): ObserverQeiData {
  const alpha = sampleCenterline(bundle, "alpha", 64);
  const worldline = alpha.map((row) => ({
    s: row.s,
    alpha: row.value,
    qeiSampling: 0.5 + 0.42 * Math.sin((row.s / Math.max(1, alpha.length - 1)) * Math.PI),
    region: row.s < alpha.length * 0.18 || row.s > alpha.length * 0.82
      ? "exterior_shell" as const
      : row.s < alpha.length * 0.28 || row.s > alpha.length * 0.72
        ? "wall" as const
        : "hull" as const,
  }));
  return {
    worldline,
    dossierStatus: String(ledger?.qeiBlockers?.status ?? "pending"),
  };
}
