/**
 * Minimal TSN/Qbv schedule simulator:
 * - Defines time-aware gate windows within a fixed cycle.
 * - Emits periodic flows and checks if frames fit their assigned window.
 * - Computes simple per-hop latency and deadline hits/misses.
 *
 * This is logic-only (no TSN hardware). It helps tune cycles, guard bands, and FM thresholds.
 */

type GateWindow = {
  name: string;
  startNs: number;
  endNs: number;
  priorities: number[]; // allowed traffic classes
  guardBandNs?: number; // optional shrink to account for non-preemptive tails
};

type Schedule = {
  cycleNs: number;
  windows: GateWindow[];
};

type Flow = {
  name: string;
  priority: number;
  sizeBytes: number;
  intervalCycles: number; // send every N cycles
  offsetCycles?: number; // starting offset
  jitterNs?: number; // peak-to-peak jitter to apply to send time within cycle
  hops: number;
  linkSpeedMbps: number;
  deadlineNs: number; // end-to-end requirement
  preemptible?: boolean; // if true, assume frame can be preempted (smaller guard needed)
  cutThrough?: boolean; // if true, halve store-and-forward latency per hop
};

type Faults = {
  dropProbability?: number; // per-frame drop
  lateInjectionNs?: number; // delay added to selected frames
  lateEveryNCycles?: number; // apply late injection every N cycles (per flow)
  clockStepNs?: number; // step in send time to emulate offset jump
  clockStepAtCycle?: number; // cycle at which to apply clock step
  ber?: number; // bit error rate on the link (used for CRC hit/miss simulation)
  crcDetects?: number; // probability CRC detects a corrupted frame (0-1)
};

type SimConfig = {
  schedule: Schedule;
  flows: Flow[];
  cycles: number;
  hopLatencyNs?: number; // store-and-forward base per hop
  faults?: Faults;
  clock?: ClockModel;
};

type FrameResult = {
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

type SimResult = {
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

const serializationNs = (sizeBytes: number, linkSpeedMbps: number) => (sizeBytes * 8 * 1_000) / linkSpeedMbps;

const deterministicJitter = (cycle: number, seed: number, jitterNs: number) => {
  // Tiny deterministic LCG to avoid nondeterminism
  const a = 1664525;
  const c = 1013904223;
  const m = 2 ** 32;
  const next = (a * (cycle + seed) + c) % m;
  const half = jitterNs / 2;
  return jitterNs === 0 ? 0 : (next / m) * jitterNs - half;
};

// Clock model: crude drift + servo correction + GM swap hook.
export type ClockModel = {
  driftPpm: number; // nominal drift
  servoGain: number; // fraction of error corrected per cycle
  noiseNs?: number; // additive random noise
  gmStepNs?: number; // GM offset jump
  gmStepAtCycle?: number;
};

const clockOffsetForCycle = (cycle: number, cycleNs: number, model?: ClockModel): number => {
  if (!model) return 0;
  const drift = (model.driftPpm / 1_000_000) * cycle * cycleNs;
  const gmStep = model.gmStepNs && model.gmStepAtCycle === cycle ? model.gmStepNs : 0;
  const noise = model.noiseNs ? deterministicJitter(cycle, 99991, model.noiseNs) : 0;
  // Servo pulls offset back toward zero
  const servo = -model.servoGain * drift;
  return drift + gmStep + noise + servo;
};

const findWindow = (
  schedule: Schedule,
  priority: number,
  sendTimeNs: number,
  frameNs: number,
  preemptible: boolean,
): GateWindow | null => {
  for (const w of schedule.windows) {
    const guard = preemptible ? 0 : (w.guardBandNs ?? 0);
    const usableStart = w.startNs;
    const usableEnd = w.endNs - guard;
    const inWindow = sendTimeNs >= usableStart && sendTimeNs + frameNs <= usableEnd;
    const priorityAllowed = w.priorities.includes(priority);
    if (priorityAllowed && inWindow) {
      return w;
    }
  }
  return null;
};

export function simulate(config: SimConfig): SimResult {
  const hopLatencyNs = config.hopLatencyNs ?? 300; // conservative default per hop
  const frames: FrameResult[] = [];
  const fm: Array<{ cycle: number; state: "normal" | "degrade" | "safe"; reason?: string }> = [];
  let state: "normal" | "degrade" | "safe" = "normal";
  let consecMiss = 0;

  for (let cycle = 0; cycle < config.cycles; cycle++) {
    const clockOffsetNs = clockOffsetForCycle(cycle, config.schedule.cycleNs, config.clock);

    for (const flow of config.flows) {
      const offset = flow.offsetCycles ?? 0;
      if ((cycle - offset) < 0 || (cycle - offset) % flow.intervalCycles !== 0) continue;

      const frameNs = serializationNs(flow.sizeBytes, flow.linkSpeedMbps);
      const jitterNs = flow.jitterNs ?? 0;
      let sendAtNs = deterministicJitter(cycle, flow.priority, jitterNs) + clockOffsetNs;
      if (config?.faults?.clockStepNs && config?.faults?.clockStepAtCycle === cycle) {
        sendAtNs += config.faults.clockStepNs;
      }
      const lateHit =
        config?.faults?.lateInjectionNs &&
        config?.faults?.lateEveryNCycles &&
        config.faults.lateEveryNCycles > 0 &&
        cycle % config.faults.lateEveryNCycles === 0;
      if (lateHit) {
        sendAtNs += config.faults!.lateInjectionNs!;
      }
      const dropped =
        (config?.faults?.dropProbability ?? 0) > 0 &&
        Math.random() < (config.faults!.dropProbability as number);
      const window = dropped ? null : findWindow(config.schedule, flow.priority, sendAtNs, frameNs, !!flow.preemptible);

      const perHopFrame = flow.cutThrough ? frameNs * 0.5 : frameNs;
      const e2eLatencyNs = window ? perHopFrame * flow.hops + hopLatencyNs * flow.hops : null;

      // Channel errors with CRC detect/undetected
      const ber = config?.faults?.ber ?? 0;
      const bits = flow.sizeBytes * 8;
      const corrupted = ber > 0 && Math.random() < 1 - Math.pow(1 - ber, bits);
      const crcDetects = config?.faults?.crcDetects ?? 1;
      const crcHit = corrupted && Math.random() < crcDetects;
      const crcUndetected = corrupted && !crcHit;

      const finalDropped = dropped || crcHit;
      const deadlineHit = finalDropped ? null : e2eLatencyNs == null ? null : e2eLatencyNs <= flow.deadlineNs;

      frames.push({
        flow: flow.name,
        cycle,
        sentAtNs: sendAtNs,
        window: window?.name ?? null,
        fitsWindow: Boolean(window),
        e2eLatencyNs,
        deadlineHit,
        dropped: finalDropped,
        crcUndetected: crcUndetected || undefined,
        clockOffsetNs,
      });

      // FM state machine: missed window or deadline -> degrade; consecutive (>=3) -> safe.
      const windowMiss = !finalDropped && !window;
      const deadlineMiss = deadlineHit === false;
      if (windowMiss || deadlineMiss || finalDropped) {
        consecMiss += 1;
        if (state === "normal") {
          state = "degrade";
          fm.push({ cycle, state, reason: finalDropped ? "drop" : windowMiss ? "window_miss" : "deadline_miss" });
        }
        if (consecMiss >= 3 && state !== "safe") {
          state = "safe";
          fm.push({ cycle, state, reason: "consecutive_miss>=3" });
        }
      } else {
        consecMiss = 0;
        if (state !== "normal") {
          state = "normal";
          fm.push({ cycle, state, reason: "recovered" });
        }
      }
    }
  }

  const summary = frames.reduce(
    (acc, f) => {
      acc.total += 1;
      if (!f.fitsWindow) acc.windowMiss += 1;
      if (f.e2eLatencyNs != null) acc.delivered += 1;
      if (f.deadlineHit === false) acc.deadlineMiss += 1;
      if (f.dropped) acc.dropped += 1;
      if (f.crcUndetected) acc.crcUndetected += 1;
      return acc;
    },
    { total: 0, delivered: 0, windowMiss: 0, deadlineMiss: 0, dropped: 0, crcUndetected: 0 },
  );

  return { frames, summary, fm };
}

// Default 1 ms cycle with a 200 µs control slice and 100 µs guard.
export const DEFAULT_QBV_SCHEDULE: Schedule = {
  cycleNs: 1_000_000,
  windows: [
    { name: "control-high", startNs: 0, endNs: 200_000, priorities: [0], guardBandNs: 20_000 },
    { name: "best-effort", startNs: 200_000, endNs: 1_000_000, priorities: [1, 2, 3], guardBandNs: 0 },
  ],
};

export const DEMO_FLOWS: Flow[] = [
  {
    name: "ctrl-loop",
    priority: 0,
    sizeBytes: 256,
    intervalCycles: 1,
    jitterNs: 20_000,
    hops: 3,
    linkSpeedMbps: 1000,
    deadlineNs: 300_000, // 300 µs budget
  },
  {
    name: "telemetry",
    priority: 2,
    sizeBytes: 1500,
    intervalCycles: 2,
    jitterNs: 50_000,
    hops: 3,
    linkSpeedMbps: 1000,
    deadlineNs: 800_000, // 0.8 ms budget
  },
];

// Allow direct execution under ESM (ts-node/tsx) without require()
const isDirectRun = (() => {
  try {
    const url = import.meta.url;
    const argv0 = process?.argv?.[1];
    if (!url || !argv0) return false;
    const resolved = new URL(url);
    const argvUrl = new URL(`file://${argv0}`);
    return resolved.href === argvUrl.href;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  const result = simulate({
    schedule: DEFAULT_QBV_SCHEDULE,
    flows: DEMO_FLOWS,
    cycles: 10,
    hopLatencyNs: 500,
    clock: { driftPpm: 10, servoGain: 0.2, noiseNs: 200, gmStepNs: 5_000, gmStepAtCycle: 6 },
    faults: {
      dropProbability: 0.05,
      lateInjectionNs: 80_000,
      lateEveryNCycles: 4,
      clockStepNs: 50_000,
      clockStepAtCycle: 5,
      ber: 1e-8,
      crcDetects: 0.999999,
    },
  });
  console.log("Summary", result.summary);
  console.log("FM log", result.fm);
  console.log("First 5 frames", result.frames.slice(0, 5));
}
