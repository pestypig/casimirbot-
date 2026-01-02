import { fieldCount, type GridSpec } from "./bssn-state";

export type StressEnergyField = Float32Array;

export const STRESS_ENERGY_FIELD_KEYS = [
  "rho",
  "Sx",
  "Sy",
  "Sz",
  "S_xx",
  "S_yy",
  "S_zz",
  "S_xy",
  "S_xz",
  "S_yz",
] as const;

export type StressEnergyFieldKey = typeof STRESS_ENERGY_FIELD_KEYS[number];

export interface StressEnergyFieldSet {
  rho: StressEnergyField;
  Sx: StressEnergyField;
  Sy: StressEnergyField;
  Sz: StressEnergyField;
  S_xx: StressEnergyField;
  S_yy: StressEnergyField;
  S_zz: StressEnergyField;
  S_xy: StressEnergyField;
  S_xz: StressEnergyField;
  S_yz: StressEnergyField;
}

const allocateField = (count: number, fillValue = 0): StressEnergyField => {
  const data = new Float32Array(count);
  if (fillValue !== 0) data.fill(fillValue);
  return data;
};

export const stressEnergyFieldCount = (grid: GridSpec) => fieldCount(grid);

export const createStressEnergyFieldSet = (
  grid: GridSpec,
  fillValue = 0,
): StressEnergyFieldSet => {
  const total = stressEnergyFieldCount(grid);
  return {
    rho: allocateField(total, fillValue),
    Sx: allocateField(total, fillValue),
    Sy: allocateField(total, fillValue),
    Sz: allocateField(total, fillValue),
    S_xx: allocateField(total, fillValue),
    S_yy: allocateField(total, fillValue),
    S_zz: allocateField(total, fillValue),
    S_xy: allocateField(total, fillValue),
    S_xz: allocateField(total, fillValue),
    S_yz: allocateField(total, fillValue),
  };
};

export const clearStressEnergyFieldSet = (dst: StressEnergyFieldSet): void => {
  for (const key of STRESS_ENERGY_FIELD_KEYS) {
    dst[key].fill(0);
  }
};

export const copyStressEnergyFieldSet = (
  dst: StressEnergyFieldSet,
  src: StressEnergyFieldSet,
): void => {
  for (const key of STRESS_ENERGY_FIELD_KEYS) {
    dst[key].set(src[key]);
  }
};

export const stressEnergyMatchesGrid = (
  fields: StressEnergyFieldSet,
  grid: GridSpec,
): boolean => {
  const total = stressEnergyFieldCount(grid);
  return STRESS_ENERGY_FIELD_KEYS.every((key) => fields[key].length === total);
};
