import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Pump driver shim with optional hardware attachment.
// Defaults to a no-op driver that simply logs target updates when PUMP_LOG=1.

export interface PumpDriver {
  setFrequencyHz(f_Hz: number): Promise<void>;
  setDepth(m: number): Promise<void>;
  setPhaseDeg(phi_deg: number): Promise<void>;
  getState(): Promise<{ f_Hz: number; m: number; phi_deg: number }>;
}

class NoopPumpDriver implements PumpDriver {
  private state = { f_Hz: 0, m: 0, phi_deg: 0 };

  async setFrequencyHz(f_Hz: number) {
    this.state.f_Hz = f_Hz;
    if (process.env.PUMP_LOG === "1") {
      console.info(`[pump/noop] setFrequencyHz -> ${(f_Hz / 1e9).toFixed(6)} GHz`);
    }
  }

  async setDepth(m: number) {
    this.state.m = m;
    if (process.env.PUMP_LOG === "1") {
      console.info(`[pump/noop] setDepth -> ${m.toFixed(4)}`);
    }
  }

  async setPhaseDeg(phi_deg: number) {
    this.state.phi_deg = phi_deg;
    if (process.env.PUMP_LOG === "1") {
      console.info(`[pump/noop] setPhaseDeg -> ${phi_deg.toFixed(3)} deg`);
    }
  }

  async getState() {
    return { ...this.state };
  }
}

let driver: PumpDriver = new NoopPumpDriver();

const resolvePumpMockModuleSpecifier = (): string | null => {
  const root = process.cwd();
  const moduleDir = path.dirname(new URL(import.meta.url).pathname);
  const candidates = [
    path.join(root, "dist", "server", "instruments", "pump-mock.js"),
    path.join(root, "server", "instruments", "pump-mock.js"),
    path.join(root, "server", "instruments", "pump-mock.ts"),
    path.join(moduleDir, "pump-mock.js"),
    path.join(moduleDir, "pump-mock.ts"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
};

export function attachPumpDriver(drv: PumpDriver) {
  driver = drv;
}

export function hasPump(): boolean {
  return !!driver;
}

export async function slewPump(target: {
  f_Hz?: number;
  freq_GHz?: number;
  m?: number;
  depth?: number;
  depth_pct?: number;
  phi_deg?: number;
}) {
  if (!driver) {
    return { ok: false as const, reason: "no-driver" as const };
  }

  const f_Hz = Number.isFinite(target.f_Hz)
    ? Number(target.f_Hz)
    : Number.isFinite(target.freq_GHz)
    ? Number(target.freq_GHz) * 1e9
    : undefined;

  if (typeof f_Hz === "number") {
    await driver.setFrequencyHz(f_Hz);
  }

  if (Number.isFinite(target.m)) {
    await driver.setDepth(Math.max(0, Math.min(0.1, Number(target.m))));
  } else if (Number.isFinite(target.depth)) {
    await driver.setDepth(Math.max(0, Math.min(0.1, Number(target.depth))));
  } else if (Number.isFinite(target.depth_pct)) {
    await driver.setDepth(Math.max(0, Math.min(0.1, Number(target.depth_pct) / 100)));
  }

  if (Number.isFinite(target.phi_deg)) {
    await driver.setPhaseDeg(Number(target.phi_deg));
  }

  const state = await driver.getState();
  return { ok: true as const, state };
}

void (async () => {
  if (!process.env.PUMP_DRIVER || process.env.PUMP_DRIVER === "mock") {
    try {
      const moduleSpecifier = resolvePumpMockModuleSpecifier();
      if (!moduleSpecifier) {
        return;
      }
      const { MockCasimirPumpDriver } = await import(moduleSpecifier);
      const settleEnv = Number(process.env.PUMP_MOCK_SETTLE_MS);
      const jitterEnv = Number(process.env.PUMP_MOCK_JITTER_MS);
      const settleMs = Number.isFinite(settleEnv) ? settleEnv : undefined;
      const jitterMs = Number.isFinite(jitterEnv) ? jitterEnv : undefined;
      attachPumpDriver(new MockCasimirPumpDriver({ settleMs, jitterMs }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/pump-mock\.(ts|js)|Cannot find module|ERR_MODULE_NOT_FOUND/i.test(msg)) {
        return;
      }
      console.warn(`[pump] mock driver init failed: ${msg}`);
    }
  }
})();
