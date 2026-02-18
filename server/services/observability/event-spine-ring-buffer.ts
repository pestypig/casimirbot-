export type RingBufferSnapshot<T> = {
  values: T[];
  dropped: number;
  capacity: number;
};

export class EventSpineRingBuffer<T> {
  private readonly capacity: number;
  private readonly values: T[] = [];
  private dropped = 0;

  constructor(capacity: number) {
    const normalized = Number.isFinite(capacity) ? Math.floor(capacity) : 256;
    this.capacity = Math.min(Math.max(normalized, 1), 100000);
  }

  push(value: T): void {
    this.values.push(value);
    if (this.values.length > this.capacity) {
      this.values.shift();
      this.dropped += 1;
    }
  }

  latest(limit?: number): T[] {
    if (this.values.length === 0) return [];
    if (limit === undefined) return [...this.values];
    const normalized = Math.max(1, Math.floor(limit));
    return this.values.slice(Math.max(0, this.values.length - normalized));
  }

  snapshot(limit?: number): RingBufferSnapshot<T> {
    return {
      values: this.latest(limit),
      dropped: this.dropped,
      capacity: this.capacity,
    };
  }

  reset(): void {
    this.values.length = 0;
    this.dropped = 0;
  }
}
