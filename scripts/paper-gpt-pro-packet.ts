import { randomUUID, createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  PAPER_CANONICAL_RULES,
  PAPER_CANONICAL_TREE_FILES,
} from "./paper-framework-binding.js";

type CliOptions = {
  title: string;
  paperId?: string;
  tags: string[];
  focus?: string;
  outDir: string;
  attachmentNames: string[];
  sourceType: "pdf" | "image" | "mixed";
};

type CanonicalTreeNode = {
  id?: string;
  title?: string;
  summary?: string;
  evidence?: unknown;
};

type CanonicalTreeDoc = {
  nodes?: CanonicalTreeNode[];
};

type GraphResolverTree = {
  id?: string;
  path?: string;
  label?: string;
  matchers?: unknown;
  topicTags?: unknown;
};

type GraphResolverConfig = {
  trees?: GraphResolverTree[];
};

type PromptCanonicalTarget = {
  canonical_id: string;
  label: string;
  source_tree: string;
  relation: string;
  target_types: string[];
  keywords: string[];
  evidence_paths: string[];
};

type PromptExecutableHotspot = {
  canonical_id: string;
  file_path: string;
  symbols: string[];
  notes: string;
};

const DEFAULT_OUT_DIR = "artifacts/papers/gpt-pro";
const DEFAULT_SOURCE_TYPE: CliOptions["sourceType"] = "mixed";
const GPT_SCHEMA_PATH = "schemas/paper-gpt-pro-report.schema.json";
const GRAPH_RESOLVERS_PATH = "configs/graph-resolvers.json";

const RELEVANT_GRAPH_TREE_IDS = new Set([
  "stellar-ps1-bridges",
  "dp-collapse",
  "uncertainty-mechanics",
  "math",
  "paper-ingestion-runtime",
]);

const EXECUTABLE_HOTSPOTS: PromptExecutableHotspot[] = [
  {
    canonical_id: "dp-collapse-estimator",
    file_path: "shared/dp-collapse.ts",
    symbols: ["computeDpCollapse", "dpDeltaEPointPairPlummer", "dpSelfEnergyUniformSphere"],
    notes: "Primary DP collapse equations and collapse-time estimator.",
  },
  {
    canonical_id: "dp-collapse-derivation",
    file_path: "docs/DP_COLLAPSE_DERIVATION.md",
    symbols: ["DP collapse derivation"],
    notes: "Theory assumptions that define estimator interpretation.",
  },
  {
    canonical_id: "stress-energy-equations",
    file_path: "modules/dynamic/stress-energy-equations.ts",
    symbols: ["casimirEnergyDensity", "enhancedAvgEnergyDensity", "stressEnergyFromDensity"],
    notes: "Stress-energy math and coherence-linked energy density adapters.",
  },
  {
    canonical_id: "uncertainty-collapse-constraints",
    file_path: "shared/collapse-benchmark.ts",
    symbols: ["estimateTauRcFromCurvature", "collapseBenchmarkDiagnostics"],
    notes: "Collapse constraints, tau/r_c heuristics, and benchmark diagnostics.",
  },
  {
    canonical_id: "uncertainty-coherence-window",
    file_path: "server/services/collapse-benchmark.ts",
    symbols: ["resolveCollapseParams", "buildCollapseBenchmarkResult"],
    notes: "Server assembly for collapse benchmark records and observables.",
  },
  {
    canonical_id: "bridge-noise-spectrum-to-collapse-proxy",
    file_path: "server/services/mixer/collapse.ts",
    symbols: ["collapseMix", "getCollapseStrategy"],
    notes: "Modal collapse proxy fusion and provenance tier handling.",
  },
  {
    canonical_id: "dp-adapters",
    file_path: "server/services/dp-adapters.ts",
    symbols: ["buildDpInputFromAdapter", "dpMassDistributionFromStressEnergyBrick"],
    notes: "Adapter bridge from stress-energy to DP inputs.",
  },
  {
    canonical_id: "dp-adapter-build",
    file_path: "server/services/dp-adapter-build.ts",
    symbols: ["buildDpAdapterFromSources"],
    notes: "Builds deterministic adapter payloads for DP planner and benchmark lanes.",
  },
  {
    canonical_id: "dp-planner-service",
    file_path: "server/services/dp-planner.ts",
    symbols: ["buildDpPlanResult"],
    notes: "Planner-level orchestration for DP collapse and emitted planning artifacts.",
  },
];

const INGEST_CONTRACT_FILES = [
  "scripts/paper-prompt-ingest.ts",
  "scripts/paper-framework-binding.ts",
  "docs/architecture/paper-ingestion-paperrun-contract-v1.md",
  "docs/runbooks/paper-prompt-ingest.md",
  "schemas/paper-ingest-request.schema.json",
  "schemas/paper-run-record.schema.json",
  "schemas/paper-knowledge-pack.schema.json",
  "docs/knowledge/paper-ingestion-runtime-tree.json",
  "configs/graph-resolvers.json",
  "configs/physics-root-leaf-manifest.v1.json",
];

function parseArgs(argv: string[]): CliOptions {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith("--")) continue;
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "1");
      continue;
    }
    args.set(key, next);
    i += 1;
  }
  const title = (args.get("title") ?? "Attached Scientific Paper").trim();
  const sourceType = parseSourceType(args.get("source-type"));
  return {
    title,
    paperId: args.get("paper-id")?.trim(),
    tags: splitCsv(args.get("tags")),
    focus: args.get("focus")?.trim(),
    outDir: args.get("out-dir")?.trim() || DEFAULT_OUT_DIR,
    attachmentNames: splitCsv(args.get("attachment-names"), true),
    sourceType,
  };
}

function parseSourceType(input?: string): CliOptions["sourceType"] {
  const normalized = (input ?? "").trim().toLowerCase();
  if (normalized === "pdf") return "pdf";
  if (normalized === "image") return "image";
  return DEFAULT_SOURCE_TYPE;
}

function splitCsv(input?: string, preserveCase = false): string[] {
  if (!input) return [];
  const values = input
    .split(",")
    .map((entry) => (preserveCase ? entry.trim() : normalizeTag(entry)))
    .filter(Boolean);
  return Array.from(new Set(values));
}

function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toFsSafeName(value: string): string {
  return value.replace(/[:]+/g, "-").replace(/[^a-z0-9._-]+/gi, "-");
}

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function extractEvidencePaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const paths = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = (entry as { path?: unknown }).path;
      return typeof candidate === "string" ? candidate.trim() : null;
    })
    .filter((entry): entry is string => Boolean(entry));
  return Array.from(new Set(paths));
}

async function readJsonFile<T>(relativePath: string): Promise<T | null> {
  const absolutePath = path.resolve(relativePath);
  try {
    const raw = await fs.readFile(absolutePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function loadCanonicalTargets(): Promise<PromptCanonicalTarget[]> {
  const nodeById = new Map<string, { label: string; sourceTree: string; evidencePaths: string[] }>();
  for (const treePath of PAPER_CANONICAL_TREE_FILES) {
    const doc = await readJsonFile<CanonicalTreeDoc>(treePath);
    if (!doc) continue;
    for (const node of doc.nodes ?? []) {
      const nodeId = typeof node.id === "string" ? node.id.trim() : "";
      if (!nodeId) continue;
      const label = typeof node.title === "string" && node.title.trim() ? node.title.trim() : nodeId;
      nodeById.set(nodeId, {
        label,
        sourceTree: treePath,
        evidencePaths: extractEvidencePaths(node.evidence),
      });
    }
  }

  const byCanonicalId = new Map<string, PromptCanonicalTarget>();
  for (const rule of PAPER_CANONICAL_RULES) {
    const existing = byCanonicalId.get(rule.canonicalId);
    const descriptor = nodeById.get(rule.canonicalId);
    const target: PromptCanonicalTarget = {
      canonical_id: rule.canonicalId,
      label: descriptor?.label ?? rule.canonicalId,
      source_tree: descriptor?.sourceTree ?? "unknown",
      relation: rule.relation,
      target_types: rule.targetTypes.slice(),
      keywords: rule.keywords.slice(),
      evidence_paths: descriptor?.evidencePaths ?? [],
    };
    if (!existing) {
      byCanonicalId.set(rule.canonicalId, target);
      continue;
    }
    existing.keywords = Array.from(new Set([...existing.keywords, ...target.keywords]));
    existing.target_types = Array.from(new Set([...existing.target_types, ...target.target_types]));
    if (existing.evidence_paths.length === 0 && target.evidence_paths.length > 0) {
      existing.evidence_paths = target.evidence_paths;
    }
    if (existing.source_tree === "unknown" && target.source_tree !== "unknown") {
      existing.source_tree = target.source_tree;
      existing.label = target.label;
    }
  }

  return Array.from(byCanonicalId.values()).sort((a, b) => a.canonical_id.localeCompare(b.canonical_id));
}

async function loadRelevantGraphLanes(): Promise<
  Array<{
    id: string;
    path: string;
    label: string;
    topic_tags: string[];
    matchers: string[];
  }>
> {
  const config = await readJsonFile<GraphResolverConfig>(GRAPH_RESOLVERS_PATH);
  if (!config?.trees) return [];
  const lanes = config.trees
    .map((entry) => ({
      id: typeof entry.id === "string" ? entry.id : "",
      path: typeof entry.path === "string" ? entry.path : "",
      label: typeof entry.label === "string" ? entry.label : "",
      topic_tags: safeArray(entry.topicTags),
      matchers: safeArray(entry.matchers),
    }))
    .filter((entry) => entry.id && entry.path);
  return lanes
    .filter(
      (entry) =>
        RELEVANT_GRAPH_TREE_IDS.has(entry.id) ||
        PAPER_CANONICAL_TREE_FILES.includes(entry.path as (typeof PAPER_CANONICAL_TREE_FILES)[number]),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function filterExistingPaths(paths: string[]): Promise<string[]> {
  const existing: string[] = [];
  for (const candidate of paths) {
    try {
      await fs.access(path.resolve(candidate));
      existing.push(candidate);
    } catch {
      // ignore
    }
  }
  return Array.from(new Set(existing));
}

function buildPromptMarkdown(input: {
  title: string;
  paperId: string;
  sourceType: CliOptions["sourceType"];
  tags: string[];
  focus?: string;
  attachmentNames: string[];
  canonicalTargets: PromptCanonicalTarget[];
  executableHotspots: PromptExecutableHotspot[];
  graphLanes: Array<{ id: string; path: string; label: string; topic_tags: string[]; matchers: string[] }>;
  ingestContractFiles: string[];
  contextPath: string;
  templatePath: string;
}): string {
  const attachmentList = input.attachmentNames.length > 0 ? input.attachmentNames : ["<attached-file>"];
  const tagLine = input.tags.length > 0 ? input.tags.join(", ") : "paper,physics";
  const focusLine = input.focus ? `Focus hints: ${input.focus}` : "Focus hints: extract all physically testable claims.";
  const canonicalLines = input.canonicalTargets
    .map(
      (entry) =>
        `- ${entry.canonical_id} (${entry.label}) :: relation=${entry.relation}; targets=${entry.target_types.join("/")}; source=${entry.source_tree}`,
    )
    .join("\n");
  const hotspotLines = input.executableHotspots
    .map(
      (entry) =>
        `- ${entry.canonical_id} -> ${entry.file_path} :: symbols=${entry.symbols.join(", ")} :: ${entry.notes}`,
    )
    .join("\n");
  const laneLines = input.graphLanes
    .map((entry) => `- ${entry.id} (${entry.label}) -> ${entry.path}`)
    .join("\n");
  const contractLines = input.ingestContractFiles.map((entry) => `- ${entry}`).join("\n");
  return [
    "You are producing a CasimirBot paper ingestion report for Codex implementation.",
    "",
    "Task",
    `- Analyze the attached paper source (${input.sourceType}) and produce a single JSON object that validates against \`${GPT_SCHEMA_PATH}\`.`,
    `- Paper ID: ${input.paperId}`,
    `- Title: ${input.title}`,
    `- Tags: ${tagLine}`,
    `- Attachments: ${attachmentList.join(", ")}`,
    `- ${focusLine}`,
    "",
    "Hard requirements",
    "- Return JSON only (no markdown, no prose around JSON).",
    "- Every claim must include at least one evidence span with page + direct quote from the paper.",
    "- Every citation must include evidence spans and raw citation text exactly as seen in the paper.",
    "- `canonical_bindings[].canonical_id` must be selected from the canonical target list below.",
    "- `executable_mappings[].implementation_candidates[].file_path` must reference a real repo path from the hotspot/contract files.",
    "- If evidence is missing, keep the item but mark low confidence and explain in rationale/notes (do not fabricate).",
    "",
    "Canonical targets",
    canonicalLines,
    "",
    "Executable hotspots",
    hotspotLines,
    "",
    "Graph resolver lanes to align with",
    laneLines || "- none",
    "",
    "Ingestion contract files",
    contractLines,
    "",
    "Reference artifacts generated in this repo",
    `- Context packet: ${input.contextPath}`,
    `- JSON template: ${input.templatePath}`,
    "",
    "Output schema path",
    `- ${GPT_SCHEMA_PATH}`,
  ].join("\n");
}

function buildTemplateJson(input: {
  title: string;
  sourceType: CliOptions["sourceType"];
  attachmentNames: string[];
  tags: string[];
  canonicalTargets: PromptCanonicalTarget[];
  executableHotspots: PromptExecutableHotspot[];
}): Record<string, unknown> {
  const firstCanonical = input.canonicalTargets[0]?.canonical_id ?? "dp-collapse-derivation";
  const firstHotspot = input.executableHotspots[0];
  return {
    schema_version: 1,
    report_id: `gptreport:${randomUUID()}`,
    generated_at: new Date().toISOString(),
    generator: {
      platform: "chatgpt",
      model: "gpt-pro",
      notes: "Replace placeholder values with extracted paper evidence.",
    },
    paper: {
      title: input.title,
      source_type: input.sourceType,
      attachment_names: input.attachmentNames.length > 0 ? input.attachmentNames : ["<attached-file>"],
      topic_tags: input.tags,
    },
    claims: [
      {
        claim_id: "claim:template:1",
        claim_type: "observation",
        text: "Replace with a paper-grounded claim.",
        confidence: 0.5,
        evidence_spans: [{ page: 1, quote: "Replace with exact quote.", locator: "section:1" }],
      },
    ],
    citations: [],
    citation_links: [],
    paper_card: {
      concepts: [],
      quantitative_values: [],
      systems: [],
      math_objects: {
        equations: [],
        definitions: [],
        variables: [],
        units: [],
        assumptions: [],
      },
      congruence_assessments: [],
    },
    canonical_bindings: [
      {
        local_id: "claim:template:1",
        local_type: "claim",
        canonical_id: firstCanonical,
        relation: "supports",
        score: 0.5,
        source_tree: "docs/knowledge/dp-collapse-tree.json",
        rationale: "Replace with actual mapping rationale.",
      },
    ],
    executable_mappings: firstHotspot
      ? [
          {
            canonical_id: firstHotspot.canonical_id,
            model_kind: "model",
            implementation_candidates: [
              {
                file_path: firstHotspot.file_path,
                kind: "function",
                symbol: firstHotspot.symbols[0] ?? "computeDpCollapse",
                confidence: 0.5,
                rationale: "Replace with evidence-grounded implementation linkage.",
              },
            ],
          },
        ]
      : [],
    prediction_contract_candidates: [],
    symbol_equivalence_entries: [],
    maturity_gate_candidates: [],
    codex_patch_guidance: {
      target_files: [
        "scripts/paper-prompt-ingest.ts",
        "docs/knowledge/paper-ingestion-runtime-tree.json",
      ],
      merge_strategy: "merge_with_dedupe",
      notes: "Replace with precise merge actions grounded in extracted evidence.",
    },
  };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const title = opts.title;
  const paperId =
    opts.paperId && opts.paperId.length > 0
      ? opts.paperId
      : `${slugify(title) || "paper"}:${createHash("sha256").update(title).digest("hex").slice(0, 8)}`;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outRoot = path.resolve(opts.outDir, toFsSafeName(paperId));
  await fs.mkdir(outRoot, { recursive: true });

  const canonicalTargets = await loadCanonicalTargets();
  const graphLanes = await loadRelevantGraphLanes();
  const existingIngestFiles = await filterExistingPaths(INGEST_CONTRACT_FILES);
  const existingHotspots = (
    await Promise.all(
      EXECUTABLE_HOTSPOTS.map(async (entry) => {
        try {
          await fs.access(path.resolve(entry.file_path));
          return entry;
        } catch {
          return null;
        }
      }),
    )
  ).filter((entry): entry is PromptExecutableHotspot => entry !== null);

  const context = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    paper_id: paperId,
    paper_title: title,
    source_type: opts.sourceType,
    topic_tags: opts.tags,
    focus: opts.focus ?? null,
    output_schema: GPT_SCHEMA_PATH,
    graph_lanes: graphLanes,
    canonical_targets: canonicalTargets,
    executable_hotspots: existingHotspots,
    ingest_contract_files: existingIngestFiles,
  };

  const contextPath = path.join(outRoot, `${stamp}.context.json`);
  const templatePath = path.join(outRoot, `${stamp}.template.json`);
  const promptPath = path.join(outRoot, `${stamp}.prompt.md`);

  const templateJson = buildTemplateJson({
    title,
    sourceType: opts.sourceType,
    attachmentNames: opts.attachmentNames,
    tags: opts.tags,
    canonicalTargets,
    executableHotspots: existingHotspots,
  });
  const promptMd = buildPromptMarkdown({
    title,
    paperId,
    sourceType: opts.sourceType,
    tags: opts.tags,
    focus: opts.focus,
    attachmentNames: opts.attachmentNames,
    canonicalTargets,
    executableHotspots: existingHotspots,
    graphLanes,
    ingestContractFiles: existingIngestFiles,
    contextPath,
    templatePath,
  });

  await fs.writeFile(contextPath, `${JSON.stringify(context, null, 2)}\n`, "utf8");
  await fs.writeFile(templatePath, `${JSON.stringify(templateJson, null, 2)}\n`, "utf8");
  await fs.writeFile(promptPath, `${promptMd}\n`, "utf8");

  const summary = {
    ok: true,
    paperId,
    files: {
      prompt: promptPath,
      context: contextPath,
      template: templatePath,
    },
    counts: {
      canonicalTargets: canonicalTargets.length,
      executableHotspots: existingHotspots.length,
      graphLanes: graphLanes.length,
      ingestContractFiles: existingIngestFiles.length,
    },
    schema: GPT_SCHEMA_PATH,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[paper-gpt-pro-packet] ${message}`);
  process.exitCode = 1;
});
