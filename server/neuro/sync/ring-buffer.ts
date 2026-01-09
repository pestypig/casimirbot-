import type { NeuroFrame, NeuroStreamKind } from "../schemas/neuro.schemas.js";

export type NeuroFrameEntry = {
  frame: NeuroFrame;
  tsStart: number;
  tsEnd: number;
  sampleCount: number;
};

export type NeuroFrameWindow = {
  stream: NeuroStreamKind;
  deviceId: string;
  tsStart: number;
  tsEnd: number;
  sampleCount: number;
  frames: NeuroFrame[];
};

type RingBufferOptions = {
  maxSeconds?: number;
};

const toKey = (stream: NeuroStreamKind, deviceId: string) =>
  `${stream}:${deviceId}`;

export class NeuroFrameRingBuffer {
  private maxSeconds: number;
  private framesByKey = new Map<string, NeuroFrameEntry[]>();

  constructor(options: RingBufferOptions = {}) {
    this.maxSeconds = Math.max(1, options.maxSeconds ?? 15);
  }

  push(frame: NeuroFrame): void {
    const tsStart = frame.tsAligned ?? frame.tsRecvMono;
    const firstChannel = frame.samples[0];
    const sampleCount = firstChannel ? firstChannel.length : 0;
    const durationMs =
      sampleCount > 0 ? (sampleCount / frame.sampleRateHz) * 1000 : 0;
    const tsEnd = tsStart + durationMs;
    const entry: NeuroFrameEntry = { frame, tsStart, tsEnd, sampleCount };
    const key = toKey(frame.stream, frame.deviceId);
    const list = this.framesByKey.get(key) ?? [];
    list.push(entry);
    this.framesByKey.set(key, list);
    this.pruneList(list, tsEnd);
  }

  getLatestWindow(input: {
    stream: NeuroStreamKind;
    deviceId: string;
    windowSeconds: number;
    now?: number;
  }): NeuroFrameWindow | null {
    const key = toKey(input.stream, input.deviceId);
    const list = this.framesByKey.get(key);
    if (!list || list.length === 0) {
      return null;
    }
    const latest = list[list.length - 1];
    const tsEnd = input.now ?? latest.tsEnd;
    const tsStart = tsEnd - input.windowSeconds * 1000;
    return this.getWindow({
      stream: input.stream,
      deviceId: input.deviceId,
      tsStart,
      tsEnd,
    });
  }

  getWindow(input: {
    stream: NeuroStreamKind;
    deviceId: string;
    tsStart: number;
    tsEnd: number;
  }): NeuroFrameWindow | null {
    const key = toKey(input.stream, input.deviceId);
    const list = this.framesByKey.get(key);
    if (!list || list.length === 0) {
      return null;
    }
    const frames: NeuroFrame[] = [];
    let sampleCount = 0;
    for (const entry of list) {
      if (entry.tsEnd < input.tsStart) {
        continue;
      }
      if (entry.tsStart > input.tsEnd) {
        break;
      }
      frames.push(entry.frame);
      sampleCount += entry.sampleCount * entry.frame.samples.length;
    }
    if (frames.length === 0) {
      return null;
    }
    return {
      stream: input.stream,
      deviceId: input.deviceId,
      tsStart: input.tsStart,
      tsEnd: input.tsEnd,
      sampleCount,
      frames,
    };
  }

  private pruneList(list: NeuroFrameEntry[], nowMs: number): void {
    const cutoff = nowMs - this.maxSeconds * 1000;
    let idx = 0;
    while (idx < list.length && list[idx].tsEnd < cutoff) {
      idx += 1;
    }
    if (idx > 0) {
      list.splice(0, idx);
    }
  }
}
