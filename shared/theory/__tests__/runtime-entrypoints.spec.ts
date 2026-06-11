import { describe, expect, it } from "vitest";
import {
  isTheoryRuntimeEntrypointV1,
  validateTheoryRuntimeEntrypointV1,
} from "../../contracts/theory-runtime-entrypoint.v1";
import {
  findTheoryRuntimeEntrypointsForBadge,
  getTheoryRuntimeEntrypoint,
  THEORY_RUNTIME_ENTRYPOINTS,
} from "../runtime-entrypoints";

describe("theory runtime entrypoint registry", () => {
  it("exports valid runtime entrypoint contracts", () => {
    expect(THEORY_RUNTIME_ENTRYPOINTS).toHaveLength(7);

    for (const entrypoint of THEORY_RUNTIME_ENTRYPOINTS) {
      expect(validateTheoryRuntimeEntrypointV1(entrypoint)).toEqual([]);
      expect(isTheoryRuntimeEntrypointV1(entrypoint)).toBe(true);
    }
  });

  it("uses unique runtime IDs", () => {
    const runtimeIds = THEORY_RUNTIME_ENTRYPOINTS.map((entrypoint) => entrypoint.runtimeId);

    expect(new Set(runtimeIds).size).toBe(runtimeIds.length);
    expect(runtimeIds).toEqual(
      expect.arrayContaining([
        "gr.loop",
        "physics.validate",
        "casimir.verify",
        "solar.pipeline",
        "solar.manifest",
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );
  });

  it("keeps NHM2/warp runtime lanes conservative and non-promoting", () => {
    const warpEntries = THEORY_RUNTIME_ENTRYPOINTS.filter(
      (entrypoint) => entrypoint.runtimeId.includes("warp") || entrypoint.runtimeId.includes("nhm2"),
    );

    expect(warpEntries.length).toBeGreaterThanOrEqual(2);
    for (const entrypoint of warpEntries) {
      expect(entrypoint.claimBoundary.promotionAllowed).toBe(false);
      expect(entrypoint.claimBoundary.maximumTier).not.toBe("certified");
      expect(entrypoint.claimBoundary.promotionRequires.length).toBeGreaterThan(0);
    }
  });

  it("stores commands as inert string metadata", () => {
    let executedCommand = false;
    const commands = THEORY_RUNTIME_ENTRYPOINTS.map((entrypoint) => entrypoint.command);

    expect(commands.every((command) => typeof command === "string" && command.startsWith("npm run "))).toBe(true);
    expect(executedCommand).toBe(false);
  });

  it("finds entrypoints by runtime ID and owned badge ID", () => {
    expect(getTheoryRuntimeEntrypoint("solar.pipeline")?.runtimeId).toBe("solar.pipeline");
    expect(getTheoryRuntimeEntrypoint("missing.runtime")).toBeNull();

    const nhm2Entrypoints = findTheoryRuntimeEntrypointsForBadge("nhm2.closure.source_residual").map(
      (entrypoint) => entrypoint.runtimeId,
    );

    expect(nhm2Entrypoints).toEqual(
      expect.arrayContaining(["physics.validate", "warp.full_solve.campaign", "nhm2.shift_lapse.alpha_sweep"]),
    );

    const wallEntrypoints = findTheoryRuntimeEntrypointsForBadge("nhm2.source.wall_t00_trace").map(
      (entrypoint) => entrypoint.runtimeId,
    );
    const sameChartTensorEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.tensor.same_chart_full_tensor",
    ).map((entrypoint) => entrypoint.runtimeId);
    const sourceAuthorityEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.source.same_basis_tensor_authority",
    ).map((entrypoint) => entrypoint.runtimeId);
    const observerRobustEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.energy_condition.observer_robust_gate",
    ).map((entrypoint) => entrypoint.runtimeId);
    const natarioInvariantEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.natario.invariant_audit",
    ).map((entrypoint) => entrypoint.runtimeId);
    const casimirMaterialEntrypoints = findTheoryRuntimeEntrypointsForBadge("casimir.material_receipts").map(
      (entrypoint) => entrypoint.runtimeId,
    );

    expect(wallEntrypoints).toEqual(
      expect.arrayContaining(["warp.full_solve.campaign", "nhm2.shift_lapse.alpha_sweep"]),
    );
    expect(sameChartTensorEntrypoints).toEqual(
      expect.arrayContaining(["physics.validate", "warp.full_solve.campaign", "nhm2.shift_lapse.alpha_sweep"]),
    );
    expect(sourceAuthorityEntrypoints).toEqual(
      expect.arrayContaining(["physics.validate", "warp.full_solve.campaign", "nhm2.shift_lapse.alpha_sweep"]),
    );
    expect(observerRobustEntrypoints).toEqual(
      expect.arrayContaining(["physics.validate", "warp.full_solve.campaign", "nhm2.shift_lapse.alpha_sweep"]),
    );
    expect(natarioInvariantEntrypoints).toContain("warp.full_solve.campaign");
    expect(casimirMaterialEntrypoints).toContain("casimir.verify");
  });
});
