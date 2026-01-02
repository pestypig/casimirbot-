export type Vec3 = [number, number, number];

export interface GridSpec {
  dims: [number, number, number];
  spacing: Vec3;
  bounds?: { min: Vec3; max: Vec3 };
}

export type BssnField = Float32Array;

export const BSSN_FIELD_KEYS = [
  "alpha",
  "beta_x",
  "beta_y",
  "beta_z",
  "B_x",
  "B_y",
  "B_z",
  "phi",
  "gamma_xx",
  "gamma_yy",
  "gamma_zz",
  "gamma_xy",
  "gamma_xz",
  "gamma_yz",
  "A_xx",
  "A_yy",
  "A_zz",
  "A_xy",
  "A_xz",
  "A_yz",
  "K",
  "Gamma_x",
  "Gamma_y",
  "Gamma_z",
] as const;

export type BssnFieldKey = typeof BSSN_FIELD_KEYS[number];

export interface BssnFieldSet {
  alpha: BssnField;
  beta_x: BssnField;
  beta_y: BssnField;
  beta_z: BssnField;
  B_x: BssnField;
  B_y: BssnField;
  B_z: BssnField;
  phi: BssnField;
  gamma_xx: BssnField;
  gamma_yy: BssnField;
  gamma_zz: BssnField;
  gamma_xy: BssnField;
  gamma_xz: BssnField;
  gamma_yz: BssnField;
  A_xx: BssnField;
  A_yy: BssnField;
  A_zz: BssnField;
  A_xy: BssnField;
  A_xz: BssnField;
  A_yz: BssnField;
  K: BssnField;
  Gamma_x: BssnField;
  Gamma_y: BssnField;
  Gamma_z: BssnField;
}

export interface BssnState extends BssnFieldSet {
  grid: GridSpec;
}

export type BssnRhs = BssnFieldSet;

export const fieldCountFromDims = (dims: [number, number, number]) =>
  Math.max(0, Math.floor(dims[0] * dims[1] * dims[2]));

export const fieldCount = (grid: GridSpec) => fieldCountFromDims(grid.dims);

const allocateField = (count: number, fillValue = 0): BssnField => {
  const data = new Float32Array(count);
  if (fillValue !== 0) data.fill(fillValue);
  return data;
};

export const gridFromBounds = (
  dims: [number, number, number],
  bounds: { min: Vec3; max: Vec3 },
): GridSpec => {
  const nx = Math.max(1, dims[0]);
  const ny = Math.max(1, dims[1]);
  const nz = Math.max(1, dims[2]);
  const spacing: Vec3 = [
    (bounds.max[0] - bounds.min[0]) / nx,
    (bounds.max[1] - bounds.min[1]) / ny,
    (bounds.max[2] - bounds.min[2]) / nz,
  ];
  return { dims, spacing, bounds };
};

export const createBssnFieldSet = (grid: GridSpec, fillValue = 0): BssnFieldSet => {
  const total = fieldCount(grid);
  return {
    alpha: allocateField(total, fillValue),
    beta_x: allocateField(total, fillValue),
    beta_y: allocateField(total, fillValue),
    beta_z: allocateField(total, fillValue),
    B_x: allocateField(total, fillValue),
    B_y: allocateField(total, fillValue),
    B_z: allocateField(total, fillValue),
    phi: allocateField(total, fillValue),
    gamma_xx: allocateField(total, fillValue),
    gamma_yy: allocateField(total, fillValue),
    gamma_zz: allocateField(total, fillValue),
    gamma_xy: allocateField(total, fillValue),
    gamma_xz: allocateField(total, fillValue),
    gamma_yz: allocateField(total, fillValue),
    A_xx: allocateField(total, fillValue),
    A_yy: allocateField(total, fillValue),
    A_zz: allocateField(total, fillValue),
    A_xy: allocateField(total, fillValue),
    A_xz: allocateField(total, fillValue),
    A_yz: allocateField(total, fillValue),
    K: allocateField(total, fillValue),
    Gamma_x: allocateField(total, fillValue),
    Gamma_y: allocateField(total, fillValue),
    Gamma_z: allocateField(total, fillValue),
  };
};

export const createBssnState = (grid: GridSpec, fillValue = 0): BssnState => ({
  grid,
  ...createBssnFieldSet(grid, fillValue),
});

export const createBssnRhs = (grid: GridSpec, fillValue = 0): BssnRhs =>
  createBssnFieldSet(grid, fillValue);

export const copyBssnFieldSet = (dst: BssnFieldSet, src: BssnFieldSet): void => {
  for (const key of BSSN_FIELD_KEYS) {
    dst[key].set(src[key]);
  }
};

export const addScaledBssnFieldSet = (
  dst: BssnFieldSet,
  src: BssnFieldSet,
  scale: number,
): void => {
  if (scale === 0) return;
  for (const key of BSSN_FIELD_KEYS) {
    const d = dst[key];
    const s = src[key];
    for (let i = 0; i < d.length; i += 1) {
      d[i] += s[i] * scale;
    }
  }
};

export const clearBssnFieldSet = (dst: BssnFieldSet): void => {
  for (const key of BSSN_FIELD_KEYS) {
    dst[key].fill(0);
  }
};

export const setMinkowskiState = (state: BssnState): void => {
  clearBssnFieldSet(state);
  state.alpha.fill(1);
  state.gamma_xx.fill(1);
  state.gamma_yy.fill(1);
  state.gamma_zz.fill(1);
};

export const createMinkowskiState = (grid: GridSpec): BssnState => {
  const state = createBssnState(grid);
  setMinkowskiState(state);
  return state;
};
