import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getTool } from "../server/skills";

export type AnchorTag =
  | "casimir"
  | "warp"
  | "stress-energy"
  | "validation"
  | "tests"
  | "web-api";

interface AnchorConfig {
  path: string;
  tag: AnchorTag;
  weight?: number;
}

export interface ContextBlock {
  id: string;
  sourcePath: string;
  tag: AnchorTag;
  startLine: number;
  endLine: number;
  content: string;
}

export interface AssembledPrompt {
  systemPrompt: string;
  userPrompt: string;
  contextBlocks: ContextBlock[];
  auditBlocks?: PhysicsAuditBlock[];
  auditMeta?: {
    enabled: boolean;
    reason?: string;
    mode?: "disabled" | "fallback" | "llm";
    cacheKey?: string;
    cached?: boolean;
  };
  citationHints: {
    [blockId: string]: {
      sourcePath: string;
      lines: [number, number];
      tag: AnchorTag;
    };
  };
}

export interface PhysicsAuditBlock {
  id: string;
  label: string;
  kind: "audit" | "formula" | "env" | "safety" | "frontier";
  text: string;
  source?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const ANCHORS: AnchorConfig[] = [
  { path: "docs/casimir-tile-mechanism.md", tag: "casimir", weight: 1.2 },
  { path: "modules/core/physics-constants.ts", tag: "casimir", weight: 1.1 },
  { path: "modules/sim_core/static-casimir.ts", tag: "casimir" },
  { path: "server/energy-pipeline.ts", tag: "casimir", weight: 1.3 },

  { path: "docs/alcubierre-alignment.md", tag: "warp", weight: 1.4 },
  { path: "modules/dynamic/stress-energy-equations.ts", tag: "stress-energy", weight: 1.3 },
  { path: "modules/dynamic/natario-metric.ts", tag: "warp" },
  { path: "modules/warp/natario-warp.ts", tag: "warp" },
  { path: "modules/warp/warp-module.ts", tag: "warp" },
  { path: "server/stress-energy-brick.ts", tag: "stress-energy" },
  { path: "warp-web/js/physics-core.js", tag: "web-api" },

  { path: "tests/stress-energy-brick.spec.ts", tag: "tests" },
  { path: "tests/york-time.spec.ts", tag: "tests" },
  { path: "tests/theory-checks.spec.ts", tag: "tests" },
  { path: "tests/test_static.py", tag: "tests" },
  { path: "tests/test_stress_energy_equations.py", tag: "tests" },
  { path: "tests/test_dynamic.py", tag: "tests" },
  { path: "tests/test_target_validation.py", tag: "tests" },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/g)
    .filter(Boolean);
}

function scoreAnchor(queryTokens: string[], fileTokens: string[]): number {
  if (!fileTokens.length) return 0;
  let score = 0;
  const fileSet = new Map<string, number>();

  for (const token of fileTokens) {
    fileSet.set(token, (fileSet.get(token) ?? 0) + 1);
  }

  for (const needle of queryTokens) {
    const freq = fileSet.get(needle);
    if (freq) {
      score += Math.log2(1 + freq);
    }
  }

  return score;
}

interface FileCacheEntry {
  path: string;
  absPath: string;
  tag: AnchorTag;
  weight: number;
  content: string;
  lines: string[];
  tokens: string[];
}

let fileCache: FileCacheEntry[] | null = null;

const DEFAULT_CHAR_BUDGET = 15_000;
const DEFAULT_AUDIT_BUDGET = 3_500;
const DEFAULT_AUDIT_CODE_BUDGET = 4_000;
const isAuditEnabled = () => String(process.env.PHYSICS_AUDIT_ENABLE ?? "").toLowerCase() === "true";

const auditCache = new Map<
  string,
  {
    blocks: PhysicsAuditBlock[];
    meta: { enabled: boolean; reason?: string; mode?: "fallback" | "llm" | "disabled" };
  }
>();

async function loadAnchors(): Promise<FileCacheEntry[]> {
  if (fileCache) return fileCache;

  const entries: FileCacheEntry[] = [];

  for (const anchor of ANCHORS) {
    const absPath = path.join(PROJECT_ROOT, anchor.path);
    let content: string;
    try {
      content = await fs.readFile(absPath, "utf8");
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    const tokens = tokenize(content);
    entries.push({
      path: anchor.path,
      absPath,
      tag: anchor.tag,
      weight: anchor.weight ?? 1,
      content,
      lines,
      tokens,
    });
  }

  fileCache = entries;
  return entries;
}

function parseBudget(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function collectSlices(
  entry: FileCacheEntry,
  queryTokens: string[],
  maxSlices: number,
  sliceRadiusLines = 18,
): ContextBlock[] {
  const hits: number[] = [];
  const lowerLines = entry.lines.map((line) => line.toLowerCase());
  const needleSet = new Set(queryTokens);

  for (let i = 0; i < lowerLines.length; i += 1) {
    const lineTokens = tokenize(lowerLines[i]);
    if (lineTokens.some((token) => needleSet.has(token))) {
      hits.push(i);
    }
  }

  if (!hits.length) return [];

  const slices: { start: number; end: number }[] = [];
  for (const idx of hits) {
    const start = Math.max(0, idx - sliceRadiusLines);
    const end = Math.min(entry.lines.length - 1, idx + sliceRadiusLines);

    if (!slices.length) {
      slices.push({ start, end });
      continue;
    }

    const last = slices[slices.length - 1];
    if (start <= last.end + 3) {
      last.end = Math.max(last.end, end);
    } else {
      slices.push({ start, end });
    }
  }

  const chosen = slices.slice(0, maxSlices);
  return chosen.map((slice, idx) => {
    const content = entry.lines.slice(slice.start, slice.end + 1).join("\n");
    const id = `${entry.path}#${slice.start + 1}-${slice.end + 1}-${idx}`;
    return {
      id,
      sourcePath: entry.path,
      tag: entry.tag,
      startLine: slice.start + 1,
      endLine: slice.end + 1,
      content,
    };
  });
}

async function buildAnchorContext(
  anchors: FileCacheEntry[],
  queryTokens: string[],
  charBudget: number,
): Promise<{ blocks: ContextBlock[]; citationHints: AssembledPrompt["citationHints"] }> {
  const scored = anchors
    .map((entry) => ({
      entry,
      score: scoreAnchor(queryTokens, entry.tokens) * entry.weight,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const blocks: ContextBlock[] = [];
  const citationHints: AssembledPrompt["citationHints"] = {};

  for (const { entry } of scored) {
    if (charBudget <= 0) break;

    const maxSlices = entry.tag === "warp" || entry.tag === "casimir" ? 3 : 2;
    const slices = collectSlices(entry, queryTokens, maxSlices);

    for (const block of slices) {
      const length = block.content.length;
      if (length > charBudget) continue;
      charBudget -= length;
      blocks.push(block);
      citationHints[block.id] = {
        sourcePath: block.sourcePath,
        lines: [block.startLine, block.endLine],
        tag: block.tag,
      };
    }
  }

  return { blocks, citationHints };
}

type AuditResult = { blocks: PhysicsAuditBlock[]; meta: { enabled: boolean; reason?: string; mode?: "fallback" | "llm" | "disabled" } };

function seedFrontierFromQuery(queryTokens: string[], anchors: FileCacheEntry[]): string[] {
  const seeds = new Set<string>();
  for (const token of queryTokens) {
    for (const entry of anchors) {
      if (entry.path.toLowerCase().includes(token)) {
        seeds.add(entry.path);
      }
    }
  }
  return Array.from(seeds);
}

function clampText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, Math.max(0, limit - 120)) + "\n...[truncated]...";
}

function safeJsonParse<T = any>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
    if (fenced && fenced[1]) {
      try {
        return JSON.parse(fenced[1]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function collectFrontierSnippets(
  frontier: string[],
  anchors: FileCacheEntry[],
  codeBudget: number,
): { snippets: string[]; remainingCode: number } {
  const chosen = frontier.slice(0, 6);
  let remainingCode = codeBudget;
  const snippets: string[] = [];

  for (const seed of chosen) {
    const entry = anchors.find((a) => a.path === seed);
    if (!entry || remainingCode <= 0) continue;
    const excerpt = entry.lines.slice(0, 40).join("\n");
    const clamped = clampText(excerpt, Math.min(remainingCode, 1200));
    remainingCode -= clamped.length;
    snippets.push(`[[${seed}]]\n${clamped}`);
  }

  return { snippets, remainingCode };
}

function formatFrontierBlock(
  query: string,
  frontier: string[],
  snippets: string[],
  textBudget: number,
): PhysicsAuditBlock {
  const auditTextParts = [
    `Subject query: ${query}`,
    `Seeds (${frontier.length} frontier entries):`,
    ...frontier.map((p) => `- ${p}`),
    "",
    "Code excerpts (non-citable, audit helper only):",
    clampText(snippets.join("\n\n"), textBudget),
    "",
    "Note: This audit summary is deterministic and non-citable; core citations remain tied to anchor slices.",
  ];

  return {
    id: "audit:subject-frontier",
    label: "Subject audit frontier (deterministic)",
    kind: "frontier",
    text: auditTextParts.join("\n"),
    source: "physicsContext.audit",
  };
}

function makeAuditBlocksFromPayload(payload: any, textBudget: number): PhysicsAuditBlock[] {
  const typedPayload =
    payload && typeof payload === "object"
      ? payload
      : { audit: ["Audit output unavailable"], formula: [], env: [], safety: [] };

  const fields: Array<{ key: string; kind: PhysicsAuditBlock["kind"]; label: string }> = [
    { key: "audit", kind: "audit", label: "Subject audit" },
    { key: "formula", kind: "formula", label: "Formula trace" },
    { key: "formulas", kind: "formula", label: "Formula trace" },
    { key: "env", kind: "env", label: "Environment / assumptions" },
    { key: "environment", kind: "env", label: "Environment / assumptions" },
    { key: "safety", kind: "safety", label: "Safety / guardrails" },
    { key: "frontier", kind: "frontier", label: "Frontier exploration" },
  ];

  const blocks: PhysicsAuditBlock[] = [];
  for (const field of fields) {
    if (!(field.key in typedPayload)) continue;
    const raw = (typedPayload as Record<string, unknown>)[field.key];
    const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (let i = 0; i < entries.length; i += 1) {
      const text = clampText(String(entries[i] ?? ""), textBudget);
      if (!text.trim()) continue;
      blocks.push({
        id: `audit:${field.key}:${i}`,
        label: field.label,
        kind: field.kind,
        text,
        source: "physicsContext.audit.llm",
      });
    }
  }
  return blocks;
}

async function runLlmAudit(
  query: string,
  frontier: string[],
  snippets: string[],
  textBudget: number,
): Promise<{ blocks: PhysicsAuditBlock[]; meta: { enabled: boolean; reason?: string; mode: "llm" | "fallback" } }> {
  const llm =
    getTool("llm.http.generate") ??
    getTool("llm.local.generate") ??
    getTool("llm.local.spawn.generate");

  if (!llm) {
    return { blocks: [], meta: { enabled: true, reason: "No LLM tool registered", mode: "fallback" } };
  }

  const maxTokens =
    typeof process.env.PHYSICS_AUDIT_MAX_TOKENS === "string"
      ? Number(process.env.PHYSICS_AUDIT_MAX_TOKENS)
      : undefined;

  const promptSections = [
    "You are the subject auditor for GR/Casimir/warp questions.",
    "Given the subject and the deterministic frontier seeds + excerpts, produce a concise JSON summary with these fields:",
    '- "audit": high-level subject audit bullets (1-3 items)',
    '- "formula": key equations or variables to watch (1-3 items)',
    '- "env": environment/assumptions/units to respect (1-3 items)',
    '- "safety": safety/guardrail checks to enforce (1-3 items)',
    '- "frontier": optional follow-up probes (0-3 items)',
    "Constraints: keep each string under 300 characters; keep total output under the provided budget; DO NOT include citations.",
    "",
    `Subject: ${query}`,
    "",
    "Frontier seeds:",
    ...frontier.map((p) => `- ${p}`),
    "",
    "Code excerpts (non-citable helpers):",
    clampText(snippets.join("\n\n"), textBudget),
    "",
    'Return ONLY JSON. Example: {"audit":["..."],"formula":["..."],"env":["..."],"safety":["..."]}',
  ];

  const messages = [
    { role: "system", content: "You are a precise, terse physics subject auditor. Return JSON only." },
    { role: "user", content: promptSections.join("\n") },
  ];

  try {
    const result = await llm.handler(
      {
        model:
          process.env.PHYSICS_AUDIT_MODEL ??
          process.env.PHYSICS_MODEL ??
          process.env.LLM_HTTP_MODEL ??
          process.env.LLM_LOCAL_MODEL,
        messages,
        prompt: promptSections.join("\n"),
        temperature: 0.2,
        max_tokens: Number.isFinite(maxTokens) ? maxTokens : undefined,
      },
      {},
    );

    const text =
      (result as { text?: string })?.text ??
      (result as { answer?: string })?.answer ??
      (result as { content?: string })?.content ??
      "";

    if (!text) {
      return { blocks: [], meta: { enabled: true, reason: "LLM returned empty text", mode: "fallback" } };
    }

    const payload = safeJsonParse(text);
    if (!payload) {
      return {
        blocks: [
          {
            id: "audit:raw",
            label: "Audit (raw LLM text, unparsed)",
            kind: "audit",
            text: clampText(text, textBudget),
            source: "physicsContext.audit.llm",
          },
        ],
        meta: { enabled: true, mode: "llm", reason: "LLM output returned but JSON parse failed" },
      };
    }

    const blocks = makeAuditBlocksFromPayload(payload, textBudget);
    if (!blocks.length) {
      return { blocks: [], meta: { enabled: true, reason: "LLM output had no usable blocks", mode: "fallback" } };
    }

    return { blocks, meta: { enabled: true, mode: "llm" } };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { blocks: [], meta: { enabled: true, reason: `LLM audit error: ${reason}`, mode: "fallback" } };
  }
}

async function runSubjectAudit(
  query: string,
  queryTokens: string[],
  anchors: FileCacheEntry[],
  textBudget: number,
  codeBudget: number,
): Promise<AuditResult> {
  if (!isAuditEnabled()) {
    return { blocks: [], meta: { enabled: false, reason: "PHYSICS_AUDIT_ENABLE is not true", mode: "disabled" } };
  }

  const frontier = seedFrontierFromQuery(queryTokens, anchors);
  if (!frontier.length) {
    return { blocks: [], meta: { enabled: true, reason: "No frontier seeds derived from query tokens", mode: "fallback" } };
  }

  const { snippets } = collectFrontierSnippets(frontier, anchors, codeBudget);
  const frontierBlock = formatFrontierBlock(query, frontier, snippets, textBudget);

  const llmResult = await runLlmAudit(query, frontier, snippets, textBudget);
  if (llmResult.meta.mode === "llm" && llmResult.blocks.length) {
    return { blocks: [frontierBlock, ...llmResult.blocks], meta: llmResult.meta };
  }

  return {
    blocks: [frontierBlock, ...(llmResult.blocks ?? [])],
    meta: { enabled: true, reason: llmResult.meta.reason, mode: "fallback" },
  };
}

export async function assemblePhysicsContext(query: string): Promise<{
  blocks: ContextBlock[];
  citationHints: AssembledPrompt["citationHints"];
  auditBlocks: PhysicsAuditBlock[];
  auditMeta: { enabled: boolean; reason?: string; mode?: "fallback" | "llm" | "disabled"; cacheKey?: string; cached?: boolean };
}> {
  const anchors = await loadAnchors();
  const queryTokens = tokenize(query).filter((token) => token.length > 2);
  const charBudget = parseBudget(process.env.PHYSICS_CONTEXT_CHAR_BUDGET, DEFAULT_CHAR_BUDGET);

  const { blocks, citationHints } = await buildAnchorContext(anchors, queryTokens, charBudget);

  const auditTextBudget = parseBudget(process.env.PHYSICS_AUDIT_BUDGET, DEFAULT_AUDIT_BUDGET);
  const auditCodeBudget = parseBudget(process.env.PHYSICS_AUDIT_CODE_BUDGET, DEFAULT_AUDIT_CODE_BUDGET);

  const cacheKey = (() => {
    const subjectKey = query.trim().toLowerCase();
    const override = (process.env.PHYSICS_AUDIT_CACHE_KEY ?? "").trim();
    if (override) return `${subjectKey}:${override}`;
    try {
      const hash = execSync("git rev-parse HEAD", { cwd: PROJECT_ROOT, stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
      return `${subjectKey}:${hash}`;
    } catch {
      return `${subjectKey}:unknown`;
    }
  })();

  const cached = auditCache.get(cacheKey);
  if (cached) {
    return {
      blocks,
      citationHints,
      auditBlocks: cached.blocks,
      auditMeta: { ...cached.meta, cacheKey, cached: true },
    };
  }

  const { blocks: auditBlocks, meta: auditMeta } = await runSubjectAudit(
    query,
    queryTokens,
    anchors,
    auditTextBudget,
    auditCodeBudget,
  );

  if (auditMeta.enabled !== false) {
    auditCache.set(cacheKey, { blocks: auditBlocks, meta: { ...auditMeta } });
  }

  return { blocks, citationHints, auditBlocks, auditMeta: { ...auditMeta, cacheKey, cached: false } };
}

export async function buildPhysicsPrompt(query: string): Promise<AssembledPrompt> {
  const { blocks, citationHints, auditBlocks, auditMeta } = await assemblePhysicsContext(query);

  const systemPrompt = [
    "You are a GR/Casimir/warp-bubble copilot grounded to this repository.",
    "You MUST:",
    "- Respect the notation, units, and assumptions in the provided context blocks.",
    "- Prefer formulas and parameters used in this repo (Casimir tiles, Natario/Alcubierre alignment, theta, T^{00}, TS_ratio, gamma_VdB, d_eff).",
    "- When you state a numerical or formulaic claim, reference at least one context block using [block-id] notation.",
    "- If something isn't supported by the context blocks, say so explicitly instead of inventing new physics.",
  ].join("\n");

  const contextText = blocks
    .map(
      (block, idx) =>
        `[[BLOCK ${idx + 1}: ${block.id} (${block.sourcePath}:${block.startLine}-${block.endLine})]]\n${block.content}\n`,
    )
    .join("\n");

  const auditText =
    auditBlocks && auditBlocks.length
      ? auditBlocks
          .map(
            (block, idx) =>
              `[[AUDIT ${idx + 1}: ${block.label}]]\n${block.text}\n(Non-citable; derived audit summary)\n`,
          )
          .join("\n")
      : auditMeta?.enabled === false
      ? `Subject audit: disabled (${auditMeta?.reason ?? "no reason provided"})`
      : `Subject audit: ${auditMeta?.reason ?? "no additional audit context available."}`;

  const userPrompt = [
    "Question:",
    query,
    "",
    "Context blocks (for reference, do not restate verbatim unless needed):",
    contextText,
    "",
    "Subject audit blocks (non-citable helper context):",
    auditText,
    "",
    "When answering:",
    "- Use concise, technical language.",
    "- Stick to the repo's conventions (units, variables, ladder notation).",
    "- Cite blocks using [BLOCK n] or [block-id] where relevant.",
  ].join("\n");

  return {
    systemPrompt,
    userPrompt,
    contextBlocks: blocks,
    auditBlocks,
    auditMeta,
    citationHints,
  };
}
