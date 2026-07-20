import { existsSync } from "node:fs";
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
import {
  isTheoryRuntimeDedicatedExecutableId,
  isTheoryRuntimeExecutableId,
} from "../runtime-execution-policy";

describe("theory runtime entrypoint registry", () => {
  it("exports valid runtime entrypoint contracts", () => {
    expect(THEORY_RUNTIME_ENTRYPOINTS).toHaveLength(9);

    for (const entrypoint of THEORY_RUNTIME_ENTRYPOINTS) {
      expect(validateTheoryRuntimeEntrypointV1(entrypoint)).toEqual([]);
      expect(isTheoryRuntimeEntrypointV1(entrypoint)).toBe(true);
    }
  });

  it("uses unique runtime IDs", () => {
    const runtimeIds = THEORY_RUNTIME_ENTRYPOINTS.map(
      (entrypoint) => entrypoint.runtimeId,
    );

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
        "nhm2.qei.feasibility_frontier",
        "nhm2.experiment_ready_theory.primary",
      ]),
    );
  });

  it("keeps NHM2/warp runtime lanes conservative and non-promoting", () => {
    const warpEntries = THEORY_RUNTIME_ENTRYPOINTS.filter(
      (entrypoint) =>
        entrypoint.runtimeId.includes("warp") ||
        entrypoint.runtimeId.includes("nhm2"),
    );

    expect(warpEntries.length).toBeGreaterThanOrEqual(2);
    for (const entrypoint of warpEntries) {
      expect(entrypoint.claimBoundary.promotionAllowed).toBe(false);
      expect(entrypoint.claimBoundary.maximumTier).not.toBe("certified");
      expect(entrypoint.claimBoundary.promotionRequires.length).toBeGreaterThan(
        0,
      );
    }

    expect(isTheoryRuntimeExecutableId("warp.full_solve.campaign")).toBe(false);
    expect(isTheoryRuntimeExecutableId("nhm2.shift_lapse.alpha_sweep")).toBe(
      true,
    );
    expect(
      isTheoryRuntimeExecutableId("nhm2.experiment_ready_theory.primary"),
    ).toBe(false);
    expect(
      isTheoryRuntimeDedicatedExecutableId(
        "nhm2.experiment_ready_theory.primary",
      ),
    ).toBe(true);
  });

  it("registers the manifest-admitted primary plan without exposing it to the generic launcher", () => {
    const primary = getTheoryRuntimeEntrypoint(
      "nhm2.experiment_ready_theory.primary",
    );

    expect(primary).toMatchObject({
      label: "NHM2 Experiment-Ready Theory Primary Plan",
      command: "npm run warp:full-solve:nhm2:theory-candidate:primary",
      family: "warp_full_solve",
      claimBoundary: {
        currentTier: "diagnostic",
        maximumTier: "reduced_order",
        promotionAllowed: false,
      },
    });
    expect(primary?.argsSchema).toMatchObject({
      required: ["candidateManifestPath"],
      additionalProperties: false,
    });
    expect(primary?.ownedBadgeIds).toEqual(
      expect.arrayContaining([
        "nhm2.meta.experiment_ready_theory_closure",
        "nhm2.experimental.full_apparatus_tensor",
        "nhm2.experimental.prediction_freeze",
      ]),
    );
    expect(primary?.description).toMatch(
      /dedicated server-owned launch handler.*inner producer.*excluded from generic legacy execution.*fails closed.*blocked evidence/i,
    );
    expect(primary?.sourceRefs.map((ref) => ref.path)).toEqual(
      expect.arrayContaining([
        "tools/nhm2/prepare-experiment-ready-theory-candidate.ts",
        "tools/nhm2/run-experiment-ready-theory-primary.ts",
        "server/services/theory/nhm2-theory-candidate-plan-admission.ts",
        "server/services/theory/nhm2-theory-candidate-primary-executor.ts",
        "server/services/theory/runtime-jobs/nhm2-primary-runtime-dispatch.ts",
        "server/services/theory/runtime-jobs/runtime-job-service.ts",
      ]),
    );
    expect(primary?.claimBoundary.promotionRequires).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/nondegenerate.*full-apparatus tensor arrays/i),
        expect.stringMatching(/hermetic.*dependency-tree attestation/i),
        expect.stringMatching(/empirical receipts.*physical promotion/i),
      ]),
    );
    expect(primary?.claimBoundary.promotionRequires.join(" ")).not.toMatch(
      /dispatcher|result-route/i,
    );
  });

  it("governs the 0p7000 profile package and formal certificate without widening execution", () => {
    const fullSolve = getTheoryRuntimeEntrypoint("warp.full_solve.campaign");
    const alphaSweep = getTheoryRuntimeEntrypoint(
      "nhm2.shift_lapse.alpha_sweep",
    );
    const profileRoot =
      "artifacts/research/full-solve/profile-campaign-runs/stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";

    for (const entrypoint of [fullSolve, alphaSweep]) {
      expect(entrypoint).not.toBeNull();
      expect(entrypoint?.ownedBadgeIds).toEqual(
        expect.arrayContaining([
          "nhm2.formal.lean_certificate",
          "nhm2.formal.certificate_hashes_pinned",
          "nhm2.formal.diagnostic_campaign_admissible",
          "nhm2.formal.claim_locks_closed",
          "nhm2.formal.negative_fixtures_fail_closed",
          "nhm2.mechanical.support_retention_overlap",
        ]),
      );
      expect(
        entrypoint?.outputArtifactGlobs.some((glob) =>
          glob.startsWith(profileRoot),
        ),
      ).toBe(true);
      expect(entrypoint?.outputArtifactGlobs).toContain(
        "formal/lean/NHM2Formal/Generated/**/*.lean",
      );
      expect(
        entrypoint?.sourceRefs.some((ref) => ref.path === profileRoot),
      ).toBe(true);
      expect(entrypoint?.claimBoundary.promotionAllowed).toBe(false);
      for (const ref of entrypoint?.sourceRefs.filter(
        (candidate) =>
          candidate.kind === "repo_module" || candidate.kind === "artifact",
      ) ?? []) {
        expect(
          existsSync(ref.path),
          `${entrypoint?.runtimeId}: ${ref.path}`,
        ).toBe(true);
      }
    }

    expect(fullSolve?.ownedBadgeIds).toEqual(
      expect.arrayContaining([
        "casimir.geometry.finite_temperature_maxwell_stress",
        "nhm2.transport.steering_bondi_flux_budget",
      ]),
    );
    expect(isTheoryRuntimeExecutableId(fullSolve?.runtimeId ?? "")).toBe(false);
  });

  it("stores commands as inert string metadata", () => {
    let executedCommand = false;
    const commands = THEORY_RUNTIME_ENTRYPOINTS.map(
      (entrypoint) => entrypoint.command,
    );

    expect(
      commands.every(
        (command) =>
          typeof command === "string" && command.startsWith("npm run "),
      ),
    ).toBe(true);
    expect(executedCommand).toBe(false);
  });

  it("finds entrypoints by runtime ID and owned badge ID", () => {
    expect(getTheoryRuntimeEntrypoint("solar.pipeline")?.runtimeId).toBe(
      "solar.pipeline",
    );
    expect(getTheoryRuntimeEntrypoint("missing.runtime")).toBeNull();

    const nhm2Entrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.closure.source_residual",
    ).map((entrypoint) => entrypoint.runtimeId);

    expect(nhm2Entrypoints).toEqual(
      expect.arrayContaining([
        "physics.validate",
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );

    const wallEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.source.wall_t00_trace",
    ).map((entrypoint) => entrypoint.runtimeId);
    const sameChartTensorEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.tensor.same_chart_full_tensor",
    ).map((entrypoint) => entrypoint.runtimeId);
    const sourceAuthorityEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.source.same_basis_tensor_authority",
    ).map((entrypoint) => entrypoint.runtimeId);
    const componentAuthorityEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.source.component_authority_ledger",
    ).map((entrypoint) => entrypoint.runtimeId);
    const coupledCandidateEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.closure.coupled_pass_candidate",
    ).map((entrypoint) => entrypoint.runtimeId);
    const passPathHarnessEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.closure.regional_tensor_pass_path_harness",
    ).map((entrypoint) => entrypoint.runtimeId);
    const observerRobustEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.energy_condition.observer_robust_gate",
    ).map((entrypoint) => entrypoint.runtimeId);
    const natarioInvariantEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.natario.invariant_audit",
    ).map((entrypoint) => entrypoint.runtimeId);
    const casimirMaterialEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "casimir.material_receipts",
    ).map((entrypoint) => entrypoint.runtimeId);
    const formalEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "nhm2.formal.lean_certificate",
    ).map((entrypoint) => entrypoint.runtimeId);
    const maxwellStressEntrypoints = findTheoryRuntimeEntrypointsForBadge(
      "casimir.geometry.finite_temperature_maxwell_stress",
    ).map((entrypoint) => entrypoint.runtimeId);

    expect(wallEntrypoints).toEqual(
      expect.arrayContaining([
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );
    expect(sameChartTensorEntrypoints).toEqual(
      expect.arrayContaining([
        "physics.validate",
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );
    expect(sourceAuthorityEntrypoints).toEqual(
      expect.arrayContaining([
        "physics.validate",
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );
    expect(componentAuthorityEntrypoints).toEqual(
      expect.arrayContaining([
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );
    expect(coupledCandidateEntrypoints).toEqual(
      expect.arrayContaining([
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );
    expect(passPathHarnessEntrypoints).toEqual(
      expect.arrayContaining([
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );
    expect(observerRobustEntrypoints).toEqual(
      expect.arrayContaining([
        "physics.validate",
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );
    expect(natarioInvariantEntrypoints).toContain("warp.full_solve.campaign");
    expect(casimirMaterialEntrypoints).toContain("casimir.verify");
    expect(formalEntrypoints).toEqual(
      expect.arrayContaining([
        "warp.full_solve.campaign",
        "nhm2.shift_lapse.alpha_sweep",
      ]),
    );
    expect(maxwellStressEntrypoints).toEqual(
      expect.arrayContaining(["casimir.verify", "warp.full_solve.campaign"]),
    );
  });
});
