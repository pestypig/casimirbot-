import { apiRequest } from "@/lib/queryClient";
import type { CurvatureBrickRequest } from "@/lib/curvature-brick";

declare const Buffer: undefined | { from(input: string, encoding: string): { buffer: ArrayBufferLike; byteOffset: number; byteLength: number } };

export type StressEnergyBrickRequest = CurvatureBrickRequest & {
  observerRapidityCap?: number;
  observerTypeITolerance?: number;
};

export interface StressEnergyBrickChannel {
  data: Float32Array;
  min: number;
  max: number;
}

export interface StressEnergyBrickStats {
  totalEnergy_J: number;
  invariantMass_kg?: number;
  invariantMassEnergy_J?: number;
  avgT00: number;
  avgFluxMagnitude: number;
  netFlux: [number, number, number];
  divMin: number;
  divMax: number;
  dutyFR: number;
  strobePhase: number;
  natario?: {
    divBetaMax: number;
    divBetaRms: number;
    divBetaMaxPre?: number;
    divBetaRmsPre?: number;
    divBetaMaxPost?: number;
    divBetaRmsPost?: number;
    clampScale?: number;
    gateLimit: number;
    gNatario: number;
  };
  conservation?: StressEnergyConservationStats;
  mapping?: StressEnergyMappingStats;
  observerRobust?: ObserverRobustDiagnostics;
}

export interface StressEnergyConservationStats {
  divMean: number;
  divAbsMean: number;
  divRms: number;
  divMaxAbs: number;
  netFluxMagnitude: number;
  netFluxNorm: number;
  divRmsNorm: number;
}

export interface StressEnergyMappingStats {
  rho_avg: number;
  rho_inst: number;
  gap_nm: number;
  cavityQ: number;
  qSpoil: number;
  gammaGeo: number;
  gammaVdB: number;
  dutyFR: number;
  ampBase: number;
  zeta: number;
  pressureFactor?: number;
  pressureSource?: "pipeline" | "proxy" | "override";
  source?: "pipeline" | "defaults" | "metric";
  proxy: boolean;
}

export type ObserverMarginSource = "algebraic_type_i" | "capped_search";

export interface ObserverConditionSummary {
  eulerianMin: number;
  eulerianMean: number;
  robustMin: number;
  robustMean: number;
  eulerianViolationFraction: number;
  robustViolationFraction: number;
  missedViolationFraction: number;
  severityGainMin: number;
  severityGainMean: number;
  maxRobustMinusEulerian: number;
  worstCase: {
    index: number;
    value: number;
    direction: [number, number, number];
    rapidity: number | null;
    source: ObserverMarginSource;
  };
}

export interface ObserverRobustDiagnostics {
  pressureModel: "isotropic_pressure";
  pressureFactor: number;
  rapidityCap: number;
  rapidityCapBeta: number;
  typeI: {
    count: number;
    fraction: number;
    tolerance: number;
  };
  nec: ObserverConditionSummary;
  wec: ObserverConditionSummary;
  sec: ObserverConditionSummary;
  dec: ObserverConditionSummary;
  consistency: {
    robustNotGreaterThanEulerian: boolean;
    maxRobustMinusEulerian: number;
  };
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
  meta?: {
    source?: "pipeline" | "metric" | "unknown";
    proxy?: boolean;
    congruence?: "proxy-only" | "geometry-derived" | "conditional";
    metricT00Ref?: string;
    metricT00Source?: string;
  };
}

const BRICK_FORMAT = "raw";
const BINARY_CONTENT_TYPES = ["application/octet-stream", "application/x-helix-brick"];
const STRESS_CHANNEL_ORDER = ["t00", "Sx", "Sy", "Sz", "divS"] as const;
const textDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

const decodeUtf8 = (bytes: Uint8Array): string => {
  if (textDecoder) return textDecoder.decode(bytes);
  let result = "";
  for (let i = 0; i < bytes.length; i += 1) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
};

const decodeBinaryHeader = (buffer: ArrayBuffer): { header: any; dataOffset: number } | null => {
  if (buffer.byteLength < 4) return null;
  const view = new DataView(buffer);
  const headerLength = view.getUint32(0, true);
  if (!headerLength || headerLength < 2 || headerLength > buffer.byteLength - 4) {
    return null;
  }
  const headerStart = 4;
  const headerEnd = headerStart + headerLength;
  const headerBytes = new Uint8Array(buffer, headerStart, headerLength);
  let header: any;
  try {
    header = JSON.parse(decodeUtf8(headerBytes));
  } catch {
    return null;
  }
  const padding = (4 - (headerLength % 4)) % 4;
  const dataOffset = headerEnd + padding;
  if (dataOffset > buffer.byteLength) return null;
  return { header, dataOffset };
};

const normalizeNatarioStats = (raw: any) => {
  if (!raw || typeof raw !== "object") return undefined;
  const divBetaMax = Number(raw.divBetaMax ?? raw.divMax);
  const divBetaRms = Number(raw.divBetaRms ?? raw.divRms);
  const divBetaMaxPre = Number(raw.divBetaMaxPre ?? raw.divBetaMaxBefore ?? raw.divMaxPre);
  const divBetaRmsPre = Number(raw.divBetaRmsPre ?? raw.divRmsPre);
  const divBetaMaxPost = Number(raw.divBetaMaxPost ?? divBetaMax);
  const divBetaRmsPost = Number(raw.divBetaRmsPost ?? divBetaRms);
  const clampScale = Number(raw.clampScale ?? raw.clampRatio);
  const gateLimit = Number(raw.gateLimit ?? raw.kTol);
  const gNatario = Number(raw.gNatario);
  if (
    !Number.isFinite(divBetaMax) &&
    !Number.isFinite(divBetaRms) &&
    !Number.isFinite(divBetaMaxPre) &&
    !Number.isFinite(divBetaRmsPre) &&
    !Number.isFinite(divBetaMaxPost) &&
    !Number.isFinite(divBetaRmsPost) &&
    !Number.isFinite(clampScale) &&
    !Number.isFinite(gateLimit) &&
    !Number.isFinite(gNatario)
  ) {
    return undefined;
  }
  return {
    divBetaMax,
    divBetaRms,
    divBetaMaxPre,
    divBetaRmsPre,
    divBetaMaxPost,
    divBetaRmsPost,
    clampScale,
    gateLimit,
    gNatario,
  };
};

const normalizeConservationStats = (raw: any): StressEnergyConservationStats | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const divMean = Number(raw.divMean);
  const divAbsMean = Number(raw.divAbsMean);
  const divRms = Number(raw.divRms);
  const divMaxAbs = Number(raw.divMaxAbs);
  const netFluxMagnitude = Number(raw.netFluxMagnitude);
  const netFluxNorm = Number(raw.netFluxNorm);
  const divRmsNorm = Number(raw.divRmsNorm);
  if (
    !Number.isFinite(divMean) &&
    !Number.isFinite(divAbsMean) &&
    !Number.isFinite(divRms) &&
    !Number.isFinite(divMaxAbs) &&
    !Number.isFinite(netFluxMagnitude) &&
    !Number.isFinite(netFluxNorm) &&
    !Number.isFinite(divRmsNorm)
  ) {
    return undefined;
  }
  return {
    divMean,
    divAbsMean,
    divRms,
    divMaxAbs,
    netFluxMagnitude,
    netFluxNorm,
    divRmsNorm,
  };
};

const normalizeMappingStats = (
  raw: any,
  fallbackDutyFR: number,
): StressEnergyMappingStats | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const pressureSourceRaw = typeof raw.pressureSource === "string" ? raw.pressureSource : undefined;
  const pressureSource =
    pressureSourceRaw === "pipeline" || pressureSourceRaw === "proxy" || pressureSourceRaw === "override"
      ? pressureSourceRaw
      : undefined;
  const sourceRaw = typeof raw.source === "string" ? raw.source : undefined;
  const source =
    sourceRaw === "pipeline" || sourceRaw === "defaults" || sourceRaw === "metric"
      ? sourceRaw
      : undefined;
  const proxy = typeof raw.proxy === "boolean" ? raw.proxy : Boolean(raw.proxy);
  const rho_avg = Number(raw.rho_avg);
  const rho_inst = Number(raw.rho_inst);
  const gap_nm = Number(raw.gap_nm);
  const cavityQ = Number(raw.cavityQ);
  const qSpoil = Number(raw.qSpoil);
  const gammaGeo = Number(raw.gammaGeo);
  const gammaVdB = Number(raw.gammaVdB);
  const dutyFR = Number(raw.dutyFR ?? fallbackDutyFR);
  const ampBase = Number(raw.ampBase);
  const zeta = Number(raw.zeta);
  const pressureFactor = Number(raw.pressureFactor);
  const hasData =
    Number.isFinite(rho_avg) ||
    Number.isFinite(rho_inst) ||
    Number.isFinite(gap_nm) ||
    Number.isFinite(cavityQ) ||
    Number.isFinite(qSpoil) ||
    Number.isFinite(gammaGeo) ||
    Number.isFinite(gammaVdB) ||
    Number.isFinite(dutyFR) ||
    Number.isFinite(ampBase) ||
    Number.isFinite(zeta) ||
    Number.isFinite(pressureFactor) ||
    pressureSource ||
    source ||
    typeof raw.proxy === "boolean";
  if (!hasData) return undefined;
  return {
    rho_avg,
    rho_inst,
    gap_nm,
    cavityQ,
    qSpoil,
    gammaGeo,
    gammaVdB,
    dutyFR,
    ampBase,
    zeta,
    pressureFactor: Number.isFinite(pressureFactor) ? pressureFactor : undefined,
    pressureSource,
    source,
    proxy,
  };
};

const normalizeObserverConditionSummary = (raw: any): ObserverConditionSummary | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const directionRaw = Array.isArray(raw.worstCase?.direction) ? raw.worstCase.direction : [];
  const sourceRaw = typeof raw.worstCase?.source === "string" ? raw.worstCase.source : "capped_search";
  const source: ObserverMarginSource =
    sourceRaw === "algebraic_type_i" || sourceRaw === "capped_search"
      ? sourceRaw
      : "capped_search";
  return {
    eulerianMin: Number(raw.eulerianMin ?? 0),
    eulerianMean: Number(raw.eulerianMean ?? 0),
    robustMin: Number(raw.robustMin ?? 0),
    robustMean: Number(raw.robustMean ?? 0),
    eulerianViolationFraction: Number(raw.eulerianViolationFraction ?? 0),
    robustViolationFraction: Number(raw.robustViolationFraction ?? 0),
    missedViolationFraction: Number(raw.missedViolationFraction ?? 0),
    severityGainMin: Number(raw.severityGainMin ?? 0),
    severityGainMean: Number(raw.severityGainMean ?? 0),
    maxRobustMinusEulerian: Number(raw.maxRobustMinusEulerian ?? 0),
    worstCase: {
      index: Number(raw.worstCase?.index ?? -1),
      value: Number(raw.worstCase?.value ?? 0),
      direction: [
        Number(directionRaw[0] ?? 0),
        Number(directionRaw[1] ?? 0),
        Number(directionRaw[2] ?? 0),
      ],
      rapidity: Number.isFinite(Number(raw.worstCase?.rapidity))
        ? Number(raw.worstCase?.rapidity)
        : null,
      source,
    },
  };
};

const normalizeObserverRobustStats = (raw: any): ObserverRobustDiagnostics | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const nec = normalizeObserverConditionSummary(raw.nec);
  const wec = normalizeObserverConditionSummary(raw.wec);
  const sec = normalizeObserverConditionSummary(raw.sec);
  const dec = normalizeObserverConditionSummary(raw.dec);
  if (!nec || !wec || !sec || !dec) return undefined;
  return {
    pressureModel: "isotropic_pressure",
    pressureFactor: Number(raw.pressureFactor ?? 0),
    rapidityCap: Number(raw.rapidityCap ?? 0),
    rapidityCapBeta: Number(raw.rapidityCapBeta ?? 0),
    typeI: {
      count: Number(raw.typeI?.count ?? 0),
      fraction: Number(raw.typeI?.fraction ?? 0),
      tolerance: Number(raw.typeI?.tolerance ?? 0),
    },
    nec,
    wec,
    sec,
    dec,
    consistency: {
      robustNotGreaterThanEulerian: raw.consistency?.robustNotGreaterThanEulerian === true,
      maxRobustMinusEulerian: Number(raw.consistency?.maxRobustMinusEulerian ?? 0),
    },
  };
};

const normalizeStats = (raw: any, fallbackDutyFR: number): StressEnergyBrickStats => ({
  totalEnergy_J: Number(raw?.totalEnergy_J ?? 0),
  invariantMass_kg: Number.isFinite(Number(raw?.invariantMass_kg))
    ? Number(raw?.invariantMass_kg)
    : undefined,
  invariantMassEnergy_J: Number.isFinite(Number(raw?.invariantMassEnergy_J))
    ? Number(raw?.invariantMassEnergy_J)
    : undefined,
  avgT00: Number(raw?.avgT00 ?? 0),
  avgFluxMagnitude: Number(raw?.avgFluxMagnitude ?? 0),
  netFlux: Array.isArray(raw?.netFlux) && raw.netFlux.length === 3
    ? [Number(raw.netFlux[0] ?? 0), Number(raw.netFlux[1] ?? 0), Number(raw.netFlux[2] ?? 0)]
    : [0, 0, 0],
  divMin: Number(raw?.divMin ?? 0),
  divMax: Number(raw?.divMax ?? 0),
  dutyFR: Number(raw?.dutyFR ?? fallbackDutyFR ?? 0),
  strobePhase: Number(raw?.strobePhase ?? 0),
  natario: normalizeNatarioStats(raw?.natario),
  conservation: normalizeConservationStats(raw?.conservation),
  mapping: normalizeMappingStats(raw?.mapping, fallbackDutyFR),
  observerRobust: normalizeObserverRobustStats(raw?.observerRobust),
});

const decodeStressEnergyBrickBinary = (
  buffer: ArrayBuffer,
  fallbackDutyFR: number,
): StressEnergyBrickDecoded | null => {
  const parsed = decodeBinaryHeader(buffer);
  if (!parsed) return null;
  const { header, dataOffset } = parsed;
  if (header?.kind !== "stress-energy-brick") return null;
  const dims = Array.isArray(header.dims) ? header.dims : null;
  if (!dims || dims.length !== 3) return null;
  const voxelBytes = Number(header.voxelBytes ?? 4);
  const total = Number(dims[0]) * Number(dims[1]) * Number(dims[2]);
  if (!Number.isFinite(total) || total <= 0) return null;
  const defaultBytes = total * (Number.isFinite(voxelBytes) && voxelBytes > 0 ? voxelBytes : 4);
  let offset = dataOffset;
  const channelsHeader = header.channels ?? {};

  const decodeChannel = (key: typeof STRESS_CHANNEL_ORDER[number]): StressEnergyBrickChannel | null => {
    const info = channelsHeader[key] ?? {};
    const bytes = Number(info.bytes ?? defaultBytes);
    if (!Number.isFinite(bytes) || bytes <= 0 || bytes % 4 !== 0) return null;
    if (offset + bytes > buffer.byteLength) return null;
    if (offset % 4 !== 0) return null;
    const data = new Float32Array(buffer, offset, bytes / 4);
    offset += bytes;
    return {
      data,
      min: Number(info.min ?? 0),
      max: Number(info.max ?? 0),
    };
  };

  const t00 = decodeChannel("t00");
  const Sx = decodeChannel("Sx");
  const Sy = decodeChannel("Sy");
  const Sz = decodeChannel("Sz");
  const divS = decodeChannel("divS");
  if (!t00 || !Sx || !Sy || !Sz || !divS) return null;

  const meta =
    header && typeof header === "object"
      ? {
          source: header.source as "pipeline" | "metric" | "unknown" | undefined,
          proxy: typeof header.proxy === "boolean" ? header.proxy : undefined,
          congruence: header.congruence as "proxy-only" | "geometry-derived" | "conditional" | undefined,
          metricT00Ref: typeof header.metricT00Ref === "string" ? header.metricT00Ref : undefined,
          metricT00Source: typeof header.metricT00Source === "string" ? header.metricT00Source : undefined,
        }
      : undefined;
  return {
    dims: [Number(dims[0]), Number(dims[1]), Number(dims[2])],
    t00,
    flux: { Sx, Sy, Sz, divS },
    stats: normalizeStats(header.stats, fallbackDutyFR),
    meta,
  };
};

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
  const observerRapidityCap = Number((request as any).observerRapidityCap);
  if (Number.isFinite(observerRapidityCap)) {
    params.set("observerRapidityCap", observerRapidityCap.toString());
  }
  const observerTypeITolerance = Number((request as any).observerTypeITolerance);
  if (Number.isFinite(observerTypeITolerance)) {
    params.set("observerTypeITolerance", observerTypeITolerance.toString());
  }
  params.set("format", BRICK_FORMAT);
  return params.toString();
};

export async function fetchStressEnergyBrick(request: StressEnergyBrickRequest, signal?: AbortSignal): Promise<StressEnergyBrickDecoded> {
  const query = buildQuery(request);
  const res = await apiRequest("GET", `/api/helix/stress-energy-brick?${query}`, undefined, signal, {
    headers: { Accept: "application/octet-stream, application/json" },
  });
  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
  if (BINARY_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    const buffer = await res.arrayBuffer();
    const decoded = decodeStressEnergyBrickBinary(buffer, Number(request.dutyFR ?? 0));
    if (!decoded) {
      throw new Error("Failed to decode stress-energy brick binary payload");
    }
    return decoded;
  }
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

  const meta = json
    ? {
        source: json.source as "pipeline" | "metric" | "unknown" | undefined,
        proxy: typeof json.proxy === "boolean" ? json.proxy : undefined,
        congruence: json.congruence as "proxy-only" | "geometry-derived" | "conditional" | undefined,
        metricT00Ref: typeof json.metricT00Ref === "string" ? json.metricT00Ref : undefined,
        metricT00Source: typeof json.metricT00Source === "string" ? json.metricT00Source : undefined,
      }
    : undefined;
  return {
    dims: [dims[0], dims[1], dims[2]],
    t00,
    flux: { Sx, Sy, Sz, divS },
    stats: normalizeStats(json.stats, Number(request.dutyFR ?? 0)),
    meta,
  };
}
