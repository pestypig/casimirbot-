import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

type SourceKey = "narrow" | "heavy" | "recommendation" | "ab_t02" | "ab_t035" | "casimir";

type SourceMap = Record<SourceKey, string | null>;

type RunSummary = {
  ok: boolean;
  decision: "GO" | "NO-GO" | "UNKNOWN";
  blockers: string[];
  package_path: string;
  validate_path: string;
  selected_sources: SourceMap;
  commands: Array<{ name: string; cmd: string; status: number }>;
};

const SUMMARY_PATH = "reports/helix-decision-run-summary.json";

function rootDir(): string {
  return process.env.HELIX_DECISION_ROOT ?? process.cwd();
}

function parseArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>();
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    args.set(key, value);
  }
  return args;
}

function runCommand(name: string, cmd: string, options: { allowFail?: boolean } = {}): { status: number; stdout: string; stderr: string } {
  const child = spawnSync(cmd, {
    cwd: rootDir(),
    shell: true,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  });
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);
  const status = child.status ?? 1;
  if (status !== 0 && !options.allowFail) {
    throw new Error(`command_failed:${name}:${status}`);
  }
  return { status, stdout: child.stdout ?? "", stderr: child.stderr ?? "" };
}

function tryReadJson(filePath: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(rootDir(), filePath), "utf8"));
  } catch {
    return null;
  }
}

function walkFiles(rootRel: string, maxDepth = 7): string[] {
  const absRoot = path.resolve(rootDir(), rootRel);
  if (!fs.existsSync(absRoot)) return [];
  const out: string[] = [];
  function visit(current: string, depth: number): void {
    if (depth > maxDepth) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) visit(next, depth + 1);
      else if (entry.isFile()) out.push(path.relative(rootDir(), next).replace(/\\/g, "/"));
    }
  }
  visit(absRoot, 0);
  return out;
}

function newestMatching(
  roots: string[],
  matcher: (relPath: string) => boolean,
  validator: (doc: Record<string, unknown>, relPath: string) => boolean,
): string | null {
  const candidates: Array<{ relPath: string; mtimeMs: number }> = [];
  for (const root of roots) {
    for (const relPath of walkFiles(root)) {
      if (!matcher(relPath)) continue;
      const doc = tryReadJson(relPath);
      if (!doc || !validator(doc, relPath)) continue;
      const stat = fs.statSync(path.resolve(rootDir(), relPath));
      candidates.push({ relPath, mtimeMs: stat.mtimeMs });
    }
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0]?.relPath ?? null;
}

function isABTempSource(doc: Record<string, unknown>, relPath: string, expected: "t02" | "t035"): boolean {
  if (doc.summary_schema_version !== 2) return false;
  const variant = String(doc.variant ?? "").toLowerCase();
  const normalizedPath = relPath.toLowerCase();
  const other = expected === "t02" ? "t035" : "t02";
  return variant.includes(expected) && !variant.includes(other) && normalizedPath.includes(`/${expected}/`) && !normalizedPath.includes(`/${other}/`);
}

function validateResolvedSources(resolved: SourceMap): void {
  if (path.dirname(resolved.heavy!) !== path.dirname(resolved.recommendation!)) {
    throw new Error(`source_pair_mismatch:heavy_recommendation:${resolved.heavy}:${resolved.recommendation}`);
  }

  const abT02 = tryReadJson(resolved.ab_t02!);
  const abT035 = tryReadJson(resolved.ab_t035!);
  if (!abT02 || !isABTempSource(abT02, resolved.ab_t02!, "t02")) {
    throw new Error(`source_invalid_role:ab_t02:${resolved.ab_t02}`);
  }
  if (!abT035 || !isABTempSource(abT035, resolved.ab_t035!, "t035")) {
    throw new Error(`source_invalid_role:ab_t035:${resolved.ab_t035}`);
  }
}

function resolveSources(overrides: Partial<SourceMap>): SourceMap {
  const fromOverride = (key: SourceKey): string | null => {
    const value = overrides[key] ?? null;
    if (!value) return null;
    if (!fs.existsSync(path.resolve(rootDir(), value))) {
      throw new Error(`source_missing:${key}:${value}`);
    }
    return value;
  };

  const resolved: SourceMap = {
    narrow: fromOverride("narrow") ?? newestMatching(
      ["reports", "artifacts/experiments", "artifacts"],
      (relPath) => relPath.endsWith("/helix-self-tune-gate-summary.json") || relPath === "reports/helix-self-tune-gate-summary.json" || relPath.toLowerCase().includes("narrow") && relPath.endsWith("/summary.json"),
      (doc) => typeof doc.strict_gates === "object",
    ),
    heavy: fromOverride("heavy") ?? newestMatching(
      ["artifacts/experiments/helix-step4-heavy-rerun", "artifacts/experiments", "artifacts"],
      (relPath) => relPath.endsWith("/summary.json"),
      (doc, relPath) => {
        const lower = relPath.toLowerCase();
        if (lower.includes("narrow") || lower.includes("precheck") || lower.includes("ab-rerun")) return false;
        const metrics = doc.metrics as Record<string, unknown> | undefined;
        const provenance = doc.provenance as Record<string, unknown> | undefined;
        return typeof metrics?.relation_packet_built_rate === "number" && typeof provenance === "object";
      },
    ),
    recommendation: fromOverride("recommendation") ?? newestMatching(
      ["artifacts/experiments/helix-step4-heavy-rerun", "artifacts/experiments", "artifacts"],
      (relPath) => relPath.endsWith("/recommendation.json"),
      (doc) => typeof doc.decision_grade_ready === "boolean",
    ),
    ab_t02: fromOverride("ab_t02") ?? newestMatching(
      ["artifacts/experiments/helix-step4-ab-rerun", "artifacts/experiments", "artifacts"],
      (relPath) => relPath.endsWith("/summary.json"),
      (doc, relPath) => isABTempSource(doc, relPath, "t02"),
    ),
    ab_t035: fromOverride("ab_t035") ?? newestMatching(
      ["artifacts/experiments/helix-step4-ab-rerun", "artifacts/experiments", "artifacts"],
      (relPath) => relPath.endsWith("/summary.json"),
      (doc, relPath) => isABTempSource(doc, relPath, "t035"),
    ),
    casimir: fromOverride("casimir") ?? newestMatching(
      ["reports", "artifacts/experiments", "artifacts"],
      (relPath) => relPath.endsWith("casimir.json"),
      (doc) => typeof doc.verdict === "string",
    ),
  };

  for (const [key, value] of Object.entries(resolved) as Array<[SourceKey, string | null]>) {
    if (!value) throw new Error(`source_unresolved:${key}`);
  }

  validateResolvedSources(resolved);
  return resolved;
}

export function buildSummaryShape(input: Partial<RunSummary>): RunSummary {
  return {
    ok: input.ok === true,
    decision: input.decision ?? "UNKNOWN",
    blockers: input.blockers ?? [],
    package_path: input.package_path ?? "reports/helix-decision-package.json",
    validate_path: input.validate_path ?? "reports/helix-decision-validate.json",
    selected_sources: input.selected_sources ?? {
      narrow: null,
      heavy: null,
      recommendation: null,
      ab_t02: null,
      ab_t035: null,
      casimir: null,
    },
    commands: input.commands ?? [],
  };
}

export function resolveSourcesForTest(overrides: Partial<SourceMap>): SourceMap {
  return resolveSources(overrides);
}

function main(): void {
  const args = parseArgs(process.argv);
  const freshEnabled = (args.get("fresh") ?? "true") !== "false";
  const overrides: Partial<SourceMap> = {
    narrow: args.get("narrow") ?? null,
    heavy: args.get("heavy") ?? null,
    recommendation: args.get("recommendation") ?? null,
    ab_t02: args.get("ab_t02") ?? args.get("ab-t02") ?? null,
    ab_t035: args.get("ab_t035") ?? args.get("ab-t035") ?? null,
    casimir: args.get("casimir") ?? null,
  };

  const commands: Array<{ name: string; cmd: string; status: number }> = [];

  if (freshEnabled) {
    const needsNarrow = !overrides.narrow;
    const needsHeavy = !overrides.heavy || !overrides.recommendation;
    const needsAB = !overrides.ab_t02 || !overrides.ab_t035;
    const needsCasimir = !overrides.casimir;

    if (needsNarrow) {
      const cmd = "npm run helix:decision:eval:narrow --if-present";
      const res = runCommand("fresh:narrow", cmd, { allowFail: true });
      commands.push({ name: "fresh:narrow", cmd, status: res.status });
    }
    if (needsHeavy) {
      const cmd = "npm run helix:decision:eval:heavy --if-present";
      const res = runCommand("fresh:heavy", cmd, { allowFail: true });
      commands.push({ name: "fresh:heavy", cmd, status: res.status });
    }
    if (needsAB) {
      const cmdT02 = "npm run helix:decision:eval:ab:t02 --if-present";
      const resT02 = runCommand("fresh:ab_t02", cmdT02, { allowFail: true });
      commands.push({ name: "fresh:ab_t02", cmd: cmdT02, status: resT02.status });
      const cmdT035 = "npm run helix:decision:eval:ab:t035 --if-present";
      const resT035 = runCommand("fresh:ab_t035", cmdT035, { allowFail: true });
      commands.push({ name: "fresh:ab_t035", cmd: cmdT035, status: resT035.status });
    }
    if (needsCasimir) {
      const cmd = "npm run helix:decision:eval:casimir --if-present";
      const res = runCommand("fresh:casimir", cmd, { allowFail: true });
      commands.push({ name: "fresh:casimir", cmd, status: res.status });
    }
  }

  const sources = resolveSources(overrides);
  const packageCmd = [
    "npm run helix:decision:package --",
    `--narrow ${sources.narrow}`,
    `--heavy ${sources.heavy}`,
    `--heavy-recommendation ${sources.recommendation}`,
    `--ab-t02 ${sources.ab_t02}`,
    `--ab-t035 ${sources.ab_t035}`,
    `--casimir ${sources.casimir}`,
  ].join(" ");
  const packageRes = runCommand("decision:package", packageCmd, { allowFail: true });
  commands.push({ name: "decision:package", cmd: packageCmd, status: packageRes.status });

  if (packageRes.status !== 0) {
    const summary = buildSummaryShape({
      ok: false,
      blockers: ["decision_package_blocker:package_generation_failed", `command_failed:decision:package:${packageRes.status}`],
      package_path: "reports/helix-decision-package.json",
      validate_path: "reports/helix-decision-validate.json",
      selected_sources: sources,
      commands,
    });
    fs.mkdirSync(path.resolve(rootDir(), "reports"), { recursive: true });
    fs.writeFileSync(path.resolve(rootDir(), SUMMARY_PATH), `${JSON.stringify(summary, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exit(1);
  }

  const validateCmd = "npm run helix:decision:validate -- --package reports/helix-decision-package.json";
  const validateRes = runCommand("decision:validate", validateCmd, { allowFail: true });
  commands.push({ name: "decision:validate", cmd: validateCmd, status: validateRes.status });

  const pkg = tryReadJson("reports/helix-decision-package.json") ?? {};
  const blockers = Array.isArray((pkg as Record<string, unknown>).decision && ((pkg as any).decision.hard_blockers))
    ? ((pkg as any).decision.hard_blockers as string[])
    : [];
  const decisionValue = String((pkg as any)?.decision?.value ?? "UNKNOWN");
  const summary = buildSummaryShape({
    ok: validateRes.status === 0,
    decision: decisionValue === "GO" || decisionValue === "NO-GO" ? decisionValue : "UNKNOWN",
    blockers,
    package_path: "reports/helix-decision-package.json",
    validate_path: "reports/helix-decision-validate.json",
    selected_sources: sources,
    commands,
  });

  fs.mkdirSync(path.resolve(rootDir(), "reports"), { recursive: true });
  fs.writeFileSync(path.resolve(rootDir(), SUMMARY_PATH), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (!summary.ok) {
    process.exit(1);
  }
}

const isEntrypoint = (() => {
  const entryArg = process.argv[1];
  if (!entryArg) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(entryArg)).href;
  } catch {
    return false;
  }
})();

if (isEntrypoint) {
  try {
    main();
  } catch (error) {
    const summary = buildSummaryShape({
      ok: false,
      blockers: [error instanceof Error ? error.message : String(error)],
    });
    fs.mkdirSync(path.resolve(rootDir(), "reports"), { recursive: true });
    fs.writeFileSync(path.resolve(rootDir(), SUMMARY_PATH), `${JSON.stringify(summary, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exit(1);
  }
}
