import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2ObserverRobustEnergyConditionArtifact,
  type Nhm2ObserverRobustEnergyConditionArtifactV1,
  type Nhm2ObserverRobustEnergyCondition,
  type Nhm2ObserverRobustEnergyConditionFamilyInput,
} from "../../shared/contracts/nhm2-observer-robust-energy-conditions.v1";
import {
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
  type Nhm2RegionalTensor,
  type Nhm2TensorComponent,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  fullTensorSourceHasFullAuthority,
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

type Direction = readonly [number, number, number];

const REQUIRED_COMPONENTS = [
  "T00",
  "T01",
  "T02",
  "T03",
  "T11",
  "T12",
  "T13",
  "T22",
  "T23",
  "T33",
] as const satisfies readonly Nhm2TensorComponent[];

const DIRECTIONS: Direction[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
  [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)],
  [-1 / Math.sqrt(3), -1 / Math.sqrt(3), -1 / Math.sqrt(3)],
];

const BOOST_BETAS = [0.25, 0.5, 0.75] as const;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const parseArgs = (argv: string[]): Record<string, string | boolean> => {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const readRequired = <T>(
  repoRoot: string,
  path: string,
  validator: (value: unknown) => value is T,
  label: string,
): T => {
  const value = readJson(resolvePath(repoRoot, path));
  if (!validator(value)) throw new Error(`${label} has invalid contract: ${path}`);
  return value;
};

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const tensorValue = (
  tensor: Nhm2RegionalTensor,
  component: Nhm2TensorComponent,
): number | null => {
  const value = tensor[component];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const missingComponents = (tensor: Nhm2RegionalTensor): Nhm2TensorComponent[] =>
  REQUIRED_COMPONENTS.filter((component) => tensorValue(tensor, component) == null);

const stressAlong = (tensor: Nhm2RegionalTensor, direction: Direction): number | null => {
  const [x, y, z] = direction;
  const t11 = tensorValue(tensor, "T11");
  const t12 = tensorValue(tensor, "T12");
  const t13 = tensorValue(tensor, "T13");
  const t22 = tensorValue(tensor, "T22");
  const t23 = tensorValue(tensor, "T23");
  const t33 = tensorValue(tensor, "T33");
  if ([t11, t12, t13, t22, t23, t33].some((value) => value == null)) return null;
  return (
    (t11 as number) * x * x +
    2 * (t12 as number) * x * y +
    2 * (t13 as number) * x * z +
    (t22 as number) * y * y +
    2 * (t23 as number) * y * z +
    (t33 as number) * z * z
  );
};

const momentumAlong = (tensor: Nhm2RegionalTensor, direction: Direction): number | null => {
  const [x, y, z] = direction;
  const t01 = tensorValue(tensor, "T01");
  const t02 = tensorValue(tensor, "T02");
  const t03 = tensorValue(tensor, "T03");
  if ([t01, t02, t03].some((value) => value == null)) return null;
  return (t01 as number) * x + (t02 as number) * y + (t03 as number) * z;
};

const eulerianDensity = (tensor: Nhm2RegionalTensor): number | null =>
  tensorValue(tensor, "T00");

const nullDensity = (tensor: Nhm2RegionalTensor, direction: Direction): number | null => {
  const rho = eulerianDensity(tensor);
  const momentum = momentumAlong(tensor, direction);
  const stress = stressAlong(tensor, direction);
  return rho == null || momentum == null || stress == null
    ? null
    : rho + 2 * momentum + stress;
};

const boostedDensity = (
  tensor: Nhm2RegionalTensor,
  direction: Direction,
  beta: number,
): number | null => {
  const rho = eulerianDensity(tensor);
  const momentum = momentumAlong(tensor, direction);
  const stress = stressAlong(tensor, direction);
  if (rho == null || momentum == null || stress == null) return null;
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  return gamma * gamma * (rho + 2 * beta * momentum + beta * beta * stress);
};

const decProxy = (tensor: Nhm2RegionalTensor): number | null => {
  const rho = eulerianDensity(tensor);
  const t01 = tensorValue(tensor, "T01");
  const t02 = tensorValue(tensor, "T02");
  const t03 = tensorValue(tensor, "T03");
  const t11 = tensorValue(tensor, "T11");
  const t22 = tensorValue(tensor, "T22");
  const t33 = tensorValue(tensor, "T33");
  if ([rho, t01, t02, t03, t11, t22, t33].some((value) => value == null)) return null;
  const flux = Math.sqrt((t01 as number) ** 2 + (t02 as number) ** 2 + (t03 as number) ** 2);
  const stress = Math.max(Math.abs(t11 as number), Math.abs(t22 as number), Math.abs(t33 as number));
  return (rho as number) - Math.max(flux, stress);
};

const secProxy = (tensor: Nhm2RegionalTensor): number | null => {
  const rho = eulerianDensity(tensor);
  const t11 = tensorValue(tensor, "T11");
  const t22 = tensorValue(tensor, "T22");
  const t33 = tensorValue(tensor, "T33");
  if ([rho, t11, t22, t33].some((value) => value == null)) return null;
  return (rho as number) + (t11 as number) + (t22 as number) + (t33 as number);
};

type Candidate = {
  condition: Nhm2ObserverRobustEnergyCondition;
  value: number | null;
  regionId: string;
  observerParams?: Record<string, number>;
};

const minCandidate = (candidates: Candidate[]): Candidate | null => {
  const finite = candidates.filter((entry): entry is Candidate & { value: number } => entry.value != null);
  return finite.reduce<Candidate | null>(
    (current, entry) => (current == null || entry.value < (current.value as number) ? entry : current),
    null,
  );
};

const familyFromCandidates = (
  familyId: "eulerian" | "boosted_timelike_grid" | "null_direction_grid" | "algebraic_type_i",
  candidates: Candidate[],
  blockers: string[],
): Nhm2ObserverRobustEnergyConditionFamilyInput => {
  const worst = minCandidate(candidates);
  const requiredConditions = new Set<Nhm2ObserverRobustEnergyCondition>([
    "WEC",
    "NEC",
    "DEC",
    "SEC",
  ]);
  const presentConditions = new Set(
    candidates
      .filter((candidate) => candidate.value != null)
      .map((candidate) => candidate.condition),
  );
  const complete =
    familyId === "eulerian"
      ? presentConditions.has("WEC")
      : [...requiredConditions].every((condition) => presentConditions.has(condition));
  const status =
    blockers.length > 0 || worst == null
      ? "missing"
      : (worst.value as number) < 0
        ? "fail"
        : complete
          ? "pass"
          : "missing";
  return {
    familyId,
    status,
    sampleCount: candidates.length,
    worstCase:
      worst == null
        ? null
        : {
            condition: worst.condition,
            value: worst.value,
            locationRef: `atlas-region:${worst.regionId}`,
            observerParams: worst.observerParams ?? null,
          },
    blockers:
      status === "missing" && blockers.length === 0
        ? [`${familyId}_condition_set_incomplete`]
        : blockers,
  };
};

const sourceRegions = (
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
): Nhm2TileEffectiveFullTensorSourceArtifact["regions"] =>
  source.regions.filter((region) =>
    NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS.includes(region.regionId),
  );

const authorityBlockers = (
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
): string[] => {
  const blockers: string[] = [];
  for (const region of sourceRegions(source)) {
    const missing = missingComponents(region.tensor);
    if (!fullTensorSourceHasFullAuthority(region.tensor, region.tensorAuthorityMode)) {
      blockers.push(`${region.regionId}:source_full_tensor_authority_not_pass`);
    }
    blockers.push(
      ...missing.map((component) => `${region.regionId}:${component}:source_component_missing`),
    );
    if (region.tensorAuthorityMode === "proxy" || region.tensorAuthorityMode === "diagonal_reduced_order") {
      blockers.push(`${region.regionId}:source_tensor_proxy_or_diagonal_only`);
    }
  }
  return Array.from(new Set(blockers));
};

const sampleRegionCoverage = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(atlas.regions).map(([regionId, region]) => [
      regionId,
      region.sampleCount,
    ]),
  );

export const buildAtlasBoundObserverRobustEnergyConditions = (args: {
  repoRoot: string;
  regionalSupportAtlasPath: string;
  sourceFullTensorPath: string;
  outPath: string;
  auditOnly?: boolean;
}): Nhm2ObserverRobustEnergyConditionArtifactV1 => {
  const paths = [args.regionalSupportAtlasPath, args.sourceFullTensorPath];
  if (!args.auditOnly && paths.some(pathUsesLatestAlias)) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const atlas = readRequired(
    args.repoRoot,
    args.regionalSupportAtlasPath,
    isNhm2RegionalSupportFunctionAtlas,
    "regional support-function atlas",
  );
  const source = readRequired(
    args.repoRoot,
    args.sourceFullTensorPath,
    isNhm2TileEffectiveFullTensorSourceArtifact,
    "source full tensor",
  );
  const blockers = authorityBlockers(source);
  const eulerianCandidates = sourceRegions(source).map((region) => ({
    condition: "WEC" as const,
    value: eulerianDensity(region.tensor),
    regionId: region.regionId,
  }));
  const nullCandidates = sourceRegions(source).flatMap((region) =>
    DIRECTIONS.flatMap((direction, index) => [
      {
        condition: "NEC" as const,
        value: nullDensity(region.tensor, direction),
        regionId: region.regionId,
        observerParams: { directionIndex: index },
      },
      {
        condition: "WEC" as const,
        value: nullDensity(region.tensor, direction),
        regionId: region.regionId,
        observerParams: { directionIndex: index },
      },
      {
        condition: "DEC" as const,
        value: decProxy(region.tensor),
        regionId: region.regionId,
        observerParams: { directionIndex: index },
      },
      {
        condition: "SEC" as const,
        value: secProxy(region.tensor),
        regionId: region.regionId,
        observerParams: { directionIndex: index },
      },
    ]),
  );
  const boostedCandidates = sourceRegions(source).flatMap((region) =>
    BOOST_BETAS.flatMap((beta) =>
      DIRECTIONS.flatMap((direction, directionIndex) => [
        {
          condition: "WEC" as const,
          value: boostedDensity(region.tensor, direction, beta),
          regionId: region.regionId,
          observerParams: { beta, directionIndex },
        },
        {
          condition: "NEC" as const,
          value: nullDensity(region.tensor, direction),
          regionId: region.regionId,
          observerParams: { beta, directionIndex },
        },
        {
          condition: "DEC" as const,
          value: decProxy(region.tensor),
          regionId: region.regionId,
          observerParams: { beta, directionIndex },
        },
        {
          condition: "SEC" as const,
          value: secProxy(region.tensor),
          regionId: region.regionId,
          observerParams: { beta, directionIndex },
        },
      ]),
    ),
  );
  const algebraicCandidates = sourceRegions(source).flatMap((region) => [
    {
      condition: "WEC" as const,
      value: eulerianDensity(region.tensor),
      regionId: region.regionId,
    },
    {
      condition: "NEC" as const,
      value: (() => {
        const values = DIRECTIONS.map((direction) =>
          nullDensity(region.tensor, direction),
        ).filter((value): value is number => value != null);
        return values.length === 0 ? null : Math.min(...values);
      })(),
      regionId: region.regionId,
    },
    {
      condition: "DEC" as const,
      value: decProxy(region.tensor),
      regionId: region.regionId,
    },
    {
      condition: "SEC" as const,
      value: secProxy(region.tensor),
      regionId: region.regionId,
    },
  ]);
  const families: Nhm2ObserverRobustEnergyConditionFamilyInput[] = [
    familyFromCandidates("eulerian", eulerianCandidates, []),
    familyFromCandidates("boosted_timelike_grid", boostedCandidates, blockers),
    familyFromCandidates("null_direction_grid", nullCandidates, blockers),
    familyFromCandidates("algebraic_type_i", algebraicCandidates, blockers),
    {
      familyId: "continuous_optimizer",
      status: "not_run",
      optimizerUsed: false,
      blockers: ["continuous_optimizer_not_implemented"],
    },
  ];
  const artifact = buildNhm2ObserverRobustEnergyConditionArtifact({
    generatedAt: new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: atlas.runIdentity.profileId,
    tensorRef: args.sourceFullTensorPath,
    atlasRef: args.regionalSupportAtlasPath,
    atlasHash: atlas.provenance.atlasHash,
    sampleRegionCoverage: sampleRegionCoverage(atlas),
    observerFamilies: families,
  });
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const raw = parseArgs(process.argv.slice(2));
  const regionalSupportAtlasPath = asString(raw["regional-support-atlas"]);
  const sourceFullTensorPath = asString(raw["source-full-tensor"]);
  const outPath = asString(raw.out);
  if (regionalSupportAtlasPath == null || sourceFullTensorPath == null || outPath == null) {
    throw new Error("--regional-support-atlas, --source-full-tensor, and --out are required");
  }
  const artifact = buildAtlasBoundObserverRobustEnergyConditions({
    repoRoot: process.cwd(),
    regionalSupportAtlasPath,
    sourceFullTensorPath,
    outPath,
    auditOnly: raw["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
