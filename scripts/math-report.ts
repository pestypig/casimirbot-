import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import {
  MATH_STAGE_LEVELS,
  mathStageRegistry,
  type MathCheck,
  type MathStage,
  type MathStageEntry,
  type UnitSignature,
} from "../shared/math-stage.js";

type MathGraphEdge = {
  from: string;
  to: string;
  reason?: string;
  waiver?: string;
  unitKeyWarnings?: boolean;
};

type EvidenceIssue = {
  module: string;
  stage: MathStage;
  missing: string[];
};

type UnitVector = {
  M: number;
  L: number;
  T: number;
  unknown: string[];
};

type UnitCoverage = {
  entriesWithUnits: number;
  entriesMissingUnits: string[];
  byStage: Record<
    MathStage,
    { total: number; withUnits: number; missing: string[] }
  >;
};

type UnitViolation = {
  from: string;
  to: string;
  key: string;
  fromUnit: string;
  toUnit: string;
  reason: string;
  severity: "error" | "warning";
};

type StageViolation = {
  from: string;
  to: string;
  fromStage: MathStage;
  toStage: MathStage;
  reason: string;
};

const REPORT_DIR = process.env.MATH_REPORT_DIR ?? "reports";
const REPORT_JSON = process.env.MATH_REPORT_JSON ?? "math-report.json";
const REPORT_MD = process.env.MATH_REPORT_MD ?? "math-report.md";
const MAX_LIST = Number(process.env.MATH_REPORT_MAX_LIST ?? 50);

const TEST_LIKE_TYPES = new Set<MathCheck["type"]>([
  "test",
  "snapshot",
  "stability",
  "residual",
]);
const STABILITY_TYPES = new Set<MathCheck["type"]>(["stability", "snapshot"]);
const RESIDUAL_TYPES = new Set<MathCheck["type"]>(["residual"]);
const UNIT_KEY_ALIASES: Record<string, string> = {
  T00_avg: "T00",
  T11_avg: "T11",
  T22_avg: "T22",
  T33_avg: "T33",
  t00: "T00",
  avgT00: "T00",
  stressEnergyT00: "T00",
  stressEnergyT11: "T11",
  stressEnergyT22: "T22",
  stressEnergyT33: "T33",
  beta_avg: "beta",
  betaAvg: "beta",
  natarioShiftAmplitude: "beta",
  shiftAmplitude: "beta",
  gap: "gap_nm",
  gap_nm: "gap_nm",
  gammaVanDenBroeck: "gammaVdB",
  gammaVdB: "gammaVdB",
  modulationFreqGHz: "modulationFreq_GHz",
  modulationFreq_GHz: "modulationFreq_GHz",
  burstLengthUs: "burst_us",
  burstDuration: "burst_us",
  cycleLengthUs: "cycle_us",
  cycleDuration: "cycle_us",
};

const WATCH_GLOBS = [
  "modules/gr/**/*.ts",
  "modules/warp/**/*.ts",
  "modules/analysis/**/*.ts",
  "modules/dynamic/**/*.ts",
  "modules/physics/**/*.ts",
  "server/gr/**/*.ts",
  "server/gr-*.ts",
  "server/energy-pipeline.ts",
  "server/stress-energy-brick.ts",
  "server/services/observability/**/*.ts",
  "server/services/constraint-packs/**/*.ts",
  "server/routes/agi*.ts",
  "server/routes/analysis-loops.ts",
  "server/routes/training-trace.ts",
  "server/routes/warp-viability.ts",
  "tools/warp*.ts",
  "tools/verifyCertificate.ts",
];

const IGNORE_GLOBS = [
  "**/__tests__/**",
  "**/*.spec.ts",
  "**/*.test.ts",
  "**/*.d.ts",
  "**/index.ts",
];

const repoRoot = process.cwd();
const registryByModule = new Map(
  mathStageRegistry.map((entry) => [entry.module, entry]),
);

const fileExists = (relativePath: string) =>
  fs.existsSync(path.resolve(repoRoot, relativePath));

const hasAnyType = (checks: MathCheck[], types: Set<MathCheck["type"]>) =>
  checks.some((check) => types.has(check.type));

const requiresResidualEvidence = (entry: MathStageEntry) =>
  entry.tag.startsWith("GR_");

const resolveEvidenceIssues = (entry: MathStageEntry): EvidenceIssue | null => {
  const checks = entry.checks ?? [];
  const missing: string[] = [];

  switch (entry.stage) {
    case "exploratory":
      if (checks.length === 0) {
        missing.push("sanity_checks");
      }
      break;
    case "reduced-order":
      if (!hasAnyType(checks, TEST_LIKE_TYPES)) {
        missing.push("test_or_snapshot");
      }
      break;
    case "diagnostic":
      if (!hasAnyType(checks, STABILITY_TYPES)) {
        missing.push("stability_or_snapshot");
      }
      if (requiresResidualEvidence(entry) && !hasAnyType(checks, RESIDUAL_TYPES)) {
        missing.push("residual_check");
      }
      break;
    case "certified":
      if (!hasAnyType(checks, TEST_LIKE_TYPES)) {
        missing.push("test_or_snapshot");
      }
      if (!checks.some((check) => check.type === "policy")) {
        missing.push("policy_check");
      }
      break;
  }

  for (const check of checks) {
    if (!fileExists(check.path)) {
      missing.push(`missing_${check.type}_file:${check.path}`);
    }
  }

  return missing.length > 0
    ? { module: entry.module, stage: entry.stage, missing }
    : null;
};

const normalizeUnitKey = (key: string) => UNIT_KEY_ALIASES[key] ?? key;

const normalizeUnits = (units?: UnitSignature) => {
  const normalized = new Map<string, string>();
  if (!units) return normalized;
  for (const [key, value] of Object.entries(units)) {
    const canonical = normalizeUnitKey(key);
    if (!normalized.has(canonical)) {
      normalized.set(canonical, value);
    }
  }
  return normalized;
};

const parseUnitVector = (unit: string): UnitVector => {
  const trimmed = unit.trim();
  const vec: UnitVector = { M: 0, L: 0, T: 0, unknown: [] };
  if (!trimmed || trimmed === "1") {
    return vec;
  }
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (token === "1") continue;
    const match = /^([MLT])(?:\^(-?\d+))?$/.exec(token);
    if (!match) {
      vec.unknown.push(token);
      continue;
    }
    const dim = match[1] as "M" | "L" | "T";
    const exp = match[2] ? Number(match[2]) : 1;
    vec[dim] += Number.isFinite(exp) ? exp : 0;
  }
  return vec;
};

const isDimensionless = (unit: UnitVector) =>
  unit.M === 0 && unit.L === 0 && unit.T === 0;

const sameDimensions = (left: UnitVector, right: UnitVector) =>
  left.M === right.M && left.L === right.L && left.T === right.T;

const isLengthTimeSwap = (left: UnitVector, right: UnitVector) =>
  left.M === right.M && left.L === right.T && left.T === right.L;

const loadGraph = (): { edges: MathGraphEdge[] } => {
  const graphPath = path.resolve(repoRoot, "MATH_GRAPH.json");
  if (!fs.existsSync(graphPath)) {
    return { edges: [] };
  }
  const raw = fs.readFileSync(graphPath, "utf8");
  const parsed = JSON.parse(raw) as { edges?: MathGraphEdge[] };
  return { edges: Array.isArray(parsed.edges) ? parsed.edges : [] };
};

const buildAdjacency = (edges: MathGraphEdge[]) => {
  const adjacency = new Map<string, MathGraphEdge[]>();
  for (const edge of edges) {
    if (!edge?.from || !edge?.to) continue;
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge);
    adjacency.set(edge.from, list);
  }
  return adjacency;
};

const resolveUnitCoverage = (): UnitCoverage => {
  const byStage: UnitCoverage["byStage"] = {
    exploratory: { total: 0, withUnits: 0, missing: [] },
    "reduced-order": { total: 0, withUnits: 0, missing: [] },
    diagnostic: { total: 0, withUnits: 0, missing: [] },
    certified: { total: 0, withUnits: 0, missing: [] },
  };
  let entriesWithUnits = 0;
  const entriesMissingUnits: string[] = [];
  for (const entry of mathStageRegistry) {
    const stage = entry.stage;
    const unitCount = entry.units ? Object.keys(entry.units).length : 0;
    byStage[stage].total += 1;
    if (unitCount > 0) {
      byStage[stage].withUnits += 1;
      entriesWithUnits += 1;
    } else if (stage !== "exploratory") {
      byStage[stage].missing.push(entry.module);
      entriesMissingUnits.push(entry.module);
    }
  }
  return { entriesWithUnits, entriesMissingUnits, byStage };
};

const resolveUnitViolations = (edges: MathGraphEdge[]): UnitViolation[] => {
  const violations: UnitViolation[] = [];
  for (const edge of edges) {
    const fromEntry = registryByModule.get(edge.from);
    const toEntry = registryByModule.get(edge.to);
    if (!fromEntry || !toEntry) continue;
    const fromUnits = normalizeUnits(fromEntry.units);
    const toUnits = normalizeUnits(toEntry.units);
    if (fromUnits.size === 0 || toUnits.size === 0) continue;

    for (const [key, fromUnitRaw] of fromUnits.entries()) {
      if (!toUnits.has(key)) continue;
      const toUnitRaw = toUnits.get(key);
      if (!toUnitRaw) continue;
      const fromVec = parseUnitVector(fromUnitRaw);
      const toVec = parseUnitVector(toUnitRaw);

      if (fromVec.unknown.length > 0) {
        violations.push({
          from: fromEntry.module,
          to: toEntry.module,
          key,
          fromUnit: fromUnitRaw,
          toUnit: toUnitRaw,
          reason: `unknown tokens: ${fromVec.unknown.join(", ")}`,
          severity: "warning",
        });
      }
      if (toVec.unknown.length > 0) {
        violations.push({
          from: fromEntry.module,
          to: toEntry.module,
          key,
          fromUnit: fromUnitRaw,
          toUnit: toUnitRaw,
          reason: `unknown tokens: ${toVec.unknown.join(", ")}`,
          severity: "warning",
        });
      }

      if (isDimensionless(toVec) && !isDimensionless(fromVec)) {
        violations.push({
          from: fromEntry.module,
          to: toEntry.module,
          key,
          fromUnit: fromUnitRaw,
          toUnit: toUnitRaw,
          reason: "dimensionless_target",
          severity: "error",
        });
        continue;
      }

      if (sameDimensions(fromVec, toVec)) continue;

      if (edge.unitConversion && isLengthTimeSwap(fromVec, toVec)) {
        continue;
      }

      violations.push({
        from: fromEntry.module,
        to: toEntry.module,
        key,
        fromUnit: fromUnitRaw,
        toUnit: toUnitRaw,
        reason: edge.unitConversion
          ? "conversion_not_applicable"
          : "unit_mismatch",
        severity: "error",
      });
    }
  }
  return violations;
};

const resolveStageViolations = (
  edges: MathGraphEdge[],
  evidenceIssues: Map<string, EvidenceIssue>,
): {
  edgeViolations: StageViolation[];
  pipelineViolations: StageViolation[];
} => {
  const edgeViolations: StageViolation[] = [];
  const pipelineViolations: StageViolation[] = [];
  const adjacency = buildAdjacency(edges);

  const certifiedMax = MATH_STAGE_LEVELS.diagnostic;
  for (const edge of edges) {
    const fromEntry = registryByModule.get(edge.from);
    const toEntry = registryByModule.get(edge.to);
    if (!fromEntry || !toEntry) continue;
    const toLevel = MATH_STAGE_LEVELS[toEntry.stage];
    if (fromEntry.stage === "certified" && toLevel > certifiedMax) {
      if (!edge.waiver || edge.waiver.trim().length === 0) {
        edgeViolations.push({
          from: edge.from,
          to: edge.to,
          fromStage: fromEntry.stage,
          toStage: toEntry.stage,
          reason: "certified_dependency_requires_waiver",
        });
      }
    }
  }

  const minUpstreamStage: Record<MathStage, number> = {
    exploratory: MATH_STAGE_LEVELS.exploratory,
    "reduced-order": MATH_STAGE_LEVELS.exploratory,
    diagnostic: MATH_STAGE_LEVELS["reduced-order"],
    certified: MATH_STAGE_LEVELS["reduced-order"],
  };

  const visitFromRoot = (root: MathStageEntry) => {
    const rootMinStage = minUpstreamStage[root.stage];
    const seen = new Set<string>();
    const stack: string[] = [root.module];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      if (seen.has(current)) continue;
      seen.add(current);
      const edgesFrom = adjacency.get(current) ?? [];
      for (const edge of edgesFrom) {
        const child = registryByModule.get(edge.to);
        if (!child) continue;
        const childLevel = MATH_STAGE_LEVELS[child.stage];
        if (childLevel < rootMinStage) {
          if (!edge.waiver || edge.waiver.trim().length === 0) {
            pipelineViolations.push({
              from: edge.from,
              to: edge.to,
              fromStage: root.stage,
              toStage: child.stage,
              reason: "upstream_stage_below_minimum",
            });
          }
        }
        if (root.stage === "certified" && evidenceIssues.has(child.module)) {
          if (!edge.waiver || edge.waiver.trim().length === 0) {
            pipelineViolations.push({
              from: edge.from,
              to: edge.to,
              fromStage: root.stage,
              toStage: child.stage,
              reason: "upstream_missing_evidence",
            });
          }
        }
        stack.push(child.module);
      }
    }
  };

  mathStageRegistry
    .filter((entry) => entry.stage === "certified")
    .forEach(visitFromRoot);

  return { edgeViolations, pipelineViolations };
};

const buildCoverage = () => {
  const coverage: Record<
    MathStage,
    { count: number; modules: string[] }
  > = {
    exploratory: { count: 0, modules: [] },
    "reduced-order": { count: 0, modules: [] },
    diagnostic: { count: 0, modules: [] },
    certified: { count: 0, modules: [] },
  };
  for (const entry of mathStageRegistry) {
    coverage[entry.stage].count += 1;
    coverage[entry.stage].modules.push(entry.module);
  }
  return coverage;
};

const resolveUnstagedModules = async (): Promise<string[]> => {
  const staged = new Set(mathStageRegistry.map((entry) => entry.module));
  const files = await fg(WATCH_GLOBS, {
    ignore: IGNORE_GLOBS,
    dot: false,
  });
  return files.filter((file) => !staged.has(file)).sort();
};

const renderList = (items: string[], max = MAX_LIST) => {
  if (items.length === 0) return "none";
  const shown = items.slice(0, max);
  const tail = items.length > max ? `\n- ... (${items.length - max} more)` : "";
  return `- ${shown.join("\n- ")}${tail}`;
};

const renderViolations = (items: StageViolation[], max = MAX_LIST) => {
  if (items.length === 0) return "none";
  const shown = items.slice(0, max).map((item) => {
    return `${item.from} -> ${item.to} (${item.reason})`;
  });
  const tail = items.length > max ? `\n- ... (${items.length - max} more)` : "";
  return `- ${shown.join("\n- ")}${tail}`;
};

const renderEvidenceIssues = (items: EvidenceIssue[], max = MAX_LIST) => {
  if (items.length === 0) return "none";
  const shown = items.slice(0, max).map((item) => {
    return `${item.module} (${item.stage}): ${item.missing.join(", ")}`;
  });
  const tail = items.length > max ? `\n- ... (${items.length - max} more)` : "";
  return `- ${shown.join("\n- ")}${tail}`;
};

const ensureReportDir = () => {
  const dir = path.resolve(repoRoot, REPORT_DIR);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const main = async () => {
  const coverage = buildCoverage();
  const unstaged = await resolveUnstagedModules();
  const evidenceIssues = mathStageRegistry
    .map(resolveEvidenceIssues)
    .filter((item): item is EvidenceIssue => item !== null);
  const evidenceMap = new Map(
    evidenceIssues.map((item) => [item.module, item]),
  );
  const graph = loadGraph();
  const { edgeViolations, pipelineViolations } = resolveStageViolations(
    graph.edges,
    evidenceMap,
  );

  const unitCoverage = resolveUnitCoverage();
  const unitViolations = resolveUnitViolations(graph.edges);

  const report = {
    generatedAt: new Date().toISOString(),
    registryCount: mathStageRegistry.length,
    coverage,
    unstaged: { count: unstaged.length, modules: unstaged },
    evidenceIssues: { count: evidenceIssues.length, items: evidenceIssues },    
    stageViolations: {
      edge: { count: edgeViolations.length, items: edgeViolations },
      pipeline: { count: pipelineViolations.length, items: pipelineViolations },
    },
    unitCoverage,
    unitViolations: {
      count: unitViolations.length,
      errors: unitViolations.filter((item) => item.severity === "error"),
      warnings: unitViolations.filter((item) => item.severity === "warning"),
    },
  };

  const dir = ensureReportDir();
  const jsonPath = path.join(dir, REPORT_JSON);
  const mdPath = path.join(dir, REPORT_MD);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines: string[] = [];
  lines.push("# Math Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Registry entries: ${report.registryCount}`);
  lines.push("");
  lines.push("## Coverage by Stage");
  (Object.keys(coverage) as MathStage[]).forEach((stage) => {
    lines.push(`- ${stage}: ${coverage[stage].count}`);
  });
  lines.push("");
  lines.push("## Unstaged Modules");
  lines.push(renderList(unstaged));
  lines.push("");
  lines.push("## Missing Evidence");
  lines.push(renderEvidenceIssues(evidenceIssues));
  lines.push("");
  lines.push("## Stage Violations (Edges)");
  lines.push(renderViolations(edgeViolations));
  lines.push("");
  lines.push("## Stage Violations (Pipelines)");
  lines.push(renderViolations(pipelineViolations));
  lines.push("");
  lines.push("## Unit Coverage");
  lines.push(
    `- entries with units: ${unitCoverage.entriesWithUnits}/${mathStageRegistry.length}`,
  );
  if (unitCoverage.entriesMissingUnits.length) {
    lines.push("- missing units:");
    lines.push(renderList(unitCoverage.entriesMissingUnits));
  } else {
    lines.push("- missing units: none");
  }
  lines.push("");
  lines.push("## Unit Violations");
  if (unitViolations.length === 0) {
    lines.push("none");
  } else {
    const formatted = unitViolations.map(
      (item) =>
        `${item.from} -> ${item.to} ${item.key} (${item.fromUnit} -> ${item.toUnit}): ${item.reason} [${item.severity}]`,
    );
    lines.push(renderList(formatted));
  }
  lines.push("");
  fs.writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf8");

  console.log(`Math report written to ${path.relative(repoRoot, jsonPath)}`);
  console.log(`Math report written to ${path.relative(repoRoot, mdPath)}`);
};

main();
