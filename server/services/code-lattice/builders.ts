import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import fg from "fast-glob";
import ts from "typescript";
import type { ConsoleTelemetryBundle } from "@shared/desktop";
import {
  EssenceEnvelope,
  type TEssenceEnvelope,
  type TCodeFeature,
} from "@shared/essence-schema";
import {
  CODE_LATTICE_VERSION,
  type CodeEdge,
  type CodeLatticeSnapshot,
} from "@shared/code-lattice";
import { CONSOLE_TELEMETRY_SNAPSHOT_PATH } from "../console-telemetry/persist";

const ROOT = process.cwd().replace(/\\/g, "/");
export const CODE_LATTICE_SOURCE_GLOBS = [
  "client/src/**/*.{ts,tsx,js,jsx}",
  "server/**/*.{ts,tsx,js,jsx}",
  "shared/**/*.{ts,tsx,js,jsx}",
  "modules/**/*.{ts,tsx,js,jsx}",
  "tests/**/*.{ts,tsx,js,jsx}",
];
export const CODE_LATTICE_IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/_generated/**",
  "**/*.stories.*",
  "**/*.d.ts",
  "**/*.test.d.ts",
];
const TEST_CALLS = new Set(["describe", "it", "test"]);
const TOOL_NAME = "code-lattice-index";
const TOOL_VERSION = "0.1.0";
const TOOL_HASH = createHash("sha256")
  .update(`${TOOL_NAME}@${TOOL_VERSION}`)
  .digest("hex");
const TELEMETRY_SNAPSHOT_FILE = CONSOLE_TELEMETRY_SNAPSHOT_PATH;
const TEST_STATUS_FILE = path.join(ROOT, "server/_generated/test-status.json");

export type ImportSymbol = {
  imported: string;
  local: string;
  specifier: string;
  isNamespace: boolean;
  isDefault: boolean;
};

export type ImportRecord = {
  specifier: string;
  symbols: ImportSymbol[];
};

type UsedImport = ImportSymbol & {
  resolved?: string | null;
};

export type MutableCodeNode = {
  feature: TCodeFeature;
  usedImports: UsedImport[];
};

export type FileContext = {
  path: string;
  hash: string;
  imports: ImportRecord[];
  nodes: MutableCodeNode[];
};

const resolutionIndex = new Map<string, string>();
const importResolutionCache = new Map<string, string | null>();
const diagnostics: string[] = [];
type ResonanceKind = NonNullable<TCodeFeature["resonanceKind"]>;

type TestCaseStatus = "pass" | "fail" | "skip" | "unknown";
type TestSuiteCase = { name: string; status: TestCaseStatus };
type TestSuiteStatus = {
  filePath: string;
  status: TestCaseStatus;
  updatedAt?: string;
  tests: TestSuiteCase[];
};

type SuiteHealth = {
  lastStatus: TestCaseStatus;
  lastTestedAt?: string;
  tests: string[];
  cases: TestSuiteCase[];
};

type SalienceSignal = {
  attention: number;
  panels: Set<string>;
  lastUpdated?: string;
};

function posixPath(value: string): string {
  return value.replace(/\\/g, "/");
}

function normalizeFilePath(file: string): string {
  return posixPath(path.relative(ROOT, file));
}

async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    console.warn(`[code-lattice] failed to read ${filePath}:`, error);
    return null;
  }
}

export async function loadTelemetrySnapshot(): Promise<ConsoleTelemetryBundle | null> {
  const payload = await readJsonIfExists<ConsoleTelemetryBundle | ConsoleTelemetryBundle[]>(
    TELEMETRY_SNAPSHOT_FILE,
  );
  if (!payload) {
    return null;
  }
  if (Array.isArray(payload)) {
    return payload[payload.length - 1] ?? null;
  }
  return payload;
}

function toTestStatus(value: unknown): TestCaseStatus {
  switch (String(value ?? "").toLowerCase()) {
    case "pass":
    case "passed":
      return "pass";
    case "fail":
    case "failed":
      return "fail";
    case "skip":
    case "skipped":
      return "skip";
    default:
      return "unknown";
  }
}

function normalizeReportPath(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  const normalized = posixPath(raw);
  if (!normalized) return "";
  if (normalized.startsWith("./")) {
    return normalized.slice(2);
  }
  return normalized;
}

function parseSuiteEntry(entry: any): TestSuiteStatus | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const filePathCandidate =
    entry.filePath ?? entry.file ?? entry.name ?? entry.path ?? entry.testFile ?? entry.location;
  const filePath = normalizeReportPath(filePathCandidate);
  if (!filePath) {
    return null;
  }
  const testsSource =
    Array.isArray(entry.assertionResults) && entry.assertionResults.length > 0
      ? entry.assertionResults
      : Array.isArray(entry.tests) && entry.tests.length > 0
      ? entry.tests
      : Array.isArray(entry.result?.tests)
      ? entry.result.tests
      : [];
  const tests: TestSuiteCase[] = testsSource
    .map((test: any) => {
      const title = String(test.title ?? test.name ?? test.displayName ?? test.fullName ?? "").trim();
      if (!title) return null;
      return { name: title, status: toTestStatus(test.status ?? test.state ?? test.result) };
    })
    .filter((test: TestSuiteCase | null): test is TestSuiteCase => !!test);
  const suiteStatus =
    entry.status && entry.status !== "unknown"
      ? toTestStatus(entry.status)
      : tests.some((test) => test.status === "fail")
      ? "fail"
      : tests.some((test) => test.status === "pass")
      ? "pass"
      : "unknown";
  const updatedAt =
    typeof entry.startTime === "number"
      ? new Date(entry.startTime).toISOString()
      : typeof entry.timestamp === "string"
      ? entry.timestamp
      : undefined;
  return {
    filePath,
    status: suiteStatus,
    updatedAt,
    tests,
  };
}

export async function loadTestSuites(): Promise<TestSuiteStatus[]> {
  const payload = await readJsonIfExists<unknown>(TEST_STATUS_FILE);
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload
      .map((entry) => {
        if (entry && typeof entry === "object" && "filePath" in entry) {
          return {
            filePath: normalizeReportPath((entry as any).filePath),
            status: toTestStatus((entry as any).status),
            updatedAt: typeof (entry as any).updatedAt === "string" ? (entry as any).updatedAt : undefined,
            tests: Array.isArray((entry as any).tests)
              ? (entry as any).tests
                  .map((test: any) => ({
                    name: String(test.name ?? test.title ?? "").trim(),
                    status: toTestStatus(test.status),
                  }))
                  .filter((test: TestSuiteCase) => !!test.name)
              : [],
          } satisfies TestSuiteStatus;
        }
        return parseSuiteEntry(entry);
      })
      .filter((entry): entry is TestSuiteStatus => !!entry && !!entry.filePath);
  }
  if (payload && typeof payload === "object" && Array.isArray((payload as any).testResults)) {
    return (payload as any).testResults
      .map((entry: any) => parseSuiteEntry(entry))
      .filter((entry: TestSuiteStatus | null): entry is TestSuiteStatus => !!entry);
  }
  return [];
}
export function detectCommit(): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "workspace";
  }
}

function detectScriptKind(filePath: string): ts.ScriptKind {
  if (filePath.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filePath.endsWith(".ts")) return ts.ScriptKind.TS;
  if (filePath.endsWith(".jsx")) return ts.ScriptKind.JSX;
  return ts.ScriptKind.JS;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function extractDocblock(node: ts.Node, source: ts.SourceFile): string | undefined {
  const full = source.getFullText();
  const ranges = ts.getLeadingCommentRanges(full, node.pos) ?? [];
  for (let i = ranges.length - 1; i >= 0; i -= 1) {
    const range = ranges[i];
    const text = full.slice(range.pos, range.end);
    if (text.startsWith("/**")) {
      const cleaned = text
        .replace(/^\/\*\*?/, "")
        .replace(/\*\/$/, "")
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*\*? ?/, ""))
        .join("\n")
        .trim();
      if (cleaned.length) {
        return cleaned;
      }
    }
  }
  return undefined;
}

function computeByteOffset(content: string, pos: number): number {
  return Buffer.byteLength(content.slice(0, pos), "utf8");
}

function inferSymbolFallback(filePath: string): string {
  const base = path.posix.basename(filePath);
  return base.replace(/\.[^.]+$/, "");
}

function nodeIdFor(filePath: string, symbol: string, loc: { startLine: number; startCol: number }) {
  return `${filePath}#${symbol}@${loc.startLine}:${loc.startCol}`;
}

function hashSnippet(snippet: string) {
  return createHash("sha256").update(snippet).digest("hex");
}

const getNodeModifiers = (node: ts.Node) =>
  ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;

const isExported = (node: ts.Node) =>
  Boolean(getNodeModifiers(node)?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword));

const hasDefaultModifier = (node: ts.Node) =>
  Boolean(getNodeModifiers(node)?.some((mod) => mod.kind === ts.SyntaxKind.DefaultKeyword));

function detectNodeKind(
  symbol: string,
  filePath: string,
  kindHint: "function" | "class" | "schema" | "test" | "var",
  snippet: string,
): TCodeFeature["kind"] {
  if (kindHint === "class") return "class";
  if (kindHint === "schema") return "schema";
  if (kindHint === "test") return "test";
  if (/\.test\.|\.spec\./.test(filePath) || filePath.includes("/tests/")) return "test";
  if (symbol.startsWith("use") && /[A-Z0-9]/.test(symbol.charAt(3))) return "hook";
  if (symbol[0] && symbol[0].toUpperCase() === symbol[0] && /\.tsx?$/.test(filePath)) {
    return "component";
  }
  if (/schema/i.test(symbol) || /\b(z\.object|z\.array|schema)\b/.test(snippet)) {
    return "schema";
  }
  return kindHint === "var" ? "utility" : "function";
}

const RESONANCE_KIND_MATCHERS: Array<{ kind: ResonanceKind; patterns: RegExp[] }> = [
  {
    kind: "architecture",
    patterns: [
      /^server\/services\/(planner|essence|code-lattice|knowledge|console-telemetry|debate|jobs|learning|mixer|physics|specialists|hardware)\//,
      /^server\/routes\/agi\./,
      /^server\/routes\/orchestrator\./,
      /^server\/helix-core/,
      /^modules\/(dynamic|sim_core|warp)\//,
      /planner|orchestrator|resonance|essence|environment/,
    ],
  },
  {
    kind: "ideology",
    patterns: [
      /^docs\/ethos\//,
      /ethos|ideology|mission|why\b|vision/i,
      /^shared\/(essence|agi|knowledge|skills|desktop)/,
    ],
  },
  {
    kind: "ui",
    patterns: [
      /^client\/src\/components\/(agi|desktop|warp|drive|hull|essence|nav)/,
      /^client\/src\/pages\//,
      /^client\/src\/hooks\/use(Agi|Desktop|Warp|Helix)/,
    ],
  },
  {
    kind: "doc",
    patterns: [/^docs\//, /\.(md|mdx)$/i],
  },
  {
    kind: "data",
    patterns: [/^datasets\//, /\.schema\.json$/i, /\/migrations?\//],
  },
];

function classifyResonanceKind(filePath: string, featureKind: TCodeFeature["kind"]): ResonanceKind {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  if (featureKind === "test" || /\.spec\./.test(normalized) || /\.test\./.test(normalized) || normalized.includes("/tests/")) {
    return "test";
  }
  for (const matcher of RESONANCE_KIND_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(normalized))) {
      return matcher.kind;
    }
  }
  return "plumbing";
}

function buildImportRecords(source: ts.SourceFile): ImportRecord[] {
  const records: ImportRecord[] = [];
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    const symbols: ImportSymbol[] = [];
    const clause = statement.importClause;
    if (clause?.name) {
      symbols.push({
        imported: "default",
        local: clause.name.text,
        specifier,
        isNamespace: false,
        isDefault: true,
      });
    }
    if (clause?.namedBindings) {
      if (ts.isNamespaceImport(clause.namedBindings)) {
        symbols.push({
          imported: "*",
          local: clause.namedBindings.name.text,
          specifier,
          isNamespace: true,
          isDefault: false,
        });
      } else if (ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          symbols.push({
            imported: element.propertyName?.text ?? element.name.text,
            local: element.name.text,
            specifier,
            isNamespace: false,
            isDefault: false,
          });
        }
      }
    }
    if (symbols.length) {
      records.push({ specifier, symbols });
    }
  }
  return records;
}

function detectUsedImports(snippet: string, imports: ImportRecord[]): UsedImport[] {
  if (!imports.length || !snippet) return [];
  const used: UsedImport[] = [];
  for (const record of imports) {
    for (const symbol of record.symbols) {
      if (!symbol.local) continue;
      const regex = new RegExp(`\\b${escapeRegExp(symbol.local)}\\b`);
      if (regex.test(snippet)) {
        used.push({ ...symbol });
      }
    }
  }
  return used;
}

function registerResolutionKeys(relPath: string) {
  const withoutExt = relPath.replace(/\.[^.]+$/, "");
  resolutionIndex.set(relPath, relPath);
  resolutionIndex.set(withoutExt, relPath);
  if (withoutExt.endsWith("/index")) {
    const dir = withoutExt.replace(/\/index$/, "");
    resolutionIndex.set(dir, relPath);
  }
}

function normalizeImportTarget(fromFile: string, specifier: string): string | null {
  if (!specifier) return null;
  if (specifier.startsWith("@/")) {
    return posixPath(path.posix.join("client/src", specifier.slice(2)));
  }
  if (specifier.startsWith("@shared/")) {
    return posixPath(path.posix.join("shared", specifier.slice(8)));
  }
  if (specifier.startsWith("@server/")) {
    return posixPath(path.posix.join("server", specifier.slice(8)));
  }
  if (specifier.startsWith("@modules/")) {
    return posixPath(path.posix.join("modules", specifier.slice(9)));
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const dir = path.posix.dirname(fromFile);
    return posixPath(path.posix.normalize(path.posix.join(dir, specifier)));
  }
  if (
    specifier.startsWith("client/") ||
    specifier.startsWith("shared/") ||
    specifier.startsWith("server/") ||
    specifier.startsWith("modules/") ||
    specifier.startsWith("tests/")
  ) {
    return posixPath(specifier);
  }
  return null;
}

function resolveImportPath(fromFile: string, specifier: string): string | null {
  const cacheKey = `${fromFile}::${specifier}`;
  if (importResolutionCache.has(cacheKey)) {
    return importResolutionCache.get(cacheKey) ?? null;
  }
  const base = normalizeImportTarget(fromFile, specifier);
  if (!base) {
    importResolutionCache.set(cacheKey, null);
    return null;
  }
  const candidates = new Set<string>([
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}/index`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    `${base}/index.js`,
    `${base}/index.jsx`,
  ]);
  for (const candidate of candidates) {
    const hit = resolutionIndex.get(candidate);
    if (hit) {
      importResolutionCache.set(cacheKey, hit);
      return hit;
    }
  }
  importResolutionCache.set(cacheKey, null);
  return null;
}

function createCodeNode(
  params: {
    filePath: string;
    fileHash: string;
    snippet: string;
    doc?: string;
    symbol: string;
    exportName?: string;
    kindHint: "function" | "class" | "schema" | "test" | "var";
    start: number;
    end: number;
    source: ts.SourceFile;
  },
  imports: ImportRecord[],
  commit: string,
): MutableCodeNode {
  const { filePath, fileHash, snippet, doc, symbol } = params;
  const locStart = params.source.getLineAndCharacterOfPosition(params.start);
  const locEnd = params.source.getLineAndCharacterOfPosition(params.end);
  const loc = {
    startLine: locStart.line,
    startCol: locStart.character,
    endLine: locEnd.line,
    endCol: locEnd.character,
  };
  const nodeId = nodeIdFor(filePath, symbol, loc);
  const signatureCandidate = snippet.split(/\r?\n/)[0]?.trim();
  const signature = signatureCandidate?.length ? signatureCandidate : undefined;
  const astHash = hashSnippet(snippet);
  const byteRange = {
    start: computeByteOffset(params.source.getFullText(), params.start),
    end: computeByteOffset(params.source.getFullText(), params.end),
  };
  const lines = snippet.split(/\r?\n/).length;
  const bytes = Buffer.byteLength(snippet, "utf8");
  const feature: TCodeFeature = {
    nodeId,
    symbol,
    exportName: params.exportName,
    kind: detectNodeKind(symbol, filePath, params.kindHint, snippet),
    filePath,
    signature,
    astHash,
    fileHash,
    byteRange,
    loc,
    doc,
    snippet,
    neighbors: [],
    dependencies: [],
    dependants: [],
    health: undefined,
    salience: undefined,
    metrics: {
      bytes,
      lines,
      imports: 0,
      commit,
    },
    tags: undefined,
  };
  if (feature.kind === "test" || /\.test\.|\.spec\./.test(filePath)) {
    feature.tags = ["test"];
  }
  feature.resonanceKind = classifyResonanceKind(filePath, feature.kind);
  const usedImports = detectUsedImports(snippet, imports);
  feature.metrics = { ...feature.metrics, imports: usedImports.length };
  return {
    feature,
    usedImports,
  };
}

function collectVariableNodes(
  node: ts.VariableStatement,
  filePath: string,
  fileHash: string,
  source: ts.SourceFile,
  imports: ImportRecord[],
  commit: string,
): MutableCodeNode[] {
  if (!isExported(node)) return [];
  const nodes: MutableCodeNode[] = [];
  for (const decl of node.declarationList.declarations) {
    if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
    const start = decl.getStart(source);
    const end = decl.getEnd();
    const snippet = decl.getText(source).trim();
    const doc = extractDocblock(node, source);
    let kindHint: "function" | "schema" | "var" = "var";
    if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
      kindHint = "function";
    } else if (ts.isCallExpression(decl.initializer)) {
      const calleeText = decl.initializer.expression.getText(source);
      if (/schema|z\./i.test(calleeText)) {
        kindHint = "schema";
      }
    }
    const codeNode = createCodeNode(
      {
        filePath,
        fileHash,
        snippet,
        doc,
        symbol: decl.name.text,
        exportName: decl.name.text,
        kindHint,
        start,
        end,
        source,
      },
      imports,
      commit,
    );
    nodes.push(codeNode);
  }
  return nodes;
}

function collectTestNodes(
  source: ts.SourceFile,
  filePath: string,
  fileHash: string,
  imports: ImportRecord[],
  commit: string,
): MutableCodeNode[] {
  const nodes: MutableCodeNode[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      TEST_CALLS.has(node.expression.text) &&
      node.parent &&
      ts.isExpressionStatement(node.parent) &&
      node.parent.parent === source
    ) {
      const firstArg = node.arguments[0];
      const label = ts.isStringLiteral(firstArg)
        ? `${node.expression.text}:${firstArg.text}`
        : `${node.expression.text}@${node.pos}`;
      const snippet = node.getText(source).trim();
      const codeNode = createCodeNode(
        {
          filePath,
          fileHash,
          snippet,
          doc: undefined,
          symbol: label,
          exportName: label,
          kindHint: "test",
          start: node.getStart(source),
          end: node.getEnd(),
          source,
        },
        imports,
        commit,
      );
      nodes.push(codeNode);
    }
    node.forEachChild(visit);
  };
  source.forEachChild(visit);
  return nodes;
}

const toHealthStatus = (status: TestCaseStatus): "pass" | "fail" | "unknown" => {
  if (status === "fail") return "fail";
  if (status === "pass") return "pass";
  return "unknown";
};

const formatCaseDisplay = (status: TestCaseStatus, name: string) => `[${status}] ${name}`;

function deriveNodeSalience(
  nodes: MutableCodeNode[],
  telemetry: ConsoleTelemetryBundle | null,
): Map<string, SalienceSignal> {
  const signals = new Map<string, SalienceSignal>();
  if (!telemetry) {
    return signals;
  }
  const nodesById = new Map(nodes.map((node) => [node.feature.nodeId, node]));
  const nodesByFile = new Map<string, MutableCodeNode[]>();
  for (const node of nodes) {
    const list = nodesByFile.get(node.feature.filePath) ?? [];
    list.push(node);
    nodesByFile.set(node.feature.filePath, list);
  }
  const resolveTargets = (sourceId: string): MutableCodeNode[] => {
    const explicit = nodesById.get(sourceId);
    if (explicit) return [explicit];
    const normalized = normalizeReportPath(sourceId);
    if (!normalized) return [];
    const direct = nodesByFile.get(normalized);
    if (direct && direct.length > 0) {
      return direct;
    }
    return Array.from(nodesByFile.entries())
      .filter(([file]) => file.endsWith(normalized))
      .flatMap(([, list]) => list);
  };
  for (const panel of telemetry.panels ?? []) {
    if (!Array.isArray(panel.sourceIds) || panel.sourceIds.length === 0) continue;
    const panelWeight = Math.max(0.5, (panel.metrics?.attention ?? 0) + 1);
    const lastUpdated = panel.lastUpdated ?? telemetry.capturedAt;
    for (const sourceId of panel.sourceIds) {
      const targets = resolveTargets(sourceId);
      for (const target of targets) {
        const existing = signals.get(target.feature.nodeId) ?? {
          attention: 0,
          panels: new Set<string>(),
          lastUpdated,
        };
        existing.attention += panelWeight;
        existing.panels.add(panel.panelId);
        existing.lastUpdated = lastUpdated;
        signals.set(target.feature.nodeId, existing);
      }
    }
  }
  return signals;
}

function buildTestHealthMap(suites: TestSuiteStatus[]): Map<string, SuiteHealth> {
  const map = new Map<string, SuiteHealth>();
  for (const suite of suites) {
    const filePath = normalizeReportPath(suite.filePath);
    if (!filePath) continue;
    const entries =
      suite.tests.length > 0
        ? suite.tests.map((test) => formatCaseDisplay(test.status, test.name))
        : [formatCaseDisplay(suite.status, path.posix.basename(filePath))];
    map.set(filePath, {
      lastStatus: suite.status,
      lastTestedAt: suite.updatedAt,
      tests: entries,
      cases: suite.tests,
    });
  }
  return map;
}

export function applyAugmentedSignals(
  nodes: MutableCodeNode[],
  options: { telemetry?: ConsoleTelemetryBundle | null; suites?: TestSuiteStatus[]; logStats?: boolean },
): void {
  const logStats = options.logStats !== false;
  const salience =
    options.telemetry && options.telemetry.panels?.length
      ? deriveNodeSalience(nodes, options.telemetry)
      : null;
  if (logStats && salience && salience.size > 0) {
    console.log(`[code-lattice] fused telemetry salience for ${salience.size} nodes.`);
  }
  const testHealth =
    options.suites && options.suites.length > 0 ? buildTestHealthMap(options.suites) : null;
  if (logStats && testHealth && testHealth.size > 0) {
    console.log(`[code-lattice] applied test health data from ${testHealth.size} files.`);
  }
  for (const node of nodes) {
    const { feature } = node;
    if (salience) {
      const signal = salience.get(feature.nodeId);
      if (signal) {
        feature.salience = {
          attention: Number(signal.attention.toFixed(3)),
          lastTouchedByUserAt: signal.lastUpdated,
          activePanels: Array.from(signal.panels),
        };
      }
    }
    if (testHealth) {
      const suite = testHealth.get(feature.filePath);
      if (suite) {
        if (feature.kind === "test" && suite.cases.length > 0) {
          const symbol = feature.symbol.toLowerCase();
          const matched = suite.cases.find((test) => symbol.includes(test.name.toLowerCase()));
          if (matched) {
            feature.health = {
              lastStatus: toHealthStatus(matched.status),
              lastTestedAt: suite.lastTestedAt,
              tests: [formatCaseDisplay(matched.status, matched.name)],
            };
            continue;
          }
        }
        feature.health = {
          lastStatus: toHealthStatus(suite.lastStatus),
          lastTestedAt: suite.lastTestedAt,
          tests: suite.tests,
        };
      }
    }
  }
}

export async function readFileContexts(
  files: string[],
  commit: string,
): Promise<FileContext[]> {
  const contexts: FileContext[] = [];
  for (const absolute of files) {
    const content = await fs.readFile(absolute, "utf8");
    const relPath = normalizeFilePath(absolute);
    registerResolutionKeys(relPath);
    const source = ts.createSourceFile(
      relPath,
      content,
      ts.ScriptTarget.Latest,
      true,
      detectScriptKind(relPath),
    );
    const imports = buildImportRecords(source);
    const fileHash = createHash("sha256").update(content).digest("hex");
    const nodes: MutableCodeNode[] = [];
    for (const stmt of source.statements) {
      if (ts.isFunctionDeclaration(stmt) && isExported(stmt)) {
        const symbolName = stmt.name?.text ?? inferSymbolFallback(relPath);
        const doc = extractDocblock(stmt, source);
        nodes.push(
          createCodeNode(
            {
              filePath: relPath,
              fileHash,
              snippet: stmt.getText(source).trim(),
              doc,
              symbol: symbolName,
              exportName: hasDefaultModifier(stmt) ? "default" : symbolName,
              kindHint: "function",
              start: stmt.getStart(source),
              end: stmt.getEnd(),
              source,
            },
            imports,
            commit,
          ),
        );
      } else if (ts.isClassDeclaration(stmt) && isExported(stmt)) {
        const symbolName = stmt.name?.text ?? inferSymbolFallback(relPath);
        const doc = extractDocblock(stmt, source);
        nodes.push(
          createCodeNode(
            {
              filePath: relPath,
              fileHash,
              snippet: stmt.getText(source).trim(),
              doc,
              symbol: symbolName,
              exportName: hasDefaultModifier(stmt) ? "default" : symbolName,
              kindHint: "class",
              start: stmt.getStart(source),
              end: stmt.getEnd(),
              source,
            },
            imports,
            commit,
          ),
        );
      } else if (ts.isInterfaceDeclaration(stmt) && isExported(stmt)) {
        const doc = extractDocblock(stmt, source);
        nodes.push(
          createCodeNode(
            {
              filePath: relPath,
              fileHash,
              snippet: stmt.getText(source).trim(),
              doc,
              symbol: stmt.name.text,
              exportName: stmt.name.text,
              kindHint: "schema",
              start: stmt.getStart(source),
              end: stmt.getEnd(),
              source,
            },
            imports,
            commit,
          ),
        );
      } else if (ts.isTypeAliasDeclaration(stmt) && isExported(stmt)) {
        const doc = extractDocblock(stmt, source);
        nodes.push(
          createCodeNode(
            {
              filePath: relPath,
              fileHash,
              snippet: stmt.getText(source).trim(),
              doc,
              symbol: stmt.name.text,
              exportName: stmt.name.text,
              kindHint: "schema",
              start: stmt.getStart(source),
              end: stmt.getEnd(),
              source,
            },
            imports,
            commit,
          ),
        );
      } else if (ts.isVariableStatement(stmt)) {
        nodes.push(
          ...collectVariableNodes(stmt, relPath, fileHash, source, imports, commit),
        );
      }
    }
    nodes.push(...collectTestNodes(source, relPath, fileHash, imports, commit));
    contexts.push({
      path: relPath,
      hash: fileHash,
      imports,
      nodes,
    });
  }
  return contexts;
}

export function buildGraph(nodes: MutableCodeNode[]): { edges: CodeEdge[] } {
  const nodesById = new Map<string, MutableCodeNode>();
  const exportsByFile = new Map<string, Map<string, MutableCodeNode[]>>();
  const nodesByFile = new Map<string, MutableCodeNode[]>();
  for (const node of nodes) {
    nodesById.set(node.feature.nodeId, node);
    const fileList = nodesByFile.get(node.feature.filePath) ?? [];
    fileList.push(node);
    nodesByFile.set(node.feature.filePath, fileList);
    const exportName = node.feature.exportName ?? node.feature.symbol;
    const fileExports = exportsByFile.get(node.feature.filePath) ?? new Map();
    const bucket = fileExports.get(exportName) ?? [];
    bucket.push(node);
    fileExports.set(exportName, bucket);
    exportsByFile.set(node.feature.filePath, fileExports);
  }

  const edgeSet = new Set<string>();
  const edges: CodeEdge[] = [];

  const link = (from: string, to: string, kind: CodeEdge["kind"], label?: string, weight = 1) => {
    if (from === to) return;
    const key = `${from}->${to}:${kind}:${label ?? ""}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ id: key, from, to, kind, label, weight });
    const fromNode = nodesById.get(from);
    const toNode = nodesById.get(to);
    if (fromNode) {
      if (!fromNode.feature.dependencies.includes(to)) {
        fromNode.feature.dependencies.push(to);
      }
      fromNode.feature.neighbors.push({ nodeId: to, kind, symbol: label, weight });
    }
    if (toNode && !toNode.feature.dependants.includes(from)) {
      toNode.feature.dependants.push(from);
    }
  };

  const mention = (
    node: MutableCodeNode,
    kind: CodeEdge["kind"],
    data: { filePath?: string; symbol?: string; note?: string },
  ) => {
    node.feature.neighbors.push({
      kind,
      nodeId: undefined,
      filePath: data.filePath,
      symbol: data.symbol,
      note: data.note,
    });
  };

  for (const node of nodes) {
    for (const used of node.usedImports) {
      const resolved =
        used.resolved ?? resolveImportPath(node.feature.filePath, used.specifier);
      used.resolved = resolved ?? null;
      if (!resolved) {
        mention(node, "import", { symbol: used.local, note: used.specifier });
        continue;
      }
      const exportName = used.imported === "*" ? used.local : used.imported ?? used.local;
      const exportBucket = exportsByFile.get(resolved);
      if (!exportBucket) {
        mention(node, "import", { filePath: resolved, symbol: exportName });
        continue;
      }
      const matches = exportBucket.get(exportName) ?? [];
      if (!matches.length && exportName === "default") {
        const fallbacks = exportBucket.get(resolved) ?? [];
        if (fallbacks.length) {
          matches.push(...fallbacks);
        }
      }
      if (!matches.length) {
        mention(node, "import", { filePath: resolved, symbol: exportName });
        continue;
      }
      for (const target of matches) {
        link(node.feature.nodeId, target.feature.nodeId, "import", exportName);
      }
    }
  }

  for (const [, fileNodes] of nodesByFile) {
    const ordered = fileNodes
      .slice()
      .sort((a, b) => (a.feature.byteRange?.start ?? 0) - (b.feature.byteRange?.start ?? 0));
    for (let i = 0; i < ordered.length - 1; i += 1) {
      const current = ordered[i];
      const next = ordered[i + 1];
      link(current.feature.nodeId, next.feature.nodeId, "local", current.feature.filePath, 0.25);
      link(next.feature.nodeId, current.feature.nodeId, "local", current.feature.filePath, 0.25);
    }
  }

  return { edges };
}

function buildEnvelope(
  feature: TCodeFeature,
  commit: string,
  generatedAt: string,
): TEssenceEnvelope {
  const header = {
    id: `code:${feature.nodeId}`,
    version: "essence/1.0" as const,
    modality: "code" as const,
    created_at: generatedAt,
    source: {
      uri: feature.filePath,
      original_hash: {
        algo: "sha256",
        value: feature.fileHash ?? feature.astHash,
      },
      creator_id: TOOL_NAME,
    },
  };
  const pipelineStep = {
    name: TOOL_NAME,
    impl_version: TOOL_VERSION,
    lib_hash: { algo: "sha256", value: TOOL_HASH },
    params: { commit, symbol: feature.symbol, kind: feature.kind },
    seed: undefined,
    input_hash: { algo: "sha256", value: feature.fileHash ?? feature.astHash },
    output_hash: { algo: "sha256", value: feature.astHash },
    started_at: generatedAt,
    ended_at: generatedAt,
  };
  const features: TEssenceEnvelope["features"] = {
    code: feature,
  };
  if (feature.doc) {
    features.text = {
      summary: feature.doc,
      source: feature.filePath,
    };
  }
  return EssenceEnvelope.parse({
    header,
    features,
    embeddings: [],
    provenance: {
      pipeline: [pipelineStep],
      merkle_root: { algo: "sha256", value: feature.astHash },
      previous: null,
      signatures: [],
    },
  });
}

export type BuildCodeLatticeOptions = {
  files?: string[];
  globs?: string[];
  ignore?: string[];
  commit?: string;
  telemetry?: ConsoleTelemetryBundle | null;
  suites?: TestSuiteStatus[];
  logStats?: boolean;
};

export type CodeLatticeBuildResult = {
  snapshot: CodeLatticeSnapshot;
  contexts: FileContext[];
  nodes: MutableCodeNode[];
};

export type SnapshotFromContextsOptions = {
  contexts: FileContext[];
  commit: string;
  telemetry?: ConsoleTelemetryBundle | null;
  suites?: TestSuiteStatus[];
  logStats?: boolean;
  generatedAt?: string;
};

export function buildSnapshotFromContexts(
  options: SnapshotFromContextsOptions,
): { snapshot: CodeLatticeSnapshot; nodes: MutableCodeNode[] } {
  const flatNodes = options.contexts.flatMap((ctx) => ctx.nodes);
  if ((options.telemetry?.panels?.length ?? 0) > 0 || (options.suites?.length ?? 0) > 0) {
    applyAugmentedSignals(flatNodes, {
      telemetry: options.telemetry,
      suites: options.suites,
      logStats: options.logStats,
    });
  }
  const { edges } = buildGraph(flatNodes);
  const features: TCodeFeature[] = flatNodes.map((entry) => entry.feature);
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const envelopes = features.map((feature) => buildEnvelope(feature, options.commit, generatedAt));

  const snapshot: CodeLatticeSnapshot = {
    version: CODE_LATTICE_VERSION,
    generatedAt,
    repoRoot: ROOT,
    commit: options.commit,
    filesIndexed: options.contexts.length,
    nodes: features,
    edges,
    envelopes,
    diagnostics: diagnostics.length ? diagnostics : undefined,
  };

  return { snapshot, nodes: flatNodes };
}

export async function buildCodeLatticeSnapshot(
  options: BuildCodeLatticeOptions = {},
): Promise<CodeLatticeBuildResult> {
  diagnostics.length = 0;
  const commit = options.commit ?? detectCommit();
  const files =
    options.files ??
    (
      await fg(options.globs ?? CODE_LATTICE_SOURCE_GLOBS, {
        cwd: ROOT,
        absolute: true,
        ignore: options.ignore ?? CODE_LATTICE_IGNORE_PATTERNS,
      })
    )
      .map((file) => posixPath(file))
      .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    throw new Error("No source files matched for code lattice indexing.");
  }

  const contexts = await readFileContexts(files, commit);
  const telemetrySnapshot =
    options.telemetry !== undefined ? options.telemetry : await loadTelemetrySnapshot();
  const testSuites =
    options.suites !== undefined ? options.suites : await loadTestSuites();
  const generatedAt = new Date().toISOString();
  const { snapshot, nodes } = buildSnapshotFromContexts({
    contexts,
    commit,
    telemetry: telemetrySnapshot,
    suites: testSuites,
    logStats: options.logStats,
    generatedAt,
  });

  return { snapshot, contexts, nodes };
}
