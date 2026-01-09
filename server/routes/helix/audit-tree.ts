import { Router } from "express";
import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

type AuditStatus = "pass" | "warn" | "fail" | "unknown";

type AuditRule = {
  id?: string;
  matchPath?: string;
  matchContent?: string;
  flags?: string;
  tags?: string[];
};

type AuditEntry = {
  path: string;
  tags?: string[];
  status?: AuditStatus;
  violations?: string[];
};

type AuditConfig = {
  version?: number;
  sourceGlobs?: string[];
  ignore?: string[];
  rules?: AuditRule[];
  entries?: AuditEntry[];
  auto?: {
    enabled?: boolean;
    contentMaxBytes?: number;
    toolRisks?: boolean;
    rules?: AuditRule[];
  };
};

type AuditTag = {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  severity?: "info" | "warn" | "critical";
  ideology?: string[];
};

type AuditTagRegistry = {
  version?: number;
  tags?: AuditTag[];
};

type IdeologyNode = {
  id: string;
  slug?: string;
  title?: string;
  excerpt?: string;
};

type IdeologyDoc = {
  rootId?: string;
  nodes?: IdeologyNode[];
};

type AuditIssues = {
  missingTags?: boolean;
  unknownTags?: string[];
  violations?: string[];
};

type StatusCounts = {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  unknown: number;
};

type AuditTreeNode = {
  id: string;
  label: string;
  path: string;
  kind: "group" | "file";
  status: AuditStatus;
  tags?: string[];
  issues?: AuditIssues;
  stats?: StatusCounts;
  children?: AuditTreeNode[];
};

type AuditTreeResponse = {
  generatedAt: string;
  config: {
    available: boolean;
    path: string | null;
    version: number | null;
    rules: number;
    entries: number;
    sources: number;
    ignores: number;
  };
  auto: {
    enabled: boolean;
    rules: number;
    toolRisks: boolean;
    contentMaxBytes: number;
  };
  tags: {
    available: boolean;
    path: string | null;
    version: number | null;
    entries: number;
    registry: Record<string, AuditTag>;
  };
  summary: {
    status: StatusCounts;
    fileCount: number;
    taggedCount: number;
    untaggedCount: number;
    unknownTags: { count: number; unique: string[] };
  };
  ideology: {
    rootId: string | null;
    nodes: Record<string, IdeologyNode>;
  };
  root: AuditTreeNode;
};

type CompiledRule = AuditRule & {
  pathRegex: RegExp | null;
  contentRegex: RegExp | null;
};

const STATUS_RANK: Record<AuditStatus, number> = {
  unknown: 0,
  pass: 1,
  warn: 2,
  fail: 3,
};

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const normalizePath = (value: string) => value.replace(/\\/g, "/");

const DEFAULT_SOURCE_GLOBS = [
  "**/*.{ts,tsx,js,jsx,py,go,rs,java,cs,cpp,h,md}",
];

const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/.git/**",
  "**/.next/**",
  "**/coverage/**",
  "**/*.min.*",
  "**/*.d.ts",
];

const DEFAULT_AUTO_RULES: AuditRule[] = [
  {
    id: "auto-api-surface",
    matchPath: "(^|/)(routes|api)(/|\\.)",
    tags: ["surface.api"],
  },
  {
    id: "auto-network-content",
    matchContent: "\\b(fetch|axios|node-fetch|undici)\\b",
    tags: ["io.network"],
  },
  {
    id: "auto-fs-content",
    matchContent:
      "\\b(node:fs|fs/promises|fs\\.writeFile|fs\\.rm|fs\\.unlink|fs\\.createWriteStream|writeFileSync)\\b",
    tags: ["io.disk"],
  },
  {
    id: "auto-process-content",
    matchContent: "\\b(child_process|spawn\\(|exec\\(|execFile\\(|fork\\()\\b",
    tags: ["io.process"],
  },
  {
    id: "auto-crypto-content",
    matchContent: "\\b(crypto|jsonwebtoken|jwt)\\b",
    tags: ["security.crypto"],
  },
  {
    id: "auto-ai-content",
    matchContent:
      "\\b(openai|llm|chat\\s*completions|vision-http|diffusion|whisper)\\b",
    tags: ["ai.inference"],
  },
  {
    id: "auto-provenance-content",
    matchContent: "\\b(provenance|EssenceEnvelope|essence)\\b",
    tags: ["provenance-protocol"],
  },
  {
    id: "auto-auth-path",
    matchPath: "(auth|jwt|tenant|session|passport)",
    tags: ["security.auth"],
  },
  {
    id: "auto-auth-content",
    matchContent: "\\b(auth|jwt|token|passport|session)\\b",
    tags: ["security.auth"],
  },
  {
    id: "auto-telemetry-content",
    matchContent: "\\b(metrics|telemetry|observability|trace)\\b",
    tags: ["observability.telemetry"],
  },
  {
    id: "auto-validation-content",
    matchContent: "\\b(zod|schema|validate|validator)\\b",
    tags: ["contract.validation"],
  },
  {
    id: "auto-guardrails-content",
    matchContent: "\\b(guardrail|certificate|viability|verify|constraint)\\b",
    tags: ["verification-checklist"],
  },
  {
    id: "auto-nondeterminism",
    matchContent: "\\b(Math\\.random|randomUUID|randomInt|Date\\.now|new Date\\()\\b",
    tags: ["determinism.nondeterministic"],
  },
];

const DEFAULT_AUTO_CONFIG = {
  enabled: true,
  contentMaxBytes: 24000,
  toolRisks: true,
  rules: DEFAULT_AUTO_RULES,
};

const loadConfig = () => {
  const configPath = path.resolve(process.cwd(), "AUDIT_TREE.json");
  if (!fs.existsSync(configPath)) {
    return {
      config: null as AuditConfig | null,
      configPath,
    };
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = JSON.parse(raw) as AuditConfig;
  return { config: parsed, configPath };
};

const loadTagRegistry = () => {
  const registryPath = path.resolve(process.cwd(), "AUDIT_TAGS.json");
  if (!fs.existsSync(registryPath)) {
    return {
      registry: null as AuditTagRegistry | null,
      registryPath,
    };
  }
  const raw = fs.readFileSync(registryPath, "utf8");
  const parsed = JSON.parse(raw) as AuditTagRegistry;
  return { registry: parsed, registryPath };
};

const loadIdeology = () => {
  const ideologyPath = path.resolve(
    process.cwd(),
    "docs",
    "ethos",
    "ideology.json",
  );
  if (!fs.existsSync(ideologyPath)) {
    return { ideology: null as IdeologyDoc | null };
  }
  const raw = fs.readFileSync(ideologyPath, "utf8");
  const ideology = JSON.parse(raw) as IdeologyDoc;
  return { ideology };
};

const buildStatusCounts = (): StatusCounts => ({
  total: 0,
  pass: 0,
  warn: 0,
  fail: 0,
  unknown: 0,
});

const bumpStatusCounts = (counts: StatusCounts, status: AuditStatus) => {
  counts.total += 1;
  counts[status] += 1;
};

const mergeStatus = (left: AuditStatus, right: AuditStatus) =>
  STATUS_RANK[left] >= STATUS_RANK[right] ? left : right;

const testRegex = (regex: RegExp, value: string) => {
  if (regex.global || regex.sticky) {
    regex.lastIndex = 0;
  }
  return regex.test(value);
};

const compileRules = (rules: AuditRule[]): CompiledRule[] =>
  rules
    .map((rule) => {
      try {
        const flags = rule.flags ?? "i";
        const pathRegex = rule.matchPath
          ? new RegExp(rule.matchPath, flags)
          : null;
        const contentRegex = rule.matchContent
          ? new RegExp(rule.matchContent, flags)
          : null;
        return { ...rule, pathRegex, contentRegex };
      } catch {
        return {
          ...rule,
          pathRegex: null as RegExp | null,
          contentRegex: null as RegExp | null,
        };
      }
    })
    .filter((rule) => rule.pathRegex || rule.contentRegex);

const readFileContent = (entryPath: string, limit: number): string | null => {
  try {
    const raw = fs.readFileSync(entryPath, "utf8");
    if (raw.length > limit) {
      return raw.slice(0, limit);
    }
    return raw;
  } catch {
    return null;
  }
};

const extractToolRiskTags = (content: string): string[] => {
  const tags = new Set<string>();
  const riskMap: Record<string, string> = {
    network_access: "io.network",
    writes_files: "io.disk",
    privileged: "security.privileged",
  };
  for (const match of content.matchAll(/risks\s*:\s*\[([^\]]*)\]/gi)) {
    const raw = match[1] ?? "";
    Object.keys(riskMap).forEach((risk) => {
      if (raw.includes(`\"${risk}\"`) || raw.includes(`'${risk}'`)) {
        tags.add(riskMap[risk]);
      }
    });
  }
  if (/touchesNetwork\s*:\s*true/i.test(content)) {
    tags.add("io.network");
  }
  if (/writesFiles\s*:\s*true/i.test(content)) {
    tags.add("io.disk");
  }
  if (/privileged\s*:\s*true/i.test(content)) {
    tags.add("security.privileged");
  }
  return Array.from(tags);
};

const buildTree = (nodes: Map<string, AuditTreeNode>) => {
  const root: AuditTreeNode = {
    id: "root",
    label: "repo",
    path: "",
    kind: "group",
    status: "unknown",
    children: [],
    stats: buildStatusCounts(),
  };

  const groupIndex = new Map<string, AuditTreeNode>();
  groupIndex.set("", root);

  const ensureGroup = (parent: AuditTreeNode, segment: string, pathKey: string) => {
    const existing = groupIndex.get(pathKey);
    if (existing) return existing;
    const node: AuditTreeNode = {
      id: `group:${pathKey}`,
      label: segment,
      path: pathKey,
      kind: "group",
      status: "unknown",
      children: [],
      stats: buildStatusCounts(),
    };
    parent.children = parent.children ?? [];
    parent.children.push(node);
    groupIndex.set(pathKey, node);
    return node;
  };

  for (const node of nodes.values()) {
    const segments = node.path.split("/").filter(Boolean);
    let cursor = root;
    let prefix = "";
    segments.forEach((segment, idx) => {
      prefix = prefix ? `${prefix}/${segment}` : segment;
      const isLeaf = idx === segments.length - 1;
      if (isLeaf) {
        cursor.children = cursor.children ?? [];
        cursor.children.push(node);
      } else {
        cursor = ensureGroup(cursor, segment, prefix);
      }
    });
  }

  const rollup = (node: AuditTreeNode): AuditTreeNode => {
    if (!node.children || node.children.length === 0) {
      if (node.stats) {
        bumpStatusCounts(node.stats, node.status);
      }
      return node;
    }
    node.status = "unknown";
    const counts = buildStatusCounts();
    for (const child of node.children) {
      rollup(child);
      node.status = mergeStatus(node.status, child.status);
      if (child.stats) {
        counts.total += child.stats.total;
        counts.pass += child.stats.pass;
        counts.warn += child.stats.warn;
        counts.fail += child.stats.fail;
        counts.unknown += child.stats.unknown;
      }
    }
    node.stats = counts;
    return node;
  };

  rollup(root);
  return root;
};

const buildAuditViewModel = async (): Promise<AuditTreeResponse> => {
  const { config, configPath } = loadConfig();
  const { registry, registryPath } = loadTagRegistry();
  const { ideology } = loadIdeology();
  const rules = config?.rules ?? [];
  const entries = config?.entries ?? [];
  const sourceGlobs =
    config?.sourceGlobs && config.sourceGlobs.length > 0
      ? config.sourceGlobs
      : DEFAULT_SOURCE_GLOBS;
  const ignoreGlobs =
    config?.ignore && config.ignore.length > 0 ? config.ignore : DEFAULT_IGNORE;

  const autoConfig = { ...DEFAULT_AUTO_CONFIG, ...(config?.auto ?? {}) };
  const autoEnabled = autoConfig.enabled !== false;
  const autoRules = autoEnabled
    ? autoConfig.rules && autoConfig.rules.length > 0
      ? autoConfig.rules
      : DEFAULT_AUTO_RULES
    : [];
  const autoToolRisks = autoEnabled && autoConfig.toolRisks !== false;
  const contentMaxBytes =
    typeof autoConfig.contentMaxBytes === "number" &&
    Number.isFinite(autoConfig.contentMaxBytes)
      ? Math.max(1024, Math.floor(autoConfig.contentMaxBytes))
      : DEFAULT_AUTO_CONFIG.contentMaxBytes;

  const ideologyNodes = new Map<string, IdeologyNode>();
  (ideology?.nodes ?? []).forEach((node) => {
    if (!node?.id) return;
    ideologyNodes.set(node.id, {
      id: node.id,
      slug: node.slug,
      title: node.title,
      excerpt: node.excerpt,
    });
  });

  const auditTags = new Map<string, AuditTag>();
  (registry?.tags ?? []).forEach((tag) => {
    if (!tag?.id) return;
    auditTags.set(tag.id, tag);
  });

  const entryIndex = new Map<string, AuditEntry>();
  entries.forEach((entry) => {
    entryIndex.set(normalizePath(entry.path), entry);
  });

  const compiledRules = compileRules(rules);
  const compiledAutoRules = compileRules(autoRules);

  const fileList = sourceGlobs.length
    ? await fg(sourceGlobs, {
        ignore: ignoreGlobs,
        onlyFiles: true,
        dot: false,
      })
    : [];

  const statusCounts = buildStatusCounts();
  const nodes = new Map<string, AuditTreeNode>();
  let taggedCount = 0;
  let untaggedCount = 0;
  let unknownTagCount = 0;
  const unknownTags = new Set<string>();

  for (const entryPath of fileList) {
    const relative = normalizePath(entryPath);
    const matchingEntry = entryIndex.get(relative);
    const tags: string[] = [];
    let content: string | null = null;
    const ensureContent = () => {
      if (content !== null) return content;
      content = readFileContent(entryPath, contentMaxBytes);
      return content;
    };

    for (const rule of compiledRules) {
      const pathOk = rule.pathRegex ? testRegex(rule.pathRegex, relative) : true;
      if (!pathOk) continue;
      const contentOk = rule.contentRegex
        ? (() => {
            const body = ensureContent();
            return body ? testRegex(rule.contentRegex, body) : false;
          })()
        : true;
      if (!contentOk) continue;
      (rule.tags ?? []).forEach((tag) => tags.push(tag));
    }

    if (autoEnabled) {
      for (const rule of compiledAutoRules) {
        const pathOk = rule.pathRegex
          ? testRegex(rule.pathRegex, relative)
          : true;
        if (!pathOk) continue;
        const contentOk = rule.contentRegex
          ? (() => {
              const body = ensureContent();
              return body ? testRegex(rule.contentRegex, body) : false;
            })()
          : true;
        if (!contentOk) continue;
        (rule.tags ?? []).forEach((tag) => tags.push(tag));
      }
      if (autoToolRisks) {
        const body = ensureContent();
        if (body) {
          extractToolRiskTags(body).forEach((tag) => tags.push(tag));
        }
      }
    }
    (matchingEntry?.tags ?? []).forEach((tag) => tags.push(tag));

    const seen = new Set<string>();
    const orderedTags = tags.filter((tag) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });

    const knownTags = orderedTags.filter(
      (tag) => ideologyNodes.has(tag) || auditTags.has(tag),
    );
    const unknown = orderedTags.filter(
      (tag) => !ideologyNodes.has(tag) && !auditTags.has(tag),
    );
    unknown.forEach((tag) => unknownTags.add(tag));
    unknownTagCount += unknown.length;

    const issues: AuditIssues = {};
    if (knownTags.length === 0) {
      issues.missingTags = true;
      untaggedCount += 1;
    } else {
      taggedCount += 1;
    }
    if (unknown.length > 0) {
      issues.unknownTags = unknown;
    }
    if (matchingEntry?.violations && matchingEntry.violations.length > 0) {
      issues.violations = matchingEntry.violations;
    }

    let status: AuditStatus = "pass";
    if (matchingEntry?.status) {
      status = matchingEntry.status;
    } else if (issues.violations && issues.violations.length > 0) {
      status = "fail";
    } else if (issues.missingTags || (issues.unknownTags?.length ?? 0) > 0) {
      status = "warn";
    }

    bumpStatusCounts(statusCounts, status);
    const label = path.posix.basename(relative);
    const node: AuditTreeNode = {
      id: relative,
      label,
      path: relative,
      kind: "file",
      status,
      tags: orderedTags,
      issues: Object.keys(issues).length > 0 ? issues : undefined,
      stats: { ...buildStatusCounts(), ...{ total: 1, [status]: 1 } },
    };
    nodes.set(relative, node);
  }

  const root = buildTree(nodes);
  const ideologyMap: Record<string, IdeologyNode> = {};
  ideologyNodes.forEach((node, key) => {
    ideologyMap[key] = node;
  });
  const auditTagMap: Record<string, AuditTag> = {};
  auditTags.forEach((tag, key) => {
    auditTagMap[key] = tag;
  });

  return {
    generatedAt: new Date().toISOString(),
    config: {
      available: !!config,
      path: config ? path.relative(process.cwd(), configPath) : null,
      version: config?.version ?? null,
      rules: rules.length,
      entries: entries.length,
      sources: sourceGlobs.length,
      ignores: ignoreGlobs.length,
    },
    auto: {
      enabled: autoEnabled,
      rules: autoRules.length,
      toolRisks: autoToolRisks,
      contentMaxBytes,
    },
    tags: {
      available: !!registry,
      path: registry ? path.relative(process.cwd(), registryPath) : null,
      version: registry?.version ?? null,
      entries: registry?.tags?.length ?? 0,
      registry: auditTagMap,
    },
    summary: {
      status: statusCounts,
      fileCount: fileList.length,
      taggedCount,
      untaggedCount,
      unknownTags: { count: unknownTagCount, unique: Array.from(unknownTags) },
    },
    ideology: {
      rootId: ideology?.rootId ?? null,
      nodes: ideologyMap,
    },
    root,
  };
};

const helixAuditTreeRouter = Router();

helixAuditTreeRouter.options("/tree", (_req: Request, res: Response) => {
  setCors(res);
  res.status(200).end();
});

helixAuditTreeRouter.get("/tree", async (_req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");
  try {
    const view = await buildAuditViewModel();
    return res.json(view);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "audit-tree-failed", message });
  }
});

export { helixAuditTreeRouter, buildAuditViewModel };
