import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { tinySykPlanSchema } from "../shared/er-epr-tiny-syk";
import { buildTinySykControlPlans, classifyTinySykControlLeakage } from "../shared/er-epr-tiny-syk-controls";

describe("tiny SYK controls", () => {
  it("derives required controls from the same base plan", () => {
    const plan = tinySykPlanSchema.parse(JSON.parse(readFileSync("tests/fixtures/er-epr-tiny-syk/tiny-syk-plan.fixture.json", "utf8")));
    const controls = buildTinySykControlPlans(plan);
    expect(controls.map((control) => control.kind)).toContain("wrong_sign_control");
    expect(controls.find((control) => control.kind === "wrong_sign_control")?.plan.model.coupling.sign).toBe("wrong");
    expect(controls.find((control) => control.kind === "no_coupling_control")?.plan.model.coupling.mu).toBe(0);
    expect(controls.find((control) => control.kind === "disentangled_control")?.plan.model.statePreparation).toBe("disentangled_control");
    expect(controls.find((control) => control.kind === "shuffled_hamiltonian_control")?.nonHolographicControl).toBe(true);
  });

  it("demotes on control leakage", () => {
    expect(classifyTinySykControlLeakage([0.1, 0.2, 0.3])).toBe("controls_failed");
    expect(classifyTinySykControlLeakage([0.1, 0.5])).toBe("control_leakage");
  });
});
