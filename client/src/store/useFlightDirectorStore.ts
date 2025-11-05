import { create } from "zustand";
import { useDriveSyncStore } from "@/store/useDriveSyncStore";

export type FlightMode = "MAN" | "HDG";
export type CouplingMode = "decoupled" | "coupled";

const clamp = (value: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Number.isFinite(value) ? value : lo));

const wrap01 = (value: number) => {
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
};

const shortest01 = (target: number, current: number) => {
  let delta = target - current;
  delta -= Math.round(delta);
  return delta;
};

const signedArc01 = (delta: number) => {
  const wrapped = ((delta + 0.5) - Math.floor(delta + 0.5)) - 0.5;
  return wrapped;
};

const MIN_DT = 1 / 240;
const MAX_DT = 1 / 30;
const SOFT_SAT_START = 0.8;
const INTEGRAL_DEADBAND_DEG = 0.35; // skip integrating very small errors to avoid chatter
const INTEGRAL_BLEED_RATE = 5.0; // 1/s decay applied inside the deadband
const RATE_EPS_DPS = 1e-3;

export interface FlightDirectorState {
  enabled: boolean;
  mode: FlightMode;
  coupling: CouplingMode;
  /** HDG target in turns (0..1). Absolute reference when uncoupled. */
  targetYaw01: number;
  /** Latest scheduler wedge sample (0..1), null when unknown. */
  schedulerYaw01: number | null;
  /** Timestamp (ms) for the latest wedge sample. */
  schedulerTs: number | null;
  /** Relative offset vs scheduler wedge when coupled, in [-0.5, 0.5). */
  relHold01: number;
  /** Operator demand from A/D keys (deg/s); zeroed in HDG. */
  yawRateCmd_dps: number;
  /** Internal state: current commanded rate after accel limiting (deg/s). */
  yawRate_dps: number;
  /** Rise intent −1..+1 (SPACE up, SHIFT down) — viewer/viz only. */
  riseCmd: number;
  /** Bias slider mapping: 0..1 with 0.5 = station-hold. */
  thrustBias01: number;
  /** Limits / gains */
  maxYawRate_dps: number;
  maxYawAccel_dps2: number;
  kp: number;
  ki: number;
  kd: number;
  _errInt: number;
  _prevErrDeg: number | null;
  rateKp: number;
  rateKi: number;
  rateKd: number;
  rateKaw: number;
  rateDHz: number;
  lastAccelCmd_dps2: number;
  _rateI: number;
  _rateDLP: number;
  _prevRateMeas_dps: number | null;

  setEnabled(on: boolean): void;
  setMode(mode: FlightMode): void;
  setCoupling(mode: CouplingMode): void;
  setTargetYaw01(frac: number): void;
  nudgeYawRate(delta_dps: number): void;
  setYawRateCmd(value_dps: number): void;
  zeroRate(): void;
  setRise(value: number): void;
  setThrustBias01(value: number): void;
  setLimits(rate_dps: number, accel_dps2: number): void;
  setGains(kp: number, ki: number, kd: number): void;
  ingestSchedulerWedge(frac: number, ts?: number): void;
  setRelHold01(delta: number): void;

  tick(
    dt_s: number,
    currentYaw01: number,
    schedulerYaw01?: number
  ): { nextYaw01: number; yawRate_dps: number };
}

const satSoft = (value: number, limit: number) => {
  const rail = Math.max(0, limit);
  if (rail <= 0) return 0;
  const abs = Math.abs(value);
  if (abs <= rail * SOFT_SAT_START) return clamp(value, -rail, rail);
  const span = rail * (1 - SOFT_SAT_START);
  const t = clamp((abs - rail * SOFT_SAT_START) / Math.max(span, 1e-6), 0, 1);
  const eased = rail * (SOFT_SAT_START + (1 - SOFT_SAT_START) * (1 - Math.pow(1 - t, 3)));
  return Math.sign(value) * Math.min(eased, rail);
};

const alignRateIntegral = (state: FlightDirectorState, spRate_dps: number) => {
  const error = spRate_dps - state.yawRate_dps;
  const accelLimit = Math.max(0, state.maxYawAccel_dps2);
  const raw =
    state.lastAccelCmd_dps2 + state.rateKd * state._rateDLP - state.rateKp * error;
  if (state.rateKi <= 0 || accelLimit <= 0) {
    return raw;
  }
  const limit = accelLimit / Math.max(state.rateKi, 1e-3);
  return clamp(raw, -limit, limit);
};

const computeRateSetpoint = (
  state: FlightDirectorState,
  targetYaw01: number,
  currentYaw01: number
) => {
  if (state.mode === "HDG") {
    const errDeg = shortest01(targetYaw01, currentYaw01) * 360;
    return clamp(state.kp * errDeg, -state.maxYawRate_dps, state.maxYawRate_dps);
  }
  return clamp(state.yawRateCmd_dps, -state.maxYawRate_dps, state.maxYawRate_dps);
};

export const useFlightDirectorStore = create<FlightDirectorState>((set, get) => ({
  enabled: true,
  mode: "MAN",
  coupling: "decoupled",
  targetYaw01: 0,
  schedulerYaw01: null,
  schedulerTs: null,
  relHold01: 0,
  yawRateCmd_dps: 0,
  yawRate_dps: 0,
  riseCmd: 0,
  thrustBias01: 0.68,
  maxYawRate_dps: 60,
  maxYawAccel_dps2: 180,
  kp: 2.15,
  ki: 0.15,
  kd: 0.6,
  _errInt: 0,
  _prevErrDeg: null,
  rateKp: 0.6,
  rateKi: 0.8,
  rateKd: 0.02,
  rateKaw: 4.0,
  rateDHz: 8,
  lastAccelCmd_dps2: 0,
  _rateI: 0,
  _rateDLP: 0,
  _prevRateMeas_dps: null,

  setEnabled: (on) => set({ enabled: !!on }),
  setMode: (mode) =>
    set((state) => {
      if (mode === "HDG") {
        const ds = useDriveSyncStore.getState();
        const currentYaw = wrap01(ds.phase01);
        const schedulerBase =
          state.coupling === "coupled" && typeof state.schedulerYaw01 === "number"
            ? wrap01(state.schedulerYaw01)
            : null;
        const targetYaw01 =
          schedulerBase != null ? wrap01(schedulerBase + state.relHold01) : state.targetYaw01;
        const spRate = computeRateSetpoint(state, targetYaw01, currentYaw);
        const alignedI = alignRateIntegral(state, spRate);
        return {
          mode: "HDG" as FlightMode,
          _errInt: 0,
          _prevErrDeg: null,
          _rateI: alignedI,
          _prevRateMeas_dps: state.yawRate_dps,
        };
      }
      const spRate = clamp(state.yawRateCmd_dps, -state.maxYawRate_dps, state.maxYawRate_dps);
      const alignedI = alignRateIntegral(state, spRate);
      return {
        mode: "MAN" as FlightMode,
        _errInt: 0,
        _prevErrDeg: null,
        _rateI: alignedI,
        _prevRateMeas_dps: state.yawRate_dps,
      };
    }),
  setCoupling: (mode) => {
    const ds = useDriveSyncStore.getState();
    set((state) => {
      const currentYaw = wrap01(ds.phase01);
      if (mode === "coupled") {
        const schedulerBase =
          typeof state.schedulerYaw01 === "number"
            ? wrap01(state.schedulerYaw01)
            : wrap01(ds.phase01);
        const relHold01 = shortest01(currentYaw, schedulerBase);
        const targetYaw01 = currentYaw;
        const spRate = computeRateSetpoint(state, targetYaw01, currentYaw);
        const alignedI = alignRateIntegral(state, spRate);
        return {
          coupling: "coupled" as CouplingMode,
          relHold01,
          targetYaw01,
          _errInt: 0,
          _prevErrDeg: null,
          _rateI: alignedI,
          _prevRateMeas_dps: state.yawRate_dps,
        };
      }
      if (state.coupling === "coupled") {
        const schedulerBase =
          typeof state.schedulerYaw01 === "number"
            ? wrap01(state.schedulerYaw01)
            : null;
        const targetYaw01 =
          schedulerBase != null
            ? wrap01(schedulerBase + state.relHold01)
            : state.targetYaw01;
        const spRate = computeRateSetpoint(state, targetYaw01, currentYaw);
        const alignedI = alignRateIntegral(state, spRate);
        return {
          coupling: "decoupled" as CouplingMode,
          targetYaw01,
          _errInt: 0,
          _prevErrDeg: null,
          _rateI: alignedI,
          _prevRateMeas_dps: state.yawRate_dps,
        };
      }
      return { coupling: "decoupled" as CouplingMode };
    });
  },
  setTargetYaw01: (frac) => {
    const ds = useDriveSyncStore.getState();
    set((state) => {
      const wrapped = wrap01(frac);
      const currentYaw = wrap01(ds.phase01);
      if (state.coupling === "coupled") {
        const schedulerBase =
          typeof state.schedulerYaw01 === "number"
            ? wrap01(state.schedulerYaw01)
            : wrap01(ds.phase01);
        const relHold01 = signedArc01(wrapped - schedulerBase);
        const spRate = computeRateSetpoint(state, wrapped, currentYaw);
        const alignedI = state.mode === "HDG" ? alignRateIntegral(state, spRate) : state._rateI;
        return {
          targetYaw01: wrapped,
          relHold01,
          _errInt: 0,
          _prevErrDeg: null,
          _rateI: alignedI,
          _prevRateMeas_dps: state.yawRate_dps,
        };
      }
      const spRate = computeRateSetpoint(state, wrapped, currentYaw);
      const alignedI = state.mode === "HDG" ? alignRateIntegral(state, spRate) : state._rateI;
      return {
        targetYaw01: wrapped,
        _errInt: 0,
        _prevErrDeg: null,
        _rateI: alignedI,
        _prevRateMeas_dps: state.yawRate_dps,
      };
    });
  },
  nudgeYawRate: (delta) =>
    set((state) => ({
      yawRateCmd_dps: clamp(
        state.yawRateCmd_dps + delta,
        -state.maxYawRate_dps,
        state.maxYawRate_dps
      ),
    })),
  setYawRateCmd: (value) =>
    set((state) => {
      const clamped = clamp(value, -state.maxYawRate_dps, state.maxYawRate_dps);
      if (Math.abs(clamped - state.yawRateCmd_dps) < RATE_EPS_DPS) {
        return state;
      }
      return { yawRateCmd_dps: clamped };
    }),
  zeroRate: () =>
    set({
      yawRateCmd_dps: 0,
      yawRate_dps: 0,
      lastAccelCmd_dps2: 0,
      _rateI: 0,
      _rateDLP: 0,
      _prevRateMeas_dps: null,
    }),
  setRise: (value) => set({ riseCmd: clamp(value, -1, 1) }),
  setThrustBias01: (value) => set({ thrustBias01: clamp(value, 0, 1) }),
  setLimits: (rate, accel) =>
    set({
      maxYawRate_dps: Math.max(5, rate),
      maxYawAccel_dps2: Math.max(30, accel),
    }),
  setGains: (kp, ki, kd) =>
    set({
      kp: Math.max(0, kp),
      ki: Math.max(0, ki),
      kd: Math.max(0, kd),
    }),
  ingestSchedulerWedge: (frac, ts) => {
    const normalized = wrap01(frac);
    const timestamp =
      typeof ts === "number"
        ? ts
        : typeof performance !== "undefined"
          ? performance.now()
          : Date.now();
    set((state) => {
      if (state.coupling === "coupled") {
        const targetYaw01 = wrap01(normalized + state.relHold01);
        return {
          schedulerYaw01: normalized,
          schedulerTs: timestamp,
          targetYaw01,
        };
      }
      return {
        schedulerYaw01: normalized,
        schedulerTs: timestamp,
      };
    });
  },
  setRelHold01: (delta) => {
    const ds = useDriveSyncStore.getState();
    set((state) => {
      const relHold01 = signedArc01(delta);
      const currentYaw = wrap01(ds.phase01);
      if (state.coupling === "coupled") {
        const schedulerBase =
          typeof state.schedulerYaw01 === "number"
            ? wrap01(state.schedulerYaw01)
            : null;
        const targetYaw01 =
          schedulerBase != null
            ? wrap01(schedulerBase + relHold01)
            : state.targetYaw01;
        const spRate = computeRateSetpoint(state, targetYaw01, currentYaw);
        const alignedI = state.mode === "HDG" ? alignRateIntegral(state, spRate) : state._rateI;
        return {
          relHold01,
          targetYaw01,
          _errInt: 0,
          _prevErrDeg: null,
          _rateI: alignedI,
          _prevRateMeas_dps: state.yawRate_dps,
        };
      }
      const spRate = computeRateSetpoint(state, state.targetYaw01, currentYaw);
      const alignedI = state.mode === "HDG" ? alignRateIntegral(state, spRate) : state._rateI;
      return {
        relHold01,
        _errInt: 0,
        _prevErrDeg: null,
        _rateI: alignedI,
        _prevRateMeas_dps: state.yawRate_dps,
      };
    });
  },

  tick: (dt_s, currentYaw01, schedulerYaw01) => {
    const state = get();
    const rateMax = Math.max(0, state.maxYawRate_dps);
    const accMax = Math.max(0, state.maxYawAccel_dps2);
    const safeDt = Number.isFinite(dt_s) && dt_s > 0 ? dt_s : MIN_DT;
    const dt = clamp(safeDt, MIN_DT, MAX_DT);

    const schedulerParam =
      typeof schedulerYaw01 === "number" ? wrap01(schedulerYaw01) : undefined;
    const schedulerBase =
      schedulerParam ??
      (typeof state.schedulerYaw01 === "number"
        ? wrap01(state.schedulerYaw01)
        : undefined);

    const targetAbs01 =
      state.coupling === "coupled" && schedulerBase != null
        ? wrap01(schedulerBase + state.relHold01)
        : state.targetYaw01;

    let demand_dps = clamp(state.yawRateCmd_dps, -rateMax, rateMax);
    if (state.mode === "HDG") {
      const err01 = shortest01(targetAbs01, currentYaw01);
      const errDeg = err01 * 360;
      const absErrDeg = Math.abs(errDeg);
      const errRateDeg =
        state._prevErrDeg == null ? 0 : (errDeg - state._prevErrDeg) / Math.max(1e-3, dt);
      const integralLimit =
        rateMax <= 0 || state.ki <= 0
          ? 0
          : (0.5 * rateMax) / Math.max(state.ki, 1e-3);
      const nextIntRaw =
        absErrDeg > INTEGRAL_DEADBAND_DEG
          ? state._errInt + errDeg * dt
          : state._errInt * Math.max(0, 1 - INTEGRAL_BLEED_RATE * dt);
      const nextInt = integralLimit > 0 ? clamp(nextIntRaw, -integralLimit, integralLimit) : nextIntRaw;
      const pidDemand =
        state.kp * errDeg + state.ki * nextInt + state.kd * errRateDeg;
      demand_dps = clamp(pidDemand, -rateMax, rateMax);
      set({ _errInt: nextInt, _prevErrDeg: errDeg });
    } else if (state._errInt !== 0 || state._prevErrDeg !== null) {
      set({ _errInt: 0, _prevErrDeg: null });
    }

    const measRate = clamp(state.yawRate_dps, -rateMax, rateMax);
    const prevMeas = state._prevRateMeas_dps ?? measRate;
    const dMeas = (measRate - prevMeas) / Math.max(dt, 1e-6);
    const alpha = state.rateDHz > 0 ? Math.exp(-2 * Math.PI * state.rateDHz * dt) : 0;
    const dLP = alpha * state._rateDLP + (1 - alpha) * dMeas;

    const rateError = demand_dps - measRate;
    const unsatAccel = state.rateKp * rateError + state._rateI - state.rateKd * dLP;
    const hardAccel = clamp(unsatAccel, -accMax, accMax);
    const appliedAccel = satSoft(hardAccel, accMax);

    const aw = state.rateKaw * (appliedAccel - unsatAccel);
    const limited = Math.abs(appliedAccel - unsatAccel) > 1e-6;
    const fightingLimit = limited && Math.sign(rateError) === Math.sign(unsatAccel - appliedAccel);

    let nextRateI = state._rateI;
    if (state.rateKi > 0) {
      if (!fightingLimit) {
        nextRateI += (state.rateKi * rateError + aw) * dt;
      } else {
        nextRateI += aw * dt;
      }
      const iLimit = accMax > 0 ? accMax / Math.max(state.rateKi, 1e-3) : Number.POSITIVE_INFINITY;
      if (Number.isFinite(iLimit)) {
        nextRateI = clamp(nextRateI, -iLimit, iLimit);
      }
    } else if (aw !== 0) {
      nextRateI += aw * dt;
    }

    const nextYawRate = clamp(measRate + appliedAccel * dt, -rateMax, rateMax);
    const nextYaw01 = wrap01(currentYaw01 + (nextYawRate / 360) * dt);

    set({
      yawRate_dps: nextYawRate,
      _rateI: nextRateI,
      _rateDLP: dLP,
      _prevRateMeas_dps: measRate,
      lastAccelCmd_dps2: appliedAccel,
    });

    return { nextYaw01, yawRate_dps: nextYawRate };
  },
}));

