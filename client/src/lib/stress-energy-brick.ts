import { apiRequest } from "@/lib/queryClient";
import type { CurvatureBrickRequest } from "@/lib/curvature-brick";

declare const Buffer: undefined | { from(input: string, encoding: string): { buffer: ArrayBufferLike; byteOffset: number; byteLength: number } };

export type StressEnergyBrickRequest = CurvatureBrickRequest;

export interface StressEnergyBrickChannel {
  data: Float32Array;
  min: number;
  max: number;
}

export interface StressEnergyBrickStats {
  totalEnergy_J: number;
  avgT00: number;
  avgFluxMagnitude: number;
  netFlux: [number, number, number];
  divMin: number;
  divMax: number;
  dutyFR: number;
  strobePhase: number;
}

export interface StressEnergyBrickDecoded {
  dims: [number, number, number];
  t00: StressEnergyBrickChannel;
  flux: {
    Sx: StressEnergyBrickChannel;
    Sy: StressEnergyBrickChannel;
    Sz: StressEnergyBrickChannel;
    divS: StressEnergyBrickChannel;
  };
  stats: StressEnergyBrickStats;
}

const decodeBase64 = (payload: string | undefined): Uint8Array | undefined => {
  if (!payload) return undefined;
  if (typeof atob === "function") {
    const binary = atob(payload);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
  }
  if (typeof Buffer !== "undefined") {
    try {
      const buf = Buffer.from(payload, "base64");
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const decodeFloat32 = (payload: string | undefined): Float32Array | undefined => {
  const bytes = decodeBase64(payload);
  if (!bytes) return undefined;
  if (bytes.byteLength % 4 !== 0) return undefined;
  const view = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Float32Array(view);
};

const buildQuery = (request: StressEnergyBrickRequest) => {
  const params = new URLSearchParams();
  if (request.quality) params.set("quality", request.quality);
  if (request.dims) params.set("dims", request.dims.join("x"));
  params.set("phase01", request.phase01.toString());
  params.set("sigmaSector", request.sigmaSector.toString());
  params.set("splitEnabled", request.splitEnabled ? "1" : "0");
  params.set("splitFrac", request.splitFrac.toString());
  params.set("dutyFR", request.dutyFR.toString());
  params.set("q", request.q.toString());
  params.set("gammaGeo", request.gammaGeo.toString());
  params.set("gammaVdB", request.gammaVdB.toString());
  params.set("ampBase", request.ampBase.toString());
  params.set("zeta", request.zeta.toString());
  return params.toString();
};

export async function fetchStressEnergyBrick(request: StressEnergyBrickRequest, signal?: AbortSignal): Promise<StressEnergyBrickDecoded> {
  const query = buildQuery(request);
  const res = await apiRequest("GET", `/api/helix/stress-energy-brick?${query}`, undefined, signal);
  const json = await res.json();
  const dims = (json.dims ?? []) as number[];
  if (!Array.isArray(dims) || dims.length !== 3) {
    throw new Error("Invalid stress-energy brick dimensions");
  }
  const decodeChannel = (payload: any, label: string): StressEnergyBrickChannel => {
    const data = decodeFloat32(payload?.data);
    if (!data) throw new Error(`Failed to decode stress-energy channel ${label}`);
    return {
      data,
      min: Number(payload?.min ?? 0),
      max: Number(payload?.max ?? 0),
    };
  };
  const t00 = decodeChannel(json.channels?.t00, "t00");
  const Sx = decodeChannel(json.channels?.Sx, "Sx");
  const Sy = decodeChannel(json.channels?.Sy, "Sy");
  const Sz = decodeChannel(json.channels?.Sz, "Sz");
  const divS = decodeChannel(json.channels?.divS, "divS");

  return {
    dims: [dims[0], dims[1], dims[2]],
    t00,
    flux: { Sx, Sy, Sz, divS },
    stats: {
      totalEnergy_J: Number(json.stats?.totalEnergy_J ?? 0),
      avgT00: Number(json.stats?.avgT00 ?? 0),
      avgFluxMagnitude: Number(json.stats?.avgFluxMagnitude ?? 0),
      netFlux: Array.isArray(json.stats?.netFlux) && json.stats.netFlux.length === 3
        ? [Number(json.stats.netFlux[0] ?? 0), Number(json.stats.netFlux[1] ?? 0), Number(json.stats.netFlux[2] ?? 0)]
        : [0, 0, 0],
      divMin: Number(json.stats?.divMin ?? 0),
      divMax: Number(json.stats?.divMax ?? 0),
      dutyFR: Number(json.stats?.dutyFR ?? request.dutyFR ?? 0),
      strobePhase: Number(json.stats?.strobePhase ?? 0),
    },
  };
}
