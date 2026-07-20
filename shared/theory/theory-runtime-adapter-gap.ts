import type {
  PhysicsAtlasBlockId,
  PhysicsAtlasBlockV1,
} from "../contracts/physics-atlas.v1";
import type { TheoryBadgeGraphV1 } from "../contracts/theory-badge-graph.v1";
import type { TheoryRuntimeEntrypointV1 } from "../contracts/theory-runtime-entrypoint.v1";
import { PHYSICS_ATLAS_BLOCKS } from "./physics-atlas-blocks";
import { THEORY_RUNTIME_ENTRYPOINTS } from "./runtime-entrypoints";

export const THEORY_RUNTIME_ADAPTER_COVERAGE_LEVELS = [
  "static_reference",
  "artifact_reader",
  "quick_runtime",
  "long_job_manifest",
  "live_runtime",
] as const;

export type TheoryRuntimeAdapterCoverageLevel =
  (typeof THEORY_RUNTIME_ADAPTER_COVERAGE_LEVELS)[number];

export type TheoryRuntimeAdapterGapRegistryEntry = {
  id: string;
  label: string;
  coverageLevels: TheoryRuntimeAdapterCoverageLevel[];
  laneIds?: PhysicsAtlasBlockId[];
  runtimeIds?: string[];
  badgeIds?: string[];
  families?: string[];
  sourcePath: string;
  note?: string;
};

export type TheoryRuntimeAdapterGapLaneReport = {
  laneId: PhysicsAtlasBlockId;
  title: string;
  primaryBadgeIdsCount: number;
  primaryBadgeIdsPresentCount: number;
  rootBadgeIdsCount: number;
  rootBadgeIdsPresentCount: number;
  claimBoundaryBadgeIdsCount: number;
  claimBoundaryBadgeIdsPresentCount: number;
  calculatorExamplesCount: number;
  runtimeActionsCount: number;
  registeredEntrypoints: string[];
  implementedAdapters: string[];
  staticTraceAvailable: boolean;
  artifactReaderAvailable: boolean;
  quickRuntimeAvailable: boolean;
  longRuntimeManifestAvailable: boolean;
  liveRuntimeAvailable: boolean;
  missingAdapterKinds: TheoryRuntimeAdapterCoverageLevel[];
  recommendedNextPatch: string;
  claimBoundaryBadgeIds: string[];
  claimBoundaryNotes: string[];
};

export type TheoryRuntimeAdapterGapReport = {
  generatedAt: string;
  graphId: string;
  graphBadgeCount: number;
  laneCount: number;
  lanes: TheoryRuntimeAdapterGapLaneReport[];
  summary: {
    staticReferenceCount: number;
    artifactReaderCount: number;
    quickRuntimeCount: number;
    longRuntimeManifestCount: number;
    liveRuntimeCount: number;
    lanesMissingArtifactReaderCount: number;
    lanesMissingLiveRuntimeCount: number;
  };
};

export const DEFAULT_THEORY_RUNTIME_ADAPTER_GAP_REGISTRY: TheoryRuntimeAdapterGapRegistryEntry[] =
  [
    {
      id: "static.gr_tensor_reference",
      label: "Static GR Tensor Reference Trace",
      coverageLevels: ["static_reference"],
      laneIds: ["warp_gr_nhm2", "qei_stress_energy"],
      families: ["gr_tensor", "warp_full_solve"],
      sourcePath: "shared/theory/runtime-traces/static-gr-tensor-trace.ts",
      note: "Reference-only tensor trace; no backend tensor runtime is executed.",
    },
    {
      id: "static.casimir_reference",
      label: "Static Casimir Runtime Reference Trace",
      coverageLevels: ["static_reference"],
      laneIds: ["casimir_cavity_modes"],
      families: ["casimir_field"],
      sourcePath:
        "shared/theory/runtime-traces/static-casimir-runtime-trace.ts",
      note: "Reference-only Casimir trace with scalar cuts.",
    },
    {
      id: "static.solar_reference",
      label: "Static Solar Runtime Reference Trace",
      coverageLevels: ["static_reference"],
      laneIds: ["solar_surface_spectrum"],
      families: ["solar_spectrum"],
      sourcePath: "shared/theory/runtime-traces/static-solar-runtime-trace.ts",
      note: "Reference-only solar spectrum trace with photon/Doppler scalar cuts.",
    },
    {
      id: "static.cosmic_distance_reference",
      label: "Static Cosmic Distance Reference Trace",
      coverageLevels: ["static_reference"],
      laneIds: ["cosmic_distance_ladder"],
      families: ["generic_runtime"],
      sourcePath: "shared/theory/cosmic-distance-ladder-badges.ts",
      note: "Reference-only cosmic distance ladder context; no backend runtime is executed.",
    },
    {
      id: "static.galactic_dynamics_reference",
      label: "Static Galactic Dynamics Reference Trace",
      coverageLevels: ["static_reference"],
      laneIds: ["galactic_dynamics"],
      families: ["generic_runtime"],
      sourcePath: "shared/theory/galactic-dynamics-theory-badges.ts",
      note: "Reference-only galactic dynamics context; runtime comparisons remain separate.",
    },
    {
      id: "static.curvature_collapse_reference",
      label: "Static Curvature / Collapse Reference Trace",
      coverageLevels: ["static_reference"],
      laneIds: ["curvature_collapse"],
      families: ["generic_runtime"],
      sourcePath: "shared/theory/curvature-collapse-theory-badges.ts",
      note: "Reference-only curvature/collapse context; no backend runtime is executed.",
    },
    {
      id: "starsim.artifact_reader",
      label: "StarSim Read-Only Artifact Adapter",
      coverageLevels: ["static_reference", "artifact_reader"],
      laneIds: ["stellar_evolution"],
      badgeIds: ["starsim.runtime.evaluate_fusion_microphysics"],
      sourcePath:
        "server/services/theory/runtime-adapters/starsim-runtime-adapter.ts",
      note: "Read-only Stage 1 StarSim artifact adapter with static reference trace support.",
    },
    {
      id: "tokamak.artifact_reader",
      label: "Tokamak Read-Only Artifact Adapter",
      coverageLevels: ["static_reference", "artifact_reader"],
      laneIds: ["tokamak_plasma"],
      badgeIds: [
        "tokamak.runtime.energy_field",
        "tokamak.runtime.synthetic_diagnostics",
        "tokamak.runtime.precursor_report",
      ],
      sourcePath:
        "server/services/theory/runtime-adapters/tokamak-runtime-adapter.ts",
      note: "Read-only Tokamak diagnostic artifact adapter with static scalar-cut reference trace support.",
    },
    {
      id: "theory.small_runtime_adapters",
      label: "Small Runtime Adapter Allowlist",
      coverageLevels: ["quick_runtime"],
      runtimeIds: [
        "solar.pipeline",
        "solar.manifest",
        "casimir.verify",
        "physics.validate",
      ],
      sourcePath: "server/services/theory/runtime-adapters.ts",
      note: "Explicit small runtime adapter layer; commands remain allowlisted.",
    },
    {
      id: "theory.evidence_artifact_resolver",
      label: "Evidence Artifact Resolver",
      coverageLevels: ["artifact_reader"],
      runtimeIds: THEORY_RUNTIME_ENTRYPOINTS.map(
        (entrypoint) => entrypoint.runtimeId,
      ),
      sourcePath: "server/services/theory/evidence-artifact-resolver.ts",
      note: "Read-only artifact resolver; does not execute runtime commands.",
    },
    {
      id: "warp_nhm2.artifact_adapters",
      label: "Warp/NHM2 Read-Only Artifact Adapters",
      coverageLevels: ["artifact_reader"],
      laneIds: ["warp_gr_nhm2", "qei_stress_energy"],
      runtimeIds: ["warp.full_solve.campaign", "nhm2.shift_lapse.alpha_sweep"],
      sourcePath: "server/services/theory/warp-nhm2-artifact-adapters.ts",
      note: "Fail-closed read-only artifact readers for NHM2/warp evidence.",
    },
    {
      id: "theory.long_runtime_manifest",
      label: "Long Runtime Manifest Shell",
      coverageLevels: ["long_job_manifest"],
      runtimeIds: ["warp.full_solve.campaign", "nhm2.shift_lapse.alpha_sweep"],
      sourcePath:
        "server/services/theory/theory-runtime-run-request-manifest.ts",
      note: "Manifest/status support for long runs; no worker execution implied.",
    },
    {
      id: "nhm2.experiment_ready_theory.primary_executor",
      label: "NHM2 Dedicated Primary Runtime",
      coverageLevels: ["long_job_manifest", "live_runtime"],
      laneIds: ["warp_gr_nhm2", "qei_stress_energy"],
      runtimeIds: ["nhm2.experiment_ready_theory.primary"],
      sourcePath:
        "server/services/theory/runtime-jobs/nhm2-primary-runtime-dispatch.ts",
      note: "Dedicated server-owned dispatch with executor-exclusive request creation, shared in-flight polling, terminal recovery, and immutable receipt projection. The pinned inner producer remains excluded from generic legacy execution, and live runtime does not raise its diagnostic claim ceiling.",
    },
  ];

const PATCH_BY_MISSING_LEVEL: Record<
  TheoryRuntimeAdapterCoverageLevel,
  string
> = {
  static_reference: "add static reference trace",
  artifact_reader: "add artifact reader adapter",
  quick_runtime: "add quick runtime adapter",
  long_job_manifest: "add long runtime manifest support",
  live_runtime: "add explicit live runtime adapter",
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function intersects(
  left: readonly string[] | undefined,
  right: ReadonlySet<string>,
): boolean {
  return Boolean(left?.some((value) => right.has(value)));
}

function laneBadgeIds(block: PhysicsAtlasBlockV1): string[] {
  return unique([
    ...block.primaryBadgeIds,
    ...block.rootBadgeIds,
    ...block.claimBoundaryBadgeIds,
    ...block.runtimeActions.map((action) => action.badgeId ?? ""),
  ]);
}

function laneRuntimeBadgeIds(block: PhysicsAtlasBlockV1): string[] {
  return unique([
    ...block.primaryBadgeIds,
    ...block.runtimeActions.map((action) => action.badgeId ?? ""),
  ]);
}

function entrypointsForBlock(
  block: PhysicsAtlasBlockV1,
  entrypoints: TheoryRuntimeEntrypointV1[],
): TheoryRuntimeEntrypointV1[] {
  const badgeIds = new Set(laneRuntimeBadgeIds(block));
  return entrypoints.filter((entrypoint) =>
    intersects(entrypoint.ownedBadgeIds, badgeIds),
  );
}

function adapterMatchesBlock(args: {
  adapter: TheoryRuntimeAdapterGapRegistryEntry;
  block: PhysicsAtlasBlockV1;
  registeredEntrypoints: TheoryRuntimeEntrypointV1[];
}): boolean {
  const { adapter, block, registeredEntrypoints } = args;
  if (adapter.laneIds?.includes(block.id)) return true;

  const badgeIds = new Set(laneRuntimeBadgeIds(block));
  if (intersects(adapter.badgeIds, badgeIds)) return true;

  const runtimeIds = new Set(
    registeredEntrypoints.map((entrypoint) => entrypoint.runtimeId),
  );
  if (intersects(adapter.runtimeIds, runtimeIds)) return true;

  const families = new Set(
    registeredEntrypoints.map((entrypoint) => entrypoint.family),
  );
  return intersects(adapter.families, families);
}

function hasCoverage(
  adapters: TheoryRuntimeAdapterGapRegistryEntry[],
  level: TheoryRuntimeAdapterCoverageLevel,
): boolean {
  return adapters.some((adapter) => adapter.coverageLevels.includes(level));
}

function countPresent(
  ids: string[],
  graphBadgeIds: ReadonlySet<string>,
): number {
  return ids.filter((id) => graphBadgeIds.has(id)).length;
}

function recommendNextPatch(
  block: PhysicsAtlasBlockV1,
  missing: TheoryRuntimeAdapterCoverageLevel[],
): string {
  const firstMissing = missing[0];
  if (!firstMissing)
    return `chore(theory): keep ${block.id} runtime adapter coverage current`;
  return `feat(theory): ${PATCH_BY_MISSING_LEVEL[firstMissing]} for ${block.id}`;
}

export function buildTheoryRuntimeAdapterGapReport(args: {
  graph: TheoryBadgeGraphV1;
  atlasBlocks?: PhysicsAtlasBlockV1[];
  runtimeEntrypoints?: TheoryRuntimeEntrypointV1[];
  registeredAdapters?: TheoryRuntimeAdapterGapRegistryEntry[];
  generatedAt?: string;
}): TheoryRuntimeAdapterGapReport {
  const atlasBlocks = args.atlasBlocks ?? PHYSICS_ATLAS_BLOCKS;
  const runtimeEntrypoints =
    args.runtimeEntrypoints ?? THEORY_RUNTIME_ENTRYPOINTS;
  const registeredAdapters =
    args.registeredAdapters ?? DEFAULT_THEORY_RUNTIME_ADAPTER_GAP_REGISTRY;
  const graphBadgeIds = new Set(args.graph.badges.map((badge) => badge.id));

  const lanes = atlasBlocks.map((block): TheoryRuntimeAdapterGapLaneReport => {
    const entrypoints = entrypointsForBlock(block, runtimeEntrypoints);
    const matchingAdapters = registeredAdapters.filter((adapter) =>
      adapterMatchesBlock({
        adapter,
        block,
        registeredEntrypoints: entrypoints,
      }),
    );
    const staticTraceAvailable = hasCoverage(
      matchingAdapters,
      "static_reference",
    );
    const artifactReaderAvailable = hasCoverage(
      matchingAdapters,
      "artifact_reader",
    );
    const quickRuntimeAvailable = hasCoverage(
      matchingAdapters,
      "quick_runtime",
    );
    const longRuntimeManifestAvailable = hasCoverage(
      matchingAdapters,
      "long_job_manifest",
    );
    const liveRuntimeAvailable = hasCoverage(matchingAdapters, "live_runtime");
    const missingAdapterKinds = THEORY_RUNTIME_ADAPTER_COVERAGE_LEVELS.filter(
      (level) => {
        if (level === "static_reference") return !staticTraceAvailable;
        if (level === "artifact_reader") return !artifactReaderAvailable;
        if (level === "quick_runtime") return !quickRuntimeAvailable;
        if (level === "long_job_manifest") return !longRuntimeManifestAvailable;
        return !liveRuntimeAvailable;
      },
    );

    return {
      laneId: block.id,
      title: block.title,
      primaryBadgeIdsCount: block.primaryBadgeIds.length,
      primaryBadgeIdsPresentCount: countPresent(
        block.primaryBadgeIds,
        graphBadgeIds,
      ),
      rootBadgeIdsCount: block.rootBadgeIds.length,
      rootBadgeIdsPresentCount: countPresent(block.rootBadgeIds, graphBadgeIds),
      claimBoundaryBadgeIdsCount: block.claimBoundaryBadgeIds.length,
      claimBoundaryBadgeIdsPresentCount: countPresent(
        block.claimBoundaryBadgeIds,
        graphBadgeIds,
      ),
      calculatorExamplesCount: block.calculatorExamples.length,
      runtimeActionsCount: block.runtimeActions.length,
      registeredEntrypoints: entrypoints.map(
        (entrypoint) => entrypoint.runtimeId,
      ),
      implementedAdapters: matchingAdapters.map((adapter) => adapter.id),
      staticTraceAvailable,
      artifactReaderAvailable,
      quickRuntimeAvailable,
      longRuntimeManifestAvailable,
      liveRuntimeAvailable,
      missingAdapterKinds,
      recommendedNextPatch: recommendNextPatch(block, missingAdapterKinds),
      claimBoundaryBadgeIds: [...block.claimBoundaryBadgeIds],
      claimBoundaryNotes: [...block.claimBoundaryNotes],
    };
  });

  return {
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    graphId: args.graph.graphId,
    graphBadgeCount: args.graph.badges.length,
    laneCount: lanes.length,
    lanes,
    summary: {
      staticReferenceCount: lanes.filter((lane) => lane.staticTraceAvailable)
        .length,
      artifactReaderCount: lanes.filter((lane) => lane.artifactReaderAvailable)
        .length,
      quickRuntimeCount: lanes.filter((lane) => lane.quickRuntimeAvailable)
        .length,
      longRuntimeManifestCount: lanes.filter(
        (lane) => lane.longRuntimeManifestAvailable,
      ).length,
      liveRuntimeCount: lanes.filter((lane) => lane.liveRuntimeAvailable)
        .length,
      lanesMissingArtifactReaderCount: lanes.filter((lane) =>
        lane.missingAdapterKinds.includes("artifact_reader"),
      ).length,
      lanesMissingLiveRuntimeCount: lanes.filter((lane) =>
        lane.missingAdapterKinds.includes("live_runtime"),
      ).length,
    },
  };
}
