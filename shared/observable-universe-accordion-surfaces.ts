import {
  LIGHT_YEARS_PER_PARSEC,
  METERS_PER_PARSEC,
} from "./contracts/warp-mission-time-estimator.v1";

export type ObservableUniverseVec3 = [number, number, number];

export type ObservableUniverseCatalogRole =
  | "origin"
  | "anchor"
  | "tutorial_landmark";

export type ObservableUniverseFlowRole = "basin" | "repeller";

export type ObservableUniverseEvidenceSurface = {
  surfaceId: string;
  title: string;
  summary: string;
  provenanceClass: "proxy" | "inferred" | "solve_backed";
  claimTier: "diagnostic";
  certifying: false;
  chart: {
    frame: "heliocentric-icrs";
    chartId: "heliocentric-icrs";
    epochMs: number;
    chartDependency?: string | null;
  };
  inputs: Array<{ name: string; unit: string; source: string }>;
  outputs: Array<{ name: string; unit: string; path: string }>;
  dependencies: string[];
  evidence: Array<{
    type: "doc" | "code" | "test";
    path: string;
    symbol?: string;
    scope?: "left" | "right" | "bridge";
  }>;
};

export type ObservableUniverseCatalogSurfaceV1 = ObservableUniverseEvidenceSurface & {
  surfaceId: "observable_universe_catalog_surface/v1";
  status: "catalog_ready";
  selectionRule: "curated_heliocentric_icrs_reference/v1";
  entries: Array<{
    id: string;
    label: string;
    role: ObservableUniverseCatalogRole;
    position_m: ObservableUniverseVec3;
    note: string;
  }>;
};

export type ObservableUniverseFlowAtlasSurfaceV1 = ObservableUniverseEvidenceSurface & {
  surfaceId: "observable_universe_flow_atlas_surface/v1";
  status: "flow_atlas_ready";
  nodes: Array<{
    id: string;
    label: string;
    role: ObservableUniverseFlowRole;
    position_m: ObservableUniverseVec3;
    note: string;
  }>;
};

export type ObservableUniverseContainmentNode = {
  id: string;
  label: string;
  children: ObservableUniverseContainmentNode[];
};

export type ObservableUniverseDagNode = {
  id: string;
  label: string;
  nodeType: "physical" | "bridge" | "pipeline_trace";
};

export type ObservableUniverseDagEdge = {
  from: string;
  to: string;
  rel:
    | "depends-on"
    | "chart_transform"
    | "belongs_to_boa"
    | "flows_toward"
    | "repelled_from"
    | "context_only_outer_shell"
    | "see-also";
  chartDependency?: "heliocentric-icrs";
};

const J2000_EPOCH_MS = Date.UTC(2000, 0, 1, 12, 0, 0, 0);
const DEG = Math.PI / 180;

const toMetersFromLightYears = (lightYears: number): number =>
  (lightYears / LIGHT_YEARS_PER_PARSEC) * METERS_PER_PARSEC;

const vecFromRaDecDistance = (
  raDeg: number,
  decDeg: number,
  distanceMeters: number,
): ObservableUniverseVec3 => {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const cosDec = Math.cos(dec);
  return [
    Math.cos(ra) * cosDec * distanceMeters,
    Math.sin(ra) * cosDec * distanceMeters,
    Math.sin(dec) * distanceMeters,
  ];
};

const observableBoundaryRadiusMeters = toMetersFromLightYears(46_500_000_000);

export const OBSERVABLE_UNIVERSE_CATALOG_SURFACE: ObservableUniverseCatalogSurfaceV1 = {
  surfaceId: "observable_universe_catalog_surface/v1",
  status: "catalog_ready",
  title: "Observable Universe Catalog Surface",
  summary:
    "Curated heliocentric-ICRS anchor catalog for accordion radius remapping with Sol fixed at the origin.",
  provenanceClass: "inferred",
  claimTier: "diagnostic",
  certifying: false,
  chart: {
    frame: "heliocentric-icrs",
    chartId: "heliocentric-icrs",
    epochMs: J2000_EPOCH_MS,
    chartDependency: "heliocentric-icrs",
  },
  inputs: [
    {
      name: "curated_anchor_positions",
      unit: "m",
      source: "shared/observable-universe-accordion-surfaces.ts",
    },
  ],
  outputs: [
    {
      name: "catalog_entries",
      unit: "m",
      path: "entries[*].position_m",
    },
  ],
  dependencies: [],
  evidence: [
    {
      type: "code",
      path: "shared/observable-universe-accordion-surfaces.ts",
      symbol: "OBSERVABLE_UNIVERSE_CATALOG_SURFACE",
    },
    {
      type: "test",
      path: "tests/observable-universe-accordion-surfaces.spec.ts",
    },
  ],
  selectionRule: "curated_heliocentric_icrs_reference/v1",
  entries: [
    {
      id: "sol",
      label: "Sol",
      role: "origin",
      position_m: [0, 0, 0],
      note: "Heliocentric origin.",
    },
    {
      id: "proxima",
      label: "Proxima Centauri",
      role: "anchor",
      position_m: [-14634115974123278, -11200448792195356, -35673126010627784],
      note: "Nearby stellar anchor copied from the committed local-rest snapshot family.",
    },
    {
      id: "alpha-cen-a",
      label: "Alpha Centauri A",
      role: "anchor",
      position_m: [-15439793707943564, -12910632909794424, -36062024631361144],
      note: "Nearby stellar anchor copied from the committed local-rest snapshot family.",
    },
    {
      id: "barnard",
      label: "Barnard's Star",
      role: "anchor",
      position_m: [-536346725190452.1, -56085904353185990, 4604807006120671],
      note: "Nearby stellar anchor copied from the committed local-rest snapshot family.",
    },
    {
      id: "milky-way-core",
      label: "Milky Way Core",
      role: "anchor",
      position_m: vecFromRaDecDistance(266.41683, -29.00781, 8_200 * METERS_PER_PARSEC),
      note: "Tutorial anchor at the Galactic center direction.",
    },
    {
      id: "andromeda",
      label: "Andromeda",
      role: "anchor",
      position_m: vecFromRaDecDistance(10.6847083, 41.26875, 779_000 * METERS_PER_PARSEC),
      note: "Local Group anchor.",
    },
    {
      id: "local-group-edge",
      label: "Local Group Edge",
      role: "tutorial_landmark",
      position_m: vecFromRaDecDistance(10.6847083, 41.26875, 1_500_000 * METERS_PER_PARSEC),
      note: "Context landmark only; not a hard containment parent beyond Local Group.",
    },
    {
      id: "virgo-cluster",
      label: "Virgo Cluster",
      role: "anchor",
      position_m: vecFromRaDecDistance(186.75, 12.72, 16_500_000 * METERS_PER_PARSEC),
      note: "Flow-basin reference anchor.",
    },
    {
      id: "great-attractor",
      label: "Great Attractor",
      role: "tutorial_landmark",
      position_m: vecFromRaDecDistance(200, -54, 65_000_000 * METERS_PER_PARSEC),
      note: "Large-scale flow landmark only.",
    },
    {
      id: "shapley",
      label: "Shapley Supercluster",
      role: "tutorial_landmark",
      position_m: vecFromRaDecDistance(
        202.5,
        -30,
        toMetersFromLightYears(650_000_000),
      ),
      note: "Outer flow-basin landmark only.",
    },
  ],
};

export const OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE: ObservableUniverseFlowAtlasSurfaceV1 = {
  surfaceId: "observable_universe_flow_atlas_surface/v1",
  status: "flow_atlas_ready",
  title: "Observable Universe Flow Atlas Surface",
  summary:
    "Separate kinematic basin and repeller surface for local-flow context; not part of the physical containment tree.",
  provenanceClass: "inferred",
  claimTier: "diagnostic",
  certifying: false,
  chart: {
    frame: "heliocentric-icrs",
    chartId: "heliocentric-icrs",
    epochMs: J2000_EPOCH_MS,
    chartDependency: "heliocentric-icrs",
  },
  inputs: [
    {
      name: "curated_flow_landmarks",
      unit: "m",
      source: "shared/observable-universe-accordion-surfaces.ts",
    },
  ],
  outputs: [
    {
      name: "flow_nodes",
      unit: "m",
      path: "nodes[*].position_m",
    },
  ],
  dependencies: ["observable_universe_catalog_surface/v1"],
  evidence: [
    {
      type: "code",
      path: "shared/observable-universe-accordion-surfaces.ts",
      symbol: "OBSERVABLE_UNIVERSE_FLOW_ATLAS_SURFACE",
    },
    {
      type: "test",
      path: "tests/observable-universe-accordion-surfaces.spec.ts",
    },
  ],
  nodes: [
    {
      id: "virgo-basin",
      label: "Virgo Basin",
      role: "basin",
      position_m: vecFromRaDecDistance(186.75, 12.72, 16_500_000 * METERS_PER_PARSEC),
      note: "Flow-basin node, separate from physical containment.",
    },
    {
      id: "shapley-basin",
      label: "Shapley Basin",
      role: "basin",
      position_m: vecFromRaDecDistance(202.5, -30, toMetersFromLightYears(650_000_000)),
      note: "Outer flow-basin node, separate from physical containment.",
    },
    {
      id: "dipole-repeller",
      label: "Dipole Repeller",
      role: "repeller",
      position_m: vecFromRaDecDistance(159, -46, 220_000_000 * METERS_PER_PARSEC),
      note: "Repeller landmark only.",
    },
  ],
};

export const OBSERVABLE_UNIVERSE_PHYSICAL_CONTAINMENT_TREE: ObservableUniverseContainmentNode =
  {
    id: "sol",
    label: "Sol",
    children: [
      {
        id: "milky-way",
        label: "Milky Way",
        children: [
          {
            id: "local-group",
            label: "Local Group",
            children: [],
          },
        ],
      },
    ],
  };

export const OBSERVABLE_UNIVERSE_ACCORDION_DAG_NODES: ObservableUniverseDagNode[] = [
  { id: "sol", label: "Sol", nodeType: "physical" },
  { id: "milky-way", label: "Milky Way", nodeType: "physical" },
  { id: "local-group", label: "Local Group", nodeType: "physical" },
  {
    id: "observable_universe_catalog_surface/v1",
    label: "Observable Universe Catalog Surface",
    nodeType: "bridge",
  },
  { id: "local-flow-atlas", label: "Local Flow Atlas", nodeType: "bridge" },
  { id: "great-attractor", label: "Great Attractor", nodeType: "bridge" },
  { id: "virgo-basin", label: "Virgo Basin", nodeType: "bridge" },
  { id: "shapley-basin", label: "Shapley Basin", nodeType: "bridge" },
  { id: "dipole-repeller", label: "Dipole Repeller", nodeType: "bridge" },
  {
    id: "observable-universe-accordion-panel",
    label: "Observable Universe Accordion Panel",
    nodeType: "pipeline_trace",
  },
  {
    id: "observable-universe-boundary",
    label: "Observable Universe Boundary",
    nodeType: "bridge",
  },
];

export const OBSERVABLE_UNIVERSE_ACCORDION_DAG_EDGES: ObservableUniverseDagEdge[] = [
  {
    from: "observable-universe-accordion-panel",
    to: "observable_universe_catalog_surface/v1",
    rel: "depends-on",
    chartDependency: "heliocentric-icrs",
  },
  {
    from: "observable-universe-accordion-panel",
    to: "local-flow-atlas",
    rel: "chart_transform",
    chartDependency: "heliocentric-icrs",
  },
  {
    from: "virgo-basin",
    to: "local-flow-atlas",
    rel: "belongs_to_boa",
  },
  {
    from: "shapley-basin",
    to: "local-flow-atlas",
    rel: "belongs_to_boa",
  },
  {
    from: "local-group",
    to: "virgo-basin",
    rel: "flows_toward",
  },
  {
    from: "virgo-basin",
    to: "shapley-basin",
    rel: "flows_toward",
  },
  {
    from: "local-group",
    to: "dipole-repeller",
    rel: "repelled_from",
  },
  {
    from: "observable-universe-boundary",
    to: "observable-universe-accordion-panel",
    rel: "context_only_outer_shell",
  },
  {
    from: "great-attractor",
    to: "shapley-basin",
    rel: "see-also",
  },
];

export const OBSERVABLE_UNIVERSE_OUTER_BOUNDARY = {
  id: "observable-universe-boundary",
  label: "Observable Universe Boundary",
  radius_m: observableBoundaryRadiusMeters,
  semantics: "context_only_reference_ring" as const,
  note: "Context-only outer shell. Reference only; not a physical child of the containment tree.",
};
