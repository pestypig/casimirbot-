import { setTimeout as delay } from "node:timers/promises";

const SAMPLE_INTERVAL_MS = 250;

type DeviceLease = { device: "gpu" | "cpu"; release: () => void };

const parseTemp = (value?: string): number | null => {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const readGpuTemp = (): number => {
  const override = parseTemp(process.env.GPU_TEMP_OVERRIDE);
  if (override !== null) {
    return override;
  }
  const envTemp = parseTemp(process.env.GPU_TEMP_C);
  if (envTemp !== null) {
    return envTemp;
  }
  return 60;
};

const getMaxGpuTemp = (): number => Number(process.env.GPU_TEMP_MAX_C ?? 82);
const getMediaGpuConcurrency = (): number => Math.max(1, Number(process.env.MEDIA_GPU_CONCURRENCY ?? 1));
const getSttGpuConcurrency = (): number => Math.max(0, Number(process.env.STT_GPU_CONCURRENCY ?? 1));

const noop = (): void => {};

class GpuScheduler {
  private llmActive = 0;
  private mediaActive = 0;
  private sttGpuActive = 0;

  beginLlMJob(): () => void {
    this.llmActive += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.llmActive = Math.max(0, this.llmActive - 1);
    };
  }

  shouldUseGpuForStt(): boolean {
    return this.prefersGpuForStt();
  }

  acquireSttDevice(): DeviceLease {
    if (!this.prefersGpuForStt()) {
      return { device: "cpu", release: noop };
    }
    this.sttGpuActive += 1;
    let released = false;
    return {
      device: "gpu",
      release: () => {
        if (released) return;
        released = true;
        this.sttGpuActive = Math.max(0, this.sttGpuActive - 1);
      },
    };
  }

  async acquireMediaSlot(tag = "media.generate"): Promise<() => void> {
    for (;;) {
      const temp = readGpuTemp();
      if (this.canRunMediaJob(temp)) {
        this.mediaActive += 1;
        let released = false;
        return () => {
          if (released) return;
          released = true;
          this.mediaActive = Math.max(0, this.mediaActive - 1);
        };
      }
      await delay(SAMPLE_INTERVAL_MS);
    }
  }

  reset(): void {
    this.llmActive = 0;
    this.mediaActive = 0;
    this.sttGpuActive = 0;
  }

  private prefersGpuForStt(): boolean {
    if (this.llmActive > 0) {
      return false;
    }
    if (readGpuTemp() >= getMaxGpuTemp() - 3) {
      return false;
    }
    const capacity = getSttGpuConcurrency();
    if (capacity <= 0) {
      return false;
    }
    if (this.sttGpuActive >= capacity) {
      return false;
    }
    return true;
  }

  private canRunMediaJob(currentTemp: number): boolean {
    const withinTemp = currentTemp < getMaxGpuTemp();
    const llmIdle = this.llmActive === 0;
    const hasCapacity = this.mediaActive < getMediaGpuConcurrency();
    return withinTemp && llmIdle && hasCapacity;
  }
}

const scheduler = new GpuScheduler();

export const beginLlMJob = (): (() => void) => scheduler.beginLlMJob();
export const shouldUseGpuForStt = (): boolean => scheduler.shouldUseGpuForStt();
export const acquireMediaSlot = async (tag = "media.generate"): Promise<() => void> =>
  scheduler.acquireMediaSlot(tag);
export const acquireSttDevice = (): DeviceLease => scheduler.acquireSttDevice();
export const resetGpuSchedulerState = (): void => scheduler.reset();
export const getGpuThermals = (): { current: number; max: number } => ({
  current: readGpuTemp(),
  max: getMaxGpuTemp(),
});
