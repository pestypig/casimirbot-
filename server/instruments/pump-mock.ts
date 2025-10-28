// Mock pump driver that emulates finite settle times and preserves the PumpDriver contract.
import type { PumpDriver } from "./pump.js";

type MockPumpOptions = {
  settleMs?: number;
  jitterMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

export class MockCasimirPumpDriver implements PumpDriver {
  private state = { f_Hz: 0, m: 0, phi_deg: 0 };
  private readonly opts: MockPumpOptions;
  private lastSettleMs = 0;

  constructor(opts: MockPumpOptions = {}) {
    this.opts = opts;
  }

  private async settle(extra = 0): Promise<void> {
    const base = Math.max(0, this.opts.settleMs ?? 30);
    const jitterBudget = this.opts.jitterMs ?? 5;
    const jitter = jitterBudget > 0 ? Math.random() * jitterBudget : 0;
    const delay = Math.round(base + jitter + extra);
    this.lastSettleMs = delay;
    if (delay > 0) {
      await sleep(delay);
    }
  }

  async setFrequencyHz(f_Hz: number): Promise<void> {
    await this.settle();
    this.state.f_Hz = f_Hz;
  }

  async setDepth(m: number): Promise<void> {
    await this.settle();
    this.state.m = m;
  }

  async setPhaseDeg(phi_deg: number): Promise<void> {
    await this.settle();
    this.state.phi_deg = phi_deg;
  }

  async getState(): Promise<{ f_Hz: number; m: number; phi_deg: number }> {
    return { ...this.state };
  }

  get settleMs(): number {
    return Math.max(0, this.opts.settleMs ?? 30);
  }

  get lastSettleDuration(): number {
    return this.lastSettleMs;
  }
}

