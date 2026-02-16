import { describe, expect, it } from "vitest";
import { resolveStartupConfig } from "../server/startup-config";

describe("resolveStartupConfig", () => {
  it("uses PORT/HOST as-is and does not force deploy overrides", () => {
    const cfg = resolveStartupConfig(
      {
        NODE_ENV: "production",
        REPLIT_DEPLOYMENT: "1",
        PORT: "4312",
        HOST: "0.0.0.0",
      },
      "production",
    );

    expect(cfg.isDeploy).toBe(true);
    expect(cfg.port).toBe(4312);
    expect(cfg.host).toBe("0.0.0.0");
  });

  it("falls back to environment default ports when PORT is invalid", () => {
    const prod = resolveStartupConfig({ PORT: "abc" }, "production");
    const dev = resolveStartupConfig({ PORT: "0", HOST: " " }, "development");

    expect(prod.port).toBe(5000);
    expect(dev.port).toBe(5173);
    expect(dev.host).toBe("0.0.0.0");
  });
});
