export type LocalPersistenceSchedulerOptions = {
  idleDelayMs: number;
  maxDelayMs: number;
  persist: () => Promise<void>;
  onError?: (error: unknown) => void;
};

export class LocalPersistenceScheduler {
  private dirty = false;
  private dirtySinceMs: number | null = null;
  private timer: NodeJS.Timeout | null = null;
  private writeInFlight: Promise<void> | null = null;

  constructor(private readonly options: LocalPersistenceSchedulerOptions) {}

  schedule(): void {
    const now = Date.now();
    this.dirty = true;
    this.dirtySinceMs ??= now;
    this.armTimer(now);
  }

  async flush(): Promise<void> {
    this.clearTimer();
    if (this.writeInFlight) {
      await this.writeInFlight;
    }
    if (!this.dirty) return;

    this.dirty = false;
    this.dirtySinceMs = null;
    const write = this.options.persist().catch((error) => {
      this.options.onError?.(error);
    });
    this.writeInFlight = write;
    await write;
    if (this.writeInFlight === write) {
      this.writeInFlight = null;
    }
    if (this.dirty) {
      this.armTimer(Date.now());
    }
  }

  async drain(): Promise<void> {
    await this.flush();
    if (this.dirty || this.writeInFlight) {
      await this.drain();
    }
  }

  reset(): void {
    this.clearTimer();
    this.dirty = false;
    this.dirtySinceMs = null;
    this.writeInFlight = null;
  }

  private armTimer(now: number): void {
    this.clearTimer();
    const idleDeadline = now + this.options.idleDelayMs;
    const maxDeadline =
      (this.dirtySinceMs ?? now) + this.options.maxDelayMs;
    const delayMs = Math.max(0, Math.min(idleDeadline, maxDeadline) - now);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delayMs);
    this.timer.unref?.();
  }

  private clearTimer(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
  }
}
