import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  helixPlanSchema,
  helixSurfaceStateSchema,
  HELIX_PLAN_VERSION,
  type HelixPlan,
} from "../shared/helix-plan";

describe("helix plan schema", () => {
  it("accepts a valid plan", () => {
    const plan: HelixPlan = {
      version: HELIX_PLAN_VERSION,
      intent: "test shimmy",
      actions: [
        {
          op: "set_peaks",
          mode: "relative",
          peaks: [
            { f: 6400, q: 4.2, gain: 0.2 },
            { f: 12800, q: 5, gain: 0.12 },
          ],
        },
        {
          op: "set_rc",
          rc: 0.42,
        },
        {
          op: "explain",
          why: "demonstration plan",
        },
      ],
    };

    expect(() => helixPlanSchema.parse(plan)).not.toThrow();
  });

  it("rejects out-of-range rc values", () => {
    const result = helixPlanSchema.safeParse({
      version: HELIX_PLAN_VERSION,
      actions: [
        {
          op: "set_rc",
          rc: 1.4,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a plan carrying a plan_id", () => {
    const plan: HelixPlan = {
      version: HELIX_PLAN_VERSION,
      plan_id: randomUUID(),
      actions: [
        {
          op: "set_rc",
          rc: 0.33,
        },
      ],
    };

    expect(() => helixPlanSchema.parse(plan)).not.toThrow();
  });
});

describe("surface state schema", () => {
  it("accepts redacted state with allowed keys", () => {
    const state = {
      seed: 1234,
      branch: 2,
      rc: 0.25,
      T: 0.15,
      peaks: { count: 3 },
      capabilities: ["set_peaks", "move_bubble"],
    };
    expect(() => helixSurfaceStateSchema.parse(state)).not.toThrow();
  });

  it("rejects unexpected keys", () => {
    const result = helixSurfaceStateSchema.safeParse({
      seed: 1,
      unknown: "oops",
    } as unknown);
    expect(result.success).toBe(false);
  });
});
