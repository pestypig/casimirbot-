import type { QISample } from "@shared/schema";

type Subscriber = (frame: QISample) => void;

class QiSnapHub {
  private subs = new Set<Subscriber>();

  subscribe(fn: Subscriber): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  publish(frame: QISample): void {
    for (const fn of Array.from(this.subs)) {
      try {
        fn(frame);
      } catch {
        // ignore subscriber errors
      }
    }
  }

  get subscriberCount(): number {
    return this.subs.size;
  }
}

export const qiSnapHub = new QiSnapHub();
