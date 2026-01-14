import { mathStageRegistry, type UnitSignature } from "../../../shared/math-stage.js";

export type SymbolUnitMap = Record<string, string>;

const UNIT_TOKEN_RE = /^([MLT])(?:\^(-?\d+))?$/;
const UNIT_BASE: Record<string, string> = {
  M: "kilogram",
  L: "meter",
  T: "second",
};
const DIMENSIONLESS = "dimensionless";

const PHYSICS_CONSTANT_UNITS: SymbolUnitMap = {
  C: "meter/second",
  C2: "meter**2/second**2",
  C4: "meter**4/second**4",
  G: "meter**3/(kilogram*second**2)",
  HBAR: "kilogram*meter**2/second",
  PI: DIMENSIONLESS,
};

const unitSignatureToPint = (signature: string): string | null => {
  const trimmed = signature.trim();
  if (!trimmed || trimmed === "1") {
    return DIMENSIONLESS;
  }
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const parts: string[] = [];
  for (const token of tokens) {
    if (token === "1") continue;
    const match = UNIT_TOKEN_RE.exec(token);
    if (!match) {
      return null;
    }
    const base = UNIT_BASE[match[1]];
    if (!base) return null;
    const exponent = match[2] ? Number(match[2]) : 1;
    if (!Number.isFinite(exponent)) {
      return null;
    }
    parts.push(exponent === 1 ? base : `${base}**${exponent}`);
  }
  return parts.length ? parts.join("*") : DIMENSIONLESS;
};

const mergeUnitSignatures = (signatures: UnitSignature[]): SymbolUnitMap => {
  const merged: SymbolUnitMap = {};
  for (const signature of signatures) {
    for (const [key, value] of Object.entries(signature)) {
      if (merged[key]) continue;
      const converted = unitSignatureToPint(value);
      if (!converted) continue;
      merged[key] = converted;
    }
  }
  return merged;
};

const filterRegistryEntries = (opts?: {
  tags?: string[];
  modules?: string[];
}): UnitSignature[] => {
  const tagSet = opts?.tags?.length ? new Set(opts.tags) : null;
  const moduleSet = opts?.modules?.length ? new Set(opts.modules) : null;
  const signatures: UnitSignature[] = [];
  for (const entry of mathStageRegistry) {
    if (tagSet && !tagSet.has(entry.tag)) continue;
    if (moduleSet && !moduleSet.has(entry.module)) continue;
    if (entry.units) {
      signatures.push(entry.units);
    }
  }
  return signatures;
};

export const buildSymbolUnitsFromRegistry = (opts?: {
  tags?: string[];
  modules?: string[];
  includeConstants?: boolean;
}): SymbolUnitMap => {
  const signatures = filterRegistryEntries(opts);
  const merged = mergeUnitSignatures(signatures);
  if (opts?.includeConstants ?? true) {
    return { ...PHYSICS_CONSTANT_UNITS, ...merged };
  }
  return merged;
};

export const mergeSymbolUnits = (...maps: Array<SymbolUnitMap | undefined>): SymbolUnitMap => {
  const merged: SymbolUnitMap = {};
  for (const map of maps) {
    if (!map) continue;
    for (const [key, value] of Object.entries(map)) {
      if (merged[key]) continue;
      merged[key] = value;
    }
  }
  return merged;
};
