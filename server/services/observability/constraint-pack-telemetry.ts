import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { XMLParser } from "fast-xml-parser";
import type {
  RepoConvergenceTelemetry,
  ToolUseBudgetTelemetry,
  ConstraintPackMetricMap,
  AuditSafetyTelemetry,
} from "./constraint-pack-evaluator.js";
import {
  getToolLogs,
  type ToolLogRecord,
} from "./tool-log-store.js";
import { buildAuditViewModel } from "../../routes/helix/audit-tree.js";

export type AutoTelemetryResult<T> = {
  telemetry?: T;
  notes: string[];
};

type TelemetrySourceInput = {
  autoTelemetry?: boolean;
  telemetryPath?: string;
  junitPath?: string;
  vitestPath?: string;
  jestPath?: string;
  eslintPath?: string;
  tscPath?: string;
  toolLogTraceId?: string;
  toolLogWindowMs?: number;
  toolLogLimit?: number;
  env?: NodeJS.ProcessEnv;
};

type AuditTreeNode = {
  kind?: "group" | "file";
  tags?: string[];
  issues?: {
    missingTags?: boolean;
    unknownTags?: string[];
    violations?: string[];
  };
  children?: AuditTreeNode[];
};

type AuditTagRegistryEntry = {
  id: string;
  severity?: "info" | "warn" | "critical";
};

type AuditTreeView = {
  summary?: {
    fileCount?: number;
    taggedCount?: number;
    untaggedCount?: number;
    unknownTags?: { count?: number };
  };
  tags?: {
    registry?: Record<string, AuditTagRegistryEntry>;
  };
  root?: AuditTreeNode;
};

const DEFAULT_MAX_BYTES = 5_000_000;

const parseMaxBytes = (): number => {
  const raw = Number(process.env.CONSTRAINT_PACK_TELEMETRY_MAX_BYTES ?? DEFAULT_MAX_BYTES);
  if (!Number.isFinite(raw) || raw < 10_000) {
    return DEFAULT_MAX_BYTES;
  }
  return Math.floor(raw);
};

const MAX_BYTES = parseMaxBytes();
const XML = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

const normalizeEnv = (env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv =>
  env ?? process.env;

const normalizePathCandidate = (value?: string): string | undefined => {        
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const splitCsv = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const resolveSafePath = (input?: string): string | null => {
  if (!input) return null;
  const cwd = path.resolve(process.cwd());
  const resolved = path.resolve(cwd, input);
  const relative = path.relative(cwd, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  if (!fs.existsSync(resolved)) {
    return null;
  }
  return resolved;
};

const readFileSafe = async (filePath: string): Promise<string | null> => {
  try {
    const stat = await fsPromises.stat(filePath);
    if (!stat.isFile()) return null;
    if (stat.size > MAX_BYTES) return null;
    return await fsPromises.readFile(filePath, "utf8");
  } catch {
    return null;
  }
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toBooleanMetric = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["1", "true", "yes", "pass", "ok", "success"].includes(lowered)) {
      return true;
    }
    if (["0", "false", "no", "fail", "failed", "error"].includes(lowered)) {
      return false;
    }
  }
  return undefined;
};

const readEnvNumber = (env: NodeJS.ProcessEnv, key: string): number | undefined =>
  toNumber(env[key]);

const readEnvBool = (env: NodeJS.ProcessEnv, key: string): boolean | undefined =>
  toBooleanMetric(env[key]);

const readEnvString = (env: NodeJS.ProcessEnv, key: string): string | undefined =>
  normalizePathCandidate(env[key]);



type CanonicalProvenanceClass = "measured" | "proxy" | "inferred";
type CanonicalClaimTier = "diagnostic" | "reduced-order" | "certified";

const normalizeProvenanceClass = (value: unknown): CanonicalProvenanceClass | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "measured" || normalized === "proxy" || normalized === "inferred") {
    return normalized;
  }
  return undefined;
};

const normalizeClaimTier = (value: unknown): CanonicalClaimTier | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "diagnostic" ||
    normalized === "reduced-order" ||
    normalized === "certified"
  ) {
    return normalized;
  }
  return undefined;
};

const deriveCanonicalProvenance = (input: {
  provenanceMissing?: number;
  provenanceClass?: unknown;
  claimTier?: unknown;
}): { provenanceClass: CanonicalProvenanceClass; claimTier: CanonicalClaimTier } => {
  const claimTier = normalizeClaimTier(input.claimTier) ?? "diagnostic";
  const explicitClass = normalizeProvenanceClass(input.provenanceClass);
  if (explicitClass) {
    return { provenanceClass: explicitClass, claimTier };
  }
  if ((input.provenanceMissing ?? 0) > 0) {
    return { provenanceClass: "inferred", claimTier };
  }
  return { provenanceClass: "proxy", claimTier };
};
const readEnvJson = (env: NodeJS.ProcessEnv, key: string): Record<string, unknown> | undefined => {
  const raw = env[key];
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

const mergeRepoTelemetry = (
  base?: RepoConvergenceTelemetry,
  override?: RepoConvergenceTelemetry,
): RepoConvergenceTelemetry | undefined => {
  if (!base && !override) return undefined;
  const merged: RepoConvergenceTelemetry = {
    ...(base ?? {}),
    ...(override ?? {}),
  };
  if (base?.build || override?.build) {
    merged.build = { ...(base?.build ?? {}), ...(override?.build ?? {}) };
  }
  if (base?.tests || override?.tests) {
    merged.tests = { ...(base?.tests ?? {}), ...(override?.tests ?? {}) };
  }
  if (base?.schema || override?.schema) {
    merged.schema = { ...(base?.schema ?? {}), ...(override?.schema ?? {}) };
  }
  if (base?.deps || override?.deps) {
    merged.deps = { ...(base?.deps ?? {}), ...(override?.deps ?? {}) };
  }
  if (base?.lint || override?.lint) {
    merged.lint = { ...(base?.lint ?? {}), ...(override?.lint ?? {}) };
  }
  if (base?.typecheck || override?.typecheck) {
    merged.typecheck = { ...(base?.typecheck ?? {}), ...(override?.typecheck ?? {}) };
  }
  if (base?.metrics || override?.metrics) {
    merged.metrics = { ...(base?.metrics ?? {}), ...(override?.metrics ?? {}) };
  }
  return merged;
};

const mergeToolTelemetry = (
  base?: ToolUseBudgetTelemetry,
  override?: ToolUseBudgetTelemetry,
): ToolUseBudgetTelemetry | undefined => {
  if (!base && !override) return undefined;
  const merged: ToolUseBudgetTelemetry = {
    ...(base ?? {}),
    ...(override ?? {}),
  };
  if (base?.steps || override?.steps) {
    merged.steps = { ...(base?.steps ?? {}), ...(override?.steps ?? {}) };
  }
  if (base?.cost || override?.cost) {
    merged.cost = { ...(base?.cost ?? {}), ...(override?.cost ?? {}) };
  }
  if (base?.ops || override?.ops) {
    merged.ops = { ...(base?.ops ?? {}), ...(override?.ops ?? {}) };
  }
  if (base?.provenance || override?.provenance) {
    merged.provenance = { ...(base?.provenance ?? {}), ...(override?.provenance ?? {}) };
  }
  if (base?.runtime || override?.runtime) {
    merged.runtime = { ...(base?.runtime ?? {}), ...(override?.runtime ?? {}) };
  }
  if (base?.tools || override?.tools) {
    merged.tools = { ...(base?.tools ?? {}), ...(override?.tools ?? {}) };
  }
  if (base?.metrics || override?.metrics) {
    merged.metrics = { ...(base?.metrics ?? {}), ...(override?.metrics ?? {}) };
  }
  return merged;
};

const mergeAuditTelemetry = (
  base?: AuditSafetyTelemetry,
  override?: AuditSafetyTelemetry,
): AuditSafetyTelemetry | undefined => {
  if (!base && !override) return undefined;
  const merged: AuditSafetyTelemetry = {
    ...(base ?? {}),
    ...(override ?? {}),
  };
  if (base?.audit || override?.audit) {
    merged.audit = { ...(base?.audit ?? {}), ...(override?.audit ?? {}) };
    if (base?.audit?.files || override?.audit?.files) {
      merged.audit.files = {
        ...(base?.audit?.files ?? {}),
        ...(override?.audit?.files ?? {}),
      };
    }
    if (base?.audit?.tags || override?.audit?.tags) {
      merged.audit.tags = {
        ...(base?.audit?.tags ?? {}),
        ...(override?.audit?.tags ?? {}),
      };
    }
    if (base?.audit?.violations || override?.audit?.violations) {
      merged.audit.violations = {
        ...(base?.audit?.violations ?? {}),
        ...(override?.audit?.violations ?? {}),
      };
    }
    if (base?.audit?.risk || override?.audit?.risk) {
      merged.audit.risk = {
        ...(base?.audit?.risk ?? {}),
        ...(override?.audit?.risk ?? {}),
      };
    }
    if (base?.audit?.provenance || override?.audit?.provenance) {
      merged.audit.provenance = {
        ...(base?.audit?.provenance ?? {}),
        ...(override?.audit?.provenance ?? {}),
      };
    }
    if (base?.audit?.safety || override?.audit?.safety) {
      merged.audit.safety = {
        ...(base?.audit?.safety ?? {}),
        ...(override?.audit?.safety ?? {}),
      };
    }
    if (base?.audit?.critical || override?.audit?.critical) {
      merged.audit.critical = {
        ...(base?.audit?.critical ?? {}),
        ...(override?.audit?.critical ?? {}),
      };
    }
  }
  if (base?.metrics || override?.metrics) {
    merged.metrics = { ...(base?.metrics ?? {}), ...(override?.metrics ?? {}) };
  }
  return merged;
};

const pickTelemetryPath = (
  env: NodeJS.ProcessEnv,
  explicit?: string,
  envKey?: string,
): string | null => {
  const candidate =
    normalizePathCandidate(explicit) ??
    normalizePathCandidate(env[envKey ?? ""]) ??
    normalizePathCandidate(env.CASIMIR_TELEMETRY_PATH);
  const resolved = resolveSafePath(candidate);
  return resolved;
};

const pickJUnitPath = (
  env: NodeJS.ProcessEnv,
  explicit?: string,
): string | null => {
  const candidate =
    normalizePathCandidate(explicit) ??
    normalizePathCandidate(env.CASIMIR_TEST_JUNIT_PATH) ??
    normalizePathCandidate(env.JUNIT_PATH);
  const resolved = resolveSafePath(candidate);
  return resolved;
};

const pickReportPath = (
  env: NodeJS.ProcessEnv,
  explicit: string | undefined,
  envKeys: string[],
): string | null => {
  const candidate =
    normalizePathCandidate(explicit) ??
    envKeys
      .map((key) => normalizePathCandidate(env[key]))
      .find((value) => value !== undefined);
  return resolveSafePath(candidate);
};

const pickVitestPath = (env: NodeJS.ProcessEnv, explicit?: string): string | null =>
  pickReportPath(env, explicit, ["CASIMIR_TEST_VITEST_PATH", "VITEST_JSON_PATH"]);

const pickJestPath = (env: NodeJS.ProcessEnv, explicit?: string): string | null =>
  pickReportPath(env, explicit, ["CASIMIR_TEST_JEST_PATH", "JEST_JSON_PATH"]);

const pickEslintPath = (env: NodeJS.ProcessEnv, explicit?: string): string | null =>
  pickReportPath(env, explicit, ["CASIMIR_LINT_ESLINT_PATH", "ESLINT_JSON_PATH"]);

const pickTscPath = (env: NodeJS.ProcessEnv, explicit?: string): string | null =>
  pickReportPath(env, explicit, ["CASIMIR_TYPECHECK_TSC_PATH", "TSC_OUTPUT_PATH"]);

const AUTO_REPORT_PATTERNS = {
  junit: ["**/*junit*.xml", "**/junit.xml"],
  vitest: ["**/*vitest*.json", "**/vitest.json"],
  jest: ["**/*jest*.json", "**/jest.json"],
  eslint: ["**/*eslint*.json", "**/eslint.json"],
  tsc: ["**/*tsc*.log", "**/*tsc*.txt", "**/*typecheck*.log", "**/*typecheck*.txt"],
};

const resolveAutoReportDirs = (env: NodeJS.ProcessEnv): string[] => {
  const raw =
    readEnvString(env, "CASIMIR_AUTO_CI_REPORTS_DIRS") ??
    readEnvString(env, "CASIMIR_AUTO_CI_REPORTS_DIR");
  const candidates = raw ? splitCsv(raw) : ["reports"];
  const dirs: string[] = [];
  for (const candidate of candidates) {
    const safe = resolveSafePath(candidate);
    if (!safe) continue;
    try {
      if (fs.statSync(safe).isDirectory()) {
        dirs.push(safe);
      }
    } catch {
      // ignore invalid directories
    }
  }
  return dirs;
};

const isAutoReportScanEnabled = (env: NodeJS.ProcessEnv): boolean => {
  const override = readEnvBool(env, "CASIMIR_AUTO_CI_REPORTS");
  if (override !== undefined) return override;
  const fallback = readEnvBool(env, "CASIMIR_AUTO_TELEMETRY");
  return fallback === true;
};

const pickLatestMatch = async (
  dirs: string[],
  patterns: string[],
  usedPaths: Set<string>,
): Promise<string | null> => {
  if (dirs.length === 0) return null;
  const matches: string[] = [];
  for (const dir of dirs) {
    const found = await fg(patterns, {
      cwd: dir,
      absolute: true,
      onlyFiles: true,
      caseSensitiveMatch: false,
      dot: false,
      followSymbolicLinks: false,
    });
    matches.push(...found);
  }
  const uniqueMatches = Array.from(
    new Set(matches.filter((entry) => !usedPaths.has(entry))),
  );
  if (uniqueMatches.length === 0) return null;

  const candidates = await Promise.all(
    uniqueMatches.map(async (entry) => {
      const safe = resolveSafePath(entry);
      if (!safe) return null;
      try {
        const stat = await fsPromises.stat(safe);
        if (!stat.isFile()) return null;
        return { path: safe, mtimeMs: stat.mtimeMs };
      } catch {
        return null;
      }
    }),
  );
  const sorted = candidates
    .filter(
      (candidate): candidate is { path: string; mtimeMs: number } =>
        candidate !== null,
    )
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return sorted[0]?.path ?? null;
};

const selectReportPath = async (input: {
  env: NodeJS.ProcessEnv;
  explicit?: string;
  pick: (env: NodeJS.ProcessEnv, explicit?: string) => string | null;
  autoEnabled: boolean;
  autoDirs: string[];
  patterns: string[];
  usedPaths: Set<string>;
}): Promise<{ path: string | null; auto: boolean }> => {
  const direct = input.pick(input.env, input.explicit);
  if (direct) {
    input.usedPaths.add(direct);
    return { path: direct, auto: false };
  }
  if (!input.autoEnabled) return { path: null, auto: false };
  const autoPath = await pickLatestMatch(
    input.autoDirs,
    input.patterns,
    input.usedPaths,
  );
  if (autoPath) {
    input.usedPaths.add(autoPath);
    return { path: autoPath, auto: true };
  }
  return { path: null, auto: false };
};

const parseJsonSafe = (raw?: string | null): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const parseMetricMap = (raw?: Record<string, unknown>): ConstraintPackMetricMap | undefined => {
  if (!raw) return undefined;
  const out: ConstraintPackMetricMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "string" ||
      value === null
    ) {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
};

const AUDIT_RISK_TAGS = new Set([
  "io.network",
  "io.disk",
  "io.process",
  "security.auth",
  "security.privileged",
]);
const AUDIT_PROVENANCE_TAGS = new Set(["provenance-protocol"]);
const AUDIT_SAFETY_TAGS = new Set([
  "verification-checklist",
  "integrity-protocols",
]);

const walkAuditTree = (node: AuditTreeNode | undefined, visit: (node: AuditTreeNode) => void) => {
  if (!node) return;
  visit(node);
  if (Array.isArray(node.children)) {
    node.children.forEach((child) => walkAuditTree(child, visit));
  }
};

const isAuditTreeView = (value: unknown): value is AuditTreeView => {
  if (!value || typeof value !== "object") return false;
  const obj = value as AuditTreeView;
  return typeof obj === "object" && !!obj.root && !!obj.summary;
};

const buildAuditTelemetryFromView = (view: AuditTreeView): AuditSafetyTelemetry => {
  let fileCount = 0;
  let taggedCount = 0;
  let untaggedCount = 0;
  let unknownTagCount = 0;
  let violationCount = 0;
  let riskFiles = 0;
  let provenanceFiles = 0;
  let safetyFiles = 0;
  let criticalFiles = 0;

  const registry = view.tags?.registry ?? {};
  const criticalTags = new Set(
    Object.values(registry)
      .filter((tag) => tag.severity === "critical")
      .map((tag) => tag.id),
  );

  walkAuditTree(view.root, (node) => {
    if (node.kind !== "file") {
      return;
    }
    fileCount += 1;
    const tags = Array.isArray(node.tags) ? node.tags : [];
    const uniqueTags = new Set(tags);
    if (uniqueTags.size > 0) {
      taggedCount += 1;
    }
    const hasMissing = node.issues?.missingTags === true || uniqueTags.size === 0;
    if (hasMissing) {
      untaggedCount += 1;
    }
    if (Array.isArray(node.issues?.unknownTags)) {
      unknownTagCount += node.issues?.unknownTags?.length ?? 0;
    }
    if (Array.isArray(node.issues?.violations)) {
      violationCount += node.issues?.violations?.length ?? 0;
    }
    if (Array.from(uniqueTags).some((tag) => AUDIT_RISK_TAGS.has(tag))) {
      riskFiles += 1;
    }
    if (Array.from(uniqueTags).some((tag) => AUDIT_PROVENANCE_TAGS.has(tag))) {
      provenanceFiles += 1;
    }
    if (Array.from(uniqueTags).some((tag) => AUDIT_SAFETY_TAGS.has(tag))) {
      safetyFiles += 1;
    }
    if (Array.from(uniqueTags).some((tag) => criticalTags.has(tag))) {
      criticalFiles += 1;
    }
  });

  if (view.summary) {
    fileCount = view.summary.fileCount ?? fileCount;
    taggedCount = view.summary.taggedCount ?? taggedCount;
    untaggedCount = view.summary.untaggedCount ?? untaggedCount;
    unknownTagCount =
      view.summary.unknownTags?.count ?? unknownTagCount;
  }

  const provenanceCoverage =
    riskFiles === 0 ? 1 : provenanceFiles > 0 ? 1 : 0;
  const safetyCoverage = riskFiles === 0 ? 1 : safetyFiles > 0 ? 1 : 0;

  return {
    audit: {
      files: {
        total: fileCount,
        tagged: taggedCount,
        untagged: untaggedCount,
      },
      tags: {
        unknown: unknownTagCount,
      },
      violations: {
        count: violationCount,
      },
      risk: {
        files: riskFiles,
      },
      provenance: {
        files: provenanceFiles,
        coverage: provenanceCoverage,
      },
      safety: {
        files: safetyFiles,
        coverage: safetyCoverage,
      },
      critical: {
        files: criticalFiles,
      },
    },
  };
};

const parseAuditTelemetryJson = (raw: Record<string, unknown>): AuditSafetyTelemetry => {
  if (isAuditTreeView(raw)) {
    return buildAuditTelemetryFromView(raw);
  }
  if (raw.audit && typeof raw.audit === "object") {
    return raw as AuditSafetyTelemetry;
  }
  return { metrics: parseMetricMap(raw) };
};

type JunitTotals = {
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  timeSeconds?: number;
};

const readJunitTotals = (node: unknown): JunitTotals | null => {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  const tests = toNumber(obj.tests);
  const failures = toNumber(obj.failures) ?? 0;
  const errors = toNumber(obj.errors) ?? 0;
  const skipped = toNumber(obj.skipped) ?? 0;
  const timeSeconds = toNumber(obj.time);
  if (tests === undefined) return null;
  return {
    tests,
    failures,
    errors,
    skipped,
    timeSeconds,
  };
};

const sumTotals = (totals: JunitTotals[]): JunitTotals => {
  return totals.reduce(
    (acc, entry) => ({
      tests: acc.tests + entry.tests,
      failures: acc.failures + entry.failures,
      errors: acc.errors + entry.errors,
      skipped: acc.skipped + entry.skipped,
      timeSeconds:
        acc.timeSeconds !== undefined || entry.timeSeconds !== undefined
          ? (acc.timeSeconds ?? 0) + (entry.timeSeconds ?? 0)
          : undefined,
    }),
    { tests: 0, failures: 0, errors: 0, skipped: 0, timeSeconds: undefined },
  );
};

const parseJUnitSummary = (xml: string): JunitTotals | null => {
  try {
    const parsed = XML.parse(xml);
    const root = parsed.testsuites ?? parsed.testsuite;
    if (!root) return null;
    if (Array.isArray(root)) {
      const totals = root.map(readJunitTotals).filter((entry): entry is JunitTotals => !!entry);
      return totals.length ? sumTotals(totals) : null;
    }
    if (root.testsuite && Array.isArray(root.testsuite)) {
      const totals = root.testsuite
        .map(readJunitTotals)
        .filter((entry: JunitTotals | null): entry is JunitTotals => !!entry);
      return totals.length ? sumTotals(totals) : null;
    }
    const direct = readJunitTotals(root);
    return direct ?? null;
  } catch {
    return null;
  }
};

type TestCounts = {
  total?: number;
  failed?: number;
  passed?: number;
  skipped?: number;
  status?: "pass" | "fail";
};

const countAssertionResults = (value: unknown): TestCounts | null => {
  if (!Array.isArray(value)) return null;
  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const assertions = obj.assertionResults;
    if (!Array.isArray(assertions)) continue;
    for (const assertion of assertions) {
      if (!assertion || typeof assertion !== "object") continue;
      const status = (assertion as Record<string, unknown>).status;
      if (typeof status !== "string") continue;
      const lowered = status.toLowerCase();
      if (["passed", "pass", "success"].includes(lowered)) {
        passed += 1;
        total += 1;
      } else if (["failed", "fail", "error"].includes(lowered)) {
        failed += 1;
        total += 1;
      } else if (["skipped", "pending", "todo", "disabled"].includes(lowered)) {
        skipped += 1;
        total += 1;
      }
    }
  }
  if (total === 0) return null;
  return { total, passed, failed, skipped };
};

const parseTestJsonSummary = (value: unknown): TestCounts | null => {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  let total =
    toNumber(obj.numTotalTests) ??
    toNumber(obj.totalTests) ??
    toNumber(obj.total) ??
    toNumber(obj.tests);
  let failed =
    toNumber(obj.numFailedTests) ??
    toNumber(obj.failedTests) ??
    toNumber(obj.failures) ??
    toNumber(obj.failed);
  let passed =
    toNumber(obj.numPassedTests) ??
    toNumber(obj.passedTests) ??
    toNumber(obj.passed);
  let skipped =
    toNumber(obj.numPendingTests) ??
    toNumber(obj.numSkippedTests) ??
    toNumber(obj.skippedTests) ??
    toNumber(obj.pending) ??
    toNumber(obj.skipped);
  const statusMetric = toBooleanMetric(
    obj.success ?? obj.ok ?? obj.status ?? obj.passed,
  );

  if (total === undefined) {
    const assertionCounts = countAssertionResults(obj.testResults);
    if (assertionCounts) {
      total = assertionCounts.total;
      passed = passed ?? assertionCounts.passed;
      failed = failed ?? assertionCounts.failed;
      skipped = skipped ?? assertionCounts.skipped;
    }
  }

  if (total === undefined) {
    if (
      passed !== undefined ||
      failed !== undefined ||
      skipped !== undefined
    ) {
      total = (passed ?? 0) + (failed ?? 0) + (skipped ?? 0);
    }
  }

  if (passed === undefined && total !== undefined && failed !== undefined) {
    passed = Math.max(0, total - failed - (skipped ?? 0));
  }

  const status =
    failed !== undefined && total !== undefined
      ? failed > 0
        ? "fail"
        : "pass"
      : statusMetric !== undefined
        ? statusMetric
          ? "pass"
          : "fail"
        : undefined;

  if (
    total === undefined &&
    failed === undefined &&
    passed === undefined &&
    skipped === undefined &&
    status === undefined
  ) {
    return null;
  }
  return { total, failed, passed, skipped, status };
};

const buildTestTelemetry = (counts: TestCounts): RepoConvergenceTelemetry => {
  const tests: NonNullable<RepoConvergenceTelemetry["tests"]> = {};
  if (counts.failed !== undefined) tests.failed = counts.failed;
  if (counts.passed !== undefined) tests.passed = counts.passed;
  if (counts.total !== undefined) tests.total = counts.total;
  if (counts.status) tests.status = counts.status;
  return { tests };
};

type EslintTotals = {
  errors: number;
  fatalErrors: number;
  warnings: number;
};

const parseEslintSummary = (value: unknown): EslintTotals | null => {
  const results = Array.isArray(value)
    ? value
    : value &&
        typeof value === "object" &&
        Array.isArray((value as { results?: unknown[] }).results)
      ? (value as { results: unknown[] }).results
      : null;
  if (!results) return null;
  let errors = 0;
  let fatalErrors = 0;
  let warnings = 0;
  for (const entry of results) {
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    errors += toNumber(obj.errorCount) ?? 0;
    fatalErrors += toNumber(obj.fatalErrorCount) ?? 0;
    warnings += toNumber(obj.warningCount) ?? 0;
  }
  return { errors, fatalErrors, warnings };
};

const parseTscStatus = (raw: string): "pass" | "fail" | undefined => {
  const foundMatch = raw.match(/Found\s+(\d+)\s+errors?/i);
  if (foundMatch) {
    const count = Number(foundMatch[1]);
    if (Number.isFinite(count)) {
      return count > 0 ? "fail" : "pass";
    }
  }
  if (/Found\s+0\s+errors?/i.test(raw)) return "pass";
  if (/error\s+TS\d+/i.test(raw) || /\bTS\d+:/i.test(raw)) return "fail";
  return undefined;
};

type ToolLogSummary = {
  calls: number;
  stepsUsed?: number;
  runtimeMs: number;
  forbidden: number;
  approvalMissing: number;
  provenanceMissing: number;
  provenanceClass: CanonicalProvenanceClass;
  claimTier: CanonicalClaimTier;
};

const countPolicyFlag = (value?: boolean | number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  return value ? 1 : 0;
};

const summarizeToolLogs = (records: ToolLogRecord[]): ToolLogSummary | null => {
  if (!records.length) return null;
  const steps = new Set<string>();
  let calls = 0;
  let runtimeMs = 0;
  let forbidden = 0;
  let approvalMissing = 0;
  let provenanceMissing = 0;
  for (const entry of records) {
    calls += 1;
    runtimeMs += Number.isFinite(entry.durationMs) ? entry.durationMs : 0;
    if (entry.stepId) {
      steps.add(entry.stepId);
    }
    if (entry.policy) {
      forbidden += countPolicyFlag(entry.policy.forbidden);
      approvalMissing += countPolicyFlag(entry.policy.approvalMissing);
      provenanceMissing += countPolicyFlag(entry.policy.provenanceMissing);
    }
  }
  const stepsUsed = steps.size > 0 ? steps.size : calls;
  const canonicalProvenance = deriveCanonicalProvenance({ provenanceMissing });
  return {
    calls,
    stepsUsed,
    runtimeMs,
    forbidden,
    approvalMissing,
    provenanceMissing,
    provenanceClass: canonicalProvenance.provenanceClass,
    claimTier: canonicalProvenance.claimTier,
  };
};

const resolveToolLogOptions = (
  env: NodeJS.ProcessEnv,
  input: Pick<
    TelemetrySourceInput,
    "toolLogTraceId" | "toolLogWindowMs" | "toolLogLimit"
  >,
): {
  traceId?: string;
  windowMs?: number;
  limit?: number;
} | null => {
  const traceId =
    normalizePathCandidate(input.toolLogTraceId) ??
    readEnvString(env, "CASIMIR_TOOL_LOG_TRACE_ID");
  const windowMs =
    input.toolLogWindowMs ?? readEnvNumber(env, "CASIMIR_TOOL_LOG_WINDOW_MS");
  const limit =
    input.toolLogLimit ?? readEnvNumber(env, "CASIMIR_TOOL_LOG_LIMIT");
  if (!traceId && windowMs === undefined && limit === undefined) {
    return null;
  }
  return {
    traceId,
    windowMs: windowMs && windowMs > 0 ? windowMs : undefined,
    limit: limit && limit > 0 ? Math.floor(limit) : undefined,
  };
};

const filterToolLogs = (
  records: ToolLogRecord[],
  options: { traceId?: string; windowMs?: number },
): ToolLogRecord[] => {
  let filtered = records;
  if (options.traceId) {
    filtered = filtered.filter((entry) => entry.traceId === options.traceId);
  }
  if (options.windowMs !== undefined) {
    const cutoff = Date.now() - options.windowMs;
    filtered = filtered.filter((entry) => {
      const ts = Date.parse(entry.ts);
      if (!Number.isFinite(ts)) return false;
      return ts >= cutoff;
    });
  }
  return filtered;
};

const loadRepoTelemetryFromEnv = (env: NodeJS.ProcessEnv): RepoConvergenceTelemetry => {
  const buildStatus = env.CASIMIR_BUILD_STATUS ?? env.CASIMIR_BUILD_OK;
  const buildExitCode = readEnvNumber(env, "CASIMIR_BUILD_EXIT_CODE");
  const buildDuration = readEnvNumber(env, "CASIMIR_BUILD_DURATION_MS");

  const testStatus = env.CASIMIR_TEST_STATUS ?? env.CASIMIR_TEST_OK;
  const testsFailed = readEnvNumber(env, "CASIMIR_TEST_FAILED");
  const testsPassed = readEnvNumber(env, "CASIMIR_TEST_PASSED");
  const testsTotal = readEnvNumber(env, "CASIMIR_TEST_TOTAL");

  const schemaContracts = env.CASIMIR_SCHEMA_CONTRACTS ?? env.CASIMIR_SCHEMA_OK;
  const depsCoherence = env.CASIMIR_DEPS_COHERENCE;

  const lintStatus = env.CASIMIR_LINT_STATUS;
  const typecheckStatus = env.CASIMIR_TYPECHECK_STATUS;
  const timeToGreenMs = readEnvNumber(env, "CASIMIR_TIME_TO_GREEN_MS");

  const metrics = parseMetricMap(readEnvJson(env, "CASIMIR_REPO_METRICS_JSON"));

  const telemetry: RepoConvergenceTelemetry = {};
  if (
    buildStatus !== undefined ||
    buildExitCode !== undefined ||
    buildDuration !== undefined
  ) {
    telemetry.build = {
      status: buildStatus,
      ok: toBooleanMetric(buildStatus),
      exitCode: buildExitCode,
      durationMs: buildDuration,
    };
  }
  if (testStatus !== undefined || testsFailed !== undefined || testsPassed !== undefined || testsTotal !== undefined) {
    telemetry.tests = {
      status: testStatus,
      ok: toBooleanMetric(testStatus),
      failed: testsFailed,
      passed: testsPassed,
      total: testsTotal,
    };
  }
  if (schemaContracts !== undefined) {
    telemetry.schema = {
      contracts: schemaContracts,
      ok: toBooleanMetric(schemaContracts),
    };
  }
  if (depsCoherence !== undefined) {
    telemetry.deps = {
      coherence: depsCoherence,
    };
  }
  if (lintStatus !== undefined) {
    telemetry.lint = { status: lintStatus };
  }
  if (typecheckStatus !== undefined) {
    telemetry.typecheck = { status: typecheckStatus };
  }
  if (timeToGreenMs !== undefined) {
    telemetry.timeToGreenMs = timeToGreenMs;
  }
  if (metrics) {
    telemetry.metrics = metrics;
  }
  return telemetry;
};

const loadToolTelemetryFromEnv = (env: NodeJS.ProcessEnv): ToolUseBudgetTelemetry => {
  const stepsUsed = readEnvNumber(env, "CASIMIR_STEPS_USED");
  const stepsTotal = readEnvNumber(env, "CASIMIR_STEPS_TOTAL");
  const costUsd = readEnvNumber(env, "CASIMIR_COST_USD");
  const forbiddenOps = readEnvNumber(env, "CASIMIR_OPS_FORBIDDEN");
  const approvalMissing = readEnvNumber(env, "CASIMIR_OPS_APPROVAL_MISSING");
  const provenanceMissing = readEnvNumber(env, "CASIMIR_PROVENANCE_MISSING");
  const explicitProvenanceClass =
    readEnvString(env, "CASIMIR_PROVENANCE_CLASS") ??
    readEnvString(env, "CASIMIR_PROVENANCE_CLASS_CANONICAL");
  const explicitClaimTier =
    readEnvString(env, "CASIMIR_CLAIM_TIER") ??
    readEnvString(env, "CASIMIR_CLAIM_TIER_CANONICAL");
  const runtimeMs = readEnvNumber(env, "CASIMIR_RUNTIME_MS");
  const toolCalls = readEnvNumber(env, "CASIMIR_TOOL_CALLS");
  const toolTotal = readEnvNumber(env, "CASIMIR_TOOL_TOTAL");
  const metrics = parseMetricMap(readEnvJson(env, "CASIMIR_TOOL_METRICS_JSON"));

  const telemetry: ToolUseBudgetTelemetry = {};
  if (stepsUsed !== undefined || stepsTotal !== undefined) {
    telemetry.steps = { used: stepsUsed, total: stepsTotal };
  }
  if (costUsd !== undefined) {
    telemetry.cost = { usd: costUsd };
  }
  if (forbiddenOps !== undefined || approvalMissing !== undefined) {
    telemetry.ops = {
      forbidden: forbiddenOps,
      approvalMissing,
    };
  }
  if (provenanceMissing !== undefined) {
    telemetry.provenance = { missing: provenanceMissing };
  }
  if (runtimeMs !== undefined) {
    telemetry.runtime = { ms: runtimeMs };
  }
  if (toolCalls !== undefined || toolTotal !== undefined) {
    telemetry.tools = { calls: toolCalls, total: toolTotal };
  }
  const canonicalProvenance = deriveCanonicalProvenance({
    provenanceMissing,
    provenanceClass: explicitProvenanceClass,
    claimTier: explicitClaimTier,
  });
  const deterministicMetrics: ConstraintPackMetricMap = {
    "provenance.class": canonicalProvenance.provenanceClass,
    "claim.tier": canonicalProvenance.claimTier,
  };
  telemetry.metrics = {
    ...(metrics ?? {}),
    ...deterministicMetrics,
  };
  return telemetry;
};

const hasTelemetryFields = (telemetry?: Record<string, unknown>): boolean =>
  !!telemetry && Object.keys(telemetry).length > 0;

const parseRepoTelemetryJson = (
  value: Record<string, unknown>,
): RepoConvergenceTelemetry => {
  if (value.repo && typeof value.repo === "object") {
    return value.repo as RepoConvergenceTelemetry;
  }
  return value as RepoConvergenceTelemetry;
};

const parseToolTelemetryJson = (
  value: Record<string, unknown>,
): ToolUseBudgetTelemetry => {
  if (value.tool && typeof value.tool === "object") {
    return value.tool as ToolUseBudgetTelemetry;
  }
  return value as ToolUseBudgetTelemetry;
};

export const collectRepoConvergenceTelemetry = async (
  input: TelemetrySourceInput & { explicit?: RepoConvergenceTelemetry },
): Promise<AutoTelemetryResult<RepoConvergenceTelemetry>> => {
  const env = normalizeEnv(input.env);
  const notes: string[] = [];
  let autoTelemetry: RepoConvergenceTelemetry | undefined;
  const autoReportEnabled =
    input.autoTelemetry !== undefined
      ? input.autoTelemetry
      : isAutoReportScanEnabled(env);
  const autoReportDirs = autoReportEnabled ? resolveAutoReportDirs(env) : [];
  const usedReportPaths = new Set<string>();

  const telemetryPath = pickTelemetryPath(env, input.telemetryPath, "CASIMIR_REPO_TELEMETRY_PATH");
  if (telemetryPath) {
    const raw = await readFileSafe(telemetryPath);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          autoTelemetry = mergeRepoTelemetry(autoTelemetry, parseRepoTelemetryJson(parsed as Record<string, unknown>));
          notes.push(`telemetry_source=json:${path.relative(process.cwd(), telemetryPath)}`);
        }
      } catch {
        // ignore parse failures
      }
    }
  }

  const junitSelection = await selectReportPath({
    env,
    explicit: input.junitPath,
    pick: pickJUnitPath,
    autoEnabled: autoReportEnabled,
    autoDirs: autoReportDirs,
    patterns: AUTO_REPORT_PATTERNS.junit,
    usedPaths: usedReportPaths,
  });
  const junitPath = junitSelection.path;
  if (junitPath) {
    const raw = await readFileSafe(junitPath);
    if (raw) {
      const totals = parseJUnitSummary(raw);
      if (totals) {
        const failed = totals.failures + totals.errors;
        const passed = Math.max(0, totals.tests - failed - totals.skipped);
        const junitTelemetry: RepoConvergenceTelemetry = {
          tests: {
            failed,
            passed,
            total: totals.tests,
            status: failed > 0 ? "fail" : "pass",
          },
        };
        autoTelemetry = mergeRepoTelemetry(autoTelemetry, junitTelemetry);
        const prefix = junitSelection.auto ? "auto-reports:junit" : "junit";
        notes.push(
          `telemetry_source=${prefix}:${path.relative(process.cwd(), junitPath)}`,
        );
      }
    }
  }

  const vitestSelection = await selectReportPath({
    env,
    explicit: input.vitestPath,
    pick: pickVitestPath,
    autoEnabled: autoReportEnabled,
    autoDirs: autoReportDirs,
    patterns: AUTO_REPORT_PATTERNS.vitest,
    usedPaths: usedReportPaths,
  });
  const vitestPath = vitestSelection.path;
  if (vitestPath) {
    const raw = await readFileSafe(vitestPath);
    const parsed = parseJsonSafe(raw);
    const counts = parseTestJsonSummary(parsed);
    if (counts) {
      autoTelemetry = mergeRepoTelemetry(
        autoTelemetry,
        buildTestTelemetry(counts),
      );
      const prefix = vitestSelection.auto ? "auto-reports:vitest" : "vitest";
      notes.push(
        `telemetry_source=${prefix}:${path.relative(process.cwd(), vitestPath)}`,
      );
    }
  }

  const jestSelection = await selectReportPath({
    env,
    explicit: input.jestPath,
    pick: pickJestPath,
    autoEnabled: autoReportEnabled,
    autoDirs: autoReportDirs,
    patterns: AUTO_REPORT_PATTERNS.jest,
    usedPaths: usedReportPaths,
  });
  const jestPath = jestSelection.path;
  if (jestPath) {
    const raw = await readFileSafe(jestPath);
    const parsed = parseJsonSafe(raw);
    const counts = parseTestJsonSummary(parsed);
    if (counts) {
      autoTelemetry = mergeRepoTelemetry(
        autoTelemetry,
        buildTestTelemetry(counts),
      );
      const prefix = jestSelection.auto ? "auto-reports:jest" : "jest";
      notes.push(
        `telemetry_source=${prefix}:${path.relative(process.cwd(), jestPath)}`,
      );
    }
  }

  const eslintSelection = await selectReportPath({
    env,
    explicit: input.eslintPath,
    pick: pickEslintPath,
    autoEnabled: autoReportEnabled,
    autoDirs: autoReportDirs,
    patterns: AUTO_REPORT_PATTERNS.eslint,
    usedPaths: usedReportPaths,
  });
  const eslintPath = eslintSelection.path;
  if (eslintPath) {
    const raw = await readFileSafe(eslintPath);
    const parsed = parseJsonSafe(raw);
    const totals = parseEslintSummary(parsed);
    if (totals) {
      const lintTelemetry: RepoConvergenceTelemetry = {
        lint: {
          status: totals.errors + totals.fatalErrors > 0 ? "fail" : "pass",
        },
      };
      autoTelemetry = mergeRepoTelemetry(autoTelemetry, lintTelemetry);
      const prefix = eslintSelection.auto ? "auto-reports:eslint" : "eslint";
      notes.push(
        `telemetry_source=${prefix}:${path.relative(process.cwd(), eslintPath)}`,
      );
    }
  }

  const tscSelection = await selectReportPath({
    env,
    explicit: input.tscPath,
    pick: pickTscPath,
    autoEnabled: autoReportEnabled,
    autoDirs: autoReportDirs,
    patterns: AUTO_REPORT_PATTERNS.tsc,
    usedPaths: usedReportPaths,
  });
  const tscPath = tscSelection.path;
  if (tscPath) {
    const raw = await readFileSafe(tscPath);
    if (raw) {
      const status = parseTscStatus(raw);
      if (status) {
        const typecheckTelemetry: RepoConvergenceTelemetry = {
          typecheck: { status },
        };
        autoTelemetry = mergeRepoTelemetry(autoTelemetry, typecheckTelemetry);
        const prefix = tscSelection.auto ? "auto-reports:tsc" : "tsc";
        notes.push(
          `telemetry_source=${prefix}:${path.relative(process.cwd(), tscPath)}`,
        );
      }
    }
  }

  const envTelemetry = loadRepoTelemetryFromEnv(env);
  if (hasTelemetryFields(envTelemetry)) {
    autoTelemetry = mergeRepoTelemetry(autoTelemetry, envTelemetry);
    notes.push("telemetry_source=env");
  }

  const merged = mergeRepoTelemetry(autoTelemetry, input.explicit);
  if (!merged) {
    return { telemetry: input.explicit, notes };
  }
  return { telemetry: merged, notes };
};

export const collectToolUseBudgetTelemetry = async (
  input: TelemetrySourceInput & { explicit?: ToolUseBudgetTelemetry },
): Promise<AutoTelemetryResult<ToolUseBudgetTelemetry>> => {
  const env = normalizeEnv(input.env);
  const notes: string[] = [];
  let autoTelemetry: ToolUseBudgetTelemetry | undefined;

  const telemetryPath = pickTelemetryPath(env, input.telemetryPath, "CASIMIR_TOOL_TELEMETRY_PATH");
  if (telemetryPath) {
    const raw = await readFileSafe(telemetryPath);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          autoTelemetry = mergeToolTelemetry(autoTelemetry, parseToolTelemetryJson(parsed as Record<string, unknown>));
          notes.push(`telemetry_source=json:${path.relative(process.cwd(), telemetryPath)}`);
        }
      } catch {
        // ignore parse failures
      }
    }
  }

  const toolLogOptions = resolveToolLogOptions(env, input);
  if (toolLogOptions) {
    const records = getToolLogs({ limit: toolLogOptions.limit });
    const filtered = filterToolLogs(records, toolLogOptions);
    const summary = summarizeToolLogs(filtered);
    if (summary) {
      const toolTelemetry: ToolUseBudgetTelemetry = {
        runtime: { ms: summary.runtimeMs },
        tools: { calls: summary.calls },
        ops: {
          forbidden: summary.forbidden,
          approvalMissing: summary.approvalMissing,
        },
        provenance: { missing: summary.provenanceMissing },
        metrics: {
          "provenance.class": summary.provenanceClass,
          "claim.tier": summary.claimTier,
        },
      };
      if (summary.stepsUsed !== undefined) {
        toolTelemetry.steps = { used: summary.stepsUsed };
      }
      autoTelemetry = mergeToolTelemetry(autoTelemetry, toolTelemetry);
      notes.push("telemetry_source=tool-log");
    }
  }

  const envTelemetry = loadToolTelemetryFromEnv(env);
  if (hasTelemetryFields(envTelemetry)) {
    autoTelemetry = mergeToolTelemetry(autoTelemetry, envTelemetry);
    notes.push("telemetry_source=env");
  }

  const merged = mergeToolTelemetry(autoTelemetry, input.explicit);
  if (!merged) {
    return { telemetry: input.explicit, notes };
  }
  return { telemetry: merged, notes };
};

export const collectAuditSafetyTelemetry = async (
  input: TelemetrySourceInput & { explicit?: AuditSafetyTelemetry },
): Promise<AutoTelemetryResult<AuditSafetyTelemetry>> => {
  const env = normalizeEnv(input.env);
  const notes: string[] = [];
  let autoTelemetry: AuditSafetyTelemetry | undefined;

  const telemetryPath = pickTelemetryPath(
    env,
    input.telemetryPath,
    "CASIMIR_AUDIT_TELEMETRY_PATH",
  );
  if (telemetryPath) {
    const raw = await readFileSafe(telemetryPath);
    const parsed = parseJsonSafe(raw);
    if (parsed && typeof parsed === "object") {
      autoTelemetry = mergeAuditTelemetry(
        autoTelemetry,
        parseAuditTelemetryJson(parsed as Record<string, unknown>),
      );
      notes.push(
        `telemetry_source=json:${path.relative(process.cwd(), telemetryPath)}`,
      );
    }
  }

  if (input.autoTelemetry) {
    const view = await buildAuditViewModel();
    autoTelemetry = mergeAuditTelemetry(
      autoTelemetry,
      buildAuditTelemetryFromView(view),
    );
    notes.push("telemetry_source=audit-tree");
  }

  const merged = mergeAuditTelemetry(autoTelemetry, input.explicit);
  if (!merged) {
    return { telemetry: input.explicit, notes };
  }
  return { telemetry: merged, notes };
};

export const isAutoTelemetryEnabled = (env?: NodeJS.ProcessEnv): boolean => {
  const normalized = normalizeEnv(env);
  const value =
    normalized.CASIMIR_AUTO_TELEMETRY ?? normalized.CASIMIR_AUTO_CI_REPORTS;
  return value === "1" || value === "true";
};
