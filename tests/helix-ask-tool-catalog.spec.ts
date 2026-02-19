import express from "express";
import type { Server } from "http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("Helix Ask tool catalog", () => {
  let server: Server;
  let baseUrl = "http://127.0.0.1:0";

  beforeAll(async () => {
    process.env.ENABLE_AGI = "1";
    vi.resetModules();
    const { planRouter } = await import("../server/routes/agi.plan");
    const app = express();
    app.use(express.json({ limit: "5mb" }));
    app.use("/api/agi", planRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  }, 60000);

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("returns typed stable capability cards", async () => {
    const response = await fetch(`${baseUrl}/api/agi/tools/catalog`);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as Array<{
      id?: string;
      name?: string;
      purpose?: string;
      intents?: string[];
      requiredInputs?: string[];
      sideEffectClass?: string;
      dryRunSupported?: boolean;
      trustRequirements?: string[];
      verifyRequirements?: string[];
    }>;
    const halobank = payload.find((entry) => entry.id === "halobank.time.compute");
    expect(halobank).toBeTruthy();
    expect(halobank?.name).toBe("halobank.time.compute");
    expect(typeof halobank?.purpose).toBe("string");
    expect(Array.isArray(halobank?.intents)).toBe(true);
    expect(Array.isArray(halobank?.requiredInputs)).toBe(true);
    expect(["none", "read", "write", "external"]).toContain(halobank?.sideEffectClass);
    expect(typeof halobank?.dryRunSupported).toBe("boolean");
    expect(Array.isArray(halobank?.trustRequirements)).toBe(true);
    expect(Array.isArray(halobank?.verifyRequirements)).toBe(true);
  });
});
