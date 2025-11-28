// Shared types for the TSN/Qbv simulator API (client + server).
// Logic lives in simulations/tsn-sim.ts on the server side.

export type GateWindow = {
  name: string;
  startNs: number;
  endNs: number;
  priorities: number[];
  guardBandNs?: number;
};

export type Schedule = {
  cycleNs: number;
  windows: GateWindow[];
};

export type Flow = {
  name: string;
  priority: number;
  sizeBytes: number;
  intervalCycles: number;
  offsetCycles?: number;
  jitterNs?: number;
  hops: number;
  linkSpeedMbps: number;
  deadlineNs: number;
  preemptible?: boolean;
  cutThrough?: boolean;
};

export type Faults = {
  dropProbability?: number;
  lateInjectionNs?: number;
  lateEveryNCycles?: number;
  clockStepNs?: number;
  clockStepAtCycle?: number;
  ber?: number;
  crcDetects?: number;
};

export type ClockModel = {
  driftPpm: number;
  servoGain: number;
  noiseNs?: number;
  gmStepNs?: number;
  gmStepAtCycle?: number;
};

export type SimConfig = {
  schedule: Schedule;
  flows: Flow[];
  cycles: number;
  hopLatencyNs?: number;
  faults?: Faults;
  clock?: ClockModel;
};

export type FrameResult = {
  flow: string;
  cycle: number;
  sentAtNs: number;
  window: string | null;
  fitsWindow: boolean;
  e2eLatencyNs: number | null;
  deadlineHit: boolean | null;
  dropped: boolean;
  crcUndetected?: boolean;
  clockOffsetNs?: number;
};

export type SimResult = {
  frames: FrameResult[];
  summary: {
    total: number;
    delivered: number;
    windowMiss: number;
    deadlineMiss: number;
    dropped: number;
    crcUndetected: number;
  };
  fm: Array<{ cycle: number; state: "normal" | "degrade" | "safe"; reason?: string }>;
};
