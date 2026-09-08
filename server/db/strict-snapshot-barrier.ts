type Waiter = {
  tables: readonly string[] | undefined;
  resolve: () => void;
  reject: (error: unknown) => void;
};

/** Coalesce durability requests, not database mutations or acknowledgements.
 * A caller arriving after capture belongs to the next save, even if its table
 * happens to be included in the in-flight snapshot. Failures are never retried
 * on behalf of a failed caller. */
export class StrictSnapshotBarrier {
  private pending: Waiter[] = [];
  private running: Promise<void> | null = null;

  constructor(private readonly save: (tables: readonly string[] | undefined) => Promise<void>) {}

  request(tables?: readonly string[]): Promise<void> {
    if (tables?.length === 0) return Promise.resolve();
    const result = new Promise<void>((resolve, reject) => {
      this.pending.push({ tables: tables && [...tables], resolve, reject });
    });
    this.start();
    return result;
  }

  async drain(): Promise<void> {
    while (this.running) await this.running;
  }

  private start(): void {
    if (this.running) return;
    this.running = Promise.resolve().then(async () => {
      while (this.pending.length) {
        const batch = this.pending;
        this.pending = [];
        const tables = batch.some(waiter => waiter.tables === undefined)
          ? undefined : [...new Set(batch.flatMap(waiter => [...waiter.tables!]))];
        try {
          await this.save(tables);
          for (const waiter of batch) waiter.resolve();
        } catch (error) {
          for (const waiter of batch) waiter.reject(error);
        }
      }
    }).finally(() => {
      this.running = null;
      if (this.pending.length) this.start();
    });
  }
}
