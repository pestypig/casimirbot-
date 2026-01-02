import {
  BSSN_FIELD_KEYS,
  addScaledBssnFieldSet,
  copyBssnFieldSet,
  createBssnRhs,
  createBssnState,
  type BssnRhs,
  type BssnState,
} from "./bssn-state";

export type RhsFn = (state: BssnState, out: BssnRhs) => void;

export interface Rk4Scratch {
  k1: BssnRhs;
  k2: BssnRhs;
  k3: BssnRhs;
  k4: BssnRhs;
  tmp: BssnState;
}

export const createRk4Scratch = (state: BssnState): Rk4Scratch => ({
  k1: createBssnRhs(state.grid),
  k2: createBssnRhs(state.grid),
  k3: createBssnRhs(state.grid),
  k4: createBssnRhs(state.grid),
  tmp: createBssnState(state.grid),
});

export const rk4Step = (
  state: BssnState,
  dt: number,
  rhs: RhsFn,
  scratch?: Rk4Scratch,
): Rk4Scratch => {
  const local = scratch ?? createRk4Scratch(state);
  const { k1, k2, k3, k4, tmp } = local;

  rhs(state, k1);

  copyBssnFieldSet(tmp, state);
  addScaledBssnFieldSet(tmp, k1, dt * 0.5);
  rhs(tmp, k2);

  copyBssnFieldSet(tmp, state);
  addScaledBssnFieldSet(tmp, k2, dt * 0.5);
  rhs(tmp, k3);

  copyBssnFieldSet(tmp, state);
  addScaledBssnFieldSet(tmp, k3, dt);
  rhs(tmp, k4);

  const scale = dt / 6;
  for (const key of BSSN_FIELD_KEYS) {
    const s = state[key];
    const a = k1[key];
    const b = k2[key];
    const c = k3[key];
    const d = k4[key];
    for (let i = 0; i < s.length; i += 1) {
      s[i] += scale * (a[i] + 2 * b[i] + 2 * c[i] + d[i]);
    }
  }

  return local;
};
