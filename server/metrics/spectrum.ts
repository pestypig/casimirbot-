import { EventEmitter } from "node:events";

export interface SpectrumSnapshot {
  d_nm: number;
  m: number;
  Omega_GHz: number;
  phi_deg: number;
  Nminus: number;
  Nplus: number;
  RBW_Hz: number;
  P_ref_W?: number;
  T_ref_K?: number;
  timestamp?: string;
}

const MAX_SNAPSHOTS = 256;
const snapshots: SpectrumSnapshot[] = [];
const bus = new EventEmitter();

export function postSpectrum(snapshot: SpectrumSnapshot) {
  const enriched = {
    ...snapshot,
    timestamp: snapshot.timestamp ?? new Date().toISOString(),
  };
  snapshots.push(enriched);
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.splice(0, snapshots.length - MAX_SNAPSHOTS);
  }
  bus.emit("snapshot", enriched);
  return enriched;
}

export function getSpectrumSnapshots(): SpectrumSnapshot[] {
  return snapshots.slice();
}

export function subscribeSpectrum(listener: (snap: SpectrumSnapshot) => void) {
  bus.on("snapshot", listener);
  return () => bus.off("snapshot", listener);
}
