import { describe, expect, it } from "vitest";
import { PHYSICS_ATLAS_BLOCKS } from "../physics-atlas-blocks";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import {
  buildTheoryRuntimeAdapterGapReport,
  DEFAULT_THEORY_RUNTIME_ADAPTER_GAP_REGISTRY,
  type TheoryRuntimeAdapterGapRegistryEntry,
} from "../theory-runtime-adapter-gap";

function buildReport(
  registeredAdapters = DEFAULT_THEORY_RUNTIME_ADAPTER_GAP_REGISTRY,
) {
  return buildTheoryRuntimeAdapterGapReport({
    graph: buildNhm2TheoryBadgeGraphV1(),
    registeredAdapters,
    generatedAt: "2026-05-29T00:00:00.000Z",
  });
}

describe("theory runtime adapter gap report", () => {
  it("includes key atlas lanes", () => {
    const report = buildReport();
    const laneIds = report.lanes.map((lane) => lane.laneId);

    expect(laneIds).toContain("warp_gr_nhm2");
    expect(laneIds).toContain("casimir_cavity_modes");
    expect(laneIds).toContain("solar_surface_spectrum");
  });

  it("marks missing artifact_reader when no adapter is registered", () => {
    const report = buildReport([]);
    const solar = report.lanes.find(
      (lane) => lane.laneId === "solar_surface_spectrum",
    );

    expect(solar?.artifactReaderAvailable).toBe(false);
    expect(solar?.missingAdapterKinds).toContain("artifact_reader");
  });

  it("reports live_runtime only for lanes covered by an explicit live adapter", () => {
    const report = buildReport();
    const liveLaneIds = report.lanes
      .filter((lane) => lane.liveRuntimeAvailable)
      .map((lane) => lane.laneId)
      .sort();
    const warp = report.lanes.find((lane) => lane.laneId === "warp_gr_nhm2");
    const fullSolve = report.lanes.find(
      (lane) => lane.laneId === "nhm2_full_solve",
    );
    const qei = report.lanes.find(
      (lane) => lane.laneId === "qei_stress_energy",
    );
    const primaryExecutor = DEFAULT_THEORY_RUNTIME_ADAPTER_GAP_REGISTRY.find(
      (adapter) =>
        adapter.id === "nhm2.experiment_ready_theory.primary_executor",
    );

    expect(liveLaneIds).toEqual([
      "nhm2_full_solve",
      "qei_stress_energy",
      "warp_gr_nhm2",
    ]);
    expect(report.summary.liveRuntimeCount).toBe(3);
    expect(primaryExecutor).toMatchObject({
      label: "NHM2 Dedicated Primary Runtime",
      coverageLevels: ["long_job_manifest", "live_runtime"],
      note: expect.stringMatching(
        /shared in-flight polling.*immutable receipt projection/i,
      ),
    });
    expect(warp?.implementedAdapters).toContain(
      "nhm2.experiment_ready_theory.primary_executor",
    );
    expect(qei?.implementedAdapters).toContain(
      "nhm2.experiment_ready_theory.primary_executor",
    );
    expect(fullSolve?.implementedAdapters).toContain(
      "nhm2.experiment_ready_theory.primary_executor",
    );
    expect(warp?.missingAdapterKinds).not.toContain("live_runtime");
    expect(qei?.missingAdapterKinds).not.toContain("live_runtime");
    expect(fullSolve?.missingAdapterKinds).not.toContain("live_runtime");

    const explicitLiveAdapter: TheoryRuntimeAdapterGapRegistryEntry = {
      id: "solar.live_runtime.test_adapter",
      label: "Solar Live Runtime Test Adapter",
      coverageLevels: ["live_runtime"],
      laneIds: ["solar_surface_spectrum"],
      sourcePath: "server/services/theory/solar-live-runtime-test-adapter.ts",
    };
    const liveReport = buildReport([
      ...DEFAULT_THEORY_RUNTIME_ADAPTER_GAP_REGISTRY,
      explicitLiveAdapter,
    ]);
    const solar = liveReport.lanes.find(
      (lane) => lane.laneId === "solar_surface_spectrum",
    );
    const casimir = liveReport.lanes.find(
      (lane) => lane.laneId === "casimir_cavity_modes",
    );

    expect(solar?.liveRuntimeAvailable).toBe(true);
    expect(casimir?.liveRuntimeAvailable).toBe(false);
    expect(liveReport.summary.liveRuntimeCount).toBe(4);
  });

  it("preserves claim-boundary badge IDs", () => {
    const report = buildReport();
    const block = PHYSICS_ATLAS_BLOCKS.find(
      (entry) => entry.id === "warp_gr_nhm2",
    );
    const lane = report.lanes.find((entry) => entry.laneId === "warp_gr_nhm2");

    expect(lane?.claimBoundaryBadgeIds).toEqual(block?.claimBoundaryBadgeIds);
    expect(lane?.claimBoundaryBadgeIds).toContain(
      "nhm2.claim_boundary.diagnostic_only",
    );
  });

  it("reports static and runtime coverage without executing runtime commands", () => {
    const report = buildReport();
    const casimir = report.lanes.find(
      (lane) => lane.laneId === "casimir_cavity_modes",
    );

    expect(casimir?.staticTraceAvailable).toBe(true);
    expect(casimir?.quickRuntimeAvailable).toBe(true);
    expect(casimir?.implementedAdapters).toEqual(
      expect.arrayContaining([
        "static.casimir_reference",
        "theory.small_runtime_adapters",
      ]),
    );
  });

  it("keeps active atlas lanes covered by at least one non-live runtime adapter path", () => {
    const report = buildReport();
    const errors: string[] = [];

    for (const block of PHYSICS_ATLAS_BLOCKS.filter(
      (entry) => entry.status === "active",
    )) {
      const lane = report.lanes.find((entry) => entry.laneId === block.id);

      if (!lane) {
        errors.push(
          `Lane ${block.id} is active but missing from the runtime adapter gap report`,
        );
        continue;
      }

      const hasNonLiveCoverage =
        lane.staticTraceAvailable ||
        lane.artifactReaderAvailable ||
        lane.quickRuntimeAvailable ||
        lane.longRuntimeManifestAvailable;

      if (!hasNonLiveCoverage) {
        errors.push(
          `Lane ${block.id} is active but has no static_reference, artifact_reader, quick_runtime, or long_job_manifest coverage`,
        );
      }

      if (block.runtimeActions.length > 0) {
        if (lane.implementedAdapters.length === 0) {
          errors.push(
            `Lane ${block.id} has runtimeActions but no adapter registered`,
          );
        }

        if (!lane.staticTraceAvailable) {
          errors.push(
            `Lane ${block.id} has runtimeActions but no static_reference coverage`,
          );
        }
      }

      if (
        block.claimBoundaryBadgeIds.length > 0 &&
        lane.claimBoundaryNotes.length === 0
      ) {
        errors.push(
          `Lane ${block.id} has claimBoundaryBadgeIds but no claim boundary notes`,
        );
      }
    }

    expect(errors).toEqual([]);
  });
});
