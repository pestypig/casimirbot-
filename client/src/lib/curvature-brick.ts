import { apiRequest } from "@/lib/queryClient";

declare const Buffer: undefined | { from(input: string, encoding: string): { buffer: ArrayBufferLike; byteOffset: number; byteLength: number; } };

export type CurvatureQuality = "low" | "medium" | "high";

export interface CurvatureBrickRequest {
  quality?: CurvatureQuality;
  dims?: [number, number, number];
  phase01: number;
  sigmaSector: number;
  splitEnabled: boolean;
  splitFrac: number;
  dutyFR: number;
  tauLC_s: number;
  Tm_s: number;
  beta0: number;
  betaMax: number;
  zeta: number;
  q: number;
  gammaGeo: number;
  gammaVdB: number;
  ampBase: number;
  clampQI: boolean;
}

export interface CurvatureBrickDecoded {
  dims: [number, number, number];
  data: Float32Array;
  min: number;
  max: number;
  qiMargin?: Float32Array;
  qiMin?: number;
  qiMax?: number;
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
  if (bytes.byteLength % 4 !== 0) {
    return undefined;
  }
  const view = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Float32Array(view);
};

const buildQuery = (request: CurvatureBrickRequest) => {
  const params = new URLSearchParams();
  if (request.quality) params.set("quality", request.quality);
  if (request.dims) params.set("dims", request.dims.join("x"));
  params.set("phase01", request.phase01.toString());
  params.set("sigmaSector", request.sigmaSector.toString());
  params.set("splitEnabled", request.splitEnabled ? "1" : "0");
  params.set("splitFrac", request.splitFrac.toString());
  params.set("dutyFR", request.dutyFR.toString());
  params.set("tauLC_s", request.tauLC_s.toString());
  params.set("Tm_s", request.Tm_s.toString());
  params.set("beta0", request.beta0.toString());
  params.set("betaMax", request.betaMax.toString());
  params.set("zeta", request.zeta.toString());
  params.set("q", request.q.toString());
  params.set("gammaGeo", request.gammaGeo.toString());
  params.set("gammaVdB", request.gammaVdB.toString());
  params.set("ampBase", request.ampBase.toString());
  params.set("clampQI", request.clampQI ? "1" : "0");
  return params.toString();
};

export async function fetchCurvatureBrick(request: CurvatureBrickRequest, signal?: AbortSignal): Promise<CurvatureBrickDecoded> {
  const query = buildQuery(request);
  const res = await apiRequest("GET", `/api/helix/curvature-brick?${query}`, undefined, signal);
  const json = await res.json();
  const dims = (json.dims ?? []) as number[];
  if (!Array.isArray(dims) || dims.length !== 3) {
    throw new Error("Invalid curvature brick dimensions");
  }
  const data = decodeFloat32(json.data);
  if (!data) {
    throw new Error("Failed to decode curvature brick payload");
  }
  const qiMargin = decodeFloat32(json.qiMargin);
  return {
    dims: [dims[0], dims[1], dims[2]],
    data,
    min: Number(json.min ?? 0),
    max: Number(json.max ?? 0),
    qiMargin,
    qiMin: qiMargin ? Number(json.qiMin ?? 0) : undefined,
    qiMax: qiMargin ? Number(json.qiMax ?? 0) : undefined,
  };
}
