import fs from "node:fs";
import path from "node:path";
import type { SamplingKind } from "../../shared/schema.js";

export interface FordRomanBoundArgs {
  tau_s_ms: number;
  sampler: SamplingKind;
  fieldKind?: string;
  safetySigma_Jm3?: number;
  scalarFallback?: number;
}

export interface QiBoundInput {
  tau_s: number;
  fieldType?: string;
  kernelType?: SamplingKind;
  safetySigma_Jm3?: number;
}

export interface QiBoundResult {
  fieldType: string;
  kernelType: SamplingKind;
  tau_s: number;
  K: number;
  bound_Jm3: number;
  safetySigma_Jm3: number;
}

type KernelConfig = {
  K: number;
  safetySigma_Jm3?: number;
  tauFloor_s?: number;
  tauCeiling_s?: number;
};

type FieldConfig = {
  label?: string;
  defaultKernel?: SamplingKind;
  safetySigma_Jm3?: number;
  tauFloor_s?: number;
  tauCeiling_s?: number;
  kernels: Record<string, KernelConfig>;
};

type FordRomanConfig = {
  defaultField: string;
  defaultKernel: SamplingKind;
  globalSafetySigma_Jm3?: number;
  tauFloor_s?: number;
  tauCeiling_s?: number;
  fields: Record<string, FieldConfig>;
};

const DEFAULT_CONFIG: FordRomanConfig = {
  defaultField: "em",
  defaultKernel: "lorentzian",
  globalSafetySigma_Jm3: 100,
  tauFloor_s: 1e-6,
  tauCeiling_s: 0.05,
  fields: {
    em: {
      label: "Electromagnetic vacuum",
      defaultKernel: "lorentzian",
      safetySigma_Jm3: 140,
      kernels: {
        lorentzian: { K: 3.8e-30, safetySigma_Jm3: 150 },
        gaussian: { K: 2.9e-30, safetySigma_Jm3: 110 },
      },
    },
  },
};

const CONFIG_PATH = path.resolve(process.cwd(), "server/config/ford-roman.json");
let cachedConfig: FordRomanConfig | null = null;
let configLoadErrorLogged = false;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function loadConfig(): FordRomanConfig {
  if (cachedConfig) return cachedConfig;
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as FordRomanConfig;
    cachedConfig = {
      ...DEFAULT_CONFIG,
      ...parsed,
      fields: {
        ...DEFAULT_CONFIG.fields,
        ...(parsed?.fields ?? {}),
      },
    };
    return cachedConfig;
  } catch (err) {
    if (!configLoadErrorLogged) {
      console.warn(
        `[qi-bounds] using built-in Ford–Roman config (failed to load ${CONFIG_PATH}: ${
          err instanceof Error ? err.message : String(err)
        })`,
      );
      configLoadErrorLogged = true;
    }
    cachedConfig = DEFAULT_CONFIG;
    return cachedConfig;
  }
}

function resolveField(fieldType?: string): { key: string; config: FieldConfig } {
  const config = loadConfig();
  if (fieldType && config.fields[fieldType]) {
    return { key: fieldType, config: config.fields[fieldType] };
  }
  const fallback = config.fields[config.defaultField];
  if (fallback) {
    return { key: config.defaultField, config: fallback };
  }
  const [firstKey, firstConfig] = Object.entries(config.fields)[0] ?? [];
  if (firstKey && firstConfig) {
    return { key: firstKey, config: firstConfig };
  }
  return { key: "em", config: DEFAULT_CONFIG.fields.em };
}

function resolveKernel(
  field: { key: string; config: FieldConfig },
  kernelType?: SamplingKind,
): { key: SamplingKind; config: KernelConfig } {
  const global = loadConfig();
  const desired = kernelType ?? field.config.defaultKernel ?? global.defaultKernel;
  const kernelConfig = field.config.kernels[desired];
  if (kernelConfig) return { key: desired, config: kernelConfig };

  const fallbackEntry = Object.entries(field.config.kernels)[0];
  if (fallbackEntry) {
    const [fallbackKey, fallbackConfig] = fallbackEntry;
    return { key: fallbackKey as SamplingKind, config: fallbackConfig };
  }
  return {
    key: global.defaultKernel,
    config: {
      K: 1e-30,
    },
  };
}

export function qiBound_Jm3(input: QiBoundInput): QiBoundResult {
  const { tau_s } = input;
  const field = resolveField(input.fieldType);
  const kernel = resolveKernel(field, input.kernelType);
  const config = loadConfig();
  const tauFloor = kernel.config.tauFloor_s ?? field.config.tauFloor_s ?? config.tauFloor_s ?? 1e-6;
  const tauCeiling = kernel.config.tauCeiling_s ?? field.config.tauCeiling_s ?? config.tauCeiling_s ?? 0.1;
  const tauClamped = clamp(Number.isFinite(tau_s) && tau_s > 0 ? tau_s : tauFloor, tauFloor, tauCeiling);

  const K = Number(kernel.config.K);
  if (!(K > 0)) {
    throw new Error(`[qi-bounds] invalid K for ${field.key}/${kernel.key}`);
  }

  const baseBound = -K / Math.pow(tauClamped, 4);
  const safetySigma =
    input.safetySigma_Jm3 ??
    kernel.config.safetySigma_Jm3 ??
    field.config.safetySigma_Jm3 ??
    config.globalSafetySigma_Jm3 ??
    0;

  return {
    fieldType: field.key,
    kernelType: kernel.key,
    tau_s: tauClamped,
    K,
    bound_Jm3: baseBound,
    safetySigma_Jm3: Math.max(0, Number.isFinite(safetySigma) ? safetySigma : 0),
  };
}

export function fordRomanBound({
  tau_s_ms,
  sampler,
  fieldKind,
  safetySigma_Jm3,
  scalarFallback = -1,
}: FordRomanBoundArgs): number {
  const tau_s = Math.max(1e-9, tau_s_ms / 1000);
  try {
    const result = qiBound_Jm3({
      tau_s,
      fieldType: fieldKind,
      kernelType: sampler,
      safetySigma_Jm3,
    });
    return clampNegative(result.bound_Jm3 + result.safetySigma_Jm3);
  } catch (err) {
    console.warn("[qi-bounds] failed to compute ford-roman bound:", err);
    return scalarFallback;
  }
}

/**
 * Helper to read a scalar bound from the config/ENV for pipeline defaults.
 * Optionally pass overrides to compute a more precise default bound.
 */
export function configuredQiScalarBound(options: {
  tau_s_ms?: number;
  fieldType?: string;
  kernelType?: SamplingKind;
  safetySigma_Jm3?: number;
} = {}): number {
  const tau_s_ms = Number.isFinite(options.tau_s_ms) ? (options.tau_s_ms as number) : Number(process.env.QI_TAU_MS) || 5;
  try {
    const { bound_Jm3, safetySigma_Jm3 } = qiBound_Jm3({
      tau_s: Math.max(1e-9, tau_s_ms / 1000),
      fieldType: options.fieldType,
      kernelType: options.kernelType,
      safetySigma_Jm3: options.safetySigma_Jm3,
    });
    return clampNegative(bound_Jm3 + safetySigma_Jm3);
  } catch {
    const legacy = Number(process.env.QI_BOUND_SCALAR ?? process.env.QI_BOUND);
    return Number.isFinite(legacy) ? (legacy as number) : -1;
  }
}

function clampNegative(value: number): number {
  if (!Number.isFinite(value)) return -1;
  return Math.min(value, -1e-12);
}
