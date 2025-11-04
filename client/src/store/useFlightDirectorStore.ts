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
  kp: 1.8,
  ki: 0.2,
  kd: 0,
  _errInt: 0,
  _prevErrDeg: null,

  setEnabled: (on) => set({ enabled: !!on }),
  setMode: (mode) =>
    set(() =>
      mode === "HDG"
        ? { mode, _errInt: 0, _prevErrDeg: null, yawRate_dps: 0 }
        : { mode, _errInt: 0, _prevErrDeg: null }
    ),
  setCoupling: (mode) => {
    const ds = useDriveSyncStore.getState();
    set((state) => {
      if (mode === "coupled") {
        const schedulerBase =
          typeof state.schedulerYaw01 === "number"
            ? wrap01(state.schedulerYaw01)
            : wrap01(ds.phase01);
        const currentYaw = wrap01(ds.phase01);
        const relHold01 = shortest01(currentYaw, schedulerBase);
        return {
          coupling: "coupled" as CouplingMode,
          relHold01,
          targetYaw01: currentYaw,
          _errInt: 0,
          _prevErrDeg: null,
          yawRate_dps: 0,
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
        return {
          coupling: "decoupled" as CouplingMode,
          targetYaw01,
          _errInt: 0,
          _prevErrDeg: null,
          yawRate_dps: 0,
        };
      }
      return {
        coupling: "decoupled" as CouplingMode,
        _errInt: 0,
        _prevErrDeg: null,
      };
    });
  },
  setTargetYaw01: (frac) => {
    const ds = useDriveSyncStore.getState();
    set((state) => {
      const wrapped = wrap01(frac);
      if (state.coupling === "coupled") {
        const schedulerBase =
          typeof state.schedulerYaw01 === "number"
            ? wrap01(state.schedulerYaw01)
            : wrap01(ds.phase01);
        const relHold01 = signedArc01(wrapped - schedulerBase);
        return { targetYaw01: wrapped, relHold01, _errInt: 0, _prevErrDeg: null };
      }
      return { targetYaw01: wrapped, _errInt: 0, _prevErrDeg: null };
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
    set((state) => ({
      yawRateCmd_dps: clamp(value, -state.maxYawRate_dps, state.maxYawRate_dps),
    })),
  zeroRate: () => set({ yawRateCmd_dps: 0, yawRate_dps: 0 }),
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
  setRelHold01: (delta) =>
    set((state) => {
      const relHold01 = signedArc01(delta);
      if (state.coupling === "coupled") {
        const schedulerBase =
          typeof state.schedulerYaw01 === "number"
            ? wrap01(state.schedulerYaw01)
            : null;
        const targetYaw01 =
          schedulerBase != null
            ? wrap01(schedulerBase + relHold01)
            : state.targetYaw01;
        return { relHold01, targetYaw01, _errInt: 0, _prevErrDeg: null };
      }
      return { relHold01, _errInt: 0, _prevErrDeg: null };
    }),

  tick: (dt_s, currentYaw01, schedulerYaw01) => {
    const state = get();
    const rateMax = state.maxYawRate_dps;
    const accMax = state.maxYawAccel_dps2;
    const dt = Number.isFinite(dt_s) ? Math.max(0, Math.min(dt_s, 0.2)) : 0;

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

    let demand_dps = state.yawRateCmd_dps;
    if (state.mode === "HDG") {
      const err01 = shortest01(targetAbs01, currentYaw01);
      const errDeg = err01 * 360;
      const errRateDeg =
        state._prevErrDeg == null ? 0 : (errDeg - state._prevErrDeg) / Math.max(1e-3, dt);
      const integralLimit =
        rateMax <= 0 || state.ki <= 0
          ? 0
          : (0.5 * rateMax) / Math.max(state.ki, 1e-3);
      const nextIntRaw = state._errInt + errDeg * dt;
      const nextInt = clamp(nextIntRaw, -integralLimit, integralLimit);
      const pidDemand =
        state.kp * errDeg + state.ki * nextInt + state.kd * errRateDeg;
      demand_dps = clamp(pidDemand, -rateMax, rateMax);
      set({ _errInt: nextInt, _prevErrDeg: errDeg });
    } else if (state._errInt !== 0 || state._prevErrDeg !== null) {
      set({ _errInt: 0, _prevErrDeg: null });
    }

    const dv = clamp(
      demand_dps - state.yawRate_dps,
      -accMax * dt,
      accMax * dt
    );
    const yawRate_dps = clamp(state.yawRate_dps + dv, -rateMax, rateMax);

    const nextYaw01 = wrap01(currentYaw01 + (yawRate_dps / 360) * dt);
    set({ yawRate_dps });
    return { nextYaw01, yawRate_dps };
  },
}));
